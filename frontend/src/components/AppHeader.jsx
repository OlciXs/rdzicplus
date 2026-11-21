import { Link } from "react-router-dom";
import { useAuth } from "../auth.js";

export default function AppHeader({ actions = null, children = null }) {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <Link to="/" className="brand brand-link" aria-label="RodzicPlus - strona główna">
        <span className="brand-mark" aria-hidden="true">RP</span>
        <span className="brand-name">RodzicPlus</span>
      </Link>
      {children}
      <div className="topbar-actions">
        {actions}
        <details className="menu">
          <summary className="menu-button" aria-label="Menu aplikacji">
            <span className="hamburger" aria-hidden="true"><i></i><i></i><i></i></span>
          </summary>
          <div className="menu-list">
            {user ? (
              <>
                <span className="menu-user">Cześć, {user.imie}</span>
                <Link to="/panel">Mój panel</Link>
                <Link to="/profil">Moje dane</Link>
                <Link to="/wnioski">Złóż wniosek</Link>
                <Link to="/zus">Dane z ZUS</Link>
                <Link to="/odpis-aktu">Odpis aktu urodzenia</Link>
                <Link to="/wnioski">Wnioski</Link>
              </>
            ) : (
              <Link to="/logowanie">Zaloguj się</Link>
            )}
            <Link to="/kalkulatory">Kalkulatory</Link>
            {user && <button type="button" onClick={logout}>Wyloguj</button>}
          </div>
        </details>
      </div>
    </header>
  );
}
