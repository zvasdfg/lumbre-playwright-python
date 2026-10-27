# Agregar un proyecto al framework

Guía revisada contra el core el 2026-10-27. Los ejemplos example_store son
**ficticios**: no son rutas ni funcionalidades de Lumbre. Para ejecutar Lumbre
sin crear otro proyecto, seguir el [README principal](../README.md).

## 1. Respetar la frontera

Todo selector, ruta, dato y regla de negocio pertenece a projects/<proyecto>.
automation contiene solo mecanismos reutilizables sin conocimiento del producto.
Reutilizar fixtures y evidencia, no copiar los selectores o reset de otra app.

~~~text
test-framework/projects/example_store/
├── __init__.py
├── components/                 Acciones de widgets sin asserts de negocio
├── pages/                      Navegación y composición
├── data/                       Entradas/expectativas independientes
├── api/                        Solo si el SUT realmente ofrece una API
├── conftest.py                 Clientes, fixtures y aislamiento propios
└── tests/{ui,api}/             Casos, oráculos y metadata
~~~

Añadir __init__.py a paquetes que se importen. No crear capas universales para
click/fill/locators: abstraer comportamiento de producto o infraestructura útil.
Los templates están en test-framework/templates; eliminar TODO/skip al completar
un caso. Un scaffold vacío no cuenta como cobertura.

## 2. Consumir fixtures existentes

| Fixture | Contrato |
| --- | --- |
| app_url | BASE_URL normalizado o URL aislada del worker |
| browser_context_args | Locale, viewport y proxy opcional |
| page | Página/contexto limpio de pytest-playwright |
| api_request_context | APIRequestContext genérico, sin API de producto implícita |
| test_log | Pasos, valores, tiempos y capturas para casos UI |

Ejemplo de fixture de un proyecto ficticio:

~~~python
import pytest
from projects.example_store.pages.home_page import HomePage


@pytest.fixture
def home(page, app_url):
    home_page = HomePage(page, app_url)
    home_page.open()
    return home_page
~~~

La página expone acciones; el test observa el resultado con expect. Cada caso
declara @pytest.mark.case("STORE-UI-001", "Resultado observable") y su categoría
ui/api. Registrar markers nuevos solo para dimensiones de selección necesarias.
No añadir portal/store de Lumbre a un sistema distinto para forzar discovery.

## 3. Configurar ejecución real

BASE_URL, locale, viewport, proxy y URLs por worker se aplican en el adapter.
AUTOMATION_PROJECT cambia la identidad del reporte, **no** la selección de tests.
HEADLESS y DEFAULT_TIMEOUT_MS se parsean pero no se aplican al lanzamiento ni
al Page timeout actual: usar --headed/--slowmo y políticas explícitas del SUT.
Consultar los detalles en el [README del core](../test-framework/README.md).

Desde la raíz, con el nuevo SUT ya disponible:

~~~bash
AUTOMATION_PROJECT='Example Store' BASE_URL=https://example.test \
test-framework/.venv/bin/pytest -c test-framework/pyproject.toml \
  test-framework/projects/example_store/tests -m 'ui or api' --headed
~~~

El path y dominio anteriores son ejemplos, no un comando que funcione antes de
crear el proyecto. **El -m explícito es necesario**: la configuración por defecto
selecciona framework_unit or portal y excluiría tests nuevos sin esos markers.
Para incorporarlo al portfolio, revisar testpaths, expresión addopts y CI de
forma deliberada; adaptar también ARCH-003, que protege exactamente los destinos
y paths actuales. No quitar ese contrato para evitar un fallo.

## 4. API y contratos, solo si existen

Un cliente de proyecto encapsula transporte/rutas repetidas y devuelve respuestas;
el test comprueba status y negocio. No copiar endpoints de cuentas/carrito
retirados de Lumbre. No agregar un reset autouse sin un contrato explícito del SUT.

OpenApiContract acepta un documento OpenAPI 3.1 y permite validate_document(),
validate_request(path, method, payload), validate_response(path, method, status,
payload) y response_statuses(path, method). Soporta referencias locales; rechaza
referencias remotas/circulares. El proyecto obtiene el documento y elige qué
operaciones validar. Ver [snippets](PLAYWRIGHT_PYTHON_SNIPPETS.md).

## 5. Lifecycle y paralelismo

El runner de Lumbre construye y sirve un portal estático: no sirve de gestor
genérico de bases de datos. Crear un runner específico solo si el nuevo SUT lo
necesita: preparar datos aislados, iniciar servicios propios, esperar readiness
con límite, ejecutar pytest, conservar evidencia y limpiar con trap/finalizers.
Nunca matar un proceso ajeno ni agregar startup de producto al plugin genérico.

BrowserContext aislado no aísla inventario, cuentas, pedidos, resets o límites del
servidor. Para pruebas mutables con xdist, cada worker debe tener namespace/tenant
o SUT aislado. AUTOMATION_WORKER_BASE_URLS asigna URLs ya iniciadas a gw0/gw1…;
no crea servicios. Mantener serial cualquier caso que comparta archivos de salida.

## 6. Criterios de integración

- Caso numerado, comportamiento observable, datos y expectativas independientes.
- Sin imports entre productos ni lógica del SUT en automation.
- Locators semánticos, esperas observables, sin sleeps/force como arreglo.
- Selección/discovery y ejecución individual documentadas y verificadas.
- Sin credenciales, sesiones reales, clientes ni reportes versionados.
- Evidencia de éxito **y de fallo** atribuible a la revisión ejecutada.
- Revisar Ruff/formato/tipos del código nuevo y las pruebas del core; documentar
  fallos de baseline en lugar de afirmar que todo el repositorio está limpio.

~~~bash
test-framework/.venv/bin/pytest -c test-framework/pyproject.toml -m framework_unit
node scripts/audit-public-repo.mjs
~~~

La integración no está terminada por tener archivos: requiere ejecutar los casos
del nuevo proyecto con su marcador/destino explícito y comprobar que no cambia
la selección ni el comportamiento de Lumbre.
