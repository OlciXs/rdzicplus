import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import { useProfile } from "../profile.js";
import { api } from "../api.js";
import { CFG } from "../calculators/config.js";
import { przygotujDruk, ocenWniosek, wariantById } from "../engine/index.js";
import { D } from "../engine/wnioski/druki.js";
import { szablonyDlaWariantu } from "../engine/wnioski/latexDokument.js";
import { zapiszDokumentPdf } from "../engine/wnioski/pdfDokument.js";

/* =====================================================================
   Wniosek do złożenia: /wnioski/druk?v=W21
   Dane z „Moje dane” są podstawione w pola; rodzic może je poprawić
   (zmiany zostają tylko na tym ekranie – nie zapisujemy ich w profilu).
   „Zapisz PDF” = plik PDF z wypełnionego szablonu LaTeX – to jedyna
   forma dokumentu. Nie ma podglądu na ekranie ani drukowania strony:
   dokument wnioskodawca pobiera jako PDF i składa.
   Treść i kontrole terminów: src/engine/wnioski/druki.js
   Szablony LaTeX-a: latex/szablony/P01.tex … P18.tex
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
    setZapisany(null); // zapisany plik byłby już nieaktualny
    setBladZapisu("");
  };
  const [potwierdzenie, setPotwierdzenie] = useState(false);
  const [wysylanie, setWysylanie] = useState(false);
  const [wyslany, setWyslany] = useState(null);
  const [bladWysylki, setBladWysylki] = useState("");
  const [szablonId, setSzablonId] = useState(null);
  const [zapisany, setZapisany] = useState(null);
  const [zapisywanie, setZapisywanie] = useState(false);
  const [bladZapisu, setBladZapisu] = useState("");

  const druk = useMemo(
    () => (profile ? przygotujDruk(profile, wariantId, { params: CFG, wartosci }) : null),
    [profile, wariantId, wartosci],
  );
  // Tryb „zam” (osoba niebędąca pracownikiem) nie korzysta z szablonu pisma do pracodawcy,
  // więc nie pokazujemy wyboru szablonu – powstanie zestawienie danych do eZUS.
  const szablony = useMemo(
    () => (druk?.tryb === "zam" ? [] : szablonyDlaWariantu(wariantId)),
    [wariantId, druk?.tryb],
  );
  const wybranySzablon = szablony.some((s) => s.id === szablonId) ? szablonId : szablony[0]?.id ?? null;
  // Status wariantu – żeby nie składać czegoś, co nie przysługuje, bez ostrzeżenia.
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
          <h1>Wniosek</h1>
          <p>Dla tego wariantu nie ma jeszcze gotowego wzoru wniosku.</p>
          <p><Link to="/wnioski">← Wróć do wniosków</Link></p>
        </main>
      </div>
    );
  }

  const bledy = druk.ostrzezenia.filter((o) => o.poziom === "blad");
  const pole = (id) => druk.pola.find((p) => p.id === id)?.wartosc || null;
  // Składać można tylko kompletny wniosek bez błędów – PDF można zapisać zawsze
  // (puste pola zostaną w dokumencie jako miejsce do wpisania ręcznie).
  const blokada = bledy.length > 0 ? "Popraw błędy we wniosku (wyżej)."
    : druk.brakujace.length > 0 ? `Uzupełnij: ${druk.brakujace.join(", ")}.`
    : ocena?.status === "niedostepny" ? "Według „Moje dane” ten wariant Ci nie przysługuje."
    : null;

  const zapiszDokument = async () => {
    setZapisywanie(true);
    setBladZapisu("");
    try {
      const dokument = await zapiszDokumentPdf(druk, profile, { szablonId: wybranySzablon });
      setZapisany(dokument);
    } catch (err) {
      setBladZapisu(err.message || "Nie udało się zapisać PDF.");
    } finally {
      setZapisywanie(false);
    }
  };

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
        <p><Link to={ocena ? `/wnioski?w=${ocena.wniosek}` : "/wnioski"}>← Wróć do wariantów</Link></p>
        <h1>{druk.tytul}</h1>
        <p className="lead">
          Pola wypełniliśmy na podstawie „Moje dane”. Sprawdź je i popraw, jeśli trzeba, a potem zapisz
          dokument PDF – gotowy do złożenia u pracodawcy albo w ZUS. Zmiany wprowadzone tutaj
          nie trafiają do profilu.
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
            Zasiłek za ten okres składasz w ZUS na formularzu <b>ZAM</b> (eZUS) – w dokumencie PDF masz dane do przepisania.
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
              <p className="note">Puste pola ({druk.brakujace.join(", ")}) zostaną w dokumencie PDF jako miejsce do wpisania ręcznie.</p>
            )}
          </section>
        )}

        <section className="druk-zapis" aria-labelledby="druk-zapis-tytul">
          <h2 className="calc-group-title" id="druk-zapis-tytul">Dokument wniosku (PDF)</h2>

          <dl className="druk-meta">
            <div>
              <dt>Forma dokumentu</dt>
              <dd>{druk.tryb === "zam" ? "Zestawienie danych do wniosku ZAM (eZUS)" : szablony.length > 0 ? `Pismo ${wybranySzablon} do pracodawcy` : "Dokument ogólny z danymi z formularza"}</dd>
            </div>
            <div>
              <dt>Adresat</dt>
              <dd>{druk.tryb === "zam" ? "Zakład Ubezpieczeń Społecznych (eZUS)" : druk.naglowek.adresat.join(", ")}</dd>
            </div>
            <div>
              <dt>Podstawa prawna</dt>
              <dd>{druk.podstawa}</dd>
            </div>
            {druk.zalaczniki.length > 0 && (
              <div>
                <dt>Załączniki w PDF</dt>
                <dd>{druk.zalaczniki.join("; ")}</dd>
              </div>
            )}
          </dl>

          {szablony.length > 1 && (
            <label className="field">
              <span className="field-label">Szablon pisma</span>
              <select className="input" value={wybranySzablon ?? ""} onChange={(e) => { setSzablonId(e.target.value); setZapisany(null); setBladZapisu(""); }}>
                {szablony.map((s) => <option key={s.id} value={s.id}>{s.id} – {s.nazwa}</option>)}
              </select>
            </label>
          )}

          <div className="druk-zapis-opcje">
            <button type="button" className="btn btn-primary" onClick={zapiszDokument} disabled={zapisywanie}>
              {zapisywanie ? "Przygotowuję PDF…" : "Zapisz dokument PDF"}
            </button>
            <p className="note">
              {druk.tryb === "zam"
                ? "PDF to zestawienie danych do przepisania do wniosku ZAM w eZUS (nie pismo do pracodawcy)."
                : szablony.length > 0
                  ? "PDF powstanie z szablonu pisma z podstawionymi danymi z formularza."
                  : "Dla tego wariantu nie ma jeszcze osobnego szablonu – PDF powstanie z dokumentu ogólnego z tymi samymi danymi."}
            </p>
            {bladZapisu && <p className="field-error" role="alert">{bladZapisu}</p>}
            {zapisany && (
              <p className="alert-inline" role="status">
                <span className="badge b-ok">Zapisano</span>{" "}
                <code>{zapisany.plik}</code>
                {zapisany.szablonId ? ` – szablon ${zapisany.szablonId}.` : " – dokument ogólny."}
              </p>
            )}
            {bledy.length > 0 && <p className="note">We wniosku są błędy (wyżej) – popraw je przed złożeniem.</p>}
          </div>
        </section>

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

        <p className="note">
          {druk.tryb === "pracodawca"
            ? "Wzór pisma opiera się na rozporządzeniu w sprawie wniosków dotyczących uprawnień pracowników związanych z rodzicielstwem – wymaga potwierdzenia przez ZUS / dział kadr. Pracodawca może mieć własny formularz."
            : "To nie jest formularz ZUS – to zestawienie danych, które przepiszesz do wniosku ZAM w eZUS. Zakres danych wymaga potwierdzenia przez ZUS."}
          {" "}Dokument zapisujesz jako PDF i składasz w wersji papierowej albo elektronicznej.
        </p>
      </main>
    </div>
  );
}
