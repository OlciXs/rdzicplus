import { useState } from "react";
import { CFG, num, zl, zasilek, tyg, fmtD, addDays, tygodnieMac, tygodnieRodz } from "./config.js";
import {
  Badge, Field, NumberInput, DateInput, Select, Check, Section,
  ResultTable, Bullets,
} from "./ui.jsx";

export default function CalcMacierzynski() {
  const [s, set] = useState({
    dzieci: "1",
    porod: "2026-09-01",
    przedPorodem: "0",
    zaZyciem: false,
    szczegol: "brak",
    zgon: "",
    wniosek81: false,
    podstM: "5000",
    podstO: "5500",
    dlaOjca: "0",
    ojcowski: true,
    tydzCiazy: "37",
    masa: "2900",
    hosp: "0",
  });
  const set_ = (k) => (v) => set((p) => ({ ...p, [k]: v }));

  const n = num(s.dzieci);
  const porod = s.porod ? new Date(s.porod) : null;
  const przed = Math.min(num(s.przedPorodem), CFG.przedPorodemMax);
  const zaZ = s.zaZyciem;
  const wz81 = s.wniosek81;
  const pM = num(s.podstM);
  const pO = num(s.podstO);
  const ojc = s.ojcowski;

  const stMac = wz81 ? CFG.stSredniowany : CFG.stMacierzynski;
  const stRodz = wz81 ? CFG.stSredniowany : CFG.stRodzicielski;

  /* ---------- wymiar macierzyńskiego ---------- */
  let tygMac = tygodnieMac(n);
  let blokMac;
  if (s.szczegol === "brak") {
    blokMac = (
      <Bullets items={[
        <>Wymiar: <b>{tygMac} tygodni</b> ({n} {n === 1 ? "dziecko" : "dzieci"}), z tego przed porodem max {CFG.przedPorodemMax} tyg.</>,
        <>Przed porodem: <b>{przed} tyg.</b> (wymaga zaświadczenia o przewidywanej dacie porodu; wniosek ≥ 14 dni przed — RWN § 2), po porodzie: <b>{tygMac - przed} tyg.</b></>,
        <>Minimum matki po porodzie: <b>{CFG.wyliczneMacierzynskieMatki} tyg.</b> (pierwsze 14 tygodni matka wykorzystuje osobiście).</>,
      ]} />
    );
  } else if (s.szczegol === "martwe") {
    // Ostatni dzień: 8 tygodni = 56 dni licząc dzień porodu; „nie krócej niż 7 dni od zgonu” = dzień zgonu + 6.
    let koniec = porod ? addDays(porod, CFG.martweUrodzenieTygodnie * 7 - 1) : null;
    if (s.zgon) koniec = new Date(Math.max(koniec ?? 0, addDays(new Date(s.zgon), CFG.zgonPo8TygDni - 1)));
    const dni = porod && koniec ? Math.round((koniec - porod) / 86400000) + 1 : 0;
    tygMac = dni / 7;
    blokMac = (
      <p>
        <Badge tone="warn">Sytuacja szczególna</Badge> Zasiłek macierzyński za <b>8 tygodni po porodzie</b>,
        nie krócej niż <b>7 dni od dnia zgonu</b>.
        {porod && <span> Od {fmtD(porod)} do {fmtD(koniec)} (~{dni} dni).</span>} Przy urodzeniu więcej
        niż jednego dziecka – wymiar wg liczby dzieci pozostałych przy życiu. Dokumenty: odpis skrócony
        aktu urodzenia z adnotacją o martwym urodzeniu albo zaświadczenie o martwym urodzeniu.
        Przysługuje też zasiłek pogrzebowy {zl(7000)} (wniosek Z-12, 12 mies. od pochówku).
      </p>
    );
  } else {
    blokMac = (
      <p>
        <Badge tone="warn">Sytuacja szczególna</Badge> Zgon dziecka po 8 tygodniach życia: zasiłek
        macierzyński jeszcze przez <b>7 dni od dnia zgonu</b>
        {s.zgon ? ` (od ${fmtD(new Date(s.zgon))})` : ""}; wymiar stosowny do liczby dzieci pozostałych
        przy życiu.
      </p>
    );
  }

  /* ---------- podział na rodziców ---------- */
  const dlaOjca = Math.max(0, num(s.dlaOjca));
  const maxDlaOjca = tygMac - przed - CFG.wyliczneMacierzynskieMatki;
  const bladOjca = s.szczegol === "brak" && dlaOjca > maxDlaOjca;

  /* ---------- uzupełniający ---------- */
  const tydz = num(s.tydzCiazy);
  const masa = num(s.masa);
  const hosp = num(s.hosp);
  let tygUzup = 0;
  let limitUzup = 0;
  if (s.szczegol === "brak" && hosp > 0) {
    limitUzup = tydz > 0 && (tydz < 28 || (masa > 0 && masa <= 1000))
      ? CFG.uzupełniajacyLimitWczesny
      : CFG.uzupełniajacyLimitPozny;
    tygUzup = Math.min(limitUzup, Math.ceil(hosp / 7));
  }

  /* ---------- rodzicielski ---------- */
  const pool = tygodnieRodz(n, zaZ, false);

  /* ---------- kwoty ---------- */
  const rows = [];
  let mT = 0;
  let oT = 0;
  if (s.szczegol === "brak") {
    if (przed > 0) {
      const k = zasilek(pM, stMac, przed * 7);
      mT += k;
      rows.push({ cells: ["Urlop macierzyński przed porodem", "matka", przed * 7, `${stMac}%`, zl(k)] });
    }
    const k2 = zasilek(pM, stMac, (tygMac - przed - dlaOjca) * 7);
    mT += k2;
    rows.push({
      cells: ["Urlop macierzyński po porodzie", "matka", Math.round((tygMac - przed - dlaOjca) * 7), `${stMac}%`, zl(k2)],
    });
    if (dlaOjca > 0) {
      const k3 = zasilek(pO, stMac, dlaOjca * 7);
      oT += k3;
      rows.push({ cells: ["Część urlopu macierzyńskiego przejęta", "ojciec", dlaOjca * 7, `${stMac}%`, zl(k3)] });
    }
    if (tygUzup > 0) {
      const k4 = zasilek(pM, CFG.stMacierzynski, tygUzup * 7);
      mT += k4;
      rows.push({ cells: ["Uzupełniający urlop macierzyński", "matka", tygUzup * 7, "100%", zl(k4)] });
    }
    rows.push({
      cells: ["Urlop rodzicielski (pula – podział w kalkulatorze „Oboje rodzice”)", "oboje", pool * 7, wz81 ? "81,5% (9 tyg. wyłącznych: 70%)" : "70%", "podział – kalk. d"],
    });
  } else if (s.szczegol === "martwe") {
    const k = zasilek(pM, CFG.stMacierzynski, Math.round(tygMac * 7));
    mT += k;
    rows.push({ cells: ["Zasiłek macierzyński po urodzeniu martwego dziecka", "matka", Math.round(tygMac * 7), "100%", zl(k)] });
  } else {
    const k = zasilek(pM, CFG.stMacierzynski, CFG.zgonPo8TygDni);
    mT += k;
    rows.push({ cells: ["Zasiłek macierzyński po zgonie dziecka (po 8 tyg.)", "matka", CFG.zgonPo8TygDni, "100%", zl(k)] });
  }
  if (ojc && s.szczegol === "brak") {
    const k = zasilek(pO, CFG.stMacierzynski, CFG.tygodnieOjcowski * 7);
    oT += k;
    rows.push({ cells: ["Urlop ojcowski", "ojciec", CFG.tygodnieOjcowski * 7, "100%", zl(k)] });
  }
  rows.push({ cells: ["Łącznie matka", "", "", "", zl(mT)], total: true });
  rows.push({ cells: ["Łącznie ojciec", "", "", "", zl(oT)], total: true });

  return (
    <div className="calc">
      <div className="calc-cols">
        <div>
          <Section title="Dziecko i poród">
            <Field label="Liczba dzieci przy jednym porodzie">
              <Select value={s.dzieci} onChange={set_("dzieci")} options={[
                { value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3", label: "3" },
                { value: "4", label: "4" }, { value: "5", label: "5+" },
              ]} />
            </Field>
            <Field label="Data porodu">
              <DateInput value={s.porod} onChange={set_("porod")} />
            </Field>
            <Field label="Urlop macierzyński przed porodem (tygodni, 0–6)">
              <NumberInput value={s.przedPorodem} onChange={set_("przedPorodem")} min="0" max="6" />
            </Field>
            <Field label="Sytuacja szczególna">
              <Select value={s.szczegol} onChange={set_("szczegol")} options={[
                { value: "brak", label: "brak" },
                { value: "martwe", label: "urodzenie martwego dziecka / zgon przed 8 tyg." },
                { value: "zgonPo", label: "zgon dziecka po 8 tyg. życia" },
              ]} />
            </Field>
            <div className="field field-wide">
              <Check checked={s.zaZyciem} onChange={set_("zaZyciem")}>Dziecko ma zaświadczenie „Za życiem”</Check>
            </div>
            <Field label="Data zgonu dziecka (dla sytuacji szczególnej)">
              <DateInput value={s.zgon} onChange={set_("zgon")} />
            </Field>
          </Section>

          <Section title="Kwoty i wariant">
            <div className="field field-wide">
              <Check checked={s.wniosek81} onChange={set_("wniosek81")}>
                Wniosek o macierzyński + rodzicielski w pełnym wymiarze złożony ≤ 21 dni po porodzie (81,5%)
              </Check>
            </div>
            <Field label="Podstawa wymiaru – matka (zł/mies.)">
              <NumberInput value={s.podstM} onChange={set_("podstM")} min="0" step="0.01" />
            </Field>
            <Field label="Podstawa wymiaru – ojciec (zł/mies.)">
              <NumberInput value={s.podstO} onChange={set_("podstO")} min="0" step="0.01" />
            </Field>
            <Field label="Przekazanie ojcu – tygodnie macierzyńskiego (po 14 tyg. matki)">
              <NumberInput value={s.dlaOjca} onChange={set_("dlaOjca")} min="0" />
            </Field>
            <div className="field field-wide">
              <Check checked={s.ojcowski} onChange={set_("ojcowski")}>Ojciec korzysta z urlopu ojcowskiego (2 tyg.)</Check>
            </div>
          </Section>

          <Section
            title="Wcześniak / hospitalizacja – uzupełniający urlop"
            note={`Urlop uzupełniający: 1 tydzień za każdy tydzień pobytu dziecka w szpitalu; niepełny tydzień zaokrągla się w górę; limity: 15 tyg. (poród < 28 tyg. ciąży lub masa ≤ 1000 g), 8 tyg. (inne przypadki). Przy więcej niż jednym dziecku liczy się najniższa masa i najdłuższa hospitalizacja (KP art. 180²).`}
          >
            <Field label="Tydzień ciąży przy porodzie">
              <NumberInput value={s.tydzCiazy} onChange={set_("tydzCiazy")} min="20" max="45" />
            </Field>
            <Field label="Masa urodzeniowa najmniejszego dziecka (g)">
              <NumberInput value={s.masa} onChange={set_("masa")} min="300" max="6000" />
            </Field>
            <Field label="Łączna liczba dni hospitalizacji dziecka">
              <NumberInput value={s.hosp} onChange={set_("hosp")} min="0" />
            </Field>
          </Section>
        </div>

        <div className="calc-results">
          <ResultTable
            cols={[{ label: "Podsumowanie" }, { label: "", align: "right" }]}
            rows={[
              { cells: ["Wymiar macierzyński", tyg(tygMac)] },
              { cells: ["Pula rodzicielska", tyg(pool)] },
              { cells: ["Uzupełniający", tyg(tygUzup)] },
              { cells: [`Zasiłek dzienny – matka (${stMac}%)`, zl((pM / 30) * stMac / 100)] },
              { cells: ["Łącznie matka", zl(mT)], total: true },
            ]}
          />
        </div>
      </div>

      <div className="result-stack">
        <section className="result-card">
          <h3 className="result-title">1. Urlop macierzyński</h3>
          {blokMac}
        </section>

        {s.szczegol === "brak" && dlaOjca > 0 && (
          <section className="result-card">
            <h3 className="result-title">Podział z ojcem</h3>
            {bladOjca ? (
              <p>
                <Badge tone="err">BŁĄD</Badge> Ojciec może przejąć max {Math.max(0, maxDlaOjca)} tyg.
                (matka musi wykorzystać {CFG.wyliczneMacierzynskieMatki} tyg. po porodzie). Wniosek matki
                ≥ 7 dni przed powrotem do pracy; wniosek ojca ≥ 14 dni przed rozpoczęciem.
              </p>
            ) : (
              <p className="note">
                Przejęcie przez ojca: {dlaOjca} tyg. urlopu macierzyńskiego bezpośrednio po zakończeniu
                części matki (wniosek matki ≥ 7 dni przed powrotem do pracy, KP art. 180 § 8; wniosek
                ojca ≥ 14 dni przed rozpoczęciem, § 9).
              </p>
            )}
          </section>
        )}

        {tygUzup > 0 && (
          <section className="result-card">
            <h3 className="result-title">2. Uzupełniający urlop macierzyński</h3>
            <Bullets items={[
              <>Limit: {limitUzup} tyg. ({tydz < 28 || masa <= 1000 ? "poród przed 28 tyg. ciąży lub masa ≤ 1000 g" : "inny przypadek"}). Hospitalizacja {hosp} dni → <b>{tygUzup} tyg.</b> urlopu (1 tydzień za tydzień szpitala, niepełny tydzień w górę).</>,
              <>Wniosek ≥ {CFG.ochronaWkladDni.uzupelniajacy} dni przed końcem urlopu macierzyńskiego (RWN § 14); udzielany jednorazowo, bezpośrednio po macierzyńskim.</>,
            ]} />
          </section>
        )}

        <section className="result-card">
          <h3 className="result-title">{tygUzup ? "3" : "2"}. Urlop rodzicielski – wspólna pula</h3>
          {s.szczegol === "brak" ? (
            <Bullets items={[
              <>Pula: <b>{pool} tygodni</b>{zaZ ? " („Za życiem”)" : ""}, po <b>{CFG.wyliczneRodzicielskie} tyg. wyłącznych</b> na każdego rodzica (tej części nie można przenieść; zasiłek za nią zawsze {CFG.stRodzicielski}%).</>,
              <>Do wykorzystania: jednorazowo lub max <b>{CFG.maxCzesci} części</b>; do końca roku kalendarzowego, w którym dziecko kończy <b>{CFG.limitRokZycia} lat</b>.{porod ? ` Do: 31.12.${porod.getFullYear() + CFG.limitRokZycia}.` : ""}</>,
              <>Wariant: {wz81 ? <>81,5% podstawy za macierzyński + rodzicielski (wniosek ≤ {CFG.deadlineSredniowany} dni po porodzie)</> : <>100% za macierzyński, 70% za rodzicielski</>}</>,
            ]} />
          ) : (
            <p className="note">Po zgonie dziecka urlop rodzicielski nie jest udzielany; zasiłek macierzyński zgodnie z sekcją 1.</p>
          )}
        </section>

        <section className="result-card">
          <h3 className="result-title">4. Kwoty</h3>
          <ResultTable
            cols={[
              { label: "Świadczenie" }, { label: "Kto" },
              { label: "Dni", align: "right" }, { label: "Stawka", align: "right" },
              { label: "Kwota", align: "right" },
            ]}
            rows={rows}
          />
          <p className="note">Zasiłek dzienny = podstawa / {CFG.dniMiesiaca}.</p>
        </section>

        <section className="result-card">
          <h3 className="result-title">5. Kluczowe terminy</h3>
          <Bullets items={[
            <>Macierzyński przed porodem: wniosek ≥ {CFG.ochronaWkladDni.macierzynski} dni przed; max {CFG.przedPorodemMax} tyg. przed przewidywaną datą porodu.</>,
            <>Wariant 81,5%: wniosek ≤ {CFG.deadlineSredniowany} dni po porodzie – po tym terminie bezpowrotnie 100%/70%.</>,
            <>Urlop ojcowski: do {CFG.deadlineOjcowskiMies}. miesiąca życia dziecka (wniosek ≥ {CFG.ochronaWkladDni.ojcowski} dni przed; 1 lub 2 części po min. 1 tydz.) – po terminie prawo wygasa.</>,
            <>Rezygnacja matki na rzecz ojca: wniosek ≥ 7 dni przed powrotem do pracy (po min. 14 tyg. po porodzie).</>,
            <>Uzupełniający: wniosek ≥ {CFG.ochronaWkladDni.uzupelniajacy} dni przed końcem macierzyńskiego.</>,
            <>Od złożenia każdego wniosku urlopowego w terminie biegnie ochrona zatrudnienia (KP art. 177 § 1).</>,
          ]} />
        </section>
      </div>
    </div>
  );
}
