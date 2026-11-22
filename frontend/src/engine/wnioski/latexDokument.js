/* =====================================================================
   DOKUMENT DO DRUKU – ŹRÓDŁO LATEX (PDF składa pdfDokument.js).

   Szablony pism leżą w `latex/szablony/P01.tex … P16.tex` i są generowane
   z `szablony_pism_2026.yaml` przez `latex/gen_latex.py`. Tutaj:
   - bierzemy gotowy szablon LaTeX-a z wygenerowanego `latex_szablony.json`,
   - podmieniamy `\Pole{nazwa pola}` na dane z profilu / ekranu wniosku,
   - zwracamy kompletny plik `.tex` z podstawionymi danymi; `pdfDokument.js`
     tłumaczy go na PDF (mockup zamiast kompilacji Tectonic/XeLaTeX).

   Dla wariantów bez własnego szablonu tworzymy prosty dokument ogólny
   z tej samej preambuły, żeby każda opcja drukowania miała co zapisać.
   ===================================================================== */
import { D } from "./druki.js";
import { pobierzDaneDziecka } from "./dzieckoHelper.js";
import latexDane from "./latex_szablony.json";

/* Wygenerowane przez `python3 latex/gen_latex.py` z latex/szablony/*.tex.
   Trzymamy kopię w frontendzie, bo obraz Dockera buduje się z katalogu
   `frontend` i nie widzi katalogu `latex` w repo. */
const SZABLONY = Object.fromEntries(
  (latexDane.szablony ?? []).map((s) => [s.id, { id: s.id, nazwa: s.nazwa, tex: s.tex }]),
);
const preamble = latexDane.preamble ?? "";

/* Wariant wniosku (W…) → szablony LaTeX-a.
   Odtworzone z pól `wariant` w YAML-u (VAR… → benefit W…). Test
   `latex.test.js` pilnuje, żeby ta mapa nie rozjechała się ze źródłem. */
export const SZABLONY_LATEX = {
  W1: ["P01"],
  W2: ["P02"],
  W4: ["P16"],
  W10: ["P09", "P10"],
  W12: ["P14", "P15"],
  W17: ["P13"],
  W21: ["P05"],
  W25: ["P03", "P04", "P06", "P07"],
  W28: ["P12"],
  W34: ["P08"],
  W38: ["P11"],
};

/** Szablony LaTeX-a dostępne dla danego wariantu (mogą być 2–4 do wyboru). */
export function szablonyDlaWariantu(wariantId) {
  return (SZABLONY_LATEX[wariantId] ?? [])
    .map((id) => SZABLONY[id])
    .filter(Boolean)
    .map(({ id, nazwa }) => ({ id, nazwa }));
}

/* ---------- pomocnicze: tekst, daty, liczba dzieci ---------- */
const tekst = (v) => (v === undefined || v === null ? "" : String(v).trim());

const dataISO = (v) => {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? "")) ? String(v) : "";
};

const dataPL = (v) => {
  const s = dataISO(v);
  return s ? `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}` : "";
};

const scal = (...czesci) => czesci.map(tekst).filter(Boolean).join(" ").trim();

const miejscowoscZAdresu = (adres) =>
  (tekst(adres).match(/\d{2}-\d{3}\s+([^,\d]+)/)?.[1] ?? "").trim();

const dniMiedzy = (od, doDnia) => {
  if (!dataISO(od) || !dataISO(doDnia)) return null;
  return Math.round((Date.parse(dataISO(doDnia)) - Date.parse(dataISO(od))) / 86400000);
};

const LICZBA_DZIECI_PL = {
  1: "jednego",
  2: "dwojga",
  3: "trojga",
  4: "czworga",
  5: "pięciorga",
  6: "sześciorga",
};

const TYDZIEN_CIAZY = {
  ponizej_28: "poniżej 28.",
  "28_37": "28–37.",
  po_37: "po 37.",
};

