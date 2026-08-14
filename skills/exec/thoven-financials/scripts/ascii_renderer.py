"""Render the live CFO check-in as a monospace KPI dashboard for chat.

Sibling to report_writer.py (which renders the agent's markdown). Same data,
different skin. This one targets a terminal/chat surface: fixed-width box-drawing
art, KPI cards, dot-leader line items.

ALIGNMENT CONTRACT: we never emit the emoji variation selector U+FE0F. The only
non-ASCII glyphs are box-drawing chars, the middle dot (·, U+00B7), and a bare
warning sign (⚠, U+26A0) — all treated as one display column. `_dw()` is the
single source for display width so padding math stays correct.
"""

from datetime import date

WARN = "⚠"          # bare warning sign, 1 column (never followed by U+FE0F)
DOT = "·"           # middle dot leader
BODY_W = 50              # inner width of body lines (dot-leader region)
BAR_W = 54               # width of the top/bottom rules
CARD_W = 14              # total width of each KPI card (incl. borders)
RUNWAY_ALERT_MONTHS = 2.0


def _dw(s: str) -> int:
    """Display width: codepoint count, minus any stray emoji variation selectors."""
    return len(s.replace("️", ""))


def _money(x: float, cents: bool = True) -> str:
    return f"${x:,.2f}" if cents else f"${x:,.0f}"


def _center(s: str, width: int) -> str:
    pad = width - _dw(s)
    if pad <= 0:
        return s
    left = pad // 2
    return " " * left + s + " " * (pad - left)


def _card(label: str, value: str) -> list[str]:
    """Return the 3 lines of one KPI card, each exactly CARD_W wide."""
    inner = CARD_W - 2
    head = f" {label} "
    top = "┌" + head + "─" * (inner - _dw(head)) + "┐"
    mid = "│" + _center(value, inner) + "│"
    bot = "└" + "─" * inner + "┘"
    return [top, mid, bot]


def _cards_row(cards: list[list[str]]) -> list[str]:
    """Join several 3-line cards side by side with a single-space gutter."""
    return [" ".join(c[i] for c in cards) for i in range(3)]


def _leader_line(left: str, right: str, indent: str = "  ") -> str:
    """`  left ·········· right` filling BODY_W with dot leaders."""
    fill = BODY_W - _dw(left) - _dw(right)
    if fill < 1:
        fill = 1
    return f"{indent}{left} {DOT * (fill - 1)} {right}"


def _rule(text: str = "", ch: str = "═") -> str:
    if not text:
        return ch * BAR_W
    label = f" {text} "
    fill = BAR_W - _dw(label)
    left = 3
    return ch * left + label + ch * (fill - left)


