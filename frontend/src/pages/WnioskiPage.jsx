import { useEffect, useMemo, useState } from "react";
import AppHeader from "../components/AppHeader.jsx";
import { api } from "../api.js";
import { useProfile } from "../profile.js";
import { DEFAULT_PARAMS, mergeParams } from "../engine/params.js";
import { dopasujWnioski } from "../engine/wnioski.js";
import baza from "../engine/zus_dane_2026.json";

const KROKI = {
  sytuacja: "Twoja sytuacja", ty: "Ty i ubezpieczenie", platnik: "Pracodawca", dziecko: "Dziecko",
  drugiRodzic: "Drugi rodzic", zdrowie: "Ciąża i zwolnienia", urlopy: "Urlopy i plany",
};

const GRUPY = [
  { status: "mozesz", tytul: "Możesz złożyć teraz", opis: "Z Twoich danych wynika, że te wnioski Ci przysługują." },
  { status: "sprawdz", tytul: "Uzupełnij dane, żeby potwierdzić", opis: "Wniosek prawdopodobnie pasuje, ale brakuje informacji albo są wątpliwości." },
  { status: "pozniej", tytul: "Złożysz po zdarzeniu (np. po porodzie)", opis: "Te wnioski będą dostępne później - warto znać terminy." },
  { status: "drugi_rodzic", tytul: "Składa drugi rodzic", opis: "Te wnioski wypełnia drugi rodzic - Ty możesz mu pomóc przygotować dane." },
];

function Karta({ w }) {
  return (
    <article className="info-card">
      <h3>{w.tytul}</h3>
      <p className="field-hint">
        {w.id}{w.swiadczenie ? ` · ${w.swiadczenie}` : ""}
        {w.wykonawca === "drugi_rodzic" ? " · składa drugi rodzic" : ""}
        {w.mozeTezDrugiRodzic ? " · może też drugi rodzic" : ""}
      </p>

      {w.powody.length > 0 && <ul>{w.powody.map((t) => <li key={t}>{t}</li>)}</ul>}

      <dl className="data-list">
        {w.doKogo && <div><dt>Gdzie złożyć</dt><dd>{w.doKogo}</dd></div>}
        {w.formularze.length > 0 && <div><dt>Formularze</dt><dd>{w.formularze.join(", ")}</dd></div>}
        {w.wymiar && <div><dt>Wymiar</dt><dd>{w.wymiar}</dd></div>}
        {w.kwota && <div><dt>Wysokość</dt><dd>{w.kwota}</dd></div>}
        {w.terminy.filter((t) => t.kiedy).map((t) => (
          <div key={t.id}><dt>Termin</dt><dd>{t.opis}: najpóźniej {t.kiedy}</dd></div>
        ))}
      </dl>

      {w.braki.length > 0 && (
        <p className="field-error">
          Brakuje: {w.braki.map((b) => `${b.etykieta} (etap „${KROKI[b.krok] ?? b.krok}”)`).join("; ")}.
        </p>
      )}
      {[...w.watpliwosci, ...w.ostrzezenia].length > 0 && (
        <ul className="field-hint">{[...w.watpliwosci, ...w.ostrzezenia].map((t) => <li key={t}>{t}</li>)}</ul>
      )}

      {(w.dokumenty.length > 0 || w.terminy.length > 0) && (
        <details>
          <summary>Dokumenty i terminy</summary>
          {w.dokumenty.length > 0 && (
            <ul>{w.dokumenty.map((d) => <li key={d.id}>{d.nazwa}{d.opcjonalny ? " (opcjonalnie)" : ""}</li>)}</ul>
          )}
          {w.terminy.length > 0 && (
            <ul>{w.terminy.map((t) => <li key={t.id}>{t.opis}{t.dni ? ` - ${t.dni} dni` : ""}</li>)}</ul>
          )}
        </details>
      )}
    </article>
  );
}

export default function WnioskiPage() {
  const { profile, loading } = useProfile();
  const [overrides, setOverrides] = useState({});

  // parametry z panelu admina (jeśli ktoś je zmienił) nakładamy na domyślne
  useEffect(() => {
    api("/api/params").then((d) => setOverrides(d.overrides ?? {})).catch(() => {});
  }, []);

  const wynik = useMemo(() => {
    if (!profile) return null;
    return dopasujWnioski(profile, { baza, params: mergeParams(overrides ?? DEFAULT_PARAMS) });
  }, [profile, overrides]);

  return (
    <div className="app">
      <AppHeader />
      <main className="container">
        <h1>Twoje wnioski</h1>
        <p className="lead">
          Dobraliśmy wnioski na podstawie danych z „Moich danych”. To podpowiedź, nie opinia prawna -
          ostateczną decyzję podejmuje płatnik zasiłku lub ZUS.
        </p>

        {loading && <p className="center-msg">Wczytywanie…</p>}
        {!loading && !wynik && <p className="center-msg">Zaloguj się, aby zobaczyć propozycje wniosków.</p>}

        {wynik && wynik.brakiOgolne.length > 0 && (
          <p className="field-error" role="status">
            Najpierw uzupełnij w „Moich danych”: {wynik.brakiOgolne.map((b) => b.etykieta).join(", ")}.
          </p>
        )}

        {wynik && GRUPY.map((g) => {
          const lista = wynik.wnioski.filter((w) => w.status === g.status);
          if (!lista.length) return null;
          return (
            <section key={g.status} className="calc-group">
              <h2 className="calc-group-title">{g.tytul} ({lista.length})</h2>
              <p className="group-hint">{g.opis}</p>
              {lista.map((w) => <Karta key={`${w.id}-${w.wykonawca}`} w={w} />)}
            </section>
          );
        })}

        {wynik && wynik.odrzucone.length > 0 && (
          <details className="calc-group">
            <summary>Wnioski, które Ci (na razie) nie przysługują ({wynik.odrzucone.length})</summary>
            {wynik.odrzucone.map((w) => (
              <article key={`${w.id}-${w.wykonawca}`} className="info-card">
                <h3>{w.tytul}</h3>
                <ul>{w.powody.map((t) => <li key={t}>{t}</li>)}</ul>
              </article>
            ))}
          </details>
        )}
      </main>
    </div>
  );
}
