import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.regression, pytest.mark.navigation, pytest.mark.portal]


@pytest.mark.parametrize(
    "name,target",
    [
        ("Método", "metodo"),
        ("Planificador", "planificador"),
        ("Recetas", "recetas"),
        ("Laboratorio", "laboratorio"),
        ("Provisiones", "tienda"),
    ],
)
@pytest.mark.case("UI-063", "First section navigation reaches the correct anchor")
def test_first_navigation(portal, name, target):
    page = portal
    if page.viewport_size["width"] < 700:
        page.locator(".mobile-nav summary").click()
        page.locator(f'.mobile-nav a[href="#{target}"]').click()
        expect(page.locator(".mobile-nav")).not_to_have_attribute("open", "")
    else:
        page.get_by_role("navigation", name="Navegación principal").get_by_role(
            "link", name=name, exact=True
        ).click()
    page.wait_for_function(
        """id => {
        const e = document.getElementById(id);
        return e && !e.hasAttribute('aria-busy') &&
          Math.abs(e.getBoundingClientRect().top -
            parseFloat(getComputedStyle(e).scrollMarginTop)) < 5;
    }""",
        arg=target,
    )
    assert page.url.endswith("#" + target)
