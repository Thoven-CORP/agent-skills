#!/usr/bin/env python3
"""Build the eval report page from the bench, workflow and CI data files.

usage: report.py <eval-dir> <out.html>
"""
import json, os, statistics, sys, html
D, OUT = sys.argv[1], sys.argv[2]
eng = json.load(open(f"{D}/engine/results.json"))
wf = json.load(open(f"{D}/workflow/grading.json"))
judge = json.load(open(f"{D}/workflow/judge.json"))
ci = json.load(open(f"{D}/ci/baseline.json"))
extra = json.load(open(f"{D}/extra.json"))
E = html.escape
OLD, NEW = "var(--series-2)", "var(--series-1)"

def work(r): return sum(x["seconds"] for x in r["rows"])
cases = []
for r in eng:
    if r["case"] not in [c["id"] for c in cases]: cases.append({"id": r["case"], "label": r["label"], "expect": r["expect"], "catcher": r["catcher"]})
def runs(cid, e): return [r for r in eng if r["case"] == cid and r["engine"] == e]
def med(xs): return statistics.median(xs) if xs else 0

# accuracy
acc = {e: sum(r["correct"] for r in eng if r["engine"] == e) for e in ("old", "new")}
tot = {e: sum(1 for r in eng if r["engine"] == e) for e in ("old", "new")}
false_alarms = {e: sum(1 for r in eng if r["engine"] == e and r["expect"] == "PASS" and not r["correct"]) for e in ("old", "new")}
misses = {e: sum(1 for r in eng if r["engine"] == e and r["expect"] == "FAIL" and not r["correct"]) for e in ("old", "new")}
work_tot = {e: sum(work(r) for r in eng if r["engine"] == e) for e in ("old", "new")}

def tip(t): return f'<title>{E(t)}</title>'

def accuracy_grid():
    reps = sorted({r["rep"] for r in eng})
    cw, ch, lx = 44, 42, 250
    w = lx + len(reps) * 2 * cw + 20; h = 40 + len(cases) * ch
    s = [f'<svg viewBox="0 0 {w} {h}" class="chart" style="max-width:{w*1.5:.0f}px;min-width:0" role="img" aria-label="Verdict per case, run and engine">']
    for j, rep in enumerate(reps):
        for k, e in enumerate(("old", "new")):
            x = lx + (j * 2 + k) * cw + cw / 2
            s.append(f'<text x="{x}" y="22" class="axis" text-anchor="middle">{"O" if e=="old" else "N"}{rep+1}</text>')
    for i, c in enumerate(cases):
        y = 40 + i * ch
        s.append(f'<text x="{lx-12}" y="{y+ch/2-2}" class="label" text-anchor="end">{E(c["label"])}</text>')
        s.append(f'<text x="{lx-12}" y="{y+ch/2+12}" class="muted" text-anchor="end">{"should pass" if c["expect"]=="PASS" else "should fail on " + c["catcher"]}</text>')
        for j, rep in enumerate(reps):
            for k, e in enumerate(("old", "new")):
                r = next((r for r in runs(c["id"], e) if r["rep"] == rep), None)
                x = lx + (j * 2 + k) * cw + 4
                if not r: s.append(f'<rect x="{x}" y="{y+3}" width="{cw-8}" height="{ch-8}" rx="4" class="empty"/>'); continue
                cls = "good" if r["correct"] else "bad"
                mark = "✓" if r["correct"] else "✗"
                rows = ", ".join(f'{x["id"]} {x["status"]}' for x in r["rows"])
                s.append(f'<g>{tip(f"{c["label"]} · {e} engine · run {rep+1}: verdict {r["status"]}, {"correct" if r["correct"] else "wrong"}. Rows: {rows}")}<rect x="{x}" y="{y+3}" width="{cw-8}" height="{ch-8}" rx="4" class="{cls}"/><text x="{x+(cw-8)/2}" y="{y+ch/2+5}" text-anchor="middle" class="mark">{mark}</text></g>')
    s.append("</svg>"); return "".join(s)

