import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-030",
    "Laboratory blends lead the store catalog before tools and merchandise",
)
def test_blends_lead_store_catalog(home: HomePage, test_log: TestLogger) -> None:
    expected_blends = [
        "Blend LHC-003 · SPG clásico",
        "Blend LHP-007 · Pollo ahumado",
        "Blend LHV-002 · Umami tostado",
    ]

    with test_log.step("Read the leading products in the store catalog"):
        leading_cards = home.product_cards.all()[:3]
        observed_names = [card.get_by_role("heading").inner_text() for card in leading_cards]
        observed_categories = [card.get_attribute("data-category") for card in leading_cards]
        test_log.values(
            observed_names=observed_names,
            expected_names=expected_blends,
            observed_categories=observed_categories,
            expected_category="blends",
        )

    with test_log.step("Validate that blends appear before merchandise"):
        expect(home.product_cards).to_have_count(7)
        assert observed_names == expected_blends
        assert observed_categories == ["blends", "blends", "blends"]
