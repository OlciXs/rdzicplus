# TODO: Zasiłkowy Przewodnik Przyszłego Rodzica (ZUS, HackNation 2026)

**Deadline: niedziela 22.11, godz. 11:00.** Wszystkie wartości liczbowe i podstawy prawne są w [docs/podsumowanie-danych-do-wyliczen.md](docs/podsumowanie-danych-do-wyliczen.md). Ten plik mówi, **co** zbudować i w jakiej kolejności. Szczegóły bierzecie z tamtego pliku (podaję numery sekcji, np. „§2.4”).

Priorytety: **P0** = bez tego nie oddajemy · **P1** = wyróżnik, który daje punkty · **P2** = jeśli zostanie czas.

---

## Stan projektu (sobota 21.11, 16:05)

**Działa** (sprawdzone lokalnie w przeglądarce i przez API):
- logowanie mObywatelem (symulacja): kod → wybór jednej z 3 fikcyjnych osób → sesja z tokenem, PESEL maskowany na froncie
- dashboard z listą spraw po porodzie (checkboxy), wylogowanie, sesja przetrwa odświeżenie strony
- **routing + 7 kalkulatorów a–g** (Montarex23, „Kalkulatory oraz routing”): strona powitalna `/`, lista `/kalkulatory`, osobny adres dla każdego kalkulatora, strona 404, `/panel` tylko dla zalogowanych. Adresy w README
- RWD na telefonie (375 px, bez poziomego scrolla, także strony kalkulatorów), build produkcyjny frontendu
- „baza” w pliku `backend/data/db.json` (Ola, `backend/db.js`), schowana za obiektem `db`
- Docker (`docker-compose.yml`, Dockerfile dla obu części) + GitHub Actions z deployem na Google Cloud (Enard)

**Nie działa:** deploy. **Wszystkie 5 uruchomień w GitHub Actions zakończyło się błędem**, więc demo online jeszcze nie istnieje. Ostatnie padło po ~1,5 min, czyli pewnie na kroku na maszynie wirtualnej (prawdopodobnie `PROJECT_ID`, patrz niżej). Logi widać tylko po zalogowaniu na GitHubie.

**Jeszcze nie ma:** uploadu PDF / przykładowych spraw, panelu admina, testów wyliczeń, planera osi czasu, generatora wniosków. **Uwaga architektoniczna:** wszystkie wyliczenia siedzą wewnątrz komponentów React (`frontend/src/calculators/Calc*.jsx`), a parametry w `frontend/src/calculators/config.js`. Przez to nie da się ich przetestować, użyć przy uploadzie PDF ani zmienić z panelu admina, więc pierwszym zadaniem jest wyciągnięcie ich do `engine/` (sekcja 2).

### Poprawione w kalkulatorach (21.11, 16:00, przez Claude; bez commita, sprawdzone w przeglądarce)
- [x] **c) Łączenie z pracą: zły wzór wydłużenia.** Było `urlop + urlop × etat` (½ etatu → 61,5 tyg.), jest `urlop ÷ (1 − etat)` zgodnie z KP art. 182¹f (½ etatu → 82 tyg., ¼ etatu → 54,67 tyg., „Za życiem” → 130 tyg.)
- [x] **a) Chorobowy:** przy braku prawa (okres oczekiwania) lub blokadzie za zaległość kwoty były liczone jak normalnie, a teraz wynoszą 0 zł z powodem. Blokada za zaległość dotyczy już tylko ubezpieczonych dobrowolnie, nie pracowników. Wynagrodzenie chorobowe bez kodu B liczy się po 80% (było zawsze 100%). Płatne dni są ograniczone do pozostałego okresu zasiłkowego (było: 300 dni L4 = 300 dni płatnych; jest 270), a ostrzeżenie o przekroczeniu okresu nie pojawia się już fałszywie
- [x] **d) Oboje rodzice:** w wariancie 81,5% 9 tygodni ojca liczone po 70% (tekst o tym mówił, ale wyliczenie brało 81,5%). Mniej niż 9 tygodni u rodzica to teraz ostrzeżenie o stracie, a nie „BŁĄD planu”
- [x] **e) Adopcja:** kwota rodzicielskiego dla jednego rodzica liczona z 32 tygodni (41 − 9 dla drugiego rodzica), a nie z całych 41
- [x] **b) Macierzyński:** martwe urodzenie dawało 57 dni zamiast 56; etykieta „zasiłek dzienny (100%)” pokazuje faktyczną stawkę
- [x] **f) Podstawa:** minimum dla dobrowolnych 4 877,11 zł przeniesione do `config.js` (było wpisane na sztywno jako 4 877,53 zł)
- [x] **RWD:** na telefonie tabele wyników rozpychały strony kalkulatorów do ~500 px. Poprawione w `themes.css` (`minmax(0, 1fr)`), teraz tabela przewija się w swojej karcie

