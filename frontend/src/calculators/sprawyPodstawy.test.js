// Przykładowe (fikcyjne) sprawy kalkulatora f): wynik silnika = ręcznie policzona podstawa.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { podstawaWymiaru, DEFAULT_PARAMS } from "../engine/index.js";
import { SPRAWY_PODSTAWY } from "./sprawyPodstawy.js";

const num = (v) => Number(String(v).replace(",", ".")) || 0;
const policz = (s) => podstawaWymiaru({
  status: s.stan.status, miesiace: s.miesiace.map(num), ileMies: num(s.stan.ileMies),
  premieKwartalne: num(s.stan.kwartalne), premiaRoczna: num(s.stan.roczna), wymiarEtatu: num(s.stan.wymiarEtatu) || 1,
}, DEFAULT_PARAMS);

describe("przykładowe sprawy kalkulatora f)", () => {
  it.each(SPRAWY_PODSTAWY.map((s) => [s.nazwa, s]))("%s", (_, s) => {
    const r = policz(s);
    expect(r.ok).toBe(true);
    expect(Math.round(r.podstawa * 100) / 100).toBe(s.podstawa);
  });

  it("każda sprawa ma 12 miesięcy, unikalne id i opis", () => {
    expect(new Set(SPRAWY_PODSTAWY.map((s) => s.id)).size).toBe(SPRAWY_PODSTAWY.length);
    for (const s of SPRAWY_PODSTAWY) {
      expect(s.miesiace).toHaveLength(12);
      expect(s.opis.length).toBeGreaterThan(20);
    }
  });

  it("wartości statusu i etatu są na listach wyboru kalkulatora", () => {
    const kod = fs.readFileSync(path.join(import.meta.dirname, "CalcPodstawa.jsx"), "utf8");
    const opcje = new Set([...kod.matchAll(/value: "([^"]+)"/g)].map((m) => m[1]));
    for (const s of SPRAWY_PODSTAWY) {
      expect(opcje.has(s.stan.status), s.id).toBe(true);
      expect(opcje.has(s.stan.wymiarEtatu), s.id).toBe(true);
    }
  });

  it("sprawy pokrywają minimum, maksimum i ostrzeżenie dla dobrowolnych", () => {
    const limity = SPRAWY_PODSTAWY.map((s) => policz(s).limit?.typ).filter(Boolean);
    expect(limity).toEqual(expect.arrayContaining(["min", "max", "ostrzezenieMinDobrowolni"]));
  });
});
