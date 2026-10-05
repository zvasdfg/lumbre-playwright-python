"""Fuel budgets: reference/manual rates, units, persistence, PDF and no invented defaults."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from pypdf import PdfReader
OUT=Path('/tmp/lumbre-fuel-v1')
OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch()
    cases=[('kettle','carbon','1','3.2 kg'),('kamado','briquetas','1','3.2 kg'),
           ('offset','lena','2','6.3 kg'),('gas','gas_lp','.5','1.7 kg'),
           ('gas','gas_natural','1','3.2 m³'),('pellets','pellets','','3.2 kg')]
    for width in [390,1440]:
        for equipment,fuel,rate,total in cases:
            context=browser.new_context(viewport={'width':width,'height':1000})
            page=context.new_page()
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto('http://127.0.0.1:3001/#planificador',wait_until='networkidle')
            if equipment=='pellets':page.get_by_label('Objetivo de cocción',exact=True).select_option('ahumar')
            page.get_by_label('Equipo',exact=True).select_option(equipment)
            control=page.get_by_label('Combustible principal',exact=True)
            if control.is_enabled():control.select_option(fuel)
            for name in ['capabilityVerified','fuelVerified']:
                control=page.locator('[name="'+name+'"]')
                if control.count():control.check()
            page.get_by_label('Horas de cocción',exact=True).fill('2')
            page.locator('.planner-reference-settings > summary').click()
            if rate:page.get_by_label('Consumo por hora',exact=True).fill('0.5' if rate=='.5' else rate)
            page.get_by_role('button',name='Construir plan de fuego',exact=True).click()
            estimate=page.locator('.planner-result .fire-fuel-estimate')
            expect(estimate.locator('h3')).to_contain_text(total)
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            page.get_by_label('Nombre del plan',exact=True).fill(fuel)
            page.get_by_role('button',name='Guardar plan',exact=True).click()
            page.reload(wait_until='networkidle')
            page.get_by_role('button',name='Editar plan '+fuel,exact=True).click()
            expect(page.get_by_label('Consumo por hora',exact=True)).to_have_value('0.5' if rate=='.5' else rate)
            page.get_by_role('button',name='Imprimir plan '+fuel,exact=True).click()
            expect(page.get_by_role('dialog').locator('.fire-fuel-estimate h3')).to_contain_text(total)
            if width==1440:
                path=OUT/(fuel+'.pdf')
                page.pdf(path=str(path),format='A4',print_background=True)
                text=' '.join(x.extract_text() for x in PdfReader(path).pages)
                assert 'COMBUSTIBLE PARA PREVER' in text
            assert not errors,errors
            context.close()
            print('PASS',width,fuel,flush=True)
    page=browser.new_page()
    page.goto('http://127.0.0.1:3001/#planificador',wait_until='networkidle')
    page.get_by_label('Horas de cocción',exact=True).fill('2')
    page.get_by_role('button',name='Construir plan de fuego',exact=True).click()
    expect(page.locator('.planner-result .fire-fuel-estimate')).to_contain_text('Se muestra la carga inicial')
    page.locator('.planner-reference-settings > summary').click()
    page.get_by_label('Consumo por hora',exact=True).fill('-1')
    page.get_by_role('button',name='Construir plan de fuego',exact=True).click()
    expect(page.locator('.planner-validation')).to_contain_text('Consumo por hora')
    page.get_by_label('Consumo por hora',exact=True).fill('1')
    page.get_by_label('Equipo',exact=True).select_option('gas')
    expect(page.get_by_label('Consumo por hora',exact=True)).to_have_value('')
    print('PASS missing rate, invalid rate, stale rate reset',flush=True)
    browser.close()
