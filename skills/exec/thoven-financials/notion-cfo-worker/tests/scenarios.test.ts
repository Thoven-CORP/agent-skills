/**
 * Scenario tests — exercise the analyzer prompt with realistic CFO inputs.
 *
 * These do NOT call the real Anthropic API. Instead, they verify the prompt
 * INCLUDES the data Claude needs to reach the correct judgment, and that the
 * orchestrator handles representative analysis responses correctly.
 *
 * Think of this as an "agent test bench" — the inputs match what Claude will
 * see in production, the assertions verify our wiring is sound.
 *
 * For live LLM evaluation, see `evals/golden-cases.json` and run them with:
 *   ANTHROPIC_API_KEY=... npm run eval
 */

import { describe, expect, it, vi } from "vitest";
import { analyzeTransactions, buildAnalysisPrompt } from "../src/claude.js";
import { runCFOReport } from "../src/index.js";
import type {
  AnalysisInput,
  AnalysisResult,
  Transaction,
  VendorEntry,
} from "../src/types.js";

// ─── Realistic fixtures (drawn from CFO/2026-05-13-budget-line-items.md) ────

const REAL_VENDORS: VendorEntry[] = [
  {
    vendor: "Anthropic",
    type: "USAGE",
    cap: 300,
    category: "AI Core Dev",
    isFreeTierWatch: false,
    rationale: "Tight cap forces awareness of agent runs",
  },
  {
    vendor: "GitHub",
    type: "FIXED",
    cap: 15,
    category: "AI Core Dev",
    isFreeTierWatch: false,
  },
  {
    vendor: "Cloudflare",
    type: "USAGE",
    cap: 0,
    category: "Infrastructure",
    isFreeTierWatch: true,
    rationale: "Free tier — alert on first paid charge",
  },
  {
    vendor: "Google",
    type: "STRATEGIC",
    cap: 650,
    category: "Acquisition / Ads",
    isFreeTierWatch: false,
  },
  {
    vendor: "THOVEN",
    type: "LUMPY",
    cap: 0,
    category: "Acquisition / Ads",
    isFreeTierWatch: false,
    rationale: "Stripe top-up pass-through for influencer campaign",
  },
  {
    vendor: "OpenRouter",
    type: "USAGE",
    cap: 0,
    category: "AI Exploration",
    isFreeTierWatch: false,
    rationale: "Cancelled — any charge is a missed cancellation",
  },
];

// Scenario A — monthly sub renewal that looks like a 100% increase week-over-week
const MONTHLY_RENEWAL_INPUT: AnalysisInput = {
  cash: 50000,
  since: "2026-05-07",
  until: "2026-05-13",
  vendors: REAL_VENDORS,
  thisWeek: [
    { mercuryId: "tx_g_may", date: "2026-05-12", description: "GitHub", amount: 12, account: "a1" },
  ],
  priorWeeks: [
    { mercuryId: "tx_g_apr", date: "2026-04-12", description: "GitHub", amount: 12, account: "a1" },
  ],
};

// Scenario B — true spike on a usage-based vendor
const REAL_SPIKE_INPUT: AnalysisInput = {
  cash: 50000,
  since: "2026-05-07",
  until: "2026-05-13",
  vendors: REAL_VENDORS,
  thisWeek: [
    { mercuryId: "tx_a_spike", date: "2026-05-12", description: "Anthropic", amount: 180, account: "a1" },
  ],
  priorWeeks: [
    { mercuryId: "tx_a_1", date: "2026-04-15", description: "Anthropic", amount: 60, account: "a1" },
    { mercuryId: "tx_a_2", date: "2026-04-22", description: "Anthropic", amount: 55, account: "a1" },
  ],
};

// Scenario C — overage on cap (Anthropic over $300 MTD)
const OVERAGE_INPUT: AnalysisInput = {
  cash: 50000,
  since: "2026-05-07",
  until: "2026-05-13",
  vendors: REAL_VENDORS,
  thisWeek: [
    { mercuryId: "tx_o_3", date: "2026-05-12", description: "Anthropic", amount: 150, account: "a1" },
  ],
  priorWeeks: [
    { mercuryId: "tx_o_1", date: "2026-05-02", description: "Anthropic", amount: 120, account: "a1" },
    { mercuryId: "tx_o_2", date: "2026-05-05", description: "Anthropic", amount: 80, account: "a1" },
  ],
};

// Scenario D — free-tier breach (Cloudflare goes paid)
const FREE_TIER_BREACH_INPUT: AnalysisInput = {
  cash: 50000,
  since: "2026-05-07",
  until: "2026-05-13",
  vendors: REAL_VENDORS,
  thisWeek: [
    { mercuryId: "tx_cf", date: "2026-05-12", description: "Cloudflare", amount: 23, account: "a1" },
  ],
  priorWeeks: [],
};

