"use client";

import { FormEvent, useEffect, useState } from "react";

type Preferences = {
  preferredFuel: "carbon" | "briquetas" | "lena";
  equipment: "kettle" | "abierta" | "ahumador";
  cookingStyle: "directo" | "dos_zonas" | "lento";
  defaultGuests: number;
  newsletterConsent: boolean;
};

const initialPreferences: Preferences = {
  preferredFuel: "carbon",
  equipment: "kettle",
  cookingStyle: "directo",
  defaultGuests: 6,
  newsletterConsent: false,
};

function editablePreferences(data: Preferences): Preferences {
  return {
    preferredFuel: data.preferredFuel,
    equipment: data.equipment,
    cookingStyle: data.cookingStyle,
    defaultGuests: data.defaultGuests,
    newsletterConsent: data.newsletterConsent,
  };
}

export default function AccountPreferences() {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadPreferences() {
      try {
        const response = await fetch("/api/account/preferences", { signal: controller.signal });
        if (!response.ok) throw new Error(`Preference request failed with ${response.status}`);
        const result = (await response.json()) as { data: Preferences };
        setPreferences(editablePreferences(result.data));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Membership preferences could not be loaded", error);
          setMessage("No pudimos cargar tus preferencias.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadPreferences();
    return () => controller.abort();
  }, []);

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editablePreferences(preferences)),
      });
      if (!response.ok) throw new Error(`Preference save failed with ${response.status}`);
      const result = (await response.json()) as { data: Preferences };
      setPreferences(editablePreferences(result.data));
      setMessage("Tus preferencias quedaron guardadas.");
    } catch (error) {
      console.error("Membership preferences could not be saved", error);
      setMessage("No pudimos guardar tus preferencias. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="account-preferences" data-testid="membership-preferences" aria-labelledby="preference-title">
      <h3 id="preference-title">Tu forma de cocinar</h3>
      <p>Ajusta el punto de partida para futuras experiencias Lumbre.</p>
      <form onSubmit={savePreferences}>
        <label>Combustible favorito<select value={preferences.preferredFuel} onChange={(event) => setPreferences((current) => ({ ...current, preferredFuel: event.target.value as Preferences["preferredFuel"] }))}><option value="carbon">Carbón vegetal</option><option value="briquetas">Briquetas</option><option value="lena">Leña seca</option></select></label>
        <label>Equipo habitual<select value={preferences.equipment} onChange={(event) => setPreferences((current) => ({ ...current, equipment: event.target.value as Preferences["equipment"] }))}><option value="kettle">Parrilla con tapa</option><option value="abierta">Parrilla abierta</option><option value="ahumador">Ahumador</option></select></label>
        <label>Estilo de cocción favorito<select value={preferences.cookingStyle} onChange={(event) => setPreferences((current) => ({ ...current, cookingStyle: event.target.value as Preferences["cookingStyle"] }))}><option value="directo">Fuego directo</option><option value="dos_zonas">Dos zonas</option><option value="lento">Lento y ahumado</option></select></label>
        <label>Personas habituales<input type="number" min="2" max="30" value={preferences.defaultGuests} onChange={(event) => setPreferences((current) => ({ ...current, defaultGuests: Number(event.target.value) }))} required /></label>
        <label className="checkbox"><input type="checkbox" checked={preferences.newsletterConsent} onChange={(event) => setPreferences((current) => ({ ...current, newsletterConsent: event.target.checked }))} /> Recibir novedades del club por correo.</label>
        <button className="button button-primary" type="submit" disabled={loading || saving}>{saving ? "Guardando..." : loading ? "Cargando..." : "Guardar preferencias"}</button>
      </form>
      {message && <p className="preference-message" role="status">{message}</p>}
    </section>
  );
}
