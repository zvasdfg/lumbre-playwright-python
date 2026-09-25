import re

import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-054",
    "The laboratory starts collapsed by family and exposes cumin with its own image",
)
def test_lab_families_collapse_and_expose_cumin(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    lab = home.ingredient_lab

    with test_log.step("Inspect the initial family accordion"):
        expect(lab.family_groups).to_have_count(11)
        expect(lab.open_family_groups).to_have_count(1)
        initially_open_family = lab.open_family_groups.get_attribute("data-family")
        test_log.values(
            observed_family_count=lab.family_groups.count(),
            observed_open_family_count=lab.open_family_groups.count(),
            observed_initially_open_family=initially_open_family,
        )

    with test_log.step("Search the catalog for cumin"):
        lab.search("comino")
        expect(lab.ingredient_cards).to_have_count(1)
        expect(lab.ingredient_card("comino")).to_be_visible()
        cumin_image = lab.ingredient_card("comino").locator("img")
        expect(cumin_image).to_have_attribute("src", re.compile(r"comino\.jpg"))
        test_log.values(
            observed_ingredient="comino",
            observed_image_source=cumin_image.get_attribute("src"),
            observed_open_family=lab.open_family_groups.get_attribute("data-family"),
        )

    with test_log.step("Validate cumin ownership and the filtered family state"):
        expect(lab.open_family_groups).to_have_count(1)
        assert lab.open_family_groups.get_attribute("data-family") == "Semilla_aromatica"
