/* Oynalar: taom sozlash, kuzatuv, bildirishnomalar, konfetti */
import { useEffect, useMemo, useRef, useState } from "react";
import { OPTIONS, SETTINGS, catIcon } from "../../shared/data.js";
import { Store } from "../../shared/store.js";
import { dishUnit, defaultSize } from "../../shared/cart.js";
import { fmt, som } from "../../shared/format.js";
import { Img } from "../../shared/Img.jsx";
import { useShop } from "../shop.jsx";
import { BADGES } from "./Menu.jsx";

/* Har doim joyida turadigan oyna — ochilish/yopilish animatsiyasi CSS orqali */
export function Sheet({ open, onClose, id, boxClass, children }) {
  return (
    <div className={"sheet" + (open ? " is-open" : "")} id={id} role="dialog" aria-modal="true" aria-hidden={!open}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={"sheet__box " + boxClass}>{children}</div>
    </div>
  );
}

// Yopilayotganda ham oxirgi qiymat ko'rinib tursin (animatsiya uchun)
function useLast(value) {
  const ref = useRef(value);
  if (value) ref.current = value;
  return ref.current;
}

/* ---------- Taom oynasi (o'lcham + qo'shimchalar) ---------- */
function DishBody({ p, onDone }) {
  const { addDish } = useShop();
  const o = OPTIONS[p.cat] || {};
  const b = BADGES[p.badge];
  const [size, setSize] = useState(defaultSize(p.cat));
  const [extras, setExtras] = useState([]);
  const [qty, setQty] = useState(1);
  const toggle = (id) => setExtras(extras.includes(id) ? extras.filter((x) => x !== id) : [...extras, id]);
  return (
    <div className="dishm">
      <div className="dishm__img">
        {b && <span className={"badge " + b[0]} style={{ left: 14, top: 14, fontSize: 13 }}>{b[1]}</span>}
        <Img src={p.img} alt={p.name} emoji={catIcon(p.cat)} lazy={false} />
      </div>
      <form className="dishm__body" onSubmit={(e) => { e.preventDefault(); addDish(p.id, size, extras, qty); onDone(); }}>
        <h3>{p.name}</h3>
        <span className="dish__meta"><b>★ {p.rating.toFixed(1)}</b> · {p.weight} · {p.kcal} kkal</span>
        <p>{p.desc}</p>
        {o.sizes && (
          <div><div className="opt-title">O'lcham</div><div className="pills">
            {o.sizes.map((s) => (
              <label className="pill" key={s.id}>
                <input type="radio" name="size" checked={size === s.id} onChange={() => setSize(s.id)} />
                <span>{s.name}{s.add ? <small>{s.add > 0 ? "+" : "−"}{fmt(Math.abs(s.add))}</small> : null}</span>
              </label>
            ))}
          </div></div>
        )}
        {o.extras && (
          <div><div className="opt-title">Qo'shimchalar</div><div className="pills">
            {o.extras.map((e) => (
              <label className="pill" key={e.id}>
                <input type="checkbox" checked={extras.includes(e.id)} onChange={() => toggle(e.id)} />
                <span>{e.name}<small>{e.add ? "+" + fmt(e.add) : "bepul"}</small></span>
              </label>
            ))}
          </div></div>
        )}
        <div className="dishm__buy">
          <div className="stepper">
            <button type="button" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button type="button" onClick={() => setQty(Math.min(20, qty + 1))}>+</button>
          </div>
          <button className="btn btn--fire" type="submit">Savatga · {som(dishUnit(p, size, extras) * qty)}</button>
        </div>
      </form>
    </div>
  );
}

export function DishSheet() {
  const { dishId, setDishId, byId } = useShop();
  const p = useLast(dishId ? byId[dishId] : null);
  const close = () => setDishId(null);
  return (
    <Sheet open={!!dishId} onClose={close} boxClass="sheet__box--dish">
      <button className="x-btn sheet__close" onClick={close} aria-label="Yopish">✕</button>
      {/* key — har safar yangi taom ochilganda tanlovlar boshidan boshlanadi */}
      {p && <DishBody key={dishId || p.id} p={p} onDone={close} />}
    </Sheet>
  );
}

/* ---------- Buyurtmani kuzatish ---------- */
const STAGES = [
  { id: "new", icon: "🧾", name: "Qabul qilindi", note: "Buyurtma oshxonaga yuborildi" },
  { id: "cooking", icon: "🔥", name: "Oshxonada", note: "Oshpazlarimiz olov ustida tayyorlamoqda" },
  { id: "delivering", icon: "🛵", name: "Yo'lda", note: "Kuryer issiq holda olib kelmoqda" },
  { id: "done", icon: "🎉", name: "Yetkazildi", note: "Yoqimli ishtaha!" },
];
const PICKUP_STAGES = { delivering: { icon: "🏪", name: "Tayyor", note: "Buyurtmani olib ketishingiz mumkin" }, done: { icon: "🎉", name: "Topshirildi", note: "Yoqimli ishtaha!" } };

