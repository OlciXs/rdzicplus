import { useEffect, useState } from "react";
import AppHeader from "../components/AppHeader.jsx";
import { api } from "../api.js";
import { useProfile } from "../profile.js";
import { zapiszDaneDziecka } from "../engine/wnioski/dzieckoHelper.js";

/* =====================================================================
   Wniosek o odpis aktu urodzenia – SYMULACJA usługi z gov.pl
   (rejestr stanu cywilnego). Dane dziecka podstawiamy z „Moje dane”.
   Backend: POST/GET /api/usc/odpisy (backend/zus-mock.js).
   ===================================================================== */

const RODZAJE = [
  ["skrocony", "Skrócony – najczęściej potrzebny (np. do pracodawcy)"],
  ["zupelny", "Zupełny – pełna treść aktu"],
  ["wielojezyczny", "Wielojęzyczny – do urzędów w innych krajach UE"],
];
const ODBIOR = [
  ["elektronicznie", "Elektronicznie – dokument w skrzynce gov.pl"],
  ["usc", "Osobiście w urzędzie stanu cywilnego"],
];
const nazwa = (lista, v) => lista.find(([k]) => k === v)?.[1].split(" – ")[0] ?? v;

const PUSTY = { dzieckoIndex: "0", imie: "", nazwisko: "", dataUrodzenia: "", miejsceUrodzenia: "", rodzaj: "skrocony", odbior: "elektronicznie" };

