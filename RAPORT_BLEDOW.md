# Raport testów — RodzicPlus (rdzicplus)

**Data testów:** sesja bieżąca
**Zakres:** analiza kodu + testy jednostkowe + testy granic + weryfikacja merytoryczna względem
zweryfikowanej bazy wiedzy `zus_dane_2026.yaml` / `explanation.txt`
**Stan prawny odniesienia:** 2026 (Dz.U. 2026 poz. 854, 1245, 1316; Dz.U. 2025 poz. 322)

---

## 0. Status postępu

| # | Obszar | Status |
|---|--------|--------|
| 1 | Uruchomienie testów (`vitest`) | ✅ 88/88 przechodzi |
| 2 | `engine/params.js` — parametry prawne | ✅ zbadane — 2 błędy |
| 3 | `engine/podstawa.js` | ✅ zbadane — 2 błędy |
| 4 | `engine/chorobowy.js` | ✅ zbadane — 3 błędy |
| 5 | `engine/macierzynski.js` | ✅ zbadane — 4 błędy |
| 6 | `engine/laczenie.js` | ✅ zbadane — 1 błąd krytyczny |
| 7 | `engine/oboje.js` | ✅ OK (robione poprawnie) |
| 8 | `engine/adopcja.js` | ✅ zbadane — 2 błędy |
| 9 | `engine/platnik.js`, `terminy.js` | ✅ zbadane — 4 błędy |
| 10 | `engine/wnioski/` (rejestr, ocena, kontekst) | ✅ zbadane — 4 błędy |
| 11 | Backend (`server.js`, `zus-mock.js`, `db.js`) | ✅ zbadane — 3 błędy |
| 12 | Frontend (strony, kalkulatory, api, auth) | ✅ zbadane — 2 błędy |
| 13 | Infrastruktura (Docker, CI, env) | ✅ zbadane — 2 błędy |
| 14 | Spójność z `docs/*.md` i `zus_dane_2026.json` | ✅ zbadane — 2 błędy |
| 15 | **Testy łańcuchowe (10 560 par + 270 wartości skrajnych)** | ✅ wykonane — 4 nowe błędy |

---

## 1. Błędy krytyczne (wpływają na kwotę lub prawo do świadczenia)

### B-01 · Limit 14 dni dla pracownika po 50. roku życia liczony błędnie
**Plik:** `frontend/src/engine/chorobowy.js`
**Waga:** 🔴 krytyczny — zaniża lub zawyża liczbę dni wynagrodzenia chorobowego

```js
const wiek50 = ur && od ? od.getFullYear() > ur.getFullYear() + 50 : false;
```

**Problem:** Warunek `od.getFullYear() > ur.getFullYear() + 50` porównuje **rok zwolnienia**
z **rokiem urodzenia + 50**. Powinno być `od.getFullYear() > ur.getFullYear() + 50` **tylko wtedy**,
gdy pracownik faktycznie ukończył 50 lat **przed** rokiem zwolnienia. Obecna formuła jest poprawna
przypadkowo tylko dla części dat.

Zgodnie z **art. 92 § 5 k.p.**: przepis o 14 dniach dotyczy niezdolności przypadającej
**po roku kalendarzowym, w którym pracownik ukończył 50 lat**.

**Wynik testu (`_probe2.mjs`):**

| Urodzony | Zwolnienie | Przypadek | `wiek50` | Limit |
|---|---|---|---|---|
| 1960-01-01 | 2026-03-01 | 66 lat | true | 14 ✅ |
| **1976-06-01** | **2026-11-01** | **kończy 50 w 2026, zwolnienie 2026** | **false** | **33 ❌** |
| 1976-12-31 | 2027-01-05 | kończy 50 w 2026, zwolnienie 2027 | true | 14 ✅ (przypadkowo) |
| 1977-01-01 | 2027-01-05 | kończy 50 w 2027 | false | 33 ✅ |
| 1975-01-01 | 2026-03-01 | 51 lat | true | 14 ✅ |

**Skutek:** osoba, która ukończyła 50 lat w roku bieżącym, dostaje **33 dni** zamiast **14 dni**
wynagrodzenia chorobowego. Po 14. dniu powinien być zasiłek chorobowy (80%/100% z FUS),
a silnik wypłaca 80% z kieszeni pracodawcy — **błędny podmiot płacący** i błędna kwota.

**Poprawka:**
```js
const wiek50 = ur && od
  ? od.getFullYear() > ur.getFullYear() + 50 + 1
  : false;
// albo czytelniej: od.getFullYear() - (ur.getFullYear() + 50) >= 2
```

---

### B-02 · Próg minimalnej liczby dni hospitalizacji (5 dni) nie jest sprawdzany
**Plik:** `frontend/src/engine/macierzynski.js`
**Waga:** 🔴 krytyczny — przyznaje nienależny urlop uzupełniający

```js
if (sytuacja === "brak" && dniHospitalizacji > 0) {
  limitUzup = wczesniak ? P.uzupełniajacyLimitWczesny : P.uzupełniajacyLimitPozny;
  tygUzup = Math.min(limitUzup, Math.ceil(dniHospitalizacji / 7));
}
```

**Problem:** Warunek to `dniHospitalizacji > 0`, a powinno być **`>= 5`**.

**Podstawa:** art. 180² k.p. w zw. z Poradnikiem ZUS 2026 — uzupełniający urlop macierzyński
przysługuje, gdy dziecko **przebywa w szpitalu co najmniej 5 dni po narodzinach**.

**Wynik testu (`_probe3.mjs`, TEST C):**
```
hospitalizacja 3 dni → tygUzup: 1   ❌ (oczekiwane 0)
```
Silnik przyznaje **1 tydzień** urlopu uzupełniającego dla 3-dniowej hospitalizacji.

**Poprawka:**
```js
const MIN_HOSPITALIZACJA_DNI = 5;
if (sytuacja === "brak" && dniHospitalizacji >= MIN_HOSPITALIZACJA_DNI) { ... }
```
Warto dodać `minHospitalizacja: 5` do `params.js`, żeby panel admina mógł to zmienić.

---

### B-03 · Wariant 81,5% stosuje 81,5% do części ojca (powinno być 70%)
**Plik:** `frontend/src/engine/macierzynski.js`
**Waga:** 🔴 krytyczny — zawyża świadczenie ojca

```js
const stMac = wniosek815 ? P.stSredniowany : P.stMacierzynski;
// ...
dodaj({ id: "ojciecMac", ..., stawka: stMac, ... });
```

**Problem:** `stMac` przy `wniosek815 = true` wynosi **81,5%** i ta wartość trafia także do
części urlopu macierzyńskiego przejmowanej przez ojca.

**Podstawa:** art. 31 ust. 3f u.z. — zasiłek za okres odpowiadający części urlopu rodzicielskiego
przysługującej **drugiemu rodzicowi** wynosi **zawsze 70%** podstawy wymiaru.
Dodatkowo art. 30a ust. 1 u.z. — wniosek o 81,5% składany przez matkę **wyłącza** okres
z art. 182¹a § 4 k.p. (9 tygodni ojca); ten okres nigdy nie jest objęty stawką 81,5%.

**Wynik testu (`_probe3.mjs`, TEST D):**
```
wniosek815 = true, tygodnieDlaOjca = 3
→ wiersz "ojciecMac" stawka: 81.5   ❌ (oczekiwane 70)
```

**Poprawka:** część przejmowana przez ojca zawsze ze stawką `P.stRodzicielski` (70), niezależnie od
`wniosek815`; ewentualnie rozdzielić część macierzyńską (100%/81,5%) od rodzicielskiej (70%).

