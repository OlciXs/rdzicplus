// Testy silnika obliczeń. Uruchom: cd frontend && npm test
// Oczekiwane wartości policzone ręcznie wg docs/podsumowanie-danych-do-wyliczen.md.
// Gdy dostaniemy przykładowe sprawy ZUS, dopisujemy je tutaj (bez kopiowania dokumentów do repo).
import { describe, it, expect } from "vitest";
import {
  DEFAULT_PARAMS,
  mergeParams,
  diffParams,
  PARAM_GROUPS,
  calculate,
  podstawaWymiaru,
  chorobowyWCiazy,
  zasilekMacierzynski,
  laczenieZPraca,
  obojeRodzice,
  adopcja,
  ktoWyplaca,
  tygodnieMac,
  tygodnieRodz,
} from "./index.js";

const grosze = (x) => Math.round(x * 100) / 100;
const dwanascie = (kwota) => Array.from({ length: 12 }, () => kwota);

describe("parametry", () => {
  it("mergeParams nakłada zmiany admina i zachowuje resztę", () => {
    const P = mergeParams({ stRodzicielski: 75, tygodnieRodzicielski: { 1: 45 }, nieznany: 1 });
    expect(P.stRodzicielski).toBe(75);
    expect(P.tygodnieRodzicielski).toEqual({ 1: 45, 2: 43 });
    expect(P.stMacierzynski).toBe(100);
    expect(P.nieznany).toBeUndefined();
  });

  it("diffParams zwraca tylko różnice (to zapisuje panel admina)", () => {
    expect(diffParams(DEFAULT_PARAMS)).toEqual({});
    const P = mergeParams({ stRodzicielski: 75, tygodnieRodzicielski: { 2: 44 } });
    expect(diffParams(P)).toEqual({ stRodzicielski: 75, tygodnieRodzicielski: { 2: 44 } });
    expect(mergeParams(diffParams(P))).toEqual(P);
  });

  it("panel admina opisuje tylko istniejące parametry", () => {
    for (const g of PARAM_GROUPS)
      for (const k of Object.keys(g.klucze)) expect(DEFAULT_PARAMS).toHaveProperty(k);
  });

  it("zmiana parametru zmienia wynik bez zmiany kodu", () => {
    const P = mergeParams({ stRodzicielski: 75 });
    const r = laczenieZPraca({ dzieci: 1, etat: 0, podstawa: 3000, stawka: P.stRodzicielski }, P);
    expect(grosze(r.dziennyPelny)).toBe(75);
  });

  it("wymiary urlopów wg liczby dzieci i „Za życiem”", () => {
    expect([1, 2, 3, 4, 5, 9].map((n) => tygodnieMac(n))).toEqual([20, 31, 33, 35, 37, 37]);
    expect(tygodnieRodz(1, false, false)).toBe(41);
    expect(tygodnieRodz(3, false, false)).toBe(43);
    expect(tygodnieRodz(1, true, false)).toBe(65);
    expect(tygodnieRodz(2, true, false)).toBe(67);
  });
});

