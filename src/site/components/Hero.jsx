import { useMemo, useRef, useState } from "react";

const BITS = ["🍔", "🔥", "🧀", "🍅", "🥬", "🥓", "✨"];
const HINTS = ["Yana! 😋", "Ham-ham! 🍔", "Och qoldingizmi? 👇", "Menyuga o'ting! 🔥"];

/* Qatlamlari "nafas oladigan", ko'z qisadigan burger */
function Burger() {
  return (
    <svg viewBox="0 0 420 420" aria-hidden="true">
      <ellipse className="b-shadow" cx="210" cy="388" rx="140" ry="14" fill="rgba(26,18,16,.22)" />
      <g className="b-layer b-bottom">
        <path d="M62 318 Q62 306 74 306 H346 Q358 306 358 318 Q352 366 300 368 H120 Q68 366 62 318 Z" fill="#F2A541" />
        <path d="M96 340 Q120 352 150 352" stroke="#FFD79A" strokeWidth="8" fill="none" strokeLinecap="round" />
      </g>
      <g className="b-layer b-patty">
        <path d="M50 280 Q50 262 72 262 H348 Q370 262 370 280 V286 Q370 304 348 304 H72 Q50 304 50 286 Z" fill="#6E3B1F" />
        <path d="M90 276 l22 0 M150 284 l26 0 M220 274 l24 0 M286 284 l22 0" stroke="#A8643A" strokeWidth="5" strokeLinecap="round" />
      </g>
      <g className="b-layer b-cheese">
        <path d="M56 250 H364 L356 262 L334 260 L324 290 L308 262 L272 264 L256 300 L240 264 L184 266 L170 292 L154 264 L104 264 L90 288 L74 262 Z" fill="#FFC229" strokeLinejoin="round" />
      </g>
      <g className="b-layer b-tomato">
        <rect x="70" y="228" width="134" height="24" rx="12" fill="#F0452B" />
        <rect x="216" y="228" width="134" height="24" rx="12" fill="#F0452B" />
        {[110, 160, 260, 310].map((x) => <circle key={x} cx={x} cy="240" r="4" fill="#FFB199" stroke="none" />)}
      </g>
      <g className="b-layer b-lettuce">
        <path d="M44 222 Q64 204 84 222 T124 222 T164 222 T204 222 T244 222 T284 222 T324 222 T364 222 Q380 232 362 238 H58 Q40 232 44 222Z" fill="#7BC94C" strokeLinejoin="round" />
      </g>
      <g className="b-layer b-top">
        <path d="M58 204 Q58 82 210 78 Q362 82 362 204 Q362 216 348 216 H72 Q58 216 58 204 Z" fill="#F2A541" />
        <path d="M104 132 Q136 104 182 98" stroke="#FFD79A" strokeWidth="10" fill="none" strokeLinecap="round" />
        <g className="seeds">
          {[[130, 160, -30], [292, 150, 25], [210, 104, 80], [262, 110, 50], [320, 188, 10], [96, 190, -10]].map(([x, y, r]) => (
            <ellipse key={x} cx={x} cy={y} rx="5" ry="9" transform={`rotate(${r} ${x} ${y})`} />
          ))}
        </g>
        <g className="face">
          <g className="eyes">
            <ellipse cx="180" cy="158" rx="10" ry="12" fill="#1A1210" stroke="none" />
            <ellipse cx="240" cy="158" rx="10" ry="12" fill="#1A1210" stroke="none" />
            <circle cx="183" cy="153" r="3.5" fill="#fff" stroke="none" />
            <circle cx="243" cy="153" r="3.5" fill="#fff" stroke="none" />
          </g>
          <ellipse cx="160" cy="182" rx="12" ry="6" fill="#FF7A5C" stroke="none" opacity=".7" />
          <ellipse cx="260" cy="182" rx="12" ry="6" fill="#FF7A5C" stroke="none" opacity=".7" />
          <path className="mouth" d="M194 178 Q210 196 226 178" fill="none" strokeWidth="6" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

function Bits() {
  return (
    <>
      <svg className="bit bit--tomato" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="25" fill="#F0452B" stroke="#1A1210" strokeWidth="4" /><circle cx="30" cy="30" r="15" fill="#FF7A5C" /><circle cx="24" cy="26" r="3" fill="#FFE1A8" /><circle cx="36" cy="27" r="3" fill="#FFE1A8" /><circle cx="30" cy="37" r="3" fill="#FFE1A8" /></svg>
      <svg className="bit bit--cheese" viewBox="0 0 60 60" aria-hidden="true"><path d="M6 46 L30 8 L54 46 Z" fill="#FFC229" stroke="#1A1210" strokeWidth="4" strokeLinejoin="round" /><circle cx="30" cy="33" r="4" fill="#E9A400" /><circle cx="20" cy="40" r="3" fill="#E9A400" /></svg>
      <svg className="bit bit--pickle" viewBox="0 0 60 60" aria-hidden="true"><ellipse cx="30" cy="30" rx="24" ry="17" fill="#8DBF3F" stroke="#1A1210" strokeWidth="4" /><ellipse cx="30" cy="30" rx="14" ry="9" fill="#C6E27A" /><circle cx="26" cy="29" r="2" fill="#6E9A2A" /><circle cx="34" cy="31" r="2" fill="#6E9A2A" /></svg>
      <svg className="bit bit--fries" viewBox="0 0 60 70" aria-hidden="true"><rect x="16" y="6" width="7" height="34" rx="2" fill="#FFD24D" stroke="#1A1210" strokeWidth="3" /><rect x="26" y="2" width="7" height="38" rx="2" fill="#FFD24D" stroke="#1A1210" strokeWidth="3" /><rect x="36" y="8" width="7" height="32" rx="2" fill="#FFD24D" stroke="#1A1210" strokeWidth="3" /><path d="M10 30 H50 L45 66 H15 Z" fill="#F0452B" stroke="#1A1210" strokeWidth="4" strokeLinejoin="round" /><path d="M22 44 Q30 52 38 44" stroke="#FFF3E3" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
      <svg className="bit bit--chili" viewBox="0 0 60 60" aria-hidden="true"><path d="M14 18 Q40 14 50 44 Q52 52 44 48 Q30 36 12 26 Q6 20 14 18Z" fill="#E8402A" stroke="#1A1210" strokeWidth="4" strokeLinejoin="round" /><path d="M14 18 Q8 10 14 6" stroke="#4CAF50" strokeWidth="5" fill="none" strokeLinecap="round" /></svg>
      <svg className="bit bit--seed" viewBox="0 0 30 30" aria-hidden="true"><ellipse cx="15" cy="15" rx="7" ry="11" fill="#FFF4DD" stroke="#1A1210" strokeWidth="3" transform="rotate(30 15 15)" /></svg>
    </>
  );
}

export default function Hero() {
  const stage = useRef(null);
  const burger = useRef(null);
  const [mouse, setMouse] = useState({ mx: 0, my: 0 });
  const [pops, setPops] = useState([]);
  const [hint, setHint] = useState("Meni bosing! 👆");

  // Uchqunlar faqat bir marta yaratiladi
  const embers = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    i, left: Math.random() * 100, s: 3 + Math.random() * 6, t: 5 + Math.random() * 6, dl: -Math.random() * 10, x: (Math.random() - .5) * 160,
  })), []);

  const hover = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(hover: hover)").matches;
  const onMove = (e) => {
    if (!hover || !stage.current) return;
    const r = stage.current.getBoundingClientRect();
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    setMouse({ mx: clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 1.2)), my: clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 1.2)) });
  };

  const chomp = (e) => {
    const b = burger.current;
    b.classList.remove("is-chomp"); void b.offsetWidth; b.classList.add("is-chomp");
    const r = stage.current.getBoundingClientRect();
    const x = (e.clientX || r.left + r.width / 2) - r.left, y = (e.clientY || r.top + r.height / 2) - r.top;
    const id = Date.now();
    setPops((p) => [...p, ...Array.from({ length: 9 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 9;
      return { key: `${id}-${i}`, emoji: BITS[i % BITS.length], x, y, dx: Math.cos(a) * 130, dy: Math.sin(a) * 130, r: (Math.random() - .5) * 120 };
    })]);
    setTimeout(() => setPops((p) => p.filter((q) => !q.key.startsWith(id + "-"))), 900);
    setHint(HINTS[Math.floor(Math.random() * HINTS.length)]);
  };

  return (
    <section className="hero" onPointerMove={onMove} onPointerLeave={() => setMouse({ mx: 0, my: 0 })}>
      <div className="hero__word" aria-hidden="true">OPUS</div>
      <div className="embers" aria-hidden="true">
        {embers.map((m) => <i key={m.i} style={{ left: m.left + "%", "--s": m.s + "px", "--t": m.t + "s", "--dl": m.dl + "s", "--x": m.x + "px" }} />)}
      </div>

      <div className="hero__text">
        <span className="tag tag--tilt">🔥 Grilda, olov ustida</span>
        <h1>Issiq.<br /><span className="outline">Shirali.</span><br />Tez.</h1>
        <p>Har kuni yangi mol go'shti, yumshoq bulochka va faqat bizda bor OPUS sousi. Buyurtma bering — kuryer 30 daqiqada eshigingizda.</p>
        <div className="hero__cta">
          <a href="#menu" className="btn btn--ink">Menyuni ko'rish →</a>
          <a href="#combo" className="btn btn--cream">Kombo yig'ish</a>
        </div>
        <div className="hero__proof">
          <div className="faces"><span>A</span><span>M</span><span>J</span><span>+</span></div>
          <p><b>★ 4.9</b> · 50 000+ mamnun mijoz</p>
        </div>
      </div>

      <div className="stage" ref={stage} style={{ "--mx": mouse.mx.toFixed(3), "--my": mouse.my.toFixed(3) }}>
        <div className="stage__plate" />
        <svg className="spin-badge" viewBox="0 0 200 200" aria-hidden="true">
          <defs><path id="circ" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" /></defs>
          <circle cx="100" cy="100" r="96" fill="#FFC229" stroke="#1A1210" strokeWidth="5" />
          <text><textPath href="#circ" textLength="446" lengthAdjust="spacingAndGlyphs">30 DAQIQADA YETKAZAMIZ ✦ ISSIQ VA MAZALI ✦</textPath></text>
          <text x="100" y="114" textAnchor="middle" className="spin-badge__mid">30'</text>
        </svg>
        <Bits />
        <button className="burger" ref={burger} onClick={chomp} onAnimationEnd={(e) => { if (e.animationName === "chomp") burger.current.classList.remove("is-chomp"); }} aria-label="Burgerni bosing!">
          <Burger />
        </button>
        <div className="steam" aria-hidden="true"><i /><i /><i /></div>
        <span className="stage__hint">{hint}</span>
        {pops.map((p) => (
          <span key={p.key} className="pop" style={{ left: p.x, top: p.y, "--x": p.dx + "px", "--y": p.dy + "px", "--r": p.r + "deg" }}>{p.emoji}</span>
        ))}
      </div>
    </section>
  );
}
