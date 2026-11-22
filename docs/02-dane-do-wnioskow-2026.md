# Wymagane dane i dokumenty do wniosków — przyszli rodzice
### Rejestr pól dla każdego wariantu świadczenia (ZUS 2026)

**Dokument II z II** — warstwa operacyjna (co użytkownik musi podać / złożyć).
Dokument I: `01_KATALOG_SWIADCZEN_2026.md` — opis merytoryczny wariantów.

> **Jak to czytać.** Każdy wariant ma: kto składa → do kogo → na jakim formularzu → **pola `[P]`** (do wypełnienia przez
> wnioskodawcę), **pola `[PL]`** (wypełnia płatnik składek), **pola `[D]`** (dokumenty dołączane), **pola `[ZUS]`**
> (dane, które ZUS może pozyskać sam albo które wynikają z systemu). Oznaczenia literowe [1], [2]… to identyfikatory
> pól wspólnych — zestawione w § 1.

---

## § 1. ZBIORY DANYCH WSPÓLNYCH (biblioteka pól)

### 1.1 `[P-A]` Dane identyfikacyjne ubezpieczonego — **zawsze wymagane**
| Id | Pole | Uwagi / źródło |
|---|---|---|
| A1 | **pierwsze imię** | art. 61b ust. 3 pkt 1 u.z.; zał. 1–7 |
| A2 | **nazwisko** | j.w. |
| A3 | **numer PESEL** | albo — gdy nie nadano — **seria i numer paszportu + data urodzenia** |
| A4 | **adres zamieszkania** | pełny (ulica, nr, kod, miejscowość) |
| A5 | **numer rachunku bankowego** | do wypłaty zasiłku (zał. 1 pkt 8, zał. 2 pkt 15, zał. 3 pkt 13, zał. 6 pkt 17, zał. 7 pkt 7) |
| A6 | **data i podpis wnioskodawcy** / miejscowość i data | zał. 1 pkt 9; zał. 6 pkt 18; zał. 7 pkt 8 |

> **Uwaga o A3:** jeżeli nie nadano numeru PESEL — podaje się **serię i numer paszportu oraz datę urodzenia**.
> W formach elektronicznych (art. 61b ust. 1 pkt 2 u.z.) wymagany jest **kwalifikowany podpis elektroniczny,
> podpis zaufany, podpis osobisty** albo sposób potwierdzania pochodzenia i integralności danych w systemie ZUS.

### 1.2 `[P-B]` Dane płatnika składek
| Id | Pole | Uwagi |
|---|---|---|
| B1 | **NIP płatnika składek** | zał. 1 pkt 2, zał. 2 pkt 1, zał. 3 pkt 1, zał. 6 pkt 1 |
| B2 | **REGON płatnika składek** | j.w. |
| B3 | **nazwa i adres płatnika składek** | zał. 2 pkt 2, zał. 3 pkt 2, zał. 6 pkt 2 |
| B4 | **PESEL / seria i numer paszportu płatnika** — gdy nie nadano NIP | zał. 1 pkt 2 |
| B5 | **liczba ubezpieczonych zgłaszanych do chorobowego** | **decyduje, kto wypłaca zasiłek** (>20 → płatnik, ≤20 → ZUS) — zał. 2 pkt 11, zał. 3 pkt 12 |
| B6 | **data złożenia wniosku o zasiłek macierzyński u płatnika** | zał. 2 pkt 12, zał. 3 pkt 7 |
| B7 | **data i podpis osoby upoważnionej + numer telefonu** | zał. 2 pkt 18, zał. 3 pkt 15 |

### 1.3 `[P-C]` Dane dziecka
| Id | Pole | Uwagi |
|---|---|---|
| C1 | **imię dziecka** | zał. 2 pkt 13, zał. 3 pkt 8, zał. 6 pkt 5, § 13 ust. 3 |
| C2 | **nazwisko dziecka** | j.w. |
| C3 | **numer PESEL dziecka** (o ile nadano) | j.w. |
| C4 | **data urodzenia dziecka** | j.w. |
| C5 | **miejsce urodzenia dziecka** | j.w. |
| C6 | **liczba dzieci urodzonych przy jednym porodzie** | wymiar urlopu: 1→20, 2→31, 3→33, 4→35, 5+→37 tyg. |
| C7 | **liczba dzieci pozostałych przy życiu** | art. 180¹ § 1–2 k.p. |
| C8 | **wiek dziecka w dniu przyjęcia na wychowanie** | adopcja / rodzina zastępcza (limity 7/10/14 lat) |

### 1.4 `[P-D]` Dane drugiego rodzica / członka rodziny (gdy niezbędne)
| Id | Pole | Uwagi |
|---|---|---|
| D1 | **pierwsze imię** | zał. 2 pkt 14, zał. 3 pkt 9, zał. 6 pkt 6 |
| D2 | **nazwisko** | j.w. |
| D3 | **numer PESEL** (albo seria i numer paszportu + data urodzenia) | j.w. — **wymagany wprost** w § 20 ust. 1 pkt 2, § 23, § 27, § 30, § 32 |
| D4 | **adres zamieszkania** | j.w. |
| D5 | **relacja do dziecka** (matka / ojciec / inny członek najbliższej rodziny) | art. 175¹ k.p. |
| D6 | **NIP i nazwy płatników zasiłku drugiego rodzica** | art. 29 ust. 1 pkt 4 rozporządzenia zasiłkowego |

### 1.5 `[P-E]` Dane o ubezpieczeniu / zatrudnieniu
| Id | Pole | Uwagi |
|---|---|---|
| E1 | **tytuł do ubezpieczenia chorobowego** (umowa o pracę / zlecenie / działalność / współpraca / duchowny / marynarz / umowa uaktywniająca / brak) | art. 6 ust. 1 u.s.u.s.; zał. 3 pkt 4, zał. 6 pkt 4 |
| E2 | **okres podlegania ubezpieczeniu chorobowemu** (od–do) | zał. 3 pkt 5 |
| E3 | **wymiar czasu pracy** (pełny / część etatu) i **data zmiany wymiaru** | zał. 2 pkt 4; art. 40 u.z. |
| E4 | **okres zatrudnienia u płatnika** (od–do) | zał. 2 pkt 4 |
| E5 | **informacja, czy praca jest wykonywana za granicą** | zał. 2 pkt 5 |
| E6 | **informacja, czy umowa to praca tymczasowa** | zał. 2 pkt 6 |
| E7 | **podstawa wymiaru składek za poszczególne miesiące** (+ liczba dni przepracowanych / obowiązujących) | zał. 3 pkt 14 |
| E8 | **składniki wynagrodzenia** (miesięczne stałe/zmienne, kwartalne, roczne, inne), z liczbą dni przepracowanych i obowiązujących, przyczyną nieprzepracowania, procentem potrąconej składki | zał. 2 pkt 16 |
| E9 | **umowa agencyjna / zlecenia / o świadczenie usług / o dzieło**: termin, do którego składnik przysługuje, kwoty za poszczególne miesiące | zał. 2 pkt 17 |
| E10 | **czy ubezpieczony wykonuje pracę na podstawie umowy uaktywniającej** | zał. 3 pkt 4 |
| E11 | **uprawnienie do emerytury / renty** + organ rentowy i data | zał. 4 pkt 2, zał. 5 |
| E12 | **uprawnienie do zasiłku dla bezrobotnych / zasiłku przedemerytalnego / świadczenia przedemerytalnego / rodzicielskiego świadczenia uzupełniającego / nauczycielskiego świadczenia kompensacyjnego** + data | zał. 4 pkt 3, zał. 5 |
| E13 | **czy obowiązuje ubezpieczenie społeczne rolników** (obowiązkowo/dobrowolnie, także jako domownik), liczba hektarów przeliczeniowych / dział specjalny | zał. 4 pkt 4 |
| E14 | **prowadzenie gospodarstwa rolnego przez wnioskodawcę lub małżonka** | zał. 4 pkt 4 |
| E15 | **kontynuowanie / podjęcie działalności zarobkowej** + data podjęcia | zał. 4 pkt 4, art. 13 ust. 1 pkt 2 |
| E16 | **czy wnioskodawca korzysta z urlopu bezpłatnego u innego pracodawcy** + okres | zał. 4 pkt 5 |
| E17 | **uprawnienie do stypendium / świadczenia z PUP** + data | zał. 4 pkt 6 |
| E18 | **czy w okresie niezdolności korzysta z urlopu bezpłatnego / wychowawczego / opiekuńczego, przebywa w areszcie / odbywa karę, ma usprawiedliwioną nieobecność (art. 632 § 8 k.p.)** + okresy | zał. 2 pkt 8, zał. 3 pkt 11 |
| E19 | **stan zadłużenia z tytułu składek na dzień powstania prawa do świadczenia** | art. 2a u.z. — **próg 1% minimalnego wynagrodzenia** (2026: 1% × 4 806 zł = **48,06 zł**) |

### 1.6 `[P-F]` Dane o niezdolności / zaświadczeniach lekarskich
| Id | Pole | Uwagi |
|---|---|---|
| F1 | **okres, za który wnioskodawca ubiega się o zasiłek** (od–do) | zał. 1 pkt 4, zał. 7 pkt 2 |
| F2 | **seria i numer zaświadczenia lekarskiego (e-ZLA)** | zał. 1 pkt 4, zał. 7 pkt 2 |
| F3 | **kod literowy e-ZLA** — w szczególności **„B” = ciąża** | art. 57 ust. 1–2 u.z. |
| F4 | **czy niezdolność powstała w okresie ubezpieczenia, czy po ustaniu tytułu**; **data ustania tytułu** | zał. 1 pkt 6 |
| F5 | **czy niezdolność powstała z powodu choroby zawodowej / wypadku przy pracy / wypadku w drodze do pracy** + dokument potwierdzający | zał. 1 pkt 7, zał. 2 pkt 7, zał. 3 pkt 10 |
| F6 | **okresy, za które płatnik wypłacił wynagrodzenie za czas niezdolności** (rok bieżący i poprzedni) + **kody literowe** | zał. 2 pkt 9, zał. 3 pkt 6 |
| F7 | **okresy, za które płatnik wypłacił zasiłek chorobowy** wliczane do jednego okresu zasiłkowego + **kody literowe** | zał. 2 pkt 10, zał. 3 pkt 7 |
| F8 | **czy za okres przysługuje wynagrodzenie** (marynarz, art. 75 pkt 2 ustawy o pracy na morzu) — tak/nie i w jakim okresie | zał. 1 pkt 5, zał. 5 |
| F9 | **typ okresu zasiłkowego** (182 / 270 dni) i **data zakończenia okresu zasiłkowego** | zał. 5 cz. III pkt 2 |

### 1.7 `[P-G]` Dane ciążowe i porodowe
| Id | Pole | Uwagi |
|---|---|---|
| G1 | **przewidywana data porodu (PDP)** | zał. 6 pkt 10; § 13 ust. 1 pkt 1 |
| G2 | **faktyczna data porodu** | potwierdzana skróconym odpisem aktu urodzenia |
| G3 | **data rozpoczęcia urlopu macierzyńskiego** (nie wcześniej niż 6 tyg. przed PDP) | art. 180 § 2 |
| G4 | **czy poród był mnogi** i ile dzieci | art. 180 § 1 |
| G5 | **czy dziecko urodziło się martwe** | art. 180¹ § 1 |
| G6 | **data zgonu dziecka** | art. 180¹ § 1–2 |
| G7 | **czy urodzenie nastąpiło za granicą** + kraj | § 14 |
| G8 | **czy w okresie ciąży / przed porodem kobieta pobierała zasiłek chorobowy** (podstawa wymiaru przed porodem) | Poradnik ZUS |

### 1.8 `[P-H]` Dane o hospitalizacji dziecka (uzupełniający urlop macierzyński)
| Id | Pole | Uwagi |
|---|---|---|
| H1 | **tydzień ciąży, w którym nastąpiło urodzenie** (poniżej 28 / 28–37 / po 37) | art. 180² § 1, § 5 |
| H2 | **masa urodzeniowa dziecka** (≤ 1000 g / > 1000 g) | j.w. |
| H3 | **okres pobytu dziecka w szpitalu** (data przyjęcia–wypisu, wszystkie okresy do sumowania) | art. 180² § 3, § 5 |
| H4 | **data pierwszego dnia pobytu w szpitalu** (dla przypadku po 37. tyg.: czy przypada między 5. a 28. dniem po porodzie) | art. 180² § 1 pkt 3 |
| H5 | **przy porodzie mnogim: najniższa masa urodzeniowa i najdłuższa hospitalizacja** | art. 180² § 2 |
| H6 | **termin zakończenia urlopu macierzyńskiego** | art. 180² § 6 — **obowiązkowo we wniosku** |

