import re

import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage
from projects.lumbre.pages.privacy_page import PrivacyPage


@pytest.mark.ui
@pytest.mark.smoke
@pytest.mark.case(
    "UI-052",
    "The public privacy page explains the deployed data boundary and retention",
)
def test_privacy_scope_is_accessible(
    home: HomePage,
    app_url: str,
    test_log: TestLogger,
) -> None:
    privacy = PrivacyPage(home.page, app_url)

    with test_log.step("Open the privacy page from the public footer"):
        home.open_privacy_notice()
        expect(home.page).to_have_url(re.compile(r"/privacidad/?$"))
        expect(privacy.heading).to_be_visible()
        test_log.values(
            observed_url=home.page.url,
            observed_heading=privacy.heading.inner_text(),
        )

    with test_log.step("Validate the anonymous-session retention disclosure"):
        expect(privacy.anonymous_cart_section).to_contain_text("30 días de inactividad")
        expect(privacy.anonymous_cart_section).to_contain_text(
            "No contiene tu nombre ni tu correo",
        )
        test_log.values(
            observed_anonymous_scope=privacy.anonymous_cart_section.inner_text(),
        )

    with test_log.step("Validate operational logging and disabled personal-data features"):
        expect(privacy.operational_logs_section).to_contain_text("no escribe cuerpos, cookies")
        expect(privacy.operational_logs_section).to_contain_text("tres días")
        expect(privacy.disabled_features).to_be_visible()
        test_log.values(
            observed_log_policy=privacy.operational_logs_section.inner_text(),
            observed_disabled_scope=privacy.disabled_features.inner_text(),
        )
