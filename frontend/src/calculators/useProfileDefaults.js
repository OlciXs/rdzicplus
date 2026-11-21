import { useEffect, useRef, useState } from "react";
import { useProfile } from "../profile.js";
import { CFG } from "./config.js";

/* =====================================================================
   Podstawianie danych z profilu ("Moje dane") do kalkulatorów.

   Zasady:
   - Działa tylko dla zalogowanych, którzy mają profil; reszta widzi
     kalkulator po staremu (wartości domyślne).
   - Podstawia raz, po wczytaniu profilu. Użytkownik może potem zmienić
     dowolne pole - nic nie jest nadpisywane ponownie.
   - Puste pola profilu nie zmieniają wartości domyślnych kalkulatora.
   - Płeć zalogowanego rodzica (ubezpieczony.plec, z PESEL-u: "K" / "M") decyduje,
     czy jego dane trafiają w pola "matka", czy "ojciec" (kalkulatory b i d);
     dane drugiego rodzica trafiają w pole przeciwne.

   Mapowanie jest w jednym miejscu (PICKS): klucz = pole stanu kalkulatora.
   Wartości funkcji mogą liczyć z kilku pól profilu (np. `dniUb` z daty
   początku ubezpieczenia, `kodB` z rodzaju zwolnienia).
   ===================================================================== */

const clamp = (n, max) => String(Math.min(Math.max(Math.round(Number(n)) || 1, 1), max));
const liczba = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
// Tygodnie / części z profilu: ujemne traktujemy jak brak danych (nie podstawiamy „-5”).
const nieujemna = (v) => {
  const n = liczba(v);
  return n !== null && n >= 0 ? String(n) : undefined;
};
const DZIEN = 86400000;

/** Liczba pełnych dni między datą (ISO/„RRRR-MM-DD”) a dziś. */
const dniOd = (iso, doDnia = new Date()) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const n = Math.floor((doDnia - d) / DZIEN);
  return n >= 0 ? n : null;
};

/** Czy zalogowany jest pracownikiem (obowiązkowe chorobowe + wynagrodzenie chorobowe). */
const jestPracownikiem = (u) => u.statusUbezpieczenia === "pracownik" || u.statusUbezpieczenia === "powolanie";

/**
 * Status dla engine/chorobowy.js: "obw" (obowiązkowe) albo "dobr" (dobrowolne).
 * Umowa uaktywniająca jest obowiązkowa, ale bez wynagrodzenia chorobowego — traktujemy jak "obw".
 */
const statusChorobowy = (u) => {
  if (!u.statusUbezpieczenia) return undefined;
  if (u.statusUbezpieczenia === "pracownik" || u.statusUbezpieczenia === "powolanie") return "obw";
  if (u.statusUbezpieczenia === "uaktywniajaca") return "obw";
  if (["zlecenie", "dg", "wspolpraca", "duchowny", "marynarz"].includes(u.statusUbezpieczenia)) return "dobr";
  return undefined; // dzielo / student / nierejestrowa / ulga_na_start / brak → brak prawa
};

/** Status dla engine/platnik.js. */
// Tylko wartości z listy w CalcDokumenty.jsx (pracownik / zlecenie / dg) – inna wartość dawała
// w polu „Pracownik”, a wyliczenie liczyło dla innego statusu. Osoba współpracująca = jak działalność
// (ZUS wypłaca zawsze, te same dokumenty); duchowny / marynarz – brak na liście, nie zgadujemy.
const statusPlatnika = (u) =>
  u.statusUbezpieczenia === "wspolpraca" ? "dg"
    : ["pracownik", "zlecenie", "dg"].includes(u.statusUbezpieczenia) ? u.statusUbezpieczenia
    : undefined;

/** Liczba ubezpieczonych u płatnika jako liczba (kalkulator g potrzebuje wartości). */
const liczbaUb = (p) => {
  const v = p.platnik?.liczbaUbezpieczonych;
  if (v === "do_20") return "20";
  if (v === "powyzej_20") return "21";
  return null;
};

/** Kwota zaległości: profil trzyma „tak/nie”, silnik oczekuje kwoty. */
// Próg z parametrów – panel admina może go zmienić (wcześniej wpisane na sztywno 48,06).
const zalegloscKwota = (p, prog = CFG.progZaleglosci) => {
  const v = p.ubezpieczony?.zaleglosci;
  if (v === "tak") return String(prog + 1); // powyżej progu → blokada
  if (v === "nie") return "0";
  return null;
};

