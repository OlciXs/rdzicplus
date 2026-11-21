/* =====================================================================
   Walidacja i normalizacja wejścia silnika (B-21..B-24).
   Silnik jest wołany z kilku miejsc: kalkulatory (React), warstwa wniosków,
   a w przyszłości REST API / import JSON / odczyt PDF. Bariera `num()`
   w calculators/config.js chroni tylko ścieżkę UI, więc walidację
   przenosimy DO SILNIKA — tuż przy wejściu każdej funkcji.

   Zasady:
   - kwota (pieniądze): musi być skończoną liczbą >= 0; inaczej 0,
   - liczba dni/tygodni: skończona, >= 0, całkowita w górę,
   - brak wartości (null / undefined / "") → 0 (nie NaN),
   - wartości ujemne dla kwot są odrzucane (art. 42 u.z. mówi o kwocie wypłaconej).
   ===================================================================== */

/** Skończona liczba albo `fallback` (domyślnie 0). Nigdy NaN/Infinity. */
export const liczbaBezpieczna = (v, fallback = 0) => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
};

/** Kwota pieniężna: skończona i >= 0. Wartości ujemne → 0 (B-22). */
export const kwota = (v) => {
  const n = liczbaBezpieczna(v, 0);
  return n > 0 ? n : 0;
};

/** Liczba całkowita >= 0 (dni, tygodnie, miesiące). Nie nadaje się do ułamków (np. etatu). */
export const liczbaDni = (v) => {
  const n = liczbaBezpieczna(v, 0);
  return n > 0 ? Math.ceil(n) : 0;
};

/** Liczba niecałkowita >= 0 (np. tygodnie ułamkowe) — bez zaokrąglania w górę. */
export const liczbaUlamek = (v) => {
  const n = liczbaBezpieczna(v, 0);
  return n > 0 ? n : 0;
};

/** Element listy kwot (np. miesiace) — każde wejście przepuszczone przez `kwota`. */
export const kwoty = (arr) => (Array.isArray(arr) ? arr.map(kwota) : []);

/** Współczynnik (np. etat): skończony, przycięty do [0, max]. */
export const wspolczynnik = (v, max = 1) => {
  const n = liczbaBezpieczna(v, 0);
  if (n <= 0) return 0;
  return Math.min(n, max);
};

/** Liczba dzieci przy jednym porodzie — sensowny zakres 1..5 (B-23). */
export const liczbaDzieciPorod = (v) => {
  const n = liczbaBezpieczna(v, 0);
  if (n <= 0) return 1;
  return Math.min(Math.ceil(n), 5);
};

/** Liczba dzieci przyjętych jednocześnie — zakres 1..5. */
export const liczbaDzieciPrzyjete = (v) => liczbaDzieciPorod(v);
