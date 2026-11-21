import { useState } from "react";
import { CFG, num, zl } from "./config.js";
import { ktoWyplaca } from "../engine/index.js";
import {
  Badge, Field, NumberInput, Select, Check, Section, Bullets, List, ProfilInfo } from "./ui.jsx";
import { useProfileDefaults, opisPodstawienia } from "./useProfileDefaults.js";

const ETAPY = [
  { value: "ciazaL4", label: "Ciąża – niezdolność do pracy (e-ZLA z kodem B)" },
  { value: "przedPorodem", label: "Ciąża – urlop macierzyński przed porodem" },
  { value: "porod", label: "Poród – zasiłek macierzyński (po porodzie)" },
  { value: "uzupelniajacy", label: "Uzupełniający urlop macierzyński (wcześniak / szpital)" },
  { value: "rodzicielski", label: "Urlop rodzicielski" },
  { value: "ojcowski", label: "Urlop ojcowski" },
  { value: "adopcja", label: "Przyjęcie dziecka na wychowanie / rodzina zastępcza" },
  { value: "utrata", label: "Utrata pracy w ciąży" },
  { value: "martwe", label: "Urodzenie martwego dziecka / zgon dziecka" },
];

function dokumenty(status, etap) {
  const DG = status === "dg";
  const D = {
    ciazaL4: [
      "e-ZLA trafia automatycznie do ZUS i na profil pracodawcy (PUE/eZUS) – nic nie nosisz.",
      status === "pracownik"
        ? `Pracownica: zawiadom pracodawcę o nieobecności (Kodeks pracy). Pracodawca płaci wynagrodzenie chorobowe za ${CFG.wynagrodzenieChorobowe} dni (14 po 50 r.ż.), potem zasiłek 100% (kod B, okres zasiłkowy ${CFG.okresZasilkowyCiaza} dni).`
        : "Nie-pracownik: zasiłek od pierwszego dnia, wniosek do ZUS.",
      "Jeśli płatnik nie wypłaca (mały płatnik): wniosek o zasiłek chorobowy (ZAS-53 dla DG / zaświadczenie płatnika Z-3, Z-3a dla zatrudnionych).",
      "Świadczenie rehabilitacyjne po 182/270 dniach: wniosek ZAS-14A najpóźniej 6 tyg. przed końcem okresu zasiłkowego + zaświadczenie lekarza prowadzącego (max 1 mies. przed złożeniem).",
    ],
    przedPorodem: [
      status === "pracownik"
        ? `Wniosek o udzielenie urlopu macierzyńskiego (imię, nazwisko, data od której) do pracodawcy, ≥ ${CFG.ochronaWkladDni.macierzynski} dni przed; max ${CFG.przedPorodemMax} tyg. przed przewidywaną datą porodu (RWN § 2).`
        : "Nie-pracownik: wniosek o zasiłek macierzyński ZAM z dołączonym zaświadczeniem lekarskim o przewidywanej dacie porodu (ZUS).",
      "Załącznik: kopia zaświadczenia lekarskiego o przewidywanej dacie porodu.",
      "Od dnia złożenia wniosku (w terminach 14/21/7 dni) zaczyna się ochrona zatrudnienia (KP art. 177 § 1¹).",
    ],
    porod: [
      status === "pracownik"
        ? "Wniosek o urlop macierzyński (i jednocześnie o rodzicielski – można jednym wnioskiem); uprawnienia ustala pracodawca, który wypłaca zasiłek lub przekazuje Z-3 do ZUS."
        : "Wniosek ZAM do ZUS (bądź do zleceniodawcy, jeśli jest uprawnionym płatnikiem).",
      "Odpis skrócony aktu urodzenia: możesz nie okazywać – ZUS pobierze go sam z rejestru stanu cywilnego (podajesz dane dziecka); w przeciwnym razie wezwanie ≥ 14 dni.",
      `Wariant 81,5%: wniosek o pełny wymiar macierzyńskiego + rodzicielskiego do ${CFG.deadlineSredniowany} dni po porodzie – po tym terminie bezpowrotnie 70% za rodzicielski.`,
      "Podstawowe dane we wniosku: dane ubezpieczonego i drugiego rodzica (PESEL), dane dziecka, liczba dzieci, oświadczenie o „Za życiem”, przewidywana data porodu.",
    ],
    uzupelniajacy: [
      `Wniosek o uzupełniający urlop macierzyński ≥ ${CFG.ochronaWkladDni.uzupelniajacy} dni przed końcem urlopu macierzyńskiego (RWN § 14); tylko pracownicy.`,
      "Załączniki: zaświadczenie szpitala (tydzień ciąży/masa urodzeniowa + okres pobytu dziecka w szpitalu) + oświadczenie drugiego rodzica o nieskorzystaniu.",
      "Wymiar: 1 tydzień za każdy tydzień hospitalizacji, max 15 tyg. (poród < 28 tyg. lub masa ≤ 1000 g) albo 8 tyg.; zasiłek 100%, udzielany jednorazowo.",
    ],
    rodzicielski: [
      `Pracownik: wniosek o urlop rodzicielski (lub jego część) ≥ ${CFG.ochronaWkladDni.rodzicielski} dni przed rozpoczęciem. Pierwsza część zaraz po macierzyńskim; max 5 części, do końca roku kalendarzowego, w którym dziecko kończy ${CFG.limitRokZycia} lat.`,
      "Załączniki: odpis aktu urodzenia (dla ZUS: dane z rejestru), oświadczenie drugiego rodzica, kopia zaświadczenia „Za życiem” (przy 65/67 tyg.).",
      "Nie-pracownik: wniosek ZAM (od 24.10.2026 jeden formularz zamiast ZUR) do płatnika uprawnionego lub ZUS, przed rozpoczęciem korzystania.",
      "Praca w trakcie urlopu (≤ ½ etatu): wniosek ≥ 21 dni; pracodawca odmawia tylko przez organizację pracy (powiadomienie w 7 dni z przyczyną).",
    ],
    ojcowski: [
      `Wniosek o urlop ojcowski ≥ ${CFG.ochronaWkladDni.ojcowski} dni przed rozpoczęciem; do ${CFG.deadlineOjcowskiMies}. miesiąca życia dziecka (adopcja: 12 mies. od uprawomocnienia, max 14 lat) – po terminie prawo wygasa.`,
      "Załączniki: odpis aktu urodzenia (lub postanowienie o przysposobieniu), oświadczenie czy korzystałeś już z tego urlopu.",
      "Zasiłek 100%, niezależne prawo ojca – również gdy matka nie jest ubezpieczona.",
    ],
    adopcja: [
      "Wniosek o urlop na warunkach urlopu macierzyńskiego: w 7 dni od przyjęcia dziecka; start nie później niż 21 dni od przyjęcia (RWN § 18).",
      "Dokumenty: oświadczenie o dacie przyjęcia + kopia wniosku o przysposobienie z poświadczeniem sądu / orzeczenie o umieszczeniu w rodzinie zastępczej albo umowa ze starostą + dokument potwierdzający wiek dziecka (+ decyzja o odroczeniu obowiązku szkolnego).",
      "Limity wieku: rodzina zastępcza niezawodowa do 7 lat (10 przy odroczeniu); wniosek o przysposobienie: do 14 lat. Rodzina zawodowa – brak prawa.",
      "Urlop rodzicielski: analogicznie (41/43 tyg.; „Za życiem” 62/65/67) – kombinacja z kalkulatorem adopcji.",
    ],
    utrata: [
      "Zasiłek w wysokości zasiłku macierzyńskiego (100%, do dnia porodu): wniosek do ZUS + zaświadczenie o ciąży w okresie zatrudnienia + świadectwo pracy + oświadczenie, że nie zapewniono innego zatrudnienia (RZI § 17).",
      "Przy rozwiązaniu z naruszeniem prawa: dodatkowo prawomocne orzeczenie sądu (RZI § 15 ust. 2).",
      "Po porodzie: zasiłek macierzyński mimo ustania ubezpieczenia (art. 30 ust. 1 UZ) – wniosek ZAM do ZUS.",
      "Ochrona KP nie dotyczy osób niebędących pracownikami.",
    ],
    martwe: [
      "Zasiłek macierzyński: 8 tygodni od porodu, nie krócej niż 7 dni od dnia zgonu; przy wielorodztwie wymiar wg dzieci pozostałych przy życiu.",
      "Dokumenty: odpis skrócony aktu urodzenia z adnotacją o martwym urodzeniu albo zaświadczenie o martwym urodzeniu – bez względu na czas trwania ciąży.",
      "Zasiłek pogrzebowy: 7 000 zł, wniosek Z-12 do ZUS w 12 miesięcy od pochówku (osoba, która pokryła koszty).",
      "Wsparcie: hospicja perinatalne (np. HoPe Katowice, Wrocławskie Hospicjum dla Dzieci), fundacje rodzin po stracie.",
    ],
  };
  return D[etap] || [];
}