/** Sytuacja szczególna dla kalkulatora b): martwe urodzenie i zgon przed 8. tygodniem życia
 *  to jeden wariant („martwe”, art. 180 § 6 k.p.), zgon po 8 tygodniach – drugi („zgonPo”).
 *  Bez dat nie zgadujemy, który to przypadek. */
const sytuacjaSzczegolna = (d) => {
  if (d.martwe === "tak") return "martwe";
  if (d.zmarlo !== "tak") return undefined;
  const ur = new Date(d.dataUrodzenia || "");
  const zgon = new Date(d.dataZgonu || "");
  if (Number.isNaN(ur.getTime()) || Number.isNaN(zgon.getTime())) return undefined;
  return (zgon - ur) / DZIEN < CFG.martweUrodzenieTygodnie * 7 ? "martwe" : "zgonPo";
};

/** Etap sprawy dla kalkulatora g) – musi być jedną z wartości ETAPY z CalcDokumenty.jsx
 *  (wcześniej „poPorodzie”, którego na liście nie ma – lista pokazywała co innego, niż liczył kalkulator). */
const etapDokumentow = (p) => {
  const s = p.sytuacja ?? {};
  const d = p.dziecko ?? {};
  const z = p.zdrowie ?? {};
  if (d.martwe === "tak" || d.zmarlo === "tak") return "martwe";
  if (s.etap === "przyjecie") return "adopcja";
  if (s.etap === "po_porodzie") return "porod";
  if (s.etap === "ciaza") return z.zwolnienie !== "B" && p.urlopy?.urlopPrzedPorodemOd ? "przedPorodem" : "ciazaL4";
  return z.zwolnienie === "B" ? "ciazaL4" : undefined;
};

// Kto jest matką, a kto ojcem: zalogowany = ubezpieczony, drugi = drugiRodzic.
const rodzice = ({ ubezpieczony: u, drugiRodzic: o }) => {
  const jestOjcem = u.plec === "M";
  return {
    jestOjcem,
    podstawaMatki: jestOjcem ? o.podstawaWymiaru : u.podstawaWymiaru,
    podstawaOjca: jestOjcem ? u.podstawaWymiaru : o.podstawaWymiaru,
  };
};

