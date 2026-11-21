/* =====================================================================
   Baza wiedzy ZUS 2026 (dane referencyjne) — NIE stanowi źródła logiki.
   Logikę oceny wariantów trzyma `engine/wnioski/rejestr.js`.
   Ten plik służy do sprawdzania spójności rejestru z dokumentacją
   (`weryfikujRejestr()`), żeby wykryć rozjazd typy „README obiecuje 45,
   rejestr ma 40” (B-13) i braki podstaw prawnych.
   ===================================================================== */
import baza from "./zus_dane_2026.json" with { type: "json" };

export default baza;
export const { benefits, documents, variants, deadlines, validation_rules, fields } = baza;
