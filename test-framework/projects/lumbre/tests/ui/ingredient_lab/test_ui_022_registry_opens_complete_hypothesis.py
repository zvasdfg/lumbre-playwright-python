import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.regression, pytest.mark.laboratory]


@pytest.mark.case(
    "UI-022",
    "The session library opens a complete sheet with document ID, alias and gram quantities",
)
def test_registry_opens_complete_hypothesis(lab, test_log):
    with test_log.step("Create a named blend without using the retired server registry"):
        for ingredient in ("sal_kosher", "pimienta_negra", "ajo_granulado"):
            lab.add(ingredient)
        lab.save("BIRRIA de prueba")
        lab.close_sheet()
    with test_log.step("Reopen the saved session sheet"):
        library = lab.page.get_by_test_id("session-blends")
        library.get_by_role("button", name="Abrir ficha", exact=True).click()
        sheet = lab.page.get_by_test_id("hypothesis-print-preview")
        expect(sheet.locator("#hypothesis-sheet-title")).to_have_text("BIRRIA de prueba")
        expect(sheet).to_contain_text("Documento")
        expect(sheet).to_contain_text("SES-001")
        expect(sheet).to_contain_text("Alias")
        expect(sheet.locator(".lab-sheet-quantities tbody tr")).to_have_count(3)
        expect(sheet.locator(".lab-sheet-quantities")).not_to_contain_text("%")
        expect(sheet.locator(".lab-radar svg")).to_be_visible()
