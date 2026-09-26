"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type CookingStyle = "directo" | "dos_zonas" | "lento";
type FuelType = "carbon" | "briquetas" | "lena";
type Equipment = "kettle" | "abierta" | "ahumador";
type Weather = "templado" | "viento" | "frio";

type PlannerConfiguration = {
  guests: string;
  cookingStyle: CookingStyle;
  durationHours: string;
  fuelType: FuelType;
  equipment: Equipment;
  weather: Weather;
  servingTime: string;
  includeVegetables: boolean;
};

type FireRecommendation = {
  fuelKg: number;
  starterLoads: number;
  preheatMinutes: number;
  targetTemperature: string;
  ignitionTime: string;
  refillCadence: string;
  layout: string;
  summary: string;
};

type PlannerPreset = {
  id: string;
  name: string;
  configuration: PlannerConfiguration;
};

type ServerPlannerPreset = {
  id: string;
  name: string;
  configuration: Omit<PlannerConfiguration, "guests" | "durationHours"> & {
    guests: number;
    durationHours: number;
  };
};

const STORAGE_KEY = "lumbre.fire-planner.presets.v1";

const initialConfiguration: PlannerConfiguration = {
  guests: "6",
  cookingStyle: "directo",
  durationHours: "2",
  fuelType: "carbon",
  equipment: "kettle",
  weather: "templado",
  servingTime: "15:00",
  includeVegetables: false,
};

const quickPlans: Array<{ name: string; configuration: PlannerConfiguration }> = [
  {
    name: "Comida directa",
    configuration: initialConfiguration,
  },
  {
    name: "Sobremesa lenta",
    configuration: {
      guests: "8",
      cookingStyle: "lento",
      durationHours: "6",
      fuelType: "briquetas",
      equipment: "ahumador",
      weather: "templado",
      servingTime: "17:00",
      includeVegetables: false,
    },
  },
  {
    name: "Mesa vegetal",
    configuration: {
      guests: "6",
      cookingStyle: "dos_zonas",
      durationHours: "4",
      fuelType: "carbon",
      equipment: "kettle",
      weather: "viento",
      servingTime: "14:30",
      includeVegetables: true,
    },
  },
];

