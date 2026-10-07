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
  { document: "016", title: "Por qué algunos sazonadores se desprenden", image: "/editorial/almanac/page-016.jpeg", alt: "Infografía sobre adhesión del sazonador y condiciones de la superficie", width: 1254, height: 1254 },
  { document: "017", title: "Cómo construir un sazonador base", image: "/editorial/almanac/page-017.jpeg", alt: "Infografía sobre estructura, proporciones de referencia y mezcla de un sazonador base", width: 1254, height: 1254 },
  { document: "018", title: "Qué pasa cuando aumentas la sal 10 %", image: "/editorial/almanac/page-018.jpeg", alt: "Infografía comparativa de variaciones en la cantidad de sal", width: 1254, height: 1254 },
  { document: "019", title: "Qué pasa cuando aumentas la pimienta", image: "/editorial/almanac/page-019.jpeg", alt: "Infografía sobre cantidad y molienda de pimienta en un sazonador", width: 1254, height: 1254 },
  { document: "020", title: "Umami en la carne", image: "/editorial/almanac/page-020.jpeg", alt: "Infografía sobre umami y su incorporación en un sazonador", width: 1254, height: 1254 },
  { document: "021", title: "Cómo incorporar café a un sazonador", image: "/editorial/almanac/page-021.jpeg", alt: "Infografía sobre tostado, molienda y proporción de café en mezclas secas", width: 1254, height: 1254 },
  { document: "022", title: "Café claro vs. medio vs. oscuro en carne", image: "/editorial/almanac/page-022.jpeg", alt: "Infografía comparativa de tres niveles de tostado de café para carne", width: 1254, height: 1254 },
  { document: "023", title: "¿Puede un ingrediente estar presente sin saber a él?", image: "/editorial/almanac/page-023.jpeg", alt: "Infografía sobre ingredientes que aportan sabor sin ser protagonistas", width: 1254, height: 1254 },
  { document: "024", title: "Cómo hacer una prueba A/B de un sazonador", image: "/editorial/almanac/page-024.jpeg", alt: "Infografía sobre comparación de muestras, control de variables y registro de resultados", width: 1254, height: 1254 },
  { document: "025", title: "Chiles mexicanos en sazonadores", image: "/editorial/almanac/page-025.jpeg", alt: "Infografía: Chiles mexicanos en sazonadores", width: 1254, height: 1254 },
  { document: "026", title: "El ajo y cómo usarlo en sazonadores", image: "/editorial/almanac/page-026.jpeg", alt: "Infografía: El ajo y cómo usarlo en sazonadores", width: 1254, height: 1254 },
  { document: "027", title: "Uso de aromáticos en un sazonador", image: "/editorial/almanac/page-027.jpeg", alt: "Infografía: Uso de aromáticos en un sazonador", width: 1254, height: 1254 },
  { document: "028", title: "Tipos de asador", image: "/editorial/almanac/page-028.jpeg", alt: "Infografía: Tipos de asador", width: 1254, height: 1254 },
  { document: "029", title: "Tipos de ahumador", image: "/editorial/almanac/page-029.jpeg", alt: "Infografía: Tipos de ahumador", width: 1254, height: 1254 },
  { document: "030", title: "Tipos de humo", image: "/editorial/almanac/page-030.jpeg", alt: "Infografía: Tipos de humo", width: 1254, height: 1254 },
  { document: "031", title: "El dulce", image: "/editorial/almanac/page-031.jpeg", alt: "Infografía: El dulce", width: 1254, height: 1254 },
  { document: "032", title: "El salado", image: "/editorial/almanac/page-032.jpeg", alt: "Infografía: El salado", width: 1254, height: 1254 },
  { document: "033", title: "El ácido", image: "/editorial/almanac/page-033.jpeg", alt: "Infografía: El ácido", width: 1254, height: 1254 },
  { document: "034", title: "El amargo", image: "/editorial/almanac/page-034.jpeg", alt: "Infografía: El amargo", width: 1254, height: 1254 },
  { document: "035", title: "El umami", image: "/editorial/almanac/page-035.jpeg", alt: "Infografía: El umami", width: 1254, height: 1254 },
  { document: "036", title: "Los 5 sabores", image: "/editorial/almanac/page-036.jpeg", alt: "Infografía: Los 5 sabores", width: 1254, height: 1254 },
  { document: "037", title: "Anatomía de un corte de carne", image: "/editorial/almanac/page-037.jpeg", alt: "Infografía: Anatomía de un corte de carne", width: 1254, height: 1254 },
  { document: "038", title: "Grasa intramuscular vs. grasa externa", image: "/editorial/almanac/page-038.jpeg", alt: "Infografía: Grasa intramuscular vs. grasa externa", width: 1254, height: 1254 },
  { document: "039", title: "Marmoleo", image: "/editorial/almanac/page-039.jpeg", alt: "Infografía: Marmoleo", width: 1254, height: 1254 },
  { document: "040", title: "Fibras musculares", image: "/editorial/almanac/page-040.jpeg", alt: "Infografía: Fibras musculares", width: 1254, height: 1254 },
  { document: "041", title: "Tejido conectivo", image: "/editorial/almanac/page-041.jpeg", alt: "Infografía: Tejido conectivo", width: 1254, height: 1254 },
  { document: "042", title: "Cortes gruesos vs. cortes delgados", image: "/editorial/almanac/page-042.jpeg", alt: "Infografía: Cortes gruesos vs. cortes delgados", width: 1254, height: 1254 },
  { document: "043", title: "Cortes para fuego directo", image: "/editorial/almanac/page-043.jpeg", alt: "Infografía: Cortes para fuego directo", width: 1254, height: 1254 },
  { document: "044", title: "Cortes enteros para fuego indirecto", image: "/editorial/almanac/page-044.jpeg", alt: "Infografía: Cortes enteros para fuego indirecto", width: 1254, height: 1254 },
  { document: "045", title: "Cortes para cocción prolongada", image: "/editorial/almanac/page-045.jpeg", alt: "Infografía: Cortes para cocción prolongada", width: 1254, height: 1254 },
  { document: "046", title: "Cómo elegir un corte de res", image: "/editorial/almanac/page-046.jpeg", alt: "Infografía: Cómo elegir un corte de res", width: 1254, height: 1254 },
  { document: "047", title: "Res: cortes y aplicaciones", image: "/editorial/almanac/page-047.jpeg", alt: "Infografía: Res: cortes y aplicaciones", width: 1254, height: 1254 },
  { document: "048", title: "Cerdo: cortes y aplicaciones", image: "/editorial/almanac/page-048.jpeg", alt: "Infografía: Cerdo: cortes y aplicaciones", width: 1254, height: 1254 },
  { document: "050", title: "Cerdo: grasa, colágeno y temperatura", image: "/editorial/almanac/page-050.jpeg", alt: "Infografía: Cerdo: grasa, colágeno y temperatura", width: 1254, height: 1254 },
  { document: "051", title: "Cordero: cortes y perfiles de sabor", image: "/editorial/almanac/page-051.jpeg", alt: "Infografía: Cordero: cortes y perfiles de sabor", width: 1254, height: 1254 },
  { document: "052", title: "Pescado en la parrilla", image: "/editorial/almanac/page-052.jpeg", alt: "Infografía: Pescado en la parrilla", width: 1254, height: 1254 },
  { document: "053", title: "Proteínas vegetales a la parrilla", image: "/editorial/almanac/page-053.jpeg", alt: "Infografía: Proteínas vegetales a la parrilla", width: 1254, height: 1254 },
  { document: "054", title: "Cómo elegir proteína según el método de cocción", image: "/editorial/almanac/page-054.jpeg", alt: "Infografía: Cómo elegir proteína según el método de cocción", width: 1254, height: 1254 },
];

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
        <small>{almanacPages.length} notas de campo</small>
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

            <aside className="almanac-editorial-note" aria-label="Nota editorial">
              {currentPage?.document === "050"
                ? <>Seguridad: cocina cortes enteros de cerdo a 63 °C internos y deja reposar 3 minutos; cerdo molido, a 71 °C. Los rangos inferiores ilustrados no sustituyen esta recomendación. <a href="https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart" target="_blank" rel="noreferrer">Referencia: USDA.</a></>
                : currentPage?.document === "052"
                ? <>Seguridad: la referencia para pescado es 63 °C internos. Los rangos inferiores de esta lámina describen puntos culinarios, no una garantía de seguridad. <a href="https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart" target="_blank" rel="noreferrer">Referencia: USDA.</a></>
                : currentPage && Number(currentPage.document) >= 31 && Number(currentPage.document) <= 36
                ? <>Original de archivo: los sabores no corresponden a zonas exclusivas de la lengua. Los porcentajes de la lámina 036 no son una fórmula validada. <a href="https://www.nidcd.nih.gov/sites/default/files/Documents/order/taste-disorders.pdf" target="_blank" rel="noreferrer">Referencia: NIDCD.</a></>
                : <>Láminas originales de archivo. Los tiempos y puntos de cocción ilustrados no sustituyen una guía de seguridad alimentaria ni el manual del equipo. <a href="https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart" target="_blank" rel="noreferrer">Consultar temperaturas seguras.</a></>}
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
        </div>
      )}
    </>
  );
}
