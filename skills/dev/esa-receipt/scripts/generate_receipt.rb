# frozen_string_literal: true
#
# ESA payment-receipt generator — channel-agnostic (Utah Fits All / Odyssey is the
# reference channel). Reads a per-run JSON config (ALL family PII lives in the config,
# never in this script) and renders a branded HTML receipt, then a PDF via headless
# Chrome when available.
#
# Two modes, selected by the config's "enrich" flag:
#
#   generic  (enrich: false) — no Thoven-side claims; instructor "To be assigned",
#            enrollment panel shows an onboarding-in-progress note. Runs standalone:
#              ruby ~/.agents/skills/esa-receipt/scripts/generate_receipt.rb <config.json>
#
#   enriched (enrich: true) — pulls live prod enrollment data (teacher, class, wallet
#            credits, intro/session slot). Must run under rails runner against prod:
#              DATABASE_URL="$PROD_DATABASE_URL" bundle exec rails runner \
#                ~/.agents/skills/esa-receipt/scripts/generate_receipt.rb <config.json>
#
# NEVER fabricates — any enriched field not found in the DB is left blank ("—"/"TBD")
# and listed in a visible "fields not found" line on the receipt + stdout.

require "base64"
require "erb"
require "date"
require "json"

CONFIG_PATH = ARGV[0] or abort "Usage: generate_receipt.rb <config.json>"
CFG = JSON.parse(File.read(CONFIG_PATH))

ENRICH = !!CFG["enrich"]
if ENRICH && !defined?(Rails)
  abort <<~MSG
    Config has "enrich": true but this is not a Rails process. Run:
      DATABASE_URL="$PROD_DATABASE_URL" bundle exec rails runner #{__FILE__} #{CONFIG_PATH}
  MSG
end

# ---- Fixed vendor facts (not PII; locked values — Plasentia with an "s") ----
VENDOR = { name: "Thoven CORP", website: "thoven.co", billing: "andres@thoven.co",
           support: "thovie@thoven.co", address: "1555 Plasentia Ave, Coral Gables, FL 33134" }.freeze

# ---- Brand tokens (frontend/app/globals.css + FE palette) ----
ORANGE  = "#FF8C1A"
INK     = "#2D2D2D"
SUBINK  = "#5A5A5A"
PANEL   = "#FFF7ED"
PAGE_BG = "#FDFCFB"
BORDER  = "#E5E5E5"

TZ_ABBR = { "America/New_York" => "ET", "America/Los_Angeles" => "PT",
            "America/Chicago" => "CT", "America/Denver" => "MT", "America/Boise" => "MT",
            "America/Phoenix" => "MST" }.freeze

order    = CFG.fetch("order")
esa      = CFG.fetch("esa_holder")
stu_cfg  = CFG.fetch("student")
line     = CFG.fetch("line")
program  = CFG.fetch("program")

# Receipt number: explicit > THV-<numeric order id> > THV-<last 7 of line item ULID>.
RECEIPT_NO =
  CFG["receipt_no"] ||
  (order["order_id"] ? "THV-#{order['order_id']}" : nil) ||
  (order["line_item_id"] ? "THV-#{order['line_item_id'][-7..]}" : nil) or
  abort "No receipt_no derivable: provide receipt_no, order.order_id, or order.line_item_id"

OUT_DIR    = File.expand_path(CFG["out_dir"] || ".scratch/esa-receipts", Dir.pwd)
ISSUE_DATE = CFG["issue_date"] ? Date.parse(CFG["issue_date"]) : Date.today
ORDERED_ON = order["ordered_on"] && Date.parse(order["ordered_on"])
LOGO_PATH  = File.expand_path(CFG["logo_path"] || "~/thoven/frontend/public/ThovenLogo.png")
CHROME     = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def money(cents) = format("$%.2f", cents.to_i / 100.0)
def h(v) = ERB::Util.html_escape(v.to_s)
def fdate(d) = d ? d.strftime("%B %-d, %Y") : nil
def ftime(t, tz)
  return nil unless t
  "#{t.strftime('%-I:%M %p')} #{TZ_ABBR[tz] || tz}"
end

