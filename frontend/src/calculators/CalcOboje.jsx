import { useState } from "react";
import { CFG, num, zl, zasilek, tygodnieRodz } from "./config.js";
import {
  Badge, Field, NumberInput, DateInput, Select, Check, Section,
  ResultTable, Bullets, List,
} from "./ui.jsx";
import { useProfileDefaults } from "./useProfileDefaults.js";

export default function CalcOboje() {
  const [s, set] = useState({
    dzieci: "1",
    zaZyciem: false,
    ur: "2026-09-01",
    tM: "23",
    cM: "1",
    tO: "18",
    cO: "1",
    macM: "20",
    wniosek81: true,
    pM: "5000",
    pO: "5500",
  });
  const set_ = (k) => (v) => set((p) => ({ ...p, [k]: v }));
  useProfileDefaults(set, "oboje");

  const n = num(s.dzieci) >= 2 ? 2 : 1;
  const zaZ = s.zaZyciem;
  const wz81 = s.wniosek81;
  const pool = tygodnieRodz(n, zaZ, false);
  const tM = num(s.tM);
  const tO = num(s.tO);
  const cM = num(s.cM);
  const cO = num(s.cO);
  const pM = num(s.pM);
  const pO = num(s.pO);
  const ur = s.ur ? new Date(s.ur) : null;
  const stRodz = wz81 ? CFG.stSredniowany : CFG.stRodzicielski;

  const err = [];
  const warn = [];
  // Niewykorzystanie wyłącznych 9 tygodni jest dozwolone – to strata, nie błąd planu.
  if (tM < CFG.wyliczneRodzicielskie)
    warn.push(`Matka ma mniej niż ${CFG.wyliczneRodzicielskie} tygodni – traci ${CFG.wyliczneRodzicielskie - Math.max(0, tM)} tyg. wyłącznych (nieprzenoszalne na ojca).`);
  if (tO < CFG.wyliczneRodzicielskie)
    warn.push(`Ojciec ma mniej niż ${CFG.wyliczneRodzicielskie} tygodni – traci ${CFG.wyliczneRodzicielskie - Math.max(0, tO)} tyg. wyłącznych (nieprzenoszalne na matkę).`);
  if (tM + tO > pool)
    err.push(`Łącznie ${tM + tO} tyg. przekracza pulę ${pool} tyg. – do zwymiarowania na nowo.`);
  if (cM > CFG.maxCzesci || cO > CFG.maxCzesci)
    err.push(`Urlop rodzicielski można dzielić na maksymalnie ${CFG.maxCzesci} części (liczba części = liczba wniosków).`);
  if (ur) warn.push(`Do wykorzystania do 31.12.${ur.getFullYear() + CFG.limitRokZycia} (koniec roku kalendarzowego, w którym dziecko kończy ${CFG.limitRokZycia} lat).`);

  // Wariant 81,5%: 9 tygodni zarezerwowanych dla drugiego rodzica (ojca) jest zawsze
  // płatne 70% (UZ art. 31 ust. 3f); reszta jego tygodni pochodzi z puli matki (81,5%).
  const tOWyl = wz81 ? Math.min(Math.max(0, tO), CFG.wyliczneRodzicielskie) : 0;
  const kM = zasilek(pM, stRodz, tM * 7);
  const kO = zasilek(pO, CFG.stRodzicielski, tOWyl * 7) + zasilek(pO, stRodz, (tO - tOWyl) * 7);

  return (
    <div className="calc">
      <div className="calc-cols">
        <div>
          <Section title="Dziecko">
            <Field label="Liczba dzieci">
              <Select value={s.dzieci} onChange={set_("dzieci")} options={[
                { value: "1", label: "1" }, { value: "2", label: "2+" },
              ]} />
            </Field>
            <Field label="Data urodzenia dziecka">
              <DateInput value={s.ur} onChange={set_("ur")} />
            </Field>
            <div className="field field-wide">
              <Check checked={s.zaZyciem} onChange={set_("zaZyciem")}>„Za życiem”</Check>
            </div>
          </Section>

          <Section
            title="Plan rodzicielskiego – tygodnie"
            note="Urlop macierzyński liczony w kalkulatorze „Zasiłek macierzyński”; tu sprawdzamy plan urlopu rodzicielskiego."
          >
            <Field label="Matka: tyg. urlopu rodzicielskiego łącznie">
              <NumberInput value={s.tM} onChange={set_("tM")} min="0" />
            </Field>
            <Field label="Matka: liczba części (wniosków)">
              <NumberInput value={s.cM} onChange={set_("cM")} min="0" max="5" />
            </Field>
            <Field label="Ojciec: tyg. urlopu rodzicielskiego łącznie">
              <NumberInput value={s.tO} onChange={set_("tO")} min="0" />
            </Field>
            <Field label="Ojciec: liczba części (wniosków)">
              <NumberInput value={s.cO} onChange={set_("cO")} min="0" max="5" />
            </Field>
          </Section>

          <Section title="Stawki i podstawy">
            <div className="field field-wide">
              <Check checked={s.wniosek81} onChange={set_("wniosek81")}>
                Wniosek o pełny wymiar ≤ 21 dni po porodzie (81,5%)
              </Check>
            </div>
            <Field label="Podstawa wymiaru – matka (zł/mies.)">
              <NumberInput value={s.pM} onChange={set_("pM")} min="0" step="0.01" />
            </Field>
            <Field label="Podstawa wymiaru – ojciec (zł/mies.)">
              <NumberInput value={s.pO} onChange={set_("pO")} min="0" step="0.01" />
            </Field>
          </Section>
        </div>

        <div className="calc-results">
          <ResultTable
            cols={[{ label: "Podsumowanie" }, { label: "", align: "right" }]}
            rows={[
              { cells: ["Pula rodzicielska", `${pool} tyg.`] },
              { cells: ["Wykorzystano", `${tM + tO} tyg.`] },
              { cells: ["Pozostało", `${Math.max(0, pool - tM - tO)} tyg.`] },
              { cells: ["Kwota matka", zl(kM)] },
              { cells: ["Kwota ojciec", zl(kO)] },
              { cells: ["Razem", zl(kM + kO)], total: true },
            ]}
          />
        </div>
      </div>

      <div className="result-stack">
        <section className="result-card">
          <h3 className="result-title">1. Walidacja planu</h3>
          <p>
            <Badge tone={err.length ? "err" : "ok"}>{err.length ? "BŁĘDY" : "PLAN POPRAWNY"}</Badge>{" "}
            <Badge tone="warn">PULA: {pool} TYG.</Badge>
          </p>
          <Bullets items={[
            <>Pula wspólna: <b>{pool} tyg.</b>{zaZ ? " („Za życiem”)" : ""}; wyłącznej części (po {CFG.wyliczneRodzicielskie} tyg. na rodzica) nie przenosi się na drugiego rodzica.</>,
            <>Matka: {tM} tyg. w {cM} {cM === 1 ? "części" : "częściach"}; ojciec: {tO} tyg. w {cO} {cO === 1 ? "części" : "częściach"}; suma: {tM + tO} / {pool} tyg.</>,
          ]} />
          <List items={err} tone="err" />
          <List items={warn} tone="warn" />
        </section>

        <section className="result-card">
          <h3 className="result-title">2. Pieniądze – urlop rodzicielski</h3>
          <ResultTable
            cols={[
              { label: "Rodzic" }, { label: "Tyg.", align: "right" },
              { label: "Stawka", align: "right" }, { label: "Kwota", align: "right" },
            ]}
            rows={[
              { cells: ["Matka", tM, `${stRodz}%`, zl(kM)] },
              { cells: ["Ojciec", tO, wz81 ? `70% (${tOWyl} tyg.) / ${stRodz}%` : `${stRodz}%`, zl(kO)] },
              { cells: ["Łącznie (rodzicielski)", tM + tO, "", zl(kM + kO)], total: true },
            ]}
          />
          <p className="note">
            {wz81
              ? "W wariancie 81,5% matka ma 81,5% za macierzyński i rodzicielski; 9 tygodni zarezerwowanych dla ojca jest płatne 70%, a jego dalsze tygodnie (przejęte z puli matki) 81,5%."
              : "W wariancie zmiennym: 100% za macierzyński, 70% za rodzicielski."}{" "}
            Stawka 9 tygodni zarezerwowanych dla ojca, niezależnie od wariantu: {CFG.stRodzicielski}% (UZ art. 31 ust. 3f).
          </p>
        </section>

        <section className="result-card">
          <h3 className="result-title">3. Reguły podziału</h3>
          <Bullets items={[
            <>Rodzice mogą korzystać z urlopu rodzicielskiego jednocześnie lub naprzemiennie (łącznie max {pool} tyg.).</>,
            <>Każdy wniosek o część urlopu: ≥ {CFG.ochronaWkladDni.rodzicielski} dni przed rozpoczęciem (pracodawca musi uwzględnić).</>,
            <>Pierwsza część zaraz po urlopie macierzyńskim (lub uzupełniającym); dalsze w dowolnym momencie do terminu.</>,
            <>Rezygnacja z rodzicielskiego w każdym czasie za zgodą pracodawcy (wniosek ≥ {CFG.ochronaWkladDni.rodzicielski} dni przed, KP art. 182¹d § 3).</>,
          ]} />
        </section>
      </div>
    </div>
  );
}
