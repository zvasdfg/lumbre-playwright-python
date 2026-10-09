import test from 'node:test';
test('temperature defaults cover every objective/method and preserve legacy values', () => {
  for (const method of ['directo','indirecto','dos_zonas']) {
    assert.equal(defaultTemperature('ahumar', method), '120');
    assert.equal(defaultTemperature('hornear', method), '180');
    assert.equal(defaultTemperature('asar', method), method === 'directo' ? '220' : '200');
  }
  assert.equal(defaultTemperature('ahumar','indirecto','F'), '248');
  const old = configurationSchema.parse({equipment:'kettle',fuelType:'carbon',cookingStyle:'directo',temperature:'175'});
  assert.equal(old.temperature,'175'); assert.equal(old.temperatureSuggested,false);
});
import assert from 'node:assert/strict';
// Independent compatibility oracle: do not derive expectations from issues().
test('MATRIX-001 exhaustive goal/equipment/fuel/method/smoke/surface/unit contract', () => {
  const fuels = {abierta:['carbon','briquetas','lena'], kettle:['carbon','briquetas','lena'],
    kamado:['carbon','briquetas','lena'], ahumador:['carbon','briquetas','lena'],
    offset:['carbon','briquetas','lena'], gas:['gas_lp','gas_natural'], pellets:['pellets'], no_soportado:[]};
  let checked=0, accepted=0;
  for (const equipment of Object.keys(fuels)) for (const fuelType of ['carbon','briquetas','lena','gas_lp','gas_natural','pellets'])
  for (const goal of ['asar','ahumar','hornear']) for (const cookingStyle of ['directo','indirecto','dos_zonas'])
  for (const smoking of [false,true]) for (const surface of ['rejilla','plancha','sarten','bandeja','sin_definir'])
  for (const unit of ['C','F']) {
    const c={...base,equipment,fuelType,goal,cookingStyle,smoking,surface,unit,
      temperature:unit==='C'?'180':'356',durationHours:'2',fuelVerified:true,capabilityVerified:true,smokeVerified:true};
    const invalid=!fuels[equipment].includes(fuelType) ||
      (goal!=='asar' && cookingStyle!=='indirecto') ||
      (equipment==='abierta' && (goal!=='asar'||cookingStyle==='indirecto'||smoking));
    assert.equal(issues(c).length>0,invalid,JSON.stringify(c));
    checked++; if(!invalid) accepted++;
  }
  assert.equal(checked,8640);
  console.log(`MATRIX-001: ${checked} combinations; ${accepted} accepted; ${checked-accepted} rejected`);
});
import { stageConfiguration, stageSchema, surfaceGuidance } from '../static/fire-plan-model.ts';
import { defaultTemperature, capability, goalLabels, equipmentLabels, fuelLabels, hasSmoke, needsOvenCheck } from '../static/fire-plan-model.ts';
import { initialConfiguration as base, configurationSchema, presetSchema, issues, guide, decodePresets, safeRecipeUrl, compatibleFuels, needsCapability } from '../static/fire-plan-model.ts';

