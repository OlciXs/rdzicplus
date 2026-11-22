import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import { api } from "../api.js";
import { useProfile } from "../profile.js";
import { CFG, zl } from "../calculators/config.js";
import { podstawaWymiaru } from "../engine/index.js";

/* =====================================================================
   „Moje dane z ZUS” – SYMULACJA integracji z PUE/eZUS (wymóg zadania).
   Dane przychodzą z backend/zus-mock.js (fikcyjne osoby z mObywatela).
   Podstawa wymiaru jest liczona tym samym silnikiem co kalkulatory.
   ===================================================================== */

const KODY_EZLA = {
  B: { tone: "ok", opis: "ciąża – zasiłek 100%, okres zasiłkowy 270 dni" },
  A: { tone: "warn", opis: "ta sama choroba po przerwie ≤ 60 dni – okresy się sumują" },
  C: { tone: "err", opis: "nadużycie alkoholu – brak zasiłku za pierwsze 5 dni" },
  D: { tone: "warn", opis: "gruźlica – okres zasiłkowy 270 dni" },
  E: { tone: "warn", opis: "choroba o długim okresie wylęgania" },
  "": { tone: "warn", opis: "bez kodu – zasiłek 80%, okres zasiłkowy 182 dni" },
};

const STATUSY = { pracownik: "Pracownik (umowa o pracę)", zlecenie: "Umowa zlecenia", dg: "Działalność gospodarcza" };

const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString("pl-PL") : "–");
const dni = (od, doDnia) => Math.round((new Date(doDnia) - new Date(od)) / 86400000) + 1;
const dzis = () => new Date().toISOString().slice(0, 10);