function TrackerBody({ id, fresh, onClose }) {
  const { reorder, ORDER_FLOW } = useShop();
  const [, tick] = useState(0);
  // Holat vaqt bilan (yoki admin tomonidan) o'zgaradi — har 2 soniyada qayta o'qiymiz
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 2000); return () => clearInterval(t); }, []);
  const o = Store.orders().find((x) => x.id === id);
  if (!o) return null;
  const idx = ORDER_FLOW.indexOf(Store.statusOf(o));
  const pickup = o.customer.type === "pickup";
  const stages = STAGES.map((s) => ({ ...s, ...(pickup ? PICKUP_STAGES[s.id] : {}) }));

  if (idx < 0) {
    return (
      <>
        <div className="tr-head"><span className="tr-id">{o.id}</span><h3>Buyurtma bekor qilindi</h3>
          <p>Savollar bo'lsa, {SETTINGS.phone} raqamiga qo'ng'iroq qiling.{o.payment.paid ? " To'langan summa kartangizga qaytariladi." : ""}</p></div>
        <div className="tr-actions"><button className="btn btn--ink" onClick={onClose}>Tushunarli</button></div>
      </>
    );
  }
  return (
    <>
      <div className="tr-head">
        <span className="tr-id">{o.id}</span>
        <h3>{fresh && idx === 0 ? "Rahmat! Buyurtma qabul qilindi" : stages[idx].name}</h3>
        <p>{idx < 3 ? `Taxminan ${[30, 22, 10][idx]} daqiqada ${pickup ? "tayyor bo'ladi" : "yetib boradi"}` : stages[3].note}</p>
      </div>
      <div className="road">
        <span className="road__shop">🏪</span><span className="road__home">{pickup ? "🙋" : "🏠"}</span>
        <span className="road__scooter" style={{ left: [8, 30, 64, 92][idx] + "%" }}>{idx === 1 ? "🔥" : "🛵"}</span>
      </div>
      <ol className="steps">
        {stages.map((s, i) => (
          <li key={s.id} className={i < idx ? "done" : i === idx ? "now" : ""}><i>{i < idx ? "✓" : s.icon}</i><div>{s.name}<small>{s.note}</small></div></li>
        ))}
      </ol>
      <div className="tr-sum">
        {o.items.map((i, k) => <div key={k}><span>{i.name} × {i.qty}</span><b>{som(i.price * i.qty)}</b></div>)}
        <div className="tr-sum__total"><span>{o.payment.label}</span><b>{som(o.total)}</b></div>
      </div>
      <div className="tr-actions">
        <a className="btn btn--cream" href="tel:+998901234567">☎ Qo'ng'iroq</a>
        {idx === 3 && <button className="btn btn--cream" onClick={() => reorder(o.id)}>🔁 Qayta buyurtma</button>}
        <button className="btn btn--ink" onClick={onClose}>Yaxshi!</button>
      </div>
    </>
  );
}

export function TrackerSheet() {
  const { tracker, setTracker } = useShop();
  const last = useLast(tracker);
  const close = () => setTracker(null);
  return (
    <Sheet open={!!tracker} onClose={close} id="trackerSheet" boxClass="sheet__box--tracker">
      <button className="x-btn sheet__close" onClick={close} aria-label="Yopish">✕</button>
      {last && <TrackerBody key={last.id} id={last.id} fresh={last.fresh} onClose={close} />}
    </Sheet>
  );
}

/* ---------- Bildirishnomalar ---------- */
export function Toasts() {
  const { toasts } = useShop();
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={"toast" + (t.bad ? " toast--err" : "") + (t.out ? " out" : "")}>
          <span>{t.bad ? "⚠️" : "🔥"}</span><span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Konfetti ---------- */
const CONFETTI_COLORS = ["#FF5B14", "#FFC229", "#7BC94C", "#E8402A", "#FFF3E3"];
export function Confetti() {
  const { confettiKey } = useShop();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!confettiKey) return undefined;
    setShow(true);
    const t = setTimeout(() => setShow(false), 4200);
    return () => clearTimeout(t);
  }, [confettiKey]);
  const pieces = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    i, left: Math.random() * 100, bg: CONFETTI_COLORS[i % CONFETTI_COLORS.length], dur: 1.8 + Math.random() * 1.8, dl: Math.random() * .4, round: i % 3 === 0,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [confettiKey]);
  if (!show) return null;
  return pieces.map((p) => (
    <i key={`${confettiKey}-${p.i}`} className="confetti" style={{ left: p.left + "vw", background: p.bg, animationDuration: p.dur + "s", animationDelay: p.dl + "s", borderRadius: p.round ? "50%" : "2px" }} />
  ));
}
