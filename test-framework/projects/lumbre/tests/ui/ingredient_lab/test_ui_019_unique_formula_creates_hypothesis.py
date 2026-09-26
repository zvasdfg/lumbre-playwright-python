import pytest
from playwright.sync_api import Page, expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-019",
    "An anonymous blend remains available only in the current browser session",
)
def test_anonymous_blend_persists_in_current_session(
    page: Page,
    home: HomePage,
    test_log: TestLogger,
) -> None:
    lab = home.ingredient_lab
    selected_names = ["sal kosher", "comino"]
    blend_title = "Sal y comino de prueba"
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

    with test_log.step("Build and name an anonymous blend"):
        for ingredient_name in selected_names:
            lab.add_ingredient(ingredient_name)
        lab.select_objective("Costra para res")
        lab.blend_title_input.fill(blend_title)
        expect(lab.create_protocol_button).to_be_enabled()
        test_log.values(
            selected_ingredients=selected_names,
            blend_title=blend_title,
        )

    with test_log.step("Save the blend without sending a server mutation"):
        lab.create_protocol()
        dialog = lab.hypothesis_dialog("SES-001")
        expect(dialog).to_be_visible()
        expect(dialog).to_contain_text("FICHA TÉCNICA")
        expect(lab.session_blend(blend_title)).to_be_visible()
        expect(lab.protocol_result).to_contain_text("Blend guardado en esta sesión")
        test_log.values(
            observed_session_id="SES-001",
            observed_server_mutations=mutation_requests,
        )
        assert mutation_requests == []

    with test_log.step("Reload the page and restore the blend from session storage"):
        page.reload(wait_until="domcontentloaded")
        expect(lab.session_blend(blend_title)).to_be_visible()
        stored_blends = page.evaluate(
            "JSON.parse(sessionStorage.getItem('lumbre.ingredient-lab.session-blends.v1'))"
        )
        test_log.values(
            restored_blend=blend_title,
            storage_scope="current browser session",
            observed_stored_count=len(stored_blends),
        )
        assert len(stored_blends) == 1
