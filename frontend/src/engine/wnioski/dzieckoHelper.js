/**
 * Helper do odczytu i zapisu danych dziecka w profilu.
 * ProfilPage trzyma dzieci w `profil.dziecko.dzieci[]`, a starsze pola
 * (i część silnika) czytają `profil.dziecko` bezpośrednio. Ten helper
 * ujednolica oba miejsca: top-level ma priorytet, tablica jest fallbackiem.
 */

const tekst = (v) => (v === undefined || v === null ? "" : String(v));

/**
 * Dane dziecka z profilu. Priorytet: top-level → dziecko z tablicy.
 *
 * @param {object} profil
 * @param {number|string} [dzieckoIndex=0]
 * @returns {object}
 */
export function pobierzDaneDziecka(profil, dzieckoIndex = 0) {
  if (!profil) return {};
  const dz = profil.dziecko ?? {};
  const dzieci = Array.isArray(dz.dzieci) ? dz.dzieci : [];
  const index = Math.max(0, Math.min(Number(dzieckoIndex) || 0, dzieci.length - 1));
  const zTablicy = dzieci[index] ?? {};
  const dane = { ...dz, dzieci };
  for (const [klucz, wartosc] of Object.entries(zTablicy)) {
    if (dane[klucz] === undefined || dane[klucz] === null || dane[klucz] === "") dane[klucz] = wartosc;
  }
  if (!dane.liczbaDzieci && dzieci.length) dane.liczbaDzieci = String(dzieci.length);
  return dane;
}

/** Pierwsze dostępne dziecko (top-level albo pierwszy element tablicy). */
export function pierwszeDziecko(profil) {
  return pobierzDaneDziecka(profil, 0);
}

/**
 * Zwraca nowy profil z danymi dziecka zapisanymi w top-level i w tablicy.
 * Nie mutuje wejścia. Zachowuje pozostałe dzieci i pozostałe pola profilu.
 *
 * @param {object} profil
 * @param {{ imie?: string, nazwisko?: string, dataUrodzenia?: string, miejsceUrodzenia?: string }} dane
 * @param {number|string} [dzieckoIndex=0]
 * @returns {object}
 */
export function zapiszDaneDziecka(profil, dane = {}, dzieckoIndex = 0) {
  const base = profil ?? {};
  const dz = base.dziecko ?? {};
  const index = Math.max(0, Number(dzieckoIndex) || 0);
  const dzieci = Array.isArray(dz.dzieci) ? dz.dzieci.map((d) => ({ ...(d ?? {}) })) : [];
  while (dzieci.length <= index) dzieci.push({});

  const dziecko = {
    ...dzieci[index],
    imie: tekst(dane.imie),
    nazwisko: tekst(dane.nazwisko),
    dataUrodzenia: tekst(dane.dataUrodzenia),
    miejsceUrodzenia: tekst(dane.miejsceUrodzenia),
  };
  dzieci[index] = dziecko;

  const dzieckoTop = {
    ...dz,
    ...dziecko,
    dzieci,
  };
  if (!dzieckoTop.liczbaDzieci && dzieci.length) dzieckoTop.liczbaDzieci = String(dzieci.length);

  return { ...base, dziecko: dzieckoTop };
}
