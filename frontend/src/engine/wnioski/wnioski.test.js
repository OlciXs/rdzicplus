// Testy silnika dostępności wariantów na przykładowych „rodzinach”.
// Profile mają kształt z backend/db.js (emptyProfile) – tak jak zapisuje je „Moje dane”.
import { describe, it, expect } from "vitest";
import { ocenWniosek, przegladWnioskow, WARIANTY, WNIOSKI, POLA, mergeParams } from "../index.js";

const DZIS = "2026-11-21";

const profil = (s = {}) => ({
  ubezpieczony: { plec: "K", ...s.ubezpieczony },
  sytuacja: { ...s.sytuacja },
  platnik: { ...s.platnik },
  drugiRodzic: { brak: false, ...s.drugiRodzic },
  dziecko: { zaZyciem: false, ...s.dziecko },
  zdrowie: { ...s.zdrowie },
  urlopy: { ...s.urlopy },
});

const status = (p, wniosek, id) => {
  const v = ocenWniosek(p, wniosek, { dzis: DZIS }).warianty.find((x) => x.id === id);
  if (!v) throw new Error(`Brak wariantu ${id} we wniosku ${wniosek}`);
  return v;
};

// Bożena: etat, w ciąży, zwolnienie z kodem B
const bozena = profil({
  sytuacja: { etap: "ciaza", rola: "matka" },
  ubezpieczony: { statusUbezpieczenia: "pracownik", ubezpieczenieOd: "2019-09-01", ubezpieczenieUstalo: "nie", podstawaWymiaru: "5177.40" },
  platnik: { liczbaUbezpieczonych: "powyzej_20" },
  dziecko: { przewidywanaDataPorodu: "2027-01-15", liczbaDzieci: "1" },
  zdrowie: { zwolnienie: "B" },
});

