/* =====================================================================
   REJESTR WNIOSKÓW I WARIANTÓW (wymóg mentorów ZUS: „każdy wariant”).

   Źródło merytoryczne: docs/01-katalog-swiadczen-2026.md (warianty W1–W50)
   i docs/02-dane-do-wnioskow-2026.md (pola, dokumenty, terminy).
   Oba dokumenty to szkic przygotowany z pomocą AI – miejsca niepewne mają
   `pewnosc: "do_potwierdzenia"` i opis w `uwaga`.

   Wariant:
     id, wniosek, nazwa, kto: role, które mogą złożyć (matka/ojciec/inny),
     etapy: na jakim etapie sprawy ma sens (ciaza/po_porodzie/przyjecie),
     warunki(k) → [{ tekst, ok: true|false|null, pola: [ścieżki profilu] }],
     wymiar(k)/wysokosc(k) → opis (tekst), adresat, formularz, termin,
     dokumenty, potrzebnePola (do wypełnienia wniosku), podstawa prawna.
   `typ: "informacja"` – uprawnienie/zasada pokazywana zawsze, bez oceny.
   ===================================================================== */
import { tygodnieMac, tygodnieRodz } from "../helpers.js";

// Warunek: ok = true (spełniony) / false (niespełniony) / null (brak danych w profilu).
const w = (tekst, ok, pola = []) => ({ tekst, ok: ok === undefined ? null : ok, pola });
const jest = (v) => (v === null || v === undefined ? null : !!v);
const niePrawda = (v) => (v === null || v === undefined ? null : !v);
const ge = (v, min) => (v === null || v === undefined ? null : v >= min);
const fmtD = (d) => (d ? d.toLocaleDateString("pl-PL") : "?");
const plusDni = (d, n) => (d ? new Date(d.getTime() + n * 86400000) : null);

/* ---------- etykiety pól profilu (do listy „brakuje danych”) ---------- */
export const POLA = {
  "sytuacja.etap": "Etap (ciąża / po porodzie / przyjęcie dziecka)",
  "sytuacja.rola": "Kim jesteś dla dziecka",
  "sytuacja.typPrzyjecia": "Rodzaj przyjęcia dziecka",
  "ubezpieczony.statusUbezpieczenia": "Tytuł ubezpieczenia",
  "ubezpieczony.ubezpieczenieOd": "Data początku ubezpieczenia chorobowego",
  "ubezpieczony.zaleglosci": "Zaległości w składkach ZUS",
  "ubezpieczony.ubezpieczenieUstalo": "Czy ubezpieczenie wygasło przed porodem",
  "ubezpieczony.dataUstania": "Data ustania ubezpieczenia",
  "ubezpieczony.przyczynaUstania": "Przyczyna ustania ubezpieczenia",
  "ubezpieczony.zapewnionoInnaPrace": "Czy pracodawca zapewnił inne zatrudnienie",
  "ubezpieczony.podstawaWymiaru": "Podstawa wymiaru zasiłku",
  "ubezpieczony.wiecejNizJedenTytul": "Więcej niż jeden tytuł do ubezpieczenia",
  "ubezpieczony.zatrudnionyOd": "Data zatrudnienia w obecnej firmie",
  "ubezpieczony.adres": "Adres zamieszkania",
  "ubezpieczony.rachunek": "Numer rachunku bankowego",
  "platnik.nazwa": "Nazwa pracodawcy / płatnika",
  "platnik.nip": "NIP pracodawcy / płatnika",
  "platnik.liczbaUbezpieczonych": "Liczba ubezpieczonych u pracodawcy",
  "dziecko.przewidywanaDataPorodu": "Przewidywana data porodu",
  "dziecko.dataUrodzenia": "Data urodzenia dziecka",
  "dziecko.liczbaDzieci": "Liczba dzieci z jednego porodu",
  "dziecko.liczbaZyjacych": "Liczba dzieci pozostałych przy życiu",
  "dziecko.imie": "Imię dziecka",
  "dziecko.nazwisko": "Nazwisko dziecka",
  "dziecko.pesel": "PESEL dziecka",
  "dziecko.martwe": "Czy dziecko urodziło się martwe",
  "dziecko.zmarlo": "Czy dziecko zmarło po urodzeniu",
  "dziecko.dataZgonu": "Data zgonu dziecka",
  "dziecko.zaGranica": "Czy dziecko urodziło się za granicą",
  "dziecko.pobytWSzpitalu": "Pobyt dziecka w szpitalu po porodzie",
  "dziecko.tydzienCiazy": "Tydzień ciąży w chwili porodu",
  "dziecko.masaUrodzenia": "Masa urodzeniowa",
  "dziecko.szpitalOd": "Pobyt dziecka w szpitalu – od",
  "dziecko.dataPrzyjecia": "Data przyjęcia dziecka na wychowanie",
  "dziecko.odroczonySzkolny": "Odroczony obowiązek szkolny",
  "dziecko.niepelnosprawne": "Orzeczenie o niepełnosprawności dziecka",
  "drugiRodzic.statusUbezpieczenia": "Tytuł ubezpieczenia drugiego rodzica",
  "drugiRodzic.okolicznosc": "Okoliczność dotycząca matki (zgon, szpital, orzeczenie…)",
  "drugiRodzic.dataOkolicznosci": "Data zdarzenia dotyczącego matki",
  "drugiRodzic.pesel": "PESEL drugiego rodzica",
  "drugiRodzic.imie": "Imię drugiego rodzica",
  "drugiRodzic.nazwisko": "Nazwisko drugiego rodzica",
  "zdrowie.zwolnienie": "Zwolnienie lekarskie (e-ZLA) i kod",
  "zdrowie.zlaOd": "Początek zwolnienia",
  "zdrowie.wczesniejszeZwolnienia": "Wcześniejsze zwolnienia bez kodu B",
  "zdrowie.okresZasilkowyWyczerpany": "Czy wyczerpał się okres zasiłkowy",
  "zdrowie.rokowaniaPoprawy": "Rokowania odzyskania zdolności do pracy",
  "zdrowie.wypadekWDrodze": "Wypadek w drodze do/z pracy",
  "urlopy.zamiarPelnyWymiar": "Zamiar wykorzystania pełnego urlopu macierzyńskiego i rodzicielskiego",
  "urlopy.macierzynskiWykorzystanoTyg": "Wykorzystane tygodnie urlopu macierzyńskiego po porodzie",
  "urlopy.matkaRezygnuje": "Czy matka rezygnuje z reszty urlopu na rzecz ojca",
  "urlopy.planUzupelniajacy": "Plan uzupełniającego urlopu macierzyńskiego",
  "urlopy.terminKoncaMacierzynskiego": "Termin zakończenia urlopu macierzyńskiego",
  "urlopy.drugiRodzicUzupelniajacy": "Czy drugi rodzic bierze urlop uzupełniający",
  "urlopy.ojcowskiZInnegoTytulu": "Czy zasiłek za urlop ojcowski pobrano z innego tytułu",
  "urlopy.rodzicielskieCzesci": "Wykorzystane części urlopu rodzicielskiego",
  "urlopy.rodzicielskiWykorzystanoTyg": "Wykorzystane tygodnie urlopu rodzicielskiego",
  "urlopy.laczenieZPraca": "Łączenie urlopu rodzicielskiego z pracą",
  "urlopy.wymiarPracyPrzyLaczeniu": "Wymiar pracy przy łączeniu z urlopem",
  "urlopy.planWychowawczy": "Plan urlopu wychowawczego",
  "urlopy.wychowawczyWykorzystanoMies": "Wykorzystane miesiące urlopu wychowawczego",
  "urlopy.potrzebaOpieki": "Powód zasiłku opiekuńczego",
  "urlopy.domownikMozeOpiekowac": "Czy domownik może zapewnić opiekę",
  "urlopy.opiekunczyDniWRoku": "Wykorzystane dni zasiłku opiekuńczego w roku",
};

/* ---------- wspólne warunki ---------- */
const ubezpieczonyWDniuPorodu = (k) =>
  w("Podlegasz ubezpieczeniu chorobowemu w dniu porodu / przyjęcia dziecka", k.ubezpieczonyWDniuZdarzenia,
    ["ubezpieczony.statusUbezpieczenia", "ubezpieczony.ubezpieczenieUstalo", "ubezpieczony.dataUstania"]);
const bezZadluzenia = (k) =>
  w(`Brak zaległości w składkach powyżej ${k.P.progZaleglosci} zł (art. 2a)`, niePrawda(k.blokadaZadluzenia), ["ubezpieczony.zaleglosci"]);
const maChorobowe = (k) => w("Masz ubezpieczenie chorobowe", k.maChorobowe, ["ubezpieczony.statusUbezpieczenia"]);
const jestPracownikiem = (k) =>
  w("Jesteś pracownikiem (umowa o pracę, powołanie, mianowanie)", k.pracownik, ["ubezpieczony.statusUbezpieczenia"]);
const dzieckoZyje = (k) =>
  w("Dziecko żyje (inaczej – wariant „martwe urodzenie / zgon dziecka”)",
    k.martwe === true || k.zmarlo === true ? false : k.etap === "ciaza" ? true : k.martwe === null ? null : true,
    ["dziecko.martwe", "dziecko.zmarlo"]);
