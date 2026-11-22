# Szablony pism — LaTeX

Gotowe do druku pisma ZUS (świadczenia rodzicielskie, stan 2026) wygenerowane
z `../szablony_pism_2026.yaml`.

## Co jest w katalogu

| Plik / katalog | Zawartość |
| --- | --- |
| `gen_latex.py` | generator: czyta YAML → pisze pliki `.tex` i kopię `../frontend/src/engine/wnioski/latex_szablony.json` dla ekranu `/wnioski/druk` |
| `preamble.tex` | wspólna preambuła (fonty, kolory ZUS, makra pism) |
| `szablony/P01.tex … P16.tex` | **16 pojedynczych pism** — każdy kompiluje się sam |
| `szablony_pism.tex` | wszystkie szablony w jednym dokumencie (ze spisem treści) |
| `decyzje_zus.tex` | struktura decyzji ZUS + wzór odwołania |

## Kompilacja

Wymagany **XeLaTeX** albo **Tectonic** — nie `pdflatex` (polskie znaki idą przez
`fontspec`/`polyglossia`, a nie `inputenc`).

```bash
# pojedyncze pismo
tectonic -X compile latex/szablony/P01.tex

# wszystko naraz
tectonic -X compile latex/szablony_pism.tex
tectonic -X compile latex/decyzje_zus.tex

# albo xelatex
xelatex latex/szablony/P01.tex
```

Pierwsze uruchomienie Tectonic pobiera pakiety z sieci (kilkadziesiąt MB).

## Generowanie od nowa

Po każdej zmianie `szablony_pism_2026.yaml`:

```bash
python3 latex/gen_latex.py       # .tex + kopia JSON dla frontendu
```

Test `latex.test.js` pilnuje, żeby pliki `.tex` i kopia `latex_szablony.json`
nie rozjechały się z YAML-em.

## Jak wygląda pismo

- nagłówek: numer szablonu, nazwa, podstawa prawna i formularz ZUS (po prawej),
- blok nadawcy (imię, adres, PESEL) w osobnych wierszach,
- tytuł pisma wyśrodkowany, wersalikami,
- pola do wypełnienia: kropkowana linia + **nazwa pola** drobnym drukiem,
- sekcje warunkowe (np. „Za życiem”, martwe urodzenie) — pokazane wszystkie,
  do wyboru przy wypełnianiu,
- w stopce numer strony; na dole drobnym drukiem uwagi prawne.

## Pola

`\Pole{nazwa}` → kropkowana linia z podpisem. Wartości podstawia aplikacja
z profilu i formularza wniosku (patrz `szablony_pism_2026.yaml` → `placeholdery`),
albo wpisuje się ręcznie. Ekran `/wnioski/druk` zapisuje wypełniony **PDF**
(`frontend/src/engine/wnioski/latexDokument.js` przygotowuje LaTeX,
`pdfDokument.js` składa PDF); w mockupie to zamiast drukowania.
Bloki `\begin{warunek}{nazwa}` są w PDF filtrowane według danych sprawy
(np. martwe urodzenie, pełny wymiar 81,5%, przysposobienie).

## Ważne

- Pisma pracownicze (`pismo_pracodawca`) mają **dowolną formę** — można je drukować
  i składać.
- Wnioski do ZUS (`formularz_zus`) pokazują treść do **przeniesienia na formularz**
  (ZAM / Z-3 / Z-15A) — nie podrabiamy druku ZUS.
- Decyzji ZUS nie generujemy — `decyzje_zus.tex` to struktura do zrozumienia pisma
  i napisania odwołania.
