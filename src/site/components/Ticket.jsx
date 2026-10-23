import { useEffect, useState } from "react";
import { DELIVERY, catIcon } from "../../shared/data.js";
import { fmt, som } from "../../shared/format.js";
import { lineInfo, promoOf } from "../../shared/cart.js";
import { Img } from "../../shared/Img.jsx";
import { useShop } from "../shop.jsx";

/* "Bunga mos keladi" — savatda yetishmayotgan ichimlik/gazak/desert takliflari */
function Upsell() {
  const { cart, products, byId, addDish } = useShop();
  if (!cart.length) return null;
  const inCart = new Set(cart.flatMap((l) => (l.kind === "combo" ? l.items : [l.id])));
  const cats = new Set([...inCart].map((id) => byId[id].cat));
  // Ichimlik yo'q bo'lsa — avval ichimlik, gazak yo'q bo'lsa — gazak, keyin desert
  const order = ["drink", "snack", "dessert"].sort((a, b) => cats.has(a) - cats.has(b));
  const picks = order
    .flatMap((cat) => products.filter((p) => p.cat === cat && !p.hidden && !inCart.has(p.id)).sort((a, b) => b.rating - a.rating).slice(0, 2))
    .slice(0, 3);
  if (!picks.length) return null;
  return (
    <div className="upsell">
      <h4>Bunga juda mos keladi 👌</h4>
      <div className="upsell__row">
        {picks.map((p) => (
          <div className="upsell__item" key={p.id}>
            <div className="upsell__img"><Img src={p.img} alt={p.name} emoji={catIcon(p.cat)} /></div>
            <b>{p.name}</b>
            <span>{fmt(p.price)} so'm</span>
            <button className="upsell__add" aria-label={`${p.name} qo'shish`} onClick={() => addDish(p.id)}>+</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Ticket() {
  const { cart, byId, totals: t, changeQty, promo, setPromo, bonus, ticketOpen, setTicketOpen, openCheckout, toast } = useShop();
  const [code, setCode] = useState(promo || "");
  useEffect(() => { setCode(promo || ""); }, [promo]);

  const applyPromo = (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) { setPromo(null); return; }
    const p = promoOf(c);
    if (!p) { toast("Bunday promokod yo'q", true); return; }
    setPromo(c);
    toast(`Promokod qo'llandi: ${p.label}`);
  };

  const left = DELIVERY.freeFrom - t.subtotal;
  return (
    <aside className={"ticket" + (ticketOpen ? " is-open" : "")} aria-label="Savat">
      <div className="ticket__paper">
        <div className="ticket__head">
          <div>
            <h3>Sizning chek</h3>
            <small>{new Date().toLocaleDateString("ru-RU")} · OLOV FOOD</small>
            {bonus ? <span className="bonus-chip" title="Olov Bonus balansi">💎 Bonus: {som(bonus)}</span> : null}
          </div>
          <button className="x-btn ticket__close" onClick={() => setTicketOpen(false)} aria-label="Yopish">✕</button>
        </div>

        <div className="ticket__items">
          {!t.count ? (
            <div className="ticket-empty"><div>🍔</div><p>Chek hali bo'sh.<br />Menyudan biror mazali narsa tanlang!</p></div>
          ) : cart.map((l) => {
            const info = lineInfo(l, byId);
            return (
              <div className="line" key={l.key}>
                <div className="line__img"><Img src={info.img.img} alt={info.name} emoji={catIcon(info.img.cat)} /></div>
                <div><h4>{info.name}</h4>{info.sub && <small>{info.sub}</small>}<span className="line__price">{som(l.unit * l.qty)}</span></div>
                <div className="line__side">
                  <div className="stepper">
                    <button onClick={() => changeQty(l.key, -1)} aria-label="Kamaytirish">−</button><span>{l.qty}</span><button onClick={() => changeQty(l.key, 1)} aria-label="Ko'paytirish">+</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Upsell />

        {t.count > 0 && (
          <div className="ticket__foot">
            <form className="promo" onSubmit={applyPromo}>
              <input placeholder="PROMOKOD" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} />
              <button type="submit">OK</button>
            </form>
            <div className="freebar">{left > 0 ? `Bepul yetkazishgacha yana ${som(left)}` : "🎉 Yetkazib berish bepul!"}
              <div className="freebar__track"><div className="freebar__fill" style={{ width: Math.min(100, (t.subtotal / DELIVERY.freeFrom) * 100) + "%" }} /></div>
            </div>
            <div className="totals" style={{ marginTop: 12 }}>
              <div><span>Taomlar ({t.count})</span><span>{som(t.subtotal)}</span></div>
              {t.promo && (
                <div className="is-green"><span>{promo} {t.promo.label}</span><span>{t.discount ? "−" + som(t.discount) : t.promoOk ? "✓" : "min. " + som(t.promo.min)}</span></div>
              )}
              {t.bonusUsed > 0 && <div className="is-green"><span>💎 Bonusdan</span><span>−{som(t.bonusUsed)}</span></div>}
              <div><span>Yetkazib berish</span><span>{t.delivery ? som(t.delivery) : "Bepul"}</span></div>
              <div className="grand"><span>Jami</span><b>{som(t.total)}</b></div>
            </div>
            <button className="btn btn--fire btn--block" onClick={openCheckout}>Buyurtma berish →</button>
          </div>
        )}
      </div>
    </aside>
  );
}
