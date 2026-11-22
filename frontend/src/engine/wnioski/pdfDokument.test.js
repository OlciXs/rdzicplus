// Testy konwersji wypełnionego szablonu LaTeX na bloki tekstu do PDF.
import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { przygotujDruk } from "./druki.js";
import { zbudujDokumentLatex } from "./latexDokument.js";
import { latexDoTekstu, latexDoBlokow, filtrujWarunki, zbudujPdf } from "./pdfDokument.js";

const FONTY = resolve(__dirname, "../../../public/fonts");

const DZIS = "2026-11-21";
const profil = {
  ubezpieczony: {
    imie: "Jan",
    nazwisko: "Nowak",
    plec: "M",
    adres: "ul. Kwiatowa 5/12, 00-001 Warszawa",
    statusUbezpieczenia: "pracownik",
    peselMasked: "*******8260",
  },
  sytuacja: { etap: "po_porodzie", rola: "ojciec" },
  platnik: { nazwa: "Przedszkole Słoneczko sp. z o.o.", adres: "ul. Tęczowa 7, 00-950 Warszawa", nip: "1234567890" },
  drugiRodzic: { imie: "Anna", nazwisko: "Nowak" },
  dziecko: { imie: "Zosia", nazwisko: "Nowak", dataUrodzenia: "2026-11-10" },
  zdrowie: {},
  urlopy: {},
};

describe("PDF — LaTeX na tekst", () => {
  it("zamienia polecenia i polskie znaki bez zostawiania backslashy", () => {
    const t = latexDoTekstu("PESEL: \\Pole{pesel}\n\\S{} 1, art. 182\\textsuperscript{3} \\textbf{Jan Nowak}");
    expect(t).toContain("PESEL: …");
    expect(t).toContain("§ 1");
    expect(t).toContain("182³");
    expect(t).toContain("Jan Nowak");
    expect(t).not.toContain("\\");
  });

  it("wypełniony szablon P05 daje nagłówek, dane i podpis", () => {
    const d = przygotujDruk(profil, "W21", { dzis: DZIS });
    const dok = zbudujDokumentLatex(d, profil);
    const bloki = latexDoBlokow(dok.tex);
    const tekst = bloki.map((b) => b.tekst).join("\n");

    expect(bloki.some((b) => b.typ === "naglowek" && b.tekst.includes("URLOPU OJCOWSKIEGO"))).toBe(true);
    expect(tekst).toContain("Jan Nowak");
    expect(tekst).toContain("Przedszkole Słoneczko sp. z o.o.");
    expect(tekst).toContain("28.11.2026");
    expect(tekst).toContain("11.12.2026");
    expect(tekst).toContain("Zosia Nowak");
    expect(bloki.every((b) => !b.tekst.includes("\\"))).toBe(true);
  });

  it("wybrany szablon zmienia treść (W25: P04 vs P06)", () => {
    const d = przygotujDruk(profil, "W25", {
      dzis: DZIS,
      wartosci: { od: "2027-02-18", do: "2027-03-03" },
    });
    const p04 = latexDoBlokow(zbudujDokumentLatex(d, profil, { szablonId: "P04" }).tex).map((b) => b.tekst).join(" ");
    const p06 = latexDoBlokow(zbudujDokumentLatex(d, profil, { szablonId: "P06" }).tex).map((b) => b.tekst).join(" ");

    expect(p04).toContain("OŚWIADCZENIE");
    expect(p06).toContain("CZĘŚĆ NIEPRZENOSZALNA");
    expect(p04).not.toBe(p06);
  });

  it("pomija warunki, które nie dotyczą sprawy, i zostawia wybrane", () => {
    const bez = przygotujDruk(profil, "W1", { dzis: DZIS });
    const texBez = filtrujWarunki(zbudujDokumentLatex(bez, profil).tex, bez, profil);
    expect(texBez).toContain("Dziecko: Zosia Nowak");
    expect(texBez).not.toContain("urodziło się martwe");
    expect(texBez).not.toContain("81,5%");

    const p = { ...profil, dziecko: { ...profil.dziecko, martwe: "tak" }, urlopy: { zamiarPelnyWymiar: "tak" } };
    const z = przygotujDruk(p, "W1", { dzis: DZIS });
    const texZ = filtrujWarunki(zbudujDokumentLatex(z, p).tex, z, p);
    expect(texZ).toContain("urodziło się martwe");
    expect(texZ).toContain("81,5\\%");
  });

  it("dokument ogólny (bez szablonu LaTeX) nie wypuszcza surowych poleceń", () => {
    const d = przygotujDruk(profil, "W5", { dzis: DZIS });
    const bloki = latexDoBlokow(filtrujWarunki(zbudujDokumentLatex(d, profil).tex, d, profil));
    const tekst = bloki.map((b) => b.tekst).join("\n");

    // Regresja: w PDF było widać „\footnotesizeRodzicPlus”, „\textbullet” i „\item”.
    expect(tekst).not.toMatch(/\\[A-Za-z]+/);
    expect(tekst).not.toContain("\\item");
    expect(tekst).toContain("RodzicPlus");
    expect(tekst).toContain("• ");
    expect(tekst).toContain("Załączniki");
  });

  it("tryb ZAM nie składa pisma do pracodawcy", () => {
    const p = { ...profil, ubezpieczony: { ...profil.ubezpieczony, statusUbezpieczenia: "brak" } };
    const d = przygotujDruk(p, "W1", { dzis: DZIS });
    expect(d.tryb).toBe("zam");

    const dok = zbudujDokumentLatex(d, p, { szablonId: "P01" });
    expect(dok.szablonId).toBe(null);
    const tekst = latexDoBlokow(filtrujWarunki(dok.tex, d, p)).map((b) => b.tekst).join("\n");
    expect(tekst).toContain("DANE DO WNIOSKU ZAM");
    expect(tekst).not.toContain("podpis pracownika");
  });

  it("powstaje poprawny plik PDF z polską czcionką", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      const nazwa = String(url).split("/").pop();
      return new Response(readFileSync(resolve(FONTY, nazwa)), { status: 200 });
    }));
    try {
      const d = przygotujDruk(profil, "W21", { dzis: DZIS });
      const { doc, plik, szablonId } = await zbudujPdf(d, profil);
      const bajty = new Uint8Array(doc.output("arraybuffer"));

      expect(plik).toBe("p05-wniosek-o-udzielenie-urlopu-ojcowskiego.pdf");
      expect(szablonId).toBe("P05");
      expect(Buffer.from(bajty.slice(0, 4)).toString()).toBe("%PDF");
      expect(bajty.length).toBeGreaterThan(10_000);
      expect(doc.getNumberOfPages()).toBeGreaterThan(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