const PICKS = {
  // a) zasiłek chorobowy w ciąży
  chorobowy: (p) => {
    const u = p.ubezpieczony;
    const z = p.zdrowie ?? {};
    const { jestOjcem, podstawaMatki } = rodzice(p);
    // Kod B z rodzaju zwolnienia zapisanego w profilu.
    const kodB = z.zwolnienie === "B" ? true : z.zwolnienie === "bez_B" ? false : undefined;
    return {
      status: jestOjcem ? undefined : statusChorobowy(u),
      podstawa: podstawaMatki,
      ur: jestOjcem ? undefined : u.dataUrodzenia,
      // Liczymy staż ubezpieczenia sami, żeby użytkownik nie musiał go znać.
      dniUb: jestOjcem ? undefined : (() => {
        const n = dniOd(u.ubezpieczenieOd);
        return n === null ? undefined : String(n);
      })(),
      liczbaUbPlatnika: liczbaUb(p) ?? undefined,
      od: z.zlaOd || undefined,
      kodB,
      zaleglosc: zalegloscKwota(p) ?? undefined,
    };
  },

  // b) zasiłek macierzyński
  macierzynski: (p) => {
    const d = p.dziecko ?? {};
    const ur = p.urlopy ?? {};
    const r = rodzice(p);
    const hosp = d.szpitalOd
      ? (() => {
          const koniec = d.szpitalDo ? new Date(d.szpitalDo) : new Date();
          const od = new Date(d.szpitalOd);
          if (Number.isNaN(od.getTime()) || Number.isNaN(koniec.getTime())) return null;
          const n = Math.round((koniec - od) / DZIEN) + 1;
          return n > 0 ? String(n) : null;
        })()
      : null;
    return {
      dzieci: d.liczbaDzieci ? clamp(d.liczbaDzieci, 5) : undefined,
      porod: d.dataUrodzenia || d.przewidywanaDataPorodu || undefined,
      zaZyciem: typeof d.zaZyciem === "boolean" ? d.zaZyciem : undefined,
      podstM: r.podstawaMatki || undefined,
      podstO: r.podstawaOjca || undefined,
      przedPorodem: (() => {
        // Profil ma datę planowanego urlopu przed porodem, kalkulator — liczbę tygodni.
        // Przeliczamy względem przewidywanej daty porodu (max 6 tyg. — art. 180 § 2 k.p.).
        if (!ur.urlopPrzedPorodemOd) return undefined;
        const start = new Date(ur.urlopPrzedPorodemOd);
        const pdp = new Date(d.przewidywanaDataPorodu || d.dataUrodzenia || "");
        if (Number.isNaN(start.getTime()) || Number.isNaN(pdp.getTime())) return undefined;
        const tyg = Math.round((pdp - start) / (7 * DZIEN));
        return tyg > 0 ? String(Math.min(tyg, 6)) : undefined;
      })(),
      szczegol: sytuacjaSzczegolna(d),
      zgon: d.dataZgonu || undefined,
      // Wniosek 81,5% ma sens tylko przy zamiarze pełnego wymiaru (art. 30a u.z.).
      wniosek81: ur.zamiarPelnyWymiar === "tak" ? true : ur.zamiarPelnyWymiar === "nie" ? false : undefined,
      // Część matki przejęta przez ojca. Profil trzyma to jako „matkaRezygnuje” (tak/nie),
      // ale bez liczby tygodni — kalkulator dobiera ją sam, więc pole zostawiamy bez zmian.
      dlaOjca: undefined,
      tydzCiazy: d.tydzienCiazy === "ponizej_28" ? "26" : d.tydzienCiazy === "28_37" ? "32" : d.tydzienCiazy === "po_37" ? "38" : undefined,
      masa: d.masaUrodzenia || undefined,
      hosp: hosp ?? undefined,
      // Pusta odpowiedź (u matki tego pytania nie ma) nie może wyłączać urlopu ojcowskiego w wyliczeniu.
      ojcowski: ur.planOjcowski === "tak" ? true : ur.planOjcowski === "nie" ? false : undefined,
    };
  },

  // c) łączenie urlopu z pracą
  laczenie: ({ ubezpieczony: u, dziecko: d, urlopy: ur }) => ({
    dzieci: d.liczbaDzieci ? clamp(d.liczbaDzieci, 2) : undefined,
    zaZyciem: typeof d.zaZyciem === "boolean" ? d.zaZyciem : undefined,
    podstawa: u.podstawaWymiaru || undefined,
    // Wymiar pracy z profilu: ≤ ½ etatu → 0.5, powyżej → 0.75 (silnik przytnie do ½ i ostrzeże).
    etat: ur.wymiarPracyPrzyLaczeniu === "do_polowy" ? "0.5"
      : ur.wymiarPracyPrzyLaczeniu === "powyzej" ? "0.75"
      : undefined,
    // Stawka zależy od tego, czy wniosek 81,5% został złożony.
    stawka: ur.zamiarPelnyWymiar === "tak" ? "81.5" : ur.zamiarPelnyWymiar === "nie" ? "70" : undefined,
  }),

  // d) oboje rodzice
  oboje: (p) => {
    const d = p.dziecko ?? {};
    const ur = p.urlopy ?? {};
    const r = rodzice(p);
    return {
      dzieci: d.liczbaDzieci ? clamp(d.liczbaDzieci, 2) : undefined,
      ur: d.dataUrodzenia || undefined,
      zaZyciem: typeof d.zaZyciem === "boolean" ? d.zaZyciem : undefined,
      pM: r.podstawaMatki || undefined,
      pO: r.podstawaOjca || undefined,
      // Wykorzystany rodzicielski to dane ZALOGOWANEGO – u ojca trafiają w kolumnę ojca.
      [r.jestOjcem ? "tO" : "tM"]: nieujemna(ur.rodzicielskiWykorzystanoTyg),
      [r.jestOjcem ? "cO" : "cM"]: nieujemna(ur.rodzicielskieCzesci),
      // Wykorzystany macierzyński to zawsze tygodnie matki.
      macM: nieujemna(ur.macierzynskiWykorzystanoTyg),
      wniosek81: ur.zamiarPelnyWymiar === "tak" ? true : ur.zamiarPelnyWymiar === "nie" ? false : undefined,
    };
  },

  // e) adopcja / rodzina zastępcza
  adopcja: ({ ubezpieczony: u, dziecko: d, sytuacja: s }) => ({
    // Zawodowa rodzina zastępcza NIE ma prawa do tego urlopu (art. 183 § 1 k.p.) – nie podstawiamy
    // „rodzinaZastepcza”, bo kalkulator pokazałby świadczenie, którego nie ma (wyjaśnia to /wnioski, W28).
    tryb: s.typPrzyjecia === "rodzina_zastepcza" ? "rodzinaZastepcza"
      : s.typPrzyjecia === "przysposobienie" ? "przysposobienie" : undefined,
    dzieci: d.liczbaDzieci ? clamp(d.liczbaDzieci, 5) : undefined,
    ur: d.dataUrodzenia || undefined,
    przyj: d.dataPrzyjecia || undefined,
    odroczenie: d.odroczonySzkolny === "tak" ? true : d.odroczonySzkolny === "nie" ? false : undefined,
    zaZyciem: typeof d.zaZyciem === "boolean" ? d.zaZyciem : undefined,
    podstawa: u.podstawaWymiaru || undefined,
  }),

  // f) podstawa wymiaru
  podstawa: ({ ubezpieczony: u }) => ({
    status: u.statusUbezpieczenia
      ? jestPracownikiem(u) ? "pracownik" : "niepracownik"
      : undefined,
    // B-17: minimum podstawy jest proporcjonalne do etatu.
    wymiarEtatu: u.wymiarEtatu === "czesc" ? "0.5" : u.wymiarEtatu === "pelny" ? "1" : undefined,
  }),

  // g) dokumenty i terminy
  dokumenty: (p) => {
    const u = p.ubezpieczony ?? {};
    const z = p.zdrowie ?? {};
    const s = p.sytuacja ?? {};
    return {
      status: statusPlatnika(u),
      liczba: liczbaUb(p) ?? undefined,
      zaleglosc: u.zaleglosci === "tak" ? true : u.zaleglosci === "nie" ? false : undefined,
      etap: etapDokumentow(p),
    };
  },
};