describe("rejestr", () => {
  it("każdy wariant należy do istniejącego wniosku i ma podstawę prawną", () => {
    const ids = new Set(WNIOSKI.map((w) => w.id));
    for (const v of WARIANTY) {
      expect(ids.has(v.wniosek), v.id).toBe(true);
      expect(v.podstawa, v.id).toBeTruthy();
    }
  });

  it("identyfikatory wariantów są unikalne", () => {
    const ids = WARIANTY.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("każdy wniosek ma co najmniej jeden wariant", () => {
    for (const w of WNIOSKI) expect(WARIANTY.some((v) => v.wniosek === w.id), w.id).toBe(true);
  });

  it("wszystkie pola z warunków mają etykietę (żeby pokazać, czego brakuje)", () => {
    const pusty = profil();
    const brak = new Set();
    for (const w of WNIOSKI)
      for (const v of ocenWniosek(pusty, w.id, { dzis: DZIS }).warianty)
        for (const b of v.brakujaceDane ?? []) if (!POLA[b.pole]) brak.add(b.pole);
    expect([...brak]).toEqual([]);
  });
});

describe("pusty profil", () => {
  it("nic nie jest „dostępne” – wszystko czeka na dane, zaczynając od roli i etapu", () => {
    const { wnioski } = przegladWnioskow(profil(), { dzis: DZIS });
    expect(wnioski.every((w) => w.dostepne === 0)).toBe(true);
    const v = status(profil(), "macierzynski", "W1");
    expect(v.status).toBe("brak_danych");
    expect(v.brakujaceDane.map((b) => b.pole)).toEqual(expect.arrayContaining(["sytuacja.rola", "sytuacja.etap"]));
  });
});

describe("Bożena – etat, ciąża, e-ZLA z kodem B", () => {
  it("wynagrodzenie chorobowe i zasiłek chorobowy 100% są dostępne", () => {
    expect(status(bozena, "chorobowy", "W35").status).toBe("dostepny");
    expect(status(bozena, "chorobowy", "W34").status).toBe("dostepny");
  });

  it("zasiłek macierzyński i część przed porodem są dostępne; adresat to pracodawca", () => {
    const w1 = status(bozena, "macierzynski", "W1");
    expect(w1.status).toBe("dostepny");
    expect(w1.wymiar).toMatch(/20 tygodni/);
    expect(w1.adresat).toMatch(/Pracodawca/);
    const w2 = status(bozena, "macierzynski", "W2");
    expect(w2.status).toBe("dostepny");
    expect(w2.wymiar).toMatch(/4\.12\.2026/);
  });

  it("urlop ojcowski jej nie dotyczy, a wariant 81,5% czeka na deklarację pełnego wymiaru", () => {
    expect(status(bozena, "ojcowski", "W21").status).toBe("nie_dotyczy");
    const w41 = status(bozena, "wysokosc", "W41");
    expect(w41.status).toBe("brak_danych");
    expect(w41.brakujaceDane.map((b) => b.pole)).toContain("urlopy.zamiarPelnyWymiar");
  });

  it("do wypełnienia wniosku brakuje adresu i rachunku", () => {
    const w1 = status(bozena, "macierzynski", "W1");
    expect(w1.doUzupelnienia.map((b) => b.pole)).toEqual(expect.arrayContaining(["ubezpieczony.adres", "ubezpieczony.rachunek"]));
  });
});

describe("Marzena – działalność z zaległością", () => {
  const marzena = profil({
    sytuacja: { etap: "ciaza", rola: "matka" },
    ubezpieczony: { statusUbezpieczenia: "dg", ubezpieczenieOd: "2025-03-01", zaleglosci: "tak", ubezpieczenieUstalo: "nie" },
    zdrowie: { zwolnienie: "B" },
  });

  it("zasiłki są zablokowane z powodem art. 2a, a wynagrodzenie chorobowe nie przysługuje (nie pracownik)", () => {
    const w34 = status(marzena, "chorobowy", "W34");
    expect(w34.status).toBe("niedostepny");
    expect(w34.powody.join(" ")).toMatch(/zaległości/);
    expect(status(marzena, "chorobowy", "W35").status).toBe("niedostepny");
    expect(status(marzena, "macierzynski", "W1").status).toBe("niedostepny");
  });

  it("adresat zasiłku to ZUS, a ostrzeżenia zawierają blokadę i ponowne ZUA", () => {
    expect(status(marzena, "macierzynski", "W1").adresat).toMatch(/ZUS/);
    const kody = przegladWnioskow(marzena, { dzis: DZIS }).ostrzezenia.map((o) => o.kod);
    expect(kody).toEqual(expect.arrayContaining(["V22", "info_ZUA"]));
  });

  it("po spłacie zaległości zasiłek chorobowy wraca", () => {
    const splacona = { ...marzena, ubezpieczony: { ...marzena.ubezpieczony, zaleglosci: "nie" } };
    expect(status(splacona, "chorobowy", "W34").status).toBe("dostepny");
  });

  it("zaległość blokuje też przygotowanie innych zasiłków i wniosków o świadczenia ZUS", () => {
    expect(status(marzena, "macierzynski", "W1").status).toBe("niedostepny");
    expect(status(marzena, "rodzicielski", "W25").status).toBe("niedostepny");
    expect(status(marzena, "wysokosc", "W41").status).toBe("niedostepny");
  });
});

describe("zleceniobiorczyni – okres wyczekiwania 90 dni", () => {
  const p = profil({
    sytuacja: { etap: "ciaza", rola: "matka" },
    ubezpieczony: { statusUbezpieczenia: "zlecenie", ubezpieczenieOd: "2026-10-01", ubezpieczenieUstalo: "nie" },
    zdrowie: { zwolnienie: "B" },
  });
  it("zasiłek chorobowy jeszcze nie, ale macierzyński tak (bez okresu wyczekiwania)", () => {
    expect(status(p, "chorobowy", "W34").status).toBe("niedostepny");
    expect(status(p, "macierzynski", "W1").status).toBe("dostepny");
    expect(przegladWnioskow(p, { dzis: DZIS }).ostrzezenia.map((o) => o.kod)).toContain("V2");
  });
  it("absolwent ma zasiłek od pierwszego dnia", () => {
    const abs = { ...p, ubezpieczony: { ...p.ubezpieczony, ulgaWyczekiwania: "absolwent" } };
    expect(status(abs, "chorobowy", "W34").status).toBe("dostepny");
  });
});

describe("studentka na zleceniu – brak ubezpieczenia chorobowego", () => {
  const p = profil({ sytuacja: { etap: "po_porodzie", rola: "matka" }, ubezpieczony: { statusUbezpieczenia: "student_zlecenie" }, dziecko: { dataUrodzenia: "2026-11-01", martwe: "nie" } });
  it("zasiłek macierzyński niedostępny, świadczenie rodzicielskie jako alternatywa", () => {
    expect(status(p, "macierzynski", "W1").status).toBe("niedostepny");
    expect(status(p, "poza_zus", "W19").status).toBe("dostepny");
    expect(przegladWnioskow(p, { dzis: DZIS }).ostrzezenia.map((o) => o.kod)).toContain("V1");
  });
});

describe("utrata pracy w ciąży", () => {
  const p = profil({
    sytuacja: { etap: "ciaza", rola: "matka" },
    ubezpieczony: { statusUbezpieczenia: "pracownik", ubezpieczenieUstalo: "tak", dataUstania: "2026-10-31", przyczynaUstania: "likwidacja", zapewnionoInnaPrace: "nie" },
    dziecko: { przewidywanaDataPorodu: "2027-02-01" },
  });
  it("likwidacja → zasiłek do porodu i macierzyński po ustaniu; zwykły W1 nie (brak ubezpieczenia w dniu porodu)", () => {
    expect(status(p, "przed_porodem_po_utracie_pracy", "W38").status).toBe("dostepny");
    expect(status(p, "macierzynski", "W39").status).toBe("dostepny");
    expect(status(p, "macierzynski", "W1").status).toBe("niedostepny");
  });
  it("wypowiedzenie (inna przyczyna) → brak zasiłku do porodu", () => {
    const q = { ...p, ubezpieczony: { ...p.ubezpieczony, przyczynaUstania: "wypowiedzenie" } };
    expect(status(q, "przed_porodem_po_utracie_pracy", "W38").status).toBe("niedostepny");
  });
});

describe("ojciec przejmuje urlop macierzyński", () => {
  const ojciec = (tyg, extra = {}) => profil({
    ubezpieczony: { plec: "M", statusUbezpieczenia: "pracownik", ubezpieczenieUstalo: "nie" },
    sytuacja: { etap: "po_porodzie", rola: "ojciec" },
    drugiRodzic: { statusUbezpieczenia: "pracownik", okolicznosc: "brak", ...extra.drugiRodzic },
    dziecko: { dataUrodzenia: "2026-07-01", liczbaDzieci: "1", martwe: "nie" },
    urlopy: { macierzynskiWykorzystanoTyg: String(tyg), matkaRezygnuje: "tak", ...extra.urlopy },
  });

  it("po 15 tygodniach matki – dostępne (do 5 tygodni)", () => {
    const v = status(ojciec(15), "przejecie", "W22");
    expect(v.status).toBe("dostepny");
    expect(v.wymiar).toMatch(/5 tygodni/);
  });

  it("po 10 tygodniach – niedostępne z powodem „14 tygodni”", () => {
    const v = status(ojciec(10), "przejecie", "W22");
    expect(v.status).toBe("niedostepny");
    expect(v.powody.join(" ")).toMatch(/14 tygodni/);
  });

  it("matka w szpitalu po 8 tygodniach – przejęcie na czas pobytu", () => {
    const p = ojciec(9, { drugiRodzic: { okolicznosc: "szpital" } });
    expect(status(p, "przejecie", "W7").status).toBe("dostepny");
    expect(status(p, "przejecie", "W22").status).toBe("niedostepny");
  });

  it("matka nieubezpieczona zmarła → W9, a nie W8", () => {
    const p = ojciec(0, { drugiRodzic: { statusUbezpieczenia: "brak", okolicznosc: "zgon" } });
    expect(status(p, "przejecie", "W9").status).toBe("dostepny");
    expect(status(p, "przejecie", "W8").status).toBe("niedostepny");
  });

  it("urlop ojcowski dostępny (dziecko 4,5 mies.), a urlopu macierzyńskiego (W1) nie dotyczy", () => {
    expect(status(ojciec(15), "ojcowski", "W21").status).toBe("dostepny");
    expect(status(ojciec(15), "macierzynski", "W1").status).toBe("nie_dotyczy");
  });

  it("urlop ojcowski wygasa po 12. miesiącu", () => {
    const p = ojciec(15);
    p.dziecko.dataUrodzenia = "2025-10-01";
    const v = status(p, "ojcowski", "W21");
    expect(v.status).toBe("niedostepny");
    expect(przegladWnioskow(p, { dzis: DZIS }).ostrzezenia.map((o) => o.kod)).toContain("V5");
  });

  it("ojciec bez ubezpieczenia nie przejmie urlopu", () => {
    const p = ojciec(15);
    p.ubezpieczony.statusUbezpieczenia = "dzielo";
    expect(status(p, "przejecie", "W22").status).toBe("niedostepny");
  });
});

describe("wcześniak – uzupełniający urlop macierzyński", () => {
  const p = profil({
    sytuacja: { etap: "po_porodzie", rola: "matka" },
    ubezpieczony: { statusUbezpieczenia: "pracownik", ubezpieczenieUstalo: "nie" },
    dziecko: { dataUrodzenia: "2026-09-01", martwe: "nie", pobytWSzpitalu: "tak", tydzienCiazy: "ponizej_28", masaUrodzenia: "900", szpitalOd: "2026-09-01", szpitalDo: "2026-11-09" },
    drugiRodzic: { brak: true },
    urlopy: { planUzupelniajacy: "tak", terminKoncaMacierzynskiego: "2027-01-19" },
  });
  it("10 tygodni (70 dni w szpitalu), limit 15", () => {
    const v = status(p, "uzupelniajacy", "W4");
    expect(v.status).toBe("dostepny");
    expect(v.wymiar).toMatch(/10 tyg\..*70 dni.*limit 15/);
    expect(v.termin).toMatch(/29\.12\.2026/);
    expect(v.pewnosc).toBe("do_potwierdzenia");
  });
  it("po 37. tygodniu pobyt zaczęty 2. dnia po porodzie nie daje urlopu", () => {
    const q = { ...p, dziecko: { ...p.dziecko, tydzienCiazy: "po_37", masaUrodzenia: "3300", szpitalOd: "2026-09-02", szpitalDo: "2026-09-20" } };
    expect(status(q, "uzupelniajacy", "W4").status).toBe("niedostepny");
  });
});

describe("martwe urodzenie", () => {
  const p = profil({
    sytuacja: { etap: "po_porodzie", rola: "matka" },
    ubezpieczony: { statusUbezpieczenia: "pracownik", ubezpieczenieUstalo: "nie" },
    dziecko: { dataUrodzenia: "2026-11-10", martwe: "tak", liczbaDzieci: "1" },
  });
  it("W10 i zasiłek pogrzebowy dostępne, zwykły W1 nie", () => {
    expect(status(p, "macierzynski", "W10").status).toBe("dostepny");
    expect(status(p, "pogrzebowy", "W45").status).toBe("dostepny");
    expect(status(p, "pogrzebowy", "W45").wysokosc).toMatch(/7000 zł/);
    expect(status(p, "macierzynski", "W1").status).toBe("niedostepny");
  });
});

describe("adopcja i rodzina zastępcza", () => {
  const p = (typ, urodzenie, odroczenie = "nie") => profil({
    sytuacja: { etap: "przyjecie", rola: "matka", typPrzyjecia: typ },
    ubezpieczony: { statusUbezpieczenia: "pracownik", ubezpieczenieUstalo: "nie" },
    dziecko: { dataUrodzenia: urodzenie, dataPrzyjecia: "2026-11-01", odroczonySzkolny: odroczenie },
  });
  it("zawodowa rodzina zastępcza – brak prawa", () => {
    expect(status(p("rodzina_zastepcza_zawodowa", "2024-01-01"), "adopcja", "W28").status).toBe("niedostepny");
  });
  it("rodzina zastępcza, dziecko 8 lat: bez odroczenia nie, z odroczeniem tak", () => {
    expect(status(p("rodzina_zastepcza", "2018-06-01"), "adopcja", "W28").status).toBe("niedostepny");
    expect(status(p("rodzina_zastepcza", "2018-06-01", "tak"), "adopcja", "W28").status).toBe("dostepny");
  });
  it("przysposobienie dziecka 13-letniego – tak; termin wniosku 7 dni od przyjęcia", () => {
    const v = status(p("przysposobienie", "2013-06-01"), "adopcja", "W28");
    expect(v.status).toBe("dostepny");
    expect(v.termin).toMatch(/8\.11\.2026/);
  });
});

describe("wariant 81,5% i termin 21 dni", () => {
  const p = (urodzenie) => profil({
    sytuacja: { etap: "po_porodzie", rola: "matka" },
    ubezpieczony: { statusUbezpieczenia: "pracownik", ubezpieczenieUstalo: "nie" },
    dziecko: { dataUrodzenia: urodzenie, martwe: "nie" },
    urlopy: { zamiarPelnyWymiar: "tak" },
  });
  it("10 dni po porodzie – można", () => expect(status(p("2026-11-11"), "wysokosc", "W41").status).toBe("dostepny"));
  it("30 dni po porodzie – za późno", () => {
    expect(status(p("2026-10-22"), "wysokosc", "W41").status).toBe("niedostepny");
    expect(przegladWnioskow(p("2026-10-22"), { dzis: DZIS }).ostrzezenia.find((o) => o.kod === "V4").poziom).toBe("info");
  });

  it("przy adopcji termin liczy się od przyjęcia dziecka, nie od jego urodzenia", () => {
    const adopcja = profil({
      sytuacja: { etap: "przyjecie", rola: "matka" },
      ubezpieczony: { statusUbezpieczenia: "pracownik", ubezpieczenieUstalo: "nie" },
      dziecko: { dataUrodzenia: "2020-01-01", dataPrzyjecia: "2026-11-10" },
      urlopy: { zamiarPelnyWymiar: "tak" },
    });
    const w41 = status(adopcja, "wysokosc", "W41");
    expect(w41.status).toBe("dostepny");
    expect(w41.termin).toMatch(/1\.12\.2026/);
  });
});

describe("urlop rodzicielski i łączenie z pracą", () => {
  const p = (extra) => profil({
    sytuacja: { etap: "po_porodzie", rola: "matka" },
    ubezpieczony: { statusUbezpieczenia: "pracownik", ubezpieczenieUstalo: "nie" },
    dziecko: { dataUrodzenia: "2026-03-01", liczbaDzieci: "2", martwe: "nie" },
    urlopy: { planRodzicielski: "tak", ...extra },
  });
  it("bliźnięta – pula 43 tygodnie", () => expect(status(p({}), "rodzicielski", "W25").wymiar).toMatch(/43 tygodni/));
  it("szósta część – niedostępne", () => expect(status(p({ rodzicielskieCzesci: "5" }), "rodzicielski", "W25").status).toBe("niedostepny"));
  it("łączenie z pracą powyżej ½ etatu – niedostępne", () => {
    expect(status(p({ laczenieZPraca: "tak", wymiarPracyPrzyLaczeniu: "powyzej" }), "rodzicielski", "W12").status).toBe("niedostepny");
    expect(status(p({ laczenieZPraca: "tak", wymiarPracyPrzyLaczeniu: "do_polowy" }), "rodzicielski", "W12").status).toBe("dostepny");
  });
});

describe("zasiłek opiekuńczy", () => {
  const p = (extra) => profil({
    sytuacja: { etap: "po_porodzie", rola: "ojciec" },
    ubezpieczony: { plec: "M", statusUbezpieczenia: "pracownik" },
    dziecko: { dataUrodzenia: "2025-06-01" },
    urlopy: { potrzebaOpieki: "chore_dziecko", ...extra },
  });
  it("chore dziecko do 2 lat – domownik nie wyklucza", () => expect(status(p({ domownikMozeOpiekowac: "tak" }), "opiekunczy", "W17").status).toBe("dostepny"));
  it("wyczerpany limit 60 dni", () => expect(status(p({ opiekunczyDniWRoku: "60" }), "opiekunczy", "W17").status).toBe("niedostepny"));
});

describe("parametry z panelu admina", () => {
  it("zmiana limitu dni ojcowskiego zmienia wynik", () => {
    const p = profil({
      sytuacja: { etap: "po_porodzie", rola: "ojciec" },
      ubezpieczony: { plec: "M", statusUbezpieczenia: "pracownik", ubezpieczenieUstalo: "nie" },
      dziecko: { dataUrodzenia: "2025-10-01", martwe: "nie" },
    });
    expect(ocenWniosek(p, "ojcowski", { dzis: DZIS }).warianty[0].status).toBe("niedostepny");
    const P = mergeParams({ deadlineOjcowskiMies: 24 });
    expect(ocenWniosek(p, "ojcowski", { dzis: DZIS, params: P }).warianty[0].status).toBe("dostepny");
  });
});

describe("spójność rejestru z kalkulatorami (przegląd 21.11, 21:45)", () => {
  const adopcyjny = (typ) => profil({
    sytuacja: { etap: "przyjecie", rola: "matka", typPrzyjecia: typ },
    ubezpieczony: { statusUbezpieczenia: "pracownik", ubezpieczenieUstalo: "nie" },
    dziecko: { dataUrodzenia: "2024-01-01", dataPrzyjecia: "2026-11-01" },
  });
  it("przysposobienie: rodzicielski 41 tyg. (jak adopcja.js), rodzina zastępcza: 38 tyg.", () => {
    expect(status(adopcyjny("przysposobienie"), "rodzicielski", "W25").wymiar).toMatch(/^41 tygodni/);
    expect(status(adopcyjny("rodzina_zastepcza"), "rodzicielski", "W25").wymiar).toMatch(/^38 tygodni/);
  });

  const szpital = (od, doDnia) => profil({
    sytuacja: { etap: "po_porodzie", rola: "matka" },
    ubezpieczony: { statusUbezpieczenia: "pracownik", ubezpieczenieUstalo: "nie" },
    dziecko: { dataUrodzenia: "2026-09-01", martwe: "nie", pobytWSzpitalu: "tak", tydzienCiazy: "28_37", masaUrodzenia: "1800", szpitalOd: od, szpitalDo: doDnia },
    drugiRodzic: { brak: true },
  });
  it("uzupełniający przed 37. tyg.: każdy dzień w szpitalu się liczy (art. 180² § 1 pkt 2 k.p.)", () => {
    const v = status(szpital("2026-09-01", "2026-09-03"), "uzupelniajacy", "W4");
    expect(v.status).toBe("dostepny");
    expect(v.wymiar).toMatch(/^1 tyg./);
  });
  it("odwrócone daty pobytu nie dają ujemnych tygodni", () => {
    const v = status(szpital("2026-09-20", "2026-09-01"), "uzupelniajacy", "W4");
    expect(v.status).toBe("niedostepny");
    expect(v.wymiar).not.toMatch(/-\d/);
  });
});

describe("SKLADANIE – spójność z rejestrem", () => {
  it("każdy wpis „co składasz” wskazuje istniejący wariant (po usunięciu W3 został martwy wpis)", async () => {
    const { SKLADANIE, WARIANTY } = await import("./rejestr.js");
    const ids = new Set(WARIANTY.map((v) => v.id));
    expect(Object.keys(SKLADANIE).filter((id) => !ids.has(id))).toEqual([]);
  });
  it("W34 wg treści zadania ZUS (s. 3): działalność → ZAS-53, zlecenie → płatnik i Z-3a; nigdy formularz macierzyński ZAM", () => {
    const w34 = (statusUbezpieczenia) => status(profil({ sytuacja: { etap: "ciaza", rola: "matka" }, ubezpieczony: { statusUbezpieczenia, ubezpieczenieOd: "2020-01-01", zaleglosci: "nie" }, zdrowie: { zwolnienie: "B" } }), "chorobowy", "W34");
    expect(w34("dg").dokument).toMatch(/ZAS-53/);
    expect(w34("dg").skladanie).toBe("wniosek");
    expect(w34("zlecenie").dokument).toMatch(/Z-3a/);
    for (const t of ["dg", "zlecenie"]) expect(w34(t).dokument).not.toMatch(/\bZAM\b/);
  });
});
