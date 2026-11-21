// Terminy i pułapki utraty uprawnień (sekcja h zadania: „na co uważać”).
// Czyste funkcje: przyjmują daty i parametry, zwracają listę ostrzeżeń/błędów.
// Nie liczą kwot – tylko pilnują terminów, których przekroczenie kosztuje pieniądze.
import { DEFAULT_PARAMS } from "./params.js";
import { toDate, addDays, ageYears } from "./helpers.js";

const DAY_MS = 86400000;
const dniMiedzy = (od, doDaty) => Math.round((doDaty - od) / DAY_MS);

/**
 * Wniosek o wariant 81,5% (macierzyński + rodzicielski w pełnym wymiarze)
 * musi być złożony do `deadlineSredniowany` dni PO porodzie (UZ art. 31 ust. 3e).
 *
 * @param {object} input
 * @param {string} input.dataPorodu  ISO
 * @param {string} [input.dataWniosku]  ISO data złożenia wniosku (opcjonalna)
 * @param {boolean} [input.zlozono]  czy wniosek ma być/został złożony
 * @returns {{ termin: Date|null, dniPoPorodzie: number|null, wTerminie: boolean|null, poTerminie: boolean, komunikat: string|null }}
 */
export function terminWariantu815({ dataPorodu, dataWniosku, zlozono = false }, P = DEFAULT_PARAMS) {
  const porod = toDate(dataPorodu);
  const wniosek = toDate(dataWniosku);
  if (!porod) return { termin: null, dniPoPorodzie: null, wTerminie: null, poTerminie: false, komunikat: null };

  const termin = addDays(porod, P.deadlineSredniowany);
  const dniPoPorodzie = wniosek ? dniMiedzy(porod, wniosek) : null;

  // Gdy znamy datę wniosku, sprawdzamy ją; inaczej tylko liczymy termin.
  const wTerminie = wniosek ? wniosek <= termin : null;
  const poTerminie = wTerminie === false && zlozono;

  let komunikat = null;
  if (poTerminie) {
    komunikat =
      `Wniosek złożony ${dniPoPorodzie}. dnia po porodzie, a termin to ${P.deadlineSredniowany} dni ` +
      `(do ${termin.toLocaleDateString("pl-PL")}). Wariant 81,5% przepada – zostaje 100% (macierzyński) ` +
      `i ${P.stRodzicielski}% (rodzicielski).`;
  }
  return { termin, dniPoPorodzie, wTerminie, poTerminie, komunikat };
}

/**
 * Urlop ojcowski: prawo wygasa z ukończeniem przez dziecko `deadlineOjcowskiMies`
 * miesięcy życia (KP art. 182³). Zwraca, ile czasu zostało lub że już przepadło.
 *
 * @param {object} input
 * @param {string} input.dataUrodzeniaDziecka  ISO
 * @param {string} [input.startUrlopu]  ISO planowane rozpoczęcie urlopu ojcowskiego
 */
export function terminUrlopuOjcowskiego({ dataUrodzeniaDziecka, startUrlopu }, P = DEFAULT_PARAMS) {
  const ur = toDate(dataUrodzeniaDziecka);
  const start = toDate(startUrlopu);
  if (!ur) return { termin: null, dniZostalo: null, przepadl: false, komunikat: null };

  // Koniec miesiąca `n` miesięcy po urodzeniu — B-08: liczony kalendarzowo, nie jako 365 dni.
  const termin = new Date(ur);
  termin.setMonth(termin.getMonth() + P.deadlineOjcowskiMies);
  const przepadl = start ? start > termin : false;
  const dniZostalo = start ? dniMiedzy(start, termin) : null;

  let komunikat = null;
  if (przepadl) {
    komunikat =
      `Urlop ojcowski po ${P.deadlineOjcowskiMies}. miesiącu życia dziecka przepada bezpowrotnie ` +
      `(termin minął ${termin.toLocaleDateString("pl-PL")}).`;
  } else if (start && dniZostalo != null && dniZostalo <= 30) {
    komunikat = `Do terminu urlopu ojcowskiego zostało tylko ${dniZostalo} dni (do ${termin.toLocaleDateString("pl-PL")}).`;
  }
  return { termin, dniZostalo, przepadl, komunikat };
}

