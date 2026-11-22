#!/usr/bin/env python3
"""
Konwerter szablonów pism (szablony_pism_2026.yaml) na LaTeX do druku.

Tworzy:
  latex/preamble.tex            – wspólna preambuła (XeLaTeX/Tectonic, polskie znaki)
  latex/szablony/<ID>.tex       – po jednym pliku na szablon (kompilowalny samodzielnie)
  latex/szablony_pism.tex       – wszystkie szablony w jednym dokumencie

Uruchomienie:  python3 latex/gen_latex.py
Kompilacja:    tectonic -X compile latex/szablony/P01.tex   (albo całości)
"""

import json
import os
import re
import yaml

TU = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(TU)
SRC = os.path.join(ROOT, "szablony_pism_2026.yaml")


# --------------------------------------------------------------------------
#  Zamiana znaków na bezpieczne dla LaTeX-a
# --------------------------------------------------------------------------
ZNAKI = {
    "\\": r"\textbackslash{}",
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}",
}


def esc(tekst: str) -> str:
    """Escapuje znaki specjalne LaTeX-a, zostawiając polskie znaki i typografię."""
    out = []
    for z in tekst:
        out.append(ZNAKI.get(z, z))
    return "".join(out)


# Znaki typograficzne zamieniamy na wersje LaTeX-owe (ładniejsze cudzysłowy).
TYPO = [
    ("„", "\\quotedblbase{}"),
    ("”", "\\textquotedblright{}"),
    ("–", "--"),
    ("—", "---"),
    ("…", "\\ldots{}"),
    ("²", "\\textsuperscript{2}"),
    ("¹", "\\textsuperscript{1}"),
    ("³", "\\textsuperscript{3}"),
    ("⁴", "\\textsuperscript{4}"),
    ("⁵", "\\textsuperscript{5}"),
    ("⁰", "\\textsuperscript{0}"),
    ("⁶", "\\textsuperscript{6}"),
    ("⁷", "\\textsuperscript{7}"),
    ("⁸", "\\textsuperscript{8}"),
    ("⁹", "\\textsuperscript{9}"),
    ("⁶", "$^{6}$"),
    ("⁷", "$^{7}$"),
    ("⁸", "$^{8}$"),
    ("⁹", "$^{9}$"),
    ("⁰", "$^{0}$"),
    ("§", "\\S{}"),
]


def typografia(tekst: str) -> str:
    """Escapuje, potem upiększa typografię. Kolejność ma znaczenie."""
    t = esc(tekst)
    for a, b in TYPO:
        t = t.replace(a, b)
    return t


# --------------------------------------------------------------------------
#  Renderowanie treści pisma
# --------------------------------------------------------------------------
WARUNEK = re.compile(r"\{\{#(jesli_\w+)\}\}(.*?)\{\{/\1\}\}", re.S)
PLACEHOLDER = re.compile(r"\{\{([a-z_ąćęłńóśźż]+)\}\}")


def renderuj_tresc(tresc: str, wariant: str) -> str:
    r"""
    Zamienia treść z YAML na ciało LaTeX-a.

    - bloki {{#jesli_x}}...{{/jesli_x}} → środowisko warunkowe
    - {{placeholder}} → \Pole{nazwa} (ramka do wypełnienia odręcznego)
    - pierwsze 3 niepuste linie (nadawca) → blok adresowy
    - WIELKIE LITERY w osobnej linii → nagłówek pisma
    """
    # bloki warunkowe zamieniamy na znaczniki, żeby ich nie escować podwójnie
    bloki = []

    def zbierz(m):
        bloki.append((m.group(1), m.group(2)))
        return f"@@WARUNEK{len(bloki) - 1}@@"

    t = WARUNEK.sub(zbierz, tresc)

    # placeholdery → \Pole{...}, reszta escapowana
    czesci = []
    poz = 0
    for m in PLACEHOLDER.finditer(t):
        czesci.append(typografia(t[poz:m.start()]))
        # etykieta pola czytelna w druku: podkreślniki → spacje
        czesci.append("\\Pole{%s}" % m.group(1).replace("_", " "))
        poz = m.end()
    czesci.append(typografia(t[poz:]))
    t = "".join(czesci)

    # wstaw z powrotem bloki warunkowe (renderowane rekurencyjnie)
    for i, (nazwa, tresc_bloku) in enumerate(bloki):
        wewn = renderuj_tresc(tresc_bloku.strip(), wariant + "?")
        t = t.replace(
            f"@@WARUNEK{i}@@",
            "\\begin{warunek}{%s}\n%s\n\\end{warunek}" % (nazwa, wewn.strip()),
        )

    return formatuj_akapity(t)