const matkaUbezpieczona = (k) =>
  w("Matka dziecka ma ubezpieczenie chorobowe", k.matkaMaChorobowe, ["drugiRodzic.statusUbezpieczenia"]);
const matkaNieubezpieczona = (k) =>
  w("Matka dziecka nie ma tytułu do ubezpieczenia chorobowego", niePrawda(k.matkaMaChorobowe), ["drugiRodzic.statusUbezpieczenia"]);
const okolicznosc = (k, lista, tekst) =>
  w(tekst, k.okolicznosc === null ? null : lista.includes(k.okolicznosc), ["drugiRodzic.okolicznosc"]);
const matkaWykorzystala = (k, tyg) =>
  w(`Matka wykorzystała po porodzie co najmniej ${tyg} tygodni urlopu macierzyńskiego`, ge(k.macierzynskiWykorzystanoTyg, tyg),
    ["urlopy.macierzynskiWykorzystanoTyg"]);

const ADRES_ZASILKU = (k) => {
  if (["dg", "wspolpraca", "duchowny", "marynarz"].includes(k.tytul)) return "ZUS (wniosek ZAM / eZUS)";
  if (k.liczbaUbezpieczonych === "powyzej_20") return "Pracodawca – sam wypłaca zasiłek (zgłasza > 20 osób)";
  if (k.liczbaUbezpieczonych === "do_20") return "Pracodawca – przekazuje dokumenty do ZUS w 7 dni, zasiłek wypłaca ZUS";
  return "Pracodawca albo ZUS – zależy od liczby ubezpieczonych u pracodawcy (próg 20 osób)";
};
const ADRES_URLOPU = (k) =>
  k.pracownik === false
    ? `Wniosek o zasiłek: ${ADRES_ZASILKU(k)} (osobie, która nie jest pracownikiem, nie udziela się urlopu – zasiłek za okres odpowiadający urlopowi)`
    : `Wniosek o urlop: pracodawca. Zasiłek: ${ADRES_ZASILKU(k)}`;

const BAZA = ["ubezpieczony.adres", "ubezpieczony.rachunek"];
const PLATNIK = ["platnik.nazwa", "platnik.nip"];
const DZIECKO = ["dziecko.imie", "dziecko.nazwisko", "dziecko.dataUrodzenia"];
const AKT = "Odpis skrócony aktu urodzenia (gdy zasiłek wypłaca ZUS – nie trzeba, ZUS pobiera dane z rejestru stanu cywilnego)";

/* ---------- uzupełniający urlop: wymiar z hospitalizacji ---------- */
export function uzupelniajacyWymiar(k) {
  if (!k.szpitalOd || !k.tydzienCiazy) return null;
  const koniec = k.szpitalDo ?? k.dzis;
  const dniPobytu = Math.round((koniec - k.szpitalOd) / 86400000) + 1;
  const wczesny = k.tydzienCiazy === "ponizej_28" || (k.masa !== null && k.masa <= 1000);
  const limit = wczesny ? k.P.uzupełniajacyLimitWczesny : k.P.uzupełniajacyLimitPozny;
  return { dniPobytu, limit, tygodnie: Math.min(limit, Math.ceil(dniPobytu / 7)) };
}

/* =====================================================================
   WNIOSKI – to wybiera rodzic („co chcesz złożyć?”)
   ===================================================================== */
export const WNIOSKI = [
  { id: "chorobowy", nazwa: "Zasiłek chorobowy w ciąży", opis: "Zwolnienie lekarskie w ciąży: wynagrodzenie chorobowe, zasiłek 100%, okres zasiłkowy 270 dni." },
  { id: "rehabilitacyjne", nazwa: "Świadczenie rehabilitacyjne", opis: "Po wyczerpaniu okresu zasiłkowego, gdy leczenie rokuje powrót do pracy." },
  { id: "przed_porodem_po_utracie_pracy", nazwa: "Zasiłek po utracie pracy w ciąży", opis: "Upadłość, likwidacja lub śmierć pracodawcy w czasie ciąży." },
  { id: "macierzynski", nazwa: "Zasiłek macierzyński (urlop macierzyński)", opis: "Dla matki po porodzie, także przed porodem, przy porodzie mnogim, po stracie dziecka, za granicą." },
  { id: "wysokosc", nazwa: "Wysokość zasiłku macierzyńskiego", opis: "Wariant 81,5% albo 100% + 70%, wyrównanie, podwyższenie do świadczenia rodzicielskiego." },
  { id: "przejecie", nazwa: "Przejęcie urlopu macierzyńskiego", opis: "Ojciec albo inny członek rodziny przejmuje urlop matki (rezygnacja, szpital, orzeczenie, zgon, porzucenie, matka nieubezpieczona)." },
  { id: "uzupelniajacy", nazwa: "Uzupełniający urlop macierzyński", opis: "Wcześniak albo dziecko w szpitalu po porodzie – do 8 lub 15 tygodni." },
  { id: "ojcowski", nazwa: "Urlop ojcowski", opis: "2 tygodnie wyłącznie dla ojca, do 12. miesiąca życia dziecka." },
  { id: "rodzicielski", nazwa: "Urlop rodzicielski", opis: "41/43 tygodnie (65/67 „Za życiem”) dla obojga rodziców, w tym łączenie z pracą." },
  { id: "adopcja", nazwa: "Urlop na warunkach urlopu macierzyńskiego", opis: "Adopcja i rodzina zastępcza (niezawodowa)." },
  { id: "wychowawczy", nazwa: "Urlop wychowawczy", opis: "Do 36 miesięcy – bez zasiłku, składki opłaca budżet państwa." },
  { id: "opiekunczy", nazwa: "Zasiłek opiekuńczy", opis: "Opieka nad chorym dzieckiem lub członkiem rodziny, zamknięcie żłobka, choroba niani." },
  { id: "pogrzebowy", nazwa: "Zasiłek pogrzebowy", opis: "Po urodzeniu martwego dziecka lub zgonie dziecka – 7 000 zł." },
  { id: "poza_zus", nazwa: "Gdy nie masz prawa do zasiłków z ZUS", opis: "Świadczenie rodzicielskie (gmina) i inne systemy." },
];

/* =====================================================================
   WARIANTY
   ===================================================================== */
