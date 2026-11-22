import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import { useProfile } from "../profile.js";
import { CFG } from "../calculators/config.js";
import { terminyWnioskow, doIcs } from "../engine/index.js";
import { etykietaTerminu, klasaBadga } from "./kalendarzEtykiety.js";
import { TESTOWE, pokaz, poprosOZgode, zgoda } from "../powiadomienia.js";

/* =====================================================================
   Kalendarz terminów. Daty liczy silnik (src/engine/wnioskow/kalendarz.js) –
   to samo źródło, co karty wariantów w „Złóż wniosek”; każda data ma
   podstawę prawną i źródło (Kodeks pracy, rozporządzenia, poradnik ZUS).

   W siatce wpis to NAZWA WNIOSKU (e.tytul); różnicę widać tylko w kolorze:
   czerwony = ostateczny termin (typ „termin”/„koniec”), żółty = przypomnienie
   (7 i 3 dni przed terminem; w dniu terminu przypomina sam termin), neutralny = początek/informacja.
   Przypomnienie NIGDY nie ma etykiety „Pilne” – pilny jest tylko termin (zgłoszenie Oli z 18.11).
   Klik na dzień z wpisami otwiera panel szczegółów pod siatką.
   ===================================================================== */

// Daty z silnika to „RRRR-MM-DD” – w kalendarzu porównujemy je jako tekst (bez stref czasowych).
const isoDnia = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fmt = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }) : "—");
const plusDni = (iso, dni) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + dni);
  return isoDnia(d);
};