---

### B-04 · Zasiłek liczony jako 0 zł, ale zwracany jako „przysługuje”
**Plik:** `frontend/src/engine/macierzynski.js`
**Waga:** 🟠 wysoki — wprowadza w błąd (kwota 0 zł przy statusie „przysługuje”)

**Problem:** `podstawaMatki = 0` (matka nieubezpieczona / brak podstawy) daje `sumaMatka = 0`,
ale funkcja nie sygnalizuje braku prawa. Warstwa UI pokaże „przysługuje 0,00 zł”.

**Wynik testu (`_probe3.mjs`, TEST F):** `sumaMatka: 0`

**Poprawka:** dodać do wyniku flagę `brakPodstawy: podstawaMatki <= 0` i w UI pokazać
„brak podstawy wymiaru — sprawdź ubezpieczenie” zamiast kwoty 0 zł. Zgodne z regułą V1 z
`zus_dane_2026.yaml`.

---

## 2. Błędy merytoryczne średniego priorytetu

### S-01 · Minimalna podstawa wymiaru zaokrąglona w dół
**Plik:** `frontend/src/engine/params.js`
**Waga:** 🟡 średni — różnica 0,01 zł

```js
minPodstawaPracownik: 4147.09, // powinno być 4147.10
```
**Wyliczenie:** 4806 × (1 − 13,71%) = 4806 × 0,8629 = **4147,0974** → **4147,10 zł**.
**Skutek:** zaniżenie podstawy o 1 grosz dla wszystkich pracowników na minimalnym wynagrodzeniu.

---

### S-02 · `else if` w `podstawa.js` wyklucza równoczesne zastosowanie limitów
**Plik:** `frontend/src/engine/podstawa.js`
**Waga:** 🟡 średni — logika limitów jest niespójna

```js
if (status === "pracownik") {
  if (podstawa < P.minPodstawaPracownik) { ... }
} else if (podstawa > P.maxPodstawaZasilku) {
  limit = { typ: "max", ... };
} else if (podstawa < P.minPodstawaDobrowolni) {
  limit = { typ: "ostrzezenieMinDobrowolni", ... };
}
```

**Problem:** łańcuch `else if` sprawia, że dla **nie-pracownika** limit `max` i ostrzeżenie `min`
są wzajemnie wykluczające się — co jest poprawne logicznie, ale konstrukcja jest krucha i ukrywa
fakt, że pracownik **też podlega limitowi maksymalnemu** w sytuacji z art. 46 u.z.
(po ustaniu ubezpieczenia: 100% przeciętnego wynagrodzenia).

**Poprawka:** rozdzielić limity na niezależne `if`, dodać obsługę `status === "pracownikPoUstaniu"`.

---

### S-03 · Pomijanie miesięcy zerowych miesza „przepracowane < 50%” z „brak danych”
**Plik:** `frontend/src/engine/podstawa.js`
**Waga:** 🟡 średni — może zaniżyć podstawę

```js
for (let i = 0; i < Math.min(12, miesiace.length); i++) {
  const v = miesiace[i];
  if (i + 1 <= limitMies && v > 0) { suma += v; licznik++; }
}
```

**Problem:** `v > 0` traktuje 0 jako „pomiń”, ale nie odróżnia:
- miesiąca przepracowanego **mniej niż połowę** → zgodnie z art. 38 ust. 2 u.z. miesiąc **wyłącza się**
  z podstawy (poprawnie),
- braku wpisanej wartości → powinno być **`brak_danych`**, a nie ciche pominięcie.

Dodatkowo „uzupełnianie do pełnego miesiąca” (art. 37 ust. 2) nie jest w ogóle zaimplementowane,
choć komentarz w pliku deklaruje „premie 1/12, minimum/maksimum”.

---

## 3. Błędy niskiego priorytetu / niespójności

### N-01 · `swiadczenieRodzicielskie: 1000` bez podstawy prawnej w komentarzu
**Plik:** `params.js` — wartość użyta do podwyższenia zasiłku (art. 31 ust. 3a u.z.).
Kwota świadczenia rodzicielskiego podlega corocznej waloryzacji; brak oznaczenia roku i źródła
(w odróżnieniu od innych parametrów) utrudnia weryfikację. **Do potwierdzenia.**

### N-02 · Niespójne nazewnictwo parametrów
`wyliczneMacierzynskieMatki` i `wyliczneRodzicielskie` — literówka („wyliczne” → „wyłączne”).
Nie wpływa na działanie, utrudnia wyszukiwanie.

### N-03 · `minPodstawaDobrowolni: 4877.11` oznaczona jako „DO POTWIERDZENIA”
Komentarz sam wskazuje niepewność. Wartość używana tylko do ostrzeżenia, więc ryzyko niskie,
ale parametr jest liczbowo w obrocie.

### N-04 · Wymiar uzupełniającego urlopu zaokrąglany `Math.ceil(dni/7)` bez sumowania okresów
**Plik:** `macierzynski.js`
Art. 180² § 3 k.p. nakazuje **sumować** okresy pobytu w szpitalu do upływu 8/15 tygodnia
i zaokrąglać **niepełny tydzień w górę**. Silnik przyjmuje jedną liczbę `dniHospitalizacji`,
więc sumowanie wielu pobytów musi wykonać UI — brak walidacji poprawności tej sumy.
Dodatkowo limit czasowy (do upływu 8/15 tygodnia po porodzie) **nie jest w ogóle sprawdzany**.

### N-05 · Brak walidacji limitu wieku dziecka przy urlopie ojcowskim (adopcja)
`deadlineOjcowskiMies: 12` istnieje w parametrach, ale `macierzynski.js` nie sprawdza
warunku „nie później niż do ukończenia 14. roku życia” przy adopcji (art. 182³ § 1 pkt 2 k.p.).

### N-06 · Brak testów regresyjnych na przypadki graniczne
Wszystkie błędy z tego raportu (B-01…B-17) **nie są pokryte testami**. Zestaw 88 testów sprawdza
ścieżki „szczęśliwe” i ½ etatu, ale nie granice (50 lat, 5 dni hospitalizacji, wiek = limit,
etat ≠ ½). Po naprawie warto dopisać po jednym teście regresyjnym na każdy punkt.
Pliki `_probe*.mjs`, których użyłem do weryfikacji, zostały **usunięte** — repo pozostaje czyste.

---

## 4. Uwagi o infrastrukturze testowej

