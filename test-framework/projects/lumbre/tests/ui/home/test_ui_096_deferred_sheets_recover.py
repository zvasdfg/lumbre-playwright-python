import pytest
from playwright.sync_api import expect

pytestmark = [
    pytest.mark.ui,
    pytest.mark.portal,
    pytest.mark.navigation,
    pytest.mark.regression,
    pytest.mark.cross_browser,
]


@pytest.mark.case(
    "UI-096", "Almanac, recipe and product chunk failures recover without losing storage"
)
@pytest.mark.parametrize("feature", ["fire-almanac", "recipe-sheet", "product-sheet"])
@pytest.mark.parametrize("failure", ["abort", "http503"])
def test_deferred_chunk_recovery(page, app_url, feature, failure):
    page.add_init_script("""if (!localStorage.getItem('qa-deferred-local')) {
      localStorage.setItem('qa-deferred-local', 'saved-plan');
      sessionStorage.setItem('qa-deferred-session', 'saved-blend'); }""")
    interrupted, recovered = [], []
    failing = True

    def respond(route):
        if not failing:
            recovered.append(route.request.url)
            route.continue_()
        else:
            interrupted.append(route.request.url)
            if failure == "abort":
                route.abort("failed")
            else:
                route.fulfill(status=503, body="Unavailable", headers={"Cache-Control": "no-store"})

    page.route(f"**/*{feature}*.js*", respond)
    page.goto(app_url)

    def open_feature():
        if feature == "fire-almanac":
            page.get_by_role("button", name="Almanaque", exact=False).click()
        elif feature == "recipe-sheet":
            page.get_by_test_id("recipe-card").first.get_by_role("button").click()
        else:
            page.get_by_role("button", name="Ver ficha de Sazonador multiuso", exact=True).click()

    open_feature()
    alert = page.get_by_role("alert").filter(has_text="No se pudo cargar esta sección")
    expect(alert).to_be_visible()
    assert interrupted, "The intended feature chunk must be interrupted"
    failing = False
    with page.expect_navigation(wait_until="domcontentloaded"):
        alert.get_by_role("button", name="Recargar página", exact=True).click()
    open_feature()
    expect(page.get_by_role("dialog")).to_be_visible()
    expect(page.get_by_role("alert")).to_have_count(0)
    assert recovered, "The chunk must actually reload after the outage"
    assert page.evaluate("localStorage.getItem('qa-deferred-local')") == "saved-plan"
    assert page.evaluate("sessionStorage.getItem('qa-deferred-session')") == "saved-blend"