const dniDo = (iso, dzis) => Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${dzis}T00:00:00Z`)) / 86400000);
// W panelu szczegółów skracamy bardzo długi opis – pełny tekst jest w „Złóż wniosek”.
const krotkiOpis = (tekst, max = 160) => (!tekst || tekst.length <= max ? tekst : `${tekst.slice(0, max - 1).trimEnd()}…`);
const ileWydarzen = (n) => (n === 1 ? "wydarzenie" : n >= 2 && n <= 4 ? "wydarzenia" : "wydarzeń");


const TYP = {
  termin: { etykieta: "Termin wniosku", klasa: "deadline" },
  koniec: { etykieta: "Ostatni dzień", klasa: "deadline" },
  start: { etykieta: "Początek", klasa: "start" },
  info: { etykieta: "Informacja", klasa: "info" },
};
const KLUCZ = "rodzicplus-calendar-completed";

export default function Kalendarz() {
  const { profile, loading } = useProfile();
  const dzis = isoDnia(new Date());
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [stanZgody, setStanZgody] = useState(() => zgoda());
  const detailRef = useRef(null);
  const [completed, setCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KLUCZ) || "{}"); }
    catch { return {}; }
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try { return localStorage.getItem("rodzicplus-calendar-notifications") === "1"; }
    catch { return false; }
  });
  const [notificationPermission, setNotificationPermission] = useState(() =>
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );

  const events = useMemo(() => (profile ? terminyWnioskow(profile, { params: CFG }) : []), [profile]);

  const pokazPowiadomienie = (tytul, body) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const notification = new Notification(tytul, {
      body,
      icon: "/favicon.ico",
      tag: `rodzicplus-calendar-${encodeURIComponent(body)}`,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  useEffect(() => {
    if (!notificationsEnabled || typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const timers = [];
    for (const e of events) {
      if (completed[e.id] || (e.typ !== "termin" && e.typ !== "koniec")) continue;
      const przypomnienia = [e.przypomnienie, plusDni(e.data, -1)].filter(Boolean);
      for (const reminderDate of [...new Set(przypomnienia)]) {
        if (reminderDate > dzis) {
          const ms = Date.parse(`${reminderDate}T09:00:00`) - Date.now();
          if (ms > 0 && ms < 2_147_483_647) {
            timers.push(setTimeout(() => {
              const dni = dniDo(e.data, isoDnia(new Date()));
              pokazPowiadomienie(
                "RodzicPlus – przypomnienie o terminie",
                dni === 0 ? `Dzisiaj masz koniec terminu na wniosek: ${e.tytul}`
                  : `Za ${dni} ${dni === 1 ? "dzień" : "dni"} masz koniec terminu na wniosek: ${e.tytul}`
              );
            }, ms));
          }
        } else if (reminderDate === dzis) {
          const dni = dniDo(e.data, dzis);
          const key = `rodzicplus-calendar-notified-${e.id}-${reminderDate}`;
          if (!localStorage.getItem(key)) {
            pokazPowiadomienie(
              "RodzicPlus – przypomnienie o terminie",
              dni === 0 ? `Dzisiaj masz koniec terminu na wniosek: ${e.tytul}`
                : `Za ${dni} ${dni === 1 ? "dzień" : "dni"} masz koniec terminu na wniosek: ${e.tytul}`
            );
            localStorage.setItem(key, "1");
          }
        }
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [notificationsEnabled, events, dzis, completed]);

  // Na start pokazujemy miesiąc najbliższego nadchodzącego terminu (a gdy wszystkie minęły – ostatniego).
  useEffect(() => {
    const najblizszy = events.find((e) => e.data >= dzis && e.typ !== "info") ?? events[events.length - 1];
    if (najblizszy) setCursor(new Date(Number(najblizszy.data.slice(0, 4)), Number(najblizszy.data.slice(5, 7)) - 1, 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  // Po wyborze dnia przewijamy stronę do panelu szczegółów (jeśli nie jest jeszcze widoczny).
  useEffect(() => {
    if (selectedDay && detailRef.current) detailRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedDay]);

  const toggleCompleted = (id) => {
    setCompleted((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(KLUCZ, JSON.stringify(next)); } catch { /* tryb prywatny – stan tylko na tej stronie */ }
      return next;
    });
  };

  const pobierzIcs = () => {
    const blob = new Blob([doIcs(events.filter((e) => !completed[e.id]))], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rodzicplus-terminy.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const przełączPowiadomienia = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      try { localStorage.setItem("rodzicplus-calendar-notifications", "0"); } catch { /* stan zostaje w bieżącej sesji */ }
      return;
    }
    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      return;
    }
    const permission = Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
    setNotificationPermission(permission);
    if (permission !== "granted") return;

    setNotificationsEnabled(true);
    try { localStorage.setItem("rodzicplus-calendar-notifications", "1"); } catch { /* stan zostaje w bieżącej sesji */ }

    const najblizszy = events.find((e) => e.typ !== "info" && e.data >= dzis && !completed[e.id]);
    const dni = najblizszy ? dniDo(najblizszy.data, dzis) : null;
    pokazPowiadomienie(
      "Powiadomienia kalendarza włączone",
      najblizszy
        ? (dni === 0 ? `Dzisiaj masz koniec terminu na wniosek: ${najblizszy.tytul}`
          : `Najbliższy termin to za ${dni} ${dni === 1 ? "dzień" : "dni"}: ${najblizszy.tytul}`)
        : "Będziemy przypominać o nadchodzących terminach wniosków."
    );
  };

  if (loading) return <div className="app"><AppHeader /><main className="container"><p className="center-msg">Wczytywanie…</p></main></div>;

  const rok = cursor.getFullYear();
  const miesiac = cursor.getMonth();
  const prefiks = `${rok}-${String(miesiac + 1).padStart(2, "0")}-`;
  const dniMiesiaca = new Date(rok, miesiac + 1, 0).getDate();
  const offset = (cursor.getDay() + 6) % 7;
  const komorki = [...Array.from({ length: offset }, () => null), ...Array.from({ length: dniMiesiaca }, (_, i) => i + 1)];
  const dnia = (day) => `${prefiks}${String(day).padStart(2, "0")}`;
  const nadchodzace = events.filter((e) => e.typ !== "info" && e.data >= dzis && !completed[e.id]).length;

  // Wpisy widoczne w danym dniu siatki: właściwa data oraz przypomnienia 7 i 3 dni przed terminem
  // (przypomnienie „w dniu terminu” to sam termin – nie dublujemy go w siatce).
  const wpisyNaDzien = (dzien) => {
    const wpisy = [];
    for (const e of events) {
      if (e.data === dzien) wpisy.push({ e, przypomnienie: null });
      for (const p of e.przypomnienia ?? []) if (p.dni > 0 && p.data === dzien) wpisy.push({ e, przypomnienie: p });
    }
    return wpisy;
  };
  const wlaczPowiadomienia = async () => {
    const wynik = await poprosOZgode();
    setStanZgody(wynik);
    pokaz(wynik === "granted"
      ? { ...TESTOWE, tytul: "Powiadomienia włączone", tresc: "Przypomnimy o terminach 7 i 3 dni wcześniej oraz w dniu terminu, gdy otworzysz RodzicPlus." }
      : { ...TESTOWE, tytul: "Powiadomienia tylko na stronie", tresc: "Przeglądarka nie pozwoliła na powiadomienia systemowe – przypomnienia pokażemy tutaj, a do telefonu dodaj terminy przez plik .ics." });
  };

  const przeskoczMiesiac = (kierunek) => {
    setCursor(new Date(rok, miesiac + kierunek, 1));
    setSelectedDay(null); // zmiana miesiąca czyści wybór dnia
  };

  const wpisyWybrane = selectedDay ? wpisyNaDzien(selectedDay) : [];

  return (
    <div className="app calendar-page">
      <AppHeader />
      <main className="container">
        <h1>Kalendarz terminów</h1>
        <p className="lead">
          Daty wniosków, które Ci przysługują – policzone z „Moje dane” i sprawdzone z Kodeksem pracy, rozporządzeniami
          i poradnikiem ZUS. Przy każdej dacie jest jej podstawa.
        </p>

        {events.length > 0 && (
          <div className="calendar-actions">
            <button type="button" className="btn btn-outline" onClick={pobierzIcs}>📅 Dodaj do kalendarza w telefonie (.ics)</button>
            <button
              type="button"
              className={`btn ${notificationsEnabled ? "btn-primary" : "btn-outline"}`}
              onClick={przełączPowiadomienia}
              disabled={notificationPermission === "unsupported"}
            >
              {notificationsEnabled ? "🔔 Wyłącz powiadomienia" : "🔔 Włącz powiadomienia"}
            </button>
            {notificationPermission === "denied" && (
              <span className="note">Powiadomienia są zablokowane w ustawieniach przeglądarki.</span>
            )}
            {notificationPermission === "unsupported" && (
              <span className="note">Ta przeglądarka nie obsługuje powiadomień systemowych.</span>
            )}
            <span className="calendar-upcoming">{nadchodzace} nadchodzących terminów · przypomnienia 7 dni i 1 dzień wcześniej</span>
          </div>
        )}

        {events.length === 0 ? (
          <div className="info-card">
            <p>Uzupełnij etap, rolę i daty dziecka (albo przewidywaną datę porodu), aby kalendarz dobrał Twoje wnioski i policzył terminy.</p>
            <Link className="btn btn-primary" to="/profil?krok=dziecko">Uzupełnij dane dziecka</Link>
          </div>
        ) : (
          <>
            <section aria-labelledby="kalendarz-miesiac">
              <div className="calendar-toolbar">
                <button type="button" className="btn btn-outline" onClick={() => przeskoczMiesiac(-1)} aria-label="Poprzedni miesiąc">‹</button>
                <h2 id="kalendarz-miesiac">{cursor.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}</h2>
                <button type="button" className="btn btn-outline" onClick={() => przeskoczMiesiac(1)} aria-label="Następny miesiąc">›</button>
              </div>
              <div className="calendar-legend" aria-label="Legenda">
                <span><i className="legend-dot deadline" />Termin</span>
                <span><i className="legend-dot reminder" />Przypomnienie</span>
                <span><i className="legend-dot start" />Początek / informacja</span>
              </div>
              <div className="calendar-grid" aria-label="Kalendarz miesięczny">
                {["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"].map((d) => <div className="calendar-weekday" key={d}>{d}</div>)}
                {komorki.map((day, i) => {
                  const dzien = day ? dnia(day) : null;
                  const wpisy = dzien ? wpisyNaDzien(dzien) : [];
                  return (
                    <button
                      type="button"
                      className={`calendar-day ${day ? "" : "calendar-empty"} ${dzien === dzis ? "calendar-today" : ""} ${dzien === selectedDay ? "calendar-day-selected" : ""}`}
                      key={i}
                      disabled={!day}
                      onClick={() => dzien && setSelectedDay(dzien)}
                      aria-label={dzien ? `${fmt(dzien)}: ${wpisy.length} wpisów` : undefined}
                    >
                      {day && <span className="calendar-day-number">{day}</span>}
                      {wpisy.filter((w) => !w.przypomnienie).map(({ e }) => (
                        <span className={`calendar-dot ${TYP[e.typ].klasa}`} title={`${e.tytul}`} key={e.id}>{etykietaTerminu(e, dzis)}</span>
                      ))}
                      {wpisy.filter((w) => w.przypomnienie).map(({ e, przypomnienie }) => (
                        <span className="calendar-dot reminder" title={`Przypomnienie (${przypomnienie.dni} dni przed terminem): ${e.tytul}`} key={`r${przypomnienie.dni}-${e.id}`}>
                          Przypomnienie · {przypomnienie.dni} dni przed
                        </span>
                      ))}
                    </button>
                  );
                })}
              </div>
            </section>

            {selectedDay && (
              <section className="calendar-detail" ref={detailRef} aria-labelledby="wybrane-wydarzenia">
                <div className="calendar-detail-heading">
                  <h2 id="wybrane-wydarzenia">{fmt(selectedDay)}</h2>
                  <button type="button" className="btn btn-outline" onClick={() => setSelectedDay(null)}>Zamknij</button>
                </div>
                {wpisyWybrane.length === 0 ? (
                  <p className="calendar-detail-empty">Brak wydarzeń w tym dniu.</p>
                ) : wpisyWybrane.map(({ e, przypomnienie }) => {
                  const pilny = e.typ === "termin" || e.typ === "koniec";
                  const wykonany = Boolean(completed[e.id]);
                  const ile = dniDo(e.data, dzis);
                  // Przypomnienie: tylko jego własna etykieta (np. „Przypomnienie – 4 dni temu”), bez „Pilne”.
                  // Pilność ma wyłącznie sam termin – wcześniej przypomnienie z 18.11 pokazywało
                  // „Pilne – za 3 dni”, licząc od terminu, choć to było tylko przypomnienie.
                  const rodzaj = przypomnienie
                    ? { t: `Przypomnienie · ${przypomnienie.dni} dni przed terminem`, c: "b-neutral", krawedz: "ce-przypomnienie" }
                    : pilny
                      ? { t: TYP[e.typ].etykieta, c: "b-err", krawedz: "ce-termin" }
                      : { t: TYP[e.typ].etykieta, c: "b-neutral", krawedz: "ce-neutral" };
                  const pilnosc = przypomnienie
                    ? { t: etykietaTerminu(e, dzis, "przypomnienie", przypomnienie.data), c: klasaBadga(e, dzis, "przypomnienie", przypomnienie.data) }
                    : !pilny ? null
                    : wykonany ? { t: "Złożono ✓", c: "b-ok" }
                    : { t: etykietaTerminu(e, dzis), c: klasaBadga(e, dzis) };
                  return (
                    <article className={`calendar-event ${rodzaj.krawedz}${wykonany ? " is-completed" : ""}`} key={przypomnienie ? `r${przypomnienie.dni}-${e.id}` : `d-${e.id}`}>
                      <div className="calendar-event-main">
                        <span className={`badge ${rodzaj.c}`}>{rodzaj.t}</span>{" "}
                        {pilnosc && <span className={`badge ${pilnosc.c}`}>{pilnosc.t}</span>}{" "}
                        {e.pewnosc !== "pewne" && <span className="badge b-warn">{e.pewnosc === "szacunek" ? "data szacunkowa" : "do potwierdzenia"}</span>}
                        {e.warunkowy && <span className="badge b-warn">jeśli przysługuje – uzupełnij dane</span>}
                        <h3>{e.tytul}</h3>
                        <dl className="data-list">
                          {przypomnienie ? (
                            <>
                              <div><dt>Przypomnienie</dt><dd>{fmt(przypomnienie.data)}</dd></div>
                              <div><dt>Ostateczny termin</dt><dd>{fmt(e.data)} ({ile < 0 ? "minął" : ile === 0 ? "dziś" : `za ${ile} dni`})</dd></div>
                            </>
                          ) : (
                            <div><dt>{pilny ? "Ostateczny termin" : "Data"}</dt><dd>{fmt(e.data)}</dd></div>
                          )}
                          {e.dokument && <div><dt>Co składasz</dt><dd>{e.dokument}</dd></div>}
                          <div><dt>Dla</dt><dd>{e.kto}</dd></div>
                          <div><dt>Podstawa</dt><dd>{e.podstawa}</dd></div>
                          <div><dt>Źródło</dt><dd>{e.zrodlo}</dd></div>
                        </dl>
                        {e.opis && <p className="hint">{krotkiOpis(e.opis)}</p>}
                        {e.wniosek && <p className="note"><Link to={`/wnioski?w=${e.wniosek}`}>Zobacz wniosek i warunki →</Link></p>}
                      </div>
                      {pilny && (
                        <button type="button" className="btn btn-outline" onClick={() => toggleCompleted(e.id)}>
                          {wykonany ? "↩ Przywróć" : "✓ Złożono"}
                        </button>
                      )}
                    </article>
                  );
                })}
              </section>
            )}

            <section aria-labelledby="najblizsze">
              <h2 id="najblizsze">Wszystkie terminy</h2>
              {events.map((e) => {
                const pilny = e.typ === "termin" || e.typ === "koniec";
                const badgeText = etykietaTerminu(e, dzis);
                const badgeClass = klasaBadga(e, dzis);
                return (
                  <article id={`t-${e.id}`} className={`calendar-event ${completed[e.id] ? "is-completed" : ""}`} key={e.id}>
                    <div className="calendar-event-main">
                      <span className={`badge ${badgeClass}`}>{badgeText}</span>{" "}
                      {e.pewnosc !== "pewne" && <span className="badge b-warn">{e.pewnosc === "szacunek" ? "data szacunkowa" : "do potwierdzenia"}</span>}
                      {e.warunkowy && <span className="badge b-warn">jeśli przysługuje – uzupełnij dane</span>}
                      <h3>{e.tytul}</h3>
                      <dl className="data-list">
                        <div><dt>{pilny ? "Ostateczny termin" : "Data"}</dt><dd>{fmt(e.data)}</dd></div>
                        {pilny && <div><dt>Przypomnienia</dt><dd>{(e.przypomnienia ?? []).map((p) => (p.dni ? `${fmt(p.data)} (${p.dni} dni przed)` : "w dniu terminu")).join(" · ")}</dd></div>}
                        {e.dokument && <div><dt>Co składasz</dt><dd>{e.dokument}</dd></div>}
                        <div><dt>Dla</dt><dd>{e.kto}</dd></div>
                        <div><dt>Podstawa</dt><dd>{e.podstawa}</dd></div>
                        <div><dt>Źródło</dt><dd>{e.zrodlo}</dd></div>
                      </dl>
                      {e.opis && <p className="hint">{e.opis}</p>}
                      {e.wniosek && <p className="note"><Link to={`/wnioski?w=${e.wniosek}`}>Zobacz wniosek i warunki →</Link></p>}
                    </div>
                    {pilny && (
                      <button type="button" className="btn btn-outline" onClick={() => toggleCompleted(e.id)}>
                        {completed[e.id] ? "↩ Przywróć" : "✓ Złożono"}
                      </button>
                    )}
                  </article>
                );
              })}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
