/**
 * Etykiety dla terminów i przypomnień w kalendarzu.
 * Jedno źródło prawdy dla tekstów wyświetlanych w siatce miesiąca i liście terminów.
 */

/**
 * Zwraca etykietę dla terminu albo przypomnienia.
 *
 * @param {object} e - zdarzenie z silnika (ma: data, typ, przypomnienie)
 * @param {string} dzis - data dzisiejsza w formacie RRRR-MM-DD
 * @param {"termin"|"przypomnienie"} [rodzaj="termin"] - czy liczymy termin, czy jego przypomnienie
 * @param {string} [dataPrzypomnienia] - data konkretnego przypomnienia (7 / 3 dni przed); domyślnie e.przypomnienie
 * @returns {string} etykieta do wyświetlenia
 */
export function etykietaTerminu(e, dzis, rodzaj = "termin", dataPrzypomnienia) {
  if (rodzaj === "przypomnienie") {
    // Przypomnienie nigdy nie jest „pilne” – pilny bywa tylko sam termin (zgłoszenie Oli z 18.11).
    const dni = dniDo(dataPrzypomnienia || e.przypomnienie || e.data, dzis);
    if (dni === 0) return "Przypomnienie – dziś";
    if (dni > 0) return `Przypomnienie – za ${dni} ${dni === 1 ? "dzień" : "dni"}`;
    return `Przypomnienie – ${Math.abs(dni)} ${Math.abs(dni) === 1 ? "dzień" : "dni"} temu`;
  }

  const dni = dniDo(e.data, dzis);

  // start i info nigdy nie są pilne
  if (e.typ === "start" || e.typ === "info") {
    if (dni === 0) return "Dziś";
    if (dni > 0) return `Za ${dni} ${dni === 1 ? "dzień" : "dni"}`;
    return `${Math.abs(dni)} ${Math.abs(dni) === 1 ? "dzień" : "dni"} temu`;
  }

  // tylko termin i koniec mogą być pilne
  if (e.typ === "termin" || e.typ === "koniec") {
    if (dni < 0) return `Termin minął ${Math.abs(dni)} ${Math.abs(dni) === 1 ? "dzień" : "dni"} temu`;
    if (dni === 0) return "Dziś ostatni dzień";
    if (dni <= 7) return `Pilne – ${dni} ${dni === 1 ? "dzień" : "dni"}`;
    return `Za ${dni} ${dni === 1 ? "dzień" : "dni"}`;
  }

  return e.typ || "";
}

/**
 * Zwraca klasę CSS dla badga na podstawie typu i daty.
 *
 * @param {object} e - zdarzenie z silnika
 * @param {string} dzis - data dzisiejsza w formacie RRRR-MM-DD
 * @param {"termin"|"przypomnienie"} [rodzaj="termin"]
 * @returns {string} klasa CSS
 */
export function klasaBadga(e, dzis, rodzaj = "termin", dataPrzypomnienia) {
  if (rodzaj === "przypomnienie") {
    const dni = dniDo(dataPrzypomnienia || e.przypomnienie || e.data, dzis);
    if (dni < 0) return "b-neutral"; // minione przypomnienie to nie błąd – błędem jest dopiero minięty termin
    if (dni <= 7) return "b-warn";
    return "b-ok";
  }

  if (e.typ === "start" || e.typ === "info") return "b-ok";

  if (e.typ === "termin" || e.typ === "koniec") {
    const dni = dniDo(e.data, dzis);
    if (dni < 0) return "b-err";
    if (dni <= 7) return "b-warn";
    return "b-ok";
  }

  return "b-ok";
}

// Pomocnicza funkcja do liczenia dni między datami.
function dniDo(iso, dzis) {
  return Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${dzis}T00:00:00Z`)) / 86400000);
}
