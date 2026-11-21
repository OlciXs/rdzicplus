/* =====================================================================
   Parametry prawne silnika obliczeń (stan prawny: 2026).
   To jedyne miejsce z liczbami z przepisów. Funkcje silnika dostają
   parametry jako argument, więc panel admina może podać inne wartości
   bez zmiany kodu (wymóg zadania ZUS).
   Źródła: ustawa zasiłkowa (Dz.U. 2026 poz. 854), Kodeks pracy
   (Dz.U. 2026 poz. 1245), załączniki ZUS do zadania (kwoty 2026).
   Szczegóły i podstawy prawne: docs/podsumowanie-danych-do-wyliczen.md
   ===================================================================== */
export const DEFAULT_PARAMS = Object.freeze({
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
  // najniższa podstawa składek dla przedsiębiorców (60% × 9 420 = 5 652 zł) minus składki
  // 9,76% + 1,5% + 2,45% liczone osobno (551,64 + 84,78 + 138,47). DO POTWIERDZENIA w ZUS.
  minPodstawaDobrowolni: 4877.11,
  progZaleglosci: 48.06, // 1% minimalnego wynagrodzenia - blokada zasiłków (art. 2a UZ)
  progPlatnika: 20, // > 20 ubezpieczonych (stan na 30 XI) → zasiłki wypłaca płatnik, inaczej ZUS (art. 61 UZ)
  swiadczenieRodzicielskie: 1000, // zł/mies. – kwota, do której podwyższa się niski zasiłek macierzyński (art. 31 ust. 3a UZ)
  zasilekPogrzebowy: 7000, // zł
  limitOpiekunczyDni: 60, // łącznie w roku kalendarzowym

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
  tygodnieZaZyciem: { 1: 65, 2: 67, przyjete: 62 }, // 62 – DO POTWIERDZENIA (TODO, sekcja 12)
  wyliczneRodzicielskie: 9, // tygodnie na rodzica, nieprzenoszalne
  maxCzesci: 5, // urlop rodzicielski max części
  limitRokZycia: 6, // do końca roku kal., w którym dziecko kończy 6 lat
  deadlineSredniowany: 21, // dni od porodu na wniosek 81,5%
  tygodnieOjcowski: 2, // 14 dni kalendarzowych
  deadlineOjcowskiMies: 12, // do ukończenia 12 mies. życia (adopcja: 12 mies. od uprawomocnienia, max 14 lat)
  uzupełniajacyLimitWczesny: 15, // <28 tyg. ciąży lub masa <= 1000 g
  uzupełniajacyLimitPozny: 8, // pozostałe przypadki
  martweUrodzenieTygodnie: 8, // po porodzie; nie krócej niż 7 dni od zgonu
  zgonPo8TygDni: 7,

  // adopcja / rodzina zastępcza – limity wieku dziecka w chwili przyjęcia (UZ art. 29, KP art. 183)
  limitWiekuPrzysposobienie: 14,
  limitWiekuRodzinaZastepcza: 7,
  limitWiekuOdroczenie: 10,

  // łączenie urlopu rodzicielskiego z pracą (KP art. 182¹f; UZ art. 31 ust. 4a)
  maksEtuLaczenie: 0.5, // wymiar pracy max 1/2 etatu
  limitLaczenie: { 1: 82, 2: 86 }, // tygodnie wydłużonego rodzicielskiego
  limitLaczenieZaZyciem: { 1: 130, 2: 134 },

  // ochrona zatrudnienia (KP art. 177) i terminy wniosków
  ochronaWkladDni: { macierzynski: 14, uzupelniajacy: 21, rodzicielski: 21, ojcowski: 7 },
  odpisAktuDni: 7,
});

