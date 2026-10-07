import { productionProducts, type ProductDetails } from "../app/lib/production-products.ts";

// Jaccard similarity: shared ingredient IDs / all distinct IDs in either blend.
// Missing and extra ingredients both reduce the score. No recipe weights are known.
export function ingredientSimilarity(left: readonly string[], right: readonly string[]) {
  const a = new Set(left), b = new Set(right);
  const shared = [...a].filter(id => b.has(id));
  const union = new Set([...a, ...b]);
  return { score: union.size ? shared.length / union.size : 0, shared,
    extra: [...a].filter(id => !b.has(id)), missing: [...b].filter(id => !a.has(id)) };
}

export function productionMatches(ids: readonly string[]) {
  return productionProducts
    .filter(product => /^LMB-F-\d+$/.test(product.details.productCode) && (product.details as ProductDetails).publicationStatus !== "draft")
    .map(product => ({ product, ...ingredientSimilarity(ids, product.details.components.map(item => item.id)) }))
    .filter(match => match.score >= .8)
    .sort((a, b) => b.score - a.score || a.product.details.productCode.localeCompare(b.product.details.productCode));
}
