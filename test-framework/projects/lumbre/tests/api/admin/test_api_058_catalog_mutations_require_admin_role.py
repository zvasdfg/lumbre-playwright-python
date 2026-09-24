from collections.abc import Callable

import pytest
from playwright.sync_api import APIResponse

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi


@pytest.mark.api
@pytest.mark.parametrize(
    ("resource", "mutate"),
    [
        (
            "product",
            lambda api: api.create_product(
                {"name": "Rub privado", "category": "blends", "price": 220}
            ),
        ),
        (
            "event",
            lambda api: api.create_event(
                {
                    "day": "12",
                    "month": "SEP",
                    "city": "Oaxaca, OAX",
                    "title": "Mesa privada",
                    "detail": "Sesión de prueba",
                    "capacity": 10,
                }
            ),
        ),
    ],
)
@pytest.mark.case(
    "API-058",
    "Catalog mutations reject anonymous and customer accounts before accepting an administrator",
)
def test_catalog_mutations_require_admin_role(
    api: LumbreApi,
    test_log: TestLogger,
    resource: str,
    mutate: Callable[[LumbreApi], APIResponse],
) -> None:
    with test_log.step(f"Attempt the {resource} mutation anonymously"):
        anonymous = mutate(api)
        test_log.values(resource=resource, observed_status=anonymous.status, expected_status=401)
        assert anonymous.status == 401

    with test_log.step("Authenticate a regular customer and repeat the mutation"):
        email = f"catalog.{resource}.customer@example.test"
        assert api.request_magic_link({"name": "Cliente Catálogo", "email": email}).status == 200
        link = api.latest_local_magic_link(email).json()["data"]["url"]
        assert api.follow_magic_link(link).status == 200
        customer = mutate(api)
        test_log.values(
            observed_role=api.account()["data"]["role"],
            observed_status=customer.status,
            expected_status=403,
        )
        assert customer.status == 403

    with test_log.step("Confirm that neither rejected request changed the public catalog"):
        collection = api.products() if resource == "product" else api.events()
        names = [item.get("name", item.get("title")) for item in collection["data"]]
        test_log.values(observed_public_names=names)
        assert "Rub privado" not in names
        assert "Mesa privada" not in names
