import { useEffect, useRef, useState } from "react";
import { useShop } from "../shop.jsx";

export function BrandIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M10 30 Q10 10 32 9 Q54 10 54 30 Q54 33 51 33 H13 Q10 33 10 30Z" fill="#F2A541" stroke="#1A1210" strokeWidth="3" />
      <path d="M8 37 Q14 33 20 37 T32 37 T44 37 T56 37 V40 H8Z" fill="#7BC94C" stroke="#1A1210" strokeWidth="3" strokeLinejoin="round" />
      <rect x="9" y="40" width="46" height="8" rx="4" fill="#6E3B1F" stroke="#1A1210" strokeWidth="3" />
      <path d="M11 51 H53 Q52 58 44 58 H20 Q12 58 11 51Z" fill="#F2A541" stroke="#1A1210" strokeWidth="3" />
      <circle cx="25" cy="22" r="2.6" fill="#1A1210" /><circle cx="39" cy="22" r="2.6" fill="#1A1210" />
      <path d="M28 27 Q32 30 36 27" stroke="#1A1210" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const LINKS = [["#menu", "Menyu"], ["#combo", "Kombo"], ["#wheel", "🎡 Omad"], ["#branches", "Filiallar"], ["#track", "Kuzatish"]];

export default function Header() {
  const { totals, openTicket, bumpKey } = useShop();
  const [navOpen, setNavOpen] = useState(false);
  const btn = useRef(null);

  // Savatga qo'shilganda tugma "sakraydi"
  useEffect(() => {
    if (!bumpKey || !btn.current) return;
    btn.current.classList.remove("bump");
    void btn.current.offsetWidth;
    btn.current.classList.add("bump");
  }, [bumpKey]);

  return (
    <>
      <div className="topbar">
        <span><i className="dot" /> Hozir ochiq · 10:00–03:00</span>
        <span className="topbar__mid">🛵 30 daqiqada yetkazamiz · 150 000 so'mdan bepul</span>
        <a href="tel:+998901234567">☎ +998 90 123 45 67</a>
      </div>

      <header className="nav">
        <a href="#" className="brand" aria-label="OPUS FOOD">
          <span className="brand__sticker"><BrandIcon /></span>
          <span className="brand__name">OPUS<em>FOOD</em></span>
        </a>

        <nav className={"nav__links" + (navOpen ? " is-open" : "")}>
          {LINKS.map(([href, label]) => <a key={href} href={href} onClick={() => setNavOpen(false)}>{label}</a>)}
        </nav>

        <div className="nav__actions">
          <a href="#track" className="chip-btn chip-btn--ghost nav__track">📍 Buyurtmam qayerda?</a>
          <button className="chip-btn" ref={btn} onClick={openTicket} aria-label="Savat">
            <span>🛒</span><span className="hide-sm">Savat</span><b>{totals.count}</b>
          </button>
          <button className={"hamburger" + (navOpen ? " is-open" : "")} onClick={() => setNavOpen(!navOpen)} aria-label="Menyu"><span /><span /></button>
        </div>
      </header>
    </>
  );
}
