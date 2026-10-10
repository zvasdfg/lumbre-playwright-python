import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.regression, pytest.mark.laboratory]


@pytest.mark.case(
    "UI-054",
    "The cumin family can be expanded, collapsed and reopened without losing its ingredient",
)
def test_lab_families_collapse_and_expose_cumin(lab, test_log):
    card = lab.card("comino")
    family = lab.family(card)
    with test_log.step("Expand the family containing cumin"):
        lab.expand(family)
        expect(card).to_be_visible()
    with test_log.step("Collapse and reopen the same family"):
        family.locator("summary").click()
        expect(card).not_to_be_visible()
        family.locator("summary").click()
        expect(card).to_be_visible()
