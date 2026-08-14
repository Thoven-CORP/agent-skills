---
name: thoven-email-system
description: Use when creating, modifying, or debugging email templates and mailer methods. Triggers on new mailer work, email formatting issues, SendGrid category questions, or email rendering problems.
---

# Email Development

## Overview

Reference guide for Thoven's email standards. All emails must follow these patterns for SendGrid categories, HTML/text templates, mailer methods, and brand consistency.

## SendGrid Categories

| Category | Trigger | Examples |
|----------|---------|----------|
| `transactional` | User action triggered it | booking_approved, payment_received, reset_password |
| `nurture` | Automated sequence or celebration | onboarding_day1-14, parent_welcome, milestone |
| `promotional` | Broadcast/announcement | service_status, product_feedback |

**Decision:** User action? `transactional`. Automated sequence? `nurture`. Broadcast? `promotional`.

## SendGrid Click Tracking (CRITICAL - DO NOT REMOVE)

**Click tracking is DISABLED globally** via `set_sendgrid_category()` in `ApplicationMailer`. This is **intentional** and must NOT be reverted.

**Why:** SendGrid rewrites all email links through a tracking proxy domain (`url*.thoven.co`). That domain has an invalid SSL certificate, causing `ERR_CERT_COMMON_NAME_INVALID` errors for every CTA link in every email. Disabling click tracking at the code level ensures links are delivered as-is.

**Rules:**
- ALWAYS use `set_sendgrid_category(category)` — it handles both the category AND disabling click tracking
- NEVER set the `X-SMTPAPI` header manually (the helper does it correctly)
- NEVER re-enable click tracking (`enable: 1`) unless SendGrid Link Branding SSL is fixed first
- If SendGrid Link Branding is fixed in the future, the filter can be removed from `ApplicationMailer#set_sendgrid_category`

```ruby
# ApplicationMailer#set_sendgrid_category sets this automatically:
headers["X-SMTPAPI"] = {
  category: [category],
  filters: { clicktrack: { settings: { enable: 0 } } }
}.to_json
```

## Company Address (CRITICAL - Use Correct Address)

**ALL email footers MUST use this address:**

```
Thoven Corp.
1555 Plasentia Ave
Coral Gables, FL 33134
```

**DO NOT USE the old address** (Thoven Music Inc. / 340 S Lemon Ave / Walnut, CA) — that entity no longer exists.

**Copyright line:** `(c) <%= Date.current.year %> Thoven Corp. All rights reserved.`

## Email Addresses (CRITICAL — Use Correct Address)

**The ONLY valid email for Thoven:**

| Purpose | Address |
|---------|---------|
| **From** | `Thovie from Thoven <thovie@thoven.co>` or `Thoven <thovie@thoven.co>` |
| **Reply-To** | `thovie@thoven.co` |
| **Support links in footers** | `thovie@thoven.co` |

**DO NOT USE `hello@thoven.co`** — this address does not exist. It was used by mistake in early mailers and caused bounced replies. See CLAUDE.md Bug 10.

When creating ANY new mailer:
```ruby
class NewMailer < ApplicationMailer
  default from: "Thovie from Thoven <thovie@thoven.co>",
          reply_to: "thovie@thoven.co"
```

When adding support links in templates:
```html
<!-- HTML -->
<a href="mailto:thovie@thoven.co">Support</a>
```
```text
<!-- Text -->
Support: thovie@thoven.co
```

## Mailer Method Standards

```ruby
def booking_approved(booking_request_id)
  # 1. Eager load associations
  @booking_request = SimpleBookingRequest
    .includes(:parent, :teacher, :student, simple_booking_slots: [])
    .find(booking_request_id)

  # 2. Safe navigation for optional data
  @original_date = @reschedule_request.original_date&.strftime("%A, %B %d, %Y")
  @instruments = @student.instruments_of_interest&.join(", ") || "Not specified"

  # 3. Reuse model helpers over inline formatting — in the RECIPIENT's zone
  @class_title = @enrollment.class_title
  recipient_timezone = @parent_profile.timezone_or_inferred
  @time_range = @slot.formatted_time_range_in_timezone(recipient_timezone)

  # 4. Production URL fallback (NEVER localhost)
  @dashboard_url = "#{ENV.fetch('FRONTEND_URL', 'https://thoven.co')}/parent/dashboard"

  # 5. SendGrid category LAST before mail()
  set_sendgrid_category('transactional')
  mail(to: @profile.email, subject: "Subject with emoji")
end
```

**Parameter patterns:**
- Direct ID: `def booking_approved(booking_request_id)` then `find(id)`
- With params: `def onboarding_day1` then `Profile.find(params[:profile_id])`

## Color Palette

| Purpose | Hex |
|---------|-----|
| Primary orange | `#ff8c1a` |
| Primary dark | `#b45309` |
| Accent bg (info box) | `#fffbeb` |
| Accent border | `#fef3c7` |
| Text dark | `#1f2937` |
| Text medium | `#4b5563` |
| Text light | `#9ca3af` |
| Footer bg | `#fafafa` |
| Border | `#e5e7eb` |
| Body bg | `#f9fafb` |

