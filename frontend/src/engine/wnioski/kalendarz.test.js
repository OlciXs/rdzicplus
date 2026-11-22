// Daty z kalendarza terminów sprawdzone z: Kodeksem pracy (art. 180–183), rozporządzeniem z 27.09.2026,
// poradnikiem ZUS 2026. Przypomnienia: 7 i 3 dni przed terminem + w dniu terminu.
import { describe, it, expect } from "vitest";
import { terminyWnioskow, doIcs, plusMies, DNI_PRZYPOMNIEN } from "./kalendarz.js";

const DZIS = "2026-11-22";
const profil = (s = {}) => ({
  ubezpieczony: { statusUbezpieczenia: "pracownik", ubezpieczenieUstalo: "nie", plec: "K", ...s.ubezpieczony },
  sytuacja: { ...s.sytuacja },
  platnik: {},
  drugiRodzic: { brak: false, statusUbezpieczenia: "pracownik", ...s.drugiRodzic },
  dziecko: { liczbaDzieci: "1", martwe: "nie", zmarlo: "nie", ...s.dziecko },
  zdrowie: { ...s.zdrowie },
  urlopy: { ...s.urlopy },
});
const terminy = (p) => terminyWnioskow(p, { dzis: DZIS });
const data = (lista, id) => lista.find((t) => t.id === id)?.data;

describe("daty wg przepisów", () => {
  const mama = terminy(profil({ sytuacja: { etap: "po_porodzie", rola: "matka" }, dziecko: { dataUrodzenia: "2026-11-10" }, urlopy: { zamiarPelnyWymiar: "tak" } }));
  it("81,5%: 21 dni po porodzie (poradnik s. 34)", () => expect(data(mama, "W41-wniosek")).toBe("2026-12-01"));
  it("koniec macierzyńskiego: 20 tyg. od dnia porodu włącznie (art. 180 § 1, 183¹ KP)", () => expect(data(mama, "W1-koniec")).toBe("2027-03-29"));
  it("rezygnacja matki: 7 dni przed powrotem po 14 tyg. (art. 180 § 8 KP)", () => expect(data(mama, "W5-wniosek")).toBe("2027-02-09"));
  it("rodzicielski: do końca roku, w którym dziecko kończy 6 lat (art. 182¹c KP)", () => expect(data(mama, "W25-koniec")).toBe("2032-12-31"));
  it("rodzicielski zaraz po macierzyńskim: wniosek 21 dni przed (art. 182¹d KP)", () => expect(data(mama, "W25-wniosek")).toBe("2027-03-09"));

  it("ojcowski: ostatni dzień = dzień przed 12. „miesięcznicą”, wniosek 7 dni przed startem 14 dni (art. 182³ KP)", () => {
    const tata = terminy(profil({ sytuacja: { etap: "po_porodzie", rola: "ojciec" }, ubezpieczony: { plec: "M" }, dziecko: { dataUrodzenia: "2026-11-10" } }));
    expect(data(tata, "W21-koniec")).toBe("2027-11-09");
    expect(data(tata, "W21-wniosek")).toBe("2027-10-20");
  });
  it("adopcja: wniosek 7 dni od przyjęcia, urlop najpóźniej 21 dni (art. 183 § 6 KP)", () => {
    const t = terminy(profil({ sytuacja: { etap: "przyjecie", rola: "matka", typPrzyjecia: "przysposobienie" }, dziecko: { dataUrodzenia: "2024-05-01", dataPrzyjecia: "2026-11-15" } }));
    expect(data(t, "W28-wniosek")).toBe("2026-11-22");
    expect(data(t, "W28-start")).toBe("2026-12-06");
  });
  it("przed porodem: start najwcześniej 6 tyg. przed PDP, wniosek 14 dni przed (art. 180 § 2 KP, poradnik s. 28)", () => {
    const t = terminy(profil({ sytuacja: { etap: "ciaza", rola: "matka" }, dziecko: { przewidywanaDataPorodu: "2027-02-15" } }));
    expect(data(t, "W2-start")).toBe("2027-01-04");
    expect(data(t, "W2-wniosek")).toBe("2026-12-21");
  });
  it("+6 miesięcy przy krótszym miesiącu – ostatni dzień miesiąca (art. 112 k.c.)", () => {
    expect(plusMies("2026-08-31", 6)).toBe("2027-02-28");
    expect(plusMies("2027-08-31", 6)).toBe("2028-02-29");
  });
});

describe("przypomnienia (prośba Oli: 3 dni przed i w dniu terminu)", () => {
  const t = terminy(profil({ sytuacja: { etap: "po_porodzie", rola: "matka" }, dziecko: { dataUrodzenia: "2026-11-10" }, urlopy: { zamiarPelnyWymiar: "tak" } }));
  it("każdy termin ma przypomnienia 7, 3 i 0 dni przed", () => {
    expect(DNI_PRZYPOMNIEN).toEqual([7, 3, 0]);
    const w41 = t.find((x) => x.id === "W41-wniosek");
    expect(w41.przypomnienia).toEqual([{ dni: 7, data: "2026-11-24" }, { dni: 3, data: "2026-11-28" }, { dni: 0, data: "2026-12-01" }]);
    expect(w41.przypomnienie).toBe("2026-11-24");
  });
  it("start / informacja nie mają przypomnień", () => {
    for (const x of t.filter((e) => e.typ === "start" || e.typ === "info")) expect(x.przypomnienia).toEqual([]);
  });
  it(".ics: alarmy 7 dni, 3 dni przed i o 9:00 w dniu terminu", () => {
    const ics = doIcs(t, { teraz: new Date("2026-11-22T10:00:00Z") });
    expect(ics).toContain("TRIGGER:-P7D");
    expect(ics).toContain("TRIGGER:-P3D");
    expect(ics).toContain("TRIGGER:PT9H");
    expect(ics).not.toContain("TRIGGER:-P1D");
    expect(ics.split("\r\n").every((l) => l.length <= 75)).toBe(true);
  });
  it("wariant „brakuje danych” jest oznaczony jako warunkowy", () => {
    const bezDanych = terminy(profil({ sytuacja: { etap: "po_porodzie", rola: "matka" }, ubezpieczony: { ubezpieczenieUstalo: "" }, dziecko: { dataUrodzenia: "2026-11-10" } }));
    const w1 = bezDanych.find((x) => x.wariant === "W1");
    expect(w1.warunkowy).toBe(true);
  });
});