// set  - setter stanu kalkulatora (useState z obiektem)
// name - klucz z PICKS
// Zwraca wynik useProfile ({ profile, save, ... }) plus `podstawione` — listę pól,
// które przyszły z profilu (do pokazania użytkownikowi przez <ProfilInfo />).
export function useProfileDefaults(set, name) {
  const result = useProfile();
  const { profile } = result;
  const applied = useRef(false);
  const [podstawione, setPodstawione] = useState([]);

  useEffect(() => {
    if (!profile || applied.current) return;
    applied.current = true;
    const pick = PICKS[name];
    if (!pick) return;
    const patch = {};
    for (const [key, value] of Object.entries(pick(profile))) {
      // Klucze techniczne (zaczynające się od "_") nie trafiają do stanu.
      if (key.startsWith("_")) continue;
      if (value === undefined || value === null || value === "") continue;
      patch[key] = typeof value === "boolean" ? value : String(value);
    }
    if (Object.keys(patch).length) set((prev) => ({ ...prev, ...patch }));
    setPodstawione(Object.keys(patch));
  }, [profile, set, name]);

  return { ...result, podstawione, kalkulator: name };
}

/** Do testów: czysta funkcja bez Reacta — co zostałoby podstawione dla danego profilu. */
export function wyliczPodstawienie(profile, name) {
  const pick = PICKS[name];
  if (!profile || !pick) return {};
  const out = {};
  for (const [key, value] of Object.entries(pick(profile))) {
    if (key.startsWith("_")) continue;
    if (value === undefined || value === null || value === "") continue;
    out[key] = typeof value === "boolean" ? value : String(value);
  }
  return out;
}

export { PICKS };

