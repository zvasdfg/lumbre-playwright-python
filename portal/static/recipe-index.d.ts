declare module "virtual:lumbre-recipe-index" {
  const cards: Omit<import("../app/lib/data").Recipe, "preparation">[];
  export default cards;
}
