import { useState } from "react";
import AppHeader from "../components/AppHeader.jsx";

// Wyłącznie organizacje pozarządowe o charakterze charytatywnym (fundacje, hospicja prowadzone przez fundacje) –
// wymóg i) z treści zadania: śmierć dziecka, wcześniak, poronienie, dziecko ciężko chore.
// Strony sprawdzone 22.11.2026 (otwierają się, nazwa i zakres działania zgodne z opisem).
// Usunięta Fundacja Dajemy Dzieciom Siłę – zajmuje się głównie przemocą wobec dzieci, nie tymi sytuacjami.
export const SYTUACJE = [
  { id: "wczesniak", etykieta: "Wcześniak" },
  { id: "chore", etykieta: "Dziecko ciężko chore / trudna diagnoza w ciąży" },
  { id: "strata", etykieta: "Poronienie, śmierć dziecka, żałoba" },
];

export const ORGANIZACJE = [
  {
    nazwa: "Fundacja Wcześniak Rodzice-Rodzicom",
    opis: "Wsparcie rodziców wcześniaków – bezpłatny poradnik „Niezbędnik rodzica wcześniaka”, informacje o opiece po wyjściu ze szpitala.",
    url: "https://wczesniak.pl",
    sytuacje: ["wczesniak"],
    zasieg: "cała Polska",
  },
  {
    nazwa: "Fundacja Przed Czasem",
    opis: "Wsparcie dla rodziców dzieci urodzonych przedwcześnie – pomoc, wiedza i kontakt z innymi rodzicami.",
    url: "https://www.przedczasem.org",
    sytuacje: ["wczesniak"],
    zasieg: "cała Polska",
  },
  {
    nazwa: "Fundacja Rodzić po Ludzku",
    opis: "Informacje o prawach pacjentki i opiece po poronieniu oraz po stracie dziecka w czasie ciąży lub porodu.",
    url: "https://rodzicpoludzku.pl",
    sytuacje: ["strata"],
    zasieg: "cała Polska",
  },
  {
    nazwa: "Fundacja Nagle Sami",
    opis: "Bezpłatna pomoc psychologiczna, spotkania indywidualne i grupy wsparcia dla osób w żałobie, także po śmierci dziecka.",
    url: "https://naglesami.org.pl",
    sytuacje: ["strata"],
    zasieg: "cała Polska",
  },
  {
    nazwa: "Fundacja Warszawskie Hospicjum dla Dzieci",
    opis: "Pediatryczna i perinatalna opieka paliatywna – opieka nad nieuleczalnie chorymi dziećmi w domu i wsparcie rodziców po trudnej diagnozie.",
    url: "https://www.hospicjum.waw.pl",
    sytuacje: ["chore", "strata"],
    zasieg: "Warszawa i okolice",
  },
  {
    nazwa: "Fundacja Gajusz",
    opis: "Hospicjum dla dzieci i hospicjum perinatalne – opieka nad chorymi dziećmi i wsparcie rodzin.",
    url: "https://gajusz.org.pl",
    sytuacje: ["chore", "strata"],
    zasieg: "Łódź i województwo łódzkie",
  },
  {
    nazwa: "Śląskie Hospicjum Perinatalne HoPe",
    opis: "Wsparcie rodziców, którzy dowiedzieli się, że dziecko może urodzić się ciężko chore – przed porodem i po stracie dziecka.",
    url: "https://hope.katowice.pl",
    sytuacje: ["chore", "strata"],
    zasieg: "Śląsk",
  },
  {
    nazwa: "Fundacja Wrocławskie Hospicjum dla Dzieci",
    opis: "Hospicjum domowe i stacjonarne dla nieuleczalnie chorych dzieci i młodzieży oraz wsparcie ich rodzin.",
    url: "https://hospicjum.wroc.pl",
    sytuacje: ["chore"],
    zasieg: "Dolny Śląsk",
  },
];

export default function Support() {
  const [filtr, setFiltr] = useState("");
  const widoczne = filtr ? ORGANIZACJE.filter((o) => o.sytuacje.includes(filtr)) : ORGANIZACJE;
  return (
    <div className="app">
      <AppHeader />
      <main className="container">
        <h1>Wsparcie w sytuacjach szczególnych</h1>
        <p className="lead">
          Nie jesteś sam/a. Poniżej znajdziesz organizacje oferujące wsparcie przedwcześnie urodzonym
          dzieciom oraz rodzinom po stracie dziecka lub w ciężkiej sytuacji zdrowotnej.
        </p>

        <section className="alert-inline" role="note">
          <span className="badge b-warn">W nagłym zagrożeniu życia</span>
          Zadzwoń pod numer 112. W sytuacji kryzysowej psychicznej zadzwoń pod 112 lub Centrum Wsparcia 800 70 2222.
        </section>

        <div className="support-filtry" role="group" aria-label="Wybierz sytuację">
          <button type="button" className={`pager-chip${filtr === "" ? " is-active" : ""}`} aria-pressed={filtr === ""} onClick={() => setFiltr("")}>Wszystkie</button>
          {SYTUACJE.map((s) => (
            <button type="button" key={s.id} className={`pager-chip${filtr === s.id ? " is-active" : ""}`} aria-pressed={filtr === s.id} onClick={() => setFiltr(s.id)}>
              {s.etykieta}
            </button>
          ))}
        </div>

        <div className="result-stack">
          {widoczne.map((organizacja) => (
            <section className="result-card" key={organizacja.nazwa}>
              <h2 className="result-title">{organizacja.nazwa}</h2>
              <p className="note">
                {organizacja.sytuacje.map((id) => SYTUACJE.find((s) => s.id === id)?.etykieta).join(" · ")} · zasięg: {organizacja.zasieg}
              </p>
              <p>{organizacja.opis}</p>
              <p className="result-action">
                <a className="btn btn-outline" href={organizacja.url} target="_blank" rel="noreferrer">
                  Przejdź do strony organizacji →
                </a>
              </p>
            </section>
          ))}
        </div>

        <p className="note">
          Wyłącznie organizacje pozarządowe (fundacje, hospicja) – pomoc jest bezpłatna. Linki prowadzą do ich stron;
          RodzicPlus nie oferuje pomocy medycznej ani psychologicznej, nie jest pośrednikiem i nie jest powiązany z tymi
          podmiotami. Hospicja perinatalne działają w wielu regionach – zapytaj w swoim szpitalu o najbliższe.
        </p>
      </main>
    </div>
  );
}
