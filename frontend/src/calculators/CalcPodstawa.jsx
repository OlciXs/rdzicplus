import { useState } from "react";
import { useAuth } from "../auth.js";
import { CFG, num, zl } from "./config.js";
import { podstawaWymiaru } from "../engine/index.js";
import {
  Badge, Field, NumberInput, Select, Section, ResultTable, Bullets, ProfilInfo } from "./ui.jsx";
import { useProfileDefaults, opisPodstawienia } from "./useProfileDefaults.js";
import { SPRAWY_PODSTAWY } from "./sprawyPodstawy.js";
import { api } from "../api.js";

const defaultMonths = () => Array.from({ length: 12 }, () => "5000");

export default function CalcPodstawa() {
  const [s, set] = useState({ status: "pracownik", wymiarEtatu: "1", ileMies: "12", kwartalne: "0", roczna: "0" });
  const [months, setMonths] = useState(defaultMonths);
  const set_ = (k) => (v) => { set((p) => ({ ...p, [k]: v })); setSprawaId(""); };
  const profilDane = useProfileDefaults(set, "podstawa");
  const { profile, save } = profilDane;
  const { user } = useAuth();
  const [saveMsg, setSaveMsg] = useState("");
  const setMonth = (i) => (v) => { setMonths((prev) => prev.map((m, j) => (j === i ? v : m))); setSprawaId(""); };

  // Przykładowe sprawy (fikcyjne) i pobranie wynagrodzeń z symulowanego ZUS – zamiennik „konkretnej sprawy
  // z zestawów” z treści zadania (zestawy ZUS: odłożone, docs/zgodnosc-z-zadaniem.md).
  const [sprawaId, setSprawaId] = useState("");
  const [zusMsg, setZusMsg] = useState("");
  const wczytajSprawe = (id) => {
    setSprawaId(id);
    setZusMsg("");
    const sp = SPRAWY_PODSTAWY.find((x) => x.id === id);
    if (!sp) return;
    set((p) => ({ ...p, ...sp.stan }));
    setMonths([...sp.miesiace]);
  };
  const pobierzZZus = async () => {
    setSprawaId("");
    try {
      const d = await api("/api/zus/dane");
      const kwoty = (d.wynagrodzenia ?? []).map((w) => String(w.kwota)).slice(-12);
      if (!kwoty.length) { setZusMsg("W symulowanym ZUS nie ma wynagrodzeń dla tej osoby – wpisz je ręcznie albo wybierz przykładową sprawę."); return; }
      set((p) => ({ ...p, status: d.statusUbezpieczenia === "pracownik" ? "pracownik" : "niepracownik", ileMies: String(Math.min(12, kwoty.length)) }));
      // Najnowszy miesiąc na końcu listy z ZUS – w siatce kolejność nie ma znaczenia dla średniej.
      setMonths([...kwoty, ...Array.from({ length: 12 - kwoty.length }, () => "0")]);
      setZusMsg(`Wczytano ${kwoty.length} miesięcy z symulowanych danych ZUS (${d.statusUbezpieczenia === "pracownik" ? "wynagrodzenie" : "zadeklarowana podstawa składek"}).`);
    } catch (err) {
      setZusMsg(`Nie udało się pobrać danych z ZUS: ${err.message}`);
    }
  };
  const sprawa = SPRAWY_PODSTAWY.find((x) => x.id === sprawaId);
  const wyborSprawy = (
    <Section title="Przykładowa sprawa albo dane z ZUS">
      <Field label="Przykładowe sprawy (dane fikcyjne)" hint="Typowe sytuacje z załącznika do zadania – każda z policzonym wynikiem.">
        <Select value={sprawaId} onChange={wczytajSprawe} options={[
          { value: "", label: "— wybierz sprawę —" },
          ...SPRAWY_PODSTAWY.map((x) => ({ value: x.id, label: x.nazwa })),
        ]} />
      </Field>
      {user && (
        <div className="field">
          <span className="field-label">Moje wynagrodzenia</span>
          <button type="button" className="btn btn-outline" onClick={pobierzZZus}>Pobierz z ZUS (symulacja)</button>
        </div>
      )}
      {sprawa && <p className="field-hint field-wide">{sprawa.opis} Oczekiwana podstawa: <b>{zl(sprawa.podstawa)}</b>.</p>}
      {zusMsg && <p className="field-hint field-wide" role="status">{zusMsg}</p>}
    </Section>
  );

  const r = podstawaWymiaru({
    status: s.status,
    miesiace: months.map(num),
    ileMies: num(s.ileMies),
    premieKwartalne: num(s.kwartalne),
    premiaRoczna: num(s.roczna),
    // B-17: minimum podstawy (art. 45 ust. 1 u.z.) jest proporcjonalne do etatu.
    wymiarEtatu: num(s.wymiarEtatu) || 1,
  }, CFG);

  if (!r.ok) {
    return (
      <div className="calc">
      <ProfilInfo
        zalogowany={!!profile}
        pola={opisPodstawienia(profilDane.podstawione ?? [], s, profilDane.kalkulator)}
      />
        <div className="calc-cols">
          <div>
            {wyborSprawy}
            <Section title="Status i okres">
              <Field label="Status">
                <Select value={s.status} onChange={set_("status")} options={[
                  { value: "pracownik", label: "Pracownik (umowa o pracę)" },
                  { value: "niepracownik", label: "Zlecenie lub działalność gospodarcza" },
                ]} />
              </Field>
              <Field label="Liczba pełnych miesięcy ubezpieczenia (jeśli < 12)">
                <NumberInput value={s.ileMies} onChange={set_("ileMies")} min="1" max="12" />
              </Field>
            </Section>
            <MonthGrid months={months} setMonth={setMonth} />
          </div>
          <div className="calc-results">
            <p className="alert-inline"><Badge tone="err">BRAK DANYCH</Badge> Podaj przynajmniej jeden miesiąc.</p>
          </div>
        </div>
      </div>
    );
  }

  const { suma, licznik, srednia, dodatek, przecietne, podstawa } = r;
  const clampNote = {
    // Kwota z silnika (r.limit.wartosc) – przy niepełnym etacie minimum jest proporcjonalne (B-17),
    // więc nie można tu pokazywać pełnej kwoty 4 147,10 zł.
    min: r.limit?.etat < 1
      ? `Podniesiono do minimum ${zl(r.limit.wartosc)} – ${String(r.limit.etat).replace(".", ",")} × ${zl(CFG.minPodstawaPracownik)} (minimalne wynagrodzenie ${zl(CFG.minWynagrodzenie)} − 13,71%, proporcjonalnie do etatu; art. 45 UZ).`
      : `Podniesiono do minimum ${zl(r.limit?.wartosc ?? CFG.minPodstawaPracownik)} (minimalne wynagrodzenie ${zl(CFG.minWynagrodzenie)} − 13,71%; art. 45 UZ – pełny wymiar czasu pracy).`,
    max: `Ograniczono do maksymalnej podstawy ${zl(CFG.maxPodstawaZasilku)} (limit od maksymalnej podstawy dobrowolnej składki chorobowej ${zl(CFG.maxPodstawaSkladki)} − 13,71%).`,
    ostrzezenieMinDobrowolni: `Uwaga: podstawa poniżej typowego minimum dla ubezpieczonych dobrowolnie (przy najniższej zadeklarowanej podstawie składek tzw. duży ZUS 5 652 zł podstawa zasiłku to ok. ${zl(CFG.minPodstawaDobrowolni)}). Zweryfikuj minimalną podstawę z ZUS.`,
  }[r.limit?.typ] ?? "";

  const saveToProfile = async () => {
    const res = await save({
      ...profile,
      ubezpieczony: { ...profile.ubezpieczony, podstawaWymiaru: Math.round(podstawa * 100) / 100 },
    });
    setSaveMsg(res.ok ? "Zapisano w „Moje dane” – inne kalkulatory podstawią tę kwotę." : "Nie udało się zapisać.");
  };

  return (
    <div className="calc">
      {/* Pasek „Z PROFILU” także przy normalnym wyniku (wcześniej był tylko w gałęzi „brak danych”). */}
      <ProfilInfo
        zalogowany={!!profile}
        pola={opisPodstawienia(profilDane.podstawione ?? [], s, profilDane.kalkulator)}
      />
      <div className="calc-cols">
        <div>
          {wyborSprawy}
          <Section
            title="Status i okres"
            note="Miesiące, w których przepracowano mniej niż połowę obowiązującego czasu pracy, pomija się (wpisz 0). Przy co najmniej połowie wynagrodzenie uzupełnia się do pełnego miesiąca (w uproszczeniu: podaj kwotę po uzupełnieniu)."
          >
            <Field label="Status">
              <Select value={s.status} onChange={set_("status")} options={[
                { value: "pracownik", label: "Pracownik (umowa o pracę)" },
                { value: "niepracownik", label: "Zlecenie lub działalność gospodarcza" },
              ]} />
            </Field>
            {s.status === "pracownik" && (
              <Field label="Wymiar etatu" hint="Minimum podstawy (4 147,10 zł) liczymy proporcjonalnie do etatu – art. 45 ust. 1 ustawy zasiłkowej.">
                <Select value={s.wymiarEtatu} onChange={set_("wymiarEtatu")} options={[
                  { value: "1", label: "Pełny etat" },
                  { value: "0.75", label: "3/4 etatu" },
                  { value: "0.5", label: "1/2 etatu" },
                  { value: "0.25", label: "1/4 etatu" },
                ]} />
              </Field>
            )}
            <Field label="Liczba pełnych miesięcy ubezpieczenia (jeśli < 12)">
              <NumberInput value={s.ileMies} onChange={set_("ileMies")} min="1" max="12" />
            </Field>
            <Field label="Premia kwartalna: suma z 4 poprzednich kwartałów (zł)">
              <NumberInput value={s.kwartalne} onChange={set_("kwartalne")} min="0" step="0.01" />
            </Field>
            <Field label="Premia roczna: kwota z roku poprzedniego (zł)">
              <NumberInput value={s.roczna} onChange={set_("roczna")} min="0" step="0.01" />
            </Field>
          </Section>
          <MonthGrid months={months} setMonth={setMonth} />
        </div>

        <div className="calc-results">
          <ResultTable
            cols={[{ label: "Podsumowanie" }, { label: "", align: "right" }]}
            rows={[
              { cells: ["Przeciętne miesięczne", zl(przecietne)] },
              { cells: ["Podstawa miesięcznie", zl(podstawa)] },
              { cells: ["Podstawa dzienna (1/30)", zl(r.dzienna)] },
              { cells: ["Zasiłek 100% / mies.", zl(r.miesiecznie.macierzynski100)], total: true },
            ]}
          />
          {user && profile && (
            <div className="summary-card">
              <button type="button" className="btn btn-outline" onClick={saveToProfile}>
                Zapisz jako moją podstawę w profilu
              </button>
              {saveMsg && <p className="note" role="status">{saveMsg}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="result-stack">
        <section className="result-card">
          <h3 className="result-title">1. Wyliczenie</h3>
          <ResultTable
            cols={[{ label: "Pozycja" }, { label: "", align: "right" }]}
            rows={[
              { cells: [`Suma wynagrodzeń za ${licznik} pełnych miesięcy`, zl(suma)] },
              { cells: ["Przeciętne miesięczne (bez potrąceń)", zl(srednia)] },
              ...(dodatek > 0 ? [{ cells: ["Premie wliczane 1/12 (kwartalne + roczna)", zl(dodatek)] }] : []),
              { cells: ["Przeciętne razem", zl(przecietne)] },
              { cells: ["Potrącenie składek (13,71%)", "−" + zl(r.potracenie)] },
              { cells: ["Podstawa wymiaru zasiłku (miesięcznie)", zl(podstawa)], total: true },
              { cells: ["Podstawa dzienna (1/30)", zl(r.dzienna)] },
            ]}
          />
          {clampNote && <p className="alert-inline"><Badge tone="warn">LIMIT</Badge> {clampNote}</p>}
        </section>

        <section className="result-card">
          <h3 className="result-title">2. Miesięczne kwoty świadczeń (od tej podstawy)</h3>
          <ResultTable
            cols={[{ label: "Świadczenie" }, { label: "", align: "right" }]}
            rows={[
              { cells: ["Zasiłek macierzyński 100% (macierzyński, uzupełniający, ojcowski)", zl(r.miesiecznie.macierzynski100)] },
              { cells: [`Zasiłek macierzyński 81,5% (wniosek do ${CFG.deadlineSredniowany} dni)`, zl(r.miesiecznie.macierzynski815)] },
              { cells: ["Zasiłek macierzyński 70% (wariant zmienny – rodzicielski)", zl(r.miesiecznie.rodzicielski70)] },
              { cells: ["Zasiłek chorobowy 100% (ciąża, kod B)", zl(r.miesiecznie.chorobowyCiaza)] },
              { cells: ["Zasiłek chorobowy 80% (standard)", zl(r.miesiecznie.chorobowy80)] },
            ]}
          />
          <Bullets items={[
            "Miesiące, w których przepracowano mniej niż połowę obowiązującego czasu pracy, wyłącza się (art. 38 ust. 2); przy co najmniej połowie wynagrodzenie się uzupełnia (art. 37–38).",
            "Składniki wypłacane nadal w okresie zasiłku (np. dodatek stażowy) nie wliczają się (art. 41).",
            "Podstawę ustala się na nowo dopiero po przerwie między zasiłkami wynoszącej co najmniej 3 miesiące kalendarzowe (art. 43). Przy zleceniu i działalności podstawą jest zadeklarowana podstawa składek (art. 48–48a).",
          ]} />
        </section>
      </div>
    </div>
  );
}

function MonthGrid({ months, setMonth }) {
  return (
    <Section title="Wynagrodzenie / przychód brutto za kolejne pełne miesiące (zł)">
      {months.map((m, i) => (
        <Field key={i} label={`Miesiąc ${i + 1}`}>
          <NumberInput value={m} onChange={setMonth(i)} min="0" step="0.01" />
        </Field>
      ))}
    </Section>
  );
}
