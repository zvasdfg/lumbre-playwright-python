import test from 'node:test';
import assert from 'node:assert/strict';
import { stageConfiguration, stageSchema, surfaceGuidance } from '../static/fire-plan-model.ts';
import { initialConfiguration as base, configurationSchema, presetSchema, issues, guide, decodePresets, safeRecipeUrl, compatibleFuels, needsCapability } from '../static/fire-plan-model.ts';

test('three choices create a base guide without inventing recipe data', () => {
  assert.deepEqual(issues(base), []);
  assert.equal(base.temperature, ''); assert.equal(base.durationHours, '');
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
