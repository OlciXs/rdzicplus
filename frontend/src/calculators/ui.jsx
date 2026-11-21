import { useId } from "react";

/* Wspólne klocki UI dla kalkulatorów - wszystkie klasy są w themes.css. */

export function Badge({ tone = "ok", children }) {
  return <span className={`badge b-${tone}`}>{children}</span>;
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function TextInput({ value, onChange, ...rest }) {
  return (
    <input
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    />
  );
}

export function NumberInput({ value, onChange, ...rest }) {
  return (
    <input
      className="input"
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    />
  );
}

export function DateInput({ value, onChange, ...rest }) {
  return (
    <input
      className="input"
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    />
  );
}

export function Select({ value, onChange, options, ...rest }) {
  return (
    <select
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    >
      {options.map((o) =>
        typeof o === "string" ? (
          <option key={o} value={o}>{o}</option>
        ) : (
          <option key={o.value} value={o.value}>{o.label}</option>
        )
      )}
    </select>
  );
}

export function Check({ checked, onChange, children }) {
  return (
    <label className="check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{children}</span>
    </label>
  );
}

export function Section({ title, children, note }) {
  return (
    <section className="calc-group">
      <h3 className="calc-group-title">{title}</h3>
      <div className="calc-grid">{children}</div>
      {note && <p className="note">{note}</p>}
    </section>
  );
}

/* Blok wyniku: tytuł + dowolna treść */
export function Result({ title, children, defaultOpen = true }) {
  return (
    <details className="result" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="result-body">{children}</div>
    </details>
  );
}

/* Tabela wyników: cols = [{label, align}] , rows = [[cell, cell, ...]] */
export function ResultTable({ cols, rows }) {
  return (
    <div className="table-wrap">
      <table className="calc-table">
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th key={i} className={c.align === "right" ? "r" : undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={r.total ? "total" : undefined}>
              {r.cells.map((cell, j) => (
                <td key={j} className={r.total || cols[j]?.align === "right" ? "r" : undefined}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Bullets({ items }) {
  return (
    <ul className="pts">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

export function List({ title, items, tone }) {
  if (!items.length) return null;
  return (
    <ul className={`alert-list ${tone}`}>
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

/**
 * Pasek „dane z profilu”: pokazuje, co kalkulator podstawił z „Moich danych”.
 * Dzięki temu użytkownik wie, że nie musi nic przepisywać — i co ewentualnie zmienić.
 *
 * @param {object} props
 * @param {Array<{pole: string, etykieta: string, wartosc: string}>} props.pola
 * @param {boolean} props.zalogowany
 */
export function ProfilInfo({ pola = [], zalogowany }) {
  if (!zalogowany) {
    return (
      <p className="note" role="status">
        Wypełnij „Moje dane” po zalogowaniu — kalkulatory podstawią Twoje kwoty i daty same.
      </p>
    );
  }
  if (!pola.length) {
    return (
      <p className="note" role="status">
        Brak danych w profilu dla tego kalkulatora — uzupełnij „Moje dane”, żeby nie wpisywać ich ręcznie.
      </p>
    );
  }
  return (
    <div className="profil-info" role="status">
      <Badge>Z PROFILU</Badge>
      <span className="profil-info-opis">
        Te wartości wzięliśmy z „Moich danych” — możesz je zmienić poniżej:
      </span>
      <ul className="profil-info-lista">
        {pola.map((p) => (
          <li key={p.pole}>
            <strong>{p.etykieta}:</strong> {p.wartosc}
          </li>
        ))}
      </ul>
    </div>
  );
}
