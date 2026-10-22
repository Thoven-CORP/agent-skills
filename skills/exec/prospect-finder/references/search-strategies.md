# Search Strategy Catalog

> **Exa fallback:** `mcp__exa__*` is optional and is not connected as of 2026-10-22. If it is unavailable, run the same query with `WebSearch` and read results with `WebFetch` (for LinkedIn, search `site:linkedin.com/in "{name}" {company}`). Say in the output which source you used.

Strategies are organized by type. Each subagent picks strategies from its assigned type. Strategies marked [SPENT] have been run and returned <2 qualified — deprioritize for 30 days.

## Type A: List Scraping (Web Search -> WebFetch -> Extract Names)

Use `mcp__exa__web_search_exa` or `WebSearch` to find articles/directories, then `WebFetch` to extract names.

### A1. Curated Angel Lists
- "top EdTech angel investors 2025 2026 list"
- "best angel investors in education technology"
- "most active angel investors in education startups"
- "EdTech angel investors who write $10K-$50K checks"
- "angel investors who invest in marketplace startups list"
- "music industry angel investors list"
- "angel investors who invest in consumer education"

### A2. Angel Group Member Directories
- "Tech Coast Angels members directory"
- "New York Angels member list"
- "Golden Seeds angel investor members"
- "Launchpad Venture Group members education"
- "SLC Angels members list"
- "Desert Angels members"
- "Houston Angel Network members"
- "Atlanta Technology Angels members"
- "Keiretsu Forum members education"
- "Band of Angels members"
- "AngelList syndicates education marketplace music"

### A3. Conference Speaker/Attendee Lists
- "ASU GSV Summit 2025 2026 speakers attendees"
- "EdTech Week speakers investors"
- "SXSW EDU speakers 2025 2026"
- "NAMM show exhibitors education technology"
- "EdSurge 50 states education innovation"
- "GSV Cup competition judges investors"
- "Shark Tank education startup pitches"

### A4. Awards and Recognition Lists
- "EdTech Digest awards winners investors"
- "Forbes Midas List education investors"
- "Crunchbase most active education angel investors"
- "PitchBook most active seed investors education"

## Type B: Acquisition Mining (Find Acquired Companies -> Look Up Founders)

Use `mcp__exa__web_search_exa` to find acquisition announcements, extract founder names, then verify angel activity.

### B1. EdTech Acquisitions
- "EdTech companies acquired 2020 2021 2022 2023 2024 2025 founder"
- "Chegg acquisitions list founder CEO"
- "PowerSchool acquisitions list founder"
- "Renaissance Learning acquisitions list founder"
- "Instructure Canvas acquisitions list founder"
- "IXL Learning acquisitions founder"
- "Kahoot acquisitions founder"
- "Duolingo acquisitions founder"
- "Byju's acquisitions US founder"
- "Clever acquisitions founder"
- "Curriculum Associates acquisitions founder"

### B2. Music/Audio Tech Acquisitions
- "music technology companies acquired 2018-2025 founder"
- "audio software companies sold founder investor"
- "Spotify acquisitions list founder"
- "Apple music technology acquisitions founder"
- "Native Instruments Soundwide acquisitions founder"
- "inMusic Brands acquisitions founder"
- "Roland acquisitions technology founder"

### B3. Marketplace Acquisitions
- "marketplace startup acquisitions 2020-2025 founder angel"
- "services marketplace companies sold founder"
- "two-sided marketplace exits 2020-2025"
- "Blackstone marketplace acquisitions founder"

## Type C: Exa People Search (Fresh Custom Queries)

Use `mcp__exa__people_search_exa` with 10 results per query. Generate queries that DON'T overlap with the 27 already run.

### C1. Geographic Targeting
- "EdTech founder angel investor San Francisco Bay Area exited"
- "education startup founder angel investor New York City exited"
- "EdTech founder angel investor Austin Texas exited"
- "education marketplace founder angel investor Boston exited"
- "music technology founder angel investor Los Angeles exited"
- "EdTech founder angel investor Miami exited"
- "education company founder angel investor Chicago exited"

### C2. Investor Network Mining
- "AngelList education marketplace investor active profile"
- "Signal NFX education investor profile"
- "Republic education crowdfunding top investor"
- "SeedInvest education investor profile"

### C3. Adjacent Sector Crossover
- "fitness or wellness marketplace founder exited now angel investing education"
- "childcare or kids activity marketplace founder exited angel investor"
- "after school enrichment platform founder sold company angel"
- "summer camp or extracurricular marketplace founder exited angel"
- "language learning app founder exited angel investor United States"
- "test prep company founder sold angel investor"
- "college admissions platform founder exited angel investor"
- "student loan or financial aid startup founder exited angel"

### C4. Operator-to-Angel Pipeline
- "former education company CTO who now angel invests"
- "EdTech CMO who left to angel invest in startups"
- "education company COO who exited and now invests"

## Type D: Web Research Deep Dives (Tavily/WebSearch)

Use `WebSearch` (Tavily) for broader research, then extract names.

### D1. Media and Content Mining
- "EdSurge articles about angel investors education"
- "TechCrunch education startup funding angel investors"
- "LinkedIn posts about angel investing in education 2025 2026"
- "podcast interviews EdTech angel investors"
- "EdTech newsletter recommended angel investors"

### D2. Portfolio Mining
- "NewSchools Venture Fund portfolio founders who angel invest"
- "Reach Capital portfolio company founders"
- "Owl Ventures portfolio founders angel investing"
- "GSV Ventures portfolio company founders"
- "Learn Capital portfolio founders"
- "Rethink Education portfolio founders"

### D3. Community and Network Mining
- "EdTech founders community Slack Discord members"
- "education startup accelerator alumni who angel invest"
- "Techstars education program alumni founders"
- "Y Combinator education startups founders angel"
- "500 Startups education portfolio founders"
- "Imagine K12 accelerator alumni founders"
- "LearnLaunch accelerator alumni founders"

## Anti-Patterns (DO NOT USE)
- Queries naming PE firms directly -> returns PE employees, not founders who sold TO them
- "art music dance theater founder" -> returns nonprofit educators
- "homeschool platform founder" -> returns current operators, no exits
- Generic marketplace queries without "exited" or "sold" -> returns VC fund GPs
- Queries without "United States" or "US-based" -> 70%+ non-US results
