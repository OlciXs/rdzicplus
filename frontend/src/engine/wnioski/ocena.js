/* =====================================================================
   Silnik dostępności: profil → które warianty wniosków są dostępne.

   Status wariantu:
     "dostepny"     – wszystkie warunki spełnione,
     "niedostepny"  – co najmniej jeden warunek niespełniony (powody w `powody`),
     "brak_danych"  – nic nie wyklucza, ale brakuje odpowiedzi w profilu (`brakujaceDane`),
     "informacja"   – zasada/uprawnienie do pokazania, bez oceny,
     "nie_dotyczy"  – inna rola albo etap sprawy (np. urlop ojcowski dla matki).
   ===================================================================== */
import { DEFAULT_PARAMS } from "../params.js";
import { kontekstSprawy } from "./kontekst.js";
import { WARIANTY, WNIOSKI, POLA } from "./rejestr.js";

const ROLE = { matka: "matki", ojciec: "ojca", inny: "innego członka rodziny" };
const ETAPY = { ciaza: "w ciąży", po_porodzie: "po porodzie", przyjecie: "przy przyjęciu dziecka" };

const wartosc = (fn, k) => (typeof fn === "function" ? fn(k) : fn ?? null);
const pobierz = (profil, sciezka) => sciezka.split(".").reduce((o, key) => (o == null ? undefined : o[key]), profil);
const pusty = (v) => v === undefined || v === null || v === "";
const etykiety = (pola) => [...new Set(pola)].map((pole) => ({ pole, etykieta: POLA[pole] ?? pole }));

export function ocenWariant(wariant, k) {
  const baza = {
    id: wariant.id,
    wniosek: wariant.wniosek,
    nazwa: wariant.nazwa,
    kto: wariant.kto,
    podstawa: wariant.podstawa,
    pewnosc: wariant.pewnosc ?? "pewne",
    uwaga: wariant.uwaga ?? null,
  };
  if (wariant.typ === "informacja") return { ...baza, status: "informacja", opis: wariant.opis };

  // Rola i etap: brak w profilu → brak danych; inna → nie dotyczy.
  const wstep = [];
  if (k.rola === null) wstep.push({ tekst: "Wiemy, kim jesteś dla dziecka", ok: null, pola: ["sytuacja.rola"] });
  else if (!wariant.kto.includes(k.rola))
    return { ...baza, status: "nie_dotyczy", powody: [`Ten wariant jest dla: ${wariant.kto.map((r) => ROLE[r]).join(", ")}`] };
  if (wariant.etapy) {
    if (k.etap === null) wstep.push({ tekst: "Wiemy, na jakim etapie jest sprawa", ok: null, pola: ["sytuacja.etap"] });
    else if (!wariant.etapy.includes(k.etap))
      return { ...baza, status: "nie_dotyczy", powody: [`Dotyczy sytuacji: ${wariant.etapy.map((e) => ETAPY[e]).join(", ")}`] };
  }

  const warunki = [...wstep, ...wariant.warunki(k)];
  const niespelnione = warunki.filter((x) => x.ok === false);
  const nieznane = warunki.filter((x) => x.ok === null);
  const status = niespelnione.length ? "niedostepny" : nieznane.length ? "brak_danych" : "dostepny";

  // Pola potrzebne do wypełnienia samego wniosku (nie decydują o prawie).
  const doUzupelnienia = etykiety((wariant.potrzebnePola ?? []).filter((p) => pusty(pobierz(k.profil, p))));

  return {
    ...baza,
    status,
    warunki,
    powody: niespelnione.map((x) => x.tekst),
    brakujaceDane: etykiety(nieznane.flatMap((x) => x.pola)),
    doUzupelnienia,
    wymiar: wartosc(wariant.wymiar, k),
    wysokosc: wartosc(wariant.wysokosc, k),
    adresat: wartosc(wariant.adresat, k),
    formularz: wariant.formularz ?? null,
    termin: wartosc(wariant.termin, k),
    dokumenty: wariant.dokumenty ?? [],
  };
}

const KOLEJNOSC = { dostepny: 0, brak_danych: 1, niedostepny: 2, informacja: 3, nie_dotyczy: 4 };

/** Wszystkie warianty jednego wniosku, od dostępnych do niedotyczących. */
export function ocenWniosek(profil, wniosekId, { dzis, params = DEFAULT_PARAMS } = {}) {
  const k = kontekstSprawy(profil, { dzis, params });
  const wniosek = WNIOSKI.find((x) => x.id === wniosekId);
  if (!wniosek) throw new Error(`Nieznany wniosek: ${wniosekId}`);
  const warianty = WARIANTY.filter((v) => v.wniosek === wniosekId)
    .map((v) => ocenWariant(v, k))
    .sort((a, b) => KOLEJNOSC[a.status] - KOLEJNOSC[b.status]);
  return { wniosek, warianty };
}

/** Przegląd: dla każdego wniosku liczba wariantów w każdym statusie + ostrzeżenia dla całej sprawy. */
export function przegladWnioskow(profil, { dzis, params = DEFAULT_PARAMS } = {}) {
  const k = kontekstSprawy(profil, { dzis, params });
  const wnioski = WNIOSKI.map((wniosek) => {
    const warianty = WARIANTY.filter((v) => v.wniosek === wniosek.id).map((v) => ocenWariant(v, k));
    const licz = (s) => warianty.filter((v) => v.status === s).length;
    return {
      ...wniosek,
      dostepne: licz("dostepny"),
      brakDanych: licz("brak_danych"),
      niedostepne: licz("niedostepny"),
      warianty,
    };
  });
  return { wnioski, ostrzezenia: ostrzezenia(k) };
}

