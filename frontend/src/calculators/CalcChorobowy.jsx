import { useState } from "react";
import { CFG, num, zl, fmtD } from "./config.js";
import { chorobowyWCiazy } from "../engine/index.js";
import {
  Badge, Field, NumberInput, DateInput, Select, Check, Section,
  ResultTable, Bullets, Result, ProfilInfo } from "./ui.jsx";
import { useProfileDefaults, opisPodstawienia } from "./useProfileDefaults.js";

export default function CalcChorobowy() {
  const [s, set] = useState({
    status: "obw",
    dniUb: "365",
    liczbaUbPlatnika: "30",
    ur: "1995-05-01",
    od: "2026-06-01",
    dniNz: "30",
    wykorzWynagr: "0",
    wykorzZasilk: "0",
    kodB: true,
    podstawa: "5000",
    zaleglosc: "0",
    utrata: "brak",
  });
  const set_ = (k) => (v) => set((p) => ({ ...p, [k]: v }));
  const profilDane = useProfileDefaults(set, "chorobowy");

  const dUb = num(s.dniUb);
  const kodB = s.kodB;
  const od = s.od ? new Date(s.od) : null;
  const dNz = num(s.dniNz);

  // Wszystkie obliczenia: src/engine/chorobowy.js
  const r = chorobowyWCiazy({
    status: s.status,
    dniUbezpieczenia: dUb,
    liczbaUbPlatnika: num(s.liczbaUbPlatnika),
    dataUrodzenia: s.ur,
    poczatek: s.od,
    dniNiezdolnosci: dNz,
    wykorzystaneWynagrodzenie: num(s.wykorzWynagr),
    wykorzystanyOkres: num(s.wykorzZasilk),
    kodB,
    podstawa: num(s.podstawa),
    zaleglosc: num(s.zaleglosc),
  }, CFG);
  const {
    maPrawo, zalegloscBlokada, wyplata, wiek50, okresMax, pozostaloPrzed,
    dniZasilku, kwotaZasilku, kwotaRazem,
  } = r;
  const potrzeba = r.wymaganyOkres;
  const platnikDuzy = r.platnik.duzyPlatnik;
  const poTymOkresie = r.pozostaloPo;
  const limitWyn = r.limitWynagrodzenia;
  const dniWynagr = r.dniWynagrodzenia;
  const stawka = r.stawkaZasilku;
  const stawkaWyn = r.stawkaWynagrodzenia;
  const dzienStawka = r.dziennaPodstawa;
  const kwotaWynagr = r.kwotaWynagrodzenia;

  /* ---- 6. utrata pracy ---- */
  const powodUtraty =
    s.utrata === "wyrok"
      ? "rozwiązanie umowy z naruszeniem prawa (prawomocne orzeczenie)"
      : s.utrata === "smierc"
        ? "wygaśnięcie stosunku pracy ze względu na śmierć pracodawcy"
        : "upadłość lub likwidacja pracodawcy";

  return (
    <div className="calc">
      <ProfilInfo
        zalogowany={!!profilDane.profile}
        pola={opisPodstawienia(profilDane.podstawione ?? [], s, profilDane.kalkulator)}
      />
      <div className="calc-cols">
        <div>
          <Section title="Ubezpieczenie i płatnik">
            <Field label="Status ubezpieczenia chorobowego">
              <Select value={s.status} onChange={set_("status")} options={[
                { value: "obw", label: "Obowiązkowe (umowa o pracę)" },
                { value: "dobr", label: "Dobrowolne (zlecenie, działalność, duchowny, marynarz)" },
              ]} />
            </Field>
            <Field label="Dni nieprzerwanego ubezpieczenia chorobowego">
              <NumberInput value={s.dniUb} onChange={set_("dniUb")} min="0" />
            </Field>
            <Field label="Liczba ubezpieczonych u płatnika (stan 30 XI)">
              <NumberInput value={s.liczbaUbPlatnika} onChange={set_("liczbaUbPlatnika")} min="0" />
            </Field>
            <Field label="Data urodzenia ubezpieczonej">
              <DateInput value={s.ur} onChange={set_("ur")} />
            </Field>
          </Section>

          <Section title="Niezdolność do pracy (e-ZLA)">
            <Field label="Początek niezdolności">
              <DateInput value={s.od} onChange={set_("od")} />
            </Field>
            <Field label="Liczba dni niezdolności">
              <NumberInput value={s.dniNz} onChange={set_("dniNz")} min="1" />
            </Field>
            <Field label="Wykorzystane dni wynagrodzenia chorobowego w tym roku">
              <NumberInput value={s.wykorzWynagr} onChange={set_("wykorzWynagr")} min="0" />
            </Field>
            <Field label="Wykorzystane dni okresu zasiłkowego" hint="Przerwy ≤ 60 dni sumują okresy.">
              <NumberInput value={s.wykorzZasilk} onChange={set_("wykorzZasilk")} min="0" />
            </Field>
            <div className="field field-wide">
              <Check checked={s.kodB} onChange={set_("kodB")}>
                Kod „B” (ciąża) na zaświadczeniu
              </Check>
              <span className="field-hint">
                Na pisemny wniosek ubezpieczonej kodu „B” można nie umieścić (art. 57 ust. 2 UZ) – wtedy standardowe zasady.
              </span>
            </div>
          </Section>

          <Section title="Podstawa wymiaru i sytuacja zatrudnienia">
            <Field label="Miesięczna podstawa wymiaru zasiłku" hint="Po 13,71% – możesz policzyć w kalkulatorze „Podstawa wymiaru”.">
              <NumberInput value={s.podstawa} onChange={set_("podstawa")} min="0" step="0.01" />
            </Field>
            <Field label="Zaległość składkowa (zł)" hint="Dotyczy działalności / zlecenia.">
              <NumberInput value={s.zaleglosc} onChange={set_("zaleglosc")} min="0" step="0.01" />
            </Field>
            <Field label="Ustanie umowy w ciąży – przyczyna" hint="Jeśli ubezpieczenie ustało przed niezdolnością – patrz wynik.">
              <Select value={s.utrata} onChange={set_("utrata")} options={[
                { value: "brak", label: "nie dotyczy" },
                { value: "upadlosc", label: "upadłość lub likwidacja pracodawcy" },
                { value: "smierc", label: "śmierć pracodawcy" },
                { value: "wyrok", label: "rozwiązanie z naruszeniem prawa (prawomocny wyrok)" },
              ]} />
            </Field>
          </Section>
        </div>

        <div className="calc-results">
          <ResultTable
            cols={[{ label: "Podsumowanie" }, { label: "", align: "right" }]}
            rows={[
              { cells: ["Zasiłek dzienny", zl(dzienStawka * stawka / 100)] },
              { cells: ["Dni wynagrodzenia chorobowego", dniWynagr] },
              { cells: ["Dni zasiłku chorobowego", Math.max(0, dniZasilku)] },
              { cells: ["Razem za niezdolność", zl(kwotaRazem)], total: true },
            ]}
          />
        </div>
      </div>

      {/* ---------- WYNIKI ---------- */}
      <div className="result-stack">
        <section className="result-card">
          <h3 className="result-title">1. Prawo do zasiłku chorobowego</h3>
          {maPrawo ? (
            <p><Badge>PRAWO</Badge> Ubezpieczenie trwa {Math.round(dUb)} dni – wymóg {potrzeba} dni spełniony (art. 4 ust. 1 UZ).</p>
          ) : (
            <p>
              <Badge tone="err">BRAK PRAWA</Badge>{" "}
              Do zasiłku potrzeba {potrzeba} dni nieprzerwanego ubezpieczenia
              {s.status === "obw" ? " (obowiązkowe)" : " (dobrowolne)"}; brakuje{" "}
              {Math.ceil(potrzeba - dUb)} dni. Zalicza się wcześniejsze okresy, jeśli przerwa ≤ 30 dni (art. 4 ust. 2).
            </p>
          )}
          {zalegloscBlokada && (
            <p><Badge tone="err">BLOKADA</Badge> Zaległość {zl(num(s.zaleglosc))} przekracza {zl(CFG.progZaleglosci)} (1% minimalnego wynagrodzenia) – zasiłek nie przysługuje do czasu spłaty (art. 2a UZ).</p>
          )}
        </section>

        <section className="result-card">
          <h3 className="result-title">2. Kto wypłaca – wynagrodzenie chorobowe vs zasiłek</h3>
          {s.status === "obw" ? (
            <Bullets items={[
              <>Wynagrodzenie chorobowe (pracodawca, z własnych środków): <b>{dniWynagr} dni</b> – limit {limitWyn} dni w roku ({wiek50 ? "po 50 r.ż." : "pracownik do 50 r.ż."}), wykorzystane wcześniej: {num(s.wykorzWynagr)}.</>,
              <>Zasiłek chorobowy za pozostałe <b>{dniZasilku} dni</b> wypłaca: {platnikDuzy ? `płatnik składek (zgłasza > ${CFG.progPlatnika} ubezpieczonych)` : `ZUS (płatnik zgłasza ≤ ${CFG.progPlatnika} ubezpieczonych – przekazuje dokumenty w 7 dni)`}.</>,
              <>Wynagrodzenie chorobowe w ciąży wynosi 100% (KP art. 92 § 1 pkt 2) i wlicza się do okresu zasiłkowego (UZ art. 12 ust. 1).</>,
            ]} />
          ) : (
            <Bullets items={["Nie-pracownik: zasiłek od pierwszego dnia niezdolności, zawsze wypłaca ZUS."]} />
          )}
        </section>

        <section className="result-card">
          <h3 className="result-title">3. Wysokość świadczenia</h3>
          <ResultTable
            cols={[
              { label: "Świadczenie" },
              { label: "Dni", align: "right" },
              { label: "Stawka", align: "right" },
              { label: "Dziennie", align: "right" },
              { label: "Razem", align: "right" },
            ]}
            rows={[
              ...(dniWynagr > 0
                ? [{ cells: ["Wynagrodzenie chorobowe (pracodawca)", dniWynagr, `${stawkaWyn}%`, zl((dzienStawka * stawkaWyn) / 100), zl(kwotaWynagr)] }]
                : []),
              { cells: ["Zasiłek chorobowy", Math.max(0, dniZasilku), `${stawka}%`, zl((dzienStawka * stawka) / 100), zl(kwotaZasilku)] },
              { cells: ["Łącznie za okres niezdolności", dNz, "", "", zl(kwotaRazem)], total: true },
            ]}
          />
          {!wyplata && (
            <p className="alert-inline">
              <Badge tone="err">0 ZŁ</Badge> Kwoty wynoszą 0 zł, bo{" "}
              {!maPrawo ? "nie minął okres oczekiwania (punkt 1)" : "zaległość składkowa blokuje wypłatę (art. 2a UZ)"}.
            </p>
          )}
          {!kodB && <p className="note">Bez kodu „B”: stawka {CFG.stChorobowy}%, okres zasiłkowy {CFG.okresZasilkowy} dni.</p>}
        </section>

        <section className="result-card">
          <h3 className="result-title">4. Okres zasiłkowy</h3>
          <Bullets items={[
            <>Maksymalny okres zasiłkowy: <b>{okresMax} dni</b> {kodB ? "(ciąża – kod B)" : "(standardowo)"}. Po tym epizodzie pozostaje <b>{poTymOkresie} dni</b>.</>,
            <>Przerwa ≤ {CFG.przerwaZnaczaOkres} dni nie zeruje okresu zasiłkowego – wyjątek: nowa niezdolność w ciąży (kod „B”) liczona jest od nowa (art. 9 ust. 2).</>,
          ]} />
          {dNz > pozostaloPrzed && (
            <p><Badge tone="warn">UWAGA</Badge> Ten epizod ({dNz} dni) jest dłuższy niż pozostały okres zasiłkowy – płatne jest max {pozostaloPrzed} dni, dalej możliwe świadczenie rehabilitacyjne.</p>
          )}
        </section>

        <section className="result-card">
          <h3 className="result-title">5. Co po wyczerpaniu 270 dni – świadczenie rehabilitacyjne</h3>
          <Bullets items={[
            <>Wysokość: <b>{CFG.stRehab90}%</b> przez pierwsze 3 miesiące, <b>{CFG.stRehab75}%</b> dalej, <b>100% w ciąży</b>; max 12 miesięcy; warunek rokowania odzyskania zdolności do pracy.</>,
            <>Wniosek ZAS-14A najpóźniej 6 tygodni przed końcem okresu zasiłkowego; wypłaca ZUS.</>,
          ]} />
        </section>

        <section className="result-card">
          <h3 className="result-title">6. Utrata pracy w ciąży</h3>
          {s.utrata !== "brak" ? (
            <p>
              <Badge tone="warn">SYTUACJA SZCZEGÓLNA</Badge> {powodUtraty}: przysługuje{" "}
              <b>zasiłek w wysokości zasiłku macierzyńskiego</b> = {CFG.stMacierzynski}% podstawy,
              wypłacany <b>do dnia porodu</b> (ZUS). Dokumenty: zaświadczenie o ciąży w okresie
              zatrudnienia + świadectwo pracy
              {s.utrata === "wyrok" ? " + prawomocne orzeczenie sądu" : ""} + oświadczenie, że nie
              zapewniono innego zatrudnienia (RZI § 15–17).
            </p>
          ) : (
            <p className="note">
              Jeśli umowa została rozwiązana w ciąży z powodu upadłości, likwidacji, śmierci
              pracodawcy albo z naruszeniem prawa – przysługuje zasiłek w wysokości zasiłku
              macierzyńskiego (100% podstawy, do dnia porodu; art. 30 ust. 3 UZ). Po porodzie –
              zasiłek macierzyński mimo ustania ubezpieczenia (art. 30 ust. 1).
            </p>
          )}
          {od && <p className="note">Początek niezdolności: {fmtD(od)}.</p>}
        </section>
      </div>

      <p className="note">
        Miesiąc = 30 dni; zasiłek dzienny = 1/30 podstawy miesięcznej (art. 11 ust. 4–5, art. 36 ust. 3 UZ).
      </p>
    </div>
  );
}
