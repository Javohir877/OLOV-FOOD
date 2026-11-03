/* Faol buyurtma belgisi: buyurtma tayyorlanayotgan yoki yo'lda bo'lsa, ekran pastida
   doim ko'rinib turadi ("🔥 Oshxonada · ~22 daq") — bosilsa jonli kuzatuv ochiladi. */
import { useEffect, useState } from "react";
import { Store } from "../../shared/store.js";
import { fetchStatus } from "../../shared/telegram.js";
import { useShop } from "../shop.jsx";

const LABEL = { new: ["🧾", "Qabul qilindi"], cooking: ["🔥", "Oshxonada"], delivering: ["🛵", "Yo'lda"] };
const ETA = { new: 30, cooking: 22, delivering: 10 };
const FRESH_MS = 3 * 60 * 60 * 1000; // 3 soatdan eski buyurtmalar ko'rsatilmaydi

export default function LiveOrder() {
  const { orders, setOrders, tracker, openTracker, totals, checkoutOpen, pay, dishId, ticketOpen } = useShop();
  const [, tick] = useState(0);
  const o = orders.find((x) => Date.now() - new Date(x.createdAt) < FRESH_MS);
  const status = o ? Store.statusOf(o) : null;
  const active = !!LABEL[status];

  // Holatni har 10 soniyada yangilaymiz (admin o'zgartirgani bot serveridan olinadi)
  useEffect(() => {
    if (!active) return undefined;
    let alive = true;
    const sync = () => {
      tick((x) => x + 1);
      fetchStatus(o).then((s) => {
        if (alive && s && s !== o.status) { Store.updateOrder(o.id, { status: s, statusManual: true }); setOrders(Store.orders()); }
      });
    };
    const t = setInterval(sync, 10000);
    return () => { alive = false; clearInterval(t); };
  }, [active, o && o.id, o && o.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active || tracker || checkoutOpen || pay || dishId || ticketOpen) return null; // oynalar ustida turmasin
  const pickup = o.customer.type === "pickup";
  const [icon, name] = status === "delivering" && pickup ? ["🏪", "Tayyor — olib keting"] : LABEL[status];
  const mins = Math.max(1, ETA[status] - Math.floor((Date.now() - new Date(o.createdAt)) / 60000 / 3));
  const lifted = totals.count > 0 && window.innerWidth <= 1280; // pastda "Savatni ko'rish" paneli bor

  return (
    <button className={"live-order" + (lifted ? " is-lifted" : "")} onClick={() => openTracker(o.id)} aria-label={`Buyurtma ${o.id}: ${name}. Kuzatish`}>
      <span className="live-order__icon" aria-hidden="true">{icon}</span>
      <span className="live-order__txt"><b>{name}</b><small>{o.id}{status !== "delivering" || !pickup ? ` · ~${mins} daq` : ""}</small></span>
      <span className="live-order__go" aria-hidden="true">Kuzatish →</span>
    </button>
  );
}
