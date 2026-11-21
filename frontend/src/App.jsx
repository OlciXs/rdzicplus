import { useEffect, useState } from "react";
import { api } from "./api.js";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";

const TOKEN_KEY = "rodzicplus-token";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const handleLogin = ({ token, user: loggedInUser }) => {
    window.localStorage.setItem(TOKEN_KEY, token);
    setError("");
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch (err) {
      setError(err.message);
    } finally {
      window.localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  };

  if (loading) {
    return <p className="center-msg">Ładowanie aplikacji…</p>;
  }

  if (user) {
    return (
      <>
        {error && <p className="error center-msg" role="alert">{error}</p>}
        <Dashboard user={user} onLogout={handleLogout} />
      </>
    );
  }

  return <Login onLogin={handleLogin} />;
}
