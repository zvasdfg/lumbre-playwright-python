declare module "virtual:lumbre-recipe-index" {
  const cards: Omit<import("../data/data").Recipe, "preparation">[];
  export default cards;
}
