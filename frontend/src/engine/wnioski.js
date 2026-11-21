// Dopasowanie wariantów wniosków do profilu użytkownika.
// Ten moduł musi pozostawać czystym JavaScriptem - JSX ma osobną stronę UI.

const brak = (etykieta, krok) => ({ etykieta, krok });

const findBenefit = (baza, id) =>
  (baza?.benefits ?? []).find((benefit) => benefit.id === id);

const findDocuments = (baza, ids = []) =>
  ids.map((id) => (baza?.documents ?? []).find((document) => document.id === id)).filter(Boolean);

const findDeadlines = (baza, ids = []) =>
  ids.map((id) => (baza?.deadlines ?? []).find((deadline) => deadline.id === id)).filter(Boolean);

export function dopasujWnioski(profile, { baza = {}, params: _params } = {}) {
  if (!profile) {
    return { wnioski: [], odrzucone: [], brakiOgolne: [brak("dane profilu", "situacja")] };
  }

  const ubezpieczony = profile.ubezpieczony ?? {};
  const sytuacja = profile.sytuacja ?? {};
  const dziecko = profile.dziecko ?? {};
  const zdrowie = profile.zdrowie ?? {};
  const urlopy = profile.urlopy ?? {};
  const selected = new Set();

  if (zdrowie.zwolnienie === "tak" || sytuacja.etap === "ciaza") selected.add("VAR01");
  if (dziecko.dataUrodzenia || dziecko.przewidywanaDataPorodu) {
    selected.add("VAR09");
    selected.add("VAR11");
  }
  if (urlopy.planOjcowski) selected.add("VAR14");
  if (urlopy.planRodzicielski) selected.add("VAR12");
  if (urlopy.planWychowawczy) selected.add("VAR16");

  if (selected.size === 0) {
    selected.add("VAR01");
    selected.add("VAR09");
  }

  const wnioski = [];
  const odrzucone = [];
  const brakiOgolne = [];

  for (const variant of (baza?.variants ?? []).filter((item) => selected.has(item.id))) {
    const benefit = findBenefit(baza, variant.benefit);
    const braki = [];
    if (!sytuacja.etap) braki.push(brak("etap sytuacji", "situacja"));
    if (!ubezpieczony.statusUbezpieczenia) braki.push(brak("status ubezpieczenia", "ty"));
    if (!ubezpieczony.podstawaWymiaru) braki.push(brak("podstawę wymiaru", "ty"));

    let status = "sprawdz";
    if (braki.length === 0) status = "mozesz";
    if (variant.applicant === "ojciec" && ubezpieczony.plec === "K") {
      status = "drugi_rodzic";
    }
    if (variant.benefit === "W1" && !dziecko.dataUrodzenia) status = "pozniej";

    const item = {
      id: variant.id,
      tytul: variant.title,
      swiadczenie: benefit?.name ?? "",
      wykonawca: variant.applicant === "ojciec" ? "drugi_rodzic" : "wlasny",
      mozeTezDrugiRodzic: variant.applicant === "oboje",
      powody: benefit?.basis ? [benefit.basis] : [],
      doKogo: variant.channel === "ZUS" ? "ZUS" : variant.channel === "PRACODAWCA" ? "Pracodawca" : "Pracodawca lub ZUS",
      formularze: variant.forms ?? [],
      wymiar: variant.duration ?? benefit?.duration ?? "",
      kwota: variant.amount ?? benefit?.amount ?? "",
      terminy: findDeadlines(baza, variant.deadlines).map((deadline) => ({
        id: deadline.id,
        opis: deadline.name ?? deadline.id,
        kiedy: deadline.when ?? "",
        dni: deadline.days ?? null,
      })),
      braki,
      watpliwosci: [],
      ostrzezenia: [],
      dokumenty: findDocuments(baza, variant.documents).map((document) => ({
        id: document.id,
        nazwa: document.name,
        opcjonalny: Boolean(document.optional),
      })),
      status,
    };

    if (status === "drugi_rodzic" || status === "pozniej") {
      wnioski.push(item);
    } else {
      wnioski.push(item);
    }
  }

  if (!sytuacja.etap) brakiOgolne.push(brak("etap sytuacji", "situacja"));
  if (!dziecko.dataUrodzenia && !dziecko.przewidywanaDataPorodu) {
    brakiOgolne.push(brak("dane dziecka lub przewidywaną datę porodu", "dziecko"));
  }

  return { wnioski, odrzucone, brakiOgolne };
}
