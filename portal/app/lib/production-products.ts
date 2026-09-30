import type { ExperimentProtocol } from "./ingredients";

export type ProductDetails = {
  productCode: string;
  description: string;
  components: Array<{ id: string; nombre: string; familia: string }>;
  image: string;
  imageAlt: string;
  netContent: string;
};

const components = {
  salt: { id: "sal_mar_gruesa", nombre: "Sal de mar", familia: "Sal" },
  pepper: { id: "pimienta_negra", nombre: "Pimienta negra molida", familia: "Pimienta" },
  garlic: { id: "ajo_granulado", nombre: "Ajo granulado", familia: "Allium" },
  mushroom: { id: "shiitake_seco", nombre: "Hongo shiitake molido", familia: "Umami" },
  sugar: { id: "azucar_morena", nombre: "Azúcar mascabado", familia: "Endulzante" },
  chile: { id: "chile_pasilla", nombre: "Chile pasilla molido", familia: "Chile" },
  cumin: { id: "comino", nombre: "Comino", familia: "Semilla_aromatica" },
  sumac: { id: "sumac", nombre: "Sumac", familia: "Citrico" },
};

// Bootstrap/test data only. Runtime catalog and archive are read from D1.
export const productionProducts = [
  { id: 121, productCode: "LMB-F-001", name: "Sazonador multiuso",
    description: "Mezcla multiuso de sal de mar, pimienta negra molida y ajo granulado para preparaciones a la parrilla.",
    components: [components.salt, components.pepper, components.garlic] },
  { id: 122, productCode: "LMB-F-002", name: "Sazonador para carne de res",
    description: "Mezcla para carne de res elaborada con sal de mar, pimienta negra molida y hongo shiitake molido.",
    components: [components.salt, components.pepper, components.mushroom] },
  { id: 123, productCode: "LMB-F-003", name: "Sazonador para carne de cerdo",
    description: "Mezcla para carne de cerdo elaborada con sal de mar, azúcar mascabado, pimienta negra molida, ajo granulado y chile pasilla molido.",
    components: [components.salt, components.sugar, components.pepper, components.garlic, components.chile] },
  { id: 124, productCode: "LMB-F-004", name: "Sazonador para carne de pollo",
    description: "Mezcla para carne de pollo elaborada con sal de mar, pimienta negra molida, ajo granulado, comino y sumac.",
    components: [components.salt, components.pepper, components.garlic, components.cumin, components.sumac] },
].map(({ id, name, ...details }) => ({
  id, name, category: "blends" as const, price: 99, stock: 0, badge: "Producción",
  details: {
    ...details,
    image: `/editorial/products/${details.productCode.toLowerCase()}.jpeg`,
    imageAlt: `Frasco ${details.productCode}, ${name} Lumbre`,
    netContent: "150 g",
  } satisfies ProductDetails,
}));

export function productionArchiveRecord(product: {
  name: string; details: ProductDetails; createdAt: string; active: boolean;
}): ExperimentProtocol {
  const details = product.details;
  return {
    schema_version: 5, id: details.productCode, firma: `PROD:${details.productCode}`,
    objetivo: "Producto de producción", componentes: details.components,
    hipotesis: `Registro público de ${details.productCode}.${product.active ? "" : " Producto archivado: no disponible en la tienda."} La lista reproduce los ingredientes declarados en la etiqueta; no documenta proporciones ni sustituye una fórmula de fabricación.`,
    perfil_esperado: [],
    metodo: ["Conservar la declaración de ingredientes como referencia pública del producto.",
      "Consultar la etiqueta física para lote, fecha y demás información aplicable.",
      "No inferir proporciones, dosificación ni validación sensorial a partir de este registro."],
    estado: "producto_en_produccion", tipo_registro: "producto_produccion",
    producto: { id: details.productCode, nombre: product.name,
      descripcion: details.description, imagen: details.image,
      contenido_neto: details.netContent, alcance_formula: "declaracion_de_ingredientes" },
    contador_repeticiones: 0, creado_en: new Date(product.createdAt.includes("T") ? product.createdAt : `${product.createdAt.replace(" ", "T")}Z`).toISOString(),
  };
}
