import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { COMBO, catIcon } from "../../shared/data.js";
import { comboItems, comboUnit } from "../../shared/cart.js";
import { fmt, som } from "../../shared/format.js";
import { Img } from "../../shared/Img.jsx";
import { useShop } from "../shop.jsx";

/* Kombo: har guruhdan bittadan tanlanadi. Chek endi yon tomonda turmaydi —
   pastda ixcham panel (tanlanganlar + narx), batafsil chek esa alohida oynada. */
export default function Combo() {
  const { byId, addCombo } = useShop();
  const groups = COMBO.groups.map((g) => ({ ...g, items: comboItems(g, byId) }));
  const [pick, setPick] = useState(() => Object.fromEntries(groups.map((g) => [g.id, g.items[0]])));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Biror guruhda taom qolmagan bo'lsa (hammasi stop-listda), kombo bo'limini ko'rsatmaymiz
  if (groups.some((g) => !g.items.length)) return null;

  const items = groups.map((g) => byId[pick[g.id]]);
  const full = items.reduce((s, p) => s + p.price, 0);
  const price = comboUnit(items.map((p) => p.id), byId);
  const add = () => { addCombo(items.map((p) => p.id)); setOpen(false); };

  return (
    <section className="combo wrap" id="combo">
      <header className="sec-head">
        <h2>Kombo yig'ing</h2>
        <p>Har qatordan bittadan tanlang. Uchtasi birga {COMBO.discount}% arzonroq.</p>
      </header>

      <div className="combo__groups">
        {groups.map((g, gi) => (
          <div className="cgroup" key={g.id}>
            <h3><span>{gi + 1}</span>{g.name}</h3>
            <div className="cgroup__opts">
              {g.items.map((id) => {
                const p = byId[id];
                return (
                  <label className="copt" key={id}>
                    <input type="radio" name={`combo-${g.id}`} checked={pick[g.id] === id} onChange={() => setPick({ ...pick, [g.id]: id })} />
                    <div className="copt__img"><Img src={p.img} alt={p.name} emoji={catIcon(p.cat)} sizes="(max-width: 600px) 40vw, 200px" /></div>
                    <div className="copt__body"><b>{p.name}</b><small>{som(p.price)}</small></div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="combo-bar">
        <div className="combo-bar__thumbs" aria-hidden="true">
          {items.map((p) => <span key={p.id}><Img src={p.img} alt="" emoji={catIcon(p.cat)} sizes="48px" /></span>)}
        </div>
        <button className="combo-bar__sum" onClick={() => setOpen(true)}>
          <small>{items.map((p) => p.name).join(" + ")}</small>
          <span><s>{fmt(full)}</s> <b>{som(price)}</b></span>
        </button>
        <button className="btn btn--fire" onClick={add}>Savatga qo'shish</button>
      </div>

      <div className={"sheet" + (open ? " is-open" : "")} onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }} aria-hidden={!open}>
        <div className="sheet__box combo-sheet" role="dialog" aria-label="Kombo tarkibi">
          <button className="x-btn sheet__close" onClick={() => setOpen(false)} aria-label="Yopish"><X size={18} aria-hidden="true" /></button>
          <h3>Sizning kombo</h3>
          <ul className="combo-sheet__list">
            {items.map((p) => (
              <li key={p.id}>
                <span className="combo-sheet__img"><Img src={p.img} alt="" emoji={catIcon(p.cat)} sizes="56px" /></span>
                <span>{p.name}</span>
                <b>{som(p.price)}</b>
              </li>
            ))}
          </ul>
          <div className="combo-sheet__row"><span>Alohida olganda</span><s>{som(full)}</s></div>
          <div className="combo-sheet__row"><span>Kombo chegirmasi</span><span className="combo-sheet__save">−{som(full - price)}</span></div>
          <div className="combo-sheet__total"><span>Jami</span><b>{som(price)}</b></div>
          <button className="btn btn--fire btn--block" onClick={add}>Savatga qo'shish</button>
        </div>
      </div>
    </section>
  );
}
