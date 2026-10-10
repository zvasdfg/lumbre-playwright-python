import pytest
from playwright.sync_api import expect

from projects.lumbre.components.fire_planner import FirePlanner

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.almanac, pytest.mark.regression]


@pytest.mark.case("UI-104", "A slow reader download exposes loading and keeps the planner usable")
def test_slow_reader_chunk(portal):
    page = portal
    pending = []
    pattern = "**/*fire-almanac*.js*"
    page.route(pattern, lambda route: pending.append(route))
    trigger = page.get_by_role("button", name="Almanaque", exact=False)
    trigger.click()
    expect(trigger).to_have_attribute("aria-busy", "true")
    expect(page.get_by_role("dialog")).to_have_count(0)
    assert pending, "The intended lazy module must be held pending"
    # No sleeping or timing budget: the route remains pending until explicitly released.
    planner = FirePlanner(page)
    planner.configure("asar", "kettle", "carbon")
    planner.build()
    expect(page.get_by_role("status", name="Plan de fuego listo")).to_be_visible()
    for route in pending:
        route.continue_()
    page.unroute(pattern)
    expect(page.get_by_role("dialog", name="Almanaque de fuego", exact=True)).to_be_visible()
    page.get_by_role("button", name="Cerrar almanaque", exact=True).click()
    expect(trigger).to_be_focused()
    expect(page.get_by_role("status", name="Plan de fuego listo")).to_be_visible()