export default function Zus() {
  const { profile } = useProfile();
  const [dane, setDane] = useState(null);
  const [ezla, setEzla] = useState([]);
  const [wnioski, setWnioski] = useState([]);
  const [error, setError] = useState("");
  const [naDzien, setNaDzien] = useState("");
  const [zasw, setZasw] = useState(null);
  const [zaswBusy, setZaswBusy] = useState(false);

  useEffect(() => {
    Promise.all([api("/api/zus/dane"), api("/api/zus/ezla"), api("/api/zus/wnioski")])
      .then(([d, e, w]) => {
        setDane(d);
        setEzla(e.ezla);
        setWnioski(w.wnioski);
      })
      .catch((err) => setError(err.message));
  }, []);

  // Wnioski wysłane z „Wniosek do druku” zmieniają status w czasie (symulacja) – odświeżenie bez przeładowania strony.
  const [odswiezanie, setOdswiezanie] = useState(false);
  const odswiezWnioski = () => {
    setOdswiezanie(true);
    api("/api/zus/wnioski")
      .then((w) => setWnioski(w.wnioski))
      .catch((err) => setError(err.message))
      .finally(() => setOdswiezanie(false));
  };

  // Domyślna data zaświadczenia: data urodzenia dziecka z „Moje dane”, inaczej dziś.
  useEffect(() => {
    if (!naDzien && profile) setNaDzien(profile.dziecko?.dataUrodzenia || dzis());
  }, [profile, naDzien]);

  const podstawa =
    dane && dane.wynagrodzenia.length
      ? podstawaWymiaru(
          {
            status: dane.statusUbezpieczenia === "pracownik" ? "pracownik" : "niepracownik",
            miesiace: dane.wynagrodzenia.map((w) => w.kwota),
          },
          CFG
        )
      : null;

  const wystawZaswiadczenie = async () => {
    setZaswBusy(true);
    try {
      setZasw(await api(`/api/zus/zaswiadczenie?naDzien=${encodeURIComponent(naDzien || dzis())}`));
    } catch (err) {
      setZasw({ blad: err.message });
    } finally {
      setZaswBusy(false);
    }
  };

  const dniB = ezla.filter((z) => z.kod === "B").reduce((s, z) => s + dni(z.od, z.do), 0);
  const blokada = zasw && !zasw.blad && zasw.dotyczyPlatnika && zasw.zadluzenie > CFG.progZaleglosci;

  return (
    <div className="app">
      <AppHeader />
      <main className="container">
        <h1>Moje dane z ZUS</h1>
        <p className="alert-inline" role="note">
          <span className="sim-badge">SYMULACJA</span> Dane są fikcyjne. W docelowym wdrożeniu pobieramy je z PUE/eZUS
          po zalogowaniu mObywatelem – bez przepisywania z papierów.
        </p>

        {error && <p className="error" role="alert">{error}</p>}
        {!dane && !error && <p className="center-msg">Pobieram dane z ZUS…</p>}

        {dane && (
          <>
            {/* 1. Ubezpieczenie i płatnik */}
            <section className="result-card">
              <h2 className="result-title">1. Ubezpieczenie i płatnik składek</h2>
              <p className="note">{dane.opis}</p>
              {dane.ubezpieczenia.length > 0 && (
                <div className="table-wrap">
                  <table className="calc-table">
                    <thead>
                      <tr><th>Tytuł</th><th>Płatnik</th><th>Od</th><th>Do</th><th>Chorobowe</th></tr>
                    </thead>
                    <tbody>
                      {dane.ubezpieczenia.map((u, i) => (
                        <tr key={i}>
                          <td>{u.tytul}</td><td>{u.platnik}</td><td>{fmt(u.od)}</td>
                          <td>{u.do ? fmt(u.do) : "trwa"}</td><td>{u.chorobowe}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {dane.platnik && (
                <dl className="data-list">
                  <div><dt>Tytuł ubezpieczenia</dt><dd>{STATUSY[dane.statusUbezpieczenia] ?? dane.statusUbezpieczenia}</dd></div>
                  <div><dt>Płatnik</dt><dd>{dane.platnik.nazwa}</dd></div>
                  <div><dt>NIP / REGON</dt><dd>{dane.platnik.nip} / {dane.platnik.regon}</dd></div>
                  <div>
                    <dt>Kto wypłaci zasiłek</dt>
                    <dd>
                      {dane.statusUbezpieczenia !== "dg" && dane.platnik.liczbaUbezpieczonych > CFG.progPlatnika
                        ? `Pracodawca (zgłasza ${dane.platnik.liczbaUbezpieczonych} osób, > ${CFG.progPlatnika})`
                        : "ZUS"}
                    </dd>
                  </div>
                </dl>
              )}
            </section>

            {/* 2. Wynagrodzenia i podstawa */}
            {podstawa?.ok && (
              <section className="result-card">
                <h2 className="result-title">2. Wynagrodzenie z 12 miesięcy i podstawa wymiaru</h2>
                <dl className="data-list">
                  <div><dt>{dane.statusUbezpieczenia === "pracownik" ? "Przeciętne wynagrodzenie" : "Przeciętna podstawa składek"}</dt><dd>{zl(podstawa.przecietne)}</dd></div>
                  <div><dt>Potrącenie składek (13,71%)</dt><dd>−{zl(podstawa.potracenie)}</dd></div>
                  <div><dt><b>Podstawa wymiaru zasiłku</b></dt><dd><b>{zl(podstawa.podstawa)}</b></dd></div>
                  <div><dt>Zasiłek macierzyński 100% / 81,5%</dt><dd>{zl(podstawa.miesiecznie.macierzynski100)} / {zl(podstawa.miesiecznie.macierzynski815)} mies.</dd></div>
                </dl>
                <p className="note">
                  Z {podstawa.licznik} miesięcy ({dane.wynagrodzenia[0].miesiac} – {dane.wynagrodzenia.at(-1).miesiac}).
                  Liczone tym samym silnikiem co <Link to="/kalkulatory/podstawa-wymiaru">kalkulator podstawy</Link>.
                </p>
              </section>
            )}

            {/* 3. e-ZLA */}
            <section className="result-card">
              <h2 className="result-title">3. Zwolnienia lekarskie (e-ZLA)</h2>
              {ezla.length === 0 ? (
                <p className="note">Brak zwolnień w ostatnich 12 miesiącach.</p>
              ) : (
                <>
                  <div className="table-wrap">
                    <table className="calc-table">
                      <thead>
                        <tr><th>Numer</th><th>Okres</th><th className="r">Dni</th><th>Kod</th><th>Lekarz</th></tr>
                      </thead>
                      <tbody>
                        {ezla.map((z) => (
                          <tr key={z.numer}>
                            <td>{z.numer}</td>
                            <td>{fmt(z.od)} – {fmt(z.do)}</td>
                            <td className="r">{dni(z.od, z.do)}</td>
                            <td>
                              <span className={`badge b-${(KODY_EZLA[z.kod] ?? KODY_EZLA[""]).tone}`}>{z.kod || "brak"}</span>{" "}
                              {(KODY_EZLA[z.kod] ?? KODY_EZLA[""]).opis}
                            </td>
                            <td>{z.lekarz}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {dniB > 0 && (
                    <p className="note">
                      Zwolnienia w ciąży (kod B): <b>{dniB} dni</b> z {CFG.okresZasilkowyCiaza} dni okresu zasiłkowego.
                      Wpisz je w <Link to="/kalkulatory/zasilek-chorobowy-w-ciazy">kalkulatorze chorobowego</Link> jako wykorzystane dni.
                    </p>
                  )}
                </>
              )}
            </section>

            {/* 4. Zaświadczenie o niezaleganiu */}
            <section className="result-card">
              <h2 className="result-title">4. Zaświadczenie o niezaleganiu w składkach</h2>
              <p className="note">
                Ważne przy działalności gospodarczej: zaległość większa niż {zl(CFG.progZaleglosci)} (1% płacy minimalnej)
                na dzień porodu blokuje zasiłek do czasu spłaty (art. 2a ustawy zasiłkowej).
              </p>
              <div className="calc-grid">
                <label className="field">
                  <span className="field-label">Na dzień (np. przewidywana data porodu)</span>
                  <input className="input" type="date" value={naDzien} onChange={(e) => setNaDzien(e.target.value)} />
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={wystawZaswiadczenie} disabled={zaswBusy}>
                  {zaswBusy ? "Wystawiam…" : "Wystaw zaświadczenie"}
                </button>
              </div>
              {zasw?.blad && <p className="error" role="alert">{zasw.blad}</p>}
              {zasw && !zasw.blad && (
                <div className="info-card" role="status">
                  <h3>Zaświadczenie nr {zasw.numer}</h3>
                  <p className="note">Stan na {fmt(zasw.naDzien)}, wystawiono {new Date(zasw.wystawiono).toLocaleString("pl-PL")}.</p>
                  {!zasw.dotyczyPlatnika ? (
                    <p><span className="badge b-ok">NIE DOTYCZY</span> Składki za Ciebie opłaca pracodawca – jego ewentualne zaległości nie blokują Twojego zasiłku.</p>
                  ) : blokada ? (
                    <p>
                      <span className="badge b-err">ZALEGŁOŚĆ {zl(zasw.zadluzenie)}</span> Przekracza {zl(CFG.progZaleglosci)} – zasiłek
                      nie zostanie wypłacony, dopóki nie spłacisz zaległości. Najlepiej spłać ją przed porodem.
                    </p>
                  ) : (
                    <p><span className="badge b-ok">BRAK ZALEGŁOŚCI</span> {zasw.zadluzenie > 0 ? `Zaległość ${zl(zasw.zadluzenie)} jest poniżej progu.` : "Nie masz zaległości w składkach."}</p>
                  )}
                </div>
              )}
            </section>

            {/* 5. Wnioski w PUE/eZUS */}
            <section className="result-card">
              <h2 className="result-title">5. Twoje wnioski w PUE/eZUS</h2>
              {wnioski.length === 0 ? (
                <p className="note">Nie masz jeszcze żadnych wniosków.</p>
              ) : (
                <div className="table-wrap">
                  <table className="calc-table">
                    <thead><tr><th>Wniosek</th><th>Złożono</th><th>Rozpatruje</th><th>Status</th></tr></thead>
                    <tbody>
                      {wnioski.map((w, i) => (
                        <tr key={w.numer ?? i}>
                          <td>
                            {w.typ}
                            {w.numer && <><br /><span className="note">nr {w.numer}{w.upo ? ` · ${w.upo}` : ""} · wysłany z RodzicPlus</span></>}
                          </td>
                          <td>{fmt(w.zlozono)}</td>
                          <td>{w.kto}</td>
                          <td>{w.etap && <span className={`badge ${w.etap === 3 ? "b-ok" : "b-warn"}`}>{w.etap}/3</span>} {w.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p>
                <button type="button" className="btn btn-outline" onClick={odswiezWnioski} disabled={odswiezanie}>
                  {odswiezanie ? "Odświeżanie…" : "Odśwież statusy"}
                </button>{" "}
                <Link to="/wnioski">Złóż nowy wniosek</Link>
              </p>
              <p className="note">
                Wzory wniosków o zasiłki: <a href="https://www.zus.pl/wzory-formularzy/zasilki" target="_blank" rel="noreferrer">zus.pl – formularze</a>.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