### 1.9 `[P-I]` Dane o urlopach i planach rodzicielskich
| Id | Pole | Uwagi |
|---|---|---|
| I1 | **rodzaj świadczenia, o które ubiega się wnioskująca osoba** + jego okres | zał. 2 pkt 19, zał. 3 pkt 16, zał. 6 pkt 7 |
| I2 | **okres dotychczas wykorzystanego urlopu rodzicielskiego / zasiłku za ten okres** | § 15 ust. 1 pkt 2 |
| I3 | **liczba wykorzystanych części urlopu rodzicielskiego / liczba wniosków o zasiłek za część urlopu** | § 15 ust. 1 pkt 2; art. 182¹d § 2 |
| I4 | **okres, na który ma być udzielony urlop / jego część** | § 15 ust. 1 pkt 3 |
| I5 | **okresy udzielonych urlopów** (macierzyński, na warunkach, uzupełniający, rodzicielski, ojcowski) | zał. 2 pkt 12 |
| I6 | **stawka procentowa wypłaconego zasiłku macierzyńskiego** | zał. 2 pkt 12, zał. 3 pkt 7 |
| I7 | **data złożenia wniosku o zasiłek macierzyński** | zał. 2 pkt 12, zał. 3 pkt 7 |
| I8 | **czy ubezpieczony zamierza korzystać z pełnego wymiaru urlopu macierzyńskiego / na warunkach i urlopu rodzicielskiego oraz czy co najmniej 1 dzień urlopu rodzicielskiego przypadnie w pierwszym roku życia dziecka** | zał. 6 pkt 15 — **decyduje o 81,5%** |
| I9 | **„Za życiem”: oświadczenie, czy dziecko posiada zaświadczenie z art. 4 ust. 3** | zał. 6 pkt 9; art. 61b ust. 4a u.z. |
| I10 | **informacja o korzystaniu przez drugiego rodzica z zasiłku macierzyńskiego za okres urlopu rodzicielskiego lub uzupełniającego** | zał. 6 pkt 14 |
| I11 | **część urlopu rodzicielskiego lub urlopu ojcowskiego** (która z kolei) | zał. 6 pkt 16 |
| I12 | **wymiar czasu pracy przy łączeniu z urlopem rodzicielskim** (≤ ½ etatu) | § 16 pkt 2 |
| I13 | **okres, w którym pracownik zamierza łączyć urlop z pracą** | § 16 pkt 3 |
| I14 | **zamiar łączenia części urlopu powstałej z proporcjonalnego wydłużenia z pracą** + wymiar / brak zamiaru | § 16 pkt 4 |
| I15 | **data, od której ojciec / inny członek będzie korzystał z uprawnień** | § 18 ust. 1 pkt 1, § 21, § 23 |
| I16 | **termin powrotu do pracy** (matka rezygnująca) | § 3 ust. 1 pkt 2, § 4 ust. 1 pkt 2 |

### 1.10 `[P-J]` Oświadczenia — **najważniejsza grupa do zaprojektowania w narzędziu**
| Id | Oświadczenie | Podstawa |
|---|---|---|
| J1 | **o braku zamiaru korzystania przez drugiego rodzica** z uzupełniającego urlopu macierzyńskiego / zasiłku za ten okres | § 26 pkt 1; § 14 ust. 2 pkt 2 rozporz. o wnioskach |
| J2 | **o braku zamiaru korzystania przez drugiego rodzica z urlopu rodzicielskiego** w okresie wskazanym we wniosku **albo o okresie, w którym drugi rodzic zamierza korzystać** | § 29 pkt 1, § 30 ust. 1 pkt 1; § 15 ust. 2 pkt 2 |
| J3 | **o dacie przyjęcia dziecka na wychowanie** | § 16 ust. 1 pkt 1, § 27 ust. 1 pkt 3, § 30 ust. 1 pkt 7; § 18 ust. 2 pkt 1 |
| J4 | **o dacie porzucenia dziecka przez matkę** | § 20 ust. 3; § 9 ust. 1 pkt 2 rozporz. o wnioskach |
| J5 | **o dniu zgonu matki dziecka** | § 20 ust. 4; § 8 ust. 1 pkt 2, § 10 ust. 1 pkt 2 |
| J6 | **o śmierci matki / porzuceniu przez matkę** (matka nieubezpieczona) | § 20 ust. 4 |
| J7 | **o dacie, od której rezygnuje z pobierania zasiłku macierzyńskiego** | § 18 ust. 1 pkt 1, pkt 3; § 21 pkt 1, pkt 3 |
| J8 | **że matka dziecka nie posiada tytułu do ubezpieczenia chorobowego** (+ jej PESEL) | § 32 ust. 1 pkt 4 |
| J9 | **o dacie podjęcia zatrudnienia przez matkę w wymiarze ≥ ½ etatu** (+ PESEL matki, nazwa i NIP pracodawcy) | § 25 ust. 1 pkt 2 |
| J10 | **o dacie, od której ojciec ma zamiar pobierać zasiłek** (przypadającej w okresie zatrudnienia matki) | § 25 ust. 1 pkt 3 lit. a |
| J11 | **zobowiązanie do poinformowania płatnika o ustaniu zatrudnienia matki** | § 25 ust. 1 pkt 3 lit. b |
| J12 | **że nie zapewniono ubezpieczonej innego zatrudnienia** | § 17 pkt 3 |
| J13 | **o dacie umieszczenia dziecka w pieczy zastępczej / zakładzie opiekuńczo-leczniczym / pielęgnacyjno-opiekuńczym / rehabilitacji leczniczej** | § 19 |
| J14 | **czy zasiłek macierzyński za okres urlopu ojcowskiego został pobrany z innego tytułu** | § 33 ust. 1 pkt 2; § 17 ust. 2 pkt 3 rozporz. o wnioskach |
| J15 | **czy zasiłek macierzyński przysługuje z więcej niż jednego tytułu** + **który płatnik ma wypłacić podwyższenie** + że nie jest pobierane z innego tytułu | § 28 pkt 1 |
| J16 | **o posiadaniu przez dziecko zaświadczenia „Za życiem”** | art. 61b ust. 4a u.z. |
| J17 | **o okresie urlopu macierzyńskiego / pobierania zasiłku wykorzystanego przed porodem** | § 5 ust. 1 pkt 3, § 6 ust. 1 pkt 3, § 9 ust. 1 pkt 3 |
| J18 | **zobowiązanie do poinformowania pracodawcy o dacie opuszczenia placówki przez matkę** | § 6 ust. 1 pkt 4, § 7 ust. 1 pkt 4 |
| J19 | **o okresie, w którym pracownik dotychczas korzystał z obniżonego wymiaru czasu pracy** | § 20 ust. 2 pkt 2 rozporz. o wnioskach |
| J20 | **o braku zamiaru korzystania przez drugiego rodzica z urlopu wychowawczego / o okresie** | § 19 ust. 2 pkt 1 rozporz. o wnioskach |
| J21 | **o braku domownika mogącego zapewnić opiekę** | zał. 7 pkt 5 |
| J22 | **czy w danym roku wypłacono zasiłek opiekuńczy** (wnioskodawcy / matce-ojcu dziecka / małżonkowi / innemu członkowi rodziny) + liczba dni + płatnik + PESEL osób | zał. 7 pkt 6 lit. a–c |
| J23 | **czy pozostaje we wspólnym gospodarstwie domowym** z dzieckiem powyżej 14 lat lub chorym członkiem rodziny | zał. 7 pkt 6 lit. d |
| J24 | **o chorobie niani / dziennego opiekuna** | § 36 ust. 1 pkt 4 |
| J25 | **o pobieraniu przez matkę zasiłku macierzyńskiego w okresie 8 tygodni po porodzie** | § 40 pkt 2 |
| J26 | **o przerwaniu działalności zarobkowej przez ojca dziecka** | § 3 ust. 2 rozporz. o wnioskach |
| J27 | **o okresie i wymiarze pracy wykonywanej w czasie urlopu rodzicielskiego + czy i w jakim wymiarze będzie pracował w wydłużonym urlopie** | § 29 pkt 2, § 30 ust. 1 pkt 3, § 32 ust. 1 pkt 2 |
| J28 | **o zobowiązaniu do informowania o zmianach** w danych (emerytura/renta, zasiłki, działalność) | zał. 5 cz. I pkt 6 |
| J29 | **o wystąpieniu o ustalenie uprawnień / prawie do emerytury lub renty** | zał. 4 pkt 2, zał. 5 cz. I pkt 3 |
| J30 | **o prawie do podwyższenia zasiłku i braku pobierania go z innego tytułu** | § 28 pkt 1 |

### 1.11 `[P-K]` Dane płatności i pouczenia
| Id | Pole |
|---|---|
| K1 | numer rachunku bankowego (Krajowy / zagraniczny) do wypłaty (A5) |
| K2 | odbiór przez osobę upoważnioną / do rąk osoby wypłacającej wynagrodzenie (art. 65 u.z.) |
| K3 | wypłata osobie mieszkającej za granicą — bezgotówkowo na rachunek/instrument płatniczy w kraju (art. 65 ust. 3) |
| K4 | pouczenie o zasiłku (element formularza — zał. 1 pkt 10, zał. 6 pkt 19, zał. 7 pkt 9, zał. 2 pkt 20, zał. 3 pkt 17) |

---

## § 2. WNIOSKI ZASIŁKOWE — REJESTR WARIANTÓW

### § 2.1 W34/W35/W36 — **Zasiłek chorobowy i wynagrodzenie chorobowe w ciąży**

| | |
|---|---|
| **Kto składa** | matka (ubezpieczona) |
| **Do kogo** | zlecenie wypłaty: **płatnik składek** (jeśli zgłasza > 20 ubezpieczonych) albo **ZUS** (jeśli ≤ 20, albo prowadzi działalność / współpracuje / jest duchownym / marynarzem) |
| **Formularz** | wniosek zawierający dane z **załącznika nr 1** do rozporządzenia (Dz.U. 2026 poz. 1316); **ZAS-53** dla nie-pracowników; **ZAS-12** na dalszy okres; **e-ZLA** jako podstawa |
| **Pola `[P]`** | **A1–A6**, **F1–F8**, **G1** (jeśli znana), **K1–K2** |
| **Pola `[PL]`** | **B1–B6**, **E3–E9**, **E18**, **F5–F7**, **I5–I7** |
| **Pola `[ZUS]`** | E2, E19 (zadłużenie), K4 |
| **Dokumenty `[D]`** | **e-ZLA z kodem „B”**; wydruk e-ZLA lub e-ZLA w formie papierowej (art. 55a ust. 6–7), gdy brak profilu informacyjnego płatnika; **zaświadczenie płatnika składek** Z-3 / Z-3a / Z-3b |
| **Dokumenty przy wypadku** | **karta wypadku w drodze do pracy lub z pracy** (art. 10 ust. 1 rozporządzenia) albo **zaświadczenie lekarskie na zwykłym druku** o związku z wcześniejszym wypadkiem (art. 10 ust. 2) |

**Warianty szczególne:**
| Wariant | Co dochodzi |
|---|---|
| **W36a** — reset okresu zasiłkowego (kod „B” po zwolnieniu bez kodu B) | nic dodatkowo — **kod „B” na e-ZLA** i oświadczenie o wcześniejszych zwolnieniach |
| **W36b** — brak kodu „B” na życzenie (art. 57 ust. 2) | **pisemny wniosek ubezpieczonego** o nieumieszczanie kodu „B” i „D” |
| **W36c** — zasiłek po ustaniu ubezpieczenia (art. 7) | **oświadczenie wg załącznika nr 4** — pola **A1–A4, E11–E17, F4, K1, K2** |
| **W36d** — zasiłek chorobowy za niezdolność orzeczoną za granicą | **zaświadczenie lekarskie zagraniczne przetłumaczone** (§ 7) — nazwa zakładu / imię i nazwisko lekarza, data wystawienia, podpis, początek i koniec niezdolności |
| **W36e** — żołnierz zwolniony z czynnej służby | oświadczenie wg **zał. 4** + **dokument potwierdzający zwolnienie z czynnej służby wojskowej** (§ 5) |

