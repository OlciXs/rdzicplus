/* =====================================================================
   KALENDARZ TERMINÓW – konkretne daty dla wniosków z rejestru.

   Jedno źródło dat dla „Kalendarza” i kart wariantów w „Złóż wniosek”.
   Każda data ma podstawę (artykuł) i źródło, z którego ją sprawdziliśmy:
     KP          – Kodeks pracy (wyciąg, t.j. Dz.U. 2026 poz. 1245): art. 180–183¹,
     RWN         – rozporządzenie MRPiPS z 11.03.2025 w sprawie wniosków (Dz.U. 2025 poz. 322),
     RZ          – rozporządzenie MRPiPS z 27.09.2026 w sprawie informacji i dokumentów
                   do zasiłków (Dz.U. 2026 poz. 1316),
     Poradnik    – „Poradnik dla rodziców i opiekunów dzieci”, ZUS 2026,
     Załącznik   – załącznik do zadania HackNation („maksymalny czas trwania zasiłków…”).

   terminyWnioskow(profil, { dzis, params }) → [{
     id, wariant, wniosek, data (RRRR-MM-DD), typ, tytul, opis, kto, dokument,
     podstawa, zrodlo, pewnosc ("pewne" | "szacunek" | "do_potwierdzenia"), przypomnienie
   }]
   typ: "termin"  – ostatni dzień na złożenie wniosku (przegapienie kosztuje),
        "koniec"  – ostatni dzień, w którym można korzystać / zgłosić roszczenie,
        "start"   – dzień rozpoczęcia / najwcześniejszy możliwy start,
        "info"    – data pomocnicza (np. przewidywany poród).
   Daty liczymy tylko dla wariantów, które przysługują albo czekają na dane
   (status „dostepny” / „brak_danych”) – kalendarz nie podsuwa cudzych wniosków.
   ===================================================================== */
import { DEFAULT_PARAMS } from "../params.js";
import { tygodnieMac } from "../helpers.js";
import { kontekstSprawy } from "./kontekst.js";
import { przegladWnioskow } from "./ocena.js";

