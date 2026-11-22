# Zgodność RodzicPlus z treścią zadania ZUS i regulaminem

Porównanie: „ZUS – Pełna treść zadania konkursowego” (16 stron) i „Regulamin zadania konkursowego”
z aplikacją na `main` (22.11.2026, rano). Oznaczenia: ✅ zgodne · ⚠️ częściowo / do decyzji · ❌ brak.

## Najważniejsze odstępstwa (do zrobienia przed oddaniem)

| # | Wymaganie (gdzie w zadaniu) | Stan | Co brakuje |
|---|---|---|---|
| 1 | **Upload / wybór przykładowych spraw ZUS** – „Strona powinna mieć możliwość uploadu/wyboru wybranych wniosków” (pkt 6), „na stronie… możliwość przetestowania wybranych załączonych przykładów (formularze w pdf)… zweryfikować czy osoba posiada ubezpieczenie oraz… sprawdzenie kalkulatora” (pkt 4) | ⏸️ **odłożone** | **Decyzja zespołu (22.11): na razie zostawiamy – może zrobimy później, ale niegwarantowane, raczej wypada z zakresu.** Na demo trzeba to powiedzieć wprost. Zastępczo: w kalkulatorze f) są **fikcyjne przykładowe sprawy** i pobranie wynagrodzeń z symulowanego ZUS (patrz niżej). Gdyby wracać: lista spraw z zestawów przepisana do JSON (bez kopiowania PDF-ów ZUS – pkt 2 zakazuje) → jeden klik wypełnia profil i kalkulator, porównanie z decyzją ZUS; pliki zostają w `private-cases/` poza repo |
| 2 | **„Wskazanie, które z funkcjonalności działają ze wsparciem… AI”** (pkt 4) + pkt 9 („wskazania w opisie zakresu jego użycia”) | ❌ | README wspomina tylko, że baza wiedzy powstała „z pomocą AI (Mistral)”. Potrzebna wyraźna sekcja: **żadna funkcja aplikacji nie używa AI w działaniu** (silnik jest regułowy, deterministyczny, z testami); AI użyto przy tworzeniu: Mistral – szkic bazy wiedzy (`docs/01`, `docs/02`), asystent AI do kodu i testów – **uzupełnić zgodnie z tym, czego faktycznie użył zespół** |
| 3 | Materiały formalne (pkt 4): link do demo, prezentacja ≤ 10 slajdów, film ≤ 3 min w otwartym repozytorium, zrzuty ekranu | ❌ w repo | W README nie ma linku do działającego demo (serwer GCE działa), prezentacji, filmu ani zrzutów. Jeśli powstają poza repo – dodać linki do README |
| 4 | Regulamin § 4 ust. 1: „W przypadku stosowania rozwiązań zewnętrznych zostanie to wyraźnie wskazane w prezentacji” | ✅ (repo) / ⚠️ (slajd) | Pełna lista z wersjami i licencjami + gotowy tekst na slajd: [docs/rozwiazania-zewnetrzne.md](rozwiazania-zewnetrzne.md); sekcja w README. **Zostało: wkleić slajd do prezentacji** |

## Merytoryka – co poprawiono przy tym przeglądzie

- **Zasiłek chorobowy w ciąży (W34), działalność gospodarcza** – zadanie (s. 3) mówi wprost: wniosek **ZAS-53** do ZUS. Aplikacja pisała „nic nie składasz – wystarczy e-ZLA” (wcześniej jeszcze błędniej: „ZAM”). Poprawione + test.
- **Zlecenie** – zadanie (s. 3 i 6): chorobowy – dokumenty do płatnika/ZUS, płatnik przesyła **Z-3a**; macierzyński – składa się **ZAM**, a płatnik Z-3a. Teksty „co składasz” poprawione.

## Wymagania merytoryczne „Narzędzie powinno zapewnić” (pkt 3)