test('base guide has an explicitly suggested temperature, without inventing duration or recipe stages', () => {
  assert.deepEqual(issues(base), []);
  assert.equal(base.temperature, '220'); assert.equal(base.temperatureSuggested, true); assert.equal(base.durationHours, '');
  assert.equal(base.smoking, false); assert.deepEqual(base.stages, []);
});
test('optional supports migrate and retain per-stage overrides without changing method', () => {
  const legacy=configurationSchema.parse({equipment:'kettle',fuelType:'carbon',cookingStyle:'directo'});
  assert.equal(legacy.surface,'rejilla');
  const s=stageSchema.parse({name:'Cubrir',method:'indirecto',surface:'bandeja',temperature:'275',extra:'retain'});
  assert.equal(s.extra,'retain');
  const c=stageConfiguration({...base,surface:'sarten'},s);
  assert.equal(c.surface,'bandeja');assert.equal(c.cookingStyle,'indirecto');assert.equal(c.temperature,'275');
  assert.equal(stageConfiguration({...base,surface:'sarten'},{...s,surface:undefined}).surface,'sarten');
  for(const surface of ['rejilla','plancha','sarten','bandeja']) assert.ok(surfaceGuidance(surface));
  assert.equal(configurationSchema.safeParse({...base,surface:'rotisserie'}).success,false);
  const old={id:'mount',name:'Plan previo',configuration:{equipment:'kettle',fuelType:'carbon',cookingStyle:'directo',accessory:'Plancha especial'}};
  const migrated=decodePresets(JSON.stringify([old]))[0].configuration;
  assert.equal(migrated.surface,'sin_definir');assert.equal(migrated.accessory,'Plancha especial');
});
test('pause is not an indirect cook and cannot retain a misleading grill temperature', () => {
  const s=stageSchema.parse({name:'Fuera del fuego',kind:'pausa',method:'indirecto'});
  assert.deepEqual(issues({...base,equipment:'abierta',stages:[s]}),[]);
  assert.ok(issues({...base,stages:[{...s,temperature:'200'}]}).length);
  assert.ok(issues({...base,equipment:'abierta',stages:[{...s,kind:'coccion'}]}).length);
});
test('fuel and method matrix: hard blocks and model confirmations', () => {
  let count=0;
  for (const equipment of ['abierta','kettle','kamado','ahumador','offset','gas']) {
    for(const fuelType of Object.keys(compatibleFuels.gas.reduce((r,k)=>(r[k]=true,r),{carbon:true,briquetas:true,lena:true}))) {
      for(const cookingStyle of ['directo','indirecto','dos_zonas']) {
        const c={...base,equipment,fuelType,cookingStyle,fuelVerified:true,capabilityVerified:true};
        const blocked=!compatibleFuels[equipment].includes(fuelType)||(equipment==='abierta'&&cookingStyle==='indirecto');
        assert.equal(issues(c).length>0,blocked,JSON.stringify(c)); count++;
      }
    }
  }
  assert.equal(count,90);
  assert.ok(issues({...base,equipment:'no_soportado'}).length);
  assert.ok(needsCapability({...base,equipment:'offset'}));
  assert.ok(issues({...base,equipment:'offset'}).length);
});
test('stage changes cannot bypass compatibility validation', () => {
  const stage={name:'Asar',method:'indirecto',temperature:'',duration:'',notes:''};
  assert.ok(issues({...base,equipment:'abierta',cookingStyle:'dos_zonas',stages:[stage]}).length);
  assert.ok(issues({...base,stages:[stage]}).length);
  assert.ok(issues({...base,equipment:'gas',cookingStyle:'indirecto',capabilityVerified:false}).length);
  assert.ok(issues({...base,equipment:'gas',fuelType:'gas_lp',smoking:true}).length);
  assert.deepEqual(issues({...base,equipment:'gas',fuelType:'gas_lp',smoking:true,smokeVerified:true}),[]);
});
test('temperature, duration and URLs validated for build/save/import', () => {
  for(const value of ['abc','0','-20','250–225','601']) assert.ok(issues({...base,temperature:value}).length,value);
  for(const value of ['120','120–140','120.5-140.5']) assert.deepEqual(issues({...base,temperature:value}),[]);
  for(const value of ['-2','0','49','Infinity','x']) assert.ok(issues({...base,durationHours:value}).length,value);
  assert.deepEqual(issues({...base,durationHours:'0.5'}),[]);
  for(const url of ['javascript:alert(1)','data:text/html,test','https://user:pass@example.com','file:///etc/passwd']) assert.equal(safeRecipeUrl(url),false,url);
  assert.equal(safeRecipeUrl('https://www.weber.com/a?b=1'),true);
  assert.equal(presetSchema.safeParse({id:'x',name:'x',configuration:{...base,notes:'x'.repeat(3001)}}).success,false);
});
test('legacy migration retains fields, does not mutate originals, and flags unsafe plans', () => {
  const old={id:'old',name:'Domingo',configuration:{equipment:'abierta',fuelType:'carbon',cookingStyle:'lento',durationHours:'6',guests:'8',weather:'viento',customField:'retain'}};
  const raw=JSON.stringify([old]), decoded=decodePresets(raw)[0];
  assert.equal(decoded.configuration.cookingStyle,'indirecto'); assert.equal(decoded.configuration.smoking,true);
  assert.equal(decoded.configuration.customField,'retain'); assert.equal(decoded.configuration.guests,'8');
  assert.equal(old.configuration.cookingStyle,'lento'); assert.ok(issues(decoded.configuration).length);
  assert.throws(()=>decodePresets('{broken'));
  assert.throws(()=>decodePresets(JSON.stringify([old,{bad:true}])));
  assert.throws(()=>decodePresets(JSON.stringify([old,old])));
  assert.throws(()=>decodePresets(JSON.stringify(Array(51).fill(old))));
});
test('duration does not invent consumption; every equipment has explicit layout', () => {
  for(const equipment of ['abierta','kettle','kamado','ahumador','offset','gas']) {
    const plan=guide({...base,equipment,durationHours:'12'});
    assert.ok(plan.layout);assert.ok(plan.preparation);assert.ok(plan.control);
    assert.ok(!plan.preparation.includes('No cargues todo al inicio'));
  }
  assert.notEqual(guide({...base,equipment:'gas',cookingStyle:'indirecto'}).layout,guide({...base,equipment:'gas'}).layout);
  assert.equal(configurationSchema.parse({...base,temperature:'200',unit:'F'}).unit,'F');
});

