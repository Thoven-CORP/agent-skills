/**
 * One-time bootstrap.
 *
 * Creates the Notion workspace structure the Worker expects:
 *   📊 Thoven CFO   (parent page)
 *   ├── Budget       (database)
 *   ├── Transactions (database)
 *   └── Weekly Reports (database)
 *
 * Output: a `.env.local` snippet with the three database IDs, ready to paste
 * into ntn.config.ts env vars.
 *
 * Usage:
 *   NOTION_API_KEY=... NOTION_PARENT_PAGE_ID=... npm run bootstrap
 *
 * NOTION_PARENT_PAGE_ID is the page ID of a workspace page you've shared
 * with the integration (Notion UI: Share → Connect to integration).
 */

import { Client } from "@notionhq/client";

const parentPageId = process.env.NOTION_PARENT_PAGE_ID;
const apiKey = process.env.NOTION_API_KEY;

if (!apiKey || !parentPageId) {
  console.error(
    "Set NOTION_API_KEY and NOTION_PARENT_PAGE_ID env vars. Page must be shared with the integration.",
  );
  process.exit(1);
}

const notion = new Client({ auth: apiKey });

interface Schema {
  title: string;
  properties: Record<string, unknown>;
}

const BUDGET_SCHEMA: Schema = {
  title: "Budget",
  properties: {
    Vendor: { title: {} },
    Type: {
      select: {
        options: [
          { name: "FIXED", color: "blue" },
          { name: "USAGE", color: "purple" },
          { name: "STRATEGIC", color: "orange" },
          { name: "LUMPY", color: "yellow" },
        ],
      },
    },
    Cap: { number: { format: "dollar" } },
    Category: {
      select: {
        options: [
          { name: "Acquisition / Ads", color: "green" },
          { name: "Sales Tools", color: "pink" },
          { name: "AI Core Dev", color: "blue" },
          { name: "AI Exploration", color: "purple" },
          { name: "Infrastructure", color: "gray" },
          { name: "Workspace / Sales Tools", color: "default" },
          { name: "Operations", color: "brown" },
          { name: "Uncategorized", color: "red" },
        ],
      },
    },
    "Free Tier Watch": { checkbox: {} },
    Rationale: { rich_text: {} },
    "Last Updated": { date: {} },
  },
};

const TRANSACTIONS_SCHEMA: Schema = {
  title: "Transactions",
  properties: {
    Name: { title: {} },
    Date: { date: {} },
    Vendor: { select: { options: [] } },
    Description: { rich_text: {} },
    Amount: { number: { format: "dollar" } },
    Category: {
      select: {
        options: [
          { name: "Acquisition / Ads", color: "green" },
          { name: "Sales Tools", color: "pink" },
          { name: "AI Core Dev", color: "blue" },
          { name: "AI Exploration", color: "purple" },
          { name: "Infrastructure", color: "gray" },
          { name: "Workspace / Sales Tools", color: "default" },
          { name: "Operations", color: "brown" },
          { name: "Uncategorized", color: "red" },
        ],
      },
    },
    Type: {
      select: {
        options: [
          { name: "FIXED", color: "blue" },
          { name: "USAGE", color: "purple" },
          { name: "STRATEGIC", color: "orange" },
          { name: "LUMPY", color: "yellow" },
        ],
      },
    },
    Flag: {
      select: {
        options: [
          { name: "✓ normal", color: "green" },
          { name: "⚠ spike", color: "yellow" },
          { name: "🔴 overage", color: "red" },
          { name: "❓ unknown", color: "gray" },
        ],
      },
    },
    "Mercury ID": { rich_text: {} },
    Week: { date: {} },
    Account: { rich_text: {} },
  },
};

const REPORTS_SCHEMA: Schema = {
  title: "Weekly Reports",
  properties: {
    Name: { title: {} },
    Date: { date: {} },
    Cash: { number: { format: "dollar" } },
    "Runway (months)": { number: { format: "number" } },
    "Weekly Burn": { number: { format: "dollar" } },
    "Flag Count": { number: { format: "number" } },
    Status: {
      select: {
        options: [
          { name: "✓ clean", color: "green" },
          { name: "⚠ flags", color: "yellow" },
          { name: "❌ failed", color: "red" },
        ],
      },
    },
  },
};

async function createDatabase(schema: Schema): Promise<string> {
  const response = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId! },
    title: [{ type: "text", text: { content: schema.title } }],
    properties: schema.properties as never,
  });
  return response.id;
}

async function main() {
  console.log("Creating Budget DB…");
  const budgetId = await createDatabase(BUDGET_SCHEMA);
  console.log("Creating Transactions DB…");
  const txId = await createDatabase(TRANSACTIONS_SCHEMA);
  console.log("Creating Weekly Reports DB…");
  const reportsId = await createDatabase(REPORTS_SCHEMA);

  console.log("\nDone. Paste these into ntn.config.ts env vars:\n");
  console.log(`BUDGET_DB_ID=${budgetId}`);
  console.log(`TRANSACTIONS_DB_ID=${txId}`);
  console.log(`REPORTS_DB_ID=${reportsId}`);
}

main().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
