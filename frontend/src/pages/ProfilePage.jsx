import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import { useAuth } from "../auth.js";
import { useProfile } from "../profile.js";

import {
  ROLE, ETAPY_DLA, HINT_ETAPU, ROLE_DLA, jestOpcjonalne,
} from "../profile-logic/etapy.js";

/* =====================================================================
   FORMULARZ ETAPOWY "MOJE DANE"
   Zbiera dane potrzebne do wyboru i wypełnienia wniosków ZUS / pracodawcy.
   Imię, nazwisko, PESEL, datę urodzenia i płeć mamy z mObywatela.
   Pola są widoczne warunkowo (`if` / `show`) - pytamy tylko o to, co
   dotyczy danej osoby. Wszystkie pola są opcjonalne.
   Wartości tak/nie zapisujemy jako "tak" | "nie" | "" (brak odpowiedzi).
   ===================================================================== */

/* ---------- słowniki ---------- */
// Uwaga: id "pracownik" zostaje (są już zapisane profile); skrypt mapuje pracownik -> etat.
const TYTULY = [
  ["pracownik", "Pracownik (umowa o pracę)"],
  ["powolanie", "Powołanie / wybór / mianowanie / spółdzielcza umowa o pracę"],
  ["zlecenie", "Umowa zlecenia / agencyjna / o świadczenie usług"],
  ["dg", "Działalność gospodarcza"],
  ["wspolpraca", "Współpraca z osobą prowadzącą działalność"],
  ["duchowny", "Duchowny"],
  ["marynarz", "Marynarz"],
  ["uaktywniajaca", "Umowa uaktywniająca (opiekun dziecka)"],
  ["dzielo", "Tylko umowa o dzieło"],
  ["student_zlecenie", "Zlecenie - uczeń / student do 26. roku życia"],
  ["nierejestrowa", "Działalność nierejestrowana"],
  ["ulga_na_start", "Działalność na uldze na start"],
  ["brak", "Brak tytułu (bezrobotna/y, student, osoba nieubezpieczona)"],
];

// pracownik = obowiązkowe chorobowe + wynagrodzenie chorobowe; dobrowolne = zlecenie/DG/itd.
const GRUPA = {
  pracownik: "pracownik",
  powolanie: "pracownik",
  zlecenie: "dobrowolne",
  dg: "dobrowolne",
  wspolpraca: "dobrowolne",
  duchowny: "dobrowolne",
  marynarz: "dobrowolne",
  uaktywniajaca: "uaktywniajaca",
  dzielo: "brak",
  student_zlecenie: "brak",
  nierejestrowa: "brak",
  ulga_na_start: "brak",
  brak: "brak",
};

const TAK_NIE = [["tak", "Tak"], ["nie", "Nie"]];
const RODZAJE_PRZYJECIA = [
  ["przysposobienie", "Przysposobienie (adopcja)"],
  ["rodzina_zastepcza", "Rodzina zastępcza niezawodowa"],
  ["rodzina_zastepcza_zawodowa", "Zawodowa rodzina zastępcza"],
];
const OKOLICZNOSCI = [
  ["brak", "Nic szczególnego - matka opiekuje się dzieckiem"],
  ["zgon", "Matka zmarła"],
  ["porzucenie", "Matka porzuciła dziecko"],
  ["szpital", "Matka przebywa w szpitalu / placówce leczniczej"],
  ["niesamodzielna", "Matka ma orzeczenie o niezdolności do samodzielnej egzystencji"],
  ["podjela_prace", "Matka (bez tytułu do chorobowego) podjęła pracę w wymiarze co najmniej ½ etatu"],
];
const PRZYCZYNY_USTANIA = [
  ["wypowiedzenie", "Koniec umowy / wypowiedzenie"],
  ["upadlosc", "Upadłość pracodawcy"],
  ["likwidacja", "Likwidacja pracodawcy"],
  ["smierc_pracodawcy", "Śmierć pracodawcy"],
  ["naruszenie_prawa", "Rozwiązanie umowy z naruszeniem prawa (wyrok sądu)"],
  ["inna", "Inna przyczyna"],
];
const OPIEKA = [
  ["brak", "Nie potrzebuję zasiłku opiekuńczego"],
  ["chore_dziecko", "Chore dziecko do lat 14"],
  ["zamkniecie_placowki", "Zamknięcie żłobka / przedszkola / szkoły"],
  ["choroba_niani", "Choroba niani lub dziennego opiekuna"],
  ["choroba_rodzica", "Choroba drugiego rodzica sprawującego opiekę"],
  ["szpital_rodzica", "Pobyt drugiego rodzica w szpitalu"],
  ["niepelnosprawne", "Opieka nad dzieckiem niepełnosprawnym"],
  ["chory_czlonek", "Opieka nad innym chorym członkiem rodziny"],
];

const tak = (v) => v === "tak";
const yn = (name, label, extra = {}) => ({ name, label, type: "select", options: TAK_NIE, ...extra });

/* ---------- kontekst wyliczany z odpowiedzi ---------- */
const derive = (f) => {
  const u = f.ubezpieczony ?? {};
  const s = f.sytuacja ?? {};
  const d = f.dziecko ?? {};
  const o = f.drugiRodzic ?? {};
  const grupa = GRUPA[u.statusUbezpieczenia] ?? "";
  return {
    u, s, d, o, grupa,
    plec: u.plec ?? "",
    etap: s.etap ?? "",
    rola: s.rola ?? "",
    maTytul: ["pracownik", "dobrowolne", "uaktywniajaca"].includes(grupa),
    pracownik: grupa === "pracownik",
    dobrowolne: grupa === "dobrowolne",
    drugi: !o.brak,
  };
};