/** Etykiety z profilu, które trafiają do szablonu bez zmian. */
function daneZProfilu(profil = {}) {
  const u = profil.ubezpieczony ?? {};
  const pl = profil.platnik ?? {};
  const dz = profil.dziecko ?? {};
  const dr = profil.drugiRodzic ?? {};
  const ur = profil.urlopy ?? {};
  const d = pobierzDaneDziecka(profil);
  return {
    imie: scal(u.imie, u.nazwisko),
    adres: tekst(u.adres),
    pesel: tekst(u.peselMasked || u.pesel),
    telefon: tekst(u.telefon),
    platnik_nazwa: tekst(pl.nazwa),
    platnik_nip: tekst(pl.nip),
    platnik_adres: tekst(pl.adres),
    dziecko_imie: scal(d.imie, d.nazwisko),
    dziecko_pesel: tekst(d.pesel),
    liczba_dzieci: tekst(d.liczbaDzieci),
    drugi_rodzic: scal(dr.imie, dr.nazwisko),
    tydzien_ciazy: TYDZIEN_CIAZY[tekst(d.tydzienCiazy || dz.tydzienCiazy)] || tekst(d.tydzienCiazy || dz.tydzienCiazy),
    masa: tekst(d.masaUrodzenia || dz.masaUrodzenia),
    szpital_od: dataPL(d.szpitalOd || dz.szpitalOd),
    szpital_do: dataPL(d.szpitalDo || dz.szpitalDo),
    wymiar_etatu: tekst(u.wymiarEtatu) === "pelny" ? "1" : tekst(u.wymiarEtatu) === "czesc" ? "część" : tekst(u.wymiarEtatu),
    podstawa: tekst(u.podstawaWymiaru),
    tygodnie_matka: tekst(ur.macierzynskiWykorzystanoTyg),
    data_zdarzenia: dataPL(d.dataZgonu || dz.dataZgonu || dr.dataOkolicznosci),
  };
}

/**
 * Dane do podmiany w `\Pole{…}`. Nazwy kluczy odpowiadają szablonom
 * (podkreślniki zamiast spacji: `urlop_od`, `data_pisma` itd.).
 */
export function daneDoLatex(druk, profil = {}) {
  const zProfilu = daneZProfilu(profil);
  const pola = Object.fromEntries((druk?.pola ?? []).map((p) => [p.id, tekst(p.wartosc)]));
  const p = (id) => pola[id] ?? "";

  const d = pobierzDaneDziecka(profil);
  const urlopy = profil.urlopy ?? {};
  const drugiRodzic = profil.drugiRodzic ?? {};

  const dataPisma = p("dataZlozenia") || dataISO(new Date());
  const liczbaDzieci = Number(p("liczbaDzieci") || zProfilu.liczba_dzieci || 1);

  const urlopOd = p("od") || p("urlopOd") || urlopy.rodzicielskiOd || urlopy.urlopPrzedPorodemOd;
  const urlopDo = p("do") || p("urlopDo") || urlopy.rodzicielskiDo;
  const pdp = p("pdp") || d.przewidywanaDataPorodu;
  const dataPorodu = p("porod") || p("dzieckoUr") || d.dataUrodzenia || d.przewidywanaDataPorodu;

  // Wymiar urlopu: najpierw z dat, potem z pól przekazanych przez ekran.
  let tygodnie = p("tygodnie");
  const dniUrlopu = dniMiedzy(urlopOd, urlopDo);
  if (!tygodnie && dniUrlopu !== null && dniUrlopu >= 0) tygodnie = String(Math.round((dniUrlopu + 1) / 7));
  if (!tygodnie && pdp && urlopOd) {
    const dniPrzedPorodem = dniMiedzy(urlopOd, pdp);
    if (dniPrzedPorodem !== null && dniPrzedPorodem >= 0) tygodnie = String(Math.max(1, Math.ceil((dniPrzedPorodem + 1) / 7)));
  }

  const dniHospitalizacji = (() => {
    const szpOd = d.szpitalOd;
    const szpDo = d.szpitalDo;
    const dz = profil.dziecko ?? {};
    const d1 = dniMiedzy(szpOd, szpDo);
    const d2 = dniMiedzy(dz.szpitalOd, dz.szpitalDo);
    const result = d1 !== null && d1 >= 0 ? d1 : (d2 !== null && d2 >= 0 ? d2 : null);
    return result === null || result < 0 ? "" : String(result + 1);
  })();

  return {
    ...zProfilu,
    imie: p("imie") || zProfilu.imie,
    adres: p("adres") || zProfilu.adres,
    pesel: p("pesel") || zProfilu.pesel,
    platnik_nazwa: p("platnikNazwa") || zProfilu.platnik_nazwa,
    platnik_nip: p("platnikNip") || zProfilu.platnik_nip,
    platnik_adres: p("platnikAdres") || zProfilu.platnik_adres,
    data_pisma: dataPL(dataPisma),
    adres_miejscowosc: p("miejscowosc") || miejscowoscZAdresu(zProfilu.adres),
    data_porodu: dataPL(dataPorodu),
    pdp: dataPL(pdp),
    dziecko_imie: scal(p("dzieckoImie"), p("dzieckoNazwisko")) || zProfilu.dziecko_imie,
    dziecko_pesel: p("dzieckoPesel") || zProfilu.dziecko_pesel,
    liczba_dzieci: liczbaDzieci > 0 ? String(liczbaDzieci) : "",
    liczba_dzieci_pl: LICZBA_DZIECI_PL[liczbaDzieci] ?? "",
    urlop_od: dataPL(urlopOd),
    urlop_do: dataPL(urlopDo),
    tygodnie,
    tygodnie_matka: p("tygodnieMatka") || zProfilu.tygodnie_matka,
    tygodnie_ojciec: p("tygodnieOjciec"),
    drugi_rodzic: p("drugiRodzic") || zProfilu.drugi_rodzic,
    data_zdarzenia: dataPL(p("dataZdarzenia") || p("przyjecie")) || zProfilu.data_zdarzenia,
    wymiar_etatu: tekst(p("wymiar")).replace(/\s*etatu$/i, "") || zProfilu.wymiar_etatu,
    dni_hospitalizacji: dniHospitalizacji,
    szpital_od: zProfilu.szpital_od,
    szpital_do: zProfilu.szpital_do,
    benefit: tekst(druk?.tytul),
    od: dataPL(urlopOd),
    do: dataPL(urlopDo),
    podstawa: zProfilu.podstawa,
    kwota: "",
  };
}

