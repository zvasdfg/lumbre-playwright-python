import type { ExperimentObjective } from "./hypothesis-store";

export type RecommendedFormula = {
  id: string;
  name: string;
  objective: ExperimentObjective;
  ingredientIds: string[];
  hypothesis: string;
  rationale: string;
  adaptation: string;
  proportions: Array<{ ingredientId: string; parts: number }>;
  sources: Array<{ title: string; url: string }>;
};

const WEBER_STEAK_RUB = {
  title: "Weber Grill Master Steak Rub",
  url: "https://www.weber.com/CA/en/blog/grilling-inspiration/grilling-inspiration-ultimate-backyard-grilled-nachos-1-2-3/weber-2009382.html",
};

const WEBER_CHIMICHURRI = {
  title: "Weber Griddled Ribeyes with Chimichurri",
  url: "https://www.weber.com/US/en/recipes/griddled-ribeyes/weber-2447452.html",
};

const MCCORMICK_SPG = {
  title: "McCormick Cracked Pepper, Garlic & Sea Salt",
  url: "https://www.mccormick.com/products/mccormick-grill-mates-cracked-pepper-garlic-sea-salt-seasoning-6-03-oz",
};

const WEBER_CLASSIC_RIBS = {
  title: "Weber Classic Saucy Pork Ribs",
  url: "https://www.weber.com/AU/en/recipes/pork/classic-saucy-pork-ribs/weber-2367499.html",
};

const WEBER_SLOW_RIBS = {
  title: "Weber Slow-Smoked Spareribs",
  url: "https://www.weber.com/ID/en/recipes/pork/slow-smoked-spareribs/weber-2598.html",
};

const WEBER_SWEET_SPICY_RIBS = {
  title: "Weber Sweet and Spicy BBQ Pork Ribs",
  url: "https://www.weber.com/AU/en/recipes/pork/sweet-and-spicy-bbq-pork-ribs/weber-190519.html",
};

const LAWRYS_LEMON_PEPPER = {
  title: "Lawry's Lemon Pepper Poultry Seasoning",
  url: "https://www.mccormick.com/products/lawrys-r-lemon-pepper-poultry-seasoning-blend-0-5-oz",
};

const LAWRYS_HERB_LEMON = {
  title: "Lawry's Herb & Garlic with Lemon Marinade",
  url: "https://www.mccormick.com/products/lawrys-r-herb-garlic-with-lemon-marinade-12-fl-oz",
};

const MCCORMICK_TOUM = {
  title: "McCormick Roasted Chicken with Toum",
  url: "https://www.mccormick.com/blogs/recipes/roasted-chicken-with-toum",
};

const MCCORMICK_VEGGIE = {
  title: "McCormick Flavor Maker Veggie Topping Seasoning",
  url: "https://www.mccormick.com/products/mccormick-flavor-maker-veggie-topping-seasoning-2-75-oz",
};

const MCCORMICK_UMAMI = {
  title: "Simply Asia Umami Ramen Japanese Style Seasoning",
  url: "https://www.mccormick.com/products/simply-asia-r-umami-ramen-japanese-style-seasoning-2-62-oz",
};

const MCCORMICK_GUNPOWDER = {
  title: "McCormick Gunpowder Seasoning",
  url: "https://www.mccormick.com/blogs/recipes/gunpowder-seasoning",
};

