import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNotionService } from "../src/notion.js";
import type { AnalysisResult, Transaction } from "../src/types.js";

/**
 * We mock the @notionhq/client by passing in a stub `Client` constructor and
 * intercepting calls. notion.ts accepts a `client` factory so we can inject.
 */
function makeFakeClient() {
  return {
    databases: {
      query: vi.fn(),
    },
    pages: {
      create: vi.fn(),
      update: vi.fn(),
      retrieve: vi.fn(),
    },
    blocks: {
      children: {
        append: vi.fn(),
      },
    },
  };
}

const BUDGET_ROW_FIXTURE = {
  object: "page",
  id: "page_1",
  properties: {
    Vendor: { type: "title", title: [{ plain_text: "Anthropic" }] },
    Type: { type: "select", select: { name: "USAGE" } },
    Cap: { type: "number", number: 300 },
    Category: { type: "select", select: { name: "AI Core Dev" } },
    "Free Tier Watch": { type: "checkbox", checkbox: false },
    Rationale: {
      type: "rich_text",
      rich_text: [{ plain_text: "Deliberately tight cap" }],
    },
  },
};

const BUDGET_ROW_MINIMAL = {
  object: "page",
  id: "page_2",
  properties: {
    Vendor: { type: "title", title: [{ plain_text: "Google Cloud" }] },
    Type: { type: "select", select: { name: "USAGE" } },
    Cap: { type: "number", number: 15 },
    Category: { type: "select", select: { name: "Infrastructure" } },
    "Free Tier Watch": { type: "checkbox", checkbox: true },
    Rationale: { type: "rich_text", rich_text: [] }, // empty
  },
};

