import { useRef, useState } from "react";
import { Gem } from "lucide-react";
import { BONUS, WHEEL_PRIZES, WHEEL_PROMOS } from "../../shared/data.js";
import { Store } from "../../shared/store.js";
import { bonusBalance } from "../../shared/cart.js";
import { som } from "../../shared/format.js";
import { useShop } from "../shop.jsx";
import { sound } from "../../shared/sound.js";

const todayKey = () => new Date().toDateString();
const N = WHEEL_PRIZES.length, STEP = 360 / N, R = 146, C = 160;
// Bo'laklar: qizil va oq navbatma-navbat; eng katta yutuq (eng kam ehtimol) — oltin rangda
const maxBonus = Math.max(...WHEEL_PRIZES.filter((p) => p.type === "bonus").map((p) => p.value));
const segStyle = (p, i) => (p.type === "bonus" && p.value === maxBonus ? ["#FFB800", "#1F1915"] : i % 2 ? ["#FFFFFF", "#1F1915"] : ["#D7261E", "#FFFFFF"]);
// cubic-bezier(.12,.75,.1,1) — g'ildirak animatsiyasining egri chizig'i (vaqt -> aylanish ulushi)
const bez = (a, b) => (s) => 3 * a * s * (1 - s) * (1 - s) + 3 * b * s * s * (1 - s) + s * s * s;
const bx = bez(0.12, 0.1), by = bez(0.75, 1);
const SPIN_EASE = (x) => {
  let lo = 0, hi = 1;
  for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (bx(mid) < x) lo = mid; else hi = mid; }
  return by((lo + hi) / 2);
};
const pt = (deg, rad) => [C + rad * Math.sin((deg * Math.PI) / 180), C - rad * Math.cos((deg * Math.PI) / 180)];
const seg = (i, r) => {
  const [x0, y0] = pt(i * STEP, r), [x1, y1] = pt(i * STEP + STEP, r);
  return `M${C},${C} L${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`;
};

