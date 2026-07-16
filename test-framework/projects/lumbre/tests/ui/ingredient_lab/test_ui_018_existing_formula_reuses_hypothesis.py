import pytest
from playwright.sync_api import Page, expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-018",
    "Submitting a known formula shows the existing technical sheet",
)
def test_existing_formula_reuses_hypothesis(
    page: Page,
    home: HomePage,
    test_log: TestLogger,
) -> None:
    lab = home.ingredient_lab
    ingredient_names = ["ajo granulado", "sal kosher", "pimienta negra"]

    with test_log.step("Build a known SPG formula"):
        for ingredient_name in ingredient_names:
            lab.add_ingredient(ingredient_name)
        lab.select_objective("Costra para res")

        expect(lab.create_protocol_button).to_be_enabled()
        test_log.values(
            selected_ingredients=ingredient_names,
            selected_objective=lab.objective_select.input_value(),
        )

    with test_log.step("Submit the formula and capture the API result"):
        with page.expect_response(
            lambda response: (
                response.url.endswith("/api/hipotesis") and response.request.method == "POST"
            )
        ) as response_info:
            lab.create_protocol()

        response = response_info.value
        result = response.json()
        test_log.values(
            observed_status=response.status,
            observed_created=result["created"],
            observed_duplicate=result["duplicate"],
            observed_hypothesis_id=result["data"]["id"],
        )

    with test_log.step("Validate that the existing technical sheet is reused"):
        expected_hypothesis_id = "LHC-003"
        dialog = lab.hypothesis_dialog(expected_hypothesis_id)

        expect(dialog).to_be_visible()
        expect(dialog).to_contain_text("SPG clásico de tres componentes")
        expect(lab.protocol_result).to_contain_text("Hipótesis existente")
        expect(lab.protocol_result).to_contain_text(expected_hypothesis_id)

        test_log.values(
            observed_hypothesis_id=result["data"]["id"],
            expected_hypothesis_id=expected_hypothesis_id,
            observed_result_title="Hipótesis existente",
            expected_new_record=False,
        )

        assert response.status == 200
        assert result["created"] is False
        assert result["duplicate"] is True
