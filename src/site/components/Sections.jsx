/* Oshxona, fikrlar, filiallar, kuzatish formasi, footer va mobil savat paneli */
import { useEffect, useRef, useState } from "react";
import { BRANCHES, PAY_LOGOS, RATING, REVIEWS, catIcon } from "../../shared/data.js";
import { fmt, som } from "../../shared/format.js";
import { Img, LogoTile } from "../../shared/Img.jsx";
import { useShop } from "../shop.jsx";

export function Kitchen() {
  return (
    <section className="kitchen" id="kitchen">
      <div className="kitchen__photos">
        <figure className="polaroid p1"><img src="assets/img/1561758033-d89a9ad46330.jpg" alt="Burger va fri" loading="lazy" /><figcaption>Olov Double + fri</figcaption></figure>
        <figure className="polaroid p2"><img src="assets/img/1513104890138-7c749659a591.jpg" alt="Pitsa" loading="lazy" /><figcaption>Tandirdan yangi</figcaption></figure>
        <figure className="polaroid p3"><img src="assets/img/1567620832903-9fc6debc209f.jpg" alt="Tovuq qanotchalari" loading="lazy" /><figcaption>Achchiq qanotchalar</figcaption></figure>
      </div>
      <div className="kitchen__text">
        <span className="tag tag--mustard">Bizning oshxona</span>
        <h2>Muzlatkich emas — <span className="hl">olov.</span></h2>
        <ul className="facts">
          <li><b>01</b><div><h4>Har kuni yangi go'sht</h4><p>Mol go'shti ertalab keladi, kotletlar qo'lda yasaladi. Muzlatilgan mahsulot yo'q.</p></div></li>
          <li><b>02</b><div><h4>Ochiq olovli grill</h4><p>Har bir kotlet haqiqiy olovda pishadi — o'sha "dudlangan" ta'm shundan.</p></div></li>
          <li><b>03</b><div><h4>Halol va toza</h4><p>Halol sertifikati, ochiq oshxona va har kuni sanitariya nazorati.</p></div></li>
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
          <span className="tag">⭐ Mijozlar fikri</span>
          <h2>Ular allaqachon <span className="hl">sevib qolishdi</span></h2>
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
                {p && <button className="rev__dish" title={p.name} onClick={() => setDishId(p.id)}><Img src={p.img} alt={p.name} emoji={catIcon(p.cat)} /></button>}
              </figcaption>
            </figure>
          );
        })}
      </div>
      <div className="reviews__nav">
        <button className="x-btn" onClick={() => scroll(-1)} aria-label="Oldingi">←</button>
        <button className="x-btn" onClick={() => scroll(1)} aria-label="Keyingi">→</button>
      </div>
    </section>
  );
}

export function branchOpen(b, now = new Date()) {
  const mins = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const t = now.getHours() * 60 + now.getMinutes();
  const o = mins(b.open), c = mins(b.close);
  return c > o ? t >= o && t < c : t >= o || t < c; // yarim tundan keyin yopiladigan filial
}

export function Branches() {
  return (
    <section className="branches" id="branches">
      <div className="section-title">
        <span className="tag">📍 Filiallar</span>
        <h2>Bizni <span className="hl">mehmonga</span> kuting</h2>
        <p>Toshkent bo'ylab 3 ta filial. Yetkazib berish butun shahar bo'ylab — o'rtacha 30 daqiqa.</p>
      </div>
      <div className="branches__grid">
        {BRANCHES.map((b) => {
          const open = branchOpen(b);
          const map = "https://yandex.uz/maps/?text=" + encodeURIComponent("Toshkent, " + b.address);
          return (
            <article className="branch" key={b.id}>
              <div className="branch__img"><img src={b.img} alt="" loading="lazy" /><span className={"branch__status" + (open ? " is-open" : "")}>{open ? "● Hozir ochiq" : "● Yopiq"}</span></div>
              <div className="branch__body">
                <small>{b.area}</small>
                <h3>{b.name}</h3>
                <p>📍 {b.address}</p>
                <p>🕙 {b.open} – {b.close} · har kuni</p>
                <div className="branch__perks">{b.perks.map((x) => <span key={x}>{x}</span>)}</div>
                <div className="branch__actions">
                  <a className="btn btn--cream" href={"tel:" + b.phone.replace(/\s/g, "")}>☎ Qo'ng'iroq</a>
                  <a className="btn btn--fire" href={map} target="_blank" rel="noopener">Xaritada →</a>
                </div>
              </div>
            </article>
          );
        })}
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
          <span className="tag">📍 Jonli kuzatish</span>
          <h2>Buyurtmangiz <span className="hl">qayerda?</span></h2>
          <p>Buyurtma raqamini kiriting yoki pastdagi oxirgi buyurtmalaringizdan birini tanlang.</p>
        </div>
        <form className="track__form" onSubmit={submit}>
          <input placeholder="OP-123456" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn btn--ink" type="submit">Kuzatish</button>
        </form>
        <div className="track__recent">
          {orders.length
            ? orders.slice(0, 5).map((o) => <button key={o.id} onClick={() => openTracker(o.id)}>{o.id} · {som(o.total)}</button>)
            : <small style={{ fontWeight: 600 }}>Hali buyurtmalar yo'q — birinchisini bering! 🍔</small>}
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
          <p>Toshkent sh., Amir Temur ko'chasi, 1<br />Har kuni 10:00 – 03:00</p>
        </div>
        <div>
          <h4>Aloqa</h4>
          <p><a href="tel:+998901234567">+998 90 123 45 67</a><br /><a href="https://t.me/opusfoodbot" target="_blank" rel="noopener">Telegram</a> · <a href="#">Instagram</a></p>
        </div>
        <div>
          <h4>To'lov usullari</h4>
          <div className="footer__pay">{Object.keys(PAY_LOGOS).map((k) => <LogoTile key={k} name={k} />)}</div>
        </div>
      </div>
      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} OLOV FOOD</span>
        <span>Olov bilan tayyorlangan 🔥</span>
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
