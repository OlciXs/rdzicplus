/* =====================================================================
   Czysta logika formularza „Moje dane” — bez Reacta, żeby dała się testować.

   Najważniejsze: etykieta etapu zależy od płci i roli. Mężczyzna (ani ojciec)
   nie może „być w ciąży” — jemu pokazujemy „Moja partnerka jest w ciąży”.
   ===================================================================== */

export const ROLE = [
  ["matka", "Matka dziecka (także adopcyjna / zastępcza)"],
  ["ojciec", "Ojciec dziecka (także adopcyjny / zastępczy)"],
  ["inny", "Inny członek najbliższej rodziny (np. babcia, dziadek)"],
];

export const ETAPY = [
  ["ciaza", "Jestem w ciąży (dziecko jeszcze się nie urodziło)"],
  ["po_porodzie", "Dziecko już się urodziło"],
  ["przyjecie", "Przyjęłam/em dziecko na wychowanie (adopcja / piecza zastępcza)"],
];

/** Czy użytkownik opisuje ciążę partnerki (a nie własną). */
export const ciazaPartnerki = (plec, rola) => plec === "M" || rola === "ojciec";

/** Etykiety etapu dopasowane do płci i roli. */
export const ETAPY_DLA = (plec, rola) => {
  if (!ciazaPartnerki(plec, rola)) return ETAPY;
  return [
    ["ciaza", "Moja partnerka jest w ciąży (dziecko jeszcze się nie urodziło)"],
    ["po_porodzie", "Dziecko już się urodziło"],
    ["przyjecie", "Przyjęłam/em dziecko na wychowanie (adopcja / piecza zastępcza)"],
  ];
};

/** Podpowiedź pod polem „Etap”. */
export const HINT_ETAPU = (plec, rola) =>
  ciazaPartnerki(plec, rola)
    ? "Wybierz „Moja partnerka jest w ciąży” — chodzi o ciążę drugiego rodzica, nie o Twoją."
    : undefined;

/** Role dostępne dla danej płci (kobieta nie jest ojcem, mężczyzna matką). */
export const ROLE_DLA = (plec) =>
  ROLE.filter(([v]) => !(plec === "K" && v === "ojciec") && !(plec === "M" && v === "matka"));

/** Czy pole jest opcjonalne — `optional` może być stałą albo funkcją kontekstu. */
export const jestOpcjonalne = (f, c) => (typeof f.optional === "function" ? !!f.optional(c) : !!f.optional);

/** Czy pole jest widoczne — `if` może być stałą albo funkcją kontekstu. */
export const jestWidoczne = (f, c) => !f.if || f.if(c);

/**
 * Dane z aktu urodzenia: przed porodem bywają nieznane, ale można je
 * przygotować zawczasu — dlatego są widoczne też w ciąży (jako opcjonalne).
 */
export const WIDOCZNE_DANE_AKTU = (c) => !!c.etap;
