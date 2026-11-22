import { Link, useLocation, useSearchParams } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import { useAuth } from "../auth.js";
import { useProfile } from "../profile.js";
import { getCalculator, calculatorPath } from "../calculators/registry.jsx";
import { OPCJE, domyslneOpcje, opcjeZAdresu, sortuj } from "../calculators/zintegrowany.js";

/* =====================================================================
   Kalkulator zintegrowany: /kalkulatory/zintegrowany
   Jeden ekran, na którym wybierasz opcje (sytuacje), a pod spodem liczą się
   odpowiednie kalkulatory a–g. Dane wpisujesz raz – w „Moje dane” – i każdy
   kalkulator je podstawia. Wybór jest w adresie (?opcje=b,d,f), więc da się
   go wysłać albo dodać do zakładek.
   ===================================================================== */

export default function KalkulatorZintegrowany() {
  const { user } = useAuth() ?? {};
  const { profile, loading } = useProfile();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const surowe = params.get("opcje");
  const zAdresu = opcjeZAdresu(surowe);
  // „-” = użytkownik świadomie odznaczył wszystko (nie wracamy wtedy do opcji domyślnych z profilu).
  const wybrane = surowe === "-" ? [] : zAdresu ?? domyslneOpcje(profile);

  const przelacz = (id) => {
    const nowe = wybrane.includes(id) ? wybrane.filter((x) => x !== id) : sortuj([...wybrane, id]);
    // pusty wybór zapisujemy jako „-”, żeby nie wracać do domyślnych po odznaczeniu wszystkiego
    setParams(nowe.length ? { opcje: nowe.join(",") } : { opcje: "-" }, { replace: true });
  };

  return (
    <div className="app">
      <AppHeader />
      <main className="kalkulator-page">
        <nav className="breadcrumb" aria-label="Ścieżka">
          <Link className="breadcrumb-link" to="/">Strona główna</Link>
          <span className="breadcrumb-sep">/</span>
          <Link className="breadcrumb-link" to="/kalkulatory">Kalkulatory</Link>
          <span className="breadcrumb-sep">/</span>
          <span aria-current="page">Kalkulator zintegrowany</span>
        </nav>

        <div className="calc-head">
          <span className="calc-head-icon" aria-hidden="true">🧮</span>
          <div>
            <h1>Kalkulator zintegrowany</h1>
            <p className="lead">
              Zaznacz, co Cię dotyczy – poniżej policzymy wszystko na jednej stronie: okresy, kwoty, dokumenty i terminy.
            </p>
          </div>
        </div>

        {user ? (
          <p className="alert-inline">
            Wszystkie kalkulatory biorą dane z <Link to="/profil">Moje dane</Link> – wpisujesz je raz.
            {surowe === null && !loading && " Opcje dobraliśmy do etapu z Twojego profilu – możesz je zmienić."}
          </p>
        ) : (
          <p className="alert-inline">
            <Link to="/logowanie" state={{ from: location }}>Zaloguj się</Link> i uzupełnij „Moje dane” – wtedy każdy
            kalkulator na tej stronie sam wypełni pola.
          </p>
        )}

        <section aria-labelledby="zint-opcje">
          <h2 id="zint-opcje">Co chcesz policzyć?</h2>
          <div className="zint-opcje" role="group" aria-label="Opcje kalkulatora">
            {OPCJE.map((o) => {
              const c = getCalculator(o.slug);
              const on = wybrane.includes(o.id);
              return (
                <button type="button" key={o.id} className={`pager-chip${on ? " is-active" : ""}`} aria-pressed={on} onClick={() => przelacz(o.id)}>
                  <span aria-hidden="true">{on ? "✓ " : ""}{c.icon}</span> {o.pytanie}
                </button>
              );
            })}
          </div>
        </section>

        {wybrane.length === 0 && (
          <p className="note">Nic nie zaznaczono – wybierz co najmniej jedną opcję powyżej.</p>
        )}

        {wybrane.map((id) => {
          const o = OPCJE.find((x) => x.id === id);
          const c = getCalculator(o.slug);
          const { Component } = c;
          return (
            <section className="zint-sekcja" key={id} aria-labelledby={`zint-${id}`}>
              <h2 id={`zint-${id}`} className="zint-tytul">
                <span aria-hidden="true">{c.icon}</span> {c.title}
                <span className="note"> · kalkulator {c.letter} · <Link to={calculatorPath(c.slug)}>otwórz osobno</Link></span>
              </h2>
              <div className="calc-body">
                <Component />
              </div>
            </section>
          );
        })}

        <p className="note">
          Materiał poglądowy. Wartości wskaźników wg materiałów ZUS do zadania (stan prawny 2026); wynik nie jest decyzją
          ZUS ani pracodawcy.
        </p>
      </main>
    </div>
  );
}
