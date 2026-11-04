"use client";

import Image from "./image";
import { useCallback, useEffect, useRef, useState } from "react";
import ModalBackdrop from "./modal-backdrop";

import almanacPages from "../data/almanac-pages.json";

export default function FireAlmanac({ initiallyOpen = false }: { initiallyOpen?: boolean } = {}) {
  const [open, setOpen] = useState(initiallyOpen);
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
  }, []);

  const goToPage = useCallback((nextPage: number) => {
    const resolvedPage = Math.min(Math.max(nextPage, 0), lastPageIndex);
    setDirection(resolvedPage < pageIndex ? "backward" : "forward");
    setPageIndex(resolvedPage);
    setZoomed(false);
  }, [pageIndex, lastPageIndex]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") goToPage(pageIndex - 1);
      if (event.key === "ArrowRight") goToPage(pageIndex + 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
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
        <small>{almanacPages.length} notas de campo</small>
      </button>

      {open && (
        <ModalBackdrop
          className="almanac-backdrop"
          labelledBy="almanac-title"
          onClose={closeAlmanac}
          returnFocus={triggerRef}
        >
          <section
            className="almanac-reader"
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
                    <option key={page.image} value={index + 1}>
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

            <aside className="almanac-editorial-note" aria-label="Nota editorial">
              {currentPage?.document === "049"
                ? <>Seguridad: cocina tanto pechuga como muslo de pollo a 74 °C internos, medidos con termómetro. El rango de 68–72 °C de la pechuga en el original no sustituye esta recomendación. <a href="https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures" target="_blank" rel="noreferrer">Referencia: FoodSafety.gov.</a></>
                : currentPage?.document === "050"
                ? <>Seguridad: cocina cortes enteros de cerdo a 63 °C internos y deja reposar 3 minutos; cerdo molido, a 71 °C. Los rangos inferiores ilustrados no sustituyen esta recomendación. <a href="https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart" target="_blank" rel="noreferrer">Referencia: USDA.</a></>
                : currentPage?.document === "052"
                ? <>Seguridad: la referencia para pescado es 63 °C internos. Los rangos inferiores de esta lámina describen puntos culinarios, no una garantía de seguridad. <a href="https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart" target="_blank" rel="noreferrer">Referencia: USDA.</a></>
                : currentPage?.document === "058"
                ? <>Higiene: usa tablas separadas para alimentos crudos y listos para comer. Cambiar de cara no sustituye lavar la tabla y los utensilios entre usos. <a href="https://www.foodsafety.gov/keep-food-safe/4-steps-to-food-safety" target="_blank" rel="noreferrer">Referencia: FoodSafety.gov.</a></>
                : currentPage?.image.endsWith("page-059-cepillo.jpeg")
                ? <>Seguridad: no apliques la indicación de 200–300 °C a todos los cepillos. Usa cada material a la temperatura indicada por su fabricante; el nylon para limpieza en frío no se usa sobre una parrilla caliente. Revisa que no queden cerdas sueltas antes de cocinar. <a href="https://www.charbroil.com/products/cool-clean-360-brush-9025161" target="_blank" rel="noreferrer">Consultar uso del nylon.</a></>
                : currentPage && ["060", "061", "081", "082", "086"].includes(currentPage.document)
                ? <>Seguridad: el color y los puntos culinarios ilustrados no garantizan inocuidad. Como referencia doméstica: cortes enteros de res, cerdo y cordero, 63 °C y 3 minutos de reposo; carne molida, 71 °C; aves, 74 °C; pescado, 63 °C. Comprueba con termómetro. <a href="https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures" target="_blank" rel="noreferrer">Consultar temperaturas seguras.</a></>
                : currentPage?.document === "074"
                ? <>Seguridad: refrigera los sobrantes antes de 2 horas; antes de 1 hora si el ambiente supera 32 °C. Consúmelos refrigerados en 3–4 días y recaliéntalos a 74 °C internos. El olor o el color no bastan para confirmar seguridad. <a href="https://ask.fsis.usda.gov/article/How-do-I-handle-leftovers-safely" target="_blank" rel="noreferrer">Referencia: USDA.</a></>
                : currentPage && Number(currentPage.document) >= 31 && Number(currentPage.document) <= 36
                ? <>Original de archivo: los sabores no corresponden a zonas exclusivas de la lengua. Los porcentajes de la lámina 036 no son una fórmula validada. <a href="https://www.nidcd.nih.gov/sites/default/files/Documents/order/taste-disorders.pdf" target="_blank" rel="noreferrer">Referencia: NIDCD.</a></>
                : <>Láminas originales de archivo. Los tiempos y puntos de cocción ilustrados no sustituyen una guía de seguridad alimentaria ni el manual del equipo. <a href="https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart" target="_blank" rel="noreferrer">Consultar temperaturas seguras.</a></>}
              {currentPage?.document === "059" && <span> Numeración de archivo: existen dos originales distintos con el número 059, sartén y cepillo; ambos se conservan en el índice.</span>}
            </aside>

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
                        <span>{almanacPages.length} notas técnicas para observar, encender y cocinar con intención.</span>
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
        </ModalBackdrop>
      )}
    </>
  );
}
