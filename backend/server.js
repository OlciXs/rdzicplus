import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { db } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;
const CODE_TTL_MS = 5 * 60 * 1000; // kod ważny 5 minut

app.use(cors());
app.use(express.json());

const loginRequests = new Map(); // requestId -> { code, expiresAt }
const sessions = new Map(); // token -> userId

const maskPesel = (pesel) => "*".repeat(7) + pesel.slice(-4);

// Do frontendu nigdy nie wysyłamy pełnego PESEL-u
const publicUser = (u) => ({
  id: u.id,
  imie: u.imie,
  nazwisko: u.nazwisko,
  peselMasked: maskPesel(u.pesel),
});

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const user = db.getUser(sessions.get(token));
  if (!user) {
    return res.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
  }
  req.user = user;
  req.token = token;
  next();
}

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello World z backendu!" });
});

// 1. Strona prosi o kod logowania
app.post("/api/auth/mobywatel/start", (req, res) => {
  const now = Date.now();
  for (const [id, r] of loginRequests) if (r.expiresAt < now) loginRequests.delete(id);

  const requestId = crypto.randomUUID();
  const code = String(crypto.randomInt(100000, 1000000));
  loginRequests.set(requestId, { code, expiresAt: now + CODE_TTL_MS });

  res.json({ requestId, code, expiresInSec: CODE_TTL_MS / 1000 });
});

// 2. "Aplikacja mObywatel" pokazuje osoby do wyboru (symulacja)
app.get("/api/auth/mobywatel/profiles", (req, res) => {
  const profiles = db.listProfiles().map((p) => ({
    id: p.id,
    imie: p.imie,
    nazwisko: p.nazwisko,
    peselMasked: maskPesel(p.pesel),
  }));
  res.json({ profiles });
});

// 3. Wybór osoby = zatwierdzenie logowania.
//    Pobieramy PESEL, imię i nazwisko i zapisujemy je w bazie.
app.post("/api/auth/mobywatel/confirm", (req, res) => {
  const { requestId, code, profileId } = req.body ?? {};
  const request = loginRequests.get(requestId);

  if (!request || request.expiresAt < Date.now()) {
    loginRequests.delete(requestId);
    return res.status(400).json({ error: "Kod wygasł. Zacznij logowanie od nowa." });
  }
  if (request.code !== code) {
    return res.status(400).json({ error: "Nieprawidłowy kod logowania." });
  }

  const profile = db.getProfile(profileId);
  if (!profile) {
    return res.status(404).json({ error: "Nie znaleziono takiej osoby." });
  }

  loginRequests.delete(requestId); // kod jest jednorazowy
  const user = db.upsertUserFromProfile(profile);
  const token = crypto.randomUUID();
  sessions.set(token, user.id);

  res.json({ token, user: publicUser(user) });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  sessions.delete(req.token);
  res.json({ ok: true });
});

<<<<<<< HEAD
app.get("/api/profile", requireAuth, (req, res) => {
  const result = db.getOrCreateProfile(req.user.id);
  res.json(result);
});

app.put("/api/profile", requireAuth, (req, res) => {
  const result = db.saveProfile(req.user.id, req.body);
  if (!result) return res.status(404).json({ error: "Nie znaleziono profilu." });
  res.json({ ok: true, ...result });
=======
/* ---------- Parametry kalkulatorów (panel admina) ----------
   Silnik obliczeń jest we froncie (frontend/src/engine). Backend przechowuje tylko
   zmiany wprowadzone w panelu admina; front nakłada je na wartości domyślne.
   Zapis chroni hasło z ADMIN_PASSWORD (w demo domyślne – zmienić na serwerze). */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "zus-demo-2026";

function requireAdmin(req, res, next) {
  const given = Buffer.from(String(req.headers["x-admin-password"] ?? ""));
  const expected = Buffer.from(ADMIN_PASSWORD);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    return res.status(401).json({ error: "Nieprawidłowe hasło administratora." });
  }
  next();
}

const isNum = (v) => typeof v === "number" && Number.isFinite(v);

// Dozwolone: { klucz: liczba } albo { klucz: { podklucz: liczba } }.
function validOverrides(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) return false;
  const entries = Object.entries(o);
  if (entries.length > 200) return false;
  return entries.every(([k, v]) =>
    /^[\p{L}\d_]{1,60}$/u.test(k) &&
    (isNum(v) ||
      (v && typeof v === "object" && !Array.isArray(v) &&
        Object.entries(v).every(([sk, sv]) => /^[\p{L}\d_]{1,30}$/u.test(sk) && isNum(sv))))
  );
}

app.get("/api/params", (req, res) => {
  res.json({ overrides: db.getParamOverrides() });
});

app.put("/api/params", requireAdmin, (req, res) => {
  const { overrides } = req.body ?? {};
  if (!validOverrides(overrides)) {
    return res.status(400).json({ error: "Parametry muszą być liczbami." });
  }
  res.json({ overrides: db.setParamOverrides(overrides) });
});

app.delete("/api/params", requireAdmin, (req, res) => {
  res.json({ overrides: db.setParamOverrides({}) });
>>>>>>> 52e363674be897ed0c8d14817c5f24a61c8cbc9a
});

app.listen(PORT, () => {
  console.log(`Backend działa na http://localhost:${PORT}`);
});
