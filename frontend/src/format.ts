export const fmtPrice = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });