import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.regression, pytest.mark.planner, pytest.mark.portal]


@pytest.mark.case("UI-066", "Stage limit prevents a thirteenth row and removal restores capacity")
def test_stage_limit(page, app_url):
    page.goto(app_url)
    page.locator(".planner-customize summary").click()
    add = page.get_by_role("button", name="Añadir etapa", exact=True)
    for _ in range(12):
        add.click()
    expect(add).to_be_disabled()
    expect(page.locator(".planner-stage-editor fieldset")).to_have_count(12)
    page.get_by_role("button", name="Quitar etapa 12", exact=True).click()
    expect(add).to_be_enabled()
