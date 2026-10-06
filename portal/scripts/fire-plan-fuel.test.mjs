import test from 'node:test';

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {initialConfiguration as base, configurationSchema, issues, compatibleFuels, defaultTemperature} from '../static/fire-plan-model.ts';
const source=readFileSync(new URL('../static/fire-plan-fuel.tsx',import.meta.url),'utf8').replaceAll('"./fire-plan-model"',JSON.stringify(new URL('../static/fire-plan-model.ts',import.meta.url).href));
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.React}}).outputText;
const {estimateFuel,kettleFuelReference,fuelAvailability}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('simple charcoal estimates explicitly use Lumbre assumptions; hours still required',()=>{
  assert.equal(estimateFuel({...base,durationHours:'2'}).extrapolated,true);
  assert.match(estimateFuel({...base,fuelRate:'1'}).reason,/horas/);
});
test('manual quantity adds warmup, startup and a separately rounded reserve',()=>{
  const e=estimateFuel({...base,durationHours:'2',fuelRate:'0,5',fuelStartup:'1',preheatMinutes:'30'});
  assert.equal(e.high,2.3);assert.equal(e.reserve,.6);assert.equal(e.total,2.9);
  assert.ok(Math.abs(e.total-e.high-e.reserve)<1e-9);
});
test('zero warmup is respected; blank migrates to 30 minutes',()=>{
  assert.equal(estimateFuel({...base,durationHours:'2',fuelRate:'1',preheatMinutes:'0'}).high,2);
  assert.equal(configurationSchema.parse({equipment:'kettle',fuelType:'carbon',cookingStyle:'directo'}).preheatMinutes,'30');
});
test('pellet references retain published bands and mark intermediate interpolation',()=>{
  const c={...base,equipment:'pellets',fuelType:'pellets',cookingStyle:'indirecto',goal:'ahumar',durationHours:'2',temperature:'120'};
  assert.equal(estimateFuel(c).total,3.2);
  assert.equal(estimateFuel({...c,unit:'F',temperature:'248'}).total,3.2);
  assert.ok(estimateFuel({...c,temperature:'160'}).total>3.2);
  assert.ok(estimateFuel({...c,temperature:'160'}).total<6.3);
  assert.equal(estimateFuel({...c,temperature:'120–250'}).total,6.3);
  assert.equal(estimateFuel({...c,temperature:'250'}).total,6.3);
  assert.ok(estimateFuel({...c,temperature:'180'}).source.includes('Weber'));
});
test('manual rate overrides reference; stages use an explicit temperature envelope',()=>{
  const c={...base,equipment:'pellets',fuelType:'pellets',cookingStyle:'indirecto',durationHours:'2',temperature:'120'};
  assert.equal(estimateFuel({...c,fuelRate:'2'}).total,6.3);
  assert.equal(estimateFuel({...c,stages:[{name:'Humo',method:'indirecto',temperature:'120',duration:'2h',notes:''}]}).total,3.2);
});
test('invalid and incompatible entries cannot calculate; units remain distinct',()=>{
  for(const fuelRate of ['0','-1','NaN','Infinity','101','1e2']) assert.ok(issues({...base,fuelRate}).length);
  assert.match(estimateFuel({...base,equipment:'gas',fuelType:'carbon',durationHours:'2',fuelRate:'1'}).reason,/Corrige/);
  assert.equal(estimateFuel({...base,equipment:'gas',fuelType:'gas_natural',durationHours:'2',fuelRate:'1'}).unit,'m³');
});

