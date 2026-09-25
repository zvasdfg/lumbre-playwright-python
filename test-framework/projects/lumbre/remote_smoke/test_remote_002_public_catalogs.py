import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.smoke
@pytest.mark.remote_smoke
@pytest.mark.case(
    "REMOTE-002",
    "The deployed public catalogs expose the expected seeded content",
)
def test_deployed_public_catalogs(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Read every public catalog used by the portal"):
        catalogs = {
            "recipes": api.recipes(),
            "products": api.products(),
            "events": api.events(),
            "ingredients": api.ingredients(),
            "hypotheses": api.hypotheses(),
        }
        observed_counts = {
            name: payload["count"]
            for name, payload in catalogs.items()
        }
        test_log.values(observed_catalog_counts=observed_counts)

    with test_log.step("Validate the minimum production content contract"):
        assert observed_counts["recipes"] >= 100
        assert observed_counts["products"] >= 7
        assert observed_counts["events"] >= 3
        assert observed_counts["ingredients"] > 0
        assert observed_counts["hypotheses"] > 0
