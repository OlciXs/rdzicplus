// Prosta "baza danych" w pliku JSON (backend/data/db.json).
// Zero instalacji. Całość jest schowana za obiektem `db`, więc później
// łatwo podmienisz to na SQLite / PostgreSQL bez ruszania server.js.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, "data", "db.json");

// Dane startowe: osoby "z mObywatela" do testów (dane FIKCYJNE).
// Cztery przypadki demo:
//   - Bożena: ciąża (etat, e-ZLA z kodem B, pracodawca wypłaca),
//   - Marzena: po porodzie, działalność gospodarcza (zasiłki wypłaca ZUS),
//   - Mariusz: ojciec po porodzie na etacie (urlop ojcowski + rodzicielski),
//   - Alicja: pusty profil - dane trzeba od zera wypełnić po zalogowaniu.
const SEED = {
  mobywatelProfiles: [
    { id: "mob-bozena", imie: "Bożena", nazwisko: "Nowak", pesel: "91041748260" },
    { id: "mob-marzena", imie: "Marzena", nazwisko: "Wiśniewska", pesel: "87090371522" },
    { id: "mob-mariusz", imie: "Mariusz", nazwisko: "Zieliński", pesel: "94122530836" },
    { id: "mob-alicja", imie: "Alicja", nazwisko: "Sosnowska", pesel: "98031510242" },
  ],
  // Użytkownicy aplikacji - tworzą się sami przy pierwszym logowaniu.
  // Trzy gotowe profile demonstracyjne (dane FIKCYJNE), żeby świeża instalacja
  // od razu pokazywała trzy różne przypadki; profilu wypełnia getOrCreateProfile,
  // więc poniżej są tylko wypełnione pola (płeć i data urodzenia wyliczy się z PESEL-u).
  users: [
    {
      id: "demo-bozena",
      pesel: "91041748260",
      imie: "Bożena",
      nazwisko: "Nowak",
      createdAt: "2026-11-01T10:00:00.000Z",
      lastLoginAt: "2026-11-22T00:00:00.000Z",
      profile: {
        ubezpieczony: {
          adres: "ul. Lipowa 8/3, 00-001 Warszawa",
          rachunek: "PL61109010140000071219812874",
          statusUbezpieczenia: "pracownik",
          podstawaWymiaru: "5200",
          wymiarEtatu: "pelny",
          zatrudnionyOd: "2022-03-01",
        },
        sytuacja: { etap: "ciaza", rola: "matka" },
        platnik: {
          nazwa: "Alfa Medical Sp. z o.o. (fikcyjna)",
          adres: "ul. Przemysłowa 2, 00-002 Warszawa",
          nip: "5261040147",
          regon: "012345678",
          liczbaUbezpieczonych: "powyzej_20",
        },
        dziecko: { liczbaDzieci: "1", przewidywanaDataPorodu: "2027-01-20", dzieci: [] },
        zdrowie: { zwolnienie: "B", zlaNumer: "ZLA/B/2026/001", zlaOd: "2026-11-09", zlaDo: "2026-12-07" },
        urlopy: { zamiarPelnyWymiar: "tak", planRodzicielski: "nie" },
      },
      profileUpdatedAt: "2026-11-22T00:00:00.000Z",
    },
    {
      id: "demo-marzena",
      pesel: "87090371522",
      imie: "Marzena",
      nazwisko: "Wiśniewska",
      createdAt: "2026-11-01T11:00:00.000Z",
      lastLoginAt: "2026-11-22T00:00:00.000Z",
      profile: {
        ubezpieczony: {
          adres: "ul. Dworcowa 14, 85-001 Bydgoszcz",
          rachunek: "PL12345678901234567890123456",
          statusUbezpieczenia: "dg",
          podstawaWymiaru: "4877.11",
          ubezpieczenieOd: "2023-06-01",
          zaleglosci: "tak",
        },
        sytuacja: { etap: "po_porodzie", rola: "matka" },
        platnik: {
          nazwa: "Marzena Wiśniewska Pracownia Grafiki (fikcyjna)",
          adres: "ul. Dworcowa 14, 85-001 Bydgoszcz",
          nip: "9541243678",
          regon: "345612789",
        },
        drugiRodzic: {
          imie: "Marek",
          nazwisko: "Wiśniewski",
          pesel: "86040251571",
          rola: "ojciec",
          statusUbezpieczenia: "pracownik",
          platnikNazwa: "Beta Logistics (fikcyjna)",
          brak: false,
        },
        dziecko: {
          liczbaDzieci: "1",
          dataUrodzenia: "2026-09-28",
          miejsceUrodzenia: "Bydgoszcz",
          pobytWSzpitalu: "nie",
          zaZyciem: false,
          dzieci: [
            { imie: "Ola", nazwisko: "Wiśniewska", pesel: "", dataUrodzenia: "2026-09-28", miejsceUrodzenia: "Bydgoszcz" },
          ],
        },
        // Poród 28.09.2026 → macierzyński do 14.02.2027; rodzicielski zaraz po nim, 32 tyg. (41 − 9 dla ojca).
        urlopy: { planRodzicielski: "tak", rodzicielskiOd: "2027-02-15", rodzicielskiDo: "2027-09-26" },
      },
      profileUpdatedAt: "2026-11-22T00:00:00.000Z",
    },
    {
      id: "demo-mariusz",
      pesel: "94122530836",
      imie: "Mariusz",
      nazwisko: "Zieliński",
      createdAt: "2026-11-01T12:00:00.000Z",
      lastLoginAt: "2026-11-22T00:00:00.000Z",
      profile: {
        ubezpieczony: {
          adres: "ul. Słoneczna 12/4, 00-001 Warszawa",
          rachunek: "PL61109010140000071219812874",
          statusUbezpieczenia: "pracownik",
          podstawaWymiaru: "6200",
          wymiarEtatu: "pelny",
          zatrudnionyOd: "2021-09-01",
        },
        sytuacja: { etap: "po_porodzie", rola: "ojciec" },
        platnik: {
          nazwa: "Gamma Software Sp. z o.o. (fikcyjna)",
          nip: "5272367890",
          regon: "678912345",
          liczbaUbezpieczonych: "powyzej_20",
        },
        drugiRodzic: {
          imie: "Zofia",
          nazwisko: "Zielińska",
          pesel: "93010812345",
          rola: "matka",
          statusUbezpieczenia: "pracownik",
          brak: false,
        },
        dziecko: {
          liczbaDzieci: "1",
          dataUrodzenia: "2026-10-05",
          pobytWSzpitalu: "nie",
          dzieci: [
            { imie: "Antek", nazwisko: "Zieliński", pesel: "", dataUrodzenia: "2026-10-05", miejsceUrodzenia: "Warszawa" },
          ],
        },
        urlopy: { planOjcowski: "tak", planRodzicielski: "tak", laczenieZPraca: "nie", matkaRezygnuje: "nie" },
      },
      profileUpdatedAt: "2026-11-22T00:00:00.000Z",
    },
  ],
};

