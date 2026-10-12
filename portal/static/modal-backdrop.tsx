import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

/** Native modality keeps keyboard and pointer input out of the background. */
export default function ModalBackdrop({ className, labelledBy, onClose, returnFocus, children }: {
  className: string; labelledBy: string; onClose: () => void; children: ReactNode;
  returnFocus?: RefObject<HTMLElement | null>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const element = dialog.current!;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      const target = returnFocus?.current ?? trigger;
      if (target?.isConnected) target.focus({ preventScroll: true });
    };
  }, [returnFocus]);
  // Close after the pointer's default focus change, not during mousedown:
  // otherwise the remaining click sequence can overwrite trigger restoration.
  return createPortal(
    <dialog ref={dialog} className={className} aria-labelledby={labelledBy}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      {children}
    </dialog>, document.body,
  );
}
