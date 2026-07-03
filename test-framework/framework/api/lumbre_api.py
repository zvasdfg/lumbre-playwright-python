from __future__ import annotations

from typing import Any

from playwright.sync_api import APIRequestContext, APIResponse, expect


class LumbreApi:
    """Small domain client; tests should not know transport details."""

    def __init__(self, request: APIRequestContext) -> None:
        self._request = request

    @staticmethod
    def _json(response: APIResponse) -> dict[str, Any]:
        expect(response).to_be_ok()
        return response.json()

    def health(self) -> dict[str, Any]:
        return self._json(self._request.get("/api/health"))

    def recipes(self, *, category: str | None = None, query: str | None = None) -> dict[str, Any]:
        params: dict[str, str | float | bool] = {}
        if category:
            params["category"] = category
        if query:
            params["q"] = query
        return self._json(self._request.get("/api/recipes", params=params))

    def products(self) -> dict[str, Any]:
        return self._json(self._request.get("/api/products"))

    def reset_demo_data(self) -> dict[str, Any]:
        return self._json(self._request.post("/api/test/reset"))

    def create_product(self, payload: dict[str, Any]) -> APIResponse:
        return self._request.post("/api/products", data=payload)

    def create_member(self, payload: dict[str, Any]) -> APIResponse:
        return self._request.post("/api/members", data=payload)
