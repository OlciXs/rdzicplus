// Testy losowe (fuzz) + niezmienniki. Generujemy tysiące profili i wejść kalkulatorów –
// także „śmieciowych” (ujemne liczby, tekst, złe i przyszłe daty) – i sprawdzamy reguły,
// które muszą być prawdziwe ZAWSZE. Ziarno jest stałe, więc wynik jest powtarzalny.
import { describe, it, expect } from "vitest";
import {
  WNIOSKI, POLA, ocenWniosek, przegladWnioskow,
  podstawaWymiaru, chorobowyWCiazy, zasilekMacierzynski, laczenieZPraca, obojeRodzice, adopcja,
  DEFAULT_PARAMS, przygotujDruk, DRUKI,
  porownaj,
} from "./index.js";

// --- generator liczb pseudolosowych (mulberry32) ---
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(20261121);
const pick = (arr) => arr[Math.floor(R() * arr.length)];
const maybe = (v, p = 0.75) => (R() < p ? v : pick(["", undefined, null]));
const date = () => pick(["2026-11-21", "2026-01-15", "2025-06-01", "2024-02-29", "2019-09-01", "2027-03-10",
  "2013-06-01", "1970-03-01", "2026-13-45", "nie-data", "", "2026-11-20", "2026-10-31", "2030-01-01"]);
const num = () => pick(["0", "1", "2", "3", "5", "6", "7", "9", "10", "14", "15", "21", "37", "60", "100",
  "-5", "abc", "", "4,5", "1e9", "NaN", "Infinity", 2, 0, -1]);
const tn = () => pick(["tak", "nie", "", "nie_wiem"]);

const TYTULY = ["pracownik", "powolanie", "zlecenie", "dg", "wspolpraca", "duchowny", "marynarz", "uaktywniajaca",
  "dzielo", "student_zlecenie", "nierejestrowa", "ulga_na_start", "brak", "", "cos_innego"];

function losowyProfil() {
  return {
    ubezpieczony: {
      plec: pick(["K", "M", ""]),
      statusUbezpieczenia: pick(TYTULY),
      ubezpieczenieOd: maybe(date()),
      ulgaWyczekiwania: pick(["brak", "absolwent", "10_lat", "posel", ""]),
      podstawaWymiaru: maybe(pick(["5177.40", "4000", "0", "-100", "abc", "1500,50", "999999999"])),
      zaleglosci: tn(),
      ubezpieczenieUstalo: tn(),
      dataUstania: maybe(date()),
      przyczynaUstania: pick(["wypowiedzenie", "upadlosc", "likwidacja", "smierc_pracodawcy", "naruszenie_prawa", "inna", ""]),
      zapewnionoInnaPrace: tn(),
      zmianaWymiaru12m: tn(),
      wiecejNizJedenTytul: tn(),
      zatrudnionyOd: maybe(date()),
    },
    sytuacja: {
      etap: pick(["ciaza", "po_porodzie", "przyjecie", ""]),
      rola: pick(["matka", "ojciec", "inny", ""]),
      typPrzyjecia: pick(["przysposobienie", "rodzina_zastepcza", "rodzina_zastepcza_zawodowa", ""]),
    },
    platnik: { liczbaUbezpieczonych: pick(["do_20", "powyzej_20", "nie_wiem", ""]) },
    drugiRodzic: {
      brak: R() < 0.2,
      statusUbezpieczenia: pick(TYTULY),
      okolicznosc: pick(["brak", "zgon", "porzucenie", "szpital", "niesamodzielna", "podjela_prace", ""]),
      dataOkolicznosci: maybe(date()),
    },
    dziecko: {
      przewidywanaDataPorodu: maybe(date()),
      dataUrodzenia: maybe(date()),
      liczbaDzieci: maybe(num()),
      liczbaZyjacych: maybe(num()),
      martwe: tn(), zmarlo: tn(), zaGranica: tn(),
      pobytWSzpitalu: tn(),
      tydzienCiazy: pick(["ponizej_28", "28_37", "po_37", ""]),
      masaUrodzenia: maybe(num()),
      szpitalOd: maybe(date()), szpitalDo: maybe(date()),
      dataPrzyjecia: maybe(date()),
      odroczonySzkolny: tn(), niepelnosprawne: tn(),
      zaZyciem: R() < 0.2,
    },
    zdrowie: {
      zwolnienie: pick(["brak", "B", "bez_B", ""]),
      zlaOd: maybe(date()),
      wczesniejszeZwolnienia: tn(), okresZasilkowyWyczerpany: tn(), rokowaniaPoprawy: tn(), wypadekWDrodze: tn(),
    },
    urlopy: {
      zamiarPelnyWymiar: tn(), macierzynskiWykorzystanoTyg: maybe(num()), matkaRezygnuje: tn(),
      planUzupelniajacy: tn(), terminKoncaMacierzynskiego: maybe(date()), drugiRodzicUzupelniajacy: tn(),
      planOjcowski: tn(), ojcowskiZInnegoTytulu: tn(), planRodzicielski: tn(),
      rodzicielskieCzesci: maybe(num()), rodzicielskiWykorzystanoTyg: maybe(num()),
      drugiRodzicRodzicielski: pick(["tak", "nie", "nie_wiem", ""]),
      laczenieZPraca: tn(), wymiarPracyPrzyLaczeniu: pick(["do_polowy", "powyzej", ""]),
      planWychowawczy: tn(), wychowawczyWykorzystanoMies: maybe(num()),
      potrzebaOpieki: pick(["brak", "chore_dziecko", "zamkniecie_placowki", "choroba_niani", "choroba_rodzica", "szpital_rodzica", "niepelnosprawne", "chory_czlonek", ""]),
      domownikMozeOpiekowac: tn(), opiekunczyDniWRoku: maybe(num()),
    },
  };
}

