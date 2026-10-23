/* Ish vaqti va "Kun taklifi" — sayt va admin uchun umumiy */
import { SETTINGS } from "./data.js";

const mins = (s) => { const [h, m] = String(s || "0:0").split(":").map(Number); return h * 60 + (m || 0); };

// Yopilish vaqti ochilishdan kichik bo'lsa — yarim tundan keyin yopiladi (masalan 10:00–03:00)
export function isOpenAt(open, close, now = new Date()) {
  const t = now.getHours() * 60 + now.getMinutes();
  const o = mins(open), c = mins(close);
  if (o === c) return true; // 24/7
  return c > o ? t >= o && t < c : t >= o || t < c;
}
export const isOpenNow = () => isOpenAt(SETTINGS.open, SETTINGS.close);

const MAIN_CATS = ["burger", "pizza", "lavash", "chicken", "hotdog"];

// Bugungi "Kun taklifi": { product, percent, price, endsAt } yoki null
export function dealToday(products, now = new Date()) {
  const d = SETTINGS.deal || {};
  if (d.mode === "off" || !(d.percent > 0)) return null;
  let product = null;
  if (d.mode === "fixed") product = products.find((p) => p.id === d.id && !p.hidden) || null;
  else {
    const list = products.filter((p) => !p.hidden && MAIN_CATS.includes(p.cat));
    if (list.length) {
      const day = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
      product = list[day % list.length];
    }
  }
  if (!product) return null;
  const endsAt = new Date(now); endsAt.setHours(24, 0, 0, 0);
  const price = Math.round((product.price * (1 - d.percent / 100)) / 1000) * 1000;
  return { product, percent: d.percent, price, endsAt };
}