export default function OdpisAktu() {
  const { profile, save } = useProfile();
  const [form, setForm] = useState(PUSTY);
  const [prefilled, setPrefilled] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [wynik, setWynik] = useState(null);
  const [odpisy, setOdpisy] = useState([]);
  const [savingToProfile, setSavingToProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  useEffect(() => {
    api("/api/usc/odpisy").then((d) => setOdpisy(d.odpisy)).catch(() => {});
  }, []);

  // Dane dziecka z „Moje dane” – raz, po wczytaniu profilu.
  useEffect(() => {
    if (!profile || prefilled) return;
    const d = profile.dziecko ?? {};
    const pierwsze = Array.isArray(d.dzieci) && d.dzieci.length ? d.dzieci[0] : d;
    setForm((f) => ({
      ...f,
      imie: pierwsze.imie || f.imie,
      nazwisko: pierwsze.nazwisko || f.nazwisko,
      dataUrodzenia: pierwsze.dataUrodzenia || d.dataUrodzenia || f.dataUrodzenia,
      miejsceUrodzenia: pierwsze.miejsceUrodzenia || d.miejsceUrodzenia || f.miejsceUrodzenia,
    }));
    setPrefilled(true);
  }, [profile, prefilled]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
    setProfileMsg("");
  };

  const zapiszDoProfilu = async () => {
    if (!profile) {
      setErrors({ _: "Nie masz załadowanego profilu. Zaloguj się i spróbuj ponownie." });
      return;
    }
    setSavingToProfile(true);
    setErrors({});
    setProfileMsg("");
    try {
      const newProfile = zapiszDaneDziecka(profile, form, form.dzieckoIndex);
      const result = await save(newProfile);
      if (result.ok) setProfileMsg("Zapisano dane dziecka w „Moje dane”.");
      else setErrors({ _: result.errors?._ || "Nie udało się zapisać danych do profilu." });
    } catch (err) {
      setErrors({ _: err.message || "Błąd podczas zapisywania do profilu." });
    } finally {
      setSavingToProfile(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setWynik(null);
    try {
      const res = await fetch("/api/usc/odpisy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("rodzicplus-token") ?? ""}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.errors ?? { _: data.error ?? "Nie udało się złożyć wniosku." });
        return;
      }
      setErrors({});
      setWynik(data.wniosek);
      setOdpisy((l) => [data.wniosek, ...l]);
    } catch {
      setErrors({ _: "Brak połączenia z serwerem." });
    } finally {
      setBusy(false);
    }
  };

  const pole = (k, label, props = {}) => (
    <label className="field">
      <span className="field-label">{label}</span>
      <input className={`input ${errors[k] ? "is-invalid" : ""}`} value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...props} />
      {errors[k] && <span className="field-error" role="alert">{errors[k]}</span>}
    </label>
  );

  const wybor = (k, label, lista) => (
    <label className="field">
      <span className="field-label">{label}</span>
      <select className="input" value={form[k]} onChange={set(k)}>
        {lista.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {errors[k] && <span className="field-error" role="alert">{errors[k]}</span>}
    </label>
  );

  const dzieciProfilu = profile?.dziecko?.dzieci?.length
    ? profile.dziecko.dzieci
    : (profile?.dziecko ? [profile.dziecko] : []);

  const wybierzDziecko = (e) => {
    const index = Number(e.target.value) || 0;
    const d = dzieciProfilu[index];
    setProfileMsg("");
    setForm((f) => ({
      ...f,
      dzieckoIndex: String(index),
      imie: d?.imie ?? "",
      nazwisko: d?.nazwisko ?? "",
      dataUrodzenia: d?.dataUrodzenia ?? profile?.dziecko?.dataUrodzenia ?? "",
      miejsceUrodzenia: d?.miejsceUrodzenia ?? profile?.dziecko?.miejsceUrodzenia ?? "",
    }));
  };

  return (
    <div className="app">
      <AppHeader />
      <main className="container">
        <h1>Odpis aktu urodzenia</h1>
        <p className="alert-inline" role="note">
          <span className="sim-badge">SYMULACJA</span> Wniosek nie trafia do urzędu. W docelowym wdrożeniu – usługa
          gov.pl (rejestr stanu cywilnego).
        </p>

        <section className="info-card">
          <h2>Czy w ogóle potrzebujesz odpisu?</h2>
          <p className="note">
            <b>Jeśli zasiłek macierzyński wypłaca ZUS – nie.</b> Wystarczy, że we wniosku podasz dane dziecka
            (imię, nazwisko, PESEL), a ZUS sam pobierze odpis z rejestru stanu cywilnego (§ 13 ust. 2 rozporządzenia z 27.09.2026).
            Odpis skrócony dołączasz, gdy zasiłek wypłaca pracodawca (zgłasza ponad 20 ubezpieczonych) – razem z wnioskiem
            o urlop – oraz w urzędach za granicą.
          </p>
        </section>

        <form className="profile-form" onSubmit={onSubmit} noValidate>
          <section className="calc-group">
            <h2 className="calc-group-title">Dane dziecka</h2>
            <p className="group-hint">{prefilled && profile?.dziecko?.imie ? "Podstawiliśmy dane z „Moje dane”." : "Uzupełnij dane dziecka z aktu urodzenia."}</p>
            <div className="calc-grid">
              {dzieciProfilu.length > 1 && (
                <label className="field field-wide">
                  <span className="field-label">Dla którego dziecka składasz wniosek?</span>
                  <select className="input" value={form.dzieckoIndex} onChange={wybierzDziecko}>
                    {dzieciProfilu.map((d, i) => (
                      <option key={i} value={i}>{i + 1}. {[d.imie, d.nazwisko].filter(Boolean).join(" ") || `Dziecko ${i + 1}`}</option>
                    ))}
                  </select>
                </label>
              )}
              {pole("imie", "Imię")}
              {pole("nazwisko", "Nazwisko")}
              {pole("dataUrodzenia", "Data urodzenia", { type: "date" })}
              {pole("miejsceUrodzenia", "Miejsce urodzenia")}
            </div>
          </section>

          <section className="calc-group">
            <h2 className="calc-group-title">Odpis</h2>
            <div className="calc-grid">
              {wybor("rodzaj", "Rodzaj odpisu", RODZAJE)}
              {wybor("odbior", "Sposób odbioru", ODBIOR)}
            </div>
          </section>

          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Wysyłam…" : "Złóż wniosek"}
            </button>
            <button className="btn btn-outline" type="button" onClick={zapiszDoProfilu} disabled={savingToProfile}>
              {savingToProfile ? "Zapisuję…" : "Zapisz w „Moje dane”"}
            </button>
            {errors._ && <span className="field-error" role="alert">{errors._}</span>}
            {profileMsg && <span className="form-ok" role="status">{profileMsg}</span>}
          </div>
        </form>

        {wynik && (
          <section className="result-card" role="status">
            <h2 className="result-title">Wniosek przyjęty ✓</h2>
            <dl className="data-list">
              <div><dt>Numer wniosku</dt><dd>{wynik.numer}</dd></div>
              <div><dt>Dziecko</dt><dd>{wynik.imie} {wynik.nazwisko}, ur. {new Date(wynik.dataUrodzenia).toLocaleDateString("pl-PL")}</dd></div>
              <div><dt>Odpis</dt><dd>{nazwa(RODZAJE, wynik.rodzaj)}, {nazwa(ODBIOR, wynik.odbior).toLowerCase()}</dd></div>
              <div><dt>Status</dt><dd>{wynik.status}</dd></div>
            </dl>
          </section>
        )}

        {odpisy.length > 0 && (
          <section className="result-card">
            <h2 className="result-title">Twoje wnioski</h2>
            <div className="table-wrap">
              <table className="calc-table">
                <thead><tr><th>Numer</th><th>Dziecko</th><th>Rodzaj</th><th>Złożono</th><th>Status</th></tr></thead>
                <tbody>
                  {odpisy.map((o) => (
                    <tr key={o.numer}>
                      <td>{o.numer}</td><td>{o.imie} {o.nazwisko}</td><td>{nazwa(RODZAJE, o.rodzaj)}</td>
                      <td>{new Date(o.zlozono).toLocaleDateString("pl-PL")}</td><td>{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
