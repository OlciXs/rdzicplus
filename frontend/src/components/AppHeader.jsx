import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";
import Icon from "./Icons.jsx";
import { useAuth } from "../auth.js";

export default function AppHeader({ actions = null, children = null }) {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <Link to="/" className="brand brand-link" aria-label="RodzicPlus – strona główna">
        <Logo size={34} variant="on-brand" />
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

                <span className="menu-section">Twoje sprawy</span>
                <Link to="/panel"><Icon name="home" /> Mój panel</Link>
                <Link to="/profil"><Icon name="pencil" /> Moje dane</Link>
                <Link to="/wnioski"><Icon name="docs" /> Wnioski</Link>
                <Link to="/kalendarz"><Icon name="calendar" /> Kalendarz terminów</Link>

                <span className="menu-section">Symulacje urzędowe</span>
                <Link to="/zus"><Icon name="bank" /> Dane z ZUS</Link>
                <Link to="/odpis-aktu"><Icon name="doc" /> Odpis aktu urodzenia</Link>

                <span className="menu-section">Pomoc i informacje</span>
                <Link to="/wsparcie"><Icon name="heart" /> Wsparcie</Link>
                <Link to="/informacje"><Icon name="info" /> Informacje urzędowe</Link>
                <Link to="/kalkulatory"><Icon name="calc" /> Kalkulatory</Link>

                <span className="menu-sep" aria-hidden="true"></span>
                <button type="button" className="menu-logout" onClick={logout}>Wyloguj się</button>
              </>
            ) : (
              <>
                <span className="menu-section">Start</span>
                <Link to="/logowanie"><Icon name="person" /> Zaloguj się</Link>
                <Link to="/kalkulatory"><Icon name="calc" /> Kalkulatory</Link>
              </>
            )}
          </div>
        </details>
      </div>
    </header>
  );
}
