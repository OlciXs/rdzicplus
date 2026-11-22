import { describe, it, expect } from "vitest";
import { przygotujDruk } from "./druki.js";
import { zbudujDokumentLatex, szablonyDlaWariantu } from "./latexDokument.js";
import { latexDoBlokow, filtrujWarunki } from "./pdfDokument.js";

const base = {
  ubezpieczony: { imie: "Jan", nazwisko: "Nowak", plec: "M", adres: "ul. Kwiatowa 5/12, 00-001 Warszawa", statusUbezpieczenia: "pracownik", peselMasked: "*******8260", wymiarEtatu: "pelny", podstawaWymiaru: "5000" },
  sytuacja: { etap: "po_porodzie", rola: "matka" },
  platnik: { nazwa: "Firma A & B", adres: "ul. Tęczowa 7, 00-950 Warszawa", nip: "1234567890" },
  drugiRodzic: { imie: "Anna", nazwisko: "Nowak" },
  dziecko: { imie: "Zosia", nazwisko: "Nowak", dataUrodzenia: "2026-11-10", liczbaDzieci: 1 },
  zdrowie: {}, urlopy: { macierzynskiWykorzystanoTyg: 0 },
};

describe("po naprawie", () => {
  for (const w of ["W5", "W11", "W22"]) {
    it(w, () => {
      const d = przygotujDruk(base, w, { dzis: "2026-11-21" });
      const dok = zbudujDokumentLatex(d, base);
      const bloki = latexDoBlokow(filtrujWarunki(dok.tex, d, base));
      const tekst = bloki.map(b => b.tekst).join("\n");
      console.log(`===== ${w} szablon=${dok.szablonId} plik=${dok.nazwaPliku} =====`);
      for (const b of bloki) console.log(`[${b.typ}]`, JSON.stringify(b.tekst));
      expect(tekst).not.toMatch(/\\[a-zA-Z]+/);
    });
  }
  it("ZAM", () => {
    const p = { ...base, ubezpieczony: { ...base.ubezpieczony, statusUbezpieczenia: "brak" } };
    const d = przygotujDruk(p, "W1", { dzis: "2026-11-21" });
    const dok = zbudujDokumentLatex(d, p, { szablonId: "P01" });
    console.log(`tryb=${d.tryb} szablon=${dok.szablonId} plik=${dok.nazwaPliku}`);
    for (const b of latexDoBlokow(filtrujWarunki(dok.tex, d, p))) console.log(`[${b.typ}]`, JSON.stringify(b.tekst));
    expect(dok.szablonId).toBe(null);
  });
});
