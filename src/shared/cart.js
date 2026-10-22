/* Savat hisob-kitobi — sof funksiyalar (React holatiga bog'liq emas) */
import { OPTIONS, COMBO, PROMO_CODES, WHEEL_PROMOS, DELIVERY, BONUS } from "./data.js";
import { Store } from "./store.js";

export function dishUnit(p, sizeId, extras) {
  const o = OPTIONS[p.cat] || {};
  const size = (o.sizes || []).find((s) => s.id === sizeId);
  const ex = (o.extras || []).filter((e) => extras.includes(e.id));
  return p.price + (size ? size.add : 0) + ex.reduce((s, e) => s + e.add, 0);
}

export function defaultSize(cat) {
  const sizes = (OPTIONS[cat] || {}).sizes || [];
  return (sizes.find((s) => s.add === 0) || sizes[0] || {}).id || null;
}

export function comboUnit(ids, byId) {
  const full = ids.reduce((s, id) => s + byId[id].price, 0);
  return Math.round((full * (1 - COMBO.discount / 100)) / 1000) * 1000;
}

export const comboItems = (g, byId) => g.items.filter((id) => byId[id] && !byId[id].hidden);

export function dishLine(p, size = defaultSize(p.cat), extras = [], qty = 1) {
  const ex = [...extras].sort();
  return { key: [p.id, size, ex.join("+")].join("|"), kind: "dish", id: p.id, size, extras: ex, qty, unit: dishUnit(p, size, ex) };
}

export function comboLine(ids, byId, qty = 1) {
  return { key: "combo|" + ids.join("+"), kind: "combo", items: ids, qty, unit: comboUnit(ids, byId) };
}

export function lineInfo(l, byId) {
  if (l.kind === "combo") {
    const items = l.items.map((id) => byId[id]);
    return { name: "Kombo 🔥", sub: items.map((p) => p.name).join(" + "), img: items[0] };
  }
  const p = byId[l.id];
  const o = OPTIONS[p.cat] || {};
  const size = (o.sizes || []).find((s) => s.id === l.size);
  const ex = (o.extras || []).filter((e) => l.extras.includes(e.id)).map((e) => e.name);
  const sub = [size && size.add !== 0 ? size.name : "", ...ex].filter(Boolean).join(", ");
  return { name: p.name, sub, img: p };
}

// Savatni mavjud mahsulotlar bo'yicha tozalab, narxlarni qayta hisoblash (admin narxni o'zgartirgan bo'lishi mumkin)
export function sanitizeCart(cart, byId) {
  return cart
    .filter((l) => (l.kind === "combo" ? l.items : [l.id]).every((id) => byId[id] && !byId[id].hidden))
    .map((l) => ({ ...l, unit: l.kind === "combo" ? comboUnit(l.items, byId) : dishUnit(byId[l.id], l.size, l.extras) }));
}

export function addToCart(cart, line) {
  const found = cart.find((l) => l.key === line.key);
  if (found) return cart.map((l) => (l === found ? { ...l, qty: Math.min(l.qty + line.qty, 50) } : l));
  return [...cart, line];
}

// Admin promokodlari + omad g'ildiragi kodlari
export const promoOf = (code) => (code && (PROMO_CODES[code] || WHEEL_PROMOS[code])) || null;
export const bonusBalance = () => Math.max(0, Math.round(Store.get("opus_bonus", 0)));
export const earnedFor = (total) => Math.round((total * BONUS.rate) / 100 / 100) * 100;

export function totals({ cart, promo: code, orderType, useBonus }) {
  const subtotal = cart.reduce((s, l) => s + l.unit * l.qty, 0);
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const promo = promoOf(code);
  const promoOk = !!promo && !(promo.min && subtotal < promo.min);
  const discount = promoOk && promo.type === "percent" ? Math.round((subtotal * promo.value) / 100) : 0;
  const free = subtotal >= DELIVERY.freeFrom || (promoOk && promo.type === "delivery");
  const delivery = !count || orderType === "pickup" || free ? 0 : DELIVERY.fee;
  // Bonus bilan taomlar narxining ko'pi bilan BONUS.maxShare foizini to'lash mumkin (100 so'mgacha yaxlitlab)
  const bonusMax = Math.floor(((subtotal - discount) * BONUS.maxShare) / 100 / 100) * 100;
  const bonusUsed = useBonus ? Math.min(bonusBalance(), bonusMax) : 0;
  return { subtotal, count, promo, promoOk, discount, delivery, bonusMax, bonusUsed, total: subtotal - discount - bonusUsed + delivery };
}
