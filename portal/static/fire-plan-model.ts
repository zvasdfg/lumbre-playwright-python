import { z } from "zod";
export const equipmentLabels = { abierta: "Parrilla abierta", kettle: "Parrilla con tapa", kamado: "Kamado", ahumador: "Ahumador vertical", offset: "Ahumador offset", gas: "Parrilla de gas", no_soportado: "Mi equipo no está aquí" } as const;
export const fuelLabels = { carbon: "Carbón vegetal", briquetas: "Briquetas", lena: "Leña seca", gas_lp: "Gas LP", gas_natural: "Gas natural" } as const;
export const methodLabels = { directo: "Directo", indirecto: "Indirecto", dos_zonas: "Combinado · directo e indirecto" } as const;
export type Equipment = keyof typeof equipmentLabels;
export type FuelType = keyof typeof fuelLabels;
export type Method = keyof typeof methodLabels;
export const compatibleFuels: Record<Equipment, FuelType[]> = {
    abierta: ["carbon", "briquetas", "lena"], kettle: ["carbon", "briquetas", "lena"], kamado: ["carbon", "briquetas", "lena"],
    ahumador: ["carbon", "briquetas", "lena"], offset: ["lena", "carbon", "briquetas"], gas: ["gas_lp", "gas_natural"], no_soportado: [],
};
const text = (max: number) => z.string().max(max).default("");
export const surfaceLabels = { rejilla: "Rejilla", plancha: "Plancha", sarten: "Sartén / olla", bandeja: "Bandeja / molde", sin_definir: "Otro / por confirmar" } as const;
export type Surface = keyof typeof surfaceLabels;
const surfaceSchema = z.enum(["rejilla", "plancha", "sarten", "bandeja", "sin_definir"]);
export const stageSchema = z.object({ name: text(80), method: z.enum(["directo", "indirecto"]), temperature: text(40), duration: text(80), notes: text(500), surface: surfaceSchema.optional(), kind: z.enum(["coccion", "pausa"]).optional() }).passthrough();
export type Stage = z.infer<typeof stageSchema>;
export const configurationSchema = z.object({
    equipment: z.enum(["abierta", "kettle", "kamado", "ahumador", "offset", "gas", "no_soportado"]),
    fuelType: z.enum(["carbon", "briquetas", "lena", "gas_lp", "gas_natural"]),
    cookingStyle: z.enum(["directo", "indirecto", "dos_zonas", "lento"]).transform(v => v === "lento" ? "indirecto" as const : v),
    durationHours: text(8), temperature: text(40), unit: z.enum(["C", "F"]).default("C"),
    smoking: z.boolean().default(false), smokeWood: text(120), accessory: text(160), recipeUrl: text(1000), notes: text(3000),
    surface: surfaceSchema.default("rejilla"), stages: z.array(stageSchema).max(12).default([]),
    fuelVerified: z.boolean().default(false), capabilityVerified: z.boolean().default(false), smokeVerified: z.boolean().default(false),
}).passthrough();
export type Configuration = z.infer<typeof configurationSchema>;
export const presetSchema = z.object({ id: z.string().min(1).max(200), name: z.string().trim().min(1).max(80), configuration: configurationSchema }).passthrough();
export type Preset = z.infer<typeof presetSchema>;
export const STORAGE_KEY = "lumbre.fire-planner.presets.v1";
export const initialConfiguration: Configuration = configurationSchema.parse({ equipment: "kettle", fuelType: "carbon", cookingStyle: "directo" });
export function requiresFuelCheck(e: Equipment, f: FuelType) {
    return (f === "lena" && e !== "offset") || (e === "kamado" && f === "briquetas");
}
export function needsCapability(c: Configuration) {
    const methods = [c.cookingStyle, ...c.stages.filter(s => s.kind !== "pausa").map(s => s.method)];
    return ((c.equipment === "offset" || c.equipment === "ahumador") && methods.some(m => m !== "indirecto")) ||
        (c.equipment === "gas" && methods.some(m => m !== "directo")) ||
        (c.equipment === "kamado" && (c.cookingStyle === "dos_zonas" || new Set(methods).size > 1));
}
export function capabilityLabel(c: Configuration) {
    if (c.equipment === "gas")
        return "Mi modelo permite calor indirecto con el alimento sobre una zona sin quemador encendido.";
    if (c.equipment === "kamado")
        return "Mi modelo y sus accesorios permiten las zonas o cambios de montaje de este plan.";
    return "El manual de mi modelo admite cocinar directamente sobre las brasas y explica cómo configurar esa zona.";
}
export function fuelGuidance(e: Equipment) {
    if (e === "no_soportado")
        return "Pellets, equipos eléctricos y tolvas automáticas no están representados. No los sustituyas por otra familia para obtener instrucciones.";
    if (e === "gas")
        return "Usa sólo el gas de la placa del equipo. LP y natural no son intercambiables. No añadas carbón ni leña como combustible principal.";
    if (e === "kamado")
        return "Carbón vegetal como referencia. Briquetas o leña como combustible principal requieren autorización del manual; la madera aromática es un complemento distinto.";
    if (e === "offset")
        return "Carbón, briquetas o leña según el modelo. Para calor indirecto, el fuego va en la caja lateral; no en la cámara de alimentos.";
    if (e === "abierta")
        return "La leña requiere un hogar diseñado para ella. Una zona sin brasas permite retirar el alimento, pero no equivale a un horno con tapa.";
    return "Carbón o briquetas como base. Verifica el manual para leña; los trozos de madera aromática no equivalen a una carga de leños.";
}
export function safeRecipeUrl(value: string) {
    try {
        const u = new URL(value);
        return ["https:", "http:"].includes(u.protocol) && !u.username && !u.password;
    }
    catch {
        return false;
    }
}
function validTemperature(value: string, unit: string) {
    if (!value.trim())
        return true;
    const match = value.trim().match(/^(\d+(?:[.,]\d+)?)(?:\s*[-–]\s*(\d+(?:[.,]\d+)?))?$/);
    if (!match)
        return false;
    const lo = Number(match[1].replace(",", ".")), hi = Number((match[2] || match[1]).replace(",", "."));
    return lo > 0 && hi >= lo && hi <= (unit === "C" ? 600 : 1112);
}
export function issues(c: Configuration): string[] {
    const errors: string[] = [];
    if (c.equipment === "no_soportado")
        return [fuelGuidance(c.equipment)];
    if (!compatibleFuels[c.equipment].includes(c.fuelType))
        errors.push("Selecciona un combustible compatible con el equipo.");
    if (requiresFuelCheck(c.equipment, c.fuelType) && !c.fuelVerified)
        errors.push("Confirma en el manual que admite este combustible principal.");
    if (c.equipment === "abierta" && (c.cookingStyle === "indirecto" || c.stages.some(s => s.kind !== "pausa" && s.method === "indirecto")))
        errors.push("El indirecto de esta guía requiere tapa. En parrilla abierta usa directo o combinado con una zona de retirada, no un horno indirecto.");
    if (needsCapability(c) && !c.capabilityVerified)
        errors.push("Confirma la capacidad del modelo para este método antes de generar instrucciones.");
    if (c.smoking && c.equipment === "abierta")
        errors.push("Esta guía no representa ahumado en parrilla abierta. Desactiva ahumado o utiliza un equipo con tapa adecuado.");
    if (c.smoking && c.equipment === "gas" && !c.smokeVerified)
        errors.push("Confirma que el fabricante permite el accesorio de ahumado para tu parrilla de gas.");
    if (c.durationHours && (!/^\d+(\.\d+)?$/.test(c.durationHours) || Number(c.durationHours) <= 0 || Number(c.durationHours) > 48))
        errors.push("El tiempo de fuego debe estar entre 0 y 48 horas, mayor que cero, o quedar vacío.");
    if (!validTemperature(c.temperature, c.unit) || c.stages.some(s => !validTemperature(s.temperature, c.unit)))
        errors.push(`Revisa la temperatura: usa un valor o rango ascendente, por ejemplo 120–140. Límite de entrada: ${c.unit === "C" ? "600 °C" : "1112 °F"}; no es un límite seguro del equipo.`);
    if (c.recipeUrl && !safeRecipeUrl(c.recipeUrl))
        errors.push("El enlace debe comenzar con https:// o http:// y no contener credenciales.");
    if (c.stages.some(s => !s.name.trim()))
        errors.push("Pon un nombre a cada etapa o elimina la etapa vacía.");
    if (c.stages.some(s => s.kind === "pausa" && s.temperature))
        errors.push("Una pausa fuera del fuego no tiene temperatura de asador. Borra esa temperatura o cambia la etapa a cocción.");
    if (c.cookingStyle !== "dos_zonas" && c.stages.some(s => s.kind !== "pausa" && s.method !== c.cookingStyle))
        errors.push("Tus etapas cambian entre directo e indirecto. Selecciona Combinado para conservar ambos métodos.");
    return errors;
}
export function stageConfiguration(c: Configuration, s: Stage): Configuration {
    return { ...c, cookingStyle: s.method, surface: s.surface || c.surface, temperature: s.temperature, stages: [] };
}
export function surfaceGuidance(surface: Surface) {
    return surface === "sin_definir" ? "El soporte no está representado. Conservamos tus notas de montaje; confírmalo antes de usar el plan. No se deduce un accesorio a partir del texto libre."
        : surface === "plancha" ? "El alimento va sobre la plancha, no sobre la rejilla. La cifra anotada es la del asador; no supone la misma temperatura en la placa."
        : surface === "sarten" ? "El alimento va dentro de la sartén u olla. Usa un recipiente apto para el equipo y conserva la separación del calor indicada por el método."
        : surface === "bandeja" ? "El alimento va en la bandeja o molde sobre su soporte. Un recipiente no sustituye el deflector ni convierte por sí solo el calor en indirecto."
        : "El alimento va sobre la rejilla; su posición respecto al fuego depende del método.";
}
export function guide(c: Configuration, method = c.cookingStyle) {
    const indirect = method === "indirecto", combined = method === "dos_zonas";
    const layout = c.equipment === "gas" ? (indirect ? "Alimento sobre quemadores apagados" : combined ? "Zona encendida + zona apagada" : "Alimento sobre calor directo; zona de retirada")
        : c.equipment === "offset" ? (indirect ? "Caja de fuego lateral → cámara de alimentos" : "Zona directa autorizada por el modelo")
            : c.equipment === "ahumador" ? (indirect ? "Fuego abajo · separador del modelo · alimento arriba" : "Montaje directo autorizado por el modelo")
                : c.equipment === "kamado" ? (indirect ? "Alimento sobre deflector" : combined ? "Zona directa + zona protegida con deflector" : "Rejilla sobre brasas; reserva una zona de retirada")
                    : indirect ? "Brasas a un lado · alimento al otro · tapa cerrada" : combined ? (c.equipment === "abierta" ? "Zona de brasas + zona de retirada, sin efecto horno" : "Zona directa + zona indirecta con tapa") : "Brasas bajo el alimento + zona libre";
    const preparation = c.equipment === "gas" ? "Comprueba gas, suministro y conexiones según el manual. Identifica qué mandos controlan cada zona; no improvises conversiones de gas."
        : c.equipment === "kamado" ? "Distingue la carga de carbón de la parte que enciendes. Una sesión prolongada puede usar carbón sin encender como reserva dentro de la cesta, según el manual; no implica encender toda la carga."
            : c.equipment === "offset" ? "Prepara combustible seco del tamaño admitido. Para indirecto organiza el fuego en la caja lateral y deja libre el paso de aire a la cámara."
                : c.equipment === "ahumador" ? "Monta rejillas y el separador o bandeja previstos por el fabricante. Dimensiona la carga y la parte encendida según su procedimiento; prepara reserva accesible."
                    : "Delimita la zona de brasas y la zona libre antes de encender. Dimensiona la carga con el manual y prepara reserva; no hace falta encender a la vez todo el combustible disponible.";
    const control = c.equipment === "gas" ? "Ajusta los mandos de la zona activa. En indirecto, evita un quemador encendido justo bajo el alimento."
        : c.equipment === "abierta" ? "Observa el dorado y la intensidad de las brasas. Retira el alimento del calor si aparecen llamaradas; ajusta la altura sólo si el equipo lo permite."
            : "Mide el calor cerca del alimento. Ajusta la entrada de aire gradualmente y espera a observar la respuesta antes de volver a cambiarla.";
    return { layout, preparation, control };
}
// Legacy data is decoded in memory. The first write preserves the original bytes.
// Invalid collections are never silently filtered and rewritten.
export function decodePresets(raw: string | null): Preset[] {
    if (!raw)
        return [];
    const items: unknown = JSON.parse(raw);
    if (!Array.isArray(items) || items.length > 50)
        throw new Error("Colección no reconocida");
    const decoded = items.map(item => {
        const legacy = item as {
            configuration?: {
                cookingStyle?: string;
                smoking?: boolean;
                surface?: string;
            };
        };
        const parsed = presetSchema.parse(item);
        if (legacy.configuration?.surface === undefined && parsed.configuration.accessory.trim())
            parsed.configuration.surface = "sin_definir";
        if (legacy.configuration?.cookingStyle === "lento" && legacy.configuration.smoking === undefined)
            parsed.configuration.smoking = true;
        return parsed;
    });
    if (new Set(decoded.map(p => p.id)).size !== decoded.length)
        throw new Error("Identificadores duplicados");
    return decoded;
}
