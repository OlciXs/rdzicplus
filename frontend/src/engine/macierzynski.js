// b) Zasiłek macierzyński: wymiar urlopów i kwoty (KP art. 180–182³; UZ art. 29–31).
import { DEFAULT_PARAMS } from "./params.js";
import { zasilek, tygodnieMac, tygodnieRodz, toDate, addDays, daysInclusive } from "./helpers.js";
import { kwota, liczbaDni } from "./walidacja.js";

/**
 * @param {object} input
 * @param {number} input.dzieci  liczba dzieci przy jednym porodzie (5 = 5 i więcej)
 * @param {string} [input.porod]  data porodu, ISO
 * @param {number} [input.przedPorodem=0]  tygodnie macierzyńskiego przed porodem (max 6)
 * @param {boolean} [input.zaZyciem=false]
 * @param {"brak"|"martwe"|"zgonPo"} [input.sytuacja="brak"]  martwe = martwe urodzenie / zgon przed 8 tyg.
 * @param {string} [input.dataZgonu]  ISO
 * @param {boolean} [input.wniosek815=false]  wniosek o pełny wymiar ≤ 21 dni po porodzie
 * @param {number} input.podstawaMatki  zł/mies.
 * @param {number} [input.podstawaOjca=0]  zł/mies.
 * @param {number} [input.tygodnieDlaOjca=0]  tygodnie macierzyńskiego przejęte przez ojca
 * @param {boolean} [input.ojcowski=true]  ojciec bierze urlop ojcowski
 * @param {number} [input.tydzienCiazy]  tydzień ciąży przy porodzie (urlop uzupełniający)
 * @param {number} [input.masa]  masa urodzeniowa najmniejszego dziecka, g
 * @param {number} [input.dniHospitalizacji=0]
 */
