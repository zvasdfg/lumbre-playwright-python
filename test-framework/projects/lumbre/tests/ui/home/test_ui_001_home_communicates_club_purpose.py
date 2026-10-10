import pytest
from playwright.sync_api import expect

pytestmark = [
    pytest.mark.ui,
    pytest.mark.portal,
    pytest.mark.regression,
    pytest.mark.smoke,
    pytest.mark.navigation,
]


@pytest.mark.case(
    "UI-001", "The current home communicates the purpose and its three working entry points"
)
def test_home_communicates_the_club_purpose(portal, test_log):
    with test_log.step("Read the purpose and the laboratory scope"):
        expect(
            portal.get_by_role("heading", name="El fuego nos reúne.", exact=True)
        ).to_be_visible()
        expect(
            portal.get_by_text("Fuego · Comunidad · Vida al aire libre", exact=True)
        ).to_be_visible()
        expect(portal.get_by_label("Alcance del laboratorio")).to_contain_text("60 componentes")
    with test_log.step("Validate actionable entry points without membership or account UI"):
        expect(
            portal.get_by_role("link", name="Entrar al laboratorio", exact=True)
        ).to_have_attribute("href", "#laboratorio")
        expect(portal.get_by_role("button", name="Planear mi fuego", exact=False)).to_be_visible()
        expect(portal.get_by_role("link", name="Explorar recetas", exact=False)).to_have_attribute(
            "href", "#recetas"
        )
        expect(portal.get_by_test_id("account-button")).to_have_count(0)
