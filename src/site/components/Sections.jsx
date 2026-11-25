/* Oshxona, fikrlar, filiallar, kuzatish formasi, footer va mobil savat paneli */
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { MapPin, Clock, Phone, ArrowLeft, ArrowRight, Send, Navigation, X } from "lucide-react";
import UzMap, { branchOpen, regionStats, REGION_NAME } from "../../shared/UzMap.jsx";
import { BRANCHES, PAY_LOGOS, RATING, REVIEWS, SETTINGS, TELEGRAM, catIcon } from "../../shared/data.js";
import { fmt, som } from "../../shared/format.js";
import { Img, LogoTile } from "../../shared/Img.jsx";
import { useShop } from "../shop.jsx";

export function Kitchen() {
  // Fotolar ekranga kirganda stol ustiga birin-ketin "tashlanadi" (bir marta)
  const photos = useRef(null);
  useEffect(() => {
    const el = photos.current;
    if (!el) return undefined;
    if (!("IntersectionObserver" in window)) { el.classList.add("is-in"); return undefined; }
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { el.classList.add("is-in"); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section className="kitchen" id="kitchen">
      <div className="kitchen__photos" ref={photos}>
        <figure className="polaroid p1"><Img src="assets/img/1561758033-d89a9ad46330.jpg" alt="Burger va fri" sizes="(max-width: 600px) 60vw, 280px" /><figcaption>Olov Double + fri</figcaption></figure>
        <figure className="polaroid p2"><Img src="assets/img/1513104890138-7c749659a591.jpg" alt="Pitsa" sizes="(max-width: 600px) 60vw, 280px" /><figcaption>Tandirdan yangi</figcaption></figure>
        <figure className="polaroid p3"><Img src="assets/img/1567620832903-9fc6debc209f.jpg" alt="Tovuq qanotchalari" sizes="(max-width: 600px) 60vw, 280px" /><figcaption>Achchiq qanotchalar</figcaption></figure>
      </div>
      <div className="kitchen__text">
        <h2>Hammasi olovda pishadi</h2>
        <ul className="facts">
          <li><div><h4>Har kuni yangi go'sht</h4><p>Mol go'shti ertalab keladi, kotletlar qo'lda yasaladi. Muzlatilgan mahsulot yo'q.</p></div></li>
          <li><div><h4>Ochiq olovli grill</h4><p>Har bir kotlet haqiqiy olovda pishadi — o'sha "dudlangan" ta'm shundan.</p></div></li>
          <li><div><h4>Halol va toza</h4><p>Halol sertifikati, ochiq oshxona va har kuni sanitariya nazorati.</p></div></li>
        </ul>
      </div>
    </section>
  );
}

const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

export function Reviews() {
  const { byId, setDishId } = useShop();
  const track = useRef(null);
  const scroll = (dir) => {
    const tr = track.current;
    tr.scrollBy({ left: dir * (tr.firstElementChild.offsetWidth + 16), behavior: "smooth" });
  };
  return (
    <section className="reviews" id="reviews">
      <div className="reviews__head">
        <div>
          <h2>Mijozlarimiz fikri</h2>
        </div>
        <div className="rating">
          <div className="rating__big"><b>{RATING.avg}</b><span>{stars(5)}</span><small>{fmt(RATING.count)} ta baho</small></div>
          <div className="rating__bars">
            {RATING.dist.map((v, i) => <div key={i}><span>{5 - i}★</span><i><em style={{ width: v + "%" }} /></i><small>{v}%</small></div>)}
          </div>
        </div>
      </div>
      <div className="reviews__track" ref={track}>
        {REVIEWS.map((r) => {
          const p = byId[r.dish];
          return (
            <figure className="rev" key={r.name}>
              <div className="rev__stars" aria-label={`${r.stars} yulduz`}>{stars(r.stars)}</div>
              <blockquote>{r.text}</blockquote>
              <figcaption>
                <span className="rev__ava">{r.name[0]}</span>
                <div><b>{r.name}</b><small>{r.area}</small></div>
                {p && <button className="rev__dish" title={p.name} aria-label={p.name + " — ko'rish"} onClick={() => setDishId(p.id)}><Img src={p.img} alt={p.name} emoji={catIcon(p.cat)} /></button>}
              </figcaption>
            </figure>
          );
        })}
      </div>
      <div className="reviews__nav">
        <button className="x-btn" onClick={() => scroll(-1)} aria-label="Oldingi"><ArrowLeft size={18} aria-hidden="true" /></button>
        <button className="x-btn" onClick={() => scroll(1)} aria-label="Keyingi"><ArrowRight size={18} aria-hidden="true" /></button>
      </div>
    </section>
  );
}

export function Branches() {
  const [reg, setReg] = useState("");
  const [focus, setFocus] = useState(""); // "filialId:vaqt" — har bosishda animatsiya qayta o'ynaydi
  const [open, setOpen] = useState(false); // yon panel faqat filial tanlangandan keyin chiqadi
  const regions = regionStats(BRANCHES);
  const list = BRANCHES.filter((b) => b.region === reg);
  const listRef = useRef(null);

  // Xarita kichrayishi va panel chiqishi bitta silliq o'tish bo'lsin (brauzer qo'llasa — View Transitions)
  const animate = (fn) => {
    if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) document.startViewTransition(() => flushSync(fn));
    else fn();
  };
  // xaritada viloyat bosilsa — faqat bo'yaladi; panel ochiq bo'lsa, o'sha viloyat filiallari ko'rinadi
  const pick = (r) => {
    if (!r) { if (!open) setReg(""); return; } // ochiq panel bo'sh qolmasin
    setReg(r);
    if (open) { setFocus(""); if (listRef.current) listRef.current.scrollTop = 0; }
  };
  // xaritadagi oynadan filial tanlansa — yon panel sirpanib chiqadi, filial kartochkasi yonib turadi
  const openBranch = (b) => {
    const apply = () => { setReg(b.region); setFocus(b.id + ":" + Date.now()); setOpen(true); };
    if (open) apply(); else animate(apply);
  };
  const close = () => animate(() => { setOpen(false); setFocus(""); setReg(""); });
  useEffect(() => {
    if (!focus) return;
    const el = document.getElementById("branch-" + focus.split(":")[0]);
    // telefonda panel xarita ostida — kartochkani ekran o'rtasiga olib kelamiz
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: window.innerWidth <= 1024 ? "center" : "nearest" }), 120);
  }, [focus]);

  return (
    <section className="branches" id="branches">
      <div className="section-title">
        <h2>Filiallarimiz</h2>
        <p>O'zbekiston bo'ylab {BRANCHES.length} ta filial, {regions.length} ta hududda. Xaritadagi nuqta ustiga boring va filialni tanlang.</p>
      </div>
      <div className={"branches__wrap" + (open ? " is-open" : "")}>
        <div className="branches__map">
          <UzMap branches={BRANCHES} value={reg} onPick={pick} onBranch={openBranch} label={`O'zbekiston xaritasi: ${BRANCHES.length} ta OLOV FOOD filiali`} />
        </div>
        {open && (
          <aside className="branches__side" aria-label={`${REGION_NAME[reg] || ""} filiallari`}>
            <div className="branches__head">
              <div><h3>{REGION_NAME[reg]}</h3><small>{list.length} ta filial</small></div>
              <button className="x-btn" onClick={close} aria-label="Panelni yopish"><X size={18} aria-hidden="true" /></button>
            </div>
            <div className="branches__list" ref={listRef}>
              {list.map((b, i) => {
                const isOpen = branchOpen(b);
                const on = focus.startsWith(b.id + ":");
                const map = "https://yandex.uz/maps/?text=" + encodeURIComponent(b.city + ", " + b.address);
                return (
                  <article className={"bitem" + (on ? " is-focus" : "")} key={b.id + (on ? focus : "")} id={"branch-" + b.id} style={{ "--i": i }}>
                    <div className="bitem__info">
                      <h3>{b.name} <span className={"bitem__st" + (isOpen ? " is-open" : "")}>{isOpen ? "Ochiq" : "Yopiq"}</span></h3>
                      <p className="ic-line"><MapPin size={15} aria-hidden="true" /> {b.area}, {b.address}</p>
                      <p className="ic-line"><Clock size={15} aria-hidden="true" /> Har kuni {b.open} – {b.close}</p>
                      <p className="ic-line"><Phone size={15} aria-hidden="true" /> {b.phone}</p>
                    </div>
                    <div className="bitem__acts">
                      <a className="bitem__btn" href={"tel:" + b.phone.replace(/\s/g, "")} aria-label={`${b.name} — qo'ng'iroq qilish`}><Phone size={17} aria-hidden="true" /></a>
                      <a className="bitem__btn bitem__btn--map" href={map} target="_blank" rel="noopener" aria-label={`${b.name} — xaritada ochish`}><Navigation size={17} aria-hidden="true" /></a>
                    </div>
                  </article>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}

export function Track() {
  const { orders, openTracker } = useShop();
  const [code, setCode] = useState("");
  const submit = (e) => {
    e.preventDefault();
    let id = code.trim().toUpperCase();
    if (/^\d+$/.test(id)) id = "OP-" + id;
    if (id) openTracker(id);
  };
  return (
    <section className="track" id="track">
      <div className="track__box">
        <div>
          <h2>Buyurtmangiz qayerda?</h2>
          <p>Buyurtma raqamini kiriting yoki pastdagi oxirgi buyurtmalaringizdan birini tanlang.</p>
        </div>
        <form className="track__form" onSubmit={submit}>
          <input placeholder="OP-123456" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn btn--ink" type="submit">Kuzatish</button>
        </form>
        <div className="track__recent">
          {orders.length
            ? orders.slice(0, 5).map((o) => <button key={o.id} onClick={() => openTracker(o.id)}>{o.id} · {som(o.total)}</button>)
            : <small style={{ fontWeight: 600 }}>Hali buyurtmalar yo'q — birinchisini bering!</small>}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__big" aria-hidden="true">OLOV FOOD</div>
      <div className="footer__cols">
        <div>
          <h4>Manzil</h4>
          <p>Toshkent sh., {BRANCHES[0].address}<br />Har kuni {SETTINGS.open} – {SETTINGS.close}</p>
        </div>
        <div>
          <h4>Aloqa</h4>
          <p><a href={"tel:" + SETTINGS.phone.replace(/s/g, "")}>{SETTINGS.phone}</a><br /><a href={"https://t.me/" + TELEGRAM.username} target="_blank" rel="noopener"><Send size={14} aria-hidden="true" /> Telegram botda buyurtma</a></p>
        </div>
        <div>
          <h4>To'lov usullari</h4>
          <div className="footer__pay">{Object.keys(PAY_LOGOS).map((k) => <LogoTile key={k} name={k} />)}</div>
        </div>
      </div>
      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} OLOV FOOD</span>
        <span>Olov bilan tayyorlangan</span>
      </div>
    </footer>
  );
}

/* Telefonda pastda turadigan "Savatni ko'rish" paneli */
export function Cartbar() {
  const { totals: t, openTicket, ticketOpen, setTicketOpen } = useShop();
  const [wide, setWide] = useState(() => window.innerWidth > 1280);
  useEffect(() => {
    const onResize = () => setWide(window.innerWidth > 1280);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return (
    <>
      {t.count > 0 && !wide && (
        <button className="cartbar" onClick={openTicket}>
          <span className="cartbar__count">{t.count}</span>
          <span>Savatni ko'rish</span>
          <b>{som(t.total)}</b>
        </button>
      )}
      <div className={"scrim" + (ticketOpen ? " is-on" : "")} onClick={() => setTicketOpen(false)} />
    </>
  );
}
