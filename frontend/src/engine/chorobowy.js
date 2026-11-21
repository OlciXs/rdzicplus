// a) Zasiłek chorobowy w ciąży (UZ art. 4, 8–12, 2a; KP art. 92).
import { DEFAULT_PARAMS } from "./params.js";
import { zasilek, toDate } from "./helpers.js";
import { ktoWyplaca } from "./platnik.js";

/**
 * @param {object} input
 * @param {"obw"|"dobr"} input.status  ubezpieczenie chorobowe obowiązkowe (etat) / dobrowolne
 * @param {number} input.dniUbezpieczenia  dni nieprzerwanego ubezpieczenia chorobowego
 * @param {number} [input.liczbaUbPlatnika]  liczba ubezpieczonych u płatnika
 * @param {string} [input.dataUrodzenia]  ISO
 * @param {string} [input.poczatek]  początek niezdolności, ISO
 * @param {number} input.dniNiezdolnosci
 * @param {number} [input.wykorzystaneWynagrodzenie=0]  dni wynagrodzenia chorobowego w tym roku
 * @param {number} [input.wykorzystanyOkres=0]  dni już wliczone do okresu zasiłkowego
 * @param {boolean} [input.kodB=true]  ciąża – kod „B” na e-ZLA
 * @param {number} input.podstawa  miesięczna podstawa wymiaru (po 13,71%)
 * @param {number} [input.zaleglosc=0]  zaległość składkowa w zł
 */
export function chorobowyWCiazy(input, P = DEFAULT_PARAMS) {
  const {
    status = "obw",
    dniUbezpieczenia = 0,
    liczbaUbPlatnika = 0,
    dataUrodzenia,
    poczatek,
    dniNiezdolnosci = 0,
    wykorzystaneWynagrodzenie = 0,
    wykorzystanyOkres = 0,
    kodB = true,
    podstawa = 0,
    zaleglosc = 0,
  } = input;
  const od = toDate(poczatek);
  const ur = toDate(dataUrodzenia);
  // Limit 14 dni obowiązuje od roku kalendarzowego po roku, w którym pracownik kończy 50 lat.
  const wiek50 = ur && od ? od.getFullYear() > ur.getFullYear() + 50 : false;

  /* 1. prawo do zasiłku */
  const wymaganyOkres = status === "obw" ? P.oczekiwanieObowiazkowe : P.oczekiwanieDobrowolne;
  const maPrawo = dniUbezpieczenia >= wymaganyOkres;
  const brakujeDni = maPrawo ? 0 : Math.ceil(wymaganyOkres - dniUbezpieczenia);
  // Blokada za zaległość (art. 2a UZ) dotyczy tylko osób, które same opłacają składki
  // (działalność, osoby współpracujące, duchowni) – nie pracowników.
  const zalegloscBlokada = status === "dobr" && zaleglosc > P.progZaleglosci;
  // Bez prawa (okres oczekiwania) lub przy blokadzie nic nie jest wypłacane.
  const wyplata = maPrawo && !zalegloscBlokada;

  /* 4. okres zasiłkowy (liczony najpierw – ogranicza płatne dni) */
  const okresMax = kodB ? P.okresZasilkowyCiaza : P.okresZasilkowy;
  const pozostaloPrzed = Math.max(0, okresMax - wykorzystanyOkres);
  const dniPlatne = Math.min(dniNiezdolnosci, pozostaloPrzed);
  const pozostaloPo = Math.max(0, pozostaloPrzed - dniNiezdolnosci);
  const przekroczonyOkres = dniNiezdolnosci > pozostaloPrzed;

  /* 2. wynagrodzenie chorobowe (pracodawca) vs zasiłek */
  const limitWynagrodzenia = wiek50 ? P.wynagrodzenieChorobowe50 : P.wynagrodzenieChorobowe;
  const dostepneWynagrodzenie = Math.max(0, limitWynagrodzenia - wykorzystaneWynagrodzenie);
  const dniWynagrodzenia = status === "obw" ? Math.min(dniPlatne, dostepneWynagrodzenie) : 0;
  const dniZasilku = dniPlatne - dniWynagrodzenia;

  /* 3. wysokość */
  const stawkaZasilku = kodB ? P.stChorobowyCiaza : P.stChorobowy;
  // Wynagrodzenie chorobowe: 100% w ciąży (KP art. 92 § 1 pkt 2), standardowo 80%.
  const stawkaWynagrodzenia = kodB ? P.stChorobowyCiaza : P.stChorobowy;
  const dziennaPodstawa = podstawa / P.dniMiesiaca;
  const kwotaWynagrodzenia = wyplata ? (dziennaPodstawa * stawkaWynagrodzenia * dniWynagrodzenia) / 100 : 0;
  const kwotaZasilku = wyplata ? zasilek(podstawa, stawkaZasilku, dniZasilku, P) : 0;

  return {
    maPrawo,
    wymaganyOkres,
    brakujeDni,
    zalegloscBlokada,
    wyplata,
    wiek50,
    platnik: ktoWyplaca({ status: "pracownik", liczbaUbezpieczonych: liczbaUbPlatnika }, P),
    limitWynagrodzenia,
    dniWynagrodzenia,
    dniZasilku,
    stawkaZasilku,
    stawkaWynagrodzenia,
    dziennaPodstawa,
    dziennyZasilek: (dziennaPodstawa * stawkaZasilku) / 100,
    dziennieWynagrodzenie: (dziennaPodstawa * stawkaWynagrodzenia) / 100,
    kwotaWynagrodzenia,
    kwotaZasilku,
    kwotaRazem: kwotaWynagrodzenia + kwotaZasilku,
    okresMax,
    pozostaloPrzed,
    pozostaloPo,
    przekroczonyOkres,
  };
}
