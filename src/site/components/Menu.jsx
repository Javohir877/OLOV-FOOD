import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, catIcon } from "../../shared/data.js";
import { fmt } from "../../shared/format.js";
import { Img } from "../../shared/Img.jsx";
import { useShop } from "../shop.jsx";
import Ticket from "./Ticket.jsx";

export const BADGES = { hit: ["badge--hit", "🔥 Hit"], new: ["badge--new", "Yangi"], hot: ["badge--hot", "🌶 Achchiq"] };

const TAGS = [["", "Hammasi"], ["hit", "🔥 Hit"], ["new", "✨ Yangi"], ["hot", "🌶 Achchiq"], ["light", "🥗 600 kkal gacha"]];
const SORTS = {
  rating: (a, b) => b.rating - a.rating,
  cheap: (a, b) => a.price - b.price,
  pricey: (a, b) => b.price - a.price,
};

function DishCard({ p, i, inCart }) {
  const { setDishId, addDish } = useShop();
  const b = BADGES[p.badge];
  return (
    <article
      className="dish" style={{ animationDelay: `${i * 50}ms` }} tabIndex={0} aria-label={p.name}
      onClick={() => setDishId(p.id)} onKeyDown={(e) => { if (e.key === "Enter") setDishId(p.id); }}
    >
      {inCart ? <span className="in-cart">Savatda: {inCart}</span> : null}
      <div className="dish__img">{b && <span className={"badge " + b[0]}>{b[1]}</span>}<Img src={p.img} alt={p.name} emoji={catIcon(p.cat)} /></div>
      <div className="dish__info">
        <h3>{p.name}</h3>
        <p>{p.desc}</p>
        <span className="dish__meta"><b>★ {p.rating.toFixed(1)}</b> · {p.weight} · {p.kcal} kkal</span>
        <div className="dish__buy">
          <span className="price">{fmt(p.price)} <small>so'm</small></span>
          {/* "+" standart variantni darhol qo'shadi; kartochkani bosish sozlash oynasini ochadi */}
          <button className="plus" aria-label={`${p.name} — savatga qo'shish`} onClick={(e) => { e.stopPropagation(); addDish(p.id); }}>+</button>
        </div>
      </div>
    </article>
  );
}

export default function Menu() {
  const { products, cart } = useShop();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState("");
  const [active, setActive] = useState(CATEGORIES[0].id);
  const [animKey, setAnimKey] = useState(0);
  const railRef = useRef(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tagOk = (p) => !tag || (tag === "light" ? p.kcal > 0 && p.kcal <= 600 : p.badge === tag);
    return products.filter((p) => !p.hidden && tagOk(p) && (!q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)));
  }, [products, query, tag]);

  const blocks = CATEGORIES.map((c) => {
    const items = list.filter((p) => p.cat === c.id);
    if (sort) items.sort(SORTS[sort]);
    return { ...c, items };
  }).filter((c) => c.items.length);

  const inCart = {};
  cart.forEach((l) => { if (l.kind === "dish") inCart[l.id] = (inCart[l.id] || 0) + l.qty; });

  // Qaysi kategoriya ko'rinib turganini aniqlash (chap paneldagi belgi)
  useEffect(() => {
    let ticking = false;
    const spy = () => {
      const els = document.querySelectorAll(".cat-block");
      if (!els.length) return;
      const offset = window.innerWidth <= 860 ? 200 : 140;
      let current = els[0].id;
      els.forEach((b) => { if (b.getBoundingClientRect().top < offset) current = b.id; });
      setActive(current.replace("cat-", ""));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { spy(); ticking = false; });
    };
    spy();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [blocks.length]);

  // Telefonda faol kategoriya tugmasi ko'rinadigan joyga suriladi
  useEffect(() => {
    if (window.innerWidth > 860 || !railRef.current) return;
    const btn = railRef.current.querySelector(".rail__cat.is-active");
    if (btn) railRef.current.scrollTo({ left: btn.offsetLeft - 20, behavior: "smooth" });
  }, [active]);

  const refilter = (fn) => { fn(); setAnimKey((k) => k + 1); };
  const reset = () => refilter(() => { setTag(""); setQuery(""); setSort(""); });

  return (
    <section className="menu" id="menu">
      <aside className="rail">
        <h2 className="rail__title">Menyu</h2>
        <label className="search">
          <span>🔍</span>
          <input type="search" placeholder="Taom qidirish..." autoComplete="off" value={query} onChange={(e) => refilter(() => setQuery(e.target.value))} />
        </label>
        <nav className="rail__cats" ref={railRef}>
          {blocks.map((c) => (
            <button key={c.id} className={"rail__cat" + (active === c.id ? " is-active" : "")} onClick={() => document.getElementById("cat-" + c.id).scrollIntoView({ behavior: "smooth" })}>
              <i><Img src={c.img} emoji={c.icon} lazy={false} /></i>{c.name}<small>{c.items.length}</small>
            </button>
          ))}
        </nav>
      </aside>

      <div className="menu__main">
        <div className="menu-tools">
          <div className="tags" role="group" aria-label="Filtr">
            {TAGS.map(([id, label]) => (
              <button key={id} className={"tag-btn" + (tag === id ? " is-on" : "")} onClick={() => refilter(() => setTag(id))}>{label}</button>
            ))}
          </div>
          <label className="sort">
            <span>Saralash:</span>
            <select value={sort} onChange={(e) => refilter(() => setSort(e.target.value))}>
              <option value="">Tavsiya etilgan</option>
              <option value="rating">⭐ Reyting bo'yicha</option>
              <option value="cheap">Arzonroq avval</option>
              <option value="pricey">Qimmatroq avval</option>
            </select>
          </label>
        </div>
        <div className="menu__list" key={animKey}>
          {blocks.length ? blocks.map((c) => (
            <section className="cat-block" id={"cat-" + c.id} key={c.id}>
              <div className="cat-head">
                <Img src={c.img} emoji={c.icon} />
                <div><h2>{c.name}</h2><small>{c.items.length} ta taom</small></div>
              </div>
              <div className="dishes">
                {c.items.map((p, i) => <DishCard key={p.id} p={p} i={i} inCart={inCart[p.id]} />)}
              </div>
            </section>
          )) : (
            <p className="empty">Bu filtr bo'yicha hech narsa topilmadi 😕<br /><button className="btn btn--cream" onClick={reset} style={{ marginTop: 14 }}>Filtrlarni tozalash</button></p>
          )}
        </div>
      </div>

      <Ticket />
    </section>
  );
}
