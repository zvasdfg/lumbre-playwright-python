import pytest

from automation.core.contracts import OpenApiContract
from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.case(
    "API-062",
    "An administrator creates an event that becomes publicly reservable and auditable",
)
def test_admin_creates_public_event_with_audit(
    administrator_api: LumbreApi,
    openapi_contract: OpenApiContract,
    test_log: TestLogger,
) -> None:
    payload = {
        "day": "21",
        "month": "SEP",
        "city": "Mérida, YUC",
        "title": "Brasas del sureste",
        "detail": "Taller de recados, cítricos y fuego directo",
        "capacity": 16,
    }

    with test_log.step("Validate and submit the new event contract"):
        openapi_contract.validate_request("/api/admin/events", "post", payload)
        response = administrator_api.create_event(payload)
        created = response.json()["data"]
        test_log.values(observed_status=response.status, created_event=created)
        assert response.status == 201
        assert created["revision"] == 1
        openapi_contract.validate_response(
            "/api/admin/events", "post", response.status, response.json()
        )

    with test_log.step("Confirm that the public event projection exposes availability"):
        public = next(
            item for item in administrator_api.events()["data"] if item["id"] == created["id"]
        )
        test_log.values(public_event=public)
        assert public["title"] == payload["title"]
        assert public["capacity"] == payload["capacity"]
        assert public["spots"] == payload["capacity"]
        assert public["reservedSpots"] == 0

    with test_log.step("Confirm that creation is represented as an append-only audit event"):
        audit = administrator_api.administrative_audit_events().json()["data"][0]
        test_log.values(audit_event=audit)
        assert audit["resourceType"] == "event"
        assert audit["action"] == "created"
        assert audit["before"] is None
        assert audit["after"]["id"] == created["id"]
