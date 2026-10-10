import pytest

pytestmark = [pytest.mark.api, pytest.mark.production, pytest.mark.remote_smoke, pytest.mark.smoke]


@pytest.mark.parametrize("path", ["/api/account", "/api/cart", "/api/orders", "/api/test/reset"])
@pytest.mark.case("API-091", "Retired API routes are not exposed")
def test_no_backend(api_request_context, test_log, path):
    with test_log.step(f"GET {path}; never POST to production"):
        assert api_request_context.get(path).status == 404
