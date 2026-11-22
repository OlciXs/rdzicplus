import CalcChorobowy from "./CalcChorobowy.jsx";
import CalcMacierzynski from "./CalcMacierzynski.jsx";
import CalcLaczenie from "./CalcLaczenie.jsx";
import CalcOboje from "./CalcOboje.jsx";
import CalcAdopcja from "./CalcAdopcja.jsx";
import CalcPodstawa from "./CalcPodstawa.jsx";
import CalcDokumenty from "./CalcDokumenty.jsx";

// Każdy kalkulator ma własny adres: /kalkulatory/<slug>
export const CALCULATORS = [
  {
    slug: "zasilek-chorobowy-w-ciazy",
    icon: "pulse",
    letter: "a",
    title: "Zasiłek chorobowy w ciąży",
    short: "Prawo do zasiłku, wynagrodzenie chorobowe 33/14 dni, okres zasiłkowy 270 dni.",
    Component: CalcChorobowy,
  },
  {
    slug: "zasilek-macierzynski",
    icon: "baby",
    letter: "b",
    title: "Zasiłek macierzyński",
    short: "Wymiar urlopów, stawki 100% / 81,5% / 70%, urlop ojcowski, sytuacje szczególne.",
    Component: CalcMacierzynski,
  },
  {
    slug: "laczenie-urlopu-z-praca",
    icon: "rings",
    letter: "c",
    title: "Łączenie urlopu rodzicielskiego z pracą",
    short: "Wydłużenie urlopu proporcjonalnie do etatu (max 1/2) i proporcjonalne pomniejszenie zasiłku.",
    Component: CalcLaczenie,
  },
  {
    slug: "oboje-rodzice",
    icon: "family",
    letter: "d",
    title: "Symulacja obojga rodziców",
    short: "Wspólna pula urlopu, 9 tygodni wyłącznych na rodzica, max 5 części, do końca roku, w którym dziecko kończy 6 lat.",
    Component: CalcOboje,
  },
  {
    slug: "adopcja-rodzina-zastepcza",
    icon: "home",
    letter: "e",
    title: "Adopcja i rodzina zastępcza",
    short: "Urlop na warunkach macierzyńskiego (limity 7/10/14 lat), urlop rodzicielski, terminy wniosków.",
    Component: CalcAdopcja,
  },
  {
    slug: "podstawa-wymiaru",
    icon: "banknote",
    letter: "f",
    title: "Podstawa wymiaru zasiłku",
    short: "Średnia z 12 miesięcy, potrącenie 13,71%, premie 1/12, minimum i maksimum podstawy.",
    Component: CalcPodstawa,
  },
  {
    slug: "dokumenty-i-terminy",
    icon: "clipboard",
    letter: "g",
    title: "Dokumenty, terminy i zagrożenia",
    short: "Które druki, gdzie złożyć (płatnik czy ZUS), w jakim terminie – oraz ostrzeżenia.",
    Component: CalcDokumenty,
  },
];

export const getCalculator = (slug) => CALCULATORS.find((c) => c.slug === slug);

export const calculatorPath = (slug) => `/kalkulatory/${slug}`;
