import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.regression, pytest.mark.laboratory]


@pytest.mark.case(
    "UI-019", "An anonymous blend remains available in the current session without server mutations"
)
def test_anonymous_blend_persists_in_current_session(lab, test_log):
    page = lab.page
    mutations = []
    page.on(
        "request",
        lambda request: (
            mutations.append(request.url)
            if request.method in {"POST", "PUT", "PATCH", "DELETE"}
            else None
        ),
    )
    with test_log.step("Create a named local blend"):
        lab.add("sal_kosher")
        lab.add("comino")
        # This pair has no automatic reference. These synthetic amounts make
        # the storage input valid; they are not a seasoning recommendation.
        page.get_by_label("Gramos de sal kosher", exact=True).fill("135")
        page.get_by_label("Gramos de comino", exact=True).fill("15")
        lab.save("Sal y comino de prueba")
        expect(page.get_by_test_id("hypothesis-print-preview")).to_be_visible()
        lab.close_sheet()
    with test_log.step("Reload and restore only from browser session storage"):
        page.reload()
        lab.open()
        expect(page.get_by_test_id("session-blends")).to_contain_text("Sal y comino de prueba")
        stored = page.evaluate(
            "JSON.parse(sessionStorage.getItem('lumbre.ingredient-lab.session-blends.v1'))"
        )
        assert len(stored) == 1
        assert stored[0]["title"] == "Sal y comino de prueba"
        assert mutations == []
        test_log.values(storage_scope="current browser session", server_mutations=mutations)
