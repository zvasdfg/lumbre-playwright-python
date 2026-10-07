import { Suspense, lazy, useMemo, useState } from "react";
import Image from "./image";
import AsyncBoundary from "./async-boundary";
import recipes from "virtual:lumbre-recipe-index";
import type { Recipe as FullRecipe } from "../app/lib/data";
type Recipe = Omit<FullRecipe, "preparation">;
const RecipeSheet = lazy(() => import("./recipe-sheet"));
import { productionProducts } from "../app/lib/production-products";
import FirePlanner from "./fire-planner";
import IngredientLab from "./deferred-lab";
import FireAlmanac from "./deferred-almanac";
const ProductSheet = lazy(() => import("./product-sheet"));
type RecipeFilter = "todos" | "directo" | "lento" | "vegetales";
const recipesPerPage = 6;
const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const productCatalog = productionProducts.map(product => ({ ...product, ...product.details, ingredients: product.details.components.map(component => component.nombre) }));
function productCategoryLabel() { return "sazonador Lumbre"; }
function productInitials(name: string) { return name.slice(0, 3); }
function paginationItems(currentPage: number, pageCount: number): Array<number | string> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const visiblePages = new Set([1, pageCount, currentPage - 1, currentPage, currentPage + 1]);
  const pages = [...visiblePages]
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((left, right) => left - right);
  const items: Array<number | string> = [];
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) items.push(`ellipsis-${page}`);
    items.push(page);
  });
  return items;
}


