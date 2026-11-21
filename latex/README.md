# Szablony pism — LaTeX

Gotowe do druku pisma ZUS (świadczenia rodzicielskie, stan 2026) wygenerowane
z `../szablony_pism_2026.yaml`.

## Co jest w katalogu

| Plik / katalog | Zawartość |
| --- | --- |
| `gen_latex.py` | generator: czyta YAML → pisze pliki `.tex` |
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
python3 latex/gen_latex.py
```

Test `latex.test.js` pilnuje, żeby pliki `.tex` nie rozjechały się z YAML-em.

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
z profilu (patrz `szablony_pism_2026.yaml` → `placeholdery`) albo wpisuje się ręcznie.

## Ważne

- Pisma pracownicze (`pismo_pracodawca`) mają **dowolną formę** — można je drukować
  i składać.
- Wnioski do ZUS (`formularz_zus`) pokazują treść do **przeniesienia na formularz**
  (ZAM / Z-3 / Z-15A) — nie podrabiamy druku ZUS.
- Decyzji ZUS nie generujemy — `decyzje_zus.tex` to struktura do zrozumienia pisma
  i napisania odwołania.
