// Editorial inference from declared ingredients, not measured formulation data.
// Sources: app/api/ingredientes/{ingredient ID}.json and production-products.ts.
export const tasteNames = ["Dulce", "Salado", "Ácido", "Amargo", "Umami"] as const;
export const contributionLabels = ["Sin protagonismo previsto", "Aporte secundario", "Aporte destacado"] as const;
type Contribution = 0 | 1 | 2;
type ProductProfile = {
  style: string;
  description: string;
  expected: string;
  pairings: Array<{ food: string; reason: string }>;
  cooking: string;
  tastes: [Contribution, Contribution, Contribution, Contribution, Contribution];
  rationale: string;
};
export const productProfiles: Record<string, ProductProfile> = {
  "LMB-F-001": {
    style: "Sal, pimienta y ajo · mezcla seca multiuso",
    description: "Una base de tres ingredientes para acompañar el alimento sin construir un perfil dulce o ácido. La sal sostiene el sazón; el ajo y la pimienta aportan el carácter aromático.",
    expected: "Sazón salado, aroma de ajo y una sensación picante de pimienta negra. Al cocinar, el ajo puede aportar notas ligeramente dulces y tostadas; no se espera un perfil de postre ni una acidez marcada.",
    pairings: [
      { food: "Res y cerdo", reason: "Una base sencilla para bisteces, hamburguesas o chuletas cuando quieres que destaque la carne." },
      { food: "Pollo y pescado", reason: "Puede acompañar piezas a la parrilla; aplica con moderación en pescados de sabor delicado." },
      { food: "Papa, calabacita y coliflor", reason: "El ajo y la pimienta aportan contraste aromático a vegetales de sabor suave." },
    ],
    cooking: "Aplica una capa ligera y evita quemar el ajo con exposición prolongada a la llama. Ajusta la sal del resto de la preparación.",
    tastes: [1, 2, 0, 1, 1],
    rationale: "La sal aporta el eje salado. El catálogo atribuye dulzor y umami secundarios al ajo, y un posible fondo amargo a ajo y pimienta. No se declara un ingrediente ácido protagonista.",
  },
  "LMB-F-002": {
    style: "Sal, pimienta y ajo con shiitake · mezcla de perfil umami",
    description: "Una mezcla de sal de mar, pimienta negra, ajo granulado y shiitake, según la composición corregida por Lumbre. La fotografía del empaque corresponde a la etiqueta anterior, que omitía el ajo.",
    expected: "Sazón salado con fondo de hongo, notas de ajo y sensación picante de pimienta. El shiitake seco aporta compuestos asociados al umami; el resultado exacto depende de las proporciones de la mezcla.",
    pairings: [
      { food: "Res", reason: "El fondo sabroso del shiitake puede acompañar cortes y hamburguesas sin recurrir a un perfil dulce." },
      { food: "Cerdo y pollo", reason: "Una alternativa de carácter terroso para chuletas o muslos." },
      { food: "Portobello, berenjena y coliflor", reason: "El hongo puede sumar profundidad a preparaciones vegetales asadas." },
    ],
    cooking: "Distribuye una capa fina; el polvo de hongo puede quemarse con llama directa. No agregues sal adicional antes de considerar la que ya contiene el sazonador.",
    tastes: [1, 2, 0, 1, 2],
    rationale: "Salado por la sal de mar y potencial umami por el shiitake seco. Dulzor y amargor se representan como secundarios, según los perfiles de los componentes; no son resultados de una degustación.",
  },
  "LMB-F-003": {
    style: "Mezcla seca dulce y especiada · mascabado y pasilla",
    description: "Sal de mar y azúcar mascabado forman una estructura dulce-salada, acompañada por pimienta, ajo y chile pasilla. Está pensada como una propuesta de contraste para cerdo y vegetales.",
    expected: "Dulzor de mascabado, notas de melaza y el carácter de fruta seca y tierra del pasilla, con ajo y sensación picante. No contiene un ingrediente ahumado declarado: el humo dependerá de la cocción.",
    pairings: [
      { food: "Cerdo", reason: "Propuesta para costillas, espaldilla o chuletas con contraste dulce y chile seco." },
      { food: "Pollo", reason: "Puede acompañar muslos y alitas, vigilando el dorado de la superficie." },
      { food: "Camote, zanahoria y coliflor", reason: "El pasilla contrasta con vegetales dulces y da carácter a los más neutros." },
    ],
    cooking: "Favorece calor indirecto y vigila la superficie: el azúcar y el chile pueden quemarse y generar amargor. No se infieren tiempos ni dosificaciones de la etiqueta.",
    tastes: [2, 2, 1, 1, 1],
    rationale: "El azúcar y la sal son fuentes explícitas de dulce y salado. El catálogo describe aportes secundarios de acidez y amargor en pasilla, y de umami en ajo y chile; su percepción en el producto no está validada.",
  },
  "LMB-F-004": {
    style: "Mezcla seca ácida y especiada · comino y sumac",
    description: "Una base de sal, pimienta y ajo con comino y sumac. Combina el carácter terroso de la especia con una fuente de acidez seca, sin agregar jugo de cítricos.",
    expected: "Sazón salado, acidez frutal del sumac, aroma cálido y terroso de comino, ajo y sensación picante de pimienta. Puede aparecer un fondo ligeramente amargo; la astringencia del sumac es una sensación distinta.",
    pairings: [
      { food: "Pollo", reason: "Propuesta para muslos, pechuga o brochetas con contraste ácido y especiado." },
      { food: "Cordero y pescado", reason: "Comino y sumac pueden acompañar cordero; usa una capa moderada en pescados delicados." },
      { food: "Berenjena, coliflor y calabacita", reason: "La acidez y las notas terrosas pueden contrastar con la superficie dorada de los vegetales." },
    ],
    cooking: "Prueba una capa ligera y ajusta antes de añadir limón u otra fuente de acidez. Evita quemar las especias con llama directa sostenida.",
    tastes: [1, 2, 2, 1, 1],
    rationale: "La sal y el sumac aportan las señales más claras de salado y ácido. El catálogo permite anticipar matices secundarios dulces, amargos y umami, sin conocer su intensidad final.",
  },
};
