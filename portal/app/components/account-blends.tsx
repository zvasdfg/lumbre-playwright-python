"use client";

import { useEffect, useState } from "react";

export type AccountBlend = {
  id: string;
  title: string;
  objective: string;
  status: "draft" | "submitted" | "published" | "rejected" | "archived";
  protocol: {
    componentes: Array<{ id: string; nombre: string; familia: string }>;
  };
  moderationNote: string | null;
  publishedHypothesisId: string | null;
  updatedAt: string;
};

const statusLabels: Record<AccountBlend["status"], string> = {
  draft: "Borrador privado",
  submitted: "En revisión",
  published: "Publicado",
  rejected: "Requiere cambios",
  archived: "Archivado",
};

export default function AccountBlends() {
  const [blends, setBlends] = useState<AccountBlend[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadInitialBlends() {
      try {
        const response = await fetch("/api/account/blends", { signal: controller.signal });
        if (!response.ok) throw new Error("Account blends could not be loaded");
        const result = (await response.json()) as { data: AccountBlend[] };
        setBlends(result.data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setMessage("No pudimos consultar tus blends.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadInitialBlends();
    return () => controller.abort();
  }, []);

  async function submitBlend(blend: AccountBlend) {
    setWorkingId(blend.id);
    setMessage("");
    try {
      const response = await fetch(`/api/account/blends/${blend.id}/submit`, { method: "POST" });
      if (!response.ok) throw new Error(`Blend submission failed with ${response.status}`);
      const result = (await response.json()) as { data: AccountBlend };
      setBlends((current) => current.map((item) => item.id === blend.id ? result.data : item));
      setMessage("Tu blend fue enviado a revisión.");
    } catch (error) {
      console.error("The blend could not be submitted", error);
      setMessage("No pudimos enviar el blend a revisión.");
    } finally {
      setWorkingId(null);
    }
  }

  async function archiveBlend(blend: AccountBlend) {
    setWorkingId(blend.id);
    setMessage("");
    try {
      const response = await fetch(`/api/account/blends/${blend.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Blend archive failed with ${response.status}`);
      setBlends((current) => current.filter((item) => item.id !== blend.id));
      setMessage("El blend fue retirado de tu archivo.");
    } catch (error) {
      console.error("The blend could not be archived", error);
      setMessage("No pudimos retirar el blend.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <section className="account-blends" data-testid="account-blends" aria-labelledby="account-blends-title">
      <div className="account-blends-heading">
        <div>
          <p className="section-index">ARCHIVO PERSONAL</p>
          <h3 id="account-blends-title">Mis blends</h3>
        </div>
        <span>{blends.length}</span>
      </div>
      <p className="account-blends-intro">
        Tus borradores son privados. Sólo aparecen en el laboratorio público después de una revisión.
      </p>
      {message && <p className="account-blends-message" role="status">{message}</p>}
      {loading ? <p role="status">Consultando tus mezclas...</p> : blends.length === 0 ? (
        <p className="account-blends-empty">Todavía no has guardado ningún blend.</p>
      ) : (
        <div className="account-blends-list">
          {blends.map((blend) => (
            <article key={blend.id} data-blend-id={blend.id}>
              <div>
                <span className={`blend-status blend-status-${blend.status}`}>
                  {statusLabels[blend.status]}
                </span>
                <h4>{blend.title}</h4>
                <p>{blend.objective}</p>
                <small>{blend.protocol.componentes.map((component) => component.nombre).join(" · ")}</small>
                {blend.publishedHypothesisId && <a href="#hipotesis">Ficha {blend.publishedHypothesisId}</a>}
                {blend.moderationNote && <em>{blend.moderationNote}</em>}
              </div>
              <div className="account-blend-actions">
                {(blend.status === "draft" || blend.status === "rejected") && (
                  <button type="button" disabled={workingId === blend.id} onClick={() => void submitBlend(blend)}>
                    Solicitar publicación
                  </button>
                )}
                {blend.status !== "submitted" && (
                  <button type="button" disabled={workingId === blend.id} onClick={() => void archiveBlend(blend)}>
                    Retirar
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
