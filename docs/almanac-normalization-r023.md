# Normalización del almanaque r023

Selección aprobada el 2026-11-05: 105 documentos únicos 001–105. Mantiene el sartén 059 y excluye el cepillo con ID duplicado. Sustituye la selección web r017 conservada en Git.

Se integran las normalizaciones locales aprobadas de encabezados, fondos, paleta y legibilidad hasta r022, más las 23 correcciones de prioridad alta/media de r023. Las otras 82 imágenes son idénticas a los maestros r022; no se confunde esa reutilización con igualdad respecto a la publicación r017.

Correcciones r023: DOC002, 011–014, 016–018, 024–028, 038, 041, 050, 053, 058–060, 092–093 y 105. Se recuperan el título completo de 050 y los rótulos perdidos de 059/060; se corrigen restos de reglas, encaje de encabezados, notas pequeñas y filas de tablas. Se apagan colores funcionales sin eliminar símbolos. La matriz aprobada de 105 permanece intacta.

Los dibujos no se regeneran ni deforman. Los titulares mantienen sus glifos nativos; se recompusieron localmente seis notas pequeñas, dos tablas y seis recomendaciones para darles un acabado legible. La nota 038 conserva las frases legibles de origen y excluye un fragmento duplicado/corrupto, sin inventar una sustitución. Las diferencias nativas de trazo y densidad que quedaron como LOW/INFO no se presentan como errores cerrados.

## Contrato de publicación

`portal/data/almanac-release.json` fija CONTENT_ID, revisión y SHA256 de cada maestro y JPEG. El hash de la selección maestra aprobada es `91df0b07e7104e992fe68b84fd1258e6194da30c8adc84af2ac1cfe6259c6682`. No se incorporan rutas privadas, comentarios internos, documentos de trabajo, datos personales ni fórmulas comerciales.

Se mantiene el catálogo y la navegación del lector sin cambiar títulos, textos alternativos ni notas editoriales. Los mapas tradicionales 031–036 siguen identificados como ilustrativos, no como regiones anatómicas exclusivas. No se amplía la revisión de conservación a una certificación científica nueva de los 105 cuerpos.

Exportación web: 1254×1254 px, JPEG calidad 92 y crominancia 4:4:4, sin recorte ni deformación, menos de 1,5 MB por archivo. Los maestros y sus revisiones se conservan aparte. La reexportación a JPEG no es una edición del contenido del PNG maestro.

Regresión: 105 rutas únicas en orden, 23 revisiones r023 y 82 r022, exclusión del duplicado, hashes y tamaño de cada archivo, dimensiones y terminación JPEG, catálogo y nota ilustrativa coherentes. Se mantienen las pruebas del lector a dos tamaños, zoom, teclado y recuperación. No se omiten etapas del pipeline ni se cambian dependencias para publicar.
