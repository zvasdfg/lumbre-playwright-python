"""Seven-family illustrations: asset loading, method guidance, stages and print CSS."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT = Path('/tmp/lumbre-diagrams-v2')
OUT.mkdir(exist_ok=True)
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for width in (320, 390, 768, 1440):
        for equipment, fuel, method in [('kettle','carbon','dos_zonas'), ('gas','gas_lp','indirecto'), ('offset','lena','indirecto'),
                ('kamado','carbon','directo'), ('kamado','carbon','indirecto'), ('kamado','carbon','dos_zonas'),
                ('ahumador','briquetas','indirecto'), ('ahumador','briquetas','directo'), ('ahumador','briquetas','dos_zonas'),
                ('abierta','carbon','directo'), ('abierta','lena','dos_zonas'),
                ('pellets','pellets','directo'), ('pellets','pellets','indirecto'), ('pellets','pellets','dos_zonas')]:
            ctx = browser.new_context(viewport={'width':width,'height':1000})
            page = ctx.new_page()
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto('http://127.0.0.1:3001/#planificador',wait_until='networkidle')
            page.add_style_tag(content='*{scroll-behavior:auto!important}')
            page.get_by_label('Equipo',exact=True).select_option(equipment)
            fuel_control = page.get_by_label('Combustible principal',exact=True)
            if fuel_control.is_enabled(): fuel_control.select_option(fuel)
            else: expect(fuel_control).to_have_value(fuel)
            page.get_by_label('Tipo de cocción',exact=True).select_option(method)
            page.locator('.planner-customize > summary').click()
            if equipment=='kettle':
                page.get_by_role('button',name='Crear secuencia: indirecto → sellado',exact=True).click()
                page.get_by_label('Soporte de etapa 2',exact=True).select_option('plancha')
            else:
                page.get_by_label('Soporte del alimento',exact=True).select_option('bandeja' if equipment=='offset' else 'sarten')
            for name in ('capabilityVerified','fuelVerified'):
                verified=page.locator(f'[name="{name}"]')
                if verified.count():verified.check()
            page.get_by_role('button',name='Construir plan de fuego',exact=True).click()
            diagram=page.locator('.planner-result .fire-diagram-technical').first
            expect(diagram).to_be_visible()
            expect(diagram.locator('img')).to_have_count(1)
            expect(diagram.locator('img')).to_have_attribute('src', f'/editorial/planner/r001/{equipment}.jpg')
            if equipment=='abierta':
                expect(diagram).to_contain_text('sin función de horno')
            if equipment in ('ahumador','offset','pellets') and method != 'indirecto':
                expect(diagram).to_contain_text('sólo su montaje indirecto')
            for el in page.locator('.planner-result .fire-diagram-technical').all():
                assert el.evaluate('e=>e.scrollWidth<=e.clientWidth')
                assert el.locator('img').first.evaluate('e=>e.complete && e.naturalWidth>1000 && e.getBoundingClientRect().width>150'), (width,equipment,el.bounding_box())
            if equipment=='kettle':
                expect(page.locator('.fire-plan-timeline [data-method="directo"]')).to_contain_text('Soporte: Plancha')
            # Isolated component capture: exclude unrelated floating navigation.
            diagram.screenshot(path=str(OUT/f'{equipment}-{method}-{width}.png'), style='.almanac-trigger{visibility:hidden}')
            page.get_by_label('Nombre del plan',exact=True).fill(equipment)
            page.get_by_role('button',name='Guardar plan',exact=True).click()
            page.get_by_role('button',name='Imprimir plan '+equipment,exact=True).click()
            dialog=page.get_by_role('dialog')
            expect(dialog.locator('.fire-diagram-technical').first).to_be_visible()
            assert dialog.evaluate('e=>e.scrollWidth<=e.clientWidth')
            ids=page.locator('[id]').evaluate_all('els=>els.map(e=>e.id)')
            assert len(ids)==len(set(ids)), 'Duplicate element IDs'
            if width==1440:
                page.emulate_media(media='print')
                dialog.locator('.fire-diagram-technical').first.screenshot(path=str(OUT/f'{equipment}-{method}-print-css.png'))
            assert not errors,errors
            ctx.close()
            print(width,equipment,method,'PASS',flush=True)
    browser.close()
