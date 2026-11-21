/* =====================================================================
   SYMULACJA usług ZUS i USC (wymóg zadania: „wszystkie integracje tylko
   zasymulowane”). Dane są FIKCYJNE – osoby, firmy, numery NIP/REGON
   i zwolnienia zostały wymyślone na potrzeby demo.
   W docelowym wdrożeniu te endpointy zastępuje integracja z PUE/eZUS
   (dane o ubezpieczeniu, e-ZLA, zaświadczenia) i z rejestrem stanu cywilnego.

   Endpointy (wszystkie wymagają zalogowania):
     GET  /api/zus/dane            – ubezpieczenie, płatnik, wynagrodzenia z 12 mies.
     GET  /api/zus/ezla            – zwolnienia lekarskie (e-ZLA) z kodami literowymi
     GET  /api/zus/zaswiadczenie   – zaświadczenie o niezaleganiu / zadłużeniu na dzień (?naDzien=RRRR-MM-DD)
     GET  /api/zus/wnioski         – status wniosków w PUE/eZUS
     GET  /api/usc/odpisy          – złożone wnioski o odpis aktu urodzenia
     POST /api/usc/odpisy          – nowy wniosek o odpis aktu urodzenia
   ===================================================================== */
import crypto from "node:crypto";

const ostatnie12 = (kwota) => {
  // 12 pełnych miesięcy przed bieżącym (stan na dzień symulacji)
  const out = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 12; i >= 1; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({ miesiac: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`, kwota });
  }
  return out;
};

// Klucz: PESEL osoby z symulowanego mObywatela (backend/db.js → SEED).
const OSOBY = {
  // Bożena – etat, duży pracodawca, w ciąży (e-ZLA z kodem B)
  "91041748260": {
    statusUbezpieczenia: "pracownik",
    opis: "Umowa o pracę, pełny etat; zwolnienia w ciąży z kodem B.",
    ubezpieczenia: [
      { tytul: "Umowa o pracę (pełny etat)", platnik: "Przedszkole Słoneczko sp. z o.o.", od: "2019-09-01", do: null, chorobowe: "obowiązkowe" },
      { tytul: "Umowa zlecenia", platnik: "Fundacja Kolorowe Kredki", od: "2017-03-01", do: "2019-06-30", chorobowe: "dobrowolne" },
    ],
    platnik: {
      nazwa: "Przedszkole Słoneczko sp. z o.o. (dane fikcyjne)",
      adres: "ul. Tęczowa 7, 00-950 Warszawa",
      nip: "1234563218",
      regon: "123456785",
      liczbaUbezpieczonych: 34,
    },
    wynagrodzenia: ostatnie12(6000),
    ezla: [
      { numer: "ZY 1234567", od: "2026-08-04", do: "2026-08-31", kod: "B", lekarz: "lek. Anna Kowalska (fikcyjna)" },
      { numer: "ZY 1234890", od: "2026-09-01", do: "2026-10-31", kod: "B", lekarz: "lek. Anna Kowalska (fikcyjna)" },
      { numer: "ZY 1235012", od: "2026-11-01", do: "2026-12-31", kod: "B", lekarz: "lek. Anna Kowalska (fikcyjna)" },
    ],
    zadluzenie: 0,
    wnioski: [
      { typ: "Zaświadczenie płatnika Z-3 (zasiłek chorobowy)", zlozono: "2026-09-02", status: "Wypłacono", kto: "Płatnik składek" },
      { typ: "Wniosek o urlop macierzyński (do pracodawcy)", zlozono: "2026-11-18", status: "Przyjęty przez pracodawcę", kto: "Pracodawca" },
    ],
  },

  // Marzena – działalność gospodarcza, dobrowolne chorobowe, ZALEGŁOŚĆ składkowa
  "87090371522": {
    statusUbezpieczenia: "dg",
    opis: "Działalność gospodarcza, dobrowolne ubezpieczenie chorobowe; zaległość w składkach blokuje zasiłki.",
    ubezpieczenia: [
      { tytul: "Pozarolnicza działalność gospodarcza", platnik: "Marzena Wiśniewska Pracownia Grafiki (fikcyjna)", od: "2024-02-01", do: null, chorobowe: "dobrowolne od 2025-03-01" },
      { tytul: "Umowa o pracę", platnik: "Drukarnia Nowa Linia sp. j.", od: "2015-05-04", do: "2024-01-31", chorobowe: "obowiązkowe" },
    ],
    platnik: {
      nazwa: "Marzena Wiśniewska Pracownia Grafiki (dane fikcyjne)",
      adres: "ul. Malarska 12/3, 30-001 Kraków",
      nip: "5213456782",
      regon: "987654324",
      liczbaUbezpieczonych: 1,
    },
    // przy działalności: zadeklarowana podstawa składek (tzw. duży ZUS = 5 652 zł w 2026)
    wynagrodzenia: ostatnie12(5652),
    ezla: [
      { numer: "ZY 2200451", od: "2026-10-12", do: "2026-11-30", kod: "B", lekarz: "lek. Piotr Nowicki (fikcyjny)" },
    ],
    zadluzenie: 312.4,
    wnioski: [
      { typ: "ZAS-53 – wniosek o zasiłek chorobowy", zlozono: "2026-10-14", status: "Wstrzymany – zaległość w składkach (art. 2a ustawy zasiłkowej)", kto: "ZUS" },
    ],
  },

  // Mariusz – etat, tata; bez zwolnień
  "94122530836": {
    statusUbezpieczenia: "pracownik",
    opis: "Umowa o pracę; przyszły tata – urlop ojcowski i część rodzicielskiego.",
    ubezpieczenia: [
      { tytul: "Umowa o pracę (pełny etat)", platnik: "Logistyka Północ S.A. (fikcyjna)", od: "2020-02-03", do: null, chorobowe: "obowiązkowe" },
    ],
    platnik: {
      nazwa: "Logistyka Północ S.A. (dane fikcyjne)",
      adres: "ul. Portowa 44, 80-001 Gdańsk",
      nip: "5832224446",
      regon: "220011223",
      liczbaUbezpieczonych: 128,
    },
    wynagrodzenia: ostatnie12(7500),
    ezla: [
      { numer: "ZY 3301877", od: "2026-03-02", do: "2026-03-06", kod: "", lekarz: "lek. Ewa Wiśniewska (fikcyjna)" },
    ],
    zadluzenie: 0,
    wnioski: [],
  },
};

const DOMYSLNA = {
  statusUbezpieczenia: "pracownik",
  opis: "Brak danych w symulacji dla tej osoby.",
  ubezpieczenia: [],
  platnik: null,
  wynagrodzenia: [],
  ezla: [],
  zadluzenie: 0,
  wnioski: [],
};

const osoba = (user) => OSOBY[user.pesel] ?? DOMYSLNA;
// Prawdziwa data RRRR-MM-DD (30 lutego i 2026-13-45 odpadają – Date by je „przesunął”).
const isoDate = (v) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v ?? "")) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v ? v : null;
};
const wPrzyszlosci = (iso) => iso > new Date().toISOString().slice(0, 10);

// Wnioski o odpis aktu urodzenia – w pamięci (symulacja; po restarcie znikają).
const odpisy = new Map(); // userId -> [wniosek]

// Wartości techniczne bez polskich znaków (polskie nazwy są w interfejsie).
const RODZAJE_ODPISU = ["skrocony", "zupelny", "wielojezyczny"];
const ODBIOR = ["elektronicznie", "usc"];

export function registerZusMockRoutes(app, requireAuth) {
  app.get("/api/zus/dane", requireAuth, (req, res) => {
    const o = osoba(req.user);
    res.json({
      symulacja: true,
      opis: o.opis,
      statusUbezpieczenia: o.statusUbezpieczenia,
      ubezpieczenia: o.ubezpieczenia,
      platnik: o.platnik,
      wynagrodzenia: o.wynagrodzenia,
    });
  });

  app.get("/api/zus/ezla", requireAuth, (req, res) => {
    res.json({ symulacja: true, ezla: osoba(req.user).ezla });
  });

  app.get("/api/zus/zaswiadczenie", requireAuth, (req, res) => {
    const naDzien = isoDate(req.query.naDzien) ?? new Date().toISOString().slice(0, 10);
    const o = osoba(req.user);
    res.json({
      symulacja: true,
      numer: `ZUS/ZAS/${naDzien.replaceAll("-", "")}/${crypto.randomInt(1000, 10000)}`,
      naDzien,
      wystawiono: new Date().toISOString(),
      // Próg blokady (1% minimalnego wynagrodzenia) porównuje front z parametrami kalkulatorów.
      zadluzenie: o.statusUbezpieczenia === "pracownik" ? 0 : o.zadluzenie,
      dotyczyPlatnika: o.statusUbezpieczenia !== "pracownik",
    });
  });

  app.get("/api/zus/wnioski", requireAuth, (req, res) => {
    res.json({ symulacja: true, wnioski: osoba(req.user).wnioski });
  });

  app.get("/api/usc/odpisy", requireAuth, (req, res) => {
    res.json({ symulacja: true, odpisy: odpisy.get(req.user.id) ?? [] });
  });

  app.post("/api/usc/odpisy", requireAuth, (req, res) => {
    const b = req.body ?? {};
    const imie = String(b.imie ?? "").trim().slice(0, 60);
    const nazwisko = String(b.nazwisko ?? "").trim().slice(0, 60);
    const dataUrodzenia = isoDate(b.dataUrodzenia);
    const miejsceUrodzenia = String(b.miejsceUrodzenia ?? "").trim().slice(0, 80);
    const rodzaj = RODZAJE_ODPISU.includes(b.rodzaj) ? b.rodzaj : null;
    const odbior = ODBIOR.includes(b.odbior) ? b.odbior : null;

    const errors = {};
    if (!imie) errors.imie = "Podaj imię dziecka.";
    if (!nazwisko) errors.nazwisko = "Podaj nazwisko dziecka.";
    if (!dataUrodzenia) errors.dataUrodzenia = "Podaj poprawną datę urodzenia.";
    else if (wPrzyszlosci(dataUrodzenia)) errors.dataUrodzenia = "Data urodzenia nie może być w przyszłości.";
    if (!miejsceUrodzenia) errors.miejsceUrodzenia = "Podaj miejsce urodzenia.";
    if (!rodzaj) errors.rodzaj = "Wybierz rodzaj odpisu.";
    if (!odbior) errors.odbior = "Wybierz sposób odbioru.";
    if (Object.keys(errors).length) return res.status(400).json({ error: "Uzupełnij wniosek.", errors });

    const wniosek = {
      numer: `USC-${new Date().getFullYear()}-${crypto.randomInt(100000, 1000000)}`,
      zlozono: new Date().toISOString(),
      imie,
      nazwisko,
      dataUrodzenia,
      miejsceUrodzenia,
      rodzaj,
      odbior,
      status: "Przyjęty – w realizacji",
    };
    odpisy.set(req.user.id, [wniosek, ...(odpisy.get(req.user.id) ?? [])].slice(0, 20));
    res.status(201).json({ symulacja: true, wniosek });
  });
}
