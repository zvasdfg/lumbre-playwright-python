# Lumbre · catálogo numerado de pruebas

Revisión de código y colección: **2026-10-27**. Una sola suite activa, con la
separación original: core reutilizable, proyecto, POMs/componentes, datos y tests.
Este documento define casos y cobertura; el [README principal](../../../README.md)
define instalación, ejecución local/headed/CI, destinos y evidencia de releases.

~~~text
projects/lumbre/
├── components/                 fire_almanac, fire_planner, ingredient_lab: acciones
├── pages/home_page.py          Navegación y composición, sin oráculos de negocio
├── data/cases.py               Entradas independientes del modelo probado
├── support/specialized.py      Adaptador técnico de ocho grupos seriales
├── conftest.py                 Contextos limpios, viewports y protección de destino
└── tests/
    ├── test_architecture.py    Cuatro contratos estructurales
    └── ui/
        ├── home/              Navegación, accesibilidad, recuperación, impresión
        ├── recipes/           Catálogo, búsqueda, fichas y referencias de producto
        ├── ingredient_lab/    Selección, gramos manuales, radar y blends de sesión
        ├── fire_planner/      Configuración, combustible, etapas y planes locales
        ├── almanac/           Documentos, notas, zoom, teclado y recuperación
        └── commerce/          Catálogo local y tienda externa de solo lectura
~~~

## Cómo leer el catálogo

Cada archivo test_ui_NNN_*.py declara su mismo ID mediante @pytest.mark.case.
Un ID es un comportamiento; sus parámetros generan varias ejecuciones. Los
huecos son IDs retirados, no pruebas omitidas. No se reciclan para otros fines.
No hay suite lumbre_static ni pruebas del backend eliminado. Algunas referencias
históricas fueron reescritas por seguridad: no se garantiza recuperar cualquier
antiguo checkpoint por su hash ni se debe mezclar historia previa a la limpieza.

En la tabla, **N** cuenta ejecuciones Chromium de la colección actual. Salvo
STORE, todos son portal. **M** va a la matriz, **S** al grupo serial y **C** se
repite además en Firefox/WebKit. Sin letra: lane general. C no es otro caso.
La colección completa tiene 455 ejecuciones: 431 framework/portal y 24 STORE
opt-in. Descubrir/coleccionar no demuestra PASS.

## Casos UI, en orden de ID