export default function StaticPortal() {
  const [selectedProduct, setSelectedProduct] = useState<typeof productionProducts[number] | null>(null);
  const [recipeFilter, setRecipeFilter] = useState<RecipeFilter>("todos");
  const [search, setSearch] = useState("");
  const [recipePage, setRecipePage] = useState(1);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [productRecipeOrigin, setProductRecipeOrigin] = useState<Recipe | null>(null);
  const [recipeScrollTop, setRecipeScrollTop] = useState(0);
  const filteredRecipes = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("es");
    return recipes.filter((recipe) => {
      const matchesCategory = recipeFilter === "todos" || recipe.category === recipeFilter;
      const matchesSearch = !normalized || `${recipe.title} ${recipe.description}`.toLocaleLowerCase("es").includes(normalized);
      return matchesCategory && matchesSearch;
    });
  }, [recipeFilter, search]);
  const recipePageCount = Math.max(1, Math.ceil(filteredRecipes.length / recipesPerPage));
  const visibleRecipes = filteredRecipes.slice(
    (recipePage - 1) * recipesPerPage,
    recipePage * recipesPerPage,
  );

  function changeRecipePage(page: number) {
    setRecipePage(Math.min(Math.max(page, 1), recipePageCount));
    document.getElementById("recetas")?.scrollIntoView({ behavior: "smooth" });
  }


  return (
    <main data-app-ready="true">
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Lumbre, inicio">
          <Image src="/brand/lumbre-logo-primary.png" alt="" width={72} height={86} priority unoptimized />
          <span className="brand-wordmark">LUMBRE</span>
        </a>
        <nav aria-label="Navegación principal">
          <a href="#metodo">Método</a>
          <a href="#planificador">Planificador</a>
          <a href="#recetas">Recetas</a>
          <a href="#laboratorio">Laboratorio</a>
          <a href="#tienda">Provisiones</a>
        </nav>
        <details className="mobile-nav" onClick={(event) => {
          const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
          if (!link) return;
          event.currentTarget.open = false;
          const target = document.getElementById(link.hash.slice(1));
          if (target) {
            target.tabIndex = -1;
            window.requestAnimationFrame(() => target.focus({ preventScroll: true }));
          }
        }}>
          <summary>Menú</summary>
          <div>
            <a href="#metodo">Método</a>
            <a href="#planificador">Planificador</a>
            <a href="#recetas">Recetas</a>
            <a href="#laboratorio">Laboratorio</a>
            <a href="#tienda">Provisiones</a>
          </div>
        </details>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow">Fuego · Comunidad · Vida al aire libre</p>
          <h1>El fuego nos<br /><em>reúne.</em></h1>
          <p className="hero-description">Un laboratorio abierto para entender la brasa, diseñar mezclas y cocinar con intención. Aquí cada fuego deja conocimiento para el siguiente.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#laboratorio">Entrar al laboratorio</a>
            <button className="button button-quiet planner-trigger" type="button" onClick={() => document.getElementById("planificador")?.scrollIntoView({ behavior: "smooth" })}>Planear mi fuego <span>↗</span></button>
            <a className="button button-quiet" href="#recetas">Explorar recetas <span>↗</span></a>
          </div>
          <div className="hero-proof" aria-label="Alcance del laboratorio">
            <span><strong>60</strong> componentes</span>
            <span><strong>11</strong> familias</span>
            <span><strong>4</strong> protocolos</span>
          </div>
        </div>
        <div className="hero-visual">
          <Image className="hero-photo" src="/editorial/lumbre-hero-v2.jpg" alt="Parrilla encendida frente a montañas al atardecer" fill priority sizes="(max-width: 850px) 100vw, 52vw" />
          <div className="hero-stamp" aria-hidden="true"><Image src="/brand/lumbre-mark-red.png" alt="" width={58} height={58} unoptimized /><span>HECHO PARA<br />VIVIR AFUERA</span></div>
          <p className="visual-note"><span>CUADERNO 01</span> Observar. Formular.<br />Encender. Registrar.</p>
        </div>
      </section>

      <section className="knowledge-section" id="metodo" aria-labelledby="knowledge-title">
        <div className="knowledge-heading">
          <p className="section-index">01 — MÉTODO LUMBRE</p>
          <h2 id="knowledge-title">Antes de cocinar,<br />diseña el fuego.</h2>
          <p>No perseguimos una receta perfecta. Cuatro decisiones convierten una intuición en un proceso que otra persona puede repetir.</p>
        </div>
        <div className="knowledge-grid">
          <article><span>01 / COMBUSTIBLE</span><h3>Elige por duración, no sólo por aroma.</h3><p>Carbón para respuesta rápida; leña estable y bien seca cuando el tiempo y el humo forman parte del resultado.</p><strong>VARIABLE: ENERGÍA</strong></article>
          <article><span>02 / GEOMETRÍA</span><h3>Crea más de una zona de calor.</h3><p>Una zona intensa construye color. Una zona indirecta permite terminar la cocción sin quemar la superficie.</p><strong>VARIABLE: DISTANCIA</strong></article>
          <article><span>03 / SEÑALES</span><h3>Observa antes de intervenir.</h3><p>Color de la brasa, humo, sonido y resistencia de la superficie dicen más que un cronómetro aislado.</p><strong>VARIABLE: RESPUESTA</strong></article>
          <article><span>04 / REGISTRO</span><h3>Cambia una cosa por prueba.</h3><p>Anota proporción, temperatura y tiempo. Así una buena casualidad puede convertirse en protocolo.</p><strong>VARIABLE: EVIDENCIA</strong></article>
        </div>
        <aside className="knowledge-note"><span>PRINCIPIO DE CAMPO</span><p>La brasa no es un fondo escénico: es una fuente de energía que se distribuye, se agota y deja señales.</p></aside>
      </section>

      <FirePlanner />

      <section className="recipes-section" id="recetas">
        <div className="section-heading">
          <div><p className="section-index">03 — RECETARIO DE CAMPO</p><h2>Casos para<br />poner a prueba.</h2></div>
          <p>Cada receta es una ruta de aprendizaje: método, tiempo y nivel para practicar una habilidad específica frente al fuego.</p>
        </div>
        <div className="recipe-toolbar">
          <div className="filter-group" aria-label="Filtrar recetas">
            {([[
              "todos", "Todas"
            ], ["directo", "Fuego directo"], ["lento", "Lento y ahumado"], ["vegetales", "Vegetales"]] as const).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={recipeFilter === value} onClick={() => { setRecipeFilter(value); setRecipePage(1); }}>{label}</button>
            ))}
          </div>
          <label className="search-field"><span className="sr-only">Buscar recetas</span><input value={search} onChange={(event) => { setSearch(event.target.value); setRecipePage(1); }} placeholder="Buscar receta..." /><span aria-hidden="true">⌕</span></label>
        </div>
        {filteredRecipes.length ? (
          <>
          <div className="recipe-grid" aria-live="polite">
            {visibleRecipes.map((recipe, index) => (
              <article className="recipe-card" key={recipe.id} data-testid="recipe-card">
                <div className={`recipe-art ${recipe.tone}`}>
                  <Image src={recipe.image} alt={`Fotografía de ${recipe.title}`} fill sizes="(max-width: 520px) 100vw, (max-width: 850px) 50vw, 33vw" />
                  <span>{String((recipePage - 1) * recipesPerPage + index + 1).padStart(3, "0")}</span>
                  <small>{recipe.categoryLabel}</small>
                </div>
                <div className="recipe-meta"><span>{recipe.categoryLabel}</span><span>{recipe.time} · {recipe.level}</span></div>
                <h3>{recipe.title}</h3><p>{recipe.description}</p>
                <button type="button" onClick={() => setSelectedRecipe(recipe)} aria-label={`Ver receta ${recipe.title}`}>Ver receta <span>↗</span></button>
              </article>
            ))}
          </div>
          <nav className="recipe-pagination" aria-label="Páginas de recetas">
            <button type="button" disabled={recipePage === 1} onClick={() => changeRecipePage(recipePage - 1)}>← Anterior</button>
            <div>
              {paginationItems(recipePage, recipePageCount).map((item) =>
                typeof item === "number" ? (
                  <button
                    type="button"
                    key={item}
                    aria-label={`Ir a página ${item}`}
                    aria-current={recipePage === item ? "page" : undefined}
                    onClick={() => changeRecipePage(item)}
                  >
                    {item}
                  </button>
                ) : (
                  <span className="pagination-ellipsis" aria-hidden="true" key={item}>…</span>
                ),
              )}
            </div>
            <button type="button" disabled={recipePage === recipePageCount} onClick={() => changeRecipePage(recipePage + 1)}>Siguiente →</button>
            <p data-testid="recipe-page-status">
              Mostrando {(recipePage - 1) * recipesPerPage + 1}–{Math.min(recipePage * recipesPerPage, filteredRecipes.length)} de {filteredRecipes.length} recetas
            </p>
          </nav>
          </>
        ) : <p className="empty-state">No encontramos recetas con esos criterios. Prueba otra búsqueda.</p>}
      </section>

      <IngredientLab />

      <section className="shop-section" id="tienda">
        <div className="shop-heading"><p className="section-index">05 — DESPENSA LUMBRE</p><h2>Prueba nuestros<br />sazonadores.</h2><p>Cuatro mezclas para llevar al fuego. Conoce sus ingredientes y consulta sus fichas en nuestro laboratorio.</p><a className="text-link" href="#laboratorio">Conocer los componentes →</a></div>
        <div className="product-grid">
          {productCatalog.map((product) => (
            <article
              className="product-card"
              key={product.id}
              data-testid="product-card"
              data-category={product.category}
            >
              <div className={`product-art product-${product.category}`}>
                {product.badge && <span className="product-badge">{product.badge}</span>}
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.imageAlt ?? `Fotografía de ${product.name}`}
                    fill
                    sizes="(max-width: 520px) 100vw, 33vw"
                  />
                ) : (
                  <span className="product-placeholder" aria-hidden="true">
                    {productInitials(product.name)}
                  </span>
                )}
              </div>
              <p>{product.productCode ? `${productCategoryLabel()} · ${product.productCode}` : productCategoryLabel()}</p>
              <h3>{product.name}</h3>
              {product.description && <p className="product-description">{product.description}</p>}
              {product.ingredients && (
                <p className="product-ingredients"><strong>Ingredientes:</strong> {product.ingredients.join(", ")}.</p>
              )}
              <div>
                <strong>{currency.format(product.price)}{product.netContent ? ` · ${product.netContent}` : ""}</strong><span>Catálogo informativo · venta en línea no disponible</span>
              </div>
              <button className="product-card-open" type="button" aria-label={`Ver ficha de ${product.name}`} onClick={() => setSelectedProduct(product)}><span>Ver ficha del sazonador ↗</span></button>
            </article>
          ))}
        </div>
      </section>

      <AsyncBoundary><Suspense fallback={<p role="status">Cargando ficha…</p>}>{selectedProduct && <ProductSheet product={selectedProduct} onClose={() => {
        setSelectedProduct(null); setProductRecipeOrigin(null); setRecipeScrollTop(0);
      }} onBack={productRecipeOrigin ? () => {
        setSelectedProduct(null); setSelectedRecipe(productRecipeOrigin); setProductRecipeOrigin(null);
      } : undefined} />}</Suspense></AsyncBoundary>

      <footer>
        <div className="footer-brand"><Image src="/brand/lumbre-logo-inverse.png" alt="Lumbre" width={88} height={93} unoptimized /><h2>Que nunca falte<br />fuego en la mesa.</h2></div>
        <div><p>Explora</p><a href="#recetas">Recetas</a><a href="#laboratorio">Laboratorio</a><a href="#tienda">Sazonadores</a></div>
        <div><p>Tu privacidad</p><span>Sin cuentas ni compras en línea. Tus mezclas y presets se guardan únicamente en tu navegador.</span></div>
        <small>© 2026 Lumbre · Diseñado alrededor del fuego en México.</small>
      </footer>

      <FireAlmanac />


      <AsyncBoundary><Suspense fallback={<p role="status">Cargando receta…</p>}>{selectedRecipe && <RecipeSheet recipe={selectedRecipe} initialScrollTop={recipeScrollTop} onClose={() => { setSelectedRecipe(null); setRecipeScrollTop(0); }} onOpenBlend={(code, scrollTop) => {
        const product = productionProducts.find(item => item.details.productCode === code);
        if (product) { setProductRecipeOrigin(selectedRecipe); setRecipeScrollTop(scrollTop); setSelectedRecipe(null); setSelectedProduct(product); }
      }} />}</Suspense></AsyncBoundary>
    </main>
  );
}
