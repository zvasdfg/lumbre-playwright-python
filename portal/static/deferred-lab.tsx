import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from "react";

const IngredientLab = lazy(async () => {
  try { return await import("./ingredient-lab"); }
  catch (error) {
    // WebKit can retain a failed module URL across reloads. Only after an
    // explicit recovery action, retry that same local build asset under a fresh URL.
    const retry = new URL(window.location.href).searchParams.get("lab_retry");
    if (retry && /^\d+$/.test(retry)) {
      for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel="modulepreload"]')) {
        const url = new URL(link.href);
        if (url.origin === window.location.origin && /^\/assets\/ingredient-lab-[\w-]+\.js$/.test(url.pathname)) {
          url.searchParams.set("retry", retry);
          return await import(/* @vite-ignore */ url.href);
        }
      }
    }
    throw error;
  }
});
const labHashes = new Set(["#laboratorio", "#hipotesis"]);
// Provisiones is below the lazy lab: its final position depends on the lab's height.
const layoutDependentHashes = new Set([...labHashes, "#tienda"]);

function Placeholder() {
  return <section id="laboratorio" className="lab-section" style={{ minHeight: 800 }} aria-busy="true">
    <p className="section-index">04 — LABORATORIO DE SABOR</p>
    <h2>Experimenta antes de encender.</h2>
    <p role="status">Cargando laboratorio…</p>
    <span id="hipotesis" />
  </section>;
}

class LoadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <section id="laboratorio" className="lab-section">
      <h2>Laboratorio de sabor</h2>
      <p role="alert">No se pudo cargar el laboratorio. Revisa tu conexión y recarga la página.</p>
      <button type="button" onClick={() => {
        const url = new URL(window.location.href);
        url.searchParams.set("lab_retry", String(Date.now()));
        window.location.replace(url.href);
      }}>Recargar página</button>
    </section>;
    return this.props.children;
  }
}

function LoadedLab() {
  useEffect(() => {
    // Re-align the current destination after replacing the shorter placeholder.
    // Read the current hash so a newer navigation is never sent back to the lab/shop.
    if (layoutDependentHashes.has(window.location.hash)) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    }
  }, []);
  return <IngredientLab />;
}

export default function DeferredLab() {
  const host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(() => layoutDependentHashes.has(window.location.hash));
  useEffect(() => {
    if (active) return;
    const onHash = () => { if (layoutDependentHashes.has(window.location.hash)) setActive(true); };
    window.addEventListener("hashchange", onHash);
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) setActive(true);
    }, { rootMargin: "400px" });
    if (observer && host.current) observer.observe(host.current);
    if (!observer) setActive(true);
    return () => { observer?.disconnect(); window.removeEventListener("hashchange", onHash); };
  }, [active]);
  return <div ref={host}><LoadBoundary><Suspense fallback={<Placeholder />}>
    {active ? <LoadedLab /> : <Placeholder />}
  </Suspense></LoadBoundary></div>;
}
