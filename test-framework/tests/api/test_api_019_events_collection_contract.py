import pytest

from framework.api.lumbre_api import LumbreApi
from framework.reporting import TestLogger


@pytest.mark.api
@pytest.mark.case("API-019", "The event collection publishes a consistent count and contract")
def test_events_collection_contract(api: LumbreApi, test_log: TestLogger) -> None:
    with test_log.step("Request the event collection"):
        result = api.events()
        events = result["data"]
        test_log.values(
            observed_count=result["count"],
            observed_event_titles=[event["title"] for event in events],
        )

    with test_log.step("Validate the collection contract"):
        required_fields = {"id", "day", "month", "city", "title", "detail", "spots"}
        observed_fields = [set(event) for event in events]
        test_log.values(
            expected_count=len(events),
            required_fields=sorted(required_fields),
            observed_fields=[sorted(fields) for fields in observed_fields],
        )
        assert result["count"] == len(events)
        assert events
        assert all(required_fields <= fields for fields in observed_fields)
        assert all(event["spots"] > 0 for event in events)
