/**
 * Notion API service for the CFO Worker.
 *
 * Reads:  Budget DB (vendor map for Claude), existing tx IDs (dedup)
 * Writes: Transactions DB (per-charge rows), Weekly Reports DB (summary page)
 *
 * The @notionhq/client is injected so tests can stub it without network.
 *
 * Property schema mirrors the design spec at
 * `CFO/specs/2026-05-14-notion-cfo-worker-design.md`.
 */

import { Client } from "@notionhq/client";
import type {
  AnalysisResult,
  Transaction,
  VendorEntry,
  VendorType,
} from "./types.js";

// ─── Tiny structural shape for Notion's untyped property bag ───────────────

interface NotionProperty {
  type: string;
  title?: Array<{ plain_text?: string }>;
  rich_text?: Array<{ plain_text?: string }>;
  select?: { name?: string } | null;
  number?: number | null;
  checkbox?: boolean;
  date?: { start?: string } | null;
}

interface NotionPage {
  id: string;
  properties: Record<string, NotionProperty>;
}

interface QueryResponse {
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
}

// ─── Per-transaction enrichment from Claude ────────────────────────────────

export interface TransactionEnrichment {
  category: string;
  type: VendorType;
  flag: "normal" | "spike" | "overage" | "unknown";
}

// ─── Service factory ───────────────────────────────────────────────────────

export interface NotionService {
  readBudgetDB(dbId: string): Promise<VendorEntry[]>;
  findExistingTransactionIds(dbId: string, candidateIds: string[]): Promise<Set<string>>;
  upsertTransactions(
    dbId: string,
    txns: Transaction[],
    weekStart: string,
    enrichments: Map<string, TransactionEnrichment>,
  ): Promise<{ created: number; skipped: number }>;
  createReportPage(
    dbId: string,
    analysis: AnalysisResult,
    cash: number,
    weekStart: string,
    weekEnd: string,
  ): Promise<string>;
  createFailureStub(dbId: string, reason: string, runDate: string): Promise<string>;
}

export interface NotionServiceOptions {
  apiKey?: string;
  client?: Client;
}

