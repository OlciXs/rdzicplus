/* =====================================================================
   PDF DO ZAPISU (mockup zamiast drukowania).

   Źródłem układu i treści jest wypełniony szablon LaTeX-a z
   `latexDokument.js`. Zamiast kompilować TeX-a (Tectonic/XeLaTeX) w
   przeglądarce, tłumaczymy prosty podzbiór LaTeX-a użyty w szablonach
   na bloki tekstu i składamy z nich PDF przez jsPDF.

   Dzięki temu wybrany szablon (np. P05, P06, P04) naprawdę zmienia treść
   dokumentu, a w PDF są już podstawione dane z formularza.
   ===================================================================== */
import { zbudujDokumentLatex } from "./latexDokument.js";

const A4 = { szer: 210, wys: 297, margines: 18 };
const SZER = A4.szer - 2 * A4.margines;
const KOLOR = {
  czarny: [17, 17, 17],
  szary: [107, 114, 128],
};

/* ---------- LaTeX → proste bloki tekstu ---------- */
const SUPER = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
const ZNACZNIK_LINII = "\u0000";

/** Zamienia polecenia LaTeX-a z naszych szablonów na czytelny tekst. */
export function latexDoTekstu(tekst) {
  let t = String(tekst ?? "");

  t = t
    .replace(/\\textsuperscript\{([0-9]+)\}/g, (_, d) => [...d].map((c) => SUPER[c] ?? c).join(""))
    .replace(/\\S\{\}/g, "§")
    .replace(/\\ldots\{\}/g, "…")
    .replace(/\\quotedblbase\{\}/g, "„")
    .replace(/\\textquotedblright\{\}/g, "”")
    .replace(/\\textbackslash\{\}/g, "\\")
    .replace(/\\textasciitilde\{\}/g, "~")
    .replace(/\\textasciicircum\{\}/g, "^")
    .replace(/\\&/g, "&")
    .replace(/\\%/g, "%")
    .replace(/\\_/g, "_")
    .replace(/\\#/g, "#")
    .replace(/\\\$/g, "$")
    .replace(/\\\{/g, "{")
    .replace(/\\\}/g, "}");

  // Formatowanie i odstępy – nie są treścią.
  t = t
    .replace(/\\(?:textcolor|color|vspace|hspace|fontsize)\*?(?:\[[^\]]*\])?\{[^{}]*\}/g, "")
    .replace(/\\hrule\s*height\s*[\d.]+\s*pt/g, "")
    .replace(/\\hrule\b/g, "")
    .replace(/\\(?:footnotesize|scriptsize|small|normalsize|large|Large|LARGE|bfseries|itshape|ttfamily|sffamily|rmfamily|centering|noindent|par|medskip|smallskip|bigskip|vfill|hfill|newline|linebreak)\b/g, "");

  // Zostawiamy treść pogrubień, bez samego polecenia.
  t = t.replace(/\\textbf\{([^{}]*)\}/g, "$1").replace(/\\textit\{([^{}]*)\}/g, "$1");

  // Twarde przełamania linii `\\` / `\\[-2pt]` – oznaczamy osobno.
  t = t.replace(/\\\\\s*\[[^\]]*\]/g, ZNACZNIK_LINII).replace(/\\\\/g, ZNACZNIK_LINII);

  t = t
    .replace(/\\Pole\{[^}]*\}/g, "…………………………………")
    .replace(/\\(?:begin|end)\{[^}]*\}/g, "")
    .replace(/[{}]/g, "")
    .replace(/\\(?=\s|$)/g, "");

  return t.replace(/[ \t]+/g, " ").trim();
}

