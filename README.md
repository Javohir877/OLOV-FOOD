# 🍔 OLOV FOOD

"Issiq. Shirali. Tez." — fast food do'koni uchun veb-sayt va admin panel. **React 18 + Vite** da yozilgan.

- Sayt: https://javohir877.github.io/OPUS-FOOD/
- Admin: https://javohir877.github.io/OPUS-FOOD/admin.html (parol bilan shifrlangan)
- Manba kodi: shu repozitoriyning **`source`** tarmog'i (`main` tarmog'ida yig'ilgan tayyor sayt turadi)

## Imkoniyatlar

- 🍔 **Jonli burger** — qatlamlari "nafas oladi", ko'z qisadi, sichqonchaga ergashadi, bosilsa sakraydi
- 🧩 **Kombo yig'uvchi** — asosiy taom + gazak + ichimlik, chegirma avtomatik
- 📋 **Menyu** — kategoriyalar paneli, qidiruv, filtr (Hit / Yangi / Achchiq / 600 kkal gacha) va saralash
- ⚙️ **Taomni sozlash** — o'lcham va qo'shimchalar narxi bilan
- 🧾 **Savat** — kompyuterda o'ngda, telefonda pastdan chiqadi; "Bunga mos keladi" takliflari
- 🎟 **Promokodlar** — `OLOV10`, `FIRE20`, `BEPUL` (admin'da yangisini qo'shish mumkin)
- 💳 **To'lov** — Click, Payme, Uzum (QR oynasi), Uzcard/Humo/Visa/Mastercard (SMS kod), naqd — *namuna rejimida*
- 📍 **Jonli kuzatish** va 🔁 **qayta buyurtma**
- 🎡 **Omad g'ildiragi** va 💎 **Olov Bonus** (5% keshbek)
- ⭐ **Mijozlar fikri**, 🏪 **filiallar** (hozir ochiq/yopiq)
- 🔔 **Telegram** — har yangi buyurtma @opusfoodbot orqali egasiga xabar bo'lib keladi

## Ishga tushirish (dasturchi uchun)

```
npm install
npm run dev          # sayt: http://localhost:5173
npm run dev:admin    # admin panel: http://localhost:5174/admin.html
npm run build        # dist/ (sayt) va dist-admin/ (admin) yig'iladi
```

## Tuzilma

```
index.html              — saytning kirish nuqtasi
src/site/               — sayt: App, holat (shop.jsx) va komponentlar
src/shared/             — sayt va admin uchun umumiy: menyu ma'lumotlari, savat hisobi, Store, Telegram
src/styles/site.css     — sayt dizayni
public/assets/          — taom rasmlari, to'lov logotiplari, brend logotiplari
src/admin/, admin.html  — admin panel manbasi (faqat egasining kompyuterida, GitHub'ga yuklanmaydi)
lock-admin.ps1          — admin panelni yig'ib, parol bilan shifrlaydi (admin.locked.html)
publish-github.ps1      — saytni yig'ib main'ga, manba kodini source tarmog'iga yuklaydi
```

Menyu, narxlar, filiallar va fikrlar: `src/shared/data.js`.

## Yangilash

Saytni o'zgartirgandan keyin (loyiha papkasida):

```
powershell -ExecutionPolicy Bypass -File publish-github.ps1 -Message "Nima o'zgardi"
```

Admin panelni o'zgartirgandan keyin yoki parolni almashtirish uchun (parol so'raydi, shifrlaydi va saytni yuklaydi):

```
powershell -ExecutionPolicy Bypass -File lock-admin.ps1 -Publish
```

## 🔒 Admin panel himoyasi

Saytdagi `admin.html` ichida panelning o'zi emas, faqat parol oynasi va AES-256 bilan shifrlangan ma'lumot bor.
Parolsiz panelning na ko'rinishi, na kodi ochiladi; parol hech qayerda saqlanmaydi.

| Bo'lim | Imkoniyatlar |
|---|---|
| 📊 Dashboard | Tushum, buyurtmalar, o'rtacha chek; kunlik tushum grafigi; eng ko'p sotilganlar; holatlar; to'lov usullari |
| 🧾 Buyurtmalar | Filtr, qidiruv, holatni o'zgartirish, tafsilot paneli, yangi buyurtmada 🔔 ovoz |
| 🍔 Menyu | Taom qo'shish/tahrirlash/o'chirish, rasm yuklash, belgi, stop-list |
| 🎟 Promokodlar | Foizli yoki bepul yetkazish kodlari, minimal summa |
| ⚙️ Sozlamalar | Yetkazish narxlari, kombo chegirmasi, demo rejim, zaxira (JSON) |

> ⚠️ Ma'lumotlar **brauzer xotirasida** (localStorage) saqlanadi: admin panel faqat o'zi ochilgan brauzerdagi
> buyurtmalarni ko'radi. Barcha qurilmalardan kelgan buyurtmalar Telegram'ga keladi. Ularni admin panelda ham
> ko'rish uchun backend (Firebase yoki Supabase) kerak.

## Eslatmalar

- To'lovlar **namuna rejimida** — pul yechilmaydi. Haqiqiy Click/Payme/Uzum uchun merchant ID va backend kerak.
- Telegram bot kaliti sayt kodida ochiq turadi; suiiste'mol bo'lsa @BotFather'da `/revoke` qiling va `src/shared/data.js` dagi `TELEGRAM` ni yangilang.
- Taom rasmlari — [Unsplash](https://unsplash.com). Payme, Uzum, Visa, Mastercard logotiplari — Wikimedia Commons;
  Click, Uzcard, Humo — rasmiy saytlaridan. Logotiplar tegishli kompaniyalarning savdo belgilari.
- Shriftlar: Bricolage Grotesque (sarlavhalar), Bebas Neue (narxlar), Plus Jakarta Sans (matn).
