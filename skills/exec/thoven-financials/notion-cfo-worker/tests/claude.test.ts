import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeTransactions, buildAnalysisPrompt } from "../src/claude.js";
import type { Transaction, VendorEntry } from "../src/types.js";

const VENDORS: VendorEntry[] = [
  {
    vendor: "Anthropic",
    type: "USAGE",
    cap: 300,
    category: "AI Core Dev",
    isFreeTierWatch: false,
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
  },
];

const WEEK_TXNS: Transaction[] = [
  {
    mercuryId: "tx_1",
    date: "2026-05-12",
    description: "Anthropic",
    amount: 100,
    account: "acc_1",
  },
];

const PRIOR_TXNS: Transaction[] = [
  {
    mercuryId: "p_1",
    date: "2026-04-15",
    description: "Anthropic",
    amount: 250,
    account: "acc_1",
  },
  {
    mercuryId: "p_2",
    date: "2026-04-08",
    description: "GitHub",
    amount: 12,
    account: "acc_1",
  },
];

const VALID_ANALYSIS = {
  weekBurn: 100,
  monthlyBurn: 1700,
  runwayMonths: 29.4,
  overages: [],
  anomalies: [],
  vendorTable: [
    { vendor: "Anthropic", type: "USAGE", mtd: 100, cap: 300, pct: 0.33, flag: "normal" },
  ],
  freeTierWatch: [{ vendor: "Cloudflare", status: "free", mtd: 0 }],
  narrative: "Spend on track. No flags this week.",
};

function makeMockAnthropic(responseText: string) {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: responseText }],
      }),
    },
  };
}

describe("buildAnalysisPrompt", () => {
  it("includes cash, vendor budget, this-week, and prior-4w sections", () => {
    const prompt = buildAnalysisPrompt({
      cash: 50000,
      since: "2026-05-07",
      until: "2026-05-13",
      vendors: VENDORS,
      thisWeek: WEEK_TXNS,
      priorWeeks: PRIOR_TXNS,
    });

    expect(prompt).toContain("Cash on hand: $50000");
    expect(prompt).toContain("2026-05-07");
    expect(prompt).toContain("2026-05-13");
    expect(prompt).toContain("Anthropic");
    expect(prompt).toContain("GitHub");
    expect(prompt).toContain("tx_1");
    expect(prompt).toContain("p_1");
  });

  it("explicitly instructs JSON-only output", () => {
    const prompt = buildAnalysisPrompt({
      cash: 0,
      since: "2026-05-07",
      until: "2026-05-13",
      vendors: [],
      thisWeek: [],
      priorWeeks: [],
    });
    expect(prompt.toLowerCase()).toContain("json");
  });
});

describe("analyzeTransactions", () => {
  let mockAnthropic: ReturnType<typeof makeMockAnthropic>;

  beforeEach(() => {
    mockAnthropic = makeMockAnthropic(JSON.stringify(VALID_ANALYSIS));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed AnalysisResult on valid response", async () => {
    const result = await analyzeTransactions(
      {
        cash: 50000,
        since: "2026-05-07",
        until: "2026-05-13",
        vendors: VENDORS,
        thisWeek: WEEK_TXNS,
        priorWeeks: PRIOR_TXNS,
      },
      { client: mockAnthropic as any },
    );

    expect(result.weekBurn).toBe(100);
    expect(result.runwayMonths).toBe(29.4);
    expect(result.narrative).toContain("Spend on track");
    expect(result.vendorTable).toHaveLength(1);
  });

  it("extracts JSON when wrapped in markdown fences", async () => {
    const wrapped = "```json\n" + JSON.stringify(VALID_ANALYSIS) + "\n```";
    mockAnthropic = makeMockAnthropic(wrapped);

    const result = await analyzeTransactions(
      {
        cash: 50000,
        since: "2026-05-07",
        until: "2026-05-13",
        vendors: VENDORS,
        thisWeek: WEEK_TXNS,
        priorWeeks: PRIOR_TXNS,
      },
      { client: mockAnthropic as any },
    );

    expect(result.weekBurn).toBe(100);
  });

  it("throws when response is not JSON", async () => {
    mockAnthropic = makeMockAnthropic("I cannot do this analysis.");

    await expect(
      analyzeTransactions(
        {
          cash: 50000,
          since: "2026-05-07",
          until: "2026-05-13",
          vendors: VENDORS,
          thisWeek: WEEK_TXNS,
          priorWeeks: PRIOR_TXNS,
        },
        { client: mockAnthropic as any },
      ),
    ).rejects.toThrow(/parse|json/i);
  });

  it("throws when result is missing required fields", async () => {
    mockAnthropic = makeMockAnthropic(JSON.stringify({ weekBurn: 100 }));

    await expect(
      analyzeTransactions(
        {
          cash: 50000,
          since: "2026-05-07",
          until: "2026-05-13",
          vendors: VENDORS,
          thisWeek: WEEK_TXNS,
          priorWeeks: PRIOR_TXNS,
        },
        { client: mockAnthropic as any },
      ),
    ).rejects.toThrow(/schema|missing|invalid/i);
  });

  it("calls Anthropic with sonnet model and low temp", async () => {
    await analyzeTransactions(
      {
        cash: 50000,
        since: "2026-05-07",
        until: "2026-05-13",
        vendors: VENDORS,
        thisWeek: WEEK_TXNS,
        priorWeeks: PRIOR_TXNS,
      },
      { client: mockAnthropic as any },
    );

    const call = mockAnthropic.messages.create.mock.calls[0]?.[0];
    expect(call.model).toMatch(/sonnet/);
    expect(call.max_tokens).toBeGreaterThan(0);
    expect(call.messages).toHaveLength(1);
    expect(call.messages[0].role).toBe("user");
  });

  it("handles non-text content blocks gracefully", async () => {
    mockAnthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            { type: "tool_use", id: "x", name: "y", input: {} },
            { type: "text", text: JSON.stringify(VALID_ANALYSIS) },
          ],
        }),
      },
    };

    const result = await analyzeTransactions(
      {
        cash: 50000,
        since: "2026-05-07",
        until: "2026-05-13",
        vendors: VENDORS,
        thisWeek: WEEK_TXNS,
        priorWeeks: PRIOR_TXNS,
      },
      { client: mockAnthropic as any },
    );

    expect(result.weekBurn).toBe(100);
  });
});
