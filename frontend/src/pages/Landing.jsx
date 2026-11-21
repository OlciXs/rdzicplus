import { Link } from "react-router-dom";
import { CALCULATORS, calculatorPath } from "../calculators/registry.jsx";
import { useAuth } from "../auth.js";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="app">
      <header className="landing-top">
        <Link to="/" className="brand brand-link">
          <span className="brand-mark" aria-hidden="true">RP</span>
          <span className="brand-name">RodzicPlus</span>
        </Link>
        <nav className="landing-nav">
          <Link className="nav-link" to="/kalkulatory">Kalkulatory</Link>
          <details className="menu">
            <summary className="menu-button" aria-label="Menu aplikacji">
              Menu <span aria-hidden="true">⌄</span>
            </summary>
            <div className="menu-list">
              {user ? (
                <>
                  <Link to="/panel">Mój panel</Link>
                  <Link to="/profil">Moje dane</Link>
                </>
              ) : (
                <Link to="/logowanie">Zaloguj się</Link>
              )}
              <Link to="/kalkulatory">Wszystkie kalkulatory</Link>
            </div>
          </details>
        </nav>
      </header>

      <main className="landing">
        <section className="landing-hero">
          <p className="eyebrow">Wsparcie po narodzinach dziecka</p>
          <h1>Załatw papiery po narodzinach dziecka razem z nami.</h1>
          <p className="lead">
            RodzicPlus mówi Ci wprost: czy dostaniesz pieniądze z ZUS, ile dostaniesz, jak długo
            i co gdzie złożyć. Bez paragrafów w twarz – te zostawiamy w szczegółach.
          </p>
          <div className="landing-actions">
            <Link className="btn btn-primary btn-big" to="/kalkulatory">
              Otwórz kalkulatory
            </Link>
            <Link className="btn btn-outline" to={user ? "/panel" : "/logowanie"}>
              {user ? "Przejdź do panelu" : "Zaloguj się mObywatelem"}
            </Link>
          </div>
        </section>

        <section className="landing-grid">
          <article className="landing-card">
            <span className="landing-card-icon" aria-hidden="true">✅</span>
            <h2>Czy mi przysługuje?</h2>
            <p>Sprawdzamy prawo do zasiłku i jasno mówimy „tak” albo „nie” – z powodem.</p>
          </article>
          <article className="landing-card">
            <span className="landing-card-icon" aria-hidden="true">💰</span>
            <h2>Ile dostanę?</h2>
            <p>Kwota miesięczna z Twojej pensji, z podziałem na mamę i tatę.</p>
          </article>
          <article className="landing-card">
            <span className="landing-card-icon" aria-hidden="true">📋</span>
            <h2>Co i kiedy złożyć?</h2>
            <p>Lista dokumentów, terminy i ostrzeżenia, żeby nie stracić świadczeń.</p>
          </article>
        </section>

        <section className="landing-calcs">
          <div className="landing-calcs-head">
            <h2>Kalkulatory świadczeń</h2>
            <Link className="link-more" to="/kalkulatory">Zobacz wszystkie →</Link>
          </div>
          <div className="calc-list">
            {CALCULATORS.slice(0, 3).map((c) => (
              <Link key={c.slug} className="calc-tile" to={calculatorPath(c.slug)}>
                <span className="calc-tile-icon" aria-hidden="true">{c.icon}</span>
                <span className="calc-tile-body">
                  <span className="calc-tile-letter">Kalkulator {c.letter}</span>
                  <span className="calc-tile-title">{c.title}</span>
                  <span className="calc-tile-desc">{c.short}</span>
                </span>
                <span className="calc-tile-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p className="note">
          Materiał poglądowy. Kalkulacje nie stanowią decyzji ZUS.
        </p>
      </footer>
    </div>
  );
}