def formatuj_akapity(tekst: str) -> str:
    """
    Zamienia surowy tekst (już escapowany) na akapity LaTeX-a.

    - akapit = grupa niepustych linii
    - linia prawie wyłącznie z wielkich liter → nagłówek pisma
    - pierwszy akapit złożony z 2–4 krótkich wierszy → blok nadawcy,
      wiersze rozdzielone twardym przełamaniem ``\\\\``
    """
    akapity_surowe = re.split(r"\n\s*\n", tekst)
    akapity = []

    for ak in akapity_surowe:
        linie = [l.rstrip() for l in ak.split("\n") if l.strip()]
        if not linie:
            continue

        # nagłówek: jedna linia, dużo liter, prawie same wielkie
        if len(linie) == 1:
            gola = re.sub(r"\\[A-Za-z]{1,20}(\{[^}]*\})?", "", linie[0]).strip()
            litery = [c for c in gola if c.isalpha()]
            if len(litery) >= 8 and sum(c.isupper() for c in litery) / len(litery) > 0.85:
                akapity.append("\\NaglowekPisma{%s}" % linie[0].strip())
                continue

        akapity.append("\n".join(l.strip() for l in linie))

    if not akapity:
        return ""

    # blok nadawcy: pierwszy akapit z kilku krótkich wierszy
    pierwsze = akapity[0].split("\n")
    if 2 <= len(pierwsze) <= 4:
        akapity[0] = "\\\\[-2pt]\n".join(pierwsze)

    return "\n\n".join(akapity)


# --------------------------------------------------------------------------
#  Preambuła
# --------------------------------------------------------------------------
PREAMBULA = r"""% =====================================================================
%  Wspólna preambuła szablonów pism ZUS (świadczenia rodzicielskie 2026)
%  Silnik: XeLaTeX albo Tectonic (pdflatex NIE obsłuży polskich znaków w fontspec).
%  Kompilacja:  tectonic -X compile plik.tex
% =====================================================================
\documentclass[11pt,a4paper]{article}

\usepackage{fontspec}
\usepackage{polyglossia}
\setmainlanguage{polish}
\setotherlanguage{english}
% font domyślny (Latin Modern) — Tectonic go dostarcza

\usepackage[margin=2.5cm,a4paper]{geometry}
\usepackage{graphicx}
\usepackage{xcolor}
\usepackage{array}
\usepackage{enumitem}
\usepackage{fancyhdr}
\usepackage{hyperref}

\definecolor{zus}{HTML}{007A33}      % zieleń ZUS
\definecolor{szary}{HTML}{6B7280}
\definecolor{ramka}{HTML}{9CA3AF}

\hypersetup{colorlinks=true, linkcolor=zus, urlcolor=zus, pdftitle={Szablony pism ZUS}}

% --- pole do wypełnienia odręcznego -----------------------------------
% \Pole{nazwa} rysuje kropkowaną linię z podpisem pola pod spodem.
% Pole do wypełnienia: kropkowana linia, pod nią drobny podpis pola.
\newcommand{\Pole}[1]{%
  \textcolor{szary}{\dotfill}\,%
  {\scriptsize\textcolor{szary}{\textsc{#1}}}%
}

% --- blok warunkowy: treść pokazywana tylko, gdy pole prawdziwe --------
\newenvironment{warunek}[1]{%
  \par\smallskip\noindent\begin{minipage}{\linewidth}%
  \color{black}%
}{%
  \end{minipage}\par\smallskip%
}

% --- nagłówek pisma ---------------------------------------------------
\newcommand{\NaglowekPisma}[1]{%
  \par\vspace{0.8em}%
  \begin{center}%
    {\large\bfseries\MakeUppercase{#1}}%
  \end{center}%
  \vspace{0.4em}%
}

% --- blok nadawcy (pierwsze linie pisma) -------------------------------
\newenvironment{nadawca}{%
  \begin{flushleft}\small
}{%
  \end{flushleft}\normalsize
}

% --- stopka z numerem strony -----------------------------------------
\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0pt}
\fancyfoot[C]{\textcolor{szary}{\small\thepage}}

% --- metadane szablonu na początku pisma ------------------------------
\newcommand{\Metadane}[3]{%
  \begin{flushright}\footnotesize\textcolor{szary}%
    \textbf{#1}\\[2pt] {\itshape #2}\\[2pt] #3%
  \end{flushright}\vspace{0.5em}%
}

\setlength{\parindent}{0pt}
\setlength{\parskip}{0.6em}
"""


def zrob_dokument(szablon: dict, wszystkie=False) -> str:
    """Składa pełny plik .tex dla jednego szablonu."""
    tresc = renderuj_tresc(szablon["tresc"], szablon["id"])

    # każdy element metadanych escapowany OSOBNO, potem sklejany separatorem
    czesci_meta = [typografia(szablon.get("podstawa_prawna", ""))]
    if szablon.get("formularz_zus"):
        czesci_meta.append(typografia("Formularz: " + szablon["formularz_zus"]))
    metadane = " -- ".join(x for x in czesci_meta if x.strip())

    naglowek = (
        "\\begin{flushright}\n"
        "{\\footnotesize\\color{szary}\n"
        "\\textbf{%s}\\\\\n"
        "{\\itshape %s}\\\\\n"
        "%s}\\\n"
        "\\end{flushright}\n"
    ) % (
        esc("Szablon " + szablon["id"]),
        typografia(szablon["nazwa"]),
        metadane,
    )

    return (
        PREAMBULA
        + "\n\\begin{document}\n\n"
        + naglowek
        + "\n\\vspace{0.5em}\n{\\color{ramka}\\hrule height 0.4pt}\n\\vspace{0.8em}\n\n"
        + tresc
        + "\n\n"
        + (
            "\\vfill\n{\\footnotesize\\textcolor{szary}\\itshape "
            + typografia(szablon["uwagi"][:400]).replace("\n", " ")
            + "}\n"
            if szablon.get("uwagi")
            else ""
        )
        + "\n\\end{document}\n"
    )