const ZAGROZENIA = [
  <><b>Nieubezpieczenie na dzień porodu:</b> rozwiązanie umowy / koniec zlecenia / wyrejestrowanie DG przed porodem = brak zasiłku macierzyńskiego (chyba że zachodzi art. 30 – upadłość/likwidacja/śmierć pracodawcy/naruszenie prawa).</>,
  <><b>Dobrowolne chorobowe wygasa z chwilą pobierania zasiłku macierzyńskiego</b> – po zasiłku ponowne zgłoszenie (ZUA) jest konieczne, by odzyskać ochronę.</>,
  <><b>Ulga na start</b> (6 mies.) = brak ubezpieczenia chorobowego = brak zasiłków macierzyńskiego/chorobowego.</>,
  <><b>Umowa lub podwyższenie podstawy dla pozoru</b> – ZUS wyda decyzję o niepodleganiu ubezpieczeniu albo ustali niższą podstawę.</>,
  <><b>Praca zarobkowa lub aktywność niezgodna z celem zwolnienia</b> – utrata zasiłku za cały okres + zwrot z odsetkami.</>,
  <><b>Terminy bezpowrotne:</b> 21 dni (81,5%), 12 miesięcy (ojcowski), koniec roku kal. 6 r.ż. (rodzicielski), 6 miesięcy (przedawnienie roszczenia o zasiłek).</>,
  <><b>Zasiłek nie przysługuje</b> za urlop bezpłatny i urlop wychowawczy.</>,
];