## HTML Template

**See:** `templates/html_skeleton.erb` for full boilerplate.

**Required structure (in order):**
1. DOCTYPE + Outlook namespace declarations
2. Meta tags (charset, viewport, color-scheme, MSO)
3. Google Fonts import (Fredoka + Montserrat)
4. CSS reset for email clients + dark mode prevention
5. Mobile media queries (480px breakpoint)
6. Preheader text (hidden preview)
7. Full-width wrapper table (`#f9fafb` background)
8. 600px centered container with MSO conditionals
9. Header with Thoven logo (`https://thoven.co/ThovenLogo.png`)
10. Main content area
11. Footer with branding ("Learn. Teach. Play. All in one place.")

**Fonts:** Fredoka for headings (`h1, h2, h3, .fredoka`), Montserrat for body text.

## Text Template

**See:** `templates/text_skeleton.erb`

**Rules:**
- Section headers: ALL CAPS + `======` underline
- Bullets: `- ` prefix (dash + space)
- No HTML tags ever
- URLs as plain text
- Separators: `---`
- Pluralization: `credit<%= @count == 1 ? '' : 's' %>`

## Components

**See:** `templates/components.md` for copy-paste HTML snippets.

Available components: Info Box, Primary CTA Button (with Outlook VML), Secondary Button, Bullet List, Slot Iteration Block, Urgency Callout.

## Subject Line Emojis

| Emoji | Use |
|-------|-----|
| Celebratory (approved, enrolled) | Use in subject line |
| Notes/content | Use in subject line |
| Calendar/scheduling | Use in subject line |
| Payment requests | Use in subject line |
| Music/booking | Use in subject line |
| Money received | Use in subject line |

## Testing Checklist

### RSpec (required)

```ruby
RSpec.describe ParentMailer, type: :mailer do
  describe '#method_name' do
    let(:mail) { described_class.method_name(resource_id) }

    it 'renders the headers' do
      expect(mail.subject).to include('expected text')
      expect(mail.to).to eq(['recipient@example.com'])
    end

    it 'sets SendGrid category and disables click tracking' do
      smtpapi = JSON.parse(mail.header['X-SMTPAPI'].value)
      expect(smtpapi['category']).to eq(['transactional'])
      expect(smtpapi.dig('filters', 'clicktrack', 'settings', 'enable')).to eq(0)
    end

    context 'HTML part' do
      let(:html_part) { mail.parts.find { |p| p.content_type.match?(/html/) } || mail }
      it('includes branding') { expect(html_part.body.encoded).to match('Learn. Teach. Play.') }
    end

    context 'text part' do
      let(:text_part) { mail.parts.find { |p| p.content_type.match?(/plain/) } || mail }
      it('has section headers') { expect(text_part.body.encoded).to match(/^[A-Z ]+\n=+/) }
    end
  end
end
```

### Manual Verification (required)

```ruby
# In rails console - send test email
ParentMailer.booking_approved(BookingRequest.last.id).deliver_now
# OR for param-based:
TeacherMailer.with(profile_id: Profile.last.id).onboarding_day1.deliver_now
```

Verify: desktop rendering, mobile rendering, images load, links work, text version readable.

## Debugging Workflow

1. **Mailer method** - Eager loading? Safe navigation? URL fallback (no localhost)? SendGrid category set?
2. **HTML template** - Follows skeleton? MSO conditionals? Mobile classes? Correct hex codes?
3. **Text template** - Matches HTML content? CAPS headers? No HTML tags?
4. **Send test** - Render in actual email client

## Common Instance Variables

- `@parent_profile`, `@teacher_profile` - Profile records
- `@student` - Student record
- `@dashboard_url` - Link to user's dashboard
- `@slots` / `@approved_slots` / `@requested_slots` - Array of slot hashes

**Slot hash structure.** Resolve the recipient's zone first — the hash below gets copied
wholesale into new mailers, so it has to carry its own correctness:

```ruby
recipient_timezone = @parent_profile.timezone_or_inferred   # or @teacher_profile, whoever receives it

{ date: slot.date.strftime("%A, %B %d, %Y"),
  time: slot.formatted_time_range_in_timezone(recipient_timezone),
  duration: slot.duration_minutes }
```

> **Never `formatted_time_range_with_timezone` in a mailer.** It resolves to the SLOT's zone and
> falls back to the TEACHER's (`simple_booking_slot.rb:356`), so a Pacific parent reads their
> teacher's Eastern clock as if it were their own. This doc taught the wrong helper in two places
> and Bug 13 recurred twice off the back of it (TD-118, D-1 in the 2026-08-08 QA run). The live
> mailers had already diverged from this doc to do it correctly — `parent_mailer.rb:51`,
> `teacher_mailer.rb:44`.

## Key Files

- `app/mailers/application_mailer.rb` - Base class with `set_sendgrid_category`
- `app/mailers/parent_mailer.rb` - Parent email examples
- `app/mailers/teacher_mailer.rb` - Teacher email examples
- `app/helpers/mailer_helper.rb` - Shared helper methods
- `app/views/parent_mailer/` - HTML/text template examples
- `spec/mailers/` - Test patterns
