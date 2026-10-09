"""Boundary recovery and keyboard contracts; no production writes."""
import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.regression]


@pytest.mark.parametrize("hours", ["0", "-1", "48.1"])
@pytest.mark.case("BOUNDARY-001", "Duration bounds reject invalid plans and recover")
def test_duration_bounds_and_recovery(page, app_url, hours):
    page.goto(app_url)
    duration = page.get_by_label("Horas de cocción", exact=True)
    duration.fill(hours)
    assert not duration.evaluate("e => e.checkValidity()")
    page.get_by_role("button", name="Construir plan de fuego", exact=True).click()
    expect(page.get_by_role("status", name="Plan de fuego listo")).to_have_count(0)
    duration.fill("2")
    page.get_by_role("button", name="Construir plan de fuego", exact=True).click()
    expect(page.get_by_role("status", name="Plan de fuego listo")).to_be_visible()


@pytest.mark.case("QUICK-001", "Quick presets replace goal and fuel without stale state")
def test_quick_plan_transitions(page, app_url):
    page.goto(app_url)
    for name, goal, fuel in [("Indirecto con humo", "ahumar", "briquetas"),
                             ("Dos zonas", "asar", "carbon"),
                             ("Comida directa", "asar", "carbon")]:
        page.locator(".quick-plans").get_by_role("button", name=name).click()
        expect(page.get_by_label("Objetivo de cocción", exact=True)).to_have_value(goal)
        expect(page.get_by_label("Combustible principal", exact=True)).to_have_value(fuel)
        page.get_by_role("button", name="Construir plan de fuego", exact=True).click()
        expect(page.get_by_role("status", name="Plan de fuego listo")).to_be_visible()


@pytest.mark.parametrize("width", [390, 1440])
@pytest.mark.case("KEYBOARD-001", "Modal isolates background and restores trigger focus")
def test_product_keyboard_modal(page, app_url, width):
    page.set_viewport_size({"width": width, "height": 900})
    page.goto(app_url + "/#tienda")
    trigger = page.get_by_role("button", name="Ver ficha de Sazonador multiuso", exact=True)
    trigger.focus()
    page.keyboard.press("Enter")
    dialog = page.get_by_role("dialog")
    expect(dialog).to_be_visible()
    # Native dialog may focus the first action instead of the close action.
    # The accessibility contract is containment, not a particular button.
    assert dialog.evaluate("e => e.contains(document.activeElement)")
    for key in ["Tab"] * 8 + ["Shift+Tab"] * 8:
        page.keyboard.press(key)
        # Browser chrome is a legitimate tab stop; background document controls are not.
        assert dialog.evaluate("e => e.contains(document.activeElement) || (!document.hasFocus() && document.activeElement === document.body)")
    # Return from browser chrome, if needed, before testing Escape.
    if not page.evaluate("document.hasFocus()"):
        page.keyboard.press("Tab")
    assert dialog.evaluate("e => e.contains(document.activeElement)")
    page.keyboard.press("Escape")
    expect(dialog).to_have_count(0)
    expect(trigger).to_be_focused()
    assert page.evaluate("document.body.style.overflow !== 'hidden'")


@pytest.mark.case("NETWORK-001", "Interrupted laboratory chunk presents recovery and reloads")
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
            route.fulfill(status=503, body="Temporary failure", headers={"Cache-Control": "no-store"})
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
