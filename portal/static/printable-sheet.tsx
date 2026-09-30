import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./product-sheet.css";

export default function PrintableSheet({ titleId, closeLabel, children, onClose }: {
  titleId: string; closeLabel: string; children: ReactNode; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const element = dialog.current!;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, []);
  return createPortal(
    <dialog ref={dialog} className="product-sheet" aria-labelledby={titleId}
      onCancel={onClose} onClick={event => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}>
      <div className="product-sheet-toolbar" aria-label="Acciones de la ficha">
        <button className="button button-primary" type="button" onClick={() => window.print()}>Imprimir ficha</button>
        <button className="product-sheet-close" type="button" onClick={onClose} aria-label={closeLabel} autoFocus>×</button>
      </div>
      {children}
    </dialog>, document.body,
  );
}
