/* =====================================================================
   Testy podstawiania danych z profilu do kalkulatorów.
   Cel: po założeniu konta i wypełnieniu „Moich danych” kalkulator ma
   od razu policzyć wynik, bez przepisywania danych ręcznie.

   `wyliczPodstawienie(profil, nazwa)` to czysta funkcja wyciągnięta
   z hooka `useProfileDefaults` — testujemy ją bez Reacta.
   ===================================================================== */
import { describe, it, expect } from "vitest";
import { wyliczPodstawienie, opisPodstawienia } from "./useProfileDefaults.js";

// Profil „po założeniu konta”: komplet danych ciężarnej pracownicy.
const profilCiezarna = {
  ubezpieczony: {
    plec: "K", dataUrodzenia: "1992-04-10",
    statusUbezpieczenia: "pracownik", podstawaWymiaru: "6500",
    ubezpieczenieOd: "2019-03-01", wymiarEtatu: "pelny",
    zmianaWymiaru12m: "nie", zaleglosci: "nie", wiecejNizJedenTytul: "nie",
    ubezpieczenieUstalo: "nie",
  },
  sytuacja: { etap: "ciaza", rola: "matka", typPrzyjecia: "" },
  platnik: { nazwa: "ACME", nip: "1234567890", liczbaUbezpieczonych: "powyzej_20" },
  drugiRodzic: { imie: "Jan", nazwisko: "Nowak", pesel: "90010112345", statusUbezpieczenia: "pracownik", podstawaWymiaru: "7200", brak: false },
  dziecko: {
    dataUrodzenia: "", przewidywanaDataPorodu: "2026-09-15", liczbaDzieci: "1",
    martwe: "nie", zmarlo: "nie", zaZyciem: false, tydzienCiazy: "", masaUrodzenia: "",
    szpitalOd: "", szpitalDo: "",
  },
  zdrowie: { zwolnienie: "B", zlaOd: "2026-06-01", zlaDo: "2026-09-15", wczesniejszeZwolnienia: "nie" },
  urlopy: {
    urlopPrzedPorodemOd: "", zamiarPelnyWymiar: "tak", macierzynskiWykorzystanoTyg: "0",
    matkaRezygnuje: "nie", planOjcowski: "tak", planRodzicielski: "tak",
    laczenieZPraca: "nie", wymiarPracyPrzyLaczeniu: "", rodzicielskieCzesci: "1",
    rodzicielskiWykorzystanoTyg: "0",
  },
};

// Profil ojca (plec M) — dane matki są w drugiRodzic.
const profilOjciec = {
  ...profilCiezarna,
  ubezpieczony: { ...profilCiezarna.ubezpieczony, plec: "M", podstawaWymiaru: "7200", dataUrodzenia: "1990-01-01" },
  sytuacja: { etap: "po_porodzie", rola: "ojciec", typPrzyjecia: "" },
  drugiRodzic: { ...profilCiezarna.drugiRodzic, statusUbezpieczenia: "pracownik", podstawaWymiaru: "6500" },
  dziecko: { ...profilCiezarna.dziecko, dataUrodzenia: "2026-01-10", przewidywanaDataPorodu: "" },
  zdrowie: {},
};

// Profil przedsiębiorczyni z zaległością.
const profilDG = {
  ...profilCiezarna,
  ubezpieczony: { ...profilCiezarna.ubezpieczony, statusUbezpieczenia: "dg", zaleglosci: "tak" },
  platnik: { nazwa: "", nip: "", liczbaUbezpieczonych: "nie_wiem" },
  zdrowie: { zwolnienie: "B", zlaOd: "2026-07-01" },
};

