import { describe, it, expect } from "vitest";
import { OPCJE, domyslneOpcje, opcjeZAdresu, sortuj } from "./zintegrowany.js";
import { getCalculator, CALCULATORS } from "./registry.jsx";

describe("kalkulator zintegrowany", () => {
  it("obejmuje wszystkie kalkulatory a–g z treści zadania, każdy istnieje w rejestrze", () => {
    expect(OPCJE.map((o) => o.id).sort()).toEqual(["a", "b", "c", "d", "e", "f", "g"]);
    for (const o of OPCJE) expect(getCalculator(o.slug)?.letter, o.id).toBe(o.id);
    expect(OPCJE).toHaveLength(CALCULATORS.length);
  });
  it("domyślne opcje z etapu w „Moje dane”", () => {
    expect(domyslneOpcje(null)).toEqual(["f", "g"]);
    expect(domyslneOpcje({ sytuacja: { etap: "ciaza", rola: "matka" }, zdrowie: { zwolnienie: "B" } })).toEqual(["a", "b", "f", "g"]);
    expect(domyslneOpcje({ sytuacja: { etap: "ciaza", rola: "matka" }, zdrowie: { zwolnienie: "brak" } })).toEqual(["b", "f", "g"]);
    expect(domyslneOpcje({ sytuacja: { etap: "po_porodzie", rola: "ojciec" }, urlopy: { laczenieZPraca: "tak" } })).toEqual(["b", "d", "c", "f", "g"]);
    expect(domyslneOpcje({ sytuacja: { etap: "przyjecie", rola: "matka" } })).toEqual(["e", "f", "g"]);
  });
  it("opcje z adresu: kolejność, duplikaty i śmieci", () => {
    expect(opcjeZAdresu("g,b,b,x,a")).toEqual(["a", "b", "g"]);
    expect(opcjeZAdresu("-")).toBeNull();
    expect(opcjeZAdresu("")).toBeNull();
    expect(opcjeZAdresu(null)).toBeNull();
    expect(sortuj(["g", "a"])).toEqual(["a", "g"]);
  });
});
