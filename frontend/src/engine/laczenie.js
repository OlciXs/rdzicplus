// c) Łączenie urlopu rodzicielskiego z pracą (KP art. 182¹f; UZ art. 31 ust. 4a).
import { DEFAULT_PARAMS } from "./params.js";
import { zasilek, tygodnieRodz } from "./helpers.js";

/**
 * @param {object} input
 * @param {number} input.dzieci  1 albo 2+ (przy jednym porodzie)
 * @param {boolean} [input.zaZyciem=false]
 * @param {number} input.etat  wymiar pracy w trakcie urlopu, ułamek etatu (max 0,5)
 * @param {number} input.podstawa  podstawa wymiaru zasiłku, zł/mies.
 * @param {number} input.stawka  stawka zasiłku w % (81,5 albo 70)
 */
export function laczenieZPraca(input, P = DEFAULT_PARAMS) {
  const { dzieci = 1, zaZyciem = false, etat = 0, podstawa = 0, stawka = P.stRodzicielski } = input;
  const n = dzieci >= 2 ? 2 : 1;
  const przekroczonyEtat = etat > P.maksEtuLaczenie;
  const f = Math.min(etat, P.maksEtuLaczenie);

  const wymiar = tygodnieRodz(n, zaZyciem, false, P);
  const limit = (zaZyciem ? P.limitLaczenieZaZyciem : P.limitLaczenie)[n];
  // Urlop łączony z pracą wydłuża się proporcjonalnie: wymiar ÷ (1 − etat).
  // Przy 1/2 etatu: 41 → 82 tyg. (= limit), 43 → 86 tyg.
  const wydluzonyBezLimitu = f > 0 && f < 1 ? wymiar / (1 - f) : wymiar;
  const wydluzony = Math.min(limit, wydluzonyBezLimitu);
  const uderzonoWLimit = wydluzonyBezLimitu > limit + 1e-9;

  // Zasiłek pomniejszany proporcjonalnie do wymiaru pracy.
  const dziennyPelny = zasilek(podstawa, stawka, 1, P);
  const dziennyPomniejszony = dziennyPelny * (1 - f);

  return {
    etat: f,
    przekroczonyEtat,
    wymiar,
    limit,
    wydluzenie: wydluzony - wymiar,
    wydluzony,
    uderzonoWLimit,
    dziennyPelny,
    dziennyPomniejszony,
    miesiecznie: dziennyPomniejszony * P.dniMiesiaca,
    wynagrodzenieZPracy: podstawa * f,
    sumaZasilku: dziennyPomniejszony * wydluzony * 7,
  };
}
