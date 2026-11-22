/* =====================================================================
   Kontekst sprawy: profil „Moje dane” (backend/db.js → emptyProfile,
   formularz frontend/src/pages/ProfilePage.jsx) przetłumaczony na fakty,
   których potrzebują reguły wariantów.

   Każdy fakt ma trzy możliwe wartości:
     true / liczba / tekst  – wiemy,
     false                  – wiemy, że nie,
     null                   – brak danych w profilu (wariant dostaje status „brakuje danych”).
   ===================================================================== */
import { DEFAULT_PARAMS } from "../params.js";
import { toDate, ageYears } from "../helpers.js";
import { pobierzDaneDziecka } from "./dzieckoHelper.js";

// Tytuł ubezpieczenia → grupa (ta sama mapa co w ProfilePage.jsx).
export const GRUPA_TYTULU = {
  pracownik: "pracownik",
  powolanie: "pracownik",
  zlecenie: "dobrowolne",
  dg: "dobrowolne",
  wspolpraca: "dobrowolne",
  duchowny: "dobrowolne",
  marynarz: "dobrowolne",
  uaktywniajaca: "uaktywniajaca", // obowiązkowe chorobowe, ale nie pracownik
  dzielo: "brak",
  student_zlecenie: "brak",
  nierejestrowa: "brak",
  ulga_na_start: "brak",
  brak: "brak",
};

// Zadłużenie blokuje zasiłki tylko tym, którzy sami opłacają składki (art. 2a UZ).
// B-14: art. 2a ust. 1 u.z. wymienia też marynarzy (art. 6 ust. 1 pkt 24 u.s.u.s.).
const SAMI_PLACA_SKLADKI = ["dg", "wspolpraca", "duchowny", "marynarz"];

const DAY = 86400000;
const yn = (v) => (v === "tak" ? true : v === "nie" ? false : null);
const liczba = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
// B-24: kwota w profilu musi być sensowna — ujemna lub 0 traktujemy jak brak danych.
const kwotaProfilu = (v) => {
  const n = liczba(v);
  return n === null || n <= 0 ? null : n;
};
// B-23: liczba dzieci z jednego porodu — tylko sensowny zakres 1..5.
const dzieciPorodu = (v) => {
  const n = liczba(v);
  if (n === null || n <= 0) return null;
  return Math.min(Math.ceil(n), 5);
};
const dni = (od, doDnia) => Math.round((doDnia - od) / DAY);
const miesiace = (od, doDnia) =>
  (doDnia.getFullYear() - od.getFullYear()) * 12 + (doDnia.getMonth() - od.getMonth()) - (doDnia.getDate() < od.getDate() ? 1 : 0);

const grupaOf = (tytul) => (tytul ? GRUPA_TYTULU[tytul] ?? null : null);

/**
 * @param {object} profil  profil z GET /api/profile (sekcje: ubezpieczony, sytuacja, platnik, drugiRodzic, dziecko, zdrowie, urlopy)
 * @param {{ dzis?: string|Date, params?: object }} [opcje]
 */