function load() {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(SEED, null, 2));
  }
  const d = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  // db.json jest w repo, więc SEED był używany tylko przy braku pliku – nowe osoby demo (np. Alicja)
  // i gotowe profile demo nigdy nie trafiały ani lokalnie, ani na serwer. Dokładamy brakujące osoby,
  // a profil demo dostaje tylko konto, które nigdy nie zapisało własnego profilu (niczego nie nadpisujemy).
  if (uzupelnijSeed(d)) fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2));
  return d;
}

export function uzupelnijSeed(d) {
  let zmiana = false;
  d.mobywatelProfiles ??= [];
  d.users ??= [];
  for (const p of SEED.mobywatelProfiles) {
    if (!d.mobywatelProfiles.some((x) => x.id === p.id || x.pesel === p.pesel)) {
      d.mobywatelProfiles.push({ ...p });
      zmiana = true;
    }
  }
  for (const u of SEED.users) {
    const istniejacy = d.users.find((x) => x.pesel === u.pesel);
    if (!istniejacy) {
      d.users.push(structuredClone(u));
      zmiana = true;
    } else if (!istniejacy.profileUpdatedAt && u.profile) {
      istniejacy.profile = structuredClone(u.profile);
      istniejacy.profileUpdatedAt = u.profileUpdatedAt;
      zmiana = true;
    }
  }
  return zmiana;
}

const data = load();

// Płeć z PESEL-u: 10. cyfra parzysta = kobieta ("K"), nieparzysta = mężczyzna ("M").
// Kalkulatory (useProfileDefaults) na tej podstawie wpisują dane w pola matki albo ojca.
const plecZPesel = (pesel) => (/^\d{11}$/.test(pesel ?? "") ? (Number(pesel[9]) % 2 ? "M" : "K") : "");

