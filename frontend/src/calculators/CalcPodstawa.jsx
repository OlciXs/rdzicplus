import { useState } from "react";
import { CFG, num, zl } from "./config.js";
import {
  Badge, Field, NumberInput, Select, Section, ResultTable, Bullets,
} from "./ui.jsx";

const defaultMonths = () => Array.from({ length: 12 }, () => "5000");

export default function CalcPodstawa() {
  const [s, set] = useState({ status: "pracownik", ileMies: "12", kwartalne: "0", roczna: "0" });
  const [months, setMonths] = useState(defaultMonths);
  const set_ = (k) => (v) => set((p) => ({ ...p, [k]: v }));
  const setMonth = (i) => (v) => setMonths((prev) => prev.map((m, j) => (j === i ? v : m)));

  const status = s.status;
  const ileMies = Math.min(12, Math.max(1, num(s.ileMies)));
  const kwartalne = num(s.kwartalne);
  const roczna = num(s.roczna);

  let suma = 0;
  let licznik = 0;
  for (let i = 0; i < 12; i++) {
    const v = num(months[i]);
    if (i + 1 <= ileMies && v > 0) {
      suma += v;
      licznik++;
    }
  }

  if (licznik === 0) {
    return (
      <div className="calc">
        <div className="calc-cols">
          <div>
            <Section title="Status i okres">
              <Field label="Status">
                <Select value={s.status} onChange={set_("status")} options={[
                  { value: "pracownik", label: "Pracownik (umowa o pracę)" },
                  { value: "niepracownik", label: "Nie-pracownik (zlecenie, działalność)" },
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

  const srednia = suma / licznik;
  const dodatek = kwartalne / 12 + roczna / 12;
  const przecietne = srednia + dodatek;

  let podstawa = przecietne * (1 - CFG.potracenie / 100);
  let clampNote = "";
  if (status === "pracownik") {
    if (podstawa < CFG.minPodstawaPracownik) {
      clampNote = `Podniesiono do minimum ${zl(CFG.minPodstawaPracownik)} (minimalne wynagrodzenie ${zl(CFG.minWynagrodzenie)} − 13,71%; art. 45 UZ – dotyczy pełnego wymiaru czasu pracy).`;
      podstawa = CFG.minPodstawaPracownik;
    }
  } else {
    if (podstawa > CFG.maxPodstawaZasilku) {
      clampNote = `Ograniczono do maksymalnej podstawy ${zl(CFG.maxPodstawaZasilku)} (limit od maksymalnej podstawy dobrowolnej składki chorobowej ${zl(CFG.maxPodstawaSkladki)} − 13,71%).`;
      podstawa = CFG.maxPodstawaZasilku;
    } else if (podstawa < 4877.53) {
      clampNote = "Uwaga: podstawa poniżej typowego minimum dla ubezpieczonych dobrowolnie (przy najniższej zadeklarowanej podstawie składek tzw. duży ZUS 5 652 zł podstawa zasiłku to ok. 4 877,53 zł). Zweryfikuj minimalną podstawę z ZUS.";
    }
  }

  return (
    <div className="calc">
      <div className="calc-cols">
        <div>
          <Section
            title="Status i okres"
            note="Miesiące z przepracowanym czasem < połowa obowiązującego wymiaru są wykluczane (wpisz 0). Przy ≥ połowie – miesiąc uzupełniamy do pełnego (w uproszczeniu: podaj kwotę po uzupełnieniu)."
          >
            <Field label="Status">
              <Select value={s.status} onChange={set_("status")} options={[
                { value: "pracownik", label: "Pracownik (umowa o pracę)" },
                { value: "niepracownik", label: "Nie-pracownik (zlecenie, działalność)" },
              ]} />
            </Field>
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
              { cells: ["Podstawa dzienna (1/30)", zl(podstawa / CFG.dniMiesiaca)] },
              { cells: ["Zasiłek 100% / mies.", zl((podstawa * CFG.stMacierzynski) / 100)], total: true },
            ]}
          />
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
              { cells: ["Potrącenie składek (13,71%)", "−" + zl((przecietne * CFG.potracenie) / 100)] },
              { cells: ["Podstawa wymiaru zasiłku (miesięcznie)", zl(podstawa)], total: true },
              { cells: ["Podstawa dzienna (1/30)", zl(podstawa / CFG.dniMiesiaca)] },
            ]}
          />
          {clampNote && <p className="alert-inline"><Badge tone="warn">LIMIT</Badge> {clampNote}</p>}
        </section>

        <section className="result-card">
          <h3 className="result-title">2. Miesięczne kwoty świadczeń (od tej podstawy)</h3>
          <ResultTable
            cols={[{ label: "Świadczenie" }, { label: "", align: "right" }]}
            rows={[
              { cells: ["Zasiłek macierzyński 100% (macierzyński, uzupełniający, ojcowski)", zl((podstawa * CFG.stMacierzynski) / 100)] },
              { cells: [`Zasiłek macierzyński 81,5% (wniosek do ${CFG.deadlineSredniowany} dni)`, zl((podstawa * CFG.stSredniowany) / 100)] },
              { cells: ["Zasiłek macierzyński 70% (wariant zmienny – rodzicielski)", zl((podstawa * CFG.stRodzicielski) / 100)] },
              { cells: ["Zasiłek chorobowy 100% (ciąża, kod B)", zl((podstawa * CFG.stChorobowyCiaza) / 100)] },
              { cells: ["Zasiłek chorobowy 80% (standard)", zl((podstawa * CFG.stChorobowy) / 100)] },
            ]}
          />
          <Bullets items={[
            "Miesiące z przepracowanym < połową czasu pracy wyłącza się (art. 38 ust. 2); przy ≥ połowie – wynagrodzenie uzupełnia się (art. 37–38).",
            "Składniki wypłacane nadal w okresie zasiłku (np. dodatek stażowy) nie wliczają się (art. 41).",
            "Nowa podstawa tylko gdy przerwa między zasiłkami ≥ 1 miesiąca (art. 43); nie-pracownicy: przychód deklarowany (art. 48–48a).",
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
