// e) Adopcja i rodzina zastępcza (UZ art. 29; KP art. 183).
import { DEFAULT_PARAMS } from "./params.js";
import { zasilek, tygodnieMac, tygodnieRodz, toDate, ageYears } from "./helpers.js";
import { kwota, liczbaDni } from "./walidacja.js";

/**
 * @param {object} input
 * @param {"przysposobienie"|"rodzinaZastepcza"} input.tryb  rodzina zastępcza = niezawodowa
 * @param {number} input.dzieci  przyjętych jednocześnie
 * @param {string} [input.dataUrodzenia]  najstarszego dziecka, ISO
 * @param {string} [input.dataPrzyjecia]  ISO
 * @param {boolean} [input.odroczenie=false]  odroczony obowiązek szkolny (limit 7 → 10 lat)
 * @param {boolean} [input.zaZyciem=false]
 * @param {number} input.podstawa  zł/mies.
 * @param {boolean} [input.wniosek815=false]
 * @param {boolean} [input.ojcowski=false]
 */
export function adopcja(input, P = DEFAULT_PARAMS) {
  const {
    tryb = "przysposobienie",
    dataUrodzenia,
    dataPrzyjecia,
    odroczenie = false,
    zaZyciem = false,
    wniosek815 = false,
    ojcowski = false,
  } = input;
  const dzieci = liczbaDni(input.dzieci) || 1;
  const podstawa = kwota(input.podstawa);
  const ur = toDate(dataUrodzenia);
  const przyj = toDate(dataPrzyjecia);

  const limitLat =
    tryb === "przysposobienie"
      ? P.limitWiekuPrzysposobienie
      : odroczenie
        ? P.limitWiekuOdroczenie
        : P.limitWiekuRodzinaZastepcza;
  // B-07: porównujemy DATY, nie wiek ułamkowy. „Do ukończenia N lat” — dziecko uznajemy
  // za mieszczące się w limicie także w dniu ukończenia N lat (granica włącznie).
  let poLimicie = false;
  if (ur && przyj) {
    const granica = new Date(ur);
    granica.setFullYear(granica.getFullYear() + limitLat);
    granica.setDate(granica.getDate() + 1); // dzień ukończenia N lat jeszcze się mieści
    poLimicie = przyj >= granica;
  }
  const wiek = przyj && ur ? ageYears(ur, przyj) : null;
  const brakPrawa = przyj && ur ? poLimicie : false;

  const tygMacierzynski = tygodnieMac(dzieci, P);
  // B-06: 38 tyg. (bez „Za życiem”) i 62 tyg. (z „Za życiem”) przysługują TYLKO rodzinie
  // zastępczej, która przyjęła dziecko do 14 lat (art. 183 § 3, § 4 pkt 3, § 4³ pkt 3 k.p.).
  // Przysposobienie ma zwykłe 41/43 (65/67 z „Za życiem”) — art. 183 § 4¹ i § 4⁴ k.p.
  const przyjeteDo14 = tryb === "rodzinaZastepcza";
  const pula = tygodnieRodz(dzieci, zaZyciem, przyjeteDo14, P);
  // Jeden rodzic nie może wykorzystać 9 tygodni zarezerwowanych dla drugiego rodzica.
  const tygRodzicielskiWlasne = Math.max(0, pula - P.wylaczneRodzicielskie);

  const stMac = wniosek815 ? P.stSredniowany : P.stMacierzynski;
  const stRodz = wniosek815 ? P.stSredniowany : P.stRodzicielski;
  const kwotaMacierzynski = zasilek(podstawa, stMac, tygMacierzynski * 7, P);
  const kwotaRodzicielski = zasilek(podstawa, stRodz, tygRodzicielskiWlasne * 7, P);
  const kwotaOjcowski = zasilek(podstawa, P.stMacierzynski, P.tygodnieOjcowski * 7, P);

  return {
    limitLat,
    wiek,
    brakPrawa,
    tygMacierzynski,
    pula,
    tygRodzicielskiWlasne,
    stMac,
    stRodz,
    kwotaMacierzynski,
    kwotaRodzicielski,
    kwotaOjcowski,
    razem: kwotaMacierzynski + kwotaRodzicielski + (ojcowski ? kwotaOjcowski : 0),
    rodzicielskiDoRoku: ur ? ur.getFullYear() + P.limitRokZycia : null,
  };
}
