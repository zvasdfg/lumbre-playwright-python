import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.almanac, pytest.mark.regression]


@pytest.mark.case("UI-097", "Failed illustration never blocks navigation and reloads after outage")
@pytest.mark.parametrize("failure", ["abort", "http503"])
def test_interrupted_image(almanac, failure):
    reader = almanac
    interrupted = []
    path = "**/editorial/almanac/page-011.jpeg"

    def respond(route):
        interrupted.append(route.request.url)
        if failure == "abort":
            route.abort("failed")
        else:
            route.fulfill(status=503, body="Unavailable", headers={"Cache-Control": "no-store"})

    reader.page.route(path, respond)
    reader.select(11)
    expect(reader.image).to_have_js_property("complete", True)
    expect(reader.image).to_have_js_property("naturalWidth", 0)
    assert interrupted
    reader.select(12)
    expect(reader.image).to_have_js_property("naturalWidth", 1145)
    reader.page.unroute(path, respond)
    reader.select(11)
    expect(reader.image).to_have_js_property("naturalWidth", 1145)
    expect(reader.status).to_contain_text("DOC. 011")
    reader.close()
