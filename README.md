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

Manzil: `sayt-manzili/admin.html` (saytda havola yo'q, qidiruv tizimlaridan yashirilgan).
**Standart parol: `opus2026`** — birinchi kirishdan keyin *Sozlamalar → Parolni almashtirish* orqali o'zgartiring.

| Bo'lim | Imkoniyatlar |
|---|---|
| 📊 Dashboard | Tushum, buyurtmalar soni, o'rtacha chek, bekor qilinganlar; kunlik tushum grafigi (jadval ko'rinishi ham bor); eng ko'p sotilgan taomlar; holatlar; to'lov usullari |
| 🧾 Buyurtmalar | Holat bo'yicha filtr, qidiruv; holatni o'zgartirish (mijoz saytda jonli ko'radi); tafsilot paneli; bekor qilish; yangi buyurtmada 🔔 ovoz va bildirishnoma |
| 🍔 Menyu | Taom qo'shish/tahrirlash/o'chirish, narx, rasm (galereyadan, yuklash yoki havola), belgi (Hit/Yangi/Achchiq), stop-list |
| 🎟 Promokodlar | Foizli yoki bepul yetkazish kodlari, minimal summa, necha marta ishlatilgani |
| ⚙️ Sozlamalar | Yetkazish narxi, bepul yetkazish chegarasi, minimal buyurtma, kombo chegirmasi, demo rejim, parol, zaxira (JSON eksport/import), demo buyurtmalar |

> ⚠️ Hozircha ma'lumotlar **brauzer xotirasida** (localStorage) saqlanadi: admin panel va sayt **bitta brauzerda** ochilganda
> to'liq ishlaydi. Boshqa qurilmalardagi mijozlar buyurtmalarini qabul qilish va parolni haqiqiy himoyalash uchun
> backend (masalan, Firebase yoki Supabase) ulash kerak.

## Tuzilma

```
index.html          — sahifa
admin.html          — boshqaruv paneli
css/style.css       — sayt dizayni
css/admin.css       — admin panel dizayni
js/data.js          — menyu, sozlamalar, kombo, promokodlar, to'lov usullari, Store (sayt va admin uchun umumiy)
js/app.js           — savat, checkout, to'lov, kuzatish, animatsiyalar
js/admin.js         — admin panel logikasi
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
