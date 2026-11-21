// d) Oboje rodzice: podział urlopu rodzicielskiego (KP art. 182¹a–182¹d; UZ art. 31).
import { DEFAULT_PARAMS } from "./params.js";
import { zasilek, tygodnieRodz, toDate } from "./helpers.js";
import { kwota, liczbaDni } from "./walidacja.js";

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
    zaZyciem = false,
    dataUrodzenia,
    wniosek815 = false,
  } = input;
  const dzieci = liczbaDni(input.dzieci) || 1;
  const tygodnieMatka = liczbaDni(input.tygodnieMatka);
  const tygodnieOjciec = liczbaDni(input.tygodnieOjciec);
  const czesciMatka = liczbaDni(input.czesciMatka) || 1;
  const czesciOjciec = liczbaDni(input.czesciOjciec) || 1;
  const podstawaMatki = kwota(input.podstawaMatki);
  const podstawaOjca = kwota(input.podstawaOjca);
  const pula = tygodnieRodz(dzieci >= 2 ? 2 : 1, zaZyciem, false, P);
  const stRodz = wniosek815 ? P.stSredniowany : P.stRodzicielski;
  const ur = toDate(dataUrodzenia);
  const tM = tygodnieMatka;
  const tO = tygodnieOjciec;

  const bledy = [];
  const ostrzezenia = [];
  // Niewykorzystanie wyłącznych 9 tygodni jest dozwolone – to strata, nie błąd planu.
  if (tM < P.wylaczneRodzicielskie)
    ostrzezenia.push(`Matka ma mniej niż ${P.wylaczneRodzicielskie} tygodni – traci ${P.wylaczneRodzicielskie - Math.max(0, tM)} tyg. wyłącznych (nieprzenoszalne na ojca).`);
  if (tO < P.wylaczneRodzicielskie)
    ostrzezenia.push(`Ojciec ma mniej niż ${P.wylaczneRodzicielskie} tygodni – traci ${P.wylaczneRodzicielskie - Math.max(0, tO)} tyg. wyłącznych (nieprzenoszalne na matkę).`);
  if (tM + tO > pula)
    bledy.push(`Łącznie ${tM + tO} tyg. przekracza pulę ${pula} tyg. – do zwymiarowania na nowo.`);
  // B-16 (art. 182¹d § 2 k.p.): liczbę części ustala się w oparciu o liczbę złożonych wniosków,
  // uwzględniając wnioski OBU rodziców — limit 5 jest ŁĄCZNY, nie „na rodzica”.
  if (czesciMatka + czesciOjciec > P.maxCzesci)
    bledy.push(`Urlop rodzicielski można podzielić na maksymalnie ${P.maxCzesci} części łącznie na dziecko (matka ${czesciMatka} + ojciec ${czesciOjciec} = ${czesciMatka + czesciOjciec}).`);
  const doRoku = ur ? ur.getFullYear() + P.limitRokZycia : null;
  if (doRoku)
    ostrzezenia.push(`Do wykorzystania do 31.12.${doRoku} (koniec roku kalendarzowego, w którym dziecko kończy ${P.limitRokZycia} lat).`);

  // Wariant 81,5%: 9 tygodni zarezerwowanych dla drugiego rodzica (ojca) jest zawsze
  // płatne 70% (UZ art. 31 ust. 3f); reszta jego tygodni pochodzi z puli matki (81,5%).
  const tygodnieOjca70 = wniosek815 ? Math.min(Math.max(0, tO), P.wylaczneRodzicielskie) : 0;
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
