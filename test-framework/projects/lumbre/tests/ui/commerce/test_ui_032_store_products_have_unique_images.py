import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-032",
    "Every store product has a distinct catalog photograph",
)
def test_store_products_have_unique_images(
    home: HomePage,
    test_log: TestLogger,
) -> None:
    with test_log.step("Read product names and catalog image sources"):
        expect(home.product_cards).to_have_count(7)
        product_records = home.product_cards.evaluate_all(
            """
            cards => cards.map(card => ({
                name: card.querySelector('h3')?.textContent?.trim() ?? '',
                src: card.querySelector('.product-art img')?.getAttribute('src') ?? '',
                alt: card.querySelector('.product-art img')?.getAttribute('alt') ?? ''
            }))
            """
        )
        sources = [record["src"] for record in product_records]
        test_log.values(
            observed_product_count=len(product_records),
            observed_unique_sources=len(set(sources)),
            product_records=product_records,
        )

    with test_log.step("Validate distinct and descriptive product photography"):
        assert len(product_records) == 7
        assert len(set(sources)) == 7
        assert all(record["src"] for record in product_records)
        assert all(record["name"] in record["alt"] for record in product_records)
