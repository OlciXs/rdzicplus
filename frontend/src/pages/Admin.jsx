import { useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import { CFG, applyParams, num } from "../calculators/config.js";
import { DEFAULT_PARAMS, PARAM_GROUPS, diffParams } from "../engine/index.js";

// Wartości z formularza trzymamy jako tekst (żeby dało się wpisać „81,5”).
const toForm = (params) =>
  Object.fromEntries(
    Object.entries(params).map(([k, v]) => [
      k,
      typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([sk, sv]) => [sk, String(sv)])) : String(v),
    ])
  );

const fromForm = (form) =>
  Object.fromEntries(
    Object.entries(form).map(([k, v]) => [
      k,
      typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([sk, sv]) => [sk, num(sv)])) : num(v),
    ])
  );

export default function Admin() {
  const [form, setForm] = useState(() => toForm(CFG));
  const [haslo, setHaslo] = useState("");
  const [msg, setMsg] = useState(null); // { tone, text }
  const [busy, setBusy] = useState(false);

  const zmiany = diffParams(fromForm(form));
  const liczbaZmian = Object.values(zmiany).reduce(
    (n, v) => n + (typeof v === "object" ? Object.keys(v).length : 1),
    0
  );

  const setVal = (key, sub) => (e) => {
    const v = e.target.value;
    setForm((f) => (sub === undefined ? { ...f, [key]: v } : { ...f, [key]: { ...f[key], [sub]: v } }));
  };

  const send = async (method, body) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/params", {
        method,
        headers: { "Content-Type": "application/json", "x-admin-password": haslo },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Nie udało się zapisać parametrów.");
      applyParams(data.overrides);
      setForm(toForm(CFG));
      setMsg({
        tone: "ok",
        text: method === "DELETE"
          ? "Przywrócono wartości domyślne. Kalkulatory liczą od teraz według nich."
          : "Zapisano. Kalkulatory liczą od teraz według nowych parametrów (dla wszystkich użytkowników).",
      });
    } catch (err) {
      setMsg({ tone: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const field = (key, sub) => {
    const value = sub === undefined ? form[key] : form[key][sub];
    const def = sub === undefined ? DEFAULT_PARAMS[key] : DEFAULT_PARAMS[key][sub];
    const changed = num(value) !== def;
    return (
      <input
        className="input"
        type="text"
        inputMode="decimal"
        value={value}
        onChange={setVal(key, sub)}
        aria-label={sub === undefined ? key : `${key} – ${sub}`}
        style={changed ? { borderColor: "var(--color-primary)", background: "var(--color-primary-soft)" } : undefined}
      />
    );
  };

  return (
    <div className="app">
      <AppHeader />
      <main className="kalkulator-page">
        <nav className="breadcrumb" aria-label="Ścieżka">
          <Link className="breadcrumb-link" to="/">Strona główna</Link>
          <span className="breadcrumb-sep">/</span>
          <span aria-current="page">Panel administratora</span>
        </nav>

        <div className="hero">
          <h1>Parametry kalkulatorów</h1>
          <p className="lead">
            Stawki, limity i terminy z przepisów. Zmiana przepisów = zmiana parametru tutaj, bez
            wdrażania nowej wersji. Podświetlone pola różnią się od wartości domyślnych (stan prawny 2026).
          </p>
        </div>

        {PARAM_GROUPS.map((g) => (
          <section className="calc-group" key={g.tytul}>
            <h2 className="calc-group-title">{g.tytul}</h2>
            <div className="calc-grid">
              {Object.entries(g.klucze).map(([key, opis]) =>
                typeof DEFAULT_PARAMS[key] === "object" ? (
                  <div className="field field-wide" key={key}>
                    <span className="field-label">{opis}</span>
                    <div className="calc-grid">
                      {Object.keys(DEFAULT_PARAMS[key]).map((sub) => (
                        <label className="field" key={sub}>
                          <span className="field-hint">{sub === "przyjete" ? "dziecko przyjęte" : /^\d+$/.test(sub) ? `${sub}${sub === "5" ? "+" : ""} dzieci` : sub}</span>
                          {field(key, sub)}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <label className="field" key={key}>
                    <span className="field-label">{opis}</span>
                    {field(key)}
                    <span className="field-hint">domyślnie {String(DEFAULT_PARAMS[key]).replace(".", ",")}</span>
                  </label>
                )
              )}
            </div>
          </section>
        ))}

        <section className="calc-group">
          <h2 className="calc-group-title">Zapis</h2>
          <div className="calc-grid">
            <label className="field">
              <span className="field-label">Hasło administratora</span>
              <input className="input" type="password" autoComplete="current-password" value={haslo} onChange={(e) => setHaslo(e.target.value)} />
              <span className="field-hint">W wersji demonstracyjnej hasło jest w README.</span>
            </label>
          </div>
          <p className="note">Zmienionych wartości: {liczbaZmian}.</p>
          {msg && <p className={`alert-inline`} role="status"><span className={`badge b-${msg.tone}`}>{msg.tone === "ok" ? "OK" : "BŁĄD"}</span> {msg.text}</p>}
          <div className="landing-actions">
            <button className="btn btn-primary" disabled={busy || !haslo} onClick={() => send("PUT", { overrides: zmiany })}>
              {busy ? "Zapisywanie…" : "Zapisz parametry"}
            </button>
            <button className="btn btn-outline" disabled={busy || !haslo} onClick={() => send("DELETE")}>
              Przywróć domyślne
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
