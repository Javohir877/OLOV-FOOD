/* =========================================================
   Brauzer xotirasi (localStorage) — sayt va admin uchun umumiy.
   Kalit nomlari eski (React'dan oldingi) versiya bilan bir xil,
   shuning uchun mijozlarning savati va buyurtmalari saqlanib qoladi.

   Sozlamalar uch qatlamda qo'llanadi (keyingisi oldingisini bosadi):
     1) data.js dagi standart qiymatlar
     2) config.json — admin "Saytga chiqarish" orqali hamma uchun e'lon qilgan sozlamalar
     3) shu brauzerdagi admin qoralamasi (opus_settings, opus_products, opus_promos)
   ========================================================= */
import { DEFAULT_PRODUCTS, DELIVERY, COMBO, SETTINGS, PROMO_CODES, ORDER_FLOW } from "./data.js";

let REMOTE = null; // config.json mazmuni (bo'lmasa — null)

export const Store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage bloklangan */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* */ }
  },
  products() { return this.get("opus_products", null) || (REMOTE && REMOTE.products) || DEFAULT_PRODUCTS; },
  publishedProducts() { return (REMOTE && REMOTE.products) || DEFAULT_PRODUCTS; },
  remote() { return REMOTE; },
  orders() { return this.get("opus_orders", []); },
  saveOrder(order) { this.set("opus_orders", [order, ...this.orders()]); },
  updateOrder(id, patch) { this.set("opus_orders", this.orders().map((o) => (o.id === id ? { ...o, ...patch } : o))); },

  // Buyurtma holati. "Demo rejim"da admin qo'lda o'zgartirmaguncha holat vaqt bilan o'zi siljiydi.
  statusOf(o) {
    if (o.status === "cancelled") return "cancelled";
    if (o.statusManual || !SETTINGS.autoStatus) return o.status;
    const sec = (Date.now() - new Date(o.createdAt)) / 1000;
    return ORDER_FLOW[sec < 12 ? 0 : sec < 35 ? 1 : sec < 65 ? 2 : 3];
  },
};

/* config.json va admin qoralamasini joriy qiymatlarga qo'llash */
export function applyOverrides() {
  const s = { ...((REMOTE && REMOTE.settings) || {}), ...Store.get("opus_settings", {}) };
  ["fee", "freeFrom", "minOrder"].forEach((k) => { if (s[k] != null) DELIVERY[k] = +s[k]; });
  if (s.comboDiscount != null) COMBO.discount = +s.comboDiscount;
  if (s.autoStatus != null) SETTINGS.autoStatus = !!s.autoStatus;
  ["open", "close", "phone"].forEach((k) => { if (s[k]) SETTINGS[k] = s[k]; });
  if (s.announce != null) SETTINGS.announce = s.announce; // bo'sh e'lon — qator ko'rinmaydi
  if (s.tips != null) SETTINGS.tips = !!s.tips;
  if (s.deal) SETTINGS.deal = { ...SETTINGS.deal, ...s.deal };

  const promos = Store.get("opus_promos", null) || (REMOTE && REMOTE.promos);
  if (promos) {
    Object.keys(PROMO_CODES).forEach((k) => delete PROMO_CODES[k]);
    Object.assign(PROMO_CODES, promos);
  }
}

/* Saytdagi config.json ni yuklash (sahifa ochilganda bir marta) */
export async function loadRemoteConfig(url = "config.json") {
  try {
    const r = await fetch(url, { cache: "no-cache" });
    if (r.ok) {
      const cfg = await r.json();
      if (cfg && cfg.app === "olov-food") REMOTE = cfg;
    }
  } catch (e) { /* config.json hali yo'q yoki internet yo'q — standart qiymatlar ishlaydi */ }
  applyOverrides();
  return REMOTE;
}

applyOverrides();
