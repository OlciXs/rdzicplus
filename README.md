# RodzicPlus — Zasiłkowy Przewodnik Przyszłego Rodzica

Aplikacja dla przyszłych rodziców: mówi, czy dostanie pieniądze z ZUS, ile, jak długo
i co gdzie złożyć.

## Uruchamianie przez Docker Compose

Wymagany jest Docker z Compose. Z katalogu głównego projektu uruchom:

```sh
docker compose up --build
```

Frontend będzie dostępny pod adresem http://localhost:8080, a backend pod
http://localhost:3001. Dane backendu są przechowywane w wolumenie `backend-data`.
Zatrzymanie usług: `docker compose down`.

## Backend (port 3001)

```bash
cd backend && npm install && npm run dev
```

## Frontend (port 5173)

```bash
cd frontend && npm install && npm run dev
```

## Trasy (React Router)

Aplikacja korzysta z routingu po stronie klienta — każda podstrona ma własny adres,
który można odświeżyć lub wysłać komuś linkiem.

| Adres (np. na `http://localhost:5173`) | Opis |
| --- | --- |
| `/` | Strona powitalna |
| `/logowanie` | Logowanie (symulacja mObywatela) |
| `/panel` | Panel użytkownika — **wymaga zalogowania** |
| `/kalkulatory` | Lista kalkulatorów |
| `/kalkulatory/zasilek-chorobowy-w-ciazy` | a) Zasiłek chorobowy w ciąży |
| `/kalkulatory/zasilek-macierzynski` | b) Zasiłek macierzyński |
| `/kalkulatory/laczenie-urlopu-z-praca` | c) Łączenie urlopu z pracą |
| `/kalkulatory/oboje-rodzice` | d) Symulacja obojga rodziców |
| `/kalkulatory/adopcja-rodzina-zastepcza` | e) Adopcja i rodzina zastępcza |
| `/kalkulatory/podstawa-wymiaru` | f) Podstawa wymiaru zasiłku |
| `/kalkulatory/dokumenty-i-terminy` | g) Dokumenty, terminy i zagrożenia |
| `/admin` | Panel administratora: parametry kalkulatorów |
| dowolny inny | Strona 404 |

Nieznane adresy kalkulatorów (`/kalkulatory/cokolwiek`) pokazują stronę 404.
Trasa `/panel` przekierowuje na `/logowanie`, jeśli użytkownik nie jest zalogowany,
i po zalogowaniu wraca do miejsca, do którego zmierzał.

## Silnik obliczeń i testy

Wszystkie wyliczenia (podstawa wymiaru, zasiłek chorobowy, macierzyński, łączenie z pracą,
oboje rodzice, adopcja, kto wypłaca) są w `frontend/src/engine/` jako czyste funkcje bez
Reacta: `funkcja(dane, parametry) → wynik`. Komponenty w `frontend/src/calculators/` tylko
zbierają dane z formularza i wyświetlają wynik.

| Plik | Co liczy |
| --- | --- |
| `engine/params.js` | wszystkie stawki, limity i kwoty z przepisów (stan 2026) + opisy dla panelu admina |
| `engine/podstawa.js` | f) podstawa wymiaru: średnia z 12 mies., −13,71%, premie 1/12, minimum/maksimum |
| `engine/chorobowy.js` | a) zasiłek chorobowy w ciąży: okres oczekiwania, 33/14 dni, 182/270 dni, blokada za zaległość |
| `engine/macierzynski.js` | b) macierzyński, ojcowski, uzupełniający, martwe urodzenie, kwoty |
| `engine/laczenie.js` | c) rodzicielski łączony z pracą: wymiar ÷ (1 − etat) |
| `engine/oboje.js` | d) podział rodzicielskiego, walidacja planu, 9 tyg. ojca po 70% |
| `engine/adopcja.js` | e) adopcja / rodzina zastępcza: limity wieku, kwoty |
| `engine/platnik.js` | g) płatnik (> 20 ubezpieczonych) czy ZUS |
| `engine/engine.test.js` | testy z ręcznie policzonymi wartościami |

Testy:

```bash
cd frontend && npm test
```

## Panel administratora (`/admin`)

Stawki, wymiary urlopów, kwoty i terminy można zmienić bez wdrażania nowej wersji
(wymóg zadania). Backend zapisuje tylko zmiany względem wartości domyślnych
(`GET/PUT/DELETE /api/params`, plik `backend/data/db.json`), a frontend nakłada je przy
starcie, więc wszyscy użytkownicy od razu liczą według nowych parametrów.

Zapis chroni hasło ze zmiennej środowiskowej `ADMIN_PASSWORD`. W wersji demonstracyjnej
(bez tej zmiennej) hasło to `zus-demo-2026`. **Na serwerze ustaw własne `ADMIN_PASSWORD`**
(np. linia `ADMIN_PASSWORD=…` w pliku `.env` obok `docker-compose.yml`; Compose przekazuje ją
do kontenera backendu).

### Deploy

`vite.config.js` ma `appType: "spa"`, więc serwer deweloperski (`npm run dev`)
i `npm run preview` obsługują odświeżanie dowolnej podstrony. Na hostingu
statycznym (Vercel/Netlify) włącz fallback „rewrite all → `/index.html`”.
