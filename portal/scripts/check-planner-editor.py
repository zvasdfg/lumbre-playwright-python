"""Real UI regression: isolated storage, desktop/mobile, legacy safety and print."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

URL='http://127.0.0.1:3001'
KEY='lumbre.fire-planner.presets.v1'
EVIDENCE=Path('/tmp/lumbre-planner-v2')
EVIDENCE.mkdir(exist_ok=True)

def navigate(page):
    page.goto(URL,wait_until='networkidle')
    page.add_style_tag(content='*{scroll-behavior:auto!important;animation:none!important}')

def details(page):
    if page.locator('.planner-customize').get_attribute('open') is None:
        page.locator('.planner-customize > summary').click()

def data(page):
    return page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)||"[]")',KEY)

with sync_playwright() as pw:
    browser=pw.chromium.launch()
    for width in (390,1440):
        context=browser.new_context(viewport={'width':width,'height':1000},reduced_motion='reduce')
        page=context.new_page(); errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        navigate(page)
        if width==390:
            page.locator('.mobile-nav > summary').click()
            page.locator('.mobile-nav').get_by_role('link',name='Planificador',exact=True).click()
            assert page.locator('.mobile-nav').get_attribute('open') is None
            expect(page.locator('#planificador')).to_be_focused()
        eq=page.get_by_label('Equipo',exact=True); fuel=page.get_by_label('Combustible principal',exact=True)
        method=page.get_by_label('Tipo de cocción',exact=True); build=page.get_by_role('button',name='Construir plan de fuego',exact=True)
        output=page.locator('.planner-result'); name=page.get_by_label('Nombre del plan',exact=True)
        save=page.get_by_role('button',name='Guardar plan',exact=True)
        build.click();expect(output).to_be_visible();expect(page.locator('.planner-output')).to_be_focused()
        assert 'No cargues todo al inicio' not in output.inner_text()
        assert page.locator('.planner-customize').get_attribute('open') is None
        page.locator('.planner-controls').scroll_into_view_if_needed()
        page.screenshot(path=str(EVIDENCE/f'controls-{width}.png'))
        attempts=0
        for e in ('abierta','kettle','kamado','ahumador','offset','gas'):
            eq.select_option(e)
            fuels=['gas_lp','gas_natural'] if e=='gas' else ['carbon','briquetas','lena']
            assert set(fuel.locator('option').evaluate_all('(els)=>els.map(e=>e.value)'))==set(fuels)
            for f in fuels:
                fuel.select_option(f)
                check=page.locator('[name="fuelVerified"]')
                if check.count():
                    expect(check).not_to_be_checked();build.click();expect(output).to_have_count(0);check.check()
                for m in ('directo','indirecto','dos_zonas'):
                    method.select_option(m);build.click()
                    cap=page.locator('[name="capabilityVerified"]')
                    if cap.count():
                        expect(output).to_have_count(0);cap.check();build.click()
                    if e=='abierta' and m=='indirecto':
                        expect(output).to_have_count(0);expect(page.get_by_role('alert')).to_contain_text('requiere tapa')
                        name.fill('Invalid');save.click();assert not data(page)
                    else:
                        expect(output).to_be_visible();expect(output.locator('.fire-plan-steps li')).to_have_count(4)
                        assert output.evaluate('(e)=>e.scrollWidth<=e.clientWidth')
                    attempts+=1
        eq.select_option('no_soportado');build.click();expect(output).to_have_count(0)
        expect(page.get_by_role('alert')).to_contain_text('Pellets')
        eq.select_option('kamado');fuel.select_option('carbon');method.select_option('dos_zonas');details(page)
        page.get_by_label('Unidad de temperatura',exact=True).select_option('F')
        page.locator('[name="durationHours"]').fill('3.5')
        page.locator('[name="temperature"]').fill('225–250')
        page.locator('[name="accessory"]').fill('Deflector parcial y rejilla')
        page.locator('[name="smoking"]').check();page.locator('[name="smokeWood"]').fill('Roble en trozos')
        page.locator('[name="recipeUrl"]').fill('https://www.kamadojoe.com/blogs/recipes/smoked-beef-cheeks')
        page.locator('[name="notes"]').fill('Registro de prueba\nRecargué una vez; revisar ventilación.')
        for i,(title,temp,m) in enumerate([('Ahumar','225–250','indirecto'),('Sellar','400','directo')],1):
            page.get_by_role('button',name='Añadir etapa',exact=True).click()
            page.get_by_label(f'Nombre de etapa {i}',exact=True).fill(title)
            page.get_by_label(f'Método de etapa {i}',exact=True).select_option(m)
            page.get_by_label(f'Temperatura de etapa {i} (°F)',exact=True).fill(temp)
            page.get_by_label(f'Duración o señal para cambiar {i}',exact=True).fill('Según receta y termómetro')
        build.click();expect(output).to_have_count(0)
        page.locator('[name="capabilityVerified"]').check();build.click();expect(output).to_contain_text('225–250 °F')
        expect(output).to_contain_text('Sellar');name.fill('Domingo');save.click();assert len(data(page))==1
        original=data(page)[0]['configuration']
        name.fill('domingo');save.click();expect(page.get_by_role('group',name='Confirmar reemplazo')).to_be_visible()
        assert data(page)[0]['name']=='Domingo'
        page.get_by_role('button',name='Cancelar',exact=True).click()
        save.click();page.get_by_role('button',name='Guardar como copia',exact=True).click();assert len(data(page))==2
        page.get_by_role('button',name='Editar plan Domingo',exact=True).click()
        expect(page.locator('[name="notes"]')).to_have_value(original['notes'])
        page.locator('[name="notes"]').fill('Notas corregidas\nConservar para próxima sesión.')
        save.click();page.get_by_role('button',name='Confirmar reemplazo',exact=True).click()
        page.reload(wait_until='networkidle')
        page.get_by_role('button',name='Editar plan Domingo',exact=True).click()
        expect(page.locator('[name="notes"]')).to_have_value('Notas corregidas\nConservar para próxima sesión.')
        expect(page.get_by_label('Nombre de etapa 2',exact=True)).to_have_value('Sellar')
        page.get_by_role('button',name='Subir etapa 2',exact=True).click()
        expect(page.get_by_label('Nombre de etapa 1',exact=True)).to_have_value('Sellar')
        page.get_by_role('button',name='Editar plan Domingo',exact=True).click()
        page.get_by_role('button',name='Imprimir plan Domingo',exact=True).click()
        dialog=page.get_by_role('dialog');expect(dialog).to_contain_text('Notas corregidas');expect(dialog).to_contain_text('225–250 °F')
        assert dialog.evaluate('(e)=>e.scrollWidth<=e.clientWidth')
        page.evaluate('() => { window.__prints=0; window.print=()=>{window.__prints++;}; }')
        dialog.get_by_role('button',name='Imprimir ficha',exact=True).click();assert page.evaluate('window.__prints')==1
        page.screenshot(path=str(EVIDENCE/f'print-{width}.png'))
        if width==1440: page.pdf(path=str(EVIDENCE/'plan-con-etapas.pdf'),prefer_css_page_size=True,print_background=True)
        page.keyboard.press('Escape');expect(dialog).to_have_count(0)
        expect(page.get_by_role('button',name='Imprimir plan Domingo',exact=True)).to_be_focused()
        page.get_by_role('button',name='Eliminar plan Domingo',exact=True).click();assert len(data(page))==1
        page.get_by_role('button',name='Deshacer eliminación',exact=True).click();assert len(data(page))==2
        page.get_by_role('button',name='Duplicar plan Domingo',exact=True).click();save.click();assert len(data(page))==3
        assert not errors,errors
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        print(f'PASS {width}: {attempts} fuel/method combinations; mobile menu; stage editor; save/replace/copy/edit/delete/undo/reload/print',flush=True)
        context.close()
    # Legacy migrations retain raw backup; incompatible saved plans cannot print.
    context=browser.new_context();page=context.new_page();navigate(page)
    legacy={'id':'old','name':'Antiguo','configuration':{'guests':'6','cookingStyle':'lento','durationHours':'6','fuelType':'carbon','equipment':'abierta','weather':'viento','servingTime':'15:00','includeVegetables':False,'customField':'keep'}}
    raw=json.dumps([legacy]);page.evaluate('([k,v])=>localStorage.setItem(k,v)',[KEY,raw]);page.reload(wait_until='networkidle')
    expect(page.get_by_test_id('fire-presets')).to_contain_text('Revisión necesaria')
    page.get_by_role('button',name='Imprimir plan Antiguo',exact=True).click();expect(page.get_by_role('dialog')).to_have_count(0)
    assert page.evaluate('(k)=>localStorage.getItem(k)',KEY)==raw
    page.get_by_role('button',name='Editar plan Antiguo',exact=True).click()
    page.get_by_label('Equipo',exact=True).select_option('kettle')
    page.get_by_role('button',name='Guardar plan',exact=True).click();page.get_by_role('button',name='Confirmar reemplazo',exact=True).click()
    assert page.evaluate('(k)=>localStorage.getItem(k+".before-editor-v2")',KEY)==raw
    assert data(page)[0]['configuration']['customField']=='keep'
    assert data(page)[0]['configuration']['smoking'] is True
    # Cross-tab mutation is blocked rather than overwriting.
    page.evaluate('(k)=>localStorage.setItem(k,"[]")',KEY)
    page.get_by_role('button',name='Eliminar plan Antiguo',exact=True).click()
    expect(page.locator('.preset-message')).to_contain_text('otra pestaña')
    assert data(page)==[]
    # Corrupt storage is preserved, and save is disabled.
    page.evaluate('(k)=>localStorage.setItem(k,"{broken")',KEY);page.reload(wait_until='networkidle')
    page.get_by_label('Nombre del plan',exact=True).fill('No destruir')
    expect(page.get_by_role('button',name='Guardar plan',exact=True)).to_be_disabled()
    assert page.evaluate('(k)=>localStorage.getItem(k)',KEY)=='{broken'
    print('PASS legacy migration, byte-preserving backup, unknown fields, invalid print gate, cross-tab conflict and corrupt storage',flush=True)
    context.close();browser.close()
