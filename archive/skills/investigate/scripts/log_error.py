#!/usr/bin/env python3
"""
Log a new error pattern to common-errors.md

Usage:
    python log_error.py "Category" "Pattern Name" "Symptom" "Root Cause" "Fix" ["Prevention"] ["Applies to"]

Example:
    python log_error.py \
        "ActiveRecord / Database" \
        "N+1 Query in Serializer" \
        "Endpoint takes 5+ seconds, DB log shows hundreds of identical queries" \
        "Serializer accesses association without eager loading" \
        "Add .includes(:association) to the controller query" \
        "Always check bullet gem warnings in development" \
        "Any endpoint that lists records with associations"
"""

import argparse
import os
from datetime import datetime
from pathlib import Path


def get_common_errors_path() -> Path:
    """Get the path to COMMON_ERRORS.md — the single source of truth."""
    script_dir = Path(__file__).parent
    return script_dir.parent.parent.parent / "docs" / "COMMON_ERRORS.md"


def format_error_entry(category: str, name: str, symptom: str, root_cause: str, fix: str, prevention: str = "", applies_to: str = "") -> str:
    """Format an error entry in markdown."""
    date = datetime.now().strftime("%Y-%m-%d")

    entry = f"""
### Error: {name}
- **Symptom:** {symptom}
- **Root Cause:** {root_cause}
- **Fix:** {fix}
- **Prevention:** {prevention if prevention else "[Add prevention strategy]"}
- **Applies to:** {applies_to if applies_to else "[Add applicable situations]"}
- **Files:** [Add relevant files]
- **Date Added:** {date}
"""
    return entry


def find_category_section(content: str, category: str) -> tuple[int, bool]:
    """
    Find the position to insert a new error under a category.
    Returns (position, category_exists).
    """
    # Look for existing category header
    category_header = f"## {category}"

    if category_header in content:
        # Find the end of this category section (next ## or end of file)
        start = content.find(category_header)
        next_section = content.find("\n## ", start + len(category_header))

        if next_section == -1:
            # No next section, find "How to Add" section or end
            how_to_add = content.find("## How to Add")
            if how_to_add != -1:
                return how_to_add, True
            return len(content), True

        return next_section, True

    return -1, False


def add_error_to_file(filepath: Path, category: str, entry: str) -> bool:
    """Add an error entry to the common-errors.md file."""
    try:
        content = filepath.read_text()

        position, category_exists = find_category_section(content, category)

        if category_exists:
            # Insert before the next section
            new_content = content[:position] + entry + "\n---\n\n" + content[position:]
        else:
            # Add new category before "How to Add" section
            how_to_add = content.find("## How to Add")
            if how_to_add != -1:
                new_category = f"## {category}\n{entry}\n---\n\n"
                new_content = content[:how_to_add] + new_category + content[how_to_add:]
            else:
                # Append to end
                new_content = content + f"\n---\n\n## {category}\n{entry}"

        filepath.write_text(new_content)
        return True

    except Exception as e:
        print(f"Error writing to file: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Log a new error pattern to common-errors.md",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python log_error.py "ActiveRecord / Database" "N+1 Query in Serializer" \\
        "Endpoint takes 5+ seconds" \\
        "Serializer accesses association without eager loading" \\
        "Add .includes(:association) to the controller query" \\
        "Always check bullet gem warnings in development" \\
        "Any endpoint that lists records with associations"

Categories (use existing or create new):
    - ActiveRecord / Database
    - Authentication / Authorization
    - Background Jobs / Solid Queue
    - Email / SMTP
    - API Contracts / Serialization
    - Caching / Redis
    - Third-Party Integrations / Stripe
    - Geocoding / External APIs
    - Replit Infrastructure
    - Critical Business Logic (DO NOT TOUCH)
    - Marketplace / Pagination
        """
    )

    parser.add_argument("category", help="Error category (e.g., 'ActiveRecord / Database')")
    parser.add_argument("name", help="Error pattern name (e.g., 'N+1 Query in Serializer')")
    parser.add_argument("symptom", help="What the developer sees/experiences")
    parser.add_argument("root_cause", help="Why this happens (the principle, not the incident)")
    parser.add_argument("fix", help="How to resolve it")
    parser.add_argument("prevention", nargs="?", default="", help="How to prevent in future (optional)")
    parser.add_argument("applies_to", nargs="?", default="", help="Other situations this covers (optional)")

    args = parser.parse_args()

    # Get file path
    filepath = get_common_errors_path()

    if not filepath.exists():
        print(f"Error: common-errors.md not found at {filepath}")
        return 1

    # Format entry
    entry = format_error_entry(
        args.category,
        args.name,
        args.symptom,
        args.root_cause,
        args.fix,
        args.prevention,
        args.applies_to
    )

    # Add to file
    if add_error_to_file(filepath, args.category, entry):
        print(f"Successfully added error '{args.name}' to category '{args.category}'")
        print(f"File: {filepath}")
        return 0
    else:
        print("Failed to add error entry")
        return 1


if __name__ == "__main__":
    exit(main())
