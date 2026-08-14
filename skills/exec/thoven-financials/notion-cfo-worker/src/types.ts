/**
 * Shared type definitions for the Notion CFO Worker.
 *
 * Boundary contracts live here so Mercury client, Notion client, Claude
 * analyzer, and the orchestrator all agree on shape without re-deriving
 * fields from each other's modules.
 */

// ─── Vendor budget (mirrors Notion Budget DB) ──────────────────────────────

export type VendorType = "FIXED" | "USAGE" | "STRATEGIC" | "LUMPY";

export interface VendorEntry {
  vendor: string;
  type: VendorType;
  cap: number;
  category: string;
  isFreeTierWatch: boolean;
  rationale?: string;
}

// ─── Bank transactions (Mercury) ───────────────────────────────────────────

export interface Transaction {
  mercuryId: string;
  date: string; // ISO 8601 yyyy-mm-dd
  description: string; // counterpartyName preferred, bankDescription fallback
  amount: number; // absolute value, USD outflow
  account: string;
}

// ─── Claude analysis output ────────────────────────────────────────────────

export type TransactionFlag = "normal" | "spike" | "overage" | "unknown";

export interface Overage {
  vendor: string;
  mtd: number;
  cap: number;
  pct: number; // 1.0 = at cap
}

export interface Anomaly {
  type: "spike" | "unknown_vendor" | "first_paid_charge" | "other";
  vendor?: string;
  description?: string;
  amount: number;
  date: string;
  reason: string;
}

export interface VendorRow {
  vendor: string;
  type: VendorType;
  mtd: number;
  cap: number;
  pct: number;
  flag: TransactionFlag;
}

export interface FreeTierEntry {
  vendor: string;
  status: "free" | "paid_breach";
  mtd: number;
}

export interface AnalysisResult {
  weekBurn: number;
  monthlyBurn: number; // average from prior4Weeks
  runwayMonths: number;
  overages: Overage[];
  anomalies: Anomaly[];
  vendorTable: VendorRow[];
  freeTierWatch: FreeTierEntry[];
  narrative: string; // 2–3 sentence plain English summary
}

// ─── Claude analyzer input ─────────────────────────────────────────────────

export interface AnalysisInput {
  cash: number;
  since: string;
  until: string;
  vendors: VendorEntry[];
  thisWeek: Transaction[];
  priorWeeks: Transaction[];
}

// ─── Orchestration ─────────────────────────────────────────────────────────

export interface RunConfig {
  mercuryApiKey: string;
  anthropicApiKey: string;
  notionApiKey: string;
  budgetDatabaseId: string;
  transactionsDatabaseId: string;
  reportsDatabaseId: string;
  dashboardPageId?: string;
  reportWindow: { since: string; until: string };
  dryRun?: boolean;
}

export interface RunResult {
  status: "success" | "failed";
  weeklyReportPageId?: string;
  transactionsWritten: number;
  flagsRaised: number;
  error?: string;
}
