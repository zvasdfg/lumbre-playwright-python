"use client";

import Image from "./image";
import { createPortal } from "react-dom";
import ProductSheet from "./product-sheet";
import { useEffect, useMemo, useState } from "react";
import { ingredients, ingredientFamilies } from "../data/ingredients";
import { familyLabel, orderIngredientFamilies } from "./ingredient-family-presentation";
import { productionProducts, productionArchiveRecord } from "../data/production-products";
import { buildExpectedProfile, buildFormulaEvidence } from "../data/flavor-formulas";
import type { ExperimentProtocol, Ingredient } from "../data/ingredients";
import { labBases, styles, toggleLabSelection, familyGuidance, validAmounts, formulaSignature, type LabDraft } from "./lab-formula";
import LabRadar from "./lab-radar";
import { referenceFormula } from "./lab-user-references";
import { productionMatches } from "./lab-product-matches";
import "./lab-formula.css";

const families = orderIngredientFamilies(ingredientFamilies);

type SessionBlend = {
  id: string;
  title: string;
  protocol: ExperimentProtocol;
  draft?: LabDraft;
};

const SESSION_BLEND_STORAGE_KEY = "lumbre.ingredient-lab.session-blends.v1";
const SESSION_BLEND_LIMIT = 20;

const objectives = [
  "Costra para res",
  "Bark para cocción lenta",
  "Vegetales a las brasas",
  "Pollo al fuego directo",
  "Fuego directo · Salado simple",
  "Fuego indirecto · Salado simple",
  "Fuego indirecto · BBQ dulce",
  "Fuego indirecto · Bark para res",
  "Fuego directo · Fórmula propia",
  "Fuego indirecto · Fórmula propia",
];

function readSessionBlends(): SessionBlend[] {
  try {
    const stored = window.sessionStorage.getItem(SESSION_BLEND_STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error("Session blend storage is not a collection");
    return parsed.filter(
      (item): item is SessionBlend =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as SessionBlend).id === "string" &&
        typeof (item as SessionBlend).title === "string" &&
        typeof (item as SessionBlend).protocol?.firma === "string",
    ).slice(0, SESSION_BLEND_LIMIT).flatMap(item => {
      const stored = item as SessionBlend;
      if (!/^SES-\d+$/.test(stored.id) || stored.title.length < 3 || stored.title.length > 80 ||
        !objectives.includes(stored.protocol.objetivo) || !Array.isArray(stored.protocol.componentes)) return [];
      const ids = stored.protocol.componentes.map(component => component?.id);
      const components = ingredients.filter(component => ids.includes(component.id));
      if (components.length < 2 || components.length > 12 || components.length !== ids.length) return [];
      const draft = stored.draft;
      if (draft && (!labBases.some(base => base.id === draft.baseId) || !validAmounts(ids, draft.amounts, draft.unit) || (draft.unit !== undefined && draft.unit !== "g") || (draft.unit === "g" && !styles.find(style => style.id === draft.baseId)?.heats.includes(draft.heat ?? "")))) return [];
      const signature = draft ? formulaSignature(stored.protocol.objetivo, draft) : `SESSION:${stored.protocol.objetivo}:${[...ids].sort().join("+")}`;
      const rebuilt = buildSessionProtocol(stored.id, signature, components, stored.protocol.objetivo, draft);
      if (typeof stored.protocol.creado_en !== "string" || !Number.isFinite(Date.parse(stored.protocol.creado_en))) return [];
      return [{ id: stored.id, title: stored.title, draft, protocol: { ...rebuilt, creado_en: stored.protocol.creado_en } }];
    });
  } catch {
    return [];
  }
}

function sessionBlendId(blends: SessionBlend[]) {
  const sequence = blends.reduce((highest, blend) => {
    const match = /^SES-(\d+)$/.exec(blend.id);
    return Math.max(highest, match ? Number(match[1]) : 0);
  }, 0) + 1;
  return `SES-${String(sequence).padStart(3, "0")}`;
}

function buildSessionProtocol(
  id: string,
  signature: string,
  selectedIngredients: Ingredient[],
  objective: string,
  draft?: LabDraft,
): ExperimentProtocol {
  const formula = buildFormulaEvidence(selectedIngredients, objective);
  return {
    schema_version: 5,
    id,
    firma: signature,
    objetivo: objective,
    componentes: selectedIngredients.map(({ id: ingredientId, nombre, familia }) => ({
      id: ingredientId,
      nombre,
      familia,
    })),
    hipotesis: draft ? "Variación de usuario pendiente de probar. Las cantidades registradas no certifican el balance ni la dosis de aplicación." : formula.conclusion,
    formula: draft ? undefined : formula,
    perfil_esperado: draft ? [] : buildExpectedProfile(selectedIngredients),
    metodo: [
      "Preparar una muestra control sin sazonador.",
      draft ? "Preparar una muestra con la mezcla registrada y compararla con el control." : formula.level === "referenced"
        ? `Preparar una segunda muestra con la estructura de referencia ${formula.formula_name}.`
        : "Preparar una segunda muestra con la fórmula de referencia más cercana cuando exista.",
      draft?.unit === "g" ? "Pesar cada ingrediente según los gramos registrados. El lote no es la dosis de aplicación al alimento." : draft ? "Medir las cantidades registradas con cucharaditas rasas de 5 ml." : "Moler y pesar cada componente por separado; registrar la proporción exacta.",
      "Aplicar cada mezcla en muestras equivalentes y registrar temperatura y tiempo.",
      "Comparar aroma, color, costra, balance y los perfiles esperados contra el control y la referencia.",
    ],
    estado: "borrador",
    tipo_registro: "hipotesis_usuario",
    contador_repeticiones: 0,
    creado_en: new Date().toISOString(),
  };
}

