import ajoGranulado from "../api/ingredientes/ajo_granulado.json";
import ajoNegro from "../api/ingredientes/ajo_negro.json";
import achiote from "../api/ingredientes/achiote.json";
import albahacaSeca from "../api/ingredientes/albahaca_seca.json";
import azucarMorena from "../api/ingredientes/azucar_morena.json";
import ajonjoliBlanco from "../api/ingredientes/ajonjoli_blanco.json";
import ajonjoliNegro from "../api/ingredientes/ajonjoli_negro.json";
import anisEstrella from "../api/ingredientes/anis_estrella.json";
import cacaoPuro from "../api/ingredientes/cacao_puro.json";
import cafeMolido from "../api/ingredientes/cafe_molido.json";
import canelaCassia from "../api/ingredientes/canela_cassia.json";
import cardamomo from "../api/ingredientes/cardamomo.json";
import cascaraLimon from "../api/ingredientes/cascara_limon.json";
import cascaraMandarina from "../api/ingredientes/cascara_mandarina.json";
import cascaraNaranja from "../api/ingredientes/cascara_naranja.json";
import cebollaGranulada from "../api/ingredientes/cebolla_granulada.json";
import cebollaTostada from "../api/ingredientes/cebolla_tostada.json";
import chileAncho from "../api/ingredientes/chile_ancho.json";
import chileArbol from "../api/ingredientes/chile_arbol.json";
import chileGuajillo from "../api/ingredientes/chile_guajillo.json";
import chileMorita from "../api/ingredientes/chile_morita.json";
import chilePasilla from "../api/ingredientes/chile_pasilla.json";
import chipotleSeco from "../api/ingredientes/chipotle_seco.json";
import clavoOlor from "../api/ingredientes/clavo_olor.json";
import comino from "../api/ingredientes/comino.json";
import curcuma from "../api/ingredientes/curcuma.json";
import eneldoSeco from "../api/ingredientes/eneldo_seco.json";
import florSal from "../api/ingredientes/flor_sal.json";
import granosParaiso from "../api/ingredientes/granos_paraiso.json";
import hinojo from "../api/ingredientes/hinojo.json";
import jengibreMolido from "../api/ingredientes/jengibre_molido.json";
import laurel from "../api/ingredientes/laurel.json";
import levaduraNutricional from "../api/ingredientes/levadura_nutricional.json";
import limonNegro from "../api/ingredientes/limon_negro.json";
import macis from "../api/ingredientes/macis.json";
import mejorana from "../api/ingredientes/mejorana.json";
import mostazaPolvo from "../api/ingredientes/mostaza_polvo.json";
import nuezMoscada from "../api/ingredientes/nuez_moscada.json";
import oreganoMexicano from "../api/ingredientes/oregano_mexicano.json";
import paprikaAhumada from "../api/ingredientes/paprika_ahumada.json";
import paprikaDulce from "../api/ingredientes/paprika_dulce.json";
import perejilSeco from "../api/ingredientes/perejil_seco.json";
import pimientaBlanca from "../api/ingredientes/pimienta_blanca.json";
import pimientaGorda from "../api/ingredientes/pimienta_gorda.json";
import pimientaLarga from "../api/ingredientes/pimienta_larga.json";
import pimientaNegra from "../api/ingredientes/pimienta_negra.json";
import pimientaRosa from "../api/ingredientes/pimienta_rosa.json";
import pimientaVerde from "../api/ingredientes/pimienta_verde.json";
import porciniSeco from "../api/ingredientes/porcini_seco.json";
import romero from "../api/ingredientes/romero.json";
import salColima from "../api/ingredientes/sal_colima.json";
import salKosher from "../api/ingredientes/sal_kosher.json";
import salMarGruesa from "../api/ingredientes/sal_mar_gruesa.json";
import salviaSeca from "../api/ingredientes/salvia_seca.json";
import semillaApio from "../api/ingredientes/semilla_apio.json";
import semillaCilantro from "../api/ingredientes/semilla_cilantro.json";
import semillaMostaza from "../api/ingredientes/semilla_mostaza.json";
import shiitakeSeco from "../api/ingredientes/shiitake_seco.json";
import sumac from "../api/ingredientes/sumac.json";
import tomillo from "../api/ingredientes/tomillo.json";
import {
  buildExpectedProfile,
  buildFormulaEvidence,
  type ExpectedProfile,
  type FormulaEvidence,
} from "./flavor-formulas";

export type Ingredient = {
  id: string;
  nombre: string;
  familia: string;
  estado: string;
  descripcion: string;
  origen: string;
  disponibilidad_mexico: string;
  granularidad_recomendada: string;
  granularidades_probadas: string[];
  perfil_sensorial: Record<string, number | null>;
  compuestos_principales: string[];
  comportamiento_termico: {
    liberacion_aromatica: string;
    degradacion: string;
    comentarios: string;
  };
  compatibilidad: Record<string, number | null>;
  aporte: Record<string, number | null>;
  dosificacion: {
    minimo: string;
    recomendado: string;
    maximo: string;
  };
  estabilidad: Record<string, string>;
  proveedores: unknown[];
  bibliografia: unknown[];
  experimentos: unknown[];
  notas_laboratorio: string;
};

