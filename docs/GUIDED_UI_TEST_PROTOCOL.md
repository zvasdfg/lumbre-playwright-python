# Crear una prueba UI de forma guiada

Revisión: 2026-10-27. Este protocolo se usa cuando el usuario pide **creación
guiada**; no obliga a interrumpir mantenimiento autónomo autorizado. Mantiene la
arquitectura original y hace visibles las decisiones de prueba. La ejecución y
los resultados siguen el [README](../README.md), no este documento.

## Checkpoints

1. **Entender el riesgo.** Qué hace el usuario, qué resultado importa y qué defecto
   detectaría la prueba. Separar un comportamiento de sus variantes de entrada.
2. **Inspeccionar.** Buscar primero el ID/caso existente, fixtures, POM/componentes
   y datos. No duplicar una prueba ni inventar controles de una versión anterior.
3. **Proponer.** Explicar nombre/ID, archivo por componente, markers, precondiciones,
   pasos, oráculos y alcance. Confirmar este diseño en el modo guiado antes de editar.
4. **Implementar.** Test con metadata y test_log; acciones reutilizables en POM;
   expectativas en el test y datos independientes de la función bajo prueba.
5. **Verificar.** Colección, lint del cambio, ejecución individual y selección
   relacionada. Mostrar evidencia y límites; un TODO, skip o colección no es PASS.
6. **Integrar.** Actualizar catálogo por ID; correr la lane correspondiente. Un
   commit/deploy requiere autorización aplicable, no se deduce de escribir un test.

En mantenimiento de un caso conservar su ID y alcance. Una regresión de estabilidad
del mismo comportamiento no justifica otra suite paralela. No reciclar IDs
retirados para features ajenos.

## Separación concreta

~~~text
test-framework/
├── automation/                       Infraestructura sin imports de Lumbre
└── projects/lumbre/
    ├── pages/home_page.py            Composición/navegación
    ├── components/                   Acciones, sin asserts de negocio
    ├── data/cases.py                 Entradas y expectativas independientes
    └── tests/ui/recipes/
        └── test_ui_029_*.py          Oráculo de Escape y restauración de foco
~~~

Los directorios indican propiedad; markers indican ejecución. portal visita el
preview local, store es HTTPS externo y opt-in. specialized mantiene scripts con
archivos compartidos seriales. No añadir una carpeta “externas” para duplicar las
regresiones del portal que ya valida CI contra su artefacto.

## Ejemplo vigente: UI-029

Este es un caso existente, **no copiarlo como nuevo ID**. La fixture portal
entrega Page en un contexto limpio a 390/1440 px. El contrato real es cerrar
el diálogo de receta con Escape y restaurar foco, no mostrar un toast antiguo.

~~~python
import pytest
from playwright.sync_api import expect

pytestmark = [pytest.mark.ui, pytest.mark.portal, pytest.mark.regression, pytest.mark.recipes]


@pytest.mark.case("UI-029", "The recipe dialog closes with Escape and restores its trigger focus")
def test_recipe_feedback_can_be_dismissed(portal, test_log):
    trigger = portal.get_by_test_id("recipe-card").first.get_by_role("button")
    with test_log.step("Open the current recipe dialog"):
        trigger.click()
        expect(portal.get_by_role("dialog")).to_be_visible()
    with test_log.step("Dismiss it and restore access to the catalog"):
        portal.keyboard.press("Escape")
        expect(portal.get_by_role("dialog")).to_have_count(0)
        expect(trigger).to_be_focused()
~~~

El primer expect espera el estado visible; el último prueba el foco, no solo
ausencia del modal. No usar is_focused() inventado, sleeps ni force=True. Que
“no haya error” no es un oráculo suficiente.

## Implementación proporcional al riesgo

- Preferir role/name/label/test-id con scope del componente, no índices arbitrarios.
- Agregar un método al POM solo si representa una acción reutilizable del producto;
  no envolver click/fill por sistema ni mover asserts allí para acortar el test.
- Parametrizar entradas equivalentes con IDs legibles; otro resultado independiente
  merece otro caso. Mantener expectativas explícitas, no derivarlas del mismo modelo.
- Fallos de descarga: controlar la ruta antes de navegar, observar busy/error,
  comprobar una nueva descarga/documento y preservar datos. UI-077 es la referencia
  para recuperación; un cambio de URL por sí solo no demuestra recarga.
- Almacenamiento/PDF: usar datos sintéticos y paths únicos o lane serial.
- Flujos de tienda: solo lectura. Inventario, pedidos, checkout y pagos necesitan
  un ambiente y una autorización distintos.

## Ver la prueba y registrar el resultado

Desde la raíz, sin otro servidor ocupando 3001:

~~~bash
bash scripts/test-local.sh -k recipe_feedback_can_be_dismissed --headed --slowmo=150
~~~

Con preview ya iniciado:

~~~bash
BASE_URL=http://127.0.0.1:3001 test-framework/.venv/bin/pytest \
  -c test-framework/pyproject.toml -m 'portal and recipes' --headed
~~~

Guardar reporte/trace en los paths del runner, no en Git. Registrar revisión,
destino, selección, navegador, parámetros y resultado real. Reintentar no borra
el fallo anterior. Headed y slowmo ayudan a observar, no vuelven estable un caso.
Una revisión de PDF por texto no equivale a revisión visual ni aprobación editorial.

Referencias: [catálogo por ID](../test-framework/projects/lumbre/README.md),
[snippets](PLAYWRIGHT_PYTHON_SNIPPETS.md),
[core](../test-framework/README.md) y [seguridad](SECURITY.md).