describe("f) podstawa wymiaru", () => {
  it("6 000 zł przez 12 miesięcy → 5 177,40 zł (−13,71%)", () => {
    const r = podstawaWymiaru({ status: "pracownik", miesiace: dwanascie(6000) });
    expect(grosze(r.podstawa)).toBe(5177.4);
    expect(grosze(r.miesiecznie.macierzynski815)).toBe(4219.58);
    expect(grosze(r.miesiecznie.rodzicielski70)).toBe(3624.18);
    expect(r.limit).toBeNull();
  });

  it("5 000 zł → 4 314,50 zł, dziennie 143,82 zł", () => {
    const r = podstawaWymiaru({ status: "pracownik", miesiace: dwanascie(5000) });
    expect(grosze(r.podstawa)).toBe(4314.5);
    expect(grosze(r.dzienna)).toBe(143.82);
  });

  it("pracownik poniżej minimum → podniesione do 4 147,09 zł", () => {
    const r = podstawaWymiaru({ status: "pracownik", miesiace: dwanascie(3000) });
    expect(r.podstawa).toBe(4147.09);
    expect(r.limit.typ).toBe("min");
  });

  it("nie-pracownik powyżej limitu → ucięte do 20 321,30 zł", () => {
    const r = podstawaWymiaru({ status: "niepracownik", miesiace: dwanascie(30000) });
    expect(r.podstawa).toBe(20321.3);
    expect(r.limit.typ).toBe("max");
  });

  it("nie-pracownik z niskim przychodem → tylko ostrzeżenie, bez podnoszenia", () => {
    const r = podstawaWymiaru({ status: "niepracownik", miesiace: dwanascie(3000) });
    expect(grosze(r.podstawa)).toBe(2588.7);
    expect(r.limit.typ).toBe("ostrzezenieMinDobrowolni");
  });

  it("premie kwartalne i roczne wliczane w 1/12", () => {
    const r = podstawaWymiaru({ status: "pracownik", miesiace: dwanascie(6000), premieKwartalne: 4800, premiaRoczna: 1200 });
    expect(r.dodatek).toBe(500);
    expect(grosze(r.przecietne)).toBe(6500);
  });

  it("krócej niż 12 miesięcy i miesiące z zerem są pomijane", () => {
    const miesiace = [6000, 0, 6000, 9000, ...dwanascie(1)];
    const r = podstawaWymiaru({ status: "pracownik", miesiace, ileMies: 4 });
    expect(r.licznik).toBe(3);
    expect(r.srednia).toBe(7000);
  });

  it("brak danych", () => {
    expect(podstawaWymiaru({ miesiace: [0, 0] }).brakDanych).toBe(true);
  });
});

describe("a) zasiłek chorobowy w ciąży", () => {
  const baza = { status: "obw", dniUbezpieczenia: 365, liczbaUbPlatnika: 30, dataUrodzenia: "1995-05-01", poczatek: "2026-06-01", dniNiezdolnosci: 30, kodB: true, podstawa: 5000 };

  it("etat, kod B, 30 dni → całość jako wynagrodzenie chorobowe 100%", () => {
    const r = chorobowyWCiazy(baza);
    expect(r.dniWynagrodzenia).toBe(30);
    expect(r.dniZasilku).toBe(0);
    expect(grosze(r.kwotaRazem)).toBe(5000);
    expect(r.platnik.kto).toBe("PLATNIK");
  });

  it("za krótkie ubezpieczenie → brak prawa i 0 zł", () => {
    const r = chorobowyWCiazy({ ...baza, dniUbezpieczenia: 10 });
    expect(r.maPrawo).toBe(false);
    expect(r.brakujeDni).toBe(20);
    expect(r.kwotaRazem).toBe(0);
  });

  it("dobrowolne: wymóg 90 dni", () => {
    expect(chorobowyWCiazy({ ...baza, status: "dobr", dniUbezpieczenia: 60 }).maPrawo).toBe(false);
    expect(chorobowyWCiazy({ ...baza, status: "dobr", dniUbezpieczenia: 90 }).maPrawo).toBe(true);
  });

  it("300 dni L4 → płatne tylko 270 (33 wynagrodzenia + 237 zasiłku)", () => {
    const r = chorobowyWCiazy({ ...baza, dniNiezdolnosci: 300 });
    expect(r.przekroczonyOkres).toBe(true);
    expect(r.dniWynagrodzenia).toBe(33);
    expect(r.dniZasilku).toBe(237);
    expect(grosze(r.kwotaRazem)).toBe(45000);
  });

  it("brak fałszywego ostrzeżenia, gdy epizod mieści się w okresie", () => {
    const r = chorobowyWCiazy({ ...baza, dniNiezdolnosci: 200 });
    expect(r.przekroczonyOkres).toBe(false);
    expect(r.pozostaloPo).toBe(70);
  });

  it("bez kodu B → wynagrodzenie i zasiłek po 80%, okres 182 dni", () => {
    const r = chorobowyWCiazy({ ...baza, kodB: false });
    expect(r.stawkaWynagrodzenia).toBe(80);
    expect(grosze(r.kwotaRazem)).toBe(4000);
    expect(r.okresMax).toBe(182);
  });

  it("zaległość składkowa blokuje tylko ubezpieczonych dobrowolnie", () => {
    expect(chorobowyWCiazy({ ...baza, zaleglosc: 100 }).zalegloscBlokada).toBe(false);
    const dg = chorobowyWCiazy({ ...baza, status: "dobr", zaleglosc: 100 });
    expect(dg.zalegloscBlokada).toBe(true);
    expect(dg.kwotaRazem).toBe(0);
    expect(chorobowyWCiazy({ ...baza, status: "dobr", zaleglosc: 48.06 }).zalegloscBlokada).toBe(false);
  });

  it("po 50. roku życia limit wynagrodzenia chorobowego 14 dni", () => {
    const r = chorobowyWCiazy({ ...baza, dataUrodzenia: "1970-03-01" });
    expect(r.wiek50).toBe(true);
    expect(r.dniWynagrodzenia).toBe(14);
    expect(r.dniZasilku).toBe(16);
  });

  it("dobrowolne: od 1. dnia zasiłek (bez wynagrodzenia chorobowego)", () => {
    const r = chorobowyWCiazy({ ...baza, status: "dobr" });
    expect(r.dniWynagrodzenia).toBe(0);
    expect(r.dniZasilku).toBe(30);
  });
});

