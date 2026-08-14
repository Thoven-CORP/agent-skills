import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MercuryAuthError,
  MercuryHttpError,
  createMercuryClient,
} from "../src/mercury.js";

const ACCOUNT_LIST_FIXTURE = {
  accounts: [
    { id: "acc_1", name: "Checking", availableBalance: 50000.5, currentBalance: 50100 },
    { id: "acc_2", name: "Savings", availableBalance: 0, currentBalance: 0 },
  ],
};

const TX_PAGE_1 = {
  total: 3,
  transactions: [
    {
      id: "tx_001",
      amount: -300, // outflow
      postedAt: "2026-05-12T10:00:00Z",
      createdAt: "2026-05-12T10:00:00Z",
      counterpartyName: "Anthropic",
      bankDescription: "ANTHROPIC.AI",
      accountId: "acc_1",
      status: "sent",
    },
    {
      id: "tx_002",
      amount: 1000, // inflow — should be filtered out
      postedAt: "2026-05-11T09:00:00Z",
      createdAt: "2026-05-11T09:00:00Z",
      counterpartyName: "Stripe Payouts",
      bankDescription: "STRIPE",
      accountId: "acc_1",
      status: "sent",
    },
    {
      id: "tx_003",
      amount: -45,
      postedAt: "2026-05-10T12:00:00Z",
      createdAt: "2026-05-10T12:00:00Z",
      counterpartyName: null, // bankDescription fallback
      bankDescription: "GITHUB",
      accountId: "acc_1",
      status: "sent",
    },
  ],
};

const TX_PENDING = {
  total: 1,
  transactions: [
    {
      id: "tx_004",
      amount: -88,
      postedAt: null,
      createdAt: "2026-05-13T08:00:00Z",
      counterpartyName: "Cloudflare",
      bankDescription: "CLOUDFLARE",
      accountId: "acc_1",
      status: "pending", // pending — must be excluded
    },
  ],
};

const TX_EMPTY = { total: 0, transactions: [] };

