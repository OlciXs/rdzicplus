import { useEffect, useRef, useState } from "react";
import { useProfile } from "../profile.js";

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
const statusPlatnika = (u) =>
  ["pracownik", "zlecenie", "dg", "wspolpraca", "duchowny", "marynarz"].includes(u.statusUbezpieczenia)
    ? u.statusUbezpieczenia
    : undefined;

/** Liczba ubezpieczonych u płatnika jako liczba (kalkulator g potrzebuje wartości). */
const liczbaUb = (p) => {
  const v = p.platnik?.liczbaUbezpieczonych;
  if (v === "do_20") return "20";
  if (v === "powyzej_20") return "21";
  return null;
};

/** Kwota zaległości: profil trzyma „tak/nie”, silnik oczekuje kwoty. */
const zalegloscKwota = (p, prog = 48.06) => {
  const v = p.ubezpieczony?.zaleglosci;
  if (v === "tak") return String(prog + 1); // powyżej progu → blokada
  if (v === "nie") return "0";
  return null;
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
      szczegol: d.martwe === "tak" ? "martwe" : d.zmarlo === "tak" ? "zgonPo" : undefined,
      zgon: d.dataZgonu || undefined,
      // Wniosek 81,5% ma sens tylko przy zamiarze pełnego wymiaru (art. 30a u.z.).
      wniosek81: ur.zamiarPelnyWymiar === "tak" ? true : ur.zamiarPelnyWymiar === "nie" ? false : undefined,
      // Część matki przejęta przez ojca. Profil trzyma to jako „matkaRezygnuje” (tak/nie),
      // ale bez liczby tygodni — kalkulator dobiera ją sam, więc pole zostawiamy bez zmian.
      dlaOjca: undefined,
      tydzCiazy: d.tydzienCiazy === "ponizej_28" ? "26" : d.tydzienCiazy === "28_37" ? "32" : d.tydzienCiazy === "po_37" ? "38" : undefined,
      masa: d.masaUrodzenia || undefined,
      hosp: hosp ?? undefined,
      ojcowski: typeof ur.planOjcowski === "string" ? ur.planOjcowski === "tak" : undefined,
    };
  },

  // c) łączenie urlopu z pracą
  laczenie: ({ ubezpieczony: u, dziecko: d, urlopy: ur }) => ({
    dzieci: d.liczbaDzieci ? clamp(d.liczbaDzieci, 2) : undefined,
    zaZyciem: typeof d.zaZyciem === "boolean" ? d.zaZyciem : undefined,
    podstawa: u.podstawaWymiaru || undefined,
    // Wymiar pracy z profilu: ≤ ½ etatu → 0.5, powyżej → 0.5 (silnik i tak przytnie i ostrzeże).
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
      tM: liczba(ur.rodzicielskiWykorzystanoTyg) !== null ? String(liczba(ur.rodzicielskiWykorzystanoTyg)) : undefined,
      cM: liczba(ur.rodzicielskieCzesci) !== null ? String(liczba(ur.rodzicielskieCzesci)) : undefined,
      macM: liczba(ur.macierzynskiWykorzystanoTyg) !== null ? String(liczba(ur.macierzynskiWykorzystanoTyg)) : undefined,
      wniosek81: ur.zamiarPelnyWymiar === "tak" ? true : ur.zamiarPelnyWymiar === "nie" ? false : undefined,
    };
  },

  // e) adopcja / rodzina zastępcza
  adopcja: ({ ubezpieczony: u, dziecko: d, sytuacja: s }) => ({
    tryb: s.typPrzyjecia === "rodzina_zastepcza" || s.typPrzyjecia === "rodzina_zastepcza_zawodowa"
      ? "rodzinaZastepcza"
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
      // Etap: ciąża z L4 vs po porodzie.
      etap: z.zwolnienie === "B" || s.etap === "ciaza" ? "ciazaL4"
        : s.etap === "po_porodzie" ? "poPorodzie"
        : undefined,
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

  return { ...result, podstawione };
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
export function opisPodstawienia(klucze, stan) {
  return klucze.map((pole) => {
    const v = stan?.[pole];
    return {
      pole,
      etykieta: ETYKIETY_POL[pole] ?? pole,
      wartosc: typeof v === "boolean" ? (v ? "tak" : "nie") : String(v ?? ""),
    };
  });
}
