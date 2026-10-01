import PrintableSheet from "./printable-sheet";
import { productionProducts } from "../app/lib/production-products";
import { contributionLabels, productProfiles, tasteNames } from "./product-profiles";
import Image from "./image";
import "./product-sheet.css";

type Product = typeof productionProducts[number];
function radarPoint(index: number, radius: number) {
  const angle = -Math.PI / 2 + index * 2 * Math.PI / 5;
  return { x: 200 + Math.cos(angle) * radius, y: 180 + Math.sin(angle) * radius };
}
function radarPolygon(values: readonly number[]) {
  return values.map((value, index) => {
    const point = radarPoint(index, value * 60);
    return `${point.x},${point.y}`;
  }).join(" ");
}
export default function ProductSheet({ product, onClose, onBack }: { product: Product; onClose: () => void; onBack?: () => void }) {
  const profile = productProfiles[product.details.productCode];
  return (
    <PrintableSheet titleId="product-sheet-title" closeLabel="Cerrar ficha de producto" onClose={onClose} onBack={onBack}>
      <div className="product-sheet-intro">
        <Image src={product.details.image} alt={product.details.imageAlt} width={480} height={400} />
        <div>
          <p className="section-index">{product.details.productCode} · {product.details.netContent}</p>
          <h2 id="product-sheet-title">{product.name}</h2>
          <p className="product-sheet-style">{profile.style}</p>
          <p>{profile.description}</p>
          <p><strong>Ingredientes:</strong> {product.details.components.map(component => component.nombre).join(", ")}.</p>
          <strong>{new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(product.price)} MXN · Catálogo informativo</strong>
        </div>
      </div>
      <div className="product-sheet-body">
        <section><h3>¿Qué sabores esperar?</h3><p>{profile.expected}</p></section>
        <section className="taste-chart" aria-labelledby="taste-chart-title">
          <h3 id="taste-chart-title">Balance orientativo de los cinco sabores</h3>
          <p>Lectura cualitativa de los ingredientes, no una medición del producto. No conocemos las proporciones: la dosis, el alimento y la cocción cambian el resultado. La gráfica no representa porcentajes ni un rango ideal.</p>
          <svg className="taste-radar" viewBox="0 0 400 360" role="img" aria-labelledby="radar-title radar-description">
            <title id="radar-title">Perfil de cinco sabores de {product.name}</title>
            <desc id="radar-description">{tasteNames.map((taste, index) => `${taste}: ${contributionLabels[profile.tastes[index]]}`).join(". ")}. Centro: sin protagonismo previsto. Anillo intermedio: aporte secundario. Anillo exterior: aporte destacado.</desc>
            {[.5, 1, 1.5, 2].map(level => <polygon key={level} points={radarPolygon(Array(5).fill(level))} className="radar-grid" />)}
            {tasteNames.map((taste, index) => {
              const edge = radarPoint(index, 120);
              const label = radarPoint(index, 152);
              return <g key={taste}>
                <line x1="200" y1="180" x2={edge.x} y2={edge.y} className="radar-grid" />
                <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle">{taste}</text>
              </g>;
            })}
            <polygon points={radarPolygon(profile.tastes)} className="radar-profile" />
            {profile.tastes.map((value, index) => {
              const point = radarPoint(index, value * 60);
              return <circle key={tasteNames[index]} cx={point.x} cy={point.y} r="4" className="radar-point" />;
            })}
          </svg>
          <ul aria-label="Aportes de sabor estimados">
            {tasteNames.map((taste, index) => <li key={taste}>
              <strong>{taste}</strong>
              <span>{contributionLabels[profile.tastes[index]]}</span>
            </li>)}
          </ul>
          <p>{profile.rationale}</p>
          <small>Sin protagonismo previsto no significa ausencia química. Picor, aroma tostado y astringencia no son ejes de esta gráfica.</small>
        </section>
        <section><h3>¿Con qué combinarlo?</h3><p>Sugerencias culinarias por sus ingredientes; no son pruebas de desempeño del blend.</p>
          <ul className="product-pairings">{profile.pairings.map(pairing => <li key={pairing.food}><strong>{pairing.food}</strong><p>{pairing.reason}</p></li>)}</ul>
        </section>
        <section><h3>Al llevarlo al fuego</h3><p>{profile.cooking}</p></section>
        <details><summary>Cómo construimos esta ficha</summary>
          <p>Interpretación editorial de la etiqueta y de las fichas de ingredientes del laboratorio Lumbre. No se han proporcionado proporciones ni resultados de una cata de estos productos.</p>
          <p>Referencia complementaria: <a href="https://www.umamiinfo.com/what/tasting/make-use.html" target="_blank" rel="noreferrer">Centro de Información Umami: shiitake y compuestos del sabor umami</a>.</p>
        </details>
      </div>
    </PrintableSheet>
  );
}