export default function Wheel() {
  const { bonus, setBonus, setPromo, toast, setConfettiKey } = useShop();
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState(-1); // to'xtagach yutgan bo'lak yonib turadi
  const [last, setLast] = useState(() => Store.get("opus_spin", null));
  const angleRef = useRef(0);
  const done = last && last.day === todayKey();

  const spin = () => {
    if (done || spinning) return;
    const total = WHEEL_PRIZES.reduce((s, p) => s + p.weight, 0);
    let roll = Math.random() * total, idx = 0;
    while (roll >= WHEEL_PRIZES[idx].weight) { roll -= WHEEL_PRIZES[idx].weight; idx += 1; }
    const prize = WHEEL_PRIZES[idx];
    // Ko'rsatkich tepada: tanlangan bo'lak markazi 0° ga kelishi kerak (+ bo'lak ichida kichik tasodifiy siljish)
    const target = 360 - (idx * STEP + STEP / 2) + (Math.random() - .5) * STEP * .6;
    const next = angleRef.current + 360 * 6 + (((target - (angleRef.current % 360)) + 360) % 360);
    const prevAngle = angleRef.current;
    angleRef.current = next;
    setWon(-1);
    setAngle(next);
    setSpinning(true);
    sound.play("whoosh");
    // Har bir bo'lak ko'rsatkich ostidan o'tganda "chiq" etadi — g'ildirak sekinlashgani eshitiladi
    const from = prevAngle, t0 = Date.now();
    let lastSeg = Math.floor(from / STEP);
    const follow = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / 5000);
      const s = Math.floor((from + (next - from) * SPIN_EASE(p)) / STEP);
      if (s !== lastSeg) sound.play("tick");
      lastSeg = s;
      if (p >= 1) clearInterval(follow);
    }, 25);
    const record = { day: todayKey(), label: prize.label + (prize.sub ? " " + prize.sub : "") };
    Store.set("opus_spin", record);
    setTimeout(() => {
      if (prize.type === "bonus") {
        const b = bonusBalance() + prize.value;
        Store.set("opus_bonus", b);
        setBonus(b);
        toast(`Tabriklaymiz! +${som(prize.value)} bonus yutdingiz`);
      } else {
        setPromo(prize.code);
        toast(`${WHEEL_PROMOS[prize.code].label} — savatga qo'llandi`);
      }
      setConfettiKey((k) => k + 1);
      sound.play("win");
      setSpinning(false);
      setWon(idx);
      setLast(record);
    }, 5200);
  };

  return (
    <section className="wheel-band" id="wheel">
      <div className="wheel">
        <div className="wheel__text">
          <h2>Omad g'ildiragi</h2>
          <p>Kuniga bir marta aylantiring. Chegirma tushsa, savatga o'zi qo'llanadi. Bonus tushsa, hisobingizga qo'shiladi.</p>
          <ul className="wheel__prizes" aria-label="Yutuqlar">
            {WHEEL_PRIZES.map((p, i) => <li key={i} className={p.type === "bonus" && p.value === maxBonus ? "is-top" : ""}>{p.label}{p.sub ? " " + p.sub : ""}</li>)}
          </ul>
          <div className="bonus-card">
            <span className="bonus-card__ic"><Gem size={22} aria-hidden="true" /></span>
            <div>
              <small>Olov Bonus balansingiz</small>
              <b id="bonusBalance">{som(bonus)}</b>
            </div>
            <p>Har buyurtmadan {BONUS.rate}% qaytadi. Bonus bilan buyurtmaning yarmigacha to'lash mumkin.</p>
          </div>
        </div>

        <div className="wheel__stage">
          <div className="wheel__pointer" aria-hidden="true" />
          <div className="wheel__disc">
            <svg viewBox="0 0 320 320" role="img" aria-label="Omad g'ildiragi">
              <circle cx={C} cy={C} r="159" fill="#2A221D" />
              {Array.from({ length: N * 2 }, (_, i) => {
                const [x, y] = pt(i * (STEP / 2) + STEP / 4, 153);
                return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.6" className={"wheel__bulb" + (spinning ? " is-run" : "")} style={{ animationDelay: `${(i % 2) * 0.25}s` }} />;
              })}
              <g id="wheelRotor" style={{ transform: `rotate(${angle}deg)`, transition: spinning ? "transform 5s cubic-bezier(.12,.75,.1,1)" : "none" }}>
                {WHEEL_PRIZES.map((p, i) => {
                  const [fill, ink] = segStyle(p, i);
                  return (
                    <g key={i}>
                      <path d={seg(i, R)} fill={fill} stroke="#2A221D" strokeWidth="1.5" />
                      {won === i && <path d={seg(i, R)} className="wheel__win" />}
                      <g transform={`rotate(${i * STEP + STEP / 2} ${C} ${C})`}>
                        <text x={C} y={C - R + 40} textAnchor="middle" fill={ink} className="wheel__lbl">{p.label}</text>
                        {p.sub && <text x={C} y={C - R + 57} textAnchor="middle" fill={ink} className="wheel__sub">{p.sub}</text>}
                      </g>
                    </g>
                  );
                })}
              </g>
              <circle cx={C} cy={C} r="34" fill="#FFFFFF" stroke="#2A221D" strokeWidth="4" />
              {/* markazda — OLOV FOOD olovi */}
              <g transform={`translate(${C - 19} ${C - 20}) scale(.6)`} aria-hidden="true">
                <path d="M32 58 C16 56 10 44 14 32 C16 26 20 22 22 18 C23 26 27 28 29 25 C27 16 32 8 40 4 C38 14 46 20 47 30 C50 26 49 22 52 20 C58 30 56 54 32 58Z" fill="#D7261E" />
                <path d="M32 54 C24 52 21 45 23 39 C25 34 28 32 29 28 C31 33 33 34 34 31 C34 26 37 22 41 20 C40 27 44 31 44 37 C45 35 46 33 47 32 C50 40 46 53 32 54Z" fill="#FFB800" />
              </g>
            </svg>
          </div>
          <button className="btn btn--fire btn--lg wheel__btn" onClick={spin} disabled={!!done || spinning}>
            {spinning ? "Aylanmoqda..." : done ? "Ertaga yana aylantiring" : "Aylantirish"}
          </button>
          <p className="wheel__note" aria-live="polite">
            {done && !spinning ? <>Bugungi yutuq: <b>{last.label}</b></> : "Bugun 1 ta urinishingiz bor"}
          </p>
        </div>
      </div>
    </section>
  );
}
