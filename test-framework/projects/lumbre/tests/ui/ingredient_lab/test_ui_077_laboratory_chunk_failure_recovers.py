from urllib.parse import parse_qs, urlparse

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
@pytest.mark.parametrize("width", [390, 1440], ids=["mobile", "desktop"])
@pytest.mark.parametrize("failure", ["abort", "http503"])
def test_lab_failed_chunk_retry(page, app_url, failure, width):
    page.set_viewport_size({"width": width, "height": 1000})
    page.add_init_script("""window.__qaRecoveryDocument = crypto.randomUUID();
    if (!localStorage.getItem('qa-recovery-local')) {
        localStorage.setItem('qa-recovery-local', 'saved-plan');
        sessionStorage.setItem('qa-recovery-session', 'saved-blend');
    }""")
    blocked = []
    recovered = []
    pending = []
    loading = True
    failing = True

    def fail(route):
        if failure == "abort":
            route.abort("failed")
        else:
            route.fulfill(
                status=503, body="Temporary failure", headers={"Cache-Control": "no-store"}
            )

    def interrupt(route):
        if not failing:
            recovered.append(route.request.url)
            route.continue_()
            return
        blocked.append(route.request.url)
        if loading:
            pending.append(route)
        else:
            fail(route)

    pattern = "**/*ingredient-lab*.js*"
    page.route(pattern, interrupt)
    with page.expect_request(pattern):
        page.goto(app_url + "/#laboratorio", wait_until="domcontentloaded")
    expect(page.get_by_role("status").filter(has_text="Cargando laboratorio")).to_be_visible()
    reserved_height = page.locator("#laboratorio").bounding_box()["height"]
    assert pending, "The initial module request must stay pending during the loading state"
    loading = False
    for route in pending:
        fail(route)
    expect(page.get_by_role("alert")).to_contain_text("No se pudo cargar el laboratorio")
    assert blocked, "The test must actually interrupt the laboratory chunk"
    assert page.locator("#laboratorio").bounding_box()["height"] >= reserved_height - 1, (
        "A failed chunk must not collapse the reserved section and move the recovery control"
    )

    def reload_from_control():
        before = page.url
        previous_document = page.evaluate("window.__qaRecoveryDocument")
        page.get_by_role("button", name="Recargar página", exact=True).click()
        page.wait_for_url(
            lambda url: url != before
            and urlparse(url).fragment == "laboratorio"
            and parse_qs(urlparse(url).query).get("lab_retry", [""])[0].isdigit(),
            wait_until="domcontentloaded",
        )
        assert page.evaluate("window.__qaRecoveryDocument") != previous_document, (
            "Recovery must load a new document, not only change the URL"
        )

    # An outage that persists through the first retry must remain recoverable.
    failed_requests = len(blocked)
    reload_from_control()
    expect(page.get_by_role("alert")).to_contain_text("No se pudo cargar el laboratorio")
    assert len(blocked) > failed_requests, "The first retry must request the still-failing chunk"
    expect(page.get_by_role("button", name="Recargar página", exact=True)).to_be_enabled()
    failing = False
    reload_from_control()
    expect(page.locator("[data-ingredient-id]").first).to_be_attached()
    expect(page.get_by_role("alert")).to_have_count(0)
    assert recovered, "Recovery must fetch the module after the simulated outage"
    assert page.url.endswith("#laboratorio")
    assert page.evaluate("localStorage.getItem('qa-recovery-local')") == "saved-plan"
    assert page.evaluate("sessionStorage.getItem('qa-recovery-session')") == "saved-blend"
