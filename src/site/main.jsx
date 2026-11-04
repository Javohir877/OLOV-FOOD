import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { hasCachedConfig, loadRemoteConfig } from "../shared/store.js";
import { initTelegram } from "../shared/tg.js";
import { injectSeo } from "./seo.js";
import { initReveal } from "./motion.js";
import "../styles/site.css";

initTelegram(); // bot ichida ochilgan bo'lsa — Telegram'ga moslashamiz

const root = createRoot(document.getElementById("root"));
let gen = 0;
let motion = false;
const render = () => {
  injectSeo();
  root.render(<App key={gen} />);
  // bo'limlar ekranga kirganda paydo bo'lishi — birinchi chizilgandan keyin bir marta ishga tushadi
  if (!motion) { motion = true; setTimeout(initReveal, 0); }
};

// Admin "Saytga chiqargan" menyu va sozlamalar (config.json):
// - avval kelgan bo'lsa — saqlangan nusxa bilan DARHOL ochamiz, yangisini orqada tekshiramiz
//   (admin yangilagan bo'lsa — sahifa yangi narxlar bilan qayta chiziladi, savat saqlanib qoladi);
// - birinchi tashrif — config.json ni 2.5 soniyagacha kutamiz (bu vaqtda olovli yuklanish belgisi turadi).
if (hasCachedConfig()) {
  render();
  loadRemoteConfig().then((changed) => { if (changed) { gen += 1; render(); } });
} else {
  const cfg = loadRemoteConfig();
  const timeout = new Promise((r) => setTimeout(() => r("late"), 2500));
  Promise.race([cfg, timeout]).then((won) => {
    render();
    // internet sekin bo'lib config.json kechikib kelsa — kelganda qayta chizamiz
    if (won === "late") cfg.then((changed) => { if (changed) { gen += 1; render(); } });
  });
}

// Telefonga ilova sifatida o'rnatish va tez ochilish uchun (faqat https yoki localhost'da ishlaydi)
if ("serviceWorker" in navigator && !import.meta.env.DEV) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
}
