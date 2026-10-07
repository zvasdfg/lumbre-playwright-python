import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from "react";

const IngredientLab = lazy(() => import("./ingredient-lab"));
const labHashes = new Set(["#laboratorio", "#hipotesis"]);

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
      <button type="button" onClick={() => window.location.reload()}>Recargar página</button>
    </section>;
    return this.props.children;
  }
}

function LoadedLab() {
  useEffect(() => {
    // Restore deep links once the asynchronous section has committed its anchors.
    if (labHashes.has(window.location.hash)) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    }
  }, []);
  return <IngredientLab />;
}

export default function DeferredLab() {
  const host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(() => labHashes.has(window.location.hash));
  useEffect(() => {
    if (active) return;
    const onHash = () => { if (labHashes.has(window.location.hash)) setActive(true); };
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
