/* =========================================================
   OPUS FOOD — menyu ma'lumotlari
   Admin panel keyinchalik shu ma'lumotlarni localStorage
   ("opus_products") orqali o'zgartiradi.
   ========================================================= */

// Rasmlar loyiha ichida (assets/img). Fayl topilmasa, app.js Unsplash'dagi asl nusxasini yuklaydi.
const img = (id) => `assets/img/${id}.jpg`;
const remoteImg = (src) => {
  const m = /assets\/img\/(.+)\.jpg$/.exec(src);
  return m ? `https://images.unsplash.com/photo-${m[1]}?auto=format&fit=crop&w=640&h=640&q=75` : null;
};

const CATEGORIES = [
  { id: "burger", name: "Burgerlar", icon: "🍔", img: img("1568901346375-23c9450c58cd") },
  { id: "pizza", name: "Pitsa", icon: "🍕", img: img("1628840042765-356cda07504e") },
  { id: "lavash", name: "Lavash", icon: "🌯", img: img("1626700051175-6818013e1d4f") },
  { id: "chicken", name: "Tovuq", icon: "🍗", img: img("1567620832903-9fc6debc209f") },
  { id: "hotdog", name: "Hot-dog", icon: "🌭", img: img("1541214113241-21578d2d9b62") },
  { id: "snack", name: "Sneklar", icon: "🍟", img: img("1573080496219-bb080dd4f877") },
  { id: "drink", name: "Ichimlik", icon: "🥤", img: img("1622483767028-3f66f32aef97") },
  { id: "dessert", name: "Desert", icon: "🍩", img: img("1551024601-bec78aea704b") },
];

// Kategoriya bo'yicha qo'shimcha tanlovlar (taom oynasida chiqadi)
const OPTIONS = {
  burger: {
    sizes: [{ id: "std", name: "Oddiy", add: 0 }, { id: "xl", name: "XL (+1 kotlet)", add: 14000 }],
    extras: [{ id: "cheese", name: "Qo'shimcha cheddar", add: 4000 }, { id: "jalapeno", name: "Jalapeño", add: 3000 }, { id: "bacon", name: "Mol bekoni", add: 7000 }, { id: "egg", name: "Tuxum", add: 3000 }],
  },
  pizza: {
    sizes: [{ id: "25", name: "25 sm", add: -12000 }, { id: "30", name: "30 sm", add: 0 }, { id: "35", name: "35 sm", add: 16000 }],
    extras: [{ id: "cheese", name: "Pishloqli bort", add: 9000 }, { id: "mush", name: "Qo'ziqorin", add: 5000 }, { id: "olive", name: "Zaytun", add: 4000 }],
  },
  lavash: {
    sizes: [{ id: "std", name: "Oddiy", add: 0 }, { id: "big", name: "Katta", add: 8000 }],
    extras: [{ id: "cheese", name: "Pishloq", add: 4000 }, { id: "spicy", name: "Achchiq sous", add: 0 }, { id: "fries", name: "Ichida fri", add: 3000 }],
  },
  chicken: { extras: [{ id: "garlic", name: "Sarimsoqli sous", add: 3000 }, { id: "bbq", name: "BBQ sous", add: 3000 }, { id: "cheese", name: "Pishloqli sous", add: 4000 }] },
  hotdog: { extras: [{ id: "cheese", name: "Pishloq", add: 3000 }, { id: "onion", name: "Qovurilgan piyoz", add: 2000 }] },
  snack: { sizes: [{ id: "m", name: "O'rta", add: 0 }, { id: "l", name: "Katta", add: 6000 }], extras: [{ id: "ketchup", name: "Ketchup", add: 2000 }, { id: "cheese", name: "Pishloqli sous", add: 4000 }] },
  drink: { sizes: [{ id: "s", name: "0.5 L", add: 0 }, { id: "l", name: "1 L", add: 6000 }], extras: [{ id: "ice", name: "Muz bilan", add: 0 }] },
  dessert: {},
};

