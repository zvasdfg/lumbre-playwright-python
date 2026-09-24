"use client";

import { FormEvent, useEffect, useState } from "react";

type AdministrativeProduct = {
  id: number;
  name: string;
  category: "blends" | "ropa" | "herramientas" | "outdoor";
  price: number;
  badge: string | null;
  active: boolean;
  revision: number;
};

type AdministrativeEvent = {
  id: number;
  day: string;
  month: string;
  city: string;
  title: string;
  detail: string;
  capacity: number;
  active: boolean;
  revision: number;
};

type AdminCatalogProps = {
  onClose: () => void;
  onCatalogChanged: () => Promise<void>;
};

function replaceRecord<T extends { id: number }>(records: T[], updated: T) {
  return records.map((record) => (record.id === updated.id ? updated : record));
}

export default function AdminCatalog({ onClose, onCatalogChanged }: AdminCatalogProps) {
  const [products, setProducts] = useState<AdministrativeProduct[]>([]);
  const [events, setEvents] = useState<AdministrativeEvent[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<AdministrativeProduct | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AdministrativeEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadCatalog() {
    try {
      const [productsResponse, eventsResponse] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/events"),
      ]);
      if (!productsResponse.ok || !eventsResponse.ok) {
        throw new Error("Administrative catalog request failed");
      }
      const productResult = (await productsResponse.json()) as { data: AdministrativeProduct[] };
      const eventResult = (await eventsResponse.json()) as { data: AdministrativeEvent[] };
      setProducts(productResult.data);
      setEvents(eventResult.data);
      setSelectedProduct((current) => current
        ? productResult.data.find((product) => product.id === current.id) ?? null
        : null);
      setSelectedEvent((current) => current
        ? eventResult.data.find((event) => event.id === current.id) ?? null
        : null);
    } catch (error) {
      console.error("The administrative catalog could not be loaded", error);
      setMessage("No pudimos cargar el catálogo administrativo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    async function loadInitialCatalog() {
      try {
        const [productsResponse, eventsResponse] = await Promise.all([
          fetch("/api/admin/products", { signal: controller.signal }),
          fetch("/api/admin/events", { signal: controller.signal }),
        ]);
        if (!productsResponse.ok || !eventsResponse.ok) {
          throw new Error("Administrative catalog request failed");
        }
        const productResult = (await productsResponse.json()) as { data: AdministrativeProduct[] };
        const eventResult = (await eventsResponse.json()) as { data: AdministrativeEvent[] };
        setProducts(productResult.data);
        setEvents(eventResult.data);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("The administrative catalog could not be loaded", error);
          setMessage("No pudimos cargar el catálogo administrativo.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadInitialCatalog();
    return () => controller.abort();
  }, []);

  function reloadCatalog() {
    setLoading(true);
    setMessage("");
    void loadCatalog();
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedRevision: selectedProduct.revision,
          name: selectedProduct.name,
          category: selectedProduct.category,
          price: selectedProduct.price,
          badge: selectedProduct.badge || null,
          active: selectedProduct.active,
        }),
      });
      if (response.status === 409) {
        setMessage("El catálogo cambió en otra sesión. Conservamos tus cambios; recarga los datos antes de guardar.");
        return;
      }
      if (!response.ok) throw new Error(`Product save failed with ${response.status}`);
      const result = (await response.json()) as { data: AdministrativeProduct };
      setProducts((current) => replaceRecord(current, result.data));
      setSelectedProduct(result.data);
      await onCatalogChanged();
      setMessage("Producto actualizado.");
    } catch (error) {
      console.error("The administrative product could not be saved", error);
      setMessage("No pudimos guardar el producto. Revisa los datos e intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEvent) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/events/${selectedEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedRevision: selectedEvent.revision,
          day: selectedEvent.day,
          month: selectedEvent.month,
          city: selectedEvent.city,
          title: selectedEvent.title,
          detail: selectedEvent.detail,
          capacity: selectedEvent.capacity,
          active: selectedEvent.active,
        }),
      });
      if (response.status === 409) {
        setMessage("El catálogo cambió en otra sesión. Conservamos tus cambios; recarga los datos antes de guardar.");
        return;
      }
      if (!response.ok) throw new Error(`Event save failed with ${response.status}`);
      const result = (await response.json()) as { data: AdministrativeEvent };
      setEvents((current) => replaceRecord(current, result.data));
      setSelectedEvent(result.data);
      await onCatalogChanged();
      setMessage("Encuentro actualizado.");
    } catch (error) {
      console.error("The administrative event could not be saved", error);
      setMessage("No pudimos guardar el encuentro. Revisa los datos e intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal admin-catalog-modal" role="dialog" aria-modal="true" aria-labelledby="admin-catalog-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar administración">×</button>
        <header className="admin-catalog-heading">
          <div><p className="section-index">OPERACIÓN LUMBRE</p><h2 id="admin-catalog-title">Administración del catálogo.</h2></div>
          <button className="button button-quiet" type="button" onClick={reloadCatalog} disabled={loading || saving}>Recargar catálogo</button>
        </header>
        <p className="admin-catalog-intro">Edita los registros existentes. Cada guardado verifica la revisión para evitar sobrescribir el trabajo de otra sesión.</p>
        {message && <p className="admin-catalog-message" role="status">{message}</p>}
        {loading ? <p className="admin-catalog-loading" role="status">Cargando catálogo...</p> : (
          <div className="admin-catalog-workspace">
            <section aria-labelledby="admin-products-title">
              <h3 id="admin-products-title">Productos</h3>
              <div className="admin-record-list">
                {products.map((product) => (
                  <button key={product.id} type="button" data-testid={`admin-product-${product.id}`} aria-pressed={selectedProduct?.id === product.id} onClick={() => { setSelectedProduct({ ...product }); setSelectedEvent(null); setMessage(""); }}>
                    <span>{product.name}</span><small>{product.active ? "Activo" : "Inactivo"} · Rev. {product.revision}</small>
                  </button>
                ))}
              </div>
            </section>
            <section aria-labelledby="admin-events-title">
              <h3 id="admin-events-title">Encuentros</h3>
              <div className="admin-record-list">
                {events.map((catalogEvent) => (
                  <button key={catalogEvent.id} type="button" data-testid={`admin-event-${catalogEvent.id}`} aria-pressed={selectedEvent?.id === catalogEvent.id} onClick={() => { setSelectedEvent({ ...catalogEvent }); setSelectedProduct(null); setMessage(""); }}>
                    <span>{catalogEvent.title}</span><small>{catalogEvent.active ? "Activo" : "Inactivo"} · Rev. {catalogEvent.revision}</small>
                  </button>
                ))}
              </div>
            </section>
            <section className="admin-editor" aria-label="Editor del catálogo">
              {!selectedProduct && !selectedEvent && <p>Selecciona un producto o encuentro para editarlo.</p>}
              {selectedProduct && (
                <form onSubmit={saveProduct} data-testid="admin-product-form">
                  <h3>Editar producto #{selectedProduct.id}</h3>
                  <label>Nombre del producto<input value={selectedProduct.name} minLength={3} maxLength={100} required onChange={(event) => setSelectedProduct((current) => current && ({ ...current, name: event.target.value }))} /></label>
                  <label>Categoría<select value={selectedProduct.category} onChange={(event) => setSelectedProduct((current) => current && ({ ...current, category: event.target.value as AdministrativeProduct["category"] }))}><option value="blends">Mezclas</option><option value="ropa">Ropa</option><option value="herramientas">Herramientas</option><option value="outdoor">Aire libre</option></select></label>
                  <label>Precio en MXN<input type="number" min="1" max="1000000" required value={selectedProduct.price} onChange={(event) => setSelectedProduct((current) => current && ({ ...current, price: Number(event.target.value) }))} /></label>
                  <label>Distintivo<input value={selectedProduct.badge ?? ""} maxLength={40} onChange={(event) => setSelectedProduct((current) => current && ({ ...current, badge: event.target.value || null }))} /></label>
                  <label className="checkbox"><input type="checkbox" checked={selectedProduct.active} onChange={(event) => setSelectedProduct((current) => current && ({ ...current, active: event.target.checked }))} /> Producto visible en la tienda.</label>
                  <button className="button button-primary" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar producto"}</button>
                </form>
              )}
              {selectedEvent && (
                <form onSubmit={saveEvent} data-testid="admin-event-form">
                  <h3>Editar encuentro #{selectedEvent.id}</h3>
                  <div className="admin-date-fields"><label>Día<input value={selectedEvent.day} pattern="(0[1-9]|[12][0-9]|3[01])" required onChange={(event) => setSelectedEvent((current) => current && ({ ...current, day: event.target.value }))} /></label><label>Mes<input value={selectedEvent.month} pattern="[A-ZÁÉÍÓÚ]{3}" required onChange={(event) => setSelectedEvent((current) => current && ({ ...current, month: event.target.value }))} /></label></div>
                  <label>Ciudad<input value={selectedEvent.city} minLength={3} maxLength={100} required onChange={(event) => setSelectedEvent((current) => current && ({ ...current, city: event.target.value }))} /></label>
                  <label>Nombre del encuentro<input value={selectedEvent.title} minLength={3} maxLength={120} required onChange={(event) => setSelectedEvent((current) => current && ({ ...current, title: event.target.value }))} /></label>
                  <label>Descripción<input value={selectedEvent.detail} minLength={3} maxLength={240} required onChange={(event) => setSelectedEvent((current) => current && ({ ...current, detail: event.target.value }))} /></label>
                  <label>Capacidad<input type="number" min="1" max="10000" required value={selectedEvent.capacity} onChange={(event) => setSelectedEvent((current) => current && ({ ...current, capacity: Number(event.target.value) }))} /></label>
                  <label className="checkbox"><input type="checkbox" checked={selectedEvent.active} onChange={(event) => setSelectedEvent((current) => current && ({ ...current, active: event.target.checked }))} /> Encuentro visible en la agenda.</label>
                  <button className="button button-primary" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar encuentro"}</button>
                </form>
              )}
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
