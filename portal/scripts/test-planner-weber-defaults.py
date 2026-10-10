from browser_test_options import browser_launch_options
from playwright.sync_api import sync_playwright, expect
with sync_playwright() as p:
    browser=p.chromium.launch(**browser_launch_options())
    for width in [390,1440]:
        page=browser.new_page(viewport={'width':width,'height':1000})
        page.goto('http://127.0.0.1:3001/#planificador',wait_until='networkidle')
        expect(page.get_by_label('Consumo por hora',exact=True)).not_to_be_visible()
        expect(page.get_by_label('Precalentamiento',exact=True)).not_to_be_visible()
        expect(page.get_by_label('Diámetro de la parrilla',exact=True)).not_to_be_visible()
        page.get_by_label('Horas de cocción',exact=True).fill('2')
        for goal in ['asar','ahumar','hornear']:
            page.get_by_label('Objetivo de cocción',exact=True).select_option(goal)
            page.get_by_label('Equipo',exact=True).select_option('pellets')
            page.get_by_role('button',name='Construir plan de fuego',exact=True).click()
            result=page.locator('.planner-result .fire-fuel-estimate')
            expect(result).to_contain_text('Weber SmokeFire')
            expect(result.locator('h3')).to_contain_text('kg')
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        page.get_by_label('Equipo',exact=True).select_option('offset')
        for checkbox in page.locator('[name="capabilityVerified"]').all(): checkbox.check()
        page.get_by_role('button',name='Construir plan de fuego',exact=True).click()
        expect(page.locator('.planner-result .fire-fuel-estimate')).to_contain_text('ESTIMACIÓN LUMBRE')
        expect(page.get_by_label('Consumo por hora',exact=True)).not_to_be_visible()
        page.close()
        print('PASS Weber defaults and optional controls',width,flush=True)
    browser.close()
