# Podsumowanie danych do wyliczeń — „Zasiłkowy Przewodnik Przyszłego Rodzica" (ZUS, HackNation 2026)

Zbiorcza baza wiedzy dla implementacji narzędzia: co budujemy (kalkulatory), jakie dane wchodzą do obliczeń, gdzie występują (powtarzalność) i skąd je brać. Przygotowane na podstawie:

- **[Zadanie]** `ZUS - Pełna treść zadania konkursowego.pdf` (wymagania a–j, kryteria, wymagania techniczne)
- **[Regulamin]** `ZUS - Regulamin zadania konkursowego.pdf` (nagroda 30 000 zł, przeniesienie praw autorskich)
- **[Załącznik]** `Załącznik_ maksymalny czas trwania zasiłków, wysokość, podstawa wymiaru.docx`
- **[Poradnik]** `Poradnik dla rodziców, ZUS 2026.pdf` (42 str., stan prawny 1.04.2026)
- **[UZ]** wyciąg ustawy z 25.06.1999 o świadczeniach pieniężnych z ubezpieczenia społecznego w razie choroby i macierzyństwa — „ustawa zasiłkowa" (t.j. Dz.U. 2026 poz. 854)
- **[KP]** wyciąg Kodeksu pracy (t.j. Dz.U. 2026 poz. 1245)
- **[RZI]** rozporządzenie MRPiPS z 27.09.2026 w sprawie zakresu informacji o okolicznościach mających wpływ na prawo do zasiłków… (Dz.U. 2026 poz. 1316)
- **[RWN]** rozporządzenie MRPiPS z 11.03.2025 w sprawie wniosków dot. uprawnień pracowników związanych z rodzicielstwem (Dz.U. 2025 poz. 322)
- weryfikacja web: wskaźniki i kwoty 2026 (patrz sekcja 7 — zapisy _prep/web_research.md)

Szczegółowe streszczenia źródłowe: `_prep/poradnik_summary.md`, `_prep/przepisy_summary.md`, `_prep/web_research.md` (wygenerowane w tej sesji; pełne teksty PDF wirtualne w osobnej konfiguracji — skróty w `_prep/`).

---

## 1. CO BUDUJEMY — wymagania funkcjonalne

