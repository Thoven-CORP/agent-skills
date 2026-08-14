/**
 * Claude analyzer.
 *
 * Replaces the prior Python regex pipeline. Given raw transactions, a vendor
 * map from Notion, and cash balance, asks Claude (Sonnet) for a fully
 * structured AnalysisResult. Claude handles vendor matching, anomaly
 * detection, monthly-sub renewal recognition, and narrative generation.
 *
 * Output contract: STRICT JSON matching AnalysisResult. We parse, validate
 * required fields, and throw on schema violations so the orchestrator can
 * write a failure stub to Notion.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  AnalysisInput,
  AnalysisResult,
} from "./types.js";

const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 4096;

export interface AnalyzeOptions {
  apiKey?: string;
  client?: Anthropic;
  model?: string;
}

export async function analyzeTransactions(
  input: AnalysisInput,
  options: AnalyzeOptions = {},
): Promise<AnalysisResult> {
  const client = options.client ?? new Anthropic({ apiKey: options.apiKey });
  const model = options.model ?? MODEL;

  const userPrompt = buildAnalysisPrompt(input);

  const response = await (client as any).messages.create({
    model,
    max_tokens: MAX_TOKENS,
    temperature: 0.2,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = extractText(response);
  const json = parseJsonFromText(text);
  return validateAnalysis(json);
}

const SYSTEM_PROMPT = `You are the CFO analyst for Thoven, a pre-seed music education startup.

Your job: analyze weekly Mercury bank transactions against a vendor budget.

Return ONLY valid JSON matching this TypeScript shape — no prose, no markdown fences, no commentary outside the JSON:

{
  "weekBurn": number,          // total outflow this week, USD
  "monthlyBurn": number,       // (sum of prior4Weeks) — historical baseline
  "runwayMonths": number,      // cash / (monthlyBurn || 1)
  "overages": [
    { "vendor": string, "mtd": number, "cap": number, "pct": number }
  ],
  "anomalies": [
    {
      "type": "spike" | "unknown_vendor" | "first_paid_charge" | "other",
      "vendor": string | null,
      "description": string | null,
      "amount": number,
      "date": string,
      "reason": string
    }
  ],
  "vendorTable": [
    { "vendor": string, "type": "FIXED"|"USAGE"|"STRATEGIC"|"LUMPY", "mtd": number, "cap": number, "pct": number, "flag": "normal"|"spike"|"overage"|"unknown" }
  ],
  "freeTierWatch": [
    { "vendor": string, "status": "free" | "paid_breach", "mtd": number }
  ],
  "narrative": string          // 2–3 sentences, plain English
}

Analysis rules:
- Match each transaction to the closest vendor in the budget by description. Use fuzzy reasoning, not exact match.
- "Anthropic", "ANTHROPIC.AI", "anthropic, inc" → all map to vendor "Anthropic".
- Unknown vendor (no reasonable match in budget) → add to anomalies with type "unknown_vendor".
- Spike: this week's single charge is > 2x the vendor's typical per-transaction amount in priorWeeks, UNLESS it matches a prior same-amount charge within 60 days (that's a monthly subscription renewal — NOT a spike).
- Overage: vendor's month-to-date total exceeds cap. Compute MTD by including everything this week + everything in priorWeeks where date is in the same calendar month as 'until'.
- Vendor with cap == 0 means "not budgeted / cancelled". Any charge to this vendor is an anomaly (type "unknown_vendor" with reason explaining cap is 0), unless type is LUMPY (then it's expected per-event).
- Free tier watch: if a vendor has isFreeTierWatch=true and has any non-zero charge MTD, add to freeTierWatch with status "paid_breach".
- runwayMonths = cash / monthlyBurn. If monthlyBurn is 0, use 999.
- All currency values in USD, no symbols.`;

export function buildAnalysisPrompt(input: AnalysisInput): string {
  const vendorsBlock = JSON.stringify(input.vendors, null, 2);
  const thisWeekBlock = JSON.stringify(input.thisWeek, null, 2);
  const priorBlock = JSON.stringify(input.priorWeeks, null, 2);
  return `Cash on hand: $${input.cash}
Report window: ${input.since} to ${input.until}

VENDOR BUDGET (from Notion):
${vendorsBlock}

THIS WEEK'S TRANSACTIONS:
${thisWeekBlock}

PRIOR 4 WEEKS (baseline):
${priorBlock}

Return AnalysisResult JSON only.`;
}

// ─── Response parsing ──────────────────────────────────────────────────────

function extractText(response: { content: Array<{ type: string; text?: string }> }): string {
  const textBlocks = (response.content ?? []).filter((b) => b.type === "text");
  return textBlocks.map((b) => b.text ?? "").join("\n").trim();
}

function parseJsonFromText(text: string): unknown {
  if (!text) {
    throw new Error("Claude returned empty content — cannot parse JSON");
  }
  // Strip markdown code fences if Claude added them
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = fenced ? fenced[1] : text;

  // Find first { and last } as a fallback to peel any stray prose
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Could not parse JSON from Claude response");
  }
  const slice = candidate.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch (err) {
    throw new Error(`Failed to parse JSON from Claude: ${(err as Error).message}`);
  }
}

function validateAnalysis(value: unknown): AnalysisResult {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid schema: analysis result is not an object");
  }
  const v = value as Record<string, unknown>;
  const requiredNumberKeys = ["weekBurn", "monthlyBurn", "runwayMonths"];
  for (const k of requiredNumberKeys) {
    if (typeof v[k] !== "number") {
      throw new Error(`Invalid schema: missing or non-numeric field "${k}"`);
    }
  }
  const requiredArrayKeys = ["overages", "anomalies", "vendorTable", "freeTierWatch"];
  for (const k of requiredArrayKeys) {
    if (!Array.isArray(v[k])) {
      throw new Error(`Invalid schema: missing or non-array field "${k}"`);
    }
  }
  if (typeof v.narrative !== "string") {
    throw new Error(`Invalid schema: missing or non-string field "narrative"`);
  }
  return v as unknown as AnalysisResult;
}