test('kettle reference preserves source units and excludes unsupported smoking/sequences',()=>{
  for(const [diameter,initial,extra,kg] of [['47',20,16,.6],['57',30,16,.6],['67',40,24,.84]]) {
    const c={...base,kettleDiameter:diameter,fuelType:'briquetas',cookingStyle:'indirecto',capabilityVerified:true,durationHours:'2.5'};
    const r=kettleFuelReference(c);
    assert.equal(r.initial,initial);assert.equal(r.additions,extra);assert.equal(r.charcoalKg,kg);
    assert.equal(kettleFuelReference({...c,goal:'ahumar'}),null);
    assert.equal(kettleFuelReference({...c,cookingStyle:'dos_zonas'}),null);
    assert.equal(kettleFuelReference({...c,fuelRate:'1'}),null);
  }
});
test('kettle shopping total includes separately identified reserve',()=>{
  const c={...base,fuelType:'briquetas',cookingStyle:'indirecto',durationHours:'4'};
  const r=kettleFuelReference(c);
  assert.deepEqual([r.initial,r.additions,r.session,r.reserve,r.total],[30,24,54,14,68]);
  assert.match(fuelAvailability(c).detail,/68 briquetas/);
  for (const kettleDiameter of ['47','57','67']) for(const durationHours of ['0.5','1','2.5','4','48']) {
    const e=kettleFuelReference({...c,kettleDiameter,durationHours});
    assert.equal(e.total,e.initial+e.additions+e.reserve);
    assert.equal(e.reserve,Math.ceil(e.session*.25));
  }
});
test('preview distinguishes extrapolation, missing hours, manual and invalid budgets',()=>{
  assert.match(fuelAvailability(base).title,/Lumbre/);
  assert.match(fuelAvailability({...base,fuelType:'briquetas',cookingStyle:'indirecto'}).detail,/Introduce las horas/);
  assert.match(fuelAvailability({...base,goal:'ahumar',cookingStyle:'indirecto'}).title,/Lumbre/);
  assert.match(fuelAvailability({...base,fuelRate:'1'}).title,/tu consumo/);
  assert.match(fuelAvailability({...base,equipment:'gas',fuelType:'gas_lp'}).title,/Lumbre/);
  assert.match(fuelAvailability({...base,equipment:'gas',fuelType:'carbon'}).title,/Revisa/);
});
test('all supported valid simple combinations provide finite ordered budgets without manual inputs',()=>{
  let checked=0;
  for(const [equipment,fuels] of Object.entries(compatibleFuels)) for(const fuelType of fuels)
  for(const goal of ['asar','ahumar','hornear']) for(const cookingStyle of ['directo','indirecto','dos_zonas']) {
    const c={...base,equipment,fuelType,goal,cookingStyle,durationHours:'4',temperature:defaultTemperature(goal,cookingStyle),capabilityVerified:true,fuelVerified:true,smokeVerified:true};
    if(issues(c).length) continue;
    const e=estimateFuel(c); checked++;
    assert.ok(!('reason' in e),JSON.stringify(c));
    assert.ok(Number.isFinite(e.total)&&e.low>0&&e.low<=e.high&&e.total>=e.high);
    assert.ok(Math.abs(e.total-Math.max(e.high,Math.ceil((e.minimum-1e-9)*10)/10)-e.reserve)<1e-8);
    assert.ok(e.sourceUrl.startsWith('https://'));
  }
  assert.ok(checked>60); console.log('Automatic fuel budgets checked:',checked);
});
test('estimated consumption responds to hours, temperature, size and fuel; C/F equivalent',()=>{
  const c={...base,durationHours:'2'};
  const e=estimateFuel(c);
  assert.ok(estimateFuel({...c,durationHours:'6'}).high>e.high);
  assert.ok(estimateFuel({...c,temperature:'300'}).high>e.high);
  assert.ok(estimateFuel({...c,kettleDiameter:'67'}).high>e.high);
  assert.equal(estimateFuel({...c,temperature:'428',unit:'F'}).high,e.high);
  assert.ok(estimateFuel({...c,fuelType:'lena',fuelVerified:true}).high>e.high);
  assert.equal(estimateFuel({...c,equipment:'gas',fuelType:'gas_natural'}).unit,'m³');
});
