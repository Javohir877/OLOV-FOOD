import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { loadRemoteConfig } from "../shared/store.js";
import "../styles/site.css";

// Admin "Saytga chiqargan" menyu va sozlamalarni (config.json) olib, keyin chizamiz.
// config.json bo'lmasa yoki internet sekin bo'lsa — 2.5 soniyadan keyin standart qiymatlar bilan ochiladi.
const timeout = new Promise((r) => setTimeout(r, 2500));
Promise.race([loadRemoteConfig(), timeout]).finally(() => {
  createRoot(document.getElementById("root")).render(<App />);
});

// Telefonga ilova sifatida o'rnatish va tez ochilish uchun (faqat https yoki localhost'da ishlaydi)
if ("serviceWorker" in navigator && !import.meta.env.DEV) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
}
