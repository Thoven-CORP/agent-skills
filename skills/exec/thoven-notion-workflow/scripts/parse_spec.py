#!/usr/bin/env python3
"""
Parse technical specification to identify feature components.

Extracts information about:
- Frontend work (UI, components, flows)
- Backend work (APIs, database, business logic)
- Analytics (events, tracking)
- Email (templates, service integration)
- Testing requirements
"""

import sys
import re
from pathlib import Path


def parse_spec_file(spec_path: str) -> dict:
    """
    Parse technical spec and identify feature components.

    Args:
        spec_path: Path to technical spec markdown file

    Returns:
        dict with component flags and extracted info
    """
    try:
        content = Path(spec_path).read_text()
    except FileNotFoundError:
        return {
            "error": f"Spec file not found: {spec_path}",
            "has_frontend": False,
            "has_backend": False,
            "has_analytics": False,
            "has_email": False,
        }

    content_lower = content.lower()

    # Detect frontend work
    frontend_keywords = [
        "ui component", "user interface", "frontend", "react", "next.js",
        "user flow", "screen", "page", "modal", "button", "form",
        "mobile-responsive", "css", "styling", "animation"
    ]
    has_frontend = any(keyword in content_lower for keyword in frontend_keywords)

    # Detect backend work
    backend_keywords = [
        "api endpoint", "backend", "database", "schema", "model",
        "business logic", "server", "rails", "postgres", "migration",
        "authentication", "authorization", "validation"
    ]
    has_backend = any(keyword in content_lower for keyword in backend_keywords)

    # Detect analytics
    analytics_keywords = [
        "mixpanel", "analytics", "tracking", "event", "meta pixel",
        "facebook pixel", "google analytics", "metrics", "funnel"
    ]
    has_analytics = any(keyword in content_lower for keyword in analytics_keywords)

    # Detect email
    email_keywords = [
        "email", "sendgrid", "mailgun", "notification", "confirmation email",
        "email template", "email service"
    ]
    has_email = any(keyword in content_lower for keyword in analytics_keywords)

    # Extract feature name from spec
    feature_name = extract_feature_name(content, spec_path)

    # Extract Epic if mentioned
    epic = extract_epic(content)

    # Extract priority
    priority = extract_priority(content)

    return {
        "feature_name": feature_name,
        "epic": epic,
        "priority": priority,
        "has_frontend": has_frontend,
        "has_backend": has_backend,
        "has_analytics": has_analytics,
        "has_email": has_email,
        "spec_path": spec_path,
    }


def extract_feature_name(content: str, fallback_path: str) -> str:
    """Extract feature name from spec title or filename."""
    # Try to find title (first # heading)
    title_match = re.search(r'^#\s+(.+?)(?:\s+-\s+|\n)', content, re.MULTILINE)
    if title_match:
        return title_match.group(1).strip()

    # Fallback to filename
    filename = Path(fallback_path).stem
    # Remove "Spec" suffix if present
    if filename.endswith(" Spec"):
        filename = filename[:-5]
    return filename


def extract_epic(content: str) -> str:
    """Extract Epic from spec if mentioned."""
    epic_keywords = {
        "setup backend": "Setup Backend",
        "migrate legacy frontend": "Migrate Legacy Frontend",
        "routing & navigation": "Routing & Navigation",
        "integration": "Integration",
        "sign-up & application": "Sign-Up & Application",
        "tax compliance": "Tax Compliance",
        "thovie rollout": "Thovie Rollout Sprint",
    }

    content_lower = content.lower()
    for keyword, epic_name in epic_keywords.items():
        if keyword in content_lower:
            return epic_name

    return "Integration"  # Default


def extract_priority(content: str) -> str:
    """Extract priority from spec."""
    content_lower = content.lower()

    if "priority: high" in content_lower or "high priority" in content_lower:
        return "High"
    elif "priority: low" in content_lower or "low priority" in content_lower:
        return "Low"
    else:
        return "Medium"  # Default


def main():
    if len(sys.argv) < 2:
        print("Usage: parse_spec.py <path_to_spec.md>")
        sys.exit(1)

    spec_path = sys.argv[1]
    result = parse_spec_file(spec_path)

    # Print results as JSON-like format
    import json
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
