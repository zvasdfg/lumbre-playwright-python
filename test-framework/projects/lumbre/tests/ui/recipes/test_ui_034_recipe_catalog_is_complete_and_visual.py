import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-034",
    "The recipe catalog exposes 100 unique recipes with distinct descriptive images",
)
def test_recipe_catalog_is_complete_and_visual(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    expected_recipe_count = 100

    with test_log.step("Read the complete recipe catalog"):
        expect(home.recipe_cards).to_have_count(expected_recipe_count)
        observed_titles = home.recipe_cards.get_by_role("heading").all_inner_texts()
        observed_sources = home.recipe_images.evaluate_all(
            "images => images.map(image => "
            "new URL(image.src).searchParams.get('url') ?? "
            "image.getAttribute('src'))"
        )
        observed_alt_texts = home.recipe_images.evaluate_all(
            "images => images.map(image => image.getAttribute('alt'))"
        )
        observed_overlays = home.recipe_art.evaluate_all(
            "elements => elements.map(element => "
            "getComputedStyle(element, '::after').backgroundImage)"
        )
        test_log.values(
            observed_recipe_count=len(observed_titles),
            expected_recipe_count=expected_recipe_count,
            observed_unique_titles=len(set(observed_titles)),
            observed_unique_sources=len(set(observed_sources)),
            observed_unique_overlays=len(set(observed_overlays)),
        )

    with test_log.step("Validate unique recipes and image ownership"):
        assert len(set(observed_titles)) == expected_recipe_count
        assert len(set(observed_sources)) == expected_recipe_count
        assert all(source for source in observed_sources)
        assert all(
            alt_text == f"Fotografía de {title}"
            for title, alt_text in zip(observed_titles, observed_alt_texts, strict=True)
        )
        assert len(set(observed_overlays)) == 1
        assert "linear-gradient" in observed_overlays[0]
