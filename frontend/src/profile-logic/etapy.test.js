/* =====================================================================
   Testy logiki formularza „Moje dane” (dwie poprawki z sesji):

   1) Mężczyzna (i ojciec) nie może „być w ciąży” — widzi
      „Moja partnerka jest w ciąży”.
   2) Dane z aktu urodzenia (imię, nazwisko, PESEL, miejsce urodzenia)
      można uzupełnić także w ciąży — jako opcjonalne, bo zwykle jeszcze
      ich nie znamy.
   ===================================================================== */
import { describe, it, expect } from "vitest";
import {
  ETAPY, ETAPY_DLA, HINT_ETAPU, ROLE_DLA, ciazaPartnerki, jestOpcjonalne,
} from "./etapy.js";

const etykietaCiazy = (plec, rola) =>
  ETAPY_DLA(plec, rola).find(([v]) => v === "ciaza")?.[1];

describe("1) etykieta etapu „ciąża” zależy od płci i roli", () => {
  it("kobieta-matka widzi „Jestem w ciąży”", () => {
    expect(etykietaCiazy("K", "matka")).toBe("Jestem w ciąży (dziecko jeszcze się nie urodziło)");
  });

  it("mężczyzna widzi „Moja partnerka jest w ciąży”", () => {
    expect(etykietaCiazy("M", "ojciec")).toBe(
      "Moja partnerka jest w ciąży (dziecko jeszcze się nie urodziło)",
    );
  });

  it("mężczyzna bez wybranej roli też nie „jest w ciąży”", () => {
    expect(etykietaCiazy("M", "")).toContain("Moja partnerka");
  });

  it("rola „ojciec” wymusza wersję o partnerce także przy K", () => {
    expect(etykietaCiazy("K", "ojciec")).toContain("Moja partnerka");
  });

  it("„inny” członek rodziny płci K widzi wersję własną", () => {
    expect(etykietaCiazy("K", "inny")).toBe("Jestem w ciąży (dziecko jeszcze się nie urodziło)");
  });

  it("pozostałe etapy są identyczne dla wszystkich", () => {
    const kobieta = ETAPY_DLA("K", "matka").slice(1);
    const mezczyzna = ETAPY_DLA("M", "ojciec").slice(1);
    expect(kobieta).toEqual(mezczyzna);
    expect(mezczyzna.map(([v]) => v)).toEqual(["po_porodzie", "przyjecie"]);
  });

  it("wartości kluczy się nie zmieniają (zgodność z silnikiem)", () => {
    for (const [plec, rola] of [["K", "matka"], ["M", "ojciec"], ["K", "inny"]]) {
      expect(ETAPY_DLA(plec, rola).map(([v]) => v)).toEqual(["ciaza", "po_porodzie", "przyjecie"]);
    }
  });

  it("etykiety nie mówią mężczyźnie, że jest w ciąży", () => {
    for (const [v, label] of ETAPY_DLA("M", "ojciec")) {
      if (v === "ciaza") expect(label).not.toMatch(/^Jestem w ciąży/);
    }
  });

  it("ciazaPartnerki rozpoznaje przypadek", () => {
    expect(ciazaPartnerki("M", "matka")).toBe(true); // płeć rozstrzyga
    expect(ciazaPartnerki("K", "ojciec")).toBe(true); // rola rozstrzyga
    expect(ciazaPartnerki("K", "matka")).toBe(false);
    expect(ciazaPartnerki("K", "")).toBe(false);
  });

  it("podpowiedź pojawia się tylko mężczyźnie / ojcu", () => {
    expect(HINT_ETAPU("M", "ojciec")).toContain("partnerka");
    expect(HINT_ETAPU("K", "ojciec")).toContain("partnerka");
    expect(HINT_ETAPU("K", "matka")).toBeUndefined();
  });

  it("lista płci nie zawiera roli sprzecznych z PESEL-em", () => {
    expect(ROLE_DLA("K").map(([v]) => v)).toEqual(["matka", "inny"]);
    expect(ROLE_DLA("M").map(([v]) => v)).toEqual(["ojciec", "inny"]);
    expect(ROLE_DLA("").map(([v]) => v)).toEqual(["matka", "ojciec", "inny"]);
  });

  it("stała ETAPY pozostaje wersją żeńską (zgodność wsteczna)", () => {
    expect(ETAPY[0][1]).toBe("Jestem w ciąży (dziecko jeszcze się nie urodziło)");
  });
});

describe("2) dane z aktu urodzenia wypełnialne także w ciąży", () => {
  // Definicje pól odwzorowują ProfilePage.jsx (sekcja „Dziecko”).
  const poleImie = { name: "imie", if: (c) => !!c.etap, optional: (c) => c.etap === "ciaza" };
  const polePesel = { name: "pesel", if: (c) => !!c.etap, optional: (c) => c.etap === "ciaza" };
  const poleMiejsce = {
    name: "miejsceUrodzenia",
    if: (c) => c.etap === "po_porodzie" || c.etap === "ciaza",
    optional: (c) => c.etap === "ciaza",
  };
  const poleDataUrodzenia = {
    name: "dataUrodzenia",
    if: (c) => c.etap && c.etap !== "ciaza",
    optional: (c) => c.etap === "ciaza",
  };

  it("w ciąży pola aktu urodzenia są widoczne", () => {
    const c = { etap: "ciaza" };
    expect(poleImie.if(c)).toBe(true);
    expect(polePesel.if(c)).toBe(true);
    expect(poleMiejsce.if(c)).toBe(true);
  });

  it("w ciąży są opcjonalne — nie blokują ukończenia kroku", () => {
    const c = { etap: "ciaza" };
    expect(jestOpcjonalne(poleImie, c)).toBe(true);
    expect(jestOpcjonalne(polePesel, c)).toBe(true);
    expect(jestOpcjonalne(poleMiejsce, c)).toBe(true);
  });

  it("po porodzie są wymagane (opcjonalność tylko w ciąży)", () => {
    const c = { etap: "po_porodzie" };
    expect(jestOpcjonalne(poleImie, c)).toBe(false);
    expect(jestOpcjonalne(polePesel, c)).toBe(false);
  });

  it("data urodzenia pozostaje ukryta przed porodem (jeszcze jej nie ma)", () => {
    expect(poleDataUrodzenia.if({ etap: "ciaza" })).toBe(false);
    expect(poleDataUrodzenia.if({ etap: "po_porodzie" })).toBe(true);
  });

  it("bez wybranego etapu nic nie jest pokazywane", () => {
    expect(poleImie.if({ etap: "" })).toBe(false);
    expect(polePesel.if({ etap: "" })).toBe(false);
  });

  it("przy adopcji miejsce urodzenia jest widoczne", () => {
    expect(poleMiejsce.if({ etap: "przyjecie" })).toBe(false); // tylko poród/ciąża
    expect(poleImie.if({ etap: "przyjecie" })).toBe(true);
  });

  it("jestOpcjonalne obsługuje stałą true/false", () => {
    expect(jestOpcjonalne({ optional: true }, {})).toBe(true);
    expect(jestOpcjonalne({ optional: false }, {})).toBe(false);
    expect(jestOpcjonalne({}, {})).toBe(false);
  });
});
