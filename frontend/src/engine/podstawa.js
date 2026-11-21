// f) Podstawa wymiaru zasiłku (UZ art. 36–48a).
import { DEFAULT_PARAMS } from "./params.js";

/**
 * @param {object} input
 * @param {"pracownik"|"niepracownik"} input.status
 * @param {number[]} input.miesiace  wynagrodzenie / przychód brutto za kolejne pełne miesiące (do 12)
 * @param {number} [input.ileMies=12]  ile pełnych miesięcy ubezpieczenia (gdy < 12)
 * @param {number} [input.premieKwartalne=0]  suma premii kwartalnych z 4 poprzednich kwartałów
 * @param {number} [input.premiaRoczna=0]  premia roczna z roku poprzedniego
 */
export function podstawaWymiaru(input, P = DEFAULT_PARAMS) {
  const {
    status = "pracownik",
    miesiace = [],
    ileMies = 12,
    premieKwartalne = 0,
    premiaRoczna = 0,
  } = input;
  const limitMies = Math.min(12, Math.max(1, ileMies));

  // Miesiące z kwotą 0 są pomijane (np. przepracowane < 50% czasu – art. 38 ust. 2).
  let suma = 0;
  let licznik = 0;
  for (let i = 0; i < Math.min(12, miesiace.length); i++) {
    const v = miesiace[i];
    if (i + 1 <= limitMies && v > 0) {
      suma += v;
      licznik++;
    }
  }
  if (licznik === 0) return { ok: false, brakDanych: true };

  const srednia = suma / licznik;
  // Premie kwartalne i roczne wliczane w 1/12 (art. 42).
  const dodatek = premieKwartalne / 12 + premiaRoczna / 12;
  const przecietne = srednia + dodatek;
  const potracenie = (przecietne * P.potracenie) / 100;

  let podstawa = przecietne * (1 - P.potracenie / 100);
  let limit = null;
  if (status === "pracownik") {
    if (podstawa < P.minPodstawaPracownik) {
      limit = { typ: "min", wartosc: P.minPodstawaPracownik };
      podstawa = P.minPodstawaPracownik;
    }
  } else if (podstawa > P.maxPodstawaZasilku) {
    limit = { typ: "max", wartosc: P.maxPodstawaZasilku };
    podstawa = P.maxPodstawaZasilku;
  } else if (podstawa < P.minPodstawaDobrowolni) {
    // Tylko ostrzeżenie: podstawy nie podnosimy, bo zależy od zadeklarowanej podstawy składek.
    limit = { typ: "ostrzezenieMinDobrowolni", wartosc: P.minPodstawaDobrowolni };
  }

  return {
    ok: true,
    suma,
    licznik,
    srednia,
    dodatek,
    przecietne,
    potracenie,
    podstawa,
    dzienna: podstawa / P.dniMiesiaca,
    limit,
    miesiecznie: {
      macierzynski100: (podstawa * P.stMacierzynski) / 100,
      macierzynski815: (podstawa * P.stSredniowany) / 100,
      rodzicielski70: (podstawa * P.stRodzicielski) / 100,
      chorobowyCiaza: (podstawa * P.stChorobowyCiaza) / 100,
      chorobowy80: (podstawa * P.stChorobowy) / 100,
    },
  };
}
