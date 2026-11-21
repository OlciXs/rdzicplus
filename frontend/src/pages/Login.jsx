import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.js";

const formatCode = (code) => `${code.slice(0, 3)} ${code.slice(3)}`;

export default function Login() {
  const { user, loading, login } = useAuth();
  const [step, setStep] = useState("start"); // "start" | "code" | "app"
  const [request, setRequest] = useState(null); // { requestId, code }
  const [profiles, setProfiles] = useState([]);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const reset = () => {
    setStep("start");
    setRequest(null);
    setProfiles([]);
    setCopied(false);
    setBusyId(null);
    setError("");
  };

  // Krok 1: prosimy backend o kod
  const start = async () => {
    setError("");
    setBusy(true);
    try {
      const data = await api("/api/auth/mobywatel/start", { method: "POST" });
      setRequest(data);
      setStep("code");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Krok 2: kopiujemy kod i "przechodzimy do aplikacji mObywatel"
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(request.code);
      setCopied(true);
    } catch {
      setCopied(false); // schowek niedostępny - nie blokujemy logowania
    }
    setStep("app");
  };

  // Krok 3: w "aplikacji" ładujemy listę osób
  useEffect(() => {
    if (step !== "app") return;
    api("/api/auth/mobywatel/profiles")
      .then((data) => setProfiles(data.profiles))
      .catch((err) => setError(err.message));
  }, [step]);

  const choose = async (profile) => {
    setError("");
    setBusyId(profile.id);
    try {
      await new Promise((r) => setTimeout(r, 800)); // pozór łączenia z serwerem
      const data = await api("/api/auth/mobywatel/confirm", {
        method: "POST",
        body: {
          requestId: request.requestId,
          code: request.code,
          profileId: profile.id,
        },
      });
      login(data);
    } catch (err) {
      setError(err.message);
      setBusyId(null);
    }
  };

  if (loading) return <p className="center-msg">Ładowanie aplikacji…</p>;
  // Zalogowany użytkownik nie widzi ekranu logowania.
  if (user) return <Navigate to="/panel" replace />;

  return (
    <main className="login">
      <header className="brand brand-center">
        <span className="brand-mark" aria-hidden="true">RP</span>
        <span className="brand-name">RodzicPlus</span>
      </header>

      {step === "start" && (
        <section className="card">
          <h1>Zaloguj się do RodzicPlus</h1>
          <p className="lead">Dane i kalkulatory będą dostępne po zalogowaniu.</p>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn btn-primary btn-big" onClick={start} disabled={busy}>
            {busy ? "Chwileczkę…" : "Zaloguj się mObywatelem"}
          </button>
          <p className="hint">To wersja demonstracyjna – bez prawdziwego logowania.</p>
        </section>
      )}

      {step === "code" && (
        <section className="card">
          <h1>Skopiuj kod logowania</h1>
          <p className="lead">Za chwilę wkleisz go w aplikacji mObywatel.</p>

          <div className="code-box" aria-live="polite">
            <span className="code-label">Twój kod</span>
            <span className="code-value">{formatCode(request.code)}</span>
          </div>

          <ol className="how-to">
            <li>Kliknij „Skopiuj kod”.</li>
            <li>Otwórz aplikację mObywatel.</li>
            <li>Wybierz swój profil.</li>
          </ol>

          <button className="btn btn-primary btn-big" onClick={copyCode}>
            Skopiuj kod
          </button>
          <button className="btn btn-link" onClick={reset}>Anuluj</button>
        </section>
      )}

      {step === "app" && (
        <section className="card sim-app">
          <div className="sim-header">
            <span className="sim-badge">Symulacja aplikacji mObywatel</span>
            <h1>Potwierdź logowanie</h1>
          </div>

          <p className="lead">
            {copied ? "Kod skopiowany ✓ " : ""}
            Kod logowania: <strong>{formatCode(request.code)}</strong>. Wybierz osobę, która się loguje.
          </p>

          {error && (
            <div role="alert">
              <p className="error">{error}</p>
              <button className="btn btn-outline" onClick={reset}>Zacznij od nowa</button>
            </div>
          )}

          {!error && profiles.length === 0 && <p className="hint">Ładowanie profili…</p>}

          <ul className="profile-list">
            {profiles.map((p) => (
              <li key={p.id}>
                <button
                  className="profile-btn"
                  onClick={() => choose(p)}
                  disabled={busyId !== null}
                >
                  <span className="avatar" aria-hidden="true">
                    {p.imie[0]}{p.nazwisko[0]}
                  </span>
                  <span className="profile-text">
                    <span className="profile-name">{p.imie} {p.nazwisko}</span>
                    <span className="profile-pesel">
                      {busyId === p.id ? "Logowanie…" : `PESEL ${p.peselMasked}`}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <button className="btn btn-link" onClick={reset} disabled={busyId !== null}>
            Anuluj
          </button>
        </section>
      )}

      <Link className="login-without-account" to="/kalkulatory">
        Chcesz sprawdzić świadczenia bez logowania? <strong>Otwórz kalkulatory</strong>
      </Link>
    </main>
  );
}
