/* Bosh ekrandan keyingi qiya yuguruvchi lentalar: oldida olovli, orqasida vino rangli.
   Ekrandan chiqqanda to'xtaydi (sayt qotmasligi uchun). */
import { useEffect, useRef } from "react";

const FRONT = ["🍔 Burger", "🍕 Pitsa", "🌯 Lavash", "🍗 Tovuq", "🌭 Hot-dog", "🍟 Fri", "🥤 Ichimlik", "🍩 Desert"];
const BACK = ["30 daqiqada yetkazamiz", "Grilda, olov ustida", "Har kuni yangi go'sht", "Click · Payme · Uzum", "5% bonus har buyurtmadan"];

function Track({ words }) {
  // ikki marta takrorlanadi — lenta uzluksiz aylanadi (-50% siljish)
  const row = [...words, ...words];
  return (
    <div className="ticker__track">
      {[...row, ...row].map((w, i) => <span key={i}>{w}<em>✦</em></span>)}
    </div>
  );
}

export default function Ticker() {
  const wrap = useRef(null);
  useEffect(() => {
    const el = wrap.current;
    if (!el || !("IntersectionObserver" in window)) return undefined;
    const io = new IntersectionObserver(([en]) => el.classList.toggle("is-paused", !en.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className="ticker-wrap" ref={wrap} aria-hidden="true">
      <div className="ticker--back"><Track words={BACK} /></div>
      <div className="ticker"><Track words={FRONT} /></div>
    </div>
  );
}