**Kiedy wnioskodawcą jest nie-pracownik** (zleceniobiorca u małego płatnika, przedsiębiorca, osoba współpracująca):
pola **[P]** = A1–A6, E1, E7, F1–F8, K1; pola **[PL]** = B1–B3, E2, E5, E19, F6–F7.
**Dokument**: **zaświadczenie płatnika składek Z-3b** (przedsiębiorca — składane do ZUS, najwygodniej przez eZUS) albo **Z-3a**.

---

### § 2.2 W37 — **Świadczenie rehabilitacyjne**

| | |
|---|---|
| **Kto składa** | matka albo ojciec (ubezpieczony), który wyczerpał zasiłek chorobowy |
| **Do kogo** | **ZUS** (zawsze — orzeka lekarz orzecznik) |
| **Formularz** | **wniosek o świadczenie rehabilitacyjne** — dane wg **załącznika nr 5** (części I–IV) |
| **Część I `[P]`** | A1–A4, **przyczyna ubiegania się** (ogólny stan zdrowia / wypadek przy pracy / choroba zawodowa), **E11** (emerytura/renta + organ + data), **E12** (zasiłek dla bezrobotnych / przedemerytalny / kompensacyjny / urlop dla poratowania zdrowia + data), **F8** (marynarz), **J28** (zobowiązanie do informowania o zmianach), **K1** |
| **Część II `[PL]`** | B1–B3, B7, E3, **symbol PKD**, **kod zawodu**, **E2** (okres ubezpieczenia) |
| **Część III `[PL]`** | F1 (okres niezdolności, za który wypłacono wynagrodzenie/zasiłek), **F9** (data zakończenia okresu zasiłkowego + 182/270), B3, B7 |
| **Część IV** | pouczenie |
| **Dokumenty `[D]`** | 1. **zaświadczenie o stanie zdrowia** (od lekarza prowadzącego, **nie wcześniej niż miesiąc** przed złożeniem wniosku); 2. **wywiad zawodowy z miejsca pracy** — chyba że niezdolność powstała po ustaniu ubezpieczenia, prowadzi działalność, współpracuje, duchowny, marynarz; 3. **protokół ustalenia okoliczności i przyczyn wypadku przy pracy** albo **karta wypadku** (wypadek przy pracy); 4. **decyzja o stwierdzeniu choroby zawodowej** (choroba zawodowa) |
| **Warunki dodatkowe** | pkt 3–5 nie są wymagane na **kolejny okres**; po ustaniu ubezpieczenia **dodatkowo oświadczenie z § 4** (zał. 4) |
| **Wypłata** | **90%** podstawy za pierwsze 3 mies., **75%** za pozostały, **100%** w ciąży |

---

### § 2.3 W38 — **Zasiłek w wysokości zasiłku macierzyńskiego** (upadłość / likwidacja / śmierć pracodawcy)

| | |
|---|---|
| **Kto składa** | matka (pracownica) |
| **Do kogo** | **ZUS** |
| **Formularz** | wniosek z danymi z **załącznika nr 6** + **dokumenty z § 17 rozporządzenia** |
| **Pola `[P]`** | A1–A6, G1, G2, **I1** (rodzaj świadczenia i okres), **J12** (oświadczenie, że nie zapewniono innego zatrudnienia), K1, K2 |
| **Pola `[PL]/[ZUS]`** | B1–B3 (dane byłego pracodawcy), E2, E4, E7 |
| **Dokumenty `[D]`** | 1. **zaświadczenie lekarskie na zwykłym druku stwierdzające stan ciąży w okresie zatrudnienia**; 2. **świadectwo pracy** lub **inny dokument potwierdzający wygaśnięcie stosunku pracy z powodu śmierci pracodawcy** albo **rozwiązanie z powodu ogłoszenia upadłości lub likwidacji**; 3. **zaświadczenie lekarza ze specjalizacją położnictwo i ginekologia / lek. w trakcie specjalizacji / położnej o martwym urodzeniu** — tylko gdy **nie sporządzono aktu urodzenia** |
| **Wariant alternatywny (art. 30 ust. 1 pkt 2)** | zamiast pkt 2: **prawomocne orzeczenie sądu o rozwiązaniu stosunku pracy z naruszeniem przepisów prawa** (§ 15 ust. 2 pkt 2) |
| **Okres** | **do dnia porodu**; wysokość **100%** |

---

### § 2.4 W39/W40 — **Zasiłek macierzyński po ustaniu ubezpieczenia w ciąży**

| | |
|---|---|
| **Dokumenty `[D]`** | **§ 15 rozporządzenia**: 1. zaświadczenie lekarskie na zwykłym druku stwierdzające stan ciąży w okresie zatrudnienia; 2. świadectwo pracy **albo** prawomocne orzeczenie sądu o rozwiązaniu umowy z naruszeniem prawa; 3. zaświadczenie o martwym urodzeniu (gdy brak aktu); **plus** § 13 — odpis skrócony aktu urodzenia (albo dane do pozyskania przez ZUS) |
| **Pola `[P]`** | A1–A6, G1–G3, **Akt urodzenia**: dane wg § 13 ust. 3 → **C1–C5** + **A1, A2, A3** (rodzica wnioskującego) |
| **Szczególne** | § 13 ust. 2 — **odpisu skróconego aktu urodzenia NIE przedstawia się, jeżeli płatnikiem zasiłku jest ZUS**; przekazuje się **dane**: imię i nazwisko dziecka, **PESEL dziecka**, data i miejsce urodzenia, imię i nazwisko rodzica + PESEL (albo seria i nr dowodu/paszportu) |
| **§ 13 ust. 4** | jeżeli ZUS **nie może pozyskać** aktu z rejestru stanu cywilnego → **wezwanie** do przedstawienia dokumentu w terminie **nie krótszym niż 14 dni**, z pouczeniem, że nieprzedstawienie → **decyzja o odmowie wszczęcia postępowania** |

---

### § 2.5 W1/W2/W3 — **Zasiłek macierzyński za okres urlopu macierzyńskiego (matka)**

**Wariant A: matka jest pracownikiem**
| | |
|---|---|
| **Do kogo** | **pracodawca (płatnik składek)** — wniosek o udzielenie urlopu macierzyńskiego; jeżeli pracodawca jest „małym płatnikiem” → przekazuje do ZUS **Z-3** |
| **Formularz** | wniosek pracowniczy (dowolna forma pisemna/elektroniczna, treść wg § 2 rozporządzenia o wnioskach dla wariantu przed porodem); dla **zasiłku** — dane wg **załącznika nr 6**, gdy płatnikiem zasiłku jest ZUS |
| **Pola `[P]`** | **A1–A6**, **C1–C6**, **G1–G4**, **G7**, **I1**, **I5**, **K1**; przy wariancie przed porodem: **G3** (data, od której ma być udzielona część urlopu) |
| **Pola `[PL]`** | **B1–B7**, **E3–E9**, **F6–F7**, **I5–I7** |
| **Dokumenty `[D]`** | **odpis skrócony aktu urodzenia dziecka** (albo zgoda, by ZUS sam uzyskał odpis z USC); **kopię zaświadczenia lekarskiego na zwykłym druku o przewidywanej dacie porodu** — dla części przed porodem |
| **Wariant przed porodem** | **wniosek 14 dni przed**; treść wg **§ 2 rozporządzenia o wnioskach**: (1) imię i nazwisko pracownicy, (2) data, od której ma być udzielona część urlopu; **załącznik**: kopia zaświadczenia lekarskiego o PDP |

**Wariant B: matka nie jest pracownikiem** (zleceniobiorczyni, przedsiębiorczyni, osoba współpracująca)
| | |
|---|---|
| **Do kogo** | **ZUS** |
| **Formularz** | **ZAM** (od 24.10.2026 jedyny formularz macierzyński; wcześniej ZAM/ZUR/ZAO) albo **Z-3b** dla przedsiębiorcy |
| **Pola `[P]`** | A1–A6, C1–C6, G1–G4, G7, **I1**, **I5**, **K1**; działalność: **E1** (art. 6 ust. 1 pkt 5 u.s.u.s.), **E19** |
| **Pola `[PL]`** | B1–B4, E2, E7 |

**Wariant C: urodzenie za granicą** (§ 14)
Dodatkowo: **G7** + **D**:
- **zaświadczenie zagranicznego zakładu leczniczego lub zagranicznego lekarza** o przewidywanej dacie porodu (§ 7 ust. 1 pkt 1) — za okres przed porodem;
- **odpis skrócony aktu urodzenia** albo **zagraniczny dokument potwierdzający urodzenie** wydany przez uprawniony organ rejestracji w danym kraju;
- gdy brak aktu/dokumentu: **zaświadczenie zagranicznego zakładu/lekarza ze specjalizacją położnictwo i ginekologia / lek. w trakcie specjalizacji / zagranicznej położnej** o martwym urodzeniu;
- **tłumaczenie na język polski** — **NIE** dotyczy dokumentów z **UE, EFTA/EOG, Szwajcarii, Zjednoczonego Królestwa** oraz państw stron umów międzynarodowych w zakresie zabezpieczenia społecznego, wydanych w języku urzędowym (§ 8, § 21 rozporz. o wnioskach).

---

### § 2.6 W4/W27 — **Uzupełniający urlop macierzyński**

| | |
|---|---|
| **Kto składa** | **matka albo ojciec** (jedno z rodziców — urlop jednorazowy) |
| **Do kogo** | pracodawca (wniosek o urlop) + płatnik zasiłku (płatnik lub ZUS) |
| **Termin** | **co najmniej 21 dni** przed zakończeniem urlopu macierzyńskiego |
| **Formularz** | pracowniczy — treść wg **§ 14 rozporządzenia o wnioskach**; zasiłkowy — **zał. 6** + **§ 26–27 rozporządzenia zasiłkowego** |
| **Pola `[P]`** | **A1**, **A2**, **H6** (termin zakończenia urlopu macierzyńskiego), **I4** (okres, na który ma być udzielony urlop), **H1–H5**, **D1–D5** (dane drugiego rodzica), **J1** (oświadczenie o braku zamiaru drugiego rodzica), **C1–C6**, **G4** |
| **Pola `[PL]`** | B1–B7; **zaświadczenie pracodawcy o okresie udzielonego uzupełniającego urlopu macierzyńskiego** (§ 26 pkt 2) — gdy zasiłek wypłaca ZUS |
| **Dokumenty `[D]`** | 1. **zaświadczenie wydane przez szpital** (art. 180² § 5 k.p.): **okres pobytu dziecka w szpitalu** oraz **tydzień ciąży, w którym urodziło się dziecko / masa urodzeniowa** (jedna z trzech sytuacji: < 28 tyg. lub ≤ 1000 g / 28–37 tyg. i > 1000 g / po 37 tyg.); 2. **oświadczenie drugiego rodzica o braku zamiaru korzystania** z uzupełniającego urlopu macierzyńskiego albo zasiłku za ten okres; 3. **odpis skrócony aktu urodzenia** (jeśli zasiłek wypłaca płatnik składek); 4. przy adopcji — dodatkowo dokumenty z § 16 |
| **Gdy poprzedni zasiłek pobierał drugi rodzic** (§ 27) | + **zaświadczenie płatnika zasiłku o okresie, za który zasiłek wypłacono drugiemu rodzicowi**, z **imieniem, nazwiskiem i PESEL** drugiego rodzica |
| **Gdy ubezpieczony nie jest pracownikiem** (§ 26 pkt 3) | **wniosek złożony płatnikowi zasiłku przed zakończeniem pobierania zasiłku** za urlop macierzyński, zawierający **termin zakończenia** pobierania zasiłku |

**Jeden z najczęstszych błędów:** brak **terminu zakończenia urlopu macierzyńskiego** we wniosku (art. 180² § 6 k.p.).
Wniosek bez tego pola jest wadliwy.

---

### § 2.7 W5 — **Rezygnacja matki i przejęcie przez ojca (po 14 tyg.)**

**Krok 1 — wniosek matki (rezygnacja)**
| | |
|---|---|
| **Formularz** | **§ 3 rozporządzenia o wnioskach** (pracownica) / **§ 18 rozporządzenia zasiłkowego** (ubezpieczona) |
| **Pola `[P]`** | **A1**, **A2** (matki), **I16** (**termin powrotu do pracy**), **J7** (data, od której rezygnuje z pobierania zasiłku) |
| **Termin** | **nie krócej niż 7 dni** przed przystąpieniem do pracy (art. 180 § 8 k.p.) |
| **Dokumenty `[D]`** | **kopia wniosku ojca o udzielenie pozostałej części urlopu macierzyńskiego** **albo** **kopia oświadczenia ubezpieczonego ojca o przerwaniu działalności zarobkowej** w celu sprawowania opieki na okres odpowiadający pozostałej części urlopu (**J26**) |
| **Dodatkowo** (§ 18 ust. 1 pkt 2) | **zaświadczenie pracodawcy o terminie zaprzestania korzystania z urlopu macierzyńskiego** — dla pracownicy, której zasiłek wypłaca ZUS |