const linieWTekscie = (tekst) =>
  tekst
    .split(ZNACZNIK_LINII)
    .map((l) => l.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

/* ---------- wybór bloków warunkowych (np. martwe urodzenie, 81,5%) ---------- */
const TAK = (v) => v === true || v === "tak";

function czyWarunek(nazwa, druk, profil = {}) {
  const dziecko = profil.dziecko ?? {};
  const drugiRodzic = profil.drugiRodzic ?? {};
  const urlopy = profil.urlopy ?? {};
  const sytuacja = profil.sytuacja ?? {};
  const pole = (id) => druk?.pola?.find((p) => p.id === id)?.wartosc;
  const oswiadczenie = (id) => !!druk?.oswiadczenia?.find((o) => o.id === id)?.zaznaczone;

  switch (nazwa) {
    case "jesli_dziecko":
      return Boolean(
        dziecko.imie || dziecko.nazwisko || dziecko.pesel || dziecko.dataUrodzenia ||
        pole("dzieckoImie") || pole("dzieckoNazwisko") || pole("dzieckoUr"),
      );
    case "jesli_martwe":
      return TAK(dziecko.martwe) || TAK(dziecko.zmarlo);
    case "jesli_pelny_wymiar":
      return oswiadczenie("pelnyWymiar") || TAK(urlopy.zamiarPelnyWymiar);
    case "jesli_matka_nieubezpieczona":
      return ["brak", "dzielo", "nierejestrowa", "student_zlecenie"].includes(drugiRodzic.statusUbezpieczenia);
    case "jesli_po_14_tyg":
      return Number(urlopy.macierzynskiWykorzystanoTyg) >= 14;
    case "jesli_po_8_tyg":
      return /orzeczenie|niezdoln/i.test(`${drugiRodzic.okolicznosc ?? ""} ${urlopy.planUzupelniajacy ?? ""}`);
    case "jesli_przysposobienie":
      return sytuacja.typPrzyjecia === "przysposobienie";
    case "jesli_zastępca":
      return String(sytuacja.typPrzyjecia ?? "").startsWith("rodzina_zastepcza");
    default:
      return true;
  }
}

/** Usuwa z .tex bloki warunkowe, które nie dotyczą tej sprawy. */
export function filtrujWarunki(tex, druk, profil) {
  return String(tex ?? "").replace(
    /\\begin\{warunek\}\{([^}]*)\}([\s\S]*?)\\end\{warunek\}/g,
    (_, nazwa, tresc) => (czyWarunek(nazwa, druk, profil) ? `\n\n${tresc}\n\n` : ""),
  );
}

/**
 * Dzieli ciało szablonu .tex na bloki: nagłówek, akapit, blok do prawej,
 * drobny przypis. To nie jest pełny parser LaTeX-a – obsługuje konstrukcje
 * używane w `latex/szablony/*.tex`.
 */
export function latexDoBlokow(tex) {
  const dokument = String(tex ?? "").match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  let body = dokument ? dokument[1] : String(tex ?? "");

  // Bloki `flushright` (metryka szablonu) wyciągamy przed podziałem na akapity.
  const doPrawej = [];
  body = body.replace(/\\begin\{flushright\}([\s\S]*?)\\end\{flushright\}/g, (_, inner) => {
    doPrawej.push(inner);
    return `\n\n@@DO_PRAWEJ_${doPrawej.length - 1}@@\n\n`;
  });

  body = body.replace(/\\begin\{warunek\}(?:\{[^}]*\})?/g, "\n\n").replace(/\\end\{warunek\}/g, "\n\n");
  body = body
    .split("\n")
    .filter((linia) => !linia.trimStart().startsWith("%"))
    .join("\n");

  const bloki = [];
  for (const surowy of body.split(/\n\s*\n/)) {
    const b = surowy.trim();
    if (!b) continue;

    const prawo = b.match(/^@@DO_PRAWEJ_(\d+)@@$/);
    if (prawo) {
      bloki.push({ typ: "prawo", tekst: latexDoTekstu(doPrawej[Number(prawo[1])]) });
      continue;
    }

    const naglowek = b.match(/\\NaglowekPisma\{([^{}]*)\}/);
    if (naglowek) {
      bloki.push({ typ: "naglowek", tekst: latexDoTekstu(naglowek[1]).toUpperCase() });
      const reszta = b.replace(naglowek[0], "").trim();
      const tekst = latexDoTekstu(reszta);
      if (tekst) bloki.push({ typ: "akapit", tekst });
      continue;
    }

    const drobny = /\\footnotesize|\\scriptsize/.test(b) && /\\itshape/.test(b);
    const tekst = latexDoTekstu(b);
    if (tekst) bloki.push({ typ: drobny ? "drobny" : "akapit", tekst });
  }

  return bloki;
}

/* ---------- składanie PDF ---------- */
function utworzPisarz(doc) {
  let y = A4.margines;

  const wysLinii = (size) => size * 0.3528 * 1.28;

  const nowaStrona = (potrzebne) => {
    if (y + potrzebne > A4.wys - A4.margines) {
      doc.addPage();
      y = A4.margines;
    }
  };

  const akapit = (tekst, { align = "left", style = "normal", size = 10.5, kolor = KOLOR.czarny, gap = 3 } = {}) => {
    const linie = doc.splitTextToSize(String(tekst ?? ""), SZER);
    if (!linie.length) return;
    doc.setFont("DejaVu", style);
    doc.setFontSize(size);
    doc.setTextColor(...kolor);
    const lh = wysLinii(size);
    const x = align === "right" ? A4.szer - A4.margines : align === "center" ? A4.szer / 2 : A4.margines;
    for (const linia of linie) {
      nowaStrona(lh);
      doc.text(linia, x, y, { align });
      y += lh;
    }
    y += gap;
  };

  return {
    akapit,
    odstep: (h) => { y += h; },
  };
}

