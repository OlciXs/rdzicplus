import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import Icon from "../components/Icons.jsx";
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
  const dzieci = Array.isArray(dziecko.dzieci) && dziecko.dzieci.length
    ? dziecko.dzieci
    : [(dziecko)];
  const maDaneDziecka = [
    dziecko.imie,
    dziecko.nazwisko,
    dziecko.pesel,
    dziecko.dataUrodzenia,
    dziecko.przewidywanaDataPorodu,
    dziecko.dataPrzyjecia,
  ].some((value) => value !== "" && value !== null && value !== undefined);
  const maskedChildPesel = (pesel) => pesel
    ? `${"*".repeat(Math.max(0, String(pesel).length - 4))}${String(pesel).slice(-4)}`
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
        <h1>Cześć, {user.imie}</h1>
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
              {dzieci.map((d, i) => (
                <div key={i}>
                  <dt>{dzieci.length > 1 ? `Dziecko ${i + 1}` : "Imię i nazwisko"}</dt>
                  <dd>{[d.imie, d.nazwisko].filter(Boolean).join(" ") || "-"}</dd>
                </div>
              ))}
              {dzieci.some((d) => d.pesel) && (
                <div><dt>PESEL-e dzieci</dt><dd>{dzieci.map((d, i) => d.pesel ? `${dzieci.length > 1 ? `#${i + 1} ` : ""}${maskedChildPesel(d.pesel)}` : null).filter(Boolean).join(", ")}</dd></div>
              )}
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
          <span className="calc-cta-icon"><Icon name="docs" /></span>
          <span className="calc-cta-body">
            <span className="calc-cta-title">Złóż wniosek – co mi przysługuje?</span>
            <span className="calc-cta-desc">
              Wybierz wniosek, a sprawdzimy każdy jego wariant: co przysługuje, czego nie (i dlaczego), gdzie i do kiedy złożyć.
            </span>
          </span>
          <span className="calc-cta-arrow" aria-hidden="true">→</span>
        </Link>

        <Link className="calc-cta" to="/kalkulatory">
          <span className="calc-cta-icon"><Icon name="calc" /></span>
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
            <span className="calc-cta-icon"><Icon name="pencil" /></span>
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
          <span className="calc-cta-icon"><Icon name="bank" /></span>
          <span className="calc-cta-body">
            <span className="calc-cta-title">Moje dane z ZUS</span>
            <span className="calc-cta-desc">
              Ubezpieczenie, podstawa wymiaru, zwolnienia e-ZLA, zaświadczenie o niezaleganiu i wnioski w PUE (symulacja).
            </span>
          </span>
          <span className="calc-cta-arrow" aria-hidden="true">→</span>
        </Link>

        <Link className="calc-cta" to="/odpis-aktu">
          <span className="calc-cta-icon"><Icon name="doc" /></span>
          <span className="calc-cta-body">
            <span className="calc-cta-title">Odpis aktu urodzenia</span>
            <span className="calc-cta-desc">Wniosek z danymi dziecka z „Moje dane” (symulacja usługi gov.pl).</span>
          </span>
          <span className="calc-cta-arrow" aria-hidden="true">→</span>
        </Link>

        <Link className="calc-cta" to="/kalendarz">
          <span className="calc-cta-icon"><Icon name="calendar" /></span>
          <span className="calc-cta-body">
            <span className="calc-cta-title">Kalendarz terminów</span>
            <span className="calc-cta-desc">Ostateczne terminy wniosków i przypomnienia tydzień wcześniej.</span>
          </span>
          <span className="calc-cta-arrow" aria-hidden="true">→</span>
        </Link>

        <Link className="calc-cta" to="/wsparcie">
          <span className="calc-cta-icon"><Icon name="heart" /></span>
          <span className="calc-cta-body">
            <span className="calc-cta-title">Wsparcie w sytuacjach szczególnych</span>
            <span className="calc-cta-desc">Hospicja i fundacje dla wcześniaków oraz rodzin po stracie dziecka.</span>
          </span>
          <span className="calc-cta-arrow" aria-hidden="true">→</span>
        </Link>

        <Link className="calc-cta" to="/informacje">
          <span className="calc-cta-icon"><Icon name="info" /></span>
          <span className="calc-cta-body">
            <span className="calc-cta-title">Informacje urzędowe i przekierowania</span>
            <span className="calc-cta-desc">ZUS, gov.pl, Ministerstwo Rodziny i Państwowa Inspekcja Pracy.</span>
          </span>
          <span className="calc-cta-arrow" aria-hidden="true">→</span>
        </Link>
      </main>
    </div>
  );
}
