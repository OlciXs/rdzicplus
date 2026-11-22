/* =====================================================================
   GENERATOR WNIOSKÓW DO DRUKU (krok 4 planu: „formularz wypełniony z profilu”).

   Wnioski PRACOWNICZE do pracodawcy mają dowolną formę – treść wyznacza
   rozporządzenie MRPiPS w sprawie wniosków dotyczących uprawnień pracowników
   związanych z rodzicielstwem (dalej: „rozporządzenie o wnioskach”). Dla osoby,
   która nie jest pracownikiem, zamiast pisma do pracodawcy powstaje „ściąga”
   z danymi do przepisania do formularza ZAM w eZUS (nie podrabiamy druku ZUS).

   Wymagane elementy pism: docs/02-dane-do-wnioskow-2026.md (§ 2.5–2.17) –
   szkic do weryfikacji, dlatego każdy druk ma `pewnosc`.

   przygotujDruk(profil, wariantId, { dzis, params, wartosci }) →
     { tytul, tryb, naglowek, pola, oswiadczenia, tresc, zalaczniki, ostrzezenia, brakujace }
   `wartosci` – to, co rodzic poprawił na ekranie (nadpisuje dane z profilu).
   ===================================================================== */
import { DEFAULT_PARAMS } from "../params.js";
import { tygodnieMac, tygodnieRodz } from "../helpers.js";
import { kontekstSprawy } from "./kontekst.js";
import { uzupelniajacyWymiar } from "./rejestr.js";
import { pobierzDaneDziecka } from "./dzieckoHelper.js";

const DAY = 86400000;