// badge: "hit" | "new" | "hot"
const DEFAULT_PRODUCTS = [
  { id: "burger-classic", cat: "burger", name: "Classic Burger", desc: "Mol go'shti kotleti, cheddar, pomidor, salat bargi va OPUS sousi.", price: 32000, weight: "260 g", kcal: 610, rating: 4.8, badge: "hit", img: img("1568901346375-23c9450c58cd") },
  { id: "burger-double", cat: "burger", name: "Opus Double", desc: "Ikki qavat mol go'shti, ikki barobar cheddar, karamellangan piyoz.", price: 48000, weight: "380 g", kcal: 940, rating: 4.9, badge: "hit", img: img("1553979459-d2229ba7433b") },
  { id: "burger-bbq", cat: "burger", name: "BBQ Bacon Burger", desc: "Dudlangan mol bekoni, BBQ sousi, piyoz halqalari va cheddar.", price: 44000, weight: "320 g", kcal: 820, rating: 4.7, badge: "new", img: img("1550547660-d9450f859349") },
  { id: "burger-chicken", cat: "burger", name: "Crispy Chicken", desc: "Qarsildoq tovuq filesi, kole-slou va sarimsoqli mayonez.", price: 36000, weight: "280 g", kcal: 640, rating: 4.6, img: img("1606755962773-d324e0a13086") },
  { id: "burger-fire", cat: "burger", name: "Fire Burger", desc: "Jalapeño, chili sousi va pepper jack pishlog'i. Faqat jasurlar uchun!", price: 42000, weight: "300 g", kcal: 720, rating: 4.8, badge: "hot", img: img("1571091718767-18b5b1457add") },

  { id: "pizza-pepperoni", cat: "pizza", name: "Pepperoni", desc: "Mol pepperonisi, mozzarella va firma pomidor sousi.", price: 69000, weight: "30 sm", kcal: 1680, rating: 4.9, badge: "hit", img: img("1628840042765-356cda07504e") },
  { id: "pizza-margarita", cat: "pizza", name: "Margarita", desc: "Mozzarella, pomidor va yangi rayhon. Klassika.", price: 55000, weight: "30 sm", kcal: 1420, rating: 4.7, img: img("1574071318508-1cdbab80d002") },
  { id: "pizza-4cheese", cat: "pizza", name: "4 Pishloq", desc: "Mozzarella, cheddar, parmezan va dor blyu.", price: 74000, weight: "30 sm", kcal: 1760, rating: 4.8, badge: "new", img: img("1513104890138-7c749659a591") },

  { id: "lavash-classic", cat: "lavash", name: "Lavash Classic", desc: "Mol go'shti, pomidor, bodring, chips va maxfiy sous.", price: 34000, weight: "350 g", kcal: 690, rating: 4.8, badge: "hit", img: img("1626700051175-6818013e1d4f") },
  { id: "lavash-cheese", cat: "lavash", name: "Pishloqli Lavash", desc: "Tovuq go'shti, ikki xil pishloq va sarimsoqli sous.", price: 37000, weight: "370 g", kcal: 740, rating: 4.7, img: img("1529006557810-274b9b2fc783") },
  { id: "shaurma", cat: "lavash", name: "Shaurma Opus", desc: "Grilda pishgan tovuq, tandir noni, qizil karam va sous.", price: 30000, weight: "320 g", kcal: 580, rating: 4.6, img: img("1561651823-34feb02250e4") },

  { id: "wings-hot", cat: "chicken", name: "Achchiq Qanotchalar", desc: "8 dona buffalo qanotchalar, sarimsoqli sous bilan.", price: 45000, weight: "8 dona", kcal: 760, rating: 4.8, badge: "hot", img: img("1567620832903-9fc6debc209f") },
  { id: "strips", cat: "chicken", name: "Tovuq Strips", desc: "6 dona qarsildoq tovuq bo'lakchalari va BBQ sousi.", price: 38000, weight: "6 dona", kcal: 540, rating: 4.7, img: img("1562967914-608f82629710") },
  { id: "bucket", cat: "chicken", name: "Opus Bucket", desc: "12 bo'lak qovurilgan tovuq — butun oila uchun.", price: 115000, weight: "12 dona", kcal: 2400, rating: 4.9, badge: "new", img: img("1626082927389-6cd097cdc6ec") },

  { id: "hotdog-classic", cat: "hotdog", name: "Classic Hot-dog", desc: "Mol sosiskasi, xantal, ketchup va qovurilgan piyoz.", price: 22000, weight: "200 g", kcal: 420, rating: 4.5, img: img("1541214113241-21578d2d9b62") },
  { id: "hotdog-cheese", cat: "hotdog", name: "Cheese Dog", desc: "Mol sosiskasi, eritilgan cheddar va jalapeño.", price: 26000, weight: "230 g", kcal: 510, rating: 4.6, badge: "new", img: img("1619740455993-9e612b1af08a") },

  { id: "fries", cat: "snack", name: "Kartoshka Fri", desc: "Oltin rangli, qarsildoq, dengiz tuzi bilan.", price: 16000, weight: "180 g", kcal: 380, rating: 4.8, badge: "hit", img: img("1573080496219-bb080dd4f877") },
  { id: "nuggets", cat: "snack", name: "Naggets", desc: "9 dona tovuq naggetsi, ikki xil sous bilan.", price: 24000, weight: "9 dona", kcal: 450, rating: 4.6, img: img("1562967916-eb82221dfb92") },
  { id: "onion-rings", cat: "snack", name: "Piyoz Halqalari", desc: "Xamirda qovurilgan qarsildoq piyoz halqalari.", price: 18000, weight: "150 g", kcal: 360, rating: 4.5, img: img("1639024471283-03518883512d") },

  { id: "cola", cat: "drink", name: "Coca-Cola", desc: "Muzdek salqin klassika.", price: 9000, weight: "0.5 L", kcal: 210, rating: 4.9, img: img("1622483767028-3f66f32aef97") },
  { id: "lemonade", cat: "drink", name: "Uy Limonadi", desc: "Limon, yalpiz va zanjabil. Tabiiy, shakarsiz.", price: 15000, weight: "0.4 L", kcal: 60, rating: 4.7, badge: "new", img: img("1621263764928-df1444c5e859") },
  { id: "milkshake", cat: "drink", name: "Milksheyk", desc: "Vanil, shokolad yoki qulupnay — tanlov sizda.", price: 22000, weight: "0.4 L", kcal: 480, rating: 4.8, img: img("1572490122747-3968b75cc699") },

  { id: "donut", cat: "dessert", name: "Donat", desc: "Shokolad glazuri va rang-barang sepma bilan.", price: 12000, weight: "1 dona", kcal: 300, rating: 4.6, img: img("1551024601-bec78aea704b") },
  { id: "cheesecake", cat: "dessert", name: "Cheesecake", desc: "Nyu-York uslubidagi cheesecake, rezavor sousi bilan.", price: 25000, weight: "150 g", kcal: 420, rating: 4.8, img: img("1533134242443-d4fd215305ad") },
];