/* ---------- definicja etapów ---------- */
// sections[].data = klucz sekcji w profilu; fields[].if = warunek widoczności pola
const STEPS = [
  {
    id: "sytuacja",
    title: "Twoja sytuacja",
    intro: "Od tych odpowiedzi zależy, które wnioski i pytania Ci pokażemy.",
    sections: [
      {
        data: "sytuacja",
        title: "Na jakim etapie jesteś?",
        fields: [
          { name: "etap", label: "Etap", type: "select", wide: true,
            options: (c) => ETAPY_DLA(c.plec, c.rola),
            hint: (c) => HINT_ETAPU(c.plec, c.rola) },
          {
            name: "rola", label: "Kim jesteś dla dziecka?", type: "select", wide: true,
            options: (c) => ROLE_DLA(c.plec),
            hint: "Podpowiedzieliśmy na podstawie PESEL - od roli zależy, jakie uprawnienia masz (np. urlop ojcowski tylko dla ojca).",
          },
          { name: "typPrzyjecia", label: "Rodzaj przyjęcia dziecka", type: "select", options: RODZAJE_PRZYJECIA, wide: true, if: (c) => c.etap === "przyjecie",
            hint: "Zawodowa rodzina zastępcza nie ma prawa do urlopu na warunkach urlopu macierzyńskiego." },
        ],
      },
    ],
  },
  {
    id: "ty",
    title: "Ty i ubezpieczenie",
    intro: "Dane stałe oraz informacje o Twoim ubezpieczeniu chorobowym - od nich zależy, czy i od kiedy przysługuje zasiłek.",
    sections: [
      {
        data: "ubezpieczony",
        title: "Twoje dane do wniosków",
        hint: "Imię, nazwisko, PESEL i datę urodzenia mamy już z mObywatela.",
        fields: [
          { name: "adres", label: "Adres zamieszkania", placeholder: "ul. Kwiatowa 5/12, 00-001 Warszawa", wide: true },
          { name: "rachunek", label: "Numer rachunku bankowego", placeholder: "00 0000 0000 0000 0000 0000 0000", kind: "iban", wide: true, hint: "Na ten rachunek ZUS wypłaci zasiłek." },
          { name: "statusUbezpieczenia", label: "Z jakiego tytułu jesteś ubezpieczona/y?", type: "select", options: TYTULY, wide: true },
          { name: "ubezpieczenieOd", label: "Ubezpieczenie chorobowe od (data)", type: "date", if: (c) => c.maTytul,
            hint: "Przy zleceniu / działalności: data, od której płacisz dobrowolną składkę chorobową (zgłoszenie ZUA)." },
          { name: "ulgaWyczekiwania", label: "Czy skraca się Twój okres wyczekiwania na zasiłek?", type: "select", wide: true, if: (c) => c.maTytul,
            options: [
              ["brak", "Nie dotyczy"],
              ["absolwent", "Absolwent - ubezpieczenie podjęte w ciągu 90 dni od ukończenia nauki"],
              ["10_lat", "Mam co najmniej 10 lat wcześniejszego obowiązkowego ubezpieczenia chorobowego"],
              ["posel", "Poseł / senator - w ciągu 90 dni od końca kadencji"],
            ] },
          { name: "podstawaWymiaru", label: "Podstawa wymiaru zasiłku (zł/mies.)", type: "money", if: (c) => c.maTytul,
            hint: "Jeśli jej nie znasz, policz ją w kalkulatorze „Podstawa wymiaru”." },
          { name: "wymiarEtatu", label: "Wymiar czasu pracy", type: "select", if: (c) => c.pracownik,
            options: [["pelny", "Pełny etat"], ["czesc", "Część etatu"]] },
          yn("zmianaWymiaru12m", "Czy w ostatnich 12 miesiącach zmienił się wymiar Twojego etatu?", { if: (c) => c.pracownik,
            hint: "Zmiana wymiaru może obniżyć podstawę zasiłku." }),
          { name: "zatrudnionyOd", label: "Zatrudniona/y w obecnej firmie od", type: "date", if: (c) => c.pracownik },
          yn("pracaZaGranica", "Czy praca jest wykonywana za granicą?", { if: (c) => c.pracownik }),
          yn("pracaTymczasowa", "Czy to praca tymczasowa (agencja pracy tymczasowej)?", { if: (c) => c.pracownik }),
          yn("zaleglosci", "Czy masz zaległości w składkach ZUS powyżej 48,06 zł?", { if: (c) => c.dobrowolne, wide: true,
            hint: "Zadłużenie powyżej 1% minimalnego wynagrodzenia blokuje prawo do zasiłku do czasu spłaty." }),
          yn("wiecejNizJedenTytul", "Czy masz więcej niż jeden tytuł do ubezpieczenia chorobowego (np. etat + zlecenie)?", { if: (c) => c.maTytul, wide: true }),
          yn("emeryturaRenta", "Czy masz prawo do emerytury lub renty?", { if: (c) => !!c.grupa }),
          yn("zasilekBezrobotnych", "Czy pobierasz zasiłek dla bezrobotnych lub inne świadczenie z urzędu pracy?", { if: (c) => c.grupa === "brak", wide: true }),
          yn("rolnik", "Czy podlegasz ubezpieczeniu społecznemu rolników (KRUS)?", { if: (c) => c.grupa === "brak", wide: true }),
          yn("ubezpieczenieUstalo", "Czy Twoje ubezpieczenie chorobowe już wygasło lub wygaśnie przed porodem?", { if: (c) => !!c.etap, wide: true }),
          { name: "dataUstania", label: "Data ustania ubezpieczenia", type: "date", if: (c) => tak(c.u.ubezpieczenieUstalo) },
          { name: "przyczynaUstania", label: "Przyczyna ustania", type: "select", options: PRZYCZYNY_USTANIA, wide: true, if: (c) => tak(c.u.ubezpieczenieUstalo) },
          yn("zapewnionoInnaPrace", "Czy pracodawca zapewnił Ci inne zatrudnienie?", { wide: true,
            if: (c) => tak(c.u.ubezpieczenieUstalo) && ["upadlosc", "likwidacja", "smierc_pracodawcy"].includes(c.u.przyczynaUstania) }),
        ],
      },
    ],
  },
  {
    id: "platnik",
    title: "Pracodawca",
    intro: "Dane płatnika składek. Jeśli prowadzisz działalność, wpisz dane swojej firmy.",
    sections: [
      {
        data: "platnik",
        title: "Pracodawca / płatnik składek",
        show: (c) => c.maTytul,
        fields: [
          { name: "nazwa", label: "Nazwa", wide: true },
          { name: "adres", label: "Adres", wide: true },
          { name: "nip", label: "NIP", placeholder: "0000000000", inputMode: "numeric", kind: "nip" },
          { name: "regon", label: "REGON", placeholder: "000000000", inputMode: "numeric", kind: "regon" },
          { name: "liczbaUbezpieczonych", label: "Ilu pracowników zgłasza pracodawca do ubezpieczenia chorobowego?", type: "select", wide: true,
            if: (c) => ["pracownik", "uaktywniajaca"].includes(c.grupa) || c.u.statusUbezpieczenia === "zlecenie",
            options: [["do_20", "Do 20 osób (zasiłek wypłaca ZUS)"], ["powyzej_20", "Powyżej 20 osób (zasiłek wypłaca pracodawca)"], ["nie_wiem", "Nie wiem"]],
            hint: "Decyduje, kto wypłaca zasiłek: pracodawca czy ZUS." },
        ],
      },
    ],
    emptyNote: "Bez tytułu do ubezpieczenia nie masz płatnika składek - nic tu nie wpisujesz. Przejdź dalej.",
  },
  {
    id: "dziecko",
    title: "Dziecko",
    intro: "Data urodzenia (albo przewidywana data porodu) wyznacza wszystkie terminy.",
    sections: [
      {
        data: "dziecko",
        title: "Dziecko",
        fields: [
          { name: "przewidywanaDataPorodu", label: "Przewidywana data porodu", type: "date", if: (c) => c.etap === "ciaza", hint: "Z karty ciąży lub od lekarza prowadzącego." },
          { name: "liczbaDzieci", label: "Liczba dzieci z jednego porodu", type: "number", min: 1, max: 10, if: (c) => c.etap !== "przyjecie",
            hint: "1 = pojedynczy poród, 2 = bliźnięta itd. Wpływa na długość urlopu." },
          yn("martwe", "Czy dziecko urodziło się martwe?", { if: (c) => c.etap === "po_porodzie" }),
          yn("zmarlo", "Czy dziecko zmarło po urodzeniu?", { if: (c) => c.etap === "po_porodzie" && c.d.martwe === "nie" }),
          { name: "dataZgonu", label: "Data zgonu dziecka", type: "date", if: (c) => tak(c.d.zmarlo) },
          { name: "liczbaZyjacych", label: "Liczba dzieci pozostałych przy życiu", type: "number", min: 0, max: 10,
            if: (c) => Number(c.d.liczbaDzieci) > 1 && (tak(c.d.martwe) || tak(c.d.zmarlo)) },
          yn("zaGranica", "Czy dziecko urodziło się za granicą?", { if: (c) => c.etap === "po_porodzie" }),
          { name: "kraj", label: "Kraj urodzenia", if: (c) => tak(c.d.zaGranica), hint: "Poza UE/EFTA/Szwajcarią potrzebne będzie tłumaczenie aktu urodzenia." },
          yn("pobytWSzpitalu", "Czy dziecko przebywało w szpitalu po porodzie?", { if: (c) => c.etap === "po_porodzie" && c.d.martwe !== "tak", wide: true,
            hint: "Dotyczy uzupełniającego urlopu macierzyńskiego (np. wcześniak)." }),
          { name: "tydzienCiazy", label: "Tydzień ciąży w chwili porodu", type: "select", if: (c) => tak(c.d.pobytWSzpitalu),
            options: [["ponizej_28", "Poniżej 28. tygodnia"], ["28_37", "Od 28. do 37. tygodnia"], ["po_37", "Po 37. tygodniu"]] },
          { name: "masaUrodzenia", label: "Masa urodzeniowa (g)", type: "number", min: 300, max: 7000, if: (c) => tak(c.d.pobytWSzpitalu) },
          { name: "szpitalOd", label: "Pobyt w szpitalu - od", type: "date", if: (c) => tak(c.d.pobytWSzpitalu) },
          { name: "szpitalDo", label: "Pobyt w szpitalu - do", type: "date", after: "szpitalOd", if: (c) => tak(c.d.pobytWSzpitalu), hint: "Zostaw puste, jeśli pobyt trwa." },
          { name: "dataPrzyjecia", label: "Data przyjęcia dziecka na wychowanie", type: "date", max: "today", if: (c) => c.etap === "przyjecie" },
          yn("odroczonySzkolny", "Czy dziecko ma odroczony obowiązek szkolny?", { if: (c) => c.etap === "przyjecie", wide: true }),
          yn("niepelnosprawne", "Czy dziecko ma orzeczenie o niepełnosprawności?", { if: (c) => c.etap && c.etap !== "ciaza", wide: true }),
          { name: "zaZyciem", label: "Oświadczenie „Za życiem” (ciężkie, nieodwracalne upośledzenie dziecka) — opcjonalne", type: "checkbox", wide: true, optional: true, if: (c) => !!c.etap },
        ],
      },
    ],
  },
  {
    id: "drugiRodzic",
    title: "Drugi rodzic",
    intro: "Potrzebne, gdy dzielicie się urlopem lub zasiłkiem. Możesz pominąć.",
    sections: [
      {
        data: "drugiRodzic",
        title: "Drugi rodzic / opiekun",
        fields: [
          { name: "brak", label: "Nie mam drugiego rodzica / opiekuna - wychowuję dziecko samodzielnie", type: "checkbox", wide: true },
          { name: "imie", label: "Imię", if: (c) => c.drugi },
          { name: "nazwisko", label: "Nazwisko", if: (c) => c.drugi },
          { name: "pesel", label: "PESEL", inputMode: "numeric", kind: "pesel", if: (c) => c.drugi, hint: "Najczęściej brakujące dane we wnioskach." },
          { name: "rola", label: "Kim jest dla dziecka?", type: "select", options: ROLE, if: (c) => c.drugi },
          { name: "adres", label: "Adres zamieszkania", wide: true, if: (c) => c.drugi },
          { name: "statusUbezpieczenia", label: "Tytuł ubezpieczenia drugiego rodzica", type: "select", options: TYTULY, wide: true, if: (c) => c.drugi,
            hint: "Bez ubezpieczenia chorobowego ojciec nie przejmie urlopu macierzyńskiego." },
          { name: "podstawaWymiaru", label: "Podstawa wymiaru zasiłku (zł/mies.)", type: "money", if: (c) => c.drugi },
          { name: "platnikNazwa", label: "Pracodawca drugiego rodzica - nazwa", wide: true, if: (c) => c.drugi },
          { name: "platnikNip", label: "Pracodawca drugiego rodzica - NIP", inputMode: "numeric", kind: "nip", if: (c) => c.drugi },
          { name: "okolicznosc", label: "Czy zaszła któraś z tych okoliczności dotyczących matki?", type: "select", options: OKOLICZNOSCI, wide: true,
            if: (c) => c.drugi && c.rola !== "matka" && c.etap && c.etap !== "ciaza" },
          { name: "dataOkolicznosci", label: "Od kiedy / data zdarzenia", type: "date",
            if: (c) => c.drugi && c.rola !== "matka" && c.o.okolicznosc && c.o.okolicznosc !== "brak" },
        ],
      },
    ],
  },
  {
    id: "zdrowie",
    title: "Ciąża i zwolnienia",
    intro: "Dotyczy zwolnień lekarskich w ciąży (kod „B” daje zasiłek 100% od pierwszego dnia).",
    show: (c) => c.etap === "ciaza" && c.rola === "matka",
    sections: [
      {
        data: "zdrowie",
        title: "Zwolnienia lekarskie w ciąży",
        fields: [
          { name: "zwolnienie", label: "Czy masz zwolnienie lekarskie (e-ZLA)?", type: "select", wide: true,
            options: [["brak", "Nie mam zwolnienia"], ["B", "Mam e-ZLA z kodem B (ciąża)"], ["bez_B", "Mam e-ZLA bez kodu B"]] },
          { name: "zlaNumer", label: "Seria i numer e-ZLA", if: (c) => ["B", "bez_B"].includes(c.f.zdrowie?.zwolnienie) },
          { name: "zlaOd", label: "Zwolnienie od", type: "date", if: (c) => ["B", "bez_B"].includes(c.f.zdrowie?.zwolnienie) },
          { name: "zlaDo", label: "Zwolnienie do", type: "date", after: "zlaOd", if: (c) => ["B", "bez_B"].includes(c.f.zdrowie?.zwolnienie) },
          yn("wczesniejszeZwolnienia", "Czy w ostatnich 12 miesiącach korzystałaś ze zwolnień bez kodu B?", { wide: true,
            hint: "Przerwa krótsza niż 60 dni przed zwolnieniem z kodem B może wyzerować okres zasiłkowy." }),
          yn("okresZasilkowyWyczerpany", "Czy wyczerpał Ci się okres zasiłkowy (182 / 270 dni)?", { wide: true }),
          yn("rokowaniaPoprawy", "Czy lekarz orzekł, że dalsze leczenie przywróci zdolność do pracy?", { wide: true, if: (c) => tak(c.f.zdrowie?.okresZasilkowyWyczerpany) }),
          yn("wypadekWDrodze", "Czy niezdolność wynika z wypadku w drodze do/z pracy?", { wide: true }),
        ],
      },
    ],
  },
  {
    id: "urlopy",
    title: "Urlopy i plany",
    intro: "Co chcesz wykorzystać i co już wykorzystano. Odpowiedz tylko na to, co wiesz - resztę można uzupełnić później.",
    sections: [
      {
        data: "urlopy",
        title: "Urlop macierzyński",
        show: (c) => c.etap === "ciaza" || c.etap === "po_porodzie",
        fields: [
          { name: "urlopPrzedPorodemOd", label: "Planowany początek urlopu przed porodem", type: "date", if: (c) => c.etap === "ciaza" && c.rola === "matka",
            hint: "Najwcześniej 6 tygodni przed przewidywaną datą porodu; wniosek minimum 14 dni wcześniej." },
          yn("zamiarPelnyWymiar", "Czy zamierzasz wykorzystać pełny urlop macierzyński i rodzicielski (z min. 1 dniem rodzicielskiego przed 1. urodzinami dziecka)?",
            { wide: true, if: (c) => c.rola === "matka", hint: "Od tego zależy możliwość wniosku o zasiłek 81,5% (do 21 dni po porodzie)." }),
          { name: "macierzynskiWykorzystanoTyg", label: "Ile tygodni urlopu macierzyńskiego po porodzie już wykorzystano?", type: "number", min: 0, max: 37, if: (c) => c.etap === "po_porodzie" },
          yn("matkaRezygnuje", "Czy matka rezygnuje z reszty urlopu macierzyńskiego na rzecz ojca (po min. 14 tygodniach)?",
            { wide: true, if: (c) => c.etap === "po_porodzie" && c.drugi && c.rola !== "inny" }),
          yn("planUzupelniajacy", "Czy chcesz skorzystać z uzupełniającego urlopu macierzyńskiego?", { wide: true, if: (c) => tak(c.d.pobytWSzpitalu) }),
          { name: "terminKoncaMacierzynskiego", label: "Termin zakończenia urlopu macierzyńskiego", type: "date", if: (c) => tak(c.d.pobytWSzpitalu) && tak(c.f.urlopy?.planUzupelniajacy),
            hint: "Bez tej daty wniosek o urlop uzupełniający jest wadliwy." },
          yn("drugiRodzicUzupelniajacy", "Czy drugi rodzic zamierza korzystać z uzupełniającego urlopu?", { wide: true, if: (c) => tak(c.d.pobytWSzpitalu) && tak(c.f.urlopy?.planUzupelniajacy) && c.drugi }),
        ],
      },
      {
        data: "urlopy",
        title: "Urlop ojcowski i rodzicielski",
        show: (c) => !!c.etap,
        fields: [
          yn("planOjcowski", "Czy chcesz skorzystać z urlopu ojcowskiego (2 tygodnie)?", { wide: true, if: (c) => c.rola === "ojciec" }),
          yn("ojcowskiZInnegoTytulu", "Czy zasiłek za urlop ojcowski pobrano już z innego tytułu?", { wide: true, if: (c) => c.rola === "ojciec" && tak(c.f.urlopy?.planOjcowski) }),
          yn("planRodzicielski", "Czy chcesz skorzystać z urlopu rodzicielskiego?", { wide: true }),
          { name: "rodzicielskieCzesci", label: "Ile części urlopu rodzicielskiego już wykorzystano?", type: "number", min: 0, max: 5, if: (c) => tak(c.f.urlopy?.planRodzicielski), hint: "Urlop można podzielić maksymalnie na 5 części." },
          { name: "rodzicielskiWykorzystanoTyg", label: "Ile tygodni urlopu rodzicielskiego już wykorzystano?", type: "number", min: 0, max: 67, if: (c) => tak(c.f.urlopy?.planRodzicielski) },
          { name: "rodzicielskiOd", label: "Planowany urlop rodzicielski - od", type: "date", if: (c) => tak(c.f.urlopy?.planRodzicielski), hint: "Wniosek składa się minimum 21 dni przed." },
          { name: "rodzicielskiDo", label: "Planowany urlop rodzicielski - do", type: "date", after: "rodzicielskiOd", if: (c) => tak(c.f.urlopy?.planRodzicielski) },
          { name: "drugiRodzicRodzicielski", label: "Czy drugi rodzic zamierza korzystać z urlopu rodzicielskiego?", type: "select", wide: true,
            if: (c) => tak(c.f.urlopy?.planRodzicielski) && c.drugi,
            options: [["nie", "Nie zamierza"], ["tak", "Tak, zamierza"], ["nie_wiem", "Jeszcze nie ustaliliśmy"]],
            hint: "Każde z rodziców ma 9 tygodni, których nie można przenieść na drugie." },
          yn("laczenieZPraca", "Czy chcesz łączyć urlop rodzicielski z pracą?", { wide: true, if: (c) => tak(c.f.urlopy?.planRodzicielski) && c.maTytul }),
          { name: "wymiarPracyPrzyLaczeniu", label: "Wymiar pracy w czasie urlopu", type: "select", if: (c) => tak(c.f.urlopy?.laczenieZPraca),
            options: [["do_polowy", "Do ½ etatu"], ["powyzej", "Więcej niż ½ etatu"]], hint: "Łączyć można maksymalnie z ½ etatu." },
        ],
      },
      {
        data: "urlopy",
        title: "Urlop wychowawczy i zasiłek opiekuńczy",
        show: (c) => c.etap === "po_porodzie" || c.etap === "przyjecie",
        fields: [
          yn("planWychowawczy", "Czy planujesz urlop wychowawczy (bez zasiłku)?", { wide: true, if: (c) => c.pracownik }),
          { name: "wychowawczyWykorzystanoMies", label: "Ile miesięcy urlopu wychowawczego już wykorzystano na to dziecko?", type: "number", min: 0, max: 36, if: (c) => c.pracownik && tak(c.f.urlopy?.planWychowawczy) },
          { name: "potrzebaOpieki", label: "Czy potrzebujesz zasiłku opiekuńczego?", type: "select", options: OPIEKA, wide: true },
          yn("domownikMozeOpiekowac", "Czy w Twoim domu jest ktoś, kto może zapewnić opiekę?", { wide: true, if: (c) => c.f.urlopy?.potrzebaOpieki && c.f.urlopy.potrzebaOpieki !== "brak" }),
          { name: "opiekunczyDniWRoku", label: "Ile dni zasiłku opiekuńczego wykorzystano w tym roku (Ty, drugi rodzic, inni)?", type: "number", min: 0, max: 60,
            if: (c) => c.f.urlopy?.potrzebaOpieki && c.f.urlopy.potrzebaOpieki !== "brak", hint: "Limit to łącznie 60 dni w roku kalendarzowym." },
        ],
      },
    ],
  },
  { id: "podsumowanie", title: "Podsumowanie", summary: true, sections: [] },
];

