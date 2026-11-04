/* =========================================================
   Harakat: bo'limlar ekranga kirganda paydo bo'lishi (reveal)
   va savatga "uchib" boradigan taom rasmi.
   Hammasi faqat transform/opacity — telefonda ham silliq.
   ========================================================= */

// Qaysi elementlar ekranga kirganda paydo bo'ladi. Bir ota ichidagilar navbat bilan (--i).
const REVEAL = [
  ".section-title", ".deal__card", ".cgroup", ".combo__ticket", ".cat-head", ".dish",
  ".polaroid", ".kitchen__text", ".facts li", ".wheel__text", ".wheel__stage", ".rev",
  ".rating", ".branch", ".track__box", ".footer__cols > div",
].join(",");

const reduced = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initReveal() {
  if (reduced()) return;
  const seen = new WeakSet();
  const show = (el) => { el.classList.add("in"); if (io) io.unobserve(el); };
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((list) => list.forEach((en) => { if (en.isIntersecting) show(en.target); }), { rootMargin: "0px 0px -6% 0px", threshold: 0.08 })
    : null;

  let first = true;
  const scan = () => {
    const els = document.querySelectorAll(REVEAL);
    const initial = first;
    if (els.length) first = false; // React hali chizmagan bo'lsa — "birinchi" skanerni kutamiz
    els.forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      // sayt ochilganda ekranda turganlar — darhol, animatsiyasiz (sakrash bo'lmasin)
      if (initial) { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) return; }
      const sibs = el.parentElement ? [...el.parentElement.children].filter((x) => x.matches(REVEAL)) : [];
      el.style.setProperty("--i", Math.min(8, Math.max(0, sibs.indexOf(el))));
      el.classList.add("rv");
      if (io) io.observe(el); else show(el);
    });
  };

  // Zaxira: IntersectionObserver ishlamay qolsa ham element ko'rinmay qolib ketmasin
  let t = 0;
  const fallback = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      document.querySelectorAll(".rv:not(.in)").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight * 1.05 && r.bottom > -50) show(el);
      });
    }, 120);
  };

  scan();
  // menyu filtrlanganda, yangi kartochkalar qo'shilganda — ularni ham kuzatamiz
  let pending = 0;
  new MutationObserver(() => { cancelAnimationFrame(pending); pending = requestAnimationFrame(scan); setTimeout(scan, 60); })
    .observe(document.getElementById("root"), { childList: true, subtree: true });
  window.addEventListener("scroll", fallback, { passive: true });
  window.addEventListener("resize", fallback);
  // Uchinchi zaxira: oddiy taymer (ba'zi brauzerlarda scroll hodisasi kechikadi) — yashirin element qolmasin
  setInterval(() => { if (!document.hidden && document.querySelector(".rv:not(.in)")) fallback(); }, 700);
}

/* Taom rasmi savat tugmasiga uchib boradi (Web Animations — videokartada) */
export function flyToCart(fromEl) {
  try {
    if (!fromEl || reduced() || !document.body.animate) return;
    const img = fromEl.tagName === "IMG" ? fromEl : fromEl.querySelector("img");
    const targets = [document.querySelector(".cartbar"), document.querySelector(".nav__actions .chip-btn:not(.chip-btn--ghost)")];
    const target = targets.find((el) => el && el.getBoundingClientRect().width > 0);
    if (!img || !target) return;
    const a = img.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const size = 64;
    const fly = document.createElement("div");
    fly.className = "fly";
    fly.innerHTML = `<img src="${img.currentSrc || img.src}" alt="">`;
    fly.style.left = a.left + a.width / 2 - size / 2 + "px";
    fly.style.top = a.top + a.height / 2 - size / 2 + "px";
    document.body.appendChild(fly);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    // egri yo'l: avval biroz tepaga sakraydi, keyin savatga tushadi
    const anim = fly.animate([
      { transform: "translate(0, 0) scale(.6)", opacity: 0 },
      { transform: "translate(0, -30px) scale(1.15)", opacity: 1, offset: 0.18 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.35 - 90}px) scale(.85) rotate(160deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(.25) rotate(360deg)`, opacity: 0.4 },
    ], { duration: 820, easing: "cubic-bezier(.4, 0, .2, 1)" });
    anim.onfinish = () => fly.remove();
    setTimeout(() => fly.remove(), 1500);
  } catch (e) { /* bezak — xato saytni to'xtatmasin */ }
}
