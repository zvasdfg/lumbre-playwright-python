import { lazy, Suspense, useState } from "react";
import AsyncBoundary from "./async-boundary";

const FireAlmanac = lazy(() => import("./fire-almanac"));

export default function DeferredAlmanac() {
  const [requested, setRequested] = useState(false);
  const trigger = <button className="almanac-trigger" type="button" aria-haspopup="dialog"
    aria-busy={requested} onClick={() => setRequested(true)}>
    <span aria-hidden="true">▤</span><strong>Almanaque</strong>
    <small>{requested ? "Cargando…" : "53 notas de campo"}</small>
  </button>;
  return <AsyncBoundary><Suspense fallback={trigger}>{requested ? <FireAlmanac initiallyOpen /> : trigger}</Suspense></AsyncBoundary>;
}