**Krok 2 — wniosek ojca (przejęcie)**
| | |
|---|---|
| **Formularz** | **§ 5 rozporządzenia o wnioskach**; zasiłkowo **§ 20 rozporządzenia zasiłkowego** + **zał. 6** |
| **Termin** | **nie krócej niż 14 dni** przed rozpoczęciem korzystania (art. 180 § 9 k.p.) |
| **Pola `[P]`** | **A1**, **A2** (ojca), **A3**, **A4**, **A5**, **C1–C4** (imiona i daty urodzenia dzieci), **J17** (oświadczenie o okresie urlopu macierzyńskiego / okresie pobierania zasiłku wykorzystanych przed porodem), **I4** (okres, na który ma być udzielona pozostała część) |
| **Pola `[PL]` / `[D]` kluczowe** | **zaświadczenie płatnika zasiłku o okresie przysługującego i wypłaconego matce zasiłku macierzyńskiego oraz stawce procentowej**, zawierające **imię, nazwisko i PESEL matki** (albo seria i numer dowodu osobistego / paszportu) — § 20 ust. 1 pkt 2 |
| **Dokumenty `[D]`** | **odpis skrócony aktu urodzenia dziecka** albo **zagraniczny dokument potwierdzający urodzenie**; **oświadczenie matki o zamiarze rezygnacji** z pozostałej części urlopu albo z pobierania zasiłku za ten okres |
| **Przy adopcji** (§ 5 ust. 4) | + oświadczenie o dacie przyjęcia dziecka (**J3**) i kopia wniosku o przysposobienie z poświadczeniem sądu / zaświadczenie sądu / kopia orzeczenia o umieszczeniu w rodzinie zastępczej / umowa cywilnoprawna ze starostą; + kopia prawomocnej decyzji o odroczeniu obowiązku szkolnego (jeśli dotyczy) |

---

### § 2.8 W6 — **Rezygnacja po 8 tyg. — orzeczenie o niezdolności do samodzielnej egzystencji**

| | |
|---|---|
| **Krok 1 — matka** | **§ 4 rozporządzenia o wnioskach**: A1, A2, **I16** (termin powrotu do pracy) |
| **Dokumenty matki** | 1. **kopia wniosku ojca / innego członka najbliższej rodziny** o udzielenie pozostałej części urlopu **albo** kopia oświadczenia o przerwaniu działalności zarobkowej; 2. **kopia prawomocnego orzeczenia o niezdolności pracownicy do samodzielnej egzystencji** |
| **Krok 2 — ojciec / inny członek** | **§ 5 ust. 3** (odesłanie do § 5): A1, A2, **C1–C4**, **J17**, **I4** |
| **Dokumenty ojca** | odpis skrócony aktu urodzenia; **oświadczenie matki o zamiarze rezygnacji**; **odpis orzeczenia o niezdolności matki do samodzielnej egzystencji** |
| **Zasiłkowo — zaniechanie wypłaty matce** (§ 21) | + oświadczenie o dacie, od której ojciec/inny członek będzie korzystał z uprawnień (**J15**-typ), zaświadczenie pracodawcy o terminie zaprzestania urlopu, wniosek matki z datą rezygnacji, **orzeczenie o niezdolności do samodzielnej egzystencji** |
| **Zasiłkowo — przyznanie ojcu** (§ 22 ust. 1) | dokumenty z **§ 20 ust. 1** (akt urodzenia + zaświadczenie płatnika o zasiłku matki) + **orzeczenie o niezdolności do samodzielnej egzystencji** |

---

### § 2.9 W7/W24 — **Matka w szpitalu — przejęcie czasowe**

| | |
|---|---|
| **Krok 1 — matka (ubezpieczona)** | **§ 7 rozporządzenia o wnioskach**: A1, A2, data, od której przerwała pobieranie zasiłku (odpowiadająca dacie przerwania urlopu), **J18** (zobowiązanie do poinformowania pracodawcy o dacie opuszczenia placówki) |
| **Krok 2 — matka (pracownica)** | **§ 6 rozporządzenia o wnioskach**: A1, A2, data, od której ma być udzielona część urlopu, **J17** (oświadczenie o okresie urlopu przed porodem), **J18** |
| **Dokumenty** | 1. **oświadczenie matki wskazujące datę przerwania** urlopu macierzyńskiego / pobierania zasiłku na okres pobytu w placówce; 2. **zaświadczenie o terminie przyjęcia matki do placówki** (wystawione przez tę placówkę); 3. **odpis skrócony aktu urodzenia** (lub kopia) |
| **Krok 3 — ojciec / inny członek** | **§ 5 ust. 3 / § 6–7**: A1, A2, **I15** (data, od której ma być udzielona część urlopu), **J18** |
| **Zasiłkowo (§ 23)** | 1. **odpis skrócony aktu urodzenia**; 2. **zaświadczenie płatnika zasiłku** o okresie przysługującego i wypłaconego matce zasiłku i stawce % — z PESEL matki; 3. **zaświadczenie o dacie przyjęcia matki do placówki leczniczej**; 4. **zaświadczenie o dacie wypisania matki** z placówki |
| **Przerwanie wypłaty matce (§ 24)** | zaświadczenie o dacie przyjęcia + oświadczenie matki o dacie, od której ojciec korzysta + zaświadczenie pracodawcy o terminie zaprzestania urlopu (macierzyńskiego / na warunkach / uzupełniającego / rodzicielskiego) |
| **Podjęcie wypłaty matce po przerwie (§ 24 ust. 2)** | **zaświadczenie płatnika zasiłku o okresie, za który wypłacono zasiłek ojcu / innemu członkowi** — z jego PESEL |

---

### § 2.10 W8 — **Zgon / porzucenie przez matkę**

| | |
|---|---|
| **Formularz** | **§ 8** (zgon), **§ 9** (porzucenie), **§ 10–11** (matka nieubezpieczona) rozporządzenia o wnioskach |
| **Pola `[P]` (ojciec / inny członek)** | A1, A2, **J5** (oświadczenie o dacie zgonu matki) **albo J4** (oświadczenie o dacie porzucenia), **J17** (okres urlopu / zasiłku wykorzystanego przed porodem), **I15** (data, od której ma być udzielona część) |
| **Dokumenty `[D]`** | **odpis skrócony aktu urodzenia** dziecka (albo kopia) |
| **Zasiłkowo (§ 20 ust. 3)** | dokumenty z § 20 ust. 1 (akt urodzenia + **zaświadczenie płatnika o zasiłku matki ze stawką % i PESEL matki**) + **oświadczenie o śmierci matki albo o porzuceniu przez nią dziecka** |
| **Wariant matka nieubezpieczona (§ 20 ust. 4)** | **odpis skrócony aktu urodzenia** + **oświadczenie o dniu zgonu matki / porzuceniu przez nią dziecka** (bez zaświadczenia o zasiłku matki) |
| **Uwaga** | przy porzuceniu obowiązuje próg **8 tygodni** zasiłku/urlopu wykorzystanego przez matkę po porodzie |

---

### § 2.11 W9 — **Matka nieubezpieczona — prawo ojca / innego członka**

| | |
|---|---|
| **Formularz** | **§ 12** (matka z orzeczeniem o niezdolności do samodzielnej egzystencji), **§ 13** (matka podjęła zatrudnienie ≥ ½ etatu) rozporządzenia o wnioskach |
| **Wariant A — matka nieubezpieczona, orzeczenie** | **Pola `[P]`**: A1, A2, **I15** (data, od której ma być udzielona część urlopu). **Dokumenty**: **odpis skrócony aktu urodzenia**; **kopia prawomocnego orzeczenia o niezdolności matki do samodzielnej egzystencji** |
| **Wariant B — matka podjęła zatrudnienie ≥ ½ etatu** | **Pola `[P]`**: A1, A2, **I15** (data przypadająca **w okresie trwania zatrudnienia matki**), **J11** (zobowiązanie do poinformowania pracodawcy o ustaniu zatrudnienia matki). **Dokumenty**: odpis skrócony aktu urodzenia / dokumenty z § 16; **oświadczenie matki o dacie podjęcia zatrudnienia w wymiarze ≥ ½ etatu** — z jej **PESEL**, **nazwą i NIP pracodawcy** (§ 25 ust. 1 pkt 2) |
| **Zasiłkowo (§ 22 ust. 2)** | dokumenty z **§ 20 ust. 1 pkt 1** (akt urodzenia) + **orzeczenie o niezdolności matki do samodzielnej egzystencji** |
| **Zasiłkowo (§ 25)** | odpis aktu urodzenia (lub dokumenty z § 16) + oświadczenie matki o dacie zatrudnienia + **oświadczenie ojca wskazujące datę pobierania zasiłku** i **zobowiązujące do informowania o ustaniu zatrudnienia matki** |
| **Zbieg z § 32 (urlop rodzicielski ojca przy braku tytułu matki)** | + **J8** oświadczenie, że matka nie posiada tytułu do ubezpieczenia chorobowego, z jej **PESEL** |

---

### § 2.12 W10 — **Martwe urodzenie / zgon dziecka**

| | |
|---|---|
| **Do kogo** | płatnik składek (pracownik) albo **ZUS** |
| **Formularz** | **ZAM** (jeśli ZUS) / wniosek pracowniczy + **Z-3**; dane wg **zał. 6** |
| **Pola `[P]`** | A1–A6, **C1–C5** (jeśli nadano dane), **C6** (liczba dzieci), **C7** (**liczba dzieci pozostałych przy życiu**), **G2** (data porodu), **G5** (martwe urodzenie — tak/nie), **G6** (data zgonu dziecka), **I1**, **K1** |
| **Pola `[PL]`** | B1–B7, I5–I7 |
| **Dokumenty `[D]`** | **A. Gdy jest akt urodzenia:** **odpis skrócony aktu urodzenia dziecka** (albo kopia potwierdzona za zgodność z oryginałem przez płatnika składek albo ZUS) — **za okres od dnia porodu** |
| | **B. Gdy dziecko urodziło się martwe:** odpis skrócony aktu urodzenia **z adnotacją, że dziecko urodziło się martwe** |
| | **C. Gdy NIE sporządzono aktu urodzenia:** **zaświadczenie o martwym urodzeniu** wydane na podstawie dokumentacji medycznej przez: **lekarza ze specjalizacją w dziedzinie położnictwa i ginekologii**, **lekarza w trakcie odbywania specjalizacji w tej dziedzinie** albo **położną** |
| | **D. Kopie** dokumentów potwierdzone za zgodność z oryginałem przez **ubezpieczonego, płatnika składek albo ZUS** |
| **Uproszczenie** | na wniosek ubezpieczonego **oddział ZUS sam może uzyskać odpis skrócony aktu urodzenia** z rejestru stanu cywilnego — pole **[P]**: „☐ zgłaszam wniosek o pozyskanie odpisu przez ZUS” |
| **Wymiar zasiłku** | 8 tygodni po porodzie (min. 7 dni od zgonu) / 7 dni od zgonu po 8. tygodniu życia / stosownie do liczby dzieci pozostałych przy życiu |
| **Osobny wniosek — zasiłek pogrzebowy** | patrz § 2.19 |

---

### § 2.13 W11 — **Urlop wychowawczy**