describe("a) kalkulator zasiłku chorobowego w ciąży", () => {
  it("pracownica w ciąży — podstawia podstawę, status, datę urodzenia, kod B", () => {
    const p = wyliczPodstawienie(profilCiezarna, "chorobowy");
    expect(p.status).toBe("obw");
    expect(p.podstawa).toBe("6500");
    expect(p.ur).toBe("1992-04-10");
    expect(p.kodB).toBe(true);
    expect(p.od).toBe("2026-06-01");
  });

  it("liczy staż ubezpieczenia z daty początkowej (dniUb)", () => {
    const p = wyliczPodstawienie(profilCiezarna, "chorobowy");
    expect(Number(p.dniUb)).toBeGreaterThan(2000);
  });

  it("liczbę ubezpieczonych u płatnika podaje jako liczbę", () => {
    expect(wyliczPodstawienie(profilCiezarna, "chorobowy").liczbaUbPlatnika).toBe("21");
  });

  it("przedsiębiorczyni → status dobrowolny i zaległość powyżej progu", () => {
    const p = wyliczPodstawienie(profilDG, "chorobowy");
    expect(p.status).toBe("dobr");
    expect(Number(p.zaleglosc)).toBeGreaterThan(48.06);
  });

  it("ojciec — nie dostaje statusu ani daty urodzenia matki w swoje pola", () => {
    const p = wyliczPodstawienie(profilOjciec, "chorobowy");
    expect(p.status).toBeUndefined();
    expect(p.ur).toBeUndefined();
    // ale podstawa jest podstawą matki
    expect(p.podstawa).toBe("6500");
  });
});

describe("b) kalkulator zasiłku macierzyńskiego", () => {
  it("podstawia PDP, podstawy obojga rodziców i wniosek 81,5%", () => {
    const p = wyliczPodstawienie(profilCiezarna, "macierzynski");
    expect(p.porod).toBe("2026-09-15");
    expect(p.podstM).toBe("6500");
    expect(p.podstO).toBe("7200");
    expect(p.wniosek81).toBe(true);
    expect(p.dzieci).toBe("1");
  });

  it("ojciec — jego podstawa idzie w „ojciec”, matki w „matka”", () => {
    const p = wyliczPodstawienie(profilOjciec, "macierzynski");
    expect(p.podstO).toBe("7200");
    expect(p.podstM).toBe("6500");
  });

  it("przelicza hospitalizację na liczbę dni", () => {
    const profil = {
      ...profilCiezarna,
      dziecko: { ...profilCiezarna.dziecko, szpitalOd: "2026-09-16", szpitalDo: "2026-09-25" },
    };
    expect(wyliczPodstawienie(profil, "macierzynski").hosp).toBe("10");
  });

  it("„Za życiem” i martwe urodzenie trafiają do kalkulatora", () => {
    const profil = {
      ...profilCiezarna,
      dziecko: { ...profilCiezarna.dziecko, zaZyciem: true, martwe: "tak", dataZgonu: "2026-09-15" },
    };
    const p = wyliczPodstawienie(profil, "macierzynski");
    expect(p.zaZyciem).toBe(true);
    expect(p.szczegol).toBe("martwe");
    expect(p.zgon).toBe("2026-09-15");
  });

  it("plan ojcowski z profilu → pole ojcowski", () => {
    expect(wyliczPodstawienie(profilCiezarna, "macierzynski").ojcowski).toBe(true);
  });
});

describe("c) kalkulator łączenia urlopu z pracą", () => {
  it("podstawia podstawę, liczbę dzieci i wymiar pracy", () => {
    const profil = { ...profilCiezarna, urlopy: { ...profilCiezarna.urlopy, wymiarPracyPrzyLaczeniu: "do_polowy" } };
    const p = wyliczPodstawienie(profil, "laczenie");
    expect(p.podstawa).toBe("6500");
    expect(p.dzieci).toBe("1");
    expect(p.etat).toBe("0.5");
    expect(p.stawka).toBe("81.5");
  });

  it("bez wniosku 81,5% → stawka 70", () => {
    const profil = { ...profilCiezarna, urlopy: { ...profilCiezarna.urlopy, zamiarPelnyWymiar: "nie" } };
    expect(wyliczPodstawienie(profil, "laczenie").stawka).toBe("70");
  });
});

