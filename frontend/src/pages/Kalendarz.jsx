import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import { useProfile } from "../profile.js";

const MS_DAY = 86400000;
const fmt = (d) => d ? d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }) : "—";
const dateFrom = (value) => {
  if (!value) return null;
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaFinite(d.getTime()) ? d : null;
};
const addDays = (d, days) => d ? new Date(d.getTime() + days * MS_DAY) : null;
const addMonths = (d, months) => {
  if (!d) return null;
  const out = new Date(d);
  out.setMonth(out.getMonth() + months);
  return out;
};

const event = (id, title, deadline, document, source, person, note = "") => ({
  id, title, deadline, document, source, person, note,
  reminder: deadline ? addDays(deadline, -7) : null,
});

function normalizeChildren(dziecko) {
  if (Array.isArray(dziecko?.dzieci) && dziecko.dzieci.length) {
    return dziecko.dzieci;
  }
  return dziecko ? [dziecko] : [];
}

function buildEvents(profile) {
  if (!profile) return [];
  const sytuacja = profile.situacja ?? profile.sytuacja ?? {};
  const dziecko = profile.dziecko ?? {};
  const dzieci = normalizeChildren(dziecko);
  const etap = sytuacja.etap;
  const role = sytuacja.rola;
  const anchors = dzieci.map((d) => dateFrom(d.dataUrodzenia)).filter(Boolean);
  const birth = anchors[0] ?? dateFrom(dziecko.dataUrodzenia);
  const adoption = dateFrom(dziecko.dataPrzyjecia);
  const due = dateFrom(dziecko.przewidywanaDataPorodu);
  const out = [];

  if (etap === "ciaza" && due && role === "matka") {
    const leaveStart = addDays(due, -42);
    out.push(event("macierzynski-przed", "Wniosek o urlop i zasiłek macierzyński przed porodem",
      addDays(leaveStart, -14), "Wniosek o urlop macierzyński + zaświadczenie lekarskie o terminie porodu",
      "Poradnik ZUS 2026, s. 27–29", "Mama", "Urlop przed porodem może rozpocząć się najwcześniej 6 tygodni przed przewidywanym porodem."));
  }

  if ((etap === "po_porodzie" || birth) && role === "matka") {
    if (birth) {
      out.push(event("macierzynski-po", "Wniosek o zasiłek macierzyński po porodzie",
        addDays(birth, 21), "ZAM albo wniosek do pracodawcy",
        "Poradnik ZUS 2026, s. 27–30", "Mama", "Termin ma szczególne znaczenie dla wyboru wariantu 81,5% na cały okres."));
      out.push(event("wariant-815", "Pisemny wniosek o wariant 81,5%",
        addDays(birth, 21), "Oświadczenie / wniosek o wariant 81,5%",
        "Poradnik ZUS 2026 i ustawa zasiłkowa", "Mama", "Po 21 dniach zostaje wariant 100% za urlop macierzyński i 70% za rodzicielski."));
    }
  }

  if (dziecko.pobytWSzpitalu === "tak" && dziecko.szpitalDo && birth) {
    out.push(event("uzupelniajacy", "Wniosek o uzupełniający urlop macierzyński",
      addDays(dateFrom(dziecko.terminKoncaMacierzynskiego) ?? birth, -21),
      "Wniosek o uzupełniający urlop macierzyński + zaświadczenie ze szpitala",
      "Kodeks pracy, art. 180²", "Mama", "Składać co najmniej 21 dni przed zakończeniem podstawowego urlopu macierzyńskiego."));
  }

  if (birth && role === "ojciec") {
    const deadline = new Date(birth);
    deadline.setMonth(deadline.getMonth() + 12);
    out.push(event("ojcowski", "Wniosek i wykorzystanie urlopu ojcowskiego",
      deadline, "Wniosek o urlop ojcowski",
      "Kodeks pracy, art. 182³", "Ojciec", "Prawo wygasa po ukończeniu przez dziecko 12 miesięcy życia."));
  }

  if (birth) {
    const deadline = new Date(birth.getFullYear() + 6, 11, 31);
    out.push(event("rodzicielski", "Ostateczny termin wykorzystania urlopu rodzicielskiego",
      deadline, "Wniosek o urlop rodzicielski",
      "Kodeks pracy, art. 182¹d", "Mama i ojciec", "Urlop należy wykorzystać do końca roku kalendarzowego, w którym dziecko kończy 6 lat."));
  }

  if (adoption) {
    out.push(event("adopcja", "Wniosek o urlop na warunkach macierzyńskiego po przyjęciu dziecka",
      addDays(adoption, 7), "Wniosek o urlop na warunkach urlopu macierzyńskiego",
      "Kodeks pracy, art. 183", "Rodzic", "Wniosek najlepiej złożyć najpóźniej w ciągu 7 dni od przyjęcia dziecka."));
  }

  if (dziecko.potrzebaOpieki && dziecko.potrzebaOpieki !== "brak") {
    out.push(event("opiekunczy", "Złożenie wniosku o zasiłek opiekuńczy",
      null, "Z-15A albo Z-15B / wniosek przez ZUS",
      "Poradnik ZUS 2026, s. 36–38", "Rodzic", "Zasiłek nie jest wypłacany automatycznie i należy go zgłosić na okres opieki."));
  }

  if (dziecko.zmarlo === "tak" || dziecko.martwe === "tak") {
    const pochowek = dateFrom(dziecko.dataZgonu) ?? birth;
    out.push(event("pogrzebowy", "Wniosek o zasiłek pogrzebowy",
      addMonths(pochowek, 12), "Z-12 + rachunki za pogrzeb",
      "Poradnik ZUS 2026", "Osoba pokrywająca koszty", "Najpóźniej w ciągu 12 miesięcy od dnia pochówku."));
  }

  // Deduplikacja przez identyfikator formularza/świadczenia.
  const seen = new Set();
  return out.filter((x) => {
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  }).sort((a, b) => (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity));
}

