/* =====================================================================
   Parametry i formatowanie dla UI kalkulatorów.
   Wszystkie liczby z przepisów i obliczenia są w silniku: src/engine/
   (parametry: src/engine/params.js). Ten plik tylko je udostępnia
   komponentom i formatuje wyniki (zł, tygodnie, daty).
   ===================================================================== */
import { mergeParams } from "../engine/index.js";

// Parametry, z którymi liczą kalkulatory: wartości domyślne + zmiany z panelu admina.
// Obiekt jest współdzielony, więc applyParams() zmienia wynik wszystkich kalkulatorów.
export const CFG = mergeParams();

export function applyParams(overrides) {
  Object.assign(CFG, mergeParams(overrides));
}

// Pobiera zmiany parametrów z backendu (GET /api/params). Bez backendu – wartości domyślne.
export async function loadParams() {
  try {
    const res = await fetch("/api/params");
    if (res.ok) applyParams((await res.json()).overrides);
  } catch {
    /* brak połączenia – zostają wartości domyślne */
  }
}

/* ---------- parsowanie i formatowanie ---------- */
export const num = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export const zl = (v) => {
  const n = Math.round((v + Number.EPSILON) * 100) / 100;
  const neg = n < 0;
  const [i, f] = Math.abs(n).toFixed(2).split(".");
  const grouped = i.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (neg ? "-" : "") + grouped + "," + f + " zł";
};

export const tyg = (v) => {
  // tygodnie mogą być ułamkowe - format "12,5 tyg."
  const n = Math.round((v + Number.EPSILON) * 100) / 100;
  return String(n).replace(".", ",") + " tyg.";
};

export const fmtD = (d) => (d ? d.toLocaleDateString("pl-PL") : "-");
