import pytest
from playwright.sync_api import expect

pytestmark = [
    pytest.mark.ui,
    pytest.mark.regression,
    pytest.mark.laboratory,
    pytest.mark.cross_browser,
    pytest.mark.portal,
]


@pytest.mark.case("UI-077", "Interrupted laboratory chunk presents recovery and reloads")
@pytest.mark.parametrize("failure", ["abort", "http503"])
def test_lab_failed_chunk_retry(page, app_url, failure):
    page.add_init_script("""if (!localStorage.getItem('qa-recovery-local')) {
        localStorage.setItem('qa-recovery-local', 'saved-plan');
        sessionStorage.setItem('qa-recovery-session', 'saved-blend');
    }""")
    blocked = []
    recovered = []
    failing = True

    def interrupt(route):
        if not failing:
            recovered.append(route.request.url)
            route.continue_()
            return
        blocked.append(route.request.url)
        if failure == "abort":
            route.abort("failed")
        else:
            route.fulfill(
                status=503, body="Temporary failure", headers={"Cache-Control": "no-store"}
            )

    pattern = "**/*ingredient-lab*.js*"
    page.route(pattern, interrupt)
    page.goto(app_url + "/#laboratorio")
    expect(page.get_by_role("alert")).to_contain_text("No se pudo cargar el laboratorio")
    assert blocked, "The test must actually interrupt the laboratory chunk"
    # An outage that persists through the first retry must remain recoverable.
    with page.expect_navigation(wait_until="domcontentloaded"):
        page.get_by_role("button", name="Recargar página", exact=True).click()
    expect(page.get_by_role("alert")).to_contain_text("No se pudo cargar el laboratorio")
    expect(page.get_by_role("button", name="Recargar página", exact=True)).to_be_enabled()
    failing = False
    with page.expect_navigation(wait_until="domcontentloaded"):
        page.get_by_role("button", name="Recargar página", exact=True).click()
    expect(page.locator("[data-ingredient-id]").first).to_be_attached()
    expect(page.get_by_role("alert")).to_have_count(0)
    assert recovered, "Recovery must fetch the module after the simulated outage"
    assert page.url.endswith("#laboratorio")
    assert page.evaluate("localStorage.getItem('qa-recovery-local')") == "saved-plan"
    assert page.evaluate("sessionStorage.getItem('qa-recovery-session')") == "saved-blend"
