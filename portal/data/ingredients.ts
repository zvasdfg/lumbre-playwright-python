import ajoGranulado from "./ingredientes/ajo_granulado.json";
import ajoNegro from "./ingredientes/ajo_negro.json";
import achiote from "./ingredientes/achiote.json";
import albahacaSeca from "./ingredientes/albahaca_seca.json";
import azucarMorena from "./ingredientes/azucar_morena.json";
import ajonjoliBlanco from "./ingredientes/ajonjoli_blanco.json";
import ajonjoliNegro from "./ingredientes/ajonjoli_negro.json";
import anisEstrella from "./ingredientes/anis_estrella.json";
import cacaoPuro from "./ingredientes/cacao_puro.json";
import cafeMolido from "./ingredientes/cafe_molido.json";
import canelaCassia from "./ingredientes/canela_cassia.json";
import cardamomo from "./ingredientes/cardamomo.json";
import cascaraLimon from "./ingredientes/cascara_limon.json";
import cascaraMandarina from "./ingredientes/cascara_mandarina.json";
import cascaraNaranja from "./ingredientes/cascara_naranja.json";
import cebollaGranulada from "./ingredientes/cebolla_granulada.json";
import cebollaTostada from "./ingredientes/cebolla_tostada.json";
import chileAncho from "./ingredientes/chile_ancho.json";
import chileArbol from "./ingredientes/chile_arbol.json";
import chileGuajillo from "./ingredientes/chile_guajillo.json";
import chileMorita from "./ingredientes/chile_morita.json";
import chilePasilla from "./ingredientes/chile_pasilla.json";
import chipotleSeco from "./ingredientes/chipotle_seco.json";
import clavoOlor from "./ingredientes/clavo_olor.json";
import comino from "./ingredientes/comino.json";
import curcuma from "./ingredientes/curcuma.json";
import eneldoSeco from "./ingredientes/eneldo_seco.json";
import florSal from "./ingredientes/flor_sal.json";
import granosParaiso from "./ingredientes/granos_paraiso.json";
import hinojo from "./ingredientes/hinojo.json";
import jengibreMolido from "./ingredientes/jengibre_molido.json";
import laurel from "./ingredientes/laurel.json";
import levaduraNutricional from "./ingredientes/levadura_nutricional.json";
import limonNegro from "./ingredientes/limon_negro.json";
import macis from "./ingredientes/macis.json";
import mejorana from "./ingredientes/mejorana.json";
import mostazaPolvo from "./ingredientes/mostaza_polvo.json";
import nuezMoscada from "./ingredientes/nuez_moscada.json";
import oreganoMexicano from "./ingredientes/oregano_mexicano.json";
import paprikaAhumada from "./ingredientes/paprika_ahumada.json";
import paprikaDulce from "./ingredientes/paprika_dulce.json";
import perejilSeco from "./ingredientes/perejil_seco.json";
import pimientaBlanca from "./ingredientes/pimienta_blanca.json";
import pimientaGorda from "./ingredientes/pimienta_gorda.json";
import pimientaLarga from "./ingredientes/pimienta_larga.json";
import pimientaNegra from "./ingredientes/pimienta_negra.json";
import pimientaRosa from "./ingredientes/pimienta_rosa.json";
import pimientaVerde from "./ingredientes/pimienta_verde.json";
import porciniSeco from "./ingredientes/porcini_seco.json";
import romero from "./ingredientes/romero.json";
import salColima from "./ingredientes/sal_colima.json";
import salKosher from "./ingredientes/sal_kosher.json";
import salMarGruesa from "./ingredientes/sal_mar_gruesa.json";
import salviaSeca from "./ingredientes/salvia_seca.json";
import semillaApio from "./ingredientes/semilla_apio.json";
import semillaCilantro from "./ingredientes/semilla_cilantro.json";
import semillaMostaza from "./ingredientes/semilla_mostaza.json";
import shiitakeSeco from "./ingredientes/shiitake_seco.json";
import sumac from "./ingredientes/sumac.json";
import tomillo from "./ingredientes/tomillo.json";
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
  formula?: FormulaEvidence;
  perfil_esperado: ExpectedProfile[];
  metodo: string[];
  estado: "borrador" | "recomendado_sin_validar" | "producto_en_produccion";
  tipo_registro?: "hipotesis_usuario" | "recomendacion_investigada" | "producto_produccion";
  producto?: {
    id: string;
    nombre: string;
    descripcion: string;
    imagen: string;
    contenido_neto: string;
    alcance_formula: "declaracion_de_ingredientes";
  };
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
  contador_repeticiones: number;
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
    contador_repeticiones: 0,
    creado_en: new Date().toISOString(),
  };
}