/* ---------- walidacja po stronie klienta (tylko format; PESEL/NIP bez sumy kontrolnej - dane testowe) ---------- */
const KINDS = {
  pesel: [/^\d{11}$/, "PESEL ma 11 cyfr."],
  nip: [/^\d{10}$/, "NIP ma 10 cyfr (bez kresek)."],
  regon: [/^(\d{9}|\d{14})$/, "REGON ma 9 lub 14 cyfr."],
  iban: [/^(PL)?\d{26}$/i, "Numer rachunku to 26 cyfr (opcjonalnie z prefiksem PL)."],
  money: [/^\d+([.,]\d{1,2})?$/, "Podaj kwotę, np. 4000 lub 4000,50."],
};

const toStr = (v) => (v === null || v === undefined ? "" : String(v));
const todayISO = () => new Date().toISOString().slice(0, 10);

const ctxOf = (form) => ({ ...derive(form), f: form });
const visibleSections = (step, c) => step.sections.filter((s) => !s.show || s.show(c));
const visibleFields = (sec, c) => sec.fields.filter((f) => !f.if || f.if(c));

function validate(form, sections) {
  const c = ctxOf(form);
  const errs = {};
  for (const sec of sections) {
    if (sec.show && !sec.show(c)) continue;
    for (const f of visibleFields(sec, c)) {
      const key = `${sec.data}.${f.name}`;
      const v = toStr(form[sec.data]?.[f.name]).trim();
      if (!v) continue;
      const kind = f.kind ?? (f.type === "money" ? "money" : null);
      if (kind) {
        const [re, msg] = KINDS[kind];
        if (!re.test(kind === "iban" ? v.replace(/\s/g, "") : v)) errs[key] = msg;
      }
      if (f.type === "number") {
        const n = Number(v);
        if (Number.isNaN(n) || (f.min !== undefined && n < f.min) || (f.max !== undefined && n > f.max)) {
          errs[key] = `Wpisz liczbę od ${f.min ?? 0} do ${f.max ?? "..."}.`;
        }
      }
      if (f.after) {
        const other = toStr(form[sec.data]?.[f.after]);
        if (other && v < other) errs[key] = "Ta data nie może być wcześniejsza niż poprzednia.";
      }
    }
  }
  return errs;
}