export const WARIANTY = [
  /* ---------------- zasiłek chorobowy w ciąży ---------------- */
  {
    id: "W35", wniosek: "chorobowy", nazwa: "Wynagrodzenie chorobowe 100% w ciąży (pierwsze 33 dni)",
    kto: ["matka"], etapy: ["ciaza"],
    warunki: (k) => [
      jestPracownikiem(k),
      w("Masz zwolnienie z kodem B (choroba w ciąży)", k.zwolnienie === null ? null : k.zwolnienie === "B", ["zdrowie.zwolnienie"]),
      w(`Minął okres wyczekiwania (${k.okresWyczekiwania} dni ubezpieczenia)`, k.wyczekiwanieSpelnione, ["ubezpieczony.ubezpieczenieOd"]),
    ],
    wymiar: () => "33 dni w roku kalendarzowym (14 dni po 50. roku życia), potem zasiłek chorobowy",
    wysokosc: () => "100% podstawy (bez kodu B: 80%)",
    adresat: () => "Pracodawca – wypłaca z własnych środków",
    formularz: "e-ZLA trafia do pracodawcy automatycznie – nic nie składasz",
    termin: "Zwolnienie przekazuje lekarz; pracodawca wypłaca w terminie wypłaty wynagrodzenia",
    dokumenty: ["e-ZLA z kodem B"],
    potrzebnePola: [],
    podstawa: "art. 92 § 1 pkt 2 k.p.",
  },
  {
    id: "W34", wniosek: "chorobowy", nazwa: "Zasiłek chorobowy 100% w ciąży (do 270 dni)",
    kto: ["matka"], etapy: ["ciaza"],
    warunki: (k) => [
      maChorobowe(k),
      w("Masz zwolnienie z kodem B (choroba w ciąży)", k.zwolnienie === null ? null : k.zwolnienie === "B", ["zdrowie.zwolnienie"]),
      w(`Minął okres wyczekiwania (${k.okresWyczekiwania} dni ubezpieczenia)`, k.wyczekiwanieSpelnione, ["ubezpieczony.ubezpieczenieOd"]),
      bezZadluzenia(k),
    ],
    wymiar: (k) => (k.pracownik ? "Od 34. dnia niezdolności w roku (wcześniej wynagrodzenie chorobowe), łącznie do 270 dni" : "Od 1. dnia niezdolności, do 270 dni"),
    wysokosc: () => "100% podstawy wymiaru",
    adresat: ADRES_ZASILKU,
    formularz: "Pracownik: nic nie składa (e-ZLA + Z-3 od pracodawcy). Działalność / zlecenie u małego płatnika: ZAS-53 do ZUS",
    termin: "e-ZLA wystawia lekarz; wniosek bez zbędnej zwłoki – roszczenie przedawnia się po 6 miesiącach",
    dokumenty: ["e-ZLA z kodem B", "Zaświadczenie płatnika Z-3 / Z-3a (wystawia płatnik)"],
    potrzebnePola: [...BAZA, ...PLATNIK],
    podstawa: "art. 6, 8, 11 ust. 2 pkt 1 ustawy zasiłkowej",
  },
  {
    id: "W36", wniosek: "chorobowy", nazwa: "Nowy okres zasiłkowy dzięki kodowi B",
    kto: ["matka"], etapy: ["ciaza"],
    warunki: (k) => [
      w("Masz zwolnienie z kodem B", k.zwolnienie === null ? null : k.zwolnienie === "B", ["zdrowie.zwolnienie"]),
      w("Wcześniej chorowałaś na zwolnieniach bez kodu B", k.wczesniejszeZwolnienia, ["zdrowie.wczesniejszeZwolnienia"]),
    ],
    wymiar: () => "Okres zasiłkowy (270 dni) liczy się od nowa, nawet po przerwie krótszej niż 60 dni",
    wysokosc: () => "100%",
    adresat: ADRES_ZASILKU,
    formularz: "Nic dodatkowo – wystarczy kod B na e-ZLA",
    termin: "—",
    dokumenty: ["e-ZLA z kodem B"],
    potrzebnePola: [],
    podstawa: "art. 9 ust. 2 ustawy zasiłkowej",
  },
  {
    id: "W46", wniosek: "chorobowy", nazwa: "Zasiłek po wypadku w drodze do/z pracy",
    kto: ["matka", "ojciec", "inny"],
    warunki: (k) => [maChorobowe(k), w("Niezdolność wynika z wypadku w drodze do/z pracy", k.wypadekWDrodze, ["zdrowie.wypadekWDrodze"])],
    wymiar: () => "Od 1. dnia ubezpieczenia (bez okresu wyczekiwania)",
    wysokosc: () => "100% podstawy",
    adresat: ADRES_ZASILKU,
    formularz: "Jak przy zasiłku chorobowym + karta wypadku",
    termin: "—",
    dokumenty: ["e-ZLA", "Karta wypadku w drodze do/z pracy"],
    potrzebnePola: [...BAZA, ...PLATNIK],
    podstawa: "art. 4 ust. 3 pkt 2, art. 11 ust. 2 pkt 2 ustawy zasiłkowej",
  },
  {
    id: "W47", wniosek: "chorobowy", nazwa: "Zasiłek chorobowy po ustaniu ubezpieczenia",
    kto: ["matka", "ojciec", "inny"],
    warunki: (k) => [
      w("Ubezpieczenie chorobowe ustało", k.ustalo, ["ubezpieczony.ubezpieczenieUstalo"]),
      w("Niezdolność zaczęła się najpóźniej 14 dni po ustaniu ubezpieczenia",
        k.ustalo !== true ? null : k.zlaOd && k.dataUstania ? k.zlaOd > k.dataUstania && k.zlaOd <= plusDni(k.dataUstania, 14) : null,
        ["zdrowie.zlaOd", "ubezpieczony.dataUstania"]),
    ],
    wymiar: () => "Do 91 dni; jeśli niezdolność przypada w ciąży – do 270 dni",
    wysokosc: () => "80% (w ciąży 100%)",
    adresat: () => "ZUS",
    formularz: "Wniosek + oświadczenie o okolicznościach po ustaniu ubezpieczenia (zał. 4 rozporządzenia)",
    termin: "—",
    dokumenty: ["e-ZLA", "Oświadczenie po ustaniu ubezpieczenia (praca zarobkowa, emerytura, zasiłek dla bezrobotnych…)"],
    potrzebnePola: [...BAZA],
    podstawa: "art. 7, 8 ust. 2 ustawy zasiłkowej",
    pewnosc: "do_potwierdzenia",
    uwaga: "Dla części chorób zakaźnych termin jest dłuższy niż 14 dni – zweryfikować z art. 7 ust. 2.",
  },
  {
    id: "W36b", wniosek: "chorobowy", nazwa: "Zwolnienie w ciąży bez kodu B (na własne życzenie)",
    kto: ["matka"], etapy: ["ciaza"],
    warunki: (k) => [maChorobowe(k), w("Masz zwolnienie bez kodu B", k.zwolnienie === null ? null : k.zwolnienie === "bez_B", ["zdrowie.zwolnienie"])],
    wymiar: () => "Okres zasiłkowy 182 dni",
    wysokosc: () => "80% podstawy",
    adresat: ADRES_ZASILKU,
    formularz: "Pisemny wniosek do lekarza o nieumieszczanie kodu B",
    termin: "—",
    dokumenty: ["e-ZLA bez kodu B"],
    potrzebnePola: [],
    podstawa: "art. 57 ust. 2 ustawy zasiłkowej",
  },

  /* ---------------- świadczenie rehabilitacyjne ---------------- */
  {
    id: "W37", wniosek: "rehabilitacyjne", nazwa: "Świadczenie rehabilitacyjne",
    kto: ["matka", "ojciec", "inny"],
    warunki: (k) => [
      maChorobowe(k),
      w("Wyczerpał się okres zasiłkowy (182 / 270 dni)", k.okresZasilkowyWyczerpany, ["zdrowie.okresZasilkowyWyczerpany"]),
      w("Lekarz ocenia, że dalsze leczenie przywróci zdolność do pracy", k.rokowaniaPoprawy, ["zdrowie.rokowaniaPoprawy"]),
    ],
    wymiar: () => "Do 12 miesięcy (orzeka lekarz orzecznik ZUS)",
    wysokosc: (k) => (k.etap === "ciaza" ? "100% w ciąży" : "90% przez 3 miesiące, potem 75%"),
    adresat: () => "ZUS",
    formularz: "ZAS-14A (wniosek o świadczenie rehabilitacyjne)",
    termin: "Najpóźniej 6 tygodni przed końcem okresu zasiłkowego",
    dokumenty: ["Zaświadczenie o stanie zdrowia (nie starsze niż miesiąc)", "Wywiad zawodowy z miejsca pracy (pracownicy)"],
    potrzebnePola: [...BAZA, ...PLATNIK],
    podstawa: "art. 18–22 ustawy zasiłkowej",
  },

  /* ---------------- utrata pracy w ciąży ---------------- */
  {
    id: "W38", wniosek: "przed_porodem_po_utracie_pracy", nazwa: "Zasiłek w wysokości zasiłku macierzyńskiego do dnia porodu",
    kto: ["matka"], etapy: ["ciaza"],
    warunki: (k) => [
      jestPracownikiem(k),
      w("Umowa ustała w ciąży", k.ustalo, ["ubezpieczony.ubezpieczenieUstalo"]),
      w("Przyczyna: upadłość, likwidacja albo śmierć pracodawcy",
        k.ustalo !== true ? null : k.przyczynaUstania === null ? null : ["upadlosc", "likwidacja", "smierc_pracodawcy"].includes(k.przyczynaUstania),
        ["ubezpieczony.przyczynaUstania"]),
      w("Nie zapewniono Ci innego zatrudnienia", niePrawda(k.zapewnionoInnaPrace), ["ubezpieczony.zapewnionoInnaPrace"]),
    ],
    wymiar: () => "Od ustania umowy do dnia porodu, potem zasiłek macierzyński",
    wysokosc: () => "100% podstawy",
    adresat: () => "ZUS",
    formularz: "Wniosek z danymi z zał. 6 rozporządzenia + dokumenty z § 17",
    termin: "—",
    dokumenty: [
      "Zaświadczenie lekarskie o ciąży w okresie zatrudnienia",
      "Świadectwo pracy (z przyczyną: upadłość / likwidacja / śmierć pracodawcy)",
      "Oświadczenie, że nie zapewniono innego zatrudnienia",
    ],
    potrzebnePola: [...BAZA, "dziecko.przewidywanaDataPorodu"],
    podstawa: "art. 30 ust. 3 ustawy zasiłkowej",
  },

  /* ---------------- zasiłek macierzyński (matka) ---------------- */
  {
    id: "W1", wniosek: "macierzynski", nazwa: "Urlop i zasiłek macierzyński po porodzie",
    kto: ["matka"], etapy: ["ciaza", "po_porodzie"],
    warunki: (k) => [ubezpieczonyWDniuPorodu(k), bezZadluzenia(k), dzieckoZyje(k)],
    wymiar: (k) => (k.liczbaDzieci ? `${tygodnieMac(k.liczbaDzieci, k.P)} tygodni (${k.liczbaDzieci} ${k.liczbaDzieci === 1 ? "dziecko" : "dzieci"}); pierwsze 14 tygodni tylko matka` : "20–37 tygodni zależnie od liczby dzieci"),
    wysokosc: () => "100% (albo 81,5% za cały okres – patrz „Wysokość zasiłku”)",
    adresat: ADRES_URLOPU,
    formularz: "Pracownica: wniosek o urlop do pracodawcy. Pozostałe: ZAM do ZUS",
    termin: "Po porodzie – urlop od dnia porodu; wniosek o 81,5% do 21 dni po porodzie",
    dokumenty: [AKT],
    potrzebnePola: [...BAZA, ...PLATNIK, ...DZIECKO],
    podstawa: "art. 180 § 1 k.p.; art. 29 ustawy zasiłkowej",
  },
  {
    id: "W2", wniosek: "macierzynski", nazwa: "Część urlopu macierzyńskiego przed porodem",
    kto: ["matka"], etapy: ["ciaza"],
    warunki: (k) => [maChorobowe(k), bezZadluzenia(k),
      w("Znasz przewidywaną datę porodu", jest(k.pdp), ["dziecko.przewidywanaDataPorodu"])],
    wymiar: (k) => `Maksymalnie ${k.P.przedPorodemMax} tygodni przed porodem${k.pdp ? ` – najwcześniej od ${fmtD(plusDni(k.pdp, -7 * k.P.przedPorodemMax))}` : ""}`,
    wysokosc: () => "100%",
    adresat: ADRES_URLOPU,
    formularz: "Wniosek o część urlopu macierzyńskiego przed porodem (imię, nazwisko, data rozpoczęcia)",
    termin: (k) => `Co najmniej ${k.P.ochronaWkladDni.macierzynski} dni przed rozpoczęciem urlopu`,
    dokumenty: ["Kopia zaświadczenia lekarskiego o przewidywanej dacie porodu"],
    potrzebnePola: [...BAZA, "dziecko.przewidywanaDataPorodu"],
    podstawa: "art. 180 § 2 k.p.",
  },
  {
    id: "W3", wniosek: "macierzynski", nazwa: "Poród mnogi – dłuższy urlop macierzyński",
    kto: ["matka"], etapy: ["ciaza", "po_porodzie"],
    warunki: (k) => [ubezpieczonyWDniuPorodu(k), w("Przy jednym porodzie urodziło się więcej niż jedno dziecko", k.liczbaDzieci === null ? null : k.liczbaDzieci > 1, ["dziecko.liczbaDzieci"])],
    wymiar: (k) => (k.liczbaDzieci > 1 ? `${tygodnieMac(k.liczbaDzieci, k.P)} tygodni` : "31 / 33 / 35 / 37 tygodni (2 / 3 / 4 / 5+ dzieci)"),
    wysokosc: () => "100%",
    adresat: ADRES_URLOPU,
    formularz: "Jak urlop macierzyński – podajesz liczbę dzieci",
    termin: "—",
    dokumenty: [AKT],
    potrzebnePola: [...BAZA, ...DZIECKO, "dziecko.liczbaDzieci"],
    podstawa: "art. 180 § 1 pkt 2–5 k.p.",
  },
  {
    id: "W10", wniosek: "macierzynski", nazwa: "Urlop macierzyński po urodzeniu martwego dziecka lub zgonie dziecka",
    kto: ["matka"], etapy: ["po_porodzie"],
    warunki: (k) => [ubezpieczonyWDniuPorodu(k), w("Dziecko urodziło się martwe albo zmarło", k.martwe === true || k.zmarlo === true ? true : k.martwe === null ? null : false, ["dziecko.martwe", "dziecko.zmarlo"])],
    wymiar: (k) => (k.liczbaDzieci > 1 ? "Wymiar według liczby dzieci pozostałych przy życiu" : "8 tygodni po porodzie, nie krócej niż 7 dni od zgonu (zgon po 8. tygodniu życia: 7 dni od zgonu)"),
    wysokosc: () => "100%",
    adresat: ADRES_URLOPU,
    formularz: "Wniosek o zasiłek macierzyński (ZAM albo przez pracodawcę)",
    termin: "—",
    dokumenty: [
      "Odpis skrócony aktu urodzenia z adnotacją o martwym urodzeniu",
      "Gdy nie sporządzono aktu: zaświadczenie o martwym urodzeniu (lekarz położnik albo położna)",
    ],
    potrzebnePola: [...BAZA, "dziecko.dataZgonu", "dziecko.liczbaZyjacych"],
    podstawa: "art. 180¹ k.p.",
    uwaga: "Przysługuje też zasiłek pogrzebowy. Pamiętaj o wsparciu: hospicja perinatalne i fundacje dla rodziców po stracie.",
  },
  {
    id: "W15", wniosek: "macierzynski", nazwa: "Dziecko urodzone za granicą",
    kto: ["matka", "ojciec"], etapy: ["po_porodzie"],
    warunki: (k) => [ubezpieczonyWDniuPorodu(k), w("Dziecko urodziło się za granicą", k.zaGranica, ["dziecko.zaGranica"])],
    wymiar: () => "Jak przy porodzie w Polsce",
    wysokosc: () => "Jak przy porodzie w Polsce",
    adresat: ADRES_URLOPU,
    formularz: "Jak przy porodzie w Polsce + dokumenty zagraniczne",
    termin: "—",
    dokumenty: [
      "Zagraniczny akt / dokument potwierdzający urodzenie",
      "Tłumaczenie na polski – niepotrzebne dla dokumentów z UE, EFTA/EOG, Szwajcarii i Wielkiej Brytanii",
    ],
    potrzebnePola: [...BAZA, ...DZIECKO],
    podstawa: "§ 8 i § 14 rozporządzenia (Dz.U. 2026 poz. 1316)",
  },
  {
    id: "W39", wniosek: "macierzynski", nazwa: "Zasiłek macierzyński mimo utraty pracy w ciąży (upadłość, likwidacja, śmierć pracodawcy)",
    kto: ["matka"], etapy: ["ciaza", "po_porodzie"],
    warunki: (k) => [
      w("Umowa ustała w ciąży", k.ustalo, ["ubezpieczony.ubezpieczenieUstalo"]),
      w("Przyczyna: upadłość, likwidacja albo śmierć pracodawcy",
        k.ustalo !== true ? null : k.przyczynaUstania === null ? null : ["upadlosc", "likwidacja", "smierc_pracodawcy"].includes(k.przyczynaUstania),
        ["ubezpieczony.przyczynaUstania"]),
    ],
    wymiar: () => "Jak zwykły zasiłek macierzyński",
    wysokosc: () => "100% / 81,5% / 70%",
    adresat: () => "ZUS",
    formularz: "ZAM + dokumenty z § 15 rozporządzenia",
    termin: "—",
    dokumenty: ["Zaświadczenie lekarskie o ciąży w okresie zatrudnienia", "Świadectwo pracy", AKT],
    potrzebnePola: [...BAZA, ...DZIECKO],
    podstawa: "art. 30 ust. 1 pkt 1 ustawy zasiłkowej",
  },
  {
    id: "W40", wniosek: "macierzynski", nazwa: "Zasiłek macierzyński po rozwiązaniu umowy z naruszeniem prawa",
    kto: ["matka"], etapy: ["ciaza", "po_porodzie"],
    warunki: (k) => [
      w("Umowa ustała w ciąży", k.ustalo, ["ubezpieczony.ubezpieczenieUstalo"]),
      w("Rozwiązanie z naruszeniem prawa stwierdzone prawomocnym wyrokiem", k.ustalo !== true ? null : k.przyczynaUstania === null ? null : k.przyczynaUstania === "naruszenie_prawa", ["ubezpieczony.przyczynaUstania"]),
    ],
    wymiar: () => "Jak zwykły zasiłek macierzyński",
    wysokosc: () => "100% / 81,5% / 70%",
    adresat: () => "ZUS",
    formularz: "ZAM + prawomocny wyrok sądu",
    termin: "—",
    dokumenty: ["Prawomocne orzeczenie sądu", "Zaświadczenie lekarskie o ciąży w okresie zatrudnienia", AKT],
    potrzebnePola: [...BAZA, ...DZIECKO],
    podstawa: "art. 30 ust. 1 pkt 2 ustawy zasiłkowej",
  },
  {
    id: "W29", wniosek: "macierzynski", typ: "informacja", nazwa: "Umowa na czas określony przedłużona do dnia porodu",
    kto: ["matka"], etapy: ["ciaza"],
    opis: "Umowa na czas określony (albo próbna dłuższa niż miesiąc), która rozwiązałaby się po 3. miesiącu ciąży, przedłuża się do dnia porodu. Nie dotyczy umowy na zastępstwo.",
    podstawa: "art. 177 § 3 k.p.; art. 30 ust. 4 ustawy zasiłkowej",
  },

  /* ---------------- wysokość zasiłku ---------------- */
  {
    id: "W41", wniosek: "wysokosc", nazwa: "Wariant 81,5% za cały okres",
    kto: ["matka"], etapy: ["ciaza", "po_porodzie", "przyjecie"],
    warunki: (k) => [
      ubezpieczonyWDniuPorodu(k),
      w("Zamierzasz wykorzystać pełny urlop macierzyński i rodzicielski", k.zamiarPelnyWymiar, ["urlopy.zamiarPelnyWymiar"]),
      w(`Nie minęło ${k.P.deadlineSredniowany} dni od porodu / przyjęcia dziecka`,
        k.etap === "ciaza" ? true : k.dniOdPorodu === null ? null : k.dniOdPorodu <= k.P.deadlineSredniowany, ["dziecko.dataUrodzenia"]),
    ],
    wymiar: () => "Cały urlop macierzyński i rodzicielski (bez 9 tygodni drugiego rodzica)",
    wysokosc: () => "81,5% przez cały okres",
    adresat: ADRES_ZASILKU,
    formularz: "Pisemny wniosek (art. 30a ustawy zasiłkowej)",
    termin: (k) => (k.dataUrodzenia ? `Do ${fmtD(plusDni(k.dataUrodzenia, k.P.deadlineSredniowany))} (21 dni po porodzie)` : "Do 21 dni po porodzie"),
    dokumenty: [],
    potrzebnePola: [...BAZA, "dziecko.dataUrodzenia", "dziecko.liczbaDzieci"],
    podstawa: "art. 30a, art. 31 ust. 3 ustawy zasiłkowej",
  },
  {
    id: "W42", wniosek: "wysokosc", typ: "informacja", nazwa: "Wyrównanie do 100%, jeśli nie weźmiesz urlopu rodzicielskiego w 1. roku",
    kto: ["matka"],
    opis: "Gdy wybrałaś 81,5%, a w pierwszym roku życia dziecka nie wykorzystasz ani dnia urlopu rodzicielskiego, ZUS wyrówna zasiłek za urlop macierzyński do 100% – na wniosek (nie działa z urzędu).",
    podstawa: "art. 31 ust. 3g–4 ustawy zasiłkowej",
  },
  {
    id: "W43", wniosek: "wysokosc", typ: "informacja", nazwa: "9 tygodni drugiego rodzica zawsze po 70%",
    kto: ["matka", "ojciec"],
    opis: "Każde z rodziców ma 9 tygodni urlopu rodzicielskiego, których nie można przenieść. Zasiłek za 9 tygodni drugiego rodzica wynosi 70% także w wariancie 81,5%.",
    podstawa: "art. 182¹a § 4 k.p.; art. 31 ust. 3f ustawy zasiłkowej",
  },
  {
    id: "W44", wniosek: "wysokosc", nazwa: "Podwyższenie zasiłku do kwoty świadczenia rodzicielskiego",
    kto: ["matka", "ojciec", "inny"],
    warunki: (k) => [
      maChorobowe(k),
      w(`Miesięczny zasiłek po podatku jest niższy niż ${k.P.swiadczenieRodzicielskie} zł (szacunek dla stawki 70%)`,
        k.podstawa === null ? null : k.podstawa * 0.7 * 0.88 < k.P.swiadczenieRodzicielskie, ["ubezpieczony.podstawaWymiaru"]),
    ],
    wymiar: () => "Za każdy miesiąc z niskim zasiłkiem (proporcjonalnie za część miesiąca)",
    wysokosc: (k) => `Do ${k.P.swiadczenieRodzicielskie} zł miesięcznie`,
    adresat: ADRES_ZASILKU,
    formularz: "Oświadczenie z § 28 rozporządzenia (przy kilku tytułach – wskazanie płatnika podwyższenia)",
    termin: "—",
    dokumenty: [],
    potrzebnePola: [...BAZA],
    podstawa: "art. 31 ust. 3a–3c ustawy zasiłkowej",
    pewnosc: "do_potwierdzenia",
    uwaga: "Szacunek: podatek 12% bez kosztów uzyskania. Dokładną kwotę ustala płatnik.",
  },
  {
    id: "W16", wniosek: "wysokosc", nazwa: "Kilka tytułów ubezpieczenia (np. etat + zlecenie)",
    kto: ["matka", "ojciec", "inny"],
    warunki: (k) => [w("Masz więcej niż jeden tytuł do ubezpieczenia chorobowego", k.wiecejNizJedenTytul, ["ubezpieczony.wiecejNizJedenTytul"])],
    wymiar: () => "Zasiłek z każdego tytułu; urlop ojcowski / macierzyński się nie mnoży",
    wysokosc: () => "Suma zasiłków; podwyższenie do świadczenia rodzicielskiego wypłaca jeden wskazany płatnik",
    adresat: () => "Każdy płatnik osobno (gdy jednym z nich jest ZUS – podwyższenie wypłaca ZUS)",
    formularz: "Oświadczenie o innych tytułach i wskazanie płatnika podwyższenia (§ 28)",
    termin: "—",
    dokumenty: ["Zaświadczenia pozostałych płatników zasiłku"],
    potrzebnePola: [...BAZA],
    podstawa: "art. 62 ust. 4–6 ustawy zasiłkowej",
  },

  /* ---------------- przejęcie urlopu macierzyńskiego ---------------- */
  {
    id: "W5", wniosek: "przejecie", nazwa: "Matka rezygnuje z reszty urlopu na rzecz ojca (po 14 tygodniach)",
    kto: ["matka"], etapy: ["po_porodzie"],
    warunki: (k) => [
      matkaWykorzystala(k, k.P.wylaczneMacierzynskieMatki),
      w("Ojciec dziecka ma ubezpieczenie chorobowe", !k.drugi ? false : k.grupaDrugiego === null ? null : k.grupaDrugiego !== "brak", ["drugiRodzic.statusUbezpieczenia"]),
      w("Chcesz oddać resztę urlopu ojcu", k.matkaRezygnuje, ["urlopy.matkaRezygnuje"]),
    ],
    wymiar: (k) => (k.liczbaDzieci && k.macierzynskiWykorzystanoTyg !== null ? `Ojciec przejmuje do ${Math.max(0, tygodnieMac(k.liczbaDzieci, k.P) - k.macierzynskiWykorzystanoTyg)} tygodni` : "Pozostała część urlopu macierzyńskiego"),
    wysokosc: () => "Zasiłek ojca liczony od jego podstawy (100% albo 81,5%)",
    adresat: () => "Matka: swój pracodawca/płatnik. Ojciec: swój pracodawca/płatnik",
    formularz: "Matka: wniosek o rezygnację (§ 3 rozporządzenia o wnioskach). Ojciec: wniosek o pozostałą część urlopu (§ 5)",
    termin: "Matka: co najmniej 7 dni przed powrotem do pracy. Ojciec: co najmniej 14 dni przed rozpoczęciem",
    dokumenty: ["Kopia wniosku ojca o pozostałą część urlopu", "Zaświadczenie płatnika o zasiłku matki (okres i stawka %, PESEL matki)"],
    potrzebnePola: [...BAZA, "drugiRodzic.imie", "drugiRodzic.nazwisko", "drugiRodzic.pesel"],
    podstawa: "art. 180 § 4–5, § 8–9 k.p.; art. 29 ust. 3 ustawy zasiłkowej",
  },
  {
    id: "W22", wniosek: "przejecie", nazwa: "Ojciec przejmuje urlop macierzyński po 14 tygodniach",
    kto: ["ojciec"], etapy: ["po_porodzie"],
    warunki: (k) => [
      maChorobowe(k),
      matkaUbezpieczona(k),
      okolicznosc(k, ["brak"], "Matka opiekuje się dzieckiem (brak szczególnych okoliczności)"),
      matkaWykorzystala(k, k.P.wylaczneMacierzynskieMatki),
      w("Matka rezygnuje z reszty urlopu na Twoją rzecz", k.matkaRezygnuje, ["urlopy.matkaRezygnuje"]),
    ],
    wymiar: (k) => (k.liczbaDzieci && k.macierzynskiWykorzystanoTyg !== null ? `Do ${Math.max(0, tygodnieMac(k.liczbaDzieci, k.P) - k.macierzynskiWykorzystanoTyg)} tygodni` : "Pozostała część urlopu macierzyńskiego"),
    wysokosc: () => "Od Twojej podstawy wymiaru (100% albo 81,5%)",
    adresat: ADRES_URLOPU,
    formularz: "Wniosek o udzielenie pozostałej części urlopu macierzyńskiego (§ 5 rozporządzenia o wnioskach)",
    termin: "Co najmniej 14 dni przed rozpoczęciem",
    dokumenty: [AKT, "Oświadczenie matki o rezygnacji", "Zaświadczenie płatnika o zasiłku matki (okres, stawka %, PESEL matki)"],
    potrzebnePola: [...BAZA, ...PLATNIK, ...DZIECKO, "drugiRodzic.pesel"],
    podstawa: "art. 180 § 4–5, § 9 k.p.; § 20 rozporządzenia",
  },
  {
    id: "W6", wniosek: "przejecie", nazwa: "Matka z orzeczeniem o niezdolności do samodzielnej egzystencji (po 8 tygodniach)",
    kto: ["ojciec", "inny"], etapy: ["po_porodzie"],
    warunki: (k) => [maChorobowe(k), matkaUbezpieczona(k),
      okolicznosc(k, ["niesamodzielna"], "Matka ma orzeczenie o niezdolności do samodzielnej egzystencji"),
      matkaWykorzystala(k, 8)],
    wymiar: () => "Część urlopu po dniu rezygnacji matki",
    wysokosc: () => "100% (od Twojej podstawy)",
    adresat: ADRES_URLOPU,
    formularz: "Wniosek o część urlopu macierzyńskiego (§ 5 ust. 3 rozporządzenia o wnioskach)",
    termin: "—",
    dokumenty: [AKT, "Odpis orzeczenia o niezdolności matki do samodzielnej egzystencji", "Oświadczenie matki o rezygnacji"],
    potrzebnePola: [...BAZA, ...DZIECKO, "drugiRodzic.pesel"],
    podstawa: "art. 180 § 6–7 k.p.; art. 29 ust. 5 ustawy zasiłkowej",
  },
  {
    id: "W7", wniosek: "przejecie", nazwa: "Matka w szpitalu – przejęcie urlopu na czas pobytu (po 8 tygodniach)",
    kto: ["ojciec", "inny"], etapy: ["po_porodzie"],
    warunki: (k) => [maChorobowe(k), matkaUbezpieczona(k),
      okolicznosc(k, ["szpital"], "Matka przebywa w szpitalu i nie może opiekować się dzieckiem"),
      matkaWykorzystala(k, 8)],
    wymiar: () => "Na czas pobytu matki w szpitalu; po wypisie matka wraca do urlopu",
    wysokosc: () => "100% (od Twojej podstawy)",
    adresat: ADRES_URLOPU,
    formularz: "Wniosek o część urlopu (§ 6–7 rozporządzenia o wnioskach)",
    termin: "—",
    dokumenty: [AKT, "Zaświadczenie o dacie przyjęcia matki do szpitala", "Zaświadczenie płatnika o zasiłku matki (PESEL matki)", "Po wypisie: zaświadczenie o dacie wypisu"],
    potrzebnePola: [...BAZA, ...DZIECKO, "drugiRodzic.pesel", "drugiRodzic.dataOkolicznosci"],
    podstawa: "art. 180 § 10–11 k.p.; art. 29 ust. 6 ustawy zasiłkowej",
  },
  {
    id: "W8", wniosek: "przejecie", nazwa: "Zgon matki albo porzucenie dziecka przez matkę",
    kto: ["ojciec", "inny"], etapy: ["po_porodzie"],
    warunki: (k) => [maChorobowe(k), matkaUbezpieczona(k),
      okolicznosc(k, ["zgon", "porzucenie"], "Matka zmarła albo porzuciła dziecko"),
      k.okolicznosc === "porzucenie" ? matkaWykorzystala(k, 8) : w("Przy zgonie nie obowiązuje próg 8 tygodni", true)],
    wymiar: () => "Część urlopu przypadająca po dniu zgonu / porzucenia",
    wysokosc: () => "100% (od Twojej podstawy)",
    adresat: ADRES_URLOPU,
    formularz: "Wniosek o część urlopu (§ 8–9 rozporządzenia o wnioskach)",
    termin: "—",
    dokumenty: [AKT, "Oświadczenie o dacie zgonu matki albo porzucenia dziecka", "Zaświadczenie płatnika o zasiłku matki (PESEL matki)"],
    potrzebnePola: [...BAZA, ...DZIECKO, "drugiRodzic.dataOkolicznosci"],
    podstawa: "art. 180 § 12–13 k.p.; art. 29 ust. 7 ustawy zasiłkowej",
  },
  {
    id: "W9", wniosek: "przejecie", nazwa: "Matka bez ubezpieczenia: zgon, porzucenie albo orzeczenie",
    kto: ["ojciec", "inny"], etapy: ["po_porodzie"],
    warunki: (k) => [maChorobowe(k), matkaNieubezpieczona(k),
      okolicznosc(k, ["zgon", "porzucenie", "niesamodzielna"], "Matka zmarła, porzuciła dziecko albo ma orzeczenie o niezdolności do samodzielnej egzystencji")],
    wymiar: () => "Pełny wymiar urlopu macierzyńskiego za okres od zdarzenia",
    wysokosc: () => "100% (od Twojej podstawy)",
    adresat: ADRES_URLOPU,
    formularz: "Wniosek o urlop (§ 10–12 rozporządzenia o wnioskach)",
    termin: "—",
    dokumenty: [AKT, "Oświadczenie o zgonie / porzuceniu albo kopia orzeczenia matki", "Oświadczenie, że matka nie ma tytułu do ubezpieczenia chorobowego (z jej PESEL)"],
    potrzebnePola: [...BAZA, ...DZIECKO, "drugiRodzic.pesel", "drugiRodzic.dataOkolicznosci"],
    podstawa: "art. 180 § 15 k.p.; art. 29 ust. 9 ustawy zasiłkowej",
  },
  {
    id: "W9b", wniosek: "przejecie", nazwa: "Matka bez ubezpieczenia podjęła pracę na co najmniej ½ etatu",
    kto: ["ojciec"], etapy: ["po_porodzie"],
    warunki: (k) => [maChorobowe(k), matkaNieubezpieczona(k),
      okolicznosc(k, ["podjela_prace"], "Matka podjęła zatrudnienie w wymiarze co najmniej ½ etatu")],
    wymiar: () => "Urlop w okresie trwania zatrudnienia matki, do wyczerpania wymiaru",
    wysokosc: () => "100% (od Twojej podstawy)",
    adresat: ADRES_URLOPU,
    formularz: "Wniosek (§ 13 rozporządzenia o wnioskach) + oświadczenie o dacie pobierania zasiłku",
    termin: "—",
    dokumenty: [AKT, "Oświadczenie matki o dacie podjęcia pracy (jej PESEL, nazwa i NIP pracodawcy)", "Zobowiązanie do poinformowania o końcu zatrudnienia matki"],
    potrzebnePola: [...BAZA, ...DZIECKO, "drugiRodzic.pesel", "drugiRodzic.dataOkolicznosci"],
    podstawa: "art. 180 § 17 k.p.; art. 29 ust. 10 ustawy zasiłkowej; § 25 rozporządzenia",
  },
  {
    id: "W14", wniosek: "przejecie", typ: "informacja", nazwa: "Pula urlopu macierzyńskiego nie rośnie",
    kto: ["matka", "ojciec", "inny"],
    opis: "Gdy urlop przejmuje ojciec albo inny członek rodziny, łączny wymiar nie może przekroczyć wymiaru urlopu macierzyńskiego – zmienia się tylko osoba, która z niego korzysta.",
    podstawa: "art. 180 § 14 k.p.",
  },

  /* ---------------- uzupełniający ---------------- */
  {
    id: "W4", wniosek: "uzupelniajacy", nazwa: "Uzupełniający urlop macierzyński (wcześniak / szpital)",
    kto: ["matka", "ojciec"], etapy: ["po_porodzie", "przyjecie"],
    warunki: (k) => {
      const wym = uzupelniajacyWymiar(k);
      const po37 = k.tydzienCiazy === "po_37";
      const start = k.szpitalOd && k.dataUrodzenia ? Math.round((k.szpitalOd - k.dataUrodzenia) / 86400000) + 1 : null;
      return [
        maChorobowe(k),
        w("Dziecko przebywało w szpitalu po porodzie", k.pobytWSzpitalu, ["dziecko.pobytWSzpitalu"]),
        w("Znamy tydzień ciąży i okres pobytu w szpitalu", wym ? true : k.pobytWSzpitalu === false ? null : null, ["dziecko.tydzienCiazy", "dziecko.szpitalOd"]),
        ...(po37
          ? [w("Po 37. tygodniu: pobyt min. 2 dni, zaczął się między 5. a 28. dniem po porodzie",
              start === null || !wym ? null : start >= 5 && start <= 28 && wym.dniPobytu >= 2, ["dziecko.szpitalOd", "dziecko.dataUrodzenia"])]
          : []),
        w("Drugi rodzic nie korzysta z tego urlopu", k.drugiRodzicUzupelniajacy === null ? (k.drugi ? null : true) : !k.drugiRodzicUzupelniajacy, ["urlopy.drugiRodzicUzupelniajacy"]),
      ];
    },
    wymiar: (k) => {
      const wym = uzupelniajacyWymiar(k);
      return wym ? `${wym.tygodnie} tyg. (tydzień za każdy tydzień w szpitalu: ${wym.dniPobytu} dni, limit ${wym.limit} tyg.)` : "Tydzień za każdy tydzień w szpitalu, maks. 15 tyg. (< 28. tydzień lub ≤ 1000 g) albo 8 tyg.";
    },
    wysokosc: () => "100%",
    adresat: ADRES_URLOPU,
    formularz: "Wniosek o uzupełniający urlop macierzyński (§ 14 rozporządzenia o wnioskach) – MUSI zawierać termin zakończenia urlopu macierzyńskiego",
    termin: (k) => (k.terminKoncaMacierzynskiego ? `Do ${fmtD(plusDni(k.terminKoncaMacierzynskiego, -k.P.ochronaWkladDni.uzupelniajacy))} (21 dni przed końcem urlopu macierzyńskiego)` : "Co najmniej 21 dni przed końcem urlopu macierzyńskiego"),
    dokumenty: ["Zaświadczenie szpitala: okres pobytu, tydzień ciąży / masa urodzeniowa", "Oświadczenie drugiego rodzica, że nie korzysta z tego urlopu", AKT],
    potrzebnePola: [...BAZA, "urlopy.terminKoncaMacierzynskiego", "dziecko.masaUrodzenia"],
    podstawa: "art. 180² k.p.; § 26–27 rozporządzenia",
    pewnosc: "do_potwierdzenia",
    uwaga: "Poradnik ZUS mówi o „zatrudnionych na umowę o pracę”, a ustawa o „ubezpieczonym” – dla osób, które nie są pracownikami, potwierdzić w ZUS. Przy adopcji: gdy pobyt w szpitalu był po przyjęciu dziecka (art. 183 § 3¹ k.p.).",
  },

  /* ---------------- ojcowski ---------------- */
  {
    id: "W21", wniosek: "ojcowski", nazwa: "Urlop ojcowski (2 tygodnie)",
    kto: ["ojciec"], etapy: ["po_porodzie", "przyjecie", "ciaza"],
    warunki: (k) => [
      maChorobowe(k),
      k.etap === "przyjecie"
        ? w("Dziecko ma mniej niż 14 lat i nie minęło 12 miesięcy od przysposobienia",
            k.dataPrzyjecia && k.dataUrodzenia ? k.wiekPrzyPrzyjeciuLat < 14 && (k.dzis - k.dataPrzyjecia) / 86400000 <= 366 : null,
            ["dziecko.dataPrzyjecia", "dziecko.dataUrodzenia"])
        : w(`Dziecko nie skończyło ${k.P.deadlineOjcowskiMies} miesięcy`, k.etap === "ciaza" ? true : k.wiekDzieckaMies === null ? null : k.wiekDzieckaMies < k.P.deadlineOjcowskiMies, ["dziecko.dataUrodzenia"]),
      // Oświadczenie składane we wniosku – brak odpowiedzi traktujemy jako „nie pobrano”.
      w("Zasiłek za urlop ojcowski nie był pobrany z innego tytułu", k.ojcowskiZInnegoTytulu !== true, ["urlopy.ojcowskiZInnegoTytulu"]),
    ],
    wymiar: () => "14 dni kalendarzowych – jednorazowo albo w 2 częściach po min. 7 dni",
    wysokosc: () => "100% podstawy",
    adresat: ADRES_URLOPU,
    formularz: "Wniosek o urlop ojcowski (§ 17 rozporządzenia o wnioskach); nie-pracownik: ZAM przed rozpoczęciem",
    termin: (k) => (k.dataUrodzenia && k.etap === "po_porodzie"
      ? `Wniosek min. 7 dni przed; wykorzystaj do ${fmtD(new Date(k.dataUrodzenia.getFullYear(), k.dataUrodzenia.getMonth() + k.P.deadlineOjcowskiMies, k.dataUrodzenia.getDate() - 1))}`
      : "Wniosek min. 7 dni przed; do 12. miesiąca życia dziecka"),
    dokumenty: [AKT, "Oświadczenie, czy korzystałeś już z urlopu ojcowskiego", "Przy adopcji: postanowienie sądu o przysposobieniu"],
    potrzebnePola: [...BAZA, ...PLATNIK, ...DZIECKO],
    podstawa: "art. 182³ k.p.; § 33 rozporządzenia",
    uwaga: "Przy adopcji termin liczy się od uprawomocnienia postanowienia o przysposobieniu – w profilu mamy datę przyjęcia, więc to przybliżenie.",
  },

  /* ---------------- rodzicielski ---------------- */
  {
    id: "W25", wniosek: "rodzicielski", nazwa: "Urlop rodzicielski",
    kto: ["matka", "ojciec"], etapy: ["ciaza", "po_porodzie", "przyjecie"],
    warunki: (k) => {
      const rok = k.dataUrodzenia ? k.dataUrodzenia.getFullYear() + k.P.limitRokZycia : null;
      const pula = tygodnieRodz(k.liczbaDzieci ?? 1, k.zaZyciem, k.etap === "przyjecie", k.P);
      return [
        maChorobowe(k),
        bezZadluzenia(k),
        w(`Do końca roku, w którym dziecko kończy ${k.P.limitRokZycia} lat`, k.etap === "ciaza" ? true : rok === null ? null : k.dzis.getFullYear() <= rok, ["dziecko.dataUrodzenia"]),
        w(`Wykorzystano mniej niż ${k.P.maxCzesci} części`, k.rodzicielskieCzesci === null ? true : k.rodzicielskieCzesci < k.P.maxCzesci, ["urlopy.rodzicielskieCzesci"]),
        w(`Zostało coś z puli ${pula} tygodni`, k.rodzicielskiWykorzystanoTyg === null ? true : k.rodzicielskiWykorzystanoTyg < pula, ["urlopy.rodzicielskiWykorzystanoTyg"]),
      ];
    },
    wymiar: (k) => {
      const pula = tygodnieRodz(k.liczbaDzieci ?? 1, k.zaZyciem, k.etap === "przyjecie", k.P);
      return `${pula} tygodni łącznie dla obojga rodziców; ${k.P.wylaczneRodzicielskie} tygodni każdego rodzica jest nieprzenoszalne; max ${k.P.maxCzesci} części`;
    },
    wysokosc: () => "70% (albo 81,5%, jeśli matka złożyła wniosek do 21 dni po porodzie); 9 tygodni drugiego rodzica – 70%",
    adresat: ADRES_URLOPU,
    formularz: "Wniosek o urlop rodzicielski lub jego część (§ 15 rozporządzenia o wnioskach); nie-pracownik: ZAM",
    termin: (k) => `Co najmniej ${k.P.ochronaWkladDni.rodzicielski} dni przed rozpoczęciem każdej części`,
    dokumenty: [AKT, "Oświadczenie drugiego rodzica, czy i kiedy korzysta z urlopu rodzicielskiego", "Przy 65/67 tyg.: kopia zaświadczenia „Za życiem”"],
    potrzebnePola: [...BAZA, ...PLATNIK, ...DZIECKO, "urlopy.rodzicielskieCzesci", "urlopy.rodzicielskiWykorzystanoTyg"],
    podstawa: "art. 182¹a–182¹d k.p.; art. 31 ustawy zasiłkowej",
  },
  {
    id: "W12", wniosek: "rodzicielski", nazwa: "Łączenie urlopu rodzicielskiego z pracą",
    kto: ["matka", "ojciec"], etapy: ["po_porodzie", "przyjecie"],
    warunki: (k) => [
      jestPracownikiem(k),
      w("Chcesz łączyć urlop z pracą", k.laczenieZPraca, ["urlopy.laczenieZPraca"]),
      w("Wymiar pracy nie przekracza ½ etatu", k.wymiarPracyPrzyLaczeniu === null ? null : k.wymiarPracyPrzyLaczeniu === "do_polowy", ["urlopy.wymiarPracyPrzyLaczeniu"]),
    ],
    wymiar: (k) => `Urlop wydłuża się proporcjonalnie: max ${k.P.limitLaczenie[1]}/${k.P.limitLaczenie[2]} tyg. („Za życiem” ${k.P.limitLaczenieZaZyciem[1]}/${k.P.limitLaczenieZaZyciem[2]})`,
    wysokosc: () => "Zasiłek obniżony proporcjonalnie do wymiaru pracy",
    adresat: () => "Pracodawca, który udzielił urlopu (może odmówić tylko z przyczyn organizacyjnych, w ciągu 7 dni)",
    formularz: "Wniosek o łączenie urlopu z pracą (§ 16 rozporządzenia o wnioskach)",
    termin: "Co najmniej 21 dni przed rozpoczęciem pracy",
    dokumenty: ["Zaświadczenie pracodawcy o okresie i wymiarze pracy w czasie urlopu (dla płatnika zasiłku)"],
    potrzebnePola: [...BAZA, ...PLATNIK],
    podstawa: "art. 182¹e–182¹f k.p.; art. 31 ust. 4a ustawy zasiłkowej",
    pewnosc: "do_potwierdzenia",
    uwaga: "Wymiar wydłużenia zależy od tego, czy pracujesz także w części powstałej z wydłużenia (pole I14 w dokumentacji ZUS) – kalkulator zakłada, że tak.",
  },

  /* ---------------- adopcja / rodzina zastępcza ---------------- */
  {
    id: "W28", wniosek: "adopcja", nazwa: "Urlop na warunkach urlopu macierzyńskiego",
    kto: ["matka", "ojciec"], etapy: ["przyjecie"],
    warunki: (k) => {
      const limit = k.typPrzyjecia === "przysposobienie" ? k.P.limitWiekuPrzysposobienie
        : k.odroczonySzkolny === true ? k.P.limitWiekuOdroczenie : k.P.limitWiekuRodzinaZastepcza;
      return [
        ubezpieczonyWDniuPorodu(k),
        w("To nie jest zawodowa rodzina zastępcza", k.typPrzyjecia === null ? null : k.typPrzyjecia !== "rodzina_zastepcza_zawodowa", ["sytuacja.typPrzyjecia"]),
        w(`Dziecko miało w dniu przyjęcia mniej niż ${limit} lat`, k.wiekPrzyPrzyjeciuLat === null || k.typPrzyjecia === null ? null : k.wiekPrzyPrzyjeciuLat < limit,
          ["dziecko.dataUrodzenia", "dziecko.dataPrzyjecia", "dziecko.odroczonySzkolny"]),
      ];
    },
    wymiar: () => "20–37 tygodni wg liczby przyjętych dzieci, nie mniej niż 9 tygodni; potem urlop rodzicielski",
    wysokosc: () => "100% (albo 81,5% przy wniosku do 21 dni od przyjęcia)",
    adresat: ADRES_URLOPU,
    formularz: "Wniosek o urlop na warunkach urlopu macierzyńskiego (§ 18 rozporządzenia o wnioskach)",
    termin: (k) => (k.dataPrzyjecia ? `Wniosek do ${fmtD(plusDni(k.dataPrzyjecia, 7))} (7 dni od przyjęcia); urlop najpóźniej od ${fmtD(plusDni(k.dataPrzyjecia, 21))}` : "Wniosek w 7 dni od przyjęcia; urlop najpóźniej 21 dni od przyjęcia"),
    dokumenty: [
      "Oświadczenie o dacie przyjęcia dziecka",
      "Adopcja: kopia wniosku o przysposobienie z poświadczeniem sądu albo zaświadczenie sądu",
      "Rodzina zastępcza: orzeczenie sądu albo umowa ze starostą + dokument potwierdzający wiek dziecka",
      "Przy odroczeniu obowiązku szkolnego: kopia decyzji",
    ],
    potrzebnePola: [...BAZA, ...DZIECKO, "dziecko.dataPrzyjecia"],
    podstawa: "art. 183 k.p.; art. 29 ust. 1 pkt 2–3 ustawy zasiłkowej",
  },

  /* ---------------- wychowawczy ---------------- */
  {
    id: "W11", wniosek: "wychowawczy", nazwa: "Urlop wychowawczy",
    kto: ["matka", "ojciec"], etapy: ["po_porodzie", "przyjecie"],
    warunki: (k) => {
      const od = k.profil.ubezpieczony?.zatrudnionyOd ? new Date(k.profil.ubezpieczony.zatrudnionyOd) : null;
      const limitLat = k.niepelnosprawne === true ? 18 : 6;
      return [
        jestPracownikiem(k),
        w("Pracujesz co najmniej 6 miesięcy (łączny staż pracy)", od ? (k.dzis - od) / 86400000 >= 182 : null, ["ubezpieczony.zatrudnionyOd"]),
        w(`Dziecko nie przekroczyło limitu wieku (${limitLat === 6 ? "koniec roku, w którym kończy 6 lat" : "18 lat przy niepełnosprawności"})`,
          k.dataUrodzenia ? (limitLat === 6 ? k.dzis.getFullYear() <= k.dataUrodzenia.getFullYear() + 6 : k.wiekDzieckaMies < 18 * 12) : null, ["dziecko.dataUrodzenia", "dziecko.niepelnosprawne"]),
        w("Zostały niewykorzystane miesiące (z 36)", k.wychowawczyWykorzystanoMies === null ? true : k.wychowawczyWykorzystanoMies < 36, ["urlopy.wychowawczyWykorzystanoMies"]),
      ];
    },
    wymiar: () => "Do 36 miesięcy, w max 5 częściach (1 miesiąc nieprzenoszalny dla każdego rodzica)",
    wysokosc: () => "Bez zasiłku – składki emerytalne, rentowe i zdrowotne opłaca budżet państwa",
    adresat: () => "Pracodawca",
    formularz: "Wniosek o urlop wychowawczy (§ 19 rozporządzenia o wnioskach)",
    termin: "Co najmniej 21 dni przed rozpoczęciem",
    dokumenty: ["Oświadczenie drugiego rodzica, czy korzysta z urlopu wychowawczego", "Przy 36 mies. dla dziecka z niepełnosprawnością: kopia orzeczenia"],
    potrzebnePola: [...DZIECKO, "urlopy.wychowawczyWykorzystanoMies"],
    podstawa: "art. 186–186⁸ k.p.",
    pewnosc: "do_potwierdzenia",
    uwaga: "Staż 6 miesięcy liczy się łącznie z poprzednimi pracodawcami – profil ma tylko datę zatrudnienia w obecnej firmie.",
  },

  /* ---------------- opiekuńczy ---------------- */
  {
    id: "W17", wniosek: "opiekunczy", nazwa: "Zasiłek opiekuńczy",
    kto: ["matka", "ojciec", "inny"], etapy: ["po_porodzie", "przyjecie"],
    warunki: (k) => {
      const powod = k.potrzebaOpieki;
      const wiekLimitLat = { chore_dziecko: 14, zamkniecie_placowki: 8, choroba_niani: 8, choroba_rodzica: 8, szpital_rodzica: 8, niepelnosprawne: 18 }[powod];
      const do2lat = k.wiekDzieckaMies !== null && k.wiekDzieckaMies < 24;
      return [
        maChorobowe(k),
        bezZadluzenia(k),
        w("Jest powód opieki", powod === null ? null : powod !== "brak", ["urlopy.potrzebaOpieki"]),
        ...(wiekLimitLat ? [w(`Dziecko ma mniej niż ${wiekLimitLat} lat`, k.wiekDzieckaMies === null ? null : k.wiekDzieckaMies < wiekLimitLat * 12, ["dziecko.dataUrodzenia"])] : []),
        w("Nikt w domu nie może zapewnić opieki (nie dotyczy chorego dziecka do 2 lat)",
          powod === "chore_dziecko" && do2lat ? true : niePrawda(k.domownikMozeOpiekowac), ["urlopy.domownikMozeOpiekowac"]),
        w(`Nie wykorzystano limitu ${k.P.limitOpiekunczyDni} dni w roku`, k.opiekunczyDniWRoku === null ? true : k.opiekunczyDniWRoku < k.P.limitOpiekunczyDni, ["urlopy.opiekunczyDniWRoku"]),
      ];
    },
    wymiar: (k) => `Do ${k.P.limitOpiekunczyDni} dni w roku łącznie (dziecko do 14 lat); 14 dni – inny członek rodziny; 30 dni – dziecko z niepełnosprawnością 14–18 lat`,
    wysokosc: () => "80% podstawy, od 1. dnia ubezpieczenia (bez okresu wyczekiwania)",
    adresat: ADRES_ZASILKU,
    formularz: "Pracownik: Z-15A (dziecko) / Z-15B (inny członek rodziny); pozostali: wniosek do ZUS (zał. 7)",
    termin: "Zasiłek nie jest wypłacany automatycznie – złóż wniosek",
    dokumenty: ["e-ZLA na opiekę albo oświadczenie (zamknięcie placówki, choroba niani)", "Oświadczenie o braku domownika i o dniach zasiłku opiekuńczego w roku"],
    potrzebnePola: [...BAZA, ...DZIECKO],
    podstawa: "art. 32–34 ustawy zasiłkowej",
  },

  /* ---------------- pogrzebowy ---------------- */
  {
    id: "W45", wniosek: "pogrzebowy", nazwa: "Zasiłek pogrzebowy po stracie dziecka",
    kto: ["matka", "ojciec", "inny"], etapy: ["po_porodzie"],
    warunki: (k) => [w("Dziecko urodziło się martwe albo zmarło", k.martwe === true || k.zmarlo === true ? true : k.martwe === null && k.zmarlo === null ? null : false, ["dziecko.martwe", "dziecko.zmarlo"])],
    wymiar: () => "Jednorazowo",
    wysokosc: (k) => `${k.P.zasilekPogrzebowy} zł (nawet jeśli koszty były niższe)`,
    adresat: () => "ZUS",
    formularz: "Z-12 – wniosek o zasiłek pogrzebowy (składa osoba, która pokryła koszty pogrzebu)",
    termin: "12 miesięcy od dnia pochówku",
    dokumenty: ["Rachunki za pogrzeb", "Gdy brak aktu z adnotacją o martwym urodzeniu: karta zgonu albo zaświadczenie o martwym urodzeniu"],
    potrzebnePola: [...BAZA, "dziecko.dataZgonu"],
    podstawa: "ustawa o emeryturach i rentach z FUS (art. 77–81)",
  },

  /* ---------------- poza ZUS ---------------- */
  {
    id: "W19", wniosek: "poza_zus", nazwa: "Świadczenie rodzicielskie (gdy nie ma zasiłku macierzyńskiego)",
    kto: ["matka", "ojciec", "inny"], etapy: ["ciaza", "po_porodzie", "przyjecie"],
    warunki: (k) => [w("Nie masz ubezpieczenia chorobowego w dniu porodu / przyjęcia (np. studentka, umowa o dzieło, bezrobotna)", niePrawda(k.ubezpieczonyWDniuZdarzenia), ["ubezpieczony.statusUbezpieczenia"])],
    wymiar: () => "52 tygodnie (dłużej przy porodzie mnogim)",
    wysokosc: (k) => `${k.P.swiadczenieRodzicielskie} zł miesięcznie`,
    adresat: () => "Gmina / ośrodek pomocy społecznej (nie ZUS)",
    formularz: "Wniosek o świadczenie rodzicielskie w gminie",
    termin: "—",
    dokumenty: [AKT],
    potrzebnePola: [...BAZA, ...DZIECKO],
    podstawa: "ustawa z 28.11.2003 o świadczeniach rodzinnych",
    pewnosc: "do_potwierdzenia",
    uwaga: "Poza zakresem ZUS – pokazujemy jako alternatywę.",
  },
  {
    id: "W20", wniosek: "poza_zus", typ: "informacja", nazwa: "Funkcjonariusze służb mundurowych – uposażenie macierzyńskie",
    kto: ["matka", "ojciec"],
    opis: "Policja, Straż Graniczna, PSP, SW i inne służby mają odrębne przepisy (uposażenie zamiast zasiłku) – nie podlegają ubezpieczeniu chorobowemu w ZUS.",
    podstawa: "ustawy o poszczególnych służbach",
  },
  {
    id: "W31", wniosek: "poza_zus", typ: "informacja", nazwa: "Ochrona przed zwolnieniem",
    kto: ["matka", "ojciec"],
    opis: "W ciąży i w czasie urlopów rodzicielskich pracodawca nie może wypowiedzieć ani rozwiązać umowy (wyjątki: upadłość, likwidacja, wina pracownika). Ochrona zaczyna się od złożenia wniosku o urlop – do 14/21/7 dni przed jego rozpoczęciem.",
    podstawa: "art. 177 k.p.",
  },
];

export const wariantById = (id) => WARIANTY.find((v) => v.id === id);
export const wniosekById = (id) => WNIOSKI.find((x) => x.id === id);