describe("b) zasiłek macierzyński", () => {
  const baza = { dzieci: 1, porod: "2026-09-01", podstawaMatki: 5000, podstawaOjca: 5500, ojcowski: true };

  it("1 dziecko: 20 tyg. po 100%, pula rodzicielska 41 tyg., ojcowski 2 tyg.", () => {
    const r = zasilekMacierzynski(baza);
    expect(r.tygMac).toBe(20);
    expect(r.pulaRodzicielska).toBe(41);
    expect(grosze(r.sumaMatka)).toBe(23333.33);
    expect(grosze(r.sumaOjciec)).toBe(2566.67);
    expect(r.rodzicielskiDoRoku).toBe(2032);
  });

  it("bliźnięta: 31 tyg. i 43 tyg.; „Za życiem”: 65 tyg.", () => {
    expect(zasilekMacierzynski({ ...baza, dzieci: 2 }).tygMac).toBe(31);
    expect(zasilekMacierzynski({ ...baza, dzieci: 2 }).pulaRodzicielska).toBe(43);
    expect(zasilekMacierzynski({ ...baza, zaZyciem: true }).pulaRodzicielska).toBe(65);
  });

  it("wariant 81,5% obniża stawkę macierzyńskiego, ojcowski zostaje 100%", () => {
    const r = zasilekMacierzynski({ ...baza, wniosek815: true });
    expect(r.stMac).toBe(81.5);
    expect(r.wiersze.find((w) => w.id === "ojcowski").stawka).toBe(100);
    expect(grosze(r.sumaMatka)).toBe(19016.67);
  });

  it("przejęcie przez ojca: max 6 tyg. (20 − 14), więcej = błąd", () => {
    expect(zasilekMacierzynski({ ...baza, tygodnieDlaOjca: 6 }).bladOjca).toBe(false);
    const r = zasilekMacierzynski({ ...baza, tygodnieDlaOjca: 10 });
    expect(r.maxDlaOjca).toBe(6);
    expect(r.bladOjca).toBe(true);
  });

  it("wcześniak 26. tydz., 900 g, 70 dni w szpitalu → 10 tyg. uzupełniającego (limit 15)", () => {
    const r = zasilekMacierzynski({ ...baza, tydzienCiazy: 26, masa: 900, dniHospitalizacji: 70 });
    expect(r.limitUzup).toBe(15);
    expect(r.tygUzup).toBe(10);
  });

  it("35. tydz., 2 000 g, 84 dni w szpitalu → limit 8 tyg.", () => {
    const r = zasilekMacierzynski({ ...baza, tydzienCiazy: 35, masa: 2000, dniHospitalizacji: 84 });
    expect(r.limitUzup).toBe(8);
    expect(r.tygUzup).toBe(8);
  });

  it("niepełny tydzień szpitala zaokrąglany w górę", () => {
    expect(zasilekMacierzynski({ ...baza, tydzienCiazy: 35, masa: 2000, dniHospitalizacji: 10 }).tygUzup).toBe(2);
  });

  it("martwe urodzenie: 56 dni od porodu", () => {
    const r = zasilekMacierzynski({ ...baza, sytuacja: "martwe" });
    expect(r.martwe.dni).toBe(56);
    expect(grosze(r.sumaMatka)).toBe(9333.33);
  });

  it("zgon dziecka 30.10 → do 5.11 (7 dni od zgonu), razem 66 dni", () => {
    const r = zasilekMacierzynski({ ...baza, sytuacja: "martwe", dataZgonu: "2026-10-30" });
    expect(r.martwe.dni).toBe(66);
  });

  it("zgon po 8 tygodniach: jeszcze 7 dni", () => {
    const r = zasilekMacierzynski({ ...baza, sytuacja: "zgonPo" });
    expect(r.wiersze[0].dni).toBe(7);
    expect(r.sumaOjciec).toBe(0);
  });
});

