import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-031",
    "Every laboratory ingredient uses its own specimen photograph",
)
def test_ingredients_have_unique_specimen_images(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    lab = home.ingredient_lab

    with test_log.step("Read every ingredient identifier and specimen image"):
        expect(lab.ingredient_cards).to_have_count(60)
        specimen_records = lab.specimen_buttons.evaluate_all(
            """
            buttons => buttons.map(button => ({
                id: button.dataset.ingredientId,
                src: button.querySelector('img')?.getAttribute('src') ?? ''
            }))
            """
        )
        specimen_sources = [record["src"] for record in specimen_records]
        test_log.values(
            observed_specimen_count=len(specimen_records),
            observed_unique_sources=len(set(specimen_sources)),
            sample_records=specimen_records[:3],
        )

    with test_log.step("Validate unique image ownership for the complete catalog"):
        assert len(specimen_records) == 60
        assert len(set(specimen_sources)) == 60
        assert all(record["id"] in record["src"] for record in specimen_records)
