/* Buyurtma berish (checkout) va to'lov oynalari: ilova QR, karta SMS, jarayon */
import { useEffect, useMemo, useRef, useState } from "react";
import { BONUS, PAY_LOGOS, PAY_METHODS, LOGO_NAMES } from "../../shared/data.js";
import { Store } from "../../shared/store.js";
import { lineInfo, earnedFor } from "../../shared/cart.js";
import { cardBrand, luhn, maskPhone, som } from "../../shared/format.js";
import { LogoTile } from "../../shared/Img.jsx";
import { useShop } from "../shop.jsx";
import { Sheet } from "./Sheets.jsx";

const TIMES = ["Imkon qadar tez", "1 soatdan keyin", "2 soatdan keyin", "Kechqurun 19:00–21:00"];

function Field({ label, error, children }) {
  return (
    <div className={"field" + (error ? " bad" : "")}>
      <label>{label}</label>
      {children}
      {error ? <span className="field__err">{error}</span> : null}
    </div>
  );
}

function CardForm({ card, setCard, errors }) {
  const d = card.num.replace(/\D/g, "");
  const brand = cardBrand(d);
  return (
    <>
      <div className="plastic">
        <span className="plastic__brand">{brand && <img src={PAY_LOGOS[brand]} alt={LOGO_NAMES[brand]} data-logo={brand} />}</span>
        <span className="plastic__chip" />
        <span className="plastic__num">{(d + "•".repeat(16 - d.length)).replace(/(.{4})(?=.)/g, "$1 ")}</span>
        <div className="plastic__row"><span>OPUS PAY</span><span>{card.exp || "MM/YY"}</span></div>
      </div>
      <div className="row2">
        <Field label="Karta raqami" error={errors.num}>
          <input inputMode="numeric" placeholder="8600 •••• •••• ••••" autoComplete="cc-number" value={card.num}
            onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 16); setCard({ ...card, num: v.replace(/(\d{4})(?=\d)/g, "$1 ") }); }} />
        </Field>
        <Field label="Amal qilish muddati" error={errors.exp}>
          <input inputMode="numeric" placeholder="MM/YY" autoComplete="cc-exp" value={card.exp}
            onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setCard({ ...card, exp: v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v }); }} />
        </Field>
      </div>
    </>
  );
}

