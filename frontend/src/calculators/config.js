/* =====================================================================
   Parametry prawne kalkulatorów (stan prawny: 2026).
   W docelowym narzędziu te wartości pochodzą z panelu administracyjnego
   (wymóg zadania: "możliwość wprowadzania zmian w parametrach").
   Źródła: ustawa zasiłkowa (Dz.U. 2026 poz. 854), Kodeks pracy
   (Dz.U. 2026 poz. 1245), załączniki ZUS do zadania (kwoty 2026).
   ===================================================================== */
export const CFG = {
  // stopy procentowe
  stMacierzynski: 100, // urlop macierzyński / na warunkach / uzupełniający / ojcowski
  stRodzicielski: 70, // urlop rodzicielski (wariant zmienny)
  stSredniowany: 81.5, // wniosek o macierzyński + rodzicielski w pełnym wymiarze (do 21 dni)
  stChorobowy: 80, // chorobowy standard
  stChorobowyCiaza: 100, // kod "B" na e-ZLA
  stOpiekunczy: 80,
  stRehab90: 90,
  stRehab75: 75, // świadczenie rehabilitacyjne (100% w ciąży)

  // podstawa wymiaru
  potracenie: 13.71, // składki finansowane przez ubezpieczonego (E 9,76 + R 1,5 + chor 2,45)
  dniMiesiaca: 30, // zasiłek dzienny = 1/30 podstawy miesięcznej
  minWynagrodzenie: 4806, // zł, 2026 (Dz.U. 2025 poz. 1242)
  minPodstawaPracownik: 4147.09, // minimalne wynagrodzenie - 13,71% (art. 45 UZ)
  maxPodstawaZasilku: 20321.3, // limit podstawy zasiłku (od maks. składki 23 550 zł) - wg załącznika
  maxPodstawaSkladki: 23550, // 250% prognozowanego przeciętnego wynagrodzenia 2026
  progZaleglosci: 48.06, // 1% minimalnego wynagrodzenia - blokada zasiłków (art. 2a UZ)

  // zasiłek chorobowy
  oczekiwanieObowiazkowe: 30, // dni ubezpieczenia (obowiązkowe)
  oczekiwanieDobrowolne: 90, // dni ubezpieczenia (dobrowolne)
  wynagrodzenieChorobowe: 33, // dni w roku kalendarzowym płaci pracodawca
  wynagrodzenieChorobowe50: 14, // po ukończeniu 50 lat
  okresZasilkowy: 182,
  okresZasilkowyCiaza: 270, // ciąża lub gruźlica
  przerwaZnaczaOkres: 60, // przerwa <= 60 dni: okresy się sumują (kod "B" resetuje)
  ustanieLimity: 91, // zasiłek po ustaniu tytułu (nie dotyczy ciąży)

  // urlopy i zasiłek macierzyński
  tygodnieMacierzynski: { 1: 20, 2: 31, 3: 33, 4: 35, 5: 37 }, // liczba dzieci -> tyg. (KP art. 180)
  przedPorodemMax: 6, // max tygodni przed porodem
  wyliczneMacierzynskieMatki: 14, // nieprzenoszalna część matki po porodzie (8 przy orzeczeniu)
  minimalneNaWarunkach: 9, // tygodnie - minimum urlopu na warunkach urlopu macierzyńskiego
  tygodnieRodzicielski: { 1: 41, 2: 43 },
  tygodnieZaZyciem: { 1: 65, 2: 67, przyjete: 62 },
  wyliczneRodzicielskie: 9, // tygodnie na rodzica, nieprzenoszalne (zawsze 70%)
  maxCzesci: 5, // urlop rodzicielski max części
  limitRokZycia: 6, // do końca roku kal., w którym dziecko kończy 6 lat
  deadlineSredniowany: 21, // dni od porodu na wniosek 81,5%
  tygodnieOjcowski: 2, // 14 dni kalendarzowych
  deadlineOjcowskiMies: 12, // do ukończenia 12 mies. życia (adopcja: 12 mies. od uprawomocnienia, max 14 lat)
  uzupełniajacyLimitWczesny: 15, // <28 tyg. ciąży lub masa <= 1000 g
  uzupełniajacyLimitPozny: 8, // pozostałe przypadki
  martweUrodzenieTygodnie: 8, // po porodzie; nie krócej niż 7 dni od zgonu
  zgonPo8TygDni: 7,

  // łączenie urlopu rodzicielskiego z pracą (KP art. 1821f; UZ art. 31 ust. 4a)
  maksEtuLaczenie: 0.5, // wymiar pracy max 1/2 etatu
  limitLaczenie: { 1: 82, 2: 86 }, // tygodnie wydłużonego rodzicielskiego
  limitLaczenieZaZyciem: { 1: 130, 2: 134 },

  // ochrona zatrudnienia (KP art. 177) i terminy wniosków
  ochronaWkladDni: { macierzynski: 14, uzupelniajacy: 21, rodzicielski: 21, ojcowski: 7 },
  odpisAktuDni: 7,
};

/* ---------- pomocnicze (czyste funkcje) ---------- */
export const num = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export const zl = (v) => {
  const n = Math.round((v + Number.EPSILON) * 100) / 100;
  const neg = n < 0;
  const [i, f] = Math.abs(n).toFixed(2).split(".");
  const grouped = i.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (neg ? "-" : "") + grouped + "," + f + " zł";
};

export const tyg = (v) => {
  // tygodnie mogą być ułamkowe - format "12,5 tyg."
  const n = Math.round((v + Number.EPSILON) * 100) / 100;
  return String(n).replace(".", ",") + " tyg.";
};

export const zasilek = (podstawaMies, stawka, dni) =>
  (podstawaMies / CFG.dniMiesiaca) * (stawka / 100) * dni;

export const tygodnieMac = (dzieci) =>
  CFG.tygodnieMacierzynski[Math.min(Math.max(dzieci, 1), 5)];

export const tygodnieRodz = (dzieci, zaZyciem, przyjete) =>
  zaZyciem
    ? przyjete
      ? CFG.tygodnieZaZyciem.przyjete
      : CFG.tygodnieZaZyciem[Math.min(dzieci, 2)]
    : CFG.tygodnieRodzicielski[Math.min(dzieci, 2)];

export const fmtD = (d) => (d ? d.toLocaleDateString("pl-PL") : "-");
export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