export default function Kalendarz() {
  const { profile, loading } = useProfile();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [completed, setCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rodzicplus-calendar-completed") || "{}"); }
    catch { return {}; }
  });

  const events = useMemo(() => buildEvents(profile), [profile]);
  useEffect(() => {
    const nearest = events
      .map((item) => item.deadline)
      .filter((deadline) => deadline instanceof Date)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    if (nearest) setCursor(new Date(nearest.getFullYear(), nearest.getMonth(), 1));
  }, [events]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthEvents = events.filter((e) => e.deadline &&
    e.deadline.getFullYear() === cursor.getFullYear() &&
    e.deadline.getMonth() === cursor.getMonth());

  const toggleCompleted = (id) => {
    setCompleted((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("rodzicplus-calendar-completed", JSON.stringify(next));
      return next;
    });
  };

  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const offset = (cursor.getDay() + 6) % 7;
  const calendarCells = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  if (loading) return <div className="app"><AppHeader /><main className="container"><p className="center-msg">Wczytywanie…</p></main></div>;

  return (
    <div className="app calendar-page">
      <AppHeader />
      <main className="container">
        <h1>Kalendarz terminów</h1>
        <p className="lead">Ostateczne daty składania wniosków i przypomnienia 7 dni wcześniej, liczone na podstawie Twoich danych.</p>

        <section className="info-card">
          <div className="calendar-toolbar">
            <button className="btn btn-outline" type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>‹</button>
            <h2>{cursor.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}</h2>
            <button className="btn btn-outline" type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>›</button>
          </div>
          <div className="calendar-grid" aria-label="Kalendarz miesięczny">
            {["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"].map((d) => <div className="calendar-weekday" key={d}>{d}</div>)}
            {calendarCells.map((day, i) => {
              const dayEvents = day ? monthEvents.filter((e) => e.deadline.getDate() === day) : [];
              const reminderEvents = day ? events.filter((e) => e.reminder &&
                e.reminder.getFullYear() === cursor.getFullYear() &&
                e.reminder.getMonth() === cursor.getMonth() &&
                e.reminder.getDate() === day) : [];
              return (
                <div className={`calendar-day ${day ? "" : "calendar-empty"}`} key={i}>
                  {day && <span className="calendar-day-number">{day}</span>}
                  {dayEvents.map((e) => <span className="calendar-dot deadline" title={e.title} key={e.id}>Termin</span>)}
                  {reminderEvents.map((e) => <span className="calendar-dot reminder" title={e.title} key={`r-${e.id}`}>Za 7 dni</span>)}
                </div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="najblizsze">
          <h2 id="najblizsze">Najbliższe i najważniejsze terminy</h2>
          {events.length === 0 ? (
            <div className="info-card">
              <p>Uzupełnij etap, rolę i daty dziecka, aby kalendarz dobrał właściwe wnioski.</p>
              <Link className="btn btn-primary" to="/profil?krok=dziecko">Uzupełnij dane dziecka</Link>
            </div>
          ) : events.map((e) => {
            const overdue = e.deadline && e.deadline < today;
            const soon = e.deadline && !overdue && e.deadline <= addDays(today, 7);
            return (
              <article className={`calendar-event ${completed[e.id] ? "is-completed" : ""}`} key={e.id}>
                <div className="calendar-event-main">
                  <span className={`badge ${overdue ? "b-err" : soon ? "b-warn" : "b-ok"}`}>
                    {overdue ? "Termin minął" : soon ? "Pilne" : "Planowane"}
                  </span>
                  <h3>{e.title}</h3>
                  <dl className="data-list">
                    {e.deadline && <div><dt>Ostateczny termin</dt><dd>{fmt(e.deadline)}</dd></div>}
                    {e.reminder && <div><dt>Przypomnienie</dt><dd>{fmt(e.reminder)}</dd></div>}
                    <div><dt>Dokument</dt><dd>{e.document}</dd></div>
                    <div><dt>Dla</dt><dd>{e.person}</dd></div>
                    <div><dt>Źródło</dt><dd>{e.source}</dd></div>
                  </dl>
                  {e.note && <p className="hint">{e.note}</p>}
                </div>
                {e.deadline && (
                  <button type="button" className="btn btn-outline" onClick={() => toggleCompleted(e.id)}>
                    {completed[e.id] ? "↩ Przywróć" : "✓ Złożono"}
                  </button>
                )}
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
