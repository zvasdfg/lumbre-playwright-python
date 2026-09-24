import pytest
from playwright.sync_api import Route, expect

from automation.core.reporting import TestLogger
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.case(
    "UI-048",
    "A stale catalog update preserves administrator edits for recovery",
)
def test_stale_product_update_is_recoverable(
    administrator_home: HomePage,
    test_log: TestLogger,
) -> None:
    product_id = 111
    attempted_price = 299
    captured_payload: dict[str, object] = {}

    with test_log.step("Open an existing product in catalog administration"):
        administrator_home.open_admin_catalog()
        admin = administrator_home.admin_catalog
        expect(admin.product(product_id)).to_be_visible()
        admin.select_product(product_id)

    def reject_stale_update(route: Route) -> None:
        if route.request.method == "PATCH":
            request_payload = route.request.post_data_json
            assert isinstance(request_payload, dict)
            captured_payload.update(request_payload)
            route.fulfill(
                status=409,
                content_type="application/json",
                body='{"error":"Product revision is stale"}',
            )
        else:
            route.fallback()

    administrator_home.page.route(
        f"**/api/admin/products/{product_id}",
        reject_stale_update,
    )

    with test_log.step("Attempt an update with a simulated stale revision"):
        admin.update_product_price(attempted_price)
        expect(admin.message).to_contain_text("El catálogo cambió en otra sesión.")
        test_log.values(
            simulated_status=409,
            captured_payload=captured_payload,
            observed_message=admin.message.inner_text(),
        )

    with test_log.step("Validate the revision contract and recoverable form state"):
        expect(admin.product_price_input).to_have_value(str(attempted_price))
        expect(admin.save_product_button).to_be_enabled()
        expect(admin.reload_button).to_be_enabled()
        assert captured_payload["expectedRevision"] == 1
        assert captured_payload["price"] == attempted_price
        test_log.values(
            retained_price=admin.product_price_input.input_value(),
            expected_revision=captured_payload["expectedRevision"],
            retry_available=True,
        )
