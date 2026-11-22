import { describe, it, expect } from "vitest";
import { etykietaTerminu, klasaBadga } from "./kalendarzEtykiety.js";

const DZIS = "2026-11-21";
const plus = (iso, dni) => new Date(Date.parse(`${iso}T00:00:00Z`) + dni * 86400000).toISOString().slice(0, 10);
const e = (typ, dni, przypomnienie = null) => ({ typ, data: plus(DZIS, dni), przypomnienie });

describe("etykietaTerminu", () => {
  it("termin: dziś, +3, +7, +8 i przeszłość", () => {
    expect(etykietaTerminu(e("termin", 0), DZIS)).toBe("Dziś ostatni dzień");
    expect(etykietaTerminu(e("termin", 3), DZIS)).toBe("Pilne – 3 dni");
    expect(etykietaTerminu(e("termin", 7), DZIS)).toBe("Pilne – 7 dni");
    expect(etykietaTerminu(e("termin", 8), DZIS)).toBe("Za 8 dni");
    expect(etykietaTerminu(e("termin", -1), DZIS)).toBe("Termin minął 1 dzień temu");
  });

  it("koniec rządzi się tymi samymi zasadami co termin", () => {
    expect(etykietaTerminu(e("koniec", 0), DZIS)).toBe("Dziś ostatni dzień");
    expect(etykietaTerminu(e("koniec", 3), DZIS)).toBe("Pilne – 3 dni");
    expect(etykietaTerminu(e("koniec", -2), DZIS)).toBe("Termin minął 2 dni temu");
  });

  it("start i info nigdy nie są pilne", () => {
    expect(etykietaTerminu(e("start", 0), DZIS)).toBe("Dziś");
    expect(etykietaTerminu(e("start", 3), DZIS)).toBe("Za 3 dni");
    expect(etykietaTerminu(e("info", 7), DZIS)).toBe("Za 7 dni");
    expect(etykietaTerminu(e("info", -1), DZIS)).toBe("1 dzień temu");
  });

  it("przypomnienie liczy się od przypomnienia, nie od terminu", () => {
    const terminZa10 = e("termin", 10, plus(DZIS, 3));
    expect(etykietaTerminu(terminZa10, DZIS)).toBe("Za 10 dni");
    expect(etykietaTerminu(terminZa10, DZIS, "przypomnienie")).toBe("Przypomnienie – za 3 dni");
    expect(etykietaTerminu(e("termin", 10, DZIS), DZIS, "przypomnienie")).toBe("Przypomnienie – dziś");
    expect(etykietaTerminu(e("termin", 5, plus(DZIS, -1)), DZIS, "przypomnienie")).toBe("Przypomnienie – 1 dzień temu");
  });
});

describe("klasaBadga", () => {
  it("tylko termin/koniec są pilne, start i info zawsze spokojne", () => {
    expect(klasaBadga(e("termin", -1), DZIS)).toBe("b-err");
    expect(klasaBadga(e("termin", 0), DZIS)).toBe("b-warn");
    expect(klasaBadga(e("termin", 7), DZIS)).toBe("b-warn");
    expect(klasaBadga(e("termin", 8), DZIS)).toBe("b-ok");
    expect(klasaBadga(e("start", 3), DZIS)).toBe("b-ok");
    expect(klasaBadga(e("info", -3), DZIS)).toBe("b-ok");
  });

  it("przypomnienie ma własną klasę", () => {
    expect(klasaBadga(e("termin", 10, plus(DZIS, 3)), DZIS, "przypomnienie")).toBe("b-warn");
    expect(klasaBadga(e("termin", 10, plus(DZIS, 8)), DZIS, "przypomnienie")).toBe("b-ok");
  });
});

describe("zgłoszenie Oli: minione przypomnienie nie jest „pilne”", () => {
  // Dziś 22.11, termin 25.11, przypomnienie (7 dni przed) 18.11.
  const DZIS2 = "2026-11-22";
  const termin = { typ: "termin", data: "2026-11-25", przypomnienie: "2026-11-18" };
  it("przypomnienie z 18.11 ma etykietę przypomnienia, nie „Pilne – za 3 dni”", () => {
    expect(etykietaTerminu(termin, DZIS2, "przypomnienie", "2026-11-18")).toBe("Przypomnienie – 4 dni temu");
    expect(etykietaTerminu(termin, DZIS2, "przypomnienie", "2026-11-18")).not.toMatch(/Pilne/);
    expect(klasaBadga(termin, DZIS2, "przypomnienie", "2026-11-18")).toBe("b-neutral");
  });
  it("„Pilne” dostaje tylko sam termin", () => {
    expect(etykietaTerminu(termin, DZIS2)).toBe("Pilne – 3 dni");
  });
  it("przypomnienie 3 dni przed liczy się od własnej daty", () => {
    expect(etykietaTerminu(termin, DZIS2, "przypomnienie", "2026-11-22")).toBe("Przypomnienie – dziś");
  });
});