export function createNotionService(options: NotionServiceOptions): NotionService {
  const client = options.client ?? new Client({ auth: options.apiKey });

  return {
    readBudgetDB,
    findExistingTransactionIds,
    upsertTransactions,
    createReportPage,
    createFailureStub,
  };

  // ─── Reads ────────────────────────────────────────────────────────────────

  async function readBudgetDB(dbId: string): Promise<VendorEntry[]> {
    const pages = await queryAll(dbId, {});
    const entries: VendorEntry[] = [];
    for (const p of pages) {
      const vendor = readTitle(p.properties.Vendor);
      if (!vendor) continue;
      entries.push({
        vendor,
        type: (readSelect(p.properties.Type) as VendorType) ?? "FIXED",
        cap: readNumber(p.properties.Cap) ?? 0,
        category: readSelect(p.properties.Category) ?? "Uncategorized",
        isFreeTierWatch: p.properties["Free Tier Watch"]?.checkbox === true,
        rationale: readRichText(p.properties.Rationale) || undefined,
      });
    }
    return entries;
  }

  async function findExistingTransactionIds(
    dbId: string,
    candidateIds: string[],
  ): Promise<Set<string>> {
    if (candidateIds.length === 0) return new Set();
    // Notion query 'or' filter supports up to ~100 conditions; chunk if needed.
    const found = new Set<string>();
    const chunkSize = 100;
    for (let i = 0; i < candidateIds.length; i += chunkSize) {
      const chunk = candidateIds.slice(i, i + chunkSize);
      const pages = await queryAll(dbId, {
        filter: {
          or: chunk.map((id) => ({
            property: "Mercury ID",
            rich_text: { equals: id },
          })),
        },
      });
      for (const p of pages) {
        const id = readRichText(p.properties["Mercury ID"]);
        if (id) found.add(id);
      }
    }
    return found;
  }

  async function queryAll(
    dbId: string,
    baseQuery: Record<string, unknown>,
  ): Promise<NotionPage[]> {
    const all: NotionPage[] = [];
    let cursor: string | undefined;
    do {
      const res = (await (client as any).databases.query({
        database_id: dbId,
        ...baseQuery,
        ...(cursor ? { start_cursor: cursor } : {}),
      })) as QueryResponse;
      all.push(...res.results);
      cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
    } while (cursor);
    return all;
  }

  // ─── Writes ───────────────────────────────────────────────────────────────

  async function upsertTransactions(
    dbId: string,
    txns: Transaction[],
    weekStart: string,
    enrichments: Map<string, TransactionEnrichment>,
  ): Promise<{ created: number; skipped: number }> {
    const existing = await findExistingTransactionIds(
      dbId,
      txns.map((t) => t.mercuryId),
    );
    let created = 0;
    let skipped = 0;

    for (const tx of txns) {
      if (existing.has(tx.mercuryId)) {
        skipped++;
        continue;
      }
      const enrichment = enrichments.get(tx.mercuryId);
      const vendorName = tx.description || "Unknown";
      const properties: Record<string, unknown> = {
        Name: { title: [{ text: { content: `${vendorName} — ${tx.date}` } }] },
        Date: { date: { start: tx.date } },
        Vendor: { select: { name: vendorName.slice(0, 100) } },
        Description: { rich_text: [{ text: { content: tx.description } }] },
        Amount: { number: tx.amount },
        Category: enrichment?.category
          ? { select: { name: enrichment.category } }
          : { select: null },
        Type: enrichment?.type ? { select: { name: enrichment.type } } : { select: null },
        Flag: { select: { name: enrichment ? flagLabel(enrichment.flag) : "❓ unknown" } },
        "Mercury ID": { rich_text: [{ text: { content: tx.mercuryId } }] },
        Week: { date: { start: weekStart } },
        Account: { rich_text: [{ text: { content: tx.account } }] },
      };

      await (client as any).pages.create({
        parent: { database_id: dbId },
        properties,
      });
      created++;
    }

    return { created, skipped };
  }

  async function createReportPage(
    dbId: string,
    analysis: AnalysisResult,
    cash: number,
    weekStart: string,
    weekEnd: string,
  ): Promise<string> {
    const flagCount = analysis.overages.length + analysis.anomalies.length;
    const statusName = flagCount === 0 ? "✓ clean" : "⚠ flags";

    const properties: Record<string, unknown> = {
      Name: {
        title: [{ text: { content: `CFO Weekly — ${weekStart} → ${weekEnd}` } }],
      },
      Date: { date: { start: weekEnd } },
      Cash: { number: cash },
      "Runway (months)": { number: round(analysis.runwayMonths, 1) },
      "Weekly Burn": { number: round(analysis.weekBurn, 2) },
      "Flag Count": { number: flagCount },
      Status: { select: { name: statusName } },
    };

    const children = buildReportBlocks(analysis, cash);

    const res = (await (client as any).pages.create({
      parent: { database_id: dbId },
      properties,
      children,
    })) as { id: string };

    return res.id;
  }

  async function createFailureStub(
    dbId: string,
    reason: string,
    runDate: string,
  ): Promise<string> {
    const properties: Record<string, unknown> = {
      Name: {
        title: [{ text: { content: `CFO Weekly FAILED — ${runDate}` } }],
      },
      Date: { date: { start: runDate } },
      Status: { select: { name: "❌ failed" } },
      "Flag Count": { number: 0 },
    };
    const children = [
      paragraph(`Run failed at ${runDate}.`),
      paragraph(`Reason: ${reason}`),
    ];
    const res = (await (client as any).pages.create({
      parent: { database_id: dbId },
      properties,
      children,
    })) as { id: string };
    return res.id;
  }
}