function statusLabel(status: string) {
  if (status === "producto_en_produccion") return "Producto en producción";
  if (status === "documentado_sin_validar") return "Documentado · por validar";
  if (status === "recomendado_sin_validar") return "Recomendación investigada · por validar";
  return status.replaceAll("_", " ");
}

function evidenceLabel(level?: "referenced" | "close" | "experimental") {
  if (level === "referenced") return "Fórmula respaldada";
  if (level === "close") return "Variación cercana";
  return "Experimental";
}

function objectiveLabel(objective: string) {
  return objective.replaceAll("Bark", "Corteza");
}

function visibleText(value: string) {
  return value
    .replaceAll("low and slow", "cocción lenta")
    .replaceAll("low-and-slow", "cocción lenta")
    .replaceAll("Lemon pepper", "Limón con pimienta")
    .replaceAll("lemon pepper", "limón con pimienta")
    .replaceAll("Steak rub", "Mezcla seca para carne")
    .replaceAll("steakhouse", "casa de cortes")
    .replaceAll("medley", "mezcla")
    .replaceAll("alliums", "ajo y cebolla")
    .replaceAll("allium", "ajo y cebolla")
    .replaceAll("Allium", "Ajo y cebolla")
    .replaceAll("Bark", "Corteza")
    .replaceAll("bark", "corteza")
    .replaceAll("Rub", "Mezcla seca")
    .replaceAll("rub", "mezcla seca");
}

function formulaNameLabel(name: string) {
  if (name === "SPG clásico") return "Sal, pimienta y ajo (SPG) clásico";
  return visibleText(name);
}

const hypotheses = productionProducts.map(product => productionArchiveRecord({ ...product, active: true, createdAt: "2026-09-30T00:00:00Z" }));

