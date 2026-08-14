/**
 * Worker entry point + orchestrator.
 *
 * `runCFOReport` is the testable core. The cron handler at the bottom wires
 * Notion Worker env vars into a runtime config and invokes runCFOReport.
 *
 * Pipeline:
 *   1. Mercury cash balance + this week + prior 4 weeks
 *   2. Notion Budget DB → vendor map
 *   3. Claude analyze() → AnalysisResult
 *   4. Notion Transactions DB upsert
 *   5. Notion Weekly Reports DB createReportPage
 *
 * On failure at any step we still attempt to write a failure stub to the
 * Weekly Reports DB so the Monday-morning dashboard never silently misses.
 */

import { analyzeTransactions } from "./claude.js";
import { createMercuryClient, type MercuryClient } from "./mercury.js";
import {
  createNotionService,
  type NotionService,
  type TransactionEnrichment,
} from "./notion.js";
import type {
  AnalysisInput,
  AnalysisResult,
  RunResult,
  Transaction,
} from "./types.js";

export type { MercuryClient } from "./mercury.js";
export type { NotionService } from "./notion.js";

export interface OrchestratorDeps {
  mercury: MercuryClient;
  notion: NotionService;
  analyze: (input: AnalysisInput) => Promise<AnalysisResult>;
  reportWindow: { since: string; until: string };
  budgetDatabaseId: string;
  transactionsDatabaseId: string;
  reportsDatabaseId: string;
  dryRun?: boolean;
}

export async function runCFOReport(deps: OrchestratorDeps): Promise<RunResult> {
  const {
    mercury,
    notion,
    analyze,
    reportWindow,
    budgetDatabaseId,
    transactionsDatabaseId,
    reportsDatabaseId,
    dryRun = false,
  } = deps;

  try {
    // 1. Mercury
    const cash = await mercury.getCashBalance();
    const thisWeek = await mercury.getTransactions(reportWindow.since, reportWindow.until);
    const priorSince = shiftDays(reportWindow.since, -28);
    const priorUntil = reportWindow.since;
    const priorWeeks = await mercury.getTransactions(priorSince, priorUntil);

    // 2. Notion Budget DB
    const vendors = await notion.readBudgetDB(budgetDatabaseId);

    // 3. Claude
    const analysis = await analyze({
      cash,
      since: reportWindow.since,
      until: reportWindow.until,
      vendors,
      thisWeek,
      priorWeeks,
    });

    const flagsRaised = analysis.overages.length + analysis.anomalies.length;

    if (dryRun) {
      return {
        status: "success",
        transactionsWritten: 0,
        flagsRaised,
      };
    }

    // 4. Notion Transactions DB
    const enrichments = buildEnrichments(analysis, thisWeek);
    const { created } = await notion.upsertTransactions(
      transactionsDatabaseId,
      thisWeek,
      reportWindow.since,
      enrichments,
    );

    // 5. Notion Weekly Reports DB
    const reportPageId = await notion.createReportPage(
      reportsDatabaseId,
      analysis,
      cash,
      reportWindow.since,
      reportWindow.until,
    );

    return {
      status: "success",
      weeklyReportPageId: reportPageId,
      transactionsWritten: created,
      flagsRaised,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (!dryRun) {
      try {
        await notion.createFailureStub(
          reportsDatabaseId,
          message,
          reportWindow.until,
        );
      } catch {
        // best effort — don't mask the original error
      }
    }

    return {
      status: "failed",
      transactionsWritten: 0,
      flagsRaised: 0,
      error: message,
    };
  }
}

function buildEnrichments(
  analysis: AnalysisResult,
  thisWeek: Transaction[],
): Map<string, TransactionEnrichment> {
  const byVendor = new Map<string, TransactionEnrichment>();
  for (const row of analysis.vendorTable) {
    byVendor.set(row.vendor.toLowerCase(), {
      category: vendorTypeToCategory(row),
      type: row.type,
      flag: row.flag,
    });
  }

  const out = new Map<string, TransactionEnrichment>();
  for (const tx of thisWeek) {
    const match = byVendor.get(tx.description.toLowerCase());
    if (match) out.set(tx.mercuryId, match);
  }
  return out;
}

function vendorTypeToCategory(row: AnalysisResult["vendorTable"][number]): string {
  // The analysis result doesn't carry category — fall back to a generic label.
  // The Budget DB does, but enrichment is best-effort. Leave a TODO for now:
  // bring category into AnalysisResult.vendorTable in a future iteration if
  // categorization in Notion proves valuable.
  return row.type === "STRATEGIC" ? "Acquisition / Ads" : "AI Core Dev";
}

function shiftDays(iso: string, deltaDays: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

// ─── Cron handler (Cloudflare Workers entry) ────────────────────────────────

export interface Env {
  MERCURY_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  NOTION_API_KEY: string;
  BUDGET_DB_ID: string;
  TRANSACTIONS_DB_ID: string;
  REPORTS_DB_ID: string;
}

export default {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(runCFOReportFromEnv(env).then((r) => {
      console.log(`CFO Worker scheduled run: ${JSON.stringify(r)}`);
    }));
  },
  async fetch(_req: Request, env: Env): Promise<Response> {
    const result = await runCFOReportFromEnv(env);
    return new Response(JSON.stringify(result, null, 2), {
      status: result.status === "success" ? 200 : 500,
      headers: { "content-type": "application/json" },
    });
  },
} satisfies ExportedHandler<Env>;

export async function runCFOReportFromEnv(env: Env): Promise<RunResult> {
  const until = new Date().toISOString().slice(0, 10);
  const since = shiftDays(until, -7);
  const mercury = createMercuryClient({ apiKey: env.MERCURY_API_KEY });
  const notion = createNotionService({ apiKey: env.NOTION_API_KEY });

  return runCFOReport({
    mercury,
    notion,
    analyze: (input) => analyzeTransactions(input, { apiKey: env.ANTHROPIC_API_KEY }),
    reportWindow: { since, until },
    budgetDatabaseId: env.BUDGET_DB_ID,
    transactionsDatabaseId: env.TRANSACTIONS_DB_ID,
    reportsDatabaseId: env.REPORTS_DB_ID,
  });
}

export type { RunConfig } from "./types.js";