// Scenario E — unknown vendor (not in budget)
const UNKNOWN_VENDOR_INPUT: AnalysisInput = {
  cash: 50000,
  since: "2026-05-07",
  until: "2026-05-13",
  vendors: REAL_VENDORS,
  thisWeek: [
    {
      mercuryId: "tx_mystery",
      date: "2026-05-12",
      description: "MYSTERY VENDOR INC",
      amount: 45,
      account: "a1",
    },
  ],
  priorWeeks: [],
};

// Scenario F — THOVEN Stripe pass-through (LUMPY with cap=0, expected per-event)
const LUMPY_PASSTHROUGH_INPUT: AnalysisInput = {
  cash: 50000,
  since: "2026-05-07",
  until: "2026-05-13",
  vendors: REAL_VENDORS,
  thisWeek: [
    { mercuryId: "tx_thoven", date: "2026-05-12", description: "THOVEN", amount: 200, account: "a1" },
  ],
  priorWeeks: [
    { mercuryId: "tx_thoven_prior", date: "2026-05-02", description: "THOVEN", amount: 200, account: "a1" },
  ],
};

// Scenario G — cancelled vendor charge (OpenRouter, cap=0, type USAGE — missed cancellation)
const MISSED_CANCEL_INPUT: AnalysisInput = {
  cash: 50000,
  since: "2026-05-07",
  until: "2026-05-13",
  vendors: REAL_VENDORS,
  thisWeek: [
    {
      mercuryId: "tx_or",
      date: "2026-05-12",
      description: "OpenRouter",
      amount: 11,
      account: "a1",
    },
  ],
  priorWeeks: [],
};

describe("scenarios — prompt building (test bench)", () => {
  it("monthly sub renewal: prompt includes prior same-amount charge so Claude can rule out spike", () => {
    const prompt = buildAnalysisPrompt(MONTHLY_RENEWAL_INPUT);
    expect(prompt).toContain("tx_g_may");
    expect(prompt).toContain("tx_g_apr");
    expect(prompt).toContain("GitHub");
    // both charges $12 — present in prompt so Claude can detect identical monthly renewal
    const dollarTwelves = prompt.match(/"amount": 12/g) ?? [];
    expect(dollarTwelves.length).toBe(2);
  });

  it("real spike: prompt includes the new charge and lower-baseline prior charges", () => {
    const prompt = buildAnalysisPrompt(REAL_SPIKE_INPUT);
    expect(prompt).toContain("180");
    expect(prompt).toContain("60");
    expect(prompt).toContain("55");
  });

  it("overage: prompt includes vendor cap and MTD-worth of charges", () => {
    const prompt = buildAnalysisPrompt(OVERAGE_INPUT);
    expect(prompt).toContain("Anthropic");
    expect(prompt).toContain("300"); // the cap
    expect(prompt).toContain("150");
    expect(prompt).toContain("120");
  });

  it("free tier breach: prompt declares isFreeTierWatch=true for Cloudflare", () => {
    const prompt = buildAnalysisPrompt(FREE_TIER_BREACH_INPUT);
    expect(prompt).toContain("Cloudflare");
    expect(prompt).toContain("isFreeTierWatch");
    expect(prompt).toContain("true");
  });

  it("unknown vendor: prompt does NOT contain MYSTERY in budget, but DOES contain it in this-week", () => {
    const prompt = buildAnalysisPrompt(UNKNOWN_VENDOR_INPUT);
    expect(prompt).toContain("MYSTERY VENDOR INC");
    // budget shouldn't have it
    const budgetSection = prompt.split("THIS WEEK")[0];
    expect(budgetSection).not.toContain("MYSTERY");
  });

  it("LUMPY pass-through: vendor declared with type=LUMPY, cap=0", () => {
    const prompt = buildAnalysisPrompt(LUMPY_PASSTHROUGH_INPUT);
    expect(prompt).toContain("THOVEN");
    expect(prompt).toContain("\"type\": \"LUMPY\"");
  });

  it("missed cancellation: vendor declared USAGE with cap=0", () => {
    const prompt = buildAnalysisPrompt(MISSED_CANCEL_INPUT);
    expect(prompt).toContain("OpenRouter");
  });
});

