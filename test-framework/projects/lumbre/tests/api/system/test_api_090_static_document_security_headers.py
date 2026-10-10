import pytest

pytestmark = [pytest.mark.api, pytest.mark.production, pytest.mark.remote_smoke, pytest.mark.smoke]


@pytest.mark.case("API-090", "Static HTML retains its security headers")
def test_static_document(api_request_context, test_log):
    with test_log.step("Read the public document"):
        response = api_request_context.get("/")
        assert response.status == 200
        assert "text/html" in response.headers.get("content-type", "")
        assert response.headers.get("x-content-type-options") == "nosniff"
        assert response.headers.get("x-frame-options") == "DENY"
        assert "frame-ancestors 'none'" in response.headers.get("content-security-policy", "")
