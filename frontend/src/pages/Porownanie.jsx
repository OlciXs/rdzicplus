import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import { useProfile } from "../profile.js";
import { CFG, zl } from "../calculators/config.js";
import { porownaj } from "../engine/porownanie.js";

const todayIso = () => new Date().toISOString().slice(0, 10);

const DEMO_PRESETS = {
  bozenamariusz: {
    label: "Bożena + Mariusz",
    today: "2026-10-30",
    data: {
      dzieci: "1",
      porod: "2026-10-28",
      przewidywanaDataPorodu: "2026-10-28",
      podstawaMatki: "5177.40",
      podstawaOjca: "6471.75",
      mamaUbezpieczona: "tak",
      tataUbezpieczony: "tak",
      zalegloscMatki: "nie",
      zalegloscTaty: "nie",
      dobrowolnaMama: false,
      wniosek815: "tak",
      rownolegle: false,
    },
  },
  marzenaDebt: {
    label: "Marzena – zaległość 312,40 zł",
    today: "2026-10-30",
    data: {
      dzieci: "1",
      porod: "2026-10-28",
      przewidywanaDataPorodu: "2026-10-28",
      podstawaMatki: "4877.11",
      podstawaOjca: "6471.75",
      mamaUbezpieczona: "tak",
      tataUbezpieczony: "tak",
      zalegloscMatki: "tak",
      zalegloscTaty: "nie",
      dobrowolnaMama: true,
      wniosek815: "tak",
      rownolegle: false,
    },
  },
  marzenaPaid: {
    label: "Marzena – po spłacie",
    today: "2026-10-30",
    data: {
      dzieci: "1",
      porod: "2026-10-28",
      przewidywanaDataPorodu: "2026-10-28",
      podstawaMatki: "4877.11",
      podstawaOjca: "6471.75",
      mamaUbezpieczona: "tak",
      tataUbezpieczony: "tak",
      zalegloscMatki: "nie",
      zalegloscTaty: "nie",
      dobrowolnaMama: true,
      wniosek815: "tak",
      rownolegle: false,
    },
  },
};

const coverageFromStatus = (status) => {
  if (["pracownik", "powolanie", "uaktywniajaca", "zlecenie", "dg", "wspolpraca", "duchowny", "marynarz"].includes(status)) {
    if (["pracownik", "powolanie", "uaktywniajaca"].includes(status)) return "tak";
    if (["dzielo", "student_zlecenie", "nierejestrowa", "ulga_na_start", "brak"].includes(status)) return "nie";
    return "nieznane";
  }
  if (["dzielo", "student_zlecenie", "nierejestrowa", "ulga_na_start", "brak"].includes(status)) return "nie";
  return "nieznane";
};

function statusLabel(status) {
  if (status === "dostepny") return "Dostępny";
  if (status === "niedostepny") return "Niedostępny";
  if (status === "brak_danych") return "Brak danych";
  return "Do potwierdzenia";
}