/**
 * UrlOP rodzicielski: musi się zakończyć do końca roku kalendarzowego, w którym
 * dziecko kończy `limitRokZycia` lat (KP art. 182¹d § 1).
 */
export function terminRodzicielskiego({ dataUrodzeniaDziecka }, P = DEFAULT_PARAMS) {
  const ur = toDate(dataUrodzeniaDziecka);
  if (!ur) return { termin: null, komunikat: null };
  const rok = ur.getFullYear() + P.limitRokZycia;
  const termin = new Date(rok, 11, 31); // B-09: 31 grudnia (miesiąc 11, dzień 31)
  return {
    termin,
    rok,
    komunikat:
      `Urlop rodzicielski można wykorzystać najpóźniej do 31.12.${rok} ` +
      `(koniec roku, w którym dziecko kończy ${P.limitRokZycia} lat).`,
  };
}

/**
 * Adopcja / rodzina zastępcza: wniosek o urlop na warunkach macierzyńskiego
 * w 7 dni od przyjęcia dziecka, urlop nie później niż 21 dni od przyjęcia
 * (KP art. 183 § 6; RWN § 18).
 */
export function terminAdopcji({ dataPrzyjecia, dataWniosku, dataStartuUrlopu }, P = DEFAULT_PARAMS) {
  const przyj = toDate(dataPrzyjecia);
  const wniosek = toDate(dataWniosku);
  const start = toDate(dataStartuUrlopu);
  if (!przyj) return { terminWniosku: null, terminStartu: null, poTerminieWniosku: false, poTerminieStartu: false };
  const terminWniosku = addDays(przyj, P.odpisAktuDni); // 7 dni
  const terminStartu = addDays(przyj, 21);
  return {
    terminWniosku,
    terminStartu,
    poTerminieWniosku: wniosek ? wniosek > terminWniosku : false,
    // B-10: art. 183 § 6 k.p. — urlop nie może zacząć się później niż 21 dni od przyjęcia.
    poTerminieStartu: start ? start > terminStartu : false,
  };
}

/**
 * Zbiorcza lista ostrzeżeń „na co uważać” dla jednej sprawy.
 * Zwraca tablicę { poziom: "err"|"warn", tekst }.
 */
export function ostrzezeniaTerminow(input = {}, P = DEFAULT_PARAMS) {
  const out = [];
  const { dataPorodu, dataWniosku815, zlozono815, dataUrodzeniaDziecka, startOjcowskiego } = input;

  if (zlozono815 && dataPorodu) {
    const t815 = terminWariantu815({ dataPorodu, dataWniosku: dataWniosku815, zlozono: true }, P);
    if (t815.poTerminie) out.push({ poziom: "err", tekst: t815.komunikat });
  }

  if (dataUrodzeniaDziecka) {
    const ur = toDate(dataUrodzeniaDziecka);
    if (ur && ageYears(ur, new Date()) > P.deadlineOjcowskiMies / 12) {
      const t = terminUrlopuOjcowskiego({ dataUrodzeniaDziecka }, P);
      out.push({ poziom: "warn", tekst: `Dziecko ma już ponad ${P.deadlineOjcowskiMies} miesięcy – prawo do urlopu ojcowskiego wygasło.` });
      void t;
    }
    if (startOjcowskiego) {
      const t = terminUrlopuOjcowskiego({ dataUrodzeniaDziecka, startUrlopu: startOjcowskiego }, P);
      if (t.przepadl) out.push({ poziom: "err", tekst: t.komunikat });
    }
  }

  return out;
}
