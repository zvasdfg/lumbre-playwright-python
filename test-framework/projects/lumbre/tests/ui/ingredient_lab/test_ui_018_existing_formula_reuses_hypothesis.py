import pytest
from playwright.sync_api import Page, expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-018",
    "An anonymous duplicate formula reuses its session blend",
)
def test_anonymous_duplicate_formula_reuses_session_blend(
    page: Page,
    home: HomePage,
    test_log: TestLogger,
) -> None:
    lab = home.ingredient_lab
    ingredient_names = ["ajo granulado", "sal kosher", "pimienta negra"]
    mutation_requests: list[str] = []
    page.on(
        "request",
        lambda request: mutation_requests.append(request.url)
        if request.method == "POST" and (
            request.url.endswith("/api/hipotesis")
            or request.url.endswith("/api/account/blends")
        )
        else None,
    )

    with test_log.step("Build and save SPG in the anonymous browser session"):
        for ingredient_name in ingredient_names:
            lab.add_ingredient(ingredient_name)
        lab.select_objective("Costra para res")
        lab.save_session_blend("SPG de la sesión")
        expect(lab.session_blend("SPG de la sesión")).to_be_visible()
        expect(lab.protocol_result).to_contain_text("Blend guardado en esta sesión")
        test_log.values(
            selected_ingredients=ingredient_names,
            selected_objective=lab.objective_select.input_value(),
            observed_session_blends=lab.session_blend_cards.count(),
        )

    with test_log.step("Save the same formula again and reuse the existing record"):
        page.get_by_role("button", name="Cerrar ficha técnica").click()
        lab.blend_title_input.fill("Otro nombre para SPG")
        lab.create_protocol()
        expect(lab.protocol_result).to_contain_text("Blend ya guardado en esta sesión")
        expect(lab.session_blend_cards).to_have_count(1)
        test_log.values(
            observed_session_blends=lab.session_blend_cards.count(),
            expected_session_blends=1,
            observed_server_mutations=mutation_requests,
        )
        assert mutation_requests == []
