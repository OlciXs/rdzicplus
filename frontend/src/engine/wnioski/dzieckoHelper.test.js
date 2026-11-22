// Test regresyjny przepływu: odpis aktu → profil.dziecko/dzieci[] → wniosek do druku.
import { describe, it, expect } from "vitest";
import { przygotujDruk } from "./druki.js";
import { zbudujDokumentLatex } from "./latexDokument.js";
import { pobierzDaneDziecka, zapiszDaneDziecka } from "./dzieckoHelper.js";

const DZIS = "2026-11-21";

const profil = () => ({
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
    imie: "",
    nazwisko: "",
    dataUrodzenia: "",
    miejsceUrodzenia: "",
    liczbaDzieci: "2",
    zaZyciem: false,
    dzieci: [
      { imie: "Zosia", nazwisko: "Nowak", dataUrodzenia: "2026-11-10", miejsceUrodzenia: "Warszawa" },
      { imie: "", nazwisko: "", dataUrodzenia: "", miejsceUrodzenia: "" },
    ],
  },
  zdrowie: {},
  urlopy: {},
});

describe("zapis dziecka z odpisu i odczyt we wniosku", () => {
  it("zapisuje wybrane dziecko w top-level i dzieci[], nie mutując wejścia", () => {
    const before = profil();
    const po = zapiszDaneDziecka(before, {
      imie: "Jaś",
      nazwisko: "Nowak",
      dataUrodzenia: "2026-11-18",
      miejsceUrodzenia: "Kraków",
    }, 1);

    expect(before.dziecko.dzieci[1].imie).toBe("");
    expect(po.dziecko.imie).toBe("Jaś");
    expect(po.dziecko.dzieci[1]).toMatchObject({
      imie: "Jaś",
      nazwisko: "Nowak",
      dataUrodzenia: "2026-11-18",
      miejsceUrodzenia: "Kraków",
    });
    expect(po.dziecko.dzieci[0].imie).toBe("Zosia");
    expect(po.dziecko.liczbaDzieci).toBe("2");
  });

  it("po zapisie przygotujDruk i LaTeX podstawiają dane dziecka", () => {
    const p = zapiszDaneDziecka(profil(), {
      imie: "Jaś",
      nazwisko: "Nowak",
      dataUrodzenia: "2026-11-18",
      miejsceUrodzenia: "Kraków",
    }, 1);

    const d = przygotujDruk(p, "W21", { dzis: DZIS });
    const pole = (id) => d.pola.find((x) => x.id === id)?.wartosc;
    expect(pole("dzieckoImie")).toBe("Jaś");
    expect(pole("dzieckoNazwisko")).toBe("Nowak");
    expect(pole("dzieckoUr")).toBe("2026-11-18");

    const tex = zbudujDokumentLatex(d, p).tex;
    expect(tex).toContain("Jaś Nowak");
    expect(tex).toContain("18.11.2026");
  });

  it("pobierzDaneDziecka bierze pierwsze dziecko z tablicy, gdy top-level jest pusty", () => {
    const p = profil();
    const d = pobierzDaneDziecka(p);
    expect(d.imie).toBe("Zosia");
    expect(d.dataUrodzenia).toBe("2026-11-10");
  });

  it("liczba dzieci jest brana z tablicy, gdy top-level jest pusty", () => {
    const p = profil();
    p.dziecko.liczbaDzieci = "";
    const d = przygotujDruk(p, "W1", { dzis: DZIS });
    expect(d.pola.find((x) => x.id === "liczbaDzieci").wartosc).toBe(2);
  });
});
