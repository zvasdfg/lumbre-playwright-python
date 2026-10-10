"""Objective-first planner: real UI scenarios, persisted plans and actual A4 PDFs."""
from browser_test_options import browser_launch_options
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from pypdf import PdfReader

OUT = Path('/tmp/lumbre-planner-goals')
OUT.mkdir(exist_ok=True)
CASES = [('asar','abierta'), ('hornear','kettle'), ('hornear','kamado'),
         ('ahumar','gas'), ('hornear','offset'), ('ahumar','ahumador'),
         ('asar','pellets'), ('ahumar','pellets'), ('hornear','pellets')]
LABELS = {'asar':'Asar','ahumar':'Ahumar','hornear':'Hornear'}
with sync_playwright() as pw:
    browser = pw.chromium.launch(**browser_launch_options())
    for width in (320, 390, 1440):
        for goal, equipment in CASES:
            context = browser.new_context(viewport={'width':width, 'height':1000})
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto('http://127.0.0.1:3001/#planificador', wait_until='networkidle')
            page.add_style_tag(content='*{scroll-behavior:auto!important}')
            page.get_by_label('Objetivo de cocción',exact=True).select_option(goal)
            page.get_by_label('Equipo',exact=True).select_option(equipment)
            if equipment == 'pellets':
                expect(page.get_by_label('Combustible principal',exact=True)).to_have_value('pellets')
                expect(page.get_by_label('Combustible principal',exact=True)).to_be_disabled()
                expect(page.get_by_label('Tipo de cocción',exact=True)).to_have_value('indirecto')
            if goal != 'asar':
                assert page.get_by_label('Equipo',exact=True).locator('option[value="abierta"]').evaluate('e=>e.disabled')
            for name in ('capabilityVerified','fuelVerified','smokeVerified'):
                control = page.locator(f'[name="{name}"]')
                if control.count(): control.check()
            page.get_by_role('button',name='Construir plan de fuego',exact=True).click()
            result = page.locator('.planner-result')
            expect(result).to_be_visible()
            expect(result.locator('.fire-plan-facts')).to_contain_text(LABELS[goal])
            assert result.evaluate('e=>e.scrollWidth<=e.clientWidth'), (width,goal,equipment)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (width,goal,equipment,'overflow')
            if width == 390 and equipment in ('pellets','gas','kamado'):
                result.screenshot(path=str(OUT/f'{goal}-{equipment}-{width}.png'))
            name = f'{LABELS[goal]} {equipment}'
            page.get_by_label('Nombre del plan',exact=True).fill(name)
            page.get_by_role('button',name='Guardar plan',exact=True).click()
            page.reload(wait_until='networkidle')
            page.get_by_role('button',name='Editar plan '+name,exact=True).click()
            expect(page.get_by_label('Objetivo de cocción',exact=True)).to_have_value(goal)
            expect(page.get_by_label('Equipo',exact=True)).to_have_value(equipment)
            page.get_by_role('button',name='Imprimir plan '+name,exact=True).click()
            dialog = page.get_by_role('dialog')
            expect(dialog).to_be_visible()
            assert dialog.evaluate('e=>e.scrollWidth<=e.clientWidth')
            ids = page.locator('[id]').evaluate_all('els=>els.map(e=>e.id)')
            assert len(ids) == len(set(ids)), 'duplicate IDs'
            if width == 1440 and equipment == 'pellets':
                page.emulate_media(media='print')
                pdf = OUT/f'{goal}-pellets.pdf'
                page.pdf(path=str(pdf),format='A4',print_background=True)
                reader = PdfReader(pdf)
                texts = [(p.extract_text() or '').strip() for p in reader.pages]
                assert 1 <= len(texts) <= 4 and all(len(t)>80 for t in texts), texts
                assert LABELS[goal] in ' '.join(texts) and 'REGISTRO EN CAMPO' in ' '.join(texts)
                assert 'El fuego nos' not in ' '.join(texts)
                print('PDF',goal,len(texts),'pages',flush=True)
            assert not errors, errors
            context.close()
            print('PASS',width,goal,equipment,flush=True)
    # Reusing an incompatible equipment must not silently switch or generate a guide.
    page = browser.new_page()
    page.goto('http://127.0.0.1:3001/#planificador',wait_until='networkidle')
    page.get_by_label('Equipo',exact=True).select_option('abierta')
    page.get_by_label('Objetivo de cocción',exact=True).select_option('hornear')
    page.get_by_role('button',name='Construir plan de fuego',exact=True).click()
    expect(page.locator('.planner-validation')).to_contain_text('no admite hornear')
    expect(page.get_by_label('Equipo',exact=True)).to_have_value('abierta')
    # Mixed objectives: smoking followed by direct searing requires pellet capability.
    page.get_by_label('Objetivo de cocción',exact=True).select_option('ahumar')
    page.get_by_label('Equipo',exact=True).select_option('pellets')
    page.locator('.planner-customize > summary').click()
    page.get_by_role('button',name='Crear secuencia: indirecto → sellado',exact=True).click()
    expect(page.get_by_label('Objetivo de etapa 2',exact=True)).to_have_value('asar')
    page.get_by_role('button',name='Construir plan de fuego',exact=True).click()
    expect(page.locator('.planner-validation')).to_contain_text('Confirma la capacidad')
    page.locator('[name="capabilityVerified"]').check()
    page.get_by_role('button',name='Construir plan de fuego',exact=True).click()
    expect(page.locator('.fire-plan-timeline')).to_contain_text('Asar · Directo')
    expect(page.locator('.fire-plan-timeline')).to_contain_text('Ahumar · Indirecto')
    print('PASS incompatible equipment and mixed-objective constraints',flush=True)
    browser.close()
