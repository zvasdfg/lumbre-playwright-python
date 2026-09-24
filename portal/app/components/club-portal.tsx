"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { events as eventSeeds, products as productSeeds, recipes, type FireEvent, type Product } from "../lib/data";
import { isPublicProductionReadOnly } from "../lib/environment";
import FirePlanner from "./fire-planner";
import IngredientLab from "./ingredient-lab";
import AccountPreferences from "./account-preferences";

type RecipeFilter = "todos" | "directo" | "lento" | "vegetales";

type CartItem = {
  productId: number;
  name: string;
  category: Product["category"];
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

type Cart = {
  items: CartItem[];
  totalQuantity: number;
  total: number;
};

type Account = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
};

type Order = {
  id: string;
  status: "pending" | "paid" | "failed" | "cancelled";
  customerName: string;
  customerEmail: string;
  currency: "MXN";
  total: number;
  items: CartItem[];
  createdAt: string;
  paidAt: string | null;
};

type AvailableEvent = FireEvent & {
  capacity?: number;
  reservedSpots?: number;
};

type Reservation = {
  id: string;
  eventId: number;
  eventTitle: string;
  eventCity: string;
  eventDay: string;
  eventMonth: string;
  partySize: number;
  status: "confirmed" | "cancelled";
  createdAt: string;
};

const emptyCart: Cart = { items: [], totalQuantity: 0, total: 0 };

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

function productCategoryLabel(category: Product["category"]) {
  if (category === "outdoor") return "aire libre";
  if (category === "blends") return "mezcla de protocolo";
  return category;
}

function productImage(productId: number) {
  const images: Record<number, string> = {
    101: "/editorial/products/pinzas-forja-45.jpg",
    102: "/editorial/products/mandil-lumbre-01.jpg",
    103: "/editorial/products/gorra-brasa-baja-v2.jpg",
    104: "/editorial/products/playera-despues-del-humo-v2.jpg",
    111: "/editorial/blend-spg.jpg",
    112: "/editorial/blend-pollo-ahumado.jpg",
    113: "/editorial/blend-umami.jpg",
  };
  return images[productId];
}

function productInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toLocaleUpperCase("es");
}

