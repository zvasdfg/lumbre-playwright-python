import re
from pathlib import Path

import pytest
from playwright.sync_api import expect

from projects.lumbre.components.fire_planner import FirePlanner
from projects.lumbre.components.ingredient_lab import IngredientLab
from projects.lumbre.data.cases import BLEND_COMPONENT_IDS

pytestmark = [
    pytest.mark.ui,
    pytest.mark.portal,
    pytest.mark.navigation,
    pytest.mark.print_pdf,
    pytest.mark.regression,
]


@pytest.mark.case(
    "UI-103", "A4 PDF keeps visible title, steps/quantities, final section and no portal chrome"
)
@pytest.mark.parametrize("feature", ["product", "recipe", "blend-3", "blend-12", "plan"])
def test_print_content(page, app_url, feature, request):
    from pypdf import PdfReader  # Project PDF dependency; not needed for matrix collection.

    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto(app_url)
    tokens = []
    if feature == "product":
        page.get_by_role("button", name="Ver ficha de Sazonador multiuso", exact=True).click()
        tokens = ["Sazonador multiuso", "LMB-F-001", "Al llevarlo al fuego"]
    elif feature == "recipe":
        card = page.get_by_test_id("recipe-card").first
        title = card.locator("h3").inner_text()
        card.get_by_role("button").click()
        tokens = [title, "Preparación paso a paso", "Notas y fuentes"]
        tokens += page.locator(".recipe-method li strong").all_text_contents()
    elif feature.startswith("blend"):
        lab = IngredientLab(page)
        lab.open()
        count = int(feature.split("-")[1])
        ids = BLEND_COMPONENT_IDS[:count]
        for ingredient in ids:
            lab.add(ingredient)
        for ingredient in ids:
            lab.set_grams(ingredient, 150 / count)
        alias = "QA impresión " + "mezcla larga " * 4
        lab.save(alias)
        tokens = [
            alias.strip(),
            "SES-001",
            "Cantidades para preparar tu mezcla",
            "Total del lote",
            "150 g",
        ]
        tokens += page.locator(".lab-sheet-quantities tbody th").all_text_contents()
        tokens += page.locator(".lab-sheet-quantities tbody td").all_text_contents()
    else:
        planner = FirePlanner(page)
        planner.configure("asar", "kettle", "briquetas")
        page.locator(".planner-customize summary").click()
        planner.add_stage(1, name="Sellado PDF", notes="Marcar ambos lados")
        planner.add_stage(2, name="Reposo PDF", kind="pausa", notes="Fuera del fuego")
        planner.build()
        page.get_by_role("button", name="Imprimir / PDF", exact=True).click()
        tokens = [
            "PLAN DE FUEGO",
            "Sellado PDF",
            "Reposo PDF",
            "Fuera del fuego",
            "REGISTRO EN CAMPO",
        ]
    sheet = page.get_by_role("dialog")
    expect(sheet).to_be_visible()
    for token in tokens:
        expect(sheet).to_contain_text(token)
    # Wait for images/fonts before Chromium captures print, including lazy sheet assets.
    broken_images = page.evaluate("""async () => {
      await document.fonts.ready;
      await Promise.all([...document.querySelectorAll('[role=dialog] img,dialog img')]
        .map(img => img.decode().catch(() => {})));
      return [...document.querySelectorAll('[role=dialog] img,dialog img')]
        .filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src);
    }""")
    assert not broken_images, f"Cannot print broken images: {broken_images}"
    output = Path(request.config.getoption("--output")) / "pdf-contracts"
    output.mkdir(parents=True, exist_ok=True)
    pdf = output / f"UI-103-{feature}.pdf"
    page.pdf(path=str(pdf), prefer_css_page_size=True, print_background=True)
    reader = PdfReader(pdf)
    texts = [p.extract_text() or "" for p in reader.pages]
    assert 1 <= len(texts) <= 6, f"Unexpected page count: {len(texts)}"
    assert all(len(text.strip()) > 40 for text in texts), "Empty or near-empty print page"
    normalized = re.sub(r"\s+", " ", " ".join(texts))
    folded = normalized.casefold()
    for token in tokens:
        assert re.sub(r"\s+", " ", token).casefold() in folded, (
            f"PDF missing screen content: {token}"
        )
    for chrome in ("Entrar al laboratorio", "Tus fuegos repetibles", "El fuego nos reúne"):
        assert chrome.casefold() not in folded, f"Portal leaked into print: {chrome}"
    for p in reader.pages:
        assert abs(float(p.mediabox.width) - 595.28) < 2
        assert abs(float(p.mediabox.height) - 841.89) < 2
        origins = []

        def collect_origin(text, cm, tm, font, size, origins=origins):
            if text.strip():
                origins.append(
                    (
                        text.strip()[:60],
                        tm[4] * cm[0] + tm[5] * cm[2] + cm[4],
                        tm[4] * cm[1] + tm[5] * cm[3] + cm[5],
                    )
                )

        p.extract_text(visitor_text=collect_origin)
        # This catches off-page text origins, not arbitrary visual overlap or glyph clipping.
        assert all(
            -2 <= x <= float(p.mediabox.width) + 2 and -2 <= y <= float(p.mediabox.height) + 2
            for _, x, y in origins
        ), origins
    assert "codex-clipboard" not in normalized
    assert "captura aportada por el usuario" not in folded
    if feature.startswith("blend"):
        assert "% del lote" not in normalized
    print(f"PDF evidence: {pdf}; {len(texts)} pages")
