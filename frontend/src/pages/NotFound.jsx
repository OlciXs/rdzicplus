import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import Icon from "../components/Icons.jsx";
import { CALCULATORS, calculatorPath } from "../calculators/registry.jsx";

export default function NotFound() {
  return (
    <div className="app">
      <AppHeader />
      <main className="kalkulator-page notfound">
        <p className="notfound-code">404</p>
        <h1>Nie znaleźliśmy tej strony</h1>
        <p className="lead">
          Adres jest nieprawidłowy albo strona została przeniesiona. Może pomogą Ci te miejsca:
        </p>

        <div className="landing-actions">
          <Link className="btn btn-primary" to="/">Strona główna</Link>
          <Link className="btn btn-outline" to="/kalkulatory">Wszystkie kalkulatory</Link>
        </div>

        <nav className="calc-pager" aria-label="Kalkulatory">
          {CALCULATORS.map((c) => (
            <Link key={c.slug} className="pager-chip" to={calculatorPath(c.slug)}>
              <Icon name={c.icon} /> {c.title}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
