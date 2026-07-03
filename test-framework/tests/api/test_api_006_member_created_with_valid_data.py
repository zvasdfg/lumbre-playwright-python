import pytest

from framework.api.lumbre_api import LumbreApi
from framework.reporting import TestLogger


@pytest.mark.api
@pytest.mark.case(
    "API-006",
    "The API registers a membership with valid data",
)
def test_member_is_created_with_valid_data(
    api: LumbreApi,
    test_log: TestLogger,
) -> None:
    with test_log.step("Prepare valid membership data"):
        payload = {
            "name": "Ana Parrilla",
            "email": "ana.parrilla@example.test",
            "experience": "intermedio",
            "terms": "accepted",
        }

        test_log.values(
            requested_name=payload["name"],
            requested_experience=payload["experience"],
            accepted_terms=payload["terms"],
        )

    with test_log.step("Send the membership creation request"):
        response = api.create_member(payload)
        response_body = response.json()
        test_log.values(
            observed_status=response.status,
            observed_response_keys=sorted(response_body.keys()),
        )

    with test_log.step("Validate the creation HTTP status code"):
        observed_status = response.status
        expected_status = 201
        test_log.values(
            observed_status=observed_status,
            expected_status=expected_status,
        )
        assert observed_status == expected_status

    with test_log.step("Validate the created membership"):
        member = response_body["data"]
        observed_created = response_body["created"]
        observed_member_id = member["id"]
        observed_name = member["name"]
        observed_experience = member["experience"]

        test_log.values(
            observed_created=observed_created,
            expected_created=True,
            observed_member_id=observed_member_id,
            expected_member_id_present=True,
            observed_name=observed_name,
            expected_name=payload["name"],
            observed_experience=observed_experience,
            expected_experience=payload["experience"],
        )

        assert observed_created is True
        assert isinstance(observed_member_id, str)
        assert observed_member_id
        assert observed_name == payload["name"]
        assert member["email"] == payload["email"]
        assert observed_experience == payload["experience"]
