import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import { useProfile } from "../profile.js";
import { CFG } from "../calculators/config.js";
import { przegladWnioskow, maDruk } from "../engine/index.js";

/* =====================================================================
   „Złóż wniosek” – wybór wniosku i ocena KAŻDEGO wariantu na podstawie
   „Moje dane”. Logika: src/engine/wnioski/ (rejestr, ocena, testy).
   ===================================================================== */

// Sekcja profilu → etap formularza „Moje dane” (ProfilePage.jsx, ?krok=…)
const KROK = { sytuacja: "sytuacja", ubezpieczony: "ty", platnik: "platnik", dziecko: "dziecko", drugiRodzic: "drugiRodzic", zdrowie: "zdrowie", urlopy: "urlopy" };
const linkDoPola = (pole) => `/profil?krok=${KROK[pole.split(".")[0]] ?? "sytuacja"}`;

const STATUS = {
  dostepny: { label: "Przysługuje", badge: "b-ok", kolor: "var(--color-primary)" },
  brak_danych: { label: "Brakuje danych", badge: "b-warn", kolor: "#d99a00" },
  niedostepny: { label: "Nie przysługuje", badge: "b-err", kolor: "var(--color-danger)" },
  informacja: { label: "Warto wiedzieć", badge: "b-ok", kolor: "var(--color-navy)" },
};
const POZIOM = { blad: "err", ostrzezenie: "warn" };
// Kolejność kafelków: najpierw to, co przysługuje, na końcu to, co nie dotyczy (sort stabilny).
const waga = (w) => (w.dostepne ? 0 : w.brakDanych ? 1 : w.niedostepne ? 2 : 3);

function Pola({ lista }) {
  return (
    <ul className="pts">
      {lista.map((b) => (
        <li key={b.pole}>
          {b.etykieta} – <Link to={linkDoPola(b.pole)}>uzupełnij w „Moje dane”</Link>
        </li>
      ))}
    </ul>
  );
}

// Wariant, przy którym nic nie składasz (np. e-ZLA leci automatycznie) – inna etykieta niż „Przysługuje”.
const AUTOMAT = { label: "Przysługuje – nic nie składasz", badge: "b-ok", kolor: "var(--color-navy)" };

function Wariant({ v }) {
  const automat = v.status === "dostepny" && v.skladanie === "automatycznie";
  const st = automat ? AUTOMAT : STATUS[v.status];
  return (
    <section className="result-card" style={{ borderLeftColor: st.kolor }} aria-labelledby={`w-${v.id}`}>
      <h3 className="result-title" id={`w-${v.id}`}>
        <span className={`badge ${st.badge}`}>{st.label}</span>{" "}
        {v.nazwa}
      </h3>

      {v.pewnosc === "do_potwierdzenia" && (
        <p className="note"><span className="badge b-warn">do potwierdzenia w ZUS</span> {v.uwaga}</p>
      )}

      {v.status === "informacja" && <p>{v.opis}</p>}

      {v.status === "niedostepny" && (
        <>
          <p><b>Dlaczego nie:</b></p>
          <ul className="alert-list err">{v.powody.map((p) => <li key={p}>{p} – niespełnione</li>)}</ul>
        </>
      )}

      {v.status === "brak_danych" && (
        <>
          <p><b>Żeby to sprawdzić, uzupełnij:</b></p>
          <Pola lista={v.brakujaceDane} />
        </>
      )}

      {(v.status === "dostepny" || v.status === "brak_danych") && (
        automat ? (
          <p className="alert-inline">
            <span className="badge b-ok">Automatycznie</span> {v.dokument}
          </p>
        ) : (
          <dl className="data-list">
            {v.dokument && (
              <div>
                <dt>{v.skladanie === "dolacz" ? "📎 Dołączasz do wniosku" : "📄 Co składasz"}</dt>
                <dd><b>{v.dokument}</b></dd>
              </div>
            )}
            {v.adresat && <div><dt>🏢 Komu</dt><dd>{v.adresat}</dd></div>}
            {v.termin && <div><dt>⏰ Do kiedy</dt><dd>{v.termin}</dd></div>}
            {v.wymiar && <div><dt>Ile</dt><dd>{v.wymiar}</dd></div>}
            {v.wysokosc && <div><dt>Wysokość</dt><dd>{v.wysokosc}</dd></div>}
          </dl>
        )
      )}

      {(v.status === "dostepny" || v.status === "brak_danych") && v.formularz && !automat && (
        <details>
          <summary className="note">Szczegóły formalne (druki, przepisy)</summary>
          <p className="note">{v.formularz}</p>
        </details>
      )}

      {v.status === "dostepny" && v.dokumenty?.length > 0 && (
        <>
          <p><b>Dokumenty:</b></p>
          <ul className="pts">{v.dokumenty.map((d) => <li key={d}>{d}</li>)}</ul>
        </>
      )}

      {v.status === "dostepny" && v.doUzupelnienia?.length > 0 && (
        <>
          <p><b>Do wypełnienia wniosku brakuje jeszcze:</b></p>
          <Pola lista={v.doUzupelnienia} />
        </>
      )}

      {(v.status === "dostepny" || v.status === "brak_danych") && maDruk(v.id) && (
        <p>
          <Link className="btn btn-outline" to={`/wnioski/druk?v=${v.id}`}>
            🖨️ Przygotuj wniosek do druku
          </Link>
        </p>
      )}

      {v.uwaga && v.pewnosc !== "do_potwierdzenia" && <p className="note">{v.uwaga}</p>}

      {v.warunki && (
        <details>
          <summary className="note">Warunki ({v.warunki.filter((x) => x.ok === true).length} z {v.warunki.length} spełnione)</summary>
          <ul className="pts">
            {v.warunki.map((x) => (
              <li key={x.tekst}>{x.ok === true ? "✓" : x.ok === false ? "✗" : "?"} {x.tekst}</li>
            ))}
          </ul>
        </details>
      )}
      <p className="note">Podstawa prawna: {v.podstawa}</p>
    </section>
  );
}

