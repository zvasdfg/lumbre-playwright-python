import pytest
from playwright.sync_api import expect

from automation.core.reporting import TestLogger
from projects.lumbre.api.lumbre_api import LumbreApi
from projects.lumbre.pages.home_page import HomePage


@pytest.mark.ui
@pytest.mark.parametrize("viewport_width", [1440, 390], ids=["desktop", "mobile-editor"])
@pytest.mark.case(
    "UI-062", "An administrator saves, previews and publishes a seasoning from the UI"
)
def test_admin_authors_product(
    administrator_home: HomePage, api: LumbreApi, test_log: TestLogger, viewport_width: int
) -> None:
    home = administrator_home
    admin = home.admin_catalog
    with test_log.step("Create a private seasoning draft through the editor"):
        home.open_admin_catalog()
        home.page.set_viewport_size({"width": viewport_width, "height": 900})
        admin.create_draft(
            "Sazonador de prueba local",
            "LMB-F-062",
            "Mezcla local para verificar el panel.",
            ["sal kosher", "pimienta negra", "ajo granulado"],
        )
        expect(admin.message).to_have_text("Borrador guardado. Solo lo ve administración.")
        expect(admin.publish_product_button).to_be_disabled()
        assert all(p.get("productCode") != "LMB-F-062" for p in api.products()["data"])
        assert all(p["id"] != "LMB-F-062" for p in api.hypotheses()["data"])
        test_log.values(draft_code=admin.product_code_input.input_value(), public_visibility=False)

    with test_log.step("Reload the saved draft and review its public preview"):
        admin.reload_button.click()
        expect(admin.product_name_input).to_have_value("Sazonador de prueba local")
        admin.preview_button.click()
        expect(admin.product_preview).to_contain_text("LMB-F-062")
        assert admin.root.evaluate("element => element.scrollWidth <= element.clientWidth + 1")
        expect(admin.publish_product_button).to_be_enabled()
        test_log.values(preview=admin.product_preview.inner_text())

    with test_log.step("Publish once and verify the store and laboratory share the record"):
        admin.publish_product_button.click()
        expect(admin.message).to_have_text("Producto actualizado.")
        admin.close()
        expect(home.product_named("Sazonador de prueba local")).to_contain_text("$99")
        expect(
            home.page.get_by_role("region", name="Fichas técnicas registradas").get_by_text(
                "LMB-F-062", exact=True
            )
        ).to_be_visible()
        sheets = [p for p in api.hypotheses()["data"] if p["id"] == "LMB-F-062"]
        assert len(sheets) == 1
        assert sheets[0]["producto"]["nombre"] == "Sazonador de prueba local"
        test_log.values(public_sheets=len(sheets), public_name=sheets[0]["producto"]["nombre"])
