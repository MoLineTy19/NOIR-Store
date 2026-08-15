/* Иконки без библиотеки: набор фиксированный, а каждый килобайт в Mini App на счету. */
type Props = { size?: number };

const svg = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const IconBag = ({ size = 19 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
    <path d="M6.2 8h11.6l-1.1 10.4a2.2 2.2 0 0 1-2.2 2h-5a2.2 2.2 0 0 1-2.2-2Z" />
    <path d="M9 8V7a3 3 0 0 1 6 0v1" />
  </svg>
);

export const IconUser = ({ size = 19 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
    <circle cx="12" cy="8.2" r="3.4" />
    <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
  </svg>
);

export const IconSearch = ({ size = 17 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
    <circle cx="11" cy="11" r="6" />
    <path d="M15.6 15.6 20 20" />
  </svg>
);

export const IconClose = ({ size = 14 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconPlus = ({ size = 13 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...svg} strokeWidth={2.2}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconMinus = ({ size = 13 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...svg} strokeWidth={2.2}>
    <path d="M5 12h14" />
  </svg>
);

export const IconCheck = ({ size = 36 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff"
    strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5 10 17.5 19 7.5" />
  </svg>
);

export const IconCard = ({ size = 19 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
    <rect x="3" y="5.5" width="18" height="13" rx={2.5} />
    <path d="M3 10h18" />
  </svg>
);

export const IconRefresh = ({ size = 16 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
    <path d="M20 12a8 8 0 1 1-2.3-5.6" />
    <path d="M20 3v4h-4" />
  </svg>
);