test('all 378 objective/equipment/fuel/method combinations enforce hard constraints even with confirmations', () => {
  let count = 0;
  for (const goal of Object.keys(goalLabels)) for (const equipment of Object.keys(equipmentLabels).filter(e => e !== 'no_soportado')) {
    for (const fuelType of Object.keys(fuelLabels)) for (const cookingStyle of ['directo','indirecto','dos_zonas']) {
      const c = {...base, goal, equipment, fuelType, cookingStyle, capabilityVerified:true, smokeVerified:true, fuelVerified:true};
      const invalid = !compatibleFuels[equipment].includes(fuelType) || capability(equipment,goal)==='no_compatible' || (goal !== 'asar' && cookingStyle !== 'indirecto') || (equipment === 'abierta' && cookingStyle === 'indirecto');
      assert.equal(issues(c).length > 0, invalid, JSON.stringify(c)); count++;
    }
  }
  assert.equal(count,378);
});

test('pellets use dedicated fuel, indirect default model and controller instructions', () => {
  const c = configurationSchema.parse({...base, goal:'ahumar', equipment:'pellets', fuelType:'pellets', cookingStyle:'indirecto'});
  assert.deepEqual(issues(c),[]);
  assert.equal(hasSmoke(c),true);
  assert.match(guide(c).control,/controlador/);
  assert.doesNotMatch(guide(c).control,/entrada de aire/);
  assert.ok(issues({...c, fuelType:'carbon', fuelVerified:true}).length);
  assert.ok(issues({...c, goal:'asar', cookingStyle:'directo'}).length);
  assert.deepEqual(issues({...c, goal:'asar', cookingStyle:'directo', capabilityVerified:true}),[]);
});

test('oven and smoking capabilities include stages but exclude pauses', () => {
  const bake = {...base,goal:'hornear',equipment:'offset',fuelType:'lena',cookingStyle:'indirecto'};
  assert.equal(needsOvenCheck(bake),true);
  assert.ok(issues(bake).length);
  assert.deepEqual(issues({...bake,capabilityVerified:true}),[]);
  const gas = {...base,equipment:'gas',fuelType:'gas_lp',goal:'ahumar',cookingStyle:'indirecto',capabilityVerified:true};
  assert.ok(issues(gas).length);
  assert.deepEqual(issues({...gas,smokeVerified:true}),[]);
  const c = {...base, goal:'ahumar', cookingStyle:'dos_zonas', stages:[stageSchema.parse({name:'Humo', goal:'ahumar',method:'indirecto'}),stageSchema.parse({name:'Dorar',goal:'asar',method:'directo'})]};
  assert.deepEqual(issues(c),[]);
  assert.equal(stageConfiguration(c,c.stages[1]).goal,'asar');
  assert.equal(stageConfiguration(c,c.stages[1]).smoking,false);
  assert.ok(issues({...c, stages:[{...c.stages[0],method:'directo'}]}).length);
  assert.deepEqual(issues({...base, stages:[stageSchema.parse({name:'Reposo',goal:'hornear',method:'directo',kind:'pausa'})]}),[]);
});

test('old mixed smoke plans migrate in memory without losing data or explicit objectives', () => {
  const legacy={id:'old-smoke',name:'Humo y dorado',configuration:{equipment:'kettle',fuelType:'carbon',cookingStyle:'indirecto',smoking:true,stages:[{name:'Dorar',method:'directo',notes:'original'}]}};
  const raw=JSON.stringify([legacy]);
  const c=decodePresets(raw)[0].configuration;
  assert.equal(c.goal,'ahumar');assert.equal(c.stages[0].goal,'asar');assert.equal(c.stages[0].notes,'original');
  assert.equal(JSON.stringify([legacy]),raw);
  const roundtrip=decodePresets(JSON.stringify([{...legacy,configuration:{...c,cookingStyle:'dos_zonas'}}]))[0];
  assert.equal(roundtrip.configuration.stages[0].goal,'asar');
  const explicit = decodePresets(JSON.stringify([{...legacy, configuration:{...legacy.configuration, goal:'ahumar', cookingStyle:'dos_zonas'}}]))[0].configuration;
  assert.equal(explicit.stages[0].goal,undefined);
  assert.ok(issues(explicit).some(issue => issue.includes('requiere calor indirecto')));
});
