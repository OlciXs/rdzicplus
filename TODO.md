# TODO: Zasiłkowy Przewodnik Przyszłego Rodzica (ZUS, HackNation 2026)

**Deadline: niedziela 22.11, godz. 11:00.** Wszystkie wartości liczbowe i podstawy prawne są w [docs/podsumowanie-danych-do-wyliczen.md](docs/podsumowanie-danych-do-wyliczen.md). Ten plik mówi, **co** zbudować i w jakiej kolejności. Szczegóły bierzecie z tamtego pliku (podaję numery sekcji, np. „§2.4”).

Priorytety: **P0** = bez tego nie oddajemy · **P1** = wyróżnik, który daje punkty · **P2** = jeśli zostanie czas.

---

## Stan projektu (sobota 21.11, 20:40)

> **🎯 Nowy kierunek po rozmowie z mentorami ZUS (wieczór 21.11):** narzędzie ma obsłużyć **KAŻDY wariant** każdego wniosku/zaświadczenia (matka, ojciec, adopcja, rodzina zastępcza, inny członek rodziny, martwe urodzenie, wcześniak, matka nieubezpieczona, zbieg tytułów…). Plan: (1) rodzic wypełnia pełny profil → (2) wybiera, jaki wniosek chce złożyć → (3) widzi warianty: dostępne / niedostępne z powodem / brakuje danych → (4) formularz wypełniony z profilu + lista dokumentów, termin, adresat. Źródło: `docs/01-katalog-swiadczen-2026.md` (~50 wariantów W1–W50) i `docs/02-dane-do-wnioskow-2026.md` (pola A–K, oświadczenia J1–J30, ostrzeżenia V1–V40) – szkic z Mistrala, do weryfikacji.
> **Zrobione:**
> - krok (1) – Ola, „risk”: profil „Moje dane” w 7 krokach, ~80 pól warunkowych (`backend/db.js` → `emptyProfile`)
> - kroki (2)–(3) od strony silnika – Claude, 20:40, bez commita: `frontend/src/engine/wnioski/` – **14 wniosków, 45 wariantów** (w tym 9 informacyjnych), ocena każdego wariantu na podstawie profilu Oli (`dostepny` / `niedostepny` + powód / `brak_danych` + które pola / `nie_dotyczy` / `informacja`), wymiar, wysokość, adresat (pracodawca / ZUS / gmina), formularz, termin z konkretną datą, dokumenty, pola do uzupełnienia, ostrzeżenia V1–V40. **38 testów** na rodzinach (razem 88). Opis w README → „Wnioski i warianty”
> - ekran „Złóż wniosek” – Claude, 21:00, bez commita: `/wnioski` (kafelek w panelu + pozycja w menu): kafelki 14 wniosków z licznikami (przysługuje / brak danych / nie przysługuje, „nie dotyczy” wyszarzone na końcu), ostrzeżenia dla sprawy, karty wariantów z powodami, terminami z datą, dokumentami i warunkami ✓/✗/?; linki „uzupełnij” otwierają „Moje dane” na właściwym kroku (dodane `?krok=` w `ProfilePage.jsx`). Sprawdzone w przeglądarce (pusty profil → „ZACZNIJ TU”; profil Bożeny → chorobowy 2 przysługuje, macierzyński 2 przysługuje) i na telefonie
> **Następne:** generator samego wniosku do druku / PDF dla najczęstszych wariantów (W1, W2, W21, W25, W22, W4, W28) – dane z profilu wstawione w pola, oświadczenia jako checkboxy; drobne: `db.json` – cofnąć `mob-mariuszz` (test Enarda) i dodać plik do `.gitignore`.
> **Do weryfikacji (oznaczone w kodzie `do_potwierdzenia`):** W4 uzupełniający dla nie-pracowników, W12 łączenie z pracą (wydłużona część, pole I14), W44 podwyższenie (szacunek podatku), W47 chorobowy po ustaniu (14 dni), W11 staż 6 mies., W19 świadczenie rodzicielskie (poza ZUS). W dokumentach Mistrala jest też nieaktualny **Z-3b** (zlikwidowany 24.10.2026) – w rejestrze go nie używamy.

> **Serwer znów działa.** Deploy #10 (PR #2) padł, bo przy merge'u do `backend/server.js` trafiły znaczniki konfliktu (`<<<<<<<`) i backend nie startował. Naprawione w commicie „backend fix”; od tamtej pory deploye **#11–#17 są zielone**.
> **Żeby się nie powtórzyło:** po rozwiązaniu konfliktu `git grep -n "<<<<<<<"` przed commitem, a w deployu krok z testami (niżej).

