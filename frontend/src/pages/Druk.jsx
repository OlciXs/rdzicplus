import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import { useProfile } from "../profile.js";
import { api } from "../api.js";
import { CFG } from "../calculators/config.js";
import { przygotujDruk, ocenWniosek, wariantById } from "../engine/index.js";
import { D } from "../engine/wnioski/druki.js";

/* =====================================================================
   Wniosek do druku: /wnioski/druk?v=W21
   Dane z „Moje dane” są podstawione w pola; rodzic może je poprawić
   (zmiany zostają tylko na tym ekranie – nie zapisujemy ich w profilu).
   „Drukuj / zapisz PDF” = okno drukowania przeglądarki (style @media print).
   Treść i kontrole terminów: src/engine/wnioski/druki.js
   ===================================================================== */

const POZIOM = { blad: "err", ostrzezenie: "warn", info: "warn" };

function Pole({ p, opcje, onChange }) {
  const id = `druk-${p.id}`;
  return (
    <div className={`field${p.typ === "text" && p.etykieta.length > 40 ? " field-wide" : ""}`}>
      <label className="field-label" htmlFor={id}>{p.etykieta}{p.wymagane ? "" : " (opcjonalnie)"}</label>
      {p.typ === "select" ? (
        <select id={id} className="input" value={p.wartosc} onChange={(e) => onChange(p.id, e.target.value)}>
          {(opcje ?? []).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      ) : (
        <input id={id} className={`input${p.wymagane && !String(p.wartosc).trim() ? " is-invalid" : ""}`}
          type={p.typ === "date" ? "date" : p.typ === "number" ? "number" : "text"}
          min={p.typ === "number" ? 0 : undefined}
          value={p.wartosc} onChange={(e) => onChange(p.id, e.target.value)} />
      )}
      {p.pomoc && <span className="field-hint">{p.pomoc}</span>}
    </div>
  );
}

export default function Druk() {
  const { profile, loading } = useProfile();
  const [params] = useSearchParams();
  const wariantId = params.get("v");
  const [wartosci, setWartosci] = useState({});
  const ustaw = (id, v) => {
    setWartosci((w) => ({ ...w, [id]: v }));
    setWyslany(null); // po zmianie danych trzeba wysłać od nowa
  };
  const [potwierdzenie, setPotwierdzenie] = useState(false);
  const [wysylanie, setWysylanie] = useState(false);
  const [wyslany, setWyslany] = useState(null);
  const [bladWysylki, setBladWysylki] = useState("");

  const druk = useMemo(
    () => (profile ? przygotujDruk(profile, wariantId, { params: CFG, wartosci }) : null),
    [profile, wariantId, wartosci],
  );
  // Status wariantu – żeby nie drukować czegoś, co nie przysługuje, bez ostrzeżenia.
  const ocena = useMemo(() => {
    const wariant = wariantById(wariantId);
    if (!profile || !wariant) return null;
    return ocenWniosek(profile, wariant.wniosek, { params: CFG }).warianty.find((v) => v.id === wariantId) ?? null;
  }, [profile, wariantId]);

  if (loading) {
    return <div className="app"><AppHeader /><main className="container"><p className="center-msg">Wczytywanie…</p></main></div>;
  }
  if (!druk) {
    return (
      <div className="app">
        <AppHeader />
        <main className="container">
          <h1>Wniosek do druku</h1>
          <p>Dla tego wariantu nie ma jeszcze gotowego wzoru wniosku.</p>
          <p><Link to="/wnioski">← Wróć do wniosków</Link></p>
        </main>
      </div>
    );
  }

  const bledy = druk.ostrzezenia.filter((o) => o.poziom === "blad");
  const pole = (id) => druk.pola.find((p) => p.id === id)?.wartosc || null;
  // Wysłać można tylko kompletny wniosek bez błędów – wydrukować zawsze (puste pola zostają do wpisania ręcznie).
  const blokada = bledy.length > 0 ? "Popraw błędy we wniosku (wyżej)."
    : druk.brakujace.length > 0 ? `Uzupełnij: ${druk.brakujace.join(", ")}.`
    : ocena?.status === "niedostepny" ? "Według „Moje dane” ten wariant Ci nie przysługuje."
    : null;

  const wyslij = async () => {
    setWysylanie(true);
    setBladWysylki("");
    try {
      const d = await api("/api/wnioski/wyslij", {
        method: "POST",
        body: {
          wariantId: druk.id,
          tryb: druk.tryb,
          tytul: druk.tytul,
          adresat: druk.naglowek.adresat[0],
          tresc: druk.tryb === "zam"
            ? druk.pola.filter((p) => String(p.wartosc).trim()).map((p) => `${p.etykieta}: ${p.typ === "date" ? D(p.wartosc) : p.wartosc}`)
            : druk.tresc,
          zalaczniki: druk.zalaczniki,
          od: pole("od"),
          do: pole("do"),
          potwierdzenie,
        },
      });
      setWyslany(d.wniosek);
    } catch (err) {
      setBladWysylki(err.message);
    } finally {
      setWysylanie(false);
    }
  };

  return (
    <div className="app">
      <AppHeader />
      <main className="container druk-page">
        <div className="no-print">
          <p><Link to={ocena ? `/wnioski?w=${ocena.wniosek}` : "/wnioski"}>← Wróć do wariantów</Link></p>
          <h1>{druk.tytul}</h1>
          <p className="lead">
            Pola wypełniliśmy na podstawie „Moje dane”. Sprawdź je, popraw, jeśli trzeba, a potem wydrukuj
            albo zapisz jako PDF i podpisz. Zmiany wprowadzone tutaj nie trafiają do profilu.
          </p>

          {ocena && ocena.status !== "dostepny" && (
            <p className="alert-inline">
              <span className={`badge ${ocena.status === "niedostepny" ? "b-err" : "b-warn"}`}>
                {ocena.status === "niedostepny" ? "Nie przysługuje" : "Brakuje danych"}
              </span>{" "}
              {ocena.status === "niedostepny"
                ? `Według „Moje dane” ten wariant Ci nie przysługuje: ${ocena.powody.join("; ")}.`
                : "Nie wszystko da się sprawdzić – uzupełnij „Moje dane”, zanim złożysz wniosek."}
            </p>
          )}
          {druk.tryb === "zam" && (
            <p className="alert-inline">
              <span className="badge b-warn">ZAM</span> Nie jesteś pracownikiem, więc nie składasz wniosku o urlop do pracodawcy.
              Zasiłek za ten okres składasz w ZUS na formularzu <b>ZAM</b> (eZUS) – poniżej masz dane do przepisania.
            </p>
          )}

          <section className="calc-group" aria-labelledby="druk-pola">
            <h2 className="calc-group-title" id="druk-pola">Dane we wniosku</h2>
            <div className="calc-grid">
              {druk.pola.map((p) => <Pole key={p.id} p={p} opcje={druk.opcje[p.id]} onChange={ustaw} />)}
            </div>
            {druk.oswiadczenia.length > 0 && (
              <>
                <h3 className="calc-group-title" style={{ marginTop: 18 }}>Oświadczenia</h3>
                {druk.oswiadczenia.map((o) => (
                  <label key={o.id} className="check-row">
                    <input type="checkbox" checked={o.zaznaczone} onChange={(e) => ustaw(o.id, e.target.checked)} />{" "}
                    {o.tekst}
                  </label>
                ))}
              </>
            )}
          </section>

          {(druk.ostrzezenia.length > 0 || druk.brakujace.length > 0) && (
            <section aria-label="Sprawdzenie wniosku">
              {["blad", "ostrzezenie", "info"].map((poziom) => {
                const lista = druk.ostrzezenia.filter((o) => o.poziom === poziom);
                return lista.length ? (
                  <ul key={poziom} className={`alert-list ${POZIOM[poziom]}`}>{lista.map((o) => <li key={o.tekst}>{o.tekst}</li>)}</ul>
                ) : null;
              })}
              {druk.brakujace.length > 0 && (
                <p className="note">Puste pola ({druk.brakujace.join(", ")}) zostaną na wydruku jako miejsce do wpisania ręcznie.</p>
              )}
            </section>
          )}

          <p>
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              Drukuj / zapisz jako PDF
            </button>
            {bledy.length > 0 && <span className="note"> – we wniosku są błędy (wyżej), popraw je przed złożeniem.</span>}
          </p>

          <section className="result-card" aria-labelledby="druk-wyslij">
            <h2 className="result-title" id="druk-wyslij">
              <span className="badge b-warn">SYMULACJA</span>{" "}
              {druk.tryb === "zam" ? "Wyślij do ZUS przez PUE/eZUS" : "Wyślij do pracodawcy elektronicznie"}
            </h2>
            {wyslany ? (
              <div role="status">
                <p><b>Wysłano.</b> Numer wniosku: <b>{wyslany.numer}</b>{wyslany.upo && <> · UPO: <b>{wyslany.upo}</b></>}</p>
                <p>Status: {wyslany.status}. Kolejne etapy zobaczysz w <Link to="/zus">„Dane z ZUS” → „Twoje wnioski”</Link>.</p>
                <p className="note">W symulacji status zmienia się sam po ok. 20 s i 1 min. Nic nie trafia do prawdziwego pracodawcy ani do ZUS.</p>
              </div>
            ) : (
              <>
                <p className="note">
                  {druk.tryb === "zam"
                    ? "W docelowej wersji wniosek trafi do PUE/eZUS podpisany profilem zaufanym, a ZUS odeśle Urzędowe Poświadczenie Odbioru (UPO)."
                    : "W docelowej wersji pismo trafi do pracodawcy przez jego system kadrowy albo e-mail, z potwierdzeniem doręczenia."}
                </p>
                <label className="check-row">
                  <input type="checkbox" checked={potwierdzenie} onChange={(e) => setPotwierdzenie(e.target.checked)} />{" "}
                  Potwierdzam, że dane we wniosku są zgodne z prawdą.
                </label>
                {blokada && <p className="field-error">{blokada}</p>}
                {bladWysylki && <p className="field-error" role="alert">{bladWysylki}</p>}
                <button type="button" className="btn btn-outline" disabled={!!blokada || !potwierdzenie || wysylanie} onClick={wyslij}>
                  {wysylanie ? "Wysyłanie…" : druk.tryb === "zam" ? "Wyślij do ZUS (symulacja)" : "Wyślij do pracodawcy (symulacja)"}
                </button>
              </>
            )}
          </section>
          <h2>Podgląd</h2>
        </div>

        <article className="druk-kartka" aria-label="Podgląd wniosku">
          <p className="druk-prawo">{druk.naglowek.miejscowoscData}</p>
          <div className="druk-nadawca">{druk.naglowek.nadawca.map((l) => <div key={l}>{l}</div>)}</div>
          <div className="druk-adresat">{druk.naglowek.adresat.map((l) => <div key={l}>{l}</div>)}</div>
          <h2 className="druk-tytul">{druk.tytul}</h2>
          {druk.tryb === "zam" ? (
            <dl className="druk-zam">
              {druk.pola.filter((p) => !["miejscowosc", "dataZlozenia"].includes(p.id)).map((p) => (
                <div key={p.id}>
                  <dt>{p.etykieta}</dt>
                  <dd>{p.typ === "date" ? D(p.wartosc) : p.typ === "select" ? (druk.opcje[p.id]?.find(([v]) => v === p.wartosc)?.[1] ?? p.wartosc) : String(p.wartosc).trim() || "……………"}</dd>
                </div>
              ))}
              {druk.oswiadczenia.filter((o) => o.zaznaczone).map((o) => (
                <div key={o.id}><dt>Oświadczenie</dt><dd>{o.tekst}</dd></div>
              ))}
            </dl>
          ) : (
            druk.tresc.map((t) => <p key={t}>{t}</p>)
          )}
          {druk.zalaczniki.length > 0 && (
            <>
              <p><b>Załączniki:</b></p>
              <ol>{druk.zalaczniki.map((z) => <li key={z}>{z}</li>)}</ol>
            </>
          )}
          {druk.tryb === "pracodawca" && <p className="druk-podpis">……………………………………<br />podpis pracownika</p>}
          <p className="druk-stopka">Podstawa: {druk.podstawa.replace(/\.$/, "")}. Przygotowano w RodzicPlus na podstawie danych podanych przez wnioskodawcę.</p>
        </article>

        <p className="note no-print">
          {druk.tryb === "pracodawca"
            ? "Wzór pisma opiera się na rozporządzeniu w sprawie wniosków dotyczących uprawnień pracowników związanych z rodzicielstwem – wymaga potwierdzenia przez ZUS / dział kadr. Pracodawca może mieć własny formularz."
            : "To nie jest formularz ZUS – to zestawienie danych, które przepiszesz do wniosku ZAM w eZUS. Zakres danych wymaga potwierdzenia przez ZUS."}
        </p>
      </main>
    </div>
  );
}
