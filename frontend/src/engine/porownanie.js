import { DEFAULT_PARAMS } from "./params.js";
import { addDays, zasilek, tygodnieMac, tygodnieRodz, toDate } from "./helpers.js";
import { kwota, liczbaDzieciPorod } from "./walidacja.js";
import { obojeRodzice } from "./oboje.js";

const isDateWithin = (porod, dzis, deadline) => {
  if (!porod || !dzis) return null;
  const end = addDays(porod, deadline);
  return dzis <= end;
};

const isoDate = (d) => d instanceof Date && !Number.isNaN(d.getTime())
  ? d.toISOString().slice(0, 10)
  : "";

const statusCoverage = (value) => {
  if (value === true || value === "tak") return true;
  if (value === false || value === "nie") return false;
  return null;
};

const debtOverLimit = (value, P) => {
  if (value === true) return true;
  if (value === false || value === null || value === undefined || value === "") return false;
  return kwota(value) > P.progZaleglosci;
};

function monthly(base, rate, P) {
  const raw = zasilek(base, rate, P.dniMiesiaca, P);
  return rate === P.stMacierzynski && raw < P.swiadczenieRodzicielskie
    ? P.swiadczenieRodzicielskie
    : raw;
}

export function porownaj(dane = {}, params = DEFAULT_PARAMS, dzis) {
  const P = params?.tygodnieMacierzynski ? params : DEFAULT_PARAMS;
  const children = liczbaDzieciPorod(dane.dzieci);
  const macWeeks = tygodnieMac(children, P);
  const pool = tygodnieRodz(children >= 2 ? 2 : 1, false, false, P);
  const motherParentWeeks = pool - P.wylaczneRodzicielskie;
  const fatherWeeks = P.wylaczneRodzicielskie;
  const motherBase = kwota(dane.podstawaMatki);
  const fatherBase = kwota(dane.podstawaOjca);
  const motherCoverage = statusCoverage(dane.mamaUbezpieczona);
  const fatherCoverage = statusCoverage(dane.tataUbezpieczony);
  const motherDebt = debtOverLimit(dane.zalegloscMatki, P);
  const fatherDebt = debtOverLimit(dane.zalegloscTaty, P);
  const voluntaryMother = dane.dobrowolnaMama === true;
  const today = toDate(dzis);
  const actualBirth = toDate(dane.porod);
  const expectedBirth = toDate(dane.przewidywanaDataPorodu);
  const birth = actualBirth || expectedBirth;
  const deadlineSource = birth ? addDays(birth, P.deadlineSredniowany) : null;
  const averageDecision = dane.wniosek815 === true
    ? true
    : dane.wniosek815 === false
      ? false
      : today && deadlineSource
        ? today <= deadlineSource
        : null;
  const parallel = dane.rownolegle === true;

  const warnings = [];
  const assumptions = [
    "Tata bierze swoje 9 tygodnie rodzicielskich po mamie; przełącznik „równolegle” zmienia tylko daty końca.",
    "Kwoty są orientacyjne i liczone z podstawy miesięcznej po potrąceniu składek 13,71%; engine nie nalicza PIT.",
  ];
  if (voluntaryMother) warnings.push({
    kod: "dobrowolne-wyrejestrowanie",
    tekst: "Osoba dobrowolnie ubezpieczona jest automatycznie wyrejestrowana z chorobowego po rozpoczęciu zasiłku macierzyńskiego i musi ponownie zgłosić się do ubezpieczenia.",
  });

  const availability = (withFather) => {
    const reasons = [];
    const missing = [];

    if (!motherCoverage) {
      if (motherCoverage === false) reasons.push("Mama nie miała ubezpieczenia chorobowego w dniu porodu.");
      else missing.push({ pole: "mamaUbezpieczona", etykieta: "Mama – ubezpieczenie chorobowe w dniu porodu", krok: "ubezpieczenie" });
    }
    if (!(motherBase > 0)) missing.push({ pole: "podstawaMatki", etykieta: "Podstawa wymiaru zasiłku – mama", krok: "dane-z-zus" });

    if (withFather) {
      if (!fatherCoverage) {
        if (fatherCoverage === false) reasons.push("ZUS bada ubezpieczenie chorobowe taty. Tata bez ubezpieczenia nie przejmie 9 tygodni rodzicielskich.");
        else missing.push({ pole: "tataUbezpieczony", etykieta: "Tata – ubezpieczenie chorobowe", krok: "dane-z-zus" });
      }
      if (!(fatherBase > 0)) missing.push({ pole: "podstawaOjca", etykieta: "Podstawa wymiaru zasiłku – tata", krok: "dane-z-zus" });
      if (fatherDebt) reasons.push("Zaległość składkowa taty przekracza próg blokujący świadczenie.");
    }
    if (motherDebt) reasons.push(`Zaległość składkowa mamy przekracza próg ${P.progZaleglosci} zł; prawo do zasiłków powstaje dopiero po spłacie.`);
    if (!birth) missing.push({ pole: "porod", etykieta: "Data porodu lub przewidywana data porodu", krok: "dziecko" });

    if (reasons.length) return { status: "niedostepny", powody: reasons, brakujaceDane: missing };
    if (missing.length) return { status: "brak_danych", powody: [], brakujaceDane: missing };
    return { status: "dostepny", powody: [], brakujaceDane: [] };
  };

  const amountMotherVariable = () => {
    const macMonthly = monthly(motherBase, P.stMacierzynski, P);
    const mac = macMonthly * macWeeks * 7 / P.dniMiesiaca;
    const parental = zasilek(motherBase, P.stRodzicielski, motherParentWeeks * 7, P);
    return { mac, macActual: mac, parental, total: mac + parental };
  };

  const averageMonthly = Math.max(
    zasilek(motherBase, P.stSredniowany, P.dniMiesiaca, P),
    P.swiadczenieRodzicielskie,
  );
  const amountMotherAverage =
    averageMonthly * (macWeeks + motherParentWeeks) * 7 / P.dniMiesiaca;
  const variable = amountMotherVariable();
  const totalAverage = amountMotherAverage;

  const makeScenario = ({ id, name, withFather, average }) => {
    let availabilityResult = availability(withFather);
    if (average && actualBirth && today && deadlineSource && today > deadlineSource) {
      availabilityResult = {
        status: "niedostepny",
        powody: [`Wariant 81,5% nie jest dostępny po terminie ${deadlineSource.toLocaleDateString("pl-PL")}; dzień 22 po porodzie jest już po 21-dniowym terminie.`],
        brakujaceDane: [],
      };
    }

    const check = obojeRodzice({
      dzieci: children,
      dataUrodzenia: isoDate(birth),
      wniosek815: average,
      tygodnieMatka: average ? 0 : motherParentWeeks,
      tygodnieOjciec: withFather ? fatherWeeks : 0,
      czesciMatka: 1,
      czesciOjciec: withFather ? 1 : 0,
      podstawaMatki: motherBase,
      podstawaOjca: fatherBase,
    }, P);

    let sumMother;
    let sumFather = 0;
    let sumFamily;
    const stages = [];
    if (average) {
      sumMother = totalAverage;
      stages.push({
        etap: "Mama: macierzyński + rodzicielski",
        tygodnie: macWeeks + motherParentWeeks,
        stawka: P.stSredniowany,
        kwotaMiesieczna: monthly(motherBase, P.stSredniowany, P),
      });
    } else {
      sumMother = variable.macActual + variable.parental;
      stages.push({
        etap: "Mama: macierzyński",
        tygodnie: macWeeks,
        stawka: P.stMacierzynski,
        kwotaMiesieczna: monthly(motherBase, P.stMacierzynski, P),
      });
      stages.push({
        etap: "Mama: rodzicielski",
        tygodnie: motherParentWeeks,
        stawka: P.stRodzicielski,
        kwotaMiesieczna: monthly(motherBase, P.stRodzicielski, P),
      });
    }
    if (withFather) {
      sumFather = zasilek(fatherBase, P.stRodzicielski, fatherWeeks * 7, P);
      stages.push({
        etap: "Tata: rodzicielski – część wyłączna",
        tygodnie: fatherWeeks,
        stawka: P.stRodzicielski,
        kwotaMiesieczna: monthly(fatherBase, P.stRodzicielski, P),
      });
    }
    sumFamily = sumMother + sumFather;

    const used = withFather
      ? motherParentWeeks + fatherWeeks
      : motherParentWeeks;
    const wasted = withFather
      ? Math.max(0, pool - (motherParentWeeks + fatherWeeks))
      : P.wylaczneRodzicielskie;

    const firstDay = birth;
    const motherEndOffset = (macWeeks + motherParentWeeks) * 7 - 1;
    const fatherEndOffset = withFather
      ? (parallel ? Math.max(macWeeks + motherParentWeeks, fatherWeeks) : macWeeks + motherParentWeeks + fatherWeeks) * 7 - 1
      : motherEndOffset;
    const lastDay = birth ? addDays(birth, fatherEndOffset) : null;

    return {
      id,
      nazwa: name,
      ...availabilityResult,
      rowzinski: {
        pula: pool,
        wykorzystano: used,
        przepada: wasted,
        poprawny: check.poprawny,
        udzialTaty: withFather ? fatherWeeks : 0,
      },
      tygodnie: stages,
      kwotaMiesieczna: stages.map((x) => ({ etap: x.etap, kwota: x.kwotaMiesieczna })),
      sumaMama: sumMother,
      sumaTata: sumFather,
      sumaRodziny: sumFamily,
      pierwszyDzien: birth ? isoDate(firstDay) : null,
      ostatniDzien: birth ? isoDate(lastDay) : null,
      terminDecyzji: deadlineSource ? isoDate(deadlineSource) : null,
      terminOrientacyjny: !actualBirth && !!expectedBirth,
      tygodniePrzepadajace: wasted,
      podstawa: "Poradnik ZUS dla rodziców i opiekunów dzieci 2026, s. 29-34",
    };
  };

  const scenarios = [
    makeScenario({ id: "W1", name: "Wariant zmienny, mama sama", withFather: false, average: false }),
    makeScenario({ id: "W2", name: "Wariant uśredniony 81,5%, mama sama", withFather: false, average: true }),
    makeScenario({ id: "W3", name: "Wariant zmienny + tata bierze swoje 9 tyg.", withFather: true, average: false }),
    makeScenario({ id: "W4", name: "81,5% + tata 9 tyg.", withFather: true, average: true }),
  ];

  const w1 = scenarios.find((x) => x.id === "W1");
  for (const scenario of scenarios) {
    scenario.roznicaDoW1 = Number.isFinite(w1?.sumaRodziny) && Number.isFinite(scenario.sumaRodziny)
      ? scenario.sumaRodziny - w1.sumaRodziny
      : null;
  }

  const paternalLeave = birth ? (() => {
    const termin = new Date(birth);
    termin.setMonth(termin.getMonth() + P.deadlineOjcowskiMies);
    return {
    dni: P.tygodnieOjcowski * 7,
    stawka: P.stMacierzynski,
    termin: isoDate(termin),
    niezalezny: true,
    podstawa: "Poradnik ZUS dla rodziców i opiekunów dzieci 2026, s. 32-34",
    };
  })() : null;

  const excluded = [
    "adopcja i rodzina zastępcza",
    "uzupełniający urlop macierzyński",
    "„Za życiem”",
    "łączenie urlopu rodzicielskiego z pracą (½ etatu)",
    "przekazanie części macierzyńskiego tacie",
    "utracone wynagrodzenie",
    "zasiłek chorobowy w ciąży",
  ];

  return {
    scenariusze: scenarios,
    zalozenia: assumptions,
    ostrzezenia: warnings,
    urlopOjcowski: paternalLeave,
    czegoNieUwzglednia: excluded,
  };
}
