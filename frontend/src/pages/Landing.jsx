import { Link } from "react-router-dom";
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
          <details className="menu">
            <summary className="menu-button" aria-label="Menu aplikacji">
              <span className="hamburger" aria-hidden="true"><i></i><i></i><i></i></span>
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
              <Link to="/kalkulatory">Kalkulatory</Link>
            </div>
          </details>
        </nav>
      </header>

      <main className="landing">
        <section className="landing-hero">
          <h1>RodzicPlus</h1>
          <p className="lead">
            Sprawdź świadczenia, terminy i dokumenty po narodzinach dziecka.
          </p>
          <div className="landing-actions">
            <Link className="btn btn-primary btn-big" to="/kalkulatory">
              Sprawdź świadczenia
            </Link>
            <Link className="btn btn-outline" to={user ? "/panel" : "/logowanie"}>
              {user ? "Mój panel" : "Zaloguj się"}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
