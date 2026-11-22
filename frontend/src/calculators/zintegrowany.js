/* =====================================================================
   Kalkulator zintegrowany (rekomendacja z treści zadania, pkt 3:
   „wszystkie kalkulatory… w formie zintegrowanego kalkulatora z możliwością
   wybrania odpowiednich opcji”). Logika wyboru opcji – czysta, testowana.
   ===================================================================== */

/** Opcje = kalkulatory a–g (litery jak w treści zadania i w registry.jsx). */
export const OPCJE = [
  { id: "a", slug: "zasilek-chorobowy-w-ciazy", pytanie: "Jestem w ciąży i mam zwolnienie lekarskie" },
  { id: "b", slug: "zasilek-macierzynski", pytanie: "Urodzi się / urodziło się dziecko – urlop macierzyński" },
  { id: "d", slug: "oboje-rodzice", pytanie: "Chcemy podzielić urlop między rodziców" },
  { id: "c", slug: "laczenie-urlopu-z-praca", pytanie: "Chcę pracować w trakcie urlopu rodzicielskiego" },
  { id: "e", slug: "adopcja-rodzina-zastepcza", pytanie: "Adopcja albo rodzina zastępcza" },
  { id: "f", slug: "podstawa-wymiaru", pytanie: "Ile wynosi moja podstawa zasiłku" },
  { id: "g", slug: "dokumenty-i-terminy", pytanie: "Jakie dokumenty, gdzie i do kiedy" },
];
const ID = new Set(OPCJE.map((o) => o.id));

/**
 * Domyślny zestaw opcji z „Moje dane”: etap i rola decydują, co ma sens.
 * Bez profilu – podstawa i dokumenty (to przyda się każdemu).
 */
export function domyslneOpcje(profil) {
  const s = profil?.sytuacja ?? {};
  const z = profil?.zdrowie ?? {};
  const ur = profil?.urlopy ?? {};
  const out = new Set(["f", "g"]);
  if (s.etap === "ciaza") {
    if (s.rola !== "ojciec" && z.zwolnienie && z.zwolnienie !== "brak") out.add("a");
    out.add("b");
  }
  if (s.etap === "po_porodzie") {
    out.add("b");
    out.add("d");
    if (ur.laczenieZPraca === "tak") out.add("c");
  }
  if (s.etap === "przyjecie") out.add("e");
  return sortuj([...out]);
}

/** Kolejność jak w OPCJE (a, b, d, c, e, f, g). */
export const sortuj = (ids) => OPCJE.map((o) => o.id).filter((id) => ids.includes(id));

/** Opcje z adresu (?opcje=a,b,f) – nieznane litery pomijamy; pusty wynik = null (użyj domyślnych). */
export function opcjeZAdresu(tekst) {
  if (typeof tekst !== "string" || !tekst.trim()) return null;
  const ids = [...new Set(tekst.split(",").map((x) => x.trim()).filter((x) => ID.has(x)))];
  return ids.length ? sortuj(ids) : null;
}