export default function IngredientLab() {
  const loading = false;
  const loadingHypotheses = false;
  const hypothesisError = "";
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState("todas");
  const [openFamilies, setOpenFamilies] = useState<string[]>([]);
  const [selection, setSelection] = useState<{ ids: string[]; amounts: Record<string, number> }>({ ids: [], amounts: {} });
  const { ids: selectedIds, amounts } = selection;
  function setAmounts(value: Record<string, number> | ((current: Record<string, number>) => Record<string, number>)) {
    setSelection(current => ({ ...current, amounts: typeof value === "function" ? value(current.amounts) : value }));
  }
  const [heat, setHeat] = useState<"directo" | "indirecto">("directo");
  const [baseId, setBaseId] = useState("manual");
  const objective = `Fuego ${heat} · ${styles.find(style => style.id === baseId)!.name}`;
  const [blendTitle, setBlendTitle] = useState("Mi primera mezcla");
  const [sessionBlends, setSessionBlends] = useState<SessionBlend[]>([]);
  const [inspectedIngredient, setInspectedIngredient] = useState<Ingredient | null>(null);
  const [inspectedHypothesis, setInspectedHypothesis] = useState<ExperimentProtocol | null>(null);
  const sheetBlend = sessionBlends.find(blend => blend.id === inspectedHypothesis?.id);
  const sheetDraft = sheetBlend?.draft;
  const sheetTotal = sheetDraft ? Object.values(sheetDraft.amounts).reduce((sum, amount) => sum + amount, 0) : 0;
  const [recommendedProduct, setRecommendedProduct] = useState<typeof productionProducts[number] | null>(null);
  const matchingProducts = inspectedHypothesis?.tipo_registro === "hipotesis_usuario"
    ? productionMatches(inspectedHypothesis.componentes.map(item => item.id)) : [];
  const [protocol, setProtocol] = useState<ExperimentProtocol | null>(null);
  const [protocolCreated, setProtocolCreated] = useState<boolean | null>(null);
  const [creating, setCreating] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSessionBlends(readSessionBlends());
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const filteredIngredients = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("es");
    return ingredients.filter((ingredient) => {
      const matchesFamily = family === "todas" || ingredient.familia === family;
      const matchesSearch =
        !normalizedSearch ||
        `${ingredient.nombre} ${ingredient.familia}`
          .toLocaleLowerCase("es")
          .includes(normalizedSearch);
      return matchesFamily && matchesSearch;
    });
  }, [family, search]);

  const groupedIngredients = useMemo(
    () =>
      families
        .map((familyName) => ({
          family: familyName,
          ingredients: filteredIngredients.filter(
            (ingredient) => ingredient.familia === familyName,
          ),
        }))
        .filter((group) => group.ingredients.length > 0),
    [filteredIngredients],
  );

  const visibleOpenFamilies = openFamilies.filter((familyName) =>
    groupedIngredients.some((group) => group.family === familyName),
  );
  const expandedFamilies = visibleOpenFamilies.length
    ? visibleOpenFamilies
    : groupedIngredients.slice(0, 1).map((group) => group.family);

  function setFamilyOpen(familyName: string, open: boolean) {
    setOpenFamilies((current) =>
      open
        ? [...new Set([...current, familyName])]
        : current.filter((candidate) => candidate !== familyName),
    );
  }
  const selectedIngredients = selectedIds
    .map((id) => ingredients.find((ingredient) => ingredient.id === id))
    .filter((ingredient) => ingredient !== undefined);

  const currentAmounts = Object.fromEntries(selectedIds.map(id => [id, amounts[id]]));
  const proposedFormula = referenceFormula(selectedIngredients);
  const quantitiesValid = validAmounts(selectedIds, currentAmounts, "g") && styles.find(style => style.id === baseId)!.heats.includes(heat);

  function toggleIngredient(id: string) {
    setProtocol(null);
    setProtocolCreated(null);
    setSelection(current => {
      const next = toggleLabSelection(current, id, ingredients, "manual");
      if (next === current) return current;
      const proposal = referenceFormula(ingredients.filter(item => next.ids.includes(item.id)));
      return proposal ? {ids: next.ids, amounts: proposal.amounts} : next;
    });
  }

  async function createProtocol() {
    setCreating(true);
    setError("");
    try {
      const title = blendTitle.trim();
      if (title.length < 3 || title.length > 80) {
        throw new Error("Asigna un nombre de entre 3 y 80 caracteres a tu blend.");
      }

      {
        if (!quantitiesValid) throw new Error("Revisa las cantidades: entre 2 y 12 ingredientes, todos mayores que cero y un máximo total de 150 g.");
        const draft: LabDraft = { baseId, amounts: currentAmounts, unit: "g", heat, referencePolicy: "user-v1" };
        const signature = formulaSignature(objective, draft);
        const existing = sessionBlends.find((blend) => blend.protocol.firma === signature);
        if (existing) {
          setProtocol(existing.protocol);
          setProtocolCreated(false);
          setInspectedHypothesis(existing.protocol);
          setBlendTitle(existing.title);
          return;
        }
        if (sessionBlends.length >= SESSION_BLEND_LIMIT) {
          throw new Error("Esta sesión alcanzó el límite de 20 blends.");
        }
        const id = sessionBlendId(sessionBlends);
        const createdProtocol = buildSessionProtocol(
          id,
          signature,
          selectedIngredients,
          objective,
          draft,
        );
        const createdBlend = { id, title, protocol: createdProtocol, draft };
        const nextBlends = [...sessionBlends, createdBlend];
        window.sessionStorage.setItem(SESSION_BLEND_STORAGE_KEY, JSON.stringify(nextBlends));
        setSessionBlends(nextBlends);
        setProtocol(createdProtocol);
        setProtocolCreated(true);
        setInspectedHypothesis(createdProtocol);
        return;
      }

    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setCreating(false);
    }
  }

  function removeSessionBlend(blend: SessionBlend) {
    const nextBlends = sessionBlends.filter((candidate) => candidate.id !== blend.id);
    try {
      window.sessionStorage.setItem(SESSION_BLEND_STORAGE_KEY, JSON.stringify(nextBlends));
    } catch {
      setError("No se pudo eliminar el blend. Revisa los permisos de almacenamiento del navegador.");
      return;
    }
    setSessionBlends(nextBlends);
    if (protocol?.id === blend.protocol.id) {
      setProtocol(null);
      setProtocolCreated(null);
    }
  }

  return (
    <section className="ingredient-lab" id="laboratorio" aria-labelledby="lab-title">
      <div className="lab-intro">
        <div>
          <p className="section-index">04 — LABORATORIO DE SABOR</p>
          <h2 id="lab-title">Experimenta antes<br />de encender.</h2>
        </div>
        <div className="lab-manifesto">
          <p>
            Una base abierta para observar cómo sales, especias, chiles y aromáticos
            responden al calor. Aquí una intuición se convierte en una prueba repetible.
          </p>
          <dl>
            <div><dt>Componentes</dt><dd>{ingredients.length || "—"}</dd></div>
            <div><dt>Familias</dt><dd>{families.length || "—"}</dd></div>
            <div><dt>Estado</dt><dd>Pendiente de prueba</dd></div>
          </dl>
          <a className="registry-jump" href="#hipotesis">
            Ver hipótesis registradas
            <span>{loadingHypotheses ? "—" : hypotheses.length}</span>
          </a>
        </div>
      </div>

      <div className="lab-formula-start">
        <p className="section-index">01 · DEFINE TU COCCIÓN</p>
        <div className="lab-toolbar">
          <label><span id="lab-heat-label">Primero, el fuego</span>
            <select aria-labelledby="lab-heat-label" value={heat} onChange={event => { setHeat(event.target.value as "directo" | "indirecto"); setProtocol(null); setProtocolCreated(null); }}>
              <option value="directo">Fuego directo · cocción corta</option><option value="indirecto">Fuego indirecto · cocción prolongada</option>
            </select>
          </label>
        </div>
        <p>El cálculo usa las fórmulas por peso aportadas por el usuario. Primero busca una coincidencia de ingredientes; para variantes, reserva la sal de la referencia más cercana y adapta sólo el resto. No reduce la sal por el simple hecho de añadir más ingredientes.</p>
      </div>
      <div className="lab-workspace">
        <div className="lab-catalog">
          <p className="section-index">02 · EXPLORA Y VARÍA · NINGUNA FAMILIA ES OBLIGATORIA</p>
          <div className="lab-toolbar">
            <label className="lab-search">
              <span>Buscar componente</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Chile, sal, cítrico..."
              />
            </label>
            <label>
              <span>Familia</span>
              <select value={family} onChange={(event) => setFamily(event.target.value)}>
                <option value="todas">Todas las familias</option>
                {families.map((familyName) => (
                  <option key={familyName} value={familyName}>{familyLabel(familyName)}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="catalog-status" aria-live="polite">
            {loading ? "Consultando la despensa..." : `${filteredIngredients.length} componentes encontrados`}
          </div>
          {error && <p className="lab-error" role="alert">{error}</p>}

          <div className="ingredient-groups" data-testid="ingredient-catalog">
            {groupedIngredients.map((group) => (
              <details
                className="ingredient-family-group"
                key={group.family}
                data-family={group.family}
                open={expandedFamilies.includes(group.family)}
                onToggle={(event) => setFamilyOpen(group.family, event.currentTarget.open)}
              >
                <summary className="family-group-heading">
                  <h3 id={`family-${group.family}`}>{familyLabel(group.family)}</h3>
                  <span>{ingredients.filter(item => item.familia === group.family).length} componentes, {selectedIngredients.filter(item => item.familia === group.family).length} seleccionados</span>
                </summary>
                <p className="lab-family-guidance">{familyGuidance[group.family]} {selectedIngredients.filter(item => item.familia === group.family).map(item => item.nombre).join(" · ")}</p>
                <div className="ingredient-grid">
                  {group.ingredients.map((ingredient, index) => {
                    const isSelected = selectedIds.includes(ingredient.id);
                    return (
                      <article className="ingredient-card" key={ingredient.id} data-testid="ingredient-card">
                        <button
                          className={`ingredient-specimen family-${ingredient.familia.toLowerCase()}`}
                          type="button"
                          onClick={() => setInspectedIngredient(ingredient)}
                          aria-label={`Inspeccionar ${ingredient.nombre}`}
                          data-ingredient-id={ingredient.id}
                        >
                          <Image
                            src={`/editorial/ingredients/${ingredient.id}.jpg`}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1080px) 25vw, 180px"
                          />
                          <span>{String(index + 1).padStart(2, "0")}</span>
                        </button>
                        <div className="ingredient-heading">
                          <span>{familyLabel(ingredient.familia)}</span>
                          <span>{statusLabel(ingredient.estado)}</span>
                        </div>
                        <h3>{ingredient.nombre}</h3>
                        <div className="ingredient-actions">
                          <button type="button" onClick={() => setInspectedIngredient(ingredient)}>Ficha</button>
                          <button
                            type="button"
                            className={isSelected ? "selected" : ""}
                            aria-pressed={isSelected}
                            disabled={!isSelected && selectedIds.length === 12}
                            onClick={() => toggleIngredient(ingredient.id)}
                          >
                            {isSelected ? "Retirar" : "Agregar"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
          {!loading && filteredIngredients.length === 0 && (
            <p className="lab-empty">No hay componentes que coincidan con la búsqueda.</p>
          )}
        </div>

        <aside className="experiment-bench" aria-labelledby="bench-title">
          <p className="section-index">03 · TU MEZCLA · REVISA Y GUARDA</p>
          <h3 id="bench-title">Fórmula experimental</h3>
          <p>
            Agregar o retirar un ingrediente recalcula un lote de 150 g cuando hay una referencia aplicable y reemplaza los ajustes manuales previos. Puedes editar después los gramos; el total no debe superar 150 g.
          </p>
          <p aria-live="polite">Fórmula propia · pendiente de probar · {selectedIds.length} ingredientes</p>
          {proposedFormula ? <div className="lab-model-notes" aria-live="polite">
            <strong>Cantidades iniciales calculadas para 150 g</strong>
            <p>Puedes ajustar los gramos antes de guardar tu mezcla.</p>
          </div> : <p>Sin referencia aplicable: estas fórmulas necesitan sal y pimienta negra. Puedes completar los gramos manualmente; no inventamos un reparto para esta selección.</p>}

          <ol className="selected-ingredients" aria-label="Componentes seleccionados">
            {selectedIngredients.map((ingredient, index) => (
              <li key={ingredient.id}>
                <span>{index + 1}</span>
                <div><strong>{ingredient.nombre}</strong><small>{familyLabel(ingredient.familia)}</small>
                  <label className="lab-quantity"><input type="number" min="0.01" max="150" step="0.01" value={Number.isFinite(amounts[ingredient.id]) ? amounts[ingredient.id] : ""} aria-label={`Gramos de ${ingredient.nombre}`} onChange={event => { setAmounts(current => ({ ...current, [ingredient.id]: event.target.value === "" ? NaN : Number(event.target.value) })); setProtocol(null); setProtocolCreated(null); }} /> g</label>
                </div>
                <button type="button" onClick={() => toggleIngredient(ingredient.id)} aria-label={`Retirar ${ingredient.nombre}`}>×</button>
              </li>
            ))}
            {Array.from({ length: Math.max(0, 2 - selectedIngredients.length) }).map((_, index) => (
              <li className="empty-slot" key={`empty-${index}`}><span>+</span><em>Selecciona un componente</em></li>
            ))}
          </ol>

          <p aria-live="polite">{quantitiesValid ? `Lote: ${Object.values(currentAmounts).reduce((sum, value) => sum + value, 0).toLocaleString("es-MX", { maximumFractionDigits: 2 })} / 150 g. No es la dosis para una porción.` : "Indica una cantidad mayor que cero para cada ingrediente, selecciona al menos dos y no superes 150 g en total."}</p>
          {heat === "directo" && selectedIngredients.some(item => item.familia === "Endulzante") && <p>La mezcla contiene endulzante: vigila el dorado durante la cocción directa.</p>}
          <LabRadar items={selectedIngredients} amounts={quantitiesValid ? currentAmounts : {}} />
          {!selectedIngredients.some(item => item.familia === "Sal") && <p>Mezcla sin sal añadida: registra por separado si salas el alimento.</p>}
          <label className="experiment-objective">
            <span>Nombre de tu blend</span>
            <input
              type="text"
              minLength={3}
              maxLength={80}
              value={blendTitle}
              placeholder="Ej. Corteza dulce de la casa"
              onChange={(event) => setBlendTitle(event.target.value)}
            />
          </label>
          <button
            className="button button-primary create-protocol"
            type="button"
            disabled={!hydrated || !quantitiesValid || creating || blendTitle.trim().length < 3}
            onClick={createProtocol}
          >
            {creating
              ? "Documentando..."
              : "Guardar en esta sesión"}
          </button>
          {(
            <small className="read-only-note">
              Se conserva al recargar esta pestaña y se elimina al cerrar la sesión del navegador.
            </small>
          )}
          {selectedIds.length === 12 && <small className="bench-limit">La mesa admite un máximo de 12 componentes.</small>}

          {protocol && (
            <div className="protocol-result" role="region" aria-live="polite" aria-labelledby="protocol-title">
              <span>{protocol.id} · {statusLabel(protocol.estado)}</span>
              <h4 id="protocol-title">
                {protocolCreated ? "Blend guardado en esta sesión" : "Blend ya guardado en esta sesión"}
              </h4>
              <p>{visibleText(protocol.hipotesis)}</p>
              <ol>{protocol.metodo.map((step) => <li key={step}>{visibleText(step)}</li>)}</ol>
            </div>
          )}
        </aside>
      </div>

      {(
        <section className="session-blend-library" aria-labelledby="session-blends-title">
          <div className="registry-heading">
            <div>
              <p className="section-index">ARCHIVO TEMPORAL DEL NAVEGADOR</p>
              <h3 id="session-blends-title">Blends de esta sesión</h3>
            </div>
            <span aria-live="polite">{sessionBlends.length} / {SESSION_BLEND_LIMIT} blends</span>
          </div>
          {sessionBlends.length === 0 ? (
            <div className="registry-empty">
              <strong>Tu mesa todavía está vacía.</strong>
              <p>Las fórmulas que guardes aquí son privadas de esta sesión y no se publican.</p>
            </div>
          ) : (
            <div className="session-blend-grid" data-testid="session-blends">
              {sessionBlends.map((blend) => (
                <article className="session-blend-card" key={blend.id}>
                  <span>{blend.id} · SESIÓN ACTUAL</span>
                  <h4>{blend.title}</h4>
                  <p>{objectiveLabel(blend.protocol.objetivo)}</p>
                  <ul>
                    {blend.protocol.componentes.map((component) => (
                      <li key={component.id}>{component.nombre}{blend.draft ? ` · ${blend.draft.amounts[component.id]} ${blend.draft.unit ?? "cdta."}` : " · cantidad no registrada"}</li>
                    ))}
                  </ul>
                  <div>
                    {blend.draft?.unit === "g" && <button type="button" onClick={() => { setBaseId("manual"); setHeat(blend.draft!.heat!); setSelection({ ids: Object.keys(blend.draft!.amounts), amounts: { ...blend.draft!.amounts } }); setBlendTitle(`${blend.title.slice(0, 69)} · variante`); setProtocol(null); setProtocolCreated(null); setError(blend.draft!.baseId !== "manual" ? "Importaste cantidades de un preset retirado. Revísalas antes de guardar; no se consideran recomendadas." : ""); document.getElementById("lab-title")?.scrollIntoView({ behavior: "smooth" }); }}>Crear variante</button>}
                    <button type="button" onClick={() => setInspectedHypothesis(blend.protocol)}>
                      Abrir ficha
                    </button>
                    <button type="button" onClick={() => removeSessionBlend(blend)} aria-label={`Eliminar blend ${blend.title}`}>
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <section
        className="hypothesis-registry"
        id="hipotesis"
        aria-labelledby="hypothesis-registry-title"
      >
        <div className="registry-heading">
          <div>
            <p className="section-index">
              {"ARCHIVO PÚBLICO DE EXPERIMENTOS"}
            </p>
            <h3 id="hypothesis-registry-title">Fichas técnicas registradas</h3>
          </div>
          <span aria-live="polite">
            {loadingHypotheses ? "Consultando archivo..." : `${hypotheses.length} fichas`}
          </span>
        </div>

        {hypothesisError && <p className="lab-error" role="alert">{hypothesisError}</p>}
        {!loadingHypotheses && !hypothesisError && hypotheses.length === 0 && (
          <div className="registry-empty">
            <strong>Todavía no hay hipótesis registradas.</strong>
            <p>Modifica la base y guarda tu fórmula para generar una ficha técnica.</p>
          </div>
        )}
        <div className="hypothesis-grid" data-testid="hypothesis-registry">
          {hypotheses.map((hypothesis) => (
            <article className="hypothesis-card" key={hypothesis.id}>
              <div className="hypothesis-card-heading">
                <strong>{hypothesis.id}</strong>
                <span>{statusLabel(hypothesis.estado)}</span>
              </div>
              <p className="hypothesis-objective">{objectiveLabel(hypothesis.objetivo)}</p>
              {hypothesis.producto && (
                <p className="formula-badge formula-production">Archivo de producto · {hypothesis.producto.nombre}</p>
              )}
              {hypothesis.recomendacion && (
                <p className="formula-badge formula-referenced">
                  Recomendada · {visibleText(hypothesis.recomendacion.nombre)}
                </p>
              )}
              {hypothesis.formula && !hypothesis.recomendacion && (
                <p className={`formula-badge formula-${hypothesis.formula.level}`}>
                  {evidenceLabel(hypothesis.formula.level)} · {formulaNameLabel(hypothesis.formula.formula_name)}
                </p>
              )}
              <ul aria-label={`Componentes de ${hypothesis.id}`}>
                {hypothesis.componentes.map((component) => (
                  <li key={component.id}>{component.nombre}</li>
                ))}
              </ul>
              <div className="hypothesis-card-footer">
                <time dateTime={hypothesis.creado_en}>
                  {new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(
                    new Date(hypothesis.creado_en),
                  )}
                </time>
                <button type="button" onClick={() => setInspectedHypothesis(hypothesis)}>
                  Abrir ficha
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {inspectedIngredient && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setInspectedIngredient(null)}>
          <section className="modal ingredient-sheet" role="dialog" aria-modal="true" aria-labelledby="ingredient-title">
            <button className="modal-close" type="button" onClick={() => setInspectedIngredient(null)} aria-label="Cerrar ficha">×</button>
            <p className="section-index">FICHA DE COMPONENTE · {statusLabel(inspectedIngredient.estado)}</p>
            <h2 id="ingredient-title">{inspectedIngredient.nombre}</h2>
            <span className="ingredient-family">{familyLabel(inspectedIngredient.familia)}</span>
            <p>{visibleText(inspectedIngredient.descripcion) || "Este componente todavía no tiene una descripción validada en laboratorio."}</p>
            <dl className="ingredient-data-status">
              <div><dt>Perfil sensorial</dt><dd>{Object.values(inspectedIngredient.perfil_sensorial).filter((value) => value !== null).length} / {Object.keys(inspectedIngredient.perfil_sensorial).length}</dd></div>
              <div><dt>Compatibilidades</dt><dd>{Object.values(inspectedIngredient.compatibilidad).filter((value) => value !== null).length} / {Object.keys(inspectedIngredient.compatibilidad).length}</dd></div>
              <div><dt>Experimentos</dt><dd>{inspectedIngredient.experimentos.length}</dd></div>
            </dl>
            <p className="pending-note">Próximo paso: ejecutar una prueba controlada y documentar dosificación, temperatura, aroma, color y costra.</p>
            <button className="button button-primary" type="button" onClick={() => { toggleIngredient(inspectedIngredient.id); setInspectedIngredient(null); }} disabled={!selectedIds.includes(inspectedIngredient.id) && selectedIds.length === 12}>
              {selectedIds.includes(inspectedIngredient.id) ? "Retirar de la fórmula" : "Agregar a la fórmula"}
            </button>
          </section>
        </div>
      )}

      {inspectedHypothesis && productionProducts.some(product => product.details.productCode === inspectedHypothesis.id) && (
        <ProductSheet product={productionProducts.find(product => product.details.productCode === inspectedHypothesis.id)!} onClose={() => setInspectedHypothesis(null)} />
      )}
      {recommendedProduct && <ProductSheet product={recommendedProduct} onClose={() => setRecommendedProduct(null)} onBack={() => setRecommendedProduct(null)} />}
      {inspectedHypothesis && !recommendedProduct && !productionProducts.some(product => product.details.productCode === inspectedHypothesis.id) && createPortal(
        <div
          className="modal-backdrop hypothesis-print-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setInspectedHypothesis(null)
          }
        >
          <section
            className="modal hypothesis-sheet hypothesis-print-region"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hypothesis-sheet-title"
            data-testid="hypothesis-print-preview"
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setInspectedHypothesis(null)}
              aria-label="Cerrar ficha técnica"
            >
              ×
            </button>
            <div className="hypothesis-sheet-toolbar" aria-label="Acciones de la ficha técnica">
              <span>Vista previa · formato A4</span>
              <button type="button" onClick={() => window.print()}>
                Imprimir ficha
              </button>
            </div>
            <header className="hypothesis-print-header">
              <div>
                <Image
                  src="/brand/lumbre-logo-primary.png"
                  alt="Lumbre"
                  width={70}
                  height={74}
                  unoptimized
                />
                <span>Laboratorio de fuego<br />Ficha técnica de experimentación</span>
              </div>
              <dl>
                <div><dt>Documento</dt><dd>{inspectedHypothesis.id}</dd></div>
                {sheetBlend && <div><dt>Alias</dt><dd>{sheetBlend.title}</dd></div>}
                <div><dt>Estado</dt><dd>{statusLabel(inspectedHypothesis.estado)}</dd></div>
              </dl>
            </header>
            <p className="section-index">FICHA TÉCNICA · {statusLabel(inspectedHypothesis.estado)}</p>
            <h2 id="hypothesis-sheet-title">{sheetBlend?.title ?? inspectedHypothesis.id}</h2>
            <span className="hypothesis-sheet-objective">{objectiveLabel(inspectedHypothesis.objetivo)}</span>
            {sheetDraft?.unit === "g" && <section className="lab-sheet-quantities" aria-labelledby="sheet-quantities-title">
              <h3 id="sheet-quantities-title">Cantidades para preparar tu mezcla</h3>
              <p>Fórmula guardada: reproduce las cantidades registradas, no una recomendación validada.</p>
              <table>
                <thead><tr><th scope="col">Ingrediente</th><th scope="col">Cantidad</th></tr></thead>
                <tbody>{inspectedHypothesis.componentes.map(component => <tr key={component.id}>
                  <th scope="row">{component.nombre}</th>
                  <td>{sheetDraft.amounts[component.id].toLocaleString("es-MX", { maximumFractionDigits: 2 })} g</td>
                </tr>)}</tbody>
                <tfoot><tr><th scope="row">Total del lote</th><td>{sheetTotal.toLocaleString("es-MX", { maximumFractionDigits: 2 })} g</td></tr></tfoot>
              </table>
              <small>Máximo 150 g por lote. Estas cantidades son para preparar el sazonador, no la dosis que debes aplicar a una porción de alimento.</small>
            </section>}
            {matchingProducts.length > 0 && <section className="lab-product-recommendations" aria-labelledby="lab-matches-title">
              <h3 id="lab-matches-title">Tu mezcla se acerca a estos blends Lumbre</h3>
              <p>Te recomendamos conocer estos rubs de producción: comparten al menos el 80% de los ingredientes de la comparación.</p>
              {matchingProducts.map(match => <article key={match.product.id}>
                <h4>{match.product.name}</h4>
                <p><strong>{Math.round(match.score * 100)}% de similitud por ingredientes</strong> · {match.product.details.productCode} · {match.product.details.netContent}</p>
                <p>En común: {match.product.details.components.filter(item => match.shared.includes(item.id)).map(item => item.nombre).join(", ")}.</p>
                {match.missing.length > 0 && <p>El producto también incluye: {match.product.details.components.filter(item => match.missing.includes(item.id)).map(item => item.nombre).join(", ")}.</p>}
                {match.extra.length > 0 && <p>Tu mezcla añade: {inspectedHypothesis.componentes.filter(item => match.extra.includes(item.id)).map(item => item.nombre).join(", ")}.</p>}
                <button className="lab-product-link" type="button" onClick={() => setRecommendedProduct(match.product)}>Ver ficha de {match.product.details.productCode}</button>
              </article>)}
              <small>Comparamos ingredientes idénticos del catálogo: coincidencias divididas entre todos los ingredientes distintos de ambas mezclas. Los ingredientes añadidos y los faltantes reducen la similitud. No conocemos las proporciones de producción: este porcentaje no equivale a sabor, dosificación ni fórmula iguales; distintas sales o chiles no se consideran idénticos.</small>
            </section>}
            {inspectedHypothesis.producto && (
              <section className="production-record">
                <Image
                  src={inspectedHypothesis.producto.imagen}
                  alt={`Fotografía de ${inspectedHypothesis.producto.nombre}`}
                  width={320}
                  height={320}
                  unoptimized
                />
                <div>
                  <span>PRODUCTO EN PRODUCCIÓN</span>
                  <h3>{inspectedHypothesis.producto.nombre}</h3>
                  <p>{inspectedHypothesis.producto.descripcion}</p>
                  <small>Contenido neto: {inspectedHypothesis.producto.contenido_neto}</small>
                </div>
              </section>
            )}
            {sheetDraft && sheetDraft.unit !== "g" && <section className="lab-sheet-quantities">
              <h3>Cantidades guardadas</h3>
              <p>Registro anterior en cucharaditas rasas de 5 ml; no convertido a gramos.</p>
              <ul>{inspectedHypothesis.componentes.map(component => <li key={component.id}>{component.nombre}: {sheetDraft.amounts[component.id]} cdta.</li>)}</ul>
            </section>}
            <p>{visibleText(inspectedHypothesis.hipotesis)}</p>
            {sessionBlends.find(blend => blend.id === inspectedHypothesis.id)?.draft?.unit === "g" && <LabRadar items={ingredients.filter(item => inspectedHypothesis.componentes.some(component => component.id === item.id))} amounts={sessionBlends.find(blend => blend.id === inspectedHypothesis.id)!.draft!.amounts} />}
            {inspectedHypothesis.formula && !inspectedHypothesis.recomendacion && (
              <section className={`formula-evidence formula-${inspectedHypothesis.formula.level}`}>
                <span>{evidenceLabel(inspectedHypothesis.formula.level)}</span>
                <h3>{formulaNameLabel(inspectedHypothesis.formula.formula_name)}</h3>
                <dl>
                  <div>
                    <dt>Roles cubiertos</dt>
                    <dd>{inspectedHypothesis.formula.matched_roles.map(visibleText).join(" · ") || "Ninguno"}</dd>
                  </div>
                  {inspectedHypothesis.formula.missing_roles.length > 0 && (
                    <div>
                      <dt>Roles faltantes</dt>
                      <dd>{inspectedHypothesis.formula.missing_roles.map(visibleText).join(" · ")}</dd>
                    </div>
                  )}
                </dl>
                {inspectedHypothesis.formula.additional_profiles.length > 0 && (
                  <div className="additional-profiles">
                    <h4>Aportes fuera de la fórmula estándar</h4>
                    {inspectedHypothesis.formula.additional_profiles.map((profile) => (
                      <p key={profile.role}>
                        <strong>{visibleText(profile.role)}:</strong> {profile.ingredients.join(", ")} — {visibleText(profile.contribution)}.
                      </p>
                    ))}
                  </div>
                )}
              </section>
            )}
            {inspectedHypothesis.perfil_esperado && inspectedHypothesis.perfil_esperado.length > 0 && (
              <section className="expected-profile">
                <h3>Perfil sensorial esperado</h3>
                <div>
                  {inspectedHypothesis.perfil_esperado.map((profile) => (
                    <article key={profile.attribute}>
                      <span>{visibleText(profile.attribute)}</span>
                      <strong>{profile.intensity} / 5</strong>
                      <small>{profile.ingredients.join(", ") || "Aporte distribuido"}</small>
                    </article>
                  ))}
                </div>
              </section>
            )}
            <h3>{inspectedHypothesis.producto ? "Ingredientes declarados" : "Componentes de la fórmula"}</h3>
            <ol className="hypothesis-components">
              {inspectedHypothesis.componentes.map((component) => (
                <li key={component.id}>
                  <strong>{component.nombre}</strong>
                  <span>{familyLabel(component.familia)} · {component.id}</span>
                </li>
              ))}
            </ol>
            <h3>{inspectedHypothesis.producto ? "Alcance del registro" : "Método propuesto"}</h3>
            <ol className="hypothesis-method">
              {inspectedHypothesis.metodo.map((step) => <li key={step}>{visibleText(step)}</li>)}
            </ol>
            {inspectedHypothesis.formula && !inspectedHypothesis.recomendacion && inspectedHypothesis.formula.sources.length > 0 && (
              <section className="formula-sources">
                <h3>Referencias de la fórmula</h3>
                <ul>
                  {inspectedHypothesis.formula.sources.map((source, index) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noreferrer">Referencia externa {index + 1}</a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <small>
              Registrada el {new Intl.DateTimeFormat("es-MX", {
                dateStyle: "long",
                timeStyle: "short",
              }).format(new Date(inspectedHypothesis.creado_en))}
            </small>
          </section>
        </div>, document.body
      )}
    </section>
  );
}
