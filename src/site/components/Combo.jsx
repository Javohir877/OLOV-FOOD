import { useState } from "react";
import { COMBO } from "../../shared/data.js";
import { comboItems, comboUnit } from "../../shared/cart.js";
import { fmt, som } from "../../shared/format.js";
import { Img } from "../../shared/Img.jsx";
import { useShop } from "../shop.jsx";
import { catIcon } from "../../shared/data.js";

export default function Combo() {
  const { byId, addCombo } = useShop();
  const groups = COMBO.groups.map((g) => ({ ...g, items: comboItems(g, byId) }));
  const [pick, setPick] = useState(() => Object.fromEntries(groups.map((g) => [g.id, g.items[0]])));

  // Biror guruhda taom qolmagan bo'lsa (hammasi stop-listda), kombo bo'limini ko'rsatmaymiz
  if (groups.some((g) => !g.items.length)) return null;

  const items = groups.map((g) => byId[pick[g.id]]);
  const full = items.reduce((s, p) => s + p.price, 0);
  const price = comboUnit(items.map((p) => p.id), byId);

  return (
    <section className="combo" id="combo">
      <div className="section-title">
        <span className="tag">Yangi!</span>
        <h2>O'z kombongizni <span className="hl">yig'ing</span></h2>
        <p>Har guruhdan bittadan tanlang — jami narxdan <b>−{COMBO.discount}%</b> chegirma avtomatik.</p>
      </div>
      <div className="combo__grid">
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
                      <div className="copt__img"><Img src={p.img} alt={p.name} emoji={catIcon(p.cat)} /></div>
                      <div className="copt__body"><b>{p.name}</b><small>{som(p.price)}</small></div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <aside className="combo__ticket">
          <div className="receipt">
            <h3>Kombo chek</h3>
            <span className="save-badge">−{COMBO.discount}% tejaysiz</span>
            <div style={{ marginTop: 12 }}>
              {items.map((p) => <div className="receipt__row" key={p.id}><span>{p.name}</span><b>{som(p.price)}</b></div>)}
            </div>
            <div className="receipt__total"><span>Jami</span><div><s>{fmt(full)}</s><b>{som(price)}</b></div></div>
            <button className="btn btn--fire btn--block" onClick={() => addCombo(items.map((p) => p.id))}>Kombo savatga →</button>
          </div>
        </aside>
      </div>
    </section>
  );
}
