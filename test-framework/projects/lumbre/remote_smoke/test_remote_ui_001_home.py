import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.smoke
@pytest.mark.remote_smoke
@pytest.mark.case(
    "REMOTE-UI-001",
    "The deployed portal renders its critical content and image assets",
)
def test_deployed_home_and_assets(home: HomePage, test_log: TestLogger) -> None:
    with test_log.step("Validate the deployed home and seeded content"):
        expect(home.hero_title).to_be_visible()
        expect(home.recipe_cards.first).to_be_visible()
        expect(home.product_cards.first).to_be_visible()
        test_log.values(
            observed_title=home.hero_title.inner_text(),
            observed_recipe_count=home.recipe_cards.count(),
            observed_product_count=home.product_cards.count(),
        )

    with test_log.step("Validate that representative optimized images loaded"):
        recipe_image = home.recipe_images.first
        product_image = home.product_images.first
        recipe_image.scroll_into_view_if_needed()
        product_image.scroll_into_view_if_needed()
        expect(recipe_image).to_be_visible()
        expect(product_image).to_be_visible()
        expect(recipe_image).to_have_js_property("complete", True)
        expect(product_image).to_have_js_property("complete", True)
        observed_recipe_width = recipe_image.evaluate("element => element.naturalWidth")
        observed_product_width = product_image.evaluate("element => element.naturalWidth")
        test_log.values(
            observed_recipe_image_width=observed_recipe_width,
            observed_product_image_width=observed_product_width,
        )
        assert observed_recipe_width > 0
        assert observed_product_width > 0
