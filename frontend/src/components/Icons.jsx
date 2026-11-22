/* Minimalny zestaw ikon liniowych (24×24, stroke = currentColor).
   Wszędzie tam, gdzie były emoji – emoji w interfejsie wyglądają „z generatora”,
   spójne kreski wyglądają zaprojektowane. Dodawanie: dopisz nazwę w PATHS. */

const PATHS = {
  /* ZUS / urząd */
  bank: (
    <>
      <path d="M3.5 9.5 12 4l8.5 5.5" />
      <path d="M5.5 10v8M9.7 10v8M14.3 10v8M18.5 10v8" />
      <path d="M3.5 19.5h17" />
    </>
  ),
  /* pojedynczy dokument */
  doc: (
    <>
      <path d="M14.5 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6.5z" />
      <path d="M14.5 3v3.5H18" />
    </>
  ),
  /* stos dokumentów / wniosek */
  docs: (
    <>
      <path d="M14.5 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6.5z" />
      <path d="M14.5 3v3.5H18" />
      <path d="M9 12h6M9 15.5h4" />
    </>
  ),
  /* kalkulator */
  calc: (
    <>
      <rect x="5.5" y="3" width="13" height="18" rx="1" />
      <path d="M9 7.5h6" />
      <path d="M9 12h.01M12 12h.01M15 12h.01M9 15h.01M12 15h.01M15 15h.01" />
    </>
  ),
  /* ołówek / edycja */
  pencil: (
    <>
      <path d="M4 20l1.2-4.2L16.4 4.6a2 2 0 0 1 2.9 0l.9.9a2 2 0 0 1 0 2.9L9 19.6z" />
      <path d="M14.5 6.5 17.5 9.5" />
    </>
  ),
  /* kalendarz */
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="1" />
      <path d="M8 3.5v4M16 3.5v4M4 10.5h16" />
      <path d="M10 15h4" />
    </>
  ),
  /* wsparcie */
  heart: (
    <path d="M20.6 5.1a5 5 0 0 0-7.1 0L12 6.6l-1.5-1.5a5 5 0 0 0-7.1 7.1l8.6 8.6 8.6-8.6a5 5 0 0 0 0-7.1z" />
  ),
  /* informacja */
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8.3h.01M12 11.5V16" />
    </>
  ),
  /* zasiłek chorobowy – puls */
  pulse: <path d="M3 12.5h4l2.5-6 4 11 2.5-5h5" />,
  /* zasiłek macierzyński – niemowlę */
  baby: (
    <>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M6.5 20.5c0-3.5 2.4-6.5 5.5-6.5s5.5 3 5.5 6.5" />
      <path d="M12 11.5v2.5" />
    </>
  ),
  /* łączenie urlopu z pracą – dwa pierścienie */
  rings: (
    <>
      <circle cx="9" cy="9" r="5" />
      <circle cx="15" cy="15" r="5" />
    </>
  ),
  /* oboje rodziców */
  family: (
    <>
      <circle cx="8.5" cy="8" r="3" />
      <path d="M3 20.5c0-3 2.4-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M14 20.5c0-2.2 1.2-3.7 3-3.7s3 1.5 3 3.7" />
    </>
  ),
  /* adopcja / dom */
  home: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 9.7V20h12V9.7" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),
  /* pieniądze / podstawa wymiaru */
  banknote: (
    <>
      <rect x="3" y="6.5" width="18" height="11" rx="1" />
      <circle cx="12" cy="12" r="2.7" />
      <path d="M6.3 12h.01M17.7 12h.01" />
    </>
  ),
  /* osoba (menu dla niezalogowanych, awatary) */
  person: (
    <>
      <circle cx="12" cy="7.8" r="3.4" />
      <path d="M5.2 20.4c0-3.8 3-6.4 6.8-6.4s6.8 2.6 6.8 6.4" />
    </>
  ),
  /* dokumenty / spis */
  clipboard: (
    <>
      <rect x="5.5" y="4" width="13" height="17" rx="1" />
      <rect x="9" y="2.2" width="6" height="3.6" rx="1" />
      <path d="M9 11.5h6M9 15h4" />
    </>
  ),
};

export default function Icon({ name, ...rest }) {
  const body = PATHS[name] ?? PATHS.info;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {body}
    </svg>
  );
}
