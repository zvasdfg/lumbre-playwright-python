import pytest
from playwright.sync_api import Page, expect

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-060",
    "A technical sheet provides an A4 preview and invokes browser printing",
)
def test_hypothesis_sheet_prints_from_preview(
    page: Page,
    home: HomePage,
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    hypothesis_id = "LHC-001"

    with test_log.step("Register and open a technical sheet"):
        response = api.create_hypothesis(
            {
                "ingredient_ids": ["sal_kosher", "pimienta_negra", "ajo_granulado"],
                "objective": "Costra para res",
            }
        )
        assert response.status == 201
        home.open()
        lab = home.ingredient_lab
        lab.open_hypothesis(hypothesis_id)
        preview = lab.hypothesis_dialog(hypothesis_id)
        expect(preview).to_be_visible()
        expect(preview).to_contain_text("Vista previa · formato A4")
        expect(preview.get_by_alt_text("Lumbre")).to_be_visible()
        test_log.values(
            observed_hypothesis_id=hypothesis_id,
            observed_preview_label="Vista previa · formato A4",
        )

    with test_log.step("Print the sheet from its preview"):
        page.evaluate(
            """
            () => {
              window.__lumbrePrintCalls = 0;
              window.print = () => { window.__lumbrePrintCalls += 1; };
            }
            """
        )
        lab.print_hypothesis(hypothesis_id)
        observed_print_calls = page.evaluate("() => window.__lumbrePrintCalls")
        test_log.values(
            observed_print_calls=observed_print_calls,
            expected_print_calls=1,
        )
        assert observed_print_calls == 1

    with test_log.step("Validate the dedicated print layout"):
        page.emulate_media(media="print")
        expect(preview.get_by_role("button", name="Imprimir ficha")).to_be_hidden()
        expect(preview).to_be_visible()
        test_log.values(
            observed_print_button_visible=False,
            observed_sheet_visible=True,
            expected_paper_format="A4 portrait",
        )
