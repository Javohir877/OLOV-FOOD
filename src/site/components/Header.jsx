import { useEffect, useRef, useState } from "react";
import { useShop } from "../shop.jsx";

/* OLOV FOOD belgisi — olov tili */
export function BrandIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 58 C16 56 10 44 14 32 C16 26 20 22 22 18 C23 26 27 28 29 25 C27 16 32 8 40 4 C38 14 46 20 47 30 C50 26 49 22 52 20 C58 30 56 54 32 58Z" fill="#FFF3E3" />
      <path d="M32 54 C24 52 21 45 23 39 C25 34 28 32 29 28 C31 33 33 34 34 31 C34 26 37 22 41 20 C40 27 44 31 44 37 C45 35 46 33 47 32 C50 40 46 53 32 54Z" fill="#FFC229" />
      <path d="M32 50 C28 49 27 45 28 42 C29 39 31 38 32 35 C33 38 35 39 35 37 C37 40 37 48 32 50Z" fill="#FF7A1A" />
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
        <a href="#" className="brand" aria-label="OLOV FOOD">
          <span className="brand__sticker"><BrandIcon /></span>
          <span className="brand__name">OLOV<em>FOOD</em></span>
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
