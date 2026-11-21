import { useEffect, useRef } from "react";
import { useProfile } from "../profile.js";

/* =====================================================================
   Podstawianie danych z profilu ("Moje dane") do kalkulatorów.
   - Działa tylko dla zalogowanych, którzy mają profil; reszta widzi
     kalkulator po staremu (wartości domyślne).
   - Podstawia raz, po wczytaniu profilu. Użytkownik może potem zmienić
     dowolne pole - nic nie jest nadpisywane ponownie.
   - Puste pola profilu nie zmieniają wartości domyślnych kalkulatora.
   - Płeć zalogowanego rodzica (ubezpieczony.plec, z PESEL-u: "K" / "M") decyduje,
     czy jego dane trafiają w pola "matka", czy "ojciec" (kalkulatory b i d);
     dane drugiego rodzica trafiają w pole przeciwne.
   Mapowanie jest w jednym miejscu (PICKS): klucz = pole stanu kalkulatora.
   ===================================================================== */

const clamp = (n, max) => String(Math.min(Math.max(Math.round(Number(n)) || 1, 1), max));

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
  // (dotyczy ciężarnej: dla ojca bierzemy tylko podstawę matki z "drugiego rodzica")
  chorobowy: (p) => {
    const u = p.ubezpieczony;
    const { jestOjcem, podstawaMatki } = rodzice(p);
    return {
      status: !jestOjcem && u.statusUbezpieczenia ? (u.statusUbezpieczenia === "pracownik" ? "obw" : "dobr") : undefined,
      podstawa: podstawaMatki,
      ur: jestOjcem ? undefined : u.dataUrodzenia,
    };
  },
  // b) zasiłek macierzyński
  macierzynski: (p) => {
    const d = p.dziecko;
    const r = rodzice(p);
    return {
      dzieci: clamp(d.liczbaDzieci, 5),
      porod: d.dataUrodzenia,
      zaZyciem: d.zaZyciem,
      podstM: r.podstawaMatki,
      podstO: r.podstawaOjca,
    };
  },
  // c) łączenie urlopu z pracą
  laczenie: ({ ubezpieczony: u, dziecko: d }) => ({
    dzieci: clamp(d.liczbaDzieci, 2),
    zaZyciem: d.zaZyciem,
    podstawa: u.podstawaWymiaru,
  }),
  // d) oboje rodzice
  oboje: (p) => {
    const d = p.dziecko;
    const r = rodzice(p);
    return {
      dzieci: clamp(d.liczbaDzieci, 2),
      ur: d.dataUrodzenia,
      zaZyciem: d.zaZyciem,
      pM: r.podstawaMatki,
      pO: r.podstawaOjca,
    };
  },
  // e) adopcja / rodzina zastępcza
  adopcja: ({ ubezpieczony: u, dziecko: d }) => ({
    dzieci: clamp(d.liczbaDzieci, 5),
    ur: d.dataUrodzenia,
    zaZyciem: d.zaZyciem,
    podstawa: u.podstawaWymiaru,
  }),
  // f) podstawa wymiaru
  podstawa: ({ ubezpieczony: u }) => ({
    status: u.statusUbezpieczenia ? (u.statusUbezpieczenia === "pracownik" ? "pracownik" : "niepracownik") : undefined,
  }),
  // g) dokumenty i terminy (duchowny / marynarz nie mają odpowiednika na liście)
  dokumenty: ({ ubezpieczony: u }) => ({
    status: ["pracownik", "zlecenie", "dg"].includes(u.statusUbezpieczenia) ? u.statusUbezpieczenia : undefined,
  }),
};

// set  - setter stanu kalkulatora (useState z obiektem)
// name - klucz z PICKS
// Zwraca wynik useProfile ({ profile, save, ... }), żeby nie pobierać profilu dwa razy.
export function useProfileDefaults(set, name) {
  const result = useProfile();
  const { profile } = result;
  const applied = useRef(false);

  useEffect(() => {
    if (!profile || applied.current) return;
    applied.current = true;
    const patch = {};
    for (const [key, value] of Object.entries(PICKS[name](profile))) {
      if (value === undefined || value === null || value === "") continue;
      patch[key] = typeof value === "boolean" ? value : String(value);
    }
    if (Object.keys(patch).length) set((prev) => ({ ...prev, ...patch }));
  }, [profile, set, name]);

  return result;
}
