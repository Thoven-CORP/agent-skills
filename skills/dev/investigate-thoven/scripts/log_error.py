#!/usr/bin/env python3
"""
Log a new error pattern to common-errors.md

Usage:
    python log_error.py "Category" "Pattern Name" "Symptom" "Root Cause" "Fix"

Example:
    python log_error.py \
        "React Hooks / State" \
        "Infinite Re-render Loop" \
        "Component keeps re-rendering, browser freezes" \
        "useEffect dependency causes state update which triggers effect again" \
        "Add proper dependency array, use useCallback for function deps"
"""

import argparse
import os
from datetime import datetime
from pathlib import Path


def get_common_errors_path() -> Path:
    """Get the path to common-errors.md relative to this script."""
    script_dir = Path(__file__).parent
    return script_dir.parent / "references" / "common-errors.md"


def format_error_entry(category: str, name: str, symptom: str, root_cause: str, fix: str,
                       prevention: str = "", applies_to: str = "", reference: str = "") -> str:
    """Format an error entry in markdown with all required fields."""
    date = datetime.now().strftime("%Y-%m-%d")

    entry = f"""
### Error: {name}
- **Symptom:** {symptom}
- **Root Cause:** {root_cause}
- **Fix:** {fix}"""

    if prevention:
        entry += f"\n- **Prevention:** {prevention}"

    if applies_to:
        entry += f"\n- **Applies to:** {applies_to}"

    entry += f"\n- **Files:** [Add relevant files]"
    entry += f"\n- **Date Added:** {date}"

    if reference:
        entry += f"\n- **Reference:** {reference}"

    entry += "\n"
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
        description="Log a new error pattern to common-errors.md (with quality gate)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python log_error.py "API Integration" "Rate Limit Hit" \\
        "429 Too Many Requests error" \\
        "Exceeded API rate limit" \\
        "Add retry logic with exponential backoff" \\
        --prevention "Add rate limiting awareness to all API modules" \\
        --applies-to "Any API call, especially bulk operations" \\
        --reference "Teacher dashboard 429s during class list load (v1.4.0)"

Quality Gate (all must pass before logging):
    1. Is it generalizable? (not a one-off incident)
    2. Does it have prevention guidance? (not just "how to fix")
    3. Can you name it without mentioning specific files/services?

Categories (use existing or create new):
    - Third-Party SDKs (Meta Pixel, PostHog, Stripe)
    - React Hooks / State
    - UI / Component Communication
    - API Integration
    - TypeScript / Build
    - Authentication
    - Next.js App Router
    - SEO / Structured Data
        """
    )

    parser.add_argument("category", help="Error category (e.g., 'React Hooks / State')")
    parser.add_argument("name", help="Generalizable pattern name (no specific files/services)")
    parser.add_argument("symptom", help="What the user sees/experiences")
    parser.add_argument("root_cause", help="Why this happens (the principle, not the incident)")
    parser.add_argument("fix", help="How to resolve it")
    parser.add_argument("--prevention", default="", help="How to avoid this in the future")
    parser.add_argument("--applies-to", default="", help="Other situations this pattern covers")
    parser.add_argument("--reference", default="", help="Original incident that surfaced this pattern")

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
        prevention=args.prevention,
        applies_to=getattr(args, 'applies_to', ''),
        reference=args.reference,
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