const DAY = 86400000;
const isoOk = (v) => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const t = Date.parse(`${v}T00:00:00Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === v;
};
const iso = (v) => (v instanceof Date && !Number.isNaN(v.getTime()) ? v.toISOString().slice(0, 10) : isoOk(v) ? v : "");
const plus = (v, dni) => (isoOk(v) && Number.isFinite(dni) ? new Date(Date.parse(`${v}T00:00:00Z`) + dni * DAY).toISOString().slice(0, 10) : "");
/** + n miesięcy; gdy takiego dnia nie ma (31.08 + 6 mies.), ostatni dzień miesiąca (art. 112 k.c.). */
export const plusMies = (v, n) => {
  if (!isoOk(v)) return "";
  const [r, m, d] = v.split("-").map(Number);
  const ostatni = new Date(Date.UTC(r, m - 1 + n + 1, 0)).getUTCDate();
  return new Date(Date.UTC(r, m - 1 + n, Math.min(d, ostatni))).toISOString().slice(0, 10);
};
const koniecRoku = (v, lat) => (isoOk(v) ? `${Number(v.slice(0, 4)) + lat}-12-31` : "");
const max = (a, b) => (!a ? b : !b ? a : a > b ? a : b);
const D = (v) => (isoOk(v) ? `${v.slice(8, 10)}.${v.slice(5, 7)}.${v.slice(0, 4)}` : "");

const KP = "Kodeks pracy";
const RZ = "rozporządzenie z 27.09.2026 w sprawie dokumentów do zasiłków";
const PORADNIK = "Poradnik ZUS dla rodziców 2026";
const PRZEDAWNIENIE = "art. 67 ust. 1 ustawy zasiłkowej";

/**
 * @param {object} profil  profil z GET /api/profile
 * @param {{ dzis?: string|Date, params?: object }} [opcje]
 */
export function terminyWnioskow(profil, { dzis, params = DEFAULT_PARAMS } = {}) {
  const k = kontekstSprawy(profil ?? {}, { dzis, params });
  const P = k.P;
  const przeglad = przegladWnioskow(profil ?? {}, { dzis, params });
  const warianty = new Map(przeglad.wnioski.flatMap((w) => w.warianty).map((v) => [v.id, v]));
  const aktywny = (id) => ["dostepny", "brak_danych"].includes(warianty.get(id)?.status);

  const ur = iso(k.dataUrodzenia);
  const pdp = iso(k.pdp);
  const przyj = iso(k.dataPrzyjecia);
  const porod = ur || pdp; // przed porodem liczymy od przewidywanej daty – oznaczamy jako szacunek
  const zPdp = !ur && !!pdp;
  const nieprac = k.pracownik === false;
  const tyg = tygodnieMac(k.liczbaDzieci ?? 1, P);
  const ur_ = k.profil.urlopy ?? {};
  const przedOd = iso(ur_.urlopPrzedPorodemOd);
  // Koniec urlopu macierzyńskiego: z profilu (wpisany termin), inaczej liczony od startu (KP art. 180 § 1, 183¹).
  const startMac = przedOd && porod && przedOd < porod ? przedOd : porod;
  const koniecMac = iso(k.terminKoncaMacierzynskiego) || (startMac ? plus(startMac, tyg * 7 - 1) : "");
  const koniecMacZProfilu = !!iso(k.terminKoncaMacierzynskiego);

  const out = [];
  const dodaj = (wariant, e) => {
    if (!e.data || !isoOk(e.data)) return;
    const v = warianty.get(wariant);
    out.push({
      wariant,
      wniosek: v?.wniosek ?? null,
      dokument: e.dokument ?? v?.dokument ?? null,
      pewnosc: "pewne",
      przypomnienie: e.typ === "termin" || e.typ === "koniec" ? plus(e.data, -7) : null,
      ...e,
      id: `${wariant}-${e.id}`,
    });
  };

  /* ---------- poród (punkt odniesienia) ---------- */
  if (k.etap === "ciaza" && pdp) {
    dodaj("W1", { id: "pdp", typ: "info", data: pdp, tytul: "Przewidywana data porodu", kto: "Rodzice",
      opis: "Od tej daty liczymy terminy przed porodem. Po porodzie wpisz datę urodzenia w „Moje dane” – daty się przeliczą.",
      podstawa: "dane z „Moje dane”", zrodlo: "profil" });
  }

  /* ---------- W2: część urlopu macierzyńskiego przed porodem ---------- */
  if (aktywny("W2") && pdp) {
    const najwczesniej = plus(pdp, -7 * P.przedPorodemMax);
    const start = przedOd && przedOd >= najwczesniej ? przedOd : najwczesniej;
    dodaj("W2", { id: "start", typ: "start", data: najwczesniej, kto: "Mama",
      tytul: "Najwcześniejszy start urlopu macierzyńskiego przed porodem",
      opis: `Przed przewidywaną datą porodu możesz wykorzystać najwyżej ${P.przedPorodemMax} tygodni urlopu macierzyńskiego.`,
      podstawa: "art. 180 § 2 KP", zrodlo: `${KP}; ${PORADNIK}, s. 28` });
    dodaj("W2", { id: "wniosek", typ: "termin", data: plus(start, -P.ochronaWkladDni.macierzynski), kto: "Mama",
      tytul: "Wniosek o urlop macierzyński przed porodem",
      opis: `Najpóźniej ${P.ochronaWkladDni.macierzynski} dni przed planowanym startem (${D(start)}${przedOd ? " – z „Moje dane”" : " – najwcześniejszy możliwy"}). Dołącz zaświadczenie lekarskie o przewidywanej dacie porodu.`,
      podstawa: "Poradnik ZUS (14 dni); art. 177 § 1¹ pkt 1 KP; § 2 RWN", zrodlo: `${PORADNIK}, s. 28; ${KP}` });
  }

  /* ---------- W1: urlop / zasiłek macierzyński ---------- */
  if (aktywny("W1") && porod) {
    dodaj("W1", { id: "start", typ: "start", data: startMac, kto: "Mama", pewnosc: zPdp ? "szacunek" : "pewne",
      tytul: startMac === porod ? "Początek urlopu macierzyńskiego (dzień porodu)" : "Początek urlopu macierzyńskiego (przed porodem)",
      opis: "Jeśli nie bierzesz urlopu przed porodem, pierwszym dniem urlopu macierzyńskiego jest dzień porodu.",
      podstawa: "art. 183¹ § 2 KP", zrodlo: KP });
    dodaj("W1", { id: "koniec", typ: "info", data: koniecMac, kto: "Mama", pewnosc: koniecMacZProfilu ? "pewne" : "szacunek",
      tytul: `Koniec urlopu macierzyńskiego (${tyg} tyg.)`,
      opis: koniecMacZProfilu ? "Termin wpisany w „Moje dane”." : `Liczone: ${tyg} tygodni od pierwszego dnia urlopu (tydzień = 7 dni kalendarzowych).`,
      podstawa: "art. 180 § 1, art. 183¹ § 1 KP", zrodlo: KP });
    if (nieprac) {
      dodaj("W1", { id: "przedawnienie", typ: "koniec", data: plusMies(koniecMac, 6), kto: "Mama", pewnosc: "szacunek",
        tytul: "Ostatni dzień na wniosek ZAM o zasiłek macierzyński",
        opis: "Roszczenie o zasiłek przedawnia się po 6 miesiącach od ostatniego dnia okresu, za który przysługuje. Najlepiej złóż ZAM od razu po porodzie – ZUS wypłaca w ciągu 30 dni od kompletu dokumentów.",
        podstawa: PRZEDAWNIENIE, zrodlo: `${PORADNIK}, s. 35` });
    }
  }

  /* ---------- W41: 81,5% za cały okres ---------- */
  const dataW41 = k.etap === "przyjecie" ? przyj : porod;
  if (aktywny("W41") && dataW41) {
    const odPorodu = k.etap === "przyjecie" ? "przyjęcia dziecka" : "porodu";
    dodaj("W41", { id: "wniosek", typ: "termin", data: plus(dataW41, P.deadlineSredniowany), kto: "Mama", pewnosc: zPdp ? "szacunek" : "pewne",
      tytul: "Wniosek o zasiłek w pełnym wymiarze (81,5% za cały okres)",
      opis: `Do ${P.deadlineSredniowany} dni po ${odPorodu}${zPdp ? " (liczone od przewidywanej daty porodu)" : ""}. Później zostaje wariant 100% za macierzyński i 70% za rodzicielski.`,
      podstawa: "art. 179¹ KP; art. 31 ustawy zasiłkowej", zrodlo: `${PORADNIK}, s. 34` });
  }

  /* ---------- W5 / W22: przejęcie urlopu po 14 tygodniach ---------- */
  if (ur && (aktywny("W5") || aktywny("W22"))) {
    const wykorzystane = Number.isFinite(k.macierzynskiWykorzystanoTyg) && k.macierzynskiWykorzystanoTyg > P.wylaczneMacierzynskieMatki
      ? k.macierzynskiWykorzystanoTyg : P.wylaczneMacierzynskieMatki;
    const odDnia = plus(ur, wykorzystane * 7);
    if (aktywny("W5")) {
      dodaj("W5", { id: "wniosek", typ: "termin", data: plus(odDnia, -7), kto: "Mama",
        tytul: "Wniosek o rezygnację z reszty urlopu macierzyńskiego",
        opis: `Jeśli wracasz do pracy ${D(odDnia)} (po ${wykorzystane} tyg. po porodzie) – złóż wniosek najpóźniej 7 dni wcześniej. Dołącz kopię wniosku ojca o pozostałą część urlopu.`,
        podstawa: "art. 180 § 4 i § 8 KP; § 3 RWN", zrodlo: `${KP}; ${PORADNIK}, s. 30` });
    }
    if (aktywny("W22")) {
      dodaj("W22", { id: "wniosek", typ: "termin", data: plus(odDnia, -14), kto: "Tata",
        tytul: "Wniosek o pozostałą część urlopu macierzyńskiego",
        opis: `Jeśli przejmujesz urlop od ${D(odDnia)} – złóż wniosek najpóźniej 14 dni wcześniej.`,
        podstawa: "art. 180 § 9 KP; § 5 RWN", zrodlo: KP });
      dodaj("W22", { id: "koniec", typ: "info", data: koniecMac, kto: "Tata", pewnosc: koniecMacZProfilu ? "pewne" : "szacunek",
        tytul: "Koniec przejętego urlopu macierzyńskiego",
        opis: "Łączny wymiar urlopu obojga rodziców nie może przekroczyć wymiaru urlopu macierzyńskiego.",
        podstawa: "art. 180 § 14 KP", zrodlo: KP });
    }
  }

  /* ---------- W6: matka z orzeczeniem – po 8 tygodniach ---------- */
  if (aktywny("W6") && ur) {
    const odDnia = plus(ur, 8 * 7);
    dodaj("W6", { id: "wniosek", typ: "termin", data: plus(odDnia, -14), kto: "Tata / członek rodziny",
      tytul: "Wniosek o część urlopu macierzyńskiego (matka z orzeczeniem)",
      opis: `Najwcześniej od ${D(odDnia)} (po 8 tygodniach urlopu matki) – wniosek najpóźniej 14 dni przed rozpoczęciem.`,
      podstawa: "art. 180 § 6 i § 9 KP; § 4–5 RWN", zrodlo: KP });
  }

  /* ---------- W10: martwe urodzenie / zgon dziecka ---------- */
  const zgon = iso(profil?.dziecko?.dataZgonu);
  if (aktywny("W10") && ur) {
    const koniec = k.martwe === true || (zgon && (Date.parse(zgon) - Date.parse(ur)) / DAY < 56)
      ? max(plus(ur, P.martweUrodzenieTygodnie * 7 - 1), zgon ? plus(zgon, P.zgonPo8TygDni - 1) : "")
      : zgon ? plus(zgon, P.zgonPo8TygDni - 1) : "";
    dodaj("W10", { id: "koniec", typ: "info", data: koniec, kto: "Mama",
      tytul: "Koniec urlopu macierzyńskiego po stracie dziecka",
      opis: "8 tygodni po porodzie, nie krócej niż 7 dni od dnia zgonu; po 8. tygodniu życia dziecka – 7 dni od zgonu.",
      podstawa: "art. 180¹ KP", zrodlo: `${KP}; ${PORADNIK}, s. 33` });
    if (nieprac && koniec) {
      dodaj("W10", { id: "przedawnienie", typ: "koniec", data: plusMies(koniec, 6), kto: "Mama",
        tytul: "Ostatni dzień na wniosek ZAM", opis: "Roszczenie przedawnia się po 6 miesiącach od ostatniego dnia okresu zasiłku.",
        podstawa: PRZEDAWNIENIE, zrodlo: `${PORADNIK}, s. 35` });
    }
  }

  /* ---------- W45: zasiłek pogrzebowy ---------- */
  if (aktywny("W45")) {
    const od = zgon || (k.martwe === true ? ur : "");
    dodaj("W45", { id: "wniosek", typ: "termin", data: plusMies(od, 12), kto: "Osoba, która pokryła koszty pogrzebu", pewnosc: "szacunek",
      tytul: "Wniosek o zasiłek pogrzebowy (Z-12)",
      opis: "12 miesięcy od dnia pochówku. Liczymy od dnia zgonu / urodzenia – pochówek jest później, więc to bezpieczna data. Dołącz rachunki za pogrzeb.",
      podstawa: "ustawa o emeryturach i rentach z FUS (zasiłek pogrzebowy)", zrodlo: `${PORADNIK}, s. 35` });
  }

  /* ---------- W4: uzupełniający urlop macierzyński ---------- */
  if (aktywny("W4") && koniecMac) {
    dodaj("W4", { id: "wniosek", typ: nieprac ? "koniec" : "termin",
      data: nieprac ? koniecMac : plus(koniecMac, -P.ochronaWkladDni.uzupelniajacy),
      kto: "Mama albo tata", pewnosc: koniecMacZProfilu ? "pewne" : "szacunek",
      tytul: "Wniosek o uzupełniający urlop macierzyński",
      opis: nieprac
        ? "Wniosek do płatnika zasiłku przed zakończeniem pobierania zasiłku za urlop macierzyński – z terminem jego zakończenia."
        : `Najpóźniej ${P.ochronaWkladDni.uzupelniajacy} dni przed końcem urlopu macierzyńskiego (${D(koniecMac)}). Wniosek MUSI zawierać termin zakończenia urlopu macierzyńskiego i zaświadczenie ze szpitala.`,
      podstawa: nieprac ? "§ 26 pkt 3 RZ" : "art. 180² § 4 i § 6 KP; § 14 RWN", zrodlo: nieprac ? RZ : `${KP}; ${PORADNIK}, s. 31` });
    dodaj("W4", { id: "start", typ: "start", data: plus(koniecMac, 1), kto: "Mama albo tata", pewnosc: koniecMacZProfilu ? "pewne" : "szacunek",
      tytul: "Początek uzupełniającego urlopu macierzyńskiego",
      opis: "Uzupełniający urlop zaczyna się bezpośrednio po urlopie macierzyńskim.",
      podstawa: "art. 180² § 1 KP", zrodlo: KP });
  }

  /* ---------- W21: urlop ojcowski ---------- */
  if (aktywny("W21") && ur && k.etap !== "przyjecie") {
    const ostatni = plus(plusMies(ur, P.deadlineOjcowskiMies), -1);
    const dni = P.tygodnieOjcowski * 7;
    dodaj("W21", { id: "koniec", typ: "koniec", data: ostatni, kto: "Tata",
      tytul: "Ostatni dzień urlopu ojcowskiego",
      opis: `Urlop ojcowski (${dni} dni, w całości albo w 2 częściach po tygodniu) trzeba wykorzystać do ukończenia przez dziecko ${P.deadlineOjcowskiMies} miesięcy – potem przepada.`,
      podstawa: "art. 182³ § 1 i § 1¹ KP", zrodlo: `${KP}; ${PORADNIK}, s. 33` });
    dodaj("W21", { id: "wniosek", typ: "termin", data: plus(ostatni, -(dni - 1) - (nieprac ? 1 : P.ochronaWkladDni.ojcowski)), kto: "Tata",
      tytul: "Ostatni moment na wniosek o pełny urlop ojcowski",
      opis: nieprac
        ? `Wniosek o zasiłek za urlop ojcowski składasz przed jego rozpoczęciem – żeby wykorzystać całe ${dni} dni, zacznij najpóźniej ${D(plus(ostatni, -(dni - 1)))}.`
        : `Wniosek najpóźniej ${P.ochronaWkladDni.ojcowski} dni przed startem; żeby zmieścić całe ${dni} dni, start najpóźniej ${D(plus(ostatni, -(dni - 1)))}.`,
      podstawa: nieprac ? "§ 33 ust. 1 pkt 3 RZ" : "art. 182³ § 2 KP; § 17 RWN", zrodlo: nieprac ? RZ : KP });
  }

  /* ---------- W25 / W12: urlop rodzicielski ---------- */
  const rodzOd = iso(ur_.rodzicielskiOd);
  if (aktywny("W25")) {
    if (ur && k.etap !== "przyjecie") {
      dodaj("W25", { id: "koniec", typ: "koniec", data: koniecRoku(ur, P.limitRokZycia), kto: "Mama i tata",
        tytul: "Ostatni dzień urlopu rodzicielskiego",
        opis: `Urlop rodzicielski (do ${P.maxCzesci} części) trzeba wykorzystać do końca roku, w którym dziecko kończy ${P.limitRokZycia} lat.`,
        podstawa: "art. 182¹c KP", zrodlo: `${KP}; ${PORADNIK}, s. 32` });
    }
    const start = rodzOd || (koniecMac && k.etap !== "przyjecie" ? plus(koniecMac, 1) : "");
    dodaj("W25", { id: "wniosek", typ: "termin", data: plus(start, nieprac ? -1 : -P.ochronaWkladDni.rodzicielski), kto: "Mama albo tata",
      pewnosc: rodzOd ? "pewne" : "szacunek",
      tytul: rodzOd ? "Wniosek o urlop rodzicielski" : "Wniosek o urlop rodzicielski zaraz po macierzyńskim",
      opis: (rodzOd ? `Planujesz urlop od ${D(rodzOd)} (z „Moje dane”).` : `Jeśli urlop rodzicielski ma zacząć się zaraz po macierzyńskim (${D(start)}).`)
        + (nieprac ? " Wniosek o zasiłek składasz przed rozpoczęciem." : ` Wniosek najpóźniej ${P.ochronaWkladDni.rodzicielski} dni wcześniej.`)
        + " Przy wariancie 81,5% wniosek o całość składasz w 21 dni po porodzie.",
      podstawa: nieprac ? "§ 29 ust. 3 RZ" : "art. 182¹d § 1 KP; § 15 RWN", zrodlo: nieprac ? RZ : KP });
  }
  if (aktywny("W12") && rodzOd && k.laczenieZPraca === true) {
    dodaj("W12", { id: "wniosek", typ: "termin", data: plus(rodzOd, -21), kto: "Pracownik na urlopie rodzicielskim", pewnosc: "szacunek",
      tytul: "Wniosek o łączenie urlopu rodzicielskiego z pracą",
      opis: `Najpóźniej 21 dni przed podjęciem pracy (liczymy od początku urlopu ${D(rodzOd)} – jeśli pracę zaczynasz później, termin też jest później). Pracodawca może odmówić w 7 dni.`,
      podstawa: "art. 182¹e § 2 KP; § 16 RWN", zrodlo: KP });
  }

  /* ---------- W28: adopcja / rodzina zastępcza ---------- */
  if (aktywny("W28") && przyj) {
    dodaj("W28", { id: "wniosek", typ: "termin", data: plus(przyj, 7), kto: "Rodzic przyjmujący dziecko",
      tytul: "Wniosek o urlop na warunkach urlopu macierzyńskiego",
      opis: "W ciągu 7 dni od przyjęcia dziecka na wychowanie.",
      podstawa: "art. 183 § 6 KP; § 18 RWN", zrodlo: `${KP}; ${PORADNIK}, s. 30` });
    dodaj("W28", { id: "start", typ: "koniec", data: plus(przyj, 21), kto: "Rodzic przyjmujący dziecko",
      tytul: "Najpóźniejszy początek urlopu na warunkach macierzyńskiego",
      opis: "Urlop zaczyna się w terminie z wniosku, ale nie później niż 21 dni od przyjęcia dziecka.",
      podstawa: "art. 183 § 6 KP", zrodlo: KP });
  }

  /* ---------- W11: urlop wychowawczy ---------- */
  if (aktywny("W11") && ur && k.niepelnosprawne !== true) {
    dodaj("W11", { id: "koniec", typ: "koniec", data: koniecRoku(ur, 6), kto: "Mama albo tata", pewnosc: "do_potwierdzenia",
      tytul: "Ostatni dzień urlopu wychowawczego",
      opis: "Do końca roku, w którym dziecko kończy 6 lat (przy niepełnosprawności – do 18 lat). Wniosek 21 dni przed każdą częścią.",
      podstawa: "art. 186 § 2 i § 7 KP (poza przekazanym wyciągiem)", zrodlo: "Kodeks pracy – do potwierdzenia" });
  }

  /* ---------- W34 / W35: zwolnienie w ciąży ---------- */
  const zlaOd = iso(profil?.zdrowie?.zlaOd);
  const zlaDo = iso(profil?.zdrowie?.zlaDo);
  if (aktywny("W35") && zlaOd) {
    dodaj("W35", { id: "koniec", typ: "info", data: plus(zlaOd, 33 - 1), kto: "Mama", pewnosc: "szacunek",
      tytul: "Koniec wynagrodzenia chorobowego (33 dni) – dalej zasiłek z ZUS",
      opis: "Liczone od początku zwolnienia, bez wcześniejszych zwolnień w tym roku (te skracają okres). Po 50. roku życia – 14 dni.",
      podstawa: "art. 92 § 1 i § 4 KP", zrodlo: `${KP}; Załącznik do zadania` });
  }
  if (aktywny("W34") && zlaOd) {
    dodaj("W34", { id: "koniec", typ: "info", data: plus(zlaOd, 270 - 1), kto: "Mama", pewnosc: "szacunek",
      tytul: "Koniec okresu zasiłkowego w ciąży (270 dni)",
      opis: "Najdłużej, ile można dostawać zasiłek chorobowy w ciąży (bez wcześniejszych okresów wliczanych do okresu zasiłkowego).",
      podstawa: "art. 8 ustawy zasiłkowej", zrodlo: "Załącznik do zadania" });
    if (nieprac && zlaDo) {
      dodaj("W34", { id: "przedawnienie", typ: "koniec", data: plusMies(zlaDo, 6), kto: "Mama",
        tytul: "Ostatni dzień na zgłoszenie zasiłku chorobowego za obecne zwolnienie",
        opis: "Roszczenie o zasiłek chorobowy przedawnia się po 6 miesiącach od ostatniego dnia okresu, za który przysługuje.",
        podstawa: PRZEDAWNIENIE, zrodlo: `${PORADNIK}, s. 27` });
    }
  }

  return out.sort((a, b) => a.data.localeCompare(b.data) || a.id.localeCompare(b.id));
}

/* =====================================================================
   Eksport do kalendarza w telefonie (.ics, RFC 5545) – wydarzenia całodniowe
   z przypomnieniem 7 dni i 1 dzień wcześniej.
   ===================================================================== */
const escIcs = (s) => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
// Linie dłuższe niż 75 znaków zawijamy (RFC 5545 § 3.1) – liczymy znaki, nie bajty; wystarcza kalendarzom w telefonach.
const zawin = (linia) => {
  const s = String(linia ?? "");
  return s ? (s.match(/.{1,74}/g) ?? [s]).join("\r\n ") : "";
};

export function doIcs(terminy, { teraz = new Date() } = {}) {
  const stamp = teraz.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const linie = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//RodzicPlus//Terminy wnioskow//PL", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const t of terminy) {
    if (!isoOk(t.data)) continue;
    const alarmy = t.typ === "termin" || t.typ === "koniec" ? ["-P7D", "-P1D"] : [];
    linie.push(
      "BEGIN:VEVENT",
      `UID:${t.id}-${t.data}@rodzicplus`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${t.data.replaceAll("-", "")}`,
      `DTEND;VALUE=DATE:${plus(t.data, 1).replaceAll("-", "")}`,
      `SUMMARY:${escIcs(`${t.typ === "termin" ? "⏰ " : t.typ === "koniec" ? "⚠️ " : ""}${t.tytul}`)}`,
      `DESCRIPTION:${escIcs(`${t.opis ?? ""}${t.dokument ? `\nCo składasz: ${t.dokument}` : ""}\nPodstawa: ${t.podstawa}${t.pewnosc !== "pewne" ? "\nData szacunkowa – sprawdź w „Moje dane”." : ""}`)}`,
      ...alarmy.flatMap((a) => ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escIcs(t.tytul)}`, `TRIGGER:${a}`, "END:VALARM"]),
      "END:VEVENT",
    );
  }
  linie.push("END:VCALENDAR");
  return linie.map(zawin).join("\r\n") + "\r\n";
}