Narzędzie (web app, RWD, React/Next.js preferowane, backend JS/Python/C#/.NET, REST API) = **przewodnik + zintegrowany kalkulator** dla osób planujących rodzicielstwo, kobiet w ciąży i rodziców (w tym adopcyjnych i rodzin zastępczych). Informacja o indywidualnej sytuacji pochodzi z danych ZUS (symulacja pobrania) albo z danych wprowadzanych ręcznie przez użytkownika.

### Kalkulatory (z [Zadanie] pkt 3 a–j; rekomendacja: jeden zintegrowany kalkulator z opcjami)

| # | Kalkulator / funkcja | Co liczysz | Kluczowe dane wejściowe |
|---|---|---|---|
| a | Świadczenia w ciąży | czy przysługuje zasiłek chorobowy (w tym **100% przy kodzie „B"**), świadczenie rehabilitacyjne, zasiłek w wysokości zasiłku macierzyńskiego — **w tym informacja o BRAKU uprawnień** | okresy ubezpieczenia chorobowego (30/90 dni oczekiwania), wiek (50+), wykorzystane dni wynagrodzenia chorobowego 33/14, okres zasiłkowy 182/270, kod B, data ustania umowy + przyczyna (upadłość/likwidacja/śmierć pracodawcy, wyrok) |
| b | Zasiłek macierzyński dla obojga rodziców | okres trwania (tygodnie) + wysokość (100/81,5/70%) przy uwzględnieniu liczby dzieci, wieku dziecka (adopcja), zaświadczenia „Za życiem" | liczba dzieci, przewidywana data porodu, czy wniosek 81,5% w 21 dni, podział części na ojca, okresy pobrane przez matkę/ojca |
| c | Łączenie urlopu rodzicielskiego z pracą | wydłużony wymiar urlopu (proporcja) + zasiłek pomniejszany proporcjonalnie | wymiar czasu pracy (≤ ½ etatu), tygodnie urlopu, stawka |
| d | Symulacja obojga rodziców | jednoczesne/naprzemienne korzystanie, pulę 41/43 (65/67) tygodni, po 9 tygodni wyłącznych na rodzica | okresy każdego z rodziców, liczba części (max 5, do 6 r.ż. dziecka) |
| e i j | Adopcja / rodzina zastępcza niezawodowa | wymiar urlopu na warunkach urlopu macierzyńskiego (20–37 tyg., min. 9 tyg.) + rodzicielski + terminy (wiek dziecka 7/10/14 lat) | data przyjęcia na wychowanie, data wystąpienia do sądu, wiek dziecka, odroczenie obowiązku szkolnego |
| f | Podstawa wymiaru zasiłku (symulacja z PDF przykładowej sprawy) | przeciętne miesięczne wynagrodzenie/przychód z 12 m-cy, −13,71%, uzupełnienia, premie 1/12, min/maks podstawy → kwota zasiłku | składniki wynagrodzenia z Z-3 / wniosek z PDF (upload!), dni przepracowane, wymiar etatu, okresy |
| g | Dokumenty i terminy | który dokument, gdzie i kiedy złożyć | status pracownik/nie-pracownik, liczba ubezpieczonych u płatnika (≥21 → płatnik wypłaca, ≤20 → ZUS), sytuacja |
| h | Zagrożenia utraty uprawnień | reguły ryzyk (pkt 5 poniżej) | umowa dla pozoru, podwyższenie podstawy, data wyrejestrowania z chorobowego |
| – | Zasiłek chorobowy po porodzie / resztki okresu zasiłkowego (wynika z [Zadanie]) | | |

### Symulacje wymagane przez [Zadanie] (wszystkie tylko zasymulowane!)
logowanie przez **mObywatela**, pobranie danych z systemów ZUS (ubezpieczenie/brak), **zaświadczenie o zadłużeniu składkowym na dzień porodu** (kluczowe dla przedsiębiorczyń — blokada zasiłku przy zaległości > 1% minimalnego wynagrodzenia), podgląd **e-ZLA**, połączenie z **PUE/eZUS**, wypełnienie wniosków o urlopy (wnioski urlopowe trzeba zaprojektować; wnioski o zasiłki istnieją na zus.pl), symulacja wniosku o **odpis aktu urodzenia** (gov.pl rejestr stanu cywilnego), informacje o wsparciu charytatywnym + przekierowania (zus.pl, gov.pl/rodzina, PIP).

**Wymagania techniczne:** responsywność (RWD), upload/wybór przykładowych wniosków PDF na stronie (jury tego używa!), panel administracyjny do zmiany **parametrów** bez wdrożenia (stopa zasiłku, maks. wymiary) — patrz sekcja 4 „parametry konfigurowalne".

**Kryteria oceny:** związek z wyzwaniem 25%, pomysł 20%, oryginalność 15%, kompletność + UX 25%, potencjał wdrożeniowy 15%. Do przekazania: opis+tytuł, prezentacja ≤10 slajdów, film ≤3 min, repo kodu, demo online, zrzuty ekranu, wskazanie gdzie użyto AI.

---

## 2. PARAMETRY DO OBLICZEŃ (wszystkie w jednym miejscu)

### 2.1 Status i okresy oczekiwania
| Parametr | Wartość | Źródło |
|---|---|---|
| Okres oczekiwania — ubezpieczenie obowiązkowe (umowa o pracę) | **30 dni** nieprzerwanego ubezpieczenia chorobowego | UZ art. 4 ust. 1 pkt 1 |
| Okres oczekiwania — ubezpieczenie dobrowolne (zlecenie, DG, duchowny, marynarz) | **90 dni** | UZ art. 4 ust. 1 pkt 2 |
| Zaliczanie wcześniejszych okresów | przerwa ≤ 30 dni (albo urlop wychowawczy/bezpłatny/służba wojsk.) | UZ art. 4 ust. 2 |
| Wyjątki — prawo od 1. dnia | absolwent (≤90 dni od ukończenia), wypadek w drodze do/z pracy, ≥10 lat obowiązkowego ubezpieczenia chorobowego, poseł/senator, funkcjonariusz SC | UZ art. 4 ust. 3 |
| Kto wypłaca zasiłki | płatnik zgłaszający **> 20** (tj. ≥21) ubezpieczonych do chorobowego (stan na 30 listopada poprzedniego roku) — wypłaca sam; ≤20 → ZUS. DG/dobrowolni → zawsze ZUS | UZ art. 61; [Zadanie] |

### 2.2 Zasiłek chorobowy w ciąży
| Parametr | Wartość | Źródło |
|---|---|---|
| Wynagrodzenie chorobowe (płatne przez pracodawcę) | **33 dni**/rok kalendarzowy (<50 r.ż.), **14 dni** (po 50 r.ż.) — **wlicza się do okresu zasiłkowego** | KP art. 92; UZ art. 12 |
| Stawka wynagrodzenia chorobowego w ciąży | **100%** (kod B) | KP art. 92 § 1 |
| Okres zasiłkowy standard / w ciąży lub gruźlica | **182 / 270 dni** | UZ art. 8 |
| Okres zasiłkowy: przerwa nie resetuje | przerwa ≤ **60 dni** → okresy się sumują; **WYJĄTEK: kod „B" resetuje** poprzednie okresy niezależnie od przerwy | UZ art. 9 ust. 2 |
| Okresy wykluczone | urlop bezpłatny, wychowawczy, opiekuńczy, areszt/kara — nie wliczają się | UZ art. 12 |
| Stawka zasiłku chorobowego | **100%** w ciąży (kod B na e-ZLA); standard 80% | UZ art. 11 |
| Zasiłek = 1/30 podstawy miesięcznej za każdy dzień niezdolności | | UZ art. 11 ust. 4–5, art. 36 ust. 3 |
| Kody e-ZLA | A (ta sama choroba po przerwie ≤60 dni), **B (ciąża)**, C (alkohol, −5 dni), D (gruźlica), E (choroba o długim wylęganiu) | UZ art. 57 |
| Świadczenie rehabilitacyjne (po wyczerpaniu 182/270 dni) | **90%** przez pierwsze 3 mies., **75%** dalej, **100% w ciąży**; max **12 mies.**; wniosek ZUS Np-7 (z zaświadczeniem OL-9) najpóźniej 6 tyg. przed końcem okresu zasiłkowego | UZ art. 18–19, art. 28 |

### 2.3 Zasiłek w wysokości zasiłku macierzyńskiego (utrata pracy w ciąży)
| Parametr | Wartość | Źródło |
|---|---|---|
| Kiedy | umowa rozwiązana z powodu **upadłości, likwidacji pracodawcy, śmierci pracodawcy** i nie zapewniono innej pracy, albo rozwiązanie z **naruszeniem prawa** (prawomocny wyrok) | UZ art. 30 ust. 3 |
| Wysokość i okres | **100%** podstawy, **do dnia porodu** | UZ art. 30 ust. 3 |
| Dokumenty | zaświadczenie o ciąży w okresie zatrudnienia + świadectwo pracy + oświadczenie „nie zapewniono innego zatrudnienia" (+ wyrok) | RZI § 17 |

### 2.4 Zasiłek macierzyński — WYMIAR (tygodnie urlopu)
| Urlop | 1 dziecko | 2 dzieci | 3 | 4 | 5+ | Źródło |
|---|---|---|---|---|---|---|
| Macierzyński (i na warunkach — adopcja/rodzina zastępcza) | **20** | **31** | 33 | 35 | 37 | KP art. 180 § 1, art. 183 |
| — w tym nieprzenoszalna część matki po porodzie | **14 tyg.** (przy orzeczeniu matki: 8 tyg.) | | | | | KP art. 180 § 4 i 6 |
| — maksymalnie przed porodem | **6 tyg.** (wniosek/pracownica ≥14 dni przed) | | | | | KP art. 180 § 2 |
| Uzupełniający (wcześniak/hospitalizacja) | 1 tydzień za tydzień szpitala: poród **<28 tyg. ciąży lub ≤1000 g → max 15 tyg.**; 28–37 tyg. i >1000 g → **max 8 tyg.**; po 37 tyg. + hospitalizacja ≥2 dni między 5.–28. dniem → **max 8 tyg.** (od 5. dnia). Sumowanie, niepełny tydzień ↑; ciąże mnogie: najniższa masa + najdłuższa hospitalizacja | | | | | KP art. 180²; [Załącznik] |
| Rodzicielski (wspólna pula obojga) | **41** | **43** | 43 | 43 | 43 | KP art. 182¹a |
| — wyłączna, nieprzenoszalna część KAŻDEGO rodzica | **9 tyg.** (zawsze 70%) | | | | | KP art. 182¹a § 4; UZ art. 31 |
| — z „Za życiem" | **65** | **67** | 67 | 67 | 67 | KP art. 182¹a § 2; UZ art. 30a |
| Ojcowski | **2 tyg. (14 dni kalendarzowych)**, jednorazowo lub 2 części po min. 7 dni; do **12 mies. życia** dziecka (adopcja: 12 mies. od uprawomocnienia, max do 14 lat); po terminie prawa WYGAŚAJĄ | | | | | KP art. 182³ |
| Łączenie rodzicielskiego z pracą u tego samego pracodawcy (≤ ½ etatu) | urlop wydłuża się proporcjonalnie: max **82 tyg.** / **86 tyg.** („Za życiem": **130/134 tyg.**); zasiłek pomniejszany proporcjonalnie | | | | | KP art. 182¹f; UZ art. 31 ust. 4a |
| Martwe urodzenie / zgon dziecka przed 8 tyg. życia | **8 tyg.** po porodzie, nie krócej niż **7 dni od zgonu**; przy wielorodztwie — wymiar wg liczby dzieci pozostałych przy życiu | | | | | KP art. 180¹ |
| Zgon dziecka po 8 tyg. życia | jeszcze **7 dni** od zgonu | | | | | KP art. 180¹; [Zadanie] |
| Urlop na warunkach urlopu macierzyńskiego — limity wieku dziecka | rodzina zastępcza niezawodowa: **7 lat** (**10 lat** przy odroczeniu obowiązku szkolnego); wniosek o przysposobienie: **14 lat**; min. wymiar zasiłku **9 tyg.** | | | | | UZ art. 29; KP art. 183; RZI § 16 |
| Dzielenie rodzicielskiego | max **5 części** (liczone per wnioski), do końca roku kalendarzowego, w którym dziecko kończy **6 lat** | | | | | KP art. 182¹c–d |
| Adopcja: urlop rodzicielski analogicznie 41/43 („Za życiem" 65/67/62) | | | | | | KP art. 183 § 4 |

### 2.5 Zasiłek macierzyński — WYSOKOŚĆ (stawki)
| Sytuacja | Stawka | Źródło |
|---|---|---|
| Urlop macierzyński / na warunkach / uzupełniający / ojcowski | **100%** podstawy wymiaru | UZ art. 31 ust. 1 |
| Urlop rodzicielski (wariant zmienny) | **70%** | UZ art. 31 ust. 2 |
| Wniosek (max 21 dni po porodzie/przyjęciu) o macierzyński + rodzicielski w pełnym wymiarze (poza 9 tyg. drugiego rodzica) | **81,5%** za całość | UZ art. 30a, art. 31 ust. 3 |
| 9 tyg. wyłącznych każdego rodzica | zawsze **70%** (także w wariancie 81,5%) | UZ art. 31 ust. 3f |
| Wariant 81,5% ale ani 1 dzień rodzicielskiego w 1. roku życia dziecka | 70% za rodzicielski + **wyrównanie macierzyńskiego do 100%** (na wniosek) | UZ art. 31 ust. 3g-4 |
| Minimalna kwota zasiłku | podwyższenie do kwoty **świadczenia rodzicielskiego** (1000 zł, ustawa o świadczeniach rodzinnych) gdy zasiłek nets < kwota | UZ art. 31 ust. 3a; [Web] |
| Stopa dzienne | zasiłek = (stawka × 1/30 podstawy) × dni | UZ art. 36 ust. 3 |

### 2.6 Podstawa wymiaru zasiłku (dla każdego zasiłku na tych samych zasadach)
| Reguła | Wartość | Źródło |
|---|---|---|
| Pracownik | przeciętne miesięczne wynagrodzenie z **12 m-cy** poprzedzających miesiąc choroby/porodu, **−13,71%** (składki E 9,76% + R 1,5% + chorobowa 2,45%), liczone u **jednego płatnika** w okresie nieprzerwanego ubezpieczenia | UZ art. 3 pkt 3, art. 36 |
| Krócej niż 12 mies. | średnia z pełnych miesięcy kalendarzowych | UZ art. 36 ust. 2, art. 38 |
| Dzienna stawka | **1/30** podstawy miesięcznej | UZ art. 36 ust. 3 |
| Choroba w 1. miesiącu pracy | wynagrodzenie z umowy uzupełnione do pełnego miesiąca | UZ art. 37; [Załącznik] |
| Przepracowane < 50% czasu pracy w miesiącu | miesiąc wyłączony; ≥50% → uzupełniamy (stałe: pełna kwota; zmienne: wypłacone ÷ przepracowane × do przepracowania) | UZ art. 38 ust. 2–3; [Załącznik] |
| Premie | miesięczne: faktycznie wypłacone; **kwartalne: 1/12 z 4 poprzednich kwartałów**; **roczne: 1/12 z roku poprzedniego** | UZ art. 42 |
| Wyłączone składniki | te przysługujące nadal w okresie zasiłku (np. dodatek stażowy) i wygasłe | UZ art. 41 |
| Nowa podstawa | dopiero przy przerwie w pobieraniu zasiłków ≥ **1 miesiąca** kalendarzowego | UZ art. 43 |
| Nie-pracownik (zlecenie/DG) | przeciętny miesięczny **przychód** z 12 mies., −13,71%; krócej — art. 48a (najniższa podstawa składek + suma); przerwa ≤30 dni łączy okresy | UZ art. 3 pkt 4, art. 48–50, 48a |
| **Minimalna podstawa (pracownik, pełny etat)** | minimalne wynagrodzenie **−13,71%**: 2026 = **4 147,09 zł** (od płacy minimalnej 4 806 zł; wg [Załącznik] formuła, wartość z web-researchu; liczone 4806−469,07−72,09−117,75) | UZ art. 45 |
| **Maksymalna podstawa (dobrowolni — od składki)** | podstawa wymiaru składki chorobowej ≤ **250% prognozowanego przeciętnego wynagrodzenia** = **23 550,00 zł** (2026); po −13,71% → **20 321,30 zł** [Załącznik] (web alternatywnie 22 258,90 zł = 250%×8 903,56 — patrz sekcja 7 „do potwierdzenia") | [Załącznik]; sus art. 18 ust. 8-9 |
| **Minimum dla dobrowolnych** | najniższa podstawa wymiaru składek (60% prognozowanego przeciętnego wynagrodzenia; 2026: 5 652 zł) minus 13,71% (≈ 4 877,53 zł) — web-research podaje 5 342,14 zł (60% × 8 903,56) — **DO POTWIERDZENIA** | [Web] § 4 |
| Max po ustaniu ubezpieczenia | **100% przeciętnego wynagrodzenia** (kwartalnie ogłaszane) | UZ art. 46 |
| Blokada: zaległość składkowa | zaległość > **1% minimalnego wynagrodzenia** (2026 = **48,06 zł**) → brak świadczeń dla DG/osób współpracujących/duchownych do spłaty; przedawnienie 6 mies. | UZ art. 2a |
| Składki od zasiłku macierzyńskiego | podstawa składek E/R = kwota zasiłku (pomniejszona o PIT), finansuje budżet państwa; bez składki zdrowotnej | [Poradnik] |

### 2.7 Dzielenie urlopu macierzyńskiego między rodziców (przejęcie przez ojca)
| Sytuacja matki | Prog | Źródło |
|---|---|---|
| Standardowa rezygnacja | dopiero po ≥ **14 tyg.** po porodzie; wniosek ≥ 7 dni przed powrotem do pracy | KP art. 180 § 4, § 8; UZ art. 29 ust. 3 |
| Orzeczenie o niezdolności do samodzielnej egzystencji | po ≥ **8 tyg.** | KP art. 180 § 6 |
| Pobyt w szpitalu | po ≥ 8 tyg.; zasiłek ojca za okres hospitalizacji | UZ art. 29 ust. 6; RZI § 23–24 |
| Zgon / porzucenie / niezdolność do samodzielnej egzystencji / nieubezpieczona mama podejmuje pracę ≥ ½ etatu | pełny wymiar u ojca lub innego ubezpieczonego członka najbliższej rodziny; **okres ojca pomniejsza matkę** — suma ≤ pełny wymiar | UZ art. 29 ust. 5–10, art. 29a; KP art. 180 § 7–17; RZI § 20–25 |
| Zbieg: oboje rodzice | jednocześnie lub naprzemiennie; suma ≤ wymiar; przy dochodzeniu zbiegowych uprawnień korzysta jedno | UZ art. 29a; KP art. 189¹ |

**Terminy wniosków (deal lines dla UI):** macierzyński przed porodem ≥14 dni przed; rezygnacja matki ≥7 dni przed powrotem; uzupełniający ≥21 dni przed końcem macierzyńskiego; rodzicielski ≥21 dni przed każdą częścią; praca w rodzicielskim ≥21 dni (odmowa pracodawcy w 7 dni z uzasadnieniem); ojcowski ≥7 dni przed; na warunkach: wniosek w ≤7 dni od przyjęcia dziecka, start ≤21 dni od przyjęcia; zasiłkowy 81,5% ≤**21 dni po porodzie**; rodzicielski do końca roku kal. 6. r.ż. dziecka; ojcowski do 12 mies.; Płatnik ≤20 ubezpieczonych przesyła do ZUS ≤7 dni. ZUS wypłaca w ≤**30 dni** od wyjaśnienia okoliczności; przedawnienie roszczenia zasiłku **6 mies.** (3 lata przy winie ZUS/płatnika). Wcześniejsze złożenie wniosku urlopowego uruchamia ochronę KP (14/21/7 dni przed, art. 177 § 1¹).

---

## 3. SŁOWNIK DANYCH DO KALKULATORÓW — i ich POWTARZALNOŚĆ

Uwaga implementacyjna: pola wysoko powtarzalne (sekcja 3.1–3.2) trzymamy JEDNORAZOWO w profilu użytkownika (zalogowanie mObywatel → symulacja pobrania) i automatycznie wstawiamy do wszystkich wniosków/oświadczeń/kalkulatorów. To jest podstawowy UX-argument zadania: „świadomy ubezpieczony = mniej błędnych formularzy".

### 3.1 Dane osoby ubezpieczonej — POWTARZALNOŚĆ MAKSUMALNA (każdy formularz)

| Pole | Gdzie występuje | Powtarzalność |
|---|---|---|
| **Imię + nazwisko** | każdy wniosek, Z-3/Z-3a, ZAM, zaświadczenia, oświadczenia, wnioski urlopowe RWN §2–20 (obowiązkowe pierwsze pole), e-ZLA | **~100% dokumentów** |
| **Numer PESEL** (zamiennie: seria/nr paszportu lub dowodu + data urodzenia gdy brak PESEL) | RZI zał. 1 p.1, zał. 2 p.3, zał. 3 p.3, zał. 4 p.1, zał. 5 I.1, zał. 6 p.3, zał. 7 p.1; dane przekazywane zamiast odpisu aktu (RZI § 13 ust. 3); oświadczenia matki/ojca (RZI § 25, § 32 p.4); zaświadczenia płatnika o stawce** drugiego rodzica** (RZI § 20, § 24 ust. 2, § 27, § 30); zaświadczenia niani (RZI § 36); ZAM; [Poradnik]: wszystkie druki | **~90% dokumentów — najbardziej powtarzalne pole w całym systemie (mnożone ×2: dane matki i dane ojca, oraz ×n dzieci)** |
| Adres zamieszkania | RZI zał. 1/2/3/4/5/6/7 (razem z danymi osobowymi) | wysoka — wszystkie wnioski zasiłkowe |
| Numer rachunku bankowego | RZI zał. 1 p.8, zał. 2 p.15, zał. 3 p.13, zał. 4 p.7, zał. 6 p.17 | wysoka — każdy wniosek o WYPŁATĘ |
| Data i podpis, miejscowość | każdy formularz + pouczenie | tożsamość strukturalna (metadane formularza) |

### 3.2 Dane płatnika składek — bardzo wysoka powtarzalność

| Pole | Gdzie | Powtarzalność / znaczenie |
|---|---|---|
| **NIP + REGON płatnika** (albo PESEL/paszport gdy brak) | RZI zał. 1 p.2, zał. 2 p.1, zał. 3 p.1, zał. 5 II.1, zał. 6 p.1 | wysoka; **z tego pola bierze się decyzja kto płaci** (patrz 2.6); ważne też w oświadczeniach matki (NIP pracodawcy, RZI § 25) |
| Nazwa i adres płatnika | zał. 1/2/3/5/6 | wysoka |
| **Liczba ubezpieczonych zgłaszanych do ubezpieczenia chorobowego** | zał. 2 p.11, zał. 3 p.12 | krytyczne — reguła >20/≤20 (kieruje do płatnika vs ZUS; w kalkulatorze g: „gdzie złożyć") |
| Okres zatrudnienia + wymiar czasu pracy + data zmiany wymiaru | zał. 2 p.4 | kluczowy „okoliczności determinujące" |
| Okresy wynagrodzenia chorobowego (33/14) **z kodami literowymi**; okresy zasiłku wliczane do okresu zasiłkowego | zał. 2 p.9–10 | wejście do licznika 182/270 dni |
| Składniki wynagrodzenia (miesięczne stałe/zmienne, kwartalne, roczne) + dni przepracowane/do przepracowania + przyczyna nieprzepracowania + % potrąconej składki | zał. 2 p.16 | **wejście do kalkulatora podstawy wymiaru** |
| Umowy cywilnoprawne z tym pracownikiem + kwoty | zał. 2 p.17 | zbieg tytułów |
| **Okresy i stawka zasiłku macierzyńskiego wypłaconego matce/ojcu** (+ PESEL tego rodzica) | zał. 2 p.12; RZI § 20 ust. 2, § 27, § 29 p.4, § 30 p.2, § 24 ust. 2 (o odwrotnym kierunku) | krytyczne przy dzieleniu urlopu między rodziców (kalkulator d) — wymiana danych „płatnik zasiłku → drugi płatnik/ZUS" |
| Data złożenia wniosku o zasiłek macierzyński | zał. 2 p.12; zał. 3 p.7 | determinuje wariant 81,5% |

### 3.3 Dane dziecka — wysoka powtarzalność

| Pole | Gdzie | Powtarzalność |
|---|---|---|
| **Imię i nazwisko dziecka, PESEL dziecka, data i miejsce urodzenia** | RZI zał. 2 p.13, zał. 3 p.8, **zał. 6 p.5**, § 13 ust. 3 (zamiast odpisu aktu); wnioski urlopowe RWN § 5, § 18 (imię+nazwisko+data urodzenia przyjętego), § 19–20 (dla wychowawczego); wnioski ojcowskich/rodzicielskich (przez odpis) | wysoka; przy ciąży mnogiej = n danych; **data urodzenia dziecka jest zmienną czasu dla wszystkich limitów wieku (12 mies./6 lat/7 lat/10 lat/14 lat)** |
| Liczba dzieci przy jednym porodzie / przyjętych jednocześnie | zał. 6 p.8; wejście wszystkich kalkulatorów wymiaru (20–37 tyg., 41/43, 65/67) | krytyczne wejście |
| Przewidywana data porodu | zał. 6 p.10; zaświadczenie o przewidywanej dacie porodu (RZI § 13); wniosek przed porodem (RWN §2) | wysoka w fazie ciąży |
| Data przyjęcia dziecka na wychowanie + data wystąpienia do sądu o przysposobienie | RZI § 16 ust. 1, § 27, § 30; RWN § 18 | adopcja — ważna dla limitów 6/12 mies./lat |
| Dane o urodzeniu i okresie pobytu dziecka w szpitalu (tydzień ciąży, masa urodzeniowa, okres hospitalizacji) | zał. 6 p.12; zaświadczenie szpitala (KP art. 180² § 5); wniosek o uzupełniający (RWN § 14) | kalkulator uzupełniającego (8/15 tyg.) |
| Czy dziecko ma zaświadczenie „Za życiem" | **zał. 6 p.9** (oświadczenie); RWN § 15 ust. 2 pkt 3 (kopia zaświadczenia) | kluczowy przełącznik wymiaru (41/43 → 65/67) |

### 3.4 Dane drugiego rodzica — wysoka powtarzalność (zwłaszcza przy dzieleniu)

| Pole | Gdzie | Powtarzalność |
|---|---|---|
| Imię, nazwisko, **PESEL** drugiego rodzica (albo dokument tożsamości + data ur.), adres | RZI zał. 2 p.14, zał. 3 p.9, **zał. 6 p.6**, oświadczenia: § 25 (matka + NIP pracodawcy), § 32 p.4; RWN § 15 ust. 2 pkt 2 (oświadczenie o zamiarze drugiego rodzica) | przy KAŻDYM wniosku dot. rodzicielskiego/uzupełniającego danego rodzica po raz pierwszy; stale gdy dzielą |
| Okresy zasiłku pobrane przez drugiego rodzica, liczba części, stawka procentowa | zał. 6 p.14; RZI § 27, § 29 p.4, § 30 p.2 (+ NIP płatników) | kalkulator d (symulacja obojga) — **policzalne z danych ZUS, jeśli oba wnioski złożone** |
| Okresy urlopu wykorzystane przed porodem (macierzyński przed porodem) | RWN § 5 pkt 3, § 6, § 7, § 8–9, § 14 | zmniejsza pulę po porodzie |

### 3.5 Okoliczności specjalne — średnia powtarzalność (przełączniki kalkulatorów)

| Okoliczność/grupa danych | Gdzie | Wpływ na wyliczenie |
|---|---|---|
| Martwe urodzenie / zgon dziecka (<8 tyg. / po 8 tyg.) | zał. 6 (sytuacja matki); [Poradnik] | wymiar: 8 tyg./7 dni; zasiłek pogrzebowy 7 000 zł |
| Umieszczenie dziecka w pieczy zastępczej / zakładzie | RZI § 19 | przerwanie/zaniechanie wypłaty |
| Hospitalizacja matki (data przyjęcia/wypisania) | RZI § 23-24; RWN § 6 | przerwanie zasiłku matki → przejęcie przez ojca, potem powrót |
| Orzeczenie o niezdolności matki do samodzielnej egzystencji | RZI § 21–22, § 26 p.4; RWN § 4 | matka może skrócić od 8 tyg.; pełny wymiar ojca |
| Zgon/porzucenie przez matkę (ubezpieczoną i nieubezpieczoną; data zdarzenia) | RZI § 20 ust. 3–4; RWN § 8–11 | pełny wymiar u ojca/in. członka rodziny |
| Upadłość / likwidacja / śmierć pracodawcy / rozwiązanie z naruszeniem prawa (wyrok sądu) | zał. 6 p.11; RZI § 15, § 17 | zasiłek macierzyński lub zasiłek w wysokości macierzyńskiego **po ustaniu ubezpieczenia** |
| Działalność zarobkowa, emerytura/renta, zasiłek dla bezrobotnych, KRUS (gospodarstwo), urlop bezpłatny u >1 pracodawcy | RZI zał. 4 (oświadczenie po ustaniu) | ograniczenie/wyłączenie prawa po ustaniu ubezpieczenia |
| Rodzaj niezdolności: choroba zawodowa / wypadek przy pracy / wypadek w drodze do/z pracy + dokument | zał. 1 p.7, zał. 2 p.7, RZI § 10 | stawka 100% od 1. dnia (niezależnie od ciąży) |
| Czy zasiłek pobierany z więcej niż jednego tytułu (+ wskazanie płatnika podwyższenia) | RZI § 28; UZ art. 62 | podwyższenie do świadczenia rodzicielskiego — wypłaca jeden płatnik |
| Czy wniosek macierzyński przed porodem / czy pełny wymiar + ≥1 dzień rodzicielskiego w 1. roku życia | zał. 6 p.15 | decyduje o 81,5% i wyrównaniu do 100% |
| Łączenie urlopu rodzicielskiego z pracą: wymiar czasu pracy, okres, zamiar co do części wydłużonej | RWN § 16 (zał. 1); zał. 2 p. w § 29–30 (zaświadczenie pracodawcy o wymiarze pracy) | kalkulator c — proporcjonalność w obie strony |
| Odroczenie obowiązku szkolnego dziecka | RZI § 16 ust. 2 pkt 3, § 30 p.9; RWN § 18 ust. 2 | limit 10 lat (zamiast 7) |
| Zaległość składkowa na dzień porodu | [Poradnik]; UZ art. 2a | blokada zasiłku (>1% płacy minimalnej) dla DG |

### 3.6 Zbiorcza klasyfikacja powtarzalności (widok UX)

1. **PESEL + imię/nazwisko** — jest w ~każdym dokumencie, w trzech rolach naraz (ubezpieczony, drugi rodzic, dziecko): UI powinno stawiać je automatycznie w każdy formularz i tyko walidować format — a przy braku PESEL (noworodek, cudzoziemiec) podażać ścieżkę zastępczą (seria/nr dowodu/paszportu + data urodzenia; zaświadczenie zamiast odpisu).
2. **Daty graniczne zdarzeń** (poród, przyjęcie, zgon, hospitalizacja, ustanie tytułu) — powtarzają się w 2–4 formularzach każda, w różnych kontekstach; powinny wchodzić do **jednej osi czasowej** w profilu sprawy, z której kalkulatory liczą wszystkie okresy.
3. **Dane płatnika** (NIP/REGON/liczba ubezpieczonych) — powtarzalne w każdym zaświadczeniu płatnika; autor nie musi ich stawiać — dokładane przez płatnika/ZUS.
4. **Oświadczenia** („Za życiem", „drugi rodzic nie będzie korzystać", „nie zapewniono innego zatrudnienia") — powtarzalne w wielu wnioskach różnych sytuacji (uzupełniający, rodzicielski dla ojca, itd.)
5. **Składniki wynagrodzenia / przychodu** (12 mies.) — najbardziej pracochłonne dane wejściowe kalkulatora f; w realnym wdrożeniu pochodzą z Z-3 / systemu ZUS (symulujemy); w wersji demo — upload PDF wniosku lub ręczne pola z gotowymi przykładami z zestawów ZUS.

---

## 4. PARAMETRY KONFIGUROWALNE (panel administracyjny — wymagany przez [Zadanie])

Stopy: 100%, 81,5%, 70%, 80% (chorobowy/opiekuńczy), 90/75% (rehabilitacyjne). Wymiary: 20/31/33/35/37; 41/43; 65/67; 6/8/9/14 tyg.; 15/8 tyg. (uzupełniający); 2 tyg. (ojcowski); 130/134 tyg. (łączenie z pracą); 33/14 dni; 182/270/91 dni; 30/90 dni; 60 dni; 21/14/7/12 mies.; wiek: 6/7/8/10/12/14/18 lat; 1/30; 13,71%; próg 20 ubezpieczonych; kwoty roczne: płaca minimalna (min. podstawa), 250% prognozowanego wynagrodzenia (maks.), 1000 zł świadczenie rodzinne, 7 000 zł zasiłek pogrzebowy, 4 000 zł „Za życiem".

---

## 5. ZAGROŻENIA / UTRATA UPRAWNIEŃ (wymóg h — funkcja ostrzeżeń)

1. Umowa/działalność **dla pozoru** (dla zdobycia ubezpieczenia) → decyzja ZUS o niepodleganiu ubezpieczeniom → brak zasiłków ([Zadanie] H 1; [Poradnik] p. 8–9).
2. **Podwyższenie podstawy składek w ciąży** tylko dla wyższego zasiłku → decyzja ustalająca niższą podstawę ([Zadanie] H 2).
3. **Niepodleganie ubezpieczeniu chorobowemu w dniu porodu** (niezgłoszenie dobrowolnego chorobowego / rozwiązanie umowy / wyrejestrowanie DG/zlecenia przed porodem) → brak zasiłku macierzyńskiego ([Zadanie] H 3). Pobieranie zasiłku macierzyńskiego **wygasa dobrowolne ubezpieczenie chorobowe** — po zasiłku trzeba ponownie ZUA ([Poradnik]).
4. **Ulga na start** (6 mies.) = brak chorobowego = brak zasiłków ([Poradnik] p. 15).
5. **Zaległość składkowa > 1% płacy minimalnej** — blokada zasiłków dla DG/współpracujących/duchownych (UZ art. 2a).
6. Zły zakres zwolnienia (praca zarobkowa/aktywność niezgodna) → utrata zasiłku za cały okres + zwrot z odsetkami ([Poradnik] p. 27).
7. Przekroczone terminy: wniosek o rodzicielski po 21 dniach → traci się 81,5%; urlop ojcowski po 12 mies. → wygasa; przedawnienie 6 mies.; rok kal. 6. r.ż. dziecka dla rodzicielskiego.
8. Zbieg L4: kody bez B + przerwa + L4 z B → okres zasiłkowy liczony od nowa ([Poradnik] p. 24).
9. Zasiłek macierzyński nie przysługuje za urlop wychowawczy / bezpłatny ([Poradnik]).

## 6. WSPIERANIE DODATKOWE (wymóg i — podmioty charytatywne)

Fundacja Wczesniak Rodzice-Rodzicom (wczesniak.pl), Fundacja Przed Czasem (przedczasem.org), Fundacja Dajemy Dzieciom Siłę (fdds.pl), HoPe Hospicjum Perinatalne Katowice (hope.katowice.pl), Wrocławskie Hospicjum dla Dzieci (hospicjum.wroc.pl), Fundacja Pomagam (pomagam.pl), Fundacja „Opiekuńcze Skrzydła" (URL do weryfikacji). Świadczenie „Za życiem": **4 000 zł** (art. 4a) + pakiet medyczny/psychologiczny. Linki: zus.pl/wzory-formularzy/zasilki, gov.pl/web/rodzina/urlop-rodzicielski, pip.gov.pl/dla-pracodawcow/porady-prawne/rodzicielstwo, gov.pl/web/cyfryzacja/rejestr-stanu-cywilnego (odpis aktu urodzenia online).

## 7. KWOTY 2026 I PUNKTY DO POTWIERDZENIA

| Wskaźnik | Wartość 2026 | Podstawa |
|---|---|---|
| Płaca minimalna | **4 806,00 zł** | Dz.U. 2025 poz. 1242 (rozp. RM z 15.09.2025) |
| Min. podstawa zasiłku (pracownik, pełny etat) | **4 147,09 zł** | UZ art. 45 (4806 − 13,71%) |
| Maks. podstawa wymiaru składki chorobowej (dobrowolni) | **23 550,00 zł** (250% × 9 420 prognozowanego przeciętnego) | Komunikat Prezesa ZUS z 28.11.2025, M.P. 2025 poz. 1216 |
| Maks. podstawa zasiłku po −13,71% | **20 321,30 zł** wg [Załącznik] | [Załącznik]; patrz konflikt niżej |
| Przeciętne wynagrodzenie 2025 (limit 100% po ustaniu — UZ art. 46) | **8 903,56 zł** | Komunikat Prezesa GUS z 9.02.2026, M.P. 2026 poz. 192 |
| Prog zaległości blokującej zasiłki | **48,06 zł** | UZ art. 2a (1% × 4806) |
| Świadczenie rodzicielskie (min. kwota zasiłku macierzyńskiego) | 1 000 zł netto | ustawa o świadczeniach rodzinnych |
| Zasiłek pogrzebowy | 7 000 zł | [Poradnik] |
| Świadczenie „Za życiem" | 4 000 zł | ustawa z 4.11.2016, art. 4a |

**Do potwierdzenia przed wdrożeniem kwot (patrz _prep/web_research.md):**
1. **Maks. podstawa zasiłku: 20 321,30 zł ([Załącznik]) vs 22 258,90 zł (250%×8 903,56 wg web)**. Rekomendacja: jury stosuje [Załącznik] — przyjąć 20 321,30 zł jako „limit podstawy zasiłku wyliczony od maks. podstawy składki" (arytmetycznie: 23 550 × 0,8629), adnotować drugą wartość w panelu admin jako konfigurowalną.
2. **Min. podstawa dla dobrowolnych: 4 877,53 zł (60% × 9 420 −13,71%, „duży ZUS" zadeklarowany) vs 5 342,14 zł (60% × 8 903,56)** — przeliczyć raz jeszcze wg najnowszego komunikatu ZUS.
3. Numeracja artykułów: art. „180¹/180²" KP i „182¹/182¹a" różnie publikowane — w kodzie trzymać klucze semantyczne („macierzyński", „uzupełniający"), nie numery artykułów.
4. Kwota 5 342,14 zł niezweryfikowana wprost na zus.pl; potwierdzić na zus.pl/baza-wiedzy/skladki-wskazniki-odsetki/wskazniki/zasilki.

## 8. CO JESZCZE ZAPEWNIĆ (checklista implementacyjna z [Zadanie])

- logowanie mObywatel (symulacja), PUE/eZUS (symulacja), zadłużenie (symulacja zaświadczenia), e-ZLA (symulacja listy),
- upload przykładowych wniosków PDF z zestawów ZUS (jury przetestuje poprawność wyliczeń!), wypełnienie wniosków urlopowych + ewentualne wysyłka do pracodawcy/ZUS, odpis aktu urodzenia (symulacja wniosku do USC), wsparcie charytatywne, przekierowania, panel admin na parametry, pełny RWD, wskazanie użycia AI.
- Kierunki danych: **pracownik → pracodawca (płatnik)**; **nie-pracownik z zlecenia → płatnik lub ZUS (Z-3a jeśli płatnik ma prawo wypłaty)**; **DG → zawsze ZUS (ZAM, ZAS-53)**; **mały płatnik (≤20) → przesyła Z-3/Z-3a do ZUS w ≤7 dni**. Od 24.10.2026 ZAM łączy ZUR/ZAO/ZAM; Z-3b zlikwidowany; Z-15 zastępuje Z-15A/B.
