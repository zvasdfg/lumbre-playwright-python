import pytest
from playwright.sync_api import Page, expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-056",
    "An authenticated cook saves a private blend without publishing it",
)
def test_account_saves_private_blend(
    page: Page,
    authenticated_home: HomePage,
    test_log: TestLogger,
) -> None:
    lab = authenticated_home.ingredient_lab
    title = "Corteza privada de ajo"

    with test_log.step("Build a two-component blend from the laboratory"):
        for ingredient_name in ["sal kosher", "ajo granulado"]:
            lab.add_ingredient(ingredient_name)
        lab.select_objective("Costra para res")
        expect(lab.blend_title_input).to_be_visible()
        test_log.values(
            selected_ingredients=["sal kosher", "ajo granulado"],
            selected_objective=lab.objective_select.input_value(),
        )

    with test_log.step("Save the blend to the authenticated account"):
        with page.expect_response(
            lambda response: response.url.endswith("/api/account/blends")
            and response.request.method == "POST"
        ) as response_info:
            lab.save_account_blend(title)

        response = response_info.value
        payload = response.json()
        blend_id = payload["data"]["id"]
        expect(lab.protocol_result).to_contain_text("Blend guardado")
        expect(lab.protocol_result).to_contain_text("Solicitar publicación")
        test_log.values(
            observed_status=response.status,
            saved_blend_id=blend_id,
            observed_workflow_status=payload["data"]["status"],
            saved_title=title,
        )
        assert response.status == 201
        assert payload["data"]["status"] == "draft"

    with test_log.step("Confirm that the blend appears only in the account archive"):
        lab.hypothesis_dialog(payload["data"]["protocol"]["id"]).get_by_role(
            "button",
            name="Cerrar",
        ).click()
        authenticated_home.open_account()
        private_blend = authenticated_home.account.blend(title)
        expect(private_blend).to_be_visible()
        expect(private_blend).to_contain_text("Borrador privado")
        expect(private_blend).to_contain_text("ajo granulado")
        expect(authenticated_home.account.blends).to_contain_text("Tus borradores son privados")
        test_log.values(
            observed_private_blend=private_blend.inner_text(),
            observed_public_sheet_count=lab.hypothesis_cards.count(),
        )
        expect(lab.hypothesis_cards).to_have_count(0)