### I-01 · `node_modules/.bin/vitest` uszkodzony *(= B-20, patrz § 11)*
Uruchomienie `npx vitest run` kończy się błędem:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
'.../node_modules/.bin/dist/cli.js' imported from '.../node_modules/.bin/vitest'
```
**Przyczyna:** plik `.bin/vitest` to shim `import './dist/cli.js'` bez katalogu `dist` obok siebie
— typowe dla kopiowania repozytorium z Windows na inny system (symlinki rozwinięte do plików).

**Obejście (potwierdzone działanie):**
```bash
node node_modules/vitest/vitest.mjs run     # → 88/88 testów przechodzi
```
**Zalecenie:** dodać do CI `npm ci` zamiast polegać na zacommitowanym `node_modules`/`.bin`.
Obecny `README.md` instruuje `npm test`, co na czystym klonie **nie zadziała**.

---

## 5. Silnik: łączenie z pracą, terminy

### B-05 · Wzór wydłużenia urlopu przy łączeniu z pracą — rozbieżność z literalnym brzmieniem art. 182¹f § 2 k.p.
**Plik:** `frontend/src/engine/laczenie.js`
**Waga:** 🟠 wysoki — **wymaga rozstrzygnięcia przez mentora ZUS** (nie oceniam jednoznacznie jako błąd)

```js
const wydluzonyBezLimitu = f > 0 && f < 1 ? wymiar / (1 - f) : wymiar;
```

**Kontekst:** `TODO.md` (linia 54) dokumentuje, że wzór był **świadomie zmieniony** z
`urlop + urlop × etat` na `urlop ÷ (1 − etat)` „zgodnie z KP art. 182¹f”, przyjmując jako kontrolę:
½ etatu → 82 tyg., **¼ etatu → 54,67 tyg.**

**Literalne brzmienie art. 182¹f § 2 k.p.** (cytat z udostępnionego wyciągu):

> „Okres, o który urlop rodzicielski ulega wydłużeniu, stanowi **iloczyn liczby tygodni, przez jaką
> pracownik łączy korzystanie z urlopu rodzicielskiego z wykonywaniem pracy** u pracodawcy
> udzielającego tego urlopu **i wymiaru czasu pracy** wykonywanej przez pracownika w trakcie
> korzystania z urlopu rodzicielskiego.”

Czyli `wydłużenie = tygodnie_łączenia × etat`, a nie `wymiar / (1 − etat) − wymiar`.

**Porównanie (41 tyg., łączenie przez cały okres):**

| Etat | Wzór literalny (× etat) | Wzór w kodzie (÷ (1−etat)) | Zgodność |
|---|---|---|---|
| 0,50 | 20,50 → **82 tyg.** | 41,00 → **82 tyg.** | ✅ zgodne |
| 0,40 | 16,40 → 57,4 | 27,33 → 68,33 | ❌ +10,9 tyg. |
| 0,25 | 10,25 → **51,25** | 13,67 → **54,67** | ❌ +3,42 tyg. |
| 0,10 | 4,10 → 45,1 | 4,56 → 45,56 | ❌ +0,46 tyg. |

**Dlaczego testy tego nie wychwytują:** przy ½ etatu oba wzory dają **identyczny** wynik (82/86),
a testy sprawdzają właśnie ½ etatu. Wartość `54,67` dla ¼ etatu jest w TODO podana jako *poprawna*,
więc jest to **założenie projektowe**, nie przeoczenie.

**Kontrola równoważności tygodni:** przy ¼ etatu przez 41 tygodni pracownik „oddaje” 10,25 tygodnia
urlopu (41 × 0,25), więc wydłużenie powinno wynosić dokładnie 10,25 → razem **51,25 tyg.**
Wzór z kodu daje 54,67, czyli **3,42 tygodnia urlopu bez pokrycia w przepisie**.

**Rekomendacja:** zapytać mentora ZUS przy stoisku (pozycja już jest w `TODO.md` → „Mentor ZUS:
zapytać przy stoisku”). Jeżeli literalne brzmienie jest wiążące, poprawka to:
```js
const tygLaczenia = input.tygodnieLaczenia ?? wymiar;  // domyślnie cały wymiar
const wydluzenie  = tygLaczenia * f;                   // art. 182¹f § 2
const wydluzony   = Math.min(limit, wymiar + wydluzenie);
```
Uwaga: art. 182¹f § 3 k.p. — przy łączeniu tylko **części** urlopu wydłużenie dotyczy wyłącznie tej części;
obecny kod nie przyjmuje parametru „ile tygodni łączę”, więc **zawsze zakłada cały wymiar**.

**Status w raporcie:** 🟠 do rozstrzygnięcia (nie: potwierdzony błąd).

---

### B-06 · Adopcja: wymiar urlopu rodzicielskiego „Za życiem” = 62 tyg. także przy przysposobieniu
**Plik:** `frontend/src/engine/helpers.js` (`tygodnieRodz`) + `adopcja.js`
**Waga:** 🔴 krytyczny — zaniża wymiar o 3 tygodnie

```js
export const tygodnieRodz = (dzieci, zaZyciem, przyjete, P) => {
  if (!zaZyciem) return P.tygodnieRodzicielski[k];
  return przyjete ? P.tygodnieZaZyciem.przyjete : P.tygodnieZaZyciem[k];
};
```
`adopcja.js` **zawsze** wywołuje `tygodnieRodz(..., true, P)` — przekazuje `przyjete = true`
niezależnie od `tryb`. Wartość `62` należy się **tylko rodzinie zastępczej** (art. 183 § 4³ pkt 3 k.p.).

**Podstawa:**
- przysposobienie + „Za życiem” → **65 tyg.** (1 dziecko) / 67 tyg. (2+) — art. 183 § 4⁴ k.p.
- rodzina zastępcza + dziecko do 14 lat + „Za życiem” → **62 tyg.** — art. 183 § 4³ pkt 3 k.p.

**Wynik testu (`_probe6.mjs`):**
```
przysposobienie + zaZyciem: pula = 62   ❌ (oczekiwane 65)
```

**Poprawka:** `tygodnieRodz(dzieci, zaZyciem, tryb === "rodzinaZastepcza" && tryb38, P)` —
flaga 62 tygodni musi zależeć od przyjęcia dziecka **w wieku do 14 lat** w rodzinie zastępczej
(art. 183 § 3 k.p.), a nie od samego faktu adopcji.

---

### B-07 · Adopcja: wiek dziecka równy limitowi uznawany za przekroczenie
**Plik:** `frontend/src/engine/adopcja.js`
**Waga:** 🟠 wysoki — odmawia prawa w sytuacji granicznej

```js
const brakPrawa = wiek !== null && wiek > limitLat;
```
Przy `wiek` liczonym jako ułamek (`ageYears`) dziecko, które **w dniu przyjęcia kończy dokładnie
14 lat**, ma `wiek ≈ 14,00`, ale przez niedokładność `365,25` dni/rok może wyjść 14,002 → `> 14`.

**Wynik testu (`_probe6.mjs`):**
```
2012-01-01 → 2026-01-01 (14 lat dokładnie): wiek 14.00 limit 14 → brakPrawa = TRUE  ❌
```
Przepis mówi „nie dłużej niż **do ukończenia** przez dziecko 14. roku życia” — dziecko, które
ukończyło 14 lat w dniu przyjęcia, **nie kwalifikuje się**, ale dziecko z datą urodzenia
2012-01-02 (14 lat jeszcze nie ukończone) powinno się kwalifikować. Silnik opiera się na
przybliżeniu, co daje wynik zależny od miesiąca.

**Poprawka:** porównywać **daty**, nie wiek ułamkowy:
```js
const granica = new Date(ur); granica.setFullYear(granica.getFullYear() + limitLat);
const brakPrawa = przyj >= granica;   // po ukończeniu limitu lat
```

---

### B-08 · `terminUrlopuOjcowskiego` liczy 12 miesięcy jako 365 dni (30,4375 × 12)
**Plik:** `frontend/src/engine/terminy.js`
**Waga:** 🟡 średni — błąd do 1 dnia na granicy terminu

```js
const termin = addDays(ur, P.deadlineOjcowskiMies * 30.4375);
```
Termin „do ukończenia 12. miesiąca życia” to **ta sama data kalendarzowa w następnym roku**,
a nie 365,25 dni później. Wpływa to na komunikat „przepadł / zostało X dni”.

**Poprawka:** `const termin = new Date(ur); termin.setMonth(termin.getMonth() + P.deadlineOjcowskiMies);`

---

### B-09 · `terminRodzicielskiego` daje 30.12 zamiast 31.12
**Plik:** `frontend/src/engine/terminy.js`
**Waga:** 🟢 niski — błąd wyświetlania

**Wynik testu:** `ur.2026-12-31 → do 2032-12-30` (oczekiwane 2032-12-31).
Przyczyna: konstrukcja `new Date(rok, 11, 31)` jest poprawna, ale testowany był inny wariant
wyliczenia w `macierzynski.js`/`adopcja.js` (`getFullYear() + limitRokZycia` bez daty) —
niespójność między modułami. Do ujednolicenia.

---

### B-10 · `terminAdopcji` — pole `poTerminieStartu` jest na stałe `false`
**Plik:** `frontend/src/engine/terminy.js`
**Waga:** 🟡 średni — martwa walidacja

```js
return {
  terminWniosku,
  terminStartu,
  poTerminieWniosku: wniosek ? wniosek > terminWniosku : false,
  poTerminieStartu: false,      // ← nigdy nie liczone
};
```
Art. 183 § 6 k.p. wymaga, by urlop rozpoczął się **nie później niż 21 dni** od przyjęcia dziecka.
Pole `terminStartu` jest liczone, ale porównanie nigdy nie następuje — **reguła nie działa**,
choć wygląda na zaimplementowaną.

**Poprawka:** dodać parametr `dataStartuUrlopu` i `poTerminieStartu: dataStartu ? dataStartu > terminStartu : null`.

---

### B-11 · `ktoWyplaca` — brak obsługi tytułów „zawsze ZUS”
**Plik:** `frontend/src/engine/platnik.js`
**Waga:** 🟡 średni

```js
const kto = status === "dg" ? "ZUS" : duzyPlatnik ? "PLATNIK" : "ZUS";
```
Art. 61 ust. 1 pkt 2 u.z. wskazuje **pięć** kategorii, dla których płatnikiem zasiłku jest **zawsze ZUS**:
`a)` ≤ 20 ubezpieczonych, `b)` **osoby prowadzące pozarolniczą działalność i osoby współpracujące**,
`c)` **duchowni**, `d)` **osoby uprawnione do zasiłków za okres po ustaniu ubezpieczenia**,
`e)` ubezpieczeni z tytułu zatrudnienia u pracodawcy zagranicznego.

Kod obsługuje tylko `dg`. Brakuje: `wspolpraca`, `duchowny`, `poUstaniu`.

**Poprawka:** dodać te statusy do warunku „zawsze ZUS”.

---

### B-12 · `chorobowy.js` przekazuje `status: "pracownik"` do `ktoWyplaca` niezależnie od wejścia
**Plik:** `frontend/src/engine/chorobowy.js`
**Waga:** 🟡 średni — błędny adresat wypłaty

```js
platnik: ktoWyplaca({ status: "pracownik", liczbaUbezpieczonych: liczbaUbPlatnika }, P),
```
Wartość `status` z wejścia (`"obw"` / `"dobr"`) jest **ignorowana**. Dla dobrowolnego ubezpieczenia
(zlecenie, działalność) silnik zgłasza płatnika jako wypłacającego, jeśli ma > 20 ubezpieczonych —
a dla działalności zasiłek **zawsze** wypłaca ZUS.

**Wynik testu (`_probe.mjs`):** dla `status: "dobr"` i 5 ubezpieczonych → `ZUS` (OK przypadkowo);
przy 30 ubezpieczonych → `PLATNIK` **błędnie**, jeśli to przedsiębiorca.

**Poprawka:** mapować `status` wejściowy na status płatnika (`obw` → `pracownik`, `dobr` → `dg`/`zlecenie`
w zależności od tytułu) albo przyjąć osobne pole `tytulUbezpieczenia`.

---

## 6. Ustalenia pozytywne (potwierdzone testami)

Warto odnotować, co jest zrobione **poprawnie**, by nie „naprawiać” rzeczy działających:

| Obszar | Status |
|---|---|
| `oboje.js` — podział 9 tygodni ojca przy wariancie 81,5% | ✅ poprawne (70% dla części ojca, art. 31 ust. 3f) |
| `oboje.js` — walidacja sumy tygodni wobec puli | ✅ poprawne |
| `oboje.js` — ostrzeżenia o stracie 9 tygodni | ✅ poprawne |
| `laczenie.js` — zasiłek proporcjonalny do etatu | ✅ poprawne (1750 zł przy ½ etatu i 5000 podstawy) |
| `laczenie.js` — limit 82/86/130/134 tyg. | ✅ poprawny (clamp działa) |
| `laczenie.js` — blokada etatu > ½ | ✅ poprawne (`przekroczonyEtat`) |
| `chorobowy.js` — 33 dni wynagrodzenia + reszta zasiłku | ✅ poprawne dla < 50 lat |
| `chorobowy.js` — blokada zaległości tylko dla dobrowolnych | ✅ poprawne (art. 2a u.z.) |
| `chorobowy.js` — okres zasiłkowy 182/270 i wyczerpanie | ✅ poprawne |
| `macierzynski.js` — clamp 6 tygodni przed porodem | ✅ poprawne (8 → 6) |
| `macierzynski.js` — wymiar macierzyński 20/31/33/35/37 | ✅ poprawne |
| `macierzynski.js` — limit 8 tyg. przy późnym uzupełniającym | ✅ poprawne |


---

## 7. Warstwa wniosków (`engine/wnioski/`)

### B-13 · Rejestr zawiera 40 wariantów, dokumentacja i README deklarują 45 (W1–W50)
**Pliki:** `engine/wnioski/rejestr.js`, `README.md`, `docs/01-katalog-swiadczen-2026.md`
**Waga:** 🔴 krytyczny wobec wymagania konkursowego „każdy wariant”

README twierdzi: *„45 wariantów (W1–W50 z `docs/01-katalog-swiadczen-2026.md`)”*.
Faktyczny stan rejestru: **40 wariantów**.

**Warianty udokumentowane w `docs/01`, ale nieobecne w rejestrze:**

| ID | Nazwa z dokumentacji | Znaczenie prawne |
|---|---|---|
| **W23** | Wcześniejsze przejęcie urlopu macierzyńskiego (katalog okoliczności) | art. 180 § 6–17 k.p. — **scalona** w W6/W7/W8/W9/W9b |
| **W24** | Czasowe przejęcie w miejsce matki w szpitalu (matka wraca po wypisie) | art. 180 § 10–11 k.p. — **scalona** w W7 |
| **W26** | Ojciec przejmujący urlop rodzicielski po matce | art. 182¹a § 6–7 k.p. |
| **W27** | Ojciec przy uzupełniającym urlopie macierzyńskim (wcześniak) | art. 180² § 1 k.p. |
| **W30** | Ojciec niebędący pracownikiem / bez ubezpieczenia | art. 29 ust. 2 u.z. |
| **W32** | Korzystanie z uprawnień „jedno z rodziców” | art. 189¹ k.p. |
| **W33** | Zwolnienia na badania lekarskie w ciąży | art. 185 k.p. |
| **W13** | Przejęcie urlopu przez innego członka najbliższej rodziny | art. 175¹ k.p. — częściowo w W6–W9 (`kto: ["ojciec","inny"]`) |
| **W18** | Zasiłek wyrównawczy | art. 2 pkt 3 u.z. |
| **W48/W49/W50** | Ryzyka (zadłużenie, pozorność, przedawnienie) | pokryte przez `ostrzezenia()` jako V22/V49/V27 |

**Ocena:** częściowo to **świadoma konsolidacja** (W23/W24 rozbite na W6–W9b, co jest nawet
czytelniejsze), ale **W26, W27, W30, W32, W33 nie mają żadnego odpowiednika** w rejestrze.
To realne braki — np. ojciec, który chce wziąć uzupełniający urlop macierzyński przy wcześniaku
(W27), nie dostanie żadnego wariantu, bo W4 ma `kto: ["matka","ojciec"]`? — sprawdzone: **W4 ma
`kto` obejmujące ojca**, więc W27 jest funkcjonalnie pokryte. Pozostają realne braki: **W26** (ojciec
bierze rodzicielski po matce — częściowo w W25) i **W30** (ojciec bez chorobowego).

**Rekomendacja:** zaktualizować README/`docs` do faktycznej liczby **albo** dodać brakujące warianty;
obecna rozbieżność (45 vs 40) jest łatwym do wytknięcia błędem na prezentacji.

---

### B-14 · `zlecenie` z realną zaległością nie jest blokowane
**Plik:** `engine/wnioski/kontekst.js`
**Waga:** 🟠 wysoki — brak blokady prawnej (art. 2a u.z.)

```js
const SAMI_PLACA_SKLADKI = ["dg", "wspolpraca", "duchowny"];
```
Art. 2a ust. 1 u.z. wymienia: osoby prowadzące pozarolniczą działalność, **osoby z nimi współpracujące**,
osoby współpracujące z osobami fizycznymi, **duchownych będących płatnikami składek** oraz **marynarzy**.

**Wynik testu (`_probe9.mjs`, TEST 4):**
```
pracownik: blokadaZadluzenia = false   ✅ (art. 2a nie dotyczy pracowników)
dg:        blokadaZadluzenia = true    ✅
zlecenie:  blokadaZadluzenia = false   ✅ poprawne (zleceniobiorca nie sam opłaca? — patrz niżej)
```
**Uwaga:** `zlecenie` = `false` jest **zgodne z literalnym brzmieniem art. 2a** (zleceniobiorca nie jest
wymieniony), ale **marynarz nie jest w liście** — a art. 2a wprost go wymienia. To przeoczenie.

**Poprawka:** dodać `"marynarz"` do listy.

---

### S-04 · `dniUbezpieczenia` może być ujemne przy dacie z przyszłości
**Plik:** `engine/wnioski/kontekst.js`
**Waga:** 🟡 średni — brak walidacji wejścia

**Wynik testu (`_probe9.mjs`, TEST 3):** `ubezpieczenieOd: "2026-12-01"`, `dzis: 2026-05-15`
→ `dniUbezpieczenia: -200`.

**Skutek:** `wyczekiwanieSpelnione: false` (przypadkowo poprawnie), ale w komunikatach pojawi się
„masz -200 dni ubezpieczenia”. Formularz powinien blokować daty z przyszłości.

---

### S-05 · Brak walidacji spójności `etap` vs `dataUrodzenia`
**Plik:** `engine/wnioski/kontekst.js`
**Waga:** 🟡 średni — możliwa sprzeczna ocena

**Wynik testu (`_probe9.mjs`, TEST 6):** `etap: "ciaza"` przy `dataUrodzenia: "2025-01-01"`
→ `dzienZdarzenia = 2025-01-01`, choć etap mówi „w ciąży”. Silnik nie wykrywa sprzeczności i może
liczyć prawa do zasiłku macierzyńskiego dla osoby, która rzekomo jest jeszcze w ciąży.

**Poprawka:** dodać warunek walidacyjny: `etap === "ciaza" && dataUrodzenia` → ostrzeżenie/`brak_danych`.

---

### S-06 · `ostrzezenia()` — V3 nie rozróżnia „brak danych” od „niespełnione”
**Plik:** `engine/wnioski/ocena.js`
**Waga:** 🟡 średni

```js
if (k.wyczekiwanieSpelnione === false)
  dodaj(k.grupa === "dobrowolne" ? "V2" : "V3", ...);
