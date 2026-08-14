#!/usr/bin/env python3
"""
Apollo bulk people-enrichment -> verified work emails.

Reads a JSON batch of prospects from a file (arg 1) or stdin, calls Apollo's
POST /api/v1/people/bulk_match (up to 10 people per call), and prints a JSON
result array mapping each input prospect to a found email / locked / unmatched.

SECURITY:
  - API key is read ONLY from the APOLLO_API_KEY environment variable.
  - The key is NEVER printed and NEVER passed as a CLI argument.

Input prospect object (all optional except a name):
  {
    "page_id": "...",            # opaque id you use to map back to your CRM
    "name": "Jane Smith",        # OR first_name + last_name
    "first_name": "Jane",
    "last_name": "Smith",
    "organization_name": "Acme", # strongly recommended
    "domain": "acme.com",        # strongly recommended if known
    "linkedin_url": "https://www.linkedin.com/in/jane",  # strongest match key
    "email": "jane@acme.com"     # if you already have a guess to verify
  }

Output (stdout) is a JSON array, one object per input, in input order:
  {
    "page_id", "input_name",
    "status": "found" | "locked" | "unmatched" | "error",
    "email": "<deliverable work email or null>",
    "email_status": "<apollo email_status or null>",
    "matched_name", "title", "organization", "matched_linkedin_url"
  }

Usage:
  export APOLLO_API_KEY=...            # from keychain / env, not the shell history
  python3 apollo_enrich.py batch.json
  cat batch.json | python3 apollo_enrich.py
  python3 apollo_enrich.py batch.json --reveal-personal   # also reveal personal emails
"""
import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.request

# Verified TLS context. Prefer certifi's CA bundle (fixes the common macOS
# "unable to get local issuer certificate" error) but NEVER disable verification.
try:
    import certifi
    _SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    _SSL_CTX = ssl.create_default_context()

API_URL = "https://api.apollo.io/api/v1/people/bulk_match"
CHUNK = 10            # Apollo bulk_match hard cap
LOCKED_RE = re.compile(r"email_not_unlocked|not_unlocked|^\s*$", re.I)


def die(msg, code=2):
    print(json.dumps({"error": msg}), file=sys.stderr)
    sys.exit(code)


def norm_li(url):
    if not url:
        return ""
    u = url.strip().lower().rstrip("/")
    u = re.sub(r"^https?://(www\.)?", "", u)
    return u


def norm_name(s):
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def pick_email(person):
    """Return (email, email_status) if a usable, non-locked email exists, else (None, status)."""
    if not person:
        return None, None
    candidates = []
    if person.get("email"):
        candidates.append(person["email"])
    for e in person.get("emails", []) or []:
        # emails[] entries may be strings or {email, email_status} objects
        if isinstance(e, dict) and e.get("email"):
            candidates.append(e["email"])
        elif isinstance(e, str):
            candidates.append(e)
    status = person.get("email_status")
    for c in candidates:
        if c and not LOCKED_RE.search(c):
            return c, status
    return None, status


def call_apollo(details, api_key, reveal_personal):
    body = {
        "details": details,
        "reveal_personal_emails": bool(reveal_personal),
    }
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(API_URL, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Cache-Control", "no-cache")
    req.add_header("X-Api-Key", api_key)  # header, never a CLI arg
    try:
        with urllib.request.urlopen(req, timeout=60, context=_SSL_CTX) as resp:
            return json.loads(resp.read().decode("utf-8")), None
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:300]
        return None, f"HTTP {e.code}: {detail}"
    except urllib.error.URLError as e:
        return None, f"network error: {e.reason}"


def build_detail(p):
    d = {}
    if p.get("name"):
        d["name"] = p["name"]
    if p.get("first_name"):
        d["first_name"] = p["first_name"]
    if p.get("last_name"):
        d["last_name"] = p["last_name"]
    if p.get("organization_name"):
        d["organization_name"] = p["organization_name"]
    if p.get("domain"):
        d["domain"] = p["domain"]
    if p.get("linkedin_url"):
        d["linkedin_url"] = p["linkedin_url"]
    if p.get("email"):
        d["email"] = p["email"]
    return d


def match_person(p, people):
    """Find the Apollo person object that corresponds to input prospect p."""
    li = norm_li(p.get("linkedin_url"))
    if li:
        for person in people:
            if norm_li(person.get("linkedin_url")) == li:
                return person
    nm = norm_name(p.get("name") or f"{p.get('first_name','')} {p.get('last_name','')}")
    if nm:
        for person in people:
            pn = norm_name(person.get("name") or f"{person.get('first_name','')} {person.get('last_name','')}")
            if pn and pn == nm:
                return person
    return None


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a for a in sys.argv[1:] if a.startswith("--")}
    reveal_personal = "--reveal-personal" in flags

    api_key = os.environ.get("APOLLO_API_KEY", "").strip()
    if not api_key:
        die("APOLLO_API_KEY is not set. Export it from your keychain/env first "
            "(never pass it as a CLI argument).")

    raw = open(args[0]).read() if args else sys.stdin.read()
    try:
        prospects = json.loads(raw)
    except json.JSONDecodeError as e:
        die(f"input is not valid JSON: {e}")
    if isinstance(prospects, dict):
        prospects = prospects.get("prospects") or prospects.get("details") or [prospects]
    if not isinstance(prospects, list) or not prospects:
        die("input must be a non-empty JSON array of prospect objects.")

    results = []
    for i in range(0, len(prospects), CHUNK):
        chunk = prospects[i:i + CHUNK]
        details = [build_detail(p) for p in chunk]
        resp, err = call_apollo(details, api_key, reveal_personal)
        if err:
            for p in chunk:
                results.append({
                    "page_id": p.get("page_id"),
                    "input_name": p.get("name") or f"{p.get('first_name','')} {p.get('last_name','')}".strip(),
                    "status": "error", "email": None, "email_status": None,
                    "matched_name": None, "title": None, "organization": None,
                    "matched_linkedin_url": None, "note": err,
                })
            continue
        people = resp.get("people", []) or []
        for p in chunk:
            person = match_person(p, people)
            email, estatus = pick_email(person)
            if person is None:
                status = "unmatched"
            elif email:
                status = "found"
            else:
                status = "locked"
            org = None
            if person and isinstance(person.get("organization"), dict):
                org = person["organization"].get("name")
            results.append({
                "page_id": p.get("page_id"),
                "input_name": p.get("name") or f"{p.get('first_name','')} {p.get('last_name','')}".strip(),
                "status": status,
                "email": email,
                "email_status": estatus,
                "matched_name": person.get("name") if person else None,
                "title": person.get("title") if person else None,
                "organization": org,
                "matched_linkedin_url": person.get("linkedin_url") if person else None,
            })
        if i + CHUNK < len(prospects):
            time.sleep(1)  # gentle on the 600/hr bulk rate limit

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
