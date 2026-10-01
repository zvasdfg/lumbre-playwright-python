import type { Recipe } from "../app/lib/data";
import Image from "./image";
import PrintableSheet from "./printable-sheet";
import { recipeBlendRecommendations, recipeBlendUsage, recipeEditorialNote, recipeSafetyNote, recipeSources } from "../app/lib/recipe-preparations";
import { productionProducts } from "../app/lib/production-products";

export default function RecipeSheet({ recipe, onClose, onOpenBlend, initialScrollTop = 0 }: { recipe: Recipe; onClose: () => void; onOpenBlend: (code: string, scrollTop: number) => void; initialScrollTop?: number }) {
  const preparation = recipe.preparation;
  const recommendation = recipeBlendRecommendations[recipe.id];
  const blend = productionProducts.find(product => product.details.productCode === recommendation?.productCode);
  return <PrintableSheet titleId="recipe-sheet-title" closeLabel="Cerrar ficha de receta" onClose={onClose} initialScrollTop={initialScrollTop}>
    <div className="product-sheet-intro recipe-sheet-intro">
      <Image src={recipe.image} alt={recipe.title} width={480} height={400} priority />
      <div>
        <p className="section-index">RECETARIO DE CAMPO · {String(recipe.id).padStart(3, "0")}</p>
        <h2 id="recipe-sheet-title">{recipe.title}</h2>
        <p className="product-sheet-style">{recipe.categoryLabel}</p>
        <dl className="recipe-sheet-meta">
          <div><dt>Tiempo orientativo</dt><dd>{recipe.time}</dd></div>
          <div><dt>Nivel</dt><dd>{recipe.level}</dd></div>
          <div><dt>Porciones orientativas</dt><dd>{preparation.servings}</dd></div>
        </dl>
      </div>
    </div>
    <div className="product-sheet-body">
      <section><h3>Sobre esta preparación</h3><p>{recipe.description}</p></section>
      <section className="recipe-content-note"><h3>Antes de empezar</h3>
        <p>{preparation.timing}</p>
        <p><strong>Equipo y fuego:</strong> {preparation.fire}</p>
        <p>Los tiempos no incluyen encender el carbón ni descongelar, salvo que se indique expresamente. Prepara el fuego antes de iniciar; el grosor, el equipo y el clima pueden cambiar la duración.</p>
      </section>
      <section className="recipe-ingredients"><h3>Ingredientes</h3>
        <ul>{preparation.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}</ul>
      </section>
      {recommendation && blend && <section className="recipe-blend">
        <h3>{recommendation.mode === "integrated" ? "Blend recomendado" : "Variante opcional"} · {blend.details.productCode}</h3>
        <p><strong>{blend.name}</strong></p>
        <p>{recommendation.note}</p>
        {recommendation.mode === "optional" && <p>La lista de ingredientes y los pasos conservan la receta original. Si eliges esta variante, aplica únicamente los cambios descritos aquí.</p>}
        <p>{recipeBlendUsage}</p>
        <button type="button" className="button button-quiet recipe-blend-link" onClick={event => onOpenBlend(recommendation.productCode, event.currentTarget.closest("dialog")?.scrollTop ?? 0)}>Ver ficha de {blend.details.productCode}</button>
      </section>}
      <section className="recipe-method"><h3>Preparación paso a paso</h3>
        <ol>{preparation.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      </section>
      <section><h3>Cómo saber que está listo</h3><p>{preparation.doneness}</p></section>
      <section className="recipe-safety"><h3>Manejo seguro</h3><p>{recipeSafetyNote}</p></section>
      <section className="recipe-sources"><h3>Notas y fuentes</h3>
        <p>{recommendation ? recipeEditorialNote.replace("revisión 1", "revisión 3 · " + (recommendation.mode === "integrated" ? "adaptación con blend" : "variante opcional")) : recipeEditorialNote}</p>
        <ul>{preparation.sources.map((id) => <li key={id}><a href={recipeSources[id].url} target="_blank" rel="noreferrer">{recipeSources[id].title}</a><span> — {recipeSources[id].scope}</span></li>)}</ul>
      </section>
    </div>
  </PrintableSheet>;
}
