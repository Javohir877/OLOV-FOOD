# 🍔 OPUS FOOD

"Issiq. Shirali. Tez." — fast food do'koni uchun ko'cha-afishasi uslubidagi veb-sayt.
Build kerak emas: oddiy HTML, CSS va JavaScript.

## Imkoniyatlar

- 🍔 **Jonli burger** — qatlamlari "nafas oladi", ko'z qisadi, sichqonchaga ergashadi, bosilsa sakraydi va ingredientlar sochiladi
- 🧩 **Kombo yig'uvchi** — asosiy taom + gazak + ichimlik tanlang, −15% chegirma avtomatik
- 📋 **Menyu** — chap tomonda kategoriyalar paneli (scroll bilan avtomatik belgilanadi), qidiruv
- ⚙️ **Taomni sozlash** — o'lcham (XL, 35 sm...) va qo'shimchalar (pishloq, bekon...) narxi bilan
- 🧾 **Chek ko'rinishidagi savat** — kompyuterda doim o'ng tomonda, telefonda pastdan chiqadi
- 🎟 **Promokodlar** — `OPUS10` (−10%), `FIRE20` (−20%, 200 000 so'mdan), `BEPUL` (bepul yetkazish)
- 💳 **To'lov** — Click, Payme, Uzum Bank (QR kod oynasi), Uzcard/Humo/Visa/Mastercard karta (SMS kod), naqd
- 📍 **Jonli kuzatish** — buyurtma raqami bo'yicha: Qabul qilindi → Oshxonada → Yo'lda → Yetkazildi

## 🛠 Admin panel — `admin.html`

🔒 **Panel shifrlangan.** Saytdagi `admin.html` ichida panelning o'zi emas, faqat parol so'raydigan oyna va
AES-256 bilan shifrlangan ma'lumot bor. Parolsiz panelning na ko'rinishi, na kodi ochiladi; parol hech qayerda
(repoda ham) saqlanmaydi. Panelning ochiq manbasi `admin-src/` papkasida — u faqat egasining kompyuterida turadi
va GitHub'ga **hech qachon yuklanmaydi**.

**Parol qo'yish yoki almashtirish** (loyiha papkasida; parolni so'raydi, shifrlaydi va saytga yuklaydi):

```
powershell -ExecutionPolicy Bypass -File lock-admin.ps1 -Publish
```

Parolni unutsangiz — shu buyruqni qayta ishga tushirib yangisini qo'ying.

| Bo'lim | Imkoniyatlar |
|---|---|
| 📊 Dashboard | Tushum, buyurtmalar soni, o'rtacha chek, bekor qilinganlar; kunlik tushum grafigi (jadval ko'rinishi ham bor); eng ko'p sotilgan taomlar; holatlar; to'lov usullari |
| 🧾 Buyurtmalar | Holat bo'yicha filtr, qidiruv; holatni o'zgartirish (mijoz saytda jonli ko'radi); tafsilot paneli; bekor qilish; yangi buyurtmada 🔔 ovoz va bildirishnoma |
| 🍔 Menyu | Taom qo'shish/tahrirlash/o'chirish, narx, rasm (galereyadan, yuklash yoki havola), belgi (Hit/Yangi/Achchiq), stop-list |
| 🎟 Promokodlar | Foizli yoki bepul yetkazish kodlari, minimal summa, necha marta ishlatilgani |
| ⚙️ Sozlamalar | Yetkazish narxi, bepul yetkazish chegarasi, minimal buyurtma, kombo chegirmasi, demo rejim, zaxira (JSON eksport/import), demo buyurtmalar |

> ⚠️ Hozircha ma'lumotlar **brauzer xotirasida** (localStorage) saqlanadi: admin panel va sayt **bitta brauzerda** ochilganda
> to'liq ishlaydi. Boshqa qurilmalardagi mijozlar buyurtmalarini qabul qilish uchun backend (masalan, Firebase yoki
> Supabase) ulash kerak.

## 🌐 Sayt manzili

- Sayt: https://javohir877.github.io/OPUS-FOOD/
- Admin: https://javohir877.github.io/OPUS-FOOD/admin.html

**Yangilash** (fayllarni o'zgartirgandan keyin, faqat o'zgargan fayllar yuklanadi; Git kerak emas, GitHub CLI yetarli):

```
powershell -ExecutionPolicy Bypass -File publish-github.ps1 -Message "Nima o'zgardi"
```

## Tuzilma

```
index.html          — sahifa
admin.html          — shifrlangan boshqaruv paneli (lock-admin.ps1 yasaydi)
css/style.css       — sayt dizayni
js/data.js          — menyu, sozlamalar, kombo, promokodlar, to'lov usullari, Store (sayt va admin uchun umumiy)
js/app.js           — savat, checkout, to'lov, kuzatish, animatsiyalar
admin-src/          — panelning ochiq manbasi (faqat lokal, GitHub'ga yuklanmaydi)
lock-admin.ps1      — panelni parol bilan shifrlaydi
publish-github.ps1  — saytni GitHub'ga yuklaydi
assets/img/         — taom rasmlari
assets/pay/         — Click va Uzcard logotiplari (SVG)
```

## Eslatmalar

- To'lovlar **demo rejimida** — pul yechilmaydi. Haqiqiy Click/Payme/Uzum uchun merchant ID va backend kerak.
- Buyurtmalar brauzerning `localStorage`'ida (`opus_orders`) saqlanadi. Kuzatuvdagi holat demo uchun vaqt bilan
  o'zgaradi; admin panel `status` + `statusManual: true` orqali uni qo'lda boshqaradi.
- Barcha rasmlar loyiha ichida: taomlar `assets/img/` ([Unsplash](https://unsplash.com) suratlari), logotiplar `assets/pay/`
  (Payme, Uzum, Visa, Mastercard — Wikimedia Commons; Click, Uzcard, Humo — rasmiy saytlaridan). Logotiplar tegishli
  kompaniyalarning savdo belgilari. Mahalliy rasm topilmasa, sayt avtomatik Unsplash'dagi nusxasini yuklaydi.
- Shriftlar: Bricolage Grotesque (sarlavhalar), Bebas Neue (narxlar), Plus Jakarta Sans (matn).

## Keyingi qadamlar

- [x] Admin panel (mahsulotlar, buyurtmalar holati, statistika)
- [ ] GitHub Pages'ga joylash
- [ ] Backend (Firebase/Supabase) — buyurtmalarni barcha qurilmalardan qabul qilish