describe("d) kalkulator obojga rodziców", () => {
  it("podstawia podstawy obojga i wykorzystane tygodnie", () => {
    const profil = {
      ...profilCiezarna,
      dziecko: { ...profilCiezarna.dziecko, dataUrodzenia: "2026-01-10" },
      urlopy: { ...profilCiezarna.urlopy, rodzicielskiWykorzystanoTyg: "5", macierzynskiWykorzystanoTyg: "20" },
    };
    const p = wyliczPodstawienie(profil, "oboje");
    expect(p.pM).toBe("6500");
    expect(p.pO).toBe("7200");
    expect(p.tM).toBe("5");
    expect(p.macM).toBe("20");
    expect(p.wniosek81).toBe(true);
  });
});

describe("e) kalkulator adopcji / rodziny zastępczej", () => {
  it("przysposobienie z profilu", () => {
    const profil = { ...profilCiezarna, sytuacja: { ...profilCiezarna.sytuacja, etap: "przyjecie", typPrzyjecia: "przysposobienie" } };
    const p = wyliczPodstawienie(profil, "adopcja");
    expect(p.tryb).toBe("przysposobienie");
    expect(p.przyj).toBeUndefined(); // brak daty przyjęcia → wartość domyślna zostaje
  });

  it("rodzina zastępcza + data przyjęcia + odroczenie", () => {
    const profil = {
      ...profilCiezarna,
      sytuacja: { ...profilCiezarna.sytuacja, etap: "przyjecie", typPrzyjecia: "rodzina_zastepcza" },
      dziecko: { ...profilCiezarna.dziecko, dataUrodzenia: "2019-05-01", dataPrzyjecia: "2026-04-01", odroczonySzkolny: "tak" },
    };
    const p = wyliczPodstawienie(profil, "adopcja");
    expect(p.tryb).toBe("rodzinaZastepcza");
    expect(p.przyj).toBe("2026-04-01");
    expect(p.odroczenie).toBe(true);
  });
});

describe("f) kalkulator podstawy wymiaru", () => {
  it("pracownik → status pracownik", () => {
    expect(wyliczPodstawienie(profilCiezarna, "podstawa").status).toBe("pracownik");
  });
  it("działalność → niepracownik", () => {
    expect(wyliczPodstawienie(profilDG, "podstawa").status).toBe("niepracownik");
  });
});

describe("g) kalkulator dokumentów i terminów", () => {
  it("podstawia status, liczbę ubezpieczonych, zaległość i etap", () => {
    const p = wyliczPodstawienie(profilCiezarna, "dokumenty");
    expect(p.status).toBe("pracownik");
    expect(p.liczba).toBe("21");
    expect(p.zaleglosc).toBe(false);
    expect(p.etap).toBe("ciazaL4");
  });

  it("po porodzie → etap porod (wartość z listy ETAPY w CalcDokumenty.jsx)", () => {
    const profil = { ...profilOjciec, zdrowie: { zwolnienie: "brak" } };
    expect(wyliczPodstawienie(profil, "dokumenty").etap).toBe("porod");
  });
});

describe("odporność na niekompletny profil", () => {
  it("pusty profil nie wywraca żadnego kalkulatora", () => {
    const pusty = {
      ubezpieczony: {}, sytuacja: {}, platnik: {}, drugiRodzic: {},
      dziecko: {}, zdrowie: {}, urlopy: {},
    };
    for (const k of ["chorobowy", "macierzynski", "laczenie", "oboje", "adopcja", "podstawa", "dokumenty"]) {
      expect(() => wyliczPodstawienie(pusty, k)).not.toThrow();
      expect(wyliczPodstawienie(pusty, k)).toEqual({});
    }
  });

  it("null profil → pusty obiekt", () => {
    expect(wyliczPodstawienie(null, "chorobowy")).toEqual({});
  });

  it("puste pola nie nadpisują wartości domyślnych kalkulatora", () => {
    const p = wyliczPodstawienie({ ...profilCiezarna, dziecko: { ...profilCiezarna.dziecko, liczbaDzieci: "" } }, "macierzynski");
    expect(p.dzieci).toBeUndefined();
  });
});