describe("notion service — reads", () => {
  let fake: ReturnType<typeof makeFakeClient>;

  beforeEach(() => {
    fake = makeFakeClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("readBudgetDB", () => {
    it("parses budget rows into VendorEntry[]", async () => {
      fake.databases.query.mockResolvedValueOnce({
        results: [BUDGET_ROW_FIXTURE, BUDGET_ROW_MINIMAL],
        has_more: false,
        next_cursor: null,
      });
      const svc = createNotionService({ client: fake as any });

      const vendors = await svc.readBudgetDB("budget_db_id");

      expect(vendors).toHaveLength(2);
      expect(vendors[0]).toEqual({
        vendor: "Anthropic",
        type: "USAGE",
        cap: 300,
        category: "AI Core Dev",
        isFreeTierWatch: false,
        rationale: "Deliberately tight cap",
      });
      expect(vendors[1].vendor).toBe("Google Cloud");
      expect(vendors[1].isFreeTierWatch).toBe(true);
      expect(vendors[1].rationale).toBeUndefined();
    });

    it("paginates through has_more cursors", async () => {
      fake.databases.query
        .mockResolvedValueOnce({
          results: [BUDGET_ROW_FIXTURE],
          has_more: true,
          next_cursor: "cursor_2",
        })
        .mockResolvedValueOnce({
          results: [BUDGET_ROW_MINIMAL],
          has_more: false,
          next_cursor: null,
        });
      const svc = createNotionService({ client: fake as any });

      const vendors = await svc.readBudgetDB("budget_db_id");

      expect(vendors).toHaveLength(2);
      expect(fake.databases.query).toHaveBeenCalledTimes(2);
      expect(fake.databases.query.mock.calls[1]?.[0]?.start_cursor).toBe("cursor_2");
    });

    it("skips rows missing vendor title", async () => {
      const broken = {
        ...BUDGET_ROW_FIXTURE,
        properties: { ...BUDGET_ROW_FIXTURE.properties, Vendor: { type: "title", title: [] } },
      };
      fake.databases.query.mockResolvedValueOnce({
        results: [broken, BUDGET_ROW_FIXTURE],
        has_more: false,
        next_cursor: null,
      });
      const svc = createNotionService({ client: fake as any });

      const vendors = await svc.readBudgetDB("budget_db_id");
      expect(vendors).toHaveLength(1);
      expect(vendors[0].vendor).toBe("Anthropic");
    });

    it("defaults missing type to FIXED and cap to 0", async () => {
      const sparse = {
        object: "page",
        id: "page_x",
        properties: {
          Vendor: { type: "title", title: [{ plain_text: "Mystery" }] },
          Type: { type: "select", select: null },
          Cap: { type: "number", number: null },
          Category: { type: "select", select: null },
          "Free Tier Watch": { type: "checkbox", checkbox: false },
          Rationale: { type: "rich_text", rich_text: [] },
        },
      };
      fake.databases.query.mockResolvedValueOnce({
        results: [sparse],
        has_more: false,
        next_cursor: null,
      });
      const svc = createNotionService({ client: fake as any });

      const vendors = await svc.readBudgetDB("budget_db_id");
      expect(vendors[0]).toEqual({
        vendor: "Mystery",
        type: "FIXED",
        cap: 0,
        category: "Uncategorized",
        isFreeTierWatch: false,
        rationale: undefined,
      });
    });
  });

  describe("findExistingTransactionIds", () => {
    it("returns mercury IDs already in the DB", async () => {
      fake.databases.query.mockResolvedValueOnce({
        results: [
          {
            id: "n_a",
            properties: {
              "Mercury ID": {
                type: "rich_text",
                rich_text: [{ plain_text: "tx_001" }],
              },
            },
          },
          {
            id: "n_b",
            properties: {
              "Mercury ID": {
                type: "rich_text",
                rich_text: [{ plain_text: "tx_002" }],
              },
            },
          },
        ],
        has_more: false,
        next_cursor: null,
      });
      const svc = createNotionService({ client: fake as any });

      const ids = await svc.findExistingTransactionIds("tx_db_id", ["tx_001", "tx_002", "tx_003"]);

      expect(ids).toEqual(new Set(["tx_001", "tx_002"]));
    });

    it("returns empty set when no candidates given", async () => {
      const svc = createNotionService({ client: fake as any });
      const ids = await svc.findExistingTransactionIds("tx_db_id", []);
      expect(ids.size).toBe(0);
      expect(fake.databases.query).not.toHaveBeenCalled();
    });
  });
});

describe("notion service — writes", () => {
  let fake: ReturnType<typeof makeFakeClient>;

  beforeEach(() => {
    fake = makeFakeClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("upsertTransactions", () => {
    const txns: Transaction[] = [
      {
        mercuryId: "tx_001",
        date: "2026-05-12",
        description: "Anthropic",
        amount: 300,
        account: "acc_1",
      },
      {
        mercuryId: "tx_002",
        date: "2026-05-11",
        description: "GitHub",
        amount: 12,
        account: "acc_1",
      },
    ];

    it("creates pages for new transactions only", async () => {
      // existing-IDs lookup returns tx_001 only
      fake.databases.query.mockResolvedValueOnce({
        results: [
          {
            id: "n_existing",
            properties: {
              "Mercury ID": {
                type: "rich_text",
                rich_text: [{ plain_text: "tx_001" }],
              },
            },
          },
        ],
        has_more: false,
        next_cursor: null,
      });
      fake.pages.create.mockResolvedValueOnce({ id: "new_page_a" });

      const svc = createNotionService({ client: fake as any });
      const result = await svc.upsertTransactions(
        "tx_db_id",
        txns,
        "2026-05-11", // week
        new Map([["tx_002", { category: "AI Core Dev", type: "FIXED", flag: "normal" }]]),
      );

      expect(result.created).toBe(1);
      expect(result.skipped).toBe(1);
      expect(fake.pages.create).toHaveBeenCalledTimes(1);

      const call = fake.pages.create.mock.calls[0]?.[0];
      expect(call.parent.database_id).toBe("tx_db_id");
      expect(call.properties["Mercury ID"].rich_text[0].text.content).toBe("tx_002");
      expect(call.properties.Amount.number).toBe(12);
      expect(call.properties.Vendor.select.name).toBe("GitHub");
    });

    it("idempotent — second run with same data inserts nothing", async () => {
      fake.databases.query.mockResolvedValueOnce({
        results: [
          {
            id: "n1",
            properties: {
              "Mercury ID": { type: "rich_text", rich_text: [{ plain_text: "tx_001" }] },
            },
          },
          {
            id: "n2",
            properties: {
              "Mercury ID": { type: "rich_text", rich_text: [{ plain_text: "tx_002" }] },
            },
          },
        ],
        has_more: false,
        next_cursor: null,
      });

      const svc = createNotionService({ client: fake as any });
      const result = await svc.upsertTransactions("tx_db_id", txns, "2026-05-11", new Map());

      expect(result.created).toBe(0);
      expect(result.skipped).toBe(2);
      expect(fake.pages.create).not.toHaveBeenCalled();
    });
  });

  describe("createReportPage", () => {
    const analysis: AnalysisResult = {
      weekBurn: 450.5,
      monthlyBurn: 1700,
      runwayMonths: 29.4,
      overages: [{ vendor: "Anthropic", mtd: 320, cap: 300, pct: 1.07 }],
      anomalies: [
        {
          type: "unknown_vendor",
          description: "BIG_UNKNOWN_CO",
          amount: 90,
          date: "2026-05-12",
          reason: "Not in budget DB",
        },
      ],
      vendorTable: [],
      freeTierWatch: [
        { vendor: "Cloudflare", status: "free", mtd: 0 },
      ],
      narrative: "Spend on pace. One overage flagged: Anthropic at 107% of cap.",
    };

    it("creates a Weekly Reports page with correct properties", async () => {
      fake.pages.create.mockResolvedValueOnce({ id: "report_page_a" });

      const svc = createNotionService({ client: fake as any });
      const pageId = await svc.createReportPage(
        "reports_db_id",
        analysis,
        50000,
        "2026-05-07",
        "2026-05-13",
      );

      expect(pageId).toBe("report_page_a");
      const call = fake.pages.create.mock.calls[0]?.[0];
      expect(call.parent.database_id).toBe("reports_db_id");
      expect(call.properties.Cash.number).toBe(50000);
      expect(call.properties["Weekly Burn"].number).toBe(450.5);
      expect(call.properties["Runway (months)"].number).toBe(29.4);
      expect(call.properties["Flag Count"].number).toBe(2); // 1 overage + 1 anomaly
      expect(call.properties.Status.select.name).toBe("⚠ flags");
      expect(call.children.length).toBeGreaterThan(0);
    });

    it("status is clean when no flags", async () => {
      fake.pages.create.mockResolvedValueOnce({ id: "report_page_b" });
      const clean: AnalysisResult = {
        ...analysis,
        overages: [],
        anomalies: [],
      };
      const svc = createNotionService({ client: fake as any });
      await svc.createReportPage("reports_db_id", clean, 50000, "2026-05-07", "2026-05-13");

      const call = fake.pages.create.mock.calls[0]?.[0];
      expect(call.properties.Status.select.name).toBe("✓ clean");
      expect(call.properties["Flag Count"].number).toBe(0);
    });
  });

  describe("createFailureStub", () => {
    it("writes a failure report page with error detail", async () => {
      fake.pages.create.mockResolvedValueOnce({ id: "fail_page" });
      const svc = createNotionService({ client: fake as any });

      const id = await svc.createFailureStub(
        "reports_db_id",
        "Mercury API timeout",
        "2026-05-13",
      );

      expect(id).toBe("fail_page");
      const call = fake.pages.create.mock.calls[0]?.[0];
      expect(call.properties.Status.select.name).toBe("❌ failed");
      expect(JSON.stringify(call.children)).toContain("Mercury API timeout");
    });
  });
});
