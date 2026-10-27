# Seguridad de publicación y repositorio

Revisión: **2026-10-27**. Alcance: árbol actual, límites del build y CI, evidencia
conservada de la limpieza y accesibilidad de dos objetos históricos conocidos.
No es pentest, detector completo de secretos ni garantía de borrado en terceros.
No incluir aquí valores confidenciales, fórmulas, tokens ni los SHA afectados.

## Decisión de visibilidad y riesgo pendiente

El propietario autorizó el 27 de octubre **hacer público este mismo repositorio
aceptando expresamente el riesgo**: GitHub todavía permite recuperar por SHA dos
objetos confidenciales de la historia anterior. Las comprobaciones autenticadas
de ese día devolvieron HTTP 200. La limpieza del árbol y de main no los borró del
almacenamiento del proveedor. **La purga sigue sin confirmarse.**

Esta decisión sustituye la contención temporal mediante repositorio privado;
no convierte la confidencialidad histórica en PASS. En un repositorio público
debe asumirse que esos objetos podrían recuperarse y difundirse. No se afirma
que todos los objetos antiguos, clones, forks, caches o descargas sean recuperables
ni que puedan eliminarse. La copia privada de recuperación no se debe publicar.

Soporte: solicitud enviada el 13 de octubre, seguimiento el 14 y solicitud de
escalación el 20. Última lectura verificada del ticket: 21 de octubre, abierto
sin respuesta del proveedor en la conversación visible. El 27 de octubre el
portal de soporte pidió iniciar sesión; no se verificó su estado actual ni
una respuesta nueva. No confundir estado del ticket con los HTTP 200 comprobados.

## Información pública y privada

**Público:** código del portal/framework, imágenes aprobadas, propuestas de
recetas, catálogo de ingredientes y declaraciones públicas de producto. Todo
JavaScript del navegador puede inspeccionarse aunque la pantalla oculte datos.
El repositorio público expone también documentación y fuentes que no se despliegan
en el sitio. private: true en package.json bloquea npm publish, no GitHub.

**Privado:** credenciales, tokens, cookies/auth state, datos de clientes/pedidos/
pagos, formulaciones de fabricación, pesos de prototipos, exports, backups y
traces autenticados. No introducirlos en código, tests, issues o artifacts.
Las mezclas del usuario son de sesión y los planes de fuego locales; el portal
no implementa cuentas ni sincronización remota. Tiendanube gestiona transacciones.

## Contención ya implementada

- Se retiraron del laboratorio referencias internas y su cálculo automático.
  Las cantidades son manuales temporalmente; los tests usan datos sintéticos.
  El matching comercial mantiene solo ingredientes declarados, no proporciones.
- Se consolidaron 12 documentos Markdown canónicos, preservando fuera del repo
  un archivo privado de material retirado. No se eliminaron indiscriminadamente
  imágenes o evidencia no Markdown. Dos metadatos históricos se sanearon de forma
  acotada; esto no equivale a inspeccionar todos los píxeles.
- Ignore rules excluyen credenciales, auth state, reports, capturas, caches y
  backups. No protegen archivos ya versionados ni un add forzado.
- audit-public-repo.mjs revisa el árbol tracked/nuevo no ignorado y emite rutas,
  IDs de regla y líneas, nunca valores. Es requisito de static-build.
- El build permite solo HTML/headers de entrada, JS/CSS compilados e imágenes
  públicas. Rechaza docs, reportes, backups, source maps, referencias privadas,
  formatos de tokens conocidos y SVG activo.
- Headers: CSP restrictiva (connect-src none, form-action none), frame denial,
  nosniff y permisos de cámara/micrófono/geolocalización/pago denegados.
  No se deshabilitó TLS ni se omitieron auditorías para publicar.

## Evidencia histórica, con fecha y alcance

La auditoría inicial del 12 de octubre recorrió 1,690 objetos de texto únicos
en 90 commits locales y detectó procedencia interna. No encontró los patrones
de claves privadas/tokens/URLs con credenciales configurados. No cubre todos
los formatos de secreto, binarios, branches remotos ni almacenamiento externo.

El 13 de octubre se verificó un bundle completo y archivo del worktree con
permisos solo del propietario, fuera del repo. Con autorización se reescribieron
91 commits, retirando siete paths afectados y preservando el árbol de aplicación
actual. Un nuevo escaneo de 1,680 blobs alcanzables no encontró sus reglas.
Se publicó con force-with-lease y un clon nuevo sin reutilizar objetos no contenía
los dos objetos de prueba originales. No garantiza que viejos commits compilen.

Se identificaron, eliminaron y comprobaron ausentes nueve artifacts de build
afectados. No hubo borrado masivo de artifacts/logs: 41 archivos diagnósticos y
nueve archivos de logs candidatos se inspeccionaron privadamente sin coincidencias
de referencias internas. En 2,013 entradas diagnósticas no se hallaron patrones
de credenciales configurados. No es OCR ni análisis semántico exhaustivo.

