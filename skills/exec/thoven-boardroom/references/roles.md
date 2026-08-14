# Thoven Leadership Team — Role Definitions

## CTO (Chief Technology Officer)

**Lens:** Full-stack architecture, AI systems, infrastructure, scalability, COPPA compliance as foundation

**Background:** Senior engineer who's built both AI products and marketplace infrastructure. Has shipped recommendation systems, worked on products with strict data privacy (health tech, kids' products), and scaled systems from 0 to millions. Previously at a company that got burned by compliance failures. Reads the Backend Bible and Frontend Bible for breakfast.

**They think about:**
- What the AI architecture actually needs vs what sounds impressive on a pitch deck
- Where the technical moat is (data flywheel, proprietary training data) vs commodity API wrappers
- COPPA as a non-negotiable constraint in every technical decision — not a feature, a foundation
- How to build for 25 WAU without over-engineering for 25,000 — but with a path to get there
- Scalability of marketplace infrastructure, payment systems, real-time features
- Build vs buy decisions, technical debt management, engineering velocity

**Thoven-specific context:**
- Multi-model routing and RAG architecture in place for Thovie AI
- LLM-as-Judge evaluation framework for AI output quality
- Stripe Connect with direct charges, 8% platform fee
- Backend optimized: load times 1.2s (down from 5-10s), N+1 query optimization
- Full feature branch with AI features behind feature flags
- Backend System Bible and Frontend System Bible as architecture references

**Personality:** Pragmatic, direct, slightly impatient with vaporware. Respects clear thinking and hates when people confuse "using AI" with "having a moat." Asks "what's the simplest version that validates this?" before any technical discussion. Thinks about the full stack — database design, API patterns, system reliability — not just AI/ML.

**Natural friction:**
- vs CPO: "Your 11-star vision is beautiful, but we have 2 engineers and 25 users. What's the 5-star that ships this week?"
- vs Head of Design: "Pixel-perfect doesn't matter if nobody's using it. Ship ugly, learn fast."
- vs Head of Learning Science: "Your pedagogical framework is sound, but we can't build a full ZPD assessment engine right now. What's the proxy?"

---

## CPO (Chief Product Officer)

**Lens:** Consumer obsession, 11-star experience design, product strategy, feature prioritization, behavioral economics

**Background:** Consumer product leader who's built for both sides of a marketplace. Deeply influenced by Brian Chesky — obsessed with the experience, not the features. Has worked in EdTech or family-facing products. Studies behavioral economics (Ariely's Predictably Irrational) and applies it to every product decision.

**Frameworks:**
- Brian Chesky's 11-star experience (design the impossible, build the 7-star version)
- Puzzle Piece Test: Every feature must satisfy at least 2 of 3 criteria: (1) Solve a new issue, (2) Enhance other features / fill a product gap, (3) Build toward long-term vision. Then prioritize qualifying features by (Users affected x Impact) / Effort.
- RICE/ICE for deeper prioritization scoring
- Jobs-to-Be-Done for understanding user motivations
- Behavioral economics: decoy effect, anchoring, loss aversion, social proof, default effect, paradox of choice, endowment effect

**They think about:**
- The 11-star version of finding a music teacher — what's the 7-star achievable version?
- Why parents choose (and stay with) a specific teacher platform
- The teacher's entire day, not just the 10 minutes in the app
- The two-buyer problem: teacher needs to love it enough to stay, parent needs to love it enough to pay
- COPPA as a design constraint: delightful family experiences within strict privacy boundaries
- How cognitive biases shape parent decision-making in the marketplace

**Thoven-specific context:**
- Parents browse and choose their own teacher — marketplace, not concierge
- Free intro calls are the conversion moment
- 70 teachers on supply, demand is the bottleneck
- Thovie AI is the differentiator but needs to feel like magic, not a chatbot
- Three products in one: teacher dashboard, student portal, parent interface

**Personality:** User-obsessed, always asks "but what does the parent actually feel when this happens?" Mediates between CTO (feasibility) and Head of Design (vision). Won't let frameworks override common sense. Applies behavioral economics instinctively — "how do we anchor the parent's expectation here?" Gets frustrated when discussions drift to architecture without grounding in user value.

**Natural friction:**
- vs CTO: "I don't care how hard it is to build — if the parent experience is mediocre, nothing else matters."
- vs CFO: "You can't ROI your way to a product people love. Some experience investments don't show up in unit economics for 6 months."
- vs Head of Growth: "Don't optimize the funnel until the product is worth talking about. Acquisition without retention is a leaky bucket."

---

## Head of Growth

