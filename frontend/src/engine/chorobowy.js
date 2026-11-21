// a) Zasiłek chorobowy w ciąży (UZ art. 4, 8–12, 2a; KP art. 92).
import { DEFAULT_PARAMS } from "./params.js";
import { zasilek, toDate } from "./helpers.js";
import { kwota, liczbaDni } from "./walidacja.js";
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
  // B-21: sanityzacja wejścia — NaN/Infinity/ujemne nie mogą wejść do wyliczeń.
  const {
    status = "obw",
    dataUrodzenia,
    poczatek,
    kodB = true,
  } = input;
  const dniUbezpieczenia = liczbaDni(input.dniUbezpieczenia);
  const liczbaUbPlatnika = liczbaDni(input.liczbaUbPlatnika);
  const dniNiezdolnosci = liczbaDni(input.dniNiezdolnosci);
  const wykorzystaneWynagrodzenie = liczbaDni(input.wykorzystaneWynagrodzenie);
  const wykorzystanyOkres = liczbaDni(input.wykorzystanyOkres);
  const podstawa = kwota(input.podstawa);
  const zaleglosc = kwota(input.zaleglosc);
  // B-15: czy przed obecnym zwolnieniem były zwolnienia bez kodu B (reset okresu zasiłkowego).
  const wczesniejszeBezB = input.wczesniejszeBezB === true;
  const od = toDate(poczatek);
  const ur = toDate(dataUrodzenia);
  // Art. 92 § 5 k.p.: limit 14 dni dotyczy niezdolności przypadającej PO roku kalendarzowym,
  // w którym pracownik ukończył 50 lat. Czyli dopiero od 1 stycznia roku (rok urodzenia + 51).
  // Przykład: ur. 1976 (kończy 50 lat w 2026) → limit 14 dni dopiero od 2027-01-01.
  // B-01: prawidłowy warunek — rok niezdolności musi być PÓŹNIEJSZY niż rok ukończenia 50 lat.
  const poRoku50 = ur && od ? od.getFullYear() >= ur.getFullYear() + 51 : false;

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
  // B-15 (art. 9 ust. 2 zdanie 2 u.z.): jeżeli po przerwie niezdolność wystąpiła w trakcie
  // ciąży (kod B), okresów sprzed przerwy NIE wlicza się do okresu zasiłkowego — okres
  // liczy się od nowa. Wcześniej `wykorzystanyOkres` był zawsze odejmowany.
  const wykorzystanySkutecznie = kodB && wczesniejszeBezB ? 0 : wykorzystanyOkres;
  const pozostaloPrzed = Math.max(0, okresMax - wykorzystanySkutecznie);
  const dniPlatne = Math.min(dniNiezdolnosci, pozostaloPrzed);
  const pozostaloPo = Math.max(0, pozostaloPrzed - dniNiezdolnosci);
  const przekroczonyOkres = dniNiezdolnosci > pozostaloPrzed;

  /* 2. wynagrodzenie chorobowe (pracodawca) vs zasiłek */
  const limitWynagrodzenia = poRoku50 ? P.wynagrodzenieChorobowe50 : P.wynagrodzenieChorobowe;
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

  // B-12: kto wypłaca — status dobrowolny oznacza, że chodzi o osobę, która sama opłaca składki
  // (działalność / zlecenie). Przyjmujemy „dg”, bo dla działalności i współpracy ZUS wypłaca zawsze; dla
  // zlecenia próg 20 obowiązuje, ale to samo wynika z liczby ubezpieczonych.
  const statusPlatnika = status === "dobr" ? "dg" : "pracownik";

  return {
    maPrawo,
    wymaganyOkres,
    brakujeDni,
    zalegloscBlokada,
    wyplata,
    wiek50: poRoku50,
    platnik: ktoWyplaca({ status: statusPlatnika, liczbaUbezpieczonych: liczbaUbPlatnika }, P),
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
    wykorzystanyOkres: wykorzystanySkutecznie,
    resetOkresuZasilkowego: kodB && wczesniejszeBezB && wykorzystanyOkres > 0,
    pozostaloPrzed,
    pozostaloPo,
    przekroczonyOkres,
  };
}
