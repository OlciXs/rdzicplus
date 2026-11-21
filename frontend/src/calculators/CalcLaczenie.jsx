import { useState } from "react";
import { CFG, num, zl, tyg } from "./config.js";
import { laczenieZPraca } from "../engine/index.js";
import {
  Badge, Field, NumberInput, Select, Check, Section,
  ResultTable, Bullets,
} from "./ui.jsx";

export default function CalcLaczenie() {
  const [s, set] = useState({
    dzieci: "1",
    zaZyciem: false,
    etat: "0.5",
    podstawa: "5000",
    stawka: "81.5",
  });
  const set_ = (k) => (v) => set((p) => ({ ...p, [k]: v }));

  // Wszystkie obliczenia: src/engine/laczenie.js
  const r = laczenieZPraca({
    dzieci: num(s.dzieci),
    zaZyciem: s.zaZyciem,
    etat: num(s.etat),
    podstawa: num(s.podstawa),
    stawka: num(s.stawka),
  }, CFG);
  const { przekroczonyEtat, uderzonoWLimit } = r;
  const f = r.etat;
  const W = r.wymiar;
  const cap = r.limit;
  const Wext = r.wydluzony;
  const wydlKwoty = r.wydluzenie;
  const dzienPelny = r.dziennyPelny;
  const dzienPomn = r.dziennyPomniejszony;

  return (
    <div className="calc">
      <div className="calc-cols">
        <div>
          <Section title="Dane">
            <Field label="Liczba dzieci">
              <Select value={s.dzieci} onChange={set_("dzieci")} options={[
                { value: "1", label: "1" }, { value: "2", label: "2+" },
              ]} />
            </Field>
            <Field label="Wymiar pracy w trakcie urlopu (ułamek etatu, max 0,5)">
              <NumberInput value={s.etat} onChange={set_("etat")} min="0.1" max="0.5" step="0.05" />
            </Field>
            <Field label="Podstawa wymiaru zasiłku (zł/mies.)">
              <NumberInput value={s.podstawa} onChange={set_("podstawa")} min="0" step="0.01" />
            </Field>
            <Field label="Stawka zasiłku">
              <Select value={s.stawka} onChange={set_("stawka")} options={[
                { value: "81.5", label: "81,5% (wniosek do 21 dni)" },
                { value: "70", label: "70% (wariant zmienny)" },
              ]} />
            </Field>
            <div className="field field-wide">
              <Check checked={s.zaZyciem} onChange={set_("zaZyciem")}>Zaświadczenie „Za życiem”</Check>
            </div>
          </Section>
        </div>

        <div className="calc-results">
          <ResultTable
            cols={[{ label: "Podsumowanie" }, { label: "", align: "right" }]}
            rows={[
              { cells: ["Bazowy urlop", tyg(W)] },
              { cells: ["Wydłużenie", tyg(wydlKwoty)] },
              { cells: ["Urlop po wydłużeniu", tyg(Wext)], total: true },
              { cells: ["Zasiłek dziennie (z pracą)", zl(dzienPomn)] },
            ]}
          />
        </div>
      </div>

      <div className="result-stack">
        {przekroczonyEtat && (
          <p className="alert-inline">
            <Badge tone="err">BŁĄD</Badge> Praca w trakcie urlopu rodzicielskiego możliwa max w połowie wymiaru czasu pracy.
          </p>
        )}
        {uderzonoWLimit && (
          <p className="alert-inline">
            <Badge tone="warn">LIMIT</Badge> Wydłużenie przekracza limit {cap} tygodni – urlop skrócony do limitu.
          </p>
        )}

        <section className="result-card">
          <h3 className="result-title">1. Wymiar urlopu</h3>
          <ResultTable
            cols={[{ label: "Pozycja" }, { label: "", align: "right" }]}
            rows={[
              { cells: ["Bazowy urlop rodzicielski", tyg(W)] },
              { cells: ["Wydłużenie (urlop ÷ (1 − wymiar pracy) − urlop)", tyg(wydlKwoty)] },
              { cells: [`Urlop po wydłużeniu (limit ${cap} tyg.)`, tyg(Wext)], total: true },
            ]}
          />
          <Bullets items={[
            <>Wniosek o łączenie ≥ {CFG.ochronaWkladDni.rodzicielski} dni przed rozpoczęciem (RWN § 16). Rezygnacja w każdym czasie za zgodą pracodawcy.</>,
            <>Zasiłek za okres łączenia podlega składkom emerytalnemu i rentowemu ze stosunku pracy i z zasiłku (finansuje budżet państwa).</>,
          ]} />
        </section>

        <section className="result-card">
          <h3 className="result-title">2. Zasiłek macierzyński w okresie łączenia</h3>
          <ResultTable
            cols={[{ label: "Pozycja" }, { label: "", align: "right" }]}
            rows={[
              { cells: ["Zasiłek dzienny bez pracy", zl(dzienPelny)] },
              { cells: [`Zasiłek dziennie przy pracy ${Math.round(f * 100)}% etatu (pomniejszony proporcjonalnie)`, zl(dzienPomn)] },
              { cells: ["Ekwiwalent miesięczny (×30)", zl(r.miesiecznie)] },
              { cells: ["Wynagrodzenie z pracy (pensja brutto × etat)", zl(r.wynagrodzenieZPracy) + " brutto"] },
              { cells: ["Suma zasiłku za cały wydłużony urlop", zl(r.sumaZasilku)], total: true },
            ]}
          />
          <p className="note">
            Istota: <b>{tyg(Wext)}</b> zasiłku po {zl(dzienPomn)}/dzień. Wydłużenie obejmuje wyłącznie
            część urlopu, w trakcie której pracujesz; po jej zakończeniu dalsza część w pełnej wysokości
            zasiłku. Formuła przy dalszym łączeniu: część wydłużoną ÷ (1 − wymiar pracy) (KP art. 182¹f § 7).
          </p>
        </section>
      </div>
    </div>
  );
}
