import { describe, it, expect } from "vitest";
import { powiadomieniaNaDzien, TESTOWE } from "./powiadomienia.js";

const termin = {
  id: "W41-wniosek", wniosek: "wysokosc", tytul: "Wniosek o 81,5%", data: "2026-12-01", typ: "termin", dokument: "Pisemny wniosek",
  przypomnienia: [{ dni: 7, data: "2026-11-24" }, { dni: 3, data: "2026-11-28" }, { dni: 0, data: "2026-12-01" }],
};
const info = { id: "W1-koniec", tytul: "Koniec urlopu", data: "2026-11-28", typ: "info", przypomnienia: [] };

describe("powiadomienia o terminach", () => {
  it("3 dni przed, w dniu terminu i 7 dni przed – po jednym", () => {
    expect(powiadomieniaNaDzien([termin, info], "2026-11-28").map((p) => p.tytul)).toEqual(["Za 3 dni: Wniosek o 81,5%"]);
    expect(powiadomieniaNaDzien([termin], "2026-12-01")[0].tytul).toBe("Dziś ostatni dzień: Wniosek o 81,5%");
    expect(powiadomieniaNaDzien([termin], "2026-11-24")[0].tresc).toContain("Termin: 01.12.2026");
    expect(powiadomieniaNaDzien([termin], "2026-11-25")).toEqual([]);
  });
  it("oznaczone „Złożono” nie przypomina", () => {
    expect(powiadomieniaNaDzien([termin], "2026-11-28", { "W41-wniosek": true })).toEqual([]);
  });
  it("klucz rozróżnia przypomnienia tego samego terminu (każde wysyłane raz)", () => {
    const k = ["2026-11-24", "2026-11-28", "2026-12-01"].map((d) => powiadomieniaNaDzien([termin], d)[0].klucz);
    expect(new Set(k).size).toBe(3);
  });
  it("testowe powiadomienie ma tytuł i treść", () => {
    expect(TESTOWE.tytul).toBeTruthy();
    expect(TESTOWE.tresc).toMatch(/7 i 3 dni/);
  });
});
