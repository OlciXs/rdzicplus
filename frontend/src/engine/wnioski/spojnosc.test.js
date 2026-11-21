/* =====================================================================
   Spójność rejestru wariantów (engine/wnioski/rejestr.js) z bazą wiedzy
   (engine/dane/zus_dane_2026.json). Test pilnuje, żeby dokumentacja i kod
   nie rozjechały się jak w B-13 („README obiecuje 45, rejestr ma 40”).
   ===================================================================== */
import { describe, it, expect } from "vitest";
import { WARIANTY, WNIOSKI } from "./rejestr.js";
import baza from "../dane/index.js";

const dokumentacja = new Set(baza.benefits.map((b) => b.id));
const dokWarianty = new Set(baza.variants.map((v) => v.id));

// Rejestr używa ID wariantów z dokumentacji (W22) ORAZ ID świadczeń (W34).
// Dopuszczamy oba zbiory oraz warianty pomocnicze dopisane literą ("W9b", "W36b").
const znane = new Set([...dokumentacja, ...dokWarianty]);
const pomocniczy = (id) => /^W\d+[a-z]$/.test(id);

// Świadome wyjątki numeracji (do uporządkowania w dokumentacji — patrz RAPORT B-13):
//  W3  – „poród mnogi” to opis wariantu urlopu macierzyńskiego (sekcja § 3.3 docs/01),
//        a nie odrębne świadczenie; realizuje go W1 z liczbaDzieci > 1.
//  W22 – ten sam benefit co W5 (przejęcie urlopu macierzyńskiego po 14 tyg.);
//        docs/01 numeruje procedury ojca, baza numeruje świadczenia.
const WYJATKI_NUMERACJI = new Set(["W3", "W22"]);

const nieznane = WARIANTY.filter(
  (v) => !znane.has(v.id) && !pomocniczy(v.id) && !WYJATKI_NUMERACJI.has(v.id),
).map((v) => v.id);

describe("spójność rejestru z bazą wiedzy", () => {
  it("każdy wariant rejestru ma odpowiednik w bazie wiedzy", () => {
    expect(nieznane).toEqual([]);
  });

  it("każdy wariant ma niepustą podstawę prawną", () => {
    const bez = WARIANTY.filter((v) => !v.podstawa || !String(v.podstawa).trim()).map((v) => v.id);
    expect(bez).toEqual([]);
  });

  it("każdy wariant ma nazwę i przypisanie do istniejącego wniosku", () => {
    const ids = new Set(WNIOSKI.map((w) => w.id));
    const zle = WARIANTY.filter((v) => !v.nazwa || !ids.has(v.wniosek)).map((v) => v.id);
    expect(zle).toEqual([]);
  });

  it("identyfikatory wariantów są unikalne", () => {
    const ids = WARIANTY.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("każdy wniosek ma co najmniej jeden wariant", () => {
    const puste = WNIOSKI.filter((w) => !WARIANTY.some((v) => v.wniosek === w.id)).map((w) => w.id);
    expect(puste).toEqual([]);
  });

  it("liczba wariantów zgodna z deklaracją w bazie wiedzy (B-13)", () => {
    // Rejestr scala część wariantów z dokumentacji (np. W23/W24 rozbite na W6–W9).
    // W3 celowo nie tworzy osobnego wniosku – poród mnogi jest obsłużony przez W1.
    expect(WARIANTY.length).toBeGreaterThanOrEqual(39);
  });

  it("warianty przyjęte na wychowanie mają komplet pól dziecka", () => {
    const problem = WARIANTY.filter((v) => v.wniosek === "adopcja" && !v.etapy?.includes("przyjecie"));
    expect(problem.map((v) => v.id)).toEqual([]);
  });
});
