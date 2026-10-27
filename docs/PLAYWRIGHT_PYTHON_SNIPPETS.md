# Playwright Python · ejemplos actuales

Revisión: 2026-10-27. Ejecutar desde la raíz con la instalación del
[README](../README.md). Fragmentos para adaptar, no una segunda suite ni casos
nuevos listos para registrar. No incluyen cuentas, carrito ni endpoints retirados.
Los snippets de editor generan scaffolds: quitar TODO/skip no basta sin un oráculo.

## Estructura de un caso

Usar un ID disponible y actualizar el catálogo; UI-029 ya existe. El ejemplo
completo con metadata, fixture y test_log está en el
[protocolo guiado](GUIDED_UI_TEST_PROTOCOL.md). Los tests contienen expectativas;
POMs/componentes solo navegación y acciones semánticas.

~~~python
from playwright.sync_api import expect


def assert_recipe_dialog_closes(page):
    trigger = page.get_by_test_id("recipe-card").first.get_by_role("button")
    trigger.click()
    expect(page.get_by_role("dialog")).to_be_visible()
    page.keyboard.press("Escape")
    expect(page.get_by_role("dialog")).to_have_count(0)
    expect(trigger).to_be_focused()
~~~

Este helper de ejemplo contiene un oráculo y por tanto pertenece al área de tests,
no al POM. Una vez materializados datos Python, usar assert; para UI cambiante,
expect reintenta de forma acotada.

## HomePage y laboratorio reales

HomePage expone hero_title, recipe_cards, product_cards, ingredient_lab,
fire_planner, open(), filter_recipes(label), search_recipes(text),
recipe_named(name) y product_named(name). No expone view_recipe(), toast, cart,
membership ni api. No copiar selectores de versiones anteriores.

~~~python
def inspect_manual_blend(home):
    home.open()
    home.ingredient_lab.open()
    # Los IDs deben venir de data/cases.py; add no inventa una cantidad.
    # Tras seleccionar ingredientes, el usuario introduce gramos positivos.
    home.page.get_by_label("Nombre de tu blend", exact=True).fill("Prueba sintética")
~~~

IngredientLab ofrece card(id), family(card), expand(group), add(id),
set_grams(id, value), save(title) y close_sheet(). Guardar requiere 2–12
ingredientes, alias válido, gramos positivos y total <=150 g. Usar fixtures
sintéticos, no proporciones de fabricación. Validar efectos en el test, no dar
por correcto un click solo porque no lanzó excepción.

## Pasos y valores observados

~~~python
def inspect_recipe_count(home, test_log):
    with test_log.step("Inspect the recipe catalog"):
        home.open()
        expect(home.recipe_cards.first).to_be_visible()
        count = home.recipe_cards.count()
        assert count > 0
~~~

test_log requiere metadata case en el test que lo consume; estos helpers no se
coleccionan por sí solos. Nunca registrar tokens, cookies o datos de clientes
como valores de reporte.

## Formularios, diálogos y esperas

~~~python
def search_recipe(page, title):
    page.get_by_placeholder("Buscar receta...", exact=True).fill(title)
    expect(page.get_by_test_id("recipe-card").first).to_be_visible()
~~~

Para un select real, select_option(value) debe usar una opción existente del DOM;
no aplicar select_option a botones de presets. Preferir get_by_label exacto para
inputs y get_by_role con nombre para acciones. Un cambio de copy/label exige
revisar accesibilidad y el contrato, no agregar .first para silenciar ambigüedad.

No usar wait_for_timeout ni force=True para resolver carreras. Esperar estado
visible, respuesta/ruta o documento nuevo. Los límites explícitos pertenecen al
caso y al riesgo, no a un timeout global infinito.

## Fallos de chunks controlados

~~~python
def fail_laboratory_download(page, base_url):
    page.route("**/*ingredient-lab*.js*", lambda route: route.fulfill(status=503, body="unavailable"))
    page.goto(base_url)
    page.get_by_role("link", name="Entrar al laboratorio", exact=True).click()
    expect(page.get_by_role("alert")).to_be_visible()
~~~

Es solo la inyección de fallo, no una prueba completa de recuperación. UI-077
controla también carga pendiente, espacio reservado, datos de sesión/locales,
click de recuperar, wait_for_url y una identidad nueva de documento dos veces.
Retirar la ruta fallida al probar recuperación. No asumir que page.reload o una
query nueva prueban por sí solos que descargó el módulo correcto.

## OpenAPI reutilizable (no es una API de Lumbre)

~~~python
from automation.core.contracts import OpenApiContract


def validate_example_response(document, payload):
    contract = OpenApiContract(document)
    contract.validate_document()
    contract.validate_response("/example", "get", 200, payload)
~~~

El documento/payload anterior son entradas que debe aportar el proyecto consumidor.
También existen validate_request(path, method, payload) y
response_statuses(path, method). Solo $ref locales; referencias externas/circulares
fallan explícitamente. No crear endpoints ficticios dentro de Lumbre para usarlo.

## Herramientas de observación

Con preview estático en 3001:

~~~bash
test-framework/.venv/bin/playwright codegen http://127.0.0.1:3001
bash scripts/test-static-ui.sh --headed -m 'portal and smoke'
test-framework/.venv/bin/pytest -c test-framework/pyproject.toml --collect-only -q
~~~

Para abrir un trace: playwright show-trace seguido del path real que imprimió
el runner. Codegen propone acciones, no expectativas de negocio; revisar locators,
datos, foco, errores, persistencia y arquitectura antes de incorporar su salida.
Reports y traces quedan fuera de Git; no grabar sesiones administrativas reales.

Para comandos completos, browser engines y CI consultar el README. Para los IDs
y límites vigentes consultar el [catálogo](../test-framework/projects/lumbre/README.md).
