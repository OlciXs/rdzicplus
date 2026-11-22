// Testy dokumentu LaTeX do zapisu: mapowanie wariant → szablon,
// podstawianie danych z formularza, escapowanie znaków i fallback.
import { describe, it, expect } from "vitest";
import { przygotujDruk } from "./druki.js";
import {
  SZABLONY_LATEX,
  szablonyDlaWariantu,
  daneDoLatex,
  zbudujDokumentLatex,
  latexEsc,
} from "./latexDokument.js";

const DZIS = "2026-11-21";
const profil = (s = {}) => ({
  ubezpieczony: {
    imie: "Jan",
    nazwisko: "Nowak",
    plec: "M",
    adres: "ul. Kwiatowa 5/12, 00-001 Warszawa",
    statusUbezpieczenia: "pracownik",
    peselMasked: "*******8260",
    ...s.ubezpieczony,
  },
  sytuacja: { etap: "po_porodzie", rola: "ojciec", ...s.sytuacja },
  platnik: { nazwa: "Przedszkole Słoneczko sp. z o.o.", adres: "ul. Tęczowa 7, 00-950 Warszawa", nip: "1234567890", ...s.platnik },
  drugiRodzic: { brak: false, imie: "Anna", nazwisko: "Nowak", ...s.drugiRodzic },
  dziecko: { zaZyciem: false, imie: "Zosia", nazwisko: "Nowak", dataUrodzenia: "2026-11-10", ...s.dziecko },
  zdrowie: { ...s.zdrowie },
  urlopy: { ...s.urlopy },
});

const druk = (id, s, wartosci) => przygotujDruk(profil(s), id, { dzis: DZIS, wartosci });

describe("LaTeX — mapowanie szablonów", () => {
  it("W21 ma szablon ojcowski P05", () => {
    expect(SZABLONY_LATEX.W21).toEqual(["P05"]);
    expect(szablonyDlaWariantu("W21").map((s) => s.id)).toEqual(["P05"]);
    expect(szablonyDlaWariantu("W21")[0].nazwa).toMatch(/ojcowskiego/i);
  });

  it("warianty bez szablonu zwracają pustą listę", () => {
    expect(szablonyDlaWariantu("W5")).toEqual([]);
    expect(szablonyDlaWariantu("nieznany")).toEqual([]);
  });
});

describe("LaTeX — wypełnianie danych", () => {
  it("W21: dane z formularza trafiają do szablonu", () => {
    const d = druk("W21");
    const dok = zbudujDokumentLatex(d, profil());

    expect(dok.szablonId).toBe("P05");
    expect(dok.nazwaPliku).toMatch(/^p05-.*\.tex$/);
    expect(dok.tex).toContain("Jan Nowak");
    expect(dok.tex).toContain("Przedszkole Słoneczko sp. z o.o.");
    expect(dok.tex).toContain("Zosia Nowak");
    expect(dok.tex).toContain("28.11.2026");
    expect(dok.tex).toContain("11.12.2026");
    expect(dok.tex).not.toContain("\\Pole{imie}");
    expect(dok.tex).not.toContain("\\Pole{urlop od}");
  });

  it("puste pole zostaje jako linia do uzupełnienia", () => {
    const d = druk("W21", {
      ubezpieczony: { peselMasked: "" },
    });
    const dok = zbudujDokumentLatex(d, profil({ ubezpieczony: { peselMasked: "" } }));
    expect(dok.tex).toContain("\\Pole{pesel}");
  });

  it("wybór innego szablonu z listy (W25)", () => {
    const d = druk("W25", {
      dziecko: { dataUrodzenia: "2026-11-10" },
      urlopy: { rodzicielskiOd: "2027-02-18", rodzicielskiDo: "2027-03-03" },
    });
    const dok = zbudujDokumentLatex(d, profil(), { szablonId: "P06" });
    expect(dok.szablonId).toBe("P06");
    expect(dok.tex).toContain("WNIOSEK O UDZIELENIE URLOPU RODZICIELSKIEGO");
  });

  it("P06: tygodnie matki nie biorą się z tygodni rodzicielskich", () => {
    const p = profil({ urlopy: { macierzynskiWykorzystanoTyg: "8", rodzicielskiWykorzystanoTyg: "5" } });
    const d = przygotujDruk(p, "W25", { dzis: DZIS, wartosci: { od: "2027-02-18", do: "2027-03-03", wykorzystanoTyg: "5" } });
    const tex = zbudujDokumentLatex(d, p, { szablonId: "P06" }).tex;
    expect(tex).toContain("wykorzystała 8 tygodni");
    expect(tex).not.toContain("wykorzystała 5 tygodni");
  });

  it("znaki specjalne LaTeX-a są escapowane", () => {
    expect(latexEsc("A & B 100% #1_x")).toBe("A \\& B 100\\% \\#1\\_x");
    const p = profil({ platnik: { nazwa: "Firma A & B" } });
    const dok = zbudujDokumentLatex(przygotujDruk(p, "W21", { dzis: DZIS }), p);
    expect(dok.tex).toContain("Firma A \\& B");
  });

  it("wariant bez szablonu dostaje dokument ogólny z danymi", () => {
    const d = druk("W5", { dziecko: { dataUrodzenia: "2026-11-10" } });
    const dok = zbudujDokumentLatex(d, profil());
    expect(dok.szablonId).toBe(null);
    expect(dok.zrodlo).toBe("ogolny");
    expect(dok.tex).toContain("\\documentclass");
    expect(dok.tex).toContain("RodzicPlus");
    expect(dok.tex).toContain("Jan Nowak");
  });
});
