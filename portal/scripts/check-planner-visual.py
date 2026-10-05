"""Visual geometry regression; isolated storage, no publication or user data changes."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path('/tmp/lumbre-planner-visual-v4')
OUT.mkdir(exist_ok=True)
results = []
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for width in (320, 390, 768, 1024, 1440):
        for equipment in ('abierta', 'kettle', 'kamado', 'ahumador', 'offset', 'gas', 'no_soportado'):
            ctx = browser.new_context(viewport={'width': width, 'height': 950}, reduced_motion='reduce')
            page = ctx.new_page()
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto('http://127.0.0.1:3001/#planificador', wait_until='networkidle')
            page.add_style_tag(content='*{scroll-behavior:auto!important;animation:none!important}')
            page.get_by_label('Equipo', exact=True).select_option(equipment)
            page.locator('.planner-customize > summary').click()
            page.get_by_role('button', name='Crear secuencia: cocinar → cubrir', exact=True).click()
            page.get_by_role('button', name='Añadir etapa', exact=True).click()
            page.get_by_label('Tipo de etapa 3', exact=True).select_option('pausa')
            page.locator('[name="notes"]').fill('Una nota larga para verificar la lectura en diferentes tamaños de pantalla.\nSegunda línea de prueba.')
            geometry = page.locator('.planner-controls').evaluate('''e => ({
                overflow: e.scrollWidth > e.clientWidth,
                labels: [...e.querySelectorAll('label')].every(x => parseFloat(getComputedStyle(x).fontSize) >= 11),
                heights: [...e.querySelectorAll('input:not([type=checkbox]), select')].every(x => Math.abs(x.getBoundingClientRect().height - 48) < 1),
                buttons: [...e.querySelectorAll('.planner-stage-actions button')].every(x => x.getBoundingClientRect().height >= 44),
                equalActions: [...e.querySelectorAll('.planner-stage-actions')].every(x => {const b=[...x.querySelectorAll('button')]; return b.length<2 || Math.abs(b[0].getBoundingClientRect().width-b[1].getBoundingClientRect().width)<1})
            })''')
            assert not geometry['overflow'] and all(v for k, v in geometry.items() if k != 'overflow'), (width, equipment, geometry)
            page.get_by_role('button', name='Construir plan de fuego', exact=True).click()
            for section in ('.planner-customize', '.planner-stage-editor', '.planner-output', '.preset-library'):
                node = page.locator(section)
                assert node.evaluate('e=>e.scrollWidth<=e.clientWidth'), (width, equipment, section)
            page.locator('.planner-stage-editor').screenshot(path=str(OUT / f'{width}-{equipment}-stages.png'))
            assert not errors, errors
            results.append({'width': width, 'equipment': equipment, 'geometry': geometry, 'status': 'PASS'})
            print(width, equipment, 'PASS', flush=True)
            ctx.close()
    browser.close()
(OUT / 'results.json').write_text(json.dumps(results, indent=2))
