---
date: 2026-02-27
topic: Post-Intro-Call Marketplace Leakage & Optimistic Class Creation
attendees: CTO, CPO, CMO, Head of Growth, Head of Learning Science, Head of Design, CFO
status: decisions-made
---

# Thoven Boardroom — Post-Intro-Call Marketplace Leakage

## Summary
Partnership teacher Audrey completed an intro call but coordinated via email instead of creating a class on Thoven, revealing a critical product gap: no guided post-intro-call flow. The team analyzed the problem from all angles and converged on "Optimistic Class Creation" — the system auto-creates everything (class, enrollment, messaging) after the intro call, and the teacher just confirms with one tap. CEO made the key architecture call: create everything optimistically and rollback on "no" rather than decoupling messaging from enrollment.

## Key Decisions
- **Product-first, enforcement as backstop**: Fix the product gap before relying on ToS enforcement. Teachers aren't adversarial — the platform path is just harder than email. Proposed by CPO, supported by all roles. CEO confirmed.
- **Optimistic Class Creation**: After intro call window closes, system auto-creates class + enrollment + messaging. Teacher confirms with one tap. If "no," single API deletes everything. Proposed by CEO, validated by CTO as feasible in 1-2 weeks.
- **SMS consent moves to intro call booking**: Currently tied to enrollment. Moving it upstream means messaging works immediately when optimistic enrollment is created. CEO decision.
- **Auto-generated class names**: Template `"[Student]'s [Instrument] Class"` — zero teacher input required. Editable later. CEO decision.
- **Don't block on Stripe**: Let class creation proceed without Stripe connected. Prompt Stripe setup before first payment, not first class. CTO recommendation, CEO approved.
- **Parent sees class only after teacher confirms**: `pending_confirmation` flag gates parent visibility. Prevents showing a class that might get rolled back. CTO recommendation.

## Areas of Agreement
- The post-intro-call gap is the #1 product hole right now
- Messaging must be available between teacher-parent after intro call booking
- Teachers aren't trying to cheat the platform — they're following the path of least resistance
- The intro call is the highest-intent moment; capture the commitment while it's hot
- Class creation should be a confirmation, not a configuration (one tap, not five steps)
- Lead with payment/scheduling convenience for teacher adoption; learning tools become the retention hook

## Active Disagreements
- **Enforcement timing**: CFO/Growth wanted ToS enforcement sooner; CPO/Design argued product fix must come first. **CEO ruling**: Product first, ToS as backstop (already in progress).
- **What to emphasize to teachers**: Growth says payment/scheduling convenience; Learning Science says learning outcomes and AI tools. **CEO ruling**: Growth is right for now — lead with money and time savings. Learning tools retain once teachers are on-platform.
- **Ship speed vs messaging**: CMO wanted to nail value narrative before shipping features; CTO said ship the wizard first, message later. **CEO ruling**: CTO is right — ship the product fix, layer messaging on top.

## Open Questions (Resolved Post-Meeting)
- **Stripe decision tree (RESOLVED)**: Two paths after teacher confirms "Yes":
  - Path A (Stripe connected): Class created, parent immediately sees "You're enrolled! Purchase your first lesson."
  - Path B (Stripe NOT connected): Class created, but parent side gated. Teacher gets inline Stripe setup prompt: "Before we connect you with [Parent], set up your payment account." Parent unlocks after Stripe completes.
- **SMS consent (RESOLVED)**: Move to intro call booking flow (upstream from enrollment)
- **Class naming (RESOLVED)**: Auto-template `"[Student]'s [Instrument] Class"`, editable later

## Open Questions (Resolved in Brainstorm Session)
- **Who confirms (RESOLVED)**: Teacher only. Parent is informed, not asked. Endowment effect — once parent sees "Emma's Piano Class" on dashboard, it's theirs. Misrepresentation risk is low and recoverable (parent can't be charged until they actively purchase credits). CEO confirmed.
- **Non-response protocol (RESOLVED)**: 72-hour window. Push at +30min → email at +24h → email at +48h → auto-rollback at +72h. Parent sees nothing during wait, only notified on resolution. Partnership teachers get a personal call from Andres instead of automated emails. CEO confirmed.
- **Purchase flow (RESOLVED)**: Parent buys a lesson PACKAGE (bundle) — not individual lessons. Bundle gives credits, then parent schedules lessons from credits. All purchase CTAs should say "Purchase your lesson package," not "book a lesson."
- **Notifications (RESOLVED)**: NO SMS for marketing/nudges — SMS stays purely transactional (teacher-parent messaging only). Notifications are: 1 enrollment email + up to 3 in-product touches. Keep it simple. CEO confirmed.
- **Step 3 — Class materials (RESOLVED)**: Optional prompt for teacher to upload class materials (sheet music, PDFs, links). Not required, not gated. Just a nudge ~48h after class creation. CEO confirmed.
- **Post-first-lesson flow (DEFERRED to Phase 2)**: In-product "How did it go?" prompt after first lesson + guidance on next steps (how to add sessions, etc.). Design architecture for it now but don't build yet. Clear Phase 1 / Phase 2 separation. CEO confirmed.

