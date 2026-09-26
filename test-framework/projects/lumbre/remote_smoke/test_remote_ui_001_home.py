import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage
from projects.lumbre.pages.privacy_page import PrivacyPage


@pytest.mark.ui
@pytest.mark.smoke
@pytest.mark.remote_smoke
@pytest.mark.case(
    "REMOTE-UI-001",
    "The deployed portal renders critical content, images, and its privacy disclosure",
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

    with test_log.step("Validate that production exposes the passwordless account form"):
        home.page.get_by_role("button", name="Crear cuenta", exact=True).click()
        expect(home.account.request_link_button).to_be_visible()
        test_log.values(
            observed_account_heading=home.account.root.get_by_role(
                "heading", name="Tu lugar junto al fuego."
            ).inner_text(),
            observed_access_action=home.account.request_link_button.inner_text(),
        )
        home.account.root.get_by_role("button", name="Cerrar acceso").click()

    with test_log.step("Validate the deployed privacy disclosure"):
        privacy = PrivacyPage(home.page, home.base_url)
        home.open_privacy_notice()
        expect(privacy.heading).to_be_visible()
        expect(privacy.anonymous_cart_section).to_contain_text(
            "30 días de inactividad"
        )
        expect(privacy.operational_logs_section).to_contain_text("tres días")
        test_log.values(
            observed_url=home.page.url,
            observed_cart_retention=privacy.anonymous_cart_section.inner_text(),
            observed_log_retention=privacy.operational_logs_section.inner_text(),
        )
