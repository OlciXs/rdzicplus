// Strona „Wsparcie” (wymóg i) zadania): tylko organizacje charytatywne, każda sytuacja z zadania pokryta.
import { describe, it, expect } from "vitest";
import { ORGANIZACJE, SYTUACJE } from "./Support.jsx";

describe("organizacje wsparcia", () => {
  it("każda sytuacja z zadania (wcześniak, ciężko chore dziecko, poronienie / śmierć dziecka) ma co najmniej 2 organizacje", () => {
    for (const s of SYTUACJE) expect(ORGANIZACJE.filter((o) => o.sytuacje.includes(s.id)).length, s.id).toBeGreaterThanOrEqual(2);
  });
  it("tylko fundacje / hospicja, linki https, unikalne nazwy, opis i zasięg", () => {
    expect(new Set(ORGANIZACJE.map((o) => o.nazwa)).size).toBe(ORGANIZACJE.length);
    for (const o of ORGANIZACJE) {
      expect(o.nazwa).toMatch(/Fundacja|Hospicjum/);
      expect(o.url).toMatch(/^https:\/\/[a-z0-9.-]+\.(pl|org)$/);
      expect(o.opis.length).toBeGreaterThan(30);
      expect(o.zasieg).toBeTruthy();
      for (const id of o.sytuacje) expect(SYTUACJE.some((s) => s.id === id)).toBe(true);
    }
  });
});