// ─── Block builders ─────────────────────────────────────────────────────────

function buildReportBlocks(
  analysis: AnalysisResult,
  cash: number,
): Array<Record<string, unknown>> {
  const blocks: Array<Record<string, unknown>> = [];

  blocks.push(heading2("Headline"));
  blocks.push(paragraph(analysis.narrative));

  blocks.push(heading2("Numbers"));
  blocks.push(
    bullet(`Cash on hand: $${cash.toLocaleString()}`),
    bullet(`This week's burn: $${round(analysis.weekBurn, 2).toLocaleString()}`),
    bullet(`Monthly burn (4-wk avg): $${round(analysis.monthlyBurn, 2).toLocaleString()}`),
    bullet(`Runway: ${round(analysis.runwayMonths, 1)} months`),
  );

  if (analysis.overages.length > 0) {
    blocks.push(heading2("🔴 Overages"));
    for (const o of analysis.overages) {
      blocks.push(
        bullet(
          `${o.vendor}: $${round(o.mtd, 2)} MTD vs $${o.cap} cap (${Math.round(o.pct * 100)}%)`,
        ),
      );
    }
  }

  if (analysis.anomalies.length > 0) {
    blocks.push(heading2("⚠ Anomalies"));
    for (const a of analysis.anomalies) {
      const label = a.vendor ?? a.description ?? "Unknown";
      blocks.push(
        bullet(
          `[${a.type}] ${label}: $${round(a.amount, 2)} on ${a.date} — ${a.reason}`,
        ),
      );
    }
  }

  if (analysis.freeTierWatch.length > 0) {
    blocks.push(heading2("🆓 Free Tier Watch"));
    for (const f of analysis.freeTierWatch) {
      blocks.push(
        bullet(
          `${f.vendor}: ${f.status === "paid_breach" ? "🔴 PAID CHARGE" : "free"} (MTD $${round(f.mtd, 2)})`,
        ),
      );
    }
  }

  if (analysis.vendorTable.length > 0) {
    blocks.push(heading2("Vendor Burn Table"));
    for (const v of analysis.vendorTable) {
      blocks.push(
        bullet(
          `${v.vendor} (${v.type}): $${round(v.mtd, 2)} / $${v.cap} cap (${Math.round(v.pct * 100)}%) ${flagLabel(v.flag)}`,
        ),
      );
    }
  }

  return blocks;
}

// ─── Property + block helpers ───────────────────────────────────────────────

function readTitle(prop?: NotionProperty): string {
  return (prop?.title?.[0]?.plain_text ?? "").trim();
}

function readRichText(prop?: NotionProperty): string {
  if (!prop?.rich_text || prop.rich_text.length === 0) return "";
  return prop.rich_text.map((r) => r.plain_text ?? "").join("").trim();
}

function readSelect(prop?: NotionProperty): string | null {
  return prop?.select?.name ?? null;
}

function readNumber(prop?: NotionProperty): number | null {
  return typeof prop?.number === "number" ? prop.number : null;
}

function flagLabel(flag: "normal" | "spike" | "overage" | "unknown"): string {
  switch (flag) {
    case "normal":
      return "✓ normal";
    case "spike":
      return "⚠ spike";
    case "overage":
      return "🔴 overage";
    case "unknown":
      return "❓ unknown";
  }
}

function paragraph(text: string): Record<string, unknown> {
  return {
    object: "block",
    type: "paragraph",
    paragraph: { rich_text: [{ type: "text", text: { content: text } }] },
  };
}

function heading2(text: string): Record<string, unknown> {
  return {
    object: "block",
    type: "heading_2",
    heading_2: { rich_text: [{ type: "text", text: { content: text } }] },
  };
}

function bullet(text: string): Record<string, unknown> {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: { rich_text: [{ type: "text", text: { content: text } }] },
  };
}

function round(n: number, places: number): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}
