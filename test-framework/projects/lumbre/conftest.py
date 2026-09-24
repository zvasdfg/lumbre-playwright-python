from __future__ import annotations

from typing import Any, cast

import pytest
from playwright.sync_api import APIRequestContext, Page, StorageState

from automation.core.contracts import OpenApiContract
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.pages.home_page import HomePage


@pytest.fixture
def api(api_request_context: APIRequestContext) -> LumbreApi:
    return LumbreApi(api_request_context)


@pytest.fixture(scope="session")
def openapi_contract(api_request_context: APIRequestContext) -> OpenApiContract:
    api_client = LumbreApi(api_request_context)
    return OpenApiContract(api_client.openapi_document())


@pytest.fixture
def home(page: Page, app_url: str) -> HomePage:
    home_page = HomePage(page, app_url)
    home_page.open()
    return home_page


@pytest.fixture
def authenticated_storage_state(api: LumbreApi) -> StorageState:
    """Build reusable browser authentication without repeating the UI login flow."""
    email = "fixture.customer@example.test"
    response = api.request_magic_link({"name": "Cliente Fixture", "email": email})
    assert response.status == 200
    delivery = api.latest_local_magic_link(email)
    assert delivery.status == 200
    verification = api.follow_magic_link(delivery.json()["data"]["url"])
    assert verification.status == 200
    return api.storage_state()


@pytest.fixture
def authenticated_api(api: LumbreApi) -> LumbreApi:
    """Return the domain client with a deterministic customer session."""
    email = "fixture.customer@example.test"
    assert api.request_magic_link({"name": "Cliente Fixture", "email": email}).status == 200
    delivery = api.latest_local_magic_link(email)
    assert delivery.status == 200
    assert api.follow_magic_link(delivery.json()["data"]["url"]).status == 200
    return api


@pytest.fixture
def administrator_api(api: LumbreApi) -> LumbreApi:
    """Return the domain client authenticated as the deterministic test administrator."""
    email = "admin@lumbre.example.test"
    assert api.request_magic_link({"name": "Administración Lumbre", "email": email}).status == 200
    delivery = api.latest_local_magic_link(email)
    assert delivery.status == 200
    assert api.follow_magic_link(delivery.json()["data"]["url"]).status == 200
    assert api.account()["data"]["role"] == "admin"
    return api


@pytest.fixture
def administrator_storage_state(administrator_api: LumbreApi) -> StorageState:
    """Build reusable browser authentication for the deterministic administrator."""
    return administrator_api.storage_state()


@pytest.fixture
def authenticated_home(
    page: Page,
    app_url: str,
    authenticated_storage_state: StorageState,
) -> HomePage:
    cookies = cast(Any, authenticated_storage_state["cookies"])
    page.context.add_cookies(cookies)
    home_page = HomePage(page, app_url)
    home_page.open()
    return home_page


@pytest.fixture
def administrator_home(
    page: Page,
    app_url: str,
    administrator_storage_state: StorageState,
) -> HomePage:
    cookies = cast(Any, administrator_storage_state["cookies"])
    page.context.add_cookies(cookies)
    home_page = HomePage(page, app_url)
    home_page.open()
    return home_page


@pytest.fixture(autouse=True)
def reset_scenario(api: LumbreApi) -> None:
    api.reset_demo_data()