export const recommendedFormulas: RecommendedFormula[] = [
  {
    id: "REC-COSTRA-SPG",
    name: "SPG clásico de tres componentes",
    objective: "Costra para res",
    ingredientIds: ["sal_kosher", "pimienta_negra", "ajo_granulado"],
    hypothesis: "La estructura sal, pimienta negra y ajo ofrece una base corta y conocida: sazón, pungencia y fondo sabroso, sin ocultar el sabor de la res.",
    rationale: "La combinación SPG aparece como mezcla comercial específica para parrilla y funciona como control de referencia para comparar costras más complejas.",
    adaptation: "La fuente confirma los tres componentes, pero no publica porcentajes. La proporción 2:2:1 es un punto de partida de laboratorio, no una reproducción del producto.",
    proportions: [
      { ingredientId: "sal_kosher", parts: 2 },
      { ingredientId: "pimienta_negra", parts: 2 },
      { ingredientId: "ajo_granulado", parts: 1 },
    ],
    sources: [MCCORMICK_SPG],
  },
  {
    id: "REC-COSTRA-WEBER",
    name: "Steak rub de pimienta estratificada",
    objective: "Costra para res",
    ingredientIds: ["pimienta_negra", "sal_kosher", "ajo_granulado", "cebolla_granulada", "paprika_ahumada"],
    hypothesis: "La carga dominante de pimienta negra construirá textura y pungencia; sal y alliums sostendrán el sabor, mientras la paprika aportará color y un matiz ahumado.",
    rationale: "Weber publica una fórmula para steak con tres moliendas de pimienta negra, sal kosher, ajo, cebolla y paprika.",
    adaptation: "Las tres moliendas se consolidan como pimienta negra. Las partes conservan la suma de sus volúmenes publicados y la paprika ahumada sustituye a la paprika no especificada.",
    proportions: [
      { ingredientId: "pimienta_negra", parts: 12 },
      { ingredientId: "sal_kosher", parts: 5.33 },
      { ingredientId: "ajo_granulado", parts: 4 },
      { ingredientId: "cebolla_granulada", parts: 2 },
      { ingredientId: "paprika_ahumada", parts: 2 },
    ],
    sources: [WEBER_STEAK_RUB],
  },
  {
    id: "REC-COSTRA-CHIMICHURRI",
    name: "Costra seca estilo chimichurri",
    objective: "Costra para res",
    ingredientIds: ["sal_kosher", "pimienta_negra", "oregano_mexicano", "chile_arbol", "ajo_granulado"],
    hypothesis: "Sobre una base salina y picante, el orégano dará un frente herbal y el ajo prolongará el carácter sabroso de una costra inspirada en chimichurri.",
    rationale: "Weber sazona ribeye con sal, pimienta, orégano, chile seco y ajo granulado antes de acompañarlo con chimichurri.",
    adaptation: "La fuente respalda la composición, no una proporción de rub aislada. Se propone 2:2:1:0.5:1 para la primera corrida controlada.",
    proportions: [
      { ingredientId: "sal_kosher", parts: 2 },
      { ingredientId: "pimienta_negra", parts: 2 },
      { ingredientId: "oregano_mexicano", parts: 1 },
      { ingredientId: "chile_arbol", parts: 0.5 },
      { ingredientId: "ajo_granulado", parts: 1 },
    ],
    sources: [WEBER_CHIMICHURRI],
  },
  {
    id: "REC-BARK-CLASICO",
    name: "Bark clásico dulce y ahumado",
    objective: "Bark para cocción lenta",
    ingredientIds: ["azucar_morena", "paprika_ahumada", "sal_kosher", "ajo_granulado", "pimienta_negra"],
    hypothesis: "Azúcar morena y paprika ahumada favorecerán color y carácter de cocción lenta; sal, ajo y pimienta evitarán que el perfil quede solamente dulce.",
    rationale: "La receta de costillas clásicas de Weber publica estos cinco componentes como su mezcla seca.",
    adaptation: "Se conservan los componentes y su relación volumétrica publicada; la sal kosher sustituye a la sal marina y se normaliza la fórmula en partes.",
    proportions: [
      { ingredientId: "azucar_morena", parts: 6 },
      { ingredientId: "paprika_ahumada", parts: 5 },
      { ingredientId: "sal_kosher", parts: 4 },
      { ingredientId: "ajo_granulado", parts: 3 },
      { ingredientId: "pimienta_negra", parts: 2 },
    ],
    sources: [WEBER_CLASSIC_RIBS],
  },
  {
    id: "REC-BARK-ANCHO",
    name: "Bark ancho para low and slow",
    objective: "Bark para cocción lenta",
    ingredientIds: ["sal_kosher", "chile_ancho", "azucar_morena", "ajo_granulado", "tomillo", "comino"],
    hypothesis: "El chile ancho y el comino aportarán profundidad terrosa, el tomillo una salida herbal y el azúcar ayudará al color, sobre una base de sal y ajo.",
    rationale: "Weber publica una mezcla para spareribs ahumadas que combina sal, ancho, azúcar morena, ajo, tomillo y comino, entre otros componentes.",
    adaptation: "Se limita la receta a seis componentes para el protocolo Lumbre; paprika, apio y pimienta de la receta original quedan fuera y deben probarse como variante posterior.",
    proportions: [
      { ingredientId: "sal_kosher", parts: 9 },
      { ingredientId: "chile_ancho", parts: 6 },
      { ingredientId: "azucar_morena", parts: 6 },
      { ingredientId: "ajo_granulado", parts: 6 },
      { ingredientId: "tomillo", parts: 4 },
      { ingredientId: "comino", parts: 4 },
    ],
    sources: [WEBER_SLOW_RIBS],
  },
  {
    id: "REC-BARK-DULCE-PICANTE",
    name: "Bark dulce, especiado y picante",
    objective: "Bark para cocción lenta",
    ingredientIds: ["azucar_morena", "paprika_ahumada", "sal_kosher", "ajo_granulado", "comino", "chile_arbol"],
    hypothesis: "La base dulce-ahumada desarrollará color, mientras comino y chile de árbol añadirán un final terroso y picante para cortar el dulzor.",
    rationale: "Weber documenta una mezcla de costillas con azúcar morena, paprika ahumada, sal, ajo, comino, pimienta y cayena.",
    adaptation: "Cebolla y pimienta se omiten por el límite de seis componentes; chile de árbol representa el papel de la cayena. Las partes son un punto de partida proporcional.",
    proportions: [
      { ingredientId: "azucar_morena", parts: 6 },
      { ingredientId: "paprika_ahumada", parts: 3 },
      { ingredientId: "sal_kosher", parts: 1 },
      { ingredientId: "ajo_granulado", parts: 1 },
      { ingredientId: "comino", parts: 1 },
      { ingredientId: "chile_arbol", parts: 0.5 },
    ],
    sources: [WEBER_SWEET_SPICY_RIBS],
  },
  {
    id: "REC-POLLO-LEMON-PEPPER",
    name: "Lemon pepper con alliums",
    objective: "Pollo al fuego directo",
    ingredientIds: ["pimienta_negra", "sal_kosher", "cascara_limon", "azucar_morena", "ajo_granulado", "cebolla_granulada"],
    hypothesis: "El limón elevará el aroma de pimienta; ajo y cebolla darán fondo sabroso y una cantidad contenida de azúcar favorecerá color sin dominar el pollo.",
    rationale: "Lawry's describe su sazonador de aves con pimienta negra, sal, cáscara de limón, azúcar, ajo y cebolla.",
    adaptation: "La fuente publica composición, no porcentajes. La relación propuesta prioriza sal y pimienta, con azúcar contenida para reducir el riesgo de quemado en fuego directo.",
    proportions: [
      { ingredientId: "pimienta_negra", parts: 2 },
      { ingredientId: "sal_kosher", parts: 2 },
      { ingredientId: "cascara_limon", parts: 1 },
      { ingredientId: "azucar_morena", parts: 0.5 },
      { ingredientId: "ajo_granulado", parts: 1 },
      { ingredientId: "cebolla_granulada", parts: 1 },
    ],
    sources: [LAWRYS_LEMON_PEPPER],
  },
  {
    id: "REC-POLLO-HERBAL",
    name: "Ajo, limón y hierbas",
    objective: "Pollo al fuego directo",
    ingredientIds: ["sal_kosher", "ajo_granulado", "cascara_limon", "pimienta_negra", "tomillo", "romero"],
    hypothesis: "Limón y hierbas producirán un perfil aromático alto; ajo, pimienta y sal formarán una base sabrosa adecuada para pollo a fuego directo.",
    rationale: "La marinada Lawry's combina limón, sal, ajo, pimienta, tomillo y extracto de romero, y está indicada para pollo a la parrilla.",
    adaptation: "Se convierte una marinada húmeda en mezcla seca. Las proporciones son una formulación inicial y deben validarse contra una versión hidratada.",
    proportions: [
      { ingredientId: "sal_kosher", parts: 2 },
      { ingredientId: "ajo_granulado", parts: 2 },
      { ingredientId: "cascara_limon", parts: 1 },
      { ingredientId: "pimienta_negra", parts: 1 },
      { ingredientId: "tomillo", parts: 1 },
      { ingredientId: "romero", parts: 0.5 },
    ],
    sources: [LAWRYS_HERB_LEMON],
  },
  {
    id: "REC-POLLO-TOUM",
    name: "Pollo inspirado en toum",
    objective: "Pollo al fuego directo",
    ingredientIds: ["ajo_granulado", "cascara_limon", "sal_kosher", "paprika_ahumada", "comino"],
    hypothesis: "Ajo y limón dominarán el frente aromático; paprika y comino aportarán color y calidez, con sal como soporte del conjunto.",
    rationale: "McCormick acompaña pollo con toum de ajo, limón y sal, y sazona el ave con paprika, comino y sal.",
    adaptation: "Se integran salsa y sazonado en una sola mezcla seca. La paprika ahumada añade humo no especificado en la receta y deberá compararse contra paprika dulce.",
    proportions: [
      { ingredientId: "ajo_granulado", parts: 3 },
      { ingredientId: "cascara_limon", parts: 1 },
      { ingredientId: "sal_kosher", parts: 2 },
      { ingredientId: "paprika_ahumada", parts: 2 },
      { ingredientId: "comino", parts: 1 },
    ],
    sources: [MCCORMICK_TOUM],
  },
  {
    id: "REC-VEGETALES-CITRICO",
    name: "Vegetales cítricos con ajo y hierbas",
    objective: "Vegetales a las brasas",
    ingredientIds: ["sal_kosher", "ajo_granulado", "cascara_limon", "azucar_morena", "tomillo", "pimienta_negra"],
    hypothesis: "El limón y el tomillo mantendrán un perfil fresco sobre las notas tostadas de los vegetales; ajo, sal y pimienta darán estructura y el azúcar apoyará el dorado.",
    rationale: "El sazonador para vegetales de McCormick declara sal marina, hierbas, ajo, azúcar y cáscara de limón para vegetales asados o a la parrilla.",
    adaptation: "Tomillo y pimienta concretan las hierbas y especias no detalladas por la fuente. La proporción propuesta no reproduce un producto comercial.",
    proportions: [
      { ingredientId: "sal_kosher", parts: 2 },
      { ingredientId: "ajo_granulado", parts: 1 },
      { ingredientId: "cascara_limon", parts: 1 },
      { ingredientId: "azucar_morena", parts: 0.5 },
      { ingredientId: "tomillo", parts: 1 },
      { ingredientId: "pimienta_negra", parts: 1 },
    ],
    sources: [MCCORMICK_VEGGIE],
  },
  {
    id: "REC-VEGETALES-UMAMI",
    name: "Umami de sésamo y shiitake",
    objective: "Vegetales a las brasas",
    ingredientIds: ["ajonjoli_blanco", "ajo_granulado", "cebolla_granulada", "shiitake_seco", "sal_kosher"],
    hypothesis: "Sésamo y shiitake aumentarán tostado y umami; ajo y cebolla ampliarán el fondo sabroso de los vegetales sin depender de dulzor.",
    rationale: "Simply Asia describe una mezcla de sésamo, ajo, cebolla, jengibre y shiitake para vegetales rostizados o a la parrilla.",
    adaptation: "Se omite jengibre porque aún no existe en el catálogo y se añade sal para controlar la base salina. Las proporciones son una hipótesis de laboratorio.",
    proportions: [
      { ingredientId: "ajonjoli_blanco", parts: 3 },
      { ingredientId: "ajo_granulado", parts: 1 },
      { ingredientId: "cebolla_granulada", parts: 1 },
      { ingredientId: "shiitake_seco", parts: 2 },
      { ingredientId: "sal_kosher", parts: 1 },
    ],
    sources: [MCCORMICK_UMAMI],
  },
  {
    id: "REC-VEGETALES-GUNPOWDER",
    name: "Gunpowder tostado para vegetales",
    objective: "Vegetales a las brasas",
    ingredientIds: ["ajonjoli_blanco", "chile_arbol", "comino", "semilla_cilantro", "pimienta_negra", "sal_kosher"],
    hypothesis: "Sésamo y especias tostadas construirán profundidad; chile y pimienta darán pungencia, mientras cilantro y comino aportarán un perfil cálido y terroso.",
    rationale: "McCormick publica Milagai Podi para vegetales asados o a la parrilla con sésamo, chile, comino, cilantro, pimienta y sal, además de otros ingredientes.",
    adaptation: "Se excluyen dal, mostaza, canela, cardamomo y cúrcuma por el límite del protocolo. Las proporciones conservan las cantidades publicadas de los seis componentes incluidos.",
    proportions: [
      { ingredientId: "ajonjoli_blanco", parts: 6 },
      { ingredientId: "chile_arbol", parts: 3 },
      { ingredientId: "comino", parts: 2 },
      { ingredientId: "semilla_cilantro", parts: 2 },
      { ingredientId: "pimienta_negra", parts: 1 },
      { ingredientId: "sal_kosher", parts: 1 },
    ],
    sources: [MCCORMICK_GUNPOWDER],
  },
  {
    id: "REC-COSTRA-PAPRIKA-DULCE",
    name: "Steak rub Weber con paprika dulce",
    objective: "Costra para res",
    ingredientIds: ["pimienta_negra", "sal_kosher", "ajo_granulado", "cebolla_granulada", "paprika_dulce"],
    hypothesis: "La pimienta dominará textura y pungencia, mientras paprika dulce reforzará color y dulzor vegetal sin introducir humo adicional.",
    rationale: "Weber publica su Grill Master Steak Rub con tres moliendas de pimienta negra, sal kosher, ajo granulado, cebolla y paprika.",
    adaptation: "Se consolidan las tres moliendas como pimienta negra y se interpreta la paprika no especificada como paprika dulce. Las partes conservan los volúmenes publicados.",
    proportions: [
      { ingredientId: "pimienta_negra", parts: 12 },
      { ingredientId: "sal_kosher", parts: 5.33 },
      { ingredientId: "ajo_granulado", parts: 4 },
      { ingredientId: "cebolla_granulada", parts: 2 },
      { ingredientId: "paprika_dulce", parts: 2 },
    ],
    sources: [WEBER_STEAK_RUB],
  },
  {
    id: "REC-COSTRA-CAFE-CHILE",
    name: "Costra de café y chile ancho",
    objective: "Costra para res",
    ingredientIds: ["cafe_molido", "azucar_morena", "chile_ancho", "comino", "sal_kosher", "paprika_ahumada"],
    hypothesis: "Café y ancho construirán una costra oscura y profunda; azúcar apoyará el dorado y comino, sal y paprika completarán el perfil terroso-ahumado.",
    rationale: "Weber publica exactamente estos seis componentes para el rub de un tri-tip asado con café y chile.",
    adaptation: "No se sustituyen componentes. Las partes convierten cucharadas y cucharaditas publicadas a una unidad común de cucharadita.",
    proportions: [
      { ingredientId: "cafe_molido", parts: 3 },
      { ingredientId: "azucar_morena", parts: 3 },
      { ingredientId: "chile_ancho", parts: 3 },
      { ingredientId: "comino", parts: 2 },
      { ingredientId: "sal_kosher", parts: 2 },
      { ingredientId: "paprika_ahumada", parts: 1 },
    ],
    sources: [{ title: "Weber Tri-Tip Roast with Coffee-Chile Rub", url: "https://www.weber.com/US/en/recipes/red-meat/tri-tip-roast/weber-2071757.html" }],
  },
  {
    id: "REC-COSTRA-KOFTA",
    name: "Costra cálida inspirada en kofta",
    objective: "Costra para res",
    ingredientIds: ["semilla_cilantro", "comino", "sal_kosher", "pimienta_negra", "pimienta_gorda", "curcuma"],
    hypothesis: "Cilantro y comino aportarán el cuerpo terroso; pimienta gorda y cúrcuma añadirán calidez y color sobre una base equilibrada de sal y pimienta.",
    rationale: "La fórmula de kofta de res de Weber combina cilantro, comino, sal, pimienta, pimienta gorda, cardamomo, cúrcuma, ajo y perejil.",
    adaptation: "Se conservan seis especias con sus cantidades publicadas; ajo, cardamomo y perejil se reservan para una variante por el límite del protocolo.",
    proportions: [
      { ingredientId: "semilla_cilantro", parts: 2 },
      { ingredientId: "comino", parts: 1.5 },
      { ingredientId: "sal_kosher", parts: 1.5 },
      { ingredientId: "pimienta_negra", parts: 0.5 },
      { ingredientId: "pimienta_gorda", parts: 0.5 },
      { ingredientId: "curcuma", parts: 0.25 },
    ],
    sources: [{ title: "Weber Kofta in Pita Pockets", url: "https://www.weber.com/CA/en/beef-kofta-1/weber-2013375.html" }],
  },
  {
    id: "REC-BARK-CAFE",
    name: "Bark de café para costillas",
    objective: "Bark para cocción lenta",
    ingredientIds: ["cafe_molido", "azucar_morena", "paprika_ahumada", "sal_kosher", "pimienta_negra", "ajo_granulado"],
    hypothesis: "El café profundizará el color y el tostado; azúcar y paprika formarán el eje dulce-ahumado, equilibrado por sal, pimienta y ajo.",
    rationale: "Weber publica estos seis componentes y sus cantidades como rub para baby back ribs cocinadas durante varias horas.",
    adaptation: "No se omiten ni sustituyen componentes. Las partes convierten las cantidades a medias cucharaditas para conservar incluso el ajo de 1/2 cucharadita.",
    proportions: [
      { ingredientId: "cafe_molido", parts: 12 },
      { ingredientId: "azucar_morena", parts: 6 },
      { ingredientId: "paprika_ahumada", parts: 6 },
      { ingredientId: "sal_kosher", parts: 6 },
      { ingredientId: "pimienta_negra", parts: 4 },
      { ingredientId: "ajo_granulado", parts: 1 },
    ],
    sources: [{ title: "Weber Coffee-Rubbed Ribs", url: "https://www.weber.com/US/en/recipes/pork/coffee-rubbed-ribs/weber-12514.html" }],
  },
  {
    id: "REC-BARK-BEST-BLOCK",
    name: "Bark salado de chile, mostaza y tomillo",
    objective: "Bark para cocción lenta",
    ingredientIds: ["sal_kosher", "paprika_ahumada", "ajo_granulado", "chile_ancho", "mostaza_polvo", "tomillo"],
    hypothesis: "Chile, paprika y ajo construirán color y fondo; mostaza y tomillo añadirán pungencia y un contraste herbal en un bark deliberadamente poco dulce.",
    rationale: "Weber documenta esta estructura dentro de su rub Best on the Block para baby back ribs con humo de hickory.",
    adaptation: "El chile ancho representa el chile puro de la fuente. Se omiten comino, semilla de apio y pimienta por el límite de seis componentes; las cantidades incluidas permanecen intactas.",
    proportions: [
      { ingredientId: "sal_kosher", parts: 6 },
      { ingredientId: "paprika_ahumada", parts: 3 },
      { ingredientId: "ajo_granulado", parts: 3 },
      { ingredientId: "chile_ancho", parts: 3 },
      { ingredientId: "mostaza_polvo", parts: 2 },
      { ingredientId: "tomillo", parts: 2 },
    ],
    sources: [{ title: "Weber Best on the Block Baby Back Ribs", url: "https://www.weber.com/US/en/blog/best-on-the-block-baby-back-ribs" }],
  },
  {
    id: "REC-BARK-ACHIOTE-CHIPOTLE",
    name: "Bark de achiote, chipotle y ajo",
    objective: "Bark para cocción lenta",
    ingredientIds: ["sal_kosher", "chipotle_seco", "paprika_dulce", "comino", "ajo_granulado", "achiote"],
    hypothesis: "Achiote y paprika darán color, chipotle añadirá humo y picor, y el eje sal–ajo–comino sostendrá un bark sabroso para cerdo.",
    rationale: "McCormick comercializa para cerdo una mezcla de parrilla con sal, chipotle, paprika, comino, ajo, cebolla, pimienta y achiote.",
    adaptation: "Se omiten cebolla y pimienta para respetar seis componentes. La fuente no publica porcentajes y respalda parrilla, no low-and-slow; la proporción y aplicación como bark son la hipótesis a validar.",
    proportions: [
      { ingredientId: "sal_kosher", parts: 3 },
      { ingredientId: "chipotle_seco", parts: 2 },
      { ingredientId: "paprika_dulce", parts: 2 },
      { ingredientId: "comino", parts: 1 },
      { ingredientId: "ajo_granulado", parts: 2 },
      { ingredientId: "achiote", parts: 1 },
    ],
    sources: [{ title: "McCormick Chipotle & Roasted Garlic Seasoning", url: "https://www.mccormick.com/products/mccormick-grill-mates-chipotle-roasted-garlic-seasoning-2-5-oz" }],
  },
  {
    id: "REC-POLLO-MARROQUI",
    name: "Pollo marroquí de paprika, jengibre y cúrcuma",
    objective: "Pollo al fuego directo",
    ingredientIds: ["canela_cassia", "paprika_dulce", "jengibre_molido", "curcuma", "semilla_cilantro", "sal_kosher"],
    hypothesis: "Paprika y cúrcuma aportarán color; jengibre, canela y cilantro producirán capas cálidas y cítricas sobre la base salina.",
    rationale: "Weber publica estos componentes dentro de la pasta de especias de su pollo marroquí al rostizador.",
    adaptation: "Se conservan las cantidades publicadas de seis componentes; cardamomo y comino quedan como variante por el límite del protocolo. El método directo de Lumbre debe controlar el oscurecimiento.",
    proportions: [
      { ingredientId: "canela_cassia", parts: 1.5 },
      { ingredientId: "paprika_dulce", parts: 1 },
      { ingredientId: "jengibre_molido", parts: 1 },
      { ingredientId: "curcuma", parts: 1 },
      { ingredientId: "semilla_cilantro", parts: 1 },
      { ingredientId: "sal_kosher", parts: 1 },
    ],
    sources: [{ title: "Weber Moroccan Spiced Rotisserie Chicken", url: "https://www.weber.com/GB/en/recipes/poultry/moroccan-spiced-rotisserie-chicken/weber-76484.html" }],
  },
  {
    id: "REC-POLLO-TANDOORI",
    name: "Pollo tandoori de seis especias",
    objective: "Pollo al fuego directo",
    ingredientIds: ["comino", "semilla_cilantro", "paprika_dulce", "sal_kosher", "curcuma", "cardamomo"],
    hypothesis: "Comino y cilantro darán estructura terrosa, paprika y cúrcuma color, y cardamomo una salida aromática alta en una mezcla salina para fuego directo.",
    rationale: "Weber publica estas seis especias, más cayena, para brochetas de pollo tandoori asadas a fuego directo medio.",
    adaptation: "Se omite únicamente la cayena por el límite de seis componentes. Las proporciones conservan exactamente las cantidades publicadas de los ingredientes incluidos.",
    proportions: [
      { ingredientId: "comino", parts: 1 },
      { ingredientId: "semilla_cilantro", parts: 1 },
      { ingredientId: "paprika_dulce", parts: 1 },
      { ingredientId: "sal_kosher", parts: 1 },
      { ingredientId: "curcuma", parts: 0.5 },
      { ingredientId: "cardamomo", parts: 0.5 },
    ],
    sources: [{ title: "Weber Tandoori Chicken Skewers", url: "https://www.weber.com/US/en/recipes/poultry/tandoori-chicken-skewers/weber-2193784.html" }],
  },
  {
    id: "REC-POLLO-SPATCHCOCK",
    name: "Pollo ahumado con sumac y orégano",
    objective: "Pollo al fuego directo",
    ingredientIds: ["sal_kosher", "pimienta_negra", "paprika_ahumada", "sumac", "ajo_granulado", "oregano_mexicano"],
    hypothesis: "Paprika ahumada y ajo construirán color y fondo, mientras sumac y orégano levantarán el perfil con acidez aromática y notas herbales.",
    rationale: "Weber publica estos componentes dentro del rub de su Ultimate Spatchcocked Chicken cocinado a calor directo medio.",
    adaptation: "Orégano mexicano sustituye al griego. Se omiten comino y cayena por el límite de seis componentes; las cantidades restantes conservan la relación publicada.",
    proportions: [
      { ingredientId: "sal_kosher", parts: 12 },
      { ingredientId: "pimienta_negra", parts: 3 },
      { ingredientId: "paprika_ahumada", parts: 3 },
      { ingredientId: "sumac", parts: 3 },
      { ingredientId: "ajo_granulado", parts: 2 },
      { ingredientId: "oregano_mexicano", parts: 2 },
    ],
    sources: [{ title: "Weber Ultimate Spatchcocked Chicken", url: "https://www.weber.com/US/en/recipes/poultry/the-ultimate-spatchcocked-chicken/weber-2445247.html" }],
  },
  {
    id: "REC-VEGETALES-ALBAHACA",
    name: "Vegetales con albahaca, ajo y pimienta",
    objective: "Vegetales a las brasas",
    ingredientIds: ["albahaca_seca", "ajo_granulado", "sal_kosher", "pimienta_negra"],
    hypothesis: "Albahaca y ajo elevarán el aroma de vegetales dorados, mientras sal y pimienta mantendrán una estructura simple que permita leer el efecto de la hierba.",
    rationale: "Weber combina albahaca, ajo, sal y pimienta con berenjena, calabacita y pimientos cocinados a la parrilla.",
    adaptation: "La fuente usa albahaca y ajo frescos; Lumbre emplea sus versiones secas. La proporción propuesta es un punto de partida, no una conversión directa.",
    proportions: [
      { ingredientId: "albahaca_seca", parts: 2 },
      { ingredientId: "ajo_granulado", parts: 1 },
      { ingredientId: "sal_kosher", parts: 2 },
      { ingredientId: "pimienta_negra", parts: 1 },
    ],
    sources: [{ title: "Weber Grilled Vegetable Gratin with Ricotta & Basil", url: "https://www.weber.com/IE/en/recipes/vegetarian/grilled-vegetable-gratin-with-ricotta-basil/weber-189687.html" }],
  },
  {
    id: "REC-VEGETALES-TIKKA",
    name: "Vegetales tikka de jengibre y cúrcuma",
    objective: "Vegetales a las brasas",
    ingredientIds: ["jengibre_molido", "curcuma", "ajo_granulado", "chile_guajillo", "semilla_cilantro", "sal_kosher"],
    hypothesis: "Jengibre, cúrcuma y chile formarán un perfil cálido y colorido; ajo y cilantro aportarán profundidad sobre una base salina.",
    rationale: "Weber usa jengibre, cúrcuma, ajo, chile, cilantro y sal en su marinada de paneer, cebolla y pimientos asados.",
    adaptation: "Jengibre, ajo y cilantro secos sustituyen versiones frescas; guajillo sustituye Kashmiri chile. Las partes son una formulación inicial porque la fuente mezcla unidades y usa garam masala adicional.",
    proportions: [
      { ingredientId: "jengibre_molido", parts: 1 },
      { ingredientId: "curcuma", parts: 1 },
      { ingredientId: "ajo_granulado", parts: 2 },
      { ingredientId: "chile_guajillo", parts: 2 },
      { ingredientId: "semilla_cilantro", parts: 1 },
      { ingredientId: "sal_kosher", parts: 1 },
    ],
    sources: [{ title: "Weber Paneer Tikka", url: "https://www.weber.com/TH/en/recipes/veggies/paneer-tikka/weber-1475289.html" }],
  },
  {
    id: "REC-VEGETALES-MOLE",
    name: "Vegetales con rub corto de mole",
    objective: "Vegetales a las brasas",
    ingredientIds: ["chile_ancho", "cacao_puro", "azucar_morena", "sal_kosher", "pimienta_negra"],
    hypothesis: "Chile y cacao añadirán profundidad de mole, el azúcar apoyará el dorado y sal con pimienta evitarán un resultado plano en tomate y calabacita.",
    rationale: "Weber publica este rub de cinco componentes y señala aplicarlo también sobre tomates y rebanadas de calabacita antes de asarlos.",
    adaptation: "Chile ancho representa el pure chile powder de la fuente. No se omiten los demás componentes y se conservan sus proporciones volumétricas.",
    proportions: [
      { ingredientId: "chile_ancho", parts: 6 },
      { ingredientId: "cacao_puro", parts: 2 },
      { ingredientId: "azucar_morena", parts: 2 },
      { ingredientId: "sal_kosher", parts: 1 },
      { ingredientId: "pimienta_negra", parts: 1 },
    ],
    sources: [{ title: "Weber Chicken Breasts with Mole Rub", url: "https://www.weber.com/US/en/recipes/poultry/chicken-breasts/weber-4906.html" }],
  },
];
