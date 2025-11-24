export const fmtFCFA = (n) =>
new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(
Number(n || 0)
);
export const pct = (num, den) => {
const d = Number(den || 0);
const n = Number(num || 0);
if (!d) return "0%";
return `${Math.round((n / d) * 100)}%`;
};
export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
