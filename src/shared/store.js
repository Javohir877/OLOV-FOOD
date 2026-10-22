/* =========================================================
   Brauzer xotirasi (localStorage) — sayt va admin uchun umumiy.
   Kalit nomlari eski (React'dan oldingi) versiya bilan bir xil,
   shuning uchun mijozlarning savati va buyurtmalari saqlanib qoladi.
   ========================================================= */
import { DEFAULT_PRODUCTS, DELIVERY, COMBO, SETTINGS, PROMO_CODES, ORDER_FLOW } from "./data.js";

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
  products() { return this.get("opus_products", DEFAULT_PRODUCTS); },
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

/* Admin paneldagi o'zgarishlarni (narxlar, promokodlar, sozlamalar) qo'llash */
export function applyOverrides() {
  const s = Store.get("opus_settings", null);
  if (s) {
    ["fee", "freeFrom", "minOrder"].forEach((k) => { if (s[k] != null) DELIVERY[k] = +s[k]; });
    if (s.comboDiscount != null) COMBO.discount = +s.comboDiscount;
    if (s.autoStatus != null) SETTINGS.autoStatus = !!s.autoStatus;
  }
  const promos = Store.get("opus_promos", null);
  if (promos) {
    Object.keys(PROMO_CODES).forEach((k) => delete PROMO_CODES[k]);
    Object.assign(PROMO_CODES, promos);
  }
}
applyOverrides();