function readLocalPresets(): PlannerPreset[] {
  try {
    const storedPresets = window.localStorage.getItem(STORAGE_KEY);
    if (!storedPresets) return [];
    const parsedPresets = JSON.parse(storedPresets);
    if (!Array.isArray(parsedPresets)) throw new Error("Preset storage is not a collection");
    return parsedPresets as PlannerPreset[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function serverConfiguration(configuration: PlannerConfiguration) {
  return {
    ...configuration,
    guests: Number(configuration.guests),
    durationHours: Number(configuration.durationHours),
  };
}

function clientPreset(preset: ServerPlannerPreset): PlannerPreset {
  return {
    id: preset.id,
    name: preset.name,
    configuration: {
      ...preset.configuration,
      guests: String(preset.configuration.guests),
      durationHours: String(preset.configuration.durationHours),
    },
  };
}

function formatClock(time: string, minutesToSubtract: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = (hours * 60 + minutes - minutesToSubtract + 1440) % 1440;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

function createRecommendation(configuration: PlannerConfiguration): FireRecommendation {
  const guestCount = Number(configuration.guests);
  const hours = Number(configuration.durationHours);
  const rateByStyle: Record<CookingStyle, number> = {
    directo: 0.5,
    dos_zonas: 0.65,
    lento: 0.8,
  };
  const weatherMultiplier: Record<Weather, number> = {
    templado: 1,
    viento: 1.15,
    frio: 1.2,
  };
  const equipmentMultiplier: Record<Equipment, number> = {
    kettle: 1,
    abierta: 1.1,
    ahumador: 0.95,
  };
  const fuelMultiplier: Record<FuelType, number> = {
    carbon: 1,
    briquetas: 0.9,
    lena: 1.2,
  };
  const vegetableReserve = configuration.includeVegetables ? 0.5 : 0;
  const fuelKg = Math.max(
    2,
    Math.ceil(
      (guestCount * rateByStyle[configuration.cookingStyle] * (hours / 2) + vegetableReserve) *
        weatherMultiplier[configuration.weather] *
        equipmentMultiplier[configuration.equipment] *
        fuelMultiplier[configuration.fuelType],
    ),
  );
  const preheatMinutes = configuration.cookingStyle === "directo" ? 30 : configuration.cookingStyle === "dos_zonas" ? 40 : 50;
  const styleLabels: Record<CookingStyle, string> = {
    directo: "fuego directo",
    dos_zonas: "cocción a dos zonas",
    lento: "lento y ahumado",
  };
  const targetTemperatures: Record<CookingStyle, string> = {
    directo: "230–290 °C",
    dos_zonas: "180–230 °C",
    lento: "110–135 °C",
  };
  const layouts: Record<CookingStyle, string> = {
    directo: "Cama uniforme de brasas",
    dos_zonas: "Brasa intensa + zona de seguridad",
    lento: "Serpiente o canasta lateral",
  };

  return {
    fuelKg,
    starterLoads: Math.max(1, Math.ceil(fuelKg / 1.8)),
    preheatMinutes,
    targetTemperature: targetTemperatures[configuration.cookingStyle],
    ignitionTime: formatClock(configuration.servingTime, preheatMinutes + 25),
    refillCadence: configuration.cookingStyle === "lento" ? "Revisar cada 75–90 min" : "Reserva lista a los 60 min",
    layout: layouts[configuration.cookingStyle],
    summary: `${styleLabels[configuration.cookingStyle]} para ${guestCount} personas durante ${hours} horas`,
  };
}

export default function FirePlanner({ authenticated }: { authenticated: boolean }) {
  const outputRef = useRef<HTMLElement>(null);
  const [configuration, setConfiguration] = useState(initialConfiguration);
  const [recommendation, setRecommendation] = useState<FireRecommendation | null>(null);
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState<PlannerPreset[]>([]);
  const [presetMessage, setPresetMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const localPresets = readLocalPresets();
    if (!authenticated) {
      const timer = window.setTimeout(() => {
        setPresets(localPresets);
        setPresetMessage("");
      }, 0);
      return () => {
        controller.abort();
        window.clearTimeout(timer);
      };
    }

    async function synchronizeAccountPresets() {
      const response = await fetch("/api/fire-presets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presets: localPresets.map((preset) => ({
            name: preset.name,
            configuration: serverConfiguration(preset.configuration),
          })),
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        setPresetMessage("No pudimos sincronizar tus presets. Intenta de nuevo.");
        return;
      }
      const result = (await response.json()) as {
        data: ServerPlannerPreset[];
        imported: number;
      };
      setPresets(result.data.map(clientPreset));
      setPresetMessage(
        result.imported
          ? `${result.imported} ${result.imported === 1 ? "preset importado" : "presets importados"} a tu cuenta.`
          : "Presets de tu cuenta sincronizados.",
      );
    }

    void synchronizeAccountPresets().catch((error: unknown) => {
      if (!controller.signal.aborted) {
        console.error("Fire presets could not be synchronized", error);
        setPresetMessage("No pudimos sincronizar tus presets. Intenta de nuevo.");
      }
    });
    return () => controller.abort();
  }, [authenticated]);

  function updateConfiguration<Key extends keyof PlannerConfiguration>(
    key: Key,
    value: PlannerConfiguration[Key],
  ) {
    setConfiguration((current) => ({ ...current, [key]: value }));
    setRecommendation(null);
    setPresetMessage("");
  }

  function calculateFuel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecommendation(createRecommendation(configuration));
  }

  function applyPlan(nextConfiguration: PlannerConfiguration, message: string) {
    setConfiguration(nextConfiguration);
    setRecommendation(createRecommendation(nextConfiguration));
    setPresetMessage(message);
    window.requestAnimationFrame(() => {
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function persistLocalPresets(nextPresets: PlannerPreset[]) {
    setPresets(nextPresets);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPresets));
  }

  async function savePreset() {
    const name = presetName.trim();
    if (!name) return;

    if (authenticated) {
      try {
        const response = await fetch("/api/fire-presets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, configuration: serverConfiguration(configuration) }),
        });
        if (!response.ok) {
          setPresetMessage(
            response.status === 409
              ? "Tu cuenta alcanzó el límite de 20 presets."
              : "No pudimos guardar el preset en tu cuenta.",
          );
          return;
        }
        const result = (await response.json()) as { data: ServerPlannerPreset };
        const saved = clientPreset(result.data);
        setPresets((current) => {
          const exists = current.some((preset) => preset.id === saved.id);
          return exists
            ? current.map((preset) => preset.id === saved.id ? saved : preset)
            : [...current, saved];
        });
        setPresetName("");
        setPresetMessage(`Preset ${saved.name} sincronizado con tu cuenta.`);
      } catch (error) {
        console.error("Fire preset could not be saved", error);
        setPresetMessage("No pudimos guardar el preset en tu cuenta.");
      }
      return;
    }

    const existing = presets.find((preset) => preset.name.toLocaleLowerCase("es") === name.toLocaleLowerCase("es"));
    const preset: PlannerPreset = {
      id: existing?.id ?? `${Date.now()}-${name.toLocaleLowerCase("es").replaceAll(" ", "-")}`,
      name,
      configuration,
    };
    const nextPresets = existing
      ? presets.map((item) => (item.id === existing.id ? preset : item))
      : [...presets, preset];
    persistLocalPresets(nextPresets);
    setPresetName("");
    setPresetMessage(`Preset ${name} guardado en este navegador.`);
  }

  async function deletePreset(preset: PlannerPreset) {
    if (authenticated) {
      try {
        const response = await fetch(`/api/fire-presets/${preset.id}`, { method: "DELETE" });
        if (!response.ok) {
          setPresetMessage("No pudimos eliminar el preset de tu cuenta.");
          return;
        }
        setPresets((current) => current.filter((item) => item.id !== preset.id));
        setPresetMessage(`Preset ${preset.name} eliminado de tu cuenta.`);
      } catch (error) {
        console.error("Fire preset could not be deleted", error);
        setPresetMessage("No pudimos eliminar el preset de tu cuenta.");
      }
      return;
    }
    persistLocalPresets(presets.filter((item) => item.id !== preset.id));
    setPresetMessage(`Preset ${preset.name} eliminado.`);
  }

  const fuelLabels: Record<FuelType, string> = {
    carbon: "carbón",
    briquetas: "briquetas",
    lena: "leña seca",
  };

  return (
    <section className="fire-planner-section" id="planificador" aria-labelledby="fire-planner-title" data-testid="fire-planner">
      <div className="planner-heading">
        <div>
          <p className="section-index">02 — PLANIFICADOR DE BRASAS</p>
          <h2 id="fire-planner-title">Diseña el fuego<br />antes de encender.</h2>
        </div>
        <p>Dimensiona combustible, anticipa el encendido y define la geometría de la brasa. Guarda las configuraciones que quieras repetir.</p>
      </div>

      <div className="quick-plans" aria-label="Planes rápidos">
        <span>PUNTO DE PARTIDA</span>
        {quickPlans.map((plan) => (
          <button key={plan.name} type="button" onClick={() => applyPlan(plan.configuration, `${plan.name} cargado.`)}>
            {plan.name}<small>↗</small>
          </button>
        ))}
      </div>

      <div className="planner-workspace">
        <form className="planner-controls" onSubmit={calculateFuel}>
          <div className="planner-panel-heading"><span>01</span><div><strong>CONDICIONES</strong><small>Los datos que cambian el consumo.</small></div></div>
          <div className="planner-form-grid">
            <label>Personas<input name="guests" type="number" min="2" max="30" value={configuration.guests} onChange={(event) => updateConfiguration("guests", event.target.value)} required /></label>
            <label>Hora de servicio<input name="servingTime" type="time" value={configuration.servingTime} onChange={(event) => updateConfiguration("servingTime", event.target.value)} required /></label>
            <label>Tipo de cocción<select name="cookingStyle" value={configuration.cookingStyle} onChange={(event) => updateConfiguration("cookingStyle", event.target.value as CookingStyle)}><option value="directo">Fuego directo</option><option value="dos_zonas">Dos zonas</option><option value="lento">Lento y ahumado</option></select></label>
            <label>Duración estimada<select name="durationHours" value={configuration.durationHours} onChange={(event) => updateConfiguration("durationHours", event.target.value)}><option value="2">2 horas</option><option value="4">4 horas</option><option value="6">6 horas</option><option value="8">8 horas</option><option value="12">12 horas</option></select></label>
            <label>Combustible<select name="fuelType" value={configuration.fuelType} onChange={(event) => updateConfiguration("fuelType", event.target.value as FuelType)}><option value="carbon">Carbón vegetal</option><option value="briquetas">Briquetas</option><option value="lena">Leña seca</option></select></label>
            <label>Equipo<select name="equipment" value={configuration.equipment} onChange={(event) => updateConfiguration("equipment", event.target.value as Equipment)}><option value="kettle">Parrilla con tapa</option><option value="abierta">Parrilla abierta</option><option value="ahumador">Ahumador</option></select></label>
            <label>Condición exterior<select name="weather" value={configuration.weather} onChange={(event) => updateConfiguration("weather", event.target.value as Weather)}><option value="templado">Templado y estable</option><option value="viento">Con viento</option><option value="frio">Frío</option></select></label>
            <label className="planner-checkbox"><input name="includeVegetables" type="checkbox" checked={configuration.includeVegetables} onChange={(event) => updateConfiguration("includeVegetables", event.target.checked)} /><span>Incluir una reserva para vegetales<small>Agrega combustible para una segunda tanda.</small></span></label>
          </div>
          <button className="button button-primary planner-calculate" type="submit">Construir plan de fuego</button>
        </form>

        <section className="planner-output" aria-label="Plan de fuego" ref={outputRef}>
          <div className="planner-panel-heading"><span>02</span><div><strong>PLAN DE CAMPO</strong><small>Una guía para observar, no un piloto automático.</small></div></div>
          {recommendation ? (
            <div className="planner-result" role="status" aria-label="Recomendación de combustible">
              <div className="planner-fuel"><span>{fuelLabels[configuration.fuelType].toUpperCase()} RECOMENDADO</span><strong>{recommendation.fuelKg} kg</strong><p>Necesitarás aproximadamente {recommendation.fuelKg} kg de {fuelLabels[configuration.fuelType]}.</p><small>{recommendation.summary}.</small></div>
              <div className="planner-metrics">
                <article><span>ENCENDER</span><strong>{recommendation.ignitionTime}</strong><small>{recommendation.preheatMinutes} min de precalentamiento</small></article>
                <article><span>TEMPERATURA</span><strong>{recommendation.targetTemperature}</strong><small>Rango de trabajo</small></article>
                <article><span>CARGAS</span><strong>{recommendation.starterLoads}</strong><small>Chimeneas aproximadas</small></article>
                <article><span>GEOMETRÍA</span><strong>{recommendation.layout}</strong><small>{recommendation.refillCadence}</small></article>
              </div>
              <ol className="planner-timeline" aria-label="Secuencia recomendada">
                <li><span>01</span><p><strong>Enciende y estabiliza.</strong> Busca brasas cubiertas por una ceniza fina antes de distribuir.</p></li>
                <li><span>02</span><p><strong>Construye la geometría.</strong> Conserva una zona sin combustible para corregir temperatura.</p></li>
                <li><span>03</span><p><strong>Registra señales.</strong> Anota apertura de ventilas, temperatura y momento de cada recarga.</p></li>
              </ol>
            </div>
          ) : (
            <div className="planner-empty"><span aria-hidden="true">↗</span><h3>Tu plan aparecerá aquí.</h3><p>Ajusta las condiciones y construye una línea de trabajo antes de prender el primer carbón.</p></div>
          )}
        </section>
      </div>

      <section className="preset-library" aria-labelledby="preset-title">
        <div className="preset-copy"><p className="section-index" data-testid="preset-storage-scope">{authenticated ? "MEMORIA DE CUENTA" : "MEMORIA LOCAL"}</p><h3 id="preset-title">Tus fuegos repetibles.</h3><p>{authenticated ? "Tus presets se sincronizan con tu cuenta y estarán disponibles en tus otros dispositivos." : "Guarda una configuración con nombre. Los presets permanecen únicamente en este navegador."}</p></div>
        <div className="preset-create"><label>Nombre del preset<input value={presetName} onChange={(event) => setPresetName(event.target.value)} placeholder="Ej. Domingo con viento" /></label><button type="button" onClick={() => void savePreset()} disabled={!presetName.trim()}>Guardar preset</button></div>
        {presetMessage && <p className="preset-message" role="status">{presetMessage}</p>}
        <div className="preset-list" data-testid="fire-presets">
          {presets.length ? presets.map((preset) => (
            <article key={preset.id}>
              <span>{preset.configuration.guests} PERSONAS · {preset.configuration.durationHours} H</span>
              <h4>{preset.name}</h4>
              <p>{preset.configuration.cookingStyle.replaceAll("_", " ")} · {fuelLabels[preset.configuration.fuelType]}</p>
              <div><button type="button" onClick={() => applyPlan(preset.configuration, `Preset ${preset.name} cargado y calculado.`)} aria-label={`Cargar preset ${preset.name}`}>Cargar</button><button type="button" onClick={() => void deletePreset(preset)} aria-label={`Eliminar preset ${preset.name}`}>Eliminar</button></div>
            </article>
          )) : <p className="preset-empty">Aún no hay presets guardados. Tu primera configuración puede convertirse en el inicio de un protocolo.</p>}
        </div>
      </section>
    </section>
  );
}
