/* =========================================================
   OPUS FOOD — sayt logikasi
   ========================================================= */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const som = (n) => `${fmt(n)} so'm`;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const BADGES = { hit: ["badge--hit", "🔥 Hit"], new: ["badge--new", "Yangi"], hot: ["badge--hot", "🌶 Achchiq"] };
  const LOGO_NAMES = { click: "Click", payme: "Payme", uzum: "Uzum", uzcard: "Uzcard", humo: "Humo", visa: "Visa", mastercard: "Mastercard" };

  const products = Store.products();
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const catIcon = (cat) => (CATEGORIES.find((c) => c.id === cat) || { icon: "🍔" }).icon;

  const state = {
    query: "",
    // Savatdagi narxlarni qayta hisoblaymiz — admin narx yoki stop-listni o'zgartirgan bo'lishi mumkin
    cart: Store.get("opus_cart_v2", [])
      .filter((l) => (l.kind === "combo" ? l.items : [l.id]).every((id) => byId[id] && !byId[id].hidden))
      .map((l) => ({ ...l, unit: l.kind === "combo" ? comboUnit(l.items) : dishUnit(byId[l.id], l.size, l.extras) })),
    promo: Store.get("opus_promo", null),
    sort: "",
    tag: "",
    useBonus: false,
    orderType: "delivery",
    payMethod: "click",
    combo: Object.fromEntries(COMBO.groups.map((g) => [g.id, comboItems(g)[0]])),
  };

  function comboItems(g) { return g.items.filter((id) => byId[id] && !byId[id].hidden); }
  function comboUnit(ids) {
    const full = ids.reduce((s, id) => s + byId[id].price, 0);
    return Math.round((full * (1 - COMBO.discount / 100)) / 1000) * 1000;
  }

  /* ---------- Rasm va logotiplar (zaxira bilan) ---------- */
  const imgTag = (p, extra = "") =>
    `<img src="${esc(p.img)}" alt="${esc(p.name)}" data-emoji="${catIcon(p.cat)}" ${extra}>`;
  const logoTile = (key) =>
    `<span class="logo-tile"><img src="${PAY_LOGOS[key]}" alt="${LOGO_NAMES[key]}" data-logo="${key}"></span>`;

  document.addEventListener("error", (e) => {
    const t = e.target;
    if (t.tagName !== "IMG") return;
    // Avval mahalliy fayl o'rniga Unsplash'dagi nusxasini sinab ko'ramiz
    const remote = !t.dataset.retried && remoteImg(t.getAttribute("src") || "");
    if (remote) { t.dataset.retried = "1"; t.src = remote; return; }
    if (t.dataset.emoji) {
      const d = document.createElement("div");
      d.className = "img-fallback";
      d.textContent = t.dataset.emoji;
      t.replaceWith(d);
    } else if (t.dataset.logo) {
      const s = document.createElement("span");
      s.className = "logo-text";
      s.textContent = LOGO_NAMES[t.dataset.logo];
      t.replaceWith(s);
    }
  }, true);

  /* ---------- Toast ---------- */
  function toast(msg, bad) {
    const el = document.createElement("div");
    el.className = "toast" + (bad ? " toast--err" : "");
    el.innerHTML = `<span>${bad ? "⚠️" : "🔥"}</span><span>${msg}</span>`;
    $("#toasts").appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 250); }, 2400);
  }

  /* =========================================================
     SAVAT MODELI
     ========================================================= */
  function dishUnit(p, sizeId, extras) {
    const o = OPTIONS[p.cat] || {};
    const size = (o.sizes || []).find((s) => s.id === sizeId);
    const ex = (o.extras || []).filter((e) => extras.includes(e.id));
    return p.price + (size ? size.add : 0) + ex.reduce((s, e) => s + e.add, 0);
  }

  function lineInfo(l) {
    if (l.kind === "combo") {
      const items = l.items.map((id) => byId[id]);
      return { name: "Kombo 🔥", sub: items.map((p) => p.name).join(" + "), img: items[0] };
    }
    const p = byId[l.id];
    const o = OPTIONS[p.cat] || {};
    const size = (o.sizes || []).find((s) => s.id === l.size);
    const ex = (o.extras || []).filter((e) => l.extras.includes(e.id)).map((e) => e.name);
    const sub = [size && size.add !== 0 ? size.name : "", ...ex].filter(Boolean).join(", ");
    return { name: p.name, sub, img: p };
  }

  function defaultSize(cat) {
    const sizes = (OPTIONS[cat] || {}).sizes || [];
    return (sizes.find((s) => s.add === 0) || sizes[0] || {}).id || null;
  }

  function addLine(line) {
    const found = state.cart.find((l) => l.key === line.key);
    if (found) found.qty = Math.min(found.qty + line.qty, 50);
    else state.cart.push(line);
    saveCart();
    renderAll();
    const btn = $("#cartOpen");
    btn.classList.remove("bump"); void btn.offsetWidth; btn.classList.add("bump");
    toast(`${esc(lineInfo(line).name)} savatga qo'shildi`);
  }

  function addDish(id, size = defaultSize(byId[id].cat), extras = [], qty = 1) {
    const p = byId[id];
    const ex = [...extras].sort();
    addLine({ key: [id, size, ex.join("+")].join("|"), kind: "dish", id, size, extras: ex, qty, unit: dishUnit(p, size, ex) });
  }

  function changeQty(key, delta) {
    const l = state.cart.find((x) => x.key === key);
    if (!l) return;
    l.qty += delta;
    if (l.qty <= 0) state.cart = state.cart.filter((x) => x !== l);
    saveCart();
    renderAll();
  }

  function saveCart() {
    Store.set("opus_cart_v2", state.cart);
    Store.set("opus_promo", state.promo);
  }

  // Admin promokodlari + omad g'ildiragi kodlari
  const promoOf = (code) => (code && (PROMO_CODES[code] || WHEEL_PROMOS[code])) || null;
  const bonusBalance = () => Math.max(0, Math.round(Store.get("opus_bonus", 0)));

  function totals() {
    const subtotal = state.cart.reduce((s, l) => s + l.unit * l.qty, 0);
    const count = state.cart.reduce((s, l) => s + l.qty, 0);
    const promo = promoOf(state.promo);
    const promoOk = promo && !(promo.min && subtotal < promo.min);
    const discount = promoOk && promo.type === "percent" ? Math.round(subtotal * promo.value / 100) : 0;
    const free = subtotal >= DELIVERY.freeFrom || (promoOk && promo.type === "delivery");
    const delivery = !count || state.orderType === "pickup" || free ? 0 : DELIVERY.fee;
    // Bonus bilan taomlar narxining ko'pi bilan BONUS.maxShare foizini to'lash mumkin (100 so'mgacha yaxlitlab)
    const bonusMax = Math.floor(((subtotal - discount) * BONUS.maxShare) / 100 / 100) * 100;
    const bonusUsed = state.useBonus ? Math.min(bonusBalance(), bonusMax) : 0;
    return { subtotal, count, promo, promoOk, discount, delivery, bonusMax, bonusUsed, total: subtotal - discount - bonusUsed + delivery };
  }

  /* =========================================================
     MENYU
     ========================================================= */
  function visibleProducts() {
    const q = state.query.trim().toLowerCase();
    const tagOk = (p) => !state.tag || (state.tag === "light" ? p.kcal > 0 && p.kcal <= 600 : p.badge === state.tag);
    return products.filter((p) => !p.hidden && tagOk(p) && (!q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)));
  }

  const SORTS = {
    rating: (a, b) => b.rating - a.rating,
    cheap: (a, b) => a.price - b.price,
    pricey: (a, b) => b.price - a.price,
  };

  function renderRail() {
    const list = visibleProducts();
    $("#railCats").innerHTML = CATEGORIES.map((c) => {
      const n = list.filter((p) => p.cat === c.id).length;
      return n ? `<button class="rail__cat" data-jump="${c.id}"><i><img src="${c.img}" alt="" data-emoji="${c.icon}"></i>${c.name}<small>${n}</small></button>` : "";
    }).join("");
    spy();
  }

  function renderMenu(animate = false) {
    const list = visibleProducts();
    $("#menuList").classList.toggle("no-anim", !animate);
    const inCart = {};
    state.cart.forEach((l) => { if (l.kind === "dish") inCart[l.id] = (inCart[l.id] || 0) + l.qty; });

    const blocks = CATEGORIES.map((c) => {
      const items = list.filter((p) => p.cat === c.id);
      if (state.sort) items.sort(SORTS[state.sort]);
      if (!items.length) return "";
      return `<section class="cat-block" id="cat-${c.id}">
        <div class="cat-head">
          <img src="${c.img}" alt="" data-emoji="${c.icon}">
          <div><h2>${c.name}</h2><small>${items.length} ta taom</small></div>
        </div>
        <div class="dishes">${items.map((p, i) => {
          const b = BADGES[p.badge];
          return `<article class="dish" data-open="${p.id}" style="animation-delay:${i * 50}ms" tabindex="0" aria-label="${esc(p.name)}">
            ${inCart[p.id] ? `<span class="in-cart">Savatda: ${inCart[p.id]}</span>` : ""}
            <div class="dish__img">${b ? `<span class="badge ${b[0]}">${b[1]}</span>` : ""}${imgTag(p, 'loading="lazy"')}</div>
            <div class="dish__info">
              <h3>${esc(p.name)}</h3>
              <p>${esc(p.desc)}</p>
              <span class="dish__meta"><b>★ ${p.rating.toFixed(1)}</b> · ${esc(p.weight)} · ${p.kcal} kkal</span>
              <div class="dish__buy">
                <span class="price">${fmt(p.price)} <small>so'm</small></span>
                <button class="plus" data-quick="${p.id}" aria-label="${esc(p.name)} — savatga qo'shish">+</button>
              </div>
            </div>
          </article>`;
        }).join("")}</div>
      </section>`;
    }).join("");

    $("#menuList").innerHTML = blocks || `<p class="empty">Bu filtr bo'yicha hech narsa topilmadi 😕<br><button class="btn btn--cream" data-reset-filters style="margin-top:14px">Filtrlarni tozalash</button></p>`;
  }

  // Qaysi kategoriya ko'rinib turganini aniqlash
  function spy() {
    const blocks = $$(".cat-block");
    if (!blocks.length) return;
    const offset = window.innerWidth <= 860 ? 200 : 140;
    let current = blocks[0].id;
    blocks.forEach((b) => { if (b.getBoundingClientRect().top < offset) current = b.id; });
    $$(".rail__cat").forEach((btn) => {
      const on = "cat-" + btn.dataset.jump === current;
      if (on && !btn.classList.contains("is-active") && window.innerWidth <= 860) {
        btn.parentElement.scrollTo({ left: btn.offsetLeft - 20, behavior: "smooth" });
      }
      btn.classList.toggle("is-active", on);
    });
  }

  /* =========================================================
     CHEK / SAVAT
     ========================================================= */
  function renderTicket() {
    const t = totals();
    $("#cartCount").textContent = t.count;
    $("#cartbarCount").textContent = t.count;
    $("#cartbarTotal").textContent = som(t.total);
    $("#cartbar").hidden = !t.count || window.innerWidth > 1280;
    $("#ticketFoot").hidden = !t.count;
    const bal = bonusBalance();
    $("#bonusChip").textContent = bal ? `💎 Bonus: ${som(bal)}` : "";
    $("#bonusChip").hidden = !bal;
    renderUpsell();

    if (!t.count) {
      $("#ticketItems").innerHTML = `<div class="ticket-empty"><div>🍔</div><p>Chek hali bo'sh.<br>Menyudan biror mazali narsa tanlang!</p></div>`;
      return;
    }

    $("#ticketItems").innerHTML = state.cart.map((l) => {
      const info = lineInfo(l);
      return `<div class="line">
        <div class="line__img">${imgTag(info.img)}</div>
        <div><h4>${esc(info.name)}</h4>${info.sub ? `<small>${esc(info.sub)}</small>` : ""}<span class="line__price">${som(l.unit * l.qty)}</span></div>
        <div class="line__side">
          <div class="stepper"><button data-dec="${esc(l.key)}" aria-label="Kamaytirish">−</button><span>${l.qty}</span><button data-inc="${esc(l.key)}" aria-label="Ko'paytirish">+</button></div>
        </div>
      </div>`;
    }).join("");

    const left = DELIVERY.freeFrom - t.subtotal;
    $("#ticketTotals").innerHTML = `
      <div class="freebar">${left > 0 ? `Bepul yetkazishgacha yana ${som(left)}` : "🎉 Yetkazib berish bepul!"}
        <div class="freebar__track"><div class="freebar__fill" style="width:${Math.min(100, (t.subtotal / DELIVERY.freeFrom) * 100)}%"></div></div>
      </div>
      <div class="totals" style="margin-top:12px">
        <div><span>Taomlar (${t.count})</span><span>${som(t.subtotal)}</span></div>
        ${t.promo ? `<div class="is-green"><span>${esc(state.promo)} ${t.promo.label}</span><span>${t.discount ? "−" + som(t.discount) : t.promoOk ? "✓" : "min. " + som(t.promo.min)}</span></div>` : ""}
        ${t.bonusUsed ? `<div class="is-green"><span>💎 Bonusdan</span><span>−${som(t.bonusUsed)}</span></div>` : ""}
        <div><span>Yetkazib berish</span><span>${t.delivery ? som(t.delivery) : "Bepul"}</span></div>
        <div class="grand"><span>Jami</span><b>${som(t.total)}</b></div>
      </div>`;
    $("#promoInput").value = state.promo || "";
  }

  /* ---------- "Bunga mos keladi" — savatga qo'shimcha takliflar ---------- */
  function renderUpsell() {
    const box = $("#ticketUpsell");
    if (!state.cart.length) { box.hidden = true; return; }
    const inCart = new Set(state.cart.flatMap((l) => (l.kind === "combo" ? l.items : [l.id])));
    const cats = new Set([...inCart].map((id) => byId[id].cat));
    // Ichimlik yo'q bo'lsa — avval ichimlik, gazak yo'q bo'lsa — gazak, keyin desert
    const order = ["drink", "snack", "dessert"].sort((a, b) => cats.has(a) - cats.has(b));
    const picks = order
      .flatMap((cat) => products.filter((p) => p.cat === cat && !p.hidden && !inCart.has(p.id)).sort((a, b) => b.rating - a.rating).slice(0, 2))
      .slice(0, 3);
    box.hidden = !picks.length;
    box.innerHTML = `<h4>Bunga juda mos keladi 👌</h4><div class="upsell__row">${picks.map((p) => `
      <div class="upsell__item">
        <div class="upsell__img">${imgTag(p, 'loading="lazy"')}</div>
        <b>${esc(p.name)}</b>
        <span>${fmt(p.price)} so'm</span>
        <button class="upsell__add" data-quick="${p.id}" aria-label="${esc(p.name)} qo'shish">+</button>
      </div>`).join("")}</div>`;
  }

  /* =========================================================
     KOMBO YIG'UVCHI
     ========================================================= */
  function comboPrice() {
    const items = COMBO.groups.map((g) => byId[state.combo[g.id]]);
    const full = items.reduce((s, p) => s + p.price, 0);
    return { items, full, price: comboUnit(items.map((p) => p.id)) };
  }

  function renderCombo() {
    // Biror guruhda taom qolmagan bo'lsa (hammasi stop-listda), kombo bo'limini yashiramiz
    if (COMBO.groups.some((g) => !comboItems(g).length)) { $("#combo").hidden = true; return; }
    $("#comboGroups").innerHTML = COMBO.groups.map((g, gi) => `
      <div class="cgroup">
        <h3><span>${gi + 1}</span>${g.name}</h3>
        <div class="cgroup__opts">${comboItems(g).map((id) => {
          const p = byId[id];
          return `<label class="copt">
            <input type="radio" name="combo-${g.id}" value="${id}" ${state.combo[g.id] === id ? "checked" : ""}>
            <div class="copt__img">${imgTag(p, 'loading="lazy"')}</div>
            <div class="copt__body"><b>${esc(p.name)}</b><small>${som(p.price)}</small></div>
          </label>`;
        }).join("")}</div>
      </div>`).join("");
    renderComboTicket();
  }

  function renderComboTicket() {
    const { items, full, price } = comboPrice();
    $("#comboTicket").innerHTML = `<div class="receipt">
      <h3>Kombo chek</h3>
      <span class="save-badge">−${COMBO.discount}% tejaysiz</span>
      <div style="margin-top:12px">${items.map((p) => `<div class="receipt__row"><span>${esc(p.name)}</span><b>${som(p.price)}</b></div>`).join("")}</div>
      <div class="receipt__total"><span>Jami</span><div><s>${fmt(full)}</s><b>${som(price)}</b></div></div>
      <button class="btn btn--fire btn--block" id="comboAdd">Kombo savatga →</button>
    </div>`;
  }

  /* =========================================================
     OYNALAR (sheet) BOSHQARUVI
     ========================================================= */
  const isDocked = () => window.innerWidth > 1280;
  function lock() {
    const anyOpen = $$(".sheet.is-open, .checkout.is-open").length || $("#ticket").classList.contains("is-open");
    document.body.classList.toggle("lock", !!anyOpen);
  }
  function openSheet(el) { el.classList.add("is-open"); el.setAttribute("aria-hidden", "false"); lock(); }
  function closeSheet(el) { el.classList.remove("is-open"); el.setAttribute("aria-hidden", "true"); lock(); if (el.id === "trackerSheet") stopTracker(); }

  function openTicket() {
    if (isDocked()) { $("#menu").scrollIntoView({ behavior: "smooth" }); return; }
    $("#ticket").classList.add("is-open");
    $("#scrim").classList.add("is-on");
    lock();
  }
  function closeTicket() {
    $("#ticket").classList.remove("is-open");
    $("#scrim").classList.remove("is-on");
    lock();
  }

  /* =========================================================
     TAOM OYNASI (o'lcham + qo'shimchalar)
     ========================================================= */
  function openDish(id) {
    const p = byId[id];
    const o = OPTIONS[p.cat] || {};
    const b = BADGES[p.badge];
    const size0 = defaultSize(p.cat);
    $("#dishBox").innerHTML = `
      <button class="x-btn sheet__close" data-close-sheet aria-label="Yopish">✕</button>
      <div class="dishm">
        <div class="dishm__img">${b ? `<span class="badge ${b[0]}" style="left:14px;top:14px;font-size:13px">${b[1]}</span>` : ""}${imgTag(p)}</div>
        <form class="dishm__body" id="dishForm">
          <h3>${esc(p.name)}</h3>
          <span class="dish__meta"><b>★ ${p.rating.toFixed(1)}</b> · ${esc(p.weight)} · ${p.kcal} kkal</span>
          <p>${esc(p.desc)}</p>
          ${o.sizes ? `<div><div class="opt-title">O'lcham</div><div class="pills">${o.sizes.map((s) => `
            <label class="pill"><input type="radio" name="size" value="${s.id}" ${s.id === size0 ? "checked" : ""}><span>${s.name}${s.add ? `<small>${s.add > 0 ? "+" : "−"}${fmt(Math.abs(s.add))}</small>` : ""}</span></label>`).join("")}</div></div>` : ""}
          ${o.extras ? `<div><div class="opt-title">Qo'shimchalar</div><div class="pills">${o.extras.map((e) => `
            <label class="pill"><input type="checkbox" name="extra" value="${e.id}"><span>${e.name}<small>${e.add ? "+" + fmt(e.add) : "bepul"}</small></span></label>`).join("")}</div></div>` : ""}
          <div class="dishm__buy">
            <div class="stepper"><button type="button" data-q="-1">−</button><span id="dishQty">1</span><button type="button" data-q="1">+</button></div>
            <button class="btn btn--fire" type="submit" id="dishAdd"></button>
          </div>
        </form>
      </div>`;

    const form = $("#dishForm");
    let qty = 1;
    const read = () => ({
      size: (form.querySelector("[name=size]:checked") || {}).value || null,
      extras: $$("[name=extra]:checked", form).map((i) => i.value),
    });
    const update = () => {
      const r = read();
      $("#dishQty").textContent = qty;
      $("#dishAdd").textContent = `Savatga · ${som(dishUnit(p, r.size, r.extras) * qty)}`;
    };
    form.addEventListener("change", update);
    form.addEventListener("click", (e) => {
      const q = e.target.closest("[data-q]");
      if (q) { qty = Math.max(1, Math.min(20, qty + +q.dataset.q)); update(); }
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const r = read();
      addDish(id, r.size, r.extras, qty);
      closeSheet($("#dishSheet"));
    });
    update();
    openSheet($("#dishSheet"));
  }

  /* =========================================================
     CHECKOUT
     ========================================================= */
  function maskPhone(v) {
    let d = v.replace(/\D/g, "");
    if (!d.startsWith("998")) d = "998" + d;
    d = d.slice(0, 12);
    return "+" + [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)].filter(Boolean).join(" ");
  }

  function cardBrand(d) {
    if (/^(8600|5614)/.test(d)) return "uzcard";
    if (/^9860/.test(d)) return "humo";
    if (/^4/.test(d)) return "visa";
    if (/^(5[1-5]|2[2-7])/.test(d)) return "mastercard";
    return null;
  }

  function luhn(d) {
    let sum = 0;
    for (let i = 0; i < d.length; i++) {
      let n = +d[d.length - 1 - i];
      if (i % 2) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
    }
    return sum % 10 === 0;
  }

  function openCheckout() {
    const t = totals();
    if (!t.count) return;
    if (t.subtotal < DELIVERY.minOrder) { toast(`Minimal buyurtma — ${som(DELIVERY.minOrder)}`, true); return; }
    closeTicket();
    const c = Store.get("opus_customer", {}) || {};
    if (c.type) state.orderType = c.type;

    $("#checkoutInner").innerHTML = `
      <div class="co-head">
        <h2>Buyurtmani <span class="hl">rasmiylashtirish</span></h2>
        <button class="x-btn" id="coClose" aria-label="Yopish">✕</button>
      </div>
      <form class="co-grid" id="coForm" novalidate>
        <div class="co-form">
          <section class="co-card">
            <h3><i>1</i>Qanday olasiz?</h3>
            <div class="toggle">
              <label><input type="radio" name="type" value="delivery" ${state.orderType === "delivery" ? "checked" : ""}>🛵 Yetkazib berish</label>
              <label><input type="radio" name="type" value="pickup" ${state.orderType === "pickup" ? "checked" : ""}>🏪 Olib ketaman</label>
            </div>
            <div class="row2">
              <div class="field"><label for="fName">Ismingiz</label><input id="fName" name="name" value="${esc(c.name)}" placeholder="Masalan: Aziz" autocomplete="name"><span class="field__err"></span></div>
              <div class="field"><label for="fPhone">Telefon raqam</label><input id="fPhone" name="phone" value="${esc(c.phone || "+998 ")}" inputmode="tel" autocomplete="tel"><span class="field__err"></span></div>
            </div>
            <div id="addrBlock" ${state.orderType === "pickup" ? "hidden" : ""}>
              <div class="row3">
                <div class="field"><label for="fAddr">Ko'cha va uy</label><input id="fAddr" name="address" value="${esc(c.address)}" placeholder="Amir Temur ko'chasi, 15" autocomplete="street-address"><span class="field__err"></span></div>
                <div class="field"><label for="fFlat">Xonadon</label><input id="fFlat" name="flat" value="${esc(c.flat)}" placeholder="24"></div>
                <div class="field"><label for="fFloor">Qavat</label><input id="fFloor" name="floor" value="${esc(c.floor)}" placeholder="3"></div>
              </div>
            </div>
            <p class="note" id="pickupNote" ${state.orderType === "pickup" ? "" : "hidden"}>🏪 Olib ketish manzili: Toshkent, Amir Temur ko'chasi, 1. Buyurtma 20 daqiqada tayyor bo'ladi.</p>
            <div class="row2" style="margin-top:14px">
              <div class="field"><label for="fTime">Qachon?</label>
                <select id="fTime" name="time">${["Imkon qadar tez", "1 soatdan keyin", "2 soatdan keyin", "Kechqurun 19:00–21:00"].map((o) => `<option>${o}</option>`).join("")}</select>
              </div>
              <div class="field"><label for="fNote">Izoh (ixtiyoriy)</label><input id="fNote" name="note" placeholder="Domofon ishlamaydi..."></div>
            </div>
          </section>

          <section class="co-card">
            <h3><i>2</i>To'lov usuli</h3>
            <div class="paygrid">${PAY_METHODS.map((m) => `
              <label class="paym ${m.logos.length === 1 ? "paym--single" : m.logos.length > 1 ? "paym--multi" : ""}">
                <input type="radio" name="method" value="${m.id}" ${state.payMethod === m.id ? "checked" : ""}>
                <span class="paym__logos">${m.logos.length ? m.logos.map(logoTile).join("") : `<span class="paym__cash">💵</span>`}</span>
                <b>${m.name}</b><small>${m.note}</small>
              </label>`).join("")}
            </div>
            <div class="paydetails" id="payDetails"></div>
          </section>

          ${bonusBalance() ? `<section class="co-card co-bonus">
            <label class="bonus-toggle">
              <span class="bonus-toggle__icon">💎</span>
              <span><b>Opus Bonus bilan to'lash</b><small>Balans: ${som(bonusBalance())} · buyurtmaning ${BONUS.maxShare}% gacha</small></span>
              <input type="checkbox" name="useBonus" ${state.useBonus ? "checked" : ""}><i class="sw"></i>
            </label>
          </section>` : ""}
        </div>

        <aside class="co-side">
          <div class="receipt">
            <h3>Yakuniy chek</h3>
            <div class="co-items">${state.cart.map((l) => {
              const info = lineInfo(l);
              return `<div class="co-item"><div>${esc(info.name)} × ${l.qty}${info.sub ? `<small>${esc(info.sub)}</small>` : ""}</div><b>${som(l.unit * l.qty)}</b></div>`;
            }).join("")}</div>
            <div class="totals" id="coTotals"></div>
            <button class="btn btn--fire btn--block" type="submit" id="coSubmit"></button>
            <div class="secure">🔒 Ma'lumotlar himoyalangan ulanish orqali uzatiladi</div>
          </div>
        </aside>
      </form>`;

    const form = $("#coForm");
    $("#fPhone").addEventListener("input", (e) => { e.target.value = maskPhone(e.target.value); });
    $("#coClose").addEventListener("click", () => closeSheet($("#checkout")));
    form.addEventListener("change", (e) => {
      if (e.target.name === "type") {
        state.orderType = e.target.value;
        $("#addrBlock").hidden = state.orderType === "pickup";
        $("#pickupNote").hidden = state.orderType !== "pickup";
        renderCoTotals();
        renderTicket();
      }
      if (e.target.name === "method") { state.payMethod = e.target.value; renderPayDetails(); renderCoTotals(); }
      if (e.target.name === "useBonus") { state.useBonus = e.target.checked; renderCoTotals(); renderTicket(); }
    });
    form.addEventListener("submit", (e) => { e.preventDefault(); submitCheckout(form); });

    renderPayDetails();
    renderCoTotals();
    openSheet($("#checkout"));
    $("#checkout").scrollTop = 0;
  }

  function renderCoTotals() {
    const t = totals();
    $("#coTotals").innerHTML = `
      <div><span>Taomlar</span><span>${som(t.subtotal)}</span></div>
      ${t.discount ? `<div class="is-green"><span>Chegirma ${esc(state.promo)}</span><span>−${som(t.discount)}</span></div>` : ""}
      ${t.bonusUsed ? `<div class="is-green"><span>💎 Bonusdan</span><span>−${som(t.bonusUsed)}</span></div>` : ""}
      <div><span>${state.orderType === "pickup" ? "Olib ketish" : "Yetkazib berish"}</span><span>${t.delivery ? som(t.delivery) : "Bepul"}</span></div>
      <div class="grand"><span>To'lov</span><b>${som(t.total)}</b></div>
      <div class="earn">💎 Bu buyurtmadan +${som(Math.round((t.total * BONUS.rate) / 100 / 100) * 100)} bonus olasiz</div>`;
    $("#coSubmit").textContent = state.payMethod === "cash" ? "Buyurtmani tasdiqlash ✓" : `${som(t.total)} to'lash →`;
  }

  function renderPayDetails() {
    const box = $("#payDetails");
    const m = state.payMethod;
    if (m === "card") {
      box.innerHTML = `
        <div class="plastic">
          <span class="plastic__brand" id="plBrand"></span>
          <span class="plastic__chip"></span>
          <span class="plastic__num" id="plNum">•••• •••• •••• ••••</span>
          <div class="plastic__row"><span>OPUS PAY</span><span id="plExp">MM/YY</span></div>
        </div>
        <div class="row2">
          <div class="field"><label for="cNum">Karta raqami</label><input id="cNum" inputmode="numeric" placeholder="8600 •••• •••• ••••" autocomplete="cc-number"><span class="field__err"></span></div>
          <div class="field"><label for="cExp">Amal qilish muddati</label><input id="cExp" inputmode="numeric" placeholder="MM/YY" autocomplete="cc-exp"><span class="field__err"></span></div>
        </div>`;
      const num = $("#cNum"), exp = $("#cExp");
      num.addEventListener("input", () => {
        const d = num.value.replace(/\D/g, "").slice(0, 16);
        num.value = d.replace(/(\d{4})(?=\d)/g, "$1 ");
        $("#plNum").textContent = (d + "•".repeat(16 - d.length)).replace(/(.{4})(?=.)/g, "$1 ");
        const brand = cardBrand(d);
        $("#plBrand").innerHTML = brand ? `<img src="${PAY_LOGOS[brand]}" alt="${LOGO_NAMES[brand]}" data-logo="${brand}">` : "";
      });
      exp.addEventListener("input", () => {
        const d = exp.value.replace(/\D/g, "").slice(0, 4);
        exp.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
        $("#plExp").textContent = exp.value || "MM/YY";
      });
    } else if (m === "cash") {
      box.innerHTML = `<p class="note">💵 Kuryerga naqd to'laysiz. Iloji bo'lsa, mayda pul tayyorlab qo'ying.</p>`;
    } else {
      const pm = PAY_METHODS.find((x) => x.id === m);
      box.innerHTML = `<p class="note">📲 "To'lash" tugmasini bosganingizdan so'ng ${pm.name} orqali to'lovni tasdiqlaysiz — QR kodni skanerlang yoki ilovani oching.</p>`;
    }
  }

  function setErr(input, msg) {
    const f = input.closest(".field");
    f.classList.toggle("bad", !!msg);
    $(".field__err", f).textContent = msg || "";
    return !msg;
  }

  function submitCheckout(form) {
    const data = Object.fromEntries(new FormData(form));
    let ok = true;
    ok = setErr($("#fName"), data.name.trim().length < 2 ? "Ismingizni kiriting" : "") && ok;
    ok = setErr($("#fPhone"), data.phone.replace(/\D/g, "").length !== 12 ? "Raqam to'liq emas: +998 XX XXX XX XX" : "") && ok;
    if (data.type === "delivery") ok = setErr($("#fAddr"), data.address.trim().length < 5 ? "Manzilni to'liqroq yozing" : "") && ok;

    let card = null;
    if (data.method === "card") {
      const d = $("#cNum").value.replace(/\D/g, "");
      const [mm, yy] = $("#cExp").value.split("/").map(Number);
      const brand = cardBrand(d);
      // Uzcard/Humo raqamlari Luhn'ga har doim mos kelmaydi — faqat xalqaro kartalarda tekshiramiz
      const numOk = d.length === 16 && brand && (brand === "uzcard" || brand === "humo" || luhn(d));
      const expOk = mm >= 1 && mm <= 12 && new Date(2000 + yy, mm) > new Date();
      ok = setErr($("#cNum"), numOk ? "" : "Karta raqami noto'g'ri") && ok;
      ok = setErr($("#cExp"), expOk ? "" : "Muddat noto'g'ri") && ok;
      card = { last4: d.slice(-4), brand };
    }
    if (!ok) { const bad = $(".field.bad input", form); if (bad) bad.focus(); return; }

    const customer = { type: data.type, name: data.name.trim(), phone: data.phone, address: data.address || "", flat: data.flat || "", floor: data.floor || "", time: data.time, note: data.note || "" };
    Store.set("opus_customer", customer);

    if (data.method === "cash") placeOrder(customer, "Naqd (kuryerga)");
    else if (data.method === "card") payByCard(customer, card);
    else payByApp(customer, data.method);
  }

  /* ---------- To'lov oynalari ---------- */
  function fakeQr(seed) {
    let x = [...seed].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
    const rnd = () => ((x = (x * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const n = 25, cells = [];
    const finder = (r, c) => [[0, 0], [0, n - 7], [n - 7, 0]].some(([fr, fc]) => r >= fr && r < fr + 7 && c >= fc && c < fc + 7);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!finder(r, c) && rnd() > .52) cells.push(`<rect x="${c}" y="${r}" width="1" height="1"/>`);
    const eye = (x0, y0) => `<rect x="${x0}" y="${y0}" width="7" height="7"/><rect x="${x0 + 1}" y="${y0 + 1}" width="5" height="5" fill="#fff"/><rect x="${x0 + 2}" y="${y0 + 2}" width="3" height="3"/>`;
    return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" fill="#1A1210">${cells.join("")}${eye(0, 0)}${eye(n - 7, 0)}${eye(0, n - 7)}</svg>`;
  }

  function payByApp(customer, method) {
    const pm = PAY_METHODS.find((x) => x.id === method);
    const t = totals();
    $("#payBox").innerHTML = `
      <button class="x-btn sheet__close" data-close-sheet aria-label="Yopish">✕</button>
      <div class="pay-logo-big"><img src="${PAY_LOGOS[method]}" alt="${pm.name}" data-logo="${method}"></div>
      <h3 class="money" style="font-size:48px">${som(t.total)}</h3>
      <p>${pm.name} ilovasida QR kodni skanerlang yoki ilovani oching va to'lovni tasdiqlang.</p>
      <div class="qr">${fakeQr(method + t.total + Date.now())}</div>
      <div class="wait"><span class="spinner"></span> To'lov kutilmoqda...</div>
      <div class="stack">
        <button class="btn btn--ink btn--block" id="appConfirm">To'lovni ilovada tasdiqladim</button>
        <button class="btn btn--cream btn--block" data-close-sheet>Boshqa usulni tanlash</button>
      </div>`;
    openSheet($("#paySheet"));
    $("#appConfirm").addEventListener("click", () => processing(() => placeOrder(customer, pm.name)));
  }

  function payByCard(customer, card) {
    const masked = customer.phone.replace(/(\+998 \d{2}) \d{3} \d{2}/, "$1 *** **");
    $("#payBox").innerHTML = `
      <button class="x-btn sheet__close" data-close-sheet aria-label="Yopish">✕</button>
      <div class="pay-logo-big">${card.brand ? `<img src="${PAY_LOGOS[card.brand]}" alt="${LOGO_NAMES[card.brand]}" data-logo="${card.brand}">` : "💳"}</div>
      <h3>SMS kodni kiriting</h3>
      <p>•••• ${card.last4} kartasiga bog'langan ${esc(masked)} raqamiga 6 xonali kod yuborildi.</p>
      <form id="otpForm">
        <div class="otp">${"<input inputmode='numeric' maxlength='1' autocomplete='one-time-code'>".repeat(6)}</div>
        <p class="field__err" id="otpErr" style="margin:6px 0 12px"></p>
        <button class="btn btn--fire btn--block" type="submit">Tasdiqlash</button>
      </form>
      <p style="margin:14px 0 0;font-size:13px">Kod kelmadimi? <b id="resend">60</b></p>`;
    openSheet($("#paySheet"));

    const inputs = $$(".otp input");
    inputs[0].focus();
    inputs.forEach((inp, i) => {
      inp.addEventListener("input", () => {
        inp.value = inp.value.replace(/\D/g, "").slice(-1);
        if (inp.value && inputs[i + 1]) inputs[i + 1].focus();
      });
      inp.addEventListener("keydown", (e) => { if (e.key === "Backspace" && !inp.value && inputs[i - 1]) inputs[i - 1].focus(); });
      inp.addEventListener("paste", (e) => {
        const d = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
        if (!d) return;
        e.preventDefault();
        inputs.forEach((x, j) => { x.value = d[j] || ""; });
        inputs[Math.min(d.length, 5)].focus();
      });
    });
    let sec = 60;
    const timer = setInterval(() => {
      const el = $("#resend");
      if (!el) { clearInterval(timer); return; }
      sec -= 1;
      el.textContent = sec > 0 ? `${sec} soniyadan keyin qayta yuborish` : "Qayta yuborish";
      if (sec <= 0) clearInterval(timer);
    }, 1000);
    $("#otpForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const code = inputs.map((i) => i.value).join("");
      if (code.length !== 6) { $("#otpErr").textContent = "6 xonali kodni to'liq kiriting"; return; }
      clearInterval(timer);
      processing(() => placeOrder(customer, `Karta •••• ${card.last4}`));
    });
  }

  async function processing(done) {
    $("#payBox").innerHTML = `<div class="spinner big-spinner"></div><h3>To'lov amalga oshirilmoqda</h3><p>Iltimos, oynani yopmang...</p>`;
    openSheet($("#paySheet"));
    await wait(1800);
    done();
  }

  function placeOrder(customer, payLabel) {
    const t = totals();
    const earned = Math.round((t.total * BONUS.rate) / 100 / 100) * 100;
    const order = {
      id: "OP-" + String(Date.now()).slice(-6),
      createdAt: new Date().toISOString(),
      // ref — "Qayta buyurtma" uchun aynan qaysi taom va variant ekanini saqlaymiz
      items: state.cart.map((l) => {
        const i = lineInfo(l);
        const ref = l.kind === "combo" ? { kind: "combo", items: l.items } : { kind: "dish", id: l.id, size: l.size, extras: l.extras };
        return { name: i.name, sub: i.sub, qty: l.qty, price: l.unit, ref };
      }),
      customer,
      payment: { method: state.payMethod, label: payLabel, paid: state.payMethod !== "cash" },
      promo: state.promo,
      subtotal: t.subtotal, discount: t.discount, bonusUsed: t.bonusUsed, bonusEarned: earned, delivery: t.delivery, total: t.total,
      status: "new",
    };
    Store.saveOrder(order);
    notifyTelegram(order);
    Store.set("opus_bonus", bonusBalance() - t.bonusUsed + earned);
    state.cart = [];
    state.promo = null;
    state.useBonus = false;
    saveCart();
    setTimeout(() => toast(`💎 +${som(earned)} bonus hisobingizga tushdi`), 1200);
    renderAll();
    closeSheet($("#paySheet"));
    closeSheet($("#checkout"));
    confetti();
    openTracker(order.id, true);
  }

  /* =========================================================
     TELEGRAM — yangi buyurtma haqida xabar
     Yuborilmay qolsa (internet yo'q), navbatga qo'yiladi va keyingi
     safar sayt ochilganda qayta yuboriladi.
     ========================================================= */
  const tgEsc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function orderMessage(o) {
    const c = o.customer;
    const pickup = c.type === "pickup";
    const addr = [c.address, c.flat && `${c.flat}-xonadon`, c.floor && `${c.floor}-qavat`].filter(Boolean).join(", ");
    const map = "https://yandex.uz/maps/?text=" + encodeURIComponent("Toshkent, " + c.address);
    const lines = [
      `🔔 <b>Yangi buyurtma ${tgEsc(o.id)}</b>`,
      `🕒 ${new Date(o.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`,
      "",
      `👤 <b>${tgEsc(c.name)}</b>`,
      `📞 ${tgEsc(c.phone)}`,
      pickup ? "🏪 <b>Olib ketadi</b>" : `🛵 <b>Yetkazib berish:</b> ${tgEsc(addr)}\n🗺 <a href="${map}">Xaritada ochish</a>`,
      `⏰ ${tgEsc(c.time || "Imkon qadar tez")}`,
      c.note ? `📝 <i>${tgEsc(c.note)}</i>` : "",
      "",
      "🍔 <b>Taomlar:</b>",
      ...o.items.map((i) => `• ${tgEsc(i.name)} × ${i.qty} — ${fmt(i.price * i.qty)}${i.sub ? `\n   <i>${tgEsc(i.sub)}</i>` : ""}`),
      "",
      `Taomlar: ${som(o.subtotal)}`,
      o.discount ? `Chegirma (${tgEsc(o.promo)}): −${som(o.discount)}` : "",
      o.bonusUsed ? `Bonusdan: −${som(o.bonusUsed)}` : "",
      `Yetkazish: ${o.delivery ? som(o.delivery) : "bepul"}`,
      `💰 <b>JAMI: ${som(o.total)}</b>`,
      `💳 ${tgEsc(o.payment.label)} — ${o.payment.paid ? "✅ to'langan" : "💵 yetkazilganda to'lanadi"}`,
    ];
    return lines.filter((l) => l !== "").join("\n").replace(/\n{3,}/g, "\n\n");
  }

  function sendTelegram(text) {
    return fetch(`https://api.telegram.org/bot${TELEGRAM.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM.chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
      keepalive: true,
    }).then((r) => r.json()).then((j) => { if (!j.ok) throw new Error(j.description || "Telegram xatosi"); });
  }

  function notifyTelegram(order) {
    if (!TELEGRAM.token || !TELEGRAM.chatId) return;
    const queue = Store.get("opus_tg_queue", []);
    queue.push(orderMessage(order));
    Store.set("opus_tg_queue", queue);
    flushTelegram();
  }

  let flushing = false;
  async function flushTelegram() {
    if (flushing || !TELEGRAM.token || !TELEGRAM.chatId) return;
    flushing = true;
    try {
      let queue = Store.get("opus_tg_queue", []);
      while (queue.length) {
        await sendTelegram(queue[0]);
        queue = Store.get("opus_tg_queue", []).slice(1);
        Store.set("opus_tg_queue", queue);
      }
    } catch (e) {
      console.warn("Telegram'ga yuborilmadi, keyinroq qayta urinamiz:", e.message);
    } finally {
      flushing = false;
    }
  }

  function confetti() {
    const colors = ["#FF5B14", "#FFC229", "#7BC94C", "#E8402A", "#FFF3E3"];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement("i");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = 1.8 + Math.random() * 1.8 + "s";
      c.style.animationDelay = Math.random() * .4 + "s";
      c.style.borderRadius = i % 3 ? "2px" : "50%";
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4200);
    }
  }

  /* =========================================================
     BUYURTMANI KUZATISH
     Demo: holat vaqt o'tishi bilan o'zgaradi. Admin panel
     keyinchalik "status" maydonini qo'lda boshqaradi.
     ========================================================= */
  const STAGES = [
    { id: "new", icon: "🧾", name: "Qabul qilindi", note: "Buyurtma oshxonaga yuborildi" },
    { id: "cooking", icon: "🔥", name: "Oshxonada", note: "Oshpazlarimiz olov ustida tayyorlamoqda" },
    { id: "delivering", icon: "🛵", name: "Yo'lda", note: "Kuryer issiq holda olib kelmoqda" },
    { id: "done", icon: "🎉", name: "Yetkazildi", note: "Yoqimli ishtaha!" },
  ];
  const PICKUP_STAGES = { delivering: { icon: "🏪", name: "Tayyor", note: "Buyurtmani olib ketishingiz mumkin" }, done: { icon: "🎉", name: "Topshirildi", note: "Yoqimli ishtaha!" } };

  const stageOf = (o) => ORDER_FLOW.indexOf(Store.statusOf(o));

  let trackerTimer = null;
  function stopTracker() { clearInterval(trackerTimer); trackerTimer = null; }

  function openTracker(id, fresh) {
    let o = Store.orders().find((x) => x.id === id);
    if (!o) { toast(`"${esc(id)}" raqamli buyurtma topilmadi`, true); return; }
    const pickup = o.customer.type === "pickup";
    const stages = STAGES.map((s) => ({ ...s, ...(pickup ? PICKUP_STAGES[s.id] : {}) }));

    const draw = () => {
      o = Store.orders().find((x) => x.id === id) || o; // admin o'zgartirgan bo'lsa, yangisini olamiz
      const idx = stageOf(o);
      if (idx < 0) {
        $("#trackerBox").innerHTML = `
          <button class="x-btn sheet__close" data-close-sheet aria-label="Yopish">✕</button>
          <div class="tr-head"><span class="tr-id">${esc(o.id)}</span><h3>Buyurtma bekor qilindi</h3>
          <p>Savollar bo'lsa, ${esc(SETTINGS.phone)} raqamiga qo'ng'iroq qiling.${o.payment.paid ? " To'langan summa kartangizga qaytariladi." : ""}</p></div>
          <div class="tr-actions"><button class="btn btn--ink" data-close-sheet>Tushunarli</button></div>`;
        stopTracker();
        return;
      }
      const pct = [8, 30, 64, 92][idx];
      $("#trackerBox").innerHTML = `
        <button class="x-btn sheet__close" data-close-sheet aria-label="Yopish">✕</button>
        <div class="tr-head">
          <span class="tr-id">${esc(o.id)}</span>
          <h3>${fresh && idx === 0 ? "Rahmat! Buyurtma qabul qilindi" : stages[idx].name}</h3>
          <p>${idx < 3 ? `Taxminan ${[30, 22, 10][idx]} daqiqada ${pickup ? "tayyor bo'ladi" : "yetib boradi"}` : stages[3].note}</p>
        </div>
        <div class="road">
          <span class="road__shop">🏪</span><span class="road__home">${pickup ? "🙋" : "🏠"}</span>
          <span class="road__scooter" style="left:${pct}%">${idx === 1 ? "🔥" : "🛵"}</span>
        </div>
        <ol class="steps">${stages.map((s, i) => `
          <li class="${i < idx ? "done" : i === idx ? "now" : ""}"><i>${i < idx ? "✓" : s.icon}</i><div>${s.name}<small>${s.note}</small></div></li>`).join("")}
        </ol>
        <div class="tr-sum">
          ${o.items.map((i) => `<div><span>${esc(i.name)} × ${i.qty}</span><b>${som(i.price * i.qty)}</b></div>`).join("")}
          <div class="tr-sum__total"><span>${esc(o.payment.label)}</span><b>${som(o.total)}</b></div>
        </div>
        <div class="tr-actions">
          <a class="btn btn--cream" href="tel:+998901234567">☎ Qo'ng'iroq</a>
          ${idx === 3 ? `<button class="btn btn--cream" data-reorder="${esc(o.id)}">🔁 Qayta buyurtma</button>` : ""}
          <button class="btn btn--ink" data-close-sheet>Yaxshi!</button>
        </div>`;
      if (idx === 3) stopTracker();
    };

    stopTracker();
    draw();
    trackerTimer = setInterval(draw, 2000);
    openSheet($("#trackerSheet"));
    renderRecent();
  }

  // Avvalgi buyurtmani savatga qayta qo'shish (stop-listdagi taomlar o'tkazib yuboriladi)
  function reorder(id) {
    const o = Store.orders().find((x) => x.id === id);
    if (!o) return;
    const byName = Object.fromEntries(products.map((p) => [p.name, p]));
    let added = 0, skipped = 0;
    o.items.forEach((it) => {
      const r = it.ref || (byName[it.name] ? { kind: "dish", id: byName[it.name].id, size: defaultSize(byName[it.name].cat), extras: [] } : null);
      const ids = r ? (r.kind === "combo" ? r.items : [r.id]) : [];
      if (!r || !ids.every((x) => byId[x] && !byId[x].hidden)) { skipped += 1; return; }
      const line = r.kind === "combo"
        ? { key: "combo|" + r.items.join("+"), kind: "combo", items: r.items, qty: it.qty, unit: comboUnit(r.items) }
        : { key: [r.id, r.size, (r.extras || []).join("+")].join("|"), kind: "dish", id: r.id, size: r.size, extras: r.extras || [], qty: it.qty, unit: dishUnit(byId[r.id], r.size, r.extras || []) };
      const found = state.cart.find((l) => l.key === line.key);
      if (found) found.qty += line.qty; else state.cart.push(line);
      added += 1;
    });
    saveCart();
    renderAll();
    closeSheet($("#trackerSheet"));
    if (added) { toast(`🔁 ${added} ta taom savatga qo'shildi${skipped ? ` (${skipped} tasi hozir mavjud emas)` : ""}`); openTicket(); }
    else toast("Bu buyurtmadagi taomlar hozir mavjud emas", true);
  }

  /* =========================================================
     OMAD G'ILDIRAGI
     ========================================================= */
  const todayKey = () => new Date().toDateString();
  let wheelAngle = 0;

  function renderWheel() {
    const n = WHEEL_PRIZES.length, step = 360 / n, r = 150, c = 160;
    const colors = ["#FF5A1A", "#2A1D17", "#FFB547", "#3A2418"];
    const pt = (deg, rad) => [c + rad * Math.sin((deg * Math.PI) / 180), c - rad * Math.cos((deg * Math.PI) / 180)];
    const slices = WHEEL_PRIZES.map((p, i) => {
      const a0 = i * step, a1 = a0 + step;
      const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r);
      const fill = colors[i % colors.length];
      const ink = i % 2 ? "#FFF4EA" : "#1A0F08";
      const mid = a0 + step / 2;
      return `<path d="M${c},${c} L${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z" fill="${fill}" stroke="#0C0A09" stroke-width="2"/>
        <g transform="rotate(${mid} ${c} ${c})"><text x="${c}" y="${c - r + 42}" text-anchor="middle" fill="${ink}" class="wheel__lbl">${esc(p.label)}</text>
        ${p.sub ? `<text x="${c}" y="${c - r + 60}" text-anchor="middle" fill="${ink}" class="wheel__sub">${esc(p.sub)}</text>` : ""}</g>`;
    }).join("");
    const dots = Array.from({ length: n * 2 }, (_, i) => { const [x, y] = pt(i * (step / 2), r + 6); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${i % 2 ? "#FFB547" : "#FFF4EA"}"/>`; }).join("");
    $("#wheelDisc").innerHTML = `<svg viewBox="0 0 320 320" aria-label="Omad g'ildiragi"><circle cx="160" cy="160" r="159" fill="#120D0A"/><g id="wheelRotor" style="transform:rotate(${wheelAngle}deg)">${slices}</g>${dots}<circle cx="160" cy="160" r="30" fill="#0C0A09" stroke="#FFB547" stroke-width="3"/><text x="160" y="168" text-anchor="middle" class="wheel__hub">🔥</text></svg>`;
    updateWheelState();
  }

  function updateWheelState() {
    const last = Store.get("opus_spin", null);
    const done = last && last.day === todayKey();
    $("#spinBtn").disabled = !!done;
    $("#spinBtn").textContent = done ? "ERTAGA" : "AYLANTIR";
    $("#wheelNote").innerHTML = done ? `Bugungi yutuq: <b>${esc(last.label)}</b>. Ertaga yana keling!` : "Bugun 1 ta urinishingiz bor 🎯";
    $("#bonusBalance").textContent = som(bonusBalance());
    $("#bonusRate").textContent = BONUS.rate + "%";
  }

  function spin() {
    const last = Store.get("opus_spin", null);
    if (last && last.day === todayKey()) return;
    const total = WHEEL_PRIZES.reduce((s, p) => s + p.weight, 0);
    let roll = Math.random() * total, idx = 0;
    while (roll >= WHEEL_PRIZES[idx].weight) { roll -= WHEEL_PRIZES[idx].weight; idx += 1; }
    const prize = WHEEL_PRIZES[idx];
    const step = 360 / WHEEL_PRIZES.length;
    // Ko'rsatkich tepada: tanlangan bo'lak markazi 0° ga kelishi kerak (+ bo'lak ichida kichik tasodifiy siljish)
    const target = 360 - (idx * step + step / 2) + (Math.random() - .5) * step * .6;
    wheelAngle += 360 * 6 + ((target - (wheelAngle % 360)) + 360) % 360;
    const rotor = $("#wheelRotor");
    $("#spinBtn").disabled = true;
    rotor.style.transition = "transform 5s cubic-bezier(.12,.75,.1,1)";
    rotor.style.transform = `rotate(${wheelAngle}deg)`;
    Store.set("opus_spin", { day: todayKey(), label: prize.label + (prize.sub ? " " + prize.sub : "") });
    setTimeout(() => {
      if (prize.type === "bonus") {
        Store.set("opus_bonus", bonusBalance() + prize.value);
        toast(`🎉 Tabriklaymiz! +${som(prize.value)} bonus yutdingiz`);
      } else {
        state.promo = prize.code;
        saveCart();
        toast(`🎉 ${esc(WHEEL_PROMOS[prize.code].label)} — savatga qo'llandi!`);
      }
      confetti();
      updateWheelState();
      renderTicket();
    }, 5200);
  }

  /* =========================================================
     FIKRLAR VA FILIALLAR
     ========================================================= */
  function renderReviews() {
    const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);
    $("#ratingBox").innerHTML = `
      <div class="rating__big"><b>${RATING.avg}</b><span>${stars(5)}</span><small>${fmt(RATING.count)} ta baho</small></div>
      <div class="rating__bars">${RATING.dist.map((v, i) => `
        <div><span>${5 - i}★</span><i><em style="width:${v}%"></em></i><small>${v}%</small></div>`).join("")}</div>`;
    $("#reviewsTrack").innerHTML = REVIEWS.map((r) => {
      const p = byId[r.dish];
      return `<figure class="rev">
        <div class="rev__stars" aria-label="${r.stars} yulduz">${stars(r.stars)}</div>
        <blockquote>${esc(r.text)}</blockquote>
        <figcaption>
          <span class="rev__ava">${esc(r.name[0])}</span>
          <div><b>${esc(r.name)}</b><small>${esc(r.area)}</small></div>
          ${p ? `<button class="rev__dish" data-open="${p.id}" title="${esc(p.name)}">${imgTag(p, 'loading="lazy"')}</button>` : ""}
        </figcaption>
      </figure>`;
    }).join("");
  }

  function branchOpen(b, now = new Date()) {
    const mins = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
    const t = now.getHours() * 60 + now.getMinutes();
    const o = mins(b.open), c = mins(b.close);
    return c > o ? t >= o && t < c : t >= o || t < c; // yarim tundan keyin yopiladigan filial
  }

  function renderBranches() {
    $("#branchesGrid").innerHTML = BRANCHES.map((b) => {
      const open = branchOpen(b);
      const map = "https://yandex.uz/maps/?text=" + encodeURIComponent("Toshkent, " + b.address);
      return `<article class="branch">
        <div class="branch__img"><img src="${esc(b.img)}" alt="" loading="lazy"><span class="branch__status ${open ? "is-open" : ""}">${open ? "● Hozir ochiq" : "● Yopiq"}</span></div>
        <div class="branch__body">
          <small>${esc(b.area)}</small>
          <h3>${esc(b.name)}</h3>
          <p>📍 ${esc(b.address)}</p>
          <p>🕙 ${b.open} – ${b.close} · har kuni</p>
          <div class="branch__perks">${b.perks.map((x) => `<span>${esc(x)}</span>`).join("")}</div>
          <div class="branch__actions">
            <a class="btn btn--cream" href="tel:${b.phone.replace(/\s/g, "")}">☎ Qo'ng'iroq</a>
            <a class="btn btn--fire" href="${map}" target="_blank" rel="noopener">Xaritada →</a>
          </div>
        </div>
      </article>`;
    }).join("");
  }

  function renderRecent() {
    const orders = Store.orders().slice(0, 5);
    $("#trackRecent").innerHTML = orders.length
      ? orders.map((o) => `<button data-track="${esc(o.id)}">${esc(o.id)} · ${som(o.total)}</button>`).join("")
      : `<small style="font-weight:600">Hali buyurtmalar yo'q — birinchisini bering! 🍔</small>`;
  }

  /* =========================================================
     HERO: burger, uchqunlar, parallaks
     ========================================================= */
  function initHero() {
    const embers = $("#embers");
    embers.innerHTML = Array.from({ length: 22 }, () => {
      const s = 3 + Math.random() * 6;
      return `<i style="left:${Math.random() * 100}%;--s:${s}px;--t:${5 + Math.random() * 6}s;--dl:${-Math.random() * 10}s;--x:${(Math.random() - .5) * 160}px"></i>`;
    }).join("");

    const hero = $(".hero"), stage = $("#stage");
    if (matchMedia("(hover: hover)").matches) {
      hero.addEventListener("pointermove", (e) => {
        const r = stage.getBoundingClientRect();
        const mx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 1.2)));
        const my = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 1.2)));
        stage.style.setProperty("--mx", mx.toFixed(3));
        stage.style.setProperty("--my", my.toFixed(3));
      });
      hero.addEventListener("pointerleave", () => { stage.style.setProperty("--mx", 0); stage.style.setProperty("--my", 0); });
    }

    const burger = $("#burger");
    const bits = ["🍔", "🔥", "🧀", "🍅", "🥬", "🥓", "✨"];
    burger.addEventListener("click", (e) => {
      burger.classList.remove("is-chomp"); void burger.offsetWidth; burger.classList.add("is-chomp");
      const r = stage.getBoundingClientRect();
      const x = (e.clientX || r.left + r.width / 2) - r.left, y = (e.clientY || r.top + r.height / 2) - r.top;
      for (let i = 0; i < 9; i++) {
        const p = document.createElement("span");
        const a = (Math.PI * 2 * i) / 9;
        p.className = "pop";
        p.textContent = bits[i % bits.length];
        p.style.cssText = `left:${x}px;top:${y}px;--x:${Math.cos(a) * 130}px;--y:${Math.sin(a) * 130}px;--r:${(Math.random() - .5) * 120}deg`;
        stage.appendChild(p);
        setTimeout(() => p.remove(), 900);
      }
      $(".stage__hint").textContent = ["Yana! 😋", "Ham-ham! 🍔", "Och qoldingizmi? 👇", "Menyuga o'ting! 🔥"][Math.floor(Math.random() * 4)];
    });
    burger.addEventListener("animationend", (e) => { if (e.animationName === "chomp") burger.classList.remove("is-chomp"); });
  }

  /* =========================================================
     HODISALAR
     ========================================================= */
  function renderAll() {
    renderMenu();
    renderTicket();
  }

  document.addEventListener("click", (e) => {
    const t = e.target;
    const quick = t.closest("[data-quick]");
    // "+" tugmasi standart variantni darhol qo'shadi; kartochkani bosish sozlash oynasini ochadi
    if (quick) { addDish(quick.dataset.quick); return; }
    const open = t.closest("[data-open]");
    if (open) { openDish(open.dataset.open); return; }
    const inc = t.closest("[data-inc]");
    if (inc) { changeQty(inc.dataset.inc, 1); return; }
    const dec = t.closest("[data-dec]");
    if (dec) { changeQty(dec.dataset.dec, -1); return; }
    const jump = t.closest("[data-jump]");
    if (jump) { $("#cat-" + jump.dataset.jump).scrollIntoView({ behavior: "smooth" }); return; }
    const track = t.closest("[data-track]");
    if (track) { openTracker(track.dataset.track); return; }
    const re = t.closest("[data-reorder]");
    if (re) { reorder(re.dataset.reorder); return; }
    const tag = t.closest("[data-tag]");
    if (tag) {
      state.tag = tag.dataset.tag;
      $$("[data-tag]").forEach((b) => b.classList.toggle("is-on", b === tag));
      renderMenu(true); renderRail();
      return;
    }
    if (t.closest("[data-reset-filters]")) {
      state.tag = ""; state.query = ""; state.sort = "";
      $("#searchInput").value = ""; $("#sortSelect").value = "";
      $$("[data-tag]").forEach((b) => b.classList.toggle("is-on", !b.dataset.tag));
      renderMenu(true); renderRail();
      return;
    }
    const rev = t.closest("[data-rev]");
    if (rev) {
      const tr = $("#reviewsTrack");
      tr.scrollBy({ left: +rev.dataset.rev * (tr.firstElementChild.offsetWidth + 16), behavior: "smooth" });
      return;
    }
    const close = t.closest("[data-close-sheet]");
    if (close) { closeSheet(close.closest(".sheet")); return; }
    if (t.classList.contains("sheet")) { closeSheet(t); return; }
    if (t.id === "comboAdd") {
      const { items, price } = comboPrice();
      const ids = items.map((p) => p.id);
      addLine({ key: "combo|" + ids.join("+"), kind: "combo", items: ids, qty: 1, unit: price });
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const top = [$("#trackerSheet"), $("#paySheet"), $("#dishSheet"), $("#checkout")].find((s) => s.classList.contains("is-open"));
      if (top) closeSheet(top);
      else closeTicket();
    }
    if (e.key === "Enter" && e.target.matches(".dish")) openDish(e.target.dataset.open);
  });

  $("#comboGroups").addEventListener("change", (e) => {
    const g = e.target.name.replace("combo-", "");
    state.combo[g] = e.target.value;
    renderComboTicket();
  });

  $("#cartOpen").addEventListener("click", openTicket);
  $("#cartbar").addEventListener("click", openTicket);
  $("#cartClose").addEventListener("click", closeTicket);
  $("#scrim").addEventListener("click", closeTicket);
  $("#checkoutBtn").addEventListener("click", openCheckout);

  $("#searchInput").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderMenu(true);
    renderRail();
  });

  $("#promoForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const code = $("#promoInput").value.trim().toUpperCase();
    if (!code) { state.promo = null; saveCart(); renderTicket(); return; }
    if (!promoOf(code)) { toast("Bunday promokod yo'q", true); return; }
    state.promo = code;
    saveCart();
    renderTicket();
    toast(`Promokod qo'llandi: ${esc(promoOf(code).label)}`);
  });

  $("#sortSelect").addEventListener("change", (e) => { state.sort = e.target.value; renderMenu(true); });
  $("#spinBtn").addEventListener("click", spin);

  $("#trackForm").addEventListener("submit", (e) => {
    e.preventDefault();
    let id = $("#trackInput").value.trim().toUpperCase();
    if (/^\d+$/.test(id)) id = "OP-" + id;
    if (id) openTracker(id);
  });

  const navToggle = $("#navToggle"), navLinks = $("#navLinks");
  navToggle.addEventListener("click", () => { navLinks.classList.toggle("is-open"); navToggle.classList.toggle("is-open"); });
  $$("a", navLinks).forEach((a) => a.addEventListener("click", () => { navLinks.classList.remove("is-open"); navToggle.classList.remove("is-open"); }));

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { spy(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", () => {
    if (isDocked()) closeTicket();
    renderTicket();
  });

  /* ---------- Start ---------- */
  $("#year").textContent = new Date().getFullYear();
  $("#ticketDate").textContent = new Date().toLocaleDateString("ru-RU") + " · OPUS FOOD";
  $("#footerPay").innerHTML = Object.keys(PAY_LOGOS).map(logoTile).join("");
  initHero();
  renderCombo();
  renderMenu(true);
  renderRail();
  renderTicket();
  renderRecent();
  renderWheel();
  renderReviews();
  renderBranches();
  flushTelegram(); // avval yuborilmay qolgan buyurtmalar bo'lsa
  window.addEventListener("online", flushTelegram);
})();
