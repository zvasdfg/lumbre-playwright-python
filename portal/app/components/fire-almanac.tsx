"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type AlmanacPage = {
  document: string;
  title: string;
  image: string;
  alt: string;
  width: number;
  height: number;
};

const almanacPages: AlmanacPage[] = [
  { document: "001", title: "Prepara tu asador", image: "/editorial/almanac/page-001.jpeg", alt: "Infografía para preparar, limpiar y encender un asador", width: 1254, height: 1254 },
  { document: "002", title: "Selección de carbón", image: "/editorial/almanac/page-002.jpeg", alt: "Infografía comparativa de briquetas, carbón vegetal y quebracho", width: 1254, height: 1254 },
  { document: "003", title: "Método de encendido", image: "/editorial/almanac/page-003.jpeg", alt: "Infografía del método de encendido con chimenea", width: 1254, height: 1254 },
  { document: "004", title: "Distribución de carbón", image: "/editorial/almanac/page-004.jpeg", alt: "Infografía sobre fuego directo, indirecto y mixto", width: 1254, height: 1254 },
  { document: "005", title: "Control de temperatura", image: "/editorial/almanac/page-005.jpeg", alt: "Infografía sobre zonas de temperatura en la parrilla", width: 1254, height: 1254 },
  { document: "006", title: "Técnicas de sellado", image: "/editorial/almanac/page-006.jpeg", alt: "Infografía sobre temperatura y tiempos de sellado", width: 1254, height: 1254 },
  { document: "007", title: "Punto de cocción", image: "/editorial/almanac/page-007.jpeg", alt: "Infografía de temperaturas internas para distintos puntos de cocción", width: 1254, height: 1254 },
  { document: "008", title: "Reposo de la carne", image: "/editorial/almanac/page-008.jpeg", alt: "Infografía sobre tiempos y beneficios del reposo de la carne", width: 1254, height: 1254 },
  { document: "009", title: "Limpieza y mantenimiento", image: "/editorial/almanac/page-009.jpeg", alt: "Infografía de limpieza y mantenimiento del asador", width: 1254, height: 1254 },
  { document: "010", title: "Control de flama", image: "/editorial/almanac/page-010.jpeg", alt: "Infografía sobre ventilación y control de flama", width: 1254, height: 1254 },
  { document: "011", title: "Qué hace realmente la sal", image: "/editorial/almanac/page-011.jpeg", alt: "Infografía sobre cómo actúa la sal en la carne", width: 1145, height: 1374 },
  { document: "012", title: "Sal antes o después", image: "/editorial/almanac/page-012.jpeg", alt: "Infografía sobre cuándo salar antes, durante o después de la cocción", width: 1145, height: 1374 },
  { document: "013", title: "Pimienta antes vs. después", image: "/editorial/almanac/page-013.jpeg", alt: "Infografía comparativa del uso de pimienta antes y después de cocinar", width: 1145, height: 1374 },
  { document: "014", title: "El grano de pimienta", image: "/editorial/almanac/page-014.jpeg", alt: "Infografía sobre tipos, anatomía y molienda de la pimienta", width: 1145, height: 1374 },
  { document: "015", title: "Tamaño de partícula", image: "/editorial/almanac/page-015.jpeg", alt: "Infografía sobre tamaños de partícula en un sazonador", width: 1254, height: 1254 },
];

