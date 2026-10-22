/* =========================================================
   Do'kon holati (savat, promokod, bonus, oynalar) — React kontekst
   ========================================================= */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BONUS, DELIVERY, ORDER_FLOW } from "../shared/data.js";
import { Store } from "../shared/store.js";
import { som } from "../shared/format.js";
import { addToCart, bonusBalance, comboLine, defaultSize, dishLine, earnedFor, lineInfo, sanitizeCart, totals as calcTotals } from "../shared/cart.js";
import { notifyTelegram } from "../shared/telegram.js";

const ShopContext = createContext(null);
export const useShop = () => useContext(ShopContext);

export const isDocked = () => window.innerWidth > 1280;

export function ShopProvider({ children }) {
  const products = useMemo(() => Store.products(), []);
  const byId = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);

  const [cart, setCart] = useState(() => sanitizeCart(Store.get("opus_cart_v2", []), byId));
  const [promo, setPromo] = useState(() => Store.get("opus_promo", null));
  const [orderType, setOrderType] = useState("delivery");
  const [payMethod, setPayMethod] = useState("click");
  const [useBonus, setUseBonus] = useState(false);
  const [bonus, setBonus] = useState(bonusBalance);
  const [toasts, setToasts] = useState([]);
  const [confettiKey, setConfettiKey] = useState(0);
  const [orders, setOrders] = useState(() => Store.orders());

  // Oynalar
  const [ticketOpen, setTicketOpen] = useState(false);
  const [dishId, setDishId] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [pay, setPay] = useState(null); // { mode: "app"|"card"|"processing", ... }
  const [tracker, setTracker] = useState(null); // { id, fresh }

  // Saqlash
  useEffect(() => { Store.set("opus_cart_v2", cart); }, [cart]);
  useEffect(() => { Store.set("opus_promo", promo); }, [promo]);

  // Biror oyna ochiq bo'lsa — sahifa aylanmasin
  const anyOpen = ticketOpen || !!dishId || checkoutOpen || !!pay || !!tracker;
  useEffect(() => { document.body.classList.toggle("lock", anyOpen); }, [anyOpen]);

  const toastId = useRef(0);
  const toast = useCallback((msg, bad) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg, bad }]);
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, out: true } : x))), 2400);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2700);
  }, []);

  const [bumpKey, setBumpKey] = useState(0);
  const addLine = useCallback((line, name) => {
    setCart((c) => addToCart(c, line));
    setBumpKey((k) => k + 1);
    toast(`${name} savatga qo'shildi`);
  }, [toast]);

  const addDish = useCallback((id, size, extras = [], qty = 1) => {
    const p = byId[id];
    addLine(dishLine(p, size === undefined ? defaultSize(p.cat) : size, extras, qty), p.name);
  }, [byId, addLine]);

  const addCombo = useCallback((ids) => addLine(comboLine(ids, byId), "Kombo 🔥"), [byId, addLine]);

  const changeQty = useCallback((key, delta) => {
    setCart((c) => c.map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0));
  }, []);

  const state = { cart, promo, orderType, useBonus };
  const t = calcTotals(state);

  const openTicket = useCallback(() => {
    if (isDocked()) { document.getElementById("menu").scrollIntoView({ behavior: "smooth" }); return; }
    setTicketOpen(true);
  }, []);

  const openCheckout = useCallback(() => {
    const tt = calcTotals({ cart, promo, orderType, useBonus });
    if (!tt.count) return;
    if (tt.subtotal < DELIVERY.minOrder) { toast(`Minimal buyurtma — ${som(DELIVERY.minOrder)}`, true); return; }
    const c = Store.get("opus_customer", {}) || {};
    if (c.type) setOrderType(c.type);
    setTicketOpen(false);
    setCheckoutOpen(true);
  }, [cart, promo, orderType, useBonus, toast]);

  const placeOrder = useCallback((customer, payLabel) => {
    const tt = calcTotals({ cart, promo, orderType, useBonus });
    const earned = earnedFor(tt.total);
    const order = {
      id: "OP-" + String(Date.now()).slice(-6),
      createdAt: new Date().toISOString(),
      // ref — "Qayta buyurtma" uchun aynan qaysi taom va variant ekanini saqlaymiz
      items: cart.map((l) => {
        const i = lineInfo(l, byId);
        const ref = l.kind === "combo" ? { kind: "combo", items: l.items } : { kind: "dish", id: l.id, size: l.size, extras: l.extras };
        return { name: i.name, sub: i.sub, qty: l.qty, price: l.unit, ref };
      }),
      customer,
      payment: { method: payMethod, label: payLabel, paid: payMethod !== "cash" },
      promo,
      subtotal: tt.subtotal, discount: tt.discount, bonusUsed: tt.bonusUsed, bonusEarned: earned, delivery: tt.delivery, total: tt.total,
      status: "new",
    };
    Store.saveOrder(order);
    notifyTelegram(order);
    const nextBonus = bonusBalance() - tt.bonusUsed + earned;
    Store.set("opus_bonus", nextBonus);
    setBonus(nextBonus);
    setOrders(Store.orders());
    setCart([]);
    setPromo(null);
    setUseBonus(false);
    setPay(null);
    setCheckoutOpen(false);
    setConfettiKey((k) => k + 1);
    setTracker({ id: order.id, fresh: true });
    setTimeout(() => toast(`💎 +${som(earned)} bonus hisobingizga tushdi`), 1200);
  }, [cart, promo, orderType, useBonus, payMethod, byId, toast]);

  // Avvalgi buyurtmani savatga qayta qo'shish (stop-listdagi taomlar o'tkazib yuboriladi)
  const reorder = useCallback((id) => {
    const o = Store.orders().find((x) => x.id === id);
    if (!o) return;
    const byName = Object.fromEntries(products.map((p) => [p.name, p]));
    let next = cart, added = 0, skipped = 0;
    o.items.forEach((it) => {
      const r = it.ref || (byName[it.name] ? { kind: "dish", id: byName[it.name].id, size: defaultSize(byName[it.name].cat), extras: [] } : null);
      const ids = r ? (r.kind === "combo" ? r.items : [r.id]) : [];
      if (!r || !ids.every((x) => byId[x] && !byId[x].hidden)) { skipped += 1; return; }
      const line = r.kind === "combo" ? comboLine(r.items, byId, it.qty) : dishLine(byId[r.id], r.size, r.extras || [], it.qty);
      next = addToCart(next, line);
      added += 1;
    });
    setCart(next);
    setTracker(null);
    if (added) { toast(`🔁 ${added} ta taom savatga qo'shildi${skipped ? ` (${skipped} tasi hozir mavjud emas)` : ""}`); openTicket(); }
    else toast("Bu buyurtmadagi taomlar hozir mavjud emas", true);
  }, [cart, products, byId, toast, openTicket]);

  const openTracker = useCallback((id, fresh) => {
    if (!Store.orders().some((x) => x.id === id)) { toast(`"${id}" raqamli buyurtma topilmadi`, true); return; }
    setTracker({ id, fresh: !!fresh });
  }, [toast]);

  const value = {
    products, byId, cart, promo, setPromo, orderType, setOrderType, payMethod, setPayMethod, useBonus, setUseBonus,
    bonus, setBonus, totals: t, toasts, toast, bumpKey, confettiKey, setConfettiKey, orders, setOrders,
    addDish, addCombo, changeQty, ticketOpen, setTicketOpen, openTicket, dishId, setDishId,
    checkoutOpen, setCheckoutOpen, openCheckout, pay, setPay, placeOrder, tracker, setTracker, openTracker, reorder,
    BONUS, ORDER_FLOW,
  };
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}