export type ExperimentProtocol = {
  schema_version: 5;
  id: string;
  firma: string;
  objetivo: string;
  componentes: Array<{ id: string; nombre: string; familia: string }>;
  hipotesis: string;
  formula: FormulaEvidence;
  perfil_esperado: ExpectedProfile[];
  metodo: string[];
  estado: "borrador" | "recomendado_sin_validar";
  tipo_registro?: "hipotesis_usuario" | "recomendacion_investigada";
  recomendacion?: {
    id: string;
    nombre: string;
    fundamento: string;
    adaptacion: string;
    proporciones: Array<{
      ingrediente_id: string;
      partes: number;
    }>;
    fuentes: Array<{ titulo: string; url: string }>;
  };
  creado_en: string;
};

export type ExperimentProtocolOptions = {
  status?: ExperimentProtocol["estado"];
  registryType?: NonNullable<ExperimentProtocol["tipo_registro"]>;
  hypothesis?: string;
  recommendation?: ExperimentProtocol["recomendacion"];
};

export const ingredients = [
  ajoGranulado,
  ajoNegro,
  achiote,
  albahacaSeca,
  azucarMorena,
  ajonjoliBlanco,
  ajonjoliNegro,
  anisEstrella,
  cacaoPuro,
  cafeMolido,
  canelaCassia,
  cardamomo,
  cascaraLimon,
  cascaraMandarina,
  cascaraNaranja,
  cebollaGranulada,
  cebollaTostada,
  chileAncho,
  chileArbol,
  chileGuajillo,
  chileMorita,
  chilePasilla,
  chipotleSeco,
  clavoOlor,
  comino,
  curcuma,
  eneldoSeco,
  florSal,
  granosParaiso,
  hinojo,
  jengibreMolido,
  laurel,
  levaduraNutricional,
  limonNegro,
  macis,
  mejorana,
  mostazaPolvo,
  nuezMoscada,
  oreganoMexicano,
  paprikaAhumada,
  paprikaDulce,
  perejilSeco,
  pimientaBlanca,
  pimientaGorda,
  pimientaLarga,
  pimientaNegra,
  pimientaRosa,
  pimientaVerde,
  porciniSeco,
  romero,
  salColima,
  salKosher,
  salMarGruesa,
  salviaSeca,
  semillaApio,
  semillaCilantro,
  semillaMostaza,
  shiitakeSeco,
  sumac,
  tomillo,
] as Ingredient[];

export const ingredientFamilies = [...new Set(ingredients.map((ingredient) => ingredient.familia))].sort();

export function createExperimentProtocol(
  id: string,
  signature: string,
  selectedIngredients: Ingredient[],
  objective: string,
  options: ExperimentProtocolOptions = {},
): ExperimentProtocol {
  const formula = buildFormulaEvidence(selectedIngredients, objective);
  const expectedProfile = buildExpectedProfile(selectedIngredients);

  return {
    schema_version: 5,
    id,
    firma: signature,
    objetivo: objective,
    componentes: selectedIngredients.map(({ id, nombre, familia }) => ({ id, nombre, familia })),
    hipotesis: options.hypothesis ?? formula.conclusion,
    formula,
    perfil_esperado: expectedProfile,
    metodo: options.recommendation
      ? [
          "Preparar una muestra control sin sazonador.",
          `Preparar la mezcla recomendada ${options.recommendation.nombre} según sus partes relativas.`,
          "Convertir las partes volumétricas a gramos para el lote real y registrar esa conversión.",
          "Aplicar control y mezcla en muestras equivalentes; registrar dosis, temperatura y tiempo.",
          "Comparar aroma, color, costra o bark, balance y perfiles esperados; documentar cualquier desviación.",
        ]
      : [
          "Preparar una muestra control sin sazonador.",
          formula.level === "referenced"
            ? `Preparar una segunda muestra con la estructura de referencia ${formula.formula_name}.`
            : "Preparar una segunda muestra con la fórmula de referencia más cercana cuando exista.",
          "Moler y pesar cada componente por separado; registrar la proporción exacta.",
          "Aplicar cada mezcla en muestras equivalentes y registrar temperatura y tiempo.",
          "Comparar aroma, color, costra, balance y los perfiles esperados contra el control y la referencia.",
        ],
    estado: options.status ?? "borrador",
    tipo_registro: options.registryType ?? "hipotesis_usuario",
    ...(options.recommendation ? { recomendacion: options.recommendation } : {}),
    creado_en: new Date().toISOString(),
  };
}
