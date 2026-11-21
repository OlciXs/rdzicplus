# TODO: Zasiłkowy Przewodnik Przyszłego Rodzica (ZUS, HackNation 2026)

**Deadline: niedziela 22.11, godz. 11:00.** Wszystkie wartości liczbowe i podstawy prawne są w [docs/podsumowanie-danych-do-wyliczen.md](docs/podsumowanie-danych-do-wyliczen.md). Ten plik mówi, **co** zbudować i w jakiej kolejności. Szczegóły bierzecie z tamtego pliku (podaję numery sekcji, np. „§2.4”).

Priorytety: **P0** = bez tego nie oddajemy · **P1** = wyróżnik, który daje punkty · **P2** = jeśli zostanie czas.

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

- [ ] **Stack.** Propozycja: Next.js (App Router) + TypeScript. Silnik obliczeń to czysty moduł TS bez Reacta (`/engine`), wystawiony przez REST (`/api/calculate`) i importowany bezpośrednio w UI, żeby planer osi czasu liczył na żywo. Tailwind + shadcn/ui. Deploy na Vercel.
- [ ] **Gdzie trzymamy parametry admina.** Muszą przetrwać restart serwera, więc nie mogą być w pliku na Vercelu. Propozycja: jedna tabela w darmowym Postgresie (Supabase/Neon) albo Vercel KV. Wartości domyślne w `engine/params.default.json`.
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

- [ ] `npx create-next-app` (TS, Tailwind, App Router, ESLint)
- [ ] Vitest do testów silnika
- [ ] `.gitignore`: dodać `/private-cases/`. **Przykładowych spraw ZUS nie wolno wrzucać do repo** (zakaz kopiowania i rozpowszechniania). Demo ładuje je z folderu poza repo albo z miejsca wskazanego przez ZUS.
- [ ] Struktura katalogów:
  ```
  /engine        – czysta logika (bez Reacta), testowalna
    params.default.json
    types.ts     – Profil sprawy, Wynik, Krok obliczeń
    /rules       – jeden plik na kalkulator
  /app           – strony Next.js + /api
  /components
  /mocks         – fałszywe dane mObywatel / ZUS / e-ZLA
  /tests/cases   – nasze ręcznie policzone przypadki (bez dokumentów ZUS)
  ```
- [ ] Pusty deploy na Vercel od razu, żeby link działał od początku

---

## 2. Silnik obliczeń: `/engine` (P0, rdzeń całego projektu)

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

- [ ] **Strona główna:** krótkie „co możesz sprawdzić” + 3 wejścia: „Zaloguj przez mObywatel (symulacja)” / „Wgraj lub wybierz przykładową sprawę” / „Wpisz dane ręcznie”
- [ ] **Kreator (wizard)** zamiast jednego wielkiego formularza: kim jesteś (ciąża / jestem rodzicem / adopcja) → zatrudnienie → zarobki → dziecko → drugi rodzic → wynik. Pytania, które nie dotyczą sytuacji, są ukryte
- [ ] Profil wypełniony raz zasila wszystkie kalkulatory i wnioski (powtarzające się pola PESEL, imię, płatnik, §3.6)
- [ ] **Ekran wyniku:**
  - [ ] karty: „Czy mi przysługuje”, „Ile dostanę miesięcznie”, „Jak długo”, „Gdzie i do kiedy złożyć”, „Uwaga!”
  - [ ] rozwijane „Jak to policzyliśmy”: lista kroków z wzorem i podstawą prawną
  - [ ] przy wyniku „NIE” jasny powód i co można zrobić
- [ ] RWD: sprawdzić na telefonie (375 px). Jury patrzy też na komórce
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

- [ ] Logowanie mObywatelem: fałszywy ekran autoryzacji z wyborem jednej z 3–4 person testowych (np. „Anna, etat, 1. ciąża”, „Kasia, JDG z zaległością”, „Ola i Piotr, bliźnięta”, „Marek, adopcja”)
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