# ---- Enriched prod lookup (Questereit-pattern; read-only) ----
def gather_enrichment(stu_cfg)
  missing = []
  student = Student.where("lower(first_name)=? AND lower(last_name)=?",
                          stu_cfg["first_name"].downcase, stu_cfg["last_name"].downcase)
                   .where(archived_at: nil).first
  raise "Student #{stu_cfg['first_name']} #{stu_cfg['last_name']} not found in prod — use generic mode" unless student

  enrollment = Enrollment.where(student_id: student.id, archived_at: nil).select(&:active?).first
  teacher    = enrollment&.teacher_class&.teacher_profile
  holder     = enrollment&.parent_profile || student.profile
  klass      = enrollment&.teacher_class

  loads    = OdysseyWalletLoad.where(student_id: student.id).to_a
  # Lifetime sum across every load this student has ever had. On a repeat family that is NOT
  # this order's credit count — set "credits_override" in the config to the credits this order
  # funded (e.g. 5 under the ESA bonus-lesson model).
  credits  = CFG["credits_override"] || loads.sum(&:lessons_loaded)
  duration = loads.map(&:duration_minutes).compact.uniq.first || 30

  # The next slot on or after the issue date; on a repeat family the first request's slot is
  # months-old history. Falls back to the earliest slot when nothing is upcoming.
  slots = SimpleBookingSlot.where(simple_booking_request_id: SimpleBookingRequest.where(student_id: student.id).select(:id))
                           .order(:date, :start_time)
  slot  = slots.where("date >= ?", ISSUE_DATE).first || slots.first

  missing << "Thoven account holder"               if holder.nil?
  missing << "assigned teacher"                    if teacher.nil?
  missing << "class title"                         if klass&.title.to_s.strip.empty?
  missing << "loaded lesson credits"               if credits.to_i.zero?
  missing << "scheduled session / intro-call date" if slot.nil?

  {
    missing: missing,
    holder: holder && { name: "#{holder.first_name} #{holder.last_name}".strip, email: holder.email,
                        phone: holder.phone_number, location: [holder.city, holder.state].compact.join(", ") },
    teacher_name: teacher && "#{teacher.first_name} #{teacher.last_name}".strip,
    class_title: klass&.title,
    enrolled_on: enrollment&.enrolled_at&.to_date,
    credits: credits, duration: duration,
    intro: slot && { date: slot.date, start: slot.start_time, tz: slot.timezone,
                     intro: slot.location_url.to_s.include?("intro-call") || slot.duration_minutes.to_i <= 15 }
  }
end

enr = ENRICH ? gather_enrichment(stu_cfg) : nil
student_name = "#{stu_cfg['first_name']} #{stu_cfg['last_name']}".strip
teacher_name = enr&.dig(:teacher_name).to_s.strip
teacher_disp = teacher_name.empty? ? "To be assigned" : teacher_name

logo_b64  = File.exist?(LOGO_PATH) ? Base64.strict_encode64(File.binread(LOGO_PATH)) : nil
logo_html = logo_b64 ? %(<img class="logo" src="data:image/png;base64,#{logo_b64}" alt="Thoven">) \
                     : %(<div class="logo-text">Thoven</div>)

# Second party card: Thoven account holder when enriched + found, else the student.
party2_html =
  if enr && enr[:holder]
    hh = enr[:holder]
    <<~CARD
      <div class="card">
        <div class="role">Thoven Account Holder · Parent</div>
        <div class="name">#{h hh[:name]}</div>
        <div class="row">#{h hh[:email]}</div>
        <div class="row">#{h hh[:phone]}</div>
        <div class="row">#{h hh[:location]}</div>
      </div>
    CARD
  else
    <<~CARD
      <div class="card">
        <div class="role">Student</div>
        <div class="name">#{h student_name}</div>
        <div class="row">Instrument: #{h CFG['instrument']}</div>
        #{stu_cfg['location'] ? %(<div class="row">#{h stu_cfg['location']}</div>) : ''}
      </div>
    CARD
  end

