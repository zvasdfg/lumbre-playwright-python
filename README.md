<p align="center">
  <img src="portal/public/brand/lumbre-logo-primary.png" alt="Lumbre" width="120" />
</p>

# Método Lumbre · portal y framework de pruebas

El portal público es una aplicación **React/Vite estática**, alojada en Cloudflare.
La compra continúa en **Tiendanube**: pedidos, pagos, inventario y envíos pertenecen
a esa tienda. No hay backend, cuentas, carrito interno ni base de datos del portal.

Este README es la fuente canónica para funcionalidades, estructura, instalación
y ejecución. El [catálogo numerado de pruebas](test-framework/projects/lumbre/README.md)
describe los casos; no hay una segunda suite paralela de Lumbre.

## Funcionalidades actuales

| Módulo | Qué permite |
| --- | --- |
| Inicio y Método | Navegación por secciones en móvil/escritorio, anclas al primer clic, menú móvil, foco visible y respeto a movimiento reducido. |
| Planificador | Asar, ahumar y hornear; restricciones por equipo, combustible, método y montaje; temperaturas iniciales y control de horas; estimación de combustible y reserva. |
| Planes de fuego | Etapas de cocción/reposo, soportes y unidades °C/°F; hasta 12 etapas; guardar, copiar, reemplazar, recuperar y eliminar planes locales; ficha A4 para imprimir/PDF. |
| Laboratorio | 60 ingredientes en familias, búsqueda, fichas y selección de 2–12 componentes; gramos manuales y lote máximo de 150 g; radar dinámico de los cinco sabores en boca. |
| Blends del usuario | Alias y documento SES; guardar en la sesión, reabrir, crear variantes, eliminar e imprimir cantidades en gramos. Recomendaciones LMB-F solo desde 80 % de coincidencia de ingredientes, no de proporciones. |
| Recetas | 100 preparaciones, filtros, búsqueda y paginación; ingredientes, pasos, tiempos, seguridad y fuentes; referencias opcionales/integradas a rubs, regreso a la misma posición y PDF. |
| Almanaque | 53 documentos publicados más portada; selección de página, anterior/siguiente, teclado, zoom y ajuste; notas editoriales y recuperación de imágenes/módulos interrumpidos. El documento 049 no pertenece a esta edición. |
| Provisiones | Cuatro rubs LMB-F con ficha, ingredientes declarados, radar orientativo, sugerencias de uso y enlace al producto correspondiente en Tiendanube. La disponibilidad final se consulta en la tienda. |
| Resiliencia | Módulos diferidos con recuperación explícita, diálogos con foco contenido y restaurado, manejo de almacenamiento corrupto/denegado y PDF autocontenido. |

**Laboratorio manual temporal:** se retiraron las referencias internas de
formulación. Agregar ingredientes no inventa gramos ni redistribuye cantidades;
retirarlos conserva los gramos restantes y recalcula total/radar. Los registros
anteriores válidos siguen legibles, pero sus cantidades no son recomendaciones.
El radar representa una estimación relativa, no una cata ni porcentajes de fabricación.

El planificador contempla parrilla abierta, kettle, kamado, ahumador vertical,
offset, gas y pellets. Exige confirmar capacidades cuando corresponda; no todos
los equipos admiten todos los objetivos. Weber aporta referencias, mientras que
extrapolaciones y márgenes son supuestos explícitos de Lumbre, no mediciones del
equipo del usuario. Ver [modelo de combustible](docs/PLANNER_MODEL.md).

## Dónde está cada cosa

