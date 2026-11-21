import AppHeader from "../components/AppHeader.jsx";

const ORGANIZACJE = [
  {
    nazwa: "Fundacja Wcześniak Rodzicom",
    opis: "Wsparcie rodzin wcześniaków i dzieci wymagających opieki po porodzie.",
    url: "https://wczesniak.pl",
  },
  {
    nazwa: "Fundacja Przed Czasem",
    opis: "Pomoc rodzicom, dzieciom urodzonym przedwcześnie i opiekę po trudnym porodzie.",
    url: "https://www.przedczasem.org",
  },
  {
    nazwa: "HoPe – Hospicjum Perinatalne",
    opis: "Wsparcie rodziców przed porodem i po stracie dziecka, także w sytuacjach terminalnych.",
    url: "https://hope.katowice.pl",
  },
  {
    nazwa: "Wrocławskie Hospicjum dla Dzieci",
    opis: "Hospicjum i wsparcie dla dzieci oraz ich rodzin wymagających opieki medycznej.",
    url: "https://hospicjum.wroc.pl",
  },
  {
    nazwa: "Fundacja Dajemy Dzieciom Siłę",
    opis: "Wsparcie psychologiczne i przeciwdziałanie przemocy wobec dzieci i rodzin.",
    url: "https://fdds.pl",
  },
];

export default function Support() {
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

        <div className="result-stack">
          {ORGANIZACJE.map((organizacja) => (
            <section className="result-card" key={organizacja.nazwa}>
              <h2 className="result-title">{organizacja.nazwa}</h2>
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
          Linki przekierowują do zewnętrznych stron organizacji. RodzicPlus nie oferuje pomocy medycznej ani
          psychologicznej i nie jest pośrednikiem w kontaktach z tymi podmiotami.
        </p>
      </main>
    </div>
  );
}