const STATUSY = new Set(["dostepny", "niedostepny", "brak_danych", "informacja", "nie_dotyczy"]);
const ZLE_TEKSTY = /NaN|undefined|Invalid Date|Infinity|null|\[object/;
const tekstyWariantu = (v) => [v.wymiar, v.wysokosc, v.adresat, v.termin, ...(v.powody ?? []), ...(v.warunki ?? []).map((w) => w.tekst)]
  .filter((x) => typeof x === "string");

describe("fuzz: warianty wniosków na 3000 losowych profilach", () => {
  const profile = Array.from({ length: 3000 }, losowyProfil);

  it("ocena nigdy nie rzuca wyjątku, a statusy i liczniki są spójne", () => {
    const bledy = [];
    for (const [i, p] of profile.entries()) {
      try {
        const { wnioski, ostrzezenia } = przegladWnioskow(p, { dzis: "2026-11-21" });
        for (const w of wnioski) {
          const suma = w.warianty.filter((v) => ["dostepny", "brak_danych", "niedostepny"].includes(v.status)).length;
          if (suma !== w.dostepne + w.brakDanych + w.niedostepne) bledy.push(`#${i} ${w.id}: liczniki`);
        }
        for (const o of ostrzezenia) if (ZLE_TEKSTY.test(o.tekst)) bledy.push(`#${i} ostrzeżenie ${o.kod}: ${o.tekst}`);
      } catch (e) {
        bledy.push(`#${i}: wyjątek ${e.message}`);
      }
    }
    expect(bledy.slice(0, 10)).toEqual([]);
  });

  it("niezmienniki każdego wariantu", () => {
    const bledy = [];
    for (const [i, p] of profile.entries()) {
      for (const wn of WNIOSKI) {
        for (const v of ocenWniosek(p, wn.id, { dzis: "2026-11-21" }).warianty) {
          const tag = `#${i} ${v.id} (${p.sytuacja.rola || "-"}/${p.sytuacja.etap || "-"})`;
          if (!STATUSY.has(v.status)) bledy.push(`${tag}: status ${v.status}`);
          if (v.status === "dostepny" && v.warunki.some((x) => x.ok !== true)) bledy.push(`${tag}: dostępny mimo niespełnionego warunku`);
          if (v.status === "niedostepny" && !v.powody.length) bledy.push(`${tag}: niedostępny bez powodu`);
          if (v.status === "brak_danych" && !v.brakujaceDane.length) bledy.push(`${tag}: brak danych bez listy pól`);
          for (const b of v.brakujaceDane ?? []) if (!POLA[b.pole]) bledy.push(`${tag}: pole bez etykiety ${b.pole}`);
          for (const b of v.doUzupelnienia ?? []) if (!POLA[b.pole]) bledy.push(`${tag}: pole do uzupełnienia bez etykiety ${b.pole}`);
          for (const t of tekstyWariantu(v)) if (ZLE_TEKSTY.test(t)) bledy.push(`${tag}: zły tekst „${t}”`);
          const rola = p.sytuacja.rola;
          if (rola && !v.kto.includes(rola) && v.status !== "nie_dotyczy" && v.status !== "informacja") bledy.push(`${tag}: inna rola, a nie „nie dotyczy”`);
          if (v.warunki) for (const x of v.warunki) if (![true, false, null].includes(x.ok)) bledy.push(`${tag}: warunek ok=${x.ok} („${x.tekst}”)`);
          for (const t of tekstyWariantu(v)) if (/(^|[^\d,])-\d/.test(t)) bledy.push(`${tag}: ujemna liczba w tekście „${t}”`);
        }
      }
    }
    expect(bledy.slice(0, 15)).toEqual([]);
  });

  it("matka nigdy nie dostaje urlopu ojcowskiego, ojciec nigdy zasiłku chorobowego w ciąży", () => {
    const bledy = [];
    for (const [i, p] of profile.entries()) {
      const ojc = ocenWniosek(p, "ojcowski", { dzis: "2026-11-21" }).warianty.find((v) => v.id === "W21");
      if (p.sytuacja.rola === "matka" && ojc.status === "dostepny") bledy.push(`#${i} matka + ojcowski`);
      const ch = ocenWniosek(p, "chorobowy", { dzis: "2026-11-21" }).warianty.find((v) => v.id === "W34");
      if (p.sytuacja.rola === "ojciec" && ch.status === "dostepny") bledy.push(`#${i} ojciec + chorobowy w ciąży`);
    }
    expect(bledy).toEqual([]);
  });
});

describe("fuzz: wnioski do druku na 1000 losowych profilach", () => {
  const profile = Array.from({ length: 1000 }, losowyProfil);
  it("każdy druk się generuje, bez NaN/undefined w piśmie, daty w polach poprawne albo puste", () => {
    const bledy = [];
    profile.forEach((p, i) => {
      for (const id of DRUKI) {
        let d;
        try { d = przygotujDruk(p, id, { dzis: "2026-11-21" }); } catch (e) { bledy.push(`#${i} ${id}: ${e.message}`); continue; }
        const tekst = JSON.stringify([d.tytul, d.naglowek, d.tresc, d.zalaczniki, d.ostrzezenia, d.brakujace]);
        if (ZLE_TEKSTY.test(tekst)) bledy.push(`#${i} ${id}: ${tekst.match(ZLE_TEKSTY)[0]}`);
        for (const pole of d.pola) {
          if (pole.typ === "date" && pole.wartosc !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(pole.wartosc)) bledy.push(`#${i} ${id}.${pole.id} = ${pole.wartosc}`);
          if (pole.typ === "number" && pole.wartosc !== "" && !(Number(pole.wartosc) >= 0)) bledy.push(`#${i} ${id}.${pole.id} = ${pole.wartosc}`);
        }
      }
    });
    expect(bledy.slice(0, 10)).toEqual([]);
  });
});

// --- kalkulatory: dowolne wejście → skończone, nieujemne liczby ---
const numeryczne = (obj, sciezka = "", out = []) => {
  if (typeof obj === "number") out.push([sciezka, obj]);
  else if (obj && typeof obj === "object" && !(obj instanceof Date)) for (const [k, v] of Object.entries(obj)) numeryczne(v, `${sciezka}.${k}`, out);
  return out;
};
const sprawdzLiczby = (nazwa, wynik, bledy, i) => {
  for (const [s, v] of numeryczne(wynik)) {
    if (!Number.isFinite(v)) bledy.push(`${nazwa} #${i} ${s} = ${v}`);
    else if (v < 0 && !/wiek/.test(s)) bledy.push(`${nazwa} #${i} ${s} = ${v} (ujemne)`);
  }
};
const smiec = () => pick([0, 1, 2, 5, 7, 30, 270, 300, 5000, 6000.5, -1, -500, NaN, Infinity, -Infinity, "abc", "", null, undefined, "4806,00", 1e12, 0.5, 0.25, 0.8, 3]);

describe("fuzz: kalkulatory na 3000 losowych wejściach", () => {
  it("żadna funkcja nie zwraca NaN, Infinity ani ujemnych kwot", () => {
    const bledy = [];
    for (let i = 0; i < 3000; i++) {
      try {
        sprawdzLiczby("podstawa", podstawaWymiaru({
          status: pick(["pracownik", "niepracownik"]), miesiace: Array.from({ length: 12 }, smiec),
          ileMies: smiec(), premieKwartalne: smiec(), premiaRoczna: smiec(), wymiarEtatu: smiec(),
        }), bledy, i);
        sprawdzLiczby("chorobowy", chorobowyWCiazy({
          status: pick(["obw", "dobr"]), dniUbezpieczenia: smiec(), liczbaUbPlatnika: smiec(), dataUrodzenia: date(),
          poczatek: date(), dniNiezdolnosci: smiec(), wykorzystaneWynagrodzenie: smiec(), wykorzystanyOkres: smiec(),
          kodB: R() < 0.5, podstawa: smiec(), zaleglosc: smiec(), wczesniejszeBezB: R() < 0.5,
        }), bledy, i);
        sprawdzLiczby("macierzynski", zasilekMacierzynski({
          dzieci: smiec(), porod: date(), przedPorodem: smiec(), zaZyciem: R() < 0.3,
          sytuacja: pick(["brak", "martwe", "zgonPo"]), dataZgonu: date(), wniosek815: R() < 0.5,
          podstawaMatki: smiec(), podstawaOjca: smiec(), tygodnieDlaOjca: smiec(), ojcowski: R() < 0.5,
          tydzienCiazy: smiec(), masa: smiec(), dniHospitalizacji: smiec(),
        }), bledy, i);
        sprawdzLiczby("laczenie", laczenieZPraca({ dzieci: smiec(), zaZyciem: R() < 0.3, etat: smiec(), podstawa: smiec(), stawka: smiec(), tygodnieLaczenia: smiec() }), bledy, i);
        sprawdzLiczby("oboje", obojeRodzice({
          dzieci: smiec(), zaZyciem: R() < 0.3, dataUrodzenia: date(), tygodnieMatka: smiec(), czesciMatka: smiec(),
          tygodnieOjciec: smiec(), czesciOjciec: smiec(), wniosek815: R() < 0.5, podstawaMatki: smiec(), podstawaOjca: smiec(),
        }), bledy, i);
        sprawdzLiczby("adopcja", adopcja({
          tryb: pick(["przysposobienie", "rodzinaZastepcza"]), dzieci: smiec(), dataUrodzenia: date(), dataPrzyjecia: date(),
          odroczenie: R() < 0.5, zaZyciem: R() < 0.3, podstawa: smiec(), wniosek815: R() < 0.5, ojcowski: R() < 0.5,
        }), bledy, i);
      } catch (e) {
        bledy.push(`#${i}: wyjątek ${e.message}`);
      }
    }
    expect(bledy.slice(0, 15)).toEqual([]);
  });

  describe("fuzz: porównanie 3000 losowych wejść", () => {
    it("niezmienniki kwot i pul scenariuszy", () => {
      const bledy = [];
      for (let i = 0; i < 3000; i++) {
        try {
          const r = porownaj({
            dzieci: smiec(),
            porod: date(),
            przewidywanaDataPorodu: date(),
            podstawaMatki: smiec(),
            podstawaOjca: smiec(),
            mamaUbezpieczona: R() < 0.5 ? true : R() < 0.8 ? false : null,
            tataUbezpieczony: R() < 0.5 ? true : R() < 0.8 ? false : null,
            zalegloscMatki: smiec(),
            zalegloscTaty: smiec(),
            dobrowolnaMama: R() < 0.3,
            wniosek815: R() < 0.5 ? true : R() < 0.8 ? false : null,
            rownolegle: R() < 0.5,
          }, DEFAULT_PARAMS, "2026-11-21");

          for (const s of r.scenariusze) {
            const nums = [s.sumaMama, s.sumaTata, s.sumaRodziny, s.tygodniePrzepadajace, s.rowzinski.wykorzystano];
            if (nums.some((v) => !Number.isFinite(v) || v < 0)) bledy.push(`porównanie #${i} ${s.id}: ujemna/Nan kwota lub liczba`);
            if (s.status === "dostepny" && s.powody.length) bledy.push(`porównanie #${i} ${s.id}: dostępny z powodami`);
            if (s.rowzinski.wykorzystano > s.rowzinski.pula) bledy.push(`porównanie #${i} ${s.id}: użycie > pula`);
            if (Math.abs(s.rowzinski.przepada - (s.rowzinski.pula - s.rowzinski.wykorzystano)) > 0.001) bledy.push(`porównanie #${i} ${s.id}: przepada != pula-wykorzystano`);
            if (![0, DEFAULT_PARAMS.wylaczneRodzicielskie].includes(s.rowzinski.udzialTaty)) bledy.push(`porównanie #${i} ${s.id}: udział taty=${s.rowzinski.udzialTaty}`);
          }
        } catch (e) {
          bledy.push(`porównanie #${i}: wyjątek ${e.message}`);
        }
      }
      expect(bledy.slice(0, 15)).toEqual([]);
    });
  });

  it("niezmienniki biznesowe kalkulatorów", () => {
    const bledy = [];
    for (let i = 0; i < 3000; i++) {
      const p = podstawaWymiaru({ status: pick(["pracownik", "niepracownik"]), miesiace: Array.from({ length: 12 }, smiec), wymiarEtatu: pick([1, 0.5, undefined]) });
      if (p.ok && p.limit?.typ === "max" && Math.abs(p.podstawa - DEFAULT_PARAMS.maxPodstawaZasilku) > 0.001) bledy.push(`podstawa #${i}: max`);
      if (p.ok && p.limit?.typ !== "min" && p.limit?.typ !== "max" && Math.abs(p.podstawa - p.przecietne * (1 - DEFAULT_PARAMS.potracenie / 100)) > 0.01) bledy.push(`podstawa #${i}: wzór`);

      const l = laczenieZPraca({ dzieci: smiec(), zaZyciem: R() < 0.3, etat: smiec(), podstawa: 5000, stawka: 70 });
      if (l.wydluzony > l.limit + 1e-9) bledy.push(`łączenie #${i}: ${l.wydluzony} > limit ${l.limit}`);
      if (l.wydluzony < l.wymiar - 1e-9) bledy.push(`łączenie #${i}: urlop krótszy niż wymiar`);

      const m = zasilekMacierzynski({ dzieci: smiec(), porod: "2026-09-01", podstawaMatki: 5000, podstawaOjca: 5000, przedPorodem: smiec(), tygodnieDlaOjca: smiec(), sytuacja: pick(["brak", "martwe"]), dniHospitalizacji: smiec(), tydzienCiazy: smiec(), masa: smiec() });
      const suma = m.wiersze.filter((w) => w.kto === "matka" && w.kwota != null).reduce((s, w) => s + w.kwota, 0);
      if (Math.abs(suma - m.sumaMatka) > 0.001) bledy.push(`macierzyński #${i}: suma matki`);
      if (m.tygUzup > m.limitUzup) bledy.push(`macierzyński #${i}: uzupełniający ponad limit`);
      if (m.wiersze.some((w) => w.dni < 0)) bledy.push(`macierzyński #${i}: ujemne dni (${JSON.stringify(m.wiersze.map((w) => w.dni))}, dlaOjca ${m.dlaOjca}, max ${m.maxDlaOjca})`);

      const o = obojeRodzice({ tygodnieMatka: smiec(), tygodnieOjciec: smiec(), wniosek815: R() < 0.5, podstawaMatki: 5000, podstawaOjca: 5000 });
      if (o.tygodnieOjca70 > DEFAULT_PARAMS.wylaczneRodzicielskie) bledy.push(`oboje #${i}: ojciec 70% ponad 9 tyg.`);
    }
    expect(bledy.slice(0, 15)).toEqual([]);
  });
});
