"use client";

import { FormEvent, useState } from "react";

type CookingStyle = "directo" | "lento";

type FireRecommendation = {
  charcoalKg: number;
  summary: string;
};

type FirePlannerModalProps = {
  onClose: () => void;
};

export default function FirePlannerModal({ onClose }: FirePlannerModalProps) {
  const [guests, setGuests] = useState("6");
  const [cookingStyle, setCookingStyle] = useState<CookingStyle>("directo");
  const [durationHours, setDurationHours] = useState("2");
  const [includeVegetables, setIncludeVegetables] = useState(false);
  const [recommendation, setRecommendation] = useState<FireRecommendation | null>(null);

  function clearRecommendation() {
    setRecommendation(null);
  }

  function calculateFuel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const guestCount = Number(guests);
    const hours = Number(durationHours);
    const kilogramsPerGuest = cookingStyle === "directo" ? 0.5 : 0.8;
    const durationMultiplier = hours / 2;
    const vegetableReserve = includeVegetables ? 0.5 : 0;
    const charcoalKg = Math.max(
      2,
      Math.ceil(guestCount * kilogramsPerGuest * durationMultiplier + vegetableReserve),
    );
    const styleLabel = cookingStyle === "directo" ? "fuego directo" : "lento y ahumado";

    setRecommendation({
      charcoalKg,
      summary: `${styleLabel} para ${guestCount} personas durante ${hours} horas`,
    });
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="modal fire-planner-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fire-planner-title"
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar planificador">
          ×
        </button>
        <p className="section-index">PLANIFICADOR DE BRASAS</p>
        <h2 id="fire-planner-title">Calcula tu fuego.</h2>
        <p>Define el tamaño de la reunión y te ayudamos a preparar suficiente carbón.</p>

        <form onSubmit={calculateFuel}>
          <label>
            Personas
            <input
              name="guests"
              type="number"
              min="2"
              max="20"
              value={guests}
              onChange={(event) => {
                setGuests(event.target.value);
                clearRecommendation();
              }}
              required
              autoFocus
            />
          </label>

          <label>
            Tipo de cocción
            <select
              name="cookingStyle"
              value={cookingStyle}
              onChange={(event) => {
                setCookingStyle(event.target.value as CookingStyle);
                clearRecommendation();
              }}
            >
              <option value="directo">Fuego directo</option>
              <option value="lento">Lento y ahumado</option>
            </select>
          </label>

          <label>
            Duración estimada
            <select
              name="durationHours"
              value={durationHours}
              onChange={(event) => {
                setDurationHours(event.target.value);
                clearRecommendation();
              }}
            >
              <option value="2">2 horas</option>
              <option value="4">4 horas</option>
              <option value="6">6 horas</option>
            </select>
          </label>

          <label className="checkbox">
            <input
              name="includeVegetables"
              type="checkbox"
              checked={includeVegetables}
              onChange={(event) => {
                setIncludeVegetables(event.target.checked);
                clearRecommendation();
              }}
            />
            Incluir una reserva para vegetales
          </label>

          <button className="button button-primary" type="submit">
            Calcular combustible
          </button>
        </form>

        {recommendation && (
          <div className="planner-result" role="status" aria-label="Recomendación de combustible">
            <span>CARBÓN RECOMENDADO</span>
            <strong>{recommendation.charcoalKg} kg</strong>
            <p>Necesitarás aproximadamente {recommendation.charcoalKg} kg de carbón.</p>
            <small>{recommendation.summary}.</small>
          </div>
        )}
      </section>
    </div>
  );
}
