// g) Kto wypłaca zasiłki: płatnik składek czy ZUS (UZ art. 61).
import { DEFAULT_PARAMS } from "./params.js";

/**
 * @param {object} input
 * @param {"pracownik"|"zlecenie"|"dg"} input.status
 * @param {number} input.liczbaUbezpieczonych  zgłoszonych do chorobowego (stan na 30 XI poprzedniego roku)
 * @returns {{ kto: "PLATNIK"|"ZUS", duzyPlatnik: boolean }}
 */
export function ktoWyplaca({ status = "pracownik", liczbaUbezpieczonych = 0 }, P = DEFAULT_PARAMS) {
  const duzyPlatnik = liczbaUbezpieczonych > P.progPlatnika;
  // Przedsiębiorca zawsze składa do ZUS; pracownik i zleceniobiorca – zależnie od wielkości płatnika.
  const kto = status === "dg" ? "ZUS" : duzyPlatnik ? "PLATNIK" : "ZUS";
  return { kto, duzyPlatnik };
}