| | |
|---|---|
| **Do kogo** | pracodawca |
| **Formularz** | **§ 19 rozporządzenia o wnioskach** |
| **Pola `[P]`** | A1, A2, **imię i nazwisko dziecka** (C1, C2 — dla każdego dziecka osobno), **I4** (okres, na który ma być udzielony urlop), **okres dotychczas wykorzystany na dane dziecko**, **liczba części dotychczas wykorzystanych na dane dziecko** |
| **Dokumenty `[D]`** | 1. **oświadczenie o braku zamiaru korzystania przez drugiego rodzica/opiekuna** z urlopu wychowawczego w tym okresie **albo o okresie, w którym zamierza korzystać** (**J20**) — **nie jest wymagane**, gdy drugiemu rodzicowi ograniczono/pozbawiono władzę rodzicielską, ograniczono opiekę lub zwolniono z opieki; 2. **kopia prawomocnego orzeczenia** o ograniczeniu/pozbawieniu władzy rodzicielskiej / ograniczeniu opieki / zwolnieniu z opieki **albo** dokumenty/oświadczenie o niedających się usunąć przeszkodach do uzyskania informacji od drugiego rodzica; 3. **kopia prawomocnego orzeczenia o niepełnosprawności lub stopniu niepełnosprawności dziecka** — gdy wniosek o 36 miesięcy wg art. 186 § 3 k.p. |
| **Gdy wniosek o 36 miesięcy / uzupełnienie do 36 miesięcy** (§ 19 ust. 2 pkt 4) | jedno z: a) **odpis skrócony aktu zgonu drugiego rodzica**; b) **kopia prawomocnego orzeczenia o ubezwłasnowolnieniu** drugiego rodzica **albo** dokument potwierdzający niepełnoletność drugiego rodzica (gdy rodzice nie są małżeństwem), **albo** kopia prawomocnego orzeczenia o ustaleniu ojcostwa, w którym sąd **nie przyznał ojcu władzy rodzicielskiej**; c) **kopia prawomocnego orzeczenia o pozbawieniu/ograniczeniu/zawieszeniu władzy rodzicielskiej**; d) **kopia prawomocnego orzeczenia o przyznaniu opieki jednemu opiekunowi** albo o zwolnieniu drugiego opiekuna z opieki |
| **Zasiłek** | **brak zasiłku macierzyńskiego za czas urlopu wychowawczego**; składki emerytalno-rentowe i zdrowotne finansuje **budżet państwa** (przy spełnieniu warunków) |

**Wariant: obniżenie wymiaru czasu pracy** — **§ 20 rozporządzenia o wnioskach**:
pola: A1, A2, **imię i nazwisko dziecka**, **okres**, przez który pracownik zamierza pracować w obniżonym wymiarze,
**wymiar czasu pracy**; dokumenty: **odpis skrócony aktu urodzenia** + **oświadczenie o okresie, w którym dotychczas
korzystał z obniżonego wymiaru** (J19).

---

### § 2.14 W12 — **Łączenie urlopu rodzicielskiego z pracą**

| | |
|---|---|
| **Formularz** | **§ 16 rozporządzenia o wnioskach** |
| **Pola `[P]`** | A1, A2, **I12** (określenie wymiaru czasu pracy — max ½ etatu), **I13** (okres łączenia), **I14** (oświadczenie o zamiarze łączenia części urlopu powstałej z wydłużenia z pracą + wymiar **albo** brak zamiaru) |
| **Termin** | **21 dni** przed rozpoczęciem wykonywania pracy |
| **Zasiłkowo (§ 29 pkt 2, § 30 ust. 1 pkt 3, § 32 ust. 1 pkt 2)** | **zaświadczenie pracodawcy o okresie i wymiarze czasu pracy wykonywanej w czasie urlopu rodzicielskiego**, zawierające informację, **czy i w jakim wymiarze** pracownik będzie pracował w **urlopie wydłużonym zgodnie z art. 182¹f § 3–7 k.p.** |
| **Wpływ na zasiłek** | **obniżenie proporcjonalne do wymiaru czasu pracy** (art. 31 ust. 4a u.z.) |
| **Limity** | 82/86 tyg.; z „Za życiem” **130/134 tyg.** |

---

### § 2.15 W21 — **Urlop ojcowski**

| | |
|---|---|
| **Kto składa** | **ojciec** |
| **Do kogo** | pracodawca (wniosek o urlop) + płatnik zasiłku (**ZAM** gdy ZUS) |
| **Formularz** | **§ 17 rozporządzenia o wnioskach**; zasiłkowo **§ 33 rozporządzenia zasiłkowego** + **zał. 6** |
| **Termin wniosku** | **nie krócej niż 7 dni** przed rozpoczęciem korzystania z urlopu |
| **Pola `[P]`** | **A1**, **A2**, **I4** (**okres, na który ma być udzielony urlop ojcowski albo jego część**), **J14** (**oświadczenie, czy zasiłek macierzyński za okres urlopu ojcowskiego został pobrany z innego tytułu**), **I11** (część urlopu — 1. lub 2.), **K1** |
| **Dokumenty `[D]`** | 1. **odpis skrócony aktu urodzenia dziecka** (albo zagraniczny dokument potwierdzający urodzenie) — lub jego kopie; 2. **kopia prawomocnego postanowienia sądu o przysposobieniu dziecka** — gdy urlop na dziecko **przysposobione**; 3. **oświadczenie pracownika – ojca, czy korzystał z urlopu ojcowskiego albo jego części** (J14) |
| **Zasiłkowo — gdy ojciec nie jest pracownikiem** (§ 33 ust. 1 pkt 3) | **wniosek o wypłatę zasiłku** złożony **przed terminem rozpoczęcia korzystania**, zawierający **datę, od której ojciec zamierza korzystać** |
| **Warunki** | dziecko do **12. miesiąca życia** albo do **12 miesięcy od uprawomocnienia przysposobienia** i **nie później niż do 14. r.ż.**; **2 tyg.**, jednorazowo albo w **2 częściach ≥ 1 tydzień** |

---

### § 2.16 W25/W26 — **Urlop rodzicielski (matka i ojciec)**

| | |
|---|---|
| **Do kogo** | pracodawca (wniosek o urlop) + płatnik zasiłku (**ZAM** gdy ZUS) |
| **Formularz** | **§ 15 rozporządzenia o wnioskach**; zasiłkowo **§ 29–30 rozporządzenia zasiłkowego** + **zał. 6** |
| **Termin wniosku** | **nie krócej niż 21 dni** przed rozpoczęciem korzystania (art. 182¹d § 1) |
| **Pola `[P]`** | **A1**, **A2**, **I2** (okres dotychczas wykorzystanego urlopu rodzicielskiego / zasiłku za ten okres), **I3** (liczba wykorzystanych części / liczba wniosków o zasiłek), **I4** (okres, na który ma być udzielony urlop), **I8** (czy korzysta z pełnego wymiaru + czy co najmniej 1 dzień przypada w 1. roku życia dziecka), **J2** (oświadczenie drugiego rodzica), **K1** |
| **Dokumenty `[D]`** | 1. **odpis skrócony aktu urodzenia dziecka** (albo zagraniczny dokument) lub kopie; 2. **oświadczenie o braku zamiaru korzystania przez drugiego rodzica** z urlopu rodzicielskiego / zasiłku za ten okres **albo o okresie, w którym drugi rodzic zamierza korzystać** (**J2**); 3. **kopia zaświadczenia „Za życiem”** — gdy wniosek dotyczy wymiaru z art. 182¹a § 2 (65/67 tyg.) (**I9**) |
| **Gdy poprzedni zasiłek pobierał ten sam ubezpieczony** (§ 29) | 1. **oświadczenie o braku zamiaru korzystania przez drugiego rodzica** albo o okresie, w którym zamierza korzystać; 2. **zaświadczenie pracodawcy o okresie udzielonego urlopu rodzicielskiego** oraz **zaświadczenie pracodawcy o okresie i wymiarze czasu pracy wykonywanej w czasie urlopu** (J27); 3. **wniosek złożony płatnikowi zasiłku przed terminem rozpoczęcia korzystania** — gdy ubezpieczony **nie jest pracownikiem**; 4. **oświadczenie zawierające NIP i nazwy płatników zasiłku** oraz informacje o okresie wypłaty, **liczbie części** i **stawce procentowej** |
| **Gdy poprzedni zasiłek pobierał drugi rodzic** (§ 30) | wszystkie z § 29 **oraz**: **zaświadczenie płatnika zasiłku o okresie wypłaty drugiemu rodzicowi, liczbie części urlopu rodzicielskiego i stawce %**, z **imieniem, nazwiskiem i PESEL** drugiego rodzica; **odpis skrócony aktu urodzenia** **albo** **oświadczenie o dacie przyjęcia dziecka na wychowanie + dokumenty adopcyjne/rodzinne**; **kopia prawomocnej decyzji o odroczeniu obowiązku szkolnego** (jeśli dotyczy) |
| **Przy adopcji** (§ 15 ust. 4) | oświadczenie o dacie przyjęcia dziecka (**J3**) + kopia wniosku o przysposobienie z poświadczeniem sądu **albo** zaświadczenie sądu **albo** kopia prawomocnego orzeczenia o umieszczeniu w rodzinie zastępczej **albo** kopia umowy cywilnoprawnej ze starostą; + kopia decyzji o odroczeniu obowiązku szkolnego (jeśli dotyczy) |
| **Ojciec przy braku tytułu matki** (§ 32) | + **J8** (oświadczenie, że matka nie ma tytułu do ubezpieczenia chorobowego, z jej PESEL) |

---

### § 2.17 W28 — **Adopcja i rodzina zastępcza (urlop na warunkach urlopu macierzyńskiego)**

| | |
|---|---|
| **Do kogo** | pracodawca + płatnik zasiłku (**ZAM** gdy ZUS) |
| **Formularz** | **§ 18 rozporządzenia o wnioskach**; zasiłkowo **§ 16 rozporządzenia zasiłkowego** + **zał. 6** |
| **Termin wniosku** | **7 dni** od dnia przyjęcia dziecka na wychowanie; urlop rozpoczyna się w terminie ze wniosku, **nie później niż 21 dni** od przyjęcia |
| **Pola `[P]`** | **A1**, **A2**, **C1, C2, C4** (imię, nazwisko i data urodzenia każdego przyjętego dziecka), **C8** (wiek w chwili przyjęcia), **I4** (okres, na który ma być udzielony urlop), **J3** (oświadczenie o dacie przyjęcia dziecka), **K1** |
| **Dokumenty `[D]` — wniosek o przysposobienie** | 1. **oświadczenie o dacie przyjęcia dziecka**; 2. **kopia wniosku o wszczęcie postępowania w sprawie przysposobienia** zawierającego **datę urodzenia dziecka**, z **poświadczeniem sądu opiekuńczego o dacie wystąpienia do sądu** **albo** **zaświadczenie sądu opiekuńczego o dacie wystąpienia do sądu** zawierające datę urodzenia dziecka |
| **Dokumenty `[D]` — rodzina zastępcza** | 1. **prawomocne albo wydane w trybie zabezpieczenia orzeczenie sądu opiekuńczego o umieszczeniu dziecka w rodzinie zastępczej** **albo** **umowa cywilnoprawna zawarta między rodziną zastępczą a starostą**; 2. **dokument potwierdzający wiek dziecka**; 3. **kopia prawomocnej decyzji o odroczeniu obowiązku szkolnego** — gdy wniosek dotyczy dziecka z odroczeniem |
| **Zasiłkowo — dodatkowo (§ 16)** | **oświadczenie ubezpieczonego o dacie przyjęcia dziecka na wychowanie**; **zaświadczenie sądu opiekuńczego o dacie wystąpienia do sądu** z datą urodzenia dziecka **albo** kopia wniosku z poświadczeniem sądu |
| **Wyłączenie** | **rodzina zastępcza zawodowa** — brak prawa (art. 29 ust. 1 pkt 3 u.z., art. 183 § 1 k.p.) |
| **Minimum** | **9 tygodni** dla pracownika, który przyjął dziecko do 7 lat / do 10 lat (odroczenie) / do 14 lat (przysposobienie) — art. 183 § 3 k.p. |
| **Uzupełniający urlop przy adopcji** | art. 183 § 3¹ k.p. — **jeżeli pobyt dziecka w szpitalu miał miejsce po przyjęciu dziecka na wychowanie** → wniosek **§ 14 ust. 3–4** rozporządzenia o wnioskach (dokumenty j.w.) |

**Etapowość — rodzina zastępcza → przysposobienie (art. 183 § 7–8 k.p.):**
| Id | Pole |
|---|---|
| L1 | okres **wykorzystanego** urlopu na warunkach urlopu macierzyńskiego z tytułu rodziny zastępczej |
| L2 | okres **wykorzystanego** urlopu rodzicielskiego z tytułu rodziny zastępczej |
| L3 | wymiar **wnioskowany** = wymiar z § 1¹/§ 4¹/§ 4²/§ 4⁴/§ 4⁵ **obniżony o L1/L2** |

---

### § 2.18 W41/W42/W43/W44 — **Warianty wysokości zasiłku macierzyńskiego**

