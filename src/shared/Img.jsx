import { useState } from "react";
import { remoteImg, PAY_LOGOS, LOGO_NAMES } from "./data.js";

/* Taom rasmi: mahalliy fayl ochilmasa — Unsplash'dagi nusxa, u ham ochilmasa — emoji */
export function Img({ src, alt = "", emoji = "🍔", lazy = true, className }) {
  const [stage, setStage] = useState(0); // 0: mahalliy, 1: Unsplash, 2: emoji
  const remote = remoteImg(src);
  if (stage === 2 || !src) return <div className="img-fallback">{emoji}</div>;
  return (
    <img
      className={className}
      src={stage === 1 ? remote : src}
      alt={alt}
      loading={lazy ? "lazy" : undefined}
      onError={() => setStage(stage === 0 && remote ? 1 : 2)}
    />
  );
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