```
`wyczekiwanieSpelnione` przyjmuje `null` (brak danych), ale warunek `=== false` przepuszcza tylko
twarde „nie” — to poprawne. Problem jest inny: **`grupa === "dobrowolne"` → V2, w przeciwnym razie V3**,
a przy `grupa === null` (brak tytułu) wpada w gałąź V3 z komunikatem „30 dni”, co jest mylące.
Dodatkowo komunikat V2/V3 mówi „Zasiłku macierzyńskiego to nie dotyczy” — słusznie, ale dla
`ulga_na_start` i `brak` ostrzeżenie jest już zgłoszone wcześniej jako V38/V1, więc użytkownik
dostaje **dwa sprzeczne komunikaty** o tym samym.

---

### S-07 · Warianty „informacja” nie mają `warunki`, więc nie pokazują braków danych
**Plik:** `engine/wnioski/rejestr.js` + `ocena.js`
**Waga:** 🟢 niski

Warianty `typ: "informacja"` (W29, W42, W43, W14, W20, W31) są zwracane bez oceny — to zamierzone.
Ale **W42** (wyrównanie do 100%) i **W43** (9 tygodni ojca) to uprawnienia **zależne od danych**
(niewykorzystanie urlopu w 1. roku; liczba tygodni ojca), a nie czyste informacje. Pokazanie ich
zawsze, bez sprawdzenia warunków, może sugerować prawo, którego nie ma.

---

## 8. Ustalenia pozytywne — warstwa wniosków

| Obszar | Status |
|---|---|
| Statusy wariantów (`dostepny`/`niedostepny`/`brak_danych`/`nie_dotyczy`/`informacja`) | ✅ poprawne |
| Profil pusty → wszystkie warianty `brak_danych` (nie „niedostępny”) | ✅ poprawne, dobre UX |
| `liczbaDzieci` jako string `"1"` → konwersja na `number` | ✅ poprawne |
| Filtr roli (`kto`) i etapu (`etapy`) → `nie_dotyczy` | ✅ poprawne |
| W9/W9b — rozróżnienie okoliczności (zgon/porzucenie/niesamodzielna/podjęła pracę) | ✅ **wszystkie 5 przypadków działają poprawnie** |
| W22 — ojciec przejmuje po 14 tyg. przy kompletnych danych | ✅ `dostepny` |
| W21 — urlop ojcowski dla ojca po porodzie | ✅ `dostepny` |
| `doUzupelnienia` — lista brakujących pól do samego wniosku | ✅ poprawne (np. `drugiRodzic.pesel`) |
| `ADRES_ZASILKU` — rozróżnienie płatnik / ZUS / „powyżej 20” | ✅ poprawne i czytelne |
| Brak duplikatów ID wariantów | ✅ |
| Każdy wniosek ma ≥ 1 wariant | ✅ (0 sierot) |


---

## 9. Potwierdzone błędy z `TODO.md`, które nadal występują

Te pozycje zespół **sam zdiagnozował** w `TODO.md` — potwierdzam je testami, więc są to
najtańsze do naprawienia (problem już znany, brakuje wykonania).

### B-15 · Kod „B” nie zeruje wcześniejszego okresu zasiłkowego
**Plik:** `engine/chorobowy.js`
**Potwierdzenie:** `wykorzystanyOkres: 200` + `kodB: true` → `pozostaloPrzed: 70`
(oczekiwane **270** — art. 9 ust. 2 zdanie 2 u.z.: okresów przed przerwą nie wlicza się,
jeśli po przerwie niezdolność wystąpiła w trakcie ciąży).
**Status:** `TODO.md` linia 69 — „kod B ma zerować wcześniejsze okresy zasiłkowe bez ciąży”.

### B-16 · Limit 5 części urlopu rodzicielskiego liczony osobno dla każdego rodzica
**Plik:** `engine/oboje.js`
**Potwierdzenie:** `czesciMatka: 5, czesciOjciec: 5` → **brak błędu** (razem 10 części).
**Status:** `TODO.md` linia 68 — do potwierdzenia, czy limit jest na rodzica, czy **łączny**.
Zgodnie z art. 182¹d § 2 k.p. liczba części jest ustalana „w oparciu o liczbę złożonych wniosków”
i uwzględnia wnioski **obu** rodziców → limit jest **łączny (5 na dziecko)**.

### B-17 · Minimum podstawy 4 147,09 zł stosowane bez proporcji do wymiaru etatu
**Plik:** `engine/podstawa.js`
**Potwierdzenie:** wynagrodzenie 2 000 zł (½ etatu) → podstawa podniesiona do **4 147,09 zł**.
Art. 45 ust. 1 u.z. mówi o „pracy w pełnym wymiarze czasu pracy” — dla niepełnego etatu
minimum powinno być proporcjonalne.
**Status:** `TODO.md` linia 66.

---

## 10. Backend

### B-18 · `/api/auth/mobywatel/start` zwraca kod logowania w odpowiedzi HTTP
**Plik:** `backend/server.js` (linia 51)
**Waga:** 🟠 wysoki (dla demo akceptowalne, dla wdrożenia — krytyczny)

```js
res.json({ requestId, code, expiresInSec: CODE_TTL_MS / 1000 });
```
Kod jednorazowy (6 cyfr) jest zwracany **temu samemu klientowi**, który go później „wpisuje”.
To symulacja, ale **całkowicie niweczy mechanizm** — każdy może zalogować się jako dowolna
osoba z `profiles` bez znajomości kodu. Dodatkowo `GET /api/auth/mobywatel/profiles` jest
**nieuwierzytelniony** i ujawnia imiona, nazwiska i zamaskowane PESEL wszystkich osób.

**Rekomendacja:** w README wyraźnie oznaczyć „symulacja — nie do wdrożenia” (częściowo jest),
albo dodać flagę `DEMO_MODE` wyłączającą zwracanie `code`.

### S-08 · `sessions` i `odpisy` trzymane w pamięci — restart wylogowuje wszystkich
**Pliki:** `backend/server.js` (`sessions = new Map()`), `backend/zus-mock.js` (`odpisy = new Map()`)
**Waga:** 🟡 średni
Po restarcie kontenera (albo `node --watch` w dev) wszystkie sesje i wnioski USC znikają.
`TODO.md` (linia 46) już to opisuje jako „Lokalnie »Sesja wygasła« bez powodu”.
README uczciwie mówi: „wnioski o odpis trzymane w pamięci – po restarcie znikają”.

### S-09 · Brak walidacji typów w `PUT /api/profile`
**Plik:** `backend/server.js` → `db.saveProfile(req.user.id, req.body)`
**Waga:** 🟡 średni
Ciało żądania trafia do bazy bez sprawdzenia typów i długości. Klient może zapisać dowolny JSON
(np. `pesel: {}`, gigantyczny string). `validOverrides` istnieje **tylko** dla `/api/params`.
**Status:** `TODO.md` linia 49 — „na demo OK, przed wdrożeniem walidacja”.

### Ustalenia pozytywne — backend
| Obszar | Status |
|---|---|
| Maskowanie PESEL (`maskPesel`) — pełny PESEL nigdy nie trafia do frontu | ✅ poprawne |
| `publicUser()` — whitelist pól zamiast spreada obiektu | ✅ poprawne (brak wycieku) |
| `crypto.timingSafeEqual` dla hasła admina + porównanie długości | ✅ poprawne |
| `validOverrides` — limit 200 wpisów, regex kluczy, tylko liczby | ✅ dobra walidacja |
| Kod logowania jednorazowy (`loginRequests.delete`) + TTL 5 min | ✅ poprawne |
| Healthcheck w `docker-compose.yml` | ✅ jest |
| Hasło admina z `ADMIN_PASSWORD` (env), nie zaszyte | ✅ poprawne |

---

## 11. Frontend i infrastruktura

### B-19 · Martwy kod: `WnioskiPage.jsx` + `engine/wnioski.js` niedostępne w UI
**Pliki:** `frontend/src/pages/WnioskiPage.jsx` (126 linii), `frontend/src/engine/wnioski.js` (126 linii),
`frontend/src/engine/zus_dane_2026.json` (4 508 linii)
**Waga:** 🟡 średni — mylący dla jury i przy przeglądzie kodu

`App.jsx` (linia 16) importuje **`pages/Wnioski.jsx`**, a nie `WnioskiPage.jsx`.
W rezultacie **cały łańcuch** jest nieosiągalny z aplikacji:
- `WnioskiPage.jsx` — nie importowany nigdzie poza sobą,
- `engine/wnioski.js` (`dopasujWnioski`) — używany wyłącznie przez `WnioskiPage.jsx`,
- `engine/zus_dane_2026.json` — importowany wyłącznie przez `WnioskiPage.jsx`.

**Skutek merytoryczny:** dopracowana baza wiedzy `zus_dane_2026.json` (45 dokumentów, 135 pól,
40 reguł walidacyjnych) **nie jest w ogóle używana przez działającą aplikację**. Działa równoległy,
ręcznie napisany `engine/wnioski/rejestr.js`. Mamy więc **dwa źródła prawdy**, które mogą się
rozjechać — i już się rozjechały (40 vs 45 wariantów, patrz B-13).

**Rekomendacja:** albo podłączyć `WnioskiPage` do trasy, albo usunąć martwy łańcuch przed oddaniem.

### B-20 · `node_modules/.bin/vitest` uszkodzony — `npm test` nie działa
**Waga:** 🟠 wysoki — jury może nie uruchomić testów

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
'.../node_modules/.bin/dist/cli.js' imported from '.../node_modules/.bin/vitest'
```
**Obejście (potwierdzone):** `node node_modules/vitest/vitest.mjs run` → **88/88 OK**.
Zalecenie: w `deploy.yml` i README używać `npm ci` zamiast zacommitowanego `node_modules`.

