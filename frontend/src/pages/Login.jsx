import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { api } from "../api.js";
import { useAuth } from "../auth.js";

// B-18: backend w trybie produkcyjnym (DEMO_MODE=0) nie zwraca kodu — wtedy go nie pokazujemy.
const formatCode = (code) => (code ? `${code.slice(0, 3)} ${code.slice(3)}` : "••• •••");

export default function Login() {
  const { user, loading, login } = useAuth();
  const [step, setStep] = useState("start"); // "start" | "code" | "app"
  const [request, setRequest] = useState(null); // { requestId, code }
  const [kod, setKod] = useState(""); // ręcznie wpisany kod, gdy backend nie zwraca go w DEMO_MODE=0
  const [profiles, setProfiles] = useState([]);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const reset = () => {
    setStep("start");
    setRequest(null);
    setKod("");
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
      setKod("");
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
      if (request.code) await navigator.clipboard.writeText(request.code);
      setCopied(!!request.code);
    } catch {
      setCopied(false); // schowek niedostępny - nie blokujemy logowania
    }
    if (!request.code && !kod.trim()) {
      setError("Wpisz kod z aplikacji mObywatel.");
      return;
    }
    setError("");
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
          code: request.code || kod.trim(),
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
        <Logo size={44} />
        <span className="brand-name">RodzicPlus</span>
      </header>

      {step === "start" && (
        <section className="card">
          <h1>Zaloguj się do RodzicPlus</h1>
          <p className="lead">Po zalogowaniu zapiszesz swoje dane – kalkulatory, wnioski i kalendarz same je podstawią. Kalkulatory działają też bez logowania.</p>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn btn-primary btn-big" onClick={start} disabled={busy}>
            {busy ? "Chwileczkę…" : "Zaloguj się mObywatelem"}
          </button>
          <p className="hint">To wersja demonstracyjna: logowanie mObywatelem jest symulowane, do wyboru są 4 przykładowe profile z fikcyjnymi danymi.</p>
        </section>
      )}

      {step === "code" && (
        <section className="card">
          <h1>{request.code ? "Skopiuj kod logowania" : "Wpisz kod logowania"}</h1>
          <p className="lead">
            {request.code
              ? "Za chwilę wkleisz go w aplikacji mObywatel."
              : "Kod wyświetla aplikacja mObywatel – wpisz go tutaj."}
          </p>

          <div className="code-box" aria-live="polite">
            <span className="code-label">Twój kod</span>
            <span className="code-value">{formatCode(request.code)}</span>
          </div>

          {!request.code && (
            <label className="field">
              <span className="field-label">Wpisz kod z aplikacji mObywatel</span>
              <input
                className="input"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={kod}
                onChange={(e) => { setKod(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                placeholder="000000"
              />
            </label>
          )}

          {error && <p className="error" role="alert">{error}</p>}

          <ol className="how-to">
            {request.code ? (
              <>
                <li>Kliknij „Skopiuj kod”.</li>
                <li>Otwórz aplikację mObywatel.</li>
                <li>Wybierz swój profil.</li>
              </>
            ) : (
              <>
                <li>Otwórz aplikację mObywatel.</li>
                <li>Wpisz kod widoczny w aplikacji.</li>
                <li>Wybierz swój profil.</li>
              </>
            )}
          </ol>

          <button className="btn btn-primary btn-big" onClick={copyCode}>
            {request.code ? "Skopiuj kod" : "Dalej"}
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
            Kod logowania: <strong>{formatCode(request.code || kod.trim())}</strong>. Wybierz osobę, która się loguje.
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