| ID | Componente | N / lane | Resultado observable |
| --- | --- | --- | --- |
| UI-001 | home | 2 | Propósito y entradas funcionales de inicio |
| UI-002 | recipes | 6 | Filtros, búsqueda, vacío y recuperación |
| UI-003 | recipes | 2 | Consulta sin coincidencias y limpieza |
| UI-006 | recipes | 2 | Búsqueda por título real |
| UI-012 | fire_planner | 6 | Defaults por método, persistencia e impresión vigente |
| UI-015 | ingredient_lab | 2 | Búsqueda, gramos, radar, alias y eliminación |
| UI-016 | ingredient_lab | 60 M | Ficha, selección y retiro de cada ingrediente |
| UI-017 | ingredient_lab | 2 | Límite de 12 componentes y recuperación al retirar |
| UI-018 | ingredient_lab | 2 | Duplicar/reabrir/crear variante sin alterar original |
| UI-019 | ingredient_lab | 2 | Blend de sesión sin mutación remota |
| UI-020 | ingredient_lab | 2 | Mínimo de dos componentes para guardar |
| UI-021 | ingredient_lab | 2 | Retirar conserva gramos de los demás |
| UI-022 | ingredient_lab | 2 | Biblioteca conserva documento, alias y gramos |
| UI-026 | recipes | 2 | Abrir la receta seleccionada |
| UI-028 | home | 2 | Controles críticos en 320/390 px |
| UI-029 | recipes | 2 | Escape cierra ficha y devuelve foco al disparador |
| UI-030 | commerce | 2 | Cuatro productos de producción en catálogo local |
| UI-031 | ingredient_lab | 2 | Fotografías distintas para los 60 ingredientes |
| UI-032 | commerce | 2 | Cuatro fotos de producto distintas y cargadas |
| UI-033 | fire_planner | 2 | Eliminar/deshacer, recargar, duplicar y cancelar |
| UI-034 | recipes | 1 M | Las 100 fichas paginadas en dos tamaños, contenido y foco |
| UI-052 | home | 2 | Privacidad local y compra externa en footer |
| UI-053 | recipes | 2 | Paginación, producto vinculado y retorno al contexto |
| UI-054 | ingredient_lab | 2 | Expandir/contraer familia y encontrar comino |
| UI-055 | almanac | 2 | Límites del lector e imágenes |
| UI-060 | ingredient_lab | 2 | Vista A4 guardada y llamada a imprimir |
| UI-063 | home | 10 | Primera navegación a cinco anclas en dos tamaños |
| UI-064 | fire_planner | 48 M | Equipos, objetivos y combustible válido con presupuesto |
| UI-065 | fire_planner | 10 | Soportes, unidades y etapas ordenadas |
| UI-066 | fire_planner | 1 | Máximo de 12 etapas y retiro |
| UI-067 | ingredient_lab | 2 | Cocción y fórmula guardada permanecen separadas |
| UI-068 | ingredient_lab | 2 | Cuatro pimientas ponderadas por gramos en el radar |
| UI-069 | ingredient_lab | 6 | Coincidencia de ingredientes: sin match, umbral 80 y 100 |
| UI-070 | ingredient_lab | 5 | Gramos/alias inválidos y corrección |
| UI-071 | fire_planner | 8 | Cambiar configuración invalida impresión anterior |
| UI-072 | fire_planner | 4 | Reemplazar/copiar un plan y recargar |
| UI-073 | fire_planner | 2 | Protección frente a otra pestaña |
| UI-074 | fire_planner | 3 C | Límites de duración y recuperación |
| UI-075 | fire_planner | 1 C | Transición a preset rápido |
| UI-076 | commerce | 2 C | Ficha modal aísla fondo y restaura foco |
| UI-077 | ingredient_lab | 4 C | Chunk abortado/503, espacio reservado y dos recuperaciones |
| UI-078 | home | 1 S | Aceptación estática y PDFs representativos |
| UI-079 | home | 1 S | Almacenamiento corrupto, denegado y sin cuota |
| UI-080 | fire_planner | 1 S | Objetivos, incompatibilidades y ficha imprimible |
| UI-081 | fire_planner | 1 S | Controles primarios, defaults, unidades y planes |
| UI-082 | fire_planner | 1 S | Estimaciones de cada combustible |
| UI-083 | fire_planner | 1 S | Tamaño kettle y combustible |
| UI-084 | fire_planner | 1 S | Referencias/defaults Weber y sus límites |
| UI-085 | recipes | 1 S | Ir al producto y volver a receta |
| UI-086 | commerce | 16 STORE | Cuatro destinos de compra × dos tamaños × tarjeta/ficha |
| UI-087 | commerce | 8 STORE | Galerías de cuatro productos × dos tamaños |
| UI-092 | almanac | 106 M | 53 documentos × dos tamaños: asset, ordinal y overflow |
| UI-093 | almanac | 6 | Tres documentos × dos tamaños: zoom, fit y reset |
| UI-094 | almanac | 2 C | Flechas, límites, Escape y foco en disparador |
| UI-095 | almanac | 2 C | Cerrar/reabrir, scroll y backdrop de escritorio |
| UI-096 | home | 6 C | Chunks de almanaque/receta/producto abortados/503 y recarga |
| UI-097 | almanac | 4 | Imagen abortada/503 y recuperación al revisitar |
| UI-098 | almanac | 18 | Nueve documentos con notas editoriales × dos tamaños |
| UI-099 | ingredient_lab | 12 | 3/6/12 componentes × fuego × tamaños; límite y persistencia |
| UI-100 | fire_planner | 4 | Cocción/horneado/reposo, °C/°F y ficha tras recargar |
| UI-101 | home | 8 C | Teclado/foco/Escape en cuatro diálogos × dos tamaños |
| UI-102 | home | 2 | IDs únicos, alt, nombres de controles y referencias ARIA |
| UI-103 | home | 8 | PDF: cuatro productos, receta, dos blends y plan |
| UI-104 | almanac | 2 | Chunk lento: busy explícito y planificador aún usable |

