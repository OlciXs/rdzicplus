import { Link } from "react-router-dom";
import { useAuth } from "../auth.js";

/**
 * Wspólny pasek górny z marką aplikacji.
 * - `actions` – dodatkowe przyciski po prawej (np. „Wyloguj”).
 * - logo zawsze prowadzi do strony głównej.
 */
export default function AppHeader({ actions = null, children = null }) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <Link to="/" className="brand brand-link" aria-label="RodzicPlus – strona główna">
        <span className="brand-mark" aria-hidden="true">R+</span>
        <span className="brand-name">RodzicPlus</span>
      </Link>
      {children}
      <div className="topbar-actions">
        {user && <span className="topbar-user">Cześć, {user.imie}</span>}
        {actions}
      </div>
    </header>
  );
}
