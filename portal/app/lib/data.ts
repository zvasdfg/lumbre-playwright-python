import { productionProducts } from "./production-products";
import { recipePreparations, type RecipePreparation } from "./recipe-preparations";

export type Recipe = {
  id: number;
  title: string;
  category: "directo" | "lento" | "vegetales";
  categoryLabel: string;
  time: string;
  level: string;
  description: string;
  tone: string;
  image: string;
  preparation: RecipePreparation;
};

export type Product = {
  id: number;
  name: string;
  category: "blends" | "ropa" | "herramientas" | "outdoor";
  price: number;
  stock: number;
  badge?: string;
  productCode?: string;
  description?: string;
  ingredients?: string[];
  image?: string;
  imageAlt?: string;
  netContent?: string;
  purchaseEnabled?: boolean;
  details?: import("./production-products").ProductDetails;
};

export type FireEvent = {
  id: number;
  day: string;
  month: string;
  city: string;
  title: string;
  detail: string;
  spots: number;
};

const recipeSeeds: Omit<Recipe, "categoryLabel" | "tone" | "image" | "preparation" | "time">[] = [
  {
    id: 1,
    title: "Entraña, chimichurri de monte",
    category: "directo",
    level: "Intermedio",
    description: "Costra intensa, centro jugoso y hierbas frescas para cortar la grasa.",
  },
  {
    id: 2,
    title: "Costilla de res, ocho horas",
    category: "lento",
    level: "Avanzado",
    description: "Humo limpio de encino, paciencia y una corteza que cruje al tocarla.",
  },
  {
    id: 3,
    title: "Coliflor al rescoldo",
    category: "vegetales",
    level: "Inicial",
    description: "Mantequilla de chile ancho, limón tatemado y hojas crujientes.",
  },
  {
    id: 4,
    title: "Pollo abierto al ladrillo",
    category: "directo",
    level: "Inicial",
    description: "Piel dorada con un adobo de cítricos y ajo, cocinada bajo peso.",
  },
  {
    id: 5,
    title: "Puerco al humo de manzano",
    category: "lento",
    level: "Intermedio",
    description: "Dulzor sutil, especias tostadas y carne que se separa sin esfuerzo.",
  },
  {
    id: 6,
    title: "Duraznos, miel y romero",
    category: "vegetales",
    level: "Inicial",
    description: "Un postre simple que aprovecha las últimas brasas de la tarde.",
  },
  { id: 7, title: "Ribeye con mantequilla de chile morita", category: "directo", level: "Intermedio", description: "Marmoleo dorado, mantequilla ahumada y un picor profundo de chile morita." },
  { id: 8, title: "Arrachera con cebollas tatemadas", category: "directo", level: "Inicial", description: "Carne jugosa servida con cebollas cambray, limón y sal de Colima." },
  { id: 9, title: "Picaña con costra de café", category: "directo", level: "Avanzado", description: "Grasa crujiente y una costra tostada de café, chile ancho y piloncillo." },
  { id: 10, title: "Aguja norteña con ajo negro", category: "directo", level: "Intermedio", description: "Corte de res a fuego vivo con glaseado salado y dulce de ajo negro." },
  { id: 11, title: "Tuétanos con salsa martajada", category: "directo", level: "Inicial", description: "Huesos abiertos sobre la parrilla, tortillas calientes y salsa roja tatemada." },
  { id: 12, title: "Chuletas de cordero al romero", category: "directo", level: "Intermedio", description: "Cordero a la parrilla con ajo, romero fresco y limón tatemado." },
  { id: 13, title: "Brochetas de res y chile poblano", category: "directo", level: "Inicial", description: "Cubos de res, poblano y cebolla morada marcados sobre carbón intenso." },
  { id: 14, title: "Hamburguesa de res con costra de queso", category: "directo", level: "Inicial", description: "Carne aplastada sobre plancha de hierro, queso dorado y cebolla asada." },
  { id: 15, title: "Chorizo artesanal con nopales", category: "directo", level: "Inicial", description: "Chorizo dorado lentamente con nopales tiernos y cebolla cambray." },
  { id: 16, title: "Pulpo zarandeado", category: "directo", level: "Avanzado", description: "Tentáculos crujientes con adobo de guajillo, cítricos y mantequilla." },
  { id: 17, title: "Camarones con ajo y limón tatemado", category: "directo", level: "Inicial", description: "Camarones enteros a fuego alto con ajo dorado y acidez de limón quemado." },
  { id: 18, title: "Huachinango abierto al carbón", category: "directo", level: "Intermedio", description: "Pescado entero abierto, adobo rojo y piel crujiente frente a la brasa." },
  { id: 19, title: "Trucha con mantequilla de epazote", category: "directo", level: "Intermedio", description: "Trucha entera con hierbas, cítricos y mantequilla avellanada al fuego." },
  { id: 20, title: "Atún sellado con ajonjolí negro", category: "directo", level: "Intermedio", description: "Costra de ajonjolí, cocción completa y vinagreta de chile serrano." },
  { id: 21, title: "Alitas con glaseado de tamarindo", category: "directo", level: "Intermedio", description: "Piel crujiente cubierta con tamarindo, chile de árbol y miel." },
  { id: 22, title: "Muslos de pollo con achiote", category: "directo", level: "Inicial", description: "Pollo jugoso, achiote brillante y cebolla morada chamuscada." },
  { id: 23, title: "Codornices con naranja y pimienta", category: "directo", level: "Avanzado", description: "Aves pequeñas doradas con naranja, pimienta negra y tomillo." },
  { id: 24, title: "Queso panela con costra de chile", category: "directo", level: "Inicial", description: "Queso dorado sin fundirse, chile seco, orégano y aceite de oliva." },
  { id: 25, title: "Provolone con jitomate rostizado", category: "directo", level: "Inicial", description: "Queso burbujeante en hierro con jitomate, ajo y orégano mexicano." },
  { id: 26, title: "Tlayuda de tasajo a la parrilla", category: "directo", level: "Intermedio", description: "Tortilla crujiente, asiento, frijol, tasajo y quesillo fundido." },
  { id: 27, title: "Tacos de picaña y cebolla carbonizada", category: "directo", level: "Intermedio", description: "Picaña rebanada, tortillas de maíz y cebolla llevada al límite del fuego." },
  { id: 28, title: "Mollejas con limón y sal de grano", category: "directo", level: "Avanzado", description: "Exterior muy crujiente, centro cremoso y limón recién exprimido." },
  { id: 29, title: "Bistec de venado con enebro", category: "directo", level: "Avanzado", description: "Venado de criadero a la parrilla con enebro y mantequilla de salvia." },
  { id: 30, title: "Kebabs de cordero y comino", category: "directo", level: "Intermedio", description: "Cordero especiado, cebolla y pimiento cocinados sobre llama viva." },
  { id: 31, title: "Pechuga de pato con ciruelas", category: "directo", level: "Avanzado", description: "Piel rendida y crujiente con ciruelas asadas y pimienta rosa." },
  { id: 32, title: "Lengua dorada con salsa verde", category: "directo", level: "Intermedio", description: "Rebanadas de lengua precocida, costra intensa y salsa verde cruda." },
  { id: 33, title: "Tostadas de marlín ahumado", category: "directo", level: "Inicial", description: "Marlín caliente, tostadas de maíz, aguacate y cebolla encurtida." },
  { id: 34, title: "Calamares con chile y perejil", category: "directo", level: "Intermedio", description: "Calamares apenas marcados con ajo, chile quebrado y perejil fresco." },
  { id: 35, title: "Sardinas con pan al carbón", category: "directo", level: "Inicial", description: "Sardinas enteras, pan tostado, jitomate y aceite de oliva." },
  { id: 36, title: "Conejo con mostaza y tomillo", category: "directo", level: "Avanzado", description: "Piezas de conejo doradas con mostaza, tomillo y vino blanco." },
  { id: 37, title: "Fajitas de portobello y res", category: "directo", level: "Inicial", description: "Tiras de res y portobello con pimientos sobre plancha humeante." },
  { id: 38, title: "Chuletón con sal de romero", category: "directo", level: "Avanzado", description: "Chuletón grueso con cocción inversa, costra oscura y sal herbal." },
  { id: 39, title: "Brisket con pimienta y encino", category: "lento", level: "Avanzado", description: "Pecho de res de corteza negra, humo limpio y rebanadas flexibles." },
  { id: 40, title: "Pulled pork con manzana", category: "lento", level: "Intermedio", description: "Cerdo deshebrado con humo de manzano, vinagre y col crujiente." },
  { id: 41, title: "Chamorro adobado al humo", category: "lento", level: "Intermedio", description: "Chamorro suave con adobo de guajillo y jugos concentrados." },
  { id: 42, title: "Cabrito en caja de brasas", category: "lento", level: "Avanzado", description: "Cabrito dorado lentamente, piel quebradiza y carne jugosa." },
  { id: 43, title: "Barbacoa de borrego en penca", category: "lento", level: "Avanzado", description: "Borrego envuelto en maguey, cocido con vapor y brasas durante la noche." },
  { id: 44, title: "Short rib con chile ancho", category: "lento", level: "Avanzado", description: "Costilla corta con bark de chile ancho y centro untuoso." },
  { id: 45, title: "Panceta lacada con piloncillo", category: "lento", level: "Intermedio", description: "Capas suaves y crujientes con laca de piloncillo, naranja y chile." },
  { id: 46, title: "Pierna de cerdo con achiote", category: "lento", level: "Intermedio", description: "Cerdo cocido lentamente con achiote, naranja agria y hojas de plátano." },
  { id: 47, title: "Costillas de cerdo café y cacao", category: "lento", level: "Avanzado", description: "Corteza oscura de café, cacao y chile sobre costillas tiernas." },
  { id: 48, title: "Pollo entero al humo de mezquite", category: "lento", level: "Intermedio", description: "Pollo de piel cobriza con humo de mezquite y mantequilla especiada." },
  { id: 49, title: "Pavo ahumado con mandarina", category: "lento", level: "Avanzado", description: "Pavo húmedo con piel dorada, mandarina y hierbas de monte." },
  { id: 50, title: "Pato ahumado con mole corto", category: "lento", level: "Avanzado", description: "Pato entero lacado con chile, cacao y especias cálidas." },
  { id: 51, title: "Cordero con costra de hierbas", category: "lento", level: "Intermedio", description: "Pierna de cordero con romero, salvia y ajo, cocinada a calor indirecto." },
  { id: 52, title: "Birria de res a la leña", category: "lento", level: "Avanzado", description: "Res deshebrada en consomé de chiles secos cocido junto al fuego." },
  { id: 53, title: "Cachete de res al mezquite", category: "lento", level: "Intermedio", description: "Cachete meloso, humo marcado y salsa de sus propios jugos." },
  { id: 54, title: "Rabo de res en olla de hierro", category: "lento", level: "Intermedio", description: "Estofado profundo de rabo, jitomate y vino cocido entre brasas." },
  { id: 55, title: "Osobuco al rescoldo", category: "lento", level: "Intermedio", description: "Osobuco suave con tuétano, vegetales y gremolata de limón." },
  { id: 56, title: "Lechón con piel crujiente", category: "lento", level: "Avanzado", description: "Lechón entero de piel quebradiza y carne húmeda al calor indirecto." },
  { id: 57, title: "Porchetta al carbón", category: "lento", level: "Avanzado", description: "Rollo de cerdo con hinojo, ajo, hierbas y piel dorada." },
  { id: 58, title: "Pastor de cerdo al trompo de brasas", category: "lento", level: "Avanzado", description: "Capas de cerdo con achiote y piña girando frente al carbón." },
  { id: 59, title: "Pastrami casero al humo", category: "lento", level: "Avanzado", description: "Pecho curado con costra de pimienta y cilantro, humo y vapor final." },
  { id: 60, title: "Cecina gruesa ahumada", category: "lento", level: "Intermedio", description: "Láminas gruesas de res curada con humo tenue y bordes tostados." },
  { id: 61, title: "Salmón sobre tabla de cedro", category: "lento", level: "Inicial", description: "Lomo de salmón húmedo con cedro, mostaza y azúcar morena." },
  { id: 62, title: "Trucha ahumada con eneldo", category: "lento", level: "Intermedio", description: "Trucha entera suavemente ahumada con limón y eneldo." },
  { id: 63, title: "Pulpo confitado junto a las brasas", category: "lento", level: "Avanzado", description: "Pulpo tierno en aceite, ajo y laurel con acabado crujiente." },
  { id: 64, title: "Frijoles charros al humo", category: "lento", level: "Inicial", description: "Olla de frijoles con tocino, chile y una capa sutil de humo." },
  { id: 65, title: "Pozole rojo en olla de hierro", category: "lento", level: "Intermedio", description: "Maíz cacahuazintle y cerdo en caldo rojo cocido sobre leña." },
  { id: 66, title: "Chili de res y frijol negro", category: "lento", level: "Inicial", description: "Guiso espeso con carne, frijol negro, chile y humo de encino." },
  { id: 67, title: "Tamales de elote al vapor de brasa", category: "lento", level: "Intermedio", description: "Tamales dulces y tiernos cocidos en vapor sobre un fuego estable." },
  { id: 68, title: "Piña entera al humo", category: "lento", level: "Inicial", description: "Piña caramelizada con canela, piloncillo y humo delicado." },
  { id: 69, title: "Manzanas rellenas al rescoldo", category: "lento", level: "Inicial", description: "Manzanas suaves con nuez, canela y miel cocidas entre ceniza." },
  { id: 70, title: "Elotes con mayonesa de chile", category: "vegetales", level: "Inicial", description: "Granos dorados, mayonesa especiada, queso añejo y limón." },
  { id: 71, title: "Nopales con queso y salsa roja", category: "vegetales", level: "Inicial", description: "Nopales marcados, queso fresco y salsa de jitomate tatemado." },
  { id: 72, title: "Calabaza de castilla al rescoldo", category: "vegetales", level: "Intermedio", description: "Gajos dulces con mantequilla, pepita tostada y chile ancho." },
  { id: 73, title: "Betabeles en sal de brasa", category: "vegetales", level: "Intermedio", description: "Betabel cocido en costra de sal con jocoque y hierbas." },
  { id: 74, title: "Zanahorias con miel y comino", category: "vegetales", level: "Inicial", description: "Zanahorias chamuscadas, miel ligera, comino y hojas frescas." },
  { id: 75, title: "Espárragos con limón negro", category: "vegetales", level: "Inicial", description: "Espárragos crujientes con mantequilla y polvo de limón negro." },
  { id: 76, title: "Pimientos rellenos de arroz", category: "vegetales", level: "Intermedio", description: "Pimientos dulces rellenos de arroz, hierbas y queso fundido." },
  { id: 77, title: "Berenjenas con tahini ahumado", category: "vegetales", level: "Intermedio", description: "Pulpa sedosa, piel quemada, tahini, limón y ajonjolí." },
  { id: 78, title: "Hongos ostra con ajo y perejil", category: "vegetales", level: "Inicial", description: "Racimos de hongos con bordes crujientes y mantequilla de ajo." },
  { id: 79, title: "Portobellos rellenos de huitlacoche", category: "vegetales", level: "Intermedio", description: "Hongos carnosos con huitlacoche, epazote y queso Oaxaca." },
  { id: 80, title: "Papas aplastadas al romero", category: "vegetales", level: "Inicial", description: "Papas crujientes en hierro con ajo, romero y sal gruesa." },
  { id: 81, title: "Camotes con mantequilla de piloncillo", category: "vegetales", level: "Inicial", description: "Camote suave y caramelizado con piloncillo, canela y sal." },
  { id: 82, title: "Cebollas rellenas al carbón", category: "vegetales", level: "Intermedio", description: "Cebollas enteras con queso, hierbas y migas tostadas." },
  { id: 83, title: "Ajos enteros al rescoldo", category: "vegetales", level: "Inicial", description: "Cabezas de ajo cremosas, aceite de oliva y pan tostado." },
  { id: 84, title: "Jitomates tatemados con burrata", category: "vegetales", level: "Inicial", description: "Jitomates quemados, burrata fresca, albahaca y aceite verde." },
  { id: 85, title: "Chiles poblanos rellenos de frijol", category: "vegetales", level: "Intermedio", description: "Poblanos asados con frijol, queso y salsa de pepita." },
  { id: 86, title: "Alcachofas con mantequilla de ajo", category: "vegetales", level: "Intermedio", description: "Alcachofas tiernas y doradas con ajo, limón y perejil." },
  { id: 87, title: "Coles de Bruselas con chile ancho", category: "vegetales", level: "Inicial", description: "Hojas tostadas con chile ancho, miel y semillas de calabaza." },
  { id: 88, title: "Repollo en gajos con salsa de semillas", category: "vegetales", level: "Intermedio", description: "Gajos carbonizados por fuera, tiernos al centro y salsa de pepita." },
  { id: 89, title: "Brócoli con limón y parmesano", category: "vegetales", level: "Inicial", description: "Brócoli marcado a fuego alto con limón quemado y queso curado." },
  { id: 90, title: "Puerros a la brasa con romesco", category: "vegetales", level: "Intermedio", description: "Puerros dulces bajo su capa quemada con salsa de nuez y chile." },
  { id: 91, title: "Endivias con naranja y nuez", category: "vegetales", level: "Inicial", description: "Hojas amargas caramelizadas con naranja, nuez y miel." },
  { id: 92, title: "Calabacitas con ricotta y menta", category: "vegetales", level: "Inicial", description: "Calabacitas apenas tostadas con ricotta, menta y limón." },
  { id: 93, title: "Chayotes con adobo de guajillo", category: "vegetales", level: "Intermedio", description: "Chayote firme y jugoso con adobo rojo y cebolla asada." },
  { id: 94, title: "Hinojo con mantequilla de naranja", category: "vegetales", level: "Intermedio", description: "Bulbos de hinojo caramelizados con naranja y pimienta rosa." },
  { id: 95, title: "Aguacates rellenos a la parrilla", category: "vegetales", level: "Inicial", description: "Mitades de aguacate marcadas y rellenas de pico de gallo." },
  { id: 96, title: "Sandía asada con chile y sal", category: "vegetales", level: "Inicial", description: "Gajos de sandía caramelizados con chile, limón y sal de mar." },
  { id: 97, title: "Peras con queso azul al carbón", category: "vegetales", level: "Inicial", description: "Peras doradas con queso azul, nuez y un hilo de miel." },
  { id: 98, title: "Plátanos machos con crema", category: "vegetales", level: "Inicial", description: "Plátano caramelizado en su piel con crema, canela y cacao." },
  { id: 99, title: "Piña con chile pasilla", category: "vegetales", level: "Inicial", description: "Rodajas de piña con marcas oscuras, chile pasilla y limón." },
  { id: 100, title: "Membrillos con miel de mezquite", category: "vegetales", level: "Intermedio", description: "Membrillos tiernos y fragantes con miel, clavo y humo ligero." },
];

