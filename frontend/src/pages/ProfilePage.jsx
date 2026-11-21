import { useEffect, useState } from "react";
import AppHeader from "../components/AppHeader.jsx";
import { useAuth } from "../auth.js";
import { useProfile } from "../profile.js";

const STATUSY = [
  ["pracownik", "Pracownik (umowa o pracę)"],
  ["zlecenie", "Umowa zlecenia"],
  ["dg", "Działalność gospodarcza"],
  ["duchowny", "Duchowny"],
  ["marynarz", "Marynarz"],
];

// Tylko dane stałe / powtarzalne. To, co zmienne lub jednorazowe (dni ubezpieczenia,
// zaległość składkowa, data porodu, oświadczenia), pyta kalkulator za każdym razem.
const SECTIONS = [
  {
    key: "ubezpieczony",
    title: "Twoje dane do wniosków",
    hint: "Imię, nazwisko, PESEL i datę urodzenia mamy już z mObywatela.",
    fields: [
      { name: "adres", label: "Adres zamieszkania", placeholder: "ul. Kwiatowa 5/12, 00-001 Warszawa", wide: true },
      { name: "rachunek", label: "Numer rachunku bankowego", placeholder: "00 0000 0000 0000 0000 0000 0000", hint: "Na ten rachunek ZUS wypłaci zasiłek.", wide: true },
      { name: "statusUbezpieczenia", label: "Tytuł ubezpieczenia", type: "select", options: STATUSY },
      { name: "podstawaWymiaru", label: "Podstawa wymiaru zasiłku (zł/mies.)", type: "money", hint: "Jeśli jej nie znasz, policz ją w kalkulatorze „Podstawa wymiaru”." },
    ],
  },
  {
    key: "platnik",
    title: "Pracodawca / płatnik składek",
    hint: "Jeśli prowadzisz działalność, wpisz dane swojej firmy.",
    fields: [
      { name: "nazwa", label: "Nazwa", wide: true },
      { name: "adres", label: "Adres", wide: true },
      { name: "nip", label: "NIP", placeholder: "0000000000", inputMode: "numeric" },
      { name: "regon", label: "REGON", placeholder: "000000000", inputMode: "numeric" },
    ],
  },
  {
    key: "drugiRodzic",
    title: "Drugi rodzic",
    hint: "Potrzebne, gdy dzielicie się urlopem lub zasiłkiem. Możesz pominąć.",
    fields: [
      { name: "imie", label: "Imię" },
      { name: "nazwisko", label: "Nazwisko" },
      { name: "pesel", label: "PESEL", inputMode: "numeric" },
      { name: "podstawaWymiaru", label: "Podstawa wymiaru zasiłku (zł/mies.)", type: "money" },
    ],
  },
  {
    key: "dziecko",
    title: "Dziecko",
    hint: "Data urodzenia dziecka wyznacza wszystkie terminy w kalkulatorach.",
    fields: [
      { name: "imie", label: "Imię dziecka" },
      { name: "nazwisko", label: "Nazwisko dziecka" },
      { name: "pesel", label: "PESEL dziecka (jeśli nadany)", inputMode: "numeric" },
      { name: "dataUrodzenia", label: "Data urodzenia", type: "date" },
      { name: "miejsceUrodzenia", label: "Miejsce urodzenia" },
      { name: "liczbaDzieci", label: "Liczba dzieci z jednego porodu", type: "number", min: 1, max: 10, hint: "1 = pojedynczy poród, 2 = bliźnięta itd." },
      { name: "zaZyciem", label: "Oświadczenie „Za życiem” (ciężkie, nieodwracalne upośledzenie dziecka)", type: "checkbox", wide: true },
    ],
  },
];

