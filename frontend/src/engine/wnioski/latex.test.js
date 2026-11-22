/* =====================================================================
   Spójność generowanych plików LaTeX (latex/szablony/*.tex) ze źródłem
   (szablony_pism_2026.yaml).

   Chroni przed sytuacją: ktoś zmienia YAML, ale zapomina przegenerować
   LaTeX — albo pliki .tex zostają z nieaktualną treścią.

   Naprawa:  python3 latex/gen_latex.py
   ===================================================================== */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

// Katalog główny repo = 4 poziomy nad frontend/src/engine/wnioski (było 5 – poza repo, ENOENT w CI).
const KORZEN = resolve(__dirname, "../../../../");
const YAML = resolve(KORZEN, "szablony_pism_2026.yaml");
const LATEX = resolve(KORZEN, "latex");

const saPliki = existsSync(YAML) && existsSync(LATEX) ? describe : describe.skip;

saPliki("LaTeX — zgodność z szablonami pism", () => {
  // describe.skip też wykonuje to ciało przy zbieraniu testów – czytamy plik tylko, gdy istnieje.
  const dane = existsSync(YAML) ? parse(readFileSync(YAML, "utf-8")) : { szablony: [] };
  const ids = dane.szablony.map((s) => s.id);
  const katalog = resolve(LATEX, "szablony");

  it("istnieje generator, preambuła i katalog szablonów", () => {
    expect(existsSync(resolve(LATEX, "gen_latex.py"))).toBe(true);
    expect(existsSync(resolve(LATEX, "preamble.tex"))).toBe(true);
    expect(existsSync(katalog)).toBe(true);
  });

  it("każdy szablon z YAML ma wygenerowany plik .tex", () => {
    const pliki = readdirSync(katalog).filter((f) => f.endsWith(".tex"));
    for (const id of ids) {
      expect(pliki, `brak ${id}.tex — uruchom latex/gen_latex.py`).toContain(`${id}.tex`);
    }
  });

  it("nie ma osieroconych plików .tex (szablon usunięty z YAML)", () => {
    const pliki = readdirSync(katalog).filter((f) => f.endsWith(".tex"));
    for (const f of pliki) {
      const id = f.replace(".tex", "");
      expect(ids, `${f} nie ma odpowiednika w YAML`).toContain(id);
    }
  });

  it("każdy plik .tex jest kompletnym dokumentem", () => {
    for (const id of ids) {
      const tex = readFileSync(resolve(katalog, `${id}.tex`), "utf-8");
      expect(tex, `${id}: brak \\documentclass`).toContain("\\documentclass");
      expect(tex, `${id}: brak \\begin{document}`).toContain("\\begin{document}");
      expect(tex, `${id}: brak \\end{document}`).toContain("\\end{document}");
      // polskie znaki obsługiwane przez fontspec/polyglossia (nie inputenc)
      expect(tex, `${id}: brak fontspec`).toContain("fontspec");
      expect(tex, `${id}: brak polyglossia`).toContain("polyglossia");
    }
  });

  it("plik .tex zawiera nagłówek szablonu z YAML", () => {
    for (const s of dane.szablony) {
      const tex = readFileSync(resolve(katalog, `${s.id}.tex`), "utf-8");
      // nazwa trafia do metadanych (może być escapowana — porównujemy słowa)
      const slowo = s.nazwa.split(/\s+/)[0].replace(/[^\p{L}]/gu, "");
      expect(tex.toLowerCase(), `${s.id}: brak nazwy`).toContain(slowo.toLowerCase());
    }
  });

  it("w .tex nie ma nieprzetworzonych placeholderów {{...}}", () => {
    for (const id of ids) {
      const tex = readFileSync(resolve(katalog, `${id}.tex`), "utf-8");
      expect(tex, `${id}: pozostał {{placeholder}}`).not.toMatch(/\{\{[a-z_ąćęłńóśźż]+\}\}/);
      // bloki warunkowe też muszą być rozwinięte
      expect(tex, `${id}: pozostał blok {{#jesli}}`).not.toMatch(/\{\{#?\/?jesli_/);
    }
  });

  it("istnieje dokument zbiorczy i dokument decyzji", () => {
    expect(existsSync(resolve(LATEX, "szablony_pism.tex"))).toBe(true);
    expect(existsSync(resolve(LATEX, "decyzje_zus.tex"))).toBe(true);
  });

  it("polskie znaki nie są gubione (brak inputenc + T1)", () => {
    const pre = readFileSync(resolve(LATEX, "preamble.tex"), "utf-8");
    expect(pre).not.toContain("\\usepackage[utf8]{inputenc}");
    expect(pre).not.toContain("\\usepackage[T1]{fontenc}");
  });
});
