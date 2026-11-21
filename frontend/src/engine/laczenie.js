// c) Łączenie urlopu rodzicielskiego z pracą (KP art. 182¹f; UZ art. 31 ust. 4a).
import { DEFAULT_PARAMS } from "./params.js";
import { zasilek, tygodnieRodz } from "./helpers.js";
import { kwota, liczbaDni, liczbaUlamek, wspolczynnik } from "./walidacja.js";

/**
 * @param {object} input
 * @param {number} input.dzieci  1 albo 2+ (przy jednym porodzie)
 * @param {boolean} [input.zaZyciem=false]
 * @param {number} input.etat  wymiar pracy w trakcie urlopu, ułamek etatu (max 0,5)
 * @param {number} input.podstawa  podstawa wymiaru zasiłku, zł/mies.
 * @param {number} input.stawka  stawka zasiłku w % (81,5 albo 70)
 */
export function laczenieZPraca(input, P = DEFAULT_PARAMS) {
  const { zaZyciem = false } = input;
  const dzieci = liczbaUlamek(input.dzieci) || 1;
  const podstawa = kwota(input.podstawa);
  const stawka = liczbaUlamek(input.stawka) || P.stRodzicielski;
  const tygLaczenia = liczbaDni(input.tygodnieLaczenia);
  const n = dzieci >= 2 ? 2 : 1;
  // B-21: etat musi być skończony; ułamek etatu, nie NaN.
  const etatRaw = wspolczynnik(input.etat, 1);
  const przekroczonyEtat = etatRaw > P.maksEtuLaczenie;
  const f = Math.min(etatRaw, P.maksEtuLaczenie);

  const wymiar = tygodnieRodz(n, zaZyciem, false, P);
  const limit = (zaZyciem ? P.limitLaczenieZaZyciem : P.limitLaczenie)[n];
  // Wzór: wymiar ÷ (1 − etat) — równoważny „wymiar + wymiar × etat/(1 − etat)”.
  // Uzasadnienie: art. 182¹f § 1 k.p. wyznacza LIMIT 82/86 (130/134 „Za życiem”) tyg. i tylko ten
  // wzór osiąga go dokładnie przy ½ etatu (41 → 82, 43 → 86). Dosłowny „wymiar × etat” dawałby
  // 61,5 tyg. i nigdy nie sięgałby ustawowego limitu. Weryfikacja u mentora ZUS.
  // `tygodnieLaczenia` pozwala objąć łączeniem tylko część urlopu (art. 182¹f § 3 k.p.).
  const tygLaczone = tygLaczenia > 0 ? Math.min(tygLaczenia, wymiar) : wymiar;
  const udzial = wymiar > 0 ? tygLaczone / wymiar : 0;
  const wydluzenie = f > 0 && f < 1 ? (tygLaczone / (1 - f)) - tygLaczone : 0;
  const wydluzonyBezLimitu = wymiar + wydluzenie * (udzial > 0 ? 1 : 0);
  const wydluzony = Math.min(limit, wydluzonyBezLimitu);
  const uderzonoWLimit = wydluzonyBezLimitu > limit + 1e-9;

  // Zasiłek pomniejszany proporcjonalnie do wymiaru pracy.
  const dziennyPelny = zasilek(podstawa, stawka, 1, P);
  const dziennyPomniejszony = dziennyPelny * (1 - f);

  return {
    etat: f,
    przekroczonyEtat,
    wymiar,
    limit,
    tygodnieLaczenia: tygLaczone,
    wydluzenie,
    wydluzony,
    uderzonoWLimit,
    dziennyPelny,
    dziennyPomniejszony,
    miesiecznie: dziennyPomniejszony * P.dniMiesiaca,
    wynagrodzenieZPracy: podstawa * f,
    sumaZasilku: dziennyPomniejszony * wydluzony * 7,
  };
}
