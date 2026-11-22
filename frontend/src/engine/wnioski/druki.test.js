// Testy generatora wniosków do druku (druki.js): podstawianie danych z profilu,
// wyliczone okresy, kontrola terminów i odporność na puste / zepsute dane.
import { describe, it, expect } from "vitest";
import { przygotujDruk, DRUKI, maDruk, D } from "./druki.js";
import { WARIANTY } from "./rejestr.js";

const DZIS = "2026-11-21";
const profil = (s = {}) => ({
  ubezpieczony: { imie: "Anna", nazwisko: "Nowak", plec: "K", adres: "ul. Kwiatowa 5/12, 00-001 Warszawa", statusUbezpieczenia: "pracownik", ...s.ubezpieczony },
  sytuacja: { ...s.sytuacja },
  platnik: { nazwa: "Przedszkole Słoneczko sp. z o.o.", adres: "ul. Tęczowa 7, 00-950 Warszawa", ...s.platnik },
  drugiRodzic: { brak: false, imie: "Jan", nazwisko: "Nowak", statusUbezpieczenia: "pracownik", ...s.drugiRodzic },
  dziecko: { zaZyciem: false, imie: "Zosia", nazwisko: "Nowak", ...s.dziecko },
  zdrowie: { ...s.zdrowie },
  urlopy: { ...s.urlopy },
});
const druk = (p, id, wartosci) => przygotujDruk(p, id, { dzis: DZIS, wartosci });
const wartosc = (d, id) => d.pola.find((p) => p.id === id)?.wartosc;
const teksty = (d) => d.ostrzezenia.map((o) => o.tekst).join(" | ");

describe("druki – rejestr", () => {
  it("każdy druk odpowiada wariantowi z rejestru", () => {
    const ids = new Set(WARIANTY.map((v) => v.id));
    for (const id of DRUKI) expect(ids.has(id), id).toBe(true);
    expect(maDruk("W21")).toBe(true);
    expect(maDruk("W35")).toBe(false);
    expect(przygotujDruk(profil(), "W35")).toBeNull();
  });

  it("zła data w polu → błąd formatu", () => {
    const d = przygotujDruk(profil({ sytuacja: { etap: "po_porodzie", rola: "ojciec" } }), "W21", { dzis: DZIS, wartosci: { od: "2026-02-30" } });
    expect(d.ostrzezenia.some((o) => o.tekst.includes("zły format"))).toBe(true);
  });

  it("data w piśmie po polsku, pusta → miejsce do wpisania", () => {
    expect(D("2026-09-01")).toBe("01.09.2026");
    expect(D("")).toMatch(/^…+$/);
    expect(D("2026-02-30x")).toMatch(/^…+$/);
  });
});

