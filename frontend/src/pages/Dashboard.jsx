import { useState } from "react";

const STEPS = [
  {
    id: "usc",
    title: "Zgłoś urodzenie dziecka",
    where: "Urząd Stanu Cywilnego",
    desc: "Masz na to 21 dni. Dostaniesz akt urodzenia.",
  },
  {
    id: "pesel",
    title: "Nadaj dziecku numer PESEL",
    where: "Urząd (zwykle razem z aktem urodzenia)",
    desc: "PESEL będzie potrzebny w każdym kolejnym wniosku.",
  },
  {
    id: "macierzynski",
    title: "Zasiłek macierzyński",
    where: "ZUS lub pracodawca",
    desc: "Pieniądze za czas urlopu po urodzeniu dziecka.",
  },
  {
    id: "rodzicielski",
    title: "Urlop rodzicielski",
    where: "Pracodawca",
    desc: "Dodatkowy urlop, który możecie podzielić z drugim rodzicem.",
  },
  {
    id: "800plus",
    title: "Świadczenie 800 plus",
    where: "ZUS (PUE ZUS) lub bank",
    desc: "Miesięczne wsparcie na każde dziecko.",
  },
];

export default function Dashboard({ user, onLogout }) {
  const [done, setDone] = useState([]);

  const toggle = (id) =>
    setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  const percent = Math.round((done.length / STEPS.length) * 100);
  const next = STEPS.find((s) => !done.includes(s.id));

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">R+</span>
          <span className="brand-name">RodzicPlus</span>
        </div>
        <button className="btn btn-outline" onClick={onLogout}>Wyloguj</button>
      </header>

      <main className="container">
        <h1>Cześć, {user.imie}! 👋</h1>
        <p className="lead">Oto Twoja lista spraw po narodzinach dziecka.</p>

        <section className="info-card" aria-label="Twoje dane">
          <h2>Twoje dane z mObywatela</h2>
          <dl className="data-list">
            <div><dt>Imię i nazwisko</dt><dd>{user.imie} {user.nazwisko}</dd></div>
            <div><dt>PESEL</dt><dd>{user.peselMasked}</dd></div>
          </dl>
        </section>

        <section className="progress-card" aria-label="Postęp">
          <div className="progress-top">
            <strong>Zrobione: {done.length} z {STEPS.length}</strong>
            <span>{percent}%</span>
          </div>
          <progress className="bar" value={percent} max="100" aria-label="Postęp spraw" />
          <p className="next">
            {next ? <>Następny krok: <strong>{next.title}</strong></> : "Brawo! Wszystko załatwione 🎉"}
          </p>
        </section>

        <ul className="steps">
          {STEPS.map((s) => {
            const isDone = done.includes(s.id);
            return (
              <li key={s.id} className={`step ${isDone ? "is-done" : ""}`}>
                <label className="step-row">
                  <input type="checkbox" checked={isDone} onChange={() => toggle(s.id)} />
                  <span className="step-body">
                    <span className="step-title">{s.title}</span>
                    <span className="step-desc">{s.desc}</span>
                    <span className="step-where">Gdzie: {s.where}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
