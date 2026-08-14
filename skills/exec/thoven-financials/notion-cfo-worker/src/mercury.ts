/**
 * Mercury REST API client.
 *
 * Docs: https://docs.mercury.com/reference
 * Auth: Bearer token (Mercury Settings → Developer → API Token)
 *
 * Endpoints used:
 *   GET /accounts                                  — list accounts
 *   GET /account/{accountId}/transactions          — list transactions
 *
 * Outflows have negative `amount`; inflows are positive. We return absolute
 * outflow amounts only, since the CFO report tracks burn.
 */

import type { Transaction } from "./types.js";

const BASE_URL = "https://api.mercury.com/api/v1";

export class MercuryAuthError extends Error {
  constructor(message = "Mercury API auth failed") {
    super(message);
    this.name = "MercuryAuthError";
  }
}

export class MercuryHttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "MercuryHttpError";
  }
}

export interface MercuryClient {
  getCashBalance(): Promise<number>;
  getTransactions(since: string, until: string): Promise<Transaction[]>;
}

export interface MercuryClientOptions {
  apiKey: string;
  /** Optional. When omitted, the client fetches accounts on first transactions call. */
  accountIds?: string[];
  /** Injected for testing. Defaults to global fetch. */
  fetch?: typeof fetch;
  /** Retry once on 5xx after this delay. Default 250ms. */
  retryDelayMs?: number;
}

interface RawAccount {
  id: string;
  name?: string;
  availableBalance?: number;
  currentBalance?: number;
}

interface RawTransaction {
  id: string;
  amount: number;
  postedAt: string | null;
  createdAt: string | null;
  counterpartyName: string | null;
  bankDescription: string | null;
  accountId: string;
  status: string;
}

export function createMercuryClient(options: MercuryClientOptions): MercuryClient {
  const fetchFn = options.fetch ?? globalThis.fetch;
  const retryDelayMs = options.retryDelayMs ?? 250;

  if (!fetchFn) {
    throw new Error("fetch is not available — pass options.fetch or run on Node 18+");
  }

  async function request<T>(path: string): Promise<T> {
    const url = `${BASE_URL}${path}`;
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt++) {
      let response: Response;
      try {
        response = await fetchFn(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${options.apiKey}`,
            Accept: "application/json",
          },
        });
      } catch (err) {
        lastError = err;
        if (attempt === 0) {
          await sleep(retryDelayMs);
          continue;
        }
        throw err;
      }

      if (response.status === 401 || response.status === 403) {
        throw new MercuryAuthError(`Mercury auth failed (${response.status})`);
      }

      if (response.status >= 500) {
        lastError = new MercuryHttpError(
          response.status,
          `Mercury 5xx: ${response.status}`,
        );
        if (attempt === 0) {
          await sleep(retryDelayMs);
          continue;
        }
        throw lastError;
      }

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new MercuryHttpError(
          response.status,
          `Mercury ${response.status}: ${body.slice(0, 200)}`,
        );
      }

      const text = await response.text();
      return JSON.parse(text) as T;
    }

    throw lastError ?? new Error("Mercury request failed without details");
  }

  async function getAccountIds(): Promise<string[]> {
    if (options.accountIds && options.accountIds.length > 0) {
      return options.accountIds;
    }
    const data = await request<{ accounts: RawAccount[] }>("/accounts");
    return data.accounts.map((a) => a.id);
  }

  return {
    async getCashBalance() {
      const data = await request<{ accounts: RawAccount[] }>("/accounts");
      return data.accounts.reduce(
        (sum, a) => sum + (Number(a.availableBalance) || 0),
        0,
      );
    },

    async getTransactions(since: string, until: string) {
      const accountIds = await getAccountIds();
      const all: Transaction[] = [];

      for (const accountId of accountIds) {
        const data = await request<{ transactions: RawTransaction[] }>(
          `/account/${accountId}/transactions?start=${since}&end=${until}&limit=500`,
        );
        for (const raw of data.transactions ?? []) {
          if (raw.amount >= 0) continue; // inflow — skip
          if (raw.status !== "sent") continue; // only posted/sent
          const isoDate = (raw.postedAt ?? raw.createdAt ?? "").slice(0, 10);
          if (!isoDate) continue;
          all.push({
            mercuryId: raw.id,
            date: isoDate,
            description: (raw.counterpartyName ?? raw.bankDescription ?? "").trim(),
            amount: Math.abs(raw.amount),
            account: raw.accountId,
          });
        }
      }

      return all;
    },
  };
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}
