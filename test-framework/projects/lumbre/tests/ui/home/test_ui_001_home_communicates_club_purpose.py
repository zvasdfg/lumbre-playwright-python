import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.smoke
@pytest.mark.case("UI-001", "The home page communicates Lumbre's purpose")
def test_home_communicates_the_club_purpose(home: HomePage, test_log: TestLogger) -> None:
    with test_log.step("Validate the main page heading"):
        expect(home.hero_title).to_be_visible()
        observed_title = home.hero_title.inner_text()
        test_log.values(
            observed_title=observed_title,
            expected_title="El fuego nos reúne.",
        )

    with test_log.step("Validate the club value proposition"):
        expected_proposition = "Fuego · Comunidad · Vida al aire libre"
        proposition = home.page.get_by_text(expected_proposition)
        expect(proposition).to_be_visible()
        test_log.values(
            observed_proposition=proposition.inner_text(),
            expected_proposition=expected_proposition,
        )