**Działa** (17:45: sprawdzone w Dockerze tak jak na serwerze, w przeglądarce i przez API):
- logowanie mObywatelem (symulacja): kod → wybór jednej z 3 fikcyjnych osób (Bożena, Marzena, Mariusz) → sesja z tokenem, PESEL maskowany na froncie
- **nowy front (Ola, PR #3 + „dane”):** `/` przekierowuje na `/logowanie` albo `/panel`; menu „hamburger” w nagłówku (Mój panel, Moje dane, Kalkulatory, Wyloguj); panel z dwoma kafelkami (kalkulatory, uzupełnij dane: „X z 7 kluczowych pól”). Stara strona powitalna i lista spraw z 800+ zniknęły
- **„Moje dane” `/profil`** (Ola, PR #2): dane ubezpieczonego, płatnika, drugiego rodzica i dziecka zapisane raz (`GET/PUT /api/profile`); kalkulatory same podstawiają je w pola (`useProfileDefaults.js`), a kalkulator f) zapisuje wyliczoną podstawę do profilu. Płeć i data urodzenia liczone z PESEL-u (Claude, „backend fix”), więc u ojca jego podstawa trafia w pole „ojciec”. Sprawdzone: Bożena zapisuje 6 000 zł → kalkulator macierzyński ma „matka = 6 000”
- **routing + 7 kalkulatorów a–g** (Montarex23): lista `/kalkulatory`, osobny adres dla każdego kalkulatora, strona 404, `/panel` i `/profil` tylko dla zalogowanych. Adresy w README
- RWD na telefonie (375 px, bez poziomego scrolla, także strony kalkulatorów), build produkcyjny frontendu
- „baza” w pliku `backend/data/db.json` (Ola, `backend/db.js`), schowana za obiektem `db`
- Docker (`docker-compose.yml`, Dockerfile dla obu części) + GitHub Actions z deployem na Google Cloud (Enard)

**Deploy** (Enard): #11–#14 zielone. Nowość („deploy clear db on change”): gdy w pushu zmieni się `backend/data/db.json`, deploy **kasuje bazę na serwerze** (wolumen `app_backend-data`) i startuje od pliku z repo. Dzięki temu Mariusz trafił na serwer, ale zobacz uwagę o `db.json` niżej. Do README brakuje linku do demo online.

### Do poprawy po zmianach z 17:30 (drobne)
- [ ] **`db.json` w repo + kasowanie bazy przy deployu = utrata danych na serwerze.** Każdy commit z lokalnymi logowaniami (np. „dane” dodał 96 linii testowych użytkowników) wyczyści na serwerze profile użytkowników i zmiany z panelu admina. Rozwiązanie: `backend/data/db.json` do `.gitignore` (+ `git rm --cached`); osoby z mObywatela i tak są w `SEED` w `db.js` (Mariusz już tam jest). Jeśli trzeba zmienić listę osób, kasować bazę świadomie, a nie przy każdej zmianie pliku
- [ ] Deploy: gdy na serwerze nie ma jeszcze kontenera backendu, `docker rm -f "$CID"` z pustym `CID` zakończy krok błędem (dotyczy tylko pierwszego uruchomienia z kasowaniem bazy)
- [ ] Logowanie: nagłówek mówi „Dane i kalkulatory będą dostępne po zalogowaniu”, a link pod spodem „Otwórz kalkulatory bez logowania” – sprzeczne. Proponowany tekst: „Zaloguj się, żeby kalkulatory same wypełniały Twoje dane”
- [ ] Do `/admin` nie ma już żadnego linku (był w stopce usuniętej strony powitalnej). Na demo wpisywać adres ręcznie albo dodać link w menu

**Docker lokalnie** (sprawdzone 16:20): `docker compose up --build` z README działa (po poprawce `PROJECT_ID`, niżej). Strony, proxy `/api`, logowanie, panel admina, zapis parametrów przetrwa restart backendu (wolumen), własne `ADMIN_PASSWORD` przekazuje się do kontenera.

**Zrobione (Claude, PR #1, na `main`):** silnik obliczeń `frontend/src/engine/` (wszystkie wyliczenia przeniesione z komponentów, wyniki bez zmian), 50 testów (`npm test`), panel admina `/admin` z zapisem parametrów w backendzie (`/api/params`). Opis w README.

**Symulacje usług ZUS i USC** (Claude, PR #4) – `/zus` (ubezpieczenie, podstawa, e-ZLA, zaświadczenie o niezaleganiu, wnioski PUE) i `/odpis-aktu`. Szczegóły w sekcji 9.

### Znalezione 19:40 (drobne)
- [ ] **Lokalnie „Sesja wygasła” bez powodu:** `npm run dev` w backendzie to `node --watch`, który restartuje serwer, gdy Windows/antywirus/Docker dotknie plików w `node_modules`; sesje są w pamięci, więc znikają. Tylko w trybie deweloperskim (serwer używa `npm start`). Poprawka: w `backend/package.json` `"dev": "node --watch-path=server.js --watch-path=db.js --watch-path=zus-mock.js server.js"`
- [ ] „Dane z ZUS” → „Przenieś do »Moje dane«” wypełnia na razie tytuł, podstawę i płatnika. Nowy profil ma też `platnik.liczbaUbezpieczonych`, `ubezpieczony.ubezpieczenieOd`, `zdrowie.zla*` – warto je też przenosić (e-ZLA, okres ubezpieczenia)
- [ ] Nowe pola profilu (np. `dziecko.liczbaZyjacych`, `dziecko.tydzienCiazy`, `urlopy.*`) nie są jeszcze podstawiane w kalkulatorach (`useProfileDefaults.js`) – do zrobienia razem z osobą od kalkulatorów
- [ ] Backend zapisuje w profilu dowolne wartości (bez sprawdzania typów/długości) – na demo OK, przed wdrożeniem walidacja

**Jeszcze nie ma:** uploadu PDF / przykładowych spraw („Sprawdź mój przypadek”), jednego podsumowania „co mi przysługuje”, planera osi czasu, generatora wniosków urlopowych do pracodawcy.

### Poprawione w kalkulatorach (21.11, 16:00, przez Claude; commit `fix-calc`, sprawdzone w przeglądarce)
- [x] **c) Łączenie z pracą: zły wzór wydłużenia.** Było `urlop + urlop × etat` (½ etatu → 61,5 tyg.), jest `urlop ÷ (1 − etat)` zgodnie z KP art. 182¹f (½ etatu → 82 tyg., ¼ etatu → 54,67 tyg., „Za życiem” → 130 tyg.)
- [x] **a) Chorobowy:** przy braku prawa (okres oczekiwania) lub blokadzie za zaległość kwoty były liczone jak normalnie, a teraz wynoszą 0 zł z powodem. Blokada za zaległość dotyczy już tylko ubezpieczonych dobrowolnie, nie pracowników. Wynagrodzenie chorobowe bez kodu B liczy się po 80% (było zawsze 100%). Płatne dni są ograniczone do pozostałego okresu zasiłkowego (było: 300 dni L4 = 300 dni płatnych; jest 270), a ostrzeżenie o przekroczeniu okresu nie pojawia się już fałszywie
- [x] **d) Oboje rodzice:** w wariancie 81,5% 9 tygodni ojca liczone po 70% (tekst o tym mówił, ale wyliczenie brało 81,5%). Mniej niż 9 tygodni u rodzica to teraz ostrzeżenie o stracie, a nie „BŁĄD planu”
- [x] **e) Adopcja:** kwota rodzicielskiego dla jednego rodzica liczona z 32 tygodni (41 − 9 dla drugiego rodzica), a nie z całych 41
- [x] **b) Macierzyński:** martwe urodzenie dawało 57 dni zamiast 56; etykieta „zasiłek dzienny (100%)” pokazuje faktyczną stawkę
- [x] **f) Podstawa:** minimum dla dobrowolnych 4 877,11 zł przeniesione do `config.js` (było wpisane na sztywno jako 4 877,53 zł)
- [x] **RWD:** na telefonie tabele wyników rozpychały strony kalkulatorów do ~500 px. Poprawione w `themes.css` (`minmax(0, 1fr)`), teraz tabela przewija się w swojej karcie