**W41 — 81,5% (uśredniony)**
| | |
|---|---|
| **Formularz** | **pisemny wniosek** (art. 30a ust. 1 u.z.) — treść: wniosek o wypłacenie zasiłku za okres urlopu macierzyńskiego **i urlopu rodzicielskiego w pełnym wymiarze**, **z wyłączeniem okresu z art. 182¹a § 4** (9 tyg. drugiego rodzica) |
| **Termin** | **nie później niż 21 dni po porodzie** |
| **Pola `[P]`** | **A1**, **A2**, **A3**, **G2** (data porodu — od niej liczy się 21 dni), **I8** (oświadczenie/deklaracja o pełnym wymiarze), **C6** (liczba dzieci), **I9** („Za życiem” — tak/nie) |
| **Alternatywa** | zamiast wniosku — **deklaracja, że zamierza korzystać z zasiłku w takim wymiarze** przez cały okres |
| **Wariant adopcyjny** (art. 30a ust. 2) | termin **21 dni po przyjęciu dziecka** na wychowanie i wystąpieniu do sądu **albo** po przyjęciu jako rodzina zastępcza |

**W42 — wyrównanie do 100%**
| | |
|---|---|
| **Formularz** | **wniosek ubezpieczonego** (art. 31 ust. 4 u.z.) |
| **Warunek** | **niewykorzystanie ani jednego dnia** zasiłku za urlop rodzicielski **w pierwszym roku życia dziecka** |
| **Pola `[P]`** | A1–A4, **C4** (data urodzenia dziecka), **I2** (oświadczenie o niewykorzystaniu urlopu rodzicielskiego w 1. r.ż.), K1 |

**W43 — 9 tygodni drugiego rodzica (70%)**
| | |
|---|---|
| **Kto** | **drugi rodzic** (najczęściej ojciec) |
| **Pola `[P]`** | A1–A4, **I3**, **I4**, **J2**, **C1–C4** |
| **Zasada** | **zawsze 70%** podstawy (art. 31 ust. 3f u.z.) — nawet w wariancie 81,5% |

**W44 — podwyższenie do świadczenia rodzicielskiego**
| | |
|---|---|
| **Formularz** | **§ 28 rozporządzenia zasiłkowego** |
| **Pola `[P]`** | **J15** (oświadczenie, **czy zasiłek macierzyński przysługuje z więcej niż jednego tytułu**, a jeżeli tak — **który płatnik** ma wypłacić kwotę podwyższenia; potwierdzenie, że podwyższenie **nie jest pobierane z innego tytułu**) |
| **Dokumenty `[D]`** | **zaświadczenia pozostałych płatników zasiłku** za miesiąc, w którym przysługuje podwyższenie (okres przysługującego zasiłku) oraz za miesiące, w których nastąpiła **zmiana wysokości** zasiłku i jego okresu |
| **Proporcjonalność** | za część miesiąca podwyższenie ustala się **proporcjonalnie** (art. 31 ust. 3c u.z.) |
| **Płatnik podwyższenia** | wskazany przez ubezpieczonego; **gdy jednym z płatników jest ZUS — wypłaca ZUS** (art. 62 ust. 6) |

---

### § 2.19 W45 — **Zasiłek pogrzebowy (dziecko martwo urodzone)**

| | |
|---|---|
| **Kto składa** | osoba, która **zorganizowała pogrzeb i pokryła koszty** (matka albo ojciec) |
| **Do kogo** | **ZUS** |
| **Formularz** | **Z-12** (wniosek o zasiłek pogrzebowy) |
| **Termin** | **12 miesięcy od dnia pochówku** |
| **Pola `[P]`** | A1–A4, **dane zmarłego dziecka** (imię, nazwisko, PESEL jeśli nadany, data zgonu), **data pochówku**, **kwota poniesionych kosztów**, **stosunek pokrewieństwa**, **K1** |
| **Dokumenty `[D]`** | 1. **wniosek Z-12**; 2. **rachunki dotyczące poniesionych kosztów pogrzebu** (np. dokumenty z kościoła potwierdzające koszty ceremonii); 3. **gdy nie sporządzono aktu urodzenia dziecka z adnotacją, że urodziło się martwe**: **karta zgonu** (lub kopia) **albo** **zaświadczenie o martwym urodzeniu bez względu na czas trwania ciąży** wydane na podstawie dokumentacji medycznej przez lekarza ze specjalizacją w położnictwie i ginekologii / lekarza w trakcie specjalizacji w tej dziedzinie / **położną** |
| **Kwota** | **7 000 zł** — nawet jeśli koszty były niższe |

---

### § 2.20 W17 — **Zasiłek opiekuńczy**

| | |
|---|---|
| **Kto składa** | matka albo ojciec (tylko jedno za dany okres) |
| **Do kogo** | płatnik składek albo **ZUS** (zgodnie z progiem 20 ubezpieczonych); przedsiębiorcom i osobom współpracującym **zawsze ZUS** |
| **Formularze** | **Z-15A** (opieka nad dzieckiem) / **Z-15B** (inny chory członek rodziny) — u pracodawcy; **wniosek wg załącznika nr 7** (ZUS) |
| **Pola `[P]`** | A1–A6, **F1** (okres), **F2** (seria i numer e-ZLA), **dane dziecka/członka rodziny**: imię, nazwisko, **PESEL** (albo seria i numer dokumentu tożsamości), **stopień pokrewieństwa**, **data urodzenia dziecka**, **J21** (oświadczenie o braku domownika mogącego zapewnić opiekę), **J22** (czy w danym roku wypłacono zasiłek opiekuńczy: wnioskodawcy / matce-ojcu dziecka / małżonkowi / innemu członkowi — liczba dni + nazwa i adres płatnika + PESEL), **J23** (wspólne gospodarstwo domowe), **K1** |
| **Pola dodatkowe** | **czy dziecko ma orzeczenie o znacznym stopniu niepełnosprawności albo orzeczenie o niepełnosprawności łącznie ze wskazaniami** (stała/długotrwała opieka lub pomoc; stały współudział w leczeniu/rehabilitacji/edukacji) → zał. 7 pkt 4 |
| **Dokumenty `[D]`** | 1. **nieprzewidziane zamknięcie żłobka/klubu dziecięcego/przedszkola/szkoły** → **oświadczenie ubezpieczonego**; 2. **konieczność izolacji dziecka** → **decyzja o konieczności izolacji** wydana przez właściwy organ/uprawniony podmiot; 3. **poród lub choroba małżonka / drugiego rodzica stale opiekującego się dzieckiem** albo **pobyt w szpitalu** → **zaświadczenie lekarskie wystawione ubezpieczonemu na zwykłym druku**; 4. **choroba niani (umowa uaktywniająca) lub dziennego opiekuna** → **oświadczenie ubezpieczonego** + **wydruk e-ZLA / e-ZLA na formularzu / zaświadczenie na zwykłym druku stwierdzające niezdolność do pracy niani/opiekuna**; 5. **niepełnosprawność dziecka** → **orzeczenie o znacznym stopniu niepełnosprawności** albo **orzeczenie o niepełnosprawności łącznie ze wskazaniami** (do ukończenia 18 lat) |
| **Zaświadczenie lekarskie (pkt 3) — treść** | imię i nazwisko małżonka / rodzica stale opiekującego się dzieckiem; okres i przyczyna konieczności opieki; nazwisko (i imię, jeśli nadane) dziecka; pieczątka i podpis wystawiającego |
| **Zaświadczenie o niani / dziennym opiekunie — treść** | imię, nazwisko i **PESEL** niani/dziennego opiekuna (albo seria i nr dowodu/paszportu); okres orzeczonej niezdolności; pieczątka i podpis |
| **Wariant art. 32a (§ 40)** | 1. **zaświadczenie o okresie pobytu matki w placówce leczniczej**; 2. **oświadczenie o pobieraniu przez matkę zasiłku macierzyńskiego w okresie 8 tygodni po porodzie**; 3. **orzeczenie o niezdolności matki do samodzielnej egzystencji**; 4. **oświadczenie o porzuceniu dziecka przez matkę z datą porzucenia** |
| **Wariant opieka za granicą** (§ 35) | **zaświadczenie zagranicznego zakładu leczniczego lub lekarza** spełniające warunki § 7 i § 8 |
| **Limity** | 60 / 30 / 14 dni; **łącznie max 60 dni w roku** |
| **Wynagrodzenie** | **brak** — zasiłek 80% podstawy; **brak okresu wyczekiwania** |

---

### § 2.21 W16 — **Zbieg tytułów — wnioski dodatkowe**

| Id | Dokument / pole | Kiedy |
|---|---|---|
| M1 | **Oświadczenie, że zasiłek macierzyński przysługuje z więcej niż jednego tytułu** + wskazanie płatnika wypłacającego podwyższenie | zawsze gdy jest kilka tytułów (art. 62 ust. 4–5 u.z.; § 28) |
| M2 | **Zaświadczenia pozostałych płatników zasiłku** (okres zasiłku, zmiany wysokości) | j.w. |
| M3 | **Zgłoszenie ZUS ZUA do dobrowolnego chorobowego** — ponowne, po zakończeniu pobierania zasiłku macierzyńskiego | przedsiębiorcy i zleceniobiorcy |
| M4 | **Oświadczenie o przerwaniu działalności zarobkowej** | ojciec przejmujący zasiłek, gdy matka nie jest pracownikiem |
| M5 | **Wniosek o ustalenie uprawnień do zasiłku** (art. 63 u.z.) | gdy ubezpieczony uważa, że uprawnienia zostały naruszone |

---

### § 2.22 W15 — **Dokumenty zagraniczne — zasady wspólne**

| Id | Zasada | Podstawa |
|---|---|---|
| N1 | **tłumaczenie na język polski** dokumentów zagranicznych | § 7 ust. 1, § 21 rozporz. o wnioskach |
| N2 | **wyjątek od tłumaczenia**: dokumenty z **UE, EFTA/EOG, Szwajcarii, Zjednoczonego Królestwa** oraz państw stron umów międzynarodowych w zakresie zabezpieczenia społecznego, wydane w języku urzędowym | § 8 rozporz. zasiłkowego; § 21 ust. 2 rozporz. o wnioskach |
| N3 | **zagraniczne zaświadczenie lekarskie** musi zawierać: **nazwę zagranicznego zakładu leczniczego lub imię i nazwisko zagranicznego lekarza**, **datę wystawienia i podpis**, **początkową i końcową datę niezdolności** | § 7 ust. 1 |
| N4 | **podpis elektroniczny / inny środek uwierzytelnienia** wystarcza, jeżeli zapewnia identyfikację wystawcy, integralność treści i weryfikację autentyczności | § 7 ust. 2 |
| N5 | **zagraniczny akt małżeństwa / akt zgonu** wydany przez uprawniony organ rejestracji | § 9 |
| N6 | **dokumenty od zagranicznej instytucji ubezpieczeniowej** — elektroniczna skrzynka podawcza ZUS lub adres do doręczeń elektronicznych | § 41 |

---

### § 2.23 W16b — **Osoby prowadzące pozarolniczą działalność — pakiet „przedsiębiorca”**

| Id | Wymagane | Uwagi |
|---|---|---|
| O1 | **E19 — stan zadłużenia** na dzień powstania prawa do świadczenia | **próg 1% minimalnego wynagrodzenia** (2026: **48,06 zł**); przekroczenie → **brak prawa** do zasiłku chorobowego, rehabilitacyjnego, **macierzyńskiego** i opiekuńczego |
| O2 | **E1 — kod tytułu ubezpieczenia** (art. 6 ust. 1 pkt 5 u.s.u.s.) | zał. 6 pkt 4 |
| O3 | **E7 — przychód stanowiący podstawę wymiaru składek za poszczególne miesiące** + liczba dni przepracowanych i obowiązujących | zał. 3 pkt 14 |
| O4 | **Formularz Z-3b** (do 24.10.2026) / **ZAM** | Poradnik wskazuje też ZAM |
| O5 | **M3 — ponowne ZUA do dobrowolnego chorobowego** po zakończeniu zasiłku | Poradnik ZUS |
| O6 | **Brak zgłoszenia z datą wsteczną** — data objęcia = data złożenia ZUA | Poradnik ZUS |

---

### § 2.24 Przedsiębiorczość / mały ZUS+ / ulga na start — wpływ na świadczenia

