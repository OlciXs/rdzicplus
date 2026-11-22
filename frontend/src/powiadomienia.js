/* =====================================================================
   Powiadomienia o terminach (prośba Oli): 7 i 3 dni przed terminem
   oraz w dniu terminu. Działają, gdy aplikacja jest otwarta w przeglądarce
   (systemowe powiadomienie przeglądarki, jeśli użytkownik się zgodzi;
   zawsze także komunikat na stronie). Do telefonu „na zawsze” – eksport .ics
   z kalendarza (alarmy 7 / 3 dni przed i o 9:00 w dniu terminu).
   Docelowo: web push z backendu – poza zakresem demo.
   ===================================================================== */

const fmt = (iso) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
const KLUCZ_WYSLANE = "rodzicplus-powiadomione";
export const ZDARZENIE = "rodzicplus:powiadomienie";

/** Lokalna data „RRRR-MM-DD” (bez przesunięcia strefy). */
export const dzisLokalnie = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Powiadomienia przypadające na dany dzień.
 * @param {Array} terminy  wynik terminyWnioskow()
 * @param {string} dzis    RRRR-MM-DD
 * @param {object} [zlozone]  { [id terminu]: true } – oznaczone w kalendarzu jako „Złożono”
 */
export function powiadomieniaNaDzien(terminy, dzis, zlozone = {}) {
  const out = [];
  for (const t of terminy ?? []) {
    if (zlozone[t.id]) continue;
    for (const p of t.przypomnienia ?? []) {
      if (p.data !== dzis) continue;
      out.push({
        klucz: `${t.id}:${p.dni}:${t.data}`,
        dni: p.dni,
        tytul: p.dni === 0 ? `Dziś ostatni dzień: ${t.tytul}` : `Za ${p.dni} dni: ${t.tytul}`,
        tresc: `Termin: ${fmt(t.data)}.${t.dokument ? ` Co składasz: ${t.dokument}.` : ""}${t.warunkowy ? " (Jeśli Ci przysługuje – uzupełnij „Moje dane”.)" : ""}`,
        link: t.wniosek ? `/wnioski?w=${t.wniosek}` : "/kalendarz",
      });
    }
  }
  return out;
}

export const TESTOWE = {
  klucz: "test",
  tytul: "Test powiadomień RodzicPlus",
  tresc: "Tak wyglądają przypomnienia o terminach: 7 i 3 dni przed terminem oraz w dniu terminu.",
  link: "/kalendarz",
};

export const obslugiwane = () => typeof window !== "undefined" && "Notification" in window;
export const zgoda = () => (obslugiwane() ? Notification.permission : "unsupported");

export async function poprosOZgode() {
  if (!obslugiwane()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try { return await Notification.requestPermission(); } catch { return "denied"; }
}

/**
 * Pokazuje powiadomienie: systemowe (gdy jest zgoda) i zawsze komunikat na stronie.
 * @returns {"system"|"strona"}
 */
export function pokaz(p) {
  window.dispatchEvent(new CustomEvent(ZDARZENIE, { detail: p }));
  if (zgoda() === "granted") {
    try {
      const n = new Notification(p.tytul, { body: p.tresc, tag: p.klucz, lang: "pl" });
      n.onclick = () => { window.focus(); if (p.link) window.location.assign(p.link); n.close(); };
      return "system";
    } catch { /* np. przeglądarka wymaga service workera – zostaje komunikat na stronie */ }
  }
  return "strona";
}

/** Wysyła dzisiejsze przypomnienia, każde tylko raz (pamięć w przeglądarce). Zwraca wysłane. */
export function wyslijDzisiejsze(terminy, zlozone, dzis = dzisLokalnie()) {
  let wyslane = {};
  try { wyslane = JSON.parse(localStorage.getItem(KLUCZ_WYSLANE) || "{}"); } catch { /* brak pamięci – wyślemy jeszcze raz */ }
  const nowe = powiadomieniaNaDzien(terminy, dzis, zlozone).filter((p) => !wyslane[p.klucz]);
  for (const p of nowe) {
    pokaz(p);
    wyslane[p.klucz] = dzis;
  }
  try { localStorage.setItem(KLUCZ_WYSLANE, JSON.stringify(wyslane)); } catch { /* tryb prywatny */ }
  return nowe;
}