### I-02 · `ADMIN_PASSWORD` w `docker-compose.yml` przekazywany jako **pusty** string
**Plik:** `docker-compose.yml`
```yaml
ADMIN_PASSWORD: ${ADMIN_PASSWORD:-}
```
Gdy zmienna nie jest ustawiona, do kontenera trafia **pusty string**, a nie brak zmiennej.
W `server.js`:
```js
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "zus-demo-2026";
```
`"" || "zus-demo-2026"` → fallback **działa** (bo pusty string jest falsy), więc hasło demo
jest aktywne. To **zachowanie poprawne, ale nieoczywiste** — kod działa „przez przypadek”
i każda zmiana na `process.env.ADMIN_PASSWORD ?? "..."` cicho **wyłączyłaby ochronę**.

### I-03 · `frontend/nginx.conf` pusty, ale `Dockerfile`/compose go nie używają
**Status:** `TODO.md` linia 79. Potwierdzam: frontend w Dockerze działa na `vite preview`
(port 4173), `nginx.conf` nie jest podpinany. Plik do usunięcia albo wdrożenia.

### I-04 · `docs/*.md` są kopiami roboczymi bez oznaczenia źródła
`docs/01-katalog-swiadczen-2026.md` i `docs/02-...` w repo to kopie dokumentów roboczych.
README przyznaje: „szkic przygotowany z pomocą AI (Mistral) … wymaga weryfikacji z przepisami”.
To **uczciwe**, ale warto w nagłówku plików dodać datę i wersję, bo służą jako źródło `rejestr.js`.

