"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { events, products, recipes, type FireEvent, type Product } from "../lib/data";
import { isPublicProductionReadOnly } from "../lib/environment";
import FirePlannerModal from "./fire-planner-modal";
import IngredientLab from "./ingredient-lab";

type RecipeFilter = "todos" | "directo" | "lento" | "vegetales";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

function productCategoryLabel(category: Product["category"]) {
  if (category === "outdoor") return "aire libre";
  return category;
}

export default function ClubPortal() {
  const readOnlyProduction = isPublicProductionReadOnly();
  const appRef = useRef<HTMLElement>(null);
  const [recipeFilter, setRecipeFilter] = useState<RecipeFilter>("todos");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Product[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [firePlannerOpen, setFirePlannerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FireEvent | null>(null);
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const filteredRecipes = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("es");
    return recipes.filter((recipe) => {
      const matchesCategory = recipeFilter === "todos" || recipe.category === recipeFilter;
      const matchesSearch = !normalized || `${recipe.title} ${recipe.description}`.toLocaleLowerCase("es").includes(normalized);
      return matchesCategory && matchesSearch;
    });
  }, [recipeFilter, search]);

  const cartTotal = cart.reduce((total, product) => total + product.price, 0);

  useEffect(() => {
    appRef.current?.setAttribute("data-app-ready", "true");

    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  function showToast(message: string) {
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToast(message);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast("");
      toastTimeoutRef.current = null;
    }, 3200);
  }

  function addToCart(product: Product) {
    setCart((current) => [...current, product]);
    showToast(`${product.name} se agregó a tu canasta.`);
  }

  async function submitMembership(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnlyProduction) return;

    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    setSubmitting(false);
    if (!response.ok) {
      showToast("No pudimos completar el registro. Revisa tus datos.");
      return;
    }
    setJoinOpen(false);
    showToast("Bienvenido al club. Revisa tu correo para encender la primera brasa.");
  }

  return (
    <main ref={appRef} data-app-ready="false">
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Lumbre, inicio">
          <Image src="/brand/lumbre-logo-primary.png" alt="" width={72} height={86} priority unoptimized />
          <span className="brand-wordmark">LUMBRE</span>
        </a>
        <nav aria-label="Navegación principal">
          <a href="#club">El club</a>
          <a href="#recetas">Recetas</a>
          <a href="#laboratorio">Laboratorio</a>
          <a href="#tienda">Tienda</a>
          <a href="#agenda">Agenda</a>
        </nav>
        <div className="header-actions">
          <button className="cart-button" type="button" onClick={() => setCartOpen(true)} aria-label={`Abrir canasta, ${cart.length} productos`}>
            Canasta <span>{cart.length}</span>
          </button>
          <button className="header-cta" type="button" onClick={() => setJoinOpen(true)}>Únete al fuego</button>
        </div>
      </header>

      {readOnlyProduction && (
        <aside className="public-demo-banner" aria-label="Entorno público de demostración">
          <strong>Demostración pública de solo lectura.</strong>
          <span>Explora el laboratorio y sus fichas sin enviar información personal.</span>
        </aside>
      )}

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow">Fuego · Comunidad · Vida al aire libre</p>
          <h1>El fuego nos<br /><em>reúne.</em></h1>
          <p className="hero-description">Prendas, herramientas y experiencias para quienes no sólo cocinan al fuego: viven alrededor de él.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#recetas">Explorar recetas</a>
            <button className="button button-quiet planner-trigger" type="button" onClick={() => setFirePlannerOpen(true)}>Planear mi fuego <span>↗</span></button>
            <a className="button button-quiet" href="#agenda">Ver próximos fuegos <span>↗</span></a>
          </div>
          <div className="member-proof">
            <span className="avatar-stack" aria-hidden="true"><i>LM</i><i>AR</i><i>JP</i></span>
            <span><strong>2,480</strong> parrilleros ya son parte</span>
          </div>
        </div>
        <div className="hero-visual" role="img" aria-label="Parrilla encendida frente a montañas al atardecer">
          <div className="sun" /><div className="mountain mountain-back" /><div className="mountain mountain-front" />
          <div className="grill"><span className="grill-lid" /><span className="grill-body" /><span className="grill-leg leg-one" /><span className="grill-leg leg-two" /></div>
          <div className="smoke smoke-one" /><div className="smoke smoke-two" />
          <div className="hero-stamp" aria-hidden="true"><Image src="/brand/lumbre-mark-red.png" alt="" width={58} height={58} unoptimized /><span>HECHO PARA<br />VIVIR AFUERA</span></div>
          <p className="visual-note"><span>01</span> Paciencia, humo<br />y buena compañía.</p>
        </div>
      </section>

      <section className="intro" id="club">
        <p className="section-index">01 — MANIFIESTO</p>
        <p className="intro-statement">Vestimos el fuego.<br />Compartimos el oficio.</p>
        <div>
          <p className="intro-copy">Lumbre es una comunidad para aprender haciendo: elegir la leña, dominar el calor y salir con equipo hecho para durar.</p>
          <button className="text-link light" type="button" onClick={() => setJoinOpen(true)}>Conocer la membresía →</button>
        </div>
      </section>

      <section className="recipes-section" id="recetas">
        <div className="section-heading">
          <div><p className="section-index">02 — RECETARIO</p><h2>Aprende a leer<br />las brasas.</h2></div>
          <p>Recetas probadas por nuestra comunidad, explicadas por temperatura y señales, no sólo por minutos.</p>
        </div>
        <div className="recipe-toolbar">
          <div className="filter-group" aria-label="Filtrar recetas">
            {([[
              "todos", "Todas"
            ], ["directo", "Fuego directo"], ["lento", "Lento y ahumado"], ["vegetales", "Vegetales"]] as const).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={recipeFilter === value} onClick={() => setRecipeFilter(value)}>{label}</button>
            ))}
          </div>
          <label className="search-field"><span className="sr-only">Buscar recetas</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar receta..." /><span aria-hidden="true">⌕</span></label>
        </div>
        {filteredRecipes.length ? (
          <div className="recipe-grid" aria-live="polite">
            {filteredRecipes.map((recipe, index) => (
              <article className="recipe-card" key={recipe.id} data-testid="recipe-card">
                <div className={`recipe-art ${recipe.tone}`}><span>0{index + 1}</span><i aria-hidden="true" /></div>
                <div className="recipe-meta"><span>{recipe.categoryLabel}</span><span>{recipe.time} · {recipe.level}</span></div>
                <h3>{recipe.title}</h3><p>{recipe.description}</p>
                <button type="button" onClick={() => showToast(`Abriendo ${recipe.title}.`)} aria-label={`Ver receta ${recipe.title}`}>Ver receta <span>↗</span></button>
              </article>
            ))}
          </div>
        ) : <p className="empty-state">No encontramos recetas con esos criterios. Prueba otra búsqueda.</p>}
      </section>

      <IngredientLab />

      <section className="shop-section" id="tienda">
        <div className="shop-heading"><p className="section-index">04 — PROVISIONES LUMBRE</p><h2>Equipo de fuego.<br />Hecho para durar.</h2><p>Prendas y herramientas diseñadas para ensuciarse, resistir el calor y vivir afuera.</p></div>
        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <div className={`product-art product-${product.category}`}>
                {product.badge && <span className="product-badge">{product.badge}</span>}
                <i aria-hidden="true" />
              </div>
              <p>{productCategoryLabel(product.category)}</p><h3>{product.name}</h3>
              <div><strong>{currency.format(product.price)}</strong><button type="button" onClick={() => addToCart(product)} aria-label={`Agregar ${product.name} a la canasta`}>+</button></div>
            </article>
          ))}
        </div>
      </section>

      <section className="events-section" id="agenda">
        <div className="section-heading events-heading"><div><p className="section-index">05 — PRÓXIMOS FUEGOS</p><h2>Nos vemos<br />afuera.</h2></div><p>Talleres pequeños, cenas largas y espacios para equivocarnos juntos.</p></div>
        <div className="event-list">
          {events.map((item) => (
            <article className="event-row" key={item.id}>
              <time><strong>{item.day}</strong><span>{item.month}</span></time>
              <div><span>{item.city}</span><h3>{item.title}</h3><p>{item.detail}</p></div>
              <span className="spots">{item.spots} lugares</span>
              <button type="button" onClick={() => setSelectedEvent(item)}>Reservar lugar <span>↗</span></button>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <div className="footer-brand"><Image src="/brand/lumbre-logo-inverse.png" alt="Lumbre" width={88} height={93} unoptimized /><h2>Que nunca falte<br />fuego en la mesa.</h2></div>
        <div><p>Explora</p><a href="#recetas">Recetas</a><a href="#laboratorio">Laboratorio</a><a href="#tienda">Tienda</a><a href="#agenda">Agenda</a></div>
        <div><p>Comunidad</p><button type="button" onClick={() => setJoinOpen(true)}>Membresía</button><a href="/api/health">Estado de la API</a><a href="/api/recipes">API de recetas</a><a href="/api/ingredientes">API de ingredientes</a></div>
        <small>© 2026 Lumbre · Diseñado alrededor del fuego en México.</small>
      </footer>

      {joinOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setJoinOpen(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="join-title">
            <button className="modal-close" type="button" onClick={() => setJoinOpen(false)} aria-label="Cerrar">×</button>
            <p className="section-index">MEMBRESÍA GRATUITA</p><h2 id="join-title">Enciende tu primera brasa.</h2><p>Recibe una receta nueva cada semana y acceso anticipado a encuentros.</p>
            {readOnlyProduction ? (
              <div className="read-only-message" role="note">
                <strong>Registro desactivado en la demostración pública.</strong>
                <p>
                  Este entorno no recibe nombres, correos ni solicitudes de membresía. El flujo
                  completo permanece disponible en el laboratorio local de pruebas.
                </p>
              </div>
            ) : (
              <form onSubmit={submitMembership}>
                <label>Nombre completo<input name="name" required minLength={2} autoFocus /></label>
                <label>Correo electrónico<input name="email" type="email" required /></label>
                <label>Experiencia<select name="experience" defaultValue="inicial"><option value="inicial">Estoy empezando</option><option value="intermedio">Ya controlo el fuego</option><option value="avanzado">Vivo entre brasas</option></select></label>
                <label className="checkbox"><input name="terms" type="checkbox" required /> Acepto recibir novedades del club.</label>
                <button className="button button-primary" type="submit" disabled={submitting}>{submitting ? "Encendiendo..." : "Unirme al club"}</button>
              </form>
            )}
          </section>
        </div>
      )}

      {firePlannerOpen && (
        <FirePlannerModal onClose={() => setFirePlannerOpen(false)} />
      )}

      {selectedEvent && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedEvent(null)}>
          <section className="modal compact" role="dialog" aria-modal="true" aria-labelledby="event-title">
            <button className="modal-close" type="button" onClick={() => setSelectedEvent(null)} aria-label="Cerrar">×</button>
            <p className="section-index">{selectedEvent.city}</p><h2 id="event-title">{selectedEvent.title}</h2><p>{selectedEvent.detail}. Quedan {selectedEvent.spots} lugares disponibles.</p>
            <button className="button button-primary" type="button" onClick={() => { setSelectedEvent(null); showToast("Lugar apartado. Te enviamos los detalles por correo."); }}>Confirmar reservación</button>
          </section>
        </div>
      )}

      {cartOpen && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setCartOpen(false)}>
          <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <button className="modal-close" type="button" onClick={() => setCartOpen(false)} aria-label="Cerrar canasta">×</button>
            <p className="section-index">LA DESPENSA</p><h2 id="cart-title">Tu canasta</h2>
            {cart.length ? <ul>{cart.map((product, index) => <li key={`${product.id}-${index}`}><span>{product.name}</span><strong>{currency.format(product.price)}</strong><button type="button" onClick={() => setCart((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Eliminar ${product.name}`}>×</button></li>)}</ul> : <p className="empty-cart">Todavía no agregas nada. El fuego puede esperar.</p>}
            <div className="cart-total"><span>Total</span><strong>{currency.format(cartTotal)}</strong></div>
            <button className="button button-primary full" type="button" disabled={!cart.length} onClick={() => showToast("El proceso de compra de demostración está listo para automatizarse.")}>Continuar compra</button>
          </aside>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}<button type="button" onClick={() => setToast("")} aria-label="Cerrar mensaje">×</button></div>}
    </main>
  );
}