describe("c) łączenie urlopu rodzicielskiego z pracą", () => {
  const baza = { dzieci: 1, etat: 0.5, podstawa: 5000, stawka: 81.5 };

  it("½ etatu: 41 → 82 tyg., zasiłek o połowę mniejszy", () => {
    const r = laczenieZPraca(baza);
    expect(r.wydluzony).toBe(82);
    expect(r.uderzonoWLimit).toBe(false);
    expect(grosze(r.dziennyPomniejszony)).toBe(67.92);
  });

  it("¼ etatu: 41 ÷ 0,75 = 54,67 tyg.", () => {
    expect(grosze(laczenieZPraca({ ...baza, etat: 0.25 }).wydluzony)).toBe(54.67);
  });

  it("bliźnięta ½ etatu: 86 tyg.; „Za życiem”: 130 tyg.", () => {
    expect(laczenieZPraca({ ...baza, dzieci: 2 }).wydluzony).toBe(86);
    expect(laczenieZPraca({ ...baza, zaZyciem: true }).wydluzony).toBe(130);
  });

  it("więcej niż ½ etatu → błąd i liczenie jak dla ½", () => {
    const r = laczenieZPraca({ ...baza, etat: 0.8 });
    expect(r.przekroczonyEtat).toBe(true);
    expect(r.wydluzony).toBe(82);
  });

  it("suma zasiłku za cały wydłużony urlop = suma bez pracy", () => {
    const zPraca = laczenieZPraca(baza);
    const bezPracy = laczenieZPraca({ ...baza, etat: 0 });
    expect(grosze(zPraca.sumaZasilku)).toBe(grosze(bezPracy.sumaZasilku));
  });
});