// Kombo yig'uvchi: har guruhdan bittadan tanlanadi, jami narxdan chegirma
const COMBO = {
  discount: 15,
  groups: [
    { id: "main", name: "Asosiy", items: ["burger-classic", "burger-double", "burger-fire", "lavash-classic", "hotdog-cheese"] },
    { id: "side", name: "Gazak", items: ["fries", "nuggets", "onion-rings"] },
    { id: "drink", name: "Ichimlik", items: ["cola", "lemonade", "milkshake"] },
  ],
};

const PROMO_CODES = {
  OPUS10: { type: "percent", value: 10, label: "−10%" },
  FIRE20: { type: "percent", value: 20, label: "−20%", min: 200000 },
  BEPUL: { type: "delivery", label: "Bepul yetkazish" },
};

const DELIVERY = { fee: 12000, freeFrom: 150000, minOrder: 30000 };

// Yangi buyurtmalar shu Telegram chatga xabar bo'lib keladi.
// token — @BotFather bergan bot kaliti, chatId — xabar boradigan chat (bo'sh bo'lsa, yuborilmaydi).
// Diqqat: bu qiymatlar sayt kodida hammaga ko'rinadi; kalit oshkor bo'lsa, @BotFather'da /revoke qiling.
const TELEGRAM = { token: "8906044907:AAFOLF-r-gv3TmeI6j5ACjUa5KuONW3NKno", chatId: "5402486152" };

