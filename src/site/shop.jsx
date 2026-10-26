/* =========================================================
   Do'kon holati (savat, promokod, bonus, oynalar) — React kontekst
   ========================================================= */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BONUS, DELIVERY, ORDER_FLOW } from "../shared/data.js";
import { Store } from "../shared/store.js";
import { som } from "../shared/format.js";
import { addToCart, bonusBalance, comboLine, defaultSize, dishLine, earnedFor, lineInfo, sanitizeCart, setDeal, totals as calcTotals } from "../shared/cart.js";
import { notifyRating, notifyTelegram } from "../shared/telegram.js";
import { dealToday, isOpenNow } from "../shared/hours.js";
import { sound } from "../shared/sound.js";
import { haptic, setBackButton, tgUser } from "../shared/tg.js";

const ShopContext = createContext(null);
export const useShop = () => useContext(ShopContext);

export const isDocked = () => window.innerWidth > 1280;

export function ShopProvider({ children }) {
  const products = useMemo(() => Store.products(), []);
  const byId = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  // Kun taklifi narxi savat hisobiga ta'sir qiladi — savatni tiklashdan oldin o'rnatamiz
  const deal = useMemo(() => { const d = dealToday(products); setDeal(d); return d; }, [products]);

  const [cart, setCart] = useState(() => sanitizeCart(Store.get("opus_cart_v2", []), byId));
  const [tip, setTip] = useState(0);
  const [open, setOpen] = useState(isOpenNow);
  useEffect(() => { const t = setInterval(() => setOpen(isOpenNow()), 60000); return () => clearInterval(t); }, []);
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

  // Telegram ichida: tepadagi "Orqaga" tugmasi eng ustki oynani yopadi
  useEffect(() => {
    if (!anyOpen) { setBackButton(null); return; }
    setBackButton(() => {
      if (pay) { if (pay.mode !== "processing") setPay(null); } // to'lov ketayotganda to'xtatmaymiz
      else if (checkoutOpen) setCheckoutOpen(false);
      else if (dishId) setDishId(null);
      else if (tracker) setTracker(null);
      else setTicketOpen(false);
    });
  }, [anyOpen, pay, checkoutOpen, dishId, tracker]);

  const toastId = useRef(0);
  const toast = useCallback((msg, bad) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg, bad }]);
    if (bad) { sound.play("error"); haptic("error"); }
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, out: true } : x))), 2400);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2700);
  }, []);

  const [bumpKey, setBumpKey] = useState(0);
  const addLine = useCallback((line, name) => {
    setCart((c) => addToCart(c, line));
    setBumpKey((k) => k + 1);
    sound.play("add");
    haptic("medium");
    toast(`${name} savatga qo'shildi`);
  }, [toast]);

  const addDish = useCallback((id, size, extras = [], qty = 1) => {
    const p = byId[id];
    addLine(dishLine(p, size === undefined ? defaultSize(p.cat) : size, extras, qty), p.name);
  }, [byId, addLine]);

  const addCombo = useCallback((ids) => addLine(comboLine(ids, byId), "Kombo 🔥"), [byId, addLine]);

  const changeQty = useCallback((key, delta) => {
    sound.play(delta > 0 ? "plus" : "minus");
    haptic("light");
    setCart((c) => c.map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0));
  }, []);

  const state = { cart, promo, orderType, useBonus, tip };
  const t = calcTotals(state);

  const openTicket = useCallback(() => {
    if (isDocked()) { document.getElementById("menu").scrollIntoView({ behavior: "smooth" }); return; }
    setTicketOpen(true);
    sound.play("open");
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
    const tt = calcTotals({ cart, promo, orderType, useBonus, tip });
    const earned = earnedFor(tt.total - tt.tip); // choy pulidan bonus berilmaydi
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
      subtotal: tt.subtotal, discount: tt.discount, bonusUsed: tt.bonusUsed, bonusEarned: earned, delivery: tt.delivery, tip: tt.tip, total: tt.total,
      preorder: !isOpenNow(), // ish vaqtidan tashqari — ochilgach tayyorlanadi
      tg: tgUser(), // Telegram bot ichidan berilgan bo'lsa — mijozning Telegram akkaunti
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
    setTip(0);
    setPay(null);
    setCheckoutOpen(false);
    setConfettiKey((k) => k + 1);
    sound.play("order");
    haptic("success");
    setTracker({ id: order.id, fresh: true });
    setTimeout(() => toast(`💎 +${som(earned)} bonus hisobingizga tushdi`), 1200);
  }, [cart, promo, orderType, useBonus, tip, payMethod, byId, toast]);

  // Yetkazilgandan keyin mijoz bahosi — buyurtmaga yoziladi va Telegram'ga yuboriladi
  const rateOrder = useCallback((id, stars, comment) => {
    Store.updateOrder(id, { rating: { stars, comment: comment.trim(), at: new Date().toISOString() } });
    const o = Store.orders().find((x) => x.id === id);
    if (o) notifyRating(o);
    setOrders(Store.orders());
    sound.play(stars >= 4 ? "win" : "success");
    toast(stars >= 4 ? "Rahmat! Bahoyingiz biz uchun muhim 🧡" : "Rahmat! Kamchilikni albatta tuzatamiz 🙏");
  }, [toast]);

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
    deal, open, tip, setTip, rateOrder,
    BONUS, ORDER_FLOW,
  };
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}
