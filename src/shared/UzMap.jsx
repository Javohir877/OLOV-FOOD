/* O'zbekiston xaritasi: viloyatlar filiallar soniga qarab bo'yaladi (kartogramma),
   filiallar — nuqtalar. Bir joyda zich turgan filiallar (masalan, Toshkentdagi 6 ta)
   bitta raqamli belgi bo'lib ko'rinadi. Sayt va admin panel ikkalasida ishlatiladi. */
import { UZ_ATTRIBUTION, UZ_REGIONS, UZ_VIEW, uzPoint } from "./uzmap.js";
import { isOpenAt } from "./hours.js";
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

  return (
    <figure className={"uzmap" + (value ? " has-pick" : "")}>
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
        {clusters(branches).map((c) => {
          const dim = value && !c.items.some((b) => b.region === value);
          const many = c.items.length > 1;
          return (
            <g key={c.items[0].id} className={"uzmap__pin" + (dim ? " is-dim" : "")} transform={`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)})`} onClick={() => pick(c.items[0].region)}>
              <title>{c.items.map((b) => b.name).join(", ")}</title>
              <circle r={many ? 16 : 8} />
              {many && <text y="5.5" textAnchor="middle">{c.items.length}</text>}
            </g>
          );
        })}
      </svg>
      <figcaption className="uzmap__src">{UZ_ATTRIBUTION}</figcaption>
    </figure>
  );
}
