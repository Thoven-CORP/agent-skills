import pytest
from vendor_categorizer import categorize


def test_exact_substring_match(sample_vendor_map):
    assert categorize("Anthropic", sample_vendor_map) == "Anthropic"


def test_case_insensitive(sample_vendor_map):
    assert categorize("anthropic api", sample_vendor_map) == "Anthropic"
    assert categorize("ANTHROPIC", sample_vendor_map) == "Anthropic"


def test_multi_word_vendor(sample_vendor_map):
    assert categorize("LinkedIn Premium subscription", sample_vendor_map) == "LinkedIn Premium"
    # Should NOT match plain "LinkedIn" (no Premium) — match longest first
    assert categorize("LinkedIn", sample_vendor_map) is None


def test_unknown_vendor_returns_none(sample_vendor_map):
    assert categorize("Cursor", sample_vendor_map) is None


def test_empty_description(sample_vendor_map):
    assert categorize("", sample_vendor_map) is None


def test_partial_match_at_start(sample_vendor_map):
    assert categorize("Checkr inc.", sample_vendor_map) == "Checkr"
