import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth.js";
import { useProfile } from "../profile.js";
import { CFG } from "../calculators/config.js";
import { terminyWnioskow } from "../engine/index.js";
import { ZDARZENIE, TESTOWE, pokaz, powiadomieniaWlaczone, wyslijDzisiejsze } from "../powiadomienia.js";

/* =====================================================================
   Powiadomienia o terminach (globalnie, dla zalogowanych):
   - po wejściu do aplikacji: przypomnienia na dziś (7 i 3 dni przed terminem, w dniu terminu),
   - klawisz „N” (poza polami formularza) – testowe powiadomienie (na demo),
   - komunikat na stronie zawsze; systemowe powiadomienie, gdy przeglądarka ma zgodę
     (włącza się ją przyciskiem w „Kalendarzu”).
   ===================================================================== */
const KLUCZ_ZLOZONE = "rodzicplus-calendar-completed";
const wPolu = (el) => el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

function Dzisiejsze() {
  const { profile } = useProfile();
  const terminy = useMemo(() => (profile ? terminyWnioskow(profile, { params: CFG }) : []), [profile]);
  useEffect(() => {
    if (!terminy.length || !powiadomieniaWlaczone()) return;
    let zlozone = {};
    try { zlozone = JSON.parse(localStorage.getItem(KLUCZ_ZLOZONE) || "{}"); } catch { /* brak pamięci */ }
    wyslijDzisiejsze(terminy, zlozone);
  }, [terminy]);
  return null;
}

export default function Powiadomienia() {
  const { user } = useAuth() ?? {};
  const [lista, setLista] = useState([]);

  // Komunikaty na stronie – każde wywołanie pokaz() trafia tutaj; znikają po 8 s.
  useEffect(() => {
    const onPowiadomienie = (e) => {
      const p = { ...e.detail, _id: `${e.detail.klucz}-${Date.now()}-${Math.random()}` };
      setLista((l) => [...l.slice(-3), p]);
      setTimeout(() => setLista((l) => l.filter((x) => x._id !== p._id)), 8000);
    };
    window.addEventListener(ZDARZENIE, onPowiadomienie);
    return () => window.removeEventListener(ZDARZENIE, onPowiadomienie);
  }, []);

  // Klawisz N – testowe powiadomienie (bez Ctrl/Alt/Cmd, nie podczas pisania w formularzu).
  useEffect(() => {
    if (!user) return undefined;
    const onKey = (e) => {
      if (e.key?.toLowerCase() !== "n" || e.ctrlKey || e.metaKey || e.altKey || e.repeat || wPolu(e.target)) return;
      pokaz(TESTOWE);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user]);

  return (
    <>
      {user && <Dzisiejsze />}
      {lista.length > 0 && (
        <div className="toast-stack" role="status" aria-live="polite">
          {lista.map((p) => (
            <div className="toast" key={p._id}>
              <strong>{p.tytul}</strong>
              <span>{p.tresc}</span>
              {p.link && <Link to={p.link} onClick={() => setLista((l) => l.filter((x) => x._id !== p._id))}>Zobacz →</Link>}
              <button type="button" className="toast-close" aria-label="Zamknij powiadomienie"
                onClick={() => setLista((l) => l.filter((x) => x._id !== p._id))}>×</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