// Opus Bonus: har buyurtmadan keshbek; bonus bilan buyurtmaning ko'pi bilan maxShare foizini to'lash mumkin
const BONUS = { rate: 5, maxShare: 50 };

// Omad g'ildiragi — kuniga bir marta. weight: tushish ehtimoli (kattasi — tez-tez tushadi)
const WHEEL_PRIZES = [
  { label: "−5%", type: "promo", code: "OMAD5", weight: 22 },
  { label: "+3 000", sub: "bonus", type: "bonus", value: 3000, weight: 20 },
  { label: "Bepul", sub: "yetkazish", type: "promo", code: "OMADYOL", weight: 14 },
  { label: "−10%", type: "promo", code: "OMAD10", weight: 12 },
  { label: "+5 000", sub: "bonus", type: "bonus", value: 5000, weight: 14 },
  { label: "−15%", type: "promo", code: "OMAD15", weight: 5 },
  { label: "+10 000", sub: "bonus", type: "bonus", value: 10000, weight: 5 },
  { label: "−7%", type: "promo", code: "OMAD7", weight: 8 },
];
// G'ildirak kodlari admin promokodlaridan alohida — admin ro'yxatini o'zgartirsa ham ishlayveradi
const WHEEL_PROMOS = {
  OMAD5: { type: "percent", value: 5, label: "−5% (omad)" },
  OMAD7: { type: "percent", value: 7, label: "−7% (omad)" },
  OMAD10: { type: "percent", value: 10, label: "−10% (omad)" },
  OMAD15: { type: "percent", value: 15, label: "−15% (omad)" },
  OMADYOL: { type: "delivery", label: "Bepul yetkazish (omad)" },
};

// open/close: "HH:MM"; yopilish vaqti ochilishdan kichik bo'lsa — yarim tundan keyin yopiladi
const BRANCHES = [
  { id: "markaz", name: "OPUS Markaz", area: "Yunusobod / Markaz", address: "Amir Temur ko'chasi, 1", phone: "+998 90 123 45 67", open: "10:00", close: "03:00", img: img("1561758033-d89a9ad46330"), perks: ["Ochiq oshxona", "Drive-thru", "Wi-Fi"] },
  { id: "chilonzor", name: "OPUS Chilonzor", area: "Chilonzor", address: "Bunyodkor shoh ko'chasi, 42", phone: "+998 90 123 45 68", open: "09:00", close: "02:00", img: img("1513104890138-7c749659a591"), perks: ["Bolalar burchagi", "Avtoturargoh"] },
  { id: "yunusobod", name: "OPUS Sergeli", area: "Sergeli", address: "Yangi Sergeli ko'chasi, 7", phone: "+998 90 123 45 69", open: "10:00", close: "00:00", img: img("1567620832903-9fc6debc209f"), perks: ["Yozgi terassa", "Karaoke juma kuni"] },
];