function renderujBloki(doc, bloki) {
  const p = utworzPisarz(doc);

  for (const blok of bloki) {
    const linie = linieWTekscie(blok.tekst);

    if (blok.typ === "prawo") {
      // Metryka „Szablon P05 / nazwa / podstawa” jest pomocnicza – w gotowym piśmie jej nie drukujemy.
      if (/Szablon P\d+/.test(blok.tekst)) continue;
      for (const linia of linie) p.akapit(linia, { align: "right", size: 8, kolor: KOLOR.szary, gap: 0.6 });
      p.odstep(2);
      continue;
    }

    if (blok.typ === "naglowek") {
      p.akapit(blok.tekst, { align: "center", style: "bold", size: 13, gap: 5 });
      continue;
    }

    if (blok.typ === "drobny") {
      p.akapit(blok.tekst.replace(/\s*\n\s*/g, " "), { size: 8, kolor: KOLOR.szary, gap: 4 });
      continue;
    }

    if (linie.length > 1) {
      // Blok adresowy / linie rozdzielone `\\` – bez odstępów między wierszami.
      for (const linia of linie) p.akapit(linia, { gap: 0.3 });
      p.odstep(2);
    } else {
      p.akapit((linie[0] ?? "").replace(/\s+/g, " "), { gap: 3.5 });
    }
  }
}

function numerujStrony(doc) {
  const razem = doc.getNumberOfPages();
  for (let i = 1; i <= razem; i += 1) {
    doc.setPage(i);
    doc.setFont("DejaVu", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...KOLOR.szary);
    doc.text(`Strona ${i} z ${razem}`, A4.szer / 2, A4.wys - 8, { align: "center" });
  }
}

/* ---------- czcionka z polskimi znakami ---------- */
let fonty = null;

const naBase64 = (bufor) => {
  const bajty = new Uint8Array(bufor);
  let tekst = "";
  for (let i = 0; i < bajty.length; i += 0x8000) {
    tekst += String.fromCharCode(...bajty.subarray(i, i + 0x8000));
  }
  return btoa(tekst);
};

async function wczytajFonty(doc) {
  if (!fonty) {
    const [zwykly, pogrubiony] = await Promise.all([
      fetch("/fonts/DejaVuSans.ttf"),
      fetch("/fonts/DejaVuSans-Bold.ttf"),
    ]);
    if (!zwykly.ok || !pogrubiony.ok) throw new Error("Nie udało się wczytać czcionki do PDF.");
    fonty = {
      zwykly: naBase64(await zwykly.arrayBuffer()),
      pogrubiony: naBase64(await pogrubiony.arrayBuffer()),
    };
  }
  doc.addFileToVFS("DejaVuSans.ttf", fonty.zwykly);
  doc.addFont("DejaVuSans.ttf", "DejaVu", "normal");
  doc.addFileToVFS("DejaVuSans-Bold.ttf", fonty.pogrubiony);
  doc.addFont("DejaVuSans-Bold.ttf", "DejaVu", "bold");
  doc.setFont("DejaVu", "normal");
}

export async function zbudujPdf(druk, profil, { szablonId } = {}) {
  if (!druk) throw new Error("Brak wniosku do zapisania.");

  const dokument = zbudujDokumentLatex(druk, profil, { szablonId });
  // jsPDF jest duży – ładujemy go dopiero przy zapisie PDF.
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  await wczytajFonty(doc);

  const bloki = latexDoBlokow(filtrujWarunki(dokument.tex, druk, profil));
  if (druk.podstawa) {
    bloki.push({
      typ: "drobny",
      tekst: `Podstawa: ${String(druk.podstawa).replace(/\.$/, "")}. Dokument przygotowany w RodzicPlus na podstawie danych podanych przez wnioskodawcę.`,
    });
  }
  renderujBloki(doc, bloki);
  numerujStrony(doc);

  return {
    doc,
    plik: dokument.nazwaPliku.replace(/\.tex$/i, ".pdf"),
    szablonId: dokument.szablonId,
  };
}

/**
 * Tworzy i zapisuje PDF z wypełnionego szablonu.
 *
 * @param {object} druk  wynik `przygotujDruk(...)`
 * @param {object} profil  profil z „Moje dane”
 * @param {{ szablonId?: string }} [opcje]
 * @returns {Promise<{ plik: string, szablonId: string|null }>}
 */
export async function zapiszDokumentPdf(druk, profil, { szablonId } = {}) {
  const { doc, plik, szablonId: uzyty } = await zbudujPdf(druk, profil, { szablonId });
  doc.save(plik);
  return { plik, szablonId: uzyty };
}