describe("druki – dane z profilu", () => {
  const ojciec = profil({
    sytuacja: { etap: "po_porodzie", rola: "ojciec" },
    ubezpieczony: { imie: "Jan", plec: "M" },
    drugiRodzic: { imie: "Anna" },
    dziecko: { dataUrodzenia: "2026-11-10" },
  });

  it("W21: nagłówek, adresat, dziecko i 14 dni od najwcześniejszej daty", () => {
    const d = druk(ojciec, "W21");
    expect(d.tryb).toBe("pracodawca");
    expect(d.naglowek.miejscowoscData).toBe("Warszawa, 21.11.2026");
    expect(d.naglowek.nadawca[0]).toBe("Jan Nowak");
    expect(d.naglowek.adresat[0]).toBe("Przedszkole Słoneczko sp. z o.o.");
    expect(wartosc(d, "od")).toBe("2026-11-28"); // 7 dni od złożenia
    expect(wartosc(d, "do")).toBe("2026-12-11"); // 14 dni łącznie
    expect(d.tresc[0]).toContain("Zosia Nowak, ur. 10.11.2026");
    expect(d.tresc[0]).toContain("od 28.11.2026 do 11.12.2026");
    expect(d.brakujace).toEqual([]);
    expect(d.ostrzezenia.filter((o) => o.poziom === "blad")).toEqual([]);
  });

  it("W21: za krótki termin, zła długość części i po 12. miesiącu – błędy", () => {
    let d = druk(ojciec, "W21", { od: "2026-11-23", do: "2026-12-06" });
    expect(teksty(d)).toContain("co najmniej 7 dni przed");
    d = druk(ojciec, "W21", { czesc: "1", od: "2026-12-01", do: "2026-12-10" });
    expect(teksty(d)).toContain("część to 7 dni");
    d = druk(ojciec, "W21", { od: "2027-11-05", do: "2027-11-18" });
    expect(teksty(d)).toContain("do 09.11.2027");
  });

  it("oświadczenie J14 domyślnie zaznaczone, można je odznaczyć", () => {
    expect(druk(ojciec, "W21").tresc.join(" ")).toContain("nie korzystałem dotychczas");
    expect(druk(ojciec, "W21", { J14: false }).tresc.join(" ")).not.toContain("nie korzystałem dotychczas");
  });

  it("W1: okres urlopu z liczby dzieci, 81,5% po 21 dniach – błąd", () => {
    const matka = profil({ sytuacja: { etap: "po_porodzie", rola: "matka" }, dziecko: { dataUrodzenia: "2026-11-10", liczbaDzieci: "2" }, urlopy: { zamiarPelnyWymiar: "tak" } });
    const d = druk(matka, "W1");
    expect(wartosc(d, "do")).toBe("2027-06-14"); // 31 tyg. = 217 dni od 10.11.2026 włącznie
    expect(d.tresc.join(" ")).toContain("urodzenia 2 dzieci");
    expect(d.tresc.join(" ")).toContain("art. 179¹");
    expect(teksty(d)).not.toContain("21 dni po porodzie");
    const pozno = druk(matka, "W1", { dataZlozenia: "2026-12-05" });
    expect(teksty(pozno)).toContain("najpóźniej 21 dni po porodzie");
    // dłuższy okres niż należny
    expect(teksty(druk(matka, "W1", { liczbaDzieci: "1" }))).toContain("20 tygodni");
  });

  it("W2: więcej niż 6 tygodni przed porodem i za późny wniosek", () => {
    const ciaza = profil({ sytuacja: { etap: "ciaza", rola: "matka" }, dziecko: { przewidywanaDataPorodu: "2027-01-15" }, urlopy: { urlopPrzedPorodemOd: "2026-11-25" } });
    const d = druk(ciaza, "W2");
    expect(teksty(d)).toContain("najwyżej 6 tygodni");
    expect(teksty(d)).toContain("co najmniej 14 dni");
    const ok = druk(ciaza, "W2", { od: "2026-12-10" });
    expect(ok.ostrzezenia.filter((o) => o.poziom !== "info")).toEqual([]);
  });

  it("W22: ojciec nie może przejąć przed 14. tygodniem", () => {
    const p = profil({ sytuacja: { etap: "po_porodzie", rola: "ojciec" }, dziecko: { dataUrodzenia: "2026-09-01" }, urlopy: { macierzynskiWykorzystanoTyg: "14" } });
    const d = druk(p, "W22");
    expect(wartosc(d, "od")).toBe("2026-12-08");
    expect(wartosc(d, "do")).toBe("2027-01-18");
    expect(teksty(druk(p, "W22", { od: "2026-11-20" }))).toContain("dopiero po 14 tygodniach");
  });

  it("W4: termin końca macierzyńskiego i wymiar z hospitalizacji", () => {
    const p = profil({
      sytuacja: { etap: "po_porodzie", rola: "matka" },
      dziecko: { dataUrodzenia: "2026-10-01", pobytWSzpitalu: "tak", tydzienCiazy: "ponizej_28", szpitalOd: "2026-10-01", szpitalDo: "2026-11-04" },
      urlopy: { terminKoncaMacierzynskiego: "2027-02-17" },
    });
    const d = druk(p, "W4");
    expect(wartosc(d, "od")).toBe("2027-02-18");
    expect(wartosc(d, "do")).toBe("2027-03-24"); // 35 dni pobytu → 5 tyg.
    expect(d.tresc.join(" ")).toContain("Termin zakończenia urlopu macierzyńskiego: 17.02.2027");
    expect(d.zalaczniki.join(" ")).toContain("Oświadczenie drugiego rodzica");
    const brak = druk(profil({ sytuacja: { etap: "po_porodzie", rola: "matka" } }), "W4");
    expect(brak.brakujace).toContain("Termin zakończenia urlopu macierzyńskiego");
  });

  it("W25: pula na jednego rodzica i podział na tygodnie", () => {
    const p = profil({ sytuacja: { etap: "po_porodzie", rola: "matka" }, dziecko: { dataUrodzenia: "2026-09-01" }, urlopy: { rodzicielskiOd: "2027-01-19", rodzicielskiDo: "2027-10-25" } });
    const d = druk(p, "W25");
    expect(teksty(d)).toContain("najwyżej 32 z 41");
    expect(teksty(druk(p, "W25", { do: "2027-03-03" }))).toContain("wielokrotność tygodnia");
    expect(druk(p, "W25", { do: "2027-03-01", J2: false }).zalaczniki.join(" ")).not.toContain("drugiego rodzica");
  });

  it("W12: więcej niż pół etatu – błąd", () => {
    const p = profil({ sytuacja: { etap: "po_porodzie", rola: "matka" } });
    expect(teksty(druk(p, "W12", { wymiar: "3/4 etatu" }))).toContain("najwyżej na ½ etatu");
    expect(teksty(druk(p, "W12", { wymiar: "1/2 etatu" }))).not.toContain("½ etatu");
  });

  it("W28: urlop najpóźniej 21 dni od przyjęcia, wniosek w 7 dni", () => {
    const p = profil({ sytuacja: { etap: "przyjecie", rola: "matka", typPrzyjecia: "przysposobienie" }, dziecko: { dataUrodzenia: "2024-05-01", dataPrzyjecia: "2026-11-01" } });
    const d = druk(p, "W28");
    expect(d.tresc[0]).toContain("przysposobienia");
    expect(teksty(d)).toContain("w ciągu 7 dni");
    expect(teksty(druk(p, "W28", { od: "2026-11-30" }))).toContain("najpóźniej 21 dni");
  });

  it("osoba bez umowy o pracę dostaje ściągę do ZAM, nie pismo do pracodawcy", () => {
    const dg = profil({ sytuacja: { etap: "po_porodzie", rola: "matka" }, ubezpieczony: { statusUbezpieczenia: "dg" }, platnik: { nazwa: "" }, dziecko: { dataUrodzenia: "2026-11-10" } });
    const d = druk(dg, "W1");
    expect(d.tryb).toBe("zam");
    expect(d.tytul).toBe("Dane do wniosku ZAM (eZUS) – zasiłek macierzyński");
    expect(d.naglowek.adresat[0]).toContain("ZUS");
    expect(teksty(d)).not.toContain("nazwy pracodawcy");
  });
});