/* ---------- podmiana danych w gotowym pliku .tex ---------- */
const ZNAKI = {
  "\\": "\\textbackslash{}",
  "&": "\\&",
  "%": "\\%",
  "$": "\\$",
  "#": "\\#",
  "_": "\\_",
  "{": "\\{",
  "}": "\\}",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};

export const latexEsc = (v) =>
  String(v ?? "").replace(/[\\&%$#_{}~^]/g, (z) => ZNAKI[z]);

const wypelnijTresc = (tex, dane) => {
  const start = tex.indexOf("\\begin{document}");
  if (start < 0) return tex;
  const naglowek = tex.slice(0, start);
  const tresc = tex
    .slice(start)
    .split("\n")
    .map((linia) => {
      // Nie ruszamy komentarzy (np. opisu makra \Pole w preambule).
      if (linia.trimStart().startsWith("%")) return linia;
      return linia.replace(/\\Pole\{([^}]*)\}/g, (calosc, nazwa) => {
        const klucz = nazwa.trim().toLowerCase().replace(/\s+/g, "_");
        const wartosc = dane[klucz];
        return tekst(wartosc) ? latexEsc(wartosc) : calosc;
      });
    })
    .join("\n");
  return naglowek + tresc;
};

/* ---------- dokument ogólny dla wariantów bez szablonu ---------- */
function dokumentOgolny(druk, profil) {
  const dane = daneDoLatex(druk, profil);
  const tytul = latexEsc(druk?.tytul || "Wniosek");
  const naglowek = druk?.naglowek ?? {};
  const nadawca = (naglowek.nadawca ?? []).filter(Boolean).map(latexEsc).join("\\\\\n") || "…………………………………";
  const adresat = (naglowek.adresat ?? []).filter(Boolean).map(latexEsc).join("\\\\\n");

  const tresc = druk?.tryb === "zam"
    ? [
        "\\begin{description}",
        ...(druk?.pola ?? [])
          .filter((p) => !["miejscowosc", "dataZlozenia"].includes(p.id))
          .map((p) => {
            const wartosc = p.typ === "date" ? D(p.wartosc) : tekst(p.wartosc) || "……………";
            return `\\item[${latexEsc(p.etykieta)}] ${latexEsc(wartosc)}`;
          }),
        "\\end{description}",
      ].join("\n")
    : (druk?.tresc ?? []).map((t) => latexEsc(t)).join("\n\n");

  const zalaczniki = (druk?.zalaczniki ?? []).length
    ? `\n\\textbf{Załączniki:}\n\\begin{enumerate}\n${druk.zalaczniki.map((z) => `\\item ${latexEsc(z)}`).join("\n")}\n\\end{enumerate}\n`
    : "";

  return `${preamble}
\\begin{document}

\\begin{flushright}
{\\footnotesize\\color{szary}RodzicPlus \\textbullet{} ${latexEsc(dane.data_pisma)}}\\\\
\\end{flushright}

\\vspace{0.5em}
{\\color{ramka}\\hrule height 0.4pt}
\\vspace{0.8em}

${latexEsc(naglowek.miejscowoscData || "")}

\\smallskip
${nadawca}

${adresat ? `\\begin{flushright}\\textbf{${adresat}}\\end{flushright}` : ""}

\\NaglowekPisma{${tytul}}

${tresc}
${zalaczniki}
\\vspace{2em}
\\begin{flushright}
……………………………………\\\\
podpis
\\end{flushright}

\\vfill
{\\footnotesize\\textcolor{szary}\\itshape Podstawa: ${latexEsc(String(druk?.podstawa || "").replace(/\.$/, ""))}. Dokument wygenerowany w RodzicPlus na podstawie danych podanych przez wnioskodawcę.}

\\end{document}
`;
}

/* ---------- API ---------- */
const PL = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z", Ą: "A", Ć: "C", Ę: "E", Ł: "L", Ń: "N", Ó: "O", Ś: "S", Ź: "Z", Ż: "Z" };

function slug(s) {
  return String(s ?? "")
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (z) => PL[z] ?? z)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

/**
 * Buduje kompletny dokument LaTeX-a z wypełnionymi danymi.
 *
 * @param {object} druk  wynik `przygotujDruk(...)`
 * @param {object} profil  profil z „Moje dane”
 * @param {{ szablonId?: string }} [opcje]
 * @returns {{ tex: string, nazwaPliku: string, szablonId: string|null, zrodlo: string }}
 */
export function zbudujDokumentLatex(druk, profil, { szablonId } = {}) {
  if (!druk) throw new Error("Brak wniosku do zapisania.");

  const dostepne = szablonyDlaWariantu(druk.id);
  const wybrany = szablonId && dostepne.some((s) => s.id === szablonId) ? szablonId : dostepne[0]?.id ?? null;
  // Tryb „zam” = osoba niebędąca pracownikiem: nie piszemy pisma do pracodawcy,
  // tylko zestawienie danych do przepisania do formularza ZAM w eZUS.
  // Szablon (P01, P05…) to pismo pracownicze – w tym trybie go nie używamy.
  const szablon = wybrany && druk.tryb !== "zam" ? SZABLONY[wybrany] : null;
  const dane = daneDoLatex(druk, profil);

  if (szablon) {
    const tex = wypelnijTresc(szablon.tex, dane);
    return {
      tex,
      nazwaPliku: `${slug(`${szablon.id} ${szablon.nazwa}`)}.tex`,
      szablonId: szablon.id,
      zrodlo: "szablon",
    };
  }

  return {
    tex: dokumentOgolny(druk, profil),
    nazwaPliku: `${slug(`${druk.id} ${druk.tytul}`)}.tex`,
    szablonId: null,
    zrodlo: "ogolny",
  };
}

/** Zapis pliku w przeglądarce (mockup zamiast okna drukowania). */
export function zapiszPlik(tekst, nazwa) {
  const blob = new Blob([tekst], { type: "application/x-tex;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nazwa;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Do testów/spójności: surowe szablony wg id. */
export const SZABLONY_TEX = SZABLONY;
