# Moja apka

## Uruchamianie przez Docker Compose

Wymagany jest Docker z Compose. Z katalogu głównego projektu uruchom:

```sh
docker compose up --build
```

Frontend będzie dostępny pod adresem http://localhost:8080, a backend pod
http://localhost:3001. Dane backendu są przechowywane w wolumenie `backend-data`.
Zatrzymanie usług: `docker compose down`.

## Backend (port 3001)
cd backend && npm install && npm run dev

## Frontend (port 5173)
cd frontend && npm install && npm run dev
