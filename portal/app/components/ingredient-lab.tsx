"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { isPublicProductionReadOnly } from "../lib/environment";
import { buildExpectedProfile, buildFormulaEvidence } from "../lib/flavor-formulas";
import type { ExperimentProtocol, Ingredient } from "../lib/ingredients";

type CatalogResponse = {
  data: Ingredient[];
  count: number;
  total: number;
  families: string[];
};

type HypothesisResponse = {
  data: ExperimentProtocol[];
  count: number;
};

type IngredientLabProps = {
  account: { id: string; name: string } | null;
};

type SavedBlend = {
  id: string;
  title: string;
  status: "draft" | "submitted" | "published" | "rejected" | "archived";
  protocol: ExperimentProtocol;
};

type SessionBlend = {
  id: string;
  title: string;
  protocol: ExperimentProtocol;
};

const SESSION_BLEND_STORAGE_KEY = "lumbre.ingredient-lab.session-blends.v1";
const SESSION_BLEND_LIMIT = 20;

const objectives = [
  "Costra para res",
  "Bark para cocción lenta",
  "Vegetales a las brasas",
  "Pollo al fuego directo",
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
    );
  } catch {
    window.sessionStorage.removeItem(SESSION_BLEND_STORAGE_KEY);
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
    hipotesis: formula.conclusion,
    formula,
    perfil_esperado: buildExpectedProfile(selectedIngredients),
    metodo: [
      "Preparar una muestra control sin sazonador.",
      formula.level === "referenced"
        ? `Preparar una segunda muestra con la estructura de referencia ${formula.formula_name}.`
        : "Preparar una segunda muestra con la fórmula de referencia más cercana cuando exista.",
      "Moler y pesar cada componente por separado; registrar la proporción exacta.",
      "Aplicar cada mezcla en muestras equivalentes y registrar temperatura y tiempo.",
      "Comparar aroma, color, costra, balance y los perfiles esperados contra el control y la referencia.",
    ],
    estado: "borrador",
    tipo_registro: "hipotesis_usuario",
    contador_repeticiones: 0,
    creado_en: new Date().toISOString(),
  };
}

function familyLabel(family: string) {
  const labels: Record<string, string> = {
    Allium: "Ajo y cebolla",
    Citrico: "Cítricos",
    Endulzante: "Endulzantes",
    Especia_calida: "Especias cálidas",
    Hierba: "Hierbas",
    Pimienta: "Pimientas",
    Sal: "Sales",
    Semilla_aromatica: "Semillas aromáticas",
    Tostado: "Ingredientes tostados",
  };
  return labels[family] ?? family.replaceAll("_", " ");
}

