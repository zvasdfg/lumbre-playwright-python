from __future__ import annotations

from typing import Any

from playwright.sync_api import APIRequestContext, APIResponse, StorageState, expect


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

    def api_index(self) -> dict[str, Any]:
        return self._json(self._request.get("/api"))

    def openapi_document(self) -> dict[str, Any]:
        return self._json(self._request.get("/openapi/lumbre.openapi.json"))

    def recipes(self, *, category: str | None = None, query: str | None = None) -> dict[str, Any]:
        params: dict[str, str | float | bool] = {}
        if category:
            params["category"] = category
        if query:
            params["q"] = query
        return self._json(self._request.get("/api/recipes", params=params))

    def products(self) -> dict[str, Any]:
        return self._json(self._request.get("/api/products"))

    def cart_response(self) -> APIResponse:
        return self._request.get("/api/cart")

    def cart(self) -> dict[str, Any]:
        return self._json(self.cart_response())

    def add_cart_item(self, payload: dict[str, Any]) -> APIResponse:
        return self._request.post("/api/cart/items", data=payload)

    def update_cart_item(self, product_id: int, quantity: int) -> APIResponse:
        return self._request.patch(
            f"/api/cart/items/{product_id}",
            data={"quantity": quantity},
        )

    def remove_cart_item(self, product_id: int) -> APIResponse:
        return self._request.delete(f"/api/cart/items/{product_id}")

    def request_magic_link(self, payload: dict[str, Any]) -> APIResponse:
        return self._request.post("/api/account/magic-link", data=payload)

    def latest_local_magic_link(self, email: str) -> APIResponse:
        return self._request.get("/api/local/auth/magic-link", params={"email": email})

    def follow_magic_link(self, url: str) -> APIResponse:
        return self._request.get(url)

    def account(self) -> dict[str, Any]:
        return self._json(self._request.get("/api/account"))

    def logout(self) -> APIResponse:
        return self._request.post("/api/account/logout", data={})

    def admin_accounts(self) -> APIResponse:
        return self._request.get("/api/admin/accounts")

    def expire_session(self) -> APIResponse:
        return self._request.post("/api/local/auth/expire-session", data={})

    def storage_state(self) -> StorageState:
        return self._request.storage_state()

    def events(self) -> dict[str, Any]:
        return self._json(self._request.get("/api/events"))

    def reset_demo_data(self) -> dict[str, Any]:
        return self._json(self._request.post("/api/test/reset"))

    def create_product(self, payload: dict[str, Any]) -> APIResponse:
        return self._request.post("/api/products", data=payload)

    def create_member(self, payload: dict[str, Any]) -> APIResponse:
        return self._request.post("/api/members", data=payload)

    def ingredients(
        self,
        *,
        family: str | None = None,
        status: str | None = None,
        query: str | None = None,
    ) -> dict[str, Any]:
        params: dict[str, str | float | bool] = {}
        if family:
            params["familia"] = family
        if status:
            params["estado"] = status
        if query:
            params["q"] = query
        return self._json(self._request.get("/api/ingredientes", params=params))

    def ingredient(self, ingredient_id: str) -> APIResponse:
        return self._request.get("/api/ingredientes", params={"id": ingredient_id})

    def hypotheses(self) -> dict[str, Any]:
        return self._json(self._request.get("/api/hipotesis"))

    def hypothesis(self, hypothesis_id: str) -> APIResponse:
        return self._request.get(f"/api/hipotesis/{hypothesis_id}")

    def create_hypothesis(self, payload: dict[str, Any]) -> APIResponse:
        return self._request.post("/api/hipotesis", data=payload)

    def create_hypothesis_raw(self, body: str) -> APIResponse:
        return self._request.post(
            "/api/hipotesis",
            data=body.encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