# Enrollment panel: live facts when enriched, honest onboarding note otherwise.
enrich_html =
  if enr
    intro = enr[:intro]
    intro_line =
      if intro
        label = intro[:intro] ? "Intro call" : (intro[:date] >= ISSUE_DATE ? "Next session" : "Session")
        "#{label}: #{fdate(intro[:date])} · #{ftime(intro[:start], intro[:tz])}"
      else
        "No session scheduled yet"
      end
    credits_line = enr[:credits].to_i.positive? ? "#{enr[:credits]} lesson credits (#{enr[:duration]} min each)" : "—"
    <<~PANEL
      <div class="enrich">
        <div class="h">Thoven enrollment</div>
        <div class="g">
          <div><b>Lesson credits loaded:</b> #{h credits_line}</div>
          <div><b>Enrolled:</b> #{h(fdate(enr[:enrolled_on]) || '—')}</div>
          <div><b>#{h intro_line}</b></div>
        </div>
      </div>
    PANEL
  else
    note = CFG["enrollment_note"] || "Enrollment onboarding in progress — the family will select an instructor " \
           "and schedule sessions on the Thoven platform, and lesson credits for this order will be loaded to " \
           "the student's account upon enrollment."
    %(<div class="enrich"><div class="h">Thoven enrollment</div><div class="g single">#{h note}</div></div>)
  end

missing_html =
  if enr && enr[:missing].any?
    %(<div class="missing">Fields not found in Thoven data (left blank): #{h enr[:missing].join('; ')}.</div>)
  else
    ""
  end

order_ref  = order["order_id"] ? "Order&nbsp;#{h order['order_id']}" : "Line item&nbsp;#{h order['line_item_id']}"
foot_ids   = [order["order_id"] && "order #{order['order_id']}",
              order["line_item_id"] && "line item #{order['line_item_id']}",
              order["offer_id"] && "offer #{order['offer_id']}",
              order["sku"] && "SKU #{order['sku']}"].compact.join(", ")
line_sub   = [line["cadence"], order["sku"] && "SKU #{order['sku']}", "Instructor: #{teacher_disp}",
              enr&.dig(:class_title) && "Class: #{enr[:class_title]}"].compact.join(" · ")

html = <<~HTML
  <!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: Letter; margin: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html,body { margin:0; padding:0; }
    body { font-family:'Montserrat',sans-serif; color:#{INK}; background:#{PAGE_BG};
           font-size:12.5px; line-height:1.5; }
    .sheet { width:8.5in; min-height:11in; padding:0.55in 0.75in; margin:0 auto; background:#{PAGE_BG}; }
    h1,h2,h3,.brandfont { font-family:'Fredoka',sans-serif; }
    .top { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #{ORANGE};
           padding-bottom:16px; }
    .logo { width:188px; height:auto; }
    .logo-text { font-family:'Fredoka'; font-size:34px; font-weight:700; color:#{ORANGE}; }
    .vendor-sub { color:#{SUBINK}; font-size:11px; margin-top:6px; }
    .rcpt { text-align:right; }
    .rcpt .tag { font-family:'Fredoka'; letter-spacing:2px; font-size:13px; color:#{SUBINK}; text-transform:uppercase; }
    .rcpt .no { font-family:'Fredoka'; font-size:24px; font-weight:700; color:#{INK}; margin-top:2px; }
    .rcpt .meta { color:#{SUBINK}; font-size:11px; margin-top:4px; }
    .ribbon { background:#{ORANGE}; color:#fff; border-radius:8px; padding:10px 16px; margin:18px 0 22px;
              display:flex; justify-content:space-between; align-items:center; }
    .ribbon .p { font-family:'Fredoka'; font-weight:600; font-size:13px; }
    .ribbon .o { font-size:12px; opacity:.95; }
    .parties { display:flex; gap:14px; margin-bottom:20px; }
    .card { flex:1; border:1px solid #{BORDER}; border-radius:10px; padding:14px 16px; background:#fff; }
    .card .role { font-family:'Fredoka'; font-size:10.5px; letter-spacing:1.2px; text-transform:uppercase;
                  color:#{ORANGE}; font-weight:600; margin-bottom:6px; }
    .card .name { font-weight:700; font-size:14px; }
    .card .row { color:#{SUBINK}; font-size:11.5px; }
    .strip { display:flex; gap:0; border:1px solid #{BORDER}; border-radius:10px; overflow:hidden; margin-bottom:20px; }
    .strip .cell { flex:1; padding:11px 14px; border-right:1px solid #{BORDER}; }
    .strip .cell:last-child { border-right:none; }
    .strip .k { font-size:9.5px; letter-spacing:1px; text-transform:uppercase; color:#{SUBINK}; }
    .strip .v { font-weight:600; font-size:13px; margin-top:2px; }
    table { width:100%; border-collapse:collapse; margin-bottom:6px; }
    thead th { text-align:left; font-family:'Fredoka'; font-size:10.5px; letter-spacing:.8px; text-transform:uppercase;
               color:#{SUBINK}; border-bottom:2px solid #{BORDER}; padding:0 0 8px; }
    thead th.r, td.r { text-align:right; white-space:nowrap; padding-left:24px; }
    tbody td { padding:14px 0; border-bottom:1px solid #{BORDER}; vertical-align:top; }
    .desc .ttl { font-weight:700; font-size:13.5px; }
    .desc .sub { color:#{SUBINK}; font-size:11.5px; margin-top:3px; }
    .totals { width:46%; margin-left:auto; margin-top:10px; }
    .totals .line { display:flex; justify-content:space-between; padding:6px 0; font-size:12.5px; color:#{SUBINK}; }
    .totals .grand { border-top:2px solid #{INK}; margin-top:6px; padding-top:10px; color:#{INK};
                     font-family:'Fredoka'; font-weight:700; font-size:17px; }
    .paid { display:inline-block; background:#{PANEL}; color:#b45309; border:1px solid #f5d6a8;
            border-radius:999px; padding:4px 12px; font-size:11px; font-weight:600; margin-top:8px; }
    .enrich { background:#{PANEL}; border:1px solid #f3ddc0; border-radius:10px; padding:13px 16px; margin:26px 0 0; }
    .enrich .h { font-family:'Fredoka'; font-weight:600; color:#{INK}; font-size:12px; margin-bottom:6px; }
    .enrich .g { display:flex; flex-wrap:wrap; gap:6px 26px; color:#{SUBINK}; font-size:11.5px; }
    .enrich .g.single { display:block; }
    .enrich .g b { color:#{INK}; font-weight:600; }
    .missing { margin-top:14px; color:#b91c1c; font-size:11px; }
    .foot { margin-top:24px; border-top:1px solid #{BORDER}; padding-top:14px; color:#{SUBINK}; font-size:10.5px; }
    .foot .biz { font-family:'Fredoka'; color:#{INK}; font-weight:600; font-size:12px; }
    .foot .note { margin-top:7px; font-style:italic; }
  </style></head><body>
  <div class="sheet">
    <div class="top">
      <div>
        #{logo_html}
        <div class="vendor-sub">#{h VENDOR[:name]} · #{h VENDOR[:website]}</div>
      </div>
      <div class="rcpt">
        <div class="tag">Payment Receipt</div>
        <div class="no">#{h RECEIPT_NO}</div>
        <div class="meta">Issued #{h fdate(ISSUE_DATE)}</div>
        #{ORDERED_ON ? %(<div class="meta">Order date #{h fdate(ORDERED_ON)}</div>) : ''}
      </div>
    </div>

    <div class="ribbon">
      <div class="p">#{h program}</div>
      <div class="o">#{order_ref}</div>
    </div>

    <div class="parties">
      <div class="card">
        <div class="role">ESA Order Holder · Parent</div>
        <div class="name">#{h esa['name']}</div>
        <div class="row">#{h esa['email']}</div>
        <div class="row">#{h esa['phone']}</div>
        <div class="row">#{h esa['address']}</div>
      </div>
      #{party2_html}
    </div>

    <div class="strip">
      <div class="cell"><div class="k">Student</div><div class="v">#{h student_name}</div></div>
      <div class="cell"><div class="k">Instrument</div><div class="v">#{h CFG['instrument']}</div></div>
      <div class="cell"><div class="k">Instructor</div><div class="v">#{h teacher_disp}</div></div>
    </div>

    <table>
      <thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Amount</th></tr></thead>
      <tbody><tr>
        <td class="desc">
          <div class="ttl">#{h line['title']}</div>
          <div class="sub">#{h line_sub}</div>
        </td>
        <td class="r">#{h(line['qty_label'] || '1 month')}</td>
        <td class="r">#{h money(line['amount_cents'])}</td>
      </tr></tbody>
    </table>

    <div class="totals">
      <div class="line"><span>Subtotal</span><span>#{h money(line['amount_cents'])}</span></div>
      <div class="line grand"><span>Total (USD)</span><span>#{h money(line['amount_cents'])}</span></div>
    </div>
    <div style="text-align:right"><span class="paid">#{h CFG.fetch('paid_label')}</span></div>

    #{enrich_html}
    #{missing_html}

    <div class="foot">
      <div class="biz">#{h VENDOR[:name]}</div>
      <div>#{h VENDOR[:address]} · #{h VENDOR[:website]}</div>
      <div>Billing: #{h VENDOR[:billing]} · Support: #{h VENDOR[:support]}</div>
      <div class="note">This receipt documents music lessons purchased through the #{h CFG.fetch('program_short', program)}
      and fulfilled on the Thoven platform. Receipt #{h RECEIPT_NO} corresponds to #{h foot_ids}.</div>
    </div>
  </div></body></html>
HTML

require "fileutils"
FileUtils.mkdir_p(OUT_DIR)
html_path = File.join(OUT_DIR, "#{RECEIPT_NO}.html")
pdf_path  = File.join(OUT_DIR, "#{RECEIPT_NO}.pdf")
File.write(html_path, html)
puts "#{RECEIPT_NO}  ->  #{html_path} (#{(File.size(html_path) / 1024.0).round}KB, logo: #{logo_b64 ? 'embedded' : 'MISSING — wordmark fallback'})"

if enr
  puts "  enriched: teacher=#{teacher_disp} | class=#{enr[:class_title] || '—'} | credits=#{enr[:credits]} | enrolled=#{enr[:enrolled_on] || '—'}"
  puts "  ⚠️ MISSING: #{enr[:missing].join('; ')}" if enr[:missing].any?
end

if File.exist?(CHROME)
  ok = system(CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
              "--virtual-time-budget=10000", "--print-to-pdf=#{pdf_path}", "file://#{html_path}",
              out: File::NULL, err: File::NULL)
  puts ok && File.exist?(pdf_path) ? "PDF -> #{pdf_path} (#{(File.size(pdf_path) / 1024.0).round}KB)" : "⚠️ Chrome PDF step failed — convert #{html_path} manually"
else
  puts "Chrome not found at #{CHROME} — convert #{html_path} to PDF manually"
end
