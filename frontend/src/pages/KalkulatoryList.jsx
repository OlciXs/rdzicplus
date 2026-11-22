import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import Icon from "../components/Icons.jsx";
import { CALCULATORS, calculatorPath } from "../calculators/registry.jsx";

export default function KalkulatoryList() {
  return (
    <div className="app">
      <AppHeader />
      <main className="kalkulator-page">
        <nav className="breadcrumb" aria-label="Ścieżka">
          <Link className="breadcrumb-link" to="/">Strona główna</Link>
          <span className="breadcrumb-sep">/</span>
          <span aria-current="page">Kalkulatory</span>
        </nav>

        <div className="hero">
          <h1>Kalkulatory świadczeń</h1>
          <p className="lead">
            Sprawdź, czy dostaniesz pieniądze z ZUS, ile dostaniesz i jak długo – oraz co, gdzie
            i kiedy złożyć. Wszystkie kwoty liczone są dla stanu prawnego 2026.
          </p>
        </div>

        <div className="calc-list">
          {CALCULATORS.map((c) => (
            <Link key={c.slug} className="calc-tile" to={calculatorPath(c.slug)}>
              <span className="calc-tile-icon"><Icon name={c.icon} /></span>
              <span className="calc-tile-body">
                <span className="calc-tile-letter">Kalkulator {c.letter}</span>
                <span className="calc-tile-title">{c.title}</span>
                <span className="calc-tile-desc">{c.short}</span>
              </span>
              <span className="calc-tile-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>

        <p className="note">
          Materiał poglądowy. Wartości wskaźników wg załączników ZUS do zadania; kalkulacje nie
          stanowią decyzji ZUS.
        </p>
      </main>
    </div>
  );
}