const isFilled = (v) => !(v === "" || v === null || v === undefined || v === false);


const stepProgress = (step, form) => {
  const c = ctxOf(form);
  let total = 0, done = 0;
  for (const sec of visibleSections(step, c)) {
    for (const f of visibleFields(sec, c)) {
      if (jestOpcjonalne(f, c)) continue;
      total += 1;
      if (isFilled(form[sec.data]?.[f.name])) done += 1;
    }
  }
  return { total, done };
};

// Dane, bez których nie da się wypełnić żadnego wniosku
const KLUCZOWE = [
  ["sytuacja", "etap", "etap (ciąża / po porodzie / przyjęcie)"],
  ["sytuacja", "rola", "Twoja rola (matka / ojciec / inny)"],
  ["ubezpieczony", "adres", "adres zamieszkania"],
  ["ubezpieczony", "rachunek", "numer rachunku bankowego"],
  ["ubezpieczony", "statusUbezpieczenia", "tytuł ubezpieczenia"],
];

const normalize = (p) => {
  const out = {};
  for (const k of ["ubezpieczony", "sytuacja", "platnik", "drugiRodzic", "dziecko", "zdrowie", "urlopy"]) out[k] = { ...(p?.[k] ?? {}) };
  const d = out.dziecko;
  if (!Array.isArray(d.dzieci)) d.dzieci = [];
  if (!d.liczbaDzieci && d.dzieci.length > 0) d.liczbaDzieci = String(d.dzieci.length);
  if (!d.dzieci.length && (d.imie || d.nazwisko || d.pesel || d.dataUrodzenia || d.miejsceUrodzenia)) {
    d.dzieci = [{
      imie: d.imie ?? "",
      nazwisko: d.nazwisko ?? "",
      pesel: d.pesel ?? "",
      dataUrodzenia: d.dataUrodzenia ?? "",
      miejsceUrodzenia: d.miejsceUrodzenia ?? "",
    }];
  }
  if (!out.sytuacja.rola) {
    if (out.ubezpieczony.plec === "K") out.sytuacja.rola = "matka";
    if (out.ubezpieczony.plec === "M") out.sytuacja.rola = "ojciec";
  }
  return out;
};

