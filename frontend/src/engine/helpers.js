// Wspólne, czyste funkcje silnika. Bez Reacta i bez formatowania tekstu.
import { DEFAULT_PARAMS } from "./params.js";

const DAY_MS = 86400000;

/** Kwota zasiłku: podstawa miesięczna / 30 × stawka% × liczba dni (UZ art. 36 ust. 3). */
export const zasilek = (podstawaMies, stawka, dni, P = DEFAULT_PARAMS) =>
  (podstawaMies / P.dniMiesiaca) * (stawka / 100) * dni;

/** Wymiar urlopu macierzyńskiego (tygodnie) wg liczby dzieci przy jednym porodzie (KP art. 180 § 1). */
export const tygodnieMac = (dzieci, P = DEFAULT_PARAMS) =>
  P.tygodnieMacierzynski[Math.min(Math.max(dzieci, 1), 5)];

/** Wymiar urlopu rodzicielskiego (tygodnie): 41/43, z „Za życiem” 65/67 (KP art. 182¹a).
 *  `przyjete` = 62 tyg. przysługuje WYŁĄCZNIE rodzinie zastępczej, która przyjęła dziecko
 *  w wieku do 14 lat (art. 183 § 4³ pkt 3 k.p.). Przy przysposobieniu „Za życiem” to 65/67 tyg.
 *  (art. 183 § 4⁴ k.p.) — B-06. */
export const tygodnieRodz = (dzieci, zaZyciem, przyjete, P = DEFAULT_PARAMS) => {
  const k = Math.min(Math.max(dzieci, 1), 2);
  if (!zaZyciem) {
    if (przyjete) return P.tygodnieRodzicielskiPrzyjete?.[k] ?? P.tygodnieRodzicielski[k];
    return P.tygodnieRodzicielski[k];
  }
  return przyjete ? P.tygodnieZaZyciem.przyjete : P.tygodnieZaZyciem[k];
};

/** Data z ISO stringa („2026-09-01”) albo Date; pusta wartość → null. */
export const toDate = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? new Date(v) : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/** Liczba dni kalendarzowych od `from` do `to` włącznie. */
export const daysInclusive = (from, to) => Math.round((to - from) / DAY_MS) + 1;

/** Wiek w latach (ułamkowy) w dniu `at`. */
export const ageYears = (birth, at) => (at - birth) / (365.25 * DAY_MS);