describe("mercury client", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("getCashBalance", () => {
    it("sums availableBalance across all accounts", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(ACCOUNT_LIST_FIXTURE), { status: 200 }),
      );
      const client = createMercuryClient({ apiKey: "test-key", fetch: fetchMock });

      const balance = await client.getCashBalance();

      expect(balance).toBe(50000.5);
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.mercury.com/api/v1/accounts",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-key",
            Accept: "application/json",
          }),
        }),
      );
    });

    it("returns 0 when account list is empty", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ accounts: [] }), { status: 200 }),
      );
      const client = createMercuryClient({ apiKey: "test-key", fetch: fetchMock });

      expect(await client.getCashBalance()).toBe(0);
    });

    it("throws MercuryAuthError on 401", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response("Unauthorized", { status: 401 }),
      );
      const client = createMercuryClient({ apiKey: "bad-key", fetch: fetchMock });

      await expect(client.getCashBalance()).rejects.toBeInstanceOf(MercuryAuthError);
    });

    it("throws MercuryHttpError on 5xx after retry", async () => {
      fetchMock
        .mockResolvedValueOnce(new Response("oops", { status: 503 }))
        .mockResolvedValueOnce(new Response("oops", { status: 503 }));
      const client = createMercuryClient({
        apiKey: "test-key",
        fetch: fetchMock,
        retryDelayMs: 0,
      });

      const promise = client.getCashBalance();
      await expect(promise).rejects.toBeInstanceOf(MercuryHttpError);
      expect(fetchMock).toHaveBeenCalledTimes(2); // one retry
    });

    it("recovers on second attempt after transient 502", async () => {
      fetchMock
        .mockResolvedValueOnce(new Response("bad gateway", { status: 502 }))
        .mockResolvedValueOnce(
          new Response(JSON.stringify(ACCOUNT_LIST_FIXTURE), { status: 200 }),
        );
      const client = createMercuryClient({
        apiKey: "test-key",
        fetch: fetchMock,
        retryDelayMs: 0,
      });

      expect(await client.getCashBalance()).toBe(50000.5);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("throws on malformed JSON", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response("not json {", { status: 200 }),
      );
      const client = createMercuryClient({ apiKey: "test-key", fetch: fetchMock });

      await expect(client.getCashBalance()).rejects.toThrow();
    });
  });

  describe("getTransactions", () => {
    it("returns only sent outflows, normalized", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(TX_PAGE_1), { status: 200 }),
      );
      const client = createMercuryClient({
        apiKey: "test-key",
        fetch: fetchMock,
        accountIds: ["acc_1"],
      });

      const txns = await client.getTransactions("2026-05-10", "2026-05-13");

      expect(txns).toHaveLength(2);
      expect(txns[0]).toEqual({
        mercuryId: "tx_001",
        date: "2026-05-12",
        description: "Anthropic",
        amount: 300, // absolute value
        account: "acc_1",
      });
      expect(txns[1]).toEqual({
        mercuryId: "tx_003",
        date: "2026-05-10",
        description: "GITHUB",
        amount: 45,
        account: "acc_1",
      });
    });

    it("filters pending transactions", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(TX_PENDING), { status: 200 }),
      );
      const client = createMercuryClient({
        apiKey: "test-key",
        fetch: fetchMock,
        accountIds: ["acc_1"],
      });

      const txns = await client.getTransactions("2026-05-10", "2026-05-13");
      expect(txns).toHaveLength(0);
    });

    it("aggregates across multiple accounts", async () => {
      fetchMock
        .mockResolvedValueOnce(
          new Response(JSON.stringify(TX_PAGE_1), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(TX_EMPTY), { status: 200 }),
        );
      const client = createMercuryClient({
        apiKey: "test-key",
        fetch: fetchMock,
        accountIds: ["acc_1", "acc_2"],
      });

      const txns = await client.getTransactions("2026-05-10", "2026-05-13");
      expect(txns).toHaveLength(2);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("auto-discovers accounts when accountIds not provided", async () => {
      fetchMock
        .mockResolvedValueOnce(
          new Response(JSON.stringify(ACCOUNT_LIST_FIXTURE), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(TX_PAGE_1), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(TX_EMPTY), { status: 200 }),
        );
      const client = createMercuryClient({ apiKey: "test-key", fetch: fetchMock });

      const txns = await client.getTransactions("2026-05-10", "2026-05-13");
      expect(txns).toHaveLength(2);
      expect(fetchMock.mock.calls[0]?.[0]).toContain("/accounts");
    });

    it("includes start and end as query params", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(TX_EMPTY), { status: 200 }),
      );
      const client = createMercuryClient({
        apiKey: "test-key",
        fetch: fetchMock,
        accountIds: ["acc_1"],
      });

      await client.getTransactions("2026-05-10", "2026-05-13");

      const url = fetchMock.mock.calls[0]?.[0] as string;
      expect(url).toContain("start=2026-05-10");
      expect(url).toContain("end=2026-05-13");
      expect(url).toContain("limit=500");
    });

    it("handles empty response (zero transactions)", async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(TX_EMPTY), { status: 200 }),
      );
      const client = createMercuryClient({
        apiKey: "test-key",
        fetch: fetchMock,
        accountIds: ["acc_1"],
      });

      expect(await client.getTransactions("2026-05-10", "2026-05-13")).toEqual([]);
    });

    it("throws auth error on 401", async () => {
      fetchMock.mockResolvedValueOnce(new Response("nope", { status: 401 }));
      const client = createMercuryClient({
        apiKey: "test-key",
        fetch: fetchMock,
        accountIds: ["acc_1"],
      });

      await expect(
        client.getTransactions("2026-05-10", "2026-05-13"),
      ).rejects.toBeInstanceOf(MercuryAuthError);
    });
  });
});