### Znane braki w kalkulatorach (do zrobienia)
- [ ] Każdy kalkulator każe osobno wpisać „podstawę wymiaru”. Wynik kalkulatora f) powinien przechodzić do pozostałych (wspólny profil sprawy, §3.6 pliku z danymi)
- [ ] b) Macierzyński: brak podwyższenia do 1 000 zł (świadczenie rodzicielskie) i brak kwot urlopu rodzicielskiego miesiąc po miesiącu
- [ ] f) Podstawa: minimum 4 147,09 zł stosowane bez względu na wymiar etatu (powinno być proporcjonalne); miesiące < 50% czasu pracy trzeba wyłączać ręcznie
- [ ] e) Adopcja: urlop „na warunkach macierzyńskiego” nie kończy się, gdy dziecko osiąga 7/10/14 lat; wartość 62 tyg. dla „Za życiem” jest niepotwierdzona (sekcja 12, pkt 5)
- [ ] d) Oboje: „max 5 części” jest sprawdzane osobno dla każdego rodzica. Potwierdzić w KP art. 182¹c, czy limit jest na rodzica, czy łączny
- [ ] a) Chorobowy: kod B ma zerować wcześniejsze okresy zasiłkowe bez ciąży; teraz pole „wykorzystane dni” jest liczone zawsze
- [ ] Zaokrąglenia: kwoty liczone na liczbach zmiennoprzecinkowych, bez zaokrąglania stawki dziennej do grosza (sekcja 12, pkt 1)
- [ ] `npm audit` we frontendzie: 2 umiarkowane podatności (esbuild – tylko serwer deweloperski; react-router). Poprawka wymaga podbicia wersji (`npm audit fix --force`), więc lepiej po oddaniu albo na spokojnie

**Lekcja z dzisiaj:** commit „Build and deploy” przypadkiem cofnął logowanie Oli w `server.js` (naprawione w `5b3ce25`). **Przed każdym pushem: `git pull`**, a przy konflikcie nie wybierać „swojej wersji” w ciemno.