describe("d) oboje rodzice", () => {
  const baza = { dzieci: 1, dataUrodzenia: "2026-09-01", tygodnieMatka: 23, tygodnieOjciec: 18, wniosek815: true, podstawaMatki: 5000, podstawaOjca: 5500 };

  it("81,5%: 9 tyg. ojca po 70%, reszta po 81,5%", () => {
    const r = obojeRodzice(baza);
    expect(r.poprawny).toBe(true);
    expect(r.tygodnieOjca70).toBe(9);
    expect(grosze(r.kwotaMatka)).toBe(21869.17);
    expect(grosze(r.kwotaOjciec)).toBe(17498.25);
  });

  it("wariant 70%: wszystko po 70%", () => {
    const r = obojeRodzice({ ...baza, wniosek815: false });
    expect(r.tygodnieOjca70).toBe(0);
    expect(grosze(r.kwotaOjciec)).toBe(grosze((5500 / 30) * 0.7 * 18 * 7));
  });

  it("mniej niż 9 tyg. u rodzica = ostrzeżenie, nie błąd", () => {
    const r = obojeRodzice({ ...baza, tygodnieMatka: 36, tygodnieOjciec: 5 });
    expect(r.poprawny).toBe(true);
    expect(r.ostrzezenia.some((t) => t.startsWith("Ojciec"))).toBe(true);
  });

  it("przekroczona pula i za dużo części = błędy", () => {
    const r = obojeRodzice({ ...baza, tygodnieMatka: 40, czesciOjciec: 6 });
    expect(r.poprawny).toBe(false);
    expect(r.bledy).toHaveLength(2);
  });

  it("termin: koniec roku, w którym dziecko kończy 6 lat", () => {
    expect(obojeRodzice(baza).doRoku).toBe(2032);
  });
});

describe("e) adopcja i rodzina zastępcza", () => {
  const baza = { tryb: "przysposobienie", dzieci: 1, dataUrodzenia: "2024-03-01", dataPrzyjecia: "2026-11-01", podstawa: 5000, wniosek815: true };

  it("rodzicielski dla jednego rodzica: 32 z 41 tyg.", () => {
    const r = adopcja(baza);
    expect(r.brakPrawa).toBe(false);
    expect(r.tygRodzicielskiWlasne).toBe(32);
    expect(grosze(r.kwotaRodzicielski)).toBe(30426.67);
    expect(grosze(r.razem)).toBe(49443.33);
  });

  it("rodzina zastępcza: limit 7 lat, z odroczeniem 10 lat", () => {
    const rz = { ...baza, tryb: "rodzinaZastepcza", dataUrodzenia: "2018-01-01" };
    expect(adopcja(rz).limitLat).toBe(7);
    expect(adopcja(rz).brakPrawa).toBe(true);
    expect(adopcja({ ...rz, odroczenie: true }).brakPrawa).toBe(false);
  });

  it("przysposobienie: limit 14 lat", () => {
    expect(adopcja({ ...baza, dataUrodzenia: "2011-01-01" }).brakPrawa).toBe(true);
  });
});

describe("g) kto wypłaca", () => {
  it("> 20 ubezpieczonych → płatnik, ≤ 20 → ZUS, działalność → zawsze ZUS", () => {
    expect(ktoWyplaca({ status: "pracownik", liczbaUbezpieczonych: 21 }).kto).toBe("PLATNIK");
    expect(ktoWyplaca({ status: "pracownik", liczbaUbezpieczonych: 20 }).kto).toBe("ZUS");
    expect(ktoWyplaca({ status: "zlecenie", liczbaUbezpieczonych: 50 }).kto).toBe("PLATNIK");
    expect(ktoWyplaca({ status: "dg", liczbaUbezpieczonych: 50 }).kto).toBe("ZUS");
  });

  it("próg jest parametrem", () => {
    expect(ktoWyplaca({ status: "pracownik", liczbaUbezpieczonych: 21 }, mergeParams({ progPlatnika: 30 })).kto).toBe("ZUS");
  });
});

describe("calculate()", () => {
  it("wywołuje kalkulator po nazwie", () => {
    expect(calculate("laczenie", { dzieci: 1, etat: 0.5, podstawa: 5000, stawka: 70 }).wydluzony).toBe(82);
  });

  it("nieznany kalkulator → błąd", () => {
    expect(() => calculate("800plus", {})).toThrow();
  });

  it("domyślne parametry są zamrożone", () => {
    expect(Object.isFrozen(DEFAULT_PARAMS)).toBe(true);
  });
});
