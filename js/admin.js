/* =========================================================
   OPUS FOOD — Admin panel
   Ma'lumotlar brauzer xotirasida (localStorage) — sayt bilan umumiy.
   ========================================================= */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const som = (n) => `${fmt(n)} so'm`;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const compact = (n) => (n >= 1e6 ? +(n / 1e6).toFixed(1) + "M" : n >= 1e3 ? Math.round(n / 1e3) + "K" : String(n));

  // Standart parol README.md faylida. Bu faqat brauzer tomonidagi to'siq — haqiqiy himoya uchun backend kerak.
  const DEFAULT_PASS = "opus2026";
  const hash = (s) => { let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return "h" + h.toString(36); };

  const STATUS = {
    new: { label: "Yangi", icon: "🧾" },
    cooking: { label: "Oshxonada", icon: "🔥" },
    delivering: { label: "Yo'lda", icon: "🛵" },
    done: { label: "Yetkazildi", icon: "✅" },
    cancelled: { label: "Bekor qilingan", icon: "✕" },
  };
  const statusBadge = (s) => `<span class="status status--${s}">${STATUS[s].label}</span>`;
  const BADGES = { "": "Yo'q", hit: "🔥 Hit", new: "Yangi", hot: "🌶 Achchiq" };
  const PAY_NAMES = { click: "Click", payme: "Payme", uzum: "Uzum Bank", card: "Bank karta", cash: "Naqd" };
  const WEEK = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

  const ui = { period: "7", ordFilter: "all", ordQuery: "", menuCat: "all", menuQuery: "", chartTable: false, knownIds: new Set() };

  /* ---------- Ma'lumotlar ---------- */
  const orders = () => Store.orders();
  const products = () => Store.products();
  const saveProducts = (list) => Store.set("opus_products", list);
  const catName = (id) => (CATEGORIES.find((c) => c.id === id) || { name: id }).name;
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const dayKey = (d) => startOfDay(d).toISOString().slice(0, 10);

  function inPeriod(o, period = ui.period) {
    if (period === "all") return true;
    const from = startOfDay(Date.now() - (+period - 1) * 864e5);
    return new Date(o.createdAt) >= from;
  }

  /* ---------- Toast ---------- */
  function toast(msg, kind) {
    const el = document.createElement("div");
    el.className = "toast" + (kind ? " toast--" + kind : "");
    el.innerHTML = `<span>${kind === "err" ? "⚠️" : kind === "order" ? "🔔" : "✅"}</span><span>${msg}</span>`;
    $("#toasts").appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 250); }, kind === "order" ? 5000 : 2600);
  }

  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [880, 1175].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(.12, ctx.currentTime + i * .18);
        g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + i * .18 + .25);
        o.start(ctx.currentTime + i * .18); o.stop(ctx.currentTime + i * .18 + .26);
      });
    } catch { /* ovoz ixtiyoriy */ }
  }

  /* =========================================================
     KIRISH
     ========================================================= */
  const passHash = () => Store.get("opus_admin_pass", hash(DEFAULT_PASS));
  const isAuthed = () => { try { return sessionStorage.getItem("opus_admin") === "1"; } catch { return false; } };

  function showApp() {
    $("#login").hidden = true;
    $("#app").hidden = false;
    ui.knownIds = new Set(orders().map((o) => o.id));
    route();
  }

  $("#loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (hash($("#loginPass").value) === passHash()) {
      try { sessionStorage.setItem("opus_admin", "1"); } catch { /* sessiya saqlanmaydi */ }
      showApp();
    } else {
      $("#loginErr").textContent = "Parol noto'g'ri";
      const box = $(".login__box");
      box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake");
      $("#loginPass").select();
    }
  });

  $("#logoutBtn").addEventListener("click", () => {
    try { sessionStorage.removeItem("opus_admin"); } catch { /* */ }
    location.hash = "";
    location.reload();
  });

  /* =========================================================
     MARSHRUT
     ========================================================= */
  const PAGES = {
    dashboard: { title: "Dashboard", sub: "Savdo va buyurtmalar bo'yicha umumiy ko'rinish", render: renderDashboard },
    orders: { title: "Buyurtmalar", sub: "Holatni o'zgartiring — mijoz uni saytda jonli ko'radi", render: renderOrders },
    menu: { title: "Menyu", sub: "Taomlar, narxlar, rasmlar va stop-list", render: renderMenu },
    promos: { title: "Promokodlar", sub: "Chegirma kodlarini yarating va boshqaring", render: renderPromos },
    settings: { title: "Sozlamalar", sub: "Yetkazish narxlari, xavfsizlik va ma'lumotlar", render: renderSettings },
  };
  const current = () => (PAGES[location.hash.slice(1)] ? location.hash.slice(1) : "dashboard");

  function route() {
    if (!isAuthed()) return;
    const key = current();
    $$("#sideNav a").forEach((a) => a.classList.toggle("is-on", a.dataset.page === key));
    $("#pageTitle").textContent = PAGES[key].title;
    $("#pageSub").textContent = PAGES[key].sub;
    PAGES[key].render();
    updateBadge();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  function updateBadge() {
    const n = orders().filter((o) => Store.statusOf(o) === "new").length;
    $("#newBadge").hidden = !n;
    $("#newBadge").textContent = n;
    document.title = (n ? `(${n}) ` : "") + "OPUS FOOD — Boshqaruv paneli";
  }

  /* =========================================================
     DASHBOARD
     ========================================================= */
  function renderDashboard() {
    const all = orders();
    const list = all.filter((o) => inPeriod(o));
    const ok = list.filter((o) => Store.statusOf(o) !== "cancelled");
    const revenue = ok.reduce((s, o) => s + o.total, 0);
    const avg = ok.length ? revenue / ok.length : 0;
    const cancelled = list.length - ok.length;

    // Oldingi xuddi shunday davr bilan solishtirish
    let delta = "";
    if (ui.period !== "all") {
      const n = +ui.period;
      const from = startOfDay(Date.now() - (2 * n - 1) * 864e5), to = startOfDay(Date.now() - (n - 1) * 864e5);
      const prev = all.filter((o) => { const d = new Date(o.createdAt); return d >= from && d < to && Store.statusOf(o) !== "cancelled"; }).reduce((s, o) => s + o.total, 0);
      if (prev) { const p = Math.round(((revenue - prev) / prev) * 100); delta = `${p >= 0 ? "▲" : "▼"} ${Math.abs(p)}% oldingi davrga nisbatan`; }
      else delta = "Oldingi davrda savdo yo'q";
    }

    const counts = Object.fromEntries(Object.keys(STATUS).map((k) => [k, 0]));
    list.forEach((o) => { counts[Store.statusOf(o)] += 1; });

    $("#page").innerHTML = `
      <div class="toolbar">
        <div class="chips" role="tablist" aria-label="Davr">
          ${[["1", "Bugun"], ["7", "7 kun"], ["30", "30 kun"], ["all", "Hammasi"]].map(([v, l]) => `<button class="chip ${ui.period === v ? "is-on" : ""}" data-period="${v}">${l}</button>`).join("")}
        </div>
        ${all.length ? "" : `<button class="btn btn--ghost btn--sm" data-demo>✨ Demo buyurtmalar yaratish</button>`}
      </div>

      <div class="stats">
        <div class="card stat stat--hero"><div class="stat__label"><i>💰</i>Tushum</div><div class="stat__value">${fmt(revenue)}<small>so'm</small></div><div class="stat__note">${delta || "Barcha vaqt uchun"}</div></div>
        <div class="card stat"><div class="stat__label"><i>🧾</i>Buyurtmalar</div><div class="stat__value">${list.length}</div><div class="stat__note">${counts.new} ta yangi kutmoqda</div></div>
        <div class="card stat"><div class="stat__label"><i>🧮</i>O'rtacha chek</div><div class="stat__value">${fmt(avg)}<small>so'm</small></div><div class="stat__note">Bekor qilinganlarsiz</div></div>
        <div class="card stat"><div class="stat__label"><i>✕</i>Bekor qilingan</div><div class="stat__value">${cancelled}</div><div class="stat__note">${list.length ? Math.round((cancelled / list.length) * 100) : 0}% buyurtmalardan</div></div>
      </div>

      <div class="cols">
        <section class="card">
          <div class="card__head">
            <div><h2>Kunlik tushum</h2><p>${ui.period === "30" || ui.period === "all" ? "Oxirgi 30 kun" : "Oxirgi 7 kun"}, so'mda · bekor qilinganlarsiz</p></div>
            <button class="btn btn--ghost btn--sm" data-chart-view>${ui.chartTable ? "📊 Grafik" : "▦ Jadval"}</button>
          </div>
          <div id="chart"></div>
        </section>
        <section class="card">
          <div class="card__head"><div><h2>Eng ko'p sotilgan</h2><p>Dona bo'yicha, tanlangan davrda</p></div></div>
          <div id="rank"></div>
        </section>
      </div>

      <section class="card">
        <div class="card__head"><div><h2>Buyurtma holatlari</h2><p>Bosing — o'sha holatdagi buyurtmalar ochiladi</p></div></div>
        <div class="status-tiles">${Object.keys(STATUS).map((k) => `
          <button class="status-tile" data-goto-status="${k}">${statusBadge(k)}<b>${counts[k]}</b></button>`).join("")}
        </div>
      </section>

      <div class="cols cols--even">
        <section class="card">
          <div class="card__head"><div><h2>To'lov usullari</h2><p>Tushum bo'yicha</p></div></div>
          <div class="mini-list" id="payList"></div>
        </section>
        <section class="card">
          <div class="card__head"><div><h2>So'nggi buyurtmalar</h2></div><a class="btn btn--ghost btn--sm" href="#orders">Hammasi →</a></div>
          <div class="mini-list">${all.slice(0, 5).map((o) => `
            <button data-open-order="${esc(o.id)}" style="text-align:left;width:100%">
              <div><b>${esc(o.id)}</b> · ${esc(o.customer.name)}<small>${timeAgo(o.createdAt)} · ${o.items.length} xil taom</small></div>
              <div style="display:flex;align-items:center;gap:10px"><span class="money" style="font-size:20px">${fmt(o.total)}</span>${statusBadge(Store.statusOf(o))}</div>
            </button>`).join("") || `<div class="empty"><div>🧾</div>Hali buyurtmalar yo'q</div>`}</div>
        </section>
      </div>`;

    renderChart(all);
    renderRank(ok);
    renderPayments(ok);
  }

  function niceMax(v) {
    if (v <= 0) return 100000;
    const p = 10 ** Math.floor(Math.log10(v));
    const n = v / p;
    return ([1, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => n <= s)) * p;
  }

  function renderChart(all) {
    const days = ui.period === "30" || ui.period === "all" ? 30 : 7;
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = startOfDay(Date.now() - (days - 1 - i) * 864e5);
      return { d, key: dayKey(d), sum: 0, n: 0 };
    });
    const map = Object.fromEntries(buckets.map((b) => [b.key, b]));
    all.forEach((o) => {
      if (Store.statusOf(o) === "cancelled") return;
      const b = map[dayKey(o.createdAt)];
      if (b) { b.sum += o.total; b.n += 1; }
    });
    const label = (d) => (days === 7 ? WEEK[d.getDay()] : `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`);
    const full = (d) => d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) + ", " + ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"][d.getDay()];

    if (ui.chartTable) {
      $("#chart").innerHTML = `<div class="table-wrap"><table><thead><tr><th>Sana</th><th>Buyurtmalar</th><th>Tushum</th></tr></thead><tbody>
        ${buckets.slice().reverse().map((b) => `<tr><td>${full(b.d)}</td><td>${b.n}</td><td>${som(b.sum)}</td></tr>`).join("")}</tbody></table></div>`;
      return;
    }

    const max = niceMax(Math.max(...buckets.map((b) => b.sum)));
    const ticks = [0, .25, .5, .75, 1];
    const today = dayKey(Date.now());
    const every = days === 7 ? 1 : 5;
    $("#chart").innerHTML = `
      <div class="chart">
        <div class="chart__y">${ticks.map((t) => `<span style="bottom:${t * 100}%">${compact(max * t)}</span>`).join("")}</div>
        <div class="chart__plot">
          ${ticks.slice(1).map((t) => `<div class="chart__grid" style="bottom:${t * 100}%"></div>`).join("")}
          <div class="chart__bars">${buckets.map((b) => `
            <div class="chart__col ${b.key === today ? "is-today" : ""}" tabindex="0" aria-label="${full(b.d)}: ${som(b.sum)}, ${b.n} ta buyurtma">
              <div class="chart__bar" style="height:${(b.sum / max) * 100}%"><span class="tip"><b>${som(b.sum)}</b>${full(b.d)} · ${b.n} ta buyurtma</span></div>
            </div>`).join("")}
          </div>
        </div>
      </div>
      <div class="chart__x">${buckets.map((b, i) => `<span class="${(days - 1 - i) % every ? "skip" : ""}">${b.key === today ? "Bugun" : label(b.d)}</span>`).join("")}</div>`;
  }

  function renderRank(ok) {
    const agg = {};
    ok.forEach((o) => o.items.forEach((it) => {
      const a = (agg[it.name] ||= { name: it.name, qty: 0, sum: 0 });
      a.qty += it.qty; a.sum += it.price * it.qty;
    }));
    const top = Object.values(agg).sort((a, b) => b.qty - a.qty).slice(0, 6);
    const max = top[0] ? top[0].qty : 1;
    const byName = Object.fromEntries(products().map((p) => [p.name, p]));
    $("#rank").innerHTML = top.length ? `<div class="rank">${top.map((t) => {
      const p = byName[t.name] || (t.name.startsWith("Kombo") ? { img: "assets/img/1561758033-d89a9ad46330.jpg" } : null);
      return `<div class="rank__row">
        <div class="rank__img">${p ? `<img src="${esc(p.img)}" alt="">` : ""}</div>
        <div><div class="rank__top"><span>${esc(t.name)}</span><span>${t.qty} ta · ${compact(t.sum)}</span></div>
        <div class="rank__track"><div class="rank__fill" style="width:${(t.qty / max) * 100}%"></div></div></div>
      </div>`;
    }).join("")}</div>` : `<div class="empty"><div>🍔</div>Bu davrda sotuv yo'q</div>`;
  }

  function renderPayments(ok) {
    const agg = {};
    ok.forEach((o) => { const a = (agg[o.payment.method] ||= { sum: 0, n: 0 }); a.sum += o.total; a.n += 1; });
    const rows = Object.entries(agg).sort((a, b) => b[1].sum - a[1].sum);
    $("#payList").innerHTML = rows.map(([m, a]) => `
      <div class="pay-row">
        <div>${PAY_LOGOS[m] ? `<img src="${PAY_LOGOS[m]}" alt="">` : `<span style="font-size:20px">${m === "card" ? "💳" : "💵"}</span>`}<div><b>${PAY_NAMES[m] || esc(m)}</b><small>${a.n} ta buyurtma</small></div></div>
        <span class="money" style="font-size:22px">${fmt(a.sum)}</span>
      </div>`).join("") || `<div class="empty"><div>💳</div>Ma'lumot yo'q</div>`;
  }

  function timeAgo(iso) {
    const m = Math.round((Date.now() - new Date(iso)) / 60000);
    if (m < 1) return "hozirgina";
    if (m < 60) return `${m} daqiqa oldin`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} soat oldin`;
    return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  /* =========================================================
     BUYURTMALAR
     ========================================================= */
  function renderOrders() {
    const all = orders();
    const counts = { all: all.length };
    all.forEach((o) => { const s = Store.statusOf(o); counts[s] = (counts[s] || 0) + 1; });
    const q = ui.ordQuery.trim().toLowerCase();
    const list = all.filter((o) => (ui.ordFilter === "all" || Store.statusOf(o) === ui.ordFilter) &&
      (!q || [o.id, o.customer.name, o.customer.phone, o.customer.address].join(" ").toLowerCase().includes(q)));

    $("#page").innerHTML = `
      <div class="toolbar">
        <div class="chips">
          <button class="chip ${ui.ordFilter === "all" ? "is-on" : ""}" data-ord-filter="all">Hammasi <b>${counts.all}</b></button>
          ${Object.keys(STATUS).map((k) => `<button class="chip ${ui.ordFilter === k ? "is-on" : ""}" data-ord-filter="${k}">${STATUS[k].icon} ${STATUS[k].label} <b>${counts[k] || 0}</b></button>`).join("")}
        </div>
        <label class="search"><input class="input" id="ordSearch" placeholder="ID, ism, telefon..." value="${esc(ui.ordQuery)}"></label>
      </div>
      <div class="table-wrap">
        ${list.length ? `<table>
          <thead><tr><th>Buyurtma</th><th>Mijoz</th><th>Taomlar</th><th>Summa</th><th>To'lov</th><th>Holat</th><th></th></tr></thead>
          <tbody>${list.map((o) => {
            const s = Store.statusOf(o);
            return `<tr class="${s === "new" ? "is-new" : ""}" data-open-order="${esc(o.id)}" style="cursor:pointer">
              <td><b>${esc(o.id)}</b><small>${timeAgo(o.createdAt)}</small></td>
              <td>${esc(o.customer.name)}<small>${esc(o.customer.phone)}</small></td>
              <td>${o.items.reduce((n, i) => n + i.qty, 0)} ta<small>${esc(o.items.map((i) => i.name).join(", ").slice(0, 34))}${o.items.map((i) => i.name).join(", ").length > 34 ? "…" : ""}</small></td>
              <td><span class="money">${fmt(o.total)}</span></td>
              <td>${esc(PAY_NAMES[o.payment.method] || o.payment.label)}<small>${o.payment.paid ? `<span class="paid">To'langan</span>` : `<span class="unpaid">To'lanmagan</span>`}</small></td>
              <td><select class="status-select" data-set-status="${esc(o.id)}" aria-label="Holat">${Object.keys(STATUS).map((k) => `<option value="${k}" ${s === k ? "selected" : ""}>${STATUS[k].label}</option>`).join("")}</select></td>
              <td><span class="icon-btn" aria-hidden="true">→</span></td>
            </tr>`;
          }).join("")}</tbody>
        </table>` : `<div class="empty"><div>🧾</div>${all.length ? "Bu filtr bo'yicha buyurtma yo'q" : "Hali buyurtmalar yo'q. Saytdan buyurtma bering yoki Sozlamalar → Demo buyurtmalar."}</div>`}
      </div>`;

    const s = $("#ordSearch");
    s.addEventListener("input", () => {
      ui.ordQuery = s.value;
      const pos = s.selectionStart;
      renderOrders();
      const n = $("#ordSearch"); n.focus(); n.setSelectionRange(pos, pos);
    });
  }

  function setStatus(id, status) {
    const o = orders().find((x) => x.id === id);
    if (!o) return;
    const patch = { status, statusManual: true, history: [...(o.history || []), { status, at: new Date().toISOString() }] };
    if (status === "done" && o.payment.method === "cash") patch.payment = { ...o.payment, paid: true };
    Store.updateOrder(id, patch);
    toast(`${esc(id)} → ${STATUS[status].label}`);
    refresh();
    if ($("#drawer").classList.contains("is-open")) openOrder(id);
  }

  /* ---------- Buyurtma tafsiloti (o'ng panel) ---------- */
  function openOrder(id) {
    const o = orders().find((x) => x.id === id);
    if (!o) return;
    const s = Store.statusOf(o);
    const idx = ORDER_FLOW.indexOf(s);
    const c = o.customer;
    const pickup = c.type === "pickup";
    $("#drawer").innerHTML = `
      <div class="dr-head">
        <div><h2>${esc(o.id)}</h2><small class="muted">${new Date(o.createdAt).toLocaleString("ru-RU")}</small></div>
        <div style="display:flex;gap:8px;align-items:center">${statusBadge(s)}<button class="icon-btn" data-close-drawer aria-label="Yopish">✕</button></div>
      </div>
      <div class="dr-body">
        <section class="dr-sec">
          <h4>Holatni o'zgartirish</h4>
          <div class="flow">${ORDER_FLOW.map((k, i) => `
            <button class="${s === "cancelled" ? "" : i < idx ? "is-done" : i === idx ? "is-now" : ""}" data-flow="${k}" data-id="${esc(o.id)}"><i>${i < idx && s !== "cancelled" ? "✓" : STATUS[k].icon}</i>${k === "delivering" && pickup ? "Tayyor" : STATUS[k].label}</button>`).join("")}
          </div>
        </section>
        <section class="dr-sec">
          <h4>Mijoz</h4>
          <div class="kv">
            <span>Ism</span><b>${esc(c.name)}</b>
            <span>Telefon</span><a href="tel:${esc(c.phone.replace(/\s/g, ""))}" style="color:var(--fire-2);font-weight:700">${esc(c.phone)}</a>
            <span>Turi</span><span style="color:var(--text)">${pickup ? "🏪 Olib ketadi" : "🛵 Yetkazib berish"}</span>
            ${pickup ? "" : `<span>Manzil</span><span style="color:var(--text)">${esc(c.address)}${c.flat ? `, ${esc(c.flat)}-xonadon` : ""}${c.floor ? `, ${esc(c.floor)}-qavat` : ""}</span>`}
            <span>Vaqt</span><span style="color:var(--text)">${esc(c.time || "Imkon qadar tez")}</span>
            ${c.note ? `<span>Izoh</span><span style="color:var(--amber)">${esc(c.note)}</span>` : ""}
          </div>
        </section>
        <section class="dr-sec">
          <h4>Taomlar</h4>
          <div class="items">${o.items.map((i) => `<div><div>${esc(i.name)} × ${i.qty}${i.sub ? `<small>${esc(i.sub)}</small>` : ""}</div><b>${som(i.price * i.qty)}</b></div>`).join("")}</div>
          <div class="sum">
            <div><span>Taomlar</span><span>${som(o.subtotal)}</span></div>
            ${o.discount ? `<div><span>Chegirma ${esc(o.promo || "")}</span><span style="color:var(--st-done)">−${som(o.discount)}</span></div>` : ""}
            <div><span>Yetkazish</span><span>${o.delivery ? som(o.delivery) : "Bepul"}</span></div>
            <div class="total"><span>Jami</span><span class="money">${som(o.total)}</span></div>
          </div>
        </section>
        <section class="dr-sec">
          <h4>To'lov</h4>
          <div class="kv"><span>Usul</span><b>${esc(o.payment.label)}</b><span>Holat</span><span>${o.payment.paid ? `<span class="paid">To'langan</span>` : `<span class="unpaid">Yetkazilganda to'lanadi</span>`}</span></div>
        </section>
        ${o.history && o.history.length ? `<section class="dr-sec"><h4>Tarix</h4><div class="mini-list">${o.history.slice().reverse().map((h) => `<div><span>${STATUS[h.status].icon} ${STATUS[h.status].label}</span><small>${new Date(h.at).toLocaleString("ru-RU")}</small></div>`).join("")}</div></section>` : ""}
        <div class="dr-actions">
          <a class="btn btn--ghost" href="tel:${esc(c.phone.replace(/\s/g, ""))}">☎ Qo'ng'iroq</a>
          ${s !== "cancelled" && s !== "done" ? `<button class="btn btn--danger" data-flow="cancelled" data-id="${esc(o.id)}">✕ Bekor qilish</button>` : ""}
        </div>
      </div>`;
    $("#drawer").classList.add("is-open");
    $("#drawer").setAttribute("aria-hidden", "false");
    $("#scrim").classList.add("is-on");
    document.body.classList.add("lock");
  }

  function closeDrawer() {
    $("#drawer").classList.remove("is-open");
    $("#drawer").setAttribute("aria-hidden", "true");
    $("#scrim").classList.remove("is-on");
    document.body.classList.remove("lock");
  }

  /* =========================================================
     MENYU
     ========================================================= */
  function renderMenu() {
    const list = products();
    const q = ui.menuQuery.trim().toLowerCase();
    const shown = list.filter((p) => (ui.menuCat === "all" || (ui.menuCat === "off" ? p.hidden : p.cat === ui.menuCat)) && (!q || p.name.toLowerCase().includes(q)));
    const customized = !!Store.get("opus_products", null);

    $("#page").innerHTML = `
      <div class="toolbar">
        <div class="chips">
          <button class="chip ${ui.menuCat === "all" ? "is-on" : ""}" data-menu-cat="all">Hammasi <b>${list.length}</b></button>
          ${CATEGORIES.map((c) => `<button class="chip ${ui.menuCat === c.id ? "is-on" : ""}" data-menu-cat="${c.id}">${c.icon} ${c.name} <b>${list.filter((p) => p.cat === c.id).length}</b></button>`).join("")}
          <button class="chip ${ui.menuCat === "off" ? "is-on" : ""}" data-menu-cat="off">⛔ Stop-list <b>${list.filter((p) => p.hidden).length}</b></button>
        </div>
      </div>
      <div class="toolbar">
        <label class="search"><input class="input" id="menuSearch" placeholder="Taom qidirish..." value="${esc(ui.menuQuery)}"></label>
        <div class="toolbar__left">
          ${customized ? `<button class="btn btn--ghost btn--sm" data-reset-menu>↺ Asl menyuni tiklash</button>` : ""}
          <button class="btn btn--fire" data-edit-product="">+ Yangi taom</button>
        </div>
      </div>
      ${shown.length ? `<div class="products">${shown.map((p) => `
        <article class="prod ${p.hidden ? "is-off" : ""}">
          <div class="prod__img"><img src="${esc(p.img)}" alt="" loading="lazy">${p.badge ? `<span class="badge">${BADGES[p.badge]}</span>` : ""}${p.hidden ? `<span class="off">STOP-LIST</span>` : ""}</div>
          <div class="prod__body"><span class="prod__cat">${catName(p.cat)} · ${esc(p.weight || "")}</span><h3>${esc(p.name)}</h3><span class="muted" style="font-size:12.5px">${esc(p.desc).slice(0, 70)}${p.desc.length > 70 ? "…" : ""}</span></div>
          <div class="prod__foot">
            <span class="money">${fmt(p.price)}</span>
            <div class="prod__actions">
              <label class="switch" title="Sotuvda"><input type="checkbox" data-toggle-product="${esc(p.id)}" ${p.hidden ? "" : "checked"} aria-label="${esc(p.name)} sotuvda"><span></span></label>
              <button class="icon-btn" data-edit-product="${esc(p.id)}" title="Tahrirlash" aria-label="Tahrirlash">✎</button>
              <button class="icon-btn" data-delete-product="${esc(p.id)}" title="O'chirish" aria-label="O'chirish">🗑</button>
            </div>
          </div>
        </article>`).join("")}</div>` : `<div class="card empty"><div>🍔</div>Hech narsa topilmadi</div>`}`;

    const s = $("#menuSearch");
    s.addEventListener("input", () => {
      ui.menuQuery = s.value;
      const pos = s.selectionStart;
      renderMenu();
      const n = $("#menuSearch"); n.focus(); n.setSelectionRange(pos, pos);
    });
  }

  function galleryImages() {
    const set = new Set([...DEFAULT_PRODUCTS, ...products()].map((p) => p.img).filter((src) => src && src.startsWith("assets/")));
    return [...set];
  }

  function editProduct(id) {
    const p = products().find((x) => x.id === id) || { id: "", cat: ui.menuCat !== "all" && ui.menuCat !== "off" ? ui.menuCat : "burger", name: "", desc: "", price: "", weight: "", kcal: "", rating: 4.8, badge: "", img: "" };
    let img = p.img;
    $("#modalBox").innerHTML = `
      <form id="prodForm" novalidate>
        <div class="modal__head"><h2>${p.id ? "Taomni tahrirlash" : "Yangi taom"}</h2><button type="button" class="icon-btn" data-close-modal aria-label="Yopish">✕</button></div>
        <div class="modal__body">
          <div class="img-pick">
            <div class="img-pick__preview" id="imgPreview">${img ? `<img src="${esc(img)}" alt="">` : "📷"}</div>
            <div style="display:grid;gap:10px">
              <div class="gallery" id="gallery">${galleryImages().map((src) => `<button type="button" data-pick="${esc(src)}" class="${src === img ? "is-on" : ""}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join("")}</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <span class="btn btn--ghost btn--sm upload">⬆ Rasm yuklash<input type="file" accept="image/*" id="imgFile"></span>
                <input class="input" id="imgUrl" placeholder="yoki rasm havolasi (https://...)" style="flex:1;min-width:180px;height:36px">
              </div>
            </div>
          </div>
          <label class="field"><span>Nomi *</span><input name="name" value="${esc(p.name)}" required maxlength="40"></label>
          <div class="grid3">
            <label class="field"><span>Kategoriya</span><select name="cat">${CATEGORIES.map((c) => `<option value="${c.id}" ${p.cat === c.id ? "selected" : ""}>${c.icon} ${c.name}</option>`).join("")}</select></label>
            <label class="field"><span>Narx (so'm) *</span><input name="price" type="number" min="1000" step="1000" value="${esc(p.price)}" required></label>
            <label class="field"><span>Belgi</span><select name="badge">${Object.entries(BADGES).map(([k, v]) => `<option value="${k}" ${(p.badge || "") === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
          </div>
          <div class="grid3">
            <label class="field"><span>Hajmi / og'irligi</span><input name="weight" value="${esc(p.weight)}" placeholder="260 g"></label>
            <label class="field"><span>Kaloriya (kkal)</span><input name="kcal" type="number" min="0" value="${esc(p.kcal)}"></label>
            <label class="field"><span>Reyting</span><input name="rating" type="number" min="1" max="5" step="0.1" value="${esc(p.rating)}"></label>
          </div>
          <label class="field"><span>Tavsif</span><textarea name="desc" maxlength="140" placeholder="Tarkibi va o'ziga xosligi...">${esc(p.desc)}</textarea></label>
          <label style="display:flex;align-items:center;gap:10px;font-weight:600"><span class="switch"><input type="checkbox" name="onsale" ${p.hidden ? "" : "checked"}><span></span></span> Sotuvda (menyuda ko'rinadi)</label>
          <p class="login__err" id="prodErr"></p>
        </div>
        <div class="modal__foot">
          <button type="button" class="btn btn--ghost" data-close-modal>Bekor qilish</button>
          <button type="submit" class="btn btn--fire">Saqlash</button>
        </div>
      </form>`;

    const setImg = (src) => {
      img = src;
      $("#imgPreview").innerHTML = src ? `<img src="${esc(src)}" alt="">` : "📷";
      $$("#gallery button").forEach((b) => b.classList.toggle("is-on", b.dataset.pick === src));
    };
    $("#gallery").addEventListener("click", (e) => { const b = e.target.closest("[data-pick]"); if (b) setImg(b.dataset.pick); });
    $("#imgUrl").addEventListener("change", (e) => { const v = e.target.value.trim(); if (/^https?:\/\//.test(v)) setImg(v); else if (v) toast("Havola https:// bilan boshlanishi kerak", "err"); });
    $("#imgFile").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      resizeImage(file, 520).then(setImg).catch(() => toast("Rasmni o'qib bo'lmadi", "err"));
    });

    $("#prodForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      const price = Math.round(+d.price);
      if (d.name.trim().length < 2) { $("#prodErr").textContent = "Taom nomini kiriting"; return; }
      if (!(price >= 1000)) { $("#prodErr").textContent = "Narx kamida 1 000 so'm bo'lishi kerak"; return; }
      if (!img) { $("#prodErr").textContent = "Rasm tanlang yoki yuklang"; return; }
      const item = {
        ...p,
        id: p.id || d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36),
        name: d.name.trim(), cat: d.cat, price, badge: d.badge || undefined, weight: d.weight.trim(),
        kcal: +d.kcal || 0, rating: Math.min(5, Math.max(1, +d.rating || 4.5)), desc: d.desc.trim(), img, hidden: !d.onsale,
      };
      const list = products();
      const i = list.findIndex((x) => x.id === item.id);
      if (i >= 0) list[i] = item; else list.push(item);
      try {
        localStorage.setItem("opus_products", JSON.stringify(list));
      } catch {
        $("#prodErr").textContent = "Xotira to'ldi — kichikroq rasm yuklang yoki havola ishlating";
        return;
      }
      closeModal();
      toast(p.id ? "Taom yangilandi" : "Yangi taom qo'shildi");
      renderMenu();
    });
    openModal();
  }

  function resizeImage(file, size) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = reject;
      r.onload = () => {
        const im = new Image();
        im.onerror = reject;
        im.onload = () => {
          // Kvadrat qilib markazdan kesamiz
          const s = Math.min(im.width, im.height);
          const c = document.createElement("canvas");
          c.width = c.height = size;
          c.getContext("2d").drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, size, size);
          resolve(c.toDataURL("image/jpeg", .8));
        };
        im.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }

  function openModal() { $("#modal").classList.add("is-open"); $("#modal").setAttribute("aria-hidden", "false"); document.body.classList.add("lock"); }
  function closeModal() { $("#modal").classList.remove("is-open"); $("#modal").setAttribute("aria-hidden", "true"); document.body.classList.remove("lock"); }

  /* =========================================================
     PROMOKODLAR
     ========================================================= */
  function promoLabel(p) { return p.type === "percent" ? `−${p.value}%` : "Bepul yetkazish"; }

  function renderPromos() {
    const saved = Store.get("opus_promos", null) || PROMO_CODES;
    $("#page").innerHTML = `
      <section class="card">
        <div class="card__head"><div><h2>Yangi promokod</h2><p>Mijoz savatdagi "Promokod" maydoniga kiritadi</p></div></div>
        <form id="promoForm" class="promo-form">
          <label class="field"><span>Kod</span><input name="code" placeholder="YOZ25" maxlength="16" required style="text-transform:uppercase"></label>
          <label class="field"><span>Turi</span><select name="type" id="promoType"><option value="percent">Foiz chegirma</option><option value="delivery">Bepul yetkazish</option></select></label>
          <label class="field" id="valField"><span>Foiz</span><input name="value" type="number" min="1" max="90" value="10"></label>
          <label class="field"><span>Min. summa (ixtiyoriy)</span><input name="min" type="number" min="0" step="1000" placeholder="0"></label>
          <button class="btn btn--fire" type="submit">Qo'shish</button>
        </form>
      </section>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Kod</th><th>Chegirma</th><th>Minimal summa</th><th>Ishlatilgan</th><th></th></tr></thead>
          <tbody>${Object.entries(saved).map(([code, p]) => {
            const used = orders().filter((o) => o.promo === code).length;
            return `<tr><td><b style="font-family:var(--money);font-size:22px;letter-spacing:.06em">${esc(code)}</b></td><td>${promoLabel(p)}</td><td>${p.min ? som(p.min) : "—"}</td><td>${used} marta</td>
              <td style="text-align:right"><button class="btn btn--danger btn--sm" data-del-promo="${esc(code)}">O'chirish</button></td></tr>`;
          }).join("") || `<tr><td colspan="5" class="empty">Promokodlar yo'q</td></tr>`}</tbody>
        </table>
      </div>`;

    $("#promoType").addEventListener("change", (e) => { $("#valField").hidden = e.target.value !== "percent"; });
    $("#promoForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      const code = d.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (code.length < 3) { toast("Kod kamida 3 ta harf/raqam bo'lsin", "err"); return; }
      const value = Math.round(+d.value);
      if (d.type === "percent" && !(value >= 1 && value <= 90)) { toast("Foiz 1 dan 90 gacha bo'lsin", "err"); return; }
      const list = { ...(Store.get("opus_promos", null) || PROMO_CODES) };
      const p = { type: d.type };
      if (d.type === "percent") p.value = value;
      if (+d.min > 0) p.min = Math.round(+d.min);
      p.label = promoLabel(p);
      list[code] = p;
      Store.set("opus_promos", list);
      toast(`${code} promokodi saqlandi`);
      renderPromos();
    });
  }

  /* =========================================================
     SOZLAMALAR
     ========================================================= */
  function renderSettings() {
    const s = { fee: DELIVERY.fee, freeFrom: DELIVERY.freeFrom, minOrder: DELIVERY.minOrder, comboDiscount: COMBO.discount, autoStatus: SETTINGS.autoStatus, ...Store.get("opus_settings", {}) };
    $("#page").innerHTML = `
      <div class="cols cols--even">
        <section class="card">
          <div class="card__head"><div><h2>Yetkazish va narxlar</h2><p>Saytda darhol qo'llanadi</p></div></div>
          <form id="setForm">
            <div class="set-row"><div><h4>Yetkazish narxi</h4><p>Bitta buyurtma uchun, so'm</p></div><input class="input" name="fee" type="number" min="0" step="1000" value="${s.fee}"></div>
            <div class="set-row"><div><h4>Bepul yetkazish chegarasi</h4><p>Shu summadan oshsa yetkazish bepul</p></div><input class="input" name="freeFrom" type="number" min="0" step="1000" value="${s.freeFrom}"></div>
            <div class="set-row"><div><h4>Minimal buyurtma</h4><p>Bundan kam summada buyurtma qabul qilinmaydi</p></div><input class="input" name="minOrder" type="number" min="0" step="1000" value="${s.minOrder}"></div>
            <div class="set-row"><div><h4>Kombo chegirmasi</h4><p>"Kombo yig'ish" bo'limidagi foiz</p></div><input class="input" name="comboDiscount" type="number" min="0" max="50" value="${s.comboDiscount}"></div>
            <div class="set-row"><div><h4>Demo rejim</h4><p>Holat qo'lda o'zgartirilmasa, vaqt bilan o'zi siljiydi</p></div><label class="switch"><input type="checkbox" name="autoStatus" ${s.autoStatus ? "checked" : ""}><span></span></label></div>
            <div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn btn--fire" type="submit">Saqlash</button></div>
          </form>
        </section>

        <div style="display:grid;gap:18px">
          <section class="card">
            <div class="card__head"><div><h2>Parolni almashtirish</h2></div></div>
            <form id="passForm" style="display:grid;gap:12px">
              <label class="field"><span>Joriy parol</span><input type="password" name="old" autocomplete="current-password" required></label>
              <div class="grid2">
                <label class="field"><span>Yangi parol</span><input type="password" name="next" autocomplete="new-password" minlength="6" required></label>
                <label class="field"><span>Takrorlang</span><input type="password" name="again" autocomplete="new-password" required></label>
              </div>
              <p class="warn">⚠️ Parol faqat shu brauzerda saqlanadi va sayt kodini ko'ra oladigan odamni to'xtatmaydi. Haqiqiy himoya uchun server (backend) kerak.</p>
              <div style="display:flex;justify-content:flex-end"><button class="btn btn--fire" type="submit">Almashtirish</button></div>
            </form>
          </section>

          <section class="card">
            <div class="card__head"><div><h2>Ma'lumotlar</h2><p>${orders().length} ta buyurtma · ${products().length} ta taom</p></div></div>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              <button class="btn btn--ghost btn--sm" data-export>⬇ Zaxira nusxa (JSON)</button>
              <span class="btn btn--ghost btn--sm upload">⬆ Zaxiradan tiklash<input type="file" accept="application/json" id="importFile"></span>
              <button class="btn btn--ghost btn--sm" data-demo>✨ Demo buyurtmalar</button>
              <button class="btn btn--danger btn--sm" data-clear-orders>🗑 Buyurtmalarni o'chirish</button>
              <button class="btn btn--danger btn--sm" data-reset-all>↺ Hammasini tiklash</button>
            </div>
          </section>
        </div>
      </div>`;

    $("#setForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      const next = { fee: Math.max(0, +d.fee || 0), freeFrom: Math.max(0, +d.freeFrom || 0), minOrder: Math.max(0, +d.minOrder || 0), comboDiscount: Math.min(50, Math.max(0, +d.comboDiscount || 0)), autoStatus: !!d.autoStatus };
      Store.set("opus_settings", next);
      Object.assign(DELIVERY, { fee: next.fee, freeFrom: next.freeFrom, minOrder: next.minOrder });
      COMBO.discount = next.comboDiscount;
      SETTINGS.autoStatus = next.autoStatus;
      toast("Sozlamalar saqlandi");
    });

    $("#passForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      if (hash(d.old) !== passHash()) { toast("Joriy parol noto'g'ri", "err"); return; }
      if (d.next.length < 6) { toast("Yangi parol kamida 6 belgi", "err"); return; }
      if (d.next !== d.again) { toast("Yangi parollar bir xil emas", "err"); return; }
      Store.set("opus_admin_pass", hash(d.next));
      e.target.reset();
      toast("Parol almashtirildi");
    });

    $("#importFile").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      f.text().then((txt) => {
        const data = JSON.parse(txt);
        if (!data || data.app !== "opus-food") throw new Error("format");
        if (!confirm("Joriy ma'lumotlar zaxiradagisi bilan almashtiriladi. Davom etasizmi?")) return;
        ["products", "orders", "promos", "settings"].forEach((k) => { if (data[k] != null) Store.set("opus_" + k, data[k]); });
        toast("Zaxira tiklandi");
        setTimeout(() => location.reload(), 600);
      }).catch(() => toast("Bu OPUS FOOD zaxira fayli emas", "err"));
    });
  }

  function exportData() {
    const data = { app: "opus-food", exportedAt: new Date().toISOString(), products: products(), orders: orders(), promos: Store.get("opus_promos", PROMO_CODES), settings: Store.get("opus_settings", {}) };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = `opus-food-zaxira-${dayKey(Date.now())}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ---------- Demo buyurtmalar ---------- */
  function makeDemoOrders(n = 48) {
    const names = ["Aziz", "Madina", "Jasur", "Dilnoza", "Sardor", "Nilufar", "Bekzod", "Kamola", "Otabek", "Shahzoda", "Rustam", "Zarina", "Timur", "Malika", "Akmal"];
    const streets = ["Amir Temur ko'chasi", "Mustaqillik ko'chasi", "Chilonzor 9-kvartal", "Yunusobod 4-mavze", "Navoiy ko'chasi", "Bobur ko'chasi", "Shota Rustaveli ko'chasi"];
    const methods = ["click", "click", "payme", "payme", "uzum", "card", "cash", "cash"];
    const menu = products().filter((p) => !p.hidden);
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    const list = [];
    for (let i = 0; i < n; i++) {
      const daysAgo = Math.floor(Math.pow(Math.random(), 1.4) * 14);
      const d = startOfDay(Date.now() - daysAgo * 864e5);
      d.setHours(10 + Math.floor(Math.random() * 13), Math.floor(Math.random() * 60));
      if (d > Date.now()) d.setTime(Date.now() - Math.random() * 3 * 36e5);
      const picks = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => rnd(menu));
      const items = [...new Map(picks.map((p) => [p.id, p])).values()].map((p) => ({ name: p.name, sub: "", qty: 1 + (Math.random() < .25 ? 1 : 0), price: p.price }));
      const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
      const pickup = Math.random() < .15;
      const delivery = pickup || subtotal >= DELIVERY.freeFrom ? 0 : DELIVERY.fee;
      const method = rnd(methods);
      const today = daysAgo === 0;
      const status = Math.random() < .07 ? "cancelled" : today ? rnd(["new", "cooking", "delivering", "done", "done"]) : "done";
      list.push({
        id: "OP-" + String(100000 + Math.floor(Math.random() * 899999)),
        createdAt: d.toISOString(),
        items,
        customer: { type: pickup ? "pickup" : "delivery", name: rnd(names), phone: `+998 9${Math.floor(Math.random() * 10)} ${100 + Math.floor(Math.random() * 899)} ${10 + Math.floor(Math.random() * 89)} ${10 + Math.floor(Math.random() * 89)}`, address: pickup ? "" : `${rnd(streets)}, ${1 + Math.floor(Math.random() * 90)}`, flat: "", floor: "", time: "Imkon qadar tez", note: "" },
        payment: { method, label: method === "cash" ? "Naqd (kuryerga)" : method === "card" ? "Karta •••• " + (1000 + Math.floor(Math.random() * 8999)) : PAY_NAMES[method], paid: method !== "cash" || status === "done" },
        promo: null, subtotal, discount: 0, delivery, total: subtotal + delivery,
        status, statusManual: true, demo: true,
      });
    }
    const all = [...orders(), ...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    Store.set("opus_orders", all);
    list.forEach((o) => ui.knownIds.add(o.id));
    toast(`${n} ta demo buyurtma yaratildi`);
    route();
  }

  /* =========================================================
     HODISALAR
     ========================================================= */
  function refresh() {
    const key = current();
    if (key === "dashboard" || key === "orders") PAGES[key].render();
    updateBadge();
  }

  document.addEventListener("click", (e) => {
    const t = e.target;
    const hit = (sel) => t.closest(sel);
    let el;
    if ((el = hit("[data-period]"))) { ui.period = el.dataset.period; renderDashboard(); }
    else if (hit("[data-chart-view]")) { ui.chartTable = !ui.chartTable; renderDashboard(); }
    else if ((el = hit("[data-goto-status]"))) { ui.ordFilter = el.dataset.gotoStatus; location.hash = "orders"; }
    else if ((el = hit("[data-ord-filter]"))) { ui.ordFilter = el.dataset.ordFilter; renderOrders(); }
    else if ((el = hit("[data-flow]"))) {
      if (el.dataset.flow === "cancelled" && !confirm(`${el.dataset.id} buyurtmasini bekor qilasizmi?`)) return;
      setStatus(el.dataset.id, el.dataset.flow);
    }
    else if (hit("[data-close-drawer]") || t.id === "scrim") closeDrawer();
    else if (hit("select, option")) { /* holat tanlovi — qatorni ochmaymiz */ }
    else if ((el = hit("[data-open-order]"))) openOrder(el.dataset.openOrder);
    else if ((el = hit("[data-menu-cat]"))) { ui.menuCat = el.dataset.menuCat; renderMenu(); }
    else if ((el = hit("[data-edit-product]"))) editProduct(el.dataset.editProduct);
    else if ((el = hit("[data-delete-product]"))) {
      const p = products().find((x) => x.id === el.dataset.deleteProduct);
      if (p && confirm(`"${p.name}" menyudan butunlay o'chirilsinmi?`)) {
        saveProducts(products().filter((x) => x.id !== p.id));
        toast("Taom o'chirildi");
        renderMenu();
      }
    }
    else if (hit("[data-reset-menu]")) {
      if (confirm("Barcha o'zgarishlar bekor qilinib, asl menyu tiklansinmi?")) { localStorage.removeItem("opus_products"); toast("Asl menyu tiklandi"); renderMenu(); }
    }
    else if (hit("[data-close-modal]") || t.id === "modal") closeModal();
    else if ((el = hit("[data-del-promo]"))) {
      const code = el.dataset.delPromo;
      if (confirm(`${code} promokodi o'chirilsinmi?`)) {
        const list = { ...(Store.get("opus_promos", null) || PROMO_CODES) };
        delete list[code];
        Store.set("opus_promos", list);
        toast("Promokod o'chirildi");
        renderPromos();
      }
    }
    else if (hit("[data-export]")) exportData();
    else if (hit("[data-demo]")) makeDemoOrders();
    else if (hit("[data-clear-orders]")) {
      if (confirm("Barcha buyurtmalar o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.")) { Store.set("opus_orders", []); toast("Buyurtmalar o'chirildi"); route(); }
    }
    else if (hit("[data-reset-all]")) {
      if (confirm("Menyu, promokodlar va sozlamalar asl holatiga qaytarilsinmi? (Buyurtmalar va parol saqlanib qoladi)")) {
        ["opus_products", "opus_promos", "opus_settings"].forEach((k) => localStorage.removeItem(k));
        toast("Asl holat tiklandi");
        setTimeout(() => location.reload(), 600);
      }
    }
  });

  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.setStatus) {
      if (t.value === "cancelled" && !confirm(`${t.dataset.setStatus} buyurtmasini bekor qilasizmi?`)) { refresh(); return; }
      setStatus(t.dataset.setStatus, t.value);
    } else if (t.dataset.toggleProduct) {
      const list = products().map((p) => (p.id === t.dataset.toggleProduct ? { ...p, hidden: !t.checked } : p));
      saveProducts(list);
      toast(t.checked ? "Taom sotuvga qaytdi" : "Taom stop-listga tushdi");
      renderMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeModal(); closeDrawer(); }
  });

  // Sayt boshqa oynada yangi buyurtma qabul qilsa — darhol bildirishnoma
  function checkNewOrders(notify) {
    const fresh = orders().filter((o) => !ui.knownIds.has(o.id));
    fresh.forEach((o) => ui.knownIds.add(o.id));
    if (notify && fresh.length && isAuthed()) {
      fresh.forEach((o) => toast(`Yangi buyurtma <b>${esc(o.id)}</b> · ${som(o.total)}`, "order"));
      beep();
    }
    return fresh.length;
  }

  window.addEventListener("storage", (e) => {
    if (!isAuthed() || !e.key || !e.key.startsWith("opus_")) return;
    if (e.key === "opus_orders") checkNewOrders(true);
    const busy = document.activeElement && /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
    if (!busy && !$("#modal").classList.contains("is-open")) refresh();
  });

  // Demo rejimda holatlar vaqt bilan siljiydi — jadvalni yangilab turamiz
  setInterval(() => {
    if (!isAuthed() || $("#app").hidden) return;
    const busy = document.activeElement && /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
    checkNewOrders(true);
    if (!busy && !$("#modal").classList.contains("is-open")) refresh();
    showDate();
  }, 10000);

  function showDate() {
    const d = new Date();
    const days = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
    $("#topDate").textContent = `${days[d.getDay()]}, ${d.toLocaleDateString("ru-RU")} · ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
  }

  /* ---------- Start ---------- */
  showDate();
  if (isAuthed()) showApp();
  else $("#loginPass").focus();
})();
