import { useState } from "react";
import { CFG, num, zl } from "./config.js";
import { adopcja } from "../engine/index.js";
import {
  Badge, Field, NumberInput, DateInput, Select, Check, Section,
  ResultTable, Bullets,
} from "./ui.jsx";
import { useProfileDefaults } from "./useProfileDefaults.js";

export default function CalcAdopcja() {
  const [s, set] = useState({
    tryb: "przysposobienie",
    dzieci: "1",
    ur: "2024-03-01",
    przyj: "2026-11-01",
    odroczenie: false,
    zaZyciem: false,
    podstawa: "5000",
    wniosek81: true,
    ojcowski: false,
  });
  const set_ = (k) => (v) => set((p) => ({ ...p, [k]: v }));
  useProfileDefaults(set, "adopcja");

  const n = num(s.dzieci);
  const odroczenie = s.odroczenie;
  const zaZ = s.zaZyciem;

  // Wszystkie obliczenia: src/engine/adopcja.js
  const r = adopcja({
    tryb: s.tryb,
    dzieci: n,
    dataUrodzenia: s.ur,
    dataPrzyjecia: s.przyj,
    odroczenie,
    zaZyciem: zaZ,
    podstawa: num(s.podstawa),
    wniosek815: s.wniosek81,
    ojcowski: s.ojcowski,
  }, CFG);
  const { limitLat, wiek, brakPrawa, stMac, stRodz, razem } = r;
  const tygMacierzy = r.tygMacierzynski;
  const pool = r.pula;
  const tygRodzWlasne = r.tygRodzicielskiWlasne;
  const kMac = r.kwotaMacierzynski;
  const kRodz = r.kwotaRodzicielski;
  const kOjc = r.kwotaOjcowski;

  return (
    <div className="calc">
      <div className="calc-cols">
        <div>
          <Section title="Sytuacja">
            <Field label="Tryb" hint="Rodzina zastępcza zawodowa nie ma prawa do zasiłku macierzyńskiego (UZ art. 29 ust. 1 pkt 3).">
              <Select value={s.tryb} onChange={set_("tryb")} options={[
                { value: "przysposobienie", label: "Przyjęcie dziecka + wniosek do sądu o przysposobienie" },
                { value: "rodzinaZastepcza", label: "Przyjęcie w rodzinie zastępczej (poza zawodową)" },
              ]} />
            </Field>
            <Field label="Liczba dzieci przyjętych jednocześnie">
              <Select value={s.dzieci} onChange={set_("dzieci")} options={[
                { value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3", label: "3" },
                { value: "4", label: "4" }, { value: "5", label: "5+" },
              ]} />
            </Field>
            <Field label="Data urodzenia dziecka (najstarszego)">
              <DateInput value={s.ur} onChange={set_("ur")} />
            </Field>
            <Field label="Data przyjęcia dziecka na wychowanie">
              <DateInput value={s.przyj} onChange={set_("przyj")} />
            </Field>
            <div className="field field-wide">
              <Check checked={s.odroczenie} onChange={set_("odroczenie")}>Odroczenie obowiązku szkolnego (limit 7 → 10 lat)</Check>
            </div>
            <div className="field field-wide">
              <Check checked={s.zaZyciem} onChange={set_("zaZyciem")}>Dziecko ma zaświadczenie „Za życiem”</Check>
            </div>
          </Section>

          <Section title="Wysokość zasiłku">
            <Field label="Podstawa wymiaru zasiłku (zł/mies.)">
              <NumberInput value={s.podstawa} onChange={set_("podstawa")} min="0" step="0.01" />
            </Field>
            <div className="field field-wide">
              <Check checked={s.wniosek81} onChange={set_("wniosek81")}>
                Wniosek o macierzyński na warunkach + rodzicielski w pełnym wymiarze ≤ 21 dni od przyjęcia (81,5%)
              </Check>
            </div>
            <div className="field field-wide">
              <Check checked={s.ojcowski} onChange={set_("ojcowski")}>Ojciec korzysta z urlopu ojcowskiego (2 tyg.)</Check>
            </div>
          </Section>
        </div>

        <div className="calc-results">
          <ResultTable
            cols={[{ label: "Podsumowanie" }, { label: "", align: "right" }]}
            rows={[
              { cells: ["Limit wieku", `${limitLat} lat`] },
              { cells: ["Macierzyński", `${tygMacierzy} tyg.`] },
              { cells: ["Rodzicielski", `${pool} tyg.`] },
              { cells: ["Łącznie kwota", zl(razem)], total: true },
            ]}
          />
        </div>
      </div>

      <div className="result-stack">
        <section className="result-card">
          <h3 className="result-title">1. Prawo do zasiłku macierzyńskiego</h3>
          {wiek === null ? (
            <p className="note">Podaj daty, aby zweryfikować limit wieku.</p>
          ) : brakPrawa ? (
            <p>
              <Badge tone="err">BRAK PRAWA</Badge> Dziecko w chwili przyjęcia miało{" "}
              {wiek.toFixed(1).replace(".", ",")} lat – limit: {limitLat} lat (
              {s.tryb === "przysposobienie" ? "przysposobienie" : `rodzina zastępcza${odroczenie ? " z odroczeniem" : ""}`}
              ). Z zasiłku macierzyńskiego przysługują wyłącznie okresy rodzicielskiego, jeśli dziecko
              mieści się w limitach.
            </p>
          ) : (
            <p>
              <Badge>PRAWO</Badge> Wiek dziecka przy przyjęciu:{" "}
              {wiek.toFixed(1).replace(".", ",")} lat ≤ {limitLat} lat. Warunek: ubezpieczenie chorobowe w
              dniu przyjęcia (lub urlop wychowawczy; RZI § 16).
            </p>
          )}
          <Bullets items={[
            <>Prawo: ubezpieczony, który przyjął dziecko na wychowanie jako rodzina zastępcza <b>niezawodowa</b> (do {odroczenie ? 10 : 7} lat) albo przyjął i wystąpił do sądu o przysposobienie (do 14 lat) – przy jednoczesnym ubezpieczeniu chorobowym (UZ art. 29 ust. 1).</>,
          ]} />
        </section>

        <section className="result-card">
          <h3 className="result-title">2. Urlop na warunkach urlopu macierzyńskiego</h3>
          <Bullets items={[
            <>Wymiar: <b>{tygMacierzy} tygodni</b> (jak przy urodzeniu; {n} {n === 1 ? "dziecko" : "dzieci"}), nie mniej niż <b>{CFG.minimalneNaWarunkach} tyg.</b>.</>,
            <>Wniosek: w terminie <b>7 dni</b> od przyjęcia dziecka; urlop od dnia przyjęcia, nie później niż <b>21 dni</b> od przyjęcia (KP art. 183 § 6; RWN § 18).</>,
            <>Dokumenty: oświadczenie o dacie przyjęcia + kopia wniosku o przysposobienie z poświadczeniem sądu (lub zaświadczenie sądu z datą urodzenia) / orzeczenie o umieszczeniu w rodzinie zastępczej albo umowa ze starostą + dokument potwierdzający wiek dziecka (+ decyzja o odroczeniu obowiązku szkolnego).</>,
          ]} />
        </section>

        <section className="result-card">
          <h3 className="result-title">3. Urlop rodzicielski</h3>
          <Bullets items={[
            <>Wymiar: <b>{pool} tygodni</b>{zaZ ? " („Za życiem”)" : ""}; po {CFG.wylaczneRodzicielskie} tyg. wyłącznych na rodzica; max {CFG.maxCzesci} części{r.rodzicielskiDoRoku ? `; do 31.12.${r.rodzicielskiDoRoku}` : ""} (koniec roku kal., w którym dziecko kończy {CFG.limitRokZycia} lat).</>,
            <>Dokumenty: jak wyżej + oświadczenie drugiego rodzica; „Za życiem” – kopia zaświadczenia (RWN § 15 ust. 2 pkt 3).</>,
          ]} />
        </section>

        <section className="result-card">
          <h3 className="result-title">4. Kwoty</h3>
          <ResultTable
            cols={[{ label: "Świadczenie" }, { label: "", align: "right" }]}
            rows={[
              { cells: [`Na warunkach urlopu macierzyńskiego (${tygMacierzy} tyg., ${stMac}%)`, zl(kMac)] },
              { cells: [`Urlop rodzicielski – Twoja część (${tygRodzWlasne} z ${pool} tyg., ${stRodz}%; ${CFG.wylaczneRodzicielskie} tyg. zostaje dla drugiego rodzica)`, zl(kRodz)] },
              ...(s.ojcowski
                ? [{ cells: ["Urlop ojcowski (2 tyg., 100%)", zl(kOjc)] }]
                : []),
              { cells: ["Łącznie", zl(razem)], total: true },
            ]}
          />
          <p className="note">
            Zasiłek dzienny = podstawa / {CFG.dniMiesiaca}. Przy dzieciach powyżej limitu wieku – tylko
            okresy, do których istnieje prawo. Zasiłek macierzyński nie przysługuje za czas urlopu wychowawczego.
          </p>
        </section>
      </div>
    </div>
  );
}
