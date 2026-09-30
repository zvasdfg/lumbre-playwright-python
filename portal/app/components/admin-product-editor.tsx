"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { ingredients } from "../lib/ingredients";
import type { ProductDetails } from "../lib/production-products";

export type AdministrativeProduct = {
  id: number; name: string; category: "blends" | "ropa" | "herramientas" | "outdoor";
  price: number; stock: number; badge: string | null; active: boolean; revision: number;
  details: ProductDetails | null;
};

type Props = {
  product: AdministrativeProduct | null;
  onSaved: (product: AdministrativeProduct) => Promise<void>;
};

const emptyDetails: ProductDetails = {
  publicationStatus: "draft", productCode: "", description: "", components: [],
  image: "/editorial/products/lmb-f-001.jpeg", imageAlt: "", netContent: "150 g",
};

export default function AdminProductEditor({ product, onSaved }: Props) {
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(String(product?.price ?? 99));
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [badge, setBadge] = useState(product?.badge ?? "Producción");
  const [active, setActive] = useState(product?.active ?? false);
  const [details, setDetails] = useState<ProductDetails>(product?.details ?? emptyDetails);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const isDraft = !product || details.publicationStatus === "draft";

  function changeDetails(patch: Partial<ProductDetails>) {
    setDetails((current) => ({ ...current, ...patch }));
    setPreview(false);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
    if (details.components.length < 2) {
      setMessage("Selecciona de 2 a 6 ingredientes.");
      return;
    }
    if (action === "preview") { setPreview(true); setMessage(""); return; }
    const publishing = action === "publish";
    if (publishing && !preview) { setMessage("Revisa la vista previa antes de publicar."); return; }
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(product ? { expectedRevision: product.revision } : {}),
          name, category: "blends", price: Number(price), stock: Number(stock), badge: badge || null,
          active: publishing ? true : isDraft ? false : active,
          details: { ...details, publicationStatus: publishing || !isDraft ? "published" : "draft" },
        }),
      });
      if (response.status === 409) {
        setMessage(product
          ? "El catálogo cambió en otra sesión. Conservamos tus cambios; recarga los datos antes de guardar."
          : "Ese código ya existe. Elige otro código para este sazonador.");
        return;
      }
      if (!response.ok) {
        setMessage(response.status === 401 || response.status === 403
          ? "Tu sesión no tiene acceso de administrador. Vuelve a entrar."
          : "No pudimos guardar el producto. Revisa los datos e intenta de nuevo.");
        return;
      }
      const result = await response.json() as { data: AdministrativeProduct };
      await onSaved(result.data);
    } catch {
      setMessage("No pudimos confirmar el guardado. Recarga el catálogo antes de reintentar para evitar duplicados.");
    } finally { setSaving(false); }
  }

  return <form onSubmit={save} data-testid="admin-product-form" onChange={() => setPreview(false)}>
    <h3>{product ? `Editar producto #${product.id}` : "Nuevo sazonador"}</h3>
    <p>{isDraft ? "Borrador privado: no aparece en la tienda ni en el laboratorio." : "Publicado: sus cambios también actualizan la ficha pública del laboratorio."}</p>
    {message && <p role="alert">{message}</p>}
    <fieldset disabled={saving} className="admin-product-fields">
      <label>Nombre del producto<input required minLength={3} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>Código del sazonador<input required pattern="LMB-F-[0-9]{3}" placeholder="LMB-F-005" readOnly={Boolean(product)} value={details.productCode} onChange={(event) => changeDetails({ productCode: event.target.value })} /></label>
      <label>Descripción del sazonador<textarea required minLength={3} maxLength={1000} value={details.description} onChange={(event) => changeDetails({ description: event.target.value })} /></label>
      <label>Contenido neto<input required maxLength={40} value={details.netContent} onChange={(event) => changeDetails({ netContent: event.target.value })} /></label>
      <label>Imagen del producto<select value={details.image} onChange={(event) => changeDetails({ image: event.target.value })}>
        {!Array.from({ length: 4 }, (_, index) => `/editorial/products/lmb-f-00${index + 1}.jpeg`).includes(details.image) && <option value={details.image}>Imagen actual</option>}
        {["Multiuso", "Res", "Cerdo", "Pollo"].map((label, index) => <option key={label} value={`/editorial/products/lmb-f-00${index + 1}.jpeg`}>{label} · imagen existente</option>)}
      </select></label>
      <p>Solo se reutilizan imágenes existentes. Verifica que la etiqueta corresponda al producto; la carga de imágenes nuevas aún no está disponible.</p>
      <label>Descripción de la imagen<input required minLength={3} maxLength={200} value={details.imageAlt} onChange={(event) => changeDetails({ imageAlt: event.target.value })} /></label>
      <fieldset className="admin-ingredient-picker"><legend>Ingredientes ({details.components.length}/6)</legend>
        {ingredients.map((ingredient) => {
          const selected = details.components.some((item) => item.id === ingredient.id);
          return <label className="checkbox" key={ingredient.id}><input type="checkbox" checked={selected} disabled={!selected && details.components.length >= 6} onChange={() => changeDetails({ components: selected ? details.components.filter((item) => item.id !== ingredient.id) : [...details.components, { id: ingredient.id, nombre: ingredient.nombre, familia: ingredient.familia }] })} />{ingredient.nombre}</label>;
        })}
      </fieldset>
      <p>Orden de declaración: {details.components.map((item) => item.nombre).join(" · ") || "Sin ingredientes"}. Se conserva el orden de selección.</p>
      <label>Precio en MXN<input type="number" min="1" max="1000000" step="1" required value={price} onChange={(event) => setPrice(event.target.value)} /></label>
      <label>Existencias disponibles<input type="number" min="0" max="1000000" step="1" required value={stock} onChange={(event) => setStock(event.target.value)} /></label>
      <label>Distintivo<input maxLength={40} value={badge} onChange={(event) => setBadge(event.target.value)} /></label>
      {!isDraft && <label className="checkbox"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />Producto visible en la tienda.</label>}
      {!isDraft && <p>Desmarcar la visibilidad archiva el producto, pero conserva su ficha pública y el historial.</p>}
      <div className="admin-blend-actions">
        <button className="button button-quiet" type="submit" value="preview">Vista previa</button>
        <button className="button button-primary" type="submit" value="save">{isDraft ? "Guardar borrador" : "Guardar producto"}</button>
        {isDraft && <button className="button button-primary" type="submit" value="publish" disabled={!preview}>Publicar en tienda y laboratorio</button>}
      </div>
    </fieldset>
    {saving && <p>Guardando...</p>}
    {preview && <article className="admin-product-preview" data-testid="admin-product-preview" aria-label="Vista previa del sazonador">
      <Image src={details.image} alt={details.imageAlt} width={280} height={240} unoptimized />
      <h4>{name}</h4><strong>{details.productCode} · ${price} MXN · {details.netContent}</strong>
      <p>{details.description}</p><p>{details.components.map((item) => item.nombre).join(" · ")}</p>
      <p>{Number(stock) > 0 ? `${stock} unidades disponibles` : "Agotado"}</p>
      <p>La ficha del laboratorio compartirá estos datos. No se publican proporciones de fabricación.</p>
    </article>}
  </form>;
}
