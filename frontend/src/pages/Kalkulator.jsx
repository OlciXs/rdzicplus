import { Link, useParams } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import { CALCULATORS, calculatorPath, getCalculator } from "../calculators/registry.jsx";
import NotFound from "./NotFound.jsx";

export default function Kalkulator() {
  const { slug } = useParams();
  const active = getCalculator(slug);

  // Nieznany adres kalkulatora → strona 404.
  if (!active) return <NotFound />;

  const { Component } = active;

  return (
    <div className="app">
      <AppHeader />
      <main className="kalkulator-page">
        <nav className="breadcrumb" aria-label="Ścieżka">
          <Link className="breadcrumb-link" to="/">Strona główna</Link>
          <span className="breadcrumb-sep">/</span>
          <Link className="breadcrumb-link" to="/kalkulatory">Kalkulatory</Link>
          <span className="breadcrumb-sep">/</span>
          <span aria-current="page">{active.title}</span>
        </nav>

        <div className="calc-head">
          <span className="calc-head-icon" aria-hidden="true">{active.icon}</span>
          <div>
            <h1>{active.title}</h1>
            <p className="lead">{active.short}</p>
          </div>
        </div>

        <div className="calc-body">
          <Component />
        </div>

        <nav className="calc-pager" aria-label="Inne kalkulatory">
          {CALCULATORS.filter((c) => c.slug !== active.slug).map((c) => (
            <Link key={c.slug} className="pager-chip" to={calculatorPath(c.slug)}>
              <span aria-hidden="true">{c.icon}</span> {c.title}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
