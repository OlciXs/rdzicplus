/* =====================================================================
   Silnik obliczeń RodzicPlus – czyste funkcje, bez Reacta.
   Każda funkcja: (dane wejściowe, parametry) → wynik (liczby i flagi).
   Formatowanie (zł, daty, teksty dla użytkownika) robi UI.
   Testy: frontend/src/engine/engine.test.js  (npm test)
   ===================================================================== */
import { DEFAULT_PARAMS } from "./params.js";
import { podstawaWymiaru } from "./podstawa.js";
import { chorobowyWCiazy } from "./chorobowy.js";
import { zasilekMacierzynski } from "./macierzynski.js";
import { laczenieZPraca } from "./laczenie.js";
import { obojeRodzice } from "./oboje.js";
import { adopcja } from "./adopcja.js";
import { ktoWyplaca } from "./platnik.js";
import { porownaj } from "./porownanie.js";

export { DEFAULT_PARAMS, mergeParams, diffParams, PARAM_GROUPS } from "./params.js";
export * from "./helpers.js";
export { podstawaWymiaru, chorobowyWCiazy, zasilekMacierzynski, laczenieZPraca, obojeRodzice, adopcja, ktoWyplaca, porownaj };

// Wnioski i ich warianty (profil → co przysługuje): src/engine/wnioski/
export { WNIOSKI, WARIANTY, POLA, wariantById, wniosekById } from "./wnioski/rejestr.js";
export { kontekstSprawy, GRUPA_TYTULU } from "./wnioski/kontekst.js";
export { ocenWariant, ocenWniosek, przegladWnioskow, ostrzezenia } from "./wnioski/ocena.js";
export { przygotujDruk, maDruk, DRUKI } from "./wnioski/druki.js";
export { terminyWnioskow, doIcs } from "./wnioski/kalendarz.js";

// Jeden punkt wejścia (np. dla przyszłego REST API albo wyniku z odczytu PDF).
const KALKULATORY = {
  podstawa: podstawaWymiaru,
  chorobowy: chorobowyWCiazy,
  macierzynski: zasilekMacierzynski,
  laczenie: laczenieZPraca,
  oboje: obojeRodzice,
  adopcja,
  platnik: ktoWyplaca,
};

export function calculate(typ, input, params = DEFAULT_PARAMS) {
  const fn = KALKULATORY[typ];
  if (!fn) throw new Error(`Nieznany kalkulator: ${typ}`);
  return fn(input, params);
}

export const TYPY_KALKULATOROW = Object.keys(KALKULATORY);