export function kontekstSprawy(profil = {}, { dzis, params = DEFAULT_PARAMS } = {}) {
  const u = profil.ubezpieczony ?? {};
  const s = profil.sytuacja ?? {};
  const pl = profil.platnik ?? {};
  const o = profil.drugiRodzic ?? {};
  // Top-level ma priorytet, tablica dzieci uzupełnia brakujące pola (starsze profile).
  const daneDziecka = pobierzDaneDziecka(profil);
  const liczbaDzieciProfilu = daneDziecka.liczbaDzieci;
  const z = profil.zdrowie ?? {};
  const ur = profil.urlopy ?? {};
  const today = toDate(dzis) ?? new Date();

  const tytul = u.statusUbezpieczenia || null;
  const grupa = grupaOf(tytul);
  const maChorobowe = grupa === null ? null : grupa !== "brak";
  const ulga = ["absolwent", "10_lat", "posel"].includes(u.ulgaWyczekiwania);
  const okresWyczekiwania = ulga ? 0 : grupa === "dobrowolne" ? params.oczekiwanieDobrowolne : params.oczekiwanieObowiazkowe;
  const ubezpieczenieOd = toDate(u.ubezpieczenieOd);
  const dniUbezpieczenia = ubezpieczenieOd ? dni(ubezpieczenieOd, today) : null;

  const etap = s.etap || null;
  const dataUrodzenia = toDate(daneDziecka.dataUrodzenia);
  const pdp = toDate(daneDziecka.przewidywanaDataPorodu);
  const dataPrzyjecia = toDate(daneDziecka.dataPrzyjecia);
  // Dzień powstania prawa do zasiłku macierzyńskiego: poród albo przyjęcie dziecka.
  const dzienZdarzenia = etap === "przyjecie" ? dataPrzyjecia : dataUrodzenia ?? pdp;

  const ustalo = yn(u.ubezpieczenieUstalo);
  const dataUstania = toDate(u.dataUstania);
  let ubezpieczonyWDniuZdarzenia;
  if (maChorobowe === false) ubezpieczonyWDniuZdarzenia = false;
  else if (maChorobowe === null || ustalo === null) ubezpieczonyWDniuZdarzenia = null;
  else if (ustalo === false) ubezpieczonyWDniuZdarzenia = true;
  else ubezpieczonyWDniuZdarzenia = dataUstania && dzienZdarzenia ? dataUstania >= dzienZdarzenia : null;

  const rola = s.rola || null;
  const drugi = o.brak !== true;
  const grupaDrugiego = grupaOf(o.statusUbezpieczenia || null);
  // Przy wnioskach ojca / innego członka rodziny drugim rodzicem jest matka.
  const matkaMaChorobowe = rola === "matka" ? maChorobowe : drugi ? (grupaDrugiego === null ? null : grupaDrugiego !== "brak") : null;

  return {
    dzis: today,
    P: params,
    profil,
    // kto i na jakim etapie
    rola,
    etap,
    typPrzyjecia: s.typPrzyjecia || null,
    plec: u.plec || null,
    // ubezpieczenie
    tytul,
    grupa,
    maChorobowe,
    pracownik: grupa === null ? null : grupa === "pracownik",
    obowiazkowe: grupa === null ? null : grupa === "pracownik" || grupa === "uaktywniajaca",
    okresWyczekiwania,
    dniUbezpieczenia,
    wyczekiwanieSpelnione: ulga ? true : dniUbezpieczenia === null || grupa === null ? null : dniUbezpieczenia >= okresWyczekiwania,
    blokadaZadluzenia: SAMI_PLACA_SKLADKI.includes(tytul) ? yn(u.zaleglosci) : tytul ? false : null,
    ustalo,
    dataUstania,
    przyczynaUstania: u.przyczynaUstania || null,
    zapewnionoInnaPrace: yn(u.zapewnionoInnaPrace),
    ubezpieczonyWDniuZdarzenia,
    zmianaWymiaru12m: yn(u.zmianaWymiaru12m),
    wiecejNizJedenTytul: yn(u.wiecejNizJedenTytul),
    podstawa: kwotaProfilu(u.podstawaWymiaru),
    liczbaUbezpieczonych: pl.liczbaUbezpieczonych || null, // "do_20" | "powyzej_20" | "nie_wiem"
    // dziecko
    dataUrodzenia,
    pdp,
    dataPrzyjecia,
    dzienZdarzenia,
    liczbaDzieci: dzieciPorodu(liczbaDzieciProfilu),
    liczbaZyjacych: dzieciPorodu(daneDziecka.liczbaZyjacych),
    wiekDzieckaMies: dataUrodzenia ? miesiace(dataUrodzenia, today) : null,
    dniOdPorodu: etap === "po_porodzie" && dataUrodzenia ? dni(dataUrodzenia, today) : null,
    wiekPrzyPrzyjeciuLat: dataUrodzenia && dataPrzyjecia ? ageYears(dataUrodzenia, dataPrzyjecia) : null,
    martwe: yn(daneDziecka.martwe),
    zmarlo: yn(daneDziecka.zmarlo),
    zaGranica: yn(daneDziecka.zaGranica),
    pobytWSzpitalu: yn(daneDziecka.pobytWSzpitalu),
    tydzienCiazy: daneDziecka.tydzienCiazy || null, // "ponizej_28" | "28_37" | "po_37"
    masa: liczba(daneDziecka.masaUrodzenia),
    szpitalOd: toDate(daneDziecka.szpitalOd),
    szpitalDo: toDate(daneDziecka.szpitalDo),
    odroczonySzkolny: yn(daneDziecka.odroczonySzkolny),
    niepelnosprawne: yn(daneDziecka.niepelnosprawne),
    zaZyciem: daneDziecka.zaZyciem === true,
    // drugi rodzic
    drugi,
    grupaDrugiego,
    matkaMaChorobowe,
    okolicznosc: o.okolicznosc || null, // brak | zgon | porzucenie | szpital | niesamodzielna | podjela_prace
    dataOkolicznosci: toDate(o.dataOkolicznosci),
    // zdrowie (ciąża)
    zwolnienie: z.zwolnienie || null, // brak | B | bez_B
    wczesniejszeZwolnienia: yn(z.wczesniejszeZwolnienia),
    okresZasilkowyWyczerpany: yn(z.okresZasilkowyWyczerpany),
    rokowaniaPoprawy: yn(z.rokowaniaPoprawy),
    wypadekWDrodze: yn(z.wypadekWDrodze),
    zlaOd: toDate(z.zlaOd),
    // urlopy i plany
    zamiarPelnyWymiar: yn(ur.zamiarPelnyWymiar),
    macierzynskiWykorzystanoTyg: liczba(ur.macierzynskiWykorzystanoTyg),
    matkaRezygnuje: yn(ur.matkaRezygnuje),
    planUzupelniajacy: yn(ur.planUzupelniajacy),
    terminKoncaMacierzynskiego: toDate(ur.terminKoncaMacierzynskiego),
    drugiRodzicUzupelniajacy: yn(ur.drugiRodzicUzupelniajacy),
    planOjcowski: yn(ur.planOjcowski),
    ojcowskiZInnegoTytulu: yn(ur.ojcowskiZInnegoTytulu),
    planRodzicielski: yn(ur.planRodzicielski),
    rodzicielskieCzesci: liczba(ur.rodzicielskieCzesci),
    rodzicielskiWykorzystanoTyg: liczba(ur.rodzicielskiWykorzystanoTyg),
    drugiRodzicRodzicielski: ur.drugiRodzicRodzicielski || null, // tak | nie | nie_wiem
    laczenieZPraca: yn(ur.laczenieZPraca),
    wymiarPracyPrzyLaczeniu: ur.wymiarPracyPrzyLaczeniu || null, // do_polowy | powyzej
    planWychowawczy: yn(ur.planWychowawczy),
    wychowawczyWykorzystanoMies: liczba(ur.wychowawczyWykorzystanoMies),
    potrzebaOpieki: ur.potrzebaOpieki || null,
    domownikMozeOpiekowac: yn(ur.domownikMozeOpiekowac),
    opiekunczyDniWRoku: liczba(ur.opiekunczyDniWRoku),
  };
}