const REVIEWS = [
  { name: "Aziz R.", area: "Chilonzor", stars: 5, dish: "burger-double", text: "Toshkentdagi eng shirali burger! Opus Double'ni bir marta yeb ko'rgandan keyin boshqasiga qaramayman." },
  { name: "Madina K.", area: "Yunusobod", stars: 5, dish: "pizza-pepperoni", text: "25 daqiqada yetib keldi, pitsa hali issiq edi. Payme orqali to'lash juda qulay." },
  { name: "Jasur T.", area: "Mirzo Ulug'bek", stars: 5, dish: "wings-hot", text: "Achchiq qanotchalar — ofisdagi hamma uchun har juma kuni buyurtma qilamiz. Sous zo'r!" },
  { name: "Dilnoza A.", area: "Sergeli", stars: 4, dish: "lavash-cheese", text: "Pishloqli lavash juda to'yimli. Faqat ba'zan kuryer biroz kechikadi, lekin taom baribir issiq." },
  { name: "Sardor M.", area: "Yakkasaroy", stars: 5, dish: "bucket", text: "Oilaviy kechaga Opus Bucket oldik — bolalar xursand. Kombo yig'ish funksiyasi juda qulay ekan." },
  { name: "Kamola U.", area: "Shayxontohur", stars: 5, dish: "milkshake", text: "Milksheyk qalin va mazali, desertlar ham yaxshi. Omad g'ildiragidan −10% yutdim 😄" },
  { name: "Otabek N.", area: "Olmazor", stars: 5, dish: "burger-fire", text: "Fire Burger haqiqatan ham olovdek! Achchiqni yaxshi ko'radiganlarga tavsiya qilaman." },
  { name: "Nilufar S.", area: "Mirobod", stars: 4, dish: "fries", text: "Fri har doim qarsildoq. Bonus tizimi yoqdi — har buyurtmadan keshbek tushib turadi." },
];
const RATING = { avg: 4.9, count: 2340, dist: [86, 9, 3, 1, 1] }; // 5★ dan 1★ gacha, foizda

const PAY_LOGOS = {
  click: "assets/pay/click.svg",
  payme: "assets/pay/payme.png",
  uzum: "assets/pay/uzum.png",
  uzcard: "assets/pay/uzcard.svg",
  humo: "assets/pay/humo.png",
  visa: "assets/pay/visa.png",
  mastercard: "assets/pay/mastercard.png",
};

const PAY_METHODS = [
  { id: "click", name: "Click", note: "Click ilovasi orqali", logos: ["click"] },
  { id: "payme", name: "Payme", note: "Payme ilovasi orqali", logos: ["payme"] },
  { id: "uzum", name: "Uzum Bank", note: "Uzum ilovasi orqali", logos: ["uzum"] },
  { id: "card", name: "Bank karta", note: "Uzcard · Humo · Visa · Mastercard", logos: ["uzcard", "humo", "visa", "mastercard"] },
  { id: "cash", name: "Naqd pul", note: "Kuryerga to'lash", logos: [] },
];

/* ---------- Kichik "do'kon" qatlami (admin panel uchun tayyor) ---------- */
const Store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage bloklangan */ }
  },
  products() { return this.get("opus_products", DEFAULT_PRODUCTS); },
  orders() { return this.get("opus_orders", []); },
  saveOrder(order) { this.set("opus_orders", [order, ...this.orders()]); },
  updateOrder(id, patch) { this.set("opus_orders", this.orders().map((o) => (o.id === id ? { ...o, ...patch } : o))); },

  // Buyurtma holati. "Demo rejim"da admin qo'lda o'zgartirmaguncha holat vaqt bilan o'zi siljiydi.
  statusOf(o) {
    if (o.status === "cancelled") return "cancelled";
    if (o.statusManual || !SETTINGS.autoStatus) return o.status;
    const sec = (Date.now() - new Date(o.createdAt)) / 1000;
    return ORDER_FLOW[sec < 12 ? 0 : sec < 35 ? 1 : sec < 65 ? 2 : 3];
  },
};

const ORDER_FLOW = ["new", "cooking", "delivering", "done"];
const SETTINGS = { autoStatus: true, phone: "+998 90 123 45 67" };

/* ---------- Admin paneldagi o'zgarishlarni qo'llash ---------- */
(() => {
  const s = Store.get("opus_settings", null);
  if (s) {
    ["fee", "freeFrom", "minOrder"].forEach((k) => { if (s[k] != null) DELIVERY[k] = +s[k]; });
    if (s.comboDiscount != null) COMBO.discount = +s.comboDiscount;
    if (s.autoStatus != null) SETTINGS.autoStatus = !!s.autoStatus;
  }
  const promos = Store.get("opus_promos", null);
  if (promos) {
    Object.keys(PROMO_CODES).forEach((k) => delete PROMO_CODES[k]);
    Object.assign(PROMO_CODES, promos);
  }
})();
