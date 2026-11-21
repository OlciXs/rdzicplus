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
| dowolny inny | Strona 404 |

Nieznane adresy kalkulatorów (`/kalkulatory/cokolwiek`) pokazują stronę 404.
Trasa `/panel` przekierowuje na `/logowanie`, jeśli użytkownik nie jest zalogowany,
i po zalogowaniu wraca do miejsca, do którego zmierzał.

### Deploy

`vite.config.js` ma `appType: "spa"`, więc serwer deweloperski (`npm run dev`)
i `npm run preview` obsługują odświeżanie dowolnej podstrony. Na hostingu
statycznym (Vercel/Netlify) włącz fallback „rewrite all → `/index.html`”.
