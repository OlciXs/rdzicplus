import { useEffect, useMemo, useState } from "react";
import {
  Navigate, Route, Routes, useLocation, useNavigate,
} from "react-router-dom";
import { api } from "./api.js";
import { AuthContext } from "./auth.js";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Landing from "./pages/Landing.jsx";
import KalkulatoryList from "./pages/KalkulatoryList.jsx";
import Kalkulator from "./pages/Kalkulator.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import NotFound from "./pages/NotFound.jsx";
import Admin from "./pages/Admin.jsx";

const TOKEN_KEY = "rodzicplus-token";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    api("/api/auth/me")
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => window.localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  // Przewijanie do góry przy każdej zmianie adresu.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  const login = ({ token, user: loggedInUser }) => {
    window.localStorage.setItem(TOKEN_KEY, token);
    setError("");
    setUser(loggedInUser);
    // Wracamy tam, gdzie użytkownik zmierzał przed zalogowaniem.
    const from = location.state?.from?.pathname || "/panel";
    navigate(from, { replace: true });
  };

  const logout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch (err) {
      setError(err.message);
    } finally {
      window.localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      navigate("/", { replace: true });
    }
  };

  const auth = useMemo(
    () => ({ user, loading, error, login, logout }),
    [user, loading, error]
  );

  return (
    <AuthContext.Provider value={auth}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/logowanie" element={<Login />} />

        {/* Strefa zalogowanego użytkownika */}
        <Route
          path="/panel"
          element={
            <RequireAuth loading={loading} user={user}>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/profil"
          element={
            <RequireAuth loading={loading} user={user}>
              <ProfilePage />
            </RequireAuth>
          }
        />

        {/* Kalkulatory – dostępne publicznie */}
        <Route path="/kalkulatory" element={<KalkulatoryList />} />
        <Route path="/kalkulatory/:slug" element={<Kalkulator />} />

        {/* Przekierowania zgodności ze starym adresem */}
        <Route path="/kalkulatory/index" element={<Navigate to="/kalkulatory" replace />} />

        {/* Panel administratora: parametry kalkulatorów (zapis chroniony hasłem po stronie API) */}
        <Route path="/admin" element={<Admin />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthContext.Provider>
  );
}

// Ochrona tras: jeśli użytkownik nie jest zalogowany, odsyłamy do logowania
// i zapamiętujemy, dokąd chciał trafić.
function RequireAuth({ loading, user, children }) {
  const location = useLocation();
  if (loading) return <p className="center-msg">Ładowanie aplikacji…</p>;
  if (!user) return <Navigate to="/logowanie" replace state={{ from: location }} />;
  return children;
}
