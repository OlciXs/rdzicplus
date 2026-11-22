import { describe, it, expect, vi } from "vitest";

/* Wniosek „Wysokość zasiłku macierzyńskiego – dodatkowe wnioski i oświadczenia”:
   W41 – 81,5% za cały okres (szablon P17), W44 – podwyższenie do kwoty świadczenia
   rodzicielskiego (szablon P18), W16 – oświadczenie o kilku tytułach ubezpieczenia
   (dokument ogólny). Kontrola terminu 21 dni. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { przygotujDruk } from "./druki.js";
import { zbudujDokumentLatex } from "./latexDokument.js";
import { latexDoBlokow, filtrujWarunki, zbudujPdf } from "./pdfDokument.js";

const FONTY = resolve(__dirname, "../../../public/fonts");

const profil = {
  ubezpieczony: { imie: "Anna", nazwisko: "Kowalska", adres: "ul. Kwiatowa 5/12, 00-001 Warszawa", pesel: "44051401359", statusUbezpieczenia: "pracownik" },
  sytuacja: { rola: "matka", etap: "po_porodzie" },
  platnik: { nazwa: "Firma ABC", adres: "ul. Przemysłowa 1, 00-002 Warszawa" },
  dziecko: { imie: "Jan", nazwisko: "Kowalski", dataUrodzenia: "2026-11-10", liczbaDzieci: 1 },
  urlopy: { zamiarPelnyWymiar: true },
};

describe("nowe szablony wysokosc", () => {
  for (const id of ["W41", "W44", "W16"]) {
    it(`${id}: druk + PDF`, async () => {
      const druk = przygotujDruk(profil, id);
      expect(druk.tryb).toBe("pracodawca");
      const latex = zbudujDokumentLatex(druk, profil, {});
      if (id === "W41") expect(latex.szablonId).toBe("P17");
      if (id === "W44") expect(latex.szablonId).toBe("P18");
      expect(latex.tex).toContain("\\NaglowekPisma");
      expect(latex.tex).not.toMatch(/undefined|NaN/);
      const bloki = latexDoBlokow(filtrujWarunki(latex.tex, druk, profil));
      expect(bloki.some((b) => b.typ === "naglowek")).toBe(true);
      vi.stubGlobal("fetch", vi.fn(async (url) => {
        const nazwa = String(url).split("/").pop();
        return new Response(readFileSync(resolve(FONTY, nazwa)), { status: 200 });
      }));
      try {
        const { doc, plik } = await zbudujPdf(druk, profil, {});
        expect(doc.getNumberOfPages()).toBeGreaterThan(0);
        expect(plik).toMatch(/\.pdf$/);
      } finally {
        vi.unstubAllGlobals();
      }
    });
  }
  it("W41: 30 dni po porodzie blokuje", () => {
    const p = { ...profil, dziecko: { ...profil.dziecko, dataUrodzenia: "2026-11-01" } };
    const druk = przygotujDruk(p, "W41", { dzis: "2026-12-01" });
    expect(druk.ostrzezenia.some((o) => o.poziom === "blad" && /21 dni/.test(o.tekst))).toBe(true);
  });
  it("W41 - niepracownik: tryb zam", () => {
    const niep = { ...profil, ubezpieczony: { ...profil.ubezpieczony, statusUbezpieczenia: "dg" } };
    const druk = przygotujDruk(niep, "W41");
    expect(druk.tryb).toBe("zam");
    expect(druk.tytul).toContain("ZAM");
  });
});