| Id | Sytuacja | Wymagane działanie |
|---|---|---|
| P1 | **ulga na start** (max 6 miesięcy) | **brak ubezpieczenia chorobowego** → w tym okresie **brak prawa do zasiłków**; obowiązkowe tylko zdrowotne |
| P2 | **preferencyjna podstawa** (min. 30% minimalnego wynagrodzenia, 24 miesiące) | niższa podstawa → niższy zasiłek |
| P3 | **mały ZUS+** (max 36 miesięcy w 60; przychód do 120 000 zł) | niższa podstawa → niższy zasiłek |
| P4 | **przejście na etat ≥ minimalne wynagrodzenie** | **dobrowolne chorobowe z działalności ustaje** → trzeba **ponownie ZUA** przy powrocie |
| P5 | **podwyższenie podstawy składek w ciąży** | **ryzyko decyzji o niższej podstawie** (Poradnik ZUS; pkt H.2 wytycznych) |
| P6 | **umowa o pracę z własnym pracodawcą** / na jego rzecz | traktowany **jako pracownik** dla celów ubezpieczeń |

---

## § 3. DOKUMENTY ZBIORCZE — MACIERZ „DOKUMENT → WARIANTY”

| Dokument | Wymagany w wariantach |
|---|---|
| **e-ZLA** (w tym z kodem „B”) | W34, W35, W36, W37 (poprzedzające), W17 (dla niani/opiekuna) |
| **Wydruk e-ZLA / e-ZLA na formularzu** (art. 55a ust. 6–7) | W34–W36 (gdy płatnik bez profilu informacyjnego) |
| **Zaświadczenie lekarskie na zwykłym druku o przewidywanej dacie porodu** | W2, W1 (część przed porodem), W38 |
| **Zaświadczenie lekarskie na zwykłym druku o stanie ciąży w okresie zatrudnienia** | W38, W39, W40 |
| **Odpis skrócony aktu urodzenia dziecka** | W1–W10, W21, W22–W28, W42 |
| **Odpis skrócony aktu urodzenia z adnotacją „martwe urodzenie”** | W10 |
| **Zaświadczenie o martwym urodzeniu** (lekarz ginekolog-położnik / lek. w specjalizacji / położna) | W10, W38, W39, W40, W45 |
| **Karta zgonu** | W45 |
| **Zaświadczenie szpitala** (okres pobytu, tydzień ciąży / masa urodzeniowa) | W4, W27 |
| **Zaświadczenie o dacie przyjęcia matki do placówki leczniczej** | W7, W24 |
| **Zaświadczenie o dacie wypisania matki z placówki** | W7, W24 |
| **Oświadczenie o braku zamiaru drugiego rodzica** (uzupełniający urlop) | W4, W27 |
| **Oświadczenie o braku zamiaru / okresie drugiego rodzica** (urlop rodzicielski) | W25, W26 |
| **Kopia wniosku ojca / innego członka o pozostałą część urlopu** | W5, W6 |
| **Oświadczenie ojca o przerwaniu działalności zarobkowej** | W5 (matka nie-pracownik), M4 |
| **Oświadczenie matki o zamiarze rezygnacji** | W5, W6 |
| **Orzeczenie o niezdolności matki do samodzielnej egzystencji** | W6, W9 (wariant A), W17 (art. 32a) |
| **Oświadczenie o dacie zgonu / porzucenia przez matkę** | W8 |
| **Oświadczenie, że matka nie ma tytułu do chorobowego (z PESEL)** | W9 (zbieg), W32 |
| **Oświadczenie matki o dacie podjęcia zatrudnienia ≥ ½ etatu (z PESEL, nazwą i NIP pracodawcy)** | W9 (wariant B) |
| **Zaświadczenie sądu opiekuńczego o dacie wystąpienia do sądu** / kopia wniosku z poświadczeniem | W28 |
| **Prawomocne orzeczenie sądu o umieszczeniu w rodzinie zastępczej** / umowa ze starostą | W28 |
| **Kopia prawomocnej decyzji o odroczeniu obowiązku szkolnego** | W28, W25, W11 |
| **Kopia prawomocnego postanowienia o przysposobieniu** | W21 (urlop ojcowski na dziecko przysposobione) |
| **Zaświadczenie „Za życiem” (kopia)** | W25, W26, W4 (pośrednio) |
| **Oświadczenie o posiadaniu „Za życiem”** | W41, W25 |
| **Zaświadczenie płatnika zasiłku o okresie i stawce zasiłku matki (z PESEL)** | W5, W22, W23, W24, W26 |
| **Zaświadczenie płatnika zasiłku o okresie i stawce drugiego rodzica** | W25, W26 |
| **Zaświadczenie pracodawcy o okresie udzielonego urlopu (macierzyńskiego/uzupełniającego/rodzicielskiego)** | W4, W25, W26 |
| **Zaświadczenie pracodawcy o terminie zaprzestania urlopu** | W5, W6, W7, W24 |
| **Zaświadczenie pracodawcy o okresie i wymiarze pracy w urlopie + o wydłużeniu (art. 182¹f § 3–7)** | W12, W25, W26, W32 |
| **Świadectwo pracy / dokument o wygaśnięciu / rozwiązaniu umowy** | W38, W39 |
| **Prawomocne orzeczenie sądu o rozwiązaniu z naruszeniem prawa** | W40 |
| **Karta wypadku w drodze do pracy lub z pracy** | W46 |
| **Zaświadczenie lekarskie o związku z wcześniejszym wypadkiem** | W46 |
| **Zaświadczenie o stanie zdrowia** (nie starsze niż miesiąc) | W37 |
| **Wywiad zawodowy z miejsca pracy** | W37 (z wyjątkami) |
| **Protokół ustalenia okoliczności i przyczyn wypadku przy pracy / karta wypadku** | W37 |
| **Decyzja o stwierdzeniu choroby zawodowej** | W37 |
| **Zaświadczenia płatnika składek: Z-3 / Z-3a / Z-3b / ZAS-12** | W34–W36, W1–W10, W21–W28 |
| **Rachunki za pogrzeb** | W45 |
| **Orzeczenie o znacznym stopniu niepełnosprawności / o niepełnosprawności ze wskazaniami** | W17 |
| **Decyzja o konieczności izolacji dziecka** | W17 |
| **Kopia prawomocnego orzeczenia o niepełnosprawności/stopniu niepełnosprawności dziecka** | W11 (36 miesięcy) |
| **Odpis skrócony aktu zgonu drugiego rodzica / orzeczenie o ubezwłasnowolnieniu / orzeczenie o ustaleniu ojcostwa / orzeczenie o władzy rodzicielskiej** | W11 (wniosek o 36 miesięcy) |
| **Oświadczenie o niewykorzystaniu urlopu rodzicielskiego w 1. roku życia** | W42 |
| **Oświadczenie, czy zasiłek ojcowski pobrany z innego tytułu** | W21 |
| **Oświadczenie, czy zasiłek przysługuje z więcej niż jednego tytułu** | W44, M1 |
| **Dokumenty zagraniczne + tłumaczenia** | W1 (wariant C), W15, W36d, W17 (za granicą) |
| **Zgłoszenie ZUS ZUA** | M3, O6 |
| **Wniosek o ustalenie uprawnień (art. 63)** | M5 |

---

## § 4. MINIMALNE ZESTAWY DANYCH — WIDOK „CO PODAĆ W 60 SEKUND”

Dla potrzeb UX narzędzia (wyzwanie wymaga prostoty), minimalny zestaw do wstępnej kwalifikacji:

| Krok | Pytanie do użytkownika | Pole |
|---|---|---|
| 1 | Kim jesteś: matka / ojciec / inny członek najbliższej rodziny / przyjmujący dziecko na wychowanie? | R1 |
| 2 | Jaki jest Twój tytuł do ubezpieczenia chorobowego? | E1 |
| 3 | Czy jest to obowiązkowe czy dobrowolne ubezpieczenie chorobowe? | E1b |
| 4 | Jak długo (nieprzerwanie) podlegasz ubezpieczeniu chorobowemu? | E2 |
| 5 | Kto jest Twoim płatnikiem składek i ilu ubezpieczonych zgłasza (≤ 20 / > 20)? | B1, B5 |
| 6 | Data porodu / przyjęcia dziecka | G1 / G2 / C4 |
| 7 | Liczba dzieci przy jednym porodzie | C6 |
| 8 | Czy dziecko ma zaświadczenie „Za życiem”? | I9 |
| 9 | Czy dziecko było hospitalizowane po urodzeniu? (tydzień ciąży, masa, okresy) | H1–H5 |
| 10 | Czy planujesz dzielić się uprawnieniami z drugim rodzicem? (kto, ile tygodni) | I3, I4, J2 |
| 11 | Czy chcesz wariant 81,5% (wniosek w 21 dni po porodzie)? | I8 |
| 12 | Czy planujesz łączyć urlop rodzicielski z pracą? (wymiar ≤ ½) | I12 |
| 13 | Czy jesteś zadłużony w ZUS powyżej 1% minimalnego wynagrodzenia? | E19 |
| 14 | Czy w dniu porodu / przyjęcia dziecka będziesz podlegać ubezpieczeniu chorobowemu? | E1, E2 |

**Zasada projektowa:** pola z § 4 zbieramy zawsze; pola z § 1.1–1.11 — tylko gdy wynikają z odpowiedzi.
To realizuje wymóg zadania „informacja skonkretyzowana, uwzględniająca indywidualną sytuację”.

---

## § 5. OSTRZEŻENIA WALIDACYJNE — CO NARZĘDZIE MUSI WYCHWYCIĆ