describe("f) podstawa — wymiar etatu (B-17)", () => {
  it("pełny etat → wymiarEtatu 1", () => {
    expect(wyliczPodstawienie(profilCiezarna, "podstawa").wymiarEtatu).toBe("1");
  });

  it("część etatu → wymiarEtatu 0.5", () => {
    const profil = { ...profilCiezarna, ubezpieczony: { ...profilCiezarna.ubezpieczony, wymiarEtatu: "czesc" } };
    expect(wyliczPodstawienie(profil, "podstawa").wymiarEtatu).toBe("0.5");
  });

  it("dla nie-pracownika wymiar etatu nie ma znaczenia i nie jest podstawiany", () => {
    const profil = { ...profilDG, ubezpieczony: { ...profilDG.ubezpieczony, wymiarEtatu: "" } };
    expect(wyliczPodstawienie(profil, "podstawa").wymiarEtatu).toBeUndefined();
  });
});

describe("pasek „dane z profilu” (ProfilInfo)", () => {
  it("opisuje podstawione pola etykietami zrozumiałymi dla użytkownika", () => {
    const patch = wyliczPodstawienie(profilCiezarna, "chorobowy");
    const opis = opisPodstawienia(Object.keys(patch), patch);
    const tytul = opis.find((p) => p.pole === "status");
    expect(tytul.etykieta).toBe("Tytuł ubezpieczenia");
    expect(opis.every((p) => p.etykieta && p.etykieta !== p.pole)).toBe(true);
  });

  it("wartości logiczne pokazuje jako tak/nie", () => {
    expect(opisPodstawienia(["kodB"], { kodB: true })[0].wartosc).toBe("tak");
    expect(opisPodstawienia(["kodB"], { kodB: false })[0].wartosc).toBe("nie");
  });

  it("nie wywraca się na brakującym kluczu ani pustym stanie", () => {
    expect(() => opisPodstawienia(["nieistniejace"], {})).not.toThrow();
    expect(() => opisPodstawienia(["status"], undefined)).not.toThrow();
    expect(opisPodstawienia(["nieistniejace"], {})[0].wartosc).toBe("");
  });

  it("niezalogowany (brak profilu) nie dostaje żadnych podstawień", () => {
    expect(wyliczPodstawienie(null, "chorobowy")).toEqual({});
  });
});

/* ---------- spójność z listami w kalkulatorach i z przepisami (przegląd 21.11 wieczorem) ---------- */
import fs from "node:fs";
import path from "node:path";