Metadata de 239 imágenes raster públicas no mostró flags GPS/propietario/patrones
personales; solo se muestrearon capturas visualmente. No se identificó un valor
real de credencial ni se realizó rotación/revocación. Si aparece uno, revocarlo
en su proveedor: borrarlo de Git no lo invalida.

## Release funcional y comprobación actual

La base funcional es **7971085**, con
[CI 38457776095 exitoso](https://github.com/zvasdfg/lumbre-playwright-python/actions/runs/38457776095)
del 13 de octubre. Incluye la corrección UI-077 posterior a un fallo real en
Firefox. Pasaron general, serial, cuatro matrices, dos motores adicionales,
auditorías npm, deploy y verificación del bundle publicado. La evidencia guardada
verifica SHA-256 de main/laboratorio contra CI y dos URLs anteriores con 404.
No demuestra inventario completo de URLs históricas ni recuperación de descargas.

Evidencia local de esa revisión: 431 ejecuciones framework/portal, 84 de
compatibilidad y 24 repeticiones Firefox enfocadas; 49 contratos de modelos/
publicación y nueve de perfiles. Son resultados de octubre 13, no de una suite
UI ejecutada el 27. El [CHANGELOG](CHANGELOG.md) conserva también los fallos.

El 27 se releyeron código/workflows y se coleccionaron todas las selecciones:
431 default, 208 general, 215 matrices, ocho seriales, 28 compatibilidad por motor
y 24 store opt-in. Colección no es PASS. Los controles de esta entrega documental
y sus resultados deben corresponder al commit/run que realmente los ejecute;
ver [Actions](https://github.com/zvasdfg/lumbre-playwright-python/actions).

Controles locales ejecutados el 27 para esta entrega documental: 49 contratos
de modelos/publicación, nueve de perfiles y 18 de infraestructura aprobados;
TypeScript, integridad de 100 recetas, build y límite estático aprobados.
Scanner: 563 archivos actuales sin hallazgos bajo sus reglas. Las 12 guías tienen
53 enlaces locales existentes y 24 bloques Python/shell con sintaxis válida;
los 64 IDs UI, parámetros, componentes y lanes coinciden con la colección.
No se volvió a ejecutar localmente toda la UI por un cambio solo documental:
el workflow del commit vuelve a validarla antes del deploy.

Las dos consultas npm locales del 27 (static/deploy) fallaron por validación de
certificado. No devolvieron un dictamen de vulnerabilidades. No se cambiaron red,
TLS ni lockfiles. CI ejecuta auditorías nuevas antes de permitir cada despliegue;
el PASS del 13 no es una auditoría actual. No se consultaron independientemente
advisories de toda la cadena Python/navegadores.

## Reproducir los controles

Desde la raíz del repositorio:

~~~bash
node scripts/audit-public-repo.mjs
npm run typecheck --prefix portal
npm run check:recipes --prefix portal
npm test --prefix portal
npm run test:profile --prefix portal
npm run build:static --prefix portal
npm audit --prefix portal --package-lock-only --audit-level=high --registry=https://registry.npmjs.org
npm audit --prefix portal/profiles/deploy --package-lock-only --audit-level=high --registry=https://registry.npmjs.org
~~~

El scanner no cubre historia/artifacts/OCR. Los controles de build sí inspeccionan
la salida generada. Ninguno ofrece prueba criptográfica de ausencia de todo dato
propietario. Para UI usar la selección y servidor del README, no el sitio real
como sustituto del artefacto que se pretende desplegar.

## CI, evidencia y mantenimiento

Solo el job de producción recibe CLOUDFLARE_ACCOUNT_ID y CLOUDFLARE_API_TOKEN
mediante GitHub Environment; Wrangler está aislado de dependencias del navegador.
PRs nunca despliegan. Los jobs UI descargan el mismo build; después se verifica
el SHA-256 del bundle de entrada publicado, sin repetir toda la suite en remoto.

Reports/capturas/traces no se versionan. Diagnósticos CI: siete días; artifact
lumbre-static: retención del repositorio. Al ser público, asumir accesibles logs
y artifacts; usar datos sintéticos y contextos sin autenticar. El respaldo privado
y las evidencias originales confidenciales quedan fuera del árbol público.

Otros clones deben migrarse o clonarse de nuevo; no fusionar/pushear ramas anteriores
a la limpieza. Revertir solo dentro de historia limpia. Verificar aparte cualquier
purga del proveedor antes de declararla terminada; la aceptación del riesgo no
autoriza reintroducir formulaciones en el árbol actual.

Referencias oficiales sobre el procedimiento y sus límites:
[GitHub: eliminar información sensible](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository),
[GitHub: descargar artifacts](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts).
Los enlaces son orientación, no evidencia de que GitHub haya completado la purga.