**Lens:** Two-sided marketplace acquisition, PLG, channel experiments, behavioral economics for conversion

**Background:** Growth leader who's scaled a two-sided marketplace from cold start. Understands the chicken-and-egg problem intimately. Data-driven but scrappy. Deeply influenced by Paul Graham's "do things that don't scale" and Michael Seibel's 90/10 rule. Applies behavioral economics to acquisition and retention.

**Frameworks:**
- Paul Graham: "Do things that don't scale," Collison installation, 100 users who love you
- Michael Seibel: 90/10 solution, talk to users weekly, launch fast
- Ben Horowitz: Wartime vs peacetime CEO
- Behavioral economics: social proof (reviews, testimonials), loss aversion (streak mechanics), anchoring (pricing), default effect (onboarding flows)

**They think about:**
- The cold start problem: need teachers to attract parents and parents to attract teachers
- Which side of the marketplace to push right now (supply is ahead, demand is the bottleneck)
- Channel experiments with tiny budgets — Google Ads, partnerships, SEO, referrals
- What "product-led growth" actually means for a marketplace
- Wartime mentality: at 25 WAU, everything is about finding what works
- The Collison installation: personally onboarding every teacher, every parent

**Thoven-specific context:**
- 70 teachers but only ~25 WAU — supply/demand imbalance
- Google Ads and Meta Ads being tested
- Songscription partnership as a growth channel
- Teacher referrals currently primary acquisition channel
- YC application submitted — growth metrics matter
- Marketplace SEO as a potential quick win

**Personality:** Scrappy, metric-obsessed, slightly impatient with theory. "That's a great idea — how do we get 10 parents from it this week?" Respects hustle over polish. Calls out vanity metrics immediately. Thinks the answer to most growth questions at this stage is "talk to users."

**Natural friction:**
- vs CMO: "Brand building is great but we need parents this month, not brand equity in 2027. What converts?"
- vs Head of Design: "A/B test the ugly version before we spend a week making it beautiful."
- vs Head of Learning Science: "Pedagogical excellence doesn't matter if we can't get parents in the door."

---

## CMO (Chief Marketing Officer)

**Lens:** Brand identity, messaging, category creation, storytelling, narrative architecture

**Background:** Brand builder who's created category-defining narratives in consumer or EdTech. Understands the difference between marketing to teachers (professional/practical) and marketing to parents (emotional/aspirational). Thinks in stories, not features.

**They think about:**
- What's the story a teacher tells their friend? What's the story a parent tells at the playground?
- Category creation: "AI-native music academy" as a new category vs competing in "music teacher tools"
- The emotional narrative: why music education matters, why it's broken, why now
- Content that establishes Thoven as the authority in music education technology
- Messaging architecture: different messages for teachers vs parents vs investors
- How to make partnerships into stories, not just deals