~~~text
.
├── portal/
│   ├── static/                     Componentes React, modelos, CSS y _headers
│   ├── data/                       Recetas, ingredientes y declaraciones públicas de producto
│   ├── public/{brand,editorial}/    Assets aprobados para publicación
│   ├── scripts/                    Modelos, integridad de datos y controles de publicación
│   └── profiles/
│       ├── static/                 Dependencias mínimas de desarrollo/release
│       ├── deploy/                 Wrangler aislado; no se mezcla con el navegador
│       └── browser/                Versiones de Python/Playwright utilizadas en CI
├── test-framework/
│   ├── automation/                 Core reutilizable: configuración, adapters y evidencia
│   ├── tests/framework/            Pruebas del core sin portal
│   └── projects/lumbre/
│       ├── pages/                  Navegación y composición
│       ├── components/             Acciones de widgets, sin oráculos de negocio
│       ├── data/                   Entradas independientes de las funciones bajo prueba
│       ├── support/                Adaptadores de los ocho grupos seriales
│       ├── conftest.py             Contextos limpios y protección del destino
│       └── tests/
│           ├── test_architecture.py Numeración, separación y selección segura
│           └── ui/
│               ├── home/           Navegación, almacenamiento, accesibilidad y PDF
│               ├── fire_planner/   Combustible, equipos, etapas y planes guardados
│               ├── ingredient_lab/ Ingredientes, gramos, radar y blends locales
│               ├── recipes/        Catálogo, fichas, enlaces y regreso
│               ├── almanac/        Documentos, zoom, teclado y recuperación
│               └── commerce/       Productos y Tiendanube de solo lectura
├── scripts/                        Runners locales y auditoría del repositorio público
├── .github/workflows/              Validación/deploy y tienda manual
└── docs/                           Guías canónicas, procedencia e historial resumido
~~~

Cada archivo UI conserva un ID como test_ui_021_*.py y un comportamiento.
Los parámetros son variantes de ese mismo ID. Las carpetas separan funcionalidades;
las **etiquetas de Pytest** separan tipo de ejecución, no frameworks distintos.
Tests usan datos y POMs; POMs usan Playwright; el core nunca importa el proyecto.
El [README del core](test-framework/README.md) explica esa separación.

## Instalación

Desde la raíz del repositorio: Node >=22.13, npm 11.17 y Python >=3.11.
No se necesitan Cloudflare ni credenciales de tienda para probar el portal local.

~~~bash
npm ci --prefix portal
python3 -m venv test-framework/.venv
test-framework/.venv/bin/python -m pip install -e './test-framework[dev,lumbre]' -c portal/profiles/browser/requirements.txt
test-framework/.venv/bin/playwright install chromium firefox webkit
cp test-framework/.env.example test-framework/.env
~~~

En Linux, instalar las dependencias del navegador con playwright install --with-deps
o usar la imagen de Playwright fijada en el workflow. El archivo .env local se ignora.
No ejecutar npm audit fix --force sin revisar su cambio de dependencias.

## Ejecutar las pruebas en local

Todos los comandos siguientes se ejecutan **desde la raíz del repositorio**.

### A. Suite completa con servidor administrado

~~~bash
bash scripts/test-local.sh
# Ver los navegadores:
bash scripts/test-local.sh --headed --slowmo=150
# Seleccionar un módulo:
bash scripts/test-local.sh -m 'portal and laboratory'
~~~

El runner construye el artefacto, levanta su servidor Python en 127.0.0.1:3001,
ejecuta framework + portal y detiene solo su propio servidor al salir. Si el puerto
está ocupado **falla**, no mata otro proceso. El servidor HTTP sirve archivos:
la línea que realmente ejecuta Playwright es la llamada posterior a **pytest**.
La suite completa es serial porque algunos scripts comparten archivos PDF.
No pasar -n a este runner.

### B. Ya tengo el portal abierto en 3001

Para preparar una vista estática, en otra terminal:

~~~bash
npm run build:static --prefix portal
npm run preview:static --prefix portal
~~~

Luego ejecutar sin crear otro servidor:

~~~bash
bash scripts/test-static-ui.sh
bash scripts/test-static-ui.sh --headed -m 'portal and smoke'
bash scripts/test-static-ui.sh -m 'portal and planner'
bash scripts/test-static-ui.sh -m 'portal and almanac'
bash scripts/test-static-ui.sh -m 'portal and print_pdf'
bash scripts/test-static-cross-browser.sh
~~~