def render(analysis: dict, recon: dict) -> str:
    """Render the full live check-in dashboard. Pure function -> str."""
    lines: list[str] = []
    today = analysis["week_window"][1]

    # --- Title ---
    lines.append(_rule(f"THOVEN CFO {DOT} {today.strftime('%a %b %-d, %Y')}"))
    lines.append("")

    # --- KPI cards ---
    runway = analysis["runway_months"]
    runway_val = "inf" if runway >= 999 else f"{runway:.1f} mo"
    if runway < RUNWAY_ALERT_MONTHS:
        runway_val += f" {WARN}"
    cash_card = _card("CASH", _money(analysis["cash_on_hand"]))
    burn_card = _card("BURN / wk", _money(analysis["week_burn"], cents=False))
    rw_card = _card("RUNWAY", runway_val)
    lines.extend(_cards_row([cash_card, burn_card, rw_card]))
    lines.append(
        f"   Checking {_money(analysis['checking'])} {DOT} "
        f"Savings {_money(analysis['savings'])}"
    )
    lines.append("")

    # --- This week ---
    ws, we = analysis["week_window"]
    txns = analysis["week_txns"]
    span = f"{ws.strftime('%b %-d')}–{we.strftime('%-d')}"
    lines.append(
        f" THIS WEEK {DOT} {span} {DOT} {len(txns)} charges {DOT} "
        f"−{_money(analysis['week_burn'])}"
    )
    if txns:
        # Roll up same-vendor-same-day charges (e.g. 4 Anthropic usage hits on 5/16).
        # Header keeps the raw charge count; rows show the aggregated view.
        agg: dict[tuple, dict] = {}
        for t in txns:
            key = (t["date"], t["description"])
            if key in agg:
                agg[key]["amount"] += t["amount"]
                agg[key]["count"] += 1
            else:
                agg[key] = {"date": t["date"], "description": t["description"],
                            "amount": t["amount"], "count": 1}
        for row in agg.values():
            d = row["date"][5:].replace("-", "/")  # MM/DD
            name = row["description"] + (f" ×{row['count']}" if row["count"] > 1 else "")
            lines.append(_leader_line(f"{d}  {name}", _money(row["amount"])))
    else:
        lines.append(f"  (no charges in the last 7 days)")
    lines.append("")

    # --- Budget vs cap (true MTD), overages floated to top ---
    lines.append(" BUDGET vs CAP (month-to-date spend vs monthly cap)")
    rows = sorted(
        [v for v in analysis["vendor_table"] if v["mtd"] > 0],
        key=lambda v: -v["pct"],
    )
    if rows:
        for v in rows:
            over = v["pct"] > 100
            mark = f"{WARN} " if over else "  "
            left = f"{mark}{v['vendor']}"
            tail = f"{_money(v['mtd'], cents=False)}/{_money(v['cap'], cents=False)}"
            status = f"{v['pct']:.0f}%" + ("  OVER" if over else "")
            lines.append(_leader_line(f"{left}  {tail}", status))
    else:
        lines.append(f"  (no spend recorded this month)")
    lines.append("")

    # --- Anomalies (only if present) ---
    anomalies = analysis.get("anomalies", [])
    if anomalies:
        lines.append(" ANOMALIES")
        for a in anomalies[:5]:
            if a["type"] == "unknown_vendor":
                lines.append(f"  {WARN} new vendor: {a['description']} ({_money(a['amount'], cents=False)})")
            elif a["type"] == "spike":
                lines.append(f"  {WARN} spike: {a['vendor']} {_money(a['amount'], cents=False)} ({a['amount']/a['baseline']:.1f}x typical)")
            elif a["type"] == "first_paid_charge":
                lines.append(f"  {WARN} first paid charge: {a['vendor']} {_money(a['amount'])}")
        lines.append("")

    # --- Agent reconciliation ---
    lines.append(" AGENT RECONCILIATION")
    lines.extend(_render_recon(recon))
    lines.append("")

    # --- Footer ---
    lines.append(_rule())
    lines.append(f" Source: Mercury CLI (live) {DOT} caps: {analysis['budget_doc_name']}")
    return "\n".join(lines)


def _render_recon(recon: dict) -> list[str]:
    out = []
    if recon.get("agent_last_run") is None:
        out.append(f"  {WARN} no prior 7am report found — nothing to reconcile")
        return out

    last = recon["agent_last_run"]
    days = recon["days_since"]
    age = "today" if days == 0 else f"{days} day{'s' if days != 1 else ''} ago"
    stale = f"  {WARN} stale" if recon["stale"] else ""
    out.append(_leader_line("Last 7am run", f"{last.strftime('%b %-d')} ({age}){stale}"))

    sa = recon["since_agent"]
    if sa["count"]:
        vendors = ", ".join(sa["vendors"][:4])
        out.append(_leader_line(f"{WARN} Since agent", f"{sa['count']} chg, {_money(sa['sum'])} ({vendors})"))
    else:
        out.append(_leader_line("Since agent", "no new charges"))

    if recon.get("cash_drift") is not None:
        out.append(_leader_line(
            "Cash drift",
            f"{_money(recon['agent_cash'])} → {_money(recon['live_cash'])}",
        ))

    if recon.get("new_overages"):
        # Honest label: these are over monthly cap on an MTD basis but absent from
        # the agent's last report — usually because the agent's window was narrower,
        # NOT necessarily because it missed them. Don't imply agent fault.
        out.append(_leader_line(f"{WARN} MTD-only o/cap", ", ".join(recon["new_overages"])))
    elif recon.get("agent_overage_vendors"):
        out.append(_leader_line("Overages", f"agent caught {', '.join(recon['agent_overage_vendors'])}"))
    return out


def render_error(title: str, message: str) -> str:
    """Fail-loud error box. Never show numbers when the live pull failed."""
    lines = [
        _rule(f"THOVEN CFO {DOT} {title}"),
        "",
        f"  {WARN}  {message}",
        "",
        "  Numbers are NOT shown — the live Mercury pull failed.",
        "  This is intentional: a stale number in a clean box is worse",
        "  than no number. Fix the cause above and re-run the check-in.",
        "",
        _rule(),
    ]
    return "\n".join(lines)
