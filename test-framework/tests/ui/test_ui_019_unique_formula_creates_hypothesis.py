from itertools import combinations

import pytest
from playwright.sync_api import Page, expect

from framework.api.lumbre_api import LumbreApi
from framework.pages.home_page import HomePage
from framework.reporting import TestLogger


@pytest.mark.ui
@pytest.mark.case(
    "UI-019",
    "A unique formula creates and displays a new technical sheet",
)
def test_unique_formula_creates_hypothesis(
    page: Page,
    home: HomePage,
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    lab = home.ingredient_lab

    with test_log.step("Select an ingredient pair that is not registered"):
        ingredient_catalog = api.ingredients()["data"]
        existing_signatures = {hypothesis["firma"] for hypothesis in api.hypotheses()["data"]}
        selected_pair = next(
            pair
            for pair in combinations(ingredient_catalog, 2)
            if f"LHC:{'+'.join(sorted(item['id'] for item in pair))}" not in existing_signatures
        )
        selected_names = [item["nombre"] for item in selected_pair]
        expect(lab.ingredient_cards).to_have_count(len(ingredient_catalog))
        test_log.values(
            selected_ingredients=selected_names,
            selected_objective="Costra para res",
        )

    with test_log.step("Build and submit the unique formula"):
        for ingredient_name in selected_names:
            lab.add_ingredient(ingredient_name)
        lab.select_objective("Costra para res")

        with page.expect_response(
            lambda response: (
                response.url.endswith("/api/hipotesis") and response.request.method == "POST"
            )
        ) as response_info:
            lab.create_protocol()

        response = response_info.value
        result = response.json()
        created_id = result["data"]["id"]
        test_log.values(
            observed_status=response.status,
            expected_status=201,
            observed_created=result["created"],
            observed_hypothesis_id=created_id,
        )

    with test_log.step("Validate the new technical sheet and registry entry"):
        dialog = lab.hypothesis_dialog(created_id)
        expect(dialog).to_be_visible()
        expect(dialog).to_contain_text("FICHA TÉCNICA")
        for ingredient_name in selected_names:
            expect(dialog).to_contain_text(ingredient_name)
        expect(lab.protocol_result).to_contain_text("Hipótesis registrada")
        expect(lab.hypothesis_card(created_id)).to_be_visible()
        test_log.values(
            observed_result_title="Hipótesis registrada",
            observed_registry_id=created_id,
            expected_ingredients=selected_names,
        )
        assert response.status == 201
        assert result["created"] is True
        assert result["duplicate"] is False