No reconstruir dist-static mientras se ejecuta una suite: cambiarían los hashes
de los módulos que los navegadores aún necesitan descargar.

### C. Pytest directo y VS Code

~~~bash
# Solo infraestructura, sin servidor:
test-framework/.venv/bin/pytest -c test-framework/pyproject.toml -m framework_unit
# Listar lo que se seleccionaría, sin ejecutar:
test-framework/.venv/bin/pytest -c test-framework/pyproject.toml --collect-only -q
# Con un preview existente:
BASE_URL=http://127.0.0.1:3001 test-framework/.venv/bin/pytest -c test-framework/pyproject.toml -m 'portal and recipes' --headed
~~~

VS Code usa test-framework/.venv, descubre tests/framework y projects/lumbre/tests,
y su configuración de debug apunta a 3001. Para Test Explorer debe existir el
preview y configurarse BASE_URL en test-framework/.env. Por defecto se selecciona
framework_unit or portal; store no se ejecuta por accidente.

### D. Tiendanube, explícita y de solo lectura

~~~bash
bash scripts/test-store-ui.sh
~~~

Este runner visita el portal público y sus enlaces de compra en Tiendanube.
Comprueba fichas, galerías y navegación de retorno. **No** agrega al carrito,
compra, paga, crea pedidos ni cambia inventario. Necesita red y destinos HTTPS.
No bloquea el build local y no es una segunda suite de regresión del portal remoto.

### Etiquetas y evidencia

| Etiqueta | Selección |
| --- | --- |
| framework_unit | Core y arquitectura, sin app |
| portal / store | Preview local / integración externa explícita |
| planner, laboratory, recipes, almanac, navigation, commerce | Funcionalidad |
| smoke / regression | Recorrido crítico / regresión extendida |
| matrix y *_matrix | Configuraciones o catálogos finitos |
| cross_browser | Compatibilidad enfocada en tres motores |
| accessibility / print_pdf | Teclado/DOM y contenido de impresión |
| specialized | Ocho grupos seriales de scripts retenidos |

El runner administrado guarda HTML, JUnit, logs, screenshots y traces en
test-framework/reports/runs/; el último HTML es reports/lumbre-report.html dentro
del framework. Los otros runners imprimen sus rutas temporales. Los informes,
traces y capturas **no se versionan**. En CI los artifacts duran siete días y
deben contener solo datos sintéticos; no iniciar sesión en una tienda real para
generarlos. Las imágenes pueden revelar datos aunque el log esté redactado.

## Cómo se ejecuta en GitHub Actions

Workflow: [.github/workflows/deploy.yml](.github/workflows/deploy.yml).
Se activa en push a main, PR contra main y ejecución manual. En PR se valida;
el deploy solo ocurre en main y nunca desde una PR.

| Job | Qué ejecuta | Dónde / destino |
| --- | --- | --- |
| static-build | Auditoría del árbol público, workspace aislado, npm ci, tipos, recetas, modelos, auditorías npm y build | Ubuntu 24.04; sin publicar |
| Isolated browser validation | framework_unit or (portal and not matrix and not specialized), 208 ejecuciones, -n 2 | Contenedor Playwright, Chromium; servidor local 3001 |
| Serial browser and PDF validation | portal and specialized, ocho grupos, sin xdist | Otro contenedor/servidor local, archivos PDF seriales |
| Component configuration matrix | portal and matrix más planner_matrix, ingredients_matrix, recipes_matrix o almanac_matrix; 215 ejecuciones | Cuatro jobs separados, mismo artefacto; Chromium local |
| Keyboard and recovery | portal and cross_browser | Dos jobs: Firefox y WebKit, mismo artefacto local |
| Deploy static production | Instalación/auditoría del perfil deploy; Wrangler publica el artefacto probado | Solo tras aprobar todos los jobs anteriores |
| Verify published static bundle | HTML referencia el JS esperado y SHA-256 coincide | HTTPS de producción, sin repetir la suite UI |

