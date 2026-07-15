import pytest

from framework.api.lumbre_api import LumbreApi
from framework.reporting import TestLogger


@pytest.mark.api
@pytest.mark.case(
    "API-011",
    "The hypothesis registry preserves unique ids and research provenance",
)
def test_hypothesis_registry_has_research_provenance(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Request the complete hypothesis registry"):
        result = api.hypotheses()
        records = result["data"]
        recommended_records = [
            record
            for record in records
            if record.get("tipo_registro") == "recomendacion_investigada"
        ]

        test_log.values(
            observed_count=result["count"],
            recommended_count=len(recommended_records),
        )

    with test_log.step("Inspect registry identity and recommendation sources"):
        observed_ids = [record["id"] for record in records]
        recommendations_without_sources = [
            record["id"]
            for record in recommended_records
            if not record.get("recomendacion", {}).get("fuentes")
        ]

        test_log.values(
            observed_first_ids=observed_ids[:5],
            ids_are_unique=len(observed_ids) == len(set(observed_ids)),
            ids_are_sorted=observed_ids == sorted(observed_ids),
            recommendations_without_sources=recommendations_without_sources,
        )

    with test_log.step("Validate registry integrity and provenance"):
        assert result["count"] == len(records)
        assert len(recommended_records) >= 24
        assert len(observed_ids) == len(set(observed_ids))
        assert observed_ids == sorted(observed_ids)
        assert recommendations_without_sources == []
