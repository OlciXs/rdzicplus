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
  // B-11: art. 61 ust. 1 pkt 2 u.z. — ZUS wypłaca ZAWSZE tym kategoriom:
  //  b) osoby prowadzące pozarolniczą działalność i osoby z nimi współpracujące,
  //  c) duchowni,
  //  d) osoby uprawnione do zasiłków za okres po ustaniu ubezpieczenia.
  //  (pkt a — płatnik ≤ 20 ubezpieczonych — obsługuje gałąź niżej)
  const zawszeZUS = ["dg", "wspolpraca", "duchowny", "marynarz", "poUstaniu"];
  const kto = zawszeZUS.includes(status) ? "ZUS" : duzyPlatnik ? "PLATNIK" : "ZUS";
  return { kto, duzyPlatnik };
}