export function Checkout() {
  const shop = useShop();
  const { checkoutOpen, setCheckoutOpen, cart, byId, totals: t, orderType, setOrderType, payMethod, setPayMethod, useBonus, setUseBonus, bonus, promo, setPay, placeOrder } = shop;
  const saved = useMemo(() => Store.get("opus_customer", {}) || {}, [checkoutOpen]);
  const [f, setF] = useState({});
  const [card, setCard] = useState({ num: "", exp: "" });
  const [errors, setErrors] = useState({});
  const root = useRef(null);

  // Har ochilganda avvalgi mijoz ma'lumotlari bilan to'ldiramiz
  useEffect(() => {
    if (!checkoutOpen) return;
    setF({ name: saved.name || "", phone: saved.phone || "+998 ", address: saved.address || "", flat: saved.flat || "", floor: saved.floor || "", time: TIMES[0], note: "" });
    setErrors({});
    if (root.current) root.current.scrollTop = 0;
  }, [checkoutOpen, saved]);

  const set = (k) => (e) => setF({ ...f, [k]: k === "phone" ? maskPhone(e.target.value) : e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const err = {};
    if ((f.name || "").trim().length < 2) err.name = "Ismingizni kiriting";
    if ((f.phone || "").replace(/\D/g, "").length !== 12) err.phone = "Raqam to'liq emas: +998 XX XXX XX XX";
    if (orderType === "delivery" && (f.address || "").trim().length < 5) err.address = "Manzilni to'liqroq yozing";
    let cardInfo = null;
    if (payMethod === "card") {
      const d = card.num.replace(/\D/g, "");
      const [mm, yy] = card.exp.split("/").map(Number);
      const brand = cardBrand(d);
      // Uzcard/Humo raqamlari Luhn'ga har doim mos kelmaydi — faqat xalqaro kartalarda tekshiramiz
      const numOk = d.length === 16 && brand && (brand === "uzcard" || brand === "humo" || luhn(d));
      const expOk = mm >= 1 && mm <= 12 && new Date(2000 + yy, mm) > new Date();
      if (!numOk) err.num = "Karta raqami noto'g'ri";
      if (!expOk) err.exp = "Muddat noto'g'ri";
      cardInfo = { last4: d.slice(-4), brand };
    }
    setErrors(err);
    if (Object.keys(err).length) return;

    const customer = { type: orderType, name: f.name.trim(), phone: f.phone, address: f.address || "", flat: f.flat || "", floor: f.floor || "", time: f.time, note: f.note || "" };
    Store.set("opus_customer", customer);
    if (payMethod === "cash") placeOrder(customer, "Naqd (kuryerga)");
    else if (payMethod === "card") setPay({ mode: "card", customer, card: cardInfo });
    else setPay({ mode: "app", customer, method: payMethod });
  };

  const pm = PAY_METHODS.find((x) => x.id === payMethod);
  return (
    <div className={"checkout" + (checkoutOpen ? " is-open" : "")} role="dialog" aria-modal="true" aria-hidden={!checkoutOpen} ref={root}>
      {checkoutOpen && (
        <div className="checkout__inner">
          <div className="co-head">
            <h2>Buyurtmani <span className="hl">rasmiylashtirish</span></h2>
            <button className="x-btn" onClick={() => setCheckoutOpen(false)} aria-label="Yopish">✕</button>
          </div>
          <form className="co-grid" onSubmit={submit} noValidate>
            <div className="co-form">
              <section className="co-card">
                <h3><i>1</i>Qanday olasiz?</h3>
                <div className="toggle">
                  <label><input type="radio" name="type" checked={orderType === "delivery"} onChange={() => setOrderType("delivery")} />🛵 Yetkazib berish</label>
                  <label><input type="radio" name="type" checked={orderType === "pickup"} onChange={() => setOrderType("pickup")} />🏪 Olib ketaman</label>
                </div>
                <div className="row2">
                  <Field label="Ismingiz" error={errors.name}><input value={f.name || ""} onChange={set("name")} placeholder="Masalan: Aziz" autoComplete="name" /></Field>
                  <Field label="Telefon raqam" error={errors.phone}><input value={f.phone || ""} onChange={set("phone")} inputMode="tel" autoComplete="tel" /></Field>
                </div>
                {orderType === "delivery" ? (
                  <div className="row3">
                    <Field label="Ko'cha va uy" error={errors.address}><input value={f.address || ""} onChange={set("address")} placeholder="Amir Temur ko'chasi, 15" autoComplete="street-address" /></Field>
                    <Field label="Xonadon"><input value={f.flat || ""} onChange={set("flat")} placeholder="24" /></Field>
                    <Field label="Qavat"><input value={f.floor || ""} onChange={set("floor")} placeholder="3" /></Field>
                  </div>
                ) : (
                  <p className="note">🏪 Olib ketish manzili: Toshkent, Amir Temur ko'chasi, 1. Buyurtma 20 daqiqada tayyor bo'ladi.</p>
                )}
                <div className="row2" style={{ marginTop: 14 }}>
                  <Field label="Qachon?"><select value={f.time || TIMES[0]} onChange={set("time")}>{TIMES.map((o) => <option key={o}>{o}</option>)}</select></Field>
                  <Field label="Izoh (ixtiyoriy)"><input value={f.note || ""} onChange={set("note")} placeholder="Domofon ishlamaydi..." /></Field>
                </div>
              </section>

              <section className="co-card">
                <h3><i>2</i>To'lov usuli</h3>
                <div className="paygrid">
                  {PAY_METHODS.map((m) => (
                    <label key={m.id} className={"paym" + (m.logos.length === 1 ? " paym--single" : m.logos.length > 1 ? " paym--multi" : "")}>
                      <input type="radio" name="method" checked={payMethod === m.id} onChange={() => setPayMethod(m.id)} />
                      <span className="paym__logos">{m.logos.length ? m.logos.map((l) => <LogoTile key={l} name={l} />) : <span className="paym__cash">💵</span>}</span>
                      <b>{m.name}</b><small>{m.note}</small>
                    </label>
                  ))}
                </div>
                <div className="paydetails">
                  {payMethod === "card" ? <CardForm card={card} setCard={setCard} errors={errors} />
                    : payMethod === "cash" ? <p className="note">💵 Kuryerga naqd to'laysiz. Iloji bo'lsa, mayda pul tayyorlab qo'ying.</p>
                      : <p className="note">📲 "To'lash" tugmasini bosganingizdan so'ng {pm.name} orqali to'lovni tasdiqlaysiz — QR kodni skanerlang yoki ilovani oching.</p>}
                </div>
              </section>

              {bonus > 0 && (
                <section className="co-card co-bonus">
                  <label className="bonus-toggle">
                    <span className="bonus-toggle__icon">💎</span>
                    <span><b>Opus Bonus bilan to'lash</b><small>Balans: {som(bonus)} · buyurtmaning {BONUS.maxShare}% gacha</small></span>
                    <input type="checkbox" checked={useBonus} onChange={(e) => setUseBonus(e.target.checked)} /><i className="sw" />
                  </label>
                </section>
              )}
            </div>

            <aside className="co-side">
              <div className="receipt">
                <h3>Yakuniy chek</h3>
                <div className="co-items">
                  {cart.map((l) => {
                    const info = lineInfo(l, byId);
                    return <div className="co-item" key={l.key}><div>{info.name} × {l.qty}{info.sub && <small>{info.sub}</small>}</div><b>{som(l.unit * l.qty)}</b></div>;
                  })}
                </div>
                <div className="totals">
                  <div><span>Taomlar</span><span>{som(t.subtotal)}</span></div>
                  {t.discount > 0 && <div className="is-green"><span>Chegirma {promo}</span><span>−{som(t.discount)}</span></div>}
                  {t.bonusUsed > 0 && <div className="is-green"><span>💎 Bonusdan</span><span>−{som(t.bonusUsed)}</span></div>}
                  <div><span>{orderType === "pickup" ? "Olib ketish" : "Yetkazib berish"}</span><span>{t.delivery ? som(t.delivery) : "Bepul"}</span></div>
                  <div className="grand"><span>To'lov</span><b>{som(t.total)}</b></div>
                  <div className="earn">💎 Bu buyurtmadan +{som(earnedFor(t.total))} bonus olasiz</div>
                </div>
                <button className="btn btn--fire btn--block" type="submit">{payMethod === "cash" ? "Buyurtmani tasdiqlash ✓" : `${som(t.total)} to'lash →`}</button>
                <div className="secure">🔒 Ma'lumotlar himoyalangan ulanish orqali uzatiladi</div>
              </div>
            </aside>
          </form>
        </div>
      )}
    </div>
  );
}

/* ---------- To'lov oynasi ---------- */
function fakeQr(seed) {
  let x = [...seed].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const rnd = () => ((x = (x * 1103515245 + 12345) >>> 0) / 4294967296);
  const n = 25, cells = [];
  const finder = (r, c) => [[0, 0], [0, n - 7], [n - 7, 0]].some(([fr, fc]) => r >= fr && r < fr + 7 && c >= fc && c < fc + 7);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!finder(r, c) && rnd() > .52) cells.push([c, r]);
  const eye = (x0, y0) => (
    <g key={`${x0}-${y0}`}><rect x={x0} y={y0} width="7" height="7" /><rect x={x0 + 1} y={y0 + 1} width="5" height="5" fill="#fff" /><rect x={x0 + 2} y={y0 + 2} width="3" height="3" /></g>
  );
  return (
    <svg viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" fill="#1A1210">
      {cells.map(([c, r]) => <rect key={`${c}-${r}`} x={c} y={r} width="1" height="1" />)}
      {eye(0, 0)}{eye(n - 7, 0)}{eye(0, n - 7)}
    </svg>
  );
}