### Znane braki w kalkulatorach (do zrobienia)
- [x] ~~Każdy kalkulator każe osobno wpisać „podstawę wymiaru”~~ – rozwiązane profilem „Moje dane” (Ola): podstawa z kalkulatora f) zapisuje się do profilu i trafia do pozostałych (dla zalogowanych)
- [ ] Profil działa tylko dla zalogowanych. Dla niezalogowanego (np. jury bez logowania) kalkulatory nadal pytają osobno, więc warto pokazać to w filmie z logowaniem
- [ ] b) Macierzyński: brak podwyższenia do 1 000 zł (świadczenie rodzicielskie) i brak kwot urlopu rodzicielskiego miesiąc po miesiącu
- [ ] f) Podstawa: minimum 4 147,09 zł stosowane bez względu na wymiar etatu (powinno być proporcjonalne); miesiące < 50% czasu pracy trzeba wyłączać ręcznie
- [ ] e) Adopcja: urlop „na warunkach macierzyńskiego” nie kończy się, gdy dziecko osiąga 7/10/14 lat; wartość 62 tyg. dla „Za życiem” jest niepotwierdzona (sekcja 12, pkt 5)
- [ ] d) Oboje: „max 5 części” jest sprawdzane osobno dla każdego rodzica. Potwierdzić w KP art. 182¹c, czy limit jest na rodzica, czy łączny
- [ ] a) Chorobowy: kod B ma zerować wcześniejsze okresy zasiłkowe bez ciąży; teraz pole „wykorzystane dni” jest liczone zawsze
- [ ] Zaokrąglenia: kwoty liczone na liczbach zmiennoprzecinkowych, bez zaokrąglania stawki dziennej do grosza (sekcja 12, pkt 1)
- [ ] `npm audit` we frontendzie: 2 umiarkowane podatności (esbuild – tylko serwer deweloperski; react-router). Poprawka wymaga podbicia wersji (`npm audit fix --force`), więc lepiej po oddaniu albo na spokojnie

**Lekcje z dzisiaj:** (1) commit „Build and deploy” przypadkiem cofnął logowanie Oli w `server.js` (naprawione w `5b3ce25`); (2) merge PR #2 wrzucił do `server.js` znaczniki konfliktu i położył serwer. **Przed każdym pushem: `git pull`, rozwiązać konflikty (zostawić obie części, jeśli obie są potrzebne), `git grep -n "<<<<<<<"`, a potem `npm test` i odpalić aplikację.**

