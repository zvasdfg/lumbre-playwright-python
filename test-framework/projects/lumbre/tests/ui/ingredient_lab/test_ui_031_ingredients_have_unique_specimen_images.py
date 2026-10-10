import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.regression, pytest.mark.laboratory]


@pytest.mark.case("UI-031", "Each of the 60 ingredients owns a distinct specimen photograph")
def test_ingredients_have_unique_specimen_images(lab, test_log):
    with test_log.step("Inspect every ingredient image source"):
        cards = lab.page.get_by_test_id("ingredient-card")
        expect(cards).to_have_count(60)
        records = cards.evaluate_all(
            "es => es.map(e => ({"
            "id: e.querySelector('[data-ingredient-id]').dataset.ingredientId, "
            "src: e.querySelector('img').getAttribute('src')}))"
        )
        sources = [record["src"] for record in records]
        test_log.values(ingredient_count=len(records), unique_images=len(set(sources)))
    with test_log.step("Check image ownership rather than reusing one photograph"):
        assert len(set(sources)) == 60
        assert all(record["id"] in record["src"] for record in records)