export default function Wnioski() {
  const { profile, loading } = useProfile();
  const [params, setParams] = useSearchParams();
  const wybrany = params.get("w");

  const wynik = useMemo(() => (profile ? przegladWnioskow(profile, { params: CFG }) : null), [profile]);

  if (loading || !wynik) {
    return (
      <div className="app">
        <AppHeader />
        <main className="container"><p className="center-msg">Wczytywanie…</p></main>
      </div>
    );
  }

  const bezSytuacji = !profile.sytuacja?.rola || !profile.sytuacja?.etap;
  const wniosek = wynik.wnioski.find((w) => w.id === wybrany);
  const ostrz = wynik.ostrzezenia.filter((o) => o.poziom !== "info");
  const info = wynik.ostrzezenia.filter((o) => o.poziom === "info");

  return (
    <div className="app">
      <AppHeader />
      <main className="container">
        <h1>Złóż wniosek</h1>
        <p className="lead">
          Wybierz, co chcesz załatwić. Na podstawie „Moje dane” sprawdzamy <b>każdy wariant</b> tego wniosku:
          co Ci przysługuje, czego nie (i dlaczego) oraz czego jeszcze brakuje.
        </p>

        {bezSytuacji && (
          <p className="alert-inline">
            <span className="badge b-warn">ZACZNIJ TU</span> Uzupełnij, <b>na jakim etapie jesteś</b> i <b>kim jesteś dla dziecka</b> –
            bez tego nie wiemy, które warianty Cię dotyczą. <Link to="/profil?krok=sytuacja">Przejdź do „Moje dane”</Link>
          </p>
        )}

        {ostrz.length > 0 && (
          <section aria-label="Ostrzeżenia">
            {["blad", "ostrzezenie"].map((poziom) => {
              const lista = ostrz.filter((o) => o.poziom === poziom);
              return lista.length ? (
                <ul key={poziom} className={`alert-list ${POZIOM[poziom]}`}>
                  {lista.map((o) => <li key={o.kod + o.tekst}>{o.tekst}</li>)}
                </ul>
              ) : null;
            })}
          </section>
        )}

        {!wniosek && (
          <div className="calc-list">
            {[...wynik.wnioski].sort((a, b) => waga(a) - waga(b)).map((w) => {
              const nieDotyczy = w.dostepne + w.brakDanych + w.niedostepne === 0;
              return (
                <button key={w.id} type="button" className="calc-tile" onClick={() => setParams({ w: w.id })}
                  style={nieDotyczy ? { opacity: 0.6 } : undefined}>
                  <span className="calc-tile-body">
                    <span className="calc-tile-title">{w.nazwa}</span>
                    <span className="calc-tile-desc">{w.opis}</span>
                    {w.doZlozenia.length > 0 && (
                      <span className="calc-tile-desc">
                        <b>Do złożenia:</b> {w.doZlozenia.slice(0, 2).map((d) => d.split(" + ")[0]).join("; ")}
                        {w.doZlozenia.length > 2 && ` i jeszcze ${w.doZlozenia.length - 2}`}
                      </span>
                    )}
                    <span className="calc-tile-desc">
                      {w.dostepne > 0 && <span className="badge b-ok">{w.dostepne} przysługuje</span>}{" "}
                      {w.brakDanych > 0 && <span className="badge b-warn">{w.brakDanych} brak danych</span>}{" "}
                      {w.niedostepne > 0 && <span className="badge b-err">{w.niedostepne} nie przysługuje</span>}
                      {nieDotyczy && <span className="note">Nie dotyczy Twojej sytuacji</span>}
                    </span>
                  </span>
                  <span className="calc-tile-arrow" aria-hidden="true">→</span>
                </button>
              );
            })}
          </div>
        )}

        {wniosek && (
          <>
            <p><button type="button" className="btn btn-link" onClick={() => setParams({})}>← Wszystkie wnioski</button></p>
            <h2>{wniosek.nazwa}</h2>
            <p className="lead">{wniosek.opis}</p>
            <div className="result-stack">
              {wniosek.warianty
                .filter((v) => v.status !== "nie_dotyczy")
                .sort((a, b) => ["dostepny", "brak_danych", "niedostepny", "informacja"].indexOf(a.status) - ["dostepny", "brak_danych", "niedostepny", "informacja"].indexOf(b.status))
                .map((v) => <Wariant key={v.id} v={v} />)}
            </div>
            {wniosek.warianty.some((v) => v.status === "nie_dotyczy") && (
              <details className="result-card">
                <summary>Nie dotyczy Twojej sytuacji ({wniosek.warianty.filter((v) => v.status === "nie_dotyczy").length})</summary>
                <ul className="pts">
                  {wniosek.warianty.filter((v) => v.status === "nie_dotyczy").map((v) => (
                    <li key={v.id}>{v.nazwa} – {v.powody?.[0]}</li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}

        {info.length > 0 && (
          <details className="result-card">
            <summary>Warto wiedzieć ({info.length})</summary>
            <ul className="pts">{info.map((o) => <li key={o.kod + o.tekst}>{o.tekst}</li>)}</ul>
          </details>
        )}

        <p className="note">
          Wynik jest informacyjny i opiera się na danych z „Moje dane” – ostateczną decyzję wydaje ZUS albo pracodawca.
          Miejsca oznaczone „do potwierdzenia w ZUS” wymagają sprawdzenia w przepisach.
        </p>
      </main>
    </div>
  );
}