### Poprawki techniczne (P0, małe)
- [ ] **Naprawić deploy (Enard):** przeczytać log z GitHub Actions (run #5), potem poprawki poniżej. Przed oddaniem demo MUSI działać online
- [ ] **`docker-compose.yml`: `${PROJECT_ID}` bez wartości daje błędną nazwę obrazu** (`europe-central2-docker.pkg.dev//app-images/...`), więc lokalne `docker compose up --build` z README się wyłoży. Poprawka: `${PROJECT_ID:-local}`. Na VM `PROJECT_ID` musi być w `/opt/app/.env`, bo `sudo` gubi zmienne środowiskowe (Enard)
- [ ] **Puste `backend/.dockerignore` i `frontend/.dockerignore`:** `COPY . .` wrzuci do obrazu `node_modules` z Windowsa i może zepsuć build w kontenerze. Wpisać do obu: `node_modules`, `dist`, `.env`, `data` (backend)
- [ ] Pusty `frontend/nginx.conf`: usunąć albo wypełnić (teraz frontend w Dockerze chodzi na `vite preview`, nie na nginx)
- [ ] `backend/data/db.json` dodać do `.gitignore` (i `git rm --cached`). Zmienia się przy każdym logowaniu, a `db.js` i tak tworzy go sam z danych startowych
- [ ] Gdy deploy przejdzie: wpisać do README link do działającego demo
- [ ] (drobne) Ostrzeżenie w Actions: `actions/checkout@v4` i `setup-gcloud@v2` działają na wycofywanym Node 20. Na razie nic nie psuje
- [ ] Dashboard: usunąć krok „Świadczenie 800 plus” (poza zakresem zadania ZUS) i podmienić listę na kroki z kalkulatora (sekcja 8)
- [ ] Dashboard: zapisywać zaznaczone checkboxy (teraz po odświeżeniu wracają do 0), np. w profilu użytkownika w `db`

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
- [ ] Utworzyć `engine/` z własnym `package.json` (`"type": "module"`) i podpiąć go:
  - w backendzie: `import { calculate } from "../engine/index.js"`
  - we froncie: alias w `vite.config.js` (np. `resolve.alias: { "@engine": "../engine" }`) i ewentualnie `server.fs.allow: [".."]`, bo Vite domyślnie nie serwuje plików spoza `frontend/`
- [ ] Vitest w `engine/` (`npm i -D vitest`, skrypt `"test": "vitest run"`)
- [ ] Backend: zamienić `/api/hello` na właściwe endpointy:
  - `POST /api/calculate`: przyjmuje `CaseProfile`, zwraca `Result`
  - `GET /api/params` i `PUT /api/params` (admin, chronione hasłem z `.env`)
  - `POST /api/extract`: upload PDF → AI → JSON (sekcja 6); potrzebny `multer` do plików
  - `GET /api/mock/*`: dane ZUS / e-ZLA / zadłużenie (sekcja 9). Logowanie mObywatelem już jest pod `/api/auth/*`
- [ ] Frontend: dodać routing (`react-router-dom`), bo teraz `App.jsx` przełącza tylko Login ↔ Dashboard, a dojdą kalkulator, planer i admin. Style: Ola trzyma wszystko w `themes.css` (tokeny kolorów + klasy), więc **zostajemy przy tym zamiast Tailwinda**, żeby nie mieszać dwóch systemów
- [ ] Docelowa struktura:
  ```
  /engine          – czysta logika, testowalna (NOWE)
    params.default.json
    types.js       – JSDoc: Profil sprawy, Wynik, Krok obliczeń
    /rules         – jeden plik na kalkulator
    /tests/cases   – ręcznie policzone przypadki (bez dokumentów ZUS)
  /backend         – Express (jest), /routes, /mocks
  /frontend        – React + Vite (jest), /src/pages, /src/components
  /private-cases   – sprawy ZUS, tylko lokalnie (w .gitignore)
  /docs            – materiały (jest)
  ```
- [ ] README: uzupełnić „Moja apka” o nazwę projektu, opis i komendę testów (pełna wersja w sekcji 11)
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

- [ ] Punkt startowy: obiekt `CFG` w `frontend/src/calculators/config.js` (już ma większość stawek i limitów). Przenieść go do `engine/params.default.json`
- [ ] `params.default.json` ze wszystkimi wartościami z §4 pliku z danymi. Klucze semantyczne (`maternity.weeks.byChildren`, `rates.parental`), **a nie numery artykułów**
- [ ] Każdy parametr ma: wartość, opis po polsku, podstawę prawną i datę „obowiązuje od”
- [ ] `/admin`: tabela parametrów, edycja, zapis do bazy, przycisk „przywróć domyślne”. Proste hasło z env wystarczy
- [ ] Silnik zawsze czyta parametry z bazy (z fallbackiem na domyślne)
- [ ] Na demo pokazać: zmieniam stawkę 70% → 75% w adminie i kalkulator od razu liczy inaczej

---

## 4. Testy na przykładowych sprawach (P0, robić równolegle z silnikiem)

- [ ] Ręcznie policzone przypadki w `/tests/cases/*.json` (wejście i oczekiwany wynik). Na start:
  - [ ] etat, 6 000 zł brutto stałe przez 12 miesięcy → podstawa **5 177,40 zł** → 100% = 5 177,40 · 81,5% = 4 219,58 · 70% = 3 624,18
  - [ ] pensja poniżej minimum → podstawa podniesiona do 4 147,09 zł
  - [ ] JDG z dobrowolnym chorobowym od 60 dni → brak prawa (okres oczekiwania 90 dni) → komunikat „NIE”
  - [ ] JDG z zaległością 100 zł → blokada
  - [ ] bliźnięta → macierzyński 31 tygodni, rodzicielski 43 tygodnie
  - [ ] „Za życiem” → 65 tygodni
  - [ ] wcześniak 26. tydzień, 900 g, 10 tygodni w szpitalu → uzupełniający 10 tygodni
  - [ ] ½ etatu w rodzicielskim → wydłużenie i proporcjonalna kwota
  - [ ] firma z 15 pracownikami → „składasz do ZUS”
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
- [ ] Podpiąć do 3 osób z `db.js` (Bożena, Marzena, Katarzyna) **różne sytuacje ubezpieczeniowe**, żeby demo pokazywało różne wyniki kalkulatora, np. Bożena: etat 6 000 zł, 1. ciąża · Marzena: JDG z zaległością składkową · Katarzyna: zlecenie, bliźnięta. Ewentualnie dodać 4. osobę: tata / adopcja
- [ ] „Pobieram dane z ZUS”: okresy ubezpieczenia, płatnik, wynagrodzenia (ubezpieczony / nieubezpieczony)
- [ ] Zaświadczenie o niezaleganiu / zadłużeniu składkowym na dzień porodu (ważne dla JDG)
- [ ] Podgląd e-ZLA: lista zwolnień z kodami (B!), która zasila licznik 182/270
- [ ] Połączenie z PUE/eZUS (status wniosku, mock)
- [ ] Wniosek o odpis aktu urodzenia (symulacja formularza USC / gov.pl)
- [ ] Każdy mock wyraźnie oznaczony „SYMULACJA”

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