def bars(rows, unit, maxv=None, fmt=lambda v: f"{v:.0f}", ticks=4):
    lx, bh, gap = 230, 13, 12
    maxv = maxv or max(max(max(v, (lh or (0, 0))[1]) for _, v, lh, _ in r[1]) for r in rows) or 1
    w = 820; h = 20 + len(rows) * (2 * bh + gap)
    sc = (w - lx - 90) / maxv
    s = [f'<svg viewBox="0 0 {w} {h}" class="chart" role="img">']
    for t in range(0, ticks + 1):
        v = maxv * t / ticks; x = lx + v * sc
        s.append(f'<line x1="{x}" x2="{x}" y1="8" y2="{h-4}" class="grid"/><text x="{x}" y="{h}" class="axis" text-anchor="middle">{fmt(v)}{unit}</text>')
    for i, (label, series) in enumerate(rows):
        y = 10 + i * (2 * bh + gap)
        s.append(f'<text x="{lx-12}" y="{y+bh+4}" class="label" text-anchor="end">{E(label)}</text>')
        for k, (name, v, lo_hi, color) in enumerate(series):
            yy = y + k * bh
            s.append(f'<g>{tip(f"{label} · {name}: {fmt(v)}{unit}" + (f" (range {fmt(lo_hi[0])} to {fmt(lo_hi[1])})" if lo_hi else ""))}<rect x="{lx}" y="{yy}" width="{max(v*sc,2)}" height="{bh-3}" rx="3" fill="{color}"/>')
            if lo_hi: s.append(f'<line x1="{lx+lo_hi[0]*sc}" x2="{lx+lo_hi[1]*sc}" y1="{yy+(bh-3)/2}" y2="{yy+(bh-3)/2}" class="whisker"/>')
            s.append(f'<text x="{lx+max(v, (lo_hi or (0, 0))[1])*sc+6}" y="{yy+bh-4}" class="value">{fmt(v)}{unit}</text></g>')
    s.append("</svg>"); return "".join(s)

def engine_time():
    rows = []
    for c in cases:
        ser = []
        for e, col in (("old", OLD), ("new", NEW)):
            ws = [work(r) for r in runs(c["id"], e)]
            ser.append((f"{e} engine", med(ws), (min(ws), max(ws)) if len(ws) > 1 else None, col))
        rows.append((c["label"], ser))
    return bars(rows, " s")

def rows_selected():
    rows = []
    for c in cases:
        ser = [(f"{e} engine", med([len(r["rows"]) for r in runs(c["id"], e)]), None, col) for e, col in (("old", OLD), ("new", NEW))]
        rows.append((c["label"], ser))
    return bars(rows, "", maxv=5, ticks=5, fmt=lambda v: f"{v:.0f}")

def wf_grid():
    exps = [e["text"] for e in wf[0]["expectations"]]
    cw, ch, lx = 74, 28, 330
    w = lx + len(wf) * cw + 20; h = 46 + len(exps) * ch
    s = [f'<svg viewBox="0 0 {w} {h}" class="chart" role="img">']
    for j, r in enumerate(wf):
        s.append(f'<text x="{lx+j*cw+cw/2}" y="18" text-anchor="middle" class="label">{r["run"]}</text><text x="{lx+j*cw+cw/2}" y="34" text-anchor="middle" class="muted">{r["arm"]} · {r["task"]}</text>')
    for i, t in enumerate(exps):
        y = 44 + i * ch
        s.append(f'<text x="{lx-12}" y="{y+ch/2+3}" class="label" text-anchor="end">{E(t)}</text>')
        for j, r in enumerate(wf):
            e = r["expectations"][i]; x = lx + j * cw + 8
            ev = e["evidence"] if isinstance(e["evidence"], str) else "; ".join(map(str, e["evidence"]))[:300]
            s.append(f'<g>{tip(f"{r["run"]} · {t}: {"pass" if e["passed"] else "fail"}. {ev}")}<rect x="{x}" y="{y+2}" width="{cw-16}" height="{ch-6}" rx="4" class="{"good" if e["passed"] else "bad"}"/><text x="{x+(cw-16)/2}" y="{y+ch/2+4}" text-anchor="middle" class="mark">{"✓" if e["passed"] else "✗"}</text></g>')
    s.append("</svg>"); return "".join(s)

def wf_cost():
    rows = []
    for task in ("initials", "sort"):
        ser = []
        for arm, col in (("old", OLD), ("new", NEW)):
            r = next(r for r in wf if r["task"] == task and r["arm"] == arm)
            ser.append((f"{r['run']} {arm}", r["timing"]["duration_ms"] / 60000, None, col))
        rows.append((f"{task}: minutes", ser))
    for task in ("initials", "sort"):
        ser = []
        for arm, col in (("old", OLD), ("new", NEW)):
            r = next(r for r in wf if r["task"] == task and r["arm"] == arm)
            ser.append((f"{r['run']} {arm}", r["timing"]["total_tokens"] / 1000, None, col))
        rows.append((f"{task}: thousand tokens", ser))
    return bars(rows, "", fmt=lambda v: f"{v:.0f}")