describe("druki – odporność", () => {
  const smieci = [
    {},
    { ubezpieczony: null, dziecko: null },
    profil({ dziecko: { dataUrodzenia: "zła data", liczbaDzieci: "-3", szpitalOd: "2026-12-01", szpitalDo: "2026-11-01", tydzienCiazy: "ponizej_28", pobytWSzpitalu: "tak" }, urlopy: { macierzynskiWykorzystanoTyg: "abc", terminKoncaMacierzynskiego: "2026-13-45" } }),
  ];
  it("pusty albo zepsuty profil – bez wyjątków, bez NaN/undefined/Invalid Date w treści", () => {
    for (const p of smieci) {
      for (const id of DRUKI) {
        const d = przygotujDruk(p, id, { dzis: DZIS, wartosci: { od: "2026-02-30", liczbaDzieci: "x" } });
        const tekst = JSON.stringify([d.tytul, d.naglowek, d.tresc, d.zalaczniki, d.ostrzezenia]);
        expect(tekst, id).not.toMatch(/NaN|undefined|Invalid Date|null/);
      }
    }
  });
});

describe("druki – odczyt dziecka z tablicy (regresja ZADANIE-3)", () => {
  const profilZDzieckiemWTablicy = profil({
    sytuacja: { etap: "po_porodzie", rola: "matka" },
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

  it("W21: dane dziecka z tablicy trafiają do pól wniosku", () => {
    const d = druk(profilZDzieckiemWTablicy, "W21");
    expect(wartosc(d, "dzieckoImie")).toBe("Zosia");
    expect(wartosc(d, "dzieckoNazwisko")).toBe("Nowak");
    expect(wartosc(d, "dzieckoUr")).toBe("2026-11-10");
  });

  it("W21: treść wniosku zawiera dane dziecka z tablicy", () => {
    const d = druk(profilZDzieckiemWTablicy, "W21");
    expect(d.tresc[0]).toContain("Zosia Nowak");
    expect(d.tresc[0]).toContain("ur. 10.11.2026");
  });

  it("W25: dane dziecka z tablicy trafiają do pól wniosku", () => {
    const d = druk(profilZDzieckiemWTablicy, "W25");
    expect(wartosc(d, "dzieckoImie")).toBe("Zosia");
    expect(wartosc(d, "dzieckoNazwisko")).toBe("Nowak");
    expect(wartosc(d, "dzieckoUr")).toBe("2026-11-10");
  });

  it("W1: data urodzenia z tablicy używana w polu porodu", () => {
    const d = druk(profilZDzieckiemWTablicy, "W1");
    expect(wartosc(d, "porod")).toBe("2026-11-10");
  });

  it("pusty profil nie powoduje błędu", () => {
    const d = przygotujDruk(null, "W21", { dzis: DZIS });
    expect(d).not.toBeNull();
    expect(d.pola.length).toBeGreaterThan(0);
  });

  it("profil z pustym dziecko nie powoduje błędu", () => {
    const d = przygotujDruk(profil({ dziecko: { imie: "", nazwisko: "", zaZyciem: false } }), "W21", { dzis: DZIS });
    expect(d).not.toBeNull();
    expect(wartosc(d, "dzieckoImie")).toBe("");
  });
});