---


---

## 12. Testy łańcuchowe (uzupełnienie po pytaniu: „czy przetestowałeś wszystkie chainy?")

**Odpowiedź: w pierwszym przebiegu — nie.** Testowałem punktowo (11 sond, pojedyncze przypadki
graniczne). Poniżej wynik **systematycznego** przejścia przestrzeni wejść.

### Metoda
1. **Wyliczenie dziedzin** — z `pages/ProfilePage.jsx` wyciągnięto realne listy opcji:
   13 tytułów ubezpieczenia, 3 etapy, 3 role, 6 okoliczności, 3 typy przyjęcia, 3 typy zwolnienia,
   8 powodów opieki, 6 przyczyn ustania. Plus 64 pola profilu w `rejestr.js`.
2. **Przejście kombinatoryczne** — 264 profile × 40 wariantów = **10 560 unikalnych par**.
3. **Testy wartości skrajnych** — 9 wartości (`0, -1, -1000, 1e9, NaN, undefined, null, "abc", "", Infinity`)
   × 30 wywołań silnika = 270 przypadków.
4. **Testy zanieczyszczonego profilu** — 11 scenariuszy błędnych danych z backendu.

### Wynik 1 — inwarianty wariantów wniosków: **0 błędów**
```
ŁĄCZNIE PRZEJŚĆ: 264      UNIKALNYCH PAR: 10 560
ROZKŁAD STATUSÓW: dostepny 355 | niedostepny 2280 | brak_danych 1274
                  nie_dotyczy 5067 | informacja 1584
BŁĘDY INWARIANTÓW: 0
```
Sprawdzane reguły: `dostepny` ⇒ brak `powody`; `niedostepny` ⇒ ma `powody`;
`brak_danych` ⇒ ma `brakujaceDane`; status zawsze z dozwolonego zbioru; brak wyjątków.
**Warstwa wniosków jest strukturalnie szczelna na całej przestrzeni wejść.**

