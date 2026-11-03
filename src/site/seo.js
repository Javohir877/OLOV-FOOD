/* Google uchun tuzilgan ma'lumot (schema.org JSON-LD): restoran, filiallar, ish vaqti va
   to'liq menyu narxlari bilan. Admin narxni o'zgartirsa — shu yerda ham avtomatik yangilanadi. */
import { BRANCHES, CATEGORIES, RATING, SETTINGS } from "../shared/data.js";
import { Store } from "../shared/store.js";

const SITE = "https://javohir877.github.io/OLOV-FOOD/";
const abs = (src) => (src && src.indexOf("assets/") === 0 ? SITE + src : undefined);

export function injectSeo() {
  try {
    const products = Store.products().filter((p) => !p.hidden);
    const data = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "@id": SITE + "#restaurant",
      name: "OLOV FOOD",
      url: SITE,
      image: SITE + "assets/brand/og.jpg",
      logo: SITE + "assets/brand/olov-food-512.png",
      slogan: "Issiq. Shirali. Tez.",
      servesCuisine: ["Fast food", "Burger", "Pitsa", "Lavash"],
      priceRange: "9 000 – 115 000 so'm",
      telephone: SETTINGS.phone,
      currenciesAccepted: "UZS",
      paymentAccepted: "Naqd, Click, Payme, Uzum Bank, Uzcard, Humo, Visa, Mastercard",
      address: { "@type": "PostalAddress", streetAddress: BRANCHES[0].address, addressLocality: "Toshkent", addressCountry: "UZ" },
      areaServed: { "@type": "City", name: "Toshkent" },
      openingHoursSpecification: [{
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: SETTINGS.open, closes: SETTINGS.close,
      }],
      aggregateRating: { "@type": "AggregateRating", ratingValue: RATING.avg, reviewCount: RATING.count, bestRating: 5 },
      department: BRANCHES.map((b) => ({
        "@type": "Restaurant", name: b.name, telephone: b.phone, image: abs(b.img),
        address: { "@type": "PostalAddress", streetAddress: b.address, addressLocality: "Toshkent", addressCountry: "UZ" },
        openingHours: `Mo-Su ${b.open}-${b.close}`,
      })),
      hasMenu: {
        "@type": "Menu",
        name: "OLOV FOOD menyusi",
        inLanguage: "uz",
        hasMenuSection: CATEGORIES.map((c) => ({
          "@type": "MenuSection",
          name: c.name,
          hasMenuItem: products.filter((p) => p.cat === c.id).map((p) => ({
            "@type": "MenuItem",
            name: p.name,
            description: p.desc,
            image: abs(p.img),
            nutrition: p.kcal ? { "@type": "NutritionInformation", calories: p.kcal + " kkal" } : undefined,
            offers: { "@type": "Offer", price: p.price, priceCurrency: "UZS", availability: "https://schema.org/InStock" },
          })),
        })).filter((s) => s.hasMenuItem.length),
      },
    };
    let el = document.getElementById("ld-restaurant");
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = "ld-restaurant";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  } catch (e) { /* SEO ixtiyoriy — xato saytni to'xtatmasin */ }
}