export default function CalcDokumenty() {
  const [s, set] = useState({ status: "pracownik", liczba: "30", etap: "ciazaL4", zaleglosc: false });
  const set_ = (k) => (v) => set((p) => ({ ...p, [k]: v }));
  const profilDane = useProfileDefaults(set, "dokumenty");

  const status = s.status;
  const etap = s.etap;
  // Kto wypłaca: src/engine/platnik.js (próg z parametrów)
  const { kto } = ktoWyplaca({ status, liczbaUbezpieczonych: num(s.liczba) }, CFG);
  const duzy = kto === "PLATNIK";
  const DG = status === "dg";
  const zlec = status === "zlecenie";

  const platnik =
    status === "pracownik"
      ? duzy
        ? { tone: "ok", badge: "PŁATNIK SKŁADEK", text: `Twój pracodawca sam wypłaca zasiłki (zgłasza > ${CFG.progPlatnika} ubezpieczonych).` }
        : { tone: "ok", badge: "ZUS", text: "Pracodawca przekazuje wnioski i Z-3 do ZUS w 7 dni – zasiłek wypłaca ZUS (w 30 dni od wyjaśnienia okoliczności)." }
      : zlec
        ? duzy
          ? { tone: "ok", badge: "PŁATNIK SKŁADEK", text: `Płatnik zleceniodawcy sam wypłaca zasiłki (zgłasza > ${CFG.progPlatnika} ubezpieczonych); w razie braku uprawnień – Z-3a do ZUS.` }
          : { tone: "ok", badge: "ZUS", text: "Zleceniodawca nie jest uprawniony do wypłaty – składasz wniosek do ZUS (płatnik przekazuje Z-3a)." }
        : { tone: "ok", badge: "ZUS", text: "Przedsiębiorczyni zawsze składa wnioski bezpośrednio do ZUS (eZUS); Z-3b zlikwidowany od 24.10.2026 – ZUS pobiera dane sam." };

  const etapLabel = ETAPY.find((e) => e.value === etap)?.label ?? "";
  const doks = dokumenty(status, etap);

  return (
    <div className="calc">
      <ProfilInfo
        zalogowany={!!profilDane.profile}
        pola={opisPodstawienia(profilDane.podstawione ?? [], s)}
      />
      <div className="calc-cols">
        <div>
          <Section title="Kim jesteś u płatnika składek">
            <Field label="Status">
              <Select value={s.status} onChange={set_("status")} options={[
                { value: "pracownik", label: "Pracownik (umowa o pracę)" },
                { value: "zlecenie", label: "Zleceniobiorca (zlecenie ze składkami chorobowymi)" },
                { value: "dg", label: "Pozarolnicza działalność gospodarcza" },
              ]} />
            </Field>
            <Field label="Liczba ubezpieczonych u płatnika (stan 30 XI poprzedniego roku)">
              <NumberInput value={s.liczba} onChange={set_("liczba")} min="0" />
            </Field>
            <Field label="Etap / świadczenie">
              <Select value={s.etap} onChange={set_("etap")} options={ETAPY} />
            </Field>
            <div className="field field-wide">
              <Check checked={s.zaleglosc} onChange={set_("zaleglosc")}>
                Mam zaległości składkowe (działalność / duchowny / zlecenie opłacane samodzielnie)
              </Check>
            </div>
          </Section>
        </div>

        <div className="calc-results">
          <div className="summary-card">
            <span className="summary-label">Kto wypłaca</span>
            <span className="summary-value">{platnik.badge}</span>
            <p className="note">{platnik.text}</p>
          </div>
        </div>
      </div>

      <div className="result-stack">
        <section className="result-card">
          <h3 className="result-title">1. Kto ustala prawo i wypłaca zasiłek</h3>
          <p><Badge tone={platnik.tone}>{platnik.badge}</Badge> {platnik.text}</p>
          {s.zaleglosc && (
            <p>
              <Badge tone="err">BLOKADA</Badge> Zaległość składkowa &gt; {zl(CFG.progZaleglosci)} (1% płacy
              minimalnej) = brak zasiłków do czasu spłaty (art. 2a UZ).
              {DG ? " Zaświadczenie o zadłużeniu na dzień porodu: do pobrania na koncie eZUS." : ""}
            </p>
          )}
        </section>

        <section className="result-card">
          <h3 className="result-title">2. Dokumenty i terminy – {etapLabel}</h3>
          <Bullets items={doks} />
        </section>

        <section className="result-card alert-card">
          <h3 className="result-title">3. Zagrożenia utraty uprawnień</h3>
          <List items={ZAGROZENIA} tone="warn" />
        </section>
      </div>
    </div>
  );
}