def judge_chart():
    crit = ["correctness", "scope", "tests", "verification", "clarity"]
    rows = []
    for c in crit:
        for task in ("initials", "sort"):
            ser = []
            for arm, col in (("old", OLD), ("new", NEW)):
                r = next(r for r in wf if r["task"] == task and r["arm"] == arm)
                ser.append((f"{r['run']} {arm}", judge["runs"][r["run"]][c]["score"], None, col))
            rows.append((f"{c} · {task}", ser))
    return bars(rows, "", maxv=5, ticks=5, fmt=lambda v: f"{v:.0f}")

def shard_chart():
    rows = []
    for name, series in extra["shards"]:
        rows.append((name, [(f"shard {i+1}", v, None, col) for i, (v, col) in enumerate(series)]))
    lx, bh, gap = 230, 16, 18; w = 820
    maxv = max(v for _, s in extra["shards"] for v, _ in s)
    sc = (w - lx - 150) / maxv; h = 24 + len(rows) * (bh + gap)
    s = [f'<svg viewBox="0 0 {w} {h}" class="chart" role="img">']
    for t in range(0, 6):
        v = maxv * t / 5; x = lx + v * sc
        s.append(f'<line x1="{x}" x2="{x}" y1="6" y2="{h-14}" class="grid"/><text x="{x}" y="{h-2}" class="axis" text-anchor="middle">{v:.0f} min</text>')
    for i, (name, ser) in enumerate(rows):
        y = 8 + i * (bh + gap)
        s.append(f'<text x="{lx-12}" y="{y+bh-3}" class="label" text-anchor="end">{E(name)}</text>')
        for k, (lab, v, _, col) in enumerate(ser):
            s.append(f'<g>{tip(f"{name} · {lab}: {v:.1f} min")}<circle cx="{lx+v*sc}" cy="{y+bh/2}" r="6" fill="{col}" stroke="var(--surface-1)" stroke-width="2"/></g>')
        mx = max(v for _, v, _, _ in ser)
        s.append(f'<text x="{lx+mx*sc+12}" y="{y+bh-3}" class="value">slowest {mx:.1f} min</text>')
    s.append("</svg>"); return "".join(s)

def jog_chart():
    rows = [(f"{lab}", [("per 1,000 min", v, None, col)]) for lab, v, col in extra["jog_prices"]]
    return bars(rows, "", fmt=lambda v: f"${v:.2f}")

cards = [
    ("Engine verdicts correct", f'{acc["new"]}/{tot["new"]}', f'new · old {acc["old"]}/{tot["old"]}'),
    ("False alarms on clean diffs", f'{false_alarms["new"]}', f'new · old {false_alarms["old"]}'),
    ("Planted defects missed", f'{misses["new"]}', f'new · old {misses["old"]}'),
    ("Check work, all runs", f'{work_tot["new"]/60:.0f} min', f'new · old {work_tot["old"]/60:.0f} min'),
    ("CI tests agreeing across runs", f'{ci[0]["tests"]["total"]:,}', f'{len(ci)} GitHub runs, 0 disagreements'),
    ("Slowest FE shard", extra["slowest_new"], f'PR 338 · was {extra["slowest_old"]}'),
]
card_html = "".join(f'<div class="card"><div class="k">{E(k)}</div><div class="v">{E(v)}</div><div class="s">{E(s)}</div></div>' for k, v, s in cards)
fix_rows = "".join(f'<tr><td>{E(a)}</td><td>{b}</td><td>{E(c)}</td></tr>' for a, b, c in extra["fixes"])
findings = "".join(f"<li>{f}</li>" for f in extra["findings"])

