/* =====================================================================
   Testy regresyjne dla błędów z RAPORT_BLEDOW.md.
   Każdy test odpowiada jednemu punktowi raportu — jeżeli poprawka zostanie
   cofnięta, ten plik natychmiast to wykryje.

   B-01  limit 14 dni po 50 r.ż.          B-12  płatnik przy dobrowolnym
   B-02  próg 5 dni hospitalizacji         B-14  marynarz a zadłużenie
   B-03  70% dla części ojca               B-15  reset okresu przy kodzie B
   B-04  brak podstawy wymiaru             B-16  limit 5 części łącznie
   B-06  adopcja „Za życiem” 65/62 tyg.    B-17  minimum proporcjonalne
   B-07  wiek dziecka na granicy limitu    B-21  NaN/Infinity nie wchodzą
   B-08  ojcowski: 12 miesięcy kalendarz.  B-22  ujemne premie odrzucone
   B-10  adopcja: termin startu urlopu     B-23  liczba dzieci 1..5
   B-11  płatnik „zawsze ZUS”              B-24  ujemna podstawa = brak danych
   ===================================================================== */
import { describe, it, expect } from "vitest";
import { chorobowyWCiazy } from "./chorobowy.js";
import { zasilekMacierzynski } from "./macierzynski.js";
import { adopcja } from "./adopcja.js";
import { podstawaWymiaru } from "./podstawa.js";
import { obojeRodzice } from "./oboje.js";
import { ktoWyplaca } from "./platnik.js";
import { terminUrlopuOjcowskiego, terminAdopcji, terminRodzicielskiego } from "./terminy.js";
import { kontekstSprawy } from "./wnioski/kontekst.js";

const baza = ({ dniUbezpieczenia = 400, liczbaUbPlatnika = 34, podstawa = 6000 } = {}) => ({
  status: "obw",
  dniUbezpieczenia,
  liczbaUbPlatnika,
  podstawa,
  poczatek: "2026-03-01",
  dniNiezdolnosci: 20,
});

const profil = (o = {}) => ({
  ubezpieczony: {
    statusUbezpieczenia: "pracownik", ubezpieczenieOd: "2020-01-01",
    ubezpieczenieUstalo: "nie", podstawaWymiaru: "5000", adres: "A", rachunek: "1",
    ...(o.u ?? {}),
  },
  sytuacja: { rola: "matka", etap: "po_porodzie", ...(o.s ?? {}) },
  platnik: { nazwa: "P", nip: "1", liczbaUbezpieczonych: "powyzej_20" },
  drugiRodzic: { statusUbezpieczenia: "pracownik", okolicznosc: "brak", pesel: "80010112345" },
  dziecko: { dataUrodzenia: "2026-01-01", liczbaDzieci: "1", martwe: "nie", imie: "A", nazwisko: "B", ...(o.dz ?? {}) },
  zdrowie: {}, urlopy: {},
});

describe("B-01 · limit 14 dni wynagrodzenia chorobowego po 50. roku życia", () => {
  const limit = (ur, poczatek) =>
    chorobowyWCiazy({ ...baza(), dataUrodzenia: ur, poczatek }).limitWynagrodzenia;

  it("przed ukończeniem 50 lat → 33 dni", () => {
    expect(limit("1990-01-01", "2026-03-01")).toBe(33);
  });

  it("kończy 50 lat w roku niezdolności → nadal 33 dni (limit od następnego roku)", () => {
    expect(limit("1976-06-01", "2026-11-01")).toBe(33);
  });

  it("ukończyła 50 lat w roku poprzednim → 14 dni", () => {
    expect(limit("1976-12-31", "2027-01-05")).toBe(14);
  });

  it("ukończy 50 lat w następnym roku → 33 dni", () => {
    expect(limit("1977-01-01", "2027-01-05")).toBe(33);
  });

  it("dawno po 50. → 14 dni", () => {
    expect(limit("1960-01-01", "2026-03-01")).toBe(14);
  });
});

describe("B-02 · uzupełniający urlop wymaga co najmniej 5 dni hospitalizacji", () => {
  const hosp = (dni) =>
    zasilekMacierzynski({
      dzieci: 1, porod: "2026-03-01", podstawaMatki: 5000,
      tydzienCiazy: 26, masa: 900, dniHospitalizacji: dni,
    }).tygUzup;

  it("3 dni → brak urlopu", () => expect(hosp(3)).toBe(0));
  it("4 dni → brak urlopu", () => expect(hosp(4)).toBe(0));
  it("5 dni → 1 tydzień", () => expect(hosp(5)).toBe(1));
  it("30 dni → 5 tygodni", () => expect(hosp(30)).toBe(5));
});

