import type { ExperimentProtocol } from "./ingredients";

export type ProductionProductMetadata = {
  productCode: string;
  description: string;
  ingredients: string[];
  image: string;
  imageAlt: string;
  netContent: string;
  purchaseEnabled: false;
};

export const productionProducts = [
  {
    id: 121,
    productCode: "LMB-F-001",
    name: "Sazonador multiuso",
    category: "blends" as const,
    price: 0,
    stock: 0,
    badge: "Producción",
    description: "Mezcla multiuso de sal de mar, pimienta negra molida y ajo granulado para preparaciones a la parrilla.",
    ingredients: ["Sal de mar", "Pimienta negra molida", "Ajo granulado"],
    image: "/editorial/products/lmb-f-001.jpeg",
    imageAlt: "Frasco LMB-F-001, Sazonador multiuso Lumbre",
    netContent: "150 g",
    purchaseEnabled: false as const,
  },
  {
    id: 122,
    productCode: "LMB-F-002",
    name: "Sazonador para carne de res",
    category: "blends" as const,
    price: 0,
    stock: 0,
    badge: "Producción",
    description: "Mezcla para carne de res elaborada con sal de mar, pimienta negra molida y hongo shiitake molido.",
    ingredients: ["Sal de mar", "Pimienta negra molida", "Hongo shiitake molido"],
    image: "/editorial/products/lmb-f-002.jpeg",
    imageAlt: "Frasco LMB-F-002, Sazonador para carne de res Lumbre",
    netContent: "150 g",
    purchaseEnabled: false as const,
  },
  {
    id: 123,
    productCode: "LMB-F-003",
    name: "Sazonador para carne de cerdo",
    category: "blends" as const,
    price: 0,
    stock: 0,
    badge: "Producción",
    description: "Mezcla para carne de cerdo elaborada con sal de mar, azúcar mascabado, pimienta negra molida, ajo granulado y chile pasilla molido.",
    ingredients: ["Sal de mar", "Azúcar mascabado", "Pimienta negra molida", "Ajo granulado", "Chile pasilla molido"],
    image: "/editorial/products/lmb-f-003.jpeg",
    imageAlt: "Frasco LMB-F-003, Sazonador para carne de cerdo Lumbre",
    netContent: "150 g",
    purchaseEnabled: false as const,
  },
  {
    id: 124,
    productCode: "LMB-F-004",
    name: "Sazonador para carne de pollo",
    category: "blends" as const,
    price: 0,
    stock: 0,
    badge: "Producción",
    description: "Mezcla para carne de pollo elaborada con sal de mar, pimienta negra molida, ajo granulado, comino y sumac.",
    ingredients: ["Sal de mar", "Pimienta negra molida", "Ajo granulado", "Comino", "Sumac"],
    image: "/editorial/products/lmb-f-004.jpeg",
    imageAlt: "Frasco LMB-F-004, Sazonador para carne de pollo Lumbre",
    netContent: "150 g",
    purchaseEnabled: false as const,
  },
] as const;

export const productionProductMetadata: Record<number, ProductionProductMetadata> = Object.fromEntries(
  productionProducts.map(({ id, productCode, description, ingredients, image, imageAlt, netContent, purchaseEnabled }) => [
    id,
    { productCode, description, ingredients: [...ingredients], image, imageAlt, netContent, purchaseEnabled },
  ]),
);

const components: Record<string, Array<{ id: string; nombre: string; familia: string }>> = {
  "LMB-F-001": [
    { id: "sal_mar_gruesa", nombre: "Sal de mar", familia: "Sal" },
    { id: "pimienta_negra", nombre: "Pimienta negra molida", familia: "Pimienta" },
    { id: "ajo_granulado", nombre: "Ajo granulado", familia: "Allium" },
  ],
  "LMB-F-002": [
    { id: "sal_mar_gruesa", nombre: "Sal de mar", familia: "Sal" },
    { id: "pimienta_negra", nombre: "Pimienta negra molida", familia: "Pimienta" },
    { id: "shiitake_seco", nombre: "Hongo shiitake molido", familia: "Umami" },
  ],
  "LMB-F-003": [
    { id: "sal_mar_gruesa", nombre: "Sal de mar", familia: "Sal" },
    { id: "azucar_morena", nombre: "Azúcar mascabado", familia: "Endulzante" },
    { id: "pimienta_negra", nombre: "Pimienta negra molida", familia: "Pimienta" },
    { id: "ajo_granulado", nombre: "Ajo granulado", familia: "Allium" },
    { id: "chile_pasilla", nombre: "Chile pasilla molido", familia: "Chile" },
  ],
  "LMB-F-004": [
    { id: "sal_mar_gruesa", nombre: "Sal de mar", familia: "Sal" },
    { id: "pimienta_negra", nombre: "Pimienta negra molida", familia: "Pimienta" },
    { id: "ajo_granulado", nombre: "Ajo granulado", familia: "Allium" },
    { id: "comino", nombre: "Comino", familia: "Semilla_aromatica" },
    { id: "sumac", nombre: "Sumac", familia: "Citrico" },
  ],
};

export const productionArchiveRecords: ExperimentProtocol[] = productionProducts.map((product) => ({
  schema_version: 5,
  id: product.productCode,
  firma: `PROD:${product.productCode}`,
  objetivo: "Producto de producción",
  componentes: components[product.productCode],
  hipotesis: `Registro público de ${product.productCode}. La lista reproduce los ingredientes declarados en la etiqueta; no documenta proporciones ni sustituye una fórmula de fabricación.`,
  perfil_esperado: [],
  metodo: [
    "Conservar la declaración de ingredientes como referencia pública del producto.",
    "Consultar la etiqueta física para lote, fecha y demás información aplicable.",
    "No inferir proporciones, dosificación ni validación sensorial a partir de este registro.",
  ],
  estado: "producto_en_produccion",
  tipo_registro: "producto_produccion",
  producto: {
    id: product.productCode,
    nombre: product.name,
    descripcion: product.description,
    imagen: product.image,
    contenido_neto: product.netContent,
    alcance_formula: "declaracion_de_ingredientes",
  },
  contador_repeticiones: 0,
  creado_en: "2026-09-30T00:00:00-06:00",
}));
