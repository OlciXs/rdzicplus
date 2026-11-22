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

  it("tryb „zam” (osoba bez pracy) nie korzysta z pisma do pracodawcy", () => {
    const p = profil({ ubezpieczony: { statusUbezpieczenia: "brak" } });
    const d = przygotujDruk(p, "W1", { dzis: DZIS });
    expect(d.tryb).toBe("zam");

    // Nawet gdy ekran poda szablon pisma, w trybie ZAM powstaje zestawienie danych.
    const dok = zbudujDokumentLatex(d, p, { szablonId: "P01" });
    expect(dok.szablonId).toBe(null);
    expect(dok.zrodlo).toBe("ogolny");
    expect(dok.nazwaPliku).toMatch(/dane-do-wniosku-zam/);
    expect(dok.tex).toContain("Dane do wniosku ZAM");
    expect(dok.tex).not.toContain("Kodeksu pracy wnoszę");
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

  it("W21: dane dziecka z tablicy trafiają do LaTeX (regresja ZADANIE-3)", () => {
    const profilZTablica = profil({
      dziecko: {
        imie: "",
        nazwisko: "",
        dataUrodzenia: "",
        miejsceUrodzenia: "",
        dzieci: [
          { imie: "Zosia", nazwisko: "Nowak", dataUrodzenia: "2026-11-10", miejsceUrodzenia: "Warszawa" }
        ]
      }
    });
    const d = druk("W21", {}, {});
    const dok = zbudujDokumentLatex(d, profilZTablica);
    expect(dok.tex).toContain("Zosia Nowak");
    expect(dok.tex).toContain("10.11.2026");
  });

  it("daneDoLatex: dziecko z tablicy - imie i nazwisko", () => {
    const profilZTablica = profil({
      dziecko: {
        imie: "",
        nazwisko: "",
        dzieci: [
          { imie: "Zosia", nazwisko: "Nowak" }
        ]
      }
    });
    const d = druk("W21", {}, {});
    const dane = daneDoLatex(d, profilZTablica);
    expect(dane.dziecko_imie).toBe("Zosia Nowak");
  });

  it("daneDoLatex: dziecko z tablicy - data urodzenia", () => {
    const profilZTablica = profil({
      dziecko: {
        dataUrodzenia: "",
        dzieci: [
          { dataUrodzenia: "2026-11-10" }
        ]
      }
    });
    const d = druk("W21", {}, {});
    const dane = daneDoLatex(d, profilZTablica);
    expect(dane.data_porodu).toBe("10.11.2026");
  });

  it("daneDoLatex: top-level ma priorytet nad tablicą", () => {
    const profilZTopLevel = {
      ubezpieczony: {
        imie: "Jan",
        nazwisko: "Nowak",
        plec: "M",
        adres: "ul. Kwiatowa 5/12, 00-001 Warszawa",
        statusUbezpieczenia: "pracownik",
        peselMasked: "*******8260",
      },
      sytuacja: { etap: "po_porodzie", rola: "ojciec" },
      platnik: { nazwa: "Przedszkole Słoneczko sp. z o.o.", adres: "ul. Tęczowa 7, 00-950 Warszawa", nip: "1234567890" },
      drugiRodzic: { brak: false, imie: "Anna", nazwisko: "Nowak" },
      dziecko: {
        imie: "TopLevel",
        nazwisko: "Test",
        dataUrodzenia: "2026-01-01",
        zaZyciem: false,
        dzieci: [
          { imie: "Tablica", nazwisko: "Test", dataUrodzenia: "2026-11-10" }
        ]
      },
      zdrowie: {},
      urlopy: {},
    };
    const d = druk("W21", profilZTopLevel, {});
    const dane = daneDoLatex(d, profilZTopLevel);
    expect(dane.dziecko_imie).toBe("TopLevel Test");
    expect(dane.data_porodu).toBe("01.01.2026");
  });
});
