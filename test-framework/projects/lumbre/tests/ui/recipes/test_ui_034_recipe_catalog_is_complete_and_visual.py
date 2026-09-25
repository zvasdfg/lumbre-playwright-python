from math import ceil

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

    with test_log.step("Read all 100 recipes through the paginated catalog"):
        page_count = ceil(expected_recipe_count / 6)
        observed_titles: list[str] = []
        observed_sources: list[str] = []
        observed_alt_texts: list[str] = []
        observed_overlays: list[str] = []
        observed_page_sizes: list[int] = []

        for page_number in range(1, page_count + 1):
            if page_number > 1:
                home.go_to_recipe_page(page_number)
            page_size = home.recipe_cards.count()
            observed_page_sizes.append(page_size)
            observed_titles.extend(home.recipe_cards.get_by_role("heading").all_inner_texts())
            observed_sources.extend(
                home.recipe_images.evaluate_all(
                    "images => images.map(image => "
                    "new URL(image.src).searchParams.get('url') ?? "
                    "image.getAttribute('src'))"
                )
            )
            observed_alt_texts.extend(
                home.recipe_images.evaluate_all(
                    "images => images.map(image => image.getAttribute('alt'))"
                )
            )
            observed_overlays.extend(
                home.recipe_art.evaluate_all(
                    "elements => elements.map(element => "
                    "getComputedStyle(element, '::after').backgroundImage)"
                )
            )

        test_log.values(
            observed_recipe_count=len(observed_titles),
            expected_recipe_count=expected_recipe_count,
            observed_page_count=page_count,
            observed_page_sizes=observed_page_sizes,
            observed_unique_titles=len(set(observed_titles)),
            observed_unique_sources=len(set(observed_sources)),
            observed_unique_overlays=len(set(observed_overlays)),
        )

    with test_log.step("Validate unique recipes and image ownership"):
        assert all(page_size <= 6 for page_size in observed_page_sizes)
        assert observed_page_sizes[-1] == 4
        assert len(set(observed_titles)) == expected_recipe_count
        assert len(set(observed_sources)) == expected_recipe_count
        assert all(source for source in observed_sources)
        assert all(
            alt_text == f"Fotografía de {title}"
            for title, alt_text in zip(observed_titles, observed_alt_texts, strict=True)
        )
        assert len(set(observed_overlays)) == 1
        assert "linear-gradient" in observed_overlays[0]