def main():
    dane = yaml.safe_load(open(SRC, encoding="utf-8"))
    os.makedirs(os.path.join(TU, "szablony"), exist_ok=True)

    with open(os.path.join(TU, "preamble.tex"), "w", encoding="utf-8") as f:
        f.write(PREAMBULA)

    utworzone = []
    for s in dane["szablony"]:
        sciezka = os.path.join(TU, "szablony", f"{s['id']}.tex")
        with open(sciezka, "w", encoding="utf-8") as f:
            f.write(zrob_dokument(s))
        utworzone.append(s["id"])

    # --- dokument zbiorczy: wszystkie szablony w jednym PDF ---
    czesci = [
        PREAMBULA,
        "\\begin{document}\n",
        "\\begin{center}\n{\\LARGE\\bfseries Szablony pism ZUS}\\\\[4pt]\n"
        "{\\large Świadczenia rodzicielskie --- stan prawny 2026}\\\\[2pt]\n"
        "{\\small\\color{szary}%d szablonów, źródło: 89 spraw wzorcowych}\n"
        "\\end{center}\n" % len(dane["szablony"]),
        "\\tableofcontents\n\\clearpage\n",
    ]
    for s in dane["szablony"]:
        czesci.append("\\section{%s}" % typografia(s["nazwa"]))
        czesci.append("{\\small\\color{szary}Szablon %s \\textbullet{} %s}"
                      % (s["id"], typografia(s.get("podstawa_prawna", ""))))
        czesci.append(renderuj_tresc(s["tresc"], s["id"]))
        if s.get("uwagi"):
            czesci.append("\\vfill\n{\\footnotesize\\color{szary}\\itshape %s}"
                          % typografia(s["uwagi"]).replace("\n", " "))
        czesci.append("\\clearpage")
    czesci.append("\\end{document}\n")

    with open(os.path.join(TU, "szablony_pism.tex"), "w", encoding="utf-8") as f:
        f.write("\n\n".join(czesci))

    # --- kopia dla frontendu (obraz Dockera buduje się tylko z katalogu frontend) ---
    # Ekran /wnioski/druk podmienia w tych plikach \Pole{…} na dane i zapisuje .tex.
    front_dir = os.path.join(ROOT, "frontend", "src", "engine", "wnioski")
    os.makedirs(front_dir, exist_ok=True)

    def czytaj(sciezka: str) -> str:
        with open(sciezka, encoding="utf-8") as f:
            return f.read()

    frontend_dane = {
        "schema": "rodzicplus-latex-szablony/1",
        "preamble": PREAMBULA,
        "szablony": [
            {
                "id": s["id"],
                "nazwa": s["nazwa"],
                "wariant": s.get("wariant"),
                "kanal": s.get("kanal"),
                "tex": czytaj(os.path.join(TU, "szablony", f"{s['id']}.tex")),
            }
            for s in dane["szablony"]
        ],
    }
    with open(os.path.join(front_dir, "latex_szablony.json"), "w", encoding="utf-8") as f:
        json.dump(frontend_dane, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Zapisano preambułę i {len(utworzone)} plików .tex: {', '.join(utworzone)}")
    print("Zapisano dokument zbiorczy: szablony_pism.tex")
    print("Zapisano kopię dla frontendu: latex_szablony.json")

    # --- decyzje ZUS: struktura do zrozumienia pisma / odwołania ---
    decz = ["\\section*{Decyzje ZUS --- struktura pisma}",
            "{\\small\\color{szary}Decyzji ZUS nie generujemy. Poniższa struktura "
            "służy zrozumieniu pisma i przygotowaniu odwołania.}\\par\\medskip"]
    for d in dane.get("decyzje_zus", []):
        decz.append("\\subsection*{%s}" % typografia(d["typ"]))
        for punkt in d["struktura"]:
            decz.append("\\begin{itemize}\\item %s\\end{itemize}" % typografia(punkt))
        if d.get("tresc_odwolania"):
            decz.append("\\textbf{Wzór odwołania}\\par")
            decz.append(renderuj_tresc(d["tresc_odwolania"], d["id"]))
        if d.get("uwagi"):
            decz.append("{\\footnotesize\\color{szary}\\itshape %s}" % typografia(d["uwagi"]))
    with open(os.path.join(TU, "decyzje_zus.tex"), "w", encoding="utf-8") as f:
        f.write(PREAMBULA + "\n\\begin{document}\n" + "\n\n".join(decz) + "\n\\end{document}\n")
    print("Zapisano: decyzje_zus.tex")


if __name__ == "__main__":
    main()