// Data urodzenia z PESEL-u (RRMMDD; do miesiąca dodaje się 80/0/20/40/60 dla lat 1800/1900/2000/2100/2200).
const dataUrodzeniaZPesel = (pesel) => {
  if (!/^\d{11}$/.test(pesel ?? "")) return "";
  const rr = Number(pesel.slice(0, 2));
  const mm = Number(pesel.slice(2, 4));
  const dd = pesel.slice(4, 6);
  const [wiek, odjac] = mm > 80 ? [1800, 80] : mm > 60 ? [2200, 60] : mm > 40 ? [2100, 40] : mm > 20 ? [2000, 20] : [1900, 0];
  return `${wiek + rr}-${String(mm - odjac).padStart(2, "0")}-${dd}`;
};

// Pola wyliczane z PESEL-u (z mObywatela) – nie da się ich nadpisać z formularza.
const zPesel = (user) => ({ plec: plecZPesel(user?.pesel), dataUrodzenia: dataUrodzeniaZPesel(user?.pesel) });

// Sekcje profilu edytowalne z formularza (kolejność bez znaczenia).
const SECTIONS = ["ubezpieczony", "sytuacja", "platnik", "drugiRodzic", "dziecko", "zdrowie", "urlopy"];

// Pola tekstowe / tak-nie zapisujemy jako "" gdy brak odpowiedzi; "tak" | "nie" dla pytań tak/nie.
const blank = (names) => Object.fromEntries(names.map((n) => [n, ""]));

const emptyProfile = (user) => ({
  ubezpieczony: {
    imie: user?.imie || "",
    nazwisko: user?.nazwisko || "",
    peselMasked: user ? "*".repeat(7) + user.pesel.slice(-4) : "",
    ...zPesel(user),
    ...blank([
      "adres", "rachunek", "statusUbezpieczenia", "podstawaWymiaru",
      "ubezpieczenieOd", "ulgaWyczekiwania", "wymiarEtatu", "zmianaWymiaru12m", "zatrudnionyOd",
      "pracaZaGranica", "pracaTymczasowa", "zaleglosci", "wiecejNizJedenTytul",
      "emeryturaRenta", "zasilekBezrobotnych", "rolnik",
      "ubezpieczenieUstalo", "dataUstania", "przyczynaUstania", "zapewnionoInnaPrace",
    ]),
  },
  sytuacja: blank(["etap", "rola", "typPrzyjecia"]),
  platnik: blank(["nazwa", "adres", "nip", "regon", "liczbaUbezpieczonych"]),
  drugiRodzic: {
    ...blank([
      "imie", "nazwisko", "pesel", "rola", "adres", "statusUbezpieczenia", "podstawaWymiaru",
      "platnikNazwa", "platnikNip", "okolicznosc", "dataOkolicznosci",
    ]),
    brak: false,
  },
  dziecko: {
    ...blank([
      "imie", "nazwisko", "pesel", "dataUrodzenia", "miejsceUrodzenia", "liczbaDzieci",
      "przewidywanaDataPorodu", "martwe", "zmarlo", "dataZgonu", "liczbaZyjacych", "zaGranica", "kraj",
      "pobytWSzpitalu", "tydzienCiazy", "masaUrodzenia", "szpitalOd", "szpitalDo",
      "dataPrzyjecia", "odroczonySzkolny", "niepelnosprawne",
    ]),
    zaZyciem: false,
    dzieci: [],
  },
  zdrowie: blank([
    "zwolnienie", "zlaNumer", "zlaOd", "zlaDo", "wczesniejszeZwolnienia",
    "okresZasilkowyWyczerpany", "rokowaniaPoprawy", "wypadekWDrodze",
  ]),
  urlopy: blank([
    "urlopPrzedPorodemOd", "zamiarPelnyWymiar", "macierzynskiWykorzystanoTyg", "matkaRezygnuje",
    "planUzupelniajacy", "terminKoncaMacierzynskiego", "drugiRodzicUzupelniajacy",
    "planOjcowski", "ojcowskiZInnegoTytulu", "planRodzicielski", "rodzicielskieCzesci",
    "rodzicielskiWykorzystanoTyg", "rodzicielskiOd", "rodzicielskiDo", "drugiRodzicRodzicielski",
    "laczenieZPraca", "wymiarPracyPrzyLaczeniu", "planWychowawczy", "wychowawczyWykorzystanoMies",
    "potrzebaOpieki", "domownikMozeOpiekowac", "opiekunczyDniWRoku",
  ]),
});

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