function AppPay({ data, onDone, onClose }) {
  const { totals: t } = useShop();
  const pm = PAY_METHODS.find((x) => x.id === data.method);
  const qr = useMemo(() => fakeQr(data.method + t.total + Date.now()), [data.method]);
  return (
    <>
      <div className="pay-logo-big"><img src={PAY_LOGOS[data.method]} alt={pm.name} data-logo={data.method} /></div>
      <h3 className="money" style={{ fontSize: 48 }}>{som(t.total)}</h3>
      <p>{pm.name} ilovasida QR kodni skanerlang yoki ilovani oching va to'lovni tasdiqlang.</p>
      <div className="qr">{qr}</div>
      <div className="wait"><span className="spinner" /> To'lov kutilmoqda...</div>
      <div className="stack">
        <button className="btn btn--ink btn--block" onClick={() => onDone(pm.name)}>To'lovni ilovada tasdiqladim</button>
        <button className="btn btn--cream btn--block" onClick={onClose}>Boshqa usulni tanlash</button>
      </div>
    </>
  );
}

function CardPay({ data, onDone }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [err, setErr] = useState("");
  const [sec, setSec] = useState(60);
  const refs = useRef([]);
  const masked = data.customer.phone.replace(/(\+998 \d{2}) \d{3} \d{2}/, "$1 *** **");

  useEffect(() => { if (refs.current[0]) refs.current[0].focus(); }, []);
  useEffect(() => {
    if (sec <= 0) return undefined;
    const t = setTimeout(() => setSec(sec - 1), 1000);
    return () => clearTimeout(t);
  }, [sec]);

  const setAt = (i, v) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = code.slice(); next[i] = d; setCode(next);
    if (d && refs.current[i + 1]) refs.current[i + 1].focus();
  };
  const paste = (e) => {
    const d = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (!d) return;
    e.preventDefault();
    setCode(code.map((_, j) => d[j] || ""));
    refs.current[Math.min(d.length, 5)].focus();
  };
  const submit = (e) => {
    e.preventDefault();
    if (code.join("").length !== 6) { setErr("6 xonali kodni to'liq kiriting"); return; }
    onDone(`Karta •••• ${data.card.last4}`);
  };
  return (
    <>
      <div className="pay-logo-big">{data.card.brand ? <img src={PAY_LOGOS[data.card.brand]} alt={LOGO_NAMES[data.card.brand]} data-logo={data.card.brand} /> : "💳"}</div>
      <h3>SMS kodni kiriting</h3>
      <p>•••• {data.card.last4} kartasiga bog'langan {masked} raqamiga 6 xonali kod yuborildi.</p>
      <form onSubmit={submit}>
        <div className="otp">
          {code.map((v, i) => (
            <input key={i} ref={(el) => { refs.current[i] = el; }} inputMode="numeric" maxLength={1} autoComplete="one-time-code" value={v}
              onChange={(e) => setAt(i, e.target.value)} onPaste={paste}
              onKeyDown={(e) => { if (e.key === "Backspace" && !v && refs.current[i - 1]) refs.current[i - 1].focus(); }} />
          ))}
        </div>
        <p className="field__err" style={{ margin: "6px 0 12px" }}>{err}</p>
        <button className="btn btn--fire btn--block" type="submit">Tasdiqlash</button>
      </form>
      <p style={{ margin: "14px 0 0", fontSize: 13 }}>Kod kelmadimi? <b>{sec > 0 ? `${sec} soniyadan keyin qayta yuborish` : "Qayta yuborish"}</b></p>
    </>
  );
}

export function PaySheet() {
  const { pay, setPay, placeOrder } = useShop();
  const close = () => setPay(null);
  // Tasdiqlangandan keyin 1.8 soniya "to'lov amalga oshirilmoqda" ko'rsatamiz
  const done = (label) => {
    const customer = pay.customer;
    setPay({ mode: "processing" });
    setTimeout(() => placeOrder(customer, label), 1800);
  };
  return (
    <Sheet open={!!pay} onClose={() => { if (pay && pay.mode !== "processing") close(); }} id="paySheet" boxClass="sheet__box--pay">
      {pay && pay.mode !== "processing" && <button className="x-btn sheet__close" onClick={close} aria-label="Yopish">✕</button>}
      {pay && pay.mode === "app" && <AppPay data={pay} onDone={done} onClose={close} />}
      {pay && pay.mode === "card" && <CardPay data={pay} onDone={done} />}
      {pay && pay.mode === "processing" && <><div className="spinner big-spinner" /><h3>To'lov amalga oshirilmoqda</h3><p>Iltimos, oynani yopmang...</p></>}
    </Sheet>
  );
}