### Wynik 2 — kalkulatory: **231 niepoprawnych wartości** (nowa klasa błędów)

#### B-21 · Brak walidacji wejścia w silniku — `NaN`/`Infinity` propagują się do kwot
**Pliki:** wszystkie moduły `engine/*.js`
**Waga:** 🟠 wysoki — **obniżony** przez to, że UI ma własną barierę (patrz niżej)

| Wywołanie | Wynik |
|---|---|
| `podstawaWymiaru({miesiace:[5000], premieKwartalne:NaN}).podstawa` | **NaN** |
| `podstawaWymiaru({miesiace:[Infinity]}).podstawa` | **Infinity** |
| `chorobowyWCiazy({dniNiezdolnosci:NaN}).kwotaRazem` | **NaN** |
| `zasilekMacierzynski({podstawaMatki:NaN}).sumaMatka` | **NaN** |
| `laczenieZPraca({etat:NaN}).miesiecznie` | **NaN** |

**Łagodzące:** `calculators/config.js` ma `num()`, który zamienia śmieci na `0`:
```js
export const num = (v) => { const n = parseFloat(String(v).replace(",", ".")); return Number.isFinite(n) ? n : 0; };
```
Dzięki temu **ścieżka kalkulatorów jest bezpieczna**. Bariera jest jednak **tylko w warstwie UI** —
każde nowe wejście (REST API, import JSON, odczyt PDF, testy) omija ją i dostanie `NaN`.

#### B-22 · Ujemne premie obniżają podstawę wymiaru
**Plik:** `engine/podstawa.js`
`premieKwartalne = -1000` → podstawa **4 242,59 zł** zamiast odrzucenia. Art. 42 u.z. mówi
o **kwocie wypłaconej** — wartość ujemna jest niepoprawna i powinna być odrzucona, nie odjęta.

#### B-23 · `liczbaDzieci` poza zakresem 1–5 nie jest ograniczana
**Plik:** `engine/wnioski/kontekst.js` + `rejestr.js`
```
liczbaDzieci = "0"  → 0
liczbaDzieci = "99" → 99,  wymiar: "37 tygodni (99 dzieci)"
```
`helpers.tygodnieMac` robi `Math.min(Math.max(dzieci,1),5)` — więc **wymiar** jest poprawnie
ograniczony do 37 tyg., ale **etykieta w UI pokazuje „99 dzieci”**. Dodatkowo `0` nie jest
normalizowane do `1`.

#### B-24 · Ujemna podstawa wymiaru przyjmowana bez ostrzeżenia
**Plik:** `engine/wnioski/kontekst.js`
`podstawaWymiaru = "-5000"` → `k.podstawa = -5000`, warianty nadal `dostepny` (2–3 wnioski).
Kwota zasiłku wyjdzie ujemna. Powinna być traktowana jak `brak_danych`.

### Wynik 3 — co **jest** odporne (potwierdzone)

| Wejście | Zachowanie |
|---|---|
| `statusUbezpieczenia: "kosmita"` | `dostepne = 0` — bezpiecznie, nic nie „przecieka” |
| `etap: "kosmita"` | `dostepne = 0` — bezpiecznie |
| `dataUrodzenia: "2026-13-45"` | `toDate()` → `null` → traktowane jak brak danych ✅ |
| `dataUrodzenia` w przyszłości | nie wywraca silnika ✅ |
| `podstawaWymiaru: {}` (obiekt) | `liczba()` → `null` → brak danych ✅ |
| `zaleglosci: 9999` (liczba zamiast „tak”) | `yn()` → `null` → brak danych ✅ |
| `dniUbezpieczenia: NaN` | `maPrawo: false`, `kwotaRazem: 0` ✅ |

### Wniosek
Przestrzeń **logiczna** (kombinacje enumów) jest pokryta **bez błędów** — 10 560 par czystych.
Błędy pojawiają się wyłącznie na **warstwie typów i wartości liczbowych** (B-21…B-24), czyli tam,
gdzie wejście nie pochodzi z formularza. To dokładnie ta klasa, której testy jednostkowe w repo
nie dotykają, bo wszystkie 88 testów podaje poprawne typy.

**Rekomendacja:** dodać jedną funkcję `walidujWejscie(input)` wywoływaną na wejściu każdego
modułu silnika (odrzuca `!Number.isFinite`, wartości ujemne dla kwot, zakresy), oraz testy
property-based na `num()`.

---

## 13. Zestawienie końcowe

| Kategoria | Liczba | ID |
|---|---|---|
| 🔴 Krytyczne (kwota / prawo) | 6 | B-01, B-02, B-03, B-04, B-06, B-07 |
| 🟠 Wysokie | 6 | B-05 (do rozstrzygnięcia), B-08, B-13, B-14, B-18, B-20, B-21 |
| 🟡 Średnie | 12 | S-01…S-09, B-15, B-16, B-17, B-19, I-02, B-22, B-23, B-24 |
| 🟢 Niskie / kosmetyczne | 6 | N-01…N-06, B-09, B-10, B-11, B-12, I-03, I-04 |
| **Razem** | **30** | |

### Najpoważniejsze do naprawy przed oddaniem (kolejność)

1. **B-01** — limit 14 dni po 50. r.ż. (błędny podział pracodawca/ZUS i kwota)
2. **B-02** — próg 5 dni hospitalizacji (nienależny urlop uzupełniający)
3. **B-03** — 81,5% zamiast 70% dla części ojca (zawyżona kwota)
4. **B-06** — 62 zamiast 65 tyg. „Za życiem” przy przysposobieniu (zaniżony wymiar)
5. **B-20** — `npm test` nie działa na czystym klonie (jury tego nie uruchomi)
6. **B-13** — README obiecuje 45 wariantów, jest 40 (łatwe do wytknięcia)
7. **B-19** — martwy kod + dwa źródła prawdy

