from __future__ import annotations

import pytest
from playwright.sync_api import APIRequestContext, Page

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


@pytest.fixture(autouse=True)
def reset_scenario(api: LumbreApi) -> None:
    api.reset_demo_data()
