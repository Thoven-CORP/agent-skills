import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCFOReport } from "../src/index.js";
import type { AnalysisResult } from "../src/types.js";

const VENDORS = [
  {
    vendor: "Anthropic",
    type: "USAGE" as const,
    cap: 300,
    category: "AI Core Dev",
    isFreeTierWatch: false,
  },
];

const THIS_WEEK_TXNS = [
  {
    mercuryId: "tx_a",
    date: "2026-05-12",
    description: "Anthropic",
    amount: 100,
    account: "acc_1",
  },
];

const PRIOR_TXNS = [
  {
    mercuryId: "tx_p",
    date: "2026-04-15",
    description: "Anthropic",
    amount: 250,
    account: "acc_1",
  },
];

const FAKE_ANALYSIS: AnalysisResult = {
  weekBurn: 100,
  monthlyBurn: 1700,
  runwayMonths: 29.4,
  overages: [],
  anomalies: [],
  vendorTable: [
    { vendor: "Anthropic", type: "USAGE", mtd: 100, cap: 300, pct: 0.33, flag: "normal" },
  ],
  freeTierWatch: [],
  narrative: "All good.",
};

function makeStubs() {
  return {
    mercury: {
      getCashBalance: vi.fn().mockResolvedValue(50000),
      getTransactions: vi.fn(),
    },
    notion: {
      readBudgetDB: vi.fn().mockResolvedValue(VENDORS),
      findExistingTransactionIds: vi.fn().mockResolvedValue(new Set()),
      upsertTransactions: vi.fn().mockResolvedValue({ created: 1, skipped: 0 }),
      createReportPage: vi.fn().mockResolvedValue("report_page_id"),
      createFailureStub: vi.fn().mockResolvedValue("fail_page_id"),
    },
    analyze: vi.fn().mockResolvedValue(FAKE_ANALYSIS),
  };
}

describe("runCFOReport (orchestrator)", () => {
  let stubs: ReturnType<typeof makeStubs>;

  beforeEach(() => {
    stubs = makeStubs();
    stubs.mercury.getTransactions
      .mockResolvedValueOnce(THIS_WEEK_TXNS) // this week call
      .mockResolvedValueOnce(PRIOR_TXNS); // prior 4 weeks call
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("end-to-end happy path returns success with page ID", async () => {
    const result = await runCFOReport({
      mercury: stubs.mercury,
      notion: stubs.notion,
      analyze: stubs.analyze,
      reportWindow: { since: "2026-05-07", until: "2026-05-13" },
      budgetDatabaseId: "budget_db",
      transactionsDatabaseId: "tx_db",
      reportsDatabaseId: "reports_db",
    });

    expect(result.status).toBe("success");
    expect(result.weeklyReportPageId).toBe("report_page_id");
    expect(result.transactionsWritten).toBe(1);
    expect(result.flagsRaised).toBe(0);
    expect(stubs.notion.createReportPage).toHaveBeenCalledOnce();
    expect(stubs.notion.upsertTransactions).toHaveBeenCalledOnce();
  });

  it("calls mercury twice — this week + prior 4 weeks", async () => {
    await runCFOReport({
      mercury: stubs.mercury,
      notion: stubs.notion,
      analyze: stubs.analyze,
      reportWindow: { since: "2026-05-07", until: "2026-05-13" },
      budgetDatabaseId: "budget_db",
      transactionsDatabaseId: "tx_db",
      reportsDatabaseId: "reports_db",
    });

    expect(stubs.mercury.getTransactions).toHaveBeenCalledTimes(2);
    const [first, second] = stubs.mercury.getTransactions.mock.calls;
    expect(first?.[0]).toBe("2026-05-07");
    expect(first?.[1]).toBe("2026-05-13");
    // prior window is 4 weeks before since
    expect(second?.[1]).toBe("2026-05-07");
  });

  it("counts flags as overages + anomalies", async () => {
    stubs.analyze = vi.fn().mockResolvedValue({
      ...FAKE_ANALYSIS,
      overages: [{ vendor: "Anthropic", mtd: 320, cap: 300, pct: 1.07 }],
      anomalies: [
        { type: "spike", vendor: "GitHub", amount: 50, date: "2026-05-12", reason: "3x typical" },
      ],
    });

    const result = await runCFOReport({
      mercury: stubs.mercury,
      notion: stubs.notion,
      analyze: stubs.analyze,
      reportWindow: { since: "2026-05-07", until: "2026-05-13" },
      budgetDatabaseId: "budget_db",
      transactionsDatabaseId: "tx_db",
      reportsDatabaseId: "reports_db",
    });

    expect(result.flagsRaised).toBe(2);
  });

  it("on Mercury failure writes a failure stub and returns failed status", async () => {
    stubs.mercury.getTransactions = vi.fn().mockRejectedValueOnce(new Error("Mercury 500"));
    // cash call will still hit — replace separately
    stubs.mercury.getCashBalance = vi.fn().mockResolvedValue(50000);

    const result = await runCFOReport({
      mercury: stubs.mercury,
      notion: stubs.notion,
      analyze: stubs.analyze,
      reportWindow: { since: "2026-05-07", until: "2026-05-13" },
      budgetDatabaseId: "budget_db",
      transactionsDatabaseId: "tx_db",
      reportsDatabaseId: "reports_db",
    });

    expect(result.status).toBe("failed");
    expect(result.error).toContain("Mercury 500");
    expect(stubs.notion.createFailureStub).toHaveBeenCalledOnce();
  });

  it("dry-run skips Notion writes", async () => {
    const result = await runCFOReport({
      mercury: stubs.mercury,
      notion: stubs.notion,
      analyze: stubs.analyze,
      reportWindow: { since: "2026-05-07", until: "2026-05-13" },
      budgetDatabaseId: "budget_db",
      transactionsDatabaseId: "tx_db",
      reportsDatabaseId: "reports_db",
      dryRun: true,
    });

    expect(result.status).toBe("success");
    expect(stubs.notion.upsertTransactions).not.toHaveBeenCalled();
    expect(stubs.notion.createReportPage).not.toHaveBeenCalled();
  });

  it("passes Claude vendorTable enrichments to upsertTransactions", async () => {
    await runCFOReport({
      mercury: stubs.mercury,
      notion: stubs.notion,
      analyze: stubs.analyze,
      reportWindow: { since: "2026-05-07", until: "2026-05-13" },
      budgetDatabaseId: "budget_db",
      transactionsDatabaseId: "tx_db",
      reportsDatabaseId: "reports_db",
    });

    const [, txns, weekStart, enrichments] = stubs.notion.upsertTransactions.mock.calls[0] ?? [];
    expect(txns).toEqual(THIS_WEEK_TXNS);
    expect(weekStart).toBe("2026-05-07");
    expect(enrichments).toBeInstanceOf(Map);
  });
});
