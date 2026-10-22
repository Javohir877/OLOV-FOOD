/* Raqam, pul, telefon va karta bilan ishlash */

export const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
export const som = (n) => `${fmt(n)} so'm`;
export const compact = (n) => (n >= 1e6 ? +(n / 1e6).toFixed(1) + "M" : n >= 1e3 ? Math.round(n / 1e3) + "K" : String(n));
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function maskPhone(v) {
  let d = v.replace(/\D/g, "");
  if (!d.startsWith("998")) d = "998" + d;
  d = d.slice(0, 12);
  return "+" + [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)].filter(Boolean).join(" ");
}

export function cardBrand(d) {
  if (/^(8600|5614)/.test(d)) return "uzcard";
  if (/^9860/.test(d)) return "humo";
  if (/^4/.test(d)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "mastercard";
  return null;
}

export function luhn(d) {
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = +d[d.length - 1 - i];
    if (i % 2) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  }
  return sum % 10 === 0;
}

export const WEEK_SHORT = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];
export const WEEK_FULL = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

export function timeAgo(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "hozirgina";
  if (m < 60) return `${m} daqiqa oldin`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} soat oldin`;
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
