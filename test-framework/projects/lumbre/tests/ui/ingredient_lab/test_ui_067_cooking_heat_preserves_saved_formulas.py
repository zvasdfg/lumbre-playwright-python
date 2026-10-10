import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.regression, pytest.mark.laboratory, pytest.mark.portal]


@pytest.mark.case("UI-067", "Changing cooking heat creates an independent saved formula")
def test_heat_transition(lab):
    page = lab.page
    lab.add("sal_mar_gruesa")
    lab.add("pimienta_negra")
    lab.save("Directo")
    lab.close_sheet()
    salt = page.get_by_label("Gramos de sal mar gruesa", exact=True)
    before = salt.input_value()
    page.get_by_label("Primero, el fuego", exact=True).select_option("indirecto")
    expect(salt).to_have_value(before)
    lab.save("Indirecto")
    lab.close_sheet()
    cards = page.get_by_test_id("session-blends").locator("article")
    expect(cards).to_have_count(2)
    expect(
        cards.filter(has=page.get_by_role("heading", name="Directo", exact=True))
    ).to_contain_text("Fuego directo")
    expect(
        cards.filter(has=page.get_by_role("heading", name="Indirecto", exact=True))
    ).to_contain_text("Fuego indirecto")
