import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import { useAuth } from "../auth.js";
import { useProfile } from "../profile.js";

// Kluczowe pola profilu, które najczęściej brakują kalkulatorom (do paska uzupełnienia).
const KEY_FIELDS = [
  ["ubezpieczony", "adres"],
  ["ubezpieczony", "rachunek"],
  ["ubezpieczony", "statusUbezpieczenia"],
  ["ubezpieczony", "podstawaWymiaru"],
  ["platnik", "nazwa"],
  ["platnik", "nip"],
  ["dziecko", "dataUrodzenia"],
];

export default function Dashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();

  const dziecko = profile?.dziecko ?? {};
  const maDaneDziecka = [
    dziecko.imie,
    dziecko.nazwisko,
    dziecko.pesel,
    dziecko.dataUrodzenia,
    dziecko.przewidywanaDataPorodu,
    dziecko.dataPrzyjecia,
  ].some((value) => value !== "" && value !== null && value !== undefined);
  const maskedChildPesel = dziecko.pesel
    ? `${"*".repeat(Math.max(0, String(dziecko.pesel).length - 4))}${String(dziecko.pesel).slice(-4)}`
    : "";

  const filled = profile
    ? KEY_FIELDS.filter(([s, f]) => {
        const v = profile[s][f];
        return v !== "" && v !== null && v !== undefined;
      }).length
    : 0;
  const profileComplete = profile && filled === KEY_FIELDS.length;

  return (
    <div className="app">
      <AppHeader />

      <main className="container">
        <h1>Cześć, {user.imie}! 👋</h1>
        <p className="lead">Co chcesz teraz sprawdzić?</p>

        <section className="info-card" aria-label="Twoje dane">
          <div className="info-card-heading">
            <h2>Twoje dane z mObywatela</h2>
            <Link className="text-link" to="/profil">Edytuj</Link>
          </div>
          <dl className="data-list">
            <div><dt>Imię i nazwisko</dt><dd>{user.imie} {user.nazwisko}</dd></div>
            <div><dt>PESEL</dt><dd>{user.peselMasked}</dd></div>
            {profile?.ubezpieczony?.adres && (
              <div><dt>Adres zamieszkania</dt><dd>{profile.ubezpieczony.adres}</dd></div>
            )}
            {profile?.ubezpieczony?.rachunek && (
              <div><dt>Rachunek bankowy</dt><dd>{profile.ubezpieczony.rachunek}</dd></div>
            )}
          </dl>
        </section>

        {maDaneDziecka && (
          <section className="info-card" aria-label="Dane dziecka">
            <div className="info-card-heading">
              <h2>Dane dziecka</h2>
              <Link className="text-link" to="/profil?krok=dziecko">Edytuj</Link>
            </div>
            <dl className="data-list">
              {(dziecko.imie || dziecko.nazwisko) && (
                <div>
                  <dt>Imię i nazwisko</dt>
                  <dd>{dziecko.imie} {dziecko.nazwisko}</dd>
                </div>
              )}
              {maskedChildPesel && <div><dt>PESEL</dt><dd>{maskedChildPesel}</dd></div>}
              {dziecko.dataUrodzenia && (
                <div><dt>Data urodzenia</dt><dd>{new Date(dziecko.dataUrodzenia).toLocaleDateString("pl-PL")}</dd></div>
              )}
              {!dziecko.dataUrodzenia && dziecko.przewidywanaDataPorodu && (
                <div><dt>Przewidywana data porodu</dt><dd>{new Date(dziecko.przewidywanaDataPorodu).toLocaleDateString("pl-PL")}</dd></div>
              )}
              {dziecko.dataPrzyjecia && (
                <div><dt>Data przyjęcia na wychowanie</dt><dd>{new Date(dziecko.dataPrzyjecia).toLocaleDateString("pl-PL")}</dd></div>
              )}
            </dl>
          </section>
        )}

        <Link className="calc-cta" to="/wnioski">
          <span className="calc-cta-icon" aria-hidden="true">🗂️</span>
          <span className="calc-cta-body">
            <span className="calc-cta-title">Złóż wniosek – co mi przysługuje?</span>
            <span className="calc-cta-desc">
              Wybierz wniosek, a sprawdzimy każdy jego wariant: co przysługuje, czego nie (i dlaczego), gdzie i do kiedy złożyć.
            </span>
          </span>
          <span className="calc-cta-arrow" aria-hidden="true">→</span>
        </Link>

        <Link className="calc-cta" to="/kalkulatory">
          <span className="calc-cta-icon" aria-hidden="true">🧮</span>
          <span className="calc-cta-body">
            <span className="calc-cta-title">Policz swoje świadczenia</span>
            <span className="calc-cta-desc">
              Siedem kalkulatorów: chorobowy, macierzyński, rodzicielski, adopcja, podstawa wymiaru i dokumenty.
            </span>
          </span>
          <span className="calc-cta-arrow" aria-hidden="true">→</span>
        </Link>

        {!profileComplete && (
          <Link className="calc-cta" to="/profil">
            <span className="calc-cta-icon" aria-hidden="true">📝</span>
            <span className="calc-cta-body">
              <span className="calc-cta-title">Uzupełnij swoje dane</span>
              <span className="calc-cta-desc">
                Wpisz je raz, a kalkulatory same je podstawią
                {profile ? ` (uzupełniono ${filled} z ${KEY_FIELDS.length} kluczowych pól).` : "."}
              </span>
            </span>
            <span className="calc-cta-arrow" aria-hidden="true">→</span>
          </Link>
        )}

        <Link className="calc-cta" to="/zus">
          <span className="calc-cta-icon" aria-hidden="true">🏛️</span>
          <span className="calc-cta-body">
            <span className="calc-cta-title">Moje dane z ZUS</span>
            <span className="calc-cta-desc">
              Ubezpieczenie, podstawa wymiaru, zwolnienia e-ZLA, zaświadczenie o niezaleganiu i wnioski w PUE (symulacja).
            </span>
          </span>
          <span className="calc-cta-arrow" aria-hidden="true">→</span>
        </Link>

        <Link className="calc-cta" to="/odpis-aktu">
          <span className="calc-cta-icon" aria-hidden="true">📄</span>
          <span className="calc-cta-body">
            <span className="calc-cta-title">Odpis aktu urodzenia</span>
            <span className="calc-cta-desc">Wniosek z danymi dziecka z „Moje dane” (symulacja usługi gov.pl).</span>
          </span>
          <span className="calc-cta-arrow" aria-hidden="true">→</span>
        </Link>
      </main>
    </div>
  );
}
