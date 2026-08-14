---
name: class-activity
description: Generate the per-class activity report for a named teacher roster — what actually happened in each class over the last two weeks. Use when Andres asks what's going on in his key classes, which classes had lessons, who got homework and who turned it in, whether session notes are being written, whether materials are being added, which classes have gone quiet, or how a specific teacher's classes are doing. Runs scripts/class_activity_report.rb read-only against production and publishes an interactive artifact. Not for platform-wide trends or funnels (that's admin Feature Analytics), and not for the Monday call sheet of who to phone (that's weekly-ops).
---

# Class Activity Report

Per-class, not per-platform. One question: **what actually happened in these
classes over the last two weeks?**

Default roster is Noah Gunns, Garrett Atkinson, and Marcus Gonzalez. Any name
can be passed instead.

## Why this exists

The Learning + Teacher Operations admin panel can't answer this, and not just
because of the layout. `teacher_classes.total_sessions_count`,
`.total_homework_count` and `.last_activity_at` have **no writer anywhere in the
codebase** — no counter_cache, no touch callback, only reads.
`analytics.class_stats` is built on those same three columns, so its
`health_status` ("active" vs "stale") is derived from data nobody updates.

`Analytics::ClassActivityQuery` reads the child tables instead. If you ever need
a number this report doesn't have, derive it the same way — never read those
three columns, and never "fix" a number by reaching for the matview.

## Running it

```bash
set -a && source .env && set +a && DATABASE_URL="$PROD_DATABASE_URL" \
  bundle exec rails runner scripts/class_activity_report.rb --days 14 \
  --output docs/analytics/product-team/CLASS_ACTIVITY_$(date +%F).json
```

Read-only against production. Never write, never `REFRESH MATERIALIZED VIEW`.
The development Rails boot against the prod URL is deliberate — it avoids the
`SECRET_KEY_BASE` production-boot requirement. See
`.claude/skills/safe-migrate/references/prod-inspection.md`.

Flags: `--teachers "Name One,Name Two"` · `--days N` · `--format md` for a
markdown flavour when the answer belongs in a message rather than a page.

If the script fails, say so. Do not reconstruct its output by hand.

## Then publish the artifact

Build a self-contained page from the JSON payload into the scratchpad and
publish with the `Artifact` tool. Every week goes to the **same URL** — pass the
prior artifact's `url` (find it with `Artifact action: "list"` if you don't have
it), and keep the favicon stable. Andres finds his tab by its icon.

The page is for browsing. The chat reply is for acting.

## Lead with the class, not the link

Andres reads the first two lines and acts. The artifact URL goes at the **end**.

**Good:**

> **Garrett's Tuesday Guitar class has had no homework for two weeks** — three
> lessons delivered, all attended, zero assigned. That's the one to ask about.
>
> Marcus logged notes on all six of his lessons, up from two last run. Noah's
> Beginner Piano went silent: nothing since Jul 24, and one submission has been
> sitting in his review queue for nine days.
>
> Everything else looks normal. Full breakdown: <artifact link>

**Bad** — same facts, buried:

> I've published the class activity report to <link>. It covers 14 days across
> 12 classes for three teachers. One caveat about the window before the
> findings…
>
> **Garrett's Tuesday Guitar class has had no homework for two weeks.**

If a fortnight is genuinely quiet, say so in one line. That makes the weeks you
do flag more credible.

## What to look for

Roughly by weight:

- **A class that went from active to silent.** The single most useful signal
  here, and the one the admin panel structurally cannot show.
- **Lessons delivered but no homework, or no session notes.** Teaching happened;
  the follow-through didn't.
- **A submission stuck in `pending_teacher_review`.** A student did the work and
  is waiting. Report the age, not just the count — nine days is a different
  problem from one day.
- **`no_show` attendance**, and slots left `unmarked` long after the lesson.
- **Unclassed bookings.** Real lessons whose booking request has no `class_id`.
  A handful is normal; a spike means something is creating bookings off-flow.
- **An unresolved roster name.** Always call this out. A typo produces an empty
  section that reads exactly like a teacher who had a quiet fortnight.

Skip what didn't change.

## Comparing to last run

```bash
ls -1 docs/analytics/product-team/CLASS_ACTIVITY_*.json | tail -3
```

The payloads diff cleanly — that's the main reason the script emits JSON rather
than markdown. Compare `total_events` and `last_activity_at` per class to find
what went quiet. Do both halves of a "since last time" question: production for
what's true now, the prior payload for what was true then.

## Don't re-derive the report. Do verify a specific claim.

The report's own figures always come from `Analytics::ClassActivityQuery`. A
second query path drifts from the tested one and you get two tools disagreeing
about the same fortnight.

But a targeted read-only query to answer something the report doesn't cover is
a different thing and is often the better answer. When the question contains
"actually", "really", or "did they" — go look, then say what you found and how.

## Reading it honestly

Mention these only when they're load-bearing for a claim you're making.

- **Messages are absent by design.** `conversations` keys on
  `(teacher_profile_id, parent_profile_id)` with no class FK, so a parent with
  two children in two classes under one teacher shares one thread. There is no
  honest per-class message count. If Andres wants SMS, it's a separate
  teacher↔parent question.
- **`class_id` on a booking request is nullable.** Lessons can exist attached to
  no class — hence the unclassed-bookings section.
- **`cancelled_at` is independent of `status`.** A slot can read `approved` and
  still be cancelled; the report counts it as cancelled.
- **This report keeps internal accounts.** Unlike weekly-ops, it does not drop
  `Profile::INTERNAL_EMAILS` — the roster is an explicit list, so if you name
  Keri you get Keri. Test accounts are still excluded.
- **`upcoming` is excluded from `total_events`.** A future booking is not
  something that happened; counting it would make a dormant class look active.
- **The window is fixed at generation time.** The artifact is a snapshot. A
  different window means re-running the script.

## Not for

- **Who to call this week** — that's `weekly-ops`, the Monday call sheet.
- **Platform trends and funnels** — admin Feature Analytics, `https://thoven.co/admin`.
- **Fixing what it surfaces.** Production data changes are Andres's call.
- **SMS/chat volume** — see above; there is no class-scoped answer.
