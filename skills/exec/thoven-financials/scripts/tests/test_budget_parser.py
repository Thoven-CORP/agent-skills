import pytest
from pathlib import Path
from budget_parser import parse_budget, BudgetDocError


def test_parse_budget_returns_vendor_dict(sample_budget_doc):
    result = parse_budget(sample_budget_doc)
    assert "Anthropic" in result
    assert result["Anthropic"]["type"] == "USAGE"
    assert result["Anthropic"]["cap"] == 300
    assert result["Anthropic"]["is_free_tier_watch"] is False


def test_parse_budget_detects_free_tier_watch(sample_budget_doc):
    result = parse_budget(sample_budget_doc)
    assert result["Cloudflare"]["is_free_tier_watch"] is True
    assert result["Cloudflare"]["cap"] == 0


def test_parse_budget_extracts_category(sample_budget_doc):
    result = parse_budget(sample_budget_doc)
    assert result["Anthropic"]["category"] == "Test Category"
    assert result["Replit"]["category"] == "Test Category"


def test_parse_budget_raises_on_missing_file(tmp_path):
    with pytest.raises(BudgetDocError):
        parse_budget(tmp_path / "does-not-exist.md")