const toStr = (v) => (v === null || v === undefined ? "" : String(v));

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, updatedAt, loading, save } = useProfile();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error

  useEffect(() => {
    if (profile && !form) setForm(profile);
  }, [profile, form]);

  const set = (section, name, value) => {
    setForm((f) => ({ ...f, [section]: { ...f[section], [name]: value } }));
    setErrors((e) => {
      const next = { ...e };
      delete next[`${section}.${name}`];
      return next;
    });
    setStatus("idle");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("saving");
    const res = await save(form);
    if (res.ok) {
      setErrors({});
      setStatus("saved");
    } else {
      setErrors(res.errors);
      setStatus("error");
    }
  };

  return (
    <div className="app">
      <AppHeader />

      <main className="container">
        <h1>Moje dane</h1>
        <p className="lead">
          Wpisz je raz - kalkulatory same je podstawią, więc nie musisz niczego powtarzać.
          Wszystkie pola są opcjonalne, możesz uzupełniać stopniowo.
        </p>

        {loading || !form ? (
          <p className="center-msg">Wczytywanie…</p>
        ) : (
          <form className="profile-form" onSubmit={onSubmit} noValidate>
            <section className="info-card" aria-label="Dane z mObywatela">
              <h2>Z mObywatela</h2>
              <dl className="data-list">
                <div><dt>Imię i nazwisko</dt><dd>{form.ubezpieczony.imie} {form.ubezpieczony.nazwisko}</dd></div>
                <div><dt>PESEL</dt><dd>{form.ubezpieczony.peselMasked ?? user?.peselMasked}</dd></div>
                <div><dt>Data urodzenia</dt><dd>{form.ubezpieczony.dataUrodzenia || "-"}</dd></div>
              </dl>
            </section>

            {SECTIONS.map((sec) => (
              <section key={sec.key} className="calc-group" aria-labelledby={`h-${sec.key}`}>
                <h2 id={`h-${sec.key}`} className="calc-group-title">{sec.title}</h2>
                <p className="group-hint">{sec.hint}</p>
                <div className="calc-grid">
                  {sec.fields.map((f) => {
                    const id = `${sec.key}-${f.name}`;
                    const err = errors[`${sec.key}.${f.name}`];
                    const value = form[sec.key][f.name];
                    const cls = `field ${f.wide ? "field-wide" : ""}`;

                    if (f.type === "checkbox") {
                      return (
                        <div key={id} className={cls}>
                          <label className="check">
                            <input type="checkbox" checked={!!value} onChange={(e) => set(sec.key, f.name, e.target.checked)} />
                            <span>{f.label}</span>
                          </label>
                        </div>
                      );
                    }

                    return (
                      <div key={id} className={cls}>
                        <label className="field-label" htmlFor={id}>{f.label}</label>
                        {f.type === "select" ? (
                          <select id={id} className="input" value={toStr(value)} onChange={(e) => set(sec.key, f.name, e.target.value)}>
                            <option value="">- wybierz -</option>
                            {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        ) : (
                          <input
                            id={id}
                            className={`input ${err ? "is-invalid" : ""}`}
                            type={f.type === "money" ? "text" : f.type ?? "text"}
                            inputMode={f.type === "money" ? "decimal" : f.inputMode}
                            min={f.min}
                            max={f.max}
                            placeholder={f.placeholder}
                            value={toStr(value)}
                            onChange={(e) => set(sec.key, f.name, e.target.value)}
                            aria-invalid={!!err}
                            aria-describedby={err ? `${id}-err` : undefined}
                          />
                        )}
                        {err ? (
                          <span id={`${id}-err`} className="field-error" role="alert">{err}</span>
                        ) : (
                          f.hint && <span className="field-hint">{f.hint}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={status === "saving"}>
                {status === "saving" ? "Zapisuję…" : "Zapisz dane"}
              </button>
              {status === "saved" && <span className="form-ok" role="status">Zapisano ✓</span>}
              {status === "error" && (
                <span className="field-error" role="alert">{errors._ ?? "Popraw zaznaczone pola."}</span>
              )}
              {updatedAt && status === "idle" && (
                <span className="field-hint">Ostatnio zapisano: {new Date(updatedAt).toLocaleString("pl-PL")}</span>
              )}
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
