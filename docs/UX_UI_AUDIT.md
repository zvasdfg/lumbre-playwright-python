# Auditoría UX/UI del portal — 2 de noviembre de 2026

## Alcance y método

Revisión heurística y funcional del portal local después de mover Provisiones
al principio. Se recorrieron tienda, navegación, fichas de producto, Método,
Planificador/resultado, búsqueda del Laboratorio, Recetario/ficha y Almanaque.
Se inspeccionaron capturas y DOM en móvil y escritorio; UI-105 automatiza
320×640, 390×844, 768×1024, 1024×768 y 1440×900. UI-028 conserva los tres tamaños
de primera pantalla (320×640, 390×667, 390×844).

No es una certificación WCAG, un estudio con usuarios ni una prueba de conversión.
No se modificaron datos de producto, recetas, fórmulas, inventario o pagos. Las
compras continúan en Tiendanube; no se ejecutó ninguna transacción externa.

## Hallazgos y correcciones

| Prioridad | Evidencia anterior | Corrección implementada | Contrato verificable |
| --- | --- | --- | --- |
| Alta | Almanaque fijo en esquina inferior, sobre texto y controles al desplazarse | Acceso en el encabezado sticky; diálogo conserva modalidad y retorno de foco; error de descarga con recuperación acotada | UI-105, UI-096, UI-101, UI-104 |
| Alta | Texto de ayuda del resultado del Planificador en #ddd sobre blanco | Color #4c4c4c en salida clara, manteniendo ayuda clara en controles oscuros | UI-105 calcula contraste de texto/fondo; mínimo 4.5:1 para este texto |
| Media | Título de portada de unos 274 px de alto en escritorio y columna lateral casi vacía | Encabezado horizontal breve, sin sticky; cuatro productos por fila en escritorio ancho, dos en tableta | UI-105 mide título, retícula y overflow |
| Media | Fotos pequeñas, con franjas laterales, y repetición de ingredientes/descripción en tarjetas | Imagen cuadrada, miniatura/texto en móvil; datos detallados conservados en ficha | UI-030/032/105 y aceptación serial |
| Media | Botón transparente ocupando todo el artículo y zoom del 14% | Botones reales separados de imagen/ficha y compra; sin overlay invisible; zoom leve del 3.5% | UI-105 comprueba posición y blancos táctiles; UI-076/101 verifican foco |
| Media | Herramientas descubiertas sólo después de recorrer cuatro fichas largas o abrir menú | Atajos de Planificador, Laboratorio y Recetas junto a la bienvenida | UI-105 comprueba visibilidad de los tres atajos |
| Media | Encabezados/padding excesivos: controles de Planificador, Laboratorio y Recetas muy abajo en móvil | Encabezados de 32 px, ritmo de 32 px, presets en tres columnas y métricas compactas; sin ocultar opciones | Recorrido visual y regresiones de cada módulo |
| Media | #tienda todavía activaba el Laboratorio por una dependencia de layout que ya no existe | Deferral sólo por destinos del Laboratorio o proximidad; ancla de tienda se alinea por sí misma | UI-105 observa que abrir #tienda no solicite ingredient-lab |
| Media | Menú móvil sin cierre por Escape/salida del foco | Cierre explícito por Escape con retorno a resumen y por foco fuera del menú | UI-105 y UI-063 |
| Alta | Traza Firefox: el botón de agregar seguía desplazándose entre el inicio y final del clic; no se incorporaba la sal | Navegación por hash sin animación global y alineación inmediata al cargar el Laboratorio; se mantienen animaciones explícitas de resultado/variante | UI-101 comprueba cada selección antes de abrir la ficha; compatibilidad en tres motores |
| Baja | Saltos de nivel del h1 a títulos h3 de producto | Títulos de producto h2 con tipografía de marca y un único h1 | UI-001/030/102/105 |

Las correcciones de presentación viven en `portal/static/ux-audit.css`, cargado
tras el tema. Los estilos anteriores de tarjeta/acciones se ajustan en su archivo
de origen; no se duplican datos ni se introduce un framework visual nuevo.

## Criterios usados

- Priorizar búsqueda/descubrimiento de productos y caminos visibles, no sólo
  contenido promocional: [investigación de navegación de Baymard](https://baymard.com/research/homepage-and-category-usability).
- Evitar que el chrome persistente oculte el foco/contenido:
  [W3C, Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum).
- Contraste y controles operables se contrastan con
  [WCAG 2.2](https://www.w3.org/TR/WCAG22/). Los 44 px de acciones son una decisión
  de diseño conservadora, no una cita del mínimo AA de 24 CSS px de WCAG 2.5.8.

Estos criterios orientan decisiones; no prueban un aumento de ventas ni ausencia
de todos los problemas. No se añadieron buscadores/filtros de producto para sólo
cuatro referencias, ni carruseles que escondan opciones.

## Verificación de esta revisión

- Tipos, 51 pruebas de modelo/publicación y build estático: PASS.
- Primer grupo enfocado: 20 PASS (UI-105, UI-028, UI-030 y UI-063).
- Versión definitiva: 214 pruebas generales PASS (80.24 s), 56 de compatibilidad
  Firefox/WebKit PASS (114.24 s) y diez controles responsive adicionales PASS
  (UI-105, cinco tamaños por motor). Chromium está cubierto por el grupo general.
- Nueve contratos de perfiles aislados y 100 controles de contenido de recetas:
  PASS; auditoría de archivos públicos PASS (566 archivos, alcance del árbol
  actual, no historial).
- Ocho grupos seriales PASS (179.94 s), incluyendo fichas/PDF, planes, combustible,
  persistencia y recuperación. Doce repeticiones independientes del caso de blend
  en Firefox PASS (seis ejecuciones, móvil y escritorio, sin reintentos automáticos).
- La primera candidata tuvo un fallo en Firefox/UI-101; su traza documentó el
  desplazamiento durante el clic. No se relajaron las aserciones ni se agregaron
  sleeps/force: se corrigió el comportamiento y se reforzó la selección explícita.
- Colección prevista: 437 framework/portal + 24 tienda opt-in; 214 generales,
  215 de matriz y ocho grupos seriales. Colección no equivale a ejecución.
- Sin commit, push, publicación ni cambio de configuración de producción.

Evidencia local temporal: `/tmp/lumbre-ux-final-{general,compat,responsive,serial}.xml`,
`/tmp/lumbre-ux-firefox-repeat-{1..6}.xml` y capturas
`/tmp/lumbre-ux-final-{desktop,mobile}.png`. Entrada final:
`index-CGu_d5de.js`, SHA-256
`a0bcf9fa232c9676a35eec720a5ad52ad95582f0fb57e75bcd87a9aafeacdddc`;
CSS `index-eWTV-Rz1.css`, SHA-256
`342f39909d6e3a13c8936a14f89f9e996865b4ee9b7a6086c4ea5ebb5e36d605`.

Límites: no se midió conversión, no se probó en teléfonos físicos, lectores de
pantalla ni todos los niveles de zoom. La matriz completa de ingredientes,
recetas y documentos no se reejecutó para este cambio; no sustituye una auditoría
de accesibilidad humana. No se ejecutaron pruebas contra la tienda pública.
