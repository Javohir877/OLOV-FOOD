import { useRef, useState } from "react";
import { BONUS, WHEEL_PRIZES, WHEEL_PROMOS } from "../../shared/data.js";
import { Store } from "../../shared/store.js";
import { bonusBalance } from "../../shared/cart.js";
import { som } from "../../shared/format.js";
import { useShop } from "../shop.jsx";

const todayKey = () => new Date().toDateString();
const N = WHEEL_PRIZES.length, STEP = 360 / N, R = 150, C = 160;
const COLORS = ["#FF5A1A", "#2A1D17", "#FFB547", "#3A2418"];
const pt = (deg, rad) => [C + rad * Math.sin((deg * Math.PI) / 180), C - rad * Math.cos((deg * Math.PI) / 180)];

export default function Wheel() {
  const { bonus, setBonus, setPromo, toast, setConfettiKey } = useShop();
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
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
    angleRef.current = next;
    setAngle(next);
    setSpinning(true);
    const record = { day: todayKey(), label: prize.label + (prize.sub ? " " + prize.sub : "") };
    Store.set("opus_spin", record);
    setTimeout(() => {
      if (prize.type === "bonus") {
        const b = bonusBalance() + prize.value;
        Store.set("opus_bonus", b);
        setBonus(b);
        toast(`🎉 Tabriklaymiz! +${som(prize.value)} bonus yutdingiz`);
      } else {
        setPromo(prize.code);
        toast(`🎉 ${WHEEL_PROMOS[prize.code].label} — savatga qo'llandi!`);
      }
      setConfettiKey((k) => k + 1);
      setSpinning(false);
      setLast(record);
    }, 5200);
  };

  return (
    <section className="wheel" id="wheel">
      <div className="wheel__text">
        <span className="tag">🎁 Har kuni bepul</span>
        <h2>Omad <span className="hl">g'ildiragi</span></h2>
        <p>Kuniga bir marta aylantiring va chegirma yoki Olov Bonus yuting. Yutgan chegirmangiz savatga avtomatik qo'llanadi.</p>
        <div className="bonus-card">
          <div><small>Olov Bonus balansingiz</small><b id="bonusBalance">{som(bonus)}</b></div>
          <p>Har buyurtmadan <b>{BONUS.rate}%</b> keshbek. Bonus bilan buyurtmaning yarmigacha to'lash mumkin.</p>
        </div>
      </div>
      <div className="wheel__stage">
        <div className="wheel__pointer" aria-hidden="true" />
        <div className="wheel__disc">
          <svg viewBox="0 0 320 320" aria-label="Omad g'ildiragi">
            <circle cx="160" cy="160" r="159" fill="#120D0A" />
            <g id="wheelRotor" style={{ transform: `rotate(${angle}deg)`, transition: spinning ? "transform 5s cubic-bezier(.12,.75,.1,1)" : "none" }}>
              {WHEEL_PRIZES.map((p, i) => {
                const a0 = i * STEP, a1 = a0 + STEP, mid = a0 + STEP / 2;
                const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R);
                const ink = i % 2 ? "#FFF4EA" : "#1A0F08";
                return (
                  <g key={i}>
                    <path d={`M${C},${C} L${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`} fill={COLORS[i % COLORS.length]} stroke="#0C0A09" strokeWidth="2" />
                    <g transform={`rotate(${mid} ${C} ${C})`}>
                      <text x={C} y={C - R + 42} textAnchor="middle" fill={ink} className="wheel__lbl">{p.label}</text>
                      {p.sub && <text x={C} y={C - R + 60} textAnchor="middle" fill={ink} className="wheel__sub">{p.sub}</text>}
                    </g>
                  </g>
                );
              })}
            </g>
            {Array.from({ length: N * 2 }, (_, i) => {
              const [x, y] = pt(i * (STEP / 2), R + 6);
              return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="3.5" fill={i % 2 ? "#FFB547" : "#FFF4EA"} />;
            })}
            <circle cx="160" cy="160" r="30" fill="#0C0A09" stroke="#FFB547" strokeWidth="3" />
            <text x="160" y="168" textAnchor="middle" className="wheel__hub">🔥</text>
          </svg>
        </div>
        <button className="wheel__btn" onClick={spin} disabled={!!done || spinning}>{done && !spinning ? "ERTAGA" : "AYLANTIR"}</button>
        <p className="wheel__note">
          {done && !spinning ? <>Bugungi yutuq: <b>{last.label}</b>. Ertaga yana keling!</> : "Bugun 1 ta urinishingiz bor 🎯"}
        </p>
      </div>
    </section>
  );
}