### Poprawki techniczne (P0, małe)
- [x] **Naprawić deploy (Enard):** runy #6 i #7 przechodzą
- [x] **`docker-compose.yml`: `${PROJECT_ID}` bez wartości dawało błędną nazwę obrazu** (`…pkg.dev//app-images/…`, potwierdzone: `invalid reference format`), więc `docker compose up --build` z README się wykładał. Poprawione na `${PROJECT_ID:-local}` (Claude, 16:20); na serwerze, gdzie `PROJECT_ID` jest ustawione, bez zmian
- [x] **Puste `.dockerignore`:** wpisane `node_modules`, `.env` (+ `dist` we frontendzie). Obraz frontendu nie dostaje już windowsowych `node_modules`
- [ ] Pusty `frontend/nginx.conf`: usunąć albo wypełnić (teraz frontend w Dockerze chodzi na `vite preview`, nie na nginx)
- [ ] **Krok testów w deployu (Enard):** przed budowaniem obrazów w `deploy.yml` dodać `cd frontend && npm ci && npm test` oraz `node --check backend/server.js`. Zepsuty kod (jak #10) nie trafi wtedy na serwer, tylko deploy zatrzyma się na testach
- [ ] `backend/data/db.json` do `.gitignore` – szczegóły w „Do poprawy po zmianach z 17:30” (`SEED` w `db.js` ma już Mariusza)
- [x] ~~Na serwerze stara lista osób~~ – Enard: deploy kasuje bazę przy zmianie `db.json`
- [ ] Gdy deploy przejdzie: wpisać do README link do działającego demo
- [ ] (drobne) Ostrzeżenie w Actions: `actions/checkout@v4` i `setup-gcloud@v2` działają na wycofywanym Node 20. Na razie nic nie psuje
- [x] ~~Dashboard: krok „800 plus” i niezapisywane checkboxy~~ – Ola przebudowała panel (PR #3), listy spraw już nie ma

---

## O co chodzi (w minutę)

Budujemy stronę WWW dla przyszłych rodziców. Użytkownik podaje swoją sytuację (albo „loguje się mObywatelem” i dane się „pobierają”, co jest tylko symulacją). Strona mówi mu wtedy:

1. **czy** dostanie pieniądze z ZUS (zasiłek chorobowy w ciąży, macierzyński itd.), a jeśli nie, to **dlaczego**,
2. **ile** dostanie (kwota miesięczna, wyliczona z jego pensji),
3. **jak długo** (tygodnie urlopu, z podziałem na mamę i tatę),
4. **co, gdzie i kiedy złożyć** (pracodawca czy ZUS, terminy),
5. **na co uważać**, żeby nie stracić świadczeń.

Jury wgra do kalkulatora **przykładowe sprawy ZUS (PDF-y)** i sprawdzi, czy liczymy tak samo jak ZUS. Najważniejsze jest więc, żeby **silnik obliczeń liczył dobrze**. Ładny UI jest na drugim miejscu.

Zasada architektury: **AI tylko czyta dokumenty, a liczy zwykły kod.** Wszystkie stawki, limity i kwoty siedzą w parametrach, które admin zmienia w panelu bez wdrażania.

Wagi oceny: związek z wyzwaniem 25% · kompletność + UX 25% · pomysł 20% · oryginalność 15% · potencjał wdrożeniowy 15%.

---

## 0. Decyzje na start (pierwsze 15 minut, razem)

- [x] **Stack: już ustalony w commicie `init` od Oli.** Frontend: React 18 + Vite (`frontend/`, port 5173, proxy `/api` → backend). Backend: Node + Express (`backend/`, port 3001, ESM). To spełnia wymagania ZUS (React + backend JS przez REST). Zostajemy przy tym, bez przepisywania na Next.js.
- [ ] **Silnik obliczeń jako trzeci folder `engine/`** (czysty JS bez Reacta i Expressa, ESM). Backend importuje go w `/api/calculate`, a frontend bezpośrednio, żeby planer osi czasu liczył na żywo bez zapytań do serwera. TypeScript opcjonalnie (szkielet Oli jest w JS, więc nie trzeba go przerabiać; typy można opisać w JSDoc). **Nie piszemy od zera:** przenosimy wyliczenia z `frontend/src/calculators/Calc*.jsx` i `CFG` z `config.js`, a komponenty zostają jako UI wołające funkcje z `engine/`.
- [x] **UI: style Oli w `frontend/src/themes.css`** (tokeny kolorów w zielono-granatowej, urzędowej palecie + klasy komponentów). Nowe ekrany robimy na tych samych klasach, bez Tailwinda.
- [x] **Deploy: ustalony (Enard).** Docker Compose na maszynie w Google Cloud (GCE), obrazy w Artifact Registry, deploy z GitHub Actions przy każdym pushu na `main`. Frontend w kontenerze to `vite preview` z proxy `/api` → backend, więc `VITE_API_URL` nie jest potrzebne.
- [x] **Gdzie trzymamy parametry admina: w tej samej „bazie” co użytkownicy** (`backend/db.js` → `data/db.json`). Na serwerze plik leży na wolumenie Dockera `backend-data`, więc przetrwa restart i redeploy. Wystarczy dodać do `db` metody `getParams()` / `setParams()`. Wartości domyślne w `engine/params.default.json`.
- [ ] **Model AI do czytania PDF.** Wymagań co do modelu nie ma. Wybierzcie jeden (Claude / Mistral) i zapiszcie go do README i na slajd „gdzie użyto AI”.
- [ ] **Podział ról.** Przykład dla 3–4 osób:
  - **Silnik + testy:** sekcje 2 i 4 niżej (najważniejsza osoba)
  - **Frontend:** sekcje 5, 7 i 8
  - **PDF/AI + symulacje:** sekcje 6 i 9
  - **Pitch/film/README:** sekcja 11, a do tego pomaga przy testach (ręczne wyliczanie spraw)
- [ ] **Mentor ZUS: zapytać przy stoisku**
  - [ ] gdzie są **przykładowe sprawy** (PDF) i czy mają „poprawne wyniki” do porównania,
  - [ ] jak dokładnie jury będzie testować (upload? wybór z listy?),
  - [ ] **zaokrąglenia**: czy 13,71% liczy się jedną operacją, czy osobno każdą składkę zaokrągloną do grosza (patrz sekcja 12, pkt 1),
  - [ ] jaka maks. podstawa obowiązuje dla dobrowolnych w 2026 (20 321,30 zł?).

---

## 1. Setup repo (P0, ~30 min)

**Zrobione przez Olę (`init`):**
- [x] `frontend/`: React + Vite, „Hello World” pobierający `/api/hello` (działa połączenie front ↔ back)
- [x] `backend/`: Express z `cors` i `express.json()`, endpoint `GET /api/hello`, `npm run dev` z `node --watch`
- [x] `.gitignore`: `node_modules`, `dist`, `.env`
- [x] README z instrukcją uruchomienia obu części
- [x] Logowanie mObywatelem, sesje, `db.js` z plikową bazą, dashboard, style w jednym pliku `themes.css` (Ola, „nowe logowanie v2”)
- [x] Docker + deploy na GCE (Enard)

**Do zrobienia:**
- [x] `.gitignore`: dodane `private-cases/`. **Przykładowych spraw ZUS nie wolno wrzucać do repo** (zakaz kopiowania i rozpowszechniania). Demo ładuje je z folderu poza repo albo z miejsca wskazanego przez ZUS.
- [x] Silnik w **`frontend/src/engine/`** (21.11, Claude). Nie w głównym folderze, bo Docker buduje frontend i backend z osobnych folderów (`./frontend`, `./backend`) i nie widziałby `engine/`. Przeniesienie wymagałoby zmiany deployu Enarda
- [x] Vitest we frontendzie: `cd frontend && npm test`
- [ ] Backend: zamienić `/api/hello` na właściwe endpointy:
  - [ ] `POST /api/calculate`: wymaga, by backend widział silnik (wspólny kontekst budowania w Dockerze, do ustalenia z Enardem). Na razie niepotrzebne, bo liczy front
  - [x] `GET /api/params`, `PUT /api/params`, `DELETE /api/params` (zapis chroniony hasłem z `ADMIN_PASSWORD`)
  - `POST /api/extract`: upload PDF → AI → JSON (sekcja 6); potrzebny `multer` do plików
  - `GET /api/mock/*`: dane ZUS / e-ZLA / zadłużenie (sekcja 9). Logowanie mObywatelem już jest pod `/api/auth/*`
- [x] Frontend: routing (`react-router-dom`, Montarex23). Style zostają w `themes.css`, bez Tailwinda
- [x] Aktualna struktura:
  ```
  /frontend/src/engine       – silnik: czyste funkcje + params.js + engine.test.js
  /frontend/src/calculators  – UI kalkulatorów (formularz → funkcja silnika → wynik)
  /frontend/src/pages        – strony (Landing, Login, Dashboard, Kalkulator, Admin, 404)
  /backend                   – Express: logowanie mObywatel (symulacja), /api/params
  /private-cases             – sprawy ZUS, tylko lokalnie (w .gitignore)
  /docs                      – materiały
  ```
- [ ] README: uzupełnić „RodzicPlus” o nazwę projektu, opis i komendę testów (pełna wersja w sekcji 11)
- [ ] Wczesny deploy (front + back), żeby link działał od początku

---

## 2. Silnik obliczeń: `/engine` (P0, rdzeń całego projektu)

> **Stan:** wersje „w UI” wszystkich kalkulatorów a–g już działają w `frontend/src/calculators/` (Montarex23), z poprawkami opisanymi w „Stanie projektu”. Punkty niżej to lista reguł do przeniesienia do `engine/` jako czyste funkcje + testy. Przy przenoszeniu sprawdzać je z tą listą i z „Znanymi brakami”.

### 2.1 Model danych (zrobić jako pierwsze, bo wszyscy z niego korzystają)
- [ ] `CaseProfile`, jeden obiekt na całą sprawę (szczegóły pól w §3 pliku z danymi):
  - rodzic 1 i rodzic 2: tytuł ubezpieczenia (etat / zlecenie / JDG / brak), czy chorobowe obowiązkowe czy dobrowolne, data początku ubezpieczenia, wiek, wymiar etatu, wynagrodzenia z 12 miesięcy (składniki: stałe, zmienne, premie kwartalne i roczne), liczba ubezpieczonych u płatnika, zaległość składkowa
  - dziecko/dzieci: przewidywana data porodu / data porodu, liczba dzieci, „Za życiem”, tydzień ciąży, masa urodzeniowa, dni hospitalizacji
  - adopcja / rodzina zastępcza: data przyjęcia, wiek dziecka, odroczenie obowiązku szkolnego
  - zdarzenia na **jednej osi czasu**: L4 (z kodem literowym), rozwiązanie umowy + przyczyna, hospitalizacja matki, zgon, wyrejestrowanie
- [ ] `Result`, czyli wynik: czy przysługuje (tak/nie + powód), kwoty, okresy (od–do), **lista kroków obliczeń** (`{opis, wzór, wartość, podstawa prawna}`) i lista ostrzeżeń
- [ ] Każda reguła dostaje `params` z zewnątrz, **żadnych liczb wpisanych w kod**

### 2.2 Podstawa wymiaru zasiłku (kalkulator f), §2.6
- [ ] Pracownik: średnia z 12 pełnych miesięcy przed miesiącem choroby/porodu, minus 13,71%
- [ ] Krócej niż 12 miesięcy: średnia z pełnych miesięcy, a jeśli choroba wypadła w 1. miesiącu, pensja z umowy
- [ ] Miesiąc, w którym przepracowano < 50% czasu, wypada z liczenia. Przy ≥ 50% uzupełniamy: stałe składniki w pełnej kwocie, zmienne jako wypłacone ÷ dni przepracowane × dni do przepracowania
- [ ] Premie kwartalne: 1/12 z 4 kwartałów. Roczne: 1/12 z roku poprzedniego
- [ ] Wyłączanie składników, które są wypłacane dalej w czasie zasiłku
- [ ] Minimum dla pracownika na pełnym etacie: 4 147,09 zł (proporcjonalnie do etatu)
- [ ] Nie-pracownik (zlecenie/JDG): przychód (podstawa składek) z 12 miesięcy, minus 13,71%. Maksimum dla dobrowolnych: 20 321,30 zł (do potwierdzenia, sekcja 12)
- [ ] Stawka dzienna = 1/30 podstawy
- [ ] Nowa podstawa liczona dopiero po ≥ 1 miesiącu przerwy w zasiłkach

### 2.3 Świadczenia w ciąży (kalkulator a), §2.1–2.3
- [ ] Okres oczekiwania 30 dni (obowiązkowe) / 90 dni (dobrowolne), z doliczaniem poprzednich okresów przy przerwie ≤ 30 dni oraz wyjątkami od 1. dnia
- [ ] Wynagrodzenie chorobowe (płaci pracodawca) 33 dni / 14 dni po 50. roku życia, potem zasiłek
- [ ] Stawka 100% przy kodzie B (ciąża), 80% standardowo, 100% przy wypadku przy pracy
- [ ] Licznik okresu zasiłkowego: 182 / 270 dni w ciąży, sumowanie przy przerwie ≤ 60 dni. **Kod B zaczyna nowy okres**
- [ ] Świadczenie rehabilitacyjne po wyczerpaniu okresu: 90% → 75%, 100% w ciąży, max 12 miesięcy
- [ ] Zasiłek w wysokości macierzyńskiego po utracie pracy w ciąży (upadłość, likwidacja, śmierć pracodawcy, wyrok): 100% do dnia porodu
- [ ] **Wynik „NIE przysługuje” z czytelnym powodem.** To jest wprost wymagane w treści zadania

### 2.4 Zasiłek macierzyński: wymiar i stawki (kalkulator b), §2.4–2.5
- [ ] Macierzyński: 20/31/33/35/37 tygodni wg liczby dzieci, max 6 tygodni przed porodem, 14 tygodni nieprzenoszalnych dla matki
- [ ] Rodzicielski 41/43 tygodnie (z „Za życiem” 65/67), w tym 9 tygodni wyłącznie dla każdego rodzica
- [ ] Ojcowski 2 tygodnie, do 12. miesiąca życia dziecka (potem przepada)
- [ ] Uzupełniający (wcześniak / hospitalizacja): max 15 lub 8 tygodni wg tygodnia ciąży i masy dziecka, niepełny tydzień w górę
- [ ] Stawki: 100% (macierzyński, ojcowski, uzupełniający), 70% (rodzicielski), **81,5% za całość przy wniosku do 21 dni po porodzie**, a 9 tygodni drugiego rodzica zawsze po 70%
- [ ] Wyrównanie do 100% przy wariancie 81,5%, jeśli w 1. roku życia dziecka nie wykorzystano ani dnia rodzicielskiego
- [ ] Minimalna kwota: podwyższenie do 1 000 zł (świadczenie rodzicielskie)
- [ ] Martwe urodzenie / zgon dziecka: 8 tygodni / 7 dni od zgonu
- [ ] Wynik **miesiąc po miesiącu**: od–do, stawka %, kwota

### 2.5 Łączenie rodzicielskiego z pracą (kalkulator c), §2.4
- [ ] Praca ≤ ½ etatu, więc urlop wydłuża się proporcjonalnie (max 82/86 tygodni, „Za życiem” 130/134), a zasiłek proporcjonalnie maleje

### 2.6 Oboje rodzice (kalkulator d), §2.7
- [ ] Wspólna pula rodzicielskiego, max 5 części, do końca roku, w którym dziecko kończy 6 lat
- [ ] Jednocześnie lub naprzemiennie, suma ≤ wymiar
- [ ] Przejęcie macierzyńskiego przez ojca: po 14 tygodniach (rezygnacja), po 8 tygodniach (orzeczenie, szpital), pełny wymiar przy zgonie/porzuceniu
- [ ] Walidacja planu rodziców: zwracamy listę błędów (np. „tata ma mniej niż 9 tygodni wyłącznych, przepadają”)

### 2.7 Adopcja / rodzina zastępcza (kalkulatory e, j), §2.4
- [ ] Urlop na warunkach macierzyńskiego: 20–37 tygodni, min. 9 tygodni zasiłku, limity wieku dziecka 7 / 10 / 14 lat
- [ ] Rodzicielski 41/43 (65/67), ojcowski do 12 miesięcy od uprawomocnienia
- [ ] Terminy: wniosek ≤ 7 dni od przyjęcia, start ≤ 21 dni od przyjęcia

### 2.8 Gdzie złożyć dokumenty (kalkulator g), §2.1, §8
- [ ] > 20 ubezpieczonych u płatnika (stan na 30.11 poprzedniego roku), więc płaci pracodawca; ≤ 20 płaci ZUS; JDG/dobrowolni zawsze ZUS
- [ ] Lista dokumentów i terminów dla każdej ścieżki (etat / zlecenie / JDG). **Nowe wzory od 24.10.2026: ZAM łączy ZUR/ZAO/ZAM, Z-3b zlikwidowany, Z-15 zamiast Z-15A/B**

### 2.9 Ostrzeżenia o utracie uprawnień (kalkulator h), §5
- [ ] Każde z 9 ryzyk z §5 jako reguła `if (warunek) → ostrzeżenie + co zrobić`. Najważniejsze:
  - [ ] brak ubezpieczenia chorobowego w dniu porodu (wyrejestrowana JDG, rozwiązana umowa)
  - [ ] JDG na „uldze na start”, czyli bez chorobowego i bez zasiłku
  - [ ] zaległość składkowa > 48,06 zł blokuje zasiłek
  - [ ] podwyższenie podstawy składek w ciąży (ZUS może zakwestionować)
  - [ ] świeża umowa tuż przed porodem (ryzyko „umowy dla pozoru”)
  - [ ] terminy: 21 dni na wariant 81,5%, 12 miesięcy na ojcowski, 6 lat na rodzicielski
  - [ ] po zasiłku macierzyńskim dobrowolne chorobowe wygasa, więc trzeba je ponownie zgłosić

---

## 3. Parametry i panel admina (P0, wymóg z treści zadania)

- [x] Wszystkie parametry w `frontend/src/engine/params.js` (`DEFAULT_PARAMS`), klucze semantyczne, nie numery artykułów. Doszły: próg płatnika (20) i limity wieku przy adopcji (14/7/10), które wcześniej były wpisane na sztywno
- [x] `/admin`: 5 grup parametrów z polskimi opisami, podświetlenie zmienionych pól, zapis i „Przywróć domyślne”, hasło z `ADMIN_PASSWORD` (demo: `zus-demo-2026`, w README)
- [x] Backend trzyma tylko zmiany (`paramOverrides` w `db.json`, na serwerze na wolumenie Dockera), a front nakłada je przy starcie (`loadParams()` w `main.jsx`)
- [x] Sprawdzone w przeglądarce: 70% → 75% w adminie → „Oboje rodzice” od razu liczy ojcu 18 075,75 zł zamiast 17 498,25 zł; reset przywraca 70%
- [ ] Każdy parametr: podstawa prawna i data „obowiązuje od” (teraz są tylko w komentarzach w `params.js`)
- [ ] **Ustawić `ADMIN_PASSWORD` na serwerze** (Enard): `docker-compose.yml` już przekazuje zmienną do backendu, wystarczy linia `ADMIN_PASSWORD=…` w `/opt/app/.env` na VM i restart. Bez niej działa hasło demo
- [ ] Na demo pokazać: zmieniam stawkę 70% → 75% w adminie i kalkulator od razu liczy inaczej

---

## 4. Testy na przykładowych sprawach (P0, robić równolegle z silnikiem)

- [x] **50 testów** w `frontend/src/engine/engine.test.js` (`cd frontend && npm test`), w tym:
  - [x] etat, 6 000 zł brutto stałe przez 12 miesięcy → podstawa **5 177,40 zł** → 100% = 5 177,40 · 81,5% = 4 219,58 · 70% = 3 624,18
  - [x] pensja poniżej minimum → podstawa podniesiona do 4 147,09 zł
  - [x] JDG z dobrowolnym chorobowym od 60 dni → brak prawa (okres oczekiwania 90 dni)
  - [x] JDG z zaległością 100 zł → blokada (a u pracownika nie)
  - [x] bliźnięta → macierzyński 31 tygodni, rodzicielski 43 tygodnie
  - [x] „Za życiem” → 65 tygodni
  - [x] wcześniak 26. tydzień, 900 g, 10 tygodni w szpitalu → uzupełniający 10 tygodni
  - [x] ½ etatu w rodzicielskim → 82 tygodnie i zasiłek o połowę mniejszy
  - [x] firma z 15 pracownikami → ZUS (próg 20 jako parametr)
  - [x] 300 dni L4 → 270 płatnych; martwe urodzenie → 56 dni; 9 tyg. ojca po 70%; adopcja 32 tyg.; zmiana parametru zmienia wynik
- [ ] Każda **przykładowa sprawa od ZUS** jako test (pliki tylko w `/private-cases`, testy pomijane, gdy plików brak)
- [ ] `npm test` w CI (GitHub Actions); zielony badge w README to argument na prezentację

---

## 5. UI kalkulatora (P0)

- [x] Strony kalkulatorów a–g, lista kalkulatorów, okruszki, 404 (Montarex23)
- [x] **Strona główna** `/` (Montarex23): „Czy mi przysługuje / Ile dostanę / Co i kiedy złożyć” + kafelki kalkulatorów + logowanie
- [ ] Na stronie głównej brakuje trzeciego wejścia „Wgraj lub wybierz przykładową sprawę” (sekcja 6)
- [ ] **Kreator (wizard)** zamiast jednego wielkiego formularza: kim jesteś (ciąża / jestem rodzicem / adopcja) → zatrudnienie → zarobki → dziecko → drugi rodzic → wynik. Pytania, które nie dotyczą sytuacji, są ukryte
- [ ] Profil wypełniony raz zasila wszystkie kalkulatory i wnioski (powtarzające się pola PESEL, imię, płatnik, §3.6)
- [ ] **Ekran wyniku:**
  - [ ] karty: „Czy mi przysługuje”, „Ile dostanę miesięcznie”, „Jak długo”, „Gdzie i do kiedy złożyć”, „Uwaga!”
  - [~] rozwijane „Jak to policzyliśmy”: kalkulatory mają już tabele i punkty z artykułami ustawy; brakuje jednolitej listy kroków ze wzorami
  - [x] przy wyniku „NIE” jasny powód (chorobowy, adopcja); dopilnować w pozostałych
- [x] RWD: sprawdzone na telefonie (375 px) dla strony głównej, panelu i wszystkich 7 kalkulatorów
- [ ] Prosty, urzędowo-przyjazny język bez paragrafów w głównym tekście (paragrafy tylko w „Jak to policzyliśmy”)
- [ ] Dostępność: kontrast, etykiety pól, nawigacja klawiaturą (instytucja publiczna = WCAG)

---

## 6. Upload / wybór przykładowych spraw PDF (P0, jury tego użyje)

- [ ] Lista „Przykładowe sprawy” do wyboru jednym kliknięciem (ładowane z `/private-cases` lub ze źródła ZUS)
- [ ] Upload własnego PDF (Z-3, Z-3a, ZAM, zaświadczenia)
- [ ] Wyciąganie tekstu (pdf.js / pdf-parse) → AI zwraca **JSON zgodny z `CaseProfile`** (okresy, składniki wynagrodzenia, daty, liczba dzieci)
- [ ] **Ekran weryfikacji:** pola wypełnione przez AI są podświetlone, a użytkownik je poprawia i zatwierdza. Liczy dopiero silnik
- [ ] Zabezpieczenie: AI nie ma żadnych uprawnień poza zwróceniem JSON, a JSON jest walidowany (zod) przed użyciem
- [ ] Fallback, gdy AI nie działa: ręczne wpisanie z podpowiedziami

---

## 7. Planer „oboje rodzice” na osi czasu (P1, główny wyróżnik)

- [ ] Oś czasu od porodu (tygodnie/miesiące), dwa wiersze: mama i tata
- [ ] Bloki: macierzyński, rodzicielski, ojcowski, praca; przeciąganie i zmiana długości
- [ ] Na żywo: kwota w każdym miesiącu (suma rodziny), daty końca, ile tygodni zostało w puli
- [ ] Na żywo ostrzeżenia: „9 tygodni taty przepada”, „przekroczono 5 części”, „ojcowski po 12. miesiącu”
- [ ] Gotowe szablony: „mama cały czas”, „po połowie”, „tata od 15. tygodnia”
- [ ] Argument na pitch: rodzice nie korzystają z elastycznych rozwiązań ze strachu przed utratą uprawnień, a planer pokazuje skutki od razu

---

## 8. Dokumenty, wnioski i terminy (P0 lista + P1 generator)

- [ ] P0: na podstawie profilu lista „Twoje dokumenty” (co, do kogo, termin, link do wzoru na zus.pl)
- [ ] P0: kalendarz terminów od daty porodu (14 / 21 / 7 dni, 12 miesięcy, 6 lat, §2.7 „Terminy wniosków”)
- [ ] P1: **generator wniosków urlopowych do pracodawcy** (macierzyński, rodzicielski, ojcowski, praca w rodzicielskim). Treść zadania mówi wprost, że trzeba je zaprojektować. Pola z rozporządzenia RWN, autouzupełnianie z profilu, pobranie PDF
- [ ] P1: symulowana „wysyłka do pracodawcy / do ZUS (PUE)” z potwierdzeniem
- [ ] P2: eksport terminów do kalendarza (.ics)

---

## 9. Symulacje integracji (P0, wszystkie wymienione w treści, tylko mocki)

- [x] Logowanie mObywatelem: kod logowania + ekran „aplikacji mObywatel” z wyborem osoby (Ola)
**Zrobione 21.11, 17:50 (Claude, bez commita):** `backend/zus-mock.js` + strony `/zus` i `/odpis-aktu`, link w menu i dwa kafelki w panelu. Opis w README („Symulacje usług ZUS i USC”).
- [x] Różne sytuacje dla 3 osób z mObywatela: Bożena – etat 6 000 zł, ciąża, e-ZLA z kodem B, duży pracodawca · Marzena – działalność, dobrowolne chorobowe, zaległość 312,40 zł · Mariusz – etat 7 500 zł, przyszły tata
- [x] „Moje dane z ZUS”: okresy ubezpieczenia, płatnik (NIP/REGON, liczba ubezpieczonych → kto wypłaca), wynagrodzenia z 12 mies. → podstawa wymiaru liczona silnikiem; przycisk „Przenieś do »Moje dane«” (kalkulatory od razu podstawiają podstawę, tytuł ubezpieczenia i płatnika)
- [x] Zaświadczenie o niezaleganiu na wybrany dzień (domyślnie data urodzenia dziecka z profilu): przy działalności porównanie z progiem 48,06 zł z parametrów → „BLOKADA”; u pracownika „nie dotyczy”; przycisk „Drukuj”
- [x] Podgląd e-ZLA: lista zwolnień z kodami i opisem (B = 100%, 270 dni), suma dni z kodem B
- [x] PUE/eZUS: lista wniosków ze statusem (np. Marzena: ZAS-53 wstrzymany przez zaległość)
- [x] Wniosek o odpis aktu urodzenia: dane dziecka z „Moje dane”, rodzaj odpisu, sposób odbioru, walidacja, numer wniosku, lista wniosków + informacja, że do ZUS odpis zwykle nie jest potrzebny
- [x] Każdy ekran oznaczony „SYMULACJA”, dane fikcyjne (firmy, lekarze, numery)
- [ ] Liczba dni e-ZLA z kodem B mogłaby sama trafiać do kalkulatora chorobowego (teraz: podpowiedź „wpisz je jako wykorzystane dni”) – do uzgodnienia z osobą od kalkulatorów
- [ ] Wnioski o odpis są trzymane w pamięci backendu (po restarcie/deployu znikają) – na demo wystarczy

---

## 10. Treści dodatkowe (P0 krótko, P1 ładnie)

- [ ] Empatyczna ścieżka dla trudnych sytuacji: martwe urodzenie, wcześniak, choroba lub śmierć matki. Osobny ton, bez „gratulacji”, konkretne prawa (8 tygodni, zasiłek pogrzebowy 7 000 zł)
- [ ] Lista organizacji wsparcia (§6) z linkami. **Sprawdzić, czy każdy link działa** (URL „Opiekuńczych Skrzydeł” jest niezweryfikowany)
- [ ] Przekierowania: zus.pl (wzory formularzy), gov.pl/rodzina, PIP

---

## 11. Oddanie (P0, zaczynać wcześnie!)

- [ ] README: opis, jak uruchomić, architektura (rysunek), **lista funkcji, które używają AI** (wymagane), licencje
- [ ] Prezentacja PDF, **max 10 slajdów**: problem słowami rodzica → demo → jedna liczba („X/Y przykładowych spraw policzonych zgodnie z ZUS”) → bezpieczeństwo (AI tylko czyta, kod liczy, dane lokalnie) → plan wdrożenia w ZUS (parametry w adminie, REST API do PUE) → zespół
- [ ] Film **≤ 3 min**: mObywatel → wybór sprawy → wynik krok po kroku → planer rodziców → zmiana parametru w adminie
- [ ] Zrzuty ekranu (desktop + telefon)
- [ ] Link do demo online sprawdzony w oknie incognito
- [ ] Przed wrzuceniem: `npm audit`, brak sekretów i dokumentów ZUS w repo, pamiętać, że prawa autorskie przechodzą na ZUS (regulamin)

### Harmonogram (planujemy od tyłu)
| Kiedy | Co ma działać |
|---|---|
| sobota wieczór, ~23:00 | ścieżka end-to-end: wpisuję dane → wynik macierzyńskiego z kwotą (nawet brzydko) |
| niedziela ~5:00 | **zamrożenie funkcji**: tylko poprawki, README, testy |
| do 8:00 | film nagrany (z zapasem), PDF prezentacji |
| do 10:00 | zgłoszenie wysłane, linki sprawdzone |
| 11:00 | koniec |

---

## 12. Do sprawdzenia w pliku od Mistrala (wątpliwości)

Plik jest dobrym źródłem parametrów, ale kilka liczb nie jest pewnych. Przed wpisaniem do `params.default.json`:

1. **Zaokrąglenia przy 13,71% są niespójne.** Min. podstawa 4 147,09 zł wychodzi, gdy każdą składkę (9,76% / 1,5% / 2,45%) zaokrągla się osobno do grosza. Maks. 20 321,30 zł wychodzi z jednego mnożenia × 0,8629, a przy osobnym zaokrąglaniu daje 20 321,29 zł. Trzeba wybrać jedną metodę (prawdopodobnie osobne składki, tak liczy ZUS) i potwierdzić ją na przykładowych sprawach lub u mentora. **Uwaga na JS:** `Math.round(20321.295*100)/100` daje 20 321,29 przez błąd float, więc kwoty liczyć w groszach (liczby całkowite) albo biblioteką decimal (np. `decimal.js`).
2. **Min. podstawa dla dobrowolnych (JDG):** plik podaje 4 877,53 zł, a z jego własnych danych (60% × 9 420 = 5 652 zł, minus składki) wychodzi **4 877,11 zł**. Druga wartość z pliku (5 342,14 zł) wynika z pomylenia prognozowanego wynagrodzenia z przeciętnym. Do potwierdzenia na zus.pl.
3. **Maks. podstawa:** przyjąć 20 321,30 zł (z Załącznika od ZUS, liczonego od 250% × 9 420). Wartości 22 258,90 zł z internetu nie używać, bo liczy od złej kwoty bazowej.
4. **JDG krócej niż 12 miesięcy (art. 48a):** plik opisuje to niejasno („najniższa podstawa składek + suma”). Przeczytać przepis przed implementacją.
5. **Adopcja „Za życiem” 65/67/62:** liczba 62 nie pasuje do niczego. Sprawdzić w KP art. 183.
6. **Mały ZUS / ulga na start:** plik nie opisuje JDG na preferencyjnych składkach (niższa podstawa, więc niższy zasiłek). Dodać jako przypadek testowy.
7. Sekcja 3 pliku (który formularz ma które pole) przyda się dopiero przy generatorze wniosków (sekcja 8). Do kalkulatora nie jest potrzebna.

---

## Czego NIE robimy (poza zakresem)

- 800+, „Aktywny Rodzic”, becikowe: to nie są świadczenia z ubezpieczenia chorobowego
- Prawdziwe integracje z mObywatelem/PUE: tylko symulacje
- Zasiłek opiekuńczy, urlop wychowawczy (najwyżej wzmianka, że za wychowawczy zasiłku nie ma)