export default function Porownanie() {
  const { profile, loading } = useProfile();
  const [data, setData] = useState({
    ...DEMO_PRESETS.bozenamariusz.data,
  });
  const [today, setToday] = useState(DEMO_PRESETS.bozenamariusz.today);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!profile || applied) return;
    const u = profile.ubezpieczony || {};
    const o = profile.drugiRodzic || {};
    const d = profile.dziecko || {};
    const ur = profile.urlopy || {};
    const father = u.plec === "M";
    const motherBase = father ? o.podstawaWymiaru : u.podstawaWymiaru;
    const fatherBase = father ? u.podstawaWymiaru : o.podstawaWymiaru;
    const motherStatus = father ? o.statusUbezpieczenia : u.statusUbezpieczenia;
    const fatherStatus = father ? u.statusUbezpieczenia : o.statusUbezpieczenia;
    setData((prev) => ({
      ...prev,
      dzieci: d.liczbaDzieci ? String(d.liczbaDzieci) : prev.dzieci,
      porod: d.dataUrodzenia || "",
      przewidywanaDataPorodu: d.przewidywanaDataPorodu || "",
      podstawaMatki: motherBase || "",
      podstawaOjca: fatherBase || "",
      mamaUbezpieczona: coverageFromStatus(motherStatus),
      tataUbezpieczony: coverageFromStatus(fatherStatus),
      zalegloscMatki: u.zaleglosci === "tak" ? "tak" : u.zaleglosci === "nie" ? "nie" : "nieznane",
      zalegloscTaty: o.zaleglosci === "tak" ? "tak" : o.zaleglosci === "nie" ? "nie" : "nieznane",
      wniosek815: ur.zamiarPelnyWymiar === "tak" ? "tak" : ur.zamiarPelnyWymiar === "nie" ? "nie" : "nieznane",
      dobrowolnaMama: ["zlecenie", "dg", "wspolpraca", "duchowny", "marynarz"].includes(motherStatus),
    }));
    setApplied(true);
  }, [profile, applied]);

  const engineData = useMemo(() => ({
    ...data,
    mamaUbezpieczona: data.mamaUbezpieczona === "tak" ? true : data.mamaUbezpieczona === "nie" ? false : null,
    tataUbezpieczony: data.tataUbezpieczony === "tak" ? true : data.tataUbezpieczony === "nie" ? false : null,
    zalegloscMatki: data.zalegloscMatki === "tak" ? 1e9 : data.zalegloscMatki === "nie" ? 0 : null,
    zalegloscTaty: data.zalegloscTaty === "tak" ? 1e9 : data.zalegloscTaty === "nie" ? 0 : null,
    wniosek815: data.wniosek815 === "tak" ? true : data.wniosek815 === "nie" ? false : null,
  }), [data]);

  const result = useMemo(() => porownaj(engineData, CFG, today), [engineData, today]);
  const w1 = result.scenariusze.find((s) => s.id === "W1");
  const set = (name) => (event) => setData((prev) => ({ ...prev, [name]: event.target.value }));
  const applyPreset = (preset) => {
    setData({ ...preset.data });
    setToday(preset.today);
  };

  return (
    <div className="app">
      <AppHeader />
      <main className="kalkulator-page porownanie-page">
        <nav className="breadcrumb" aria-label="Ścieżka">
          <Link className="breadcrumb-link" to="/">Strona główna</Link><span className="breadcrumb-sep">/</span>
          <span aria-current="page">Porównanie</span>
        </nav>
        <div className="hero">
          <h1>Porównanie zasiłków macierzyńskiego i rodzicielskiego</h1>
          <p className="lead">Symulacja orientacyjna na podstawie Poradnika ZUS (stan na 1.04.2026). Nie jest decyzją ZUS. O przyznaniu i wysokości zasiłku decyduje ZUS lub płatnik.</p>
          <p className="note">Wiersze „suma mamy”, „suma taty” i „suma rodziny” pokazują łączne kwoty z całego okresu. W1 i W2 mają różne rozłożenie tygodni i stawki, dlatego suma może być bardzo zbliżona, mimo odmiennych kwot miesięcznych.</p>
        </div>

        <section className="por-profil card" aria-label="Dane porównania">
          <div className="por-toolbar">
            <strong>{profile ? "Z PROFILU" : "DANE DO SYMULACJI"}</strong>
            {loading && <span>Wczytywanie profilu…</span>}
            {profile && <span>Pola z „Moich danych” można zmienić poniżej.</span>}
          </div>
          <div className="por-presets" aria-label="Dane przykładowe">
            <span>Dane przykładowe:</span>
            {Object.entries(DEMO_PRESETS).map(([key, preset]) => (
              <button className="btn btn-outline" type="button" key={key} onClick={() => applyPreset(preset)}>{preset.label}</button>
            ))}
          </div>
          <div className="por-fields">
            <label>Dzieci przy porodzie<select value={data.dzieci} onChange={set("dzieci")}><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5 i więcej (do potwierdzenia)</option></select></label>
            <label>Data porodu<input type="date" value={data.porod} onChange={set("porod")} /></label>
            <label>Przewidywana data porodu<input type="date" value={data.przewidywanaDataPorodu} onChange={set("przewidywanaDataPorodu")} /></label>
            <label>Podstawa – mama<input type="number" min="0" step="0.01" value={data.podstawaMatki} onChange={set("podstawaMatki")} /></label>
            <label>Podstawa – tata<input type="number" min="0" step="0.01" value={data.podstawaOjca} onChange={set("podstawaOjca")} /></label>
            <label>Mama – chorobowe<select value={data.mamaUbezpieczona} onChange={set("mamaUbezpieczona")}><option value="tak">Tak</option><option value="nie">Nie</option><option value="nieznane">Do potwierdzenia</option></select></label>
            <label>Tata – chorobowe<select value={data.tataUbezpieczony} onChange={set("tataUbezpieczony")}><option value="tak">Tak</option><option value="nie">Nie</option><option value="nieznane">Do potwierdzenia</option></select></label>
            <label>Zaległość mamy<select value={data.zalegloscMatki} onChange={set("zalegloscMatki")}><option value="nie">Nie / do progu {CFG.progZaleglosci} zł</option><option value="tak">Powyżej progu – blokada</option><option value="nieznane">Do potwierdzenia</option></select></label>
            <label>Zaległość taty<select value={data.zalegloscTaty} onChange={set("zalegloscTaty")}><option value="nie">Nie / do progu {CFG.progZaleglosci} zł</option><option value="tak">Powyżej progu – blokada</option><option value="nieznane">Do potwierdzenia</option></select></label>
            <label>Wniosek o 81,5%<select value={data.wniosek815} onChange={set("wniosek815")}><option value="tak">Złożony / planowany w 21 dni</option><option value="nie">Nie złożono w 21 dni</option><option value="nieznane">Do potwierdzenia</option></select></label>
            <label className="por-check"><input type="checkbox" checked={data.dobrowolnaMama} onChange={(e) => setData((p) => ({ ...p, dobrowolnaMama: e.target.checked }))} /> Mama ma dobrowolne chorobowe</label>
            <label>Dzień symulacji<input type="date" value={today} onChange={(e) => setToday(e.target.value)} /></label>
            <label className="por-check"><input type="checkbox" checked={data.rownolegle} onChange={(e) => setData((p) => ({ ...p, rownolegle: e.target.checked }))} /> Podział równoległy (tylko daty końca)</label>
          </div>
        </section>

        <div className="por-table-wrap table-wrap" role="region" aria-label="Tabela porównania scenariuszy">
          <table className="por-table calc-table">
            <caption>Porównanie 4 scenariuszy; różnice podane względem W1</caption>
            <thead><tr><th scope="col">Scenariusz</th>{result.scenariusze.map((s) => <th scope="col" key={s.id}>{s.id}<br />{s.nazwa}</th>)}</tr></thead>
            <tbody>
              <tr><th scope="row">Status</th>{result.scenariusze.map((s) => <td key={s.id}><strong>{statusLabel(s.status)}</strong>{s.powody.map((p) => <div className="por-note" key={p}>{p}</div>)}</td>)}</tr>
              <tr><th scope="row">Etapy i stawki</th>{result.scenariusze.map((s) => <td key={s.id}>{s.tygodnie.map((e) => <div key={e.etap}><b>{e.etap}</b>: {e.tygodnie} tyg. × {String(e.stawka).replace(".", ",")}%</div>)}</td>)}</tr>
              <tr><th scope="row">Kwota miesięczna na etap</th>{result.scenariusze.map((s) => <td key={s.id}>{s.tygodnie.map((e) => <div key={e.etap}>{e.etap}: {zl(e.kwotaMiesieczna)}</div>)}</td>)}</tr>
              <tr><th scope="row">Suma mamy</th>{result.scenariusze.map((s) => <td key={s.id}>{zl(s.sumaMama)}</td>)}</tr>
              <tr><th scope="row">Suma taty</th>{result.scenariusze.map((s) => <td key={s.id}>{zl(s.sumaTata)}</td>)}</tr>
              <tr><th scope="row">Suma rodziny</th>{result.scenariusze.map((s) => <td key={s.id}><strong>{zl(s.sumaRodziny)}</strong><br />{s.id === "W1" ? "Względem W1: 0 zł" : `${s.roznicaDoW1 >= 0 ? "+" : "−"} ${zl(Math.abs(s.roznicaDoW1))}`}</td>)}</tr>
              <tr><th scope="row">Pierwszy / ostatni dzień</th>{result.scenariusze.map((s) => <td key={s.id}>{s.pierwszyDzien || "do potwierdzenia"}{s.ostatniDzien ? ` – ${s.ostatniDzien}` : ""}{s.terminOrientacyjny && <div>Orientacyjnie z przewidywanej daty porodu</div>}</td>)}</tr>
              <tr><th scope="row">Tygodnie przepadające</th>{result.scenariusze.map((s) => <td key={s.id}>{s.tygodniePrzepadajace} tyg.</td>)}</tr>
              <tr><th scope="row">Termin 81,5%</th>{result.scenariusze.map((s) => <td key={s.id}>{s.terminDecyzji || "do potwierdzenia"}{s.terminOrientacyjny ? " – orientacyjnie" : ""}</td>)}</tr>
              <tr><th scope="row">Braki danych</th>{result.scenariusze.map((s) => <td key={s.id}>{s.brakujaceDane.map((b) => <Link key={b.pole} to={`/profil?krok=${b.krok}`}>{b.etykieta}</Link>)}</td>)}</tr>
              <tr><th scope="row">Podstawa / źródło</th>{result.scenariusze.map((s) => <td key={s.id}>{s.podstawa}</td>)}</tr>
            </tbody>
          </table>
        </div>

        <div className="por-cards">
          {result.scenariusze.map((s) => (
            <article className="card por-card" key={s.id}>
              <h2>{s.id} – {s.nazwa}</h2>
              <p><strong>{statusLabel(s.status)}</strong></p>
              {s.powody.map((p) => <p className="por-note" key={p}>{p}</p>)}
              {s.tygodnie.map((e) => <p key={e.etap}><b>{e.etap}</b>: {e.tygodnie} tyg. × {String(e.stawka).replace(".", ",")}%; miesięcznie {zl(e.kwotaMiesieczna)}</p>)}
              <p><strong>Suma rodziny: {zl(s.sumaRodziny)}</strong></p>
              <p>Różnica względem W1: {s.id === "W1" ? "0 zł" : `${s.roznicaDoW1 >= 0 ? "+" : "−"} ${zl(Math.abs(s.roznicaDoW1))}`}</p>
              <p>{s.pierwszyDzien || "Do potwierdzenia"} – {s.ostatniDzien || "do potwierdzenia"}{s.terminOrientacyjny ? " (orientacyjnie)" : ""}</p>
              <p>Przepada: {s.tygodniePrzepadajace} tyg. | Termin 81,5%: {s.terminDecyzji || "do potwierdzenia"}</p>
              {s.brakujaceDane.map((b) => <Link key={b.pole} to={`/profil?krok=${b.krok}`}>{b.etykieta}</Link>)}
              <p className="por-source">Źródło: {s.podstawa}</p>
            </article>
          ))}
        </div>

        {result.urlopOjcowski && <section className="card por-independent"><h2>Urlop ojcowski – pokazany osobno</h2><p><b>{result.urlopOjcowski.dni} dni</b>, stawka {result.urlopOjcowski.stawka}%, termin do {result.urlopOjcowski.termin}. Nie wliczany do sum scenariuszy.</p><p>Źródło: {result.urlopOjcowski.podstawa}</p></section>}

        {result.ostrzezenia.map((o) => <div className="por-warning" key={o.kod}>{o.tekst}</div>)}
        <section className="card por-exclusions"><h2>Czego ta symulacja nie uwzględnia</h2><ul>{result.czegoNieUwzglednia.map((x) => <li key={x}>{x}</li>)}</ul></section>
      </main>
    </div>
  );
}
