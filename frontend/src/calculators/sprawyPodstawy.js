/* =====================================================================
   Przykładowe sprawy do kalkulatora f) – DANE FIKCYJNE.

   Treść zadania (kalkulator f) mówi o „konkretnej sprawie z podanych w zestawach” ZUS.
   Tamtych zestawów nie wolno kopiować ani publikować (pkt 2 zadania), a wczytywanie ich
   zespół odłożył (docs/zgodnosc-z-zadaniem.md). Zamiast tego: typowe sytuacje z załącznika
   do zadania („Podstawa wymiaru zasiłków”), z ręcznie policzonym wynikiem (`podstawa`) –
   test `sprawyPodstawy.test.js` pilnuje, że silnik daje dokładnie te kwoty.
   ===================================================================== */

const r12 = (kwota) => Array.from({ length: 12 }, () => String(kwota));

export const SPRAWY_PODSTAWY = [
  {
    id: "etat-staly",
    nazwa: "Etat, stała pensja 6 000 zł",
    opis: "12 pełnych miesięcy po 6 000 zł. Przeciętne 6 000 zł − 13,71% składek = podstawa.",
    stan: { status: "pracownik", wymiarEtatu: "1", ileMies: "12", kwartalne: "0", roczna: "0" },
    miesiace: r12(6000),
    podstawa: 5177.4, // 6000 × 0,8629
  },
  {
    id: "etat-premie",
    nazwa: "Etat + premie kwartalne i trzynastka",
    opis: "Pensja 5 000 zł, premie kwartalne razem 6 000 zł za 4 kwartały, trzynastka 4 800 zł – premie wliczamy po 1/12.",
    stan: { status: "pracownik", wymiarEtatu: "1", ileMies: "12", kwartalne: "6000", roczna: "4800" },
    miesiace: r12(5000),
    podstawa: 5091.11, // (5000 + 6000/12 + 4800/12) × 0,8629 = 5900 × 0,8629
  },
  {
    id: "krotkie-zatrudnienie",
    nazwa: "Krótkie zatrudnienie – 5 pełnych miesięcy",
    opis: "Zatrudnienie krótsze niż 12 miesięcy: średnia z pełnych miesięcy nieprzerwanego ubezpieczenia (tu 5 × 7 000 zł).",
    stan: { status: "pracownik", wymiarEtatu: "1", ileMies: "5", kwartalne: "0", roczna: "0" },
    miesiace: [...Array.from({ length: 5 }, () => "7000"), ...Array.from({ length: 7 }, () => "0")],
    podstawa: 6040.3, // 7000 × 0,8629
  },
  {
    id: "miesiac-wylaczony",
    nazwa: "Miesiąc przepracowany w mniej niż połowie – wyłączony",
    opis: "W 3. miesiącu przepracowano mniej niż połowę czasu pracy – ten miesiąc pomijamy (wpisane 0), średnia z 11 miesięcy po 5 500 zł.",
    stan: { status: "pracownik", wymiarEtatu: "1", ileMies: "12", kwartalne: "0", roczna: "0" },
    miesiace: r12(5500).map((m, i) => (i === 2 ? "0" : m)),
    podstawa: 4745.95, // 5500 × 0,8629
  },
  {
    id: "pol-etatu-minimum",
    nazwa: "½ etatu, pensja 2 000 zł – minimum proporcjonalne",
    opis: "Podstawa z pensji (1 725,80 zł) jest niższa niż minimum dla ½ etatu, więc podnosimy ją do 0,5 × 4 147,10 zł.",
    stan: { status: "pracownik", wymiarEtatu: "0.5", ileMies: "12", kwartalne: "0", roczna: "0" },
    miesiace: r12(2000),
    podstawa: 2073.55, // 0,5 × 4 147,10 (minimum dla pełnego etatu z parametrów)
  },
  {
    id: "dg-duzy-zus",
    nazwa: "Działalność – „duży ZUS” (podstawa składek 5 652 zł)",
    opis: "Osoba prowadząca działalność: podstawą jest zadeklarowana podstawa składek z 12 miesięcy − 13,71%.",
    stan: { status: "niepracownik", wymiarEtatu: "1", ileMies: "12", kwartalne: "0", roczna: "0" },
    miesiace: r12(5652),
    podstawa: 4877.11, // 5652 × 0,8629
  },
  {
    id: "dg-maly-zus",
    nazwa: "Działalność – preferencyjne składki (podstawa 1 441,80 zł)",
    opis: "Niska zadeklarowana podstawa = niski zasiłek. Kalkulator ostrzega, że to poniżej typowego minimum dla dobrowolnie ubezpieczonych.",
    stan: { status: "niepracownik", wymiarEtatu: "1", ileMies: "12", kwartalne: "0", roczna: "0" },
    miesiace: r12(1441.8),
    podstawa: 1244.13, // 1441,80 × 0,8629
  },
  {
    id: "zlecenie-limit",
    nazwa: "Zlecenie – przychód 25 000 zł, ponad limit",
    opis: "U ubezpieczonych dobrowolnie podstawa nie może przekroczyć limitu od maksymalnej podstawy składki chorobowej.",
    stan: { status: "niepracownik", wymiarEtatu: "1", ileMies: "12", kwartalne: "0", roczna: "0" },
    miesiace: r12(25000),
    podstawa: 20321.3, // limit = 23 550 × 0,8629
  },
];
