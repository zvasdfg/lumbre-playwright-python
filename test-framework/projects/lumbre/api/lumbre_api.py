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

    def health_response(self) -> APIResponse:
        return self._request.get("/api/health")

    def health(self) -> dict[str, Any]:
        return self._json(self.health_response())

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

    def add_cart_item(
        self,
        payload: dict[str, Any],
        *,
        headers: dict[str, str] | None = None,
    ) -> APIResponse:
        return self._request.post("/api/cart/items", data=payload, headers=headers)

    def update_cart_item(self, product_id: int, quantity: int) -> APIResponse:
        return self._request.patch(
            f"/api/cart/items/{product_id}",
            data={"quantity": quantity},
        )

    def remove_cart_item(self, product_id: int) -> APIResponse:
        return self._request.delete(f"/api/cart/items/{product_id}")

    def create_order(self, payload: dict[str, Any], idempotency_key: str) -> APIResponse:
        return self._request.post(
            "/api/orders",
            data=payload,
            headers={"Idempotency-Key": idempotency_key},
        )

    def orders(self) -> APIResponse:
        return self._request.get("/api/orders")

    def order(self, order_id: str) -> APIResponse:
        return self._request.get(f"/api/orders/{order_id}")

    def pay_order(
        self,
        order_id: str,
        scenario: str,
        idempotency_key: str,
    ) -> APIResponse:
        return self._request.post(
            f"/api/orders/{order_id}/payment",
            data={"scenario": scenario},
            headers={"Idempotency-Key": idempotency_key},
        )

    def create_checkout_session(self, order_id: str, idempotency_key: str) -> APIResponse:
        return self._request.post(
            f"/api/orders/{order_id}/checkout-session",
            data={},
            headers={"Idempotency-Key": idempotency_key},
        )

    def cancel_order(self, order_id: str, idempotency_key: str) -> APIResponse:
        return self._request.post(
            f"/api/orders/{order_id}/cancel",
            headers={"Idempotency-Key": idempotency_key},
        )

    def update_order_fulfillment(self, order_id: str, status: str) -> APIResponse:
        return self._request.patch(
            f"/api/admin/orders/{order_id}/fulfillment",
            data={"status": status},
        )

    def stripe_webhook(self, raw_body: str, signature: str | None = None) -> APIResponse:
        headers = {"Content-Type": "application/json"}
        if signature is not None:
            headers["Stripe-Signature"] = signature
        return self._request.post(
            "/api/payments/stripe/webhook",
            data=raw_body.encode("utf-8"),
            headers=headers,
        )

    def request_magic_link(self, payload: dict[str, Any]) -> APIResponse:
        return self._request.post("/api/account/magic-link", data=payload)

    def latest_local_magic_link(self, email: str) -> APIResponse:
        return self._request.get("/api/local/auth/magic-link", params={"email": email})

    def follow_magic_link(self, url: str) -> APIResponse:
        return self._request.get(url)

    def account(self) -> dict[str, Any]:
        return self._json(self._request.get("/api/account"))

    def membership_preferences(self) -> APIResponse:
        return self._request.get("/api/account/preferences")

    def update_membership_preferences(self, payload: dict[str, Any]) -> APIResponse:
        return self._request.put("/api/account/preferences", data=payload)

    def logout(self) -> APIResponse:
        return self._request.post("/api/account/logout", data={})

    def admin_accounts(self) -> APIResponse:
        return self._request.get("/api/admin/accounts")

    def admin_products(self) -> APIResponse:
        return self._request.get("/api/admin/products")

    def create_product(self, payload: dict[str, Any]) -> APIResponse:
        return self._request.post("/api/admin/products", data=payload)

    def update_product(self, product_id: int, payload: dict[str, Any]) -> APIResponse:
        return self._request.patch(f"/api/admin/products/{product_id}", data=payload)

    def admin_events(self) -> APIResponse:
        return self._request.get("/api/admin/events")

    def create_event(self, payload: dict[str, Any]) -> APIResponse:
        return self._request.post("/api/admin/events", data=payload)

    def update_event(self, event_id: int, payload: dict[str, Any]) -> APIResponse:
        return self._request.patch(f"/api/admin/events/{event_id}", data=payload)

    def administrative_audit_events(self) -> APIResponse:
        return self._request.get("/api/admin/audit-events")

    def expire_session(self) -> APIResponse:
        return self._request.post("/api/local/auth/expire-session", data={})

    def storage_state(self) -> StorageState:
        return self._request.storage_state()

    def events(self) -> dict[str, Any]:
        return self._json(self._request.get("/api/events"))

    def reservations(self) -> APIResponse:
        return self._request.get("/api/reservations")

    def create_event_reservation(self, event_id: int, party_size: Any) -> APIResponse:
        return self._request.post(
            f"/api/events/{event_id}/reservations",
            data={"partySize": party_size},
        )

    def fire_presets(self) -> APIResponse:
        return self._request.get("/api/fire-presets")

    def save_fire_preset(self, payload: dict[str, Any]) -> APIResponse:
        return self._request.post("/api/fire-presets", data=payload)

    def sync_fire_presets(self, presets: list[dict[str, Any]]) -> APIResponse:
        return self._request.post("/api/fire-presets/sync", data={"presets": presets})

    def delete_fire_preset(self, preset_id: str) -> APIResponse:
        return self._request.delete(f"/api/fire-presets/{preset_id}")

    def reset_demo_data_response(self) -> APIResponse:
        return self._request.post("/api/test/reset")

    def reset_demo_data(self) -> dict[str, Any]:
        return self._json(self.reset_demo_data_response())

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