El build se produce **una sola vez**. Todos los jobs descargan ese mismo artifact;
no validan versiones reconstruidas distintas. El grupo general, el serial y las
matrices suman 431 ejecuciones sin solaparse. Compatibilidad repite un subconjunto
en otros motores; no son más funcionalidades independientes.

Workflow separado: [.github/workflows/store-ui.yml](.github/workflows/store-ui.yml),
solo workflow_dispatch, ejecuta 24 comprobaciones públicas de tienda. No corre
automáticamente en cada deploy ni habilita transacciones.

## Cobertura y límites

64 comportamientos UI numerados y cuatro contratos de arquitectura. La colección
contiene 431 casos local/framework + 24 store opcionales. Incluye 48 combinaciones
de planificador, 60 ingredientes, 100 recetas, 53 documentos a dos tamaños y ocho
escenarios PDF. Modelos puros incluyen 8,640 configuraciones y 1,770 pares.
No implica todos los subconjuntos de ingredientes, gramos o secuencias posibles.
UI-077 combina móvil/escritorio y aborto/HTTP 503: compara el espacio reservado
antes/después del fallo, verifica documentos nuevos en ambas recargas y conserva
datos locales/de sesión. El subconjunto de compatibilidad tiene 28 ejecuciones
por motor, 84 si se seleccionan los tres; no son 84 funcionalidades distintas.

Último deploy confirmado: commit 5d08c6d, [pipeline exitoso](https://github.com/zvasdfg/lumbre-playwright-python/actions/runs/38441242795).
La revisión de laboratorio manual y límites de publicación pasó todos los jobs
de CI y las auditorías npm. El bundle principal y el del laboratorio coinciden
con los SHA-256 del artefacto probado en CI; los dos assets antiguos comprobados
responden 404. Las 429 pruebas locales y 78 de compatibilidad son evidencia local
adicional, no un conteo duplicado de CI. El [reporte de seguridad](docs/SECURITY.md)
explica por qué el repositorio sigue temporalmente privado: GitHub todavía conserva
objetos antiguos accesibles por SHA y se requiere evaluar su purga con soporte.

Pendientes reales: pruebas físicas en teléfono, baselines visuales aprobados,
auditoría WCAG completa y checkout/envío/pago/emails en un sandbox autorizado.
Los PDFs se revisan por contenido/tamaño/orígenes; eso no detecta todo solapamiento.
Los modelos de sabor y combustible no sustituyen validación sensorial o mediciones.

## Seguridad y documentación

~~~bash
node scripts/audit-public-repo.mjs
npm run test:profile --prefix portal
npm run build:static --prefix portal
~~~

El repositorio y el navegador no deben contener credenciales, cookies, datos de
clientes ni proporciones de fabricación. Solo se publican assets compilados,
imágenes aprobadas y headers; no docs, backups, source maps o informes. La limpieza
del árbol actual **no elimina lo ya expuesto en Git, caches o artifacts remotos**.
Los secretos del deploy viven en GitHub Environments, no en el JavaScript.

- [Seguridad, límites del escaneo y pendientes](docs/SECURITY.md)
- [Casos por ID y dominios de entrada](test-framework/projects/lumbre/README.md)
- [Core reutilizable](test-framework/README.md)
- [Agregar otro proyecto](docs/ADDING_A_PROJECT.md)
- [Crear una prueba guiada](docs/GUIDED_UI_TEST_PROTOCOL.md)
- [Snippets de Playwright](docs/PLAYWRIGHT_PYTHON_SNIPPETS.md)
- [Modelo del planificador](docs/PLANNER_MODEL.md)
- [Metodología de ingredientes](portal/data/ingredientes/METHODOLOGY.md)
- [Procedencia y revisión de recetas](docs/RECIPE_CONTENT_REVIEW.md)
- [Integración editorial de rubs](docs/RECIPE_BLEND_REVIEW_V3.md)
- [Historial resumido](docs/CHANGELOG.md)
