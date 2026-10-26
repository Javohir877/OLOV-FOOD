/* =========================================================
   Telegram Mini App: sayt bot ichida ochilganda
   - to'liq ekranga yoyiladi, ranglar Telegram sarlavhasiga moslanadi
   - tugmalarda tebranish (haptic), "Orqaga" tugmasi oynalarni yopadi
   - mijozning Telegram ismi va @username buyurtmaga qo'shiladi
   Oddiy brauzerda bularning hech biri ishlamaydi va xalaqit bermaydi.
   ========================================================= */
const W = typeof window !== "undefined" && window.Telegram && window.Telegram.WebApp;

// initData faqat haqiqiy Mini App ichida bo'sh emas
export const inTelegram = !!(W && W.initData);

const atLeast = (v) => { try { return W.isVersionAtLeast(v); } catch (e) { return false; } };

export function initTelegram() {
  if (!inTelegram) return;
  try {
    W.ready();
    W.expand();
    if (atLeast("6.1")) { W.setHeaderColor("#0C0A09"); W.setBackgroundColor("#0C0A09"); }
    if (atLeast("7.10")) W.setBottomBarColor("#0C0A09");
    // Savat/oynalarni pastga surganda ilova yopilib qolmasin
    if (atLeast("7.7")) W.disableVerticalSwipes();
    // Buyurtma rasmiylashtirilayotganda tasodifan yopilsa — so'raymiz
    if (atLeast("6.2")) W.enableClosingConfirmation();
    document.documentElement.classList.add("in-tg");
  } catch (e) { /* eski Telegram versiyasi */ }
}

/* Tebranish: "light" | "medium" | "heavy" | "success" | "error" | "warning" | "select" */
export function haptic(kind) {
  if (!inTelegram || !atLeast("6.1")) return;
  try {
    const h = W.HapticFeedback;
    if (kind === "select") h.selectionChanged();
    else if (kind === "success" || kind === "error" || kind === "warning") h.notificationOccurred(kind);
    else h.impactOccurred(kind || "light");
  } catch (e) { /* */ }
}

/* Imzolangan initData — bot serveri undan mijozning haqiqiy Telegram akkauntini tekshiradi */
export const tgInitData = () => (inTelegram ? W.initData : "");

/* Telegram'dagi foydalanuvchi: { id, name, username } yoki null */
export function tgUser() {
  if (!inTelegram) return null;
  const u = W.initDataUnsafe && W.initDataUnsafe.user;
  if (!u) return null;
  return { id: u.id, name: [u.first_name, u.last_name].filter(Boolean).join(" "), username: u.username || "" };
}

/* Telegram'ning "Orqaga" tugmasi: biror oyna ochiq bo'lsa ko'rinadi va uni yopadi */
let backHandler = null;
export function setBackButton(onBack) {
  if (!inTelegram || !atLeast("6.1")) return;
  try {
    if (backHandler) W.BackButton.offClick(backHandler);
    backHandler = onBack || null;
    if (onBack) { W.BackButton.onClick(onBack); W.BackButton.show(); } else W.BackButton.hide();
  } catch (e) { /* */ }
}