/* ---------- daty jako ISO „RRRR-MM-DD” (UTC – bez przesunięć strefy) ---------- */
// Prawdziwa data (30 lutego odpada – Date by ją „przesunął” na marzec).
const isoOk = (v) => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const t = Date.parse(`${v}T00:00:00Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === v;
};
const iso = (v) => (isoOk(v) ? v : v instanceof Date && !Number.isNaN(v.getTime()) ? v.toISOString().slice(0, 10) : "");
// Absurdalne przesunięcie (np. 10¹² tygodni z zepsutego profilu) wychodzi poza zakres Date → pusta data, nie wyjątek.
const plus = (v, dni) => {
  if (!isoOk(v) || !Number.isFinite(dni)) return "";
  const d = new Date(Date.parse(`${v}T00:00:00Z`) + dni * DAY);
  return Number.isNaN(d.getTime()) || d.getUTCFullYear() > 9999 || d.getUTCFullYear() < 1000 ? "" : d.toISOString().slice(0, 10);
};
const roznica = (od, doDnia) => (isoOk(od) && isoOk(doDnia) ? Math.round((Date.parse(doDnia) - Date.parse(od)) / DAY) : null);
/** Data do pisma: 01.09.2026; pusta → miejsce do wpisania ręcznie. */
export const D = (v) => (isoOk(v) ? `${v.slice(8, 10)}.${v.slice(5, 7)}.${v.slice(0, 4)}` : "……………");
const T = (v) => (v === undefined || v === null || String(v).trim() === "" ? "……………………" : String(v).trim());

// Miejscowość z adresu „ul. Kwiatowa 5/12, 00-001 Warszawa” → „Warszawa”.
const miejscowoscZAdresu = (adres) => (String(adres ?? "").match(/\d{2}-\d{3}\s+([^,\d]+)/)?.[1] ?? "").trim();

// Liczby z profilu: ujemne / nieliczbowe = brak danych (fuzz: „−5 wykorzystanych tygodni” trafiało do pisma).
const nieuj = (n, domyslnie = null) => (typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : domyslnie);

const pole = (id, etykieta, typ, wartosc, { wymagane = true, pomoc } = {}) => ({ id, etykieta, typ, wartosc: wartosc ?? "", wymagane, pomoc });

/* ---------- pouczenia o terminach (V-ostrzeżenia z docs/02 § 5) ---------- */
// „Wniosek co najmniej N dni przed rozpoczęciem” – porównujemy datę złożenia z datą startu.
const terminPrzed = (v, poleStartu, dni, co) => {
  const d = roznica(v.dataZlozenia, v[poleStartu]);
  if (d === null) return [];
  if (d < 0) return [{ poziom: "blad", tekst: `${co} zaczyna się przed datą złożenia wniosku – sprawdź daty.` }];
  if (d < dni) return [{ poziom: "ostrzezenie", tekst: `Wniosek trzeba złożyć co najmniej ${dni} dni przed rozpoczęciem (${co.toLowerCase()} od ${D(v[poleStartu])}) – teraz jest ${d} dni. Pracodawca może przesunąć termin.` }];
  return [];
};
const okresOk = (v, od, doDnia, co) => {
  const d = roznica(v[od], v[doDnia]);
  return d !== null && d < 0 ? [{ poziom: "blad", tekst: `${co}: data „do” jest wcześniejsza niż „od”.` }] : [];
};
const dniOkresu = (v, od, doDnia) => {
  const d = roznica(v[od], v[doDnia]);
  return d === null ? null : d + 1;
};

/* ---------- wspólne pola ---------- */
const polaDziecka = (k) => {
  const d = pobierzDaneDziecka(k.profil);
  return [
    pole("dzieckoImie", "Imię dziecka", "text", d.imie),
    pole("dzieckoNazwisko", "Nazwisko dziecka", "text", d.nazwisko),
    pole("dzieckoUr", "Data urodzenia dziecka", "date", iso(d.dataUrodzenia)),
  ];
};
const dziecko = (v) => `${T(v.dzieckoImie)} ${v.dzieckoNazwisko ? v.dzieckoNazwisko : ""}`.trim() + `, ur. ${D(v.dzieckoUr)}`;
const tygDzieci = (k) => tygodnieMac(k.liczbaDzieci ?? 1, k.P);

/* =====================================================================
   SZABLONY – klucz = id wariantu z rejestru
   ===================================================================== */
const SZABLONY = {
  /* W1 / W3 – urlop macierzyński po porodzie (+ opcjonalnie 81,5%) */
  W1: {
    tytul: "Wniosek o udzielenie urlopu macierzyńskiego",
    zam: "zasiłek macierzyński",
    podstawa: "art. 180 § 1 k.p.; wniosek o pełny wymiar – art. 179¹ k.p.",
    pola: (k) => {
      const d = pobierzDaneDziecka(k.profil);
      const ur = iso(d.dataUrodzenia) || iso(d.przewidywanaDataPorodu);
      return [
        pole("porod", "Data porodu", "date", ur, { pomoc: d.dataUrodzenia ? undefined : "Przed porodem wpisaliśmy przewidywaną datę – popraw po porodzie." }),
        pole("liczbaDzieci", "Liczba dzieci urodzonych przy jednym porodzie", "number", k.liczbaDzieci ?? 1),
        pole("od", "Urlop od", "date", ur),
        pole("do", "Urlop do", "date", ur ? plus(ur, tygDzieci(k) * 7 - 1) : "", { pomoc: `${tygDzieci(k)} tygodni (wyliczone z liczby dzieci)` }),
        ...polaDziecka(k).map((p) => ({ ...p, wymagane: false })),
      ];
    },
    oswiadczenia: (k) => [
      { id: "pelnyWymiar", tekst: "Wnoszę o udzielenie mi – bezpośrednio po urlopie macierzyńskim – urlopu rodzicielskiego w pełnym wymiarze (art. 179¹ k.p.). Zasiłek za cały okres wyniesie wtedy 81,5%.", domyslnie: k.zamiarPelnyWymiar === true },
    ],
    tresc: (v) => [
      `Na podstawie art. 180 § 1 Kodeksu pracy proszę o udzielenie mi urlopu macierzyńskiego w wymiarze wynikającym z urodzenia ${Number(v.liczbaDzieci) > 1 ? `${v.liczbaDzieci} dzieci` : "jednego dziecka"} przy jednym porodzie, w okresie od ${D(v.od)} do ${D(v.do)}.`,
      `Poród nastąpił ${D(v.porod)}.${v.dzieckoImie ? ` Dziecko: ${dziecko(v)}.` : ""}`,
      ...(v.pelnyWymiar ? ["Jednocześnie, na podstawie art. 179¹ Kodeksu pracy, wnoszę o udzielenie mi bezpośrednio po urlopie macierzyńskim urlopu rodzicielskiego w pełnym wymiarze."] : []),
    ],
    zalaczniki: () => ["Odpis skrócony aktu urodzenia dziecka (albo zgoda, by płatnik/ZUS pobrał dane z rejestru stanu cywilnego)"],
    kontrola: (v, k) => {
      const o = okresOk(v, "od", "do", "Urlop macierzyński");
      const okres = dniOkresu(v, "od", "do");
      const naleznyDni = tygodnieMac(Math.min(Math.max(Math.round(Number(v.liczbaDzieci)) || 1, 1), 5), k.P) * 7;
      if (okres !== null && okres > naleznyDni) o.push({ poziom: "blad", tekst: `Przy ${Number(v.liczbaDzieci) > 1 ? `${v.liczbaDzieci} dzieciach` : "jednym dziecku"} urlop macierzyński to ${naleznyDni / 7} tygodni (do ${D(plus(v.od, naleznyDni - 1))}) – wpisany okres jest dłuższy.` });
      const dni = roznica(v.porod, v.dataZlozenia);
      if (v.pelnyWymiar && dni !== null && dni > 21) o.push({ poziom: "blad", tekst: `Wniosek o pełny wymiar (81,5%) składa się najpóźniej 21 dni po porodzie – minęło ${dni} dni.` });
      return o;
    },
  },

  /* W2 – część urlopu przed porodem (§ 2 rozporządzenia o wnioskach) */
  W2: {
    tytul: "Wniosek o udzielenie części urlopu macierzyńskiego przed przewidywaną datą porodu",
    zam: "zasiłek macierzyński przed porodem",
    podstawa: "art. 180 § 2 k.p.; § 2 rozporządzenia o wnioskach",
    pola: (k) => {
      const d = pobierzDaneDziecka(k.profil);
      return [
        pole("pdp", "Przewidywana data porodu", "date", iso(d.przewidywanaDataPorodu)),
        pole("od", "Urlop od", "date", iso(k.profil.urlopy?.urlopPrzedPorodemOd), { pomoc: `Najwcześniej ${k.P.przedPorodemMax} tygodni przed przewidywaną datą porodu` }),
      ];
    },
    oswiadczenia: () => [],
    tresc: (v) => [
      `Na podstawie art. 180 § 2 Kodeksu pracy proszę o udzielenie mi części urlopu macierzyńskiego przypadającej przed przewidywaną datą porodu, od dnia ${D(v.od)}.`,
      `Przewidywana data porodu: ${D(v.pdp)}.`,
    ],
    zalaczniki: () => ["Kopia zaświadczenia lekarskiego o przewidywanej dacie porodu"],
    kontrola: (v, k) => {
      const o = terminPrzed(v, "od", k.P.ochronaWkladDni.macierzynski, "Urlop");
      const przed = roznica(v.od, v.pdp);
      if (przed !== null && przed > k.P.przedPorodemMax * 7) o.push({ poziom: "blad", tekst: `Przed porodem można wziąć najwyżej ${k.P.przedPorodemMax} tygodni – najwcześniej od ${D(plus(v.pdp, -k.P.przedPorodemMax * 7))}.` });
      if (przed !== null && przed < 0) o.push({ poziom: "blad", tekst: "Data rozpoczęcia jest po przewidywanej dacie porodu." });
      return o;
    },
  },

  /* W5 – matka rezygnuje z reszty urlopu (§ 3) */
  W5: {
    tytul: "Wniosek o rezygnację z pozostałej części urlopu macierzyńskiego",
    zam: "rezygnacja z pobierania zasiłku macierzyńskiego",
    podstawa: "art. 180 § 4 i § 8 k.p.; § 3 rozporządzenia o wnioskach",
    pola: (k) => {
      const d = pobierzDaneDziecka(k.profil);
      const ur = iso(d.dataUrodzenia);
      const tyg = nieuj(k.macierzynskiWykorzystanoTyg, k.P.wylaczneMacierzynskieMatki);
      return [
        pole("powrot", "Termin powrotu do pracy", "date", ur ? plus(ur, tyg * 7) : "", { pomoc: "Pierwszy dzień po wykorzystanej części urlopu" }),
        pole("ojciecImieNazwisko", "Ojciec dziecka, który przejmie urlop", "text", [k.profil.drugiRodzic?.imie, k.profil.drugiRodzic?.nazwisko].filter(Boolean).join(" ")),
      ];
    },
    oswiadczenia: () => [],
    tresc: (v) => [
      `Na podstawie art. 180 § 4 Kodeksu pracy rezygnuję z pozostałej części urlopu macierzyńskiego i oświadczam, że przystąpię do pracy dnia ${D(v.powrot)}.`,
      `Pozostałą część urlopu wykorzysta ojciec dziecka – ${T(v.ojciecImieNazwisko)}.`,
    ],
    zalaczniki: () => ["Kopia wniosku ojca dziecka o udzielenie pozostałej części urlopu macierzyńskiego (albo kopia jego oświadczenia o przerwaniu działalności zarobkowej)"],
    kontrola: (v, k) => {
      const o = terminPrzed(v, "powrot", 7, "Powrót do pracy");
      const d = pobierzDaneDziecka(k.profil);
      const ur = iso(d.dataUrodzenia);
      const tyg = roznica(ur, v.powrot);
      if (tyg !== null && tyg < k.P.wylaczneMacierzynskieMatki * 7) o.push({ poziom: "blad", tekst: `Matka musi wykorzystać co najmniej ${k.P.wylaczneMacierzynskieMatki} tygodni po porodzie – powrót najwcześniej ${D(plus(ur, k.P.wylaczneMacierzynskieMatki * 7))}.` });
      return o;
    },
  },

  /* W22 – ojciec: pozostała część urlopu macierzyńskiego (§ 5) */
  W22: {
    tytul: "Wniosek o udzielenie pozostałej części urlopu macierzyńskiego",
    zam: "zasiłek macierzyński za pozostałą część urlopu",
    podstawa: "art. 180 § 5 i § 9 k.p.; § 5 rozporządzenia o wnioskach",
    pola: (k) => {
      const d = pobierzDaneDziecka(k.profil);
      const ur = iso(d.dataUrodzenia);
      const tyg = nieuj(k.macierzynskiWykorzystanoTyg, k.P.wylaczneMacierzynskieMatki);
      return [
        ...polaDziecka(k),
        pole("od", "Urlop od", "date", ur ? plus(ur, tyg * 7) : "", { pomoc: "Dzień po zakończeniu urlopu matki" }),
        pole("do", "Urlop do", "date", ur ? plus(ur, tygDzieci(k) * 7 - 1) : "", { pomoc: `Koniec ${tygDzieci(k)} tygodni urlopu macierzyńskiego` }),
        pole("przedPorodem", "Część urlopu wykorzystana przez matkę przed porodem (tygodnie)", "number", "0", { wymagane: false }),
      ];
    },
    oswiadczenia: () => [],
    tresc: (v) => [
      `Na podstawie art. 180 § 5 Kodeksu pracy proszę o udzielenie mi pozostałej części urlopu macierzyńskiego w okresie od ${D(v.od)} do ${D(v.do)}, w związku z rezygnacją matki dziecka z tej części urlopu.`,
      `Dane dziecka: ${dziecko(v)}.`,
      `Oświadczam, że matka dziecka wykorzystała przed porodem ${Number(v.przedPorodem) > 0 ? `${v.przedPorodem} tyg.` : "0 tygodni"} urlopu macierzyńskiego (zasiłku macierzyńskiego).`,
    ],
    zalaczniki: () => [
      "Odpis skrócony aktu urodzenia dziecka",
      "Kopia wniosku matki o rezygnację z pozostałej części urlopu macierzyńskiego",
      "Zaświadczenie płatnika zasiłku matki o okresie i stawce wypłaconego zasiłku (z jej PESEL) – gdy zasiłek wypłaca ZUS",
    ],
    kontrola: (v, k) => [...okresOk(v, "od", "do", "Urlop"), ...terminPrzed(v, "od", 14, "Urlop"),
      ...(roznica(v.dzieckoUr, v.od) !== null && roznica(v.dzieckoUr, v.od) < k.P.wylaczneMacierzynskieMatki * 7
        ? [{ poziom: "blad", tekst: `Ojciec może przejąć urlop dopiero po ${k.P.wylaczneMacierzynskieMatki} tygodniach od porodu – najwcześniej od ${D(plus(v.dzieckoUr, k.P.wylaczneMacierzynskieMatki * 7))}.` }] : [])],
  },

  /* W4 – uzupełniający urlop macierzyński (§ 14) */
  W4: {
    tytul: "Wniosek o udzielenie uzupełniającego urlopu macierzyńskiego",
    zam: "zasiłek za okres uzupełniającego urlopu macierzyńskiego",
    podstawa: "art. 180² k.p.; § 14 rozporządzenia o wnioskach",
    pola: (k) => {
      const koniec = iso(k.profil.urlopy?.terminKoncaMacierzynskiego);
      const wym = uzupelniajacyWymiar(k);
      const drugi = [k.profil.drugiRodzic?.imie, k.profil.drugiRodzic?.nazwisko].filter(Boolean).join(" ");
      return [
        pole("koniecMac", "Termin zakończenia urlopu macierzyńskiego", "date", koniec, { pomoc: "Obowiązkowe – bez tej daty wniosek jest wadliwy (art. 180² § 6 k.p.)" }),
        pole("od", "Urlop uzupełniający od", "date", koniec ? plus(koniec, 1) : ""),
        pole("do", "Urlop uzupełniający do", "date", koniec && wym ? plus(koniec, wym.tygodnie * 7) : "", { pomoc: wym ? `${wym.tygodnie} tyg. (${wym.dniPobytu} dni w szpitalu, limit ${wym.limit} tyg.)` : "Tydzień za każdy tydzień pobytu dziecka w szpitalu" }),
        ...polaDziecka(k),
        pole("drugiRodzic", "Drugi rodzic (imię i nazwisko)", "text", drugi, { wymagane: k.drugi }),
      ];
    },
    oswiadczenia: (k) => [
      { id: "J1", tekst: "Oświadczenie drugiego rodzica: nie zamierzam korzystać z uzupełniającego urlopu macierzyńskiego ani z zasiłku za ten okres (do podpisu przez drugiego rodzica).", domyslnie: k.drugiRodzicUzupelniajacy !== true && k.drugi },
    ],
    tresc: (v) => [
      `Na podstawie art. 180² Kodeksu pracy proszę o udzielenie mi uzupełniającego urlopu macierzyńskiego w okresie od ${D(v.od)} do ${D(v.do)}, w związku z pobytem dziecka (${dziecko(v)}) w szpitalu.`,
      `Termin zakończenia urlopu macierzyńskiego: ${D(v.koniecMac)}.`,
    ],
    zalaczniki: (v) => [
      "Zaświadczenie szpitala o okresie pobytu dziecka w szpitalu oraz tygodniu ciąży, w którym dziecko się urodziło, albo jego masie urodzeniowej",
      ...(v.J1 ? ["Oświadczenie drugiego rodzica o braku zamiaru korzystania z uzupełniającego urlopu macierzyńskiego"] : []),
      "Odpis skrócony aktu urodzenia dziecka",
    ],
    kontrola: (v, k) => {
      const o = okresOk(v, "od", "do", "Urlop uzupełniający");
      const min = k.P.ochronaWkladDni.uzupelniajacy;
      const d = roznica(v.dataZlozenia, v.koniecMac);
      if (d !== null && d < 0) o.push({ poziom: "blad", tekst: "Urlop macierzyński już się skończył – wniosek o urlop uzupełniający składa się przed jego końcem." });
      else if (d !== null && d < min) o.push({ poziom: "ostrzezenie", tekst: `Wniosek składa się co najmniej ${min} dni przed końcem urlopu macierzyńskiego (do ${D(plus(v.koniecMac, -min))}) – teraz jest ${d} dni.` });
      if (isoOk(v.koniecMac) && isoOk(v.od) && roznica(v.koniecMac, v.od) !== 1) o.push({ poziom: "ostrzezenie", tekst: `Urlop uzupełniający zaczyna się bezpośrednio po urlopie macierzyńskim – od ${D(plus(v.koniecMac, 1))}.` });
      return o;
    },
  },

  /* W21 – urlop ojcowski (§ 17) */
  W21: {
    tytul: "Wniosek o udzielenie urlopu ojcowskiego",
    zam: "zasiłek macierzyński za okres urlopu ojcowskiego",
    podstawa: "art. 182³ k.p.; § 17 rozporządzenia o wnioskach",
    pola: (k, dzis) => {
      const od = plus(dzis, k.P.ochronaWkladDni.ojcowski);
      return [
        ...polaDziecka(k),
        pole("od", "Urlop od", "date", od, { pomoc: `Najwcześniej ${k.P.ochronaWkladDni.ojcowski} dni od złożenia wniosku` }),
        pole("do", "Urlop do", "date", plus(od, k.P.tygodnieOjcowski * 7 - 1), { pomoc: "14 dni albo 2 części po co najmniej 7 dni" }),
        pole("czesc", "Część urlopu", "select", "calosc", { wymagane: false }),
      ];
    },
    opcje: { czesc: [["calosc", "cały urlop (14 dni)"], ["1", "pierwsza część"], ["2", "druga część"]] },
    oswiadczenia: (k) => [
      { id: "J14", tekst: "Oświadczam, że nie korzystałem dotychczas z urlopu ojcowskiego na to dziecko i zasiłek macierzyński za okres urlopu ojcowskiego nie został pobrany z innego tytułu.", domyslnie: k.ojcowskiZInnegoTytulu !== true },
    ],
    tresc: (v) => [
      `Na podstawie art. 182³ Kodeksu pracy proszę o udzielenie mi urlopu ojcowskiego${v.czesc === "1" ? " (pierwsza część)" : v.czesc === "2" ? " (druga część)" : ""} w okresie od ${D(v.od)} do ${D(v.do)}, w związku z urodzeniem dziecka: ${dziecko(v)}.`,
      ...(v.J14 ? ["Oświadczam, że nie korzystałem dotychczas z urlopu ojcowskiego na to dziecko, a zasiłek macierzyński za okres urlopu ojcowskiego nie został pobrany z innego tytułu."] : []),
    ],
    zalaczniki: () => ["Odpis skrócony aktu urodzenia dziecka (przy przysposobieniu – kopia prawomocnego postanowienia sądu)"],
    kontrola: (v, k) => {
      const o = [...okresOk(v, "od", "do", "Urlop ojcowski"), ...terminPrzed(v, "od", k.P.ochronaWkladDni.ojcowski, "Urlop")];
      const dni = dniOkresu(v, "od", "do");
      const max = k.P.tygodnieOjcowski * 7;
      if (dni !== null && v.czesc === "calosc" && dni !== max) o.push({ poziom: "ostrzezenie", tekst: `Cały urlop ojcowski to ${max} dni – wpisany okres ma ${dni} dni.` });
      if (dni !== null && v.czesc !== "calosc" && dni !== max / 2) o.push({ poziom: "blad", tekst: `Urlop ojcowski dzieli się na najwyżej 2 części, każda co najmniej tydzień – część to ${max / 2} dni, a wpisany okres ma ${dni} dni.` });
      if (isoOk(v.dzieckoUr) && isoOk(v.do)) {
        const ur = new Date(`${v.dzieckoUr}T00:00:00Z`);
        const limit = new Date(Date.UTC(ur.getUTCFullYear(), ur.getUTCMonth() + k.P.deadlineOjcowskiMies, ur.getUTCDate() - 1)).toISOString().slice(0, 10);
        if (v.do > limit) o.push({ poziom: "blad", tekst: `Urlop ojcowski trzeba wykorzystać do ukończenia przez dziecko ${k.P.deadlineOjcowskiMies} miesięcy – do ${D(limit)}.` });
      }
      return o;
    },
  },

  /* W25 – urlop rodzicielski (§ 15) */
  W25: {
    tytul: "Wniosek o udzielenie urlopu rodzicielskiego",
    zam: "zasiłek macierzyński za okres urlopu rodzicielskiego",
    podstawa: "art. 182¹a–182¹d k.p.; § 15 rozporządzenia o wnioskach",
    pola: (k) => [
      ...polaDziecka(k),
      pole("od", "Urlop od", "date", iso(k.profil.urlopy?.rodzicielskiOd)),
      pole("do", "Urlop do", "date", iso(k.profil.urlopy?.rodzicielskiDo)),
      pole("wykorzystanoTyg", "Dotychczas wykorzystany urlop rodzicielski (tygodnie)", "number", nieuj(k.rodzicielskiWykorzystanoTyg, 0), { wymagane: false }),
      pole("czesci", "Liczba wykorzystanych części urlopu", "number", nieuj(k.rodzicielskieCzesci, 0), { wymagane: false }),
      pole("drugiOkres", "Okres, w którym drugi rodzic zamierza korzystać z urlopu (puste = nie zamierza)", "text", "", { wymagane: false }),
    ],
    oswiadczenia: (k) => [
      { id: "J2", tekst: "Oświadczenie drugiego rodzica o tym, czy i kiedy zamierza korzystać z urlopu rodzicielskiego (do podpisu przez drugiego rodzica).", domyslnie: k.drugi },
      { id: "zaZyciem", tekst: "Dziecko ma zaświadczenie „Za życiem” (wymiar 65/67 tygodni).", domyslnie: k.zaZyciem },
    ],
    tresc: (v) => [
      `Na podstawie art. 182¹a Kodeksu pracy proszę o udzielenie mi urlopu rodzicielskiego${Number(v.czesci) > 0 ? ` (część ${Number(v.czesci) + 1})` : ""} w okresie od ${D(v.od)} do ${D(v.do)} na dziecko: ${dziecko(v)}.`,
      Number(v.wykorzystanoTyg) > 0
        ? `Dotychczas wykorzystałem/am ${Number(v.wykorzystanoTyg)} tyg. urlopu rodzicielskiego (liczba części: ${Number(v.czesci) || 1}).`
        : "Dotychczas nie korzystałem/am z urlopu rodzicielskiego na to dziecko.",
      ...(v.J2 ? [v.drugiOkres ? `Drugi rodzic zamierza korzystać z urlopu rodzicielskiego w okresie: ${v.drugiOkres} (oświadczenie w załączeniu).` : "Drugi rodzic nie zamierza korzystać z urlopu rodzicielskiego w okresie wskazanym we wniosku (oświadczenie w załączeniu)."] : []),
    ],
    zalaczniki: (v) => [
      "Odpis skrócony aktu urodzenia dziecka",
      ...(v.J2 ? ["Oświadczenie drugiego rodzica dotyczące urlopu rodzicielskiego"] : []),
      ...(v.zaZyciem ? ["Kopia zaświadczenia „Za życiem”"] : []),
    ],
    kontrola: (v, k) => {
      const o = [...okresOk(v, "od", "do", "Urlop rodzicielski"), ...terminPrzed(v, "od", k.P.ochronaWkladDni.rodzicielski, "Urlop")];
      const pula = tygodnieRodz(k.liczbaDzieci ?? 1, !!v.zaZyciem, k.typPrzyjecia === "rodzina_zastepcza", k.P);
      const dni = dniOkresu(v, "od", "do");
      if (dni !== null && dni % 7 !== 0) o.push({ poziom: "ostrzezenie", tekst: `Część urlopu rodzicielskiego to wielokrotność tygodnia – wpisany okres ma ${dni} dni.` });
      const razem = (Number(v.wykorzystanoTyg) || 0) + (dni ?? 0) / 7;
      if (dni !== null && razem > pula - (k.drugi ? k.P.wylaczneRodzicielskie : 0)) o.push({ poziom: "blad", tekst: `Jeden rodzic może wykorzystać najwyżej ${pula - (k.drugi ? k.P.wylaczneRodzicielskie : 0)} z ${pula} tygodni (${k.P.wylaczneRodzicielskie} tyg. przysługuje wyłącznie drugiemu rodzicowi) – razem wychodzi ${String(Math.round(razem * 10) / 10).replace(".", ",")} tyg.` });
      if ((Number(v.czesci) || 0) >= k.P.maxCzesci) o.push({ poziom: "blad", tekst: `Urlop rodzicielski można podzielić na najwyżej ${k.P.maxCzesci} części.` });
      return o;
    },
  },

  /* W12 – łączenie urlopu rodzicielskiego z pracą (§ 16) */
  W12: {
    tytul: "Wniosek o podjęcie pracy w trakcie urlopu rodzicielskiego",
    zam: "zasiłek przy łączeniu urlopu rodzicielskiego z pracą",
    podstawa: "art. 182¹e k.p.; § 16 rozporządzenia o wnioskach",
    pola: (k) => [
      pole("od", "Praca od", "date", ""),
      pole("do", "Praca do", "date", iso(k.profil.urlopy?.rodzicielskiDo)),
      pole("wymiar", "Wymiar czasu pracy (np. 1/2 etatu)", "text", k.wymiarPracyPrzyLaczeniu === "do_polowy" ? "1/2 etatu" : ""),
      pole("wydluzenie", "Praca także w części urlopu powstałej z wydłużenia (pole I14)", "select", "tak", { wymagane: false }),
    ],
    opcje: { wydluzenie: [["tak", "tak, w tym samym wymiarze"], ["nie", "nie"]] },
    oswiadczenia: () => [],
    tresc: (v) => [
      `Na podstawie art. 182¹e Kodeksu pracy proszę o umożliwienie mi łączenia korzystania z urlopu rodzicielskiego z wykonywaniem pracy w wymiarze ${T(v.wymiar)} w okresie od ${D(v.od)} do ${D(v.do)}.`,
      v.wydluzenie === "nie"
        ? "Nie zamierzam łączyć z pracą części urlopu rodzicielskiego powstałej z jego wydłużenia."
        : `Zamierzam łączyć z pracą także część urlopu rodzicielskiego powstałą z jego wydłużenia, w wymiarze ${T(v.wymiar)}.`,
    ],
    zalaczniki: () => [],
    kontrola: (v, k) => {
      const o = [...okresOk(v, "od", "do", "Okres pracy"), ...terminPrzed(v, "od", k.P.ochronaWkladDni.rodzicielski, "Praca")];
      const m = String(v.wymiar ?? "").match(/(\d+)\s*\/\s*(\d+)/);
      if (m && Number(m[1]) / Number(m[2]) > k.P.maksEtuLaczenie) o.push({ poziom: "blad", tekst: `Przy łączeniu z urlopem rodzicielskim można pracować najwyżej na ${k.P.maksEtuLaczenie === 0.5 ? "½" : k.P.maksEtuLaczenie} etatu.` });
      return o;
    },
  },

  /* W28 – urlop na warunkach urlopu macierzyńskiego (§ 18) */
  W28: {
    tytul: "Wniosek o udzielenie urlopu na warunkach urlopu macierzyńskiego",
    zam: "zasiłek za okres urlopu na warunkach urlopu macierzyńskiego",
    podstawa: "art. 183 k.p.; § 18 rozporządzenia o wnioskach",
    pola: (k) => {
      const d = pobierzDaneDziecka(k.profil);
      const przyj = iso(d.dataPrzyjecia);
      return [
        ...polaDziecka(k),
        pole("przyjecie", "Data przyjęcia dziecka na wychowanie", "date", przyj),
        pole("od", "Urlop od", "date", przyj, { pomoc: "Najpóźniej 21 dni od przyjęcia dziecka" }),
        pole("do", "Urlop do", "date", przyj ? plus(przyj, tygDzieci(k) * 7 - 1) : "", { pomoc: `${tygDzieci(k)} tygodni – przy starszym dziecku wymiar może być krótszy (min. 9 tyg.)` }),
      ];
    },
    oswiadczenia: () => [],
    tresc: (v, k) => [
      `Na podstawie art. 183 Kodeksu pracy proszę o udzielenie mi urlopu na warunkach urlopu macierzyńskiego w okresie od ${D(v.od)} do ${D(v.do)}, w związku z przyjęciem na wychowanie dziecka: ${dziecko(v)}${k.typPrzyjecia === "przysposobienie" ? " i wystąpieniem do sądu opiekuńczego z wnioskiem o wszczęcie postępowania w sprawie jego przysposobienia" : " jako rodzina zastępcza (z wyjątkiem rodziny zastępczej zawodowej)"}.`,
      `Oświadczam, że dziecko przyjąłem/am na wychowanie dnia ${D(v.przyjecie)}.`,
    ],
    zalaczniki: (v, k) => k.typPrzyjecia === "przysposobienie"
      ? ["Kopia wniosku o wszczęcie postępowania w sprawie przysposobienia z poświadczeniem sądu (albo zaświadczenie sądu opiekuńczego) – z datą urodzenia dziecka"]
      : ["Orzeczenie sądu opiekuńczego o umieszczeniu dziecka w rodzinie zastępczej albo umowa ze starostą", "Dokument potwierdzający wiek dziecka"],
    kontrola: (v) => {
      const o = okresOk(v, "od", "do", "Urlop");
      const zl = roznica(v.przyjecie, v.dataZlozenia);
      if (zl !== null && zl > 7) o.push({ poziom: "ostrzezenie", tekst: `Wniosek składa się w ciągu 7 dni od przyjęcia dziecka – minęło ${zl} dni.` });
      const start = roznica(v.przyjecie, v.od);
      if (start !== null && start > 21) o.push({ poziom: "blad", tekst: "Urlop musi zacząć się najpóźniej 21 dni od przyjęcia dziecka." });
      return o;
    },
  },

  /* W11 – urlop wychowawczy (§ 19) */
  W11: {
    tytul: "Wniosek o udzielenie urlopu wychowawczego",
    zam: "urlop wychowawczy (tylko dla pracowników)",
    podstawa: "art. 186 k.p.; § 19 rozporządzenia o wnioskach",
    pola: (k) => [
      ...polaDziecka(k),
      pole("od", "Urlop od", "date", ""),
      pole("do", "Urlop do", "date", ""),
      pole("wykorzystanoMies", "Dotychczas wykorzystany urlop wychowawczy (miesiące)", "number", nieuj(k.wychowawczyWykorzystanoMies, 0), { wymagane: false }),
    ],
    oswiadczenia: (k) => [
      { id: "J20", tekst: "Oświadczenie drugiego rodzica o tym, czy i kiedy zamierza korzystać z urlopu wychowawczego (do podpisu przez drugiego rodzica).", domyslnie: k.drugi },
    ],
    tresc: (v) => [
      `Na podstawie art. 186 Kodeksu pracy proszę o udzielenie mi urlopu wychowawczego w okresie od ${D(v.od)} do ${D(v.do)} w celu sprawowania osobistej opieki nad dzieckiem: ${dziecko(v)}.`,
      Number(v.wykorzystanoMies) > 0
        ? `Dotychczas wykorzystałem/am ${Number(v.wykorzystanoMies)} mies. urlopu wychowawczego na to dziecko.`
        : "Dotychczas nie korzystałem/am z urlopu wychowawczego na to dziecko.",
    ],
    zalaczniki: (v) => (v.J20 ? ["Oświadczenie drugiego rodzica dotyczące urlopu wychowawczego"] : []),
    kontrola: (v, k) => {
      const o = [...okresOk(v, "od", "do", "Urlop wychowawczy"), ...terminPrzed(v, "od", 21, "Urlop")];
      const dni = dniOkresu(v, "od", "do");
      if (dni !== null && (Number(v.wykorzystanoMies) || 0) + dni / 30.4 > 36) o.push({ poziom: "blad", tekst: "Urlop wychowawczy to łącznie najwyżej 36 miesięcy." });
      return o;
    },
  },
};
/** Warianty, dla których jest druk. */
export const DRUKI = Object.keys(SZABLONY);
export const maDruk = (wariantId) => Object.hasOwn(SZABLONY, wariantId);

/**
 * @param {object} profil  profil z GET /api/profile
 * @param {string} wariantId  np. "W21"
 * @param {{ dzis?: string|Date, params?: object, wartosci?: object }} [opcje]
 */
export function przygotujDruk(profil, wariantId, { dzis, params = DEFAULT_PARAMS, wartosci = {} } = {}) {
  const s = SZABLONY[wariantId];
  if (!s) return null;
  const k = kontekstSprawy(profil ?? {}, { dzis, params });
  const dzisIso = iso(k.dzis);
  const u = k.profil.ubezpieczony ?? {};
  const pl = k.profil.platnik ?? {};
  const pracodawca = k.pracownik !== false;

  const pola = [
    pole("miejscowosc", "Miejscowość", "text", miejscowoscZAdresu(u.adres)),
    pole("dataZlozenia", "Data złożenia wniosku", "date", dzisIso),
    ...s.pola(k, dzisIso),
  ].map((p) => (Object.hasOwn(wartosci, p.id) ? { ...p, wartosc: wartosci[p.id] ?? "", zmienione: true } : p));
  const oswiadczenia = s.oswiadczenia(k).map((o) => ({ ...o, zaznaczone: Object.hasOwn(wartosci, o.id) ? !!wartosci[o.id] : !!o.domyslnie }));

  const v = Object.fromEntries([...pola.map((p) => [p.id, p.wartosc]), ...oswiadczenia.map((o) => [o.id, o.zaznaczone])]);
  const brakujace = pola.filter((p) => p.wymagane && String(p.wartosc ?? "").trim() === "").map((p) => p.etykieta);
  const ostrzezenia = [
    ...(!u.adres ? [{ poziom: "info", tekst: "Brak adresu w „Moje dane” – wpisz go ręcznie na wydruku." }] : []),
    ...(pracodawca && !pl.nazwa ? [{ poziom: "info", tekst: "Brak nazwy pracodawcy w „Moje dane” – wpisz ją ręcznie na wydruku." }] : []),
    ...(pola.some((p) => p.typ === "date" && p.wartosc && !isoOk(p.wartosc)) ? [{ poziom: "blad", tekst: "Któraś z dat ma zły format." }] : []),
    ...s.kontrola(v, k),
  ];

  return {
    id: wariantId,
    tytul: pracodawca ? s.tytul : `Dane do wniosku ZAM (eZUS) – ${s.zam}`,
    tryb: pracodawca ? "pracodawca" : "zam",
    podstawa: s.podstawa,
    pewnosc: "do_potwierdzenia",
    naglowek: {
      miejscowoscData: `${T(v.miejscowosc)}, ${D(v.dataZlozenia)}`,
      nadawca: [`${u.imie ?? ""} ${u.nazwisko ?? ""}`.trim() || T(""), u.adres || T("")],
      adresat: pracodawca ? [pl.nazwa || T(""), pl.adres || ""].filter(Boolean) : ["Zakład Ubezpieczeń Społecznych (eZUS)"],
    },
    pola,
    opcje: s.opcje ?? {},
    oswiadczenia,
    tresc: s.tresc(v, k),
    zalaczniki: s.zalaczniki(v, k),
    ostrzezenia,
    brakujace,
  };
}