export default function ClubPortal() {
  const readOnlyProduction = isPublicProductionReadOnly();
  const appRef = useRef<HTMLElement>(null);
  const [recipeFilter, setRecipeFilter] = useState<RecipeFilter>("todos");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [account, setAccount] = useState<Account | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCatalog, setProductCatalog] = useState<Product[]>(productSeeds);
  const [eventCatalog, setEventCatalog] = useState<AvailableEvent[]>(eventSeeds);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [magicLinkRequested, setMagicLinkRequested] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FireEvent | null>(null);
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);

  const filteredRecipes = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("es");
    return recipes.filter((recipe) => {
      const matchesCategory = recipeFilter === "todos" || recipe.category === recipeFilter;
      const matchesSearch = !normalized || `${recipe.title} ${recipe.description}`.toLocaleLowerCase("es").includes(normalized);
      return matchesCategory && matchesSearch;
    });
  }, [recipeFilter, search]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialState() {
      try {
        const [cartResponse, accountResponse, productsResponse, eventsResponse] = await Promise.all([
          fetch("/api/cart", { signal: controller.signal }),
          fetch("/api/account", { signal: controller.signal }),
          fetch("/api/products", { signal: controller.signal }),
          fetch("/api/events", { signal: controller.signal }),
        ]);
        if (!cartResponse.ok) {
          throw new Error(`Cart request failed with ${cartResponse.status}`);
        }
        const cartResult = (await cartResponse.json()) as { data: Cart };
        setCart(cartResult.data);
        if (productsResponse.ok) {
          const productResult = (await productsResponse.json()) as { data: Product[] };
          setProductCatalog(productResult.data);
        }
        if (eventsResponse.ok) {
          const eventResult = (await eventsResponse.json()) as { data: AvailableEvent[] };
          setEventCatalog(eventResult.data);
        }
        if (accountResponse.ok) {
          const accountResult = (await accountResponse.json()) as { data: Account | null };
          setAccount(accountResult.data);
          if (accountResult.data) {
            const [ordersResponse, reservationsResponse] = await Promise.all([
              fetch("/api/orders", { signal: controller.signal }),
              fetch("/api/reservations", { signal: controller.signal }),
            ]);
            if (ordersResponse.ok) {
              const orderResult = (await ordersResponse.json()) as { data: Order[] };
              setOrders(orderResult.data);
            }
            if (reservationsResponse.ok) {
              const reservationResult = (await reservationsResponse.json()) as { data: Reservation[] };
              setReservations(reservationResult.data);
            }
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("The anonymous cart could not be loaded", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          appRef.current?.setAttribute("data-app-ready", "true");
        }
      }
    }

    void loadInitialState();

    return () => {
      controller.abort();
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

  async function addToCart(product: Product) {
    const response = await fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, quantity: 1 }),
    });
    if (!response.ok) {
      showToast("No pudimos actualizar tu canasta. Intenta de nuevo.");
      return;
    }
    const result = (await response.json()) as { data: Cart };
    setCart(result.data);
    showToast(`${product.name} se agregó a tu canasta.`);
  }

  async function removeFromCart(item: CartItem) {
    const response = await fetch(`/api/cart/items/${item.productId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      showToast("No pudimos actualizar tu canasta. Intenta de nuevo.");
      return;
    }
    const result = (await response.json()) as { data: Cart };
    setCart(result.data);
  }

  async function requestMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/account/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    if (!response.ok) {
      showToast("No pudimos preparar tu acceso. Revisa tus datos.");
      return;
    }
    setMagicLinkRequested(true);
  }

  async function logout() {
    const response = await fetch("/api/account/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!response.ok) {
      showToast("No pudimos cerrar tu sesión. Intenta de nuevo.");
      return;
    }
    setAccount(null);
    setAccountOpen(false);
    setCart(emptyCart);
    setOrders([]);
    setReservations([]);
    showToast("Tu sesión se cerró correctamente.");
  }

  async function confirmReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEvent || submitting) return;
    if (!account) {
      setSelectedEvent(null);
      setAccountOpen(true);
      showToast("Inicia sesión para reservar y consultar tus encuentros.");
      return;
    }

    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const partySize = Number(form.get("partySize"));
    const response = await fetch(`/api/events/${selectedEvent.id}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partySize }),
    });
    const result = (await response.json()) as {
      data?: Reservation;
      event?: AvailableEvent;
      error?: string;
    };
    setSubmitting(false);

    if (!response.ok || !result.data || !result.event) {
      if (response.status === 409 && result.error?.includes("already")) {
        showToast("Ya tienes una reservación para este encuentro.");
      } else if (response.status === 409) {
        showToast("Ya no quedan suficientes lugares para ese grupo.");
      } else {
        showToast("No pudimos confirmar la reservación. Intenta de nuevo.");
      }
      return;
    }

    setReservations((current) => [result.data!, ...current]);
    setEventCatalog((current) =>
      current.map((candidate) => candidate.id === result.event!.id ? result.event! : candidate),
    );
    setSelectedEvent(null);
    showToast(`Reservación confirmada para ${partySize} ${partySize === 1 ? "persona" : "personas"}.`);
  }

  function startCheckout() {
    if (!account) {
      setCartOpen(false);
      setAccountOpen(true);
      showToast("Inicia sesión para proteger y consultar tus compras.");
      return;
    }
    setCartOpen(false);
    setCheckoutOpen(true);
    setCheckoutOrder(null);
  }

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account || submitting) return;
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const checkoutMode = submitter?.value === "hosted" ? "hosted" : "local";

    let order = checkoutOrder;
    if (!order) {
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          customerName: form.get("customerName"),
          customerEmail: form.get("customerEmail"),
          deliveryNotes: form.get("deliveryNotes") || undefined,
        }),
      });
      if (!orderResponse.ok) {
        setSubmitting(false);
        showToast("No pudimos crear tu pedido. Revisa los datos.");
        return;
      }
      const orderResult = (await orderResponse.json()) as { data: Order };
      order = orderResult.data;
      setCheckoutOrder(order);
    }

    if (checkoutMode === "hosted") {
      const checkoutResponse = await fetch(`/api/orders/${order.id}/checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: "{}",
      });
      const checkoutResult = (await checkoutResponse.json()) as {
        data?: { checkoutUrl: string };
      };
      setSubmitting(false);
      if (!checkoutResponse.ok || !checkoutResult.data) {
        showToast("Checkout alojado no está disponible. Usa el simulador local.");
        return;
      }
      window.location.assign(checkoutResult.data.checkoutUrl);
      return;
    }

    const paymentResponse = await fetch(`/api/orders/${order.id}/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({ scenario: form.get("paymentScenario") }),
    });
    const paymentResult = (await paymentResponse.json()) as { data?: Order };
    setSubmitting(false);
    if (!paymentResult.data) {
      showToast("No pudimos procesar el pago local.");
      return;
    }

    setCheckoutOrder(paymentResult.data);
    setOrders((current) => [paymentResult.data!, ...current.filter(({ id }) => id !== paymentResult.data!.id)]);
    if (paymentResponse.status === 402) {
      showToast("Pago rechazado. Tu canasta permanece intacta.");
      return;
    }
    if (paymentResponse.ok) {
      setCart(emptyCart);
      showToast("Compra confirmada. El pedido quedó guardado en tu cuenta.");
    }
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
          <a href="#metodo">Método</a>
          <a href="#planificador">Planificador</a>
          <a href="#recetas">Recetas</a>
          <a href="#laboratorio">Laboratorio</a>
          <a href="#tienda">Provisiones</a>
          <a href="#agenda">Agenda</a>
        </nav>
        <div className="header-actions">
          <button className="cart-button" type="button" onClick={() => setCartOpen(true)} aria-label={`Abrir canasta, ${cart.totalQuantity} productos`}>
            Canasta <span>{cart.totalQuantity}</span>
          </button>
          <button
            className="cart-button"
            type="button"
            data-testid="account-button"
            onClick={() => setAccountOpen(true)}
          >
            {account ? account.name.split(" ")[0] : "Entrar"}
          </button>
          <button className="header-cta" type="button" onClick={() => setJoinOpen(true)}>Únete al fuego</button>
        </div>
      </header>

      {readOnlyProduction && (
        <aside className="public-demo-banner" aria-label="Entorno público de demostración">
          <strong>Demostración pública protegida.</strong>
          <span>
            Explora el catálogo y usa tu canasta anónima; membresía y laboratorio no reciben
            datos personales.
          </span>
        </aside>
      )}

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
        <div className="hero-visual" role="img" aria-label="Parrilla encendida frente a montañas al atardecer">
          <Image className="hero-photo" src="/editorial/lumbre-hero-v2.jpg" alt="" fill priority sizes="(max-width: 850px) 100vw, 52vw" />
          <div className="hero-stamp" aria-hidden="true"><Image src="/brand/lumbre-mark-red.png" alt="" width={58} height={58} unoptimized /><span>HECHO PARA<br />VIVIR AFUERA</span></div>
          <p className="visual-note"><span>CUADERNO 01</span> Observar. Formular.<br />Encender. Registrar.</p>
        </div>
      </section>

      <section className="intro" id="metodo">
        <p className="section-index">01 — MÉTODO LUMBRE</p>
        <p className="intro-statement">El fuego también<br />se puede leer.</p>
        <div>
          <p className="intro-copy">No perseguimos una receta perfecta. Construimos criterios: qué combustible usar, dónde colocar el alimento, qué señales observar y qué cambiar en la próxima prueba.</p>
          <a className="text-link light" href="#principios">Leer los principios →</a>
        </div>
      </section>

      <FirePlanner authenticated={Boolean(account)} />

      <section className="knowledge-section" id="principios" aria-labelledby="knowledge-title">
        <div className="knowledge-heading">
          <p className="section-index">03 — CONOCIMIENTO DE CAMPO</p>
          <h2 id="knowledge-title">Antes de cocinar,<br />diseña el fuego.</h2>
          <p>Cuatro decisiones convierten una intuición en un proceso que otra persona puede repetir.</p>
        </div>
        <div className="knowledge-grid">
          <article><span>01 / COMBUSTIBLE</span><h3>Elige por duración, no sólo por aroma.</h3><p>Carbón para respuesta rápida; leña estable y bien seca cuando el tiempo y el humo forman parte del resultado.</p><strong>VARIABLE: ENERGÍA</strong></article>
          <article><span>02 / GEOMETRÍA</span><h3>Crea más de una zona de calor.</h3><p>Una zona intensa construye color. Una zona indirecta permite terminar la cocción sin quemar la superficie.</p><strong>VARIABLE: DISTANCIA</strong></article>
          <article><span>03 / SEÑALES</span><h3>Observa antes de intervenir.</h3><p>Color de la brasa, humo, sonido y resistencia de la superficie dicen más que un cronómetro aislado.</p><strong>VARIABLE: RESPUESTA</strong></article>
          <article><span>04 / REGISTRO</span><h3>Cambia una cosa por prueba.</h3><p>Anota proporción, temperatura y tiempo. Así una buena casualidad puede convertirse en protocolo.</p><strong>VARIABLE: EVIDENCIA</strong></article>
        </div>
        <aside className="knowledge-note"><span>PRINCIPIO DE CAMPO</span><p>La brasa no es un fondo escénico: es una fuente de energía que se distribuye, se agota y deja señales.</p></aside>
      </section>

      <section className="recipes-section" id="recetas">
        <div className="section-heading">
          <div><p className="section-index">04 — RECETARIO DE CAMPO</p><h2>Casos para<br />poner a prueba.</h2></div>
          <p>Cada receta es una ruta de aprendizaje: método, tiempo y nivel para practicar una habilidad específica frente al fuego.</p>
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
                <div className={`recipe-art ${recipe.tone}`}>
                  <Image src={recipe.image} alt={`Fotografía de ${recipe.title}`} fill sizes="(max-width: 520px) 100vw, (max-width: 850px) 50vw, 33vw" />
                  <span>{String(index + 1).padStart(3, "0")}</span>
                  <small>{recipe.categoryLabel}</small>
                </div>
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
        <div className="shop-heading"><p className="section-index">06 — DESPENSA LUMBRE</p><h2>Prueba nuestros<br />protocolos.</h2><p>Mezclas nacidas en el laboratorio y listas para llevar al fuego. La herramienta y la merch acompañan el oficio; el sabor es el punto de partida.</p><a className="text-link" href="#laboratorio">Conocer los componentes →</a></div>
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
                {productImage(product.id) ? (
                  <Image
                    src={productImage(product.id)}
                    alt={`Fotografía de ${product.name}`}
                    fill
                    sizes="(max-width: 520px) 100vw, 33vw"
                  />
                ) : (
                  <span className="product-placeholder" aria-hidden="true">
                    {productInitials(product.name)}
                  </span>
                )}
              </div>
              <p>{productCategoryLabel(product.category)}</p><h3>{product.name}</h3>
              <div><strong>{currency.format(product.price)}</strong><button type="button" onClick={() => void addToCart(product)} aria-label={`Agregar ${product.name} a la canasta`}>+</button></div>
            </article>
          ))}
        </div>
      </section>

      <section className="events-section" id="agenda">
        <div className="section-heading events-heading"><div><p className="section-index">07 — PRÓXIMOS FUEGOS</p><h2>Nos vemos<br />afuera.</h2></div><p>Talleres pequeños, cenas largas y espacios para equivocarnos juntos.</p></div>
        <div className="event-list">
          {eventCatalog.map((item) => (
            <article className="event-row" key={item.id}>
              <time><strong>{item.day}</strong><span>{item.month}</span></time>
              <div><span>{item.city}</span><h3>{item.title}</h3><p>{item.detail}</p></div>
              <span className="spots">{item.spots ? `${item.spots} lugares` : "Agotado"}</span>
              <button type="button" disabled={item.spots === 0} onClick={() => setSelectedEvent(item)}>{item.spots ? "Reservar lugar" : "Sin lugares"} <span>↗</span></button>
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

      {accountOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setAccountOpen(false)}>
          <section className="modal compact" role="dialog" aria-modal="true" aria-labelledby="account-title">
            <button className="modal-close" type="button" onClick={() => setAccountOpen(false)} aria-label="Cerrar acceso">×</button>
            <p className="section-index">CUENTA LUMBRE</p>
            <h2 id="account-title">Tu lugar junto al fuego.</h2>
            {account ? (
              <div className="read-only-message">
                <strong>{account.name}</strong>
                <p>{account.email}</p>
                <p>Perfil: {account.role === "admin" ? "administración" : "cliente"}</p>
                <AccountPreferences />
                <div className="order-history" data-testid="order-history">
                  <h3>Historial de pedidos</h3>
                  {orders.length ? orders.map((order) => (
                    <article key={order.id}>
                      <span>{order.id.slice(0, 8).toUpperCase()}</span>
                      <strong>{currency.format(order.total)}</strong>
                      <small>{order.status === "paid" ? "Pagado" : order.status === "failed" ? "Pago rechazado" : "Pendiente"}</small>
                    </article>
                  )) : <p>Todavía no hay pedidos registrados.</p>}
                </div>
                <div className="order-history" data-testid="reservation-history">
                  <h3>Tus reservaciones</h3>
                  {reservations.length ? reservations.map((reservation) => (
                    <article key={reservation.id}>
                      <span>{reservation.eventTitle}</span>
                      <strong>{reservation.partySize} {reservation.partySize === 1 ? "lugar" : "lugares"}</strong>
                      <small>{reservation.eventDay} {reservation.eventMonth} · {reservation.eventCity} · Confirmada</small>
                    </article>
                  )) : <p>Todavía no hay encuentros reservados.</p>}
                </div>
                <button className="button button-primary" type="button" onClick={() => void logout()}>
                  Cerrar sesión
                </button>
              </div>
            ) : readOnlyProduction ? (
              <div className="read-only-message" role="note">
                <strong>Acceso en preparación.</strong>
                <p>La demostración pública habilitará cuentas cuando tenga correo transaccional.</p>
              </div>
            ) : magicLinkRequested ? (
              <div className="read-only-message" role="status">
                <strong>Revisa tu correo.</strong>
                <p>El enlace es único, vence en diez minutos y sólo puede utilizarse una vez.</p>
              </div>
            ) : (
              <form onSubmit={requestMagicLink}>
                <label>Nombre para tu cuenta<input name="name" required minLength={2} autoFocus /></label>
                <label>Correo de acceso<input name="email" type="email" required /></label>
                <button className="button button-primary" type="submit">Enviar enlace de acceso</button>
                <small>Crear una cuenta no te suscribe a mensajes de membresía.</small>
              </form>
            )}
          </section>
        </div>
      )}

      {checkoutOpen && account && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setCheckoutOpen(false)}>
          <section className="modal checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
            <button className="modal-close" type="button" onClick={() => setCheckoutOpen(false)} aria-label="Cerrar compra">×</button>
            <p className="section-index">COMPRA LOCAL DETERMINISTA</p>
            <h2 id="checkout-title">Confirma tus provisiones.</h2>
            <p>El servidor vuelve a calcular cada precio. Ningún total enviado por el navegador se acepta como autoridad.</p>
            {checkoutOrder?.status === "paid" ? (
              <div className="checkout-result" role="status">
                <strong>Compra confirmada</strong>
                <p>Pedido {checkoutOrder.id.slice(0, 8).toUpperCase()} · {currency.format(checkoutOrder.total)}</p>
                <button className="button button-primary" type="button" onClick={() => setCheckoutOpen(false)}>Cerrar</button>
              </div>
            ) : (
              <form onSubmit={submitCheckout}>
                <label>Nombre de entrega<input name="customerName" defaultValue={account.name} required minLength={2} /></label>
                <label>Correo de confirmación<input name="customerEmail" type="email" defaultValue={account.email} required /></label>
                <label>Notas de entrega<textarea name="deliveryNotes" maxLength={500} /></label>
                <label>Resultado del simulador<select name="paymentScenario" defaultValue="success"><option value="success">Pago aprobado</option><option value="rejection">Pago rechazado</option></select></label>
                <div className="cart-total"><span>Total calculado por servidor</span><strong>{currency.format(checkoutOrder?.total ?? cart.total)}</strong></div>
                {checkoutOrder?.status === "failed" && <p className="payment-rejected" role="alert">El intento fue rechazado. Conservamos la canasta para que puedas probar de nuevo.</p>}
                <button className="button button-primary full" type="submit" name="checkoutMode" value="local" disabled={submitting}>{submitting ? "Procesando..." : checkoutOrder?.status === "failed" ? "Reintentar pago" : "Crear pedido y pagar"}</button>
                {!checkoutOrder && <button className="button button-quiet full hosted-checkout-button" type="submit" name="checkoutMode" value="hosted" disabled={submitting}>Continuar en Stripe Checkout ↗</button>}
              </form>
            )}
          </section>
        </div>
      )}


      {selectedEvent && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedEvent(null)}>
          <section className="modal compact" role="dialog" aria-modal="true" aria-labelledby="event-title">
            <button className="modal-close" type="button" onClick={() => setSelectedEvent(null)} aria-label="Cerrar">×</button>
            <p className="section-index">{selectedEvent.city}</p><h2 id="event-title">{selectedEvent.title}</h2><p>{selectedEvent.detail}. Quedan {selectedEvent.spots} lugares disponibles.</p>
            <form onSubmit={confirmReservation}>
              <label>Tamaño del grupo<select name="partySize" defaultValue="1">{Array.from({ length: Math.min(selectedEvent.spots, 4) }, (_, index) => index + 1).map((size) => <option key={size} value={size}>{size} {size === 1 ? "persona" : "personas"}</option>)}</select></label>
              <button className="button button-primary" type="submit" disabled={submitting || selectedEvent.spots === 0}>{submitting ? "Confirmando..." : account ? "Confirmar reservación" : "Entrar para reservar"}</button>
            </form>
          </section>
        </div>
      )}

      {cartOpen && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setCartOpen(false)}>
          <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <button className="modal-close" type="button" onClick={() => setCartOpen(false)} aria-label="Cerrar canasta">×</button>
            <p className="section-index">LA DESPENSA</p><h2 id="cart-title">Tu canasta</h2>
            {cart.items.length ? <ul>{cart.items.map((item) => <li key={item.productId}><span>{item.name}{item.quantity > 1 && <small> × {item.quantity}</small>}</span><strong>{currency.format(item.lineTotal)}</strong><button type="button" onClick={() => void removeFromCart(item)} aria-label={`Eliminar ${item.name}`}>×</button></li>)}</ul> : <p className="empty-cart">Todavía no agregas nada. El fuego puede esperar.</p>}
            <div className="cart-total"><span>Total</span><strong>{currency.format(cart.total)}</strong></div>
            <button className="button button-primary full" type="button" disabled={!cart.items.length} onClick={startCheckout}>Continuar compra</button>
          </aside>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}<button type="button" onClick={() => setToast("")} aria-label="Cerrar mensaje">×</button></div>}
    </main>
  );
}
