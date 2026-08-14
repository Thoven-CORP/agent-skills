#!/usr/bin/env python3
"""Parse a Notion API-query-data-source results JSON into per-prospect send data.

Usage:
    python parse_crm_drafts.py <results.json> [--names "Nic Borg,Avraham Kadar,..."]

Input: the JSON body returned by mcp__notion__API-query-data-source (or the
tool-results file it spills to when the payload exceeds the token cap).

Output (stdout, JSON): { "<Name>": {page_id, linkedin_url, email, contact, paste_body} }
- linkedin_url: pulled from the draft's "[Sources: linkedin.com/in/... ]" footer
  (the structured LinkedIn field is usually empty), normalized to https://, comma-stripped.
- paste_body: the draft with the "Subject:" line and the "[Sources...]" footer removed
  (i.e. greeting -> sign-off) — ready to paste into a LinkedIn composer.
- Subject for InMail is always the canonical line; it is not duplicated here.
"""
import json
import re
import sys
import argparse


def first_plain(prop):
    """Concatenate plain_text across a title/rich_text property's runs."""
    if not prop:
        return ""
    runs = prop.get("title") or prop.get("rich_text") or []
    return "".join(r.get("plain_text", "") for r in runs)


def paste_body(draft: str) -> str:
    body = re.sub(r"^Subject:.*?\n\n", "", draft, flags=re.S)        # drop Subject line
    body = re.sub(r"\n\n\[Sources:.*$", "", body, flags=re.S)        # drop footer
    return body.rstrip()


def linkedin_url(draft: str) -> str:
    m = re.search(r"linkedin\.com/in/[^\s|\],]+", draft)
    if not m:
        return ""
    return "https://www." + m.group(0)


def contact_line(draft: str) -> str:
    m = re.search(r"Contact:\s*([^\]]+)", draft)
    return m.group(1).strip() if m else ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("results", help="path to Notion query results JSON")
    ap.add_argument("--names", help="optional comma-separated allowlist of prospect names")
    args = ap.parse_args()

    try:
        with open(args.results) as f:
            data = json.load(f)
    except FileNotFoundError:
        sys.exit(f"ERROR: results file not found: {args.results}\n"
                 "Pass the path to the Notion query JSON (or the tool-results file it spilled to).")
    except json.JSONDecodeError as e:
        sys.exit(f"ERROR: {args.results} is not valid JSON ({e}).\n"
                 "If the query spilled to a tool-results file, point at that file directly.")

    results = data.get("results")
    if not results:
        sys.exit("ERROR: no 'results' array in the JSON. Re-run the API-query-data-source "
                 "query with filter Stage='Ready to Send' and filter_properties for Outreach Draft.")

    allow = {n.strip() for n in args.names.split(",")} if args.names else None

    out = {}
    for r in results:
        props = r.get("properties", {})
        name = first_plain(props.get("Name"))
        if allow and name not in allow:
            continue
        draft = first_plain(props.get("Outreach Draft"))
        email = (props.get("Email") or {}).get("email")
        out[name] = {
            "page_id": r.get("id"),
            "linkedin_url": linkedin_url(draft),
            "email": email,
            "contact": contact_line(draft),
            "paste_body": paste_body(draft),
        }

    print(json.dumps(out, ensure_ascii=False, indent=2))
    sys.stderr.write(f"parsed {len(out)} prospects\n")


if __name__ == "__main__":
    main()
