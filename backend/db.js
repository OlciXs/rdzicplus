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
    { id: "mob-katarzyna", imie: "Katarzyna", nazwisko: "Zielińska", pesel: "94122530846" },
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

const emptyProfile = (user) => ({
  ubezpieczony: {
    imie: user?.imie || "",
    nazwisko: user?.nazwisko || "",
    peselMasked: user ? "*".repeat(7) + user.pesel.slice(-4) : "",
    dataUrodzenia: "",
    adres: "",
    rachunek: "",
    statusUbezpieczenia: "",
    podstawaWymiaru: "",
  },
  platnik: { nazwa: "", adres: "", nip: "", regon: "" },
  drugiRodzic: { imie: "", nazwisko: "", pesel: "", podstawaWymiaru: "" },
  dziecko: {
    imie: "",
    nazwisko: "",
    pesel: "",
    dataUrodzenia: "",
    miejsceUrodzenia: "",
    liczbaDzieci: "",
    zaZyciem: false,
  },
});

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

export const db = {
  listProfiles: () => data.mobywatelProfiles,

  getProfile: (id) => data.mobywatelProfiles.find((p) => p.id === id),

  getUser: (id) => data.users.find((u) => u.id === id),

  getOrCreateProfile(userId) {
    const user = data.users.find((u) => u.id === userId);
    if (!user) return null;
    if (!user.profile) user.profile = emptyProfile(user);
    if (!user.profileUpdatedAt) user.profileUpdatedAt = null;
    save();
    return { profile: user.profile, updatedAt: user.profileUpdatedAt };
  },

  saveProfile(userId, nextProfile) {
    const user = data.users.find((u) => u.id === userId);
    if (!user) return null;
    user.profile = emptyProfile(user);

    for (const section of ["ubezpieczony", "platnik", "drugiRodzic", "dziecko"]) {
      const source = nextProfile?.[section];
      if (!source || typeof source !== "object") continue;
      for (const key of Object.keys(user.profile[section])) {
        if (source[key] !== undefined) user.profile[section][key] = source[key];
      }
    }

    user.profile.ubezpieczony.imie = user.imie;
    user.profile.ubezpieczony.nazwisko = user.nazwisko;
    user.profile.ubezpieczony.peselMasked = "*".repeat(7) + user.pesel.slice(-4);
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
