/* =========================================================
   Ovoz effektlari — fayl yuklanmaydi, hammasi Web Audio orqali
   shu yerda "chalinadi" (sayt yengil qoladi, internet sarflanmaydi).
   O'chirib qo'yish tanlovi brauzerda eslab qolinadi.
   ========================================================= */
let ctx = null;
let master = null;
let noiseBuf = null;

const KEY = { site: "olov_sound", admin: "olov_admin_sound" };
let scope = "site";

function stored() { try { return localStorage.getItem(KEY[scope]); } catch (e) { return null; } }
let enabled = stored() !== "off";

function ac() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.55;
  // Yumshoq kompressor — bir vaqtda bir nechta ovoz qattiq chiqib ketmasin
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp);
  comp.connect(ctx.destination);
  return ctx;
}

// iOS/Safari: ovoz faqat foydalanuvchi ekranga tekkanidan keyin ochiladi
function unlock() {
  const c = ac();
  if (c && c.state === "suspended") c.resume();
}
if (typeof window !== "undefined") {
  ["pointerdown", "keydown", "touchstart"].forEach((e) => window.addEventListener(e, unlock, { passive: true }));
}

function noise() {
  if (noiseBuf) return noiseBuf;
  const c = ac();
  noiseBuf = c.createBuffer(1, c.sampleRate * 0.6, c.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

/* Bitta nota: chastota (yoki sirpanish), shakl, davomiylik, kechikish, balandlik */
function tone({ f, to, type = "sine", dur = 0.15, at = 0, vol = 0.3, attack = 0.005 }) {
  const c = ac();
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/* Shitirlash (olov/qovurilish) — filtrlangan shovqin */
function sizzle({ dur = 0.25, at = 0, vol = 0.12, freq = 3500, q = 0.8 }) {
  const c = ac();
  const t = c.currentTime + at;
  const s = c.createBufferSource();
  s.buffer = noise();
  const flt = c.createBiquadFilter();
  flt.type = "bandpass";
  flt.frequency.value = freq;
  flt.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(flt);
  flt.connect(g);
  g.connect(master);
  s.start(t, Math.random() * 0.2);
  s.stop(t + dur + 0.02);
}

const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, A5 = 880, D6 = 1174.66, E6 = 1318.5;

const SOUNDS = {
  // Savatga qo'shildi: "pop" + qisqa shitirlash
  add() { tone({ f: 420, to: 980, type: "triangle", dur: 0.13, vol: 0.32 }); sizzle({ dur: 0.18, at: 0.04, vol: 0.06 }); },
  plus() { tone({ f: 600, to: 900, type: "triangle", dur: 0.08, vol: 0.2 }); },
  minus() { tone({ f: 700, to: 380, type: "triangle", dur: 0.1, vol: 0.2 }); },
  tap() { tone({ f: 1400, type: "sine", dur: 0.04, vol: 0.12 }); },
  open() { tone({ f: 300, to: 620, type: "sine", dur: 0.12, vol: 0.12 }); },
  success() { tone({ f: E5, dur: 0.14, vol: 0.25 }); tone({ f: A5, dur: 0.22, at: 0.09, vol: 0.25 }); },
  error() { tone({ f: 220, type: "square", dur: 0.12, vol: 0.08 }); tone({ f: 165, type: "square", dur: 0.18, at: 0.11, vol: 0.08 }); },
  // Buyurtma qabul qilindi: ko'tariluvchi akkord + olov "vush"
  order() {
    [C5, E5, G5, C6].forEach((f, i) => tone({ f, type: "triangle", dur: 0.32, at: i * 0.09, vol: 0.28 }));
    tone({ f: E6, dur: 0.6, at: 0.36, vol: 0.12 });
    sizzle({ dur: 0.7, at: 0.05, vol: 0.08, freq: 1800, q: 0.5 });
  },
  whoosh() { sizzle({ dur: 0.5, vol: 0.14, freq: 900, q: 0.6 }); tone({ f: 180, to: 520, type: "sine", dur: 0.45, vol: 0.1 }); },
  tick() { tone({ f: 2200, type: "square", dur: 0.018, vol: 0.05, attack: 0.001 }); },
  win() {
    [G5, C6, E6].forEach((f, i) => tone({ f, type: "triangle", dur: 0.18, at: i * 0.1, vol: 0.26 }));
    [C6, E6, G5 * 2].forEach((f) => tone({ f, type: "triangle", dur: 0.7, at: 0.32, vol: 0.14 }));
    for (let i = 0; i < 6; i++) tone({ f: 2000 + Math.random() * 1500, dur: 0.06, at: 0.4 + i * 0.07, vol: 0.06 });
  },
  star(n = 5) { tone({ f: [C5, D6 / 2, E5, G5, C6][Math.max(0, Math.min(4, n - 1))], type: "sine", dur: 0.18, vol: 0.22 }); },
  // Admin: yangi buyurtma qo'ng'irog'i (ikki marta "din-don")
  bell() {
    [0, 0.5].forEach((at) => { tone({ f: A5, dur: 0.35, at, vol: 0.3 }); tone({ f: D6 * 0.75 * 2, dur: 0.45, at: at + 0.16, vol: 0.26 }); });
  },
};

export const sound = {
  // "admin" — boshqaruv paneli o'z sozlamasini alohida eslab qoladi
  setScope(s) { scope = s; enabled = stored() !== "off"; },
  get on() { return enabled; },
  set(on) {
    enabled = !!on;
    try { localStorage.setItem(KEY[scope], on ? "on" : "off"); } catch (e) { /* */ }
    if (on) this.play("success");
  },
  play(name, arg) {
    if (!enabled || !SOUNDS[name]) return;
    try {
      const c = ac();
      if (!c) return;
      if (c.state === "suspended") c.resume();
      SOUNDS[name](arg);
    } catch (e) { /* ovoz ixtiyoriy — xato saytni to'xtatmasin */ }
  },
};
