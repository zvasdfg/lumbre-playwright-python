"""Replay the audited corpus, preserving source facts; no physical-cooking claims.

Run against a freshly built static preview. Browser data is isolated. Source
fixtures are paraphrased thermal requirements, not entire copyrighted recipes.
"""
import collections,json,re
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

ROOT=Path(__file__).parent
OUT=Path('/tmp/lumbre-planner-v2');OUT.mkdir(exist_ok=True)
cases=json.loads((ROOT/'fixtures/planner-100-cases.json').read_text())
assert len(cases)==100 and len({r['url'] for r in cases})==100
# Explicit transitions reviewed against the audit. Durations not implied by heat
# values are deliberately left blank; source notes remain available alongside.
TRANSITIONS={
  9:[('Ahumar','indirecto','225–250'),('Brasear cubierto','indirecto','225–275')],
  16:[('Sellar','directo',''),('Terminar','indirecto','')],
  17:[('Cocinar','indirecto','400'),('Acabado','directo','400')],
  30:[('Ahumar','indirecto','250'),('Acabado','indirecto','325–350')],
  39:[('Ahumar','indirecto','225'),('Sellar en montaje autorizado','directo','')],
  44:[('Ahumar','indirecto','250'),('Brasear envuelto','indirecto','275')],
  45:[('Dorar piel','directo',''),('Terminar con humo','indirecto','')],
  51:[('Ahumar','indirecto','275'),('Continuar cubierto','indirecto','300'),('Preparar papas','indirecto','350')],
  53:[('Primera cocción','indirecto','225'),('Regresar después de la pausa','indirecto','250')],
  57:[('Primera cocción','indirecto','250'),('Cocinar envuelto','indirecto','250')],
  62:[('Primera fase','directo','325'),('Fuego alto','directo',''),('Bajar calor','directo','325–350')],
  63:[('Ahumar','indirecto','250'),('Cocinar envuelto','indirecto','250')],
  64:[('Ahumar','indirecto','250'),('Continuar cubierto','indirecto','250')],
  68:[('Ahumar','indirecto','225'),('Sellar con conversión autorizada','directo','')],
  70:[('Ahumar','indirecto','225'),('Sellar con conversión autorizada','directo','')],
  75:[('Base y pastel','indirecto','275'),('Cobertura','indirecto','250')],
  79:[('Dorar masa','directo','400–450'),('Cocinar con cobertura','directo','350–400')],
  81:[('Primera cocción','indirecto','350'),('Hornear masa','indirecto','400')],
  83:[('Paquete sobre brasas','directo','350–450'),('Pan sobre rejilla','directo','350–450')],
  86:[('Sartén','directo','450–500'),('Hornear','indirecto','350–400')],
  88:[('Ahumar lácteo','indirecto','250–300'),('Terminar papas','indirecto','250–300')],
  98:[('Primera tanda','indirecto','250–350'),('Regreso al fuego','indirecto','250–350')],
  99:[('Pescado','directo','350–450'),('Pan','directo','350–450')],
  100:[('Chile','directo','450–550'),('Camarón','directo','450–550')],
}
results=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch()
    page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce')
    page.goto('http://127.0.0.1:3001',wait_until='networkidle')
    page.add_style_tag(content='*{scroll-behavior:auto!important;animation:none!important}')
    js_errors=[];page.on('pageerror',lambda e:js_errors.append(str(e)))
    for source in cases:
        n=int(source['id']);row={**source}; unsupported=source['equipment'] in ('pellets','autofeed')
        # The quick start clears the prior case, including optional fields.
        page.get_by_role('button',name='Comida directa',exact=False).click()
        eq=page.get_by_label('Equipo',exact=True);method=page.get_by_label('Tipo de cocción',exact=True)
        build=page.get_by_role('button',name='Construir plan de fuego',exact=True)
        if unsupported:
            eq.select_option('no_soportado');build.click()
            expect(page.locator('.planner-result')).to_have_count(0)
            expect(page.get_by_role('alert')).to_contain_text('Pellets')
            row.update(outcome='NO SOPORTADO',verified='Bloqueo explícito; no se forzó otro equipo')
        else:
            eq.select_option(source['equipment'])
            page.get_by_label('Combustible principal',exact=True).select_option('gas_lp' if source['equipment']=='gas' else 'lena' if n in (41,43) else 'carbon')
            mapped='indirecto' if source['method']=='lento' else source['method']
            transitions=TRANSITIONS.get(n,[])
            if len({s[1] for s in transitions})>1:mapped='dos_zonas'
            method.select_option(mapped)
            if page.locator('.planner-customize').get_attribute('open') is None:page.locator('.planner-customize > summary').click()
            page.get_by_label('Unidad de temperatura',exact=True).select_option('F')
            # Only values explicitly marked Fahrenheit in the source summary.
            temperatures=re.findall(r'(\d+(?:[–-]\d+)?)°F',source['heat_requirement'])
            temperature=temperatures[0] if temperatures else ''
            page.locator('[name="temperature"]').fill(temperature)
            page.locator('[name="recipeUrl"]').fill(source['url'])
            notes=source['heat_requirement'].replace('UNKNOWN','no especificada')
            page.locator('[name="notes"]').fill(notes)
            for i,(name,m,temp) in enumerate(transitions,1):
                page.get_by_role('button',name='Añadir etapa',exact=True).click()
                page.get_by_label(f'Nombre de etapa {i}',exact=True).fill(name)
                page.get_by_label(f'Método de etapa {i}',exact=True).select_option(m)
                page.get_by_label(f'Temperatura de etapa {i} (°F)',exact=True).fill(temp)
            # Exercise positive branch, not evidence of physical compatibility.
            gates=[]
            for field in ('fuelVerified','capabilityVerified'):
                checkbox=page.locator(f'[name="{field}"]')
                if checkbox.count():checkbox.check();gates.append(field)
            build.click();output=page.locator('.planner-result');expect(output).to_be_visible()
            expect(output).to_contain_text(notes)
            if temperature:expect(output).to_contain_text(temperature+' °F')
            name='CASO '+str(n).zfill(3)
            page.get_by_label('Nombre del plan',exact=True).fill(name)
            page.get_by_role('button',name='Guardar plan',exact=True).click()
            page.get_by_role('button',name='Editar plan '+name,exact=True).click()
            expect(page.locator('[name="notes"]')).to_have_value(notes)
            expect(page.locator('[name="recipeUrl"]')).to_have_value(source['url'])
            expect(page.locator('[name="temperature"]')).to_have_value(temperature)
            expect(page.locator('.planner-stage-editor fieldset')).to_have_count(len(transitions))
            page.get_by_role('button',name='Imprimir plan '+name,exact=True).click()
            dialog=page.get_by_role('dialog');expect(dialog).to_contain_text(notes);expect(dialog).to_contain_text(source['url'])
            assert dialog.evaluate('(e)=>e.scrollWidth<=e.clientWidth')
            for title,_,temp in transitions:
                expect(dialog).to_contain_text(title)
                if temp:expect(dialog).to_contain_text(temp+' °F')
            page.get_by_role('button',name='Cerrar plan imprimible',exact=True).click()
            page.get_by_role('button',name='Eliminar plan '+name,exact=True).click()
            # Conservative verdict: only the simple extracted thermal setup is
            # represented; a recipe, time estimate, accessory or model is not certified.
            simple=source['limitation']=='Temperatura' and bool(temperature) and not gates
            row.update(outcome='CONFIGURACIÓN TÉRMICA REPRODUCIBLE' if simple else 'PARCIAL',
                verified='Generar, guardar, cargar y vista imprimible conservan temperatura, enlace, notas y etapas capturadas',
                stages=transitions,temperature=temperature,unit='F',method=mapped,
                conditional_confirmation_simulated=gates,
                remaining='No verifica tiempos de cocción ni modelo físico; el diagrama es conceptual.' if simple else source['limitation']+'; los detalles en notas no generan automáticamente un montaje específico.')
        results.append(row)
        (OUT/'100-cases-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
        print(n,row['outcome'],flush=True)
    assert not js_errors,js_errors
    counts=dict(collections.Counter(r['outcome'] for r in results))
    (OUT/'100-cases-summary.json').write_text(json.dumps({'count':len(results),'outcomes':counts,'js_errors':js_errors,'scope':'Configuraciones térmicas extraídas, no recetas completas ni cocciones físicas. Duración opcional no inferida de cookTime. Confirmaciones de modelo simuladas.'},ensure_ascii=False,indent=2))
    print(counts,flush=True);browser.close()