export default function FireAlmanac() {
  const [open, setOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [zoomed, setZoomed] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const currentPage = pageIndex > 0 ? almanacPages[pageIndex - 1] : null;
  const lastPageIndex = almanacPages.length;

  function openAlmanac() {
    setPageIndex(0);
    setDirection("forward");
    setZoomed(false);
    setOpen(true);
  }

  const closeAlmanac = useCallback(() => {
    setOpen(false);
    setZoomed(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const goToPage = useCallback((nextPage: number) => {
    const resolvedPage = Math.min(Math.max(nextPage, 0), lastPageIndex);
    setDirection(resolvedPage < pageIndex ? "backward" : "forward");
    setPageIndex(resolvedPage);
    setZoomed(false);
  }, [pageIndex, lastPageIndex]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAlmanac();
      if (event.key === "ArrowLeft") goToPage(pageIndex - 1);
      if (event.key === "ArrowRight") goToPage(pageIndex + 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeAlmanac, goToPage, open, pageIndex]);

  return (
    <>
      <button
        ref={triggerRef}
        className="almanac-trigger"
        type="button"
        onClick={openAlmanac}
        aria-haspopup="dialog"
      >
        <span aria-hidden="true">▤</span>
        <strong>Almanaque</strong>
        <small>15 notas de campo</small>
      </button>

      {open && (
        <div
          className="almanac-backdrop"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && closeAlmanac()}
        >
          <section
            className="almanac-reader"
            role="dialog"
            aria-modal="true"
            aria-labelledby="almanac-title"
          >
            <header className="almanac-toolbar">
              <div>
                <span>ARCHIVO LUMBRE / EDICIÓN 01</span>
                <strong id="almanac-title">Almanaque de fuego</strong>
              </div>
              <label>
                <span className="sr-only">Ir a una página del almanaque</span>
                <select
                  value={pageIndex}
                  onChange={(event) => goToPage(Number(event.target.value))}
                  aria-label="Ir a una página del almanaque"
                >
                  <option value={0}>Portada</option>
                  {almanacPages.map((page, index) => (
                    <option key={page.document} value={index + 1}>
                      {page.document} · {page.title}
                    </option>
                  ))}
                </select>
              </label>
              {currentPage && (
                <button
                  className="almanac-zoom"
                  type="button"
                  aria-pressed={zoomed}
                  onClick={() => setZoomed((current) => !current)}
                >
                  {zoomed ? "Ajustar página" : "Ampliar para leer"}
                </button>
              )}
              <button className="almanac-close" type="button" onClick={closeAlmanac} aria-label="Cerrar almanaque" autoFocus>×</button>
            </header>

            <div className={`almanac-book${zoomed ? " is-zoomed" : ""}`} data-testid="almanac-book">
              <button
                className="almanac-turn previous"
                type="button"
                disabled={pageIndex === 0}
                onClick={() => goToPage(pageIndex - 1)}
                aria-label="Página anterior"
              >
                <span aria-hidden="true">←</span><small>Anterior</small>
              </button>

              <div className="almanac-page-scroll">
                <article
                  key={pageIndex}
                  className={`almanac-sheet ${direction}`}
                  data-testid="almanac-page"
                  data-page={pageIndex}
                >
                  {currentPage ? (
                    <Image
                      src={currentPage.image}
                      alt={currentPage.alt}
                      width={currentPage.width}
                      height={currentPage.height}
                      sizes={zoomed ? `${currentPage.width}px` : "(max-width: 850px) 92vw, 76vw"}
                      priority={pageIndex === 1}
                      unoptimized
                    />
                  ) : (
                    <div className="almanac-cover">
                      <Image className="almanac-cover-art" src="/editorial/almanac/cover-art.png" alt="" fill priority sizes="(max-width: 850px) 90vw, 620px" />
                      <div className="almanac-cover-copy">
                        <Image src="/brand/lumbre-logo-primary.png" alt="Lumbre" width={90} height={96} unoptimized />
                        <p>EDICIÓN 01 · CUADERNO DE CAMPO</p>
                        <h2>Almanaque<br /><em>de fuego</em></h2>
                        <span>15 notas técnicas para observar, encender y cocinar con intención.</span>
                      </div>
                      <button type="button" onClick={() => goToPage(1)}>Abrir el almanaque <span aria-hidden="true">→</span></button>
                    </div>
                  )}
                </article>
              </div>

              <button
                className="almanac-turn next"
                type="button"
                disabled={pageIndex === lastPageIndex}
                onClick={() => goToPage(pageIndex + 1)}
                aria-label="Página siguiente"
              >
                <small>Siguiente</small><span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="almanac-progress">
              <span aria-live="polite" data-testid="almanac-page-status">
                {currentPage ? `DOC. ${currentPage.document} · ${currentPage.title}` : "PORTADA"}
              </span>
              <div aria-hidden="true"><i style={{ width: `${(pageIndex / lastPageIndex) * 100}%` }} /></div>
              <strong>{String(pageIndex).padStart(2, "0")} / {lastPageIndex}</strong>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