describe("scenarios — full orchestrator (with simulated Claude response)", () => {
  function makeMockNotion() {
    return {
      readBudgetDB: vi.fn().mockResolvedValue(REAL_VENDORS),
      findExistingTransactionIds: vi.fn().mockResolvedValue(new Set()),
      upsertTransactions: vi.fn().mockResolvedValue({ created: 1, skipped: 0 }),
      createReportPage: vi.fn().mockResolvedValue("page_id"),
      createFailureStub: vi.fn().mockResolvedValue("fail_id"),
    };
  }

  function makeMockMercury(thisWeek: Transaction[], prior: Transaction[]) {
    return {
      getCashBalance: vi.fn().mockResolvedValue(50000),
      getTransactions: vi
        .fn()
        .mockResolvedValueOnce(thisWeek)
        .mockResolvedValueOnce(prior),
    };
  }

  it("overage scenario flows through orchestrator and lands on Notion with flag count 1", async () => {
    const claudeResponse: AnalysisResult = {
      weekBurn: 150,
      monthlyBurn: 1700,
      runwayMonths: 29.4,
      overages: [{ vendor: "Anthropic", mtd: 350, cap: 300, pct: 1.17 }],
      anomalies: [],
      vendorTable: [
        { vendor: "Anthropic", type: "USAGE", mtd: 350, cap: 300, pct: 1.17, flag: "overage" },
      ],
      freeTierWatch: [],
      narrative: "Anthropic over cap at $350 / $300. Reduce API runs.",
    };

    const mercury = makeMockMercury(OVERAGE_INPUT.thisWeek, OVERAGE_INPUT.priorWeeks);
    const notion = makeMockNotion();
    const analyze = vi.fn().mockResolvedValue(claudeResponse);

    const result = await runCFOReport({
      mercury: mercury as any,
      notion: notion as any,
      analyze,
      reportWindow: { since: "2026-05-07", until: "2026-05-13" },
      budgetDatabaseId: "b",
      transactionsDatabaseId: "t",
      reportsDatabaseId: "r",
    });

    expect(result.status).toBe("success");
    expect(result.flagsRaised).toBe(1);
    // verify report page got the overage in its blocks
    const reportCall = notion.createReportPage.mock.calls[0]?.[1];
    expect(reportCall.overages).toHaveLength(1);
  });

  it("free-tier breach flows through with proper freeTierWatch entry", async () => {
    const claudeResponse: AnalysisResult = {
      weekBurn: 23,
      monthlyBurn: 1700,
      runwayMonths: 29.4,
      overages: [],
      anomalies: [
        {
          type: "first_paid_charge",
          vendor: "Cloudflare",
          amount: 23,
          date: "2026-05-12",
          reason: "First paid Cloudflare charge — infra tier breach. Capture for investor narrative.",
        },
      ],
      vendorTable: [
        { vendor: "Cloudflare", type: "USAGE", mtd: 23, cap: 0, pct: 999, flag: "overage" },
      ],
      freeTierWatch: [{ vendor: "Cloudflare", status: "paid_breach", mtd: 23 }],
      narrative: "Cloudflare crossed free-tier — $23 charge logged. Investigate which Workers/R2 limit triggered.",
    };

    const mercury = makeMockMercury(FREE_TIER_BREACH_INPUT.thisWeek, []);
    const notion = makeMockNotion();
    const analyze = vi.fn().mockResolvedValue(claudeResponse);

    const result = await runCFOReport({
      mercury: mercury as any,
      notion: notion as any,
      analyze,
      reportWindow: { since: "2026-05-07", until: "2026-05-13" },
      budgetDatabaseId: "b",
      transactionsDatabaseId: "t",
      reportsDatabaseId: "r",
    });

    expect(result.flagsRaised).toBe(1);
    const reportCall = notion.createReportPage.mock.calls[0]?.[1];
    expect(reportCall.freeTierWatch[0].status).toBe("paid_breach");
  });

  it("missed cancellation flagged as anomaly", async () => {
    const claudeResponse: AnalysisResult = {
      weekBurn: 11,
      monthlyBurn: 1700,
      runwayMonths: 29.4,
      overages: [],
      anomalies: [
        {
          type: "other",
          vendor: "OpenRouter",
          amount: 11,
          date: "2026-05-12",
          reason: "Vendor has cap=0 (marked cancelled) but a charge appeared — cancellation didn't take.",
        },
      ],
      vendorTable: [
        { vendor: "OpenRouter", type: "USAGE", mtd: 11, cap: 0, pct: 999, flag: "unknown" },
      ],
      freeTierWatch: [],
      narrative: "OpenRouter charged $11 despite being marked cancelled. Verify cancellation in vendor portal.",
    };

    const mercury = makeMockMercury(MISSED_CANCEL_INPUT.thisWeek, []);
    const notion = makeMockNotion();
    const analyze = vi.fn().mockResolvedValue(claudeResponse);

    const result = await runCFOReport({
      mercury: mercury as any,
      notion: notion as any,
      analyze,
      reportWindow: { since: "2026-05-07", until: "2026-05-13" },
      budgetDatabaseId: "b",
      transactionsDatabaseId: "t",
      reportsDatabaseId: "r",
    });

    expect(result.flagsRaised).toBe(1);
  });
});
