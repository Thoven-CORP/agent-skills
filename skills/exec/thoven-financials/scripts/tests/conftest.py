import sys
from pathlib import Path
import pytest

# Make scripts/ importable
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture
def sample_transactions():
    """Synthetic Mercury transactions for testing analysis functions."""
    return [
        {"date": "2026-05-13", "description": "Anthropic", "amount": 10.07, "account": "checking"},
        {"date": "2026-05-13", "description": "Replit", "amount": 100.15, "account": "checking"},
        {"date": "2026-05-12", "description": "GitHub", "amount": 12.00, "account": "checking"},
        {"date": "2026-05-07", "description": "LinkedIn Premium", "amount": 101.83, "account": "checking"},
        {"date": "2026-05-05", "description": "Checkr", "amount": 29.99, "account": "checking"},
    ]


@pytest.fixture
def sample_vendor_map():
    """Synthetic budget parser output for tests."""
    return {
        "Anthropic": {"type": "USAGE", "cap": 300, "category": "AI Core Dev", "is_free_tier_watch": False},
        "Replit": {"type": "USAGE", "cap": 50, "category": "AI Core Dev", "is_free_tier_watch": False},
        "GitHub": {"type": "FIXED", "cap": 15, "category": "AI Core Dev", "is_free_tier_watch": False},
        "LinkedIn Premium": {"type": "FIXED", "cap": 102, "category": "Sales Tools", "is_free_tier_watch": False},
        "Checkr": {"type": "LUMPY", "cap": 300, "category": "Operations", "is_free_tier_watch": False},
        "Cloudflare": {"type": "USAGE", "cap": 0, "category": "Infrastructure", "is_free_tier_watch": True},
    }


SAMPLE_BUDGET_MD = """---
date: 2026-05-13
---

# Thoven Budget

### Category: Test Category

#### Anthropic
- **Type:** USAGE
- **Historical avg:** $344/mo
- **Budget:** **$300/mo**
- **Rationale:** Forcing function on heavy agent runs.

#### Cloudflare
- **Type:** USAGE
- **Historical avg:** $0 (free tier)
- **Budget:** **$0/mo** (current); **alert at first paid charge**
- **Rationale:** Monorepo runtime under free-tier thresholds.

#### Replit
- **Type:** USAGE
- **Budget:** **$50/mo** (after audit/consolidation)
- **Rationale:** Pending audit.
"""


@pytest.fixture
def sample_budget_doc(tmp_path):
    doc = tmp_path / "2026-05-13-budget-line-items.md"
    doc.write_text(SAMPLE_BUDGET_MD)
    return doc
