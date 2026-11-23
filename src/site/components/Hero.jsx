import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "../../shared/data.js";
import { Img } from "../../shared/Img.jsx";
import { fmt } from "../../shared/format.js";
import { useShop } from "../shop.jsx";

/* Bosh ekran: butun kenglikdagi ko'mir rangli polosa. Chapda sarlavha,
   o'ngda chetgacha cho'zilgan haqiqiy taom fotosi (navbat bilan almashadi).
   Ostida — kategoriyalar qatori, xuddi katta brendlar saytlaridagidek. */
const SLIDES = ["bucket", "pizza-pepperoni", "lavash-classic", "wings-hot"];
const EVERY = 5000;

export default function Hero() {
  const { products, setDishId } = useShop();
  const hero = useRef(null);
  const [n, setN] = useState(0);
  const [paused, setPaused] = useState(false);

  // admin taomni yashirgan yoki o'chirgan bo'lsa — u slayd ko'rsatilmaydi
  const slides = SLIDES.map((id) => products.find((p) => p.id === id && !p.hidden)).filter(Boolean);
  const cur = slides.length ? n % slides.length : 0;
  const s = slides[cur];
  // oldingi slayd ostida qoladi, yangisi uning ustidan chapga qarab "suriladi"
  const prevRef = useRef(-1), lastRef = useRef(cur);
  if (lastRef.current !== cur) { prevRef.current = lastRef.current; lastRef.current = cur; }
  const prev = prevRef.current;

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

  const visibleCats = CATEGORIES.filter((c) => products.some((p) => p.cat === c.id && !p.hidden));
  const go = (id) => { const el = document.getElementById("cat-" + id); if (el) el.scrollIntoView({ behavior: "smooth" }); };

  return (
    <>
      <section className="hero" ref={hero}>
        <div className="hero__media">
          {slides.map((p, i) => (
            <div key={p.id} className={"hero__slide" + (i === cur ? " is-on" : i === prev ? " is-prev" : "")} aria-hidden={i !== cur}>
              <Img src={p.img} alt={p.name} lazy={i !== 0} sizes="(max-width: 900px) 100vw, 60vw" />
            </div>
          ))}
        </div>

        <div className="hero__inner">
          <h1 className="hero__title"><span>Olov ustida</span><span>pishgan</span></h1>
          <p className="hero__lead">Burger, lavash, pitsa va tovuq. Toshkent bo'ylab 30 daqiqada eshigingizgacha.</p>
          <div className="hero__cta">
            <a href="#menu" className="btn btn--fire btn--lg">Menyuni ochish</a>
            <a href="#combo" className="btn btn--ghost btn--lg">Kombo yig'ish</a>
          </div>
        </div>

        {s && (
          <div className="hero__now" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            <button className="hero__dish" onClick={() => setDishId(s.id)}>
              <span className="hero__dish-name">{s.name}</span>
              <span className="hero__dish-price">{fmt(s.price)} so'm</span>
            </button>
            <div className="hero__dots" role="tablist" aria-label="Taomlar">
              {slides.map((p, i) => (
                <button key={p.id} role="tab" aria-selected={i === cur} aria-label={p.name} className={i === cur ? "is-on" : ""} onClick={() => setN(i)} />
              ))}
            </div>
          </div>
        )}
      </section>

      <nav className="cats wrap" aria-label="Kategoriyalar">
        {visibleCats.map((c) => (
          <button key={c.id} className="cats__item" onClick={() => go(c.id)}>
            <span className="cats__img"><Img src={c.img} alt="" emoji={c.icon} sizes="96px" /></span>
            <span>{c.name}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
