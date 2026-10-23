import { useMemo, useRef, useState } from "react";

const BITS = ["🍔", "🔥", "🧀", "🍅", "🥬", "🥓", "✨"];
const HINTS = ["Yana! 😋", "Ham-ham! 🍔", "Och qoldingizmi? 👇", "Menyuga o'ting! 🔥"];

/* Olov ustidagi double cheeseburger: orqasida olov tillari, qatlamlari "nafas oladi" */
const SEEDS = [[120, 172, -35], [150, 142, -20], [186, 122, -8], [224, 114, 10], [260, 124, 22], [294, 142, 35], [320, 172, 48], [138, 194, -15], [180, 166, 5], [222, 152, 0], [264, 164, 15], [302, 194, 25], [204, 192, -5], [246, 194, 12]];
const PATTY_DOTS = [[96, 0], [128, 6], [164, -2], [196, 5], [232, -3], [268, 4], [304, -1], [334, 5]];

function Patty({ y, cls }) {
  return (
    <g className={"b-layer " + cls}>
      <path d={`M58 ${y + 16} Q58 ${y} 76 ${y} H344 Q362 ${y} 362 ${y + 16} V${y + 22} Q362 ${y + 38} 344 ${y + 38} H76 Q58 ${y + 38} 58 ${y + 22}Z`} fill="url(#fb-patty)" stroke="#2A1409" strokeWidth="2" />
      <path d={`M72 ${y + 9} Q210 ${y + 3} 348 ${y + 9}`} stroke="#8A4E2A" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".7" />
      {PATTY_DOTS.map(([x, d]) => <circle key={x} cx={x} cy={y + 22 + d} r="2.4" fill="#24110A" stroke="none" opacity=".55" />)}
    </g>
  );
}

