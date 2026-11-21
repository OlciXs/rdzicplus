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
| `/` | Przekierowanie: zalogowany → `/panel`, niezalogowany → `/logowanie` |
| `/logowanie` | Logowanie (symulacja mObywatela: Bożena, Marzena, Mariusz) |
| `/panel` | Panel użytkownika — **wymaga zalogowania** |
| `/profil` | „Moje dane” (dane do wniosków, podstawiane w kalkulatorach) — **wymaga zalogowania** |
| `/wnioski` | **Złóż wniosek**: 14 wniosków → każdy wariant oceniony na podstawie „Moje dane” (przysługuje / nie i dlaczego / brakuje danych) — **wymaga zalogowania**; `?w=<id>` otwiera konkretny wniosek |
| `/zus` | Symulacja „Moje dane z ZUS”: ubezpieczenie, podstawa, e-ZLA, zaświadczenie o niezaleganiu, wnioski PUE — **wymaga zalogowania** |
| `/odpis-aktu` | Symulacja wniosku o odpis aktu urodzenia (gov.pl) — **wymaga zalogowania** |
| `/kalkulatory` | Lista kalkulatorów |
| `/kalkulatory/zasilek-chorobowy-w-ciazy` | a) Zasiłek chorobowy w ciąży |
| `/kalkulatory/zasilek-macierzynski` | b) Zasiłek macierzyński |
| `/kalkulatory/laczenie-urlopu-z-praca` | c) Łączenie urlopu z pracą |
| `/kalkulatory/oboje-rodzice` | d) Symulacja obojga rodziców |
| `/kalkulatory/adopcja-rodzina-zastepcza` | e) Adopcja i rodzina zastępcza |
| `/kalkulatory/podstawa-wymiaru` | f) Podstawa wymiaru zasiłku |
| `/kalkulatory/dokumenty-i-terminy` | g) Dokumenty, terminy i zagrożenia |
| `/admin` | Panel administratora: parametry kalkulatorów (brak linku w menu – wejście tylko przez adres) |
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
| `engine/wnioski/` | **wnioski i ich warianty**: co przysługuje przy danym profilu (niżej) |

Testy (161: kalkulatory, warianty wniosków, regresje do `RAPORT_BLEDOW.md` i spójność z bazą wiedzy):

```bash
cd frontend && npm test
```

## Wnioski i warianty („każdy wariant” – wymaganie mentorów ZUS)

Rodzic wypełnia „Moje dane”, wybiera wniosek, a silnik ocenia **każdy wariant** tego wniosku:

| Status | Znaczenie |
| --- | --- |
| `dostepny` | wszystkie warunki spełnione – są wymiar, wysokość, adresat, termin, dokumenty |
| `niedostepny` | warunek niespełniony – `powody` mówią który (np. „matka wykorzystała 10 z 14 tygodni”) |
| `brak_danych` | nic nie wyklucza, ale w profilu brakuje odpowiedzi – `brakujaceDane` z etykietami pól |
| `nie_dotyczy` | inna rola albo etap (np. urlop ojcowski dla matki) |
| `informacja` | zasada do pokazania bez oceny (np. ochrona przed zwolnieniem) |

| Plik | Zawartość |
| --- | --- |
| `engine/wnioski/rejestr.js` | **14 wniosków i 40 wariantów** opartych na `docs/01-katalog-swiadczen-2026.md`: warunki, wymiar, wysokość, adresat, formularz, termin, dokumenty, potrzebne pola, podstawa prawna; niepewne oznaczone `pewnosc: "do_potwierdzenia"`. Dokumentacja opisuje 50 pozycji — część jest **świadomie scalona** (np. W23/W24 → W6–W9b), a `spojnosc.test.js` pilnuje, by rejestr nie rozjechał się z bazą wiedzy |
| `engine/wnioski/kontekst.js` | profil z `GET /api/profile` → fakty dla reguł (tak / nie / brak danych) |
| `engine/wnioski/ocena.js` | `ocenWniosek(profil, wniosekId)`, `przegladWnioskow(profil)` i ostrzeżenia V1–V40 z `docs/02-dane-do-wnioskow-2026.md` |
| `engine/regresja.test.js` | testy regresyjne do każdego naprawionego błędu z `RAPORT_BLEDOW.md` (B-01…B-24) |
| `engine/wnioski/spojnosc.test.js` | spójność rejestru z `engine/dane/zus_dane_2026.json` (podstawy prawne, unikalność ID, pokrycie wniosków) |
| `engine/walidacja.js` | sanityzacja wejścia silnika (`NaN`/`Infinity`/wartości ujemne nie wchodzą do wyliczeń) |
| `engine/fuzz.test.js` | testy losowe (stałe ziarno, powtarzalne): 3000 losowych/„śmieciowych” profili przez wszystkie wnioski i 3000 wejść kalkulatorów – bez wyjątków, bez `NaN`/`undefined`/ujemnych kwot w tekstach, spójne statusy (np. `dostepny` ⇒ wszystkie warunki spełnione) i reguły biznesowe (limit łączenia, suma macierzyńskiego, 70% ojca ≤ 9 tyg.) |
| `engine/wnioski/wnioski.test.js` | testy na rodzinach: etat w ciąży, działalność z długiem, zlecenie (90 dni), studentka, utrata pracy w ciąży, ojciec przejmujący urlop (14 tyg., szpital, zgon, matka nieubezpieczona), wcześniak, martwe urodzenie, adopcja, 81,5%, rodzicielski, opiekuńczy |