const CSS = `
.stepper{display:flex;flex-wrap:wrap;gap:.5rem;list-style:none;padding:0;margin:0 0 1.25rem}
.stepper button{border:1px solid rgba(128,128,128,.5);background:transparent;color:inherit;border-radius:999px;padding:.35rem .8rem;font:inherit;font-size:.9rem;cursor:pointer}
.stepper button[aria-current="step"]{background:var(--primary,#1d4ed8);border-color:var(--primary,#1d4ed8);color:#fff;font-weight:600}
.stepper .done{opacity:.75}
.step-bar{height:6px;border-radius:3px;background:rgba(128,128,128,.25);margin:0 0 1.25rem;overflow:hidden}
.step-bar>span{display:block;height:100%;background:var(--primary,#1d4ed8);transition:width .2s}
.step-nav{display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;margin-top:1.5rem}
.summary-list{list-style:none;padding:0;margin:0 0 1rem}
.summary-list li{display:flex;justify-content:space-between;gap:1rem;padding:.4rem 0;border-bottom:1px solid rgba(128,128,128,.25)}
`;

/* ---------- pole formularza ---------- */
function Field({ sec, f, form, c, errors, set }) {
  const id = `${sec.data}-${f.name}`;
  const err = errors[`${sec.data}.${f.name}`];
  const value = form[sec.data]?.[f.name];
  const cls = `field ${f.wide || f.type === "checkbox" ? "field-wide" : ""}`;

  if (f.type === "checkbox") {
    return (
      <div className={cls}>
        <label className="check">
          <input type="checkbox" checked={!!value} onChange={(e) => set(sec.data, f.name, e.target.checked)} />
          <span>{f.label}</span>
        </label>
      </div>
    );
  }

  const opts = typeof f.options === "function" ? f.options(c) : f.options;
  const inputType = f.type === "money" ? "text" : f.type === "select" ? null : f.type ?? "text";

  return (
    <div className={cls}>
      <label className="field-label" htmlFor={id}>{f.label}</label>
      {f.type === "select" ? (
        <select id={id} className="input" value={toStr(value)} onChange={(e) => set(sec.data, f.name, e.target.value)}>
          <option value="">- wybierz -</option>
          {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      ) : (
        <input
          id={id}
          className={`input ${err ? "is-invalid" : ""}`}
          type={inputType}
          inputMode={f.type === "money" ? "decimal" : f.inputMode}
          min={f.min}
          max={f.max === "today" ? todayISO() : f.max}
          placeholder={f.placeholder}
          value={toStr(value)}
          onChange={(e) => set(sec.data, f.name, e.target.value)}
          aria-invalid={!!err}
          aria-describedby={err ? `${id}-err` : undefined}
        />
      )}
      {err ? (
        <span id={`${id}-err`} className="field-error" role="alert">{err}</span>
      ) : (
        (() => {
          // `hint` może być tekstem albo funkcją kontekstu (np. inna podpowiedź dla ojca).
          const hint = typeof f.hint === "function" ? f.hint(c) : f.hint;
          return hint ? <span className="field-hint">{hint}</span> : null;
        })()
      )}
    </div>
  );
}

function DzieciFields({ form, setDziecko, c }) {
  if (!["po_porodzie", "przyjecie"].includes(c.etap)) return null;
  const count = c.etap === "przyjecie" ? 1 : Math.min(10, Math.max(1, Number(form.dziecko.liczbaDzieci) || 1));
  const dzieci = Array.from({ length: count }, (_, i) => form.dziecko.dzieci?.[i] ?? {});

  const update = (index, name, value) => {
    setDziecko((d) => {
      const next = Array.from({ length: count }, (_, i) => ({ ...(d.dzieci?.[i] ?? {}) }));
      next[index] = { ...next[index], [name]: value };
      const sync = index === 0 ? { [name]: value } : {};
      return { ...d, dzieci: next, ...sync };
    });
  };

  return (
    <section className="calc-group" aria-label="Dane poszczególnych dzieci">
      <h3 className="calc-group-title">{count === 1 ? "Dane dziecka" : `Dane wszystkich dzieci (${count})`}</h3>
      {dzieci.map((dziecko, index) => (
        <fieldset key={index} className="dziecko-card">
          <legend>{count === 1 ? "Dziecko" : `Dziecko ${index + 1}`}</legend>
          <div className="calc-grid">
            <label className="field">
              <span className="field-label">Imię</span>
              <input className="input" value={toStr(dziecko.imie)} onChange={(e) => update(index, "imie", e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Nazwisko</span>
              <input className="input" value={toStr(dziecko.nazwisko)} onChange={(e) => update(index, "nazwisko", e.target.value)} />
            </label>
            {c.etap === "po_porodzie" && (
              <>
                <label className="field">
                  <span className="field-label">PESEL dziecka (jeśli nadany)</span>
                  <input className="input" inputMode="numeric" value={toStr(dziecko.pesel)} onChange={(e) => update(index, "pesel", e.target.value)} />
                </label>
                <label className="field">
                  <span className="field-label">Data urodzenia</span>
                  <input className="input" type="date" max={todayISO()} value={toStr(dziecko.dataUrodzenia)} onChange={(e) => update(index, "dataUrodzenia", e.target.value)} />
                </label>
              </>
            )}
            {c.etap === "po_porodzie" && (
              <label className="field field-wide">
                <span className="field-label">Miejsce urodzenia</span>
                <input className="input" value={toStr(dziecko.miejsceUrodzenia)} onChange={(e) => update(index, "miejsceUrodzenia", e.target.value)} />
              </label>
            )}
          </div>
        </fieldset>
      ))}
    </section>
  );
}

/* ---------- strona ---------- */
export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, updatedAt, loading, save } = useProfile();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  // ?krok=dziecko – wejście prosto do etapu (np. z linku „uzupełnij” na stronie /wnioski)
  const [searchParams] = useSearchParams();
  const [stepId, setStepId] = useState(() => searchParams.get("krok") || "sytuacja");

  useEffect(() => {
    if (profile && !form) setForm(normalize(profile));
  }, [profile, form]);

  const set = (section, name, value) => {
    setForm((f) => {
      const nextSection = { ...f[section], [name]: value };
      if (section === "dziecko" && name === "liczbaDzieci") {
        const count = Math.min(10, Math.max(1, Number(value) || 1));
        const dzieci = Array.from({ length: count }, (_, i) => ({ ...(f.dziecko.dzieci?.[i] ?? {}) }));
        nextSection.dzieci = dzieci;
      }
      return { ...f, [section]: nextSection };
    });
    setErrors((e) => {
      const next = { ...e };
      delete next[`${section}.${name}`];
      return next;
    });
    setStatus("idle");
  };

  const setDziecko = (updater) => {
    setForm((f) => ({ ...f, dziecko: typeof updater === "function" ? updater(f.dziecko) : updater }));
    setStatus("idle");
  };

  if (loading || !form) {
    return (
      <div className="app">
        <AppHeader />
        <main className="container"><p className="center-msg">Wczytywanie…</p></main>
      </div>
    );
  }

  const c = ctxOf(form);
  const steps = STEPS.filter((s) => !s.show || s.show(c));
  const idx = Math.max(0, steps.findIndex((s) => s.id === stepId));
  const step = steps[idx];
  const last = idx === steps.length - 1;
  const allSections = STEPS.flatMap((s) => s.sections);

  const persist = async () => {
    setStatus("saving");
    const res = await save(form);
    if (res.ok) {
      setErrors({});
      setStatus("saved");
      return true;
    }
    setErrors(res.errors ?? {});
    setStatus("error");
    return false;
  };

  const go = async (target) => {
    // zapis przy przejściu dalej; cofanie i skakanie po etapach nie blokuje
    const targetIdx = steps.findIndex((s) => s.id === target);
    if (targetIdx > idx) {
      const errs = validate(form, step.sections);
      if (Object.keys(errs).length) {
        setErrors(errs);
        setStatus("error");
        return;
      }
      if (!(await persist())) return;
    }
    setStepId(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!last) return go(steps[idx + 1].id);
    const errs = validate(form, allSections);
    if (Object.keys(errs).length) {
      setErrors(errs);
      setStatus("error");
      const firstBad = steps.find((s) => s.sections.some((sec) => Object.keys(errs).some((k) => k.startsWith(`${sec.data}.`) && sec.fields.some((f) => k === `${sec.data}.${f.name}`))));
      if (firstBad) setStepId(firstBad.id);
      return;
    }
    await persist();
  };

  const sections = step.summary ? [] : visibleSections(step, c);
  const brakuje = KLUCZOWE.filter(([sec, name]) => !isFilled(form[sec]?.[name]));
  const okolicznosci = (v) => TYTULY.find(([k]) => k === v)?.[1] ?? "-";

  return (
    <div className="app">
      <AppHeader />
      <style>{CSS}</style>

      <main className="container">
        <h1>Moje dane</h1>
        <p className="lead">
          Wpisz je raz - na ich podstawie dobierzemy wnioski, które możesz złożyć, i podstawimy dane do formularzy.
          Wszystkie pola są opcjonalne, możesz uzupełniać stopniowo; zapisujemy po każdym etapie.
        </p>

        <ol className="stepper" aria-label="Etapy formularza">
          {steps.map((s, i) => {
            const p = s.summary ? null : stepProgress(s, form);
            const complete = p && p.total > 0 && p.done === p.total;
            return (
              <li key={s.id}>
                <button type="button" className={complete ? "done" : ""} aria-current={s.id === step.id ? "step" : undefined} onClick={() => go(s.id)}>
                  {i + 1}. {s.title}{complete ? " ✓" : ""}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="step-bar" aria-hidden="true"><span style={{ width: `${((idx + 1) / steps.length) * 100}%` }} /></div>

        <form className="profile-form" onSubmit={onSubmit} noValidate>
          <h2>{step.title}</h2>
          {step.intro && <p className="group-hint">{step.intro}</p>}

          {step.id === "sytuacja" && (
            <section className="info-card" aria-label="Dane z mObywatela">
              <h2>Z mObywatela</h2>
              <dl className="data-list">
                <div><dt>Imię i nazwisko</dt><dd>{form.ubezpieczony.imie} {form.ubezpieczony.nazwisko}</dd></div>
                <div><dt>PESEL</dt><dd>{form.ubezpieczony.peselMasked ?? user?.peselMasked}</dd></div>
                <div><dt>Data urodzenia</dt><dd>{form.ubezpieczony.dataUrodzenia || "-"}</dd></div>
                <div><dt>Płeć (z PESEL)</dt><dd>{form.ubezpieczony.plec === "K" ? "Kobieta" : form.ubezpieczony.plec === "M" ? "Mężczyzna" : "-"}</dd></div>
              </dl>
            </section>
          )}

          {!step.summary && sections.length === 0 && <p className="field-hint">{step.emptyNote ?? "Ten etap nie dotyczy Twojej sytuacji. Przejdź dalej."}</p>}

          {step.id === "dziecko" && <DzieciFields form={form} setDziecko={setDziecko} c={c} />}

          {sections.map((sec, i) => (
            <section key={`${sec.data}-${i}`} className="calc-group" aria-labelledby={`h-${step.id}-${i}`}>
              {(sec.title && (sec.title !== step.title || sections.length > 1)) && (
                <h3 id={`h-${step.id}-${i}`} className="calc-group-title">{sec.title}</h3>
              )}
              {sec.hint && <p className="group-hint">{sec.hint}</p>}
              <div className="calc-grid">
                {visibleFields(sec, c).map((f) => (
                  <Field key={`${sec.data}-${f.name}`} sec={sec} f={f} form={form} c={c} errors={errors} set={set} />
                ))}
              </div>
            </section>
          ))}

          {step.summary && (
            <section className="calc-group" aria-label="Podsumowanie">
              <ul className="summary-list">
                {steps.filter((s) => !s.summary).map((s) => {
                  const p = stepProgress(s, form);
                  return (
                    <li key={s.id}>
                      <button type="button" className="btn btn-link" onClick={() => setStepId(s.id)}>{s.title}</button>
                      <span>{p.total === 0 ? "nie dotyczy" : `${p.done} / ${p.total} pól`}</span>
                    </li>
                  );
                })}
              </ul>
              <dl className="data-list">
                <div><dt>Etap</dt><dd>{ETAPY_DLA(form.ubezpieczony?.plec, form.sytuacja?.rola).find(([v]) => v === form.sytuacja.etap)?.[1] ?? "-"}</dd></div>
                <div><dt>Rola</dt><dd>{ROLE.find(([v]) => v === form.sytuacja.rola)?.[1] ?? "-"}</dd></div>
                <div><dt>Tytuł ubezpieczenia</dt><dd>{okolicznosci(form.ubezpieczony.statusUbezpieczenia)}</dd></div>
                <div><dt>Drugi rodzic</dt><dd>{form.drugiRodzic.brak ? "brak" : [form.drugiRodzic.imie, form.drugiRodzic.nazwisko].filter(Boolean).join(" ") || "-"}</dd></div>
              </dl>
              {brakuje.length > 0 && (
                <p className="field-error" role="status">
                  Do wniosków brakuje jeszcze: {brakuje.map((b) => b[2]).join(", ")}.
                </p>
              )}
            </section>
          )}

          <div className="step-nav form-actions">
            {idx > 0 && <button type="button" className="btn" onClick={() => go(steps[idx - 1].id)}>← Wstecz</button>}
            <button className="btn btn-primary" type="submit" disabled={status === "saving"}>
              {status === "saving" ? "Zapisuję…" : last ? "Zapisz dane" : "Dalej →"}
            </button>
            {status === "saved" && <span className="form-ok" role="status">Zapisano ✓</span>}
            {status === "error" && <span className="field-error" role="alert">{errors._ ?? "Popraw zaznaczone pola."}</span>}
            {updatedAt && status === "idle" && (
              <span className="field-hint">Ostatnio zapisano: {new Date(updatedAt).toLocaleString("pl-PL")}</span>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}