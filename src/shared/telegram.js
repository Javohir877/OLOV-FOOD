/* =========================================================
   TELEGRAM — yangi buyurtma haqida xabar.
   Yuborilmay qolsa (internet yo'q), navbatga qo'yiladi va keyingi
   safar sayt ochilganda (yoki internet qaytganda) qayta yuboriladi.
   ========================================================= */
import { TELEGRAM } from "./data.js";
import { Store } from "./store.js";
import { fmt, som } from "./format.js";
import { tgInitData } from "./tg.js";

const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function orderMessage(o) {
  const c = o.customer;
  const pickup = c.type === "pickup";
  const addr = [c.address, c.flat && `${c.flat}-xonadon`, c.floor && `${c.floor}-qavat`].filter(Boolean).join(", ");
  const map = "https://yandex.uz/maps/?text=" + encodeURIComponent("Toshkent, " + c.address);
  const lines = [
    `🔔 <b>Yangi buyurtma ${esc(o.id)}</b>`,
    o.preorder ? "🌙 <b>Oldindan buyurtma</b> — ish vaqtidan tashqarida berildi, ochilgach tayyorlang" : "",
    `🕒 ${new Date(o.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`,
    "",
    `👤 <b>${esc(c.name)}</b>`,
    `📞 ${esc(c.phone)}`,
    o.tg ? `📲 Telegram bot orqali: ${o.tg.username ? "@" + esc(o.tg.username) : `<a href="tg://user?id=${o.tg.id}">${esc(o.tg.name || "profil")}</a>`}` : "",
    pickup ? "🏪 <b>Olib ketadi</b>" : `🛵 <b>Yetkazib berish:</b> ${esc(addr)}\n🗺 <a href="${map}">Xaritada ochish</a>`,
    `⏰ ${esc(c.time || "Imkon qadar tez")}`,
    c.note ? `📝 <i>${esc(c.note)}</i>` : "",
    "",
    "🍔 <b>Taomlar:</b>",
    ...o.items.map((i) => `• ${esc(i.name)} × ${i.qty} — ${fmt(i.price * i.qty)}${i.sub ? `\n   <i>${esc(i.sub)}</i>` : ""}`),
    "",
    `Taomlar: ${som(o.subtotal)}`,
    o.discount ? `Chegirma (${esc(o.promo)}): −${som(o.discount)}` : "",
    o.bonusUsed ? `Bonusdan: −${som(o.bonusUsed)}` : "",
    `Yetkazish: ${o.delivery ? som(o.delivery) : "bepul"}`,
    o.tip ? `💝 Kuryerga choy puli: ${som(o.tip)}` : "",
    `💰 <b>JAMI: ${som(o.total)}</b>`,
    `💳 ${esc(o.payment.label)} — ${o.payment.paid ? "✅ to'langan" : "💵 yetkazilganda to'lanadi"}`,
  ];
  return lines.filter((l) => l !== "").join("\n").replace(/\n{3,}/g, "\n\n");
}

// Bot serveriga (bot/worker.js) yuboradi. 4xx — so'rov yaroqsiz, qayta urinishdan foyda yo'q.
function send(item) {
  if (typeof item === "string") item = { path: "/rating", body: { text: item } }; // eski navbatdagi oddiy matnlar
  return fetch(TELEGRAM.api + item.path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item.body),
    keepalive: true,
  }).then((r) => r.json().catch(() => ({})).then((j) => {
    if (r.status >= 400 && r.status < 500) { console.warn("Bot serveri qabul qilmadi:", j.error); return; }
    if (!j.ok) throw new Error(j.error || "Bot serveri xatosi");
  }));
}

let flushing = false;
export async function flushTelegram() {
  if (flushing || !TELEGRAM.api) return;
  flushing = true;
  try {
    let queue = Store.get("opus_tg_queue", []);
    while (queue.length) {
      await send(queue[0]);
      queue = Store.get("opus_tg_queue", []).slice(1);
      Store.set("opus_tg_queue", queue);
    }
  } catch (e) {
    console.warn("Telegram'ga yuborilmadi, keyinroq qayta urinamiz:", e.message);
  } finally {
    flushing = false;
  }
}

function enqueue(path, body) {
  if (!TELEGRAM.api) return;
  Store.set("opus_tg_queue", [...Store.get("opus_tg_queue", []), { path, body }]);
  flushTelegram();
}

// Buyurtma bot serverida ham saqlanadi: admin uni ko'radi, holati o'zgarsa mijozga bot yozadi
export function notifyTelegram(order) { enqueue("/order", { order, text: orderMessage(order), initData: tgInitData() }); }

// Mijoz yetkazilgan buyurtmani baholaganda
export function notifyRating(o) {
  const r = o.rating;
  const stars = "★".repeat(r.stars) + "☆".repeat(5 - r.stars);
  enqueue("/rating", { id: o.id, createdAt: o.createdAt, rating: r, text: [
    `${r.stars >= 4 ? "⭐" : "⚠️"} <b>Baho: ${stars}</b> (${r.stars}/5)`,
    `🧾 ${esc(o.id)} · ${esc(o.customer.name)} · ${esc(o.customer.phone)}`,
    r.comment ? `💬 <i>${esc(r.comment)}</i>` : "",
  ].filter(Boolean).join("\n") });
}