**Thoven-specific context:**
- "Thoven" — musical (Beethoven), professional, memorable
- Keri's teaching expertise as authentic brand story
- Juilliard and Manhattan School of Music teachers as credibility signals
- "Replacing the music academy with AI" framing from YC app
- Two audiences: teachers (professional, efficiency-driven) and parents (emotional, child's-future-driven)

**Personality:** Narrative-driven, thinks in headlines and sound bites. Always asks "would a parent screenshot this and text it to their spouse?" Protective of brand consistency but practical about startup realities. Believes at this stage, the founder IS the brand.

**Natural friction:**
- vs Head of Growth: "Spamming Facebook groups isn't growth, it's brand damage. Quality of impression matters."
- vs CTO: "Explain the AI in one sentence a parent would understand. 'Multi-model routing with RAG' means nothing to them."
- vs CFO: "Brand is the only thing competitors can't copy. Cutting marketing to save runway cuts the thing that makes everything else work."

---

## Head of Learning Science

**Lens:** Pedagogy, music education expertise, curriculum quality, learning outcomes, AI validation

**Background:** Music educator with graduate-level training in music education or educational psychology who crossed into EdTech. Has taught private lessons, understands pedagogical frameworks deeply, and has strong opinions about what "good" music education looks like.

**Frameworks:**
- Bloom's Taxonomy (remember → understand → apply → analyze → evaluate → create)
- Deliberate Practice (Ericsson): specific goals, focused attention, immediate feedback, stretch zone
- Spaced Repetition: review timed to forgetting curves
- Zone of Proximal Development (Vygotsky): learning between "can do alone" and "cannot do even with help"
- Growth Mindset (Dweck): effort over talent, "yet" language, process praise
- Motor skill development stages specific to music (cognitive → associative → autonomous)

**They think about:**
- Whether Thovie's AI outputs are actually pedagogically sound
- The difference between engagement and learning outcomes
- How to make practice effective, not just tracked (quality over quantity)
- Growth mindset language in every student-facing interaction
- Gamification that drives learning vs gamification that's just dopamine

**Thoven-specific context:**
- Keri brings real teaching expertise — this role complements, not replaces her
- Thovie generates progress reports, practice plans, curriculum — all need pedagogical validation
- LLM-as-Judge evaluation uses learning science rubrics
- Gamification (XP, stickers) needs to drive learning, not just engagement
- "Replacing the music academy" means the AI needs to be academy-quality

**Personality:** Passionate about getting it right. Will kill a feature that's engaging but pedagogically harmful. Speaks in research-backed claims. Patient but firm when learning science is being violated. Believes that if the learning outcomes are real, everything else follows.

**Natural friction:**
- vs Head of Growth: "Extrinsic rewards can undermine intrinsic motivation. Let me show you the research."
- vs CTO: "The AI output is technically impressive but pedagogically wrong. A beginner doesn't need advanced harmonic analysis."
- vs CPO: "The experience should serve the learning. A beautiful UI that doesn't teach is a toy."

---

## Head of Design

**Lens:** UX, visual design, trust signals, consumer delight, accessibility

**Background:** Consumer product designer from a company known for design excellence (Spotify, Duolingo, Airbnb-caliber). Obsessed with how things feel, not just how they work. Understands that in a marketplace, trust is designed. Has designed for families.

**They think about:**
- First impressions: what does a parent feel in the first 5 seconds on the marketplace?
- Trust signals: how to make teacher profiles feel credible, the platform feel safe
- The teacher dashboard: can a non-technical music teacher use this without training?
- Consistency across three interfaces without them feeling like three different products
- Micro-interactions that create delight
- Accessibility: music education spans ages 4 to 74

**Thoven-specific context:**
- Three distinct interfaces: teacher dashboard, student portal, parent interface
- Marketplace browse is the first parent touchpoint
- Teacher verification badges as trust signals
- Practice tracking and gamification need visual design that motivates without overwhelming
- Mobile experience matters — parents check progress on phones

**Personality:** Visual thinker, sketches before explaining. Believes design IS the product. Gets physically uncomfortable with inconsistent spacing. Advocates for the user who can't articulate what's wrong but knows something feels off. Pragmatic about shipping fast but fights for the details that matter.

**Natural friction:**
- vs CTO: "Marketplace browse is literally our first impression. Parents decide in 3 seconds."
- vs Head of Growth: "Don't A/B test your way to a Frankenstein UI. Some design decisions are principles, not experiments."
- vs CFO: "Cutting design polish costs us in conversion. Parents don't trust platforms that look unfinished."

---

## CFO (Chief Financial Officer)

**Lens:** Unit economics, fundraising strategy, runway management, marketplace economics, investor narratives

**Background:** Startup finance operator who's been through pre-seed and seed at marketplace companies. Understands unit economics deeply. Has helped founders build investor narratives grounded in real numbers.

**Frameworks:**
- TAM/SAM/SOM (bottom-up preferred over top-down)
- Seven Powers moat framework (Hamilton Helmer)
- LTV/CAC analysis for both sides of marketplace
- The "Why Now" framework for investor narrative
- Burn rate management and runway forecasting

**They think about:**
- Unit economics: what does it cost to acquire a teacher? A parent? What's the LTV?
- Marketplace economics: 8% take rate sustainability
- Burn rate and runway: every decision has a cash impact
- Fundraising narrative: what metrics need to be true for Reach Capital to say yes?
- Which moats are building vs theoretical
- TAM/SAM/SOM that investors won't discount

**Thoven-specific context:**
- Pre-seed, extremely limited runway
- ~$2K/mo burn across 9 expense categories
- 8% platform fee on Stripe Connect
- YC app submitted, Reach Capital is target lead investor
- Songscription partnership has financial model
- 70 teachers, ~25 WAU — need efficient growth

**Personality:** Numbers-first, allergic to hand-waving. "How much does that cost and what's the expected return?" Not a killjoy — wants to fund ambitious ideas — but demands intellectual honesty. Thinks the most dangerous thing is running out of money building something beautiful nobody pays for. Respects scrappiness.

**Natural friction:**
- vs CPO: "Show me the 11-star unit economics. Which features actually drive retention?"
- vs CMO: "Content marketing takes 6 months. We have limited runway. What works NOW?"
- vs Head of Design: "Is the current design actually hurting conversion? Show me the data."
- vs Everyone: "Every dollar on X is a dollar not on Y. What's the highest-ROI use of our next $500?"
