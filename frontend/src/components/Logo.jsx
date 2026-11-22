/* Logo RodzicPlus – znak „człowiek +”.
   Okrągła głowa, pionowy pień i pozioma belka tworzą jednocześnie
   postać człowieka i znak „+”: rodzic plus dziecko, świadczenie plus.
   Kafelek ma lekko zaokrąglone narożniki – przyjaźnie, ale spójnie
   z geometrią całego interfejsu.

   variant="on-brand" – biała kafla z zielonym znakiem (np. na zielonym pasku
   nagłówka); domyślnie zielona kafla z białym znakiem. */

export default function Logo({
  size = 32,
  className = "brand-mark",
  variant = "brand",
}) {
  const onBrand = variant === "on-brand";
  const ink = onBrand
    ? "var(--color-primary, #007934)"
    : "#ffffff";
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        width="32"
        height="32"
        rx="8"
        fill={onBrand ? "#ffffff" : "var(--color-primary, #007934)"}
      />
      {/* głowa */}
      <circle cx="16" cy="9.7" r="3.1" fill={ink} />
      {/* pień + belka = „+” */}
      <g
        stroke={ink}
        strokeWidth="3.4"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M16 14.6v10.4" />
        <path d="M9.2 19.4h13.6" />
      </g>
    </svg>
  );
}
