import { useEffect, useRef, useState } from "react";
import { Img } from "../../shared/Img.jsx";
import { fmt } from "../../shared/format.js";
import { useShop } from "../shop.jsx";

/* Bosh ekran — katta brendlar saytlari kabi: chapda sarlavha, o'ngda haqiqiy taom
   fotolari navbat bilan almashadigan banner (oldingi chizilgan burger o'rniga). */
const SLIDES = [
  { id: "bucket", label: "Oila uchun", bg: "#F6D9B8" },
  { id: "pizza-pepperoni", label: "Top savdo", bg: "#F3CBB8" },
  { id: "lavash-classic", label: "Klassika", bg: "#EFDDB4" },
  { id: "wings-hot", label: "Achchiq", bg: "#F2C9AE" },
];
const EVERY = 4500;

export default function Hero() {
  const { products, setDishId } = useShop();
  const hero = useRef(null);
  const [n, setN] = useState(0);
  const [paused, setPaused] = useState(false);

  // admin taomni yashirgan yoki o'chirgan bo'lsa — u slayd ko'rsatilmaydi
  const slides = SLIDES.map((s) => ({ ...s, p: products.find((p) => p.id === s.id && !p.hidden) })).filter((s) => s.p);
  const cur = slides.length ? n % slides.length : 0;

  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    const t = setTimeout(() => setN((x) => x + 1), EVERY);
    return () => clearTimeout(t);
  }, [n, paused, slides.length]);

  // Bosh ekran ko'rinmay qolsa — slayd almashishi to'xtaydi
  useEffect(() => {
    const el = hero.current;
    if (!el || !("IntersectionObserver" in window)) return undefined;
    const io = new IntersectionObserver(([en]) => { el.classList.toggle("is-paused", !en.isIntersecting); setPaused(!en.isIntersecting); });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const s = slides[cur];

  return (
    <section className="hero" ref={hero}>
      <div className="hero__text">
        <span className="tag">🔥 Grilda, olov ustida</span>
        <h1><span className="h1-line" style={{ "--d": 0 }}>Issiq.</span> <span className="h1-line hero__accent" style={{ "--d": 1 }}>Shirali.</span><br /><span className="h1-line" style={{ "--d": 2 }}>Tez.</span></h1>
        <p>Har kuni yangi go'sht, yumshoq non va faqat bizda bor OLOV sousi. Buyurtma bering — kuryer 30 daqiqada eshigingizda.</p>
        <div className="hero__cta">
          <a href="#menu" className="btn btn--ink">Buyurtma berish</a>
          <a href="#combo" className="btn btn--cream">Kombo yig'ish</a>
        </div>
        <ul className="hero__facts">
          <li><b>30 daq</b><span>yetkazib berish</span></li>
          <li><b>★ 4.9</b><span>50 000+ mijoz</span></li>
          <li><b>5%</b><span>bonus qaytadi</span></li>
        </ul>
      </div>

      {s && (
        <div className="showcase" style={{ "--bg": s.bg }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="showcase__frame">
            {slides.map((x, i) => (
              <button key={x.id} className={"showcase__slide" + (i === cur ? " is-on" : "")} onClick={() => setDishId(x.p.id)} tabIndex={i === cur ? 0 : -1} aria-hidden={i !== cur} aria-label={`${x.p.name} — batafsil`}>
                <Img src={x.p.img} alt={x.p.name} lazy={i !== 0} sizes="(max-width: 1024px) 92vw, 560px" />
              </button>
            ))}
            <span className="showcase__time" aria-hidden="true"><b>30</b>daqiqa</span>
          </div>
          <div className="showcase__card">
            <div>
              <small>{s.label}</small>
              <b>{s.p.name}</b>
            </div>
            <span className="showcase__price">{fmt(s.p.price)} <small>so'm</small></span>
            <button className="showcase__add" onClick={() => setDishId(s.p.id)} aria-label={`${s.p.name} — tanlash`}>+</button>
          </div>
          <div className="showcase__dots" role="tablist" aria-label="Taomlar">
            {slides.map((x, i) => (
              <button key={x.id} role="tab" aria-selected={i === cur} aria-label={x.p.name} className={i === cur ? "is-on" : ""} onClick={() => setN(i)} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