Wniosek do druku: `frontend/src/pages/Druk.jsx` (`/wnioski/druk?v=W21`) + silnik `engine/wnioski/druki.js` – pismo do pracodawcy
(albo dane do ZAM dla osoby bez umowy o pracę) wypełnione z „Moje dane”, z oświadczeniami, załącznikami i kontrolą terminów;
„Drukuj / zapisz jako PDF” otwiera okno drukowania przeglądarki. Testy: `engine/wnioski/druki.test.js` i fuzz.
Kompletny wniosek bez błędów można też „wysłać” (symulacja, `POST /api/wnioski/wyslij` w `backend/zus-mock.js`) –
dostaje numer (przy ZAM także UPO) i status, który zmienia się w czasie w „Dane z ZUS” → „Twoje wnioski”.

Ekran: `frontend/src/pages/Wnioski.jsx` (`/wnioski`) – kafelki wniosków z licznikami (najpierw to, co przysługuje),
ostrzeżenia dla całej sprawy, a po wyborze wniosku karta każdego wariantu: wymiar, wysokość, gdzie złożyć, termin,
dokumenty, rozwijane warunki ✓/✗/? i linki „uzupełnij w »Moje dane«” prowadzące do właściwego kroku profilu
(`/profil?krok=dziecko` itd.).

Przykład:

```js
import { ocenWniosek } from "./engine/index.js";
const { warianty } = ocenWniosek(profil, "przejecie");
// [{ id: "W22", status: "niedostepny", powody: ["Matka wykorzystała po porodzie co najmniej 14 tygodni…"], … }, …]
```

Źródła: `docs/01-katalog-swiadczen-2026.md` i `docs/02-dane-do-wnioskow-2026.md` – szkic przygotowany
z pomocą AI (Mistral) na podstawie materiałów ZUS; wymaga weryfikacji z przepisami.

## Symulacje usług ZUS i USC

Wszystkie integracje są zasymulowane (wymóg zadania). Dane są **fikcyjne** i zależą od osoby
wybranej przy logowaniu mObywatelem (`backend/zus-mock.js`):

| Osoba | Sytuacja w symulacji |
| --- | --- |
| Bożena | etat, pracodawca 34 osoby (wypłaca zasiłek sam), pensja 6 000 zł, e-ZLA z kodem B (ciąża) |
| Marzena | działalność gospodarcza, dobrowolne chorobowe, **zaległość 312,40 zł** → blokada zasiłku |
| Mariusz | etat, pracodawca 128 osób, pensja 7 500 zł, przyszły tata |

Strona `/zus` liczy podstawę wymiaru tym samym silnikiem co kalkulatory, a przycisk
„Przenieś do »Moje dane«” zapisuje tytuł ubezpieczenia, podstawę i płatnika w profilu,
więc kalkulatory od razu je podstawiają.

Endpointy (wymagają zalogowania): `GET /api/zus/dane`, `GET /api/zus/ezla`,
`GET /api/zus/zaswiadczenie?naDzien=RRRR-MM-DD`, `GET /api/zus/wnioski`,
`GET/POST /api/usc/odpisy` (wnioski o odpis trzymane w pamięci – po restarcie znikają).

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
