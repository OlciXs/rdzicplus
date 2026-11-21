// d) Oboje rodzice: podział urlopu rodzicielskiego (KP art. 182¹a–182¹d; UZ art. 31).
import { DEFAULT_PARAMS } from "./params.js";
import { zasilek, tygodnieRodz, toDate } from "./helpers.js";

/**
 * @param {object} input
 * @param {number} input.dzieci  1 albo 2+
 * @param {boolean} [input.zaZyciem=false]
 * @param {string} [input.dataUrodzenia]  ISO
 * @param {number} input.tygodnieMatka
 * @param {number} [input.czesciMatka=1]  liczba części (wniosków)
 * @param {number} input.tygodnieOjciec
 * @param {number} [input.czesciOjciec=1]
 * @param {boolean} [input.wniosek815=false]
 * @param {number} input.podstawaMatki
 * @param {number} input.podstawaOjca
 * @returns {{ bledy: string[], ostrzezenia: string[], ... }}
 */
export function obojeRodzice(input, P = DEFAULT_PARAMS) {
  const {
    dzieci = 1,
    zaZyciem = false,
    dataUrodzenia,
    tygodnieMatka = 0,
    czesciMatka = 1,
    tygodnieOjciec = 0,
    czesciOjciec = 1,
    wniosek815 = false,
    podstawaMatki = 0,
    podstawaOjca = 0,
  } = input;
  const pula = tygodnieRodz(dzieci >= 2 ? 2 : 1, zaZyciem, false, P);
  const stRodz = wniosek815 ? P.stSredniowany : P.stRodzicielski;
  const ur = toDate(dataUrodzenia);
  const tM = tygodnieMatka;
  const tO = tygodnieOjciec;

  const bledy = [];
  const ostrzezenia = [];
  // Niewykorzystanie wyłącznych 9 tygodni jest dozwolone – to strata, nie błąd planu.
  if (tM < P.wyliczneRodzicielskie)
    ostrzezenia.push(`Matka ma mniej niż ${P.wyliczneRodzicielskie} tygodni – traci ${P.wyliczneRodzicielskie - Math.max(0, tM)} tyg. wyłącznych (nieprzenoszalne na ojca).`);
  if (tO < P.wyliczneRodzicielskie)
    ostrzezenia.push(`Ojciec ma mniej niż ${P.wyliczneRodzicielskie} tygodni – traci ${P.wyliczneRodzicielskie - Math.max(0, tO)} tyg. wyłącznych (nieprzenoszalne na matkę).`);
  if (tM + tO > pula)
    bledy.push(`Łącznie ${tM + tO} tyg. przekracza pulę ${pula} tyg. – do zwymiarowania na nowo.`);
  if (czesciMatka > P.maxCzesci || czesciOjciec > P.maxCzesci)
    bledy.push(`Urlop rodzicielski można dzielić na maksymalnie ${P.maxCzesci} części (liczba części = liczba wniosków).`);
  const doRoku = ur ? ur.getFullYear() + P.limitRokZycia : null;
  if (doRoku)
    ostrzezenia.push(`Do wykorzystania do 31.12.${doRoku} (koniec roku kalendarzowego, w którym dziecko kończy ${P.limitRokZycia} lat).`);

  // Wariant 81,5%: 9 tygodni zarezerwowanych dla drugiego rodzica (ojca) jest zawsze
  // płatne 70% (UZ art. 31 ust. 3f); reszta jego tygodni pochodzi z puli matki (81,5%).
  const tygodnieOjca70 = wniosek815 ? Math.min(Math.max(0, tO), P.wyliczneRodzicielskie) : 0;
  const kwotaMatka = zasilek(podstawaMatki, stRodz, tM * 7, P);
  const kwotaOjciec =
    zasilek(podstawaOjca, P.stRodzicielski, tygodnieOjca70 * 7, P) +
    zasilek(podstawaOjca, stRodz, (tO - tygodnieOjca70) * 7, P);

  return {
    pula,
    stRodz,
    wykorzystano: tM + tO,
    pozostalo: Math.max(0, pula - tM - tO),
    bledy,
    ostrzezenia,
    poprawny: bledy.length === 0,
    doRoku,
    tygodnieOjca70,
    kwotaMatka,
    kwotaOjciec,
    razem: kwotaMatka + kwotaOjciec,
  };
}