## Open Questions (Still Open)
- What percentage of intro calls convert to on-platform classes? Need data to size the leakage problem.
- For partnership teachers specifically: what's the deal structure? Should economics be contingent on on-platform class creation?

## Action Items
- [ ] Engineering: Build Optimistic Class Creation flow (1-2 week target)
  - Backend: auto-create class + enrollment with `pending_confirmation` flag after intro call
  - Backend: rollback endpoint (cascade delete class → enrollment → messaging)
  - Backend: hold notifications until confirmation
  - Frontend: teacher confirmation screen (one-tap, pre-filled, celebratory)
  - Frontend: parent notification after teacher confirms
- [ ] Engineering: Move SMS consent to intro call booking flow
- [ ] Engineering: Auto-generate class names from template (`[Student]'s [Instrument] Class`)
- [ ] Product: Define the "no" and "need more time" flows (graceful decline, 24h snooze re-prompt)
- [ ] Legal: Continue ToS update for off-platform leakage guardrails
- [ ] CEO: Personally onboard next 5 teachers through the flow (Collison installation) to find friction points

## Dissenting Opinions
- **Head of Learning Science**: Concerned that leading with payment convenience undersells the platform's pedagogical value. Off-platform = no practice tracking, no AI progress reports, no structured curriculum. The learning tools ARE the moat — we should surface them earlier in the teacher journey.
- **CMO**: Worried that shipping features without clear value messaging means teachers still won't understand why the platform is better than email. The wizard might become "one more confusing thing" without narrative context.

## Peer Debates
- **Head of Growth vs Head of Learning Science on teacher value prop**: Growth argued teachers care about getting paid on time, not learning moats. Learning Science argued the pedagogical tools are what make Thoven irreplaceable. Resolution: Growth wins for acquisition; Learning Science wins for retention. Sequence matters.

## Raw Perspectives

### CTO
- Optimistic class creation is feasible in 1-2 weeks
- Teacher-only confirm is simplest trigger (don't wait for both parties)
- Don't block on Stripe — prompt before first payment, not first class
- Hardest piece: ensuring notifications don't fire prematurely during pending state
- CEO's "create everything, delete on no" approach is cleaner than decoupling messaging from enrollment

### CPO
- This is a default effect problem — the current default post-intro-call is nothing
- Endowment effect: once teacher sees "Emma's Piano Class" on their dashboard, they own it psychologically
- Timing is critical: prompt must appear immediately after call window closes
- The "no" path must be graceful — "Need more time?" not "Reject this family"
- One thing we can't get wrong: the confirmation must feel like a celebration, not a form

### CMO
- Frame platform tools as "professional studio tools" not "platform compliance"
- Teachers need to feel they're upgrading their practice, not submitting to overhead
- The founder IS the brand at this stage — Andres personally onboarding teachers carries weight
- Messaging should be "we handle your admin so you just teach"

### Head of Growth
- Marketplace leakage is the #1 growth blocker — every leaked relationship is lost GMV
- At 25 WAU, even a few leaked relationships per month is material
- Collison installation: CEO should personally onboard next 5 teachers through post-intro-call flow
- For partnerships: tie economics to on-platform class completion — no subsidy for off-platform matches

### Head of Learning Science
- Off-platform = pedagogical collapse: no practice tracking, no AI reports, no structured curriculum
- Parent loses visibility into child's progress without platform tools
- The learning features are what make Thoven different from "a teacher I found on Google"
- Long-term moat is in learning outcomes data, but we need teachers on-platform to build it

### Head of Design
- Current post-intro-call UX is "figure it out yourself" — a design failure, not a teacher failure
- Confirmation screen should be full-page, celebratory (think Duolingo level completion)
- One card with everything pre-filled, one big green "Let's go!" button
- Parent side: "Great news! [Teacher] is ready to start classes with [Student]"
- Core UX principle: zero decisions required — teacher confirms, not configures

### CFO
- Every leaked relationship = lost 8% platform fee
- For partnership teachers: Thoven may be subsidizing intros that generate off-platform revenue
- Investor narrative suffers if marketplace has weak stickiness signals
- Optimistic class creation is the highest-ROI build — low cost, directly addresses revenue leakage
- ToS enforcement is the backstop but product fix has better ROI per engineering hour
