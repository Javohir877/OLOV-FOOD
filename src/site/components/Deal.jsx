import { useEffect, useState } from "react";
import { BONUS, catIcon } from "../../shared/data.js";
import { flyToCart } from "../motion.js";
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
        <span className="deal__ghost" aria-hidden="true">−{deal.percent}%</span>
        <div className="deal__img" onClick={() => setDishId(p.id)}>
          <span className="deal__pct">−{deal.percent}%</span>
          <Img src={p.img} alt={p.name} emoji={catIcon(p.cat)} lazy={false} sizes="(max-width: 1024px) 100vw, 480px" />
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
          <ul className="deal__perks">
            <li>🛵 30 daqiqada</li><li>🔥 Grilda pishadi</li><li>💎 +{BONUS.rate}% bonus</li>
          </ul>
          <div className="deal__timer" aria-label="Taklif tugashiga qolgan vaqt">
            <span>Taklif tugashiga:</span>
            {/* key — raqam o'zgarganda "tushish" animatsiyasi qayta o'ynaydi */}
            <div><b key={h}>{pad(h)}</b><small>soat</small></div><i>:</i>
            <div><b key={m}>{pad(m)}</b><small>daqiqa</small></div><i>:</i>
            <div><b key={s}>{pad(s)}</b><small>soniya</small></div>
          </div>
          {/* kun o'tgan sari qisqaradigan chiziq: taklif tugashiga qancha qoldi */}
          <div className="deal__bar" aria-hidden="true"><i style={{ transform: `scaleX(${Math.max(0.02, Math.min(1, left / 864e5))})` }} /></div>
          <button className="btn btn--fire" onClick={(e) => { flyToCart(e.currentTarget.closest(".deal__card").querySelector(".deal__img")); addDish(p.id); }}>Savatga qo'shish →</button>
        </div>
      </div>
    </section>
  );
}
