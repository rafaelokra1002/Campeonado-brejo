// Ícones de navegação em SVG (stroke = currentColor, acompanham a cor do texto
// do item ativo/inativo) — trocam os emojis do menu, que rendeiam diferente
// em cada aparelho.

const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

export function HomeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3.5 11.5 12 4l8.5 7.5" />
      <path d="M5.5 10v8.5a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V10" />
    </svg>
  );
}

export function ChartIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 20V11" />
      <path d="M10 20V6" />
      <path d="M16 20v-8" />
      <path d="M3 20h18" />
    </svg>
  );
}

export function BallIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8.2 14.3 10l-.9 2.7h-2.8L9.7 10Z" />
      <path d="M12 3.5V8.2M8.9 12.7l-4 1.3M15.1 12.7l4 1.3M9.6 15.9l-1.6 3.8M14.4 15.9l1.6 3.8" />
    </svg>
  );
}

export function ShieldIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3.5 19 6.3v5.4c0 4.7-3 7.7-7 8.8-4-1.1-7-4.1-7-8.8V6.3Z" />
    </svg>
  );
}

export function TargetIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
