import { useEffect } from "react";
import { ShopProvider, useShop, isDocked } from "./shop.jsx";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import Combo from "./components/Combo.jsx";
import Deal from "./components/Deal.jsx";
import Menu from "./components/Menu.jsx";
import Wheel from "./components/Wheel.jsx";
import { Kitchen, Reviews, Branches, Track, Footer, Cartbar } from "./components/Sections.jsx";
import { DishSheet, TrackerSheet, Toasts, Confetti } from "./components/Sheets.jsx";
import { Checkout, PaySheet } from "./components/Checkout.jsx";
import { flushTelegram } from "../shared/telegram.js";

function Shell() {
  const { setTicketOpen, setDishId, setPay, pay, setTracker, setCheckoutOpen, dishId, tracker, checkoutOpen } = useShop();

  // Escape — eng ustdagi oynani yopadi
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (tracker) setTracker(null);
      else if (pay && pay.mode !== "processing") setPay(null);
      else if (dishId) setDishId(null);
      else if (checkoutOpen) setCheckoutOpen(false);
      else setTicketOpen(false);
    };
    const onResize = () => { if (isDocked()) setTicketOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); };
  });

  // Avval yuborilmay qolgan buyurtma xabarlari bo'lsa — Telegram'ga qayta yuboramiz
  useEffect(() => {
    flushTelegram();
    window.addEventListener("online", flushTelegram);
    return () => window.removeEventListener("online", flushTelegram);
  }, []);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Deal />
        <Combo />
        <Menu />
        <Kitchen />
        <Wheel />
        <Reviews />
        <Branches />
        <Track />
      </main>
      <Footer />
      <Cartbar />
      <DishSheet />
      <Checkout />
      <PaySheet />
      <TrackerSheet />
      <Toasts />
      <Confetti />
    </>
  );
}

export default function App() {
  return (
    <ShopProvider>
      <Shell />
    </ShopProvider>
  );
}