export function zasilekMacierzynski(input, P = DEFAULT_PARAMS) {
  // B-21..B-24: sanityzacja — zakresy i skończone liczby.
  const {
    porod,
    zaZyciem = false,
    sytuacja = "brak",
    dataZgonu,
    wniosek815 = false,
    ojcowski = true,
  } = input;
  const dzieci = Math.min(Math.max(Math.ceil(Number(input.dzieci) || 1), 1), 5);
  const przedPorodem = liczbaDni(input.przedPorodem);
  const podstawaMatki = kwota(input.podstawaMatki);
  const podstawaOjca = kwota(input.podstawaOjca);
  const tygodnieDlaOjca = liczbaDni(input.tygodnieDlaOjca);
  const tydzienCiazy = liczbaDni(input.tydzienCiazy);
  const masa = liczbaDni(input.masa);
  const dniHospitalizacji = liczbaDni(input.dniHospitalizacji);
  const dataPorodu = toDate(porod);
  const przed = Math.min(przedPorodem, P.przedPorodemMax);
  const stMac = wniosek815 ? P.stSredniowany : P.stMacierzynski;
  const stRodz = wniosek815 ? P.stSredniowany : P.stRodzicielski;

  /* wymiar macierzyńskiego */
  let tygMac = tygodnieMac(dzieci, P);
  let martwe = null;
  if (sytuacja === "martwe") {
    // Ostatni dzień: 8 tygodni = 56 dni licząc dzień porodu; „nie krócej niż 7 dni od zgonu” = dzień zgonu + 6.
    let koniec = dataPorodu ? addDays(dataPorodu, P.martweUrodzenieTygodnie * 7 - 1) : null;
    const zgon = toDate(dataZgonu);
    if (zgon) koniec = new Date(Math.max(koniec ?? 0, addDays(zgon, P.zgonPo8TygDni - 1)));
    const dni = dataPorodu && koniec ? daysInclusive(dataPorodu, koniec) : 0;
    tygMac = dni / 7;
    martwe = { koniec, dni };
  }

  /* podział z ojcem (po 14 tyg. matki) */
  const dlaOjcaWpisane = Math.max(0, tygodnieDlaOjca);
  // Ojciec może przejąć tylko to, co zostaje po 14 tygodniach matki (i części przed porodem).
  const maxDlaOjca = Math.max(0, tygMac - przed - P.wylaczneMacierzynskieMatki);
  const bladOjca = sytuacja === "brak" && dlaOjcaWpisane > maxDlaOjca;
  // Do wyliczeń przycinamy do maksimum – wcześniej nadmiar dawał matce ujemne dni i ujemną kwotę
  // (wykryte testem fuzz). Komunikat o błędzie pokazuje UI na podstawie `bladOjca`.
  const dlaOjca = Math.min(dlaOjcaWpisane, maxDlaOjca);

  /* urlop uzupełniający (wcześniak / hospitalizacja, KP art. 180²) */
  let tygUzup = 0;
  let limitUzup = 0;
  const wczesniak = tydzienCiazy > 0 && (tydzienCiazy < 28 || (masa > 0 && masa <= 1000));
  // Art. 180² § 1 k.p. (wyciąg KP i załącznik do zadania): przed 37. tygodniem liczy się KAŻDY tydzień
  // pobytu w szpitalu (niepełny tydzień w górę, § 3) – bez minimum dni. Po 37. tygodniu: co najmniej
  // `minHospitalizacjaDni` (2) KOLEJNE dni, pierwszy między 5. a 28. dniem po porodzie (pkt 3).
  // Wcześniejsza „poprawka B-02” (min. 5 dni dla wszystkich) szła za uproszczeniem z poradnika ZUS (s. 31),
  // którego ustawa nie zawiera. Nieznany tydzień ciąży → ostrzejsza reguła (po 37. tygodniu).
  const po37 = !(tydzienCiazy > 0 && tydzienCiazy < 37) && !(masa > 0 && masa <= 1000);
  const minDni = po37 ? P.minHospitalizacjaDni : 1;
  if (sytuacja === "brak" && dniHospitalizacji >= minDni) {
    limitUzup = wczesniak ? P.uzupełniajacyLimitWczesny : P.uzupełniajacyLimitPozny;
    tygUzup = Math.min(limitUzup, Math.ceil(dniHospitalizacji / 7));
  }

  /* rodzicielski – wspólna pula (podział liczy oboje.js) */
  const pulaRodzicielska = tygodnieRodz(dzieci, zaZyciem, false, P);

  /* kwoty – wiersz: { id, opis, kto, dni, stawka, kwota } (kwota null = liczona gdzie indziej) */
  const wiersze = [];
  let sumaMatka = 0;
  let sumaOjciec = 0;
  const dodaj = (w) => {
    wiersze.push(w);
    if (w.kwota != null) {
      if (w.kto === "matka") sumaMatka += w.kwota;
      if (w.kto === "ojciec") sumaOjciec += w.kwota;
    }
  };

  if (sytuacja === "brak") {
    if (przed > 0) {
      dodaj({ id: "przed", opis: "Urlop macierzyński przed porodem", kto: "matka", dni: przed * 7, stawka: stMac, kwota: zasilek(podstawaMatki, stMac, przed * 7, P) });
    }
    const dniPo = (tygMac - przed - dlaOjca) * 7;
    dodaj({ id: "po", opis: "Urlop macierzyński po porodzie", kto: "matka", dni: Math.round(dniPo), stawka: stMac, kwota: zasilek(podstawaMatki, stMac, dniPo, P) });
    if (dlaOjca > 0) {
      // Przejęta przez ojca część URLOPU MACIERZYŃSKIEGO: zasiłek 100% od podstawy ojca
      // (art. 31 ust. 1 u.z.; katalog W5/W22). Stawka 70% z art. 31 ust. 3f dotyczy wyłącznie
      // 9 tygodni URLOPU RODZICIELSKIEGO drugiego rodzica (liczy je oboje.js), nie tej części.
      // (Wcześniejsza „poprawka B-03” ustawiała tu 70% – to pomyliło oba urlopy.)
      dodaj({ id: "ojciecMac", opis: "Część urlopu macierzyńskiego przejęta", kto: "ojciec", dni: dlaOjca * 7, stawka: P.stMacierzynski, kwota: zasilek(podstawaOjca, P.stMacierzynski, dlaOjca * 7, P) });
    }
    if (tygUzup > 0) {
      dodaj({ id: "uzupelniajacy", opis: "Uzupełniający urlop macierzyński", kto: "matka", dni: tygUzup * 7, stawka: P.stMacierzynski, kwota: zasilek(podstawaMatki, P.stMacierzynski, tygUzup * 7, P) });
    }
    dodaj({ id: "rodzicielski", opis: "Urlop rodzicielski (pula – podział w kalkulatorze „Oboje rodzice”)", kto: "oboje", dni: pulaRodzicielska * 7, stawka: stRodz, kwota: null });
  } else if (sytuacja === "martwe") {
    const dni = Math.round(tygMac * 7);
    dodaj({ id: "martwe", opis: "Zasiłek macierzyński po urodzeniu martwego dziecka", kto: "matka", dni, stawka: P.stMacierzynski, kwota: zasilek(podstawaMatki, P.stMacierzynski, dni, P) });
  } else {
    dodaj({ id: "zgonPo", opis: "Zasiłek macierzyński po zgonie dziecka (po 8 tyg.)", kto: "matka", dni: P.zgonPo8TygDni, stawka: P.stMacierzynski, kwota: zasilek(podstawaMatki, P.stMacierzynski, P.zgonPo8TygDni, P) });
  }
  if (ojcowski && sytuacja === "brak") {
    const dni = P.tygodnieOjcowski * 7;
    dodaj({ id: "ojcowski", opis: "Urlop ojcowski", kto: "ojciec", dni, stawka: P.stMacierzynski, kwota: zasilek(podstawaOjca, P.stMacierzynski, dni, P) });
  }

  return {
    tygMac,
    przed,
    poPorodzie: Math.max(0, tygMac - przed), // przy martwym urodzeniu wymiar bywa krótszy niż część „przed porodem”
    stMac,
    stRodz,
    // B-04: brak podstawy wymiaru (np. matka nieubezpieczona) — sygnalizujemy zamiast
    // zwracać „przysługuje 0,00 zł”.
    brakPodstawy: !(podstawaMatki > 0),
    brakPodstawyOjca: !(podstawaOjca > 0),
    martwe,
    dlaOjca, // przycięte do maksimum (użyte w kwotach)
    dlaOjcaWpisane, // tyle, ile wpisał użytkownik (do komunikatu o błędzie)
    maxDlaOjca,
    bladOjca,
    wczesniak,
    limitUzup,
    tygUzup,
    pulaRodzicielska,
    // koniec roku kalendarzowego, w którym dziecko kończy 6 lat
    rodzicielskiDoRoku: dataPorodu ? dataPorodu.getFullYear() + P.limitRokZycia : null,
    dziennyMatka: (podstawaMatki / P.dniMiesiaca) * (stMac / 100),
    wiersze,
    sumaMatka,
    sumaOjciec,
  };
}