Fuentes ejecutables: [home](tests/ui/home), [recipes](tests/ui/recipes),
[ingredient_lab](tests/ui/ingredient_lab), [fire_planner](tests/ui/fire_planner),
[almanac](tests/ui/almanac), [commerce](tests/ui/commerce).

## Core y arquitectura

| ID | N | Contrato |
| --- | --- | --- |
| FRAMEWORK-001 | 7 | Settings, normalización y destinos por worker |
| FRAMEWORK-002 | 4 | OpenAPI: documento, request y response sintéticos |
| FRAMEWORK-003 | 1 | Registro de pasos/valores/evidencia |
| FRAMEWORK-004 | 1 | Core no importa proyectos |
| FRAMEWORK-005 | 1 | Templates/POMs respetan separación de responsabilidades |
| ARCH-001 | 1 | Numeración e identidad de casos |
| ARCH-002 | 1 | Imports y separación de proyecto/core |
| ARCH-003 | 1 | Discovery y selección segura de destinos |
| ARCH-004 | 1 | POMs sin oráculos de negocio |

Los cinco IDs del core ocupan cuatro archivos; la regla un archivo/un ID UI
pertenece al proyecto, no describe todos los módulos de infraestructura.

## Selección y partición sin duplicar suites

Los markers funcionales son planner, laboratory, recipes, almanac, navigation y
commerce. portal/store separan el preview del servicio externo. matrix y sus
submarkers seleccionan catálogos finitos; specialized selecciona los ocho grupos
seriales. accessibility/print_pdf seleccionan contratos transversales.

| Selección de CI | Ejecuciones |
| --- | --- |
| framework_unit or (portal and not matrix and not specialized) | 208 |
| portal and matrix | 215: planner 48 + ingredientes 60 + recetas 1 + almanaque 106 |
| portal and specialized | 8 |
| portal and cross_browser | 28 por motor; ya incluidas en Chromium general |
| store | 24, ejecución manual de solo lectura |

Los ocho grupos seriales llaman scripts retenidos mediante support/specialized.py;
no son otra suite ni ocho únicas interacciones. UI-034 recorre 100 recetas en
dos tamaños dentro de una ejecución. UI-092 sí parametriza cada documento/tamaño.
Los conteos no deben intercambiarse con el número de comportamientos.

## Contratos y límites actuales

Laboratorio: agregar deja gramos vacíos, retirar conserva los demás, guardar
requiere 2–12 cantidades positivas y total <=150 g. Radar relativo ponderado por
gramos; datos desconocidos no se inventan. Matching comercial por ingredientes,
no pesos. Los datos numéricos de pruebas son sintéticos, no recetas recomendadas.

UI-077 mantiene el espacio del panel al fallar; controla la descarga, comprueba
dos documentos nuevos con wait_for_url y una identidad por documento, conserva
almacenamiento y no usa force/sleep para esconder intercepción de puntero.

Los PDF se validan por texto/códigos, páginas, imágenes y límites de origen del
texto; esto no prueba ausencia de todo solapamiento o recorte. DOM/teclado no es
auditoría WCAG completa. Viewports no son teléfonos físicos. No se cubren todos
los subconjuntos de ingredientes ni valores continuos de gramos/temperaturas.
Modelos puros complementan UI con 8,640 configuraciones y 1,770 pares.

STORE visita páginas públicas, nunca carrito/pagos/pedidos/inventario ni sesiones
de administración. Checkout, envíos y correos requieren un sandbox autorizado.
Para resultados realmente ejecutados y fallos históricos, ver
[CHANGELOG](../../../docs/CHANGELOG.md); no inferir PASS de este inventario.