| Kod | Reguła walidacyjna | Komunikat |
|---|---|---|
| V1 | Brak tytułu do ubezpieczenia chorobowego w dniu porodu / przyjęcia dziecka | „Nie przysługuje zasiłek macierzyński. Sprawdź **świadczenie rodzicielskie**.” |
| V2 | Dobrowolne ubezpieczenie chorobowe < **90 dni** | „Prawo do zasiłku chorobowego powstaje po 90 dniach. Zgłoszenie **nie działa wstecz**.” |
| V3 | Obowiązkowe ubezpieczenie chorobowe < **30 dni** | „Prawo powstaje po 30 dniach, chyba że zachodzi wyjątek z art. 4 ust. 3.” |
| V4 | Wariant 81,5% — minęło **> 21 dni** od porodu | „Nie możesz już wybrać 81,5%. Będzie **100% / 70%**.” |
| V5 | Urlop ojcowski — dziecko ukończyło **12 miesięcy** | „Prawo do urlopu ojcowskiego **wygasło**.” |
| V6 | Rezygnacja matki — wykorzystano **< 14 tygodni** | „Ojciec nie może przejąć części urlopu (wyjątki: art. 180 § 6–7, 10–13, 15, 17).” |
| V7 | Rezygnacja matki — **< 8 tygodni** i powołanie na orzeczenie / szpital | „Wymagane **co najmniej 8 tygodni** urlopu po porodzie.” |
| V8 | Urlop rodzicielski — 6. część lub po roku, w którym dziecko kończy **6 lat** | „Limit **5 części** / **do końca roku kalendarzowego, w którym dziecko kończy 6 lat**.” |
| V9 | Urlop rodzicielski — niewykorzystana część drugiego rodzica | „**9 tygodni przepada** — nie można przenieść.” |
| V10 | Łączenie z pracą — **> ½ etatu** | „Maksymalnie **połowa** pełnego wymiaru.” |
| V11 | Łączenie — wydłużenie ponad **82/86/130/134 tyg.** | „Przekroczono limit wydłużenia.” |
| V12 | Uzupełniający urlop — brak **terminu zakończenia urlopu macierzyńskiego** | „Wniosek **będzie wadliwy** (art. 180² § 6 k.p.).” |
| V13 | Uzupełniający urlop — **po 37. tyg.** pobyt krótszy niż 2 kolejne dni albo zaczęty poza 5.–28. dniem po porodzie (skorygowane wg art. 180² § 1 KP; „5 dni” z poradnika ZUS nie wynika z ustawy) | „Warunek pobytu w szpitalu (art. 180² § 1 pkt 3 KP) nie jest spełniony.” |
| V14 | Uzupełniający urlop — wniosek **< 21 dni** przed zakończeniem urlopu macierzyńskiego | „Termin wniosku: **co najmniej 21 dni** wcześniej.” |
| V15 | Urlop ojcowski — wniosek **< 7 dni** przed rozpoczęciem | „Termin wniosku: **co najmniej 7 dni** wcześniej.” |
| V16 | Urlop macierzyński przed porodem — wniosek **< 14 dni** przed rozpoczęciem | „Termin wniosku: **co najmniej 14 dni** wcześniej.” |
| V17 | Urlop macierzyński przed porodem — **> 6 tygodni** przed PDP | „Maksymalnie **6 tygodni** przed przewidywaną datą porodu.” |
| V18 | Urlopy rodzicielski / na warunkach — wniosek **< 21 / < 14 dni** | „Termin wniosku nie zachowany.” |
| V19 | Urlop na warunkach urlopu macierzyńskiego — wniosek **> 7 dni** od przyjęcia dziecka | „Wniosek w terminie **7 dni** od przyjęcia dziecka.” |
| V20 | **Rodzina zastępcza zawodowa** | „**Brak prawa** do urlopu na warunkach urlopu macierzyńskiego.” |
| V21 | Dziecko **> 7/10/14 lat** przy adopcji / rodzinie zastępczej | „Limit wieku **przekroczony**.” |
| V22 | Zadłużenie **> 1% minimalnego wynagrodzenia** | „**Brak prawa** do zasiłku do czasu spłaty. Po 6 miesiącach prawo **przedawnia się**.” |
| V23 | Zmiana wymiaru etatu **w 12 miesiącach** przed porodem | „Podstawa wymiaru będzie liczona od **nowego** wymiaru — zasiłek może być niższy.” |
| V24 | Podwyższenie podstawy składek **w okresie ciąży** | „Ryzyko decyzji o **niższej podstawie**. ZUS bada pozorność.” |
| V25 | Umowa pozorna / „na papierze” | „Umowa zawarta dla pozoru **nie rodzi skutków** — decyzja o niepodleganiu ubezpieczeniom.” |
| V26 | Zgłoszenie do dobrowolnego chorobowego **z datą wsteczną** | „**Nie jest możliwe.** Objęcie od dnia złożenia ZUA.” |
| V27 | Przedawnienie roszczenia — **> 6 miesięcy** od końca okresu zasiłkowego | „Roszczenie **przedawnione** (3 lata przy błędzie ZUS/płatnika).” |
| V28 | Praca zarobkowa na zwolnieniu | „**Utrata zasiłku za cały okres** zwolnienia + zwrot z odsetkami.” |
| V29 | Nadużycie alkoholu (kod C) | „**Brak zasiłku za pierwsze 5 dni**.” |
| V30 | Niezdolność w okresie urlopu bezpłatnego / wychowawczego / opiekuńczego | „**Brak zasiłku** i brak wliczenia do okresu zasiłkowego.” |
| V31 | Okres zasiłkowy — 182 dni, gdy nie ma kodu B/D | „Ciąża wydłuża okres zasiłkowy do **270 dni** — sprawdź kod „B”.” |
| V32 | Zwolnienie bez kodu B po chorobie bez kodu B | „Możesz **zresetować okres zasiłkowy** (art. 9 ust. 2) — sprawdź.” |
| V33 | Brak wniosku o zasiłek opiekuńczy przy e-ZLA opiekuńczym | „Zasiłek **nie jest wypłacany automatycznie** — złóż Z-15A/Z-15B.” |
| V34 | Zasiłek opiekuńczy — przekroczone **60 dni w roku** | „Limit **łączny** 60 dni w roku kalendarzowym.” |
| V35 | Brak świadczenia rehabilitacyjnego — wyczerpany okres zasiłkowy, brak rokowań | „Brak przesłanek z art. 18 ust. 1.” |
| V36 | Ojciec — brak ubezpieczenia chorobowego | „Brak prawa do przejęcia urlopu. Możliwe: **zasiłek opiekuńczy** / **świadczenie rodzicielskie**.” |
| V37 | Zbieg tytułów — nie wskazano płatnika podwyższenia | „Wskaż płatnika wypłacającego **podwyższenie do świadczenia rodzicielskiego**.” |
| V38 | Przedsiębiorca na **ulgi na start** | „Brak ubezpieczenia chorobowego → **brak prawa do zasiłków**.” |
| V39 | Urodzenie za granicą — brak tłumaczenia (poza UE/EFTA/CH) | „Wymagane **tłumaczenie na język polski**.” |
| V40 | ZUS nie może pozyskać aktu urodzenia | „Wezwanie do przedstawienia aktu — **min. 14 dni**; brak → **odmowa wszczęcia postępowania**.” |

---

## § 6. NAJCZĘSTSZE BRAKI W WNIOSKACH — LISTA KONTROLNA

| # | Brak | Gdzie się ujawnia |
|---|---|---|
| 1 | **Numer PESEL drugiego rodzica** | § 20, § 23, § 27, § 30, § 32 |
| 2 | **Termin zakończenia urlopu macierzyńskiego** | art. 180² § 6 k.p.; § 14 rozporz. o wnioskach |
| 3 | **Oświadczenie drugiego rodzica** o braku zamiaru / o okresie | § 26, § 29, § 30; § 14, § 15 rozporz. o wnioskach |
| 4 | **Zaświadczenie szpitala** z tygodniem ciąży / masą urodzeniową | art. 180² § 5 k.p. |
| 5 | **Zaświadczenie płatnika o stawce % zasiłku matki** | § 20 ust. 1 pkt 2, § 23 ust. 1 pkt 2 |
| 6 | **Liczba dzieci pozostałych przy życiu** | art. 180¹ § 1–2 k.p. |
| 7 | **Data porodu** vs. data wniosku o 81,5% (21 dni) | art. 30a ust. 1 |
| 8 | **Wymiar czasu pracy** przy łączeniu z urlopem | art. 182¹e § 1, § 16 rozporz. o wnioskach |
| 9 | **Informacja o wydłużeniu urlopu (art. 182¹f § 3–7)** | § 29 pkt 2, § 30 ust. 1 pkt 3 |
| 10 | **Liczba wykorzystanych części** urlopu rodzicielskiego | § 15 ust. 1 pkt 2 |
| 11 | **Oświadczenie, czy zasiłek ojcowski pobrany z innego tytułu** | § 33 ust. 1 pkt 2 |
| 12 | **Oświadczenie o więcej niż jednym tytule** i płatniku podwyższenia | § 28 |
| 13 | **Oświadczenie o braku domownika** mogącego zapewnić opiekę | zał. 7 pkt 5 |
| 14 | **Dane o zasiłku opiekuńczym pobranym przez innych w danym roku** | zał. 7 pkt 6 |
| 15 | **Kopia zaświadczenia „Za życiem”** | § 15 ust. 2 pkt 3 rozporz. o wnioskach |
| 16 | **Dokument potwierdzający wiek dziecka** (rodzina zastępcza) | § 16 ust. 2 pkt 2 |
| 17 | **Kopia decyzji o odroczeniu obowiązku szkolnego** | § 16, § 30 |
| 18 | **Oświadczenie matki o dacie podjęcia zatrudnienia** (matka nieubezpieczona) | § 25 |
| 19 | **Zaświadczenie o dacie wypisania matki z placówki** | § 23 ust. 1 pkt 4 |
| 20 | **Numer rachunku bankowego** | zał. 1 pkt 8, zał. 6 pkt 17, zał. 7 pkt 7 |
| 21 | **Karta wypadku w drodze do pracy** (przy więcej niż jednym tytule) | § 10 ust. 1 |
| 22 | **Wywiad zawodowy** (świadczenie rehabilitacyjne) | § 11 ust. 1 pkt 3 |
| 23 | **Zaświadczenie o stanie zdrowia nie starsze niż miesiąc** | § 11 ust. 1 pkt 2 |
| 24 | **Wniosek o wyrównanie do 100%** — brak | art. 31 ust. 4 (nie działa z urzędu) |
| 25 | **Ponowne ZUA** po zakończeniu zasiłku macierzyńskiego | Poradnik ZUS |

---

## § 7. ZASADY POSTĘPOWANIA I TERMINY (do walidacji terminów w narzędziu)

| Id | Zasada | Podstawa |
|---|---|---|
| T1 | Wniosek o urlop macierzyński przed porodem — **14 dni** przed | Poradnik ZUS |
| T2 | Wniosek o uzupełniający urlop macierzyński — **21 dni** przed zakończeniem urlopu macierzyńskiego | art. 180² § 4 k.p. |
| T3 | Wniosek o urlop rodzicielski — **21 dni** przed | art. 182¹d § 1 k.p. |
| T4 | Wniosek o łączenie urlopu rodzicielskiego z pracą — **21 dni** przed | art. 182¹e § 2 k.p. |
| T5 | Odmowa pracodawcy (łączenie z pracą) — informacja w ciągu **7 dni** | art. 182¹e § 2 k.p. |
| T6 | Wniosek o urlop ojcowski — **7 dni** przed | art. 182³ § 2 k.p. |
| T7 | Wniosek matki o rezygnację z części urlopu macierzyńskiego — **7 dni** przed powrotem do pracy | art. 180 § 8 k.p. |
| T8 | Wniosek ojca o część urlopu macierzyńskiego — **14 dni** przed | art. 180 § 9 k.p. |
| T9 | Wniosek o urlop na warunkach urlopu macierzyńskiego — **7 dni** od przyjęcia; start **do 21 dni** | art. 183 § 6 k.p. |
| T10 | Wniosek o 81,5% — **21 dni** po porodzie / po przyjęciu dziecka | art. 30a ust. 1–2 u.z. |
| T11 | Płatnik przekazuje wniosek do ZUS — **niezwłocznie, nie później niż 7 dni** | art. 61b ust. 5 u.z. |
| T12 | ZUS wypłaca — **nie później niż 30 dni** od wyjaśnienia ostatniej okoliczności | art. 64 ust. 1 u.z. |
| T13 | ZUS po spłacie zadłużenia — **nie później niż 60 dni** | art. 64 ust. 3 u.z. |
| T14 | ZUS wzywa do aktu urodzenia — termin **min. 14 dni** | § 13 ust. 4 |
| T15 | Zasiłek pogrzebowy — **12 miesięcy** od pochówku | Poradnik ZUS |
| T16 | Przedawnienie roszczeń zasiłkowych — **6 miesięcy / 3 lata** | art. 67 u.z. |
| T17 | Właściwość płatnika zasiłku — stan na **30 listopada** roku poprzedniego | art. 61 ust. 2 u.z. |
| T18 | Płatnik bez profilu informacyjnego informuje ubezpieczonego **w pierwszym dniu** podlegania chorobowemu | art. 58 ust. 5 u.z. |
| T19 | Informacja o utworzeniu profilu — **7 dni** | art. 58 ust. 6 u.z. |
| T20 | Wystawienie e-ZLA — przekazanie w **3 dni robocze** (gdy papierowo) | art. 55a ust. 9 u.z. |
| T21 | Sprostowanie błędu w e-ZLA — **3 dni robocze** | art. 58a ust. 1 u.z. |

---

## § 8. PODSUMOWANIE — 12 KLUCZOWYCH LICZB DO KALKULATORA

| Parametr | Wartość 2026 |
|---|---|
| Minimalne wynagrodzenie | **4 806 zł** brutto |
| Składki społeczne pracownika (potrącenie z podstawy zasiłku) | **13,71%** |
| Minimalna podstawa zasiłku (pełny etat) | **4 806 zł × (1 − 13,71%) = 4 147,10 zł** |
| Maksymalna podstawa dobrowolnej składki chorobowej | **23 550,00 zł** (250% prognozowanego przeciętnego wynagrodzenia) |
| Limit podstawy zasiłku dla nie-pracowników | **23 550,00 × (1 − 13,71%) = 20 321,30 zł** |
| Próg zadłużenia (1% minimalnego wynagrodzenia) | **48,06 zł** |
| Zasiłek pogrzebowy | **7 000 zł** |
| Składka na ubezpieczenie chorobowe | **2,45%** podstawy wymiaru |
| Okres zasiłkowy — standard / ciąża i gruźlica | **182 dni / 270 dni** |
| Zasiłek chorobowy — standard / ciąża | **80% / 100%** |
| Urlop macierzyński | **20 / 31 / 33 / 35 / 37 tyg.** |
| Urlop rodzicielski | **41 / 43 tyg.** (65 / 67 „Za życiem”) |
| Urlop ojcowski | **2 tyg.** (14 dni) |
| Nieprzenoszalna część urlopu rodzicielskiego | **9 tyg.** dla każdego z rodziców |
| Wysokość zasiłku macierzyńskiego | **100% / 70% / 81,5%** |
| Zasiłek opiekuńczy | **80%**; 60 / 30 / 14 dni; łącznie **60 dni** |

---

**Koniec dokumentu II.**