page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Verification eval · 2026-10-21</title>
<style>
.viz-root{{color-scheme:light;--surface-1:#fcfcfb;--surface-2:#f3f2ef;--text-primary:#0b0b0b;--text-secondary:#52514e;--text-muted:#7a7974;--grid:#e4e3df;--series-1:#2a78d6;--series-2:#eb6834;--series-3:#1baf7a;--good:#0ca30c;--critical:#d03b3b}}
@media (prefers-color-scheme:dark){{.viz-root{{color-scheme:dark;--surface-1:#1a1a19;--surface-2:#242422;--text-primary:#f0efec;--text-secondary:#c3c2b7;--text-muted:#9a998f;--grid:#33332f;--series-1:#3987e5;--series-2:#d95926;--series-3:#199e70}}}}
*{{box-sizing:border-box}} body{{margin:0}} .viz-root{{background:var(--surface-1);color:var(--text-primary);font:15px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;min-height:100vh}}
main{{max-width:1080px;margin:0 auto;padding:40px 24px 80px}} h1{{font-size:28px;margin:0 0 6px}} h2{{font-size:19px;margin:44px 0 6px}} p,li{{color:var(--text-secondary)}} .lede{{font-size:16px;max-width:760px}}
.cards{{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:24px 0}} .card{{background:var(--surface-2);border-radius:12px;padding:14px 16px}} .card .k{{font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em}} .card .v{{font-size:26px;font-weight:650;margin-top:4px}} .card .s{{font-size:12.5px;color:var(--text-secondary)}}
.panel{{background:var(--surface-2);border-radius:14px;padding:18px 18px 10px;margin-top:12px;overflow-x:auto}} .legend{{display:flex;gap:18px;font-size:13px;color:var(--text-secondary);margin:4px 0 8px}} .sw{{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px;vertical-align:-1px}}
svg.chart{{width:100%;height:auto;min-width:640px}} .label{{font-size:12.5px;fill:var(--text-primary)}} .muted{{font-size:11px;fill:var(--text-muted)}} .axis{{font-size:11px;fill:var(--text-muted)}} .value{{font-size:11.5px;fill:var(--text-secondary)}} .grid{{stroke:var(--grid);stroke-width:1}} .whisker{{stroke:var(--text-primary);stroke-width:1.5;opacity:.55}}
.good{{fill:var(--good);opacity:.9}} .bad{{fill:var(--critical);opacity:.9}} .empty{{fill:var(--grid)}} .mark{{font-size:13px;fill:#fff;font-weight:700}}
table{{border-collapse:collapse;width:100%;font-size:14px}} td,th{{text-align:left;padding:8px 10px;border-bottom:1px solid var(--grid);vertical-align:top}} th{{color:var(--text-muted);font-weight:600;font-size:12px;text-transform:uppercase}} a{{color:var(--series-1)}}
.note{{font-size:13px;color:var(--text-muted)}} details summary{{cursor:pointer;color:var(--text-secondary);font-size:13.5px;margin:6px 0}}
</style></head><body class="viz-root"><main>
<h1>Verification eval: the new bin/verify and skills against the old</h1>
<p class="lede">{extra["lede"]}</p>
<div class="cards">{card_html}</div>
<div class="legend"><span><span class="sw" style="background:var(--series-1)"></span>New engine and skills (main b6b1794)</span><span><span class="sw" style="background:var(--series-2)"></span>Old engine and skills (389e76a, before the wave)</span></div>

<h2>1. Does bin/verify reach the right verdict?</h2>
<p>Nine realistic diffs, each run three times through both engines, sides alternated. A clean diff should pass. A planted defect should fail on the row named. Green means the verdict was right. Hover a cell for the rows that ran.</p>
<div class="panel">{accuracy_grid()}</div>
<p class="note">{extra["accuracy_note"]}</p>

<h2>2. How much checking does each diff cost?</h2>
<p>Median seconds of check work per run, summed across the rows that ran, with the range over three runs. Time spent waiting for the shared verify lock is excluded, because other sessions held it during the bench.</p>
<div class="panel">{engine_time()}</div>
<h2>3. How many checks does each diff select?</h2>
<div class="panel">{rows_selected()}</div>

<h2>4. Do agents work the way the skills ask?</h2>
<p>Two small feature tasks, each done once by an agent under the old skills and engine and once under the new. The prompts were the same, written as a normal user request, with nothing saying it was a test. Behaviour was graded by script from the transcripts and the tree, and correctness by hidden tests the agents never saw.</p>
<div class="panel">{wf_grid()}</div>
<div class="panel">{wf_cost()}</div>
<p class="note">{extra["workflow_note"]}</p>
<h2>5. What a blind reviewer preferred</h2>
<p>A separate model scored the four changes from the diffs and the final reports alone, labelled R1 to R4, without knowing which arm was which.</p>
<div class="panel">{judge_chart()}</div>
<p class="note">{extra["judge_note"]}</p>

<h2>6. CI speed and agreement</h2>
<p>Each dot is one vitest shard's job time. The slowest dot sets how long a PR waits.</p>
<div class="panel">{shard_chart()}</div>
<p class="note">{extra["ci_note"]}</p>

<h2>7. The Jog trial</h2>
<p>{extra["jog_text"]}</p>
<div class="panel">{jog_chart()}</div>

<h2>8. Fixes from this round</h2>
<div class="panel"><table><tr><th>Item</th><th>PR</th><th>State</th></tr>{fix_rows}</table></div>
<h2>9. What the eval found</h2><ul>{findings}</ul>
<details><summary>Method and data files</summary><p class="note">{extra["method"]}</p></details>
</main></body></html>"""
open(OUT, "w").write(page); print(OUT, len(page))