describe("B-03 · część urlopu przejęta przez ojca to zawsze 70%", () => {
  const r = zasilekMacierzynski({
    dzieci: 1, porod: "2026-03-01", podstawaMatki: 5000, podstawaOjca: 4000,
    wniosek815: true, tygodnieDlaOjca: 3,
  });

  it("matka pozostaje w wariancie 81,5%", () => expect(r.stMac).toBe(81.5));
  it("ojciec ma 70% (art. 31 ust. 3f u.z.)", () => {
    expect(r.wiersze.find((w) => w.id === "ojciecMac")?.stawka).toBe(70);
  });
});

describe("B-04 · brak podstawy wymiaru jest sygnalizowany", () => {
  it("podstawa 0 → brakPodstawy", () => {
    expect(zasilekMacierzynski({ dzieci: 1, porod: "2026-03-01", podstawaMatki: 0 }).brakPodstawy).toBe(true);
  });
  it("podstawa > 0 → brak flagi", () => {
    expect(zasilekMacierzynski({ dzieci: 1, porod: "2026-03-01", podstawaMatki: 5000 }).brakPodstawy).toBe(false);
  });
});

describe("B-06 · adopcja: 62 tyg. tylko dla rodziny zastępczej", () => {
  const pula = (tryb, zaZyciem) =>
    adopcja({ tryb, dzieci: 1, zaZyciem, dataUrodzenia: "2020-01-01", dataPrzyjecia: "2026-01-01", podstawa: 5000 }).pula;

  it("przysposobienie → 41 tyg.", () => expect(pula("przysposobienie", false)).toBe(41));
  it("przysposobienie + „Za życiem” → 65 tyg.", () => expect(pula("przysposobienie", true)).toBe(65));
  it("rodzina zastępcza → 38 tyg.", () => expect(pula("rodzinaZastepcza", false)).toBe(38));
  it("rodzina zastępcza + „Za życiem” → 62 tyg.", () => expect(pula("rodzinaZastepcza", true)).toBe(62));
});

describe("B-07 · wiek dziecka na granicy limitu liczymy datami", () => {
  const brak = (ur, przyj, tryb = "przysposobienie") =>
    adopcja({ tryb, dzieci: 1, dataUrodzenia: ur, dataPrzyjecia: przyj, podstawa: 5000 }).brakPrawa;

  it("14 lat dokładnie → mieści się w limicie", () => expect(brak("2012-01-01", "2026-01-01")).toBe(false));
  it("14 lat i 1 dzień → po limicie", () => expect(brak("2012-01-01", "2026-01-02")).toBe(true));
  it("13 lat → mieści się", () => expect(brak("2013-01-01", "2026-01-01")).toBe(false));
  it("rodzina zastępcza: 7 lat dokładnie → mieści się", () =>
    expect(brak("2019-01-01", "2026-01-01", "rodzinaZastepcza")).toBe(false));
});

describe("B-08/B-10 · terminy liczone kalendarzowo", () => {
  it("ojcowski: 12 miesięcy to ta sama data w kolejnym roku", () => {
    const t = terminUrlopuOjcowskiego({ dataUrodzeniaDziecka: "2026-01-31" }).termin;
    expect([t.getFullYear(), t.getMonth(), t.getDate()]).toEqual([2027, 0, 31]);
  });

  it("rodzicielski: koniec roku kalendarzowego = 31 grudnia", () => {
    const t = terminRodzicielskiego({ dataUrodzeniaDziecka: "2026-12-31" }).termin;
    expect([t.getFullYear(), t.getMonth(), t.getDate()]).toEqual([2032, 11, 31]);
  });

  it("adopcja: start urlopu po 21 dniach wykryty", () => {
    expect(terminAdopcji({ dataPrzyjecia: "2026-01-01", dataStartuUrlopu: "2026-01-20" }).poTerminieStartu).toBe(false);
    expect(terminAdopcji({ dataPrzyjecia: "2026-01-01", dataStartuUrlopu: "2026-02-01" }).poTerminieStartu).toBe(true);
  });
});

describe("B-11/B-12 · płatnik zasiłku (art. 61 ust. 1 pkt 2 u.z.)", () => {
  it.each(["dg", "wspolpraca", "duchowny", "marynarz", "poUstaniu"])(
    "%s → zawsze ZUS, nawet przy > 20 ubezpieczonych", (status) => {
      expect(ktoWyplaca({ status, liczbaUbezpieczonych: 100 }).kto).toBe("ZUS");
    },
  );

  it("pracownik u dużego płatnika → płatnik", () => {
    expect(ktoWyplaca({ status: "pracownik", liczbaUbezpieczonych: 100 }).kto).toBe("PLATNIK");
  });

  it("pracownik u płatnika ≤ 20 → ZUS", () => {
    expect(ktoWyplaca({ status: "pracownik", liczbaUbezpieczonych: 20 }).kto).toBe("ZUS");
  });

  it("chorobowy dobrowolny u dużego płatnika → ZUS", () => {
    const r = chorobowyWCiazy({ ...baza({ liczbaUbPlatnika: 100 }), status: "dobr", dniUbezpieczenia: 200 });
    expect(r.platnik.kto).toBe("ZUS");
  });
});

