import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case("API-003", "The environment restores a known demo data version")
def test_demo_data_can_be_reset(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Request a demo data reset"):
        response = api.reset_demo_data()
        test_log.values(
            observed_reset=response["reset"],
            expected_reset=True,
            observed_seed_version=response["seedVersion"],
        )

    with test_log.step("Validate the reset confirmation and seed version"):
        assert response["reset"] is True
        assert response["seedVersion"]
