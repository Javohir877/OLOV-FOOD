/* O'zbekiston xaritasi: viloyatlar filiallar soniga qarab bo'yaladi (kartogramma),
   filiallar — nuqtalar. Bir joyda zich turgan filiallar (masalan, Toshkentdagi 6 ta)
   bitta raqamli belgi bo'lib ko'rinadi. Sayt va admin panel ikkalasida ishlatiladi. */
import { UZ_ATTRIBUTION, UZ_REGIONS, UZ_VIEW, uzPoint } from "./uzmap.js";
import { isOpenAt } from "./hours.js";
import { useEffect, useRef, useState } from "react";
import "../styles/uzmap.css";

export const branchOpen = (b, now = new Date()) => isOpenAt(b.open, b.close, now);
export const REGION_NAME = Object.fromEntries(UZ_REGIONS.map((r) => [r.id, r.name]));

// Hududlar: filiallari bor bo'lganlari, ko'pidan ozigacha (Toshkent shahri doim birinchi)
export function regionStats(branches) {
  const m = {};
  branches.forEach((b) => {
    const r = (m[b.region] = m[b.region] || { id: b.region, name: REGION_NAME[b.region] || b.region, count: 0, open: 0 });
    r.count += 1;
    if (branchOpen(b)) r.open += 1;
  });
  return Object.values(m).sort((a, b) => (a.id === "toshkent" ? -1 : b.id === "toshkent" ? 1 : b.count - a.count || a.name.localeCompare(b.name)));
}

// Yaqin nuqtalarni guruhlash (xarita birliklarida)
function clusters(branches, gap = 18) {
  const out = [];
  branches.forEach((b) => {
    const [x, y] = uzPoint(b.lat, b.lon);
    const c = out.find((k) => Math.hypot(k.x - x, k.y - y) < gap);
    if (c) { c.items.push(b); c.x = (c.x * (c.items.length - 1) + x) / c.items.length; c.y = (c.y * (c.items.length - 1) + y) / c.items.length; }
    else out.push({ x, y, items: [b] });
  });
  return out;
}

export default function UzMap({ branches, value = "", onPick, label = "Filiallar xaritasi" }) {
  const counts = {};
  branches.forEach((b) => { counts[b.region] = (counts[b.region] || 0) + 1; });
  const max = Math.max(1, ...Object.values(counts));
  // tanlangan viloyat chegarasi qo'shnilari ostida qolmasin — oxirida chiziladi
  const regions = [...UZ_REGIONS].sort((a, b) => (a.id === value) - (b.id === value));
  const pick = (id) => onPick && onPick(value === id ? "" : id);
  const groups = clusters(branches);

  // Nuqta bosilganda "pap" etib chiqadigan oyna (filial nomi, manzil, ochiq/yopiq)
  const [pop, setPop] = useState(null); // { key, x, y, items }
  const stage = useRef(null);
  useEffect(() => {
    if (!pop) return undefined;
    const away = (e) => { if (stage.current && !e.target.closest(".uzmap__pin, .uzmap__pop")) setPop(null); };
    const esc = (e) => { if (e.key === "Escape") setPop(null); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [pop]);
  // tanlangan hudud o'zgarsa va oyna boshqa hududniki bo'lsa — yopamiz
  useEffect(() => { if (pop && value && !pop.items.some((b) => b.region === value)) setPop(null); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const openPin = (c) => {
    const key = c.items[0].id;
    if (pop && pop.key === key) { setPop(null); return; }
    setPop({ key, x: c.x, y: c.y, items: c.items });
    if (onPick && value !== c.items[0].region) onPick(c.items[0].region);
  };

  // oyna nuqtaning tepasida; xarita chetiga yaqin bo'lsa — ichkariga suriladi, tepaga sig'masa — pastga
  const px = pop ? pop.x / UZ_VIEW.w : 0, py = pop ? pop.y / UZ_VIEW.h : 0;
  // ko'p filialli guruh (masalan, Toshkent) — ro'yxat baland: oyna nuqtaning yonida, o'rtasi bilan turadi
  const tall = pop && pop.items.length > 3;
  const side = tall ? (px > 0.5 ? " is-side-l" : " is-side-r") : px < 0.18 ? " is-left" : px > 0.82 ? " is-right" : "";
  const below = !tall && py < 0.3 ? " is-below" : "";

  return (
    <figure className={"uzmap" + (value ? " has-pick" : "")}>
      <div className="uzmap__stage" ref={stage}>
        <svg viewBox={`0 0 ${UZ_VIEW.w} ${UZ_VIEW.h}`} role="img" aria-label={label}>
          {regions.map((r) => {
            const n = counts[r.id] || 0;
            return (
              <path key={r.id} d={r.d}
                className={"uzmap__reg" + (n ? " has" : "") + (value === r.id ? " is-on" : "")}
                style={n ? { "--a": (0.22 + 0.68 * (n / max)).toFixed(2) } : undefined}
                tabIndex={onPick && n ? 0 : undefined} role={onPick && n ? "button" : undefined}
                aria-label={`${r.name}: ${n ? n + " ta filial" : "filial yo'q"}`}
                onClick={n ? () => pick(r.id) : undefined}
                onKeyDown={n ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(r.id); } } : undefined}>
                <title>{r.name}{n ? ` — ${n} ta filial` : ""}</title>
              </path>
            );
          })}
          {groups.map((c) => {
            const dim = value && !c.items.some((b) => b.region === value);
            const many = c.items.length > 1;
            const on = pop && pop.key === c.items[0].id;
            return (
              <g key={c.items[0].id} className={"uzmap__pin" + (dim ? " is-dim" : "") + (on ? " is-on" : "")} transform={`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)})`}
                tabIndex={0} role="button" aria-label={c.items.map((b) => b.name).join(", ")} aria-expanded={!!on}
                onClick={() => openPin(c)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPin(c); } }}>
                <circle className="uzmap__ring" r={many ? 16 : 8} />
                <circle r={many ? 16 : 8} />
                {many && <text y="5.5" textAnchor="middle">{c.items.length}</text>}
              </g>
            );
          })}
        </svg>
        {pop && (
          <div key={pop.key} className={"uzmap__pop" + side + below} role="dialog" aria-label={pop.items.length > 1 ? `${pop.items.length} ta filial` : pop.items[0].name}
            style={{ left: px * 100 + "%", top: py * 100 + "%" }}>
            {pop.items.length > 1 && <small className="uzmap__pop-head">{REGION_NAME[pop.items[0].region]} · {pop.items.length} ta filial</small>}
            {pop.items.map((b) => {
              const open = branchOpen(b);
              return (
                <div className="uzmap__pop-row" key={b.id}>
                  <b>{b.name}</b>
                  {pop.items.length === 1 && <span className="uzmap__pop-addr">{b.address}</span>}
                  <span className={"uzmap__pop-st" + (open ? " is-open" : "")}>{open ? "Ochiq" : "Yopiq"} · {b.open}–{b.close}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <figcaption className="uzmap__src">{UZ_ATTRIBUTION}</figcaption>
    </figure>
  );
}