describe("B-15 · kod „B” resetuje okres zasiłkowy", () => {
  it("wcześniejsze zwolnienia bez B → okres liczony od nowa", () => {
    const r = chorobowyWCiazy({
      ...baza(), kodB: true, wczesniejszeBezB: true, wykorzystanyOkres: 200, dniNiezdolnosci: 30,
    });
    expect(r.pozostaloPrzed).toBe(270);
    expect(r.resetOkresuZasilkowego).toBe(true);
  });

  it("bez wcześniejszych zwolnień → okres się nie resetuje", () => {
    const r = chorobowyWCiazy({ ...baza(), kodB: true, wykorzystanyOkres: 200, dniNiezdolnosci: 30 });
    expect(r.pozostaloPrzed).toBe(70);
  });
});

describe("B-16 · limit 5 części urlopu rodzicielskiego jest łączny", () => {
  const czesci = (m, o) =>
    obojeRodzice({
      dzieci: 1, dataUrodzenia: "2026-03-01", tygodnieMatka: 20, tygodnieOjciec: 20,
      czesciMatka: m, czesciOjciec: o, podstawaMatki: 5000, podstawaOjca: 5000,
    });

  it("3 + 2 = 5 → bez błędu", () => expect(czesci(3, 2).bledy.some((b) => b.includes("części"))).toBe(false));
  it("5 + 5 = 10 → błąd", () => expect(czesci(5, 5).bledy.some((b) => b.includes("części"))).toBe(true));
});

describe("B-17 · minimum podstawy proporcjonalne do etatu", () => {
  it("pełny etat → 4 147,10 zł", () => {
    expect(podstawaWymiaru({ status: "pracownik", miesiace: [1000] }).podstawa).toBe(4147.1);
  });
  it("½ etatu → połowa minimum", () => {
    expect(podstawaWymiaru({ status: "pracownik", miesiace: [1000], wymiarEtatu: 0.5 }).podstawa).toBe(2073.55);
  });
});

describe("B-21/B-22 · wartości skrajne nie psują wyniku", () => {
  const zle = [NaN, Infinity, -Infinity, -1000, "abc", undefined, null];

  it.each(zle)("premia %s nie daje NaN/Infinity", (v) => {
    const r = podstawaWymiaru({ miesiace: [5000], premieKwartalne: v, premiaRoczna: v });
    expect(Number.isFinite(r.podstawa)).toBe(true);
    expect(r.podstawa).toBeGreaterThan(0);
  });

  it.each(zle)("niezdolność %s nie daje NaN", (v) => {
    const r = chorobowyWCiazy({ ...baza(), dniNiezdolnosci: v });
    expect(Number.isFinite(r.kwotaRazem)).toBe(true);
  });

  it.each(zle)("podstawa %s w macierzyńskim nie daje NaN", (v) => {
    const r = zasilekMacierzynski({ dzieci: 1, porod: "2026-03-01", podstawaMatki: v, podstawaOjca: v });
    expect(Number.isFinite(r.sumaMatka)).toBe(true);
  });

  it("ujemna premia nie obniża podstawy poniżej wynagrodzenia", () => {
    const bez = podstawaWymiaru({ miesiace: [5000] }).podstawa;
    const ujemna = podstawaWymiaru({ miesiace: [5000], premieKwartalne: -1000 }).podstawa;
    expect(ujemna).toBe(bez);
  });
});

describe("B-23/B-24 · sanityzacja profilu", () => {
  const ctx = (o) => kontekstSprawy(profil(o), { dzis: "2026-06-01" });

  it("liczba dzieci 99 → ograniczona do 5", () => {
    expect(ctx({ dz: { liczbaDzieci: "99" } }).liczbaDzieci).toBe(5);
  });
  it("liczba dzieci 0 → brak danych", () => {
    expect(ctx({ dz: { liczbaDzieci: "0" } }).liczbaDzieci).toBeNull();
  });
  it("liczba dzieci „abc” → brak danych", () => {
    expect(ctx({ dz: { liczbaDzieci: "abc" } }).liczbaDzieci).toBeNull();
  });
  it("ujemna podstawa → brak danych", () => {
    expect(ctx({ u: { podstawaWymiaru: "-5000" } }).podstawa).toBeNull();
  });
  it("marynarz z zaległością → blokada (B-14)", () => {
    expect(ctx({ u: { statusUbezpieczenia: "marynarz", zaleglosci: "tak" } }).blokadaZadluzenia).toBe(true);
  });
});
