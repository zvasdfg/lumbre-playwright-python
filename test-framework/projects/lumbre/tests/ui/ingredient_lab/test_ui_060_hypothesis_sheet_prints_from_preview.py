import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.regression, pytest.mark.laboratory]


@pytest.mark.case(
    "UI-060", "A locally saved technical sheet presents an A4 preview and invokes browser printing"
)
def test_hypothesis_sheet_prints_from_preview(lab, test_log):
    page = lab.page
    with test_log.step("Create the current local technical sheet"):
        lab.add("sal_kosher")
        lab.add("pimienta_negra")
        lab.save("Ficha para imprimir")
        sheet = page.get_by_test_id("hypothesis-print-preview")
        expect(sheet).to_contain_text("Vista previa · formato A4")
    with test_log.step("Check the browser-print action without opening a native print dialog"):
        page.evaluate(
            "() => { window.__lumbrePrintCalls = 0; "
            "window.print = () => { window.__lumbrePrintCalls += 1; }; }"
        )
        sheet.get_by_role("button", name="Imprimir ficha", exact=True).click()
        assert page.evaluate("window.__lumbrePrintCalls") == 1
    with test_log.step("Check the dedicated print presentation"):
        page.emulate_media(media="print")
        expect(sheet.get_by_role("button", name="Imprimir ficha", exact=True)).to_be_hidden()
        expect(sheet).to_be_visible()
