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
        {user && (
          <details className="menu">
            <summary className="menu-button" aria-label="Menu użytkownika">
              Cześć, {user.imie} <span aria-hidden="true">⌄</span>
            </summary>
            <div className="menu-list">
              <Link to="/panel">Mój panel</Link>
              <Link to="/profil">Moje dane</Link>
              <Link to="/kalkulatory">Kalkulatory</Link>
              <button type="button" onClick={logout}>Wyloguj</button>
            </div>
          </details>
        )}
      </div>
    </header>
  );
}