/* ---------- ostrzeżenia dla całej sprawy (dokument 02, § 5: V1–V40) ---------- */
export function ostrzezenia(k) {
  const out = [];
  const dodaj = (kod, poziom, tekst) => out.push({ kod, poziom, tekst });

  if (k.tytul === "ulga_na_start")
    dodaj("V38", "blad", "Ulga na start = brak ubezpieczenia chorobowego, więc nie ma zasiłku chorobowego ani macierzyńskiego. Rozważ zgłoszenie do ubezpieczeń społecznych.");
  else if (k.maChorobowe === false)
    dodaj("V1", "blad", "Bez ubezpieczenia chorobowego nie przysługuje zasiłek macierzyński. Sprawdź świadczenie rodzicielskie w gminie (1000 zł/mies.).");
  if (k.ubezpieczonyWDniuZdarzenia === false && k.maChorobowe)
    dodaj("V1", "blad", "Ubezpieczenie chorobowe ustaje przed porodem / przyjęciem dziecka – bez wyjątków z art. 30 nie będzie zasiłku macierzyńskiego.");
  if (k.blokadaZadluzenia)
    dodaj("V22", "blad", `Zaległość w składkach powyżej ${k.P.progZaleglosci} zł blokuje wszystkie zasiłki do czasu spłaty. Prawo przedawnia się po 6 miesiącach.`);
  if (k.wyczekiwanieSpelnione === false)
    dodaj(k.grupa === "dobrowolne" ? "V2" : "V3", "ostrzezenie",
      `Zasiłek chorobowy przysługuje po ${k.okresWyczekiwania} dniach ubezpieczenia (masz ${k.dniUbezpieczenia}). Zasiłku macierzyńskiego to nie dotyczy.${k.grupa === "dobrowolne" ? " Zgłoszenie do dobrowolnego chorobowego nie działa wstecz." : ""}`);
  if (k.zmianaWymiaru12m)
    dodaj("V23", "ostrzezenie", "Zmiana wymiaru etatu w ostatnich 12 miesiącach – podstawa zasiłku liczona jest od nowego wymiaru, zasiłek może być niższy.");
  if (k.rola === "matka" && k.dniOdPorodu !== null) {
    const zostalo = k.P.deadlineSredniowany - k.dniOdPorodu;
    if (zostalo < 0) dodaj("V4", "info", "Minęło 21 dni od porodu – wariant 81,5% nie jest już możliwy (zostaje 100% + 70%).");
    else if (k.zamiarPelnyWymiar !== false) dodaj("V4", "ostrzezenie", `Na wniosek o zasiłek 81,5% zostało ${zostalo} dni.`);
  }
  if (k.rola === "ojciec" && k.wiekDzieckaMies !== null && k.etap === "po_porodzie") {
    if (k.wiekDzieckaMies >= k.P.deadlineOjcowskiMies) dodaj("V5", "info", "Dziecko skończyło 12 miesięcy – prawo do urlopu ojcowskiego wygasło.");
    else if (k.wiekDzieckaMies >= 9) dodaj("V5", "ostrzezenie", `Urlop ojcowski trzeba wykorzystać, zanim dziecko skończy 12 miesięcy (zostało ok. ${k.P.deadlineOjcowskiMies - k.wiekDzieckaMies} mies.).`);
  }
  if (k.drugiRodzicRodzicielski === "nie")
    dodaj("V9", "ostrzezenie", `Drugi rodzic nie bierze urlopu rodzicielskiego – jego ${k.P.wyliczneRodzicielskie} tygodni przepada (nie da się ich przenieść).`);
  if (k.typPrzyjecia === "rodzina_zastepcza_zawodowa")
    dodaj("V20", "blad", "Zawodowa rodzina zastępcza nie ma prawa do urlopu na warunkach urlopu macierzyńskiego.");
  if (k.wymiarPracyPrzyLaczeniu === "powyzej")
    dodaj("V10", "blad", "Urlop rodzicielski można łączyć z pracą maksymalnie na ½ etatu.");
  if (k.pobytWSzpitalu && k.planUzupelniajacy && !k.terminKoncaMacierzynskiego)
    dodaj("V12", "ostrzezenie", "Wniosek o uzupełniający urlop macierzyński bez terminu zakończenia urlopu macierzyńskiego będzie wadliwy (art. 180² § 6 k.p.).");
  if (k.zaGranica)
    dodaj("V39", "info", "Dokumenty z kraju spoza UE/EFTA/Szwajcarii/Wielkiej Brytanii trzeba przetłumaczyć na polski.");
  if (["dg", "wspolpraca", "zlecenie"].includes(k.tytul) && ["ciaza", "po_porodzie"].includes(k.etap))
    dodaj("info_ZUA", "info", "Po zakończeniu zasiłku macierzyńskiego dobrowolne ubezpieczenie chorobowe trzeba zgłosić ponownie (ZUS ZUA), inaczej nie będzie kolejnych zasiłków.");
  if (k.potrzebaOpieki && k.potrzebaOpieki !== "brak")
    dodaj("V33", "info", "Zasiłek opiekuńczy nie jest wypłacany automatycznie – trzeba złożyć wniosek (Z-15A / Z-15B).");
  dodaj("V49", "info", "Umowa zawarta lub podwyższona podstawa składek tylko po to, by dostać wyższy zasiłek, może zostać zakwestionowana przez ZUS.");
  dodaj("V27", "info", "Prawo do zasiłku przedawnia się po 6 miesiącach od ostatniego dnia okresu, za który przysługuje.");
  return out;
}
