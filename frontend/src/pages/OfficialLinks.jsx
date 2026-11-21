import AppHeader from "../components/AppHeader.jsx";

const LINKI = [
  {
    nazwa: "ZUS",
    opis: "Wnioski, wzory formularzy, informacje o zasiłkach i świadczeniach oraz logowanie do PUE/eZUS.",
    url: "https://www.zus.pl",
  },
  {
    nazwa: "Wzory formularzy ZUS",
    opis: "Aktualne formularze ZAM i inne druki zasiłkowe.",
    url: "https://www.zus.pl/wzory-formularzy/zasilki",
  },
  {
    nazwa: "gov.pl – urlop rodzicielski",
    opis: "Informacje rządowe o urlopie rodzicielskim i prawach rodziców.",
    url: "https://www.gov.pl/web/rodzina/urlop-rodzicielski",
  },
  {
    nazwa: "Państwowa Inspekcja Pracy",
    opis: "Porady prawne dla pracowników i pracodawców dotyczące rodzicielstwa i urlopów.",
    url: "https://www.pip.gov.pl/dla-pracodawcow/porady-prawne/rodzicielstwo",
  },
  {
    nazwa: "gov.pl – odpis aktu urodzenia",
    opis: "Usługi dotyczące rejestru stanu cywilnego i wydania odpisu aktu.",
    url: "https://www.gov.pl/web/cyfryzacja/rejestr-stanu-cywilnego",
  },
  {
    nazwa: "PUE/eZUS",
    opis: "Złożenie wniosków i sprawdzenie danych na koncie ubezpieczonego.",
    url: "https://pz.zus.pl",
  },
];

export default function OfficialLinks() {
  return (
    <div className="app">
      <AppHeader />
      <main className="container official-page">
        <h1>Informacje urzędowe i przekierowania</h1>
        <p className="lead">
          Ostateczne zasady, formularze i terminy należy potwierdzać w oficjalnych źródłach ZUS,
          administracji rządowej i Państwowej Inspekcji Pracy.
        </p>

        <div className="result-stack">
          {LINKI.map((link) => (
            <section className="result-card" key={link.nazwa}>
              <h2 className="result-title">{link.nazwa}</h2>
              <p>{link.opis}</p>
              <p className="result-action">
                <a className="btn btn-outline" href={link.url} target="_blank" rel="noreferrer">
                  Otwórz oficjalną stronę →
                </a>
              </p>
            </section>
          ))}
        </div>

        <section className="info-card">
          <h2>Aktualne zasady formularzy</h2>
          <p className="note">
            Od 24.10.2026 formularz ZAM zastępuje ZUR i ZAO. Formularz Z-3b został zlikwidowany.
            Dla działalności i osób bez pracowniczego tytułu kierunek złożenia zależy od konkretnego
            uprawnienia i płatnika składek.
          </p>
        </section>
      </main>
    </div>
  );
}
