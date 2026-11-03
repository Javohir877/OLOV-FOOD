import { useState } from "react";
import { remoteImg, PAY_LOGOS, LOGO_NAMES } from "./data.js";

/* Mahalliy taom rasmi bo'lsa — yengil WebP nusxalari (sm: 360px, asosiy: 640px).
   Brauzer ekran o'lchamiga qarab o'zi tanlaydi; WebP'ni bilmaydigan eski brauzer JPG'ni oladi. */
const LOCAL = /^assets\/img\/([^/]+)\.jpe?g$/;
export function webpSet(src) {
  const m = src && LOCAL.exec(src);
  return m ? `assets/img/sm/${m[1]}.webp 360w, assets/img/${m[1]}.webp 640w` : null;
}

/* Taom rasmi: mahalliy fayl ochilmasa — Unsplash'dagi nusxa, u ham ochilmasa — emoji.
   sizes — rasm sahifada qancha joy egallashi (brauzer shunga mos faylni yuklaydi) */
export function Img({ src, alt = "", emoji = "🍔", lazy = true, className, sizes = "160px" }) {
  const [stage, setStage] = useState(0); // 0: mahalliy, 1: Unsplash, 2: emoji
  const remote = remoteImg(src);
  if (stage === 2 || !src) return <div className="img-fallback">{emoji}</div>;
  const set = stage === 0 ? webpSet(src) : null;
  const img = (
    <img
      className={className}
      src={stage === 1 ? remote : src}
      alt={alt}
      loading={lazy ? "lazy" : undefined}
      decoding="async"
      onError={() => setStage(stage === 0 && remote ? 1 : 2)}
    />
  );
  if (!set) return img;
  return <picture><source type="image/webp" srcSet={set} sizes={sizes} />{img}</picture>;
}

/* To'lov tizimi logotipi (oq plitkada); rasm ochilmasa — nomi yoziladi */
export function LogoTile({ name }) {
  const [bad, setBad] = useState(false);
  return (
    <span className="logo-tile">
      {bad ? <span className="logo-text">{LOGO_NAMES[name]}</span> : <img src={PAY_LOGOS[name]} alt={LOGO_NAMES[name]} data-logo={name} onError={() => setBad(true)} />}
    </span>
  );
}