function statusLabel(status: string) {
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

export default function IngredientLab({ account }: IngredientLabProps) {
  const readOnlyProduction = isPublicProductionReadOnly();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [families, setFamilies] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState("todas");
  const [openFamilies, setOpenFamilies] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [objective, setObjective] = useState(objectives[0]);
  const [blendTitle, setBlendTitle] = useState("");
  const [savedBlend, setSavedBlend] = useState<SavedBlend | null>(null);
  const [sessionBlends, setSessionBlends] = useState<SessionBlend[]>([]);
  const [inspectedIngredient, setInspectedIngredient] = useState<Ingredient | null>(null);
  const [hypotheses, setHypotheses] = useState<ExperimentProtocol[]>([]);
  const [inspectedHypothesis, setInspectedHypothesis] = useState<ExperimentProtocol | null>(null);
  const [protocol, setProtocol] = useState<ExperimentProtocol | null>(null);
  const [protocolCreated, setProtocolCreated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHypotheses, setLoadingHypotheses] = useState(true);
  const [creating, setCreating] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState("");
  const [hypothesisError, setHypothesisError] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSessionBlends(readSessionBlends());
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadCatalog() {
      try {
        const response = await fetch("/api/ingredientes", { signal: controller.signal });
        if (!response.ok) throw new Error("No fue posible consultar el catálogo.");
        const catalog = (await response.json()) as CatalogResponse;
        setIngredients(catalog.data);
        setFamilies(catalog.families);
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") {
          setError((requestError as Error).message);
        }
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/hipotesis", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("No fue posible consultar las fichas registradas.");
        return (await response.json()) as HypothesisResponse;
      })
      .then((registry) => setHypotheses(registry.data))
      .catch((requestError: Error) => {
        if (requestError.name !== "AbortError") setHypothesisError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingHypotheses(false);
      });
    return () => controller.abort();
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
  }, [family, ingredients, search]);

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
    [families, filteredIngredients],
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

  function toggleIngredient(id: string) {
    setProtocol(null);
    setProtocolCreated(null);
    setSavedBlend(null);
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((selectedId) => selectedId !== id);
      if (current.length === 6) return current;
      return [...current, id];
    });
  }

  async function createProtocol() {
    setCreating(true);
    setError("");
    try {
      const accountOwned = Boolean(account);
      const title = blendTitle.trim();
      if (title.length < 3) {
        throw new Error("Asigna un nombre de al menos tres caracteres a tu blend.");
      }

      if (!accountOwned) {
        const signature = `SESSION:${objective}:${[...selectedIds].sort().join("+")}`;
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
        );
        const createdBlend = { id, title, protocol: createdProtocol };
        const nextBlends = [...sessionBlends, createdBlend];
        window.sessionStorage.setItem(SESSION_BLEND_STORAGE_KEY, JSON.stringify(nextBlends));
        setSessionBlends(nextBlends);
        setProtocol(createdProtocol);
        setProtocolCreated(true);
        setInspectedHypothesis(createdProtocol);
        return;
      }

      const response = await fetch("/api/account/blends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          ingredient_ids: selectedIds,
          objective,
        }),
      });
      const result = (await response.json()) as {
        data?: ExperimentProtocol | SavedBlend;
        error?: string;
        created?: boolean;
      };
      if (!response.ok || !result.data) {
        throw new Error("No fue posible crear la ficha técnica. Revisa los componentes seleccionados.");
      }
      const createdProtocol = (result.data as SavedBlend).protocol;
      setProtocol(createdProtocol);
      setProtocolCreated(result.created ?? false);
      setInspectedHypothesis(createdProtocol);
      setSavedBlend(result.data as SavedBlend);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setCreating(false);
    }
  }

  function removeSessionBlend(blend: SessionBlend) {
    const nextBlends = sessionBlends.filter((candidate) => candidate.id !== blend.id);
    window.sessionStorage.setItem(SESSION_BLEND_STORAGE_KEY, JSON.stringify(nextBlends));
    setSessionBlends(nextBlends);
    if (protocol?.id === blend.protocol.id) {
      setProtocol(null);
      setProtocolCreated(null);
    }
  }

  async function submitSavedBlend() {
    if (!savedBlend) return;
    setCreating(true);
    setError("");
    try {
      const response = await fetch(`/api/account/blends/${savedBlend.id}/submit`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("No fue posible enviar el blend a revisión.");
      const result = (await response.json()) as { data: SavedBlend };
      setSavedBlend(result.data);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setCreating(false);
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

      <div className="lab-workspace">
        <div className="lab-catalog">
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
                  <span>{group.ingredients.length} componentes</span>
                </summary>
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
                            disabled={!isSelected && selectedIds.length === 6}
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
          <p className="section-index">MESA DE PRUEBA</p>
          <h3 id="bench-title">Fórmula experimental</h3>
          <p>
            {account
              ? "Selecciona entre 2 y 6 componentes. El blend se guarda primero como borrador privado en tu cuenta."
              : "Selecciona entre 2 y 6 componentes. El blend se guarda sólo durante esta sesión y nunca se publica ni se agrega a una cuenta."}
          </p>

          <ol className="selected-ingredients" aria-label="Componentes seleccionados">
            {selectedIngredients.map((ingredient, index) => (
              <li key={ingredient.id}>
                <span>{index + 1}</span>
                <div><strong>{ingredient.nombre}</strong><small>{familyLabel(ingredient.familia)}</small></div>
                <button type="button" onClick={() => toggleIngredient(ingredient.id)} aria-label={`Retirar ${ingredient.nombre}`}>×</button>
              </li>
            ))}
            {Array.from({ length: Math.max(0, 2 - selectedIngredients.length) }).map((_, index) => (
              <li className="empty-slot" key={`empty-${index}`}><span>+</span><em>Selecciona un componente</em></li>
            ))}
          </ol>

          <label className="experiment-objective">
            <span>Objetivo de la prueba</span>
            <select value={objective} onChange={(event) => { setObjective(event.target.value); setProtocol(null); setProtocolCreated(null); }}>
              {objectives.map((item) => <option key={item} value={item}>{objectiveLabel(item)}</option>)}
            </select>
          </label>
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
            disabled={!hydrated || selectedIds.length < 2 || creating || blendTitle.trim().length < 3}
            onClick={createProtocol}
          >
            {creating
              ? "Documentando..."
              : account
                ? "Guardar en mis blends"
                : "Guardar en esta sesión"}
          </button>
          {!account && (
            <small className="read-only-note">
              Se conserva al recargar esta pestaña y se elimina al cerrar la sesión del navegador.
            </small>
          )}
          {selectedIds.length === 6 && <small className="bench-limit">La mesa admite un máximo de 6 componentes.</small>}

          {protocol && (
            <div className="protocol-result" role="region" aria-live="polite" aria-labelledby="protocol-title">
              <span>{protocol.id} · {statusLabel(protocol.estado)}</span>
              <h4 id="protocol-title">
                {savedBlend
                  ? protocolCreated ? "Blend guardado" : "Blend existente"
                  : protocolCreated ? "Blend guardado en esta sesión" : "Blend ya guardado en esta sesión"}
              </h4>
              <p>{visibleText(protocol.hipotesis)}</p>
              <ol>{protocol.metodo.map((step) => <li key={step}>{visibleText(step)}</li>)}</ol>
              {savedBlend?.status === "draft" || savedBlend?.status === "rejected" ? (
                <button className="button button-quiet" type="button" disabled={creating} onClick={() => void submitSavedBlend()}>
                  Solicitar publicación
                </button>
              ) : null}
              {savedBlend?.status === "submitted" && <strong>En revisión editorial.</strong>}
              {savedBlend?.status === "published" && <strong>Publicado en el laboratorio.</strong>}
            </div>
          )}
        </aside>
      </div>

      {!account && (
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
              <p>Las fórmulas que guardes aquí no se publican y no aparecerán en Mis blends.</p>
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
                      <li key={component.id}>{component.nombre}</li>
                    ))}
                  </ul>
                  <div>
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
              {readOnlyProduction ? "ARCHIVO PÚBLICO DE EXPERIMENTOS" : "ARCHIVO LOCAL DE EXPERIMENTOS"}
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
            <p>Crea una fórmula de 2 a 6 componentes para generar la primera ficha técnica.</p>
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
            <button className="button button-primary" type="button" onClick={() => { toggleIngredient(inspectedIngredient.id); setInspectedIngredient(null); }} disabled={!selectedIds.includes(inspectedIngredient.id) && selectedIds.length === 6}>
              {selectedIds.includes(inspectedIngredient.id) ? "Retirar de la fórmula" : "Agregar a la fórmula"}
            </button>
          </section>
        </div>
      )}

      {inspectedHypothesis && (
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
                <div><dt>Estado</dt><dd>{statusLabel(inspectedHypothesis.estado)}</dd></div>
              </dl>
            </header>
            <p className="section-index">FICHA TÉCNICA · {statusLabel(inspectedHypothesis.estado)}</p>
            <h2 id="hypothesis-sheet-title">{inspectedHypothesis.id}</h2>
            <span className="hypothesis-sheet-objective">{objectiveLabel(inspectedHypothesis.objetivo)}</span>
            {inspectedHypothesis.recomendacion && (
              <section className="formula-evidence formula-referenced">
                <span>RECOMENDACIÓN INVESTIGADA · AÚN NO VALIDADA POR LUMBRE</span>
                <h3>{visibleText(inspectedHypothesis.recomendacion.nombre)}</h3>
                <p>{visibleText(inspectedHypothesis.recomendacion.fundamento)}</p>
                <h4>Proporción inicial</h4>
                <ul>
                  {inspectedHypothesis.recomendacion.proporciones.map((proportion) => {
                    const component = inspectedHypothesis.componentes.find(
                      (item) => item.id === proportion.ingrediente_id,
                    );
                    return (
                      <li key={proportion.ingrediente_id}>
                        {component?.nombre ?? proportion.ingrediente_id}: {proportion.partes} {proportion.partes === 1 ? "parte" : "partes"}
                      </li>
                    );
                  })}
                </ul>
                <h4>Adaptación de Lumbre</h4>
                <p>{visibleText(inspectedHypothesis.recomendacion.adaptacion)}</p>
              </section>
            )}
            <p>{visibleText(inspectedHypothesis.hipotesis)}</p>
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
            <h3>Componentes de la fórmula</h3>
            <ol className="hypothesis-components">
              {inspectedHypothesis.componentes.map((component) => (
                <li key={component.id}>
                  <strong>{component.nombre}</strong>
                  <span>{familyLabel(component.familia)} · {component.id}</span>
                </li>
              ))}
            </ol>
            <h3>Método propuesto</h3>
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
            {inspectedHypothesis.recomendacion && inspectedHypothesis.recomendacion.fuentes.length > 0 && (
              <section className="formula-sources">
                <h3>Fuentes de la recomendación</h3>
                <ul>
                  {inspectedHypothesis.recomendacion.fuentes.map((source, index) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noreferrer">Fuente de investigación {index + 1}</a>
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
        </div>
      )}
    </section>
  );
}
