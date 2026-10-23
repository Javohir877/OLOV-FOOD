import { useEffect, useState } from "react";
import { catIcon } from "../../shared/data.js";
import { fmt } from "../../shared/format.js";
import { Img } from "../../shared/Img.jsx";
import { useShop } from "../shop.jsx";

const pad = (n) => String(n).padStart(2, "0");

/* Kun taklifi — har kuni bitta taomga chegirma, yarim tungacha amal qiladi */
export default function Deal() {
  const { deal, addDish, setDishId } = useShop();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (!deal) return null;

  const left = Math.max(0, deal.endsAt - now);
  const h = Math.floor(left / 36e5), m = Math.floor((left % 36e5) / 6e4), s = Math.floor((left % 6e4) / 1000);
  const p = deal.product;
  return (
    <section className="deal" id="deal">
      <div className="deal__card">
        <div className="deal__img" onClick={() => setDishId(p.id)}>
          <span className="deal__pct">−{deal.percent}%</span>
          <Img src={p.img} alt={p.name} emoji={catIcon(p.cat)} />
        </div>
        <div className="deal__body">
          <span className="tag">🔥 Kun taklifi</span>
          <h2>{p.name}</h2>
          <p>{p.desc}</p>
          <div className="deal__price">
            <s>{fmt(p.price)}</s>
            <b className="money">{fmt(deal.price)} <small>so'm</small></b>
            <span className="save-badge">−{fmt(p.price - deal.price)} so'm tejaysiz</span>
          </div>
          <div className="deal__timer" aria-label="Taklif tugashiga qolgan vaqt">
            <span>Taklif tugashiga:</span>
            <div><b>{pad(h)}</b><small>soat</small></div><i>:</i>
            <div><b>{pad(m)}</b><small>daqiqa</small></div><i>:</i>
            <div><b>{pad(s)}</b><small>soniya</small></div>
          </div>
          <button className="btn btn--fire" onClick={() => addDish(p.id)}>Savatga qo'shish →</button>
        </div>
      </div>
    </section>
  );
}