function Burger() {
  return (
    <svg viewBox="0 0 420 420" aria-hidden="true">
      <defs>
        <radialGradient id="fb-bunTop" cx=".38" cy=".25" r=".85">
          <stop offset="0" stopColor="#FFD58E" /><stop offset=".45" stopColor="#F2A545" /><stop offset="1" stopColor="#B9681F" />
        </radialGradient>
        <linearGradient id="fb-bunBot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#EFAE5C" /><stop offset="1" stopColor="#B86A24" /></linearGradient>
        <linearGradient id="fb-patty" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#74401F" /><stop offset="1" stopColor="#3A1D0D" /></linearGradient>
        <linearGradient id="fb-cheese" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE066" /><stop offset="1" stopColor="#FFAE1A" /></linearGradient>
        <radialGradient id="fb-tomato" cx=".5" cy=".4" r=".7"><stop offset="0" stopColor="#FF8A6A" /><stop offset="1" stopColor="#D5321C" /></radialGradient>
        <linearGradient id="fb-lettuce" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A6E06A" /><stop offset="1" stopColor="#4BA93A" /></linearGradient>
        <linearGradient id="fb-flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#FFE9A0" /><stop offset=".35" stopColor="#FFB21E" /><stop offset=".72" stopColor="#FF5A1A" /><stop offset="1" stopColor="#E8320A" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fb-flameIn" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#FFFBE6" /><stop offset=".55" stopColor="#FFD25A" /><stop offset="1" stopColor="#FF9A2E" stopOpacity=".1" />
        </linearGradient>
      </defs>

      {/* olov tillari — burger orqasida */}
      {/* kattalashtirilgan: bulochka ortidan balandga ko'tarilib turadi */}
      <g className="b-flames" transform="translate(210 318) scale(1.5 1.75) translate(-210 -300)">
        <path className="flame f1" d="M120 300 C88 290 84 250 108 222 C110 240 120 244 122 234 C120 214 132 196 146 188 C144 214 160 226 158 250 C168 244 168 236 172 230 C180 262 166 296 120 300Z" fill="url(#fb-flame)" stroke="none" opacity=".85" />
        <path className="flame f2" d="M300 300 C332 290 336 250 312 222 C310 240 300 244 298 234 C300 214 288 196 274 188 C276 214 260 226 262 250 C252 244 252 236 248 230 C240 262 254 296 300 300Z" fill="url(#fb-flame)" stroke="none" opacity=".85" />
        <path className="flame f3" d="M210 300 C140 280 120 200 168 140 C170 180 190 190 196 170 C186 120 214 70 252 40 C246 100 288 130 292 180 C302 160 300 130 318 116 C344 176 330 280 210 300Z" fill="url(#fb-flame)" stroke="none" />
        <path className="flame f4" d="M210 296 C170 286 160 230 190 190 C192 214 204 220 208 206 C204 176 222 146 242 128 C240 170 266 186 266 220 C276 210 278 196 284 188 C296 236 280 290 210 296Z" fill="url(#fb-flameIn)" stroke="none" />
      </g>

      <ellipse className="b-shadow" cx="210" cy="404" rx="150" ry="13" fill="rgba(0,0,0,.45)" stroke="none" />

      <g className="b-layer b-bottom">
        <path d="M70 336 H350 Q362 336 358 348 Q350 376 306 378 H114 Q70 376 62 348 Q58 336 70 336Z" fill="url(#fb-bunBot)" stroke="#8E4E17" strokeWidth="2" />
        <path d="M104 356 Q140 368 190 368" stroke="#FFD49A" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".7" />
      </g>
      <Patty y={298} cls="b-l1" />
      <g className="b-layer b-l2">
        <path d="M60 294 H360 Q368 294 362 302 L350 312 Q344 318 340 310 L334 302 L310 304 Q304 330 296 330 Q288 330 288 310 L286 304 L232 304 Q228 322 220 322 Q212 322 212 306 L210 304 L150 304 Q146 340 136 340 Q126 340 126 314 L124 304 L86 304 Q78 316 70 310 L60 302 Q52 294 60 294Z" fill="url(#fb-cheese)" stroke="#D98A0B" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      <g className="b-layer b-l3">
        <path d="M66 288 Q90 276 114 288 T162 288 T210 288 T258 288 T306 288 T354 288 L354 298 Q330 310 306 298 T258 298 T210 298 T162 298 T114 298 T66 298Z" fill="#C4472F" stroke="#7E2516" strokeWidth="1.5" />
        <path d="M70 293 Q94 283 118 293 T166 293 T214 293 T262 293 T310 293 T350 292" stroke="#F3A48E" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      <Patty y={248} cls="b-l4" />
      <g className="b-layer b-l5">
        <path d="M58 244 H362 Q370 244 364 252 L352 260 Q346 266 342 258 L336 250 L300 252 Q296 274 288 274 Q280 274 280 256 L278 252 L200 252 Q196 280 186 280 Q176 280 176 260 L174 252 L112 252 Q108 268 100 268 Q92 268 92 256 L90 252 L66 252 Q54 250 58 244Z" fill="url(#fb-cheese)" stroke="#D98A0B" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      <g className="b-layer b-l6">
        {[[120, 40], [208, 46], [296, 40]].map(([cx, rx]) => <ellipse key={cx} cx={cx} cy="240" rx={rx} ry="6" fill="none" stroke="#C27BB8" strokeWidth="4" />)}
      </g>
      <g className="b-layer b-l7">
        <ellipse cx="140" cy="230" rx="74" ry="10" fill="url(#fb-tomato)" stroke="#A8261A" strokeWidth="1.5" />
        <ellipse cx="282" cy="230" rx="74" ry="10" fill="url(#fb-tomato)" stroke="#A8261A" strokeWidth="1.5" />
        {[112, 150, 186, 252, 290, 326].map((x) => <ellipse key={x} cx={x} cy="230" rx="5" ry="2.5" fill="#FFD2B8" stroke="none" opacity=".8" />)}
      </g>
      <g className="b-layer b-l8">
        <path d="M48 222 Q60 206 74 220 Q86 204 100 218 Q114 202 128 218 Q142 204 156 218 Q170 202 184 218 Q198 204 212 218 Q226 202 240 218 Q254 204 268 218 Q282 202 296 218 Q310 204 324 218 Q338 202 352 218 Q366 206 372 222 Q362 236 344 230 Q330 240 314 230 Q296 240 280 230 Q262 240 246 230 Q228 240 212 230 Q194 240 178 230 Q160 240 144 230 Q126 240 110 230 Q92 240 76 230 Q58 236 48 222Z" fill="url(#fb-lettuce)" stroke="#3E8E2E" strokeWidth="2" strokeLinejoin="round" />
      </g>
      <g className="b-layer b-top">
        <path d="M64 206 Q60 94 210 88 Q360 94 356 206 Q356 218 342 218 H78 Q64 218 64 206Z" fill="url(#fb-bunTop)" stroke="#9A5418" strokeWidth="2" />
        <path d="M108 132 Q148 102 198 96" stroke="#FFF0D2" strokeWidth="11" fill="none" strokeLinecap="round" opacity=".55" />
        <path d="M100 160 Q104 150 110 144" stroke="#FFF0D2" strokeWidth="6" fill="none" strokeLinecap="round" opacity=".4" />
        {SEEDS.map(([x, y, r]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="3.4" ry="6.4" transform={`rotate(${r} ${x} ${y})`} fill="#FFF3DC" stroke="#D3A262" strokeWidth="1" />)}
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
      <div className="hero__word" aria-hidden="true">OLOV</div>
      <div className="embers" aria-hidden="true">
        {embers.map((m) => <i key={m.i} style={{ left: m.left + "%", "--s": m.s + "px", "--t": m.t + "s", "--dl": m.dl + "s", "--x": m.x + "px" }} />)}
      </div>

      <div className="hero__text">
        <span className="tag tag--tilt">🔥 Grilda, olov ustida</span>
        <h1>Issiq.<br /><span className="outline">Shirali.</span><br />Tez.</h1>
        <p>Har kuni yangi mol go'shti, yumshoq bulochka va faqat bizda bor OLOV sousi. Buyurtma bering — kuryer 30 daqiqada eshigingizda.</p>
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