export const db = {
  // Zmiany parametrów kalkulatorów z panelu admina (tylko różnice względem wartości
  // domyślnych z frontend/src/engine/params.js). Pusty obiekt = wszystko domyślne.
  getParamOverrides: () => data.paramOverrides ?? {},

  setParamOverrides(overrides) {
    data.paramOverrides = overrides;
    save();
    return data.paramOverrides;
  },

  listProfiles: () => data.mobywatelProfiles,

  getProfile: (id) => data.mobywatelProfiles.find((p) => p.id === id),

  getUser: (id) => data.users.find((u) => u.id === id),

  getOrCreateProfile(userId) {
    const user = data.users.find((u) => u.id === userId);
    if (!user) return null;
    // Profile zapisane wcześniej nie mają nowych sekcji/pól - dokładamy puste, istniejące wartości zostają.
    const base = emptyProfile(user);
    const old = user.profile ?? {};
    for (const section of SECTIONS) base[section] = { ...base[section], ...(old[section] ?? {}) };
    user.profile = base;
    // płeć i data urodzenia zawsze z PESEL-u
    Object.assign(user.profile.ubezpieczony, zPesel(user));
    if (!user.profileUpdatedAt) user.profileUpdatedAt = null;
    save();
    return { profile: user.profile, updatedAt: user.profileUpdatedAt };
  },

  saveProfile(userId, nextProfile) {
    const user = data.users.find((u) => u.id === userId);
    if (!user) return null;
    user.profile = emptyProfile(user);

    for (const section of SECTIONS) {
      const source = nextProfile?.[section];
      if (!source || typeof source !== "object") continue;
      for (const key of Object.keys(user.profile[section])) {
        const v = source[key];
        // Tylko wartości proste (tekst / liczba / tak-nie). Obiekt albo tablica w polu
        // dawały w formularzu „[object Object]” i śmieci w silniku wniosków.
        if (typeof v === "string") user.profile[section][key] = v.slice(0, 1000);
        else if (typeof v === "boolean" || (typeof v === "number" && Number.isFinite(v))) user.profile[section][key] = v;
      }
      if (section === "dziecko" && Array.isArray(source.dzieci)) {
        user.profile.dziecko.dzieci = source.dzieci
          .slice(0, 10)
          .filter((dziecko) => dziecko && typeof dziecko === "object")
          .map((dziecko) => ({
            imie: typeof dziecko.imie === "string" ? dziecko.imie.slice(0, 60) : "",
            nazwisko: typeof dziecko.nazwisko === "string" ? dziecko.nazwisko.slice(0, 60) : "",
            pesel: typeof dziecko.pesel === "string" ? dziecko.pesel.slice(0, 11) : "",
            dataUrodzenia: typeof dziecko.dataUrodzenia === "string" ? dziecko.dataUrodzenia.slice(0, 10) : "",
            miejsceUrodzenia: typeof dziecko.miejsceUrodzenia === "string" ? dziecko.miejsceUrodzenia.slice(0, 120) : "",
          }));
      }
    }

    user.profile.ubezpieczony.imie = user.imie;
    user.profile.ubezpieczony.nazwisko = user.nazwisko;
    user.profile.ubezpieczony.peselMasked = "*".repeat(7) + user.pesel.slice(-4);
    Object.assign(user.profile.ubezpieczony, zPesel(user)); // nie da się nadpisać z formularza
    user.profileUpdatedAt = new Date().toISOString();
    save();
    return { profile: user.profile, updatedAt: user.profileUpdatedAt };
  },

  // Po zalogowaniu zapisujemy (lub odświeżamy) dane osoby: PESEL, imię, nazwisko
  upsertUserFromProfile(profile) {
    const now = new Date().toISOString();
    let user = data.users.find((u) => u.pesel === profile.pesel);

    if (user) {
      user.imie = profile.imie;
      user.nazwisko = profile.nazwisko;
      user.lastLoginAt = now;
    } else {
      user = {
        id: crypto.randomUUID(),
        pesel: profile.pesel,
        imie: profile.imie,
        nazwisko: profile.nazwisko,
        createdAt: now,
        lastLoginAt: now,
      };
      data.users.push(user);
    }

    save();
    return user;
  },
};