/** Grupy i opisy parametrów dla panelu admina (kolejność = kolejność w panelu). */
export const PARAM_GROUPS = [
  {
    tytul: "Stawki zasiłków (%)",
    klucze: {
      stMacierzynski: "Macierzyński / ojcowski / uzupełniający",
      stRodzicielski: "Rodzicielski (wariant zmienny)",
      stSredniowany: "Wariant „wniosek do 21 dni”",
      stChorobowy: "Chorobowy – standard",
      stChorobowyCiaza: "Chorobowy w ciąży (kod B)",
      stRehab90: "Rehabilitacyjne – pierwsze 3 mies.",
      stRehab75: "Rehabilitacyjne – dalej",
    },
  },
  {
    tytul: "Podstawa wymiaru i kwoty (zł / %)",
    klucze: {
      potracenie: "Potrącenie składek (%)",
      dniMiesiaca: "Dzielnik stawki dziennej (dni)",
      minWynagrodzenie: "Minimalne wynagrodzenie",
      minPodstawaPracownik: "Minimalna podstawa – pracownik",
      maxPodstawaZasilku: "Maksymalna podstawa – dobrowolni",
      maxPodstawaSkladki: "Maks. podstawa składki chorobowej",
      minPodstawaDobrowolni: "Typowe minimum – dobrowolni",
      progZaleglosci: "Próg zaległości blokującej zasiłek",
      progPlatnika: "Płatnik wypłaca zasiłki powyżej (osób)",
      swiadczenieRodzicielskie: "Świadczenie rodzicielskie – minimum zasiłku macierzyńskiego",
      zasilekPogrzebowy: "Zasiłek pogrzebowy",
      limitOpiekunczyDni: "Zasiłek opiekuńczy – limit dni w roku",
    },
  },
  {
    tytul: "Zasiłek chorobowy (dni)",
    klucze: {
      oczekiwanieObowiazkowe: "Okres oczekiwania – obowiązkowe",
      oczekiwanieDobrowolne: "Okres oczekiwania – dobrowolne",
      wynagrodzenieChorobowe: "Wynagrodzenie chorobowe (płaci pracodawca)",
      wynagrodzenieChorobowe50: "Wynagrodzenie chorobowe po 50. r.ż.",
      okresZasilkowy: "Okres zasiłkowy",
      okresZasilkowyCiaza: "Okres zasiłkowy w ciąży",
      przerwaZnaczaOkres: "Przerwa sumująca okresy",
    },
  },
  {
    tytul: "Urlopy (tygodnie)",
    klucze: {
      tygodnieMacierzynski: "Macierzyński wg liczby dzieci",
      przedPorodemMax: "Maks. przed porodem",
      wyliczneMacierzynskieMatki: "Część matki po porodzie",
      tygodnieRodzicielski: "Rodzicielski wg liczby dzieci",
      tygodnieZaZyciem: "Rodzicielski „Za życiem”",
      wyliczneRodzicielskie: "Część nieprzenoszalna rodzica",
      maxCzesci: "Maks. liczba części rodzicielskiego",
      tygodnieOjcowski: "Ojcowski",
      uzupełniajacyLimitWczesny: "Uzupełniający – wcześniak (< 28 tyg. / ≤ 1000 g)",
      uzupełniajacyLimitPozny: "Uzupełniający – pozostałe",
      martweUrodzenieTygodnie: "Po martwym urodzeniu",
      limitLaczenie: "Rodzicielski łączony z pracą – limit",
      limitLaczenieZaZyciem: "Łączony z pracą „Za życiem” – limit",
      maksEtuLaczenie: "Maks. wymiar pracy (ułamek etatu)",
    },
  },
  {
    tytul: "Terminy i limity wieku",
    klucze: {
      deadlineSredniowany: "Wniosek o wariant 81,5% (dni po porodzie)",
      deadlineOjcowskiMies: "Ojcowski do (miesięcy życia)",
      limitRokZycia: "Rodzicielski do roku, w którym dziecko kończy (lat)",
      zgonPo8TygDni: "Zasiłek po zgonie dziecka (dni)",
      limitWiekuPrzysposobienie: "Przysposobienie – wiek dziecka (lat)",
      limitWiekuRodzinaZastepcza: "Rodzina zastępcza – wiek dziecka (lat)",
      limitWiekuOdroczenie: "Rodzina zastępcza z odroczeniem (lat)",
      ochronaWkladDni: "Wnioski urlopowe – dni przed",
      odpisAktuDni: "Odpis aktu urodzenia (dni)",
    },
  },
];

/** Różnice między `params` a wartościami domyślnymi (to zapisuje panel admina). */
export function diffParams(params) {
  const out = {};
  for (const [key, def] of Object.entries(DEFAULT_PARAMS)) {
    const v = params?.[key];
    if (v === undefined) continue;
    if (typeof def === "object") {
      const sub = {};
      for (const [k, d] of Object.entries(def)) if (v[k] !== undefined && v[k] !== d) sub[k] = v[k];
      if (Object.keys(sub).length) out[key] = sub;
    } else if (v !== def) out[key] = v;
  }
  return out;
}

/**
 * Nakłada zmiany z panelu admina na wartości domyślne.
 * Obiekty (np. tygodnieMacierzynski) są scalane klucz po kluczu,
 * a klucze nieznane w DEFAULT_PARAMS są ignorowane.
 */
export function mergeParams(overrides = {}) {
  const out = {};
  for (const [key, def] of Object.entries(DEFAULT_PARAMS)) {
    const o = overrides?.[key];
    if (o === undefined || o === null) out[key] = def;
    else if (typeof def === "object") out[key] = { ...def, ...o };
    else out[key] = o;
  }
  return out;
}