const categoryLabels: Record<Recipe["category"], string> = {
  directo: "Fuego directo",
  lento: "Lento y ahumado",
  vegetales: "Vegetales",
};

const categoryTones: Record<Recipe["category"], string> = {
  directo: "copper",
  lento: "charcoal",
  vegetales: "sage",
};

export const recipes: Recipe[] = recipeSeeds.map((recipe) => ({
  ...recipe,
  time: recipePreparations[recipe.id].total,
  preparation: recipePreparations[recipe.id],
  categoryLabel: categoryLabels[recipe.category],
  tone: categoryTones[recipe.category],
  image: `/editorial/recipes/recipe-${String(recipe.id).padStart(3, "0")}.jpg`,
}));

export const products: Product[] = [
  ...productionProducts,
];

export const events: FireEvent[] = [
  { id: 201, day: "18", month: "JUL", city: "Monterrey, NL", title: "Fuego de montaña", detail: "Taller de cortes y control de temperatura", spots: 8 },
  { id: 202, day: "09", month: "AGO", city: "Valle de Bravo, MEX", title: "Mesa entre pinos", detail: "Cena colaborativa de cinco tiempos", spots: 12 },
  { id: 203, day: "30", month: "AGO", city: "Querétaro, QRO", title: "Humo y fermentos", detail: "Clase de ahumado y salsas vivas", spots: 5 },
];

export const seedVersion = "2026.09.30";
