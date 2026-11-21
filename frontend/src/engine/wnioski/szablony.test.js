/* =====================================================================
   Spójność szablonów pism (szablony_pism_2026.yaml) z bazą wiedzy
   (zus_dane_2026.yaml). Testy chronią przed rozjechaniem się plików:
   - każdy szablon wskazuje istniejący wariant,
   - każdy placeholder jest opisany w słowniku,
   - formularze ZUS w szablonach istnieją w bazie,
   - mapowanie wariant → szablony jest domknięte.
   ===================================================================== */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

// Katalog główny repo = 4 poziomy nad frontend/src/engine/wnioski (wcześniej 5 – wychodziło POZA repo,
// więc w CI testy padały na ENOENT, a deploy zatrzymywał się na „npm test”).
const KORZEN = resolve(__dirname, "../../../../");
const SZABLONY = resolve(KORZEN, "szablony_pism_2026.yaml");
// Baza wiedzy: YAML w katalogu głównym (jeśli ktoś go ma), inaczej ta sama baza w JSON z repo.
const BAZA_YAML = resolve(KORZEN, "zus_dane_2026.yaml");
const BAZA = existsSync(BAZA_YAML) ? BAZA_YAML : resolve(__dirname, "../dane/zus_dane_2026.json");

const PLACEHOLDER = /\{\{([a-z_ąćęłńóśźż]+)\}\}/g;
const wszystkiePlaceholdery = (tekst) => [...tekst.matchAll(PLACEHOLDER)].map((m) => m[1]);

const opisTestu = existsSync(SZABLONY) && existsSync(BAZA) ? describe : describe.skip;

opisTestu("szablony pism — spójność z bazą wiedzy", () => {
  // describe.skip też wykonuje to ciało przy zbieraniu testów – czytamy pliki tylko, gdy istnieją.
  const jest = existsSync(SZABLONY) && existsSync(BAZA);
  const sz = jest ? parse(readFileSync(SZABLONY, "utf-8")) : { szablony: [], placeholdery: {}, mapowanie_wariantow: {}, decyzje_zus: [] };
  const baza = jest ? parse(readFileSync(BAZA, "utf-8")) : { variants: [], forms: [] }; // YAML jest nadzbiorem JSON
  const warianty = new Set(baza.variants.map((v) => v.id));
  const formularze = new Set(baza.forms.map((f) => f.symbol));

  it("każdy szablon ma wymagane pola i wskazuje wariant z bazy", () => {
    for (const s of sz.szablony) {
      expect(s.id, "id szablonu").toBeTruthy();
      expect(s.nazwa, `${s.id}: nazwa`).toBeTruthy();
      expect(s.tresc, `${s.id}: treść`).toBeTruthy();
      expect(["pismo_pracodawca", "formularz_zus", "oswiadczenie"], `${s.id}: kanał`)
        .toContain(s.kanal);
      if (s.wariant) expect(warianty.has(s.wariant), `${s.id}: wariant ${s.wariant}`).toBe(true);
    }
  });

  it("każdy placeholder w treści jest opisany w słowniku", () => {
    const znane = new Set(Object.keys(sz.placeholdery));
    for (const s of sz.szablony) {
      for (const p of wszystkiePlaceholdery(s.tresc)) {
        // sekcje warunkowe #jesli_* to nie dane
        if (p.startsWith("jesli_")) continue;
        expect(znane.has(p), `${s.id}: nieopisany placeholder {{${p}}}`).toBe(true);
      }
    }
  });

  it("każdy placeholder ze słownika ma opis i typ", () => {
    for (const [nazwa, meta] of Object.entries(sz.placeholdery)) {
      expect(meta.opis, `${nazwa}: opis`).toBeTruthy();
      expect(meta.typ, `${nazwa}: typ`).toBeTruthy();
    }
  });

  it("formularze ZUS w szablonach istnieją w bazie", () => {
    for (const s of sz.szablony) {
      for (const f of s.formularz_zus?.match(/\b(ZAM|ZUR|ZAO|Z-3a?b?|Z-15A|Z-15B|ZAS-\d+)\b/g) ?? []) {
        expect(formularze.has(f), `${s.id}: nieznany formularz ${f}`).toBe(true);
      }
    }
  });

  it("mapowanie wariant → szablony jest domknięte w obie strony", () => {
    const ids = new Set(sz.szablony.map((s) => s.id));
    for (const [wariant, lista] of Object.entries(sz.mapowanie_wariantow)) {
      expect(warianty.has(wariant), `mapowanie: nieznany wariant ${wariant}`).toBe(true);
      for (const id of lista) expect(ids.has(id), `mapowanie: nieznany szablon ${id}`).toBe(true);
    }
    // każdy szablon z wariantem powinien być w mapowaniu
    for (const s of sz.szablony) {
      if (!s.wariant) continue;
      expect(sz.mapowanie_wariantow[s.wariant], `${s.id}: brak w mapowaniu`).toContain(s.id);
    }
  });

  it("decyzje ZUS są opisane jako struktura, nie jako gotowa treść do podrobienia", () => {
    for (const d of sz.decyzje_zus) {
      expect(d.struktura?.length, `${d.id}: struktura`).toBeGreaterThan(0);
      expect(d.typ, `${d.id}: typ`).toBeTruthy();
    }
  });

  it("każdy szablon ma zastrzeżenie, czy wolno go użyć jako pismo własne", () => {
    for (const s of sz.szablony) {
      expect(s.uwagi, `${s.id}: brak uwag/o zastrzeżeń`).toBeTruthy();
    }
    // wnioski do ZUS nie mogą być podawane jako gotowe pismo
    const doZus = sz.szablony.filter((s) => s.kanal === "formularz_zus");
    expect(doZus.length).toBeGreaterThan(0);
    for (const s of doZus) expect(s.tresc).toContain("FORMULARZ ZUS");
  });

  it("pokrycie: kluczowe warianty rodzicielskie mają szablon", () => {
    const pokryte = new Set(Object.keys(sz.mapowanie_wariantow));
    for (const w of ["VAR01", "VAR06", "VAR16", "VAR17", "VAR18", "VAR19", "VAR20", "VAR24"]) {
      expect(pokryte.has(w), `brak szablonu dla ${w}`).toBe(true);
    }
  });
});