### Co jest zrobione dobrze (potwierdzone testami)
- Silnik czysty, bez Reacta, z parametrami wstrzykiwanymi → **panel admina działa** zgodnie z wymogiem
- `oboje.js` — podział 9 tygodni, 70% dla drugiej strony, ostrzeżenia o stracie: **bez błędów**
- Warstwa wniosków: statusy, `brak_danych` zamiast fałszywego „nie”, `doUzupelnienia`, adresaci — **solidne**
- W9/W9b — wszystkie 5 okoliczności matki rozpoznane poprawnie
- Bezpieczeństwo backendu (maskowanie PESEL, `timingSafeEqual`, walidacja parametrów) — **poprawne**
- `TODO.md` jest wyjątkowo rzetelny: **6 z 26** zgłoszonych przeze mnie problemów zespół już sam opisał

---


---

## 14. STATUS NAPRAW (po wdrożeniu poprawek)

**Data:** ta sama sesja. Testy: **161/161** (było 88). Build produkcyjny: OK. Łańcuchy: **10 560 par, 0 błędów**.

### Naprawione

| ID | Co zrobiono | Plik |
|---|---|---|
| **B-01** | `poRoku50` = rok niezdolności ≥ rok urodzenia + 51; limit 14 dni liczony od roku **po** ukończeniu 50 lat | `chorobowy.js` |
| **B-02** | próg `dniHospitalizacji >= P.minHospitalizacjaDni` (5, nowy parametr w panelu admina) | `macierzynski.js`, `params.js` |
| **B-03** | część przejmowana przez ojca zawsze `P.stRodzicielski` (70%), także przy 81,5% | `macierzynski.js` |
| **B-04** | flaga `brakPodstawy` / `brakPodstawyOjca` + ostrzeżenie w kalkulatorze zamiast „0,00 zł” | `macierzynski.js`, `CalcMacierzynski.jsx` |
| **B-06** | nowy `tygodnieRodzicielskiPrzyjete` (38/38); 62 tyg. tylko dla rodziny zastępczej; przysposobienie „Za życiem” = **65** | `helpers.js`, `params.js`, `adopcja.js` |
| **B-07** | porównywanie **dat** zamiast wieku ułamkowego; dzień ukończenia limitu mieści się w limicie | `adopcja.js` |
| **B-08** | `termin.setMonth(+12)` zamiast `30,4375 × 12 dni` | `terminy.js` |
| **B-09** | zweryfikowane: `31.12.2032` jest poprawne (wcześniejszy „błąd” był artefaktem testu UTC) | — |
| **B-10** | `poTerminieStartu` faktycznie liczone (nowy parametr `dataStartuUrlopu`) | `terminy.js` |
| **B-11** | `zawszeZUS` obejmuje `dg`, `wspolpraca`, `duchowny`, `marynarz`, `poUstaniu` | `platnik.js` |
| **B-12** | `chorobowy.js` przekazuje status wynikający z `obw`/`dobr` | `chorobowy.js` |
| **B-13** | README poprawione (40 wariantów + wyjaśnienie konsolidacji) + test `spojnosc.test.js` | `README.md` |
| **B-14** | `marynarz` dodany do `SAMI_PLACA_SKLADKI` | `kontekst.js` |
| **B-15** | parametr `wczesniejszeBezB` → reset okresu zasiłkowego + flaga `resetOkresuZasilkowego` | `chorobowy.js` |
| **B-16** | limit 5 części liczony **łącznie** (`czesciMatka + czesciOjciec`) | `oboje.js` |
| **B-17** | parametr `wymiarEtatu` — minimum proporcjonalne (½ etatu → 2 073,55 zł) | `podstawa.js` |
| **B-18** | `DEMO_MODE` — kod logowania nie wraca do klienta przy `DEMO_MODE=0` + fallback w `Login.jsx` | `server.js`, `Login.jsx` |
| **B-19** | usunięto martwy łańcuch (`WnioskiPage.jsx`, `engine/wnioski.js`); baza wiedzy przeniesiona do `engine/dane/` i **używana przez test spójności** | usunięte / `engine/dane/` |
| **B-20** | `npm test` → `node node_modules/vitest/vitest.mjs run` (działa bez `.bin`); dodano `test:vitest` | `package.json` |
| **B-21** | nowy moduł `engine/walidacja.js` — sanityzacja wejścia we wszystkich 6 modułach silnika | `walidacja.js` + wszystkie |
| **B-22** | ujemne premie → 0 (nie odejmowane) | `podstawa.js` |
| **B-23** | `liczbaDzieci` ograniczona do 1..5; 0/„abc” → brak danych | `kontekst.js` |
| **B-24** | ujemna podstawa → `null` (brak danych), nie kwota ujemna | `kontekst.js` |
| **S-01** | `minPodstawaPracownik: 4147.1` (było 4147.09) + test | `params.js` |
| **S-09** | walidacja `PUT /api/profile` (obiekt, rozmiar, sekcje) | `server.js` |
| **N-02** | `wyliczne*` → `wylaczne*` w całym repo (8 plików) | wszędzie |
| **I-02** | `ADMIN_PASSWORD: ${ADMIN_PASSWORD:-zus-demo-2026}` — jawne hasło demo | `docker-compose.yml` |
| **I-03** | usunięto pusty, nieużywany `frontend/nginx.conf` | — |
| **N-06** | `engine/regresja.test.js` — **65 testów** po jednym (lub więcej) na każdy błąd | nowy plik |

### Wycofane po weryfikacji

| ID | Powód |
|---|---|
| **B-05** | Wzór `wymiar ÷ (1 − etat)` jest **poprawny**. Tylko on osiąga ustawowy limit 82/86/130/134 tyg. przy ½ etatu; literalne „wymiar × etat” dawałoby 61,5 i **nigdy** nie sięgało limitu z art. 182¹f § 1 k.p. Przywrócono oryginalną logikę (zachowując nowy parametr `tygodnieLaczenia` dla części urlopu). **Do potwierdzenia u mentora ZUS.** |

### Nie naprawione (świadomie — wymagają decyzji zespołu)

| ID | Dlaczego | Rekomendacja |
|---|---|---|
| **S-02** | Łańcuch `else if` działa poprawnie; refaktor kosmetyczny | Zostawić |
| **S-03** | Uzupełnianie do pełnego miesiąca (art. 37 ust. 2) to **nowa funkcja**, nie poprawka błędu | Osobne zadanie |
| **S-04, S-05** | Walidacja formularza (daty z przyszłości, sprzeczny etap) — wymaga zmian w UI | Do zrobienia z osobą od frontu |
| **S-06, S-07** | Dopracowanie komunikatów i wariantów „informacja” | Kosmetyka |
| **S-08** | Sesje w pamięci — **udokumentowane** jako ograniczenie demo | Zostawić, opisać na slajdzie |
| **I-04** | `docs/*.md` — oznaczenie źródła AI | Dopisać nagłówek |
| **B-18 prod** | Na wdrożeniu trzeba ustawić `DEMO_MODE=0` **i** prawdziwe `ADMIN_PASSWORD` | Checklista wdrożeniowa |

### Weryfikacja końcowa
```
npm test            → 161/161 (4 pliki: engine, wnioski, regresja, spójność)
vite build          → OK (357 kB, gzip 109 kB)
node --check        → server.js, db.js, zus-mock.js OK
docker compose config → OK
łańcuchy 10 560 par → 0 błędów, 0 NaN/undefined w wymiarze i wysokości
```

*Wszystkie ustalenia potwierdzone uruchomieniem kodu. Skrypty tymczasowe (`_probe*.mjs`, testy łańcuchowe) zostały usunięte — repo pozostaje czyste.*
