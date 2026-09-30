import pytest

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-011",
    "A new laboratory preserves only the public production archive",
)
def test_hypothesis_registry_starts_with_public_production_records(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Request the hypothesis registry for a new scenario"):
        result = api.hypotheses()
        records = result["data"]
        observed_ids = [record["id"] for record in records]
        test_log.values(
            observed_count=result["count"],
            observed_ids=observed_ids,
            expected_ids=["LMB-F-001", "LMB-F-002", "LMB-F-003", "LMB-F-004"],
        )

    with test_log.step("Validate that production records are public and do not expose formulas"):
        assert observed_ids == ["LMB-F-001", "LMB-F-002", "LMB-F-003", "LMB-F-004"]
        assert result["count"] == 4
        assert all(record["estado"] == "producto_en_produccion" for record in records)
        assert all(record["tipo_registro"] == "producto_produccion" for record in records)
        assert all("formula" not in record for record in records)
        assert all(record["producto"]["alcance_formula"] == "declaracion_de_ingredientes" for record in records)