/** Etykiety pól stanu kalkulatorów — do paska „dane z profilu”. */
export const ETYKIETY_POL = {
  status: "Tytuł ubezpieczenia",
  podstawa: "Podstawa wymiaru",
  ur: "Data urodzenia",
  dniUb: "Staż ubezpieczenia (dni)",
  liczbaUbPlatnika: "Liczba ubezpieczonych u płatnika",
  od: "Początek zwolnienia",
  kodB: "Zwolnienie z kodem B (ciąża)",
  zaleglosc: "Zaległość w składkach",
  dzieci: "Liczba dzieci",
  porod: "Data porodu",
  zaZyciem: "Zaświadczenie „Za życiem”",
  podstM: "Podstawa wymiaru — matka",
  podstO: "Podstawa wymiaru — ojciec",
  przedPorodem: "Urlop przed porodem (tyg.)",
  szczegol: "Sytuacja szczególna",
  zgon: "Data zgonu dziecka",
  wniosek81: "Wniosek o wariant 81,5%",
  ojcowski: "Urlop ojcowski",
  tydzCiazy: "Tydzień ciąży w chwili porodu",
  masa: "Masa urodzeniowa",
  hosp: "Pobyt w szpitalu (dni)",
  etat: "Wymiar pracy przy łączeniu",
  stawka: "Stawka zasiłku",
  pM: "Podstawa — matka",
  pO: "Podstawa — ojciec",
  tM: "Tygodnie rodzicielskiego — matka",
  cM: "Części urlopu — matka",
  macM: "Tygodnie macierzyńskiego — matka",
  tryb: "Tryb przyjęcia dziecka",
  przyj: "Data przyjęcia dziecka",
  odroczenie: "Odroczony obowiązek szkolny",
  wymiarEtatu: "Wymiar etatu",
  liczba: "Liczba ubezpieczonych",
  etap: "Etap sprawy",
};

/** Zamienia listę kluczy na gotowe do wyświetlenia wiersze {pole, etykieta, wartosc}. */
// Wartości techniczne stanu → tekst dla użytkownika (wcześniej pasek pokazywał np. „obw”, „porod”, „81.5”).
const WARTOSCI = {
  status: { obw: "obowiązkowe (umowa o pracę)", dobr: "dobrowolne", pracownik: "pracownik (umowa o pracę)", niepracownik: "nie-pracownik", zlecenie: "zlecenie", dg: "działalność gospodarcza" },
  etap: { ciazaL4: "ciąża – zwolnienie z kodem B", przedPorodem: "ciąża – urlop przed porodem", porod: "po porodzie", uzupelniajacy: "urlop uzupełniający", rodzicielski: "urlop rodzicielski", ojcowski: "urlop ojcowski", adopcja: "przyjęcie dziecka", utrata: "utrata pracy w ciąży", martwe: "martwe urodzenie / zgon dziecka" },
  szczegol: { martwe: "martwe urodzenie / zgon przed 8. tyg.", zgonPo: "zgon dziecka po 8. tyg." },
  tryb: { przysposobienie: "przysposobienie", rodzinaZastepcza: "rodzina zastępcza" },
  wymiarEtatu: { 1: "pełny etat", 0.75: "3/4 etatu", 0.5: "1/2 etatu", 0.25: "1/4 etatu" },
  etat: { 0.5: "do 1/2 etatu", 0.75: "powyżej 1/2 etatu" },
};
const KWOTY = new Set(["podstawa", "podstM", "podstO", "pM", "pO"]);
const DATY = new Set(["ur", "od", "porod", "zgon", "przyj"]);
const zlote = (v) => `${(Math.round(Number(v) * 100) / 100).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, " ")} zł`;
const dataPl = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v.slice(8, 10)}.${v.slice(5, 7)}.${v.slice(0, 4)}` : v);
// W kalkulatorze a) „ur” to data urodzenia MATKI (reguła 50+ dni), w pozostałych – dziecka.
const ETYKIETY_KALK = { chorobowy: { ur: "Twoja data urodzenia" } };

function wartoscDlaLudzi(pole, v) {
  if (typeof v === "boolean") return v ? "tak" : "nie";
  const s = String(v ?? "");
  if (s === "") return "";
  if (WARTOSCI[pole]?.[s] !== undefined) return WARTOSCI[pole][s];
  if (KWOTY.has(pole) && Number.isFinite(Number(s))) return zlote(s);
  if (DATY.has(pole)) return dataPl(s);
  if (pole === "stawka") return `${s.replace(".", ",")}%`;
  if (pole === "zaleglosc") return Number(s) > 0 ? "tak (powyżej progu)" : "nie";
  return s;
}

/** @param {string} [kalkulator] klucz z PICKS – dla etykiet zależnych od kalkulatora */
export function opisPodstawienia(klucze, stan, kalkulator) {
  return klucze.map((pole) => ({
    pole,
    etykieta: ETYKIETY_KALK[kalkulator]?.[pole] ?? ETYKIETY_POL[pole] ?? pole,
    wartosc: wartoscDlaLudzi(pole, stan?.[pole]),
  }));
}
