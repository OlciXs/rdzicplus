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
const SEED = {
  mobywatelProfiles: [
    { id: "mob-bozena", imie: "Bożena", nazwisko: "Nowak", pesel: "91041748260" },
    { id: "mob-marzena", imie: "Marzena", nazwisko: "Wiśniewska", pesel: "87090371522" },
    { id: "mob-mariusz", imie: "Mariusz", nazwisko: "Zieliński", pesel: "94122530836" },
  ],
  // Użytkownicy aplikacji - tworzą się sami przy pierwszym logowaniu
  users: [],
};

function load() {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(SEED, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
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
        if (source[key] !== undefined) user.profile[section][key] = source[key];
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