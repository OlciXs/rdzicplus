import { useState } from "react";
import { CFG, num, zl, tyg, fmtD } from "./config.js";
import { zasilekMacierzynski } from "../engine/index.js";
import {
  Badge, Field, NumberInput, DateInput, Select, Check, Section,
  ResultTable, Bullets, ProfilInfo } from "./ui.jsx";
import { useProfileDefaults, opisPodstawienia } from "./useProfileDefaults.js";

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
  const profilDane = useProfileDefaults(set, "macierzynski");

  const n = num(s.dzieci);
  const porod = s.porod ? new Date(s.porod) : null;
  const zaZ = s.zaZyciem;
  const wz81 = s.wniosek81;
  const pM = num(s.podstM);
  const tydz = num(s.tydzCiazy);
  const masa = num(s.masa);
  const hosp = num(s.hosp);

  // Wszystkie obliczenia: src/engine/macierzynski.js
  const r = zasilekMacierzynski({
    dzieci: n,
    porod: s.porod,
    przedPorodem: num(s.przedPorodem),
    zaZyciem: zaZ,
    sytuacja: s.szczegol,
    dataZgonu: s.zgon,
    wniosek815: wz81,
    podstawaMatki: pM,
    podstawaOjca: num(s.podstO),
    tygodnieDlaOjca: num(s.dlaOjca),
    ojcowski: s.ojcowski,
    tydzienCiazy: tydz,
    masa,
    dniHospitalizacji: hosp,
  }, CFG);
  const { tygMac, przed, stMac, dlaOjca, dlaOjcaWpisane, maxDlaOjca, bladOjca, tygUzup, limitUzup } = r;
  const pool = r.pulaRodzicielska;
  const mT = r.sumaMatka;

  /* ---------- opis wymiaru macierzyńskiego ---------- */
  let blokMac;
  if (s.szczegol === "brak") {
    blokMac = (
      <Bullets items={[
        <>Wymiar: <b>{tygMac} tygodni</b> ({n} {n === 1 ? "dziecko" : "dzieci"}), z tego przed porodem max {CFG.przedPorodemMax} tyg.</>,
        <>Przed porodem: <b>{przed} tyg.</b> (wymaga zaświadczenia o przewidywanej dacie porodu; wniosek ≥ 14 dni przed – RWN § 2), po porodzie: <b>{tygMac - przed} tyg.</b></>,
        <>Minimum matki po porodzie: <b>{CFG.wylaczneMacierzynskieMatki} tyg.</b> (pierwsze 14 tygodni matka wykorzystuje osobiście).</>,
      ]} />
    );
  } else if (s.szczegol === "martwe") {
    const { koniec, dni } = r.martwe;
    blokMac = (
      <p>
        <Badge tone="warn">Sytuacja szczególna</Badge> Zasiłek macierzyński za <b>8 tygodni po porodzie</b>,
        nie krócej niż <b>7 dni od dnia zgonu</b>.
        {porod && <span> Od {fmtD(porod)} do {fmtD(koniec)} (~{dni} dni).</span>} Przy urodzeniu więcej
        niż jednego dziecka – wymiar wg liczby dzieci pozostałych przy życiu. Dokumenty: odpis skrócony
        aktu urodzenia z adnotacją o martwym urodzeniu albo zaświadczenie o martwym urodzeniu.
        Przysługuje też zasiłek pogrzebowy {zl(7000)} (wniosek Z-12 w ciągu 12 mies. od dnia zgonu).
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

  /* ---------- tabela kwot (wiersze z silnika) ---------- */
  const rows = r.wiersze.map((w) =>
    w.id === "rodzicielski"
      ? { cells: [w.opis, w.kto, w.dni, wz81 ? "81,5% (9 tyg. wyłącznych: 70%)" : `${w.stawka}%`, "podział – kalk. d"] }
      : { cells: [w.opis, w.kto, w.dni, `${w.stawka}%`, zl(w.kwota)] }
  );
  rows.push({ cells: ["Łącznie matka", "", "", "", zl(r.sumaMatka)], total: true });
  rows.push({ cells: ["Łącznie ojciec", "", "", "", zl(r.sumaOjciec)], total: true });

  return (
    <div className="calc">
      <ProfilInfo
        zalogowany={!!profilDane.profile}
        pola={opisPodstawienia(profilDane.podstawione ?? [], s, profilDane.kalkulator)}
      />
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
              { cells: [`Zasiłek dzienny – matka (${stMac}%)`, zl(r.dziennyMatka)] },
              { cells: ["Łącznie matka", zl(mT)], total: true },
            ]}
          />
        </div>
      </div>

      <div className="result-stack">
        {r.brakPodstawy && (
          <section className="result-card warning">
            <h3 className="result-title">Brak podstawy wymiaru</h3>
            <p>
              Nie podano podstawy wymiaru zasiłku (0 zł). Kwoty nie są liczone – sprawdź, czy
              w dniu porodu podlegałaś ubezpieczeniu chorobowemu. Bez ubezpieczenia zasiłek
              macierzyński nie przysługuje (rozważ świadczenie rodzicielskie w gminie).
            </p>
          </section>
        )}
        <section className="result-card">
          <h3 className="result-title">1. Urlop macierzyński</h3>
          {blokMac}
        </section>

        {s.szczegol === "brak" && dlaOjcaWpisane > 0 && (
          <section className="result-card">
            <h3 className="result-title">Podział z ojcem</h3>
            {bladOjca ? (
              <p>
                <Badge tone="err">BŁĄD</Badge> Wpisano {dlaOjcaWpisane} tyg., a ojciec może przejąć max {maxDlaOjca} tyg.
                (matka musi wykorzystać {CFG.wylaczneMacierzynskieMatki} tyg. po porodzie) – w kwotach liczymy {dlaOjca} tyg. Wniosek matki
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
              <>Limit: {limitUzup} tyg. ({limitUzup === CFG.uzupełniajacyLimitWczesny ? "poród przed 28 tyg. ciąży lub masa ≤ 1000 g" : "inny przypadek"}). Hospitalizacja {hosp} dni → <b>{tygUzup} tyg.</b> urlopu (1 tydzień za tydzień szpitala, niepełny tydzień w górę).</>,
              <>Wniosek ≥ {CFG.ochronaWkladDni.uzupelniajacy} dni przed końcem urlopu macierzyńskiego (RWN § 14); udzielany jednorazowo, bezpośrednio po macierzyńskim.</>,
            ]} />
          </section>
        )}

        <section className="result-card">
          <h3 className="result-title">{tygUzup ? "3" : "2"}. Urlop rodzicielski – wspólna pula</h3>
          {s.szczegol === "brak" ? (
            <Bullets items={[
              <>Pula: <b>{pool} tygodni</b>{zaZ ? " („Za życiem”)" : ""}, po <b>{CFG.wylaczneRodzicielskie} tyg. wyłącznych</b> na każdego rodzica (tej części nie można przenieść; zasiłek za nią zawsze {CFG.stRodzicielski}%).</>,
              <>Do wykorzystania: jednorazowo lub max <b>{CFG.maxCzesci} części</b>; do końca roku kalendarzowego, w którym dziecko kończy <b>{CFG.limitRokZycia} lat</b>.{r.rodzicielskiDoRoku ? ` Do: 31.12.${r.rodzicielskiDoRoku}.` : ""}</>,
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
            <>Od złożenia każdego wniosku urlopowego w terminie biegnie ochrona zatrudnienia (KP art. 177 § 1¹).</>,
          ]} />
        </section>
      </div>
    </div>
  );
}