// Wartości opcji <Select> z pliku kalkulatora – podstawiona wartość MUSI być na liście,
// inaczej pole pokazuje pierwszą opcję, a wyliczenie liczy dla innej wartości.
const opcje = (plik) => {
  const kod = fs.readFileSync(path.join(import.meta.dirname, plik), "utf8");
  return new Set([...kod.matchAll(/value: "([^"]+)"/g)].map((m) => m[1]));
};

describe("spójność podstawień z listami wyboru w kalkulatorach", () => {
  const ETAPY_PROFILU = ["ciaza", "po_porodzie", "przyjecie", ""];
  const TYTULY = ["pracownik", "powolanie", "zlecenie", "dg", "wspolpraca", "duchowny", "marynarz", "uaktywniajaca", "dzielo", "student_zlecenie", "nierejestrowa", "ulga_na_start", "brak", ""];
  const warianty = [];
  for (const etap of ETAPY_PROFILU) for (const tytul of TYTULY) for (const martwe of ["tak", "nie"]) for (const zwolnienie of ["B", "bez_B", ""]) for (const typPrzyjecia of ["przysposobienie", "rodzina_zastepcza", "rodzina_zastepcza_zawodowa", ""]) {
    warianty.push({
      ...profilCiezarna,
      ubezpieczony: { ...profilCiezarna.ubezpieczony, statusUbezpieczenia: tytul },
      sytuacja: { etap, rola: "matka", typPrzyjecia },
      dziecko: { ...profilCiezarna.dziecko, martwe },
      zdrowie: { zwolnienie },
    });
  }
  const sprawdz = (kalk, plik, pola) => {
    const dozwolone = opcje(plik);
    const zle = [];
    for (const p of warianty) {
      const w = wyliczPodstawienie(p, kalk);
      for (const pole of pola) if (w[pole] !== undefined && !dozwolone.has(w[pole])) zle.push(`${pole}=${w[pole]}`);
    }
    expect([...new Set(zle)]).toEqual([]);
  };

  it("g) dokumenty: status i etap zawsze z listy", () => sprawdz("dokumenty", "CalcDokumenty.jsx", ["status", "etap"]));
  it("a) chorobowy: status z listy", () => sprawdz("chorobowy", "CalcChorobowy.jsx", ["status"]));
  it("b) macierzyński: sytuacja szczególna i liczba dzieci z listy", () => sprawdz("macierzynski", "CalcMacierzynski.jsx", ["szczegol", "dzieci"]));
  it("c) łączenie: stawka i liczba dzieci z listy", () => sprawdz("laczenie", "CalcLaczenie.jsx", ["stawka", "dzieci"]));
  it("e) adopcja: tryb i liczba dzieci z listy", () => sprawdz("adopcja", "CalcAdopcja.jsx", ["tryb", "dzieci"]));
  it("f) podstawa: status i etat z listy", () => sprawdz("podstawa", "CalcPodstawa.jsx", ["status", "wymiarEtatu"]));
});

describe("poprawki mapowania", () => {
  it("g) etapy: przyjęcie → adopcja, strata dziecka → martwe, urlop przed porodem → przedPorodem", () => {
    const e = (s, d = {}, z = {}, ur = {}) => wyliczPodstawienie({ ...profilCiezarna, sytuacja: { ...profilCiezarna.sytuacja, ...s }, dziecko: { ...profilCiezarna.dziecko, ...d }, zdrowie: z, urlopy: { ...profilCiezarna.urlopy, ...ur } }, "dokumenty").etap;
    expect(e({ etap: "przyjecie" })).toBe("adopcja");
    expect(e({ etap: "po_porodzie" }, { zmarlo: "tak" })).toBe("martwe");
    expect(e({ etap: "ciaza" }, {}, {}, { urlopPrzedPorodemOd: "2026-08-10" })).toBe("przedPorodem");
    expect(e({ etap: "ciaza" }, {}, { zwolnienie: "B" }, { urlopPrzedPorodemOd: "2026-08-10" })).toBe("ciazaL4");
    // po porodzie stare L4 z kodem B nie może przestawiać etapu z powrotem na ciążę
    expect(e({ etap: "po_porodzie" }, {}, { zwolnienie: "B" })).toBe("porod");
  });

  it("g) osoba współpracująca → dg; duchowny / marynarz – nie zgadujemy", () => {
    const st = (t) => wyliczPodstawienie({ ...profilCiezarna, ubezpieczony: { ...profilCiezarna.ubezpieczony, statusUbezpieczenia: t } }, "dokumenty").status;
    expect(st("wspolpraca")).toBe("dg");
    expect(st("duchowny")).toBeUndefined();
    expect(st("marynarz")).toBeUndefined();
  });

  it("b) zgon dziecka przed 8. tygodniem → wariant „martwe”, po 8 tygodniach → „zgonPo”, bez dat → nie zgadujemy", () => {
    const sz = (d) => wyliczPodstawienie({ ...profilOjciec, dziecko: { ...profilOjciec.dziecko, zmarlo: "tak", ...d } }, "macierzynski").szczegol;
    expect(sz({ dataUrodzenia: "2026-01-10", dataZgonu: "2026-02-01" })).toBe("martwe");
    expect(sz({ dataUrodzenia: "2026-01-10", dataZgonu: "2026-03-07" })).toBe("zgonPo"); // 56 dni
    expect(sz({ dataUrodzenia: "2026-01-10", dataZgonu: "" })).toBeUndefined();
  });

  it("b) brak odpowiedzi o urlopie ojcowskim nie wyłącza go w wyliczeniu", () => {
    const p = { ...profilCiezarna, urlopy: { ...profilCiezarna.urlopy, planOjcowski: "" } };
    expect(wyliczPodstawienie(p, "macierzynski").ojcowski).toBeUndefined();
    expect(wyliczPodstawienie({ ...p, urlopy: { ...p.urlopy, planOjcowski: "nie" } }, "macierzynski").ojcowski).toBe(false);
  });

  it("d) wykorzystany rodzicielski ojca trafia do kolumny ojca, ujemne liczby pomijane", () => {
    const p = wyliczPodstawienie({ ...profilOjciec, urlopy: { ...profilOjciec.urlopy, rodzicielskiWykorzystanoTyg: "6", rodzicielskieCzesci: "2", macierzynskiWykorzystanoTyg: "-3" } }, "oboje");
    expect(p.tO).toBe("6");
    expect(p.cO).toBe("2");
    expect(p.tM).toBeUndefined();
    expect(p.cM).toBeUndefined();
    expect(p.macM).toBeUndefined();
  });

  it("e) zawodowa rodzina zastępcza nie dostaje trybu „rodzina zastępcza” (brak prawa do urlopu)", () => {
    const p = wyliczPodstawienie({ ...profilCiezarna, sytuacja: { etap: "przyjecie", rola: "matka", typPrzyjecia: "rodzina_zastepcza_zawodowa" } }, "adopcja");
    expect(p.tryb).toBeUndefined();
  });
});

describe("pasek „Z PROFILU” – wartości czytelne dla człowieka", () => {
  const profile = [profilCiezarna, profilOjciec, profilDG,
    { ...profilCiezarna, ubezpieczony: { ...profilCiezarna.ubezpieczony, wymiarEtatu: "czesc" }, urlopy: { ...profilCiezarna.urlopy, wymiarPracyPrzyLaczeniu: "powyzej", zamiarPelnyWymiar: "nie" } },
    { ...profilCiezarna, sytuacja: { etap: "przyjecie", rola: "matka", typPrzyjecia: "rodzina_zastepcza" }, dziecko: { ...profilCiezarna.dziecko, dataPrzyjecia: "2026-04-01", martwe: "tak" } }];
  const KALK = ["chorobowy", "macierzynski", "laczenie", "oboje", "adopcja", "podstawa", "dokumenty"];

  it("bez kodów technicznych, kropek dziesiętnych i dat ISO", () => {
    const zle = [];
    for (const p of profile) for (const k of KALK) {
      const patch = wyliczPodstawienie(p, k);
      for (const o of opisPodstawienia(Object.keys(patch), patch, k)) {
        if (/^(obw|dobr|porod|ciazaL4|przedPorodem|martwe|zgonPo|rodzinaZastepcza|niepracownik)$/.test(o.wartosc)
          || /(^|\s)\d+\.\d+(\s|%|$)/.test(o.wartosc) /* „81.5”, „0.5” – ale nie data 10.04.1992 */ || /\d{4}-\d{2}-\d{2}/.test(o.wartosc) || o.wartosc === "") zle.push(`${k}.${o.pole}=${o.wartosc}`);
      }
    }
    expect(zle).toEqual([]);
  });

  it("kwoty w złotych, stawka z przecinkiem, data po polsku, w a) data urodzenia matki", () => {
    const opis = (k) => { const patch = wyliczPodstawienie(profilCiezarna, k); return Object.fromEntries(opisPodstawienia(Object.keys(patch), patch, k).map((o) => [o.etykieta, o.wartosc])); };
    expect(opis("chorobowy")["Podstawa wymiaru"]).toBe("6 500,00 zł");
    expect(opis("chorobowy")["Tytuł ubezpieczenia"]).toBe("obowiązkowe (umowa o pracę)");
    expect(opis("chorobowy")["Twoja data urodzenia"]).toBe("10.04.1992");
    expect(opis("laczenie")["Stawka zasiłku"]).toBe("81,5%");
    expect(opis("dokumenty")["Etap sprawy"]).toBe("ciąża – zwolnienie z kodem B");
  });
});