| Wymaganie | Stan | Gdzie / uwagi |
|---|---|---|
| a) świadczenia w ciąży, także **brak** uprawnień: zasiłek chorobowy, świadczenie rehabilitacyjne, zasiłek w wysokości zasiłku macierzyńskiego | ✅ | „Złóż wniosek” (W34–W36b, W37, W38) – każdy wariant z powodem „nie przysługuje”; kalkulator a) z okresem wyczekiwania 30/90 dni, 33/14 dni wynagrodzenia, 270 dni, kodem B, zaległością |
| b) kalkulator macierzyński dla obojga rodziców (okres + wysokość; liczba dzieci, wiek, „Za życiem”) | ✅ | kalkulator b) + d) |
| c) łączenie pracy z urlopem rodzicielskim | ✅ | kalkulator c) (limit ½ etatu, 82/86 i 130/134 tyg.) |
| d) oboje rodzice | ✅ | kalkulator d) (9 tyg. nieprzenoszalne, max 5 części) |
| e) / j) adopcja i rodzina zastępcza (niezawodowa) | ✅ | kalkulator e); zawodowa rodzina zastępcza – brak prawa (W28) |
| f) wysokość przy indywidualnej podstawie – **„na konkretnej sprawie z zestawów”** | ⚠️ (zamiennik ✅) | „Konkretna sprawa z zestawów” = **przykładowe sprawy ZUS** – odłożone (punkt 1). Zamiast tego w kalkulatorze f): **8 fikcyjnych spraw** z ręcznie policzonym wynikiem (etat, premie 1/12, < 12 mies., miesiąc wyłączony, ½ etatu z minimum, działalność „duży” i preferencyjny ZUS, zlecenie ponad limit) – test pilnuje, że silnik daje dokładnie te kwoty – oraz przycisk **„Pobierz z ZUS (symulacja)”** (12 miesięcy wynagrodzeń / podstawy składek z symulowanego PUE) |
| g) dokumenty, terminy, sposób złożenia; płatnik (> 20 osób) albo ZUS | ✅ | „Złóż wniosek” (co składasz, komu, termin), kalkulator g), kalendarz terminów z podstawą prawną |
| h) zagrożenia utraty / obniżenia świadczeń | ✅ | ostrzeżenia V1–V49 i kalkulator g): umowa dla pozoru, podwyższenie podstawy w ciąży, brak ubezpieczenia w dniu porodu, zaległości, terminy (81,5%, ojcowski, rodzicielski) |
| i) podmioty **wyłącznie charytatywne** (śmierć dziecka, wcześniak, poronienie, ciężko chore dziecko) | ✅ | „Wsparcie”: 8 fundacji i hospicjów (strony sprawdzone 22.11), filtr wg sytuacji z zadania (wcześniak · dziecko ciężko chore · poronienie / śmierć dziecka / żałoba), zasięg przy każdej. Dodane: Rodzić po Ludzku (poronienie), Nagle Sami (żałoba), Warszawskie Hospicjum dla Dzieci, Gajusz; poprawione nazwy (Wcześniak **Rodzice-Rodzicom**, **Śląskie** Hospicjum Perinatalne); usunięta FDDS (przemoc – poza zakresem). Test: każda sytuacja ma ≥ 2 organizacje |
| „Rekomendujemy… **zintegrowany kalkulator** z możliwością wybrania opcji” | ✅ | `/kalkulatory/zintegrowany` (pierwszy kafel w „Kalkulatory”): zaznaczasz sytuacje (ciąża i L4, poród, podział urlopu, praca w rodzicielskim, adopcja, podstawa, dokumenty) – kalkulatory a–g liczą się na jednej stronie, z danymi z „Moje dane”. Domyślne opcje dobierane z etapu w profilu, wybór w adresie (`?opcje=b,d,f`). Ograniczenie: zapis podstawy z f) do profilu odświeża pozostałe kalkulatory dopiero po przeładowaniu strony |

## Możliwości narzędzia (pkt 3, druga lista)

| Wymaganie | Stan | Uwagi |
|---|---|---|
| logowanie mObywatelem (symulacja) | ✅ | 4 osoby demo |
| pobranie danych z ZUS / wpisanie własnych | ✅ | „Dane z ZUS” (symulacja) + „Moje dane”, przeniesienie do profilu |
| zadłużenie składkowe **na dzień powstania prawa** (zwłaszcza działalność) | ✅ | zaświadczenie na wybrany dzień, domyślnie data porodu |
| podgląd e-ZLA | ✅ | z kodami literowymi |
| PUE/eZUS: **zapytanie w razie wątpliwości**, sprawdzenie danych na koncie | ⚠️ | dane i wnioski widać; **nie ma symulowanego zadania pytania do ZUS** |
| wypełnienie wniosków o urlopy i świadczenia + przesłanie do pracodawcy/ZUS | ✅ | „Wniosek do druku” (pisma wg rozporządzenia z 11.03.2025, PDF, LaTeX), symulowana wysyłka z UPO; dla nie-pracowników – dane do ZAM |
| wniosek o odpis aktu urodzenia (zupełny / skrócony) | ✅ | „Odpis aktu” |
| podmioty wsparcia | ✅ (⚠️ zakres – wyżej) | |
| przekierowania: zus.pl, gov.pl/web/rodzina/urlop-rodzicielski, PIP | ✅ | „Linki urzędowe” |
| **panel administracyjny** – zmiana parametrów (stopy, wymiary) | ✅ | `/admin`; „dodawanie nowych funkcjonalności” przez panel – tylko parametry (realnie wystarczające) |

## Wymagania techniczne (pkt 5) i formalne

| Wymaganie | Stan |
|---|---|
| aplikacja webowa RWD, w pełni responsywna | ✅ (sprawdzane na 375 px) |
| React (preferowany) / backend JS / REST API | ✅ React + Vite, Node/Express, REST |
| działa testowo, potencjał produkcyjny | ✅ Docker, CI z testami, deploy na GCE; ⚠️ DEMO_MODE i `db.json` w repo (deploy czyści bazę przy zmianie pliku) |
| repozytorium kodu | ✅ |
| opis i tytuł projektu | ✅ README („RodzicPlus — Zasiłkowy Przewodnik Przyszłego Rodzica”) |
| prezentacja, film, zrzuty, link do demo, wskazanie AI | ❌ – odstępstwa 2–3 |
| nie kopiować / nie rozpowszechniać dokumentów ZUS z zestawów | ✅ `private-cases/` w `.gitignore`; w repo jest tylko regulamin (publiczny) |

## Zgodność treści z materiałami ZUS – miejsca „do potwierdzenia”

- **Uzupełniający urlop macierzyński** – aplikacja: przed 37. tyg. bez minimum, po 37. tyg. min. 2 kolejne dni (Kodeks pracy art. 180² i załącznik do zadania). Poradnik ZUS (s. 31) pisze „co najmniej 5 dni”. Zapytać mentorów.
- **Rodzina zastępcza: 38 / 62 tyg. rodzicielskiego** – z KP art. 183 § 4–4⁵; oznaczone „do potwierdzenia”.
- Formularz **Z-3b** i **ZUR / ZAO** – zadanie: zlikwidowane / włączone do ZAM od 24.10.2026. Aplikacja to uwzględnia (tylko poradnik ZUS jeszcze wspomina Z-3b).
