import { describe, it, expect } from "vitest";
import { porownaj } from "./porownanie.js";
import { DEFAULT_PARAMS, mergeParams } from "./params.js";
import { zasilek } from "./helpers.js";

const base = (overrides = {}) => ({
  dzieci: 1,
  porod: "2026-10-01",
  przewidywanaDataPorodu: "2026-10-01",
  podstawaMatki: 5177.4,
  podstawaOjca: 6471.75,
  mamaUbezpieczona: true,
  tataUbezpieczony: true,
  zalegloscMatki: 0,
  zalegloscTaty: 0,
  dobrowolnaMama: false,
  wniosek815: null,
  rownolegle: false,
  ...overrides,
});

describe("porównanie scenariuszy zasiłków", () => {
  it("C1 Bożena i Mariusz: W1 i W2 prawie identyczne, a różnica W3-W1 to ręczny 9 tyg. @70%", () => {
    const r = porownaj(base(), DEFAULT_PARAMS, "2026-10-10");
    expect(r.scenariusze.every((s) => s.status === "dostepny")).toBe(true);
    const w1 = r.scenariusze.find((s) => s.id === "W1");
    const w2 = r.scenariusze.find((s) => s.id === "W2");
    const w3 = r.scenariusze.find((s) => s.id === "W3");
    // Rachunek: 20*100% +32*70% = 42,4 tyg. równoważnych;
    // 52*81,5% = 42,38 tyg. równoważnych. Kwoty można odczytać z ręcznego wzoru z params.
    const variableEq = 20 * 100 + 32 * DEFAULT_PARAMS.stRodzicielski;
    const averageEq = 52 * DEFAULT_PARAMS.stSredniowany;
    expect(Math.abs(variableEq / 100 - averageEq / 100)).toBeLessThan(0.03);
    // Różnica wynika z 42,4 vs 42,38 tygodni równoważnych i dla podstawy 5177,40 zł to ok. 24 zł.
    expect(Math.abs(w1.sumaMama - w2.sumaMama)).toBeLessThan(25);
    // Rachunek ręczny: 9 tygodni × 7 dni × dzienna 70% podstawy taty.
    const manual = zasilek(6471.75, DEFAULT_PARAMS.stRodzicielski, 9 * 7, DEFAULT_PARAMS);
    expect(Math.abs(w3.sumaRodziny - w1.sumaRodziny - manual)).toBeLessThan(0.01);
  });

  it("C2 Marzena: zaległość blokuje, bez zaległości dostępny i ostrzeżenie o ponownym ZUA", () => {
    const debt = porownaj(base({ podstawaMatki: 4000, zalegloscMatki: 312.4, dobrowolnaMama: true }), DEFAULT_PARAMS, "2026-10-10");
    expect(debt.scenariusze.every((s) => s.status === "niedostepny")).toBe(true);
    const clean = porownaj(base({ podstawaMatki: 4000, zalegloscMatki: 0, dobrowolnaMama: true }), DEFAULT_PARAMS, "2026-10-10");
    expect(clean.scenariusze.every((s) => s.status === "dostepny")).toBe(true);
    expect(clean.ostrzezenia.some((x) => x.kod === "dobrowolne-wyrejestrowanie")).toBe(true);
  });

  it("C3 mama na etacie, tata bez chorobowego: W3 i W4 niedostępne", () => {
    const r = porownaj(base({ tataUbezpieczony: false }), DEFAULT_PARAMS, "2026-10-10");
    expect(r.scenariusze.find((s) => s.id === "W1").status).toBe("dostepny");
    expect(r.scenariusze.find((s) => s.id === "W2").status).toBe("dostepny");
    expect(r.scenariusze.find((s) => s.id === "W3").status).toBe("niedostepny");
    expect(r.scenariusze.find((s) => s.id === "W4").status).toBe("niedostepny");
  });

  it("C4 mama bez chorobowego: wszystkie niedostępne, ale ojcowski jest niezależny", () => {
    const r = porownaj(base({ mamaUbezpieczona: false }), DEFAULT_PARAMS, "2026-10-10");
    expect(r.scenariusze.every((s) => s.status === "niedostepny")).toBe(true);
    expect(r.urlopOjcowski).not.toBeNull();
  });

  it("C5 dwoje dzieci: 31 tyg. macierzyńskiego i 34 tyg. rodzicielskiego mamy", () => {
    const r = porownaj(base({ dzieci: 2 }), DEFAULT_PARAMS, "2026-10-10");
    const w1 = r.scenariusze.find((s) => s.id === "W1");
    expect(w1.tygodnie[0].tygodnie).toBe(31);
    expect(w1.tygodnie[1].tygodnie).toBe(34);
  });

  it("C6 granica 21/22 dnia: dzień 21 dostępny, dzień 22 niedostępny dla 81,5%", () => {
    const d21 = porownaj(base(), DEFAULT_PARAMS, "2026-10-22");
    expect(d21.scenariusze.find((s) => s.id === "W2").status).toBe("dostepny");
    const d22 = porownaj(base(), DEFAULT_PARAMS, "2026-10-23");
    expect(d22.scenariusze.find((s) => s.id === "W2").status).toBe("niedostepny");
    expect(d22.scenariusze.find((s) => s.id === "W4").status).toBe("niedostepny");
  });

  it("C7 przed porodem: terminy są orientacyjne z PDP", () => {
    const r = porownaj(base({ porod: "", przewidywanaDataPorodu: "2026-12-10" }), DEFAULT_PARAMS, "2026-11-01");
    expect(r.scenariusze.every((s) => s.terminDecyzji === "2026-12-31")).toBe(true);
    expect(r.scenariusze.every((s) => s.terminOrientacyjny)).toBe(true);
  });

  it("C8 niska podstawa: miesięczna podwyżka do świadczenia rodzicielskiego z params", () => {
    const r = porownaj(base({ podstawaMatki: 1000 }), DEFAULT_PARAMS, "2026-10-10");
    const w1 = r.scenariusze.find((s) => s.id === "W1");
    expect(w1.tygodnie[0].kwotaMiesieczna).toBeGreaterThanOrEqual(DEFAULT_PARAMS.swiadczenieRodzicielskie);
  });

  it("zmiana parametru stSredniowany zmienia wynik porównania", () => {
    const a = porownaj(base(), DEFAULT_PARAMS, "2026-10-10");
    const changed = mergeParams({ stSredniowany: 80 });
    const b = porownaj(base(), changed, "2026-10-10");
    expect(b.scenariusze.find((s) => s.id === "W2").sumaMama)
      .not.toBe(a.scenariusze.find((s) => s.id === "W2").sumaMama);
  });
});
