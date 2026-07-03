export type Recipe = {
  id: number;
  title: string;
  category: "directo" | "lento" | "vegetales";
  categoryLabel: string;
  time: string;
  level: string;
  description: string;
  tone: string;
};

export type Product = {
  id: number;
  name: string;
  category: "ropa" | "herramientas" | "outdoor";
  price: number;
  badge?: string;
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

export const recipes: Recipe[] = [
  {
    id: 1,
    title: "Entraña, chimichurri de monte",
    category: "directo",
    categoryLabel: "Fuego directo",
    time: "35 min",
    level: "Intermedio",
    description: "Costra intensa, centro jugoso y hierbas frescas para cortar la grasa.",
    tone: "copper",
  },
  {
    id: 2,
    title: "Costilla de res, ocho horas",
    category: "lento",
    categoryLabel: "Lento y ahumado",
    time: "8 h",
    level: "Avanzado",
    description: "Humo limpio de encino, paciencia y una corteza que cruje al tocarla.",
    tone: "charcoal",
  },
  {
    id: 3,
    title: "Coliflor al rescoldo",
    category: "vegetales",
    categoryLabel: "Vegetales",
    time: "55 min",
    level: "Inicial",
    description: "Mantequilla de chile ancho, limón tatemado y hojas crujientes.",
    tone: "sage",
  },
  {
    id: 4,
    title: "Pollo abierto al ladrillo",
    category: "directo",
    categoryLabel: "Fuego directo",
    time: "1 h 10 min",
    level: "Inicial",
    description: "Piel dorada y uniforme con un adobo de cítricos y ajo rostizado.",
    tone: "gold",
  },
  {
    id: 5,
    title: "Puerco al humo de manzano",
    category: "lento",
    categoryLabel: "Lento y ahumado",
    time: "6 h",
    level: "Intermedio",
    description: "Dulzor sutil, especias tostadas y carne que se separa sin esfuerzo.",
    tone: "ember",
  },
  {
    id: 6,
    title: "Duraznos, miel y romero",
    category: "vegetales",
    categoryLabel: "Vegetales",
    time: "20 min",
    level: "Inicial",
    description: "Un postre simple que aprovecha las últimas brasas de la tarde.",
    tone: "sunset",
  },
];

export const products: Product[] = [
  { id: 101, name: "Pinzas Forja 45", category: "herramientas", price: 740, badge: "Favorito" },
  { id: 102, name: "Mandil Lumbre 01", category: "ropa", price: 1290 },
  { id: 103, name: "Gorra Brasa Baja", category: "outdoor", price: 590, badge: "Nuevo" },
  { id: 104, name: "Playera Después del Humo", category: "ropa", price: 680 },
];

export const events: FireEvent[] = [
  { id: 201, day: "18", month: "JUL", city: "Monterrey, NL", title: "Fuego de montaña", detail: "Taller de cortes y control de temperatura", spots: 8 },
  { id: 202, day: "09", month: "AGO", city: "Valle de Bravo, MEX", title: "Mesa entre pinos", detail: "Cena colaborativa de cinco tiempos", spots: 12 },
  { id: 203, day: "30", month: "AGO", city: "Querétaro, QRO", title: "Humo y fermentos", detail: "Clase de ahumado y salsas vivas", spots: 5 },
];

export const seedVersion = "2026.07.03";
