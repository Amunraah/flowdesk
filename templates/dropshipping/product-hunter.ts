/**
 * Product Hunter Agent — Dropshipping template
 * Steg 1: mock-data. Byt ut searchProducts() mot riktig API senare.
 */

export interface Product {
  name:             string;   // produktnamn
  trendScore:       number;   // 0–100, hur het produkten är just nu
  category:         string;   // t.ex. "Kök & Hem"
  estimatedMargin:  string;   // t.ex. "55–70 %"
  competitionLevel: "Låg" | "Medel" | "Hög";
  monthlySearches:  string;   // ungefärliga sökningar/mån
  suggestedPrice:   string;   // rekommenderat försäljningspris (SEK)
}

// ── Mock-databas ───────────────────────────────────────────────────────────────
const ALL_PRODUCTS: Product[] = [
  // Kök & Hem
  { name: "Bambu Köksredskaps-set (6 delar)",   trendScore: 91, category: "Kök & Hem",  estimatedMargin: "55–70 %", competitionLevel: "Låg",   monthlySearches: "12 000", suggestedPrice: "249 kr" },
  { name: "Bambu Skärbräda med Juice-ränna",    trendScore: 84, category: "Kök & Hem",  estimatedMargin: "60–75 %", competitionLevel: "Låg",   monthlySearches: "8 500",  suggestedPrice: "179 kr" },
  { name: "Magnetisk Kryddställ (12 burkar)",   trendScore: 76, category: "Kök & Hem",  estimatedMargin: "65–80 %", competitionLevel: "Medel", monthlySearches: "6 200",  suggestedPrice: "299 kr" },

  // Gadgets & Tech
  { name: "LED RGB Strip 5 m — spelrum",        trendScore: 88, category: "Gadgets",    estimatedMargin: "65–80 %", competitionLevel: "Medel", monthlySearches: "35 000", suggestedPrice: "149 kr" },
  { name: "Magnetisk Trådlös Laddare 3-i-1",   trendScore: 85, category: "Gadgets",    estimatedMargin: "60–75 %", competitionLevel: "Hög",   monthlySearches: "28 000", suggestedPrice: "399 kr" },
  { name: "Bärbar Mini-projektor 1080p",        trendScore: 80, category: "Gadgets",    estimatedMargin: "50–65 %", competitionLevel: "Medel", monthlySearches: "14 000", suggestedPrice: "899 kr" },

  // Fitness & Hälsa
  { name: "Motståndsband Set (5-pack)",         trendScore: 79, category: "Fitness",    estimatedMargin: "70–85 %", competitionLevel: "Hög",   monthlySearches: "22 000", suggestedPrice: "199 kr" },
  { name: "Massage-pistol Pro — tyst motor",    trendScore: 87, category: "Fitness",    estimatedMargin: "55–70 %", competitionLevel: "Medel", monthlySearches: "18 000", suggestedPrice: "699 kr" },
  { name: "Hopfällbar Yogamatta med Väska",     trendScore: 73, category: "Fitness",    estimatedMargin: "60–75 %", competitionLevel: "Medel", monthlySearches: "9 000",  suggestedPrice: "249 kr" },

  // Husdjur
  { name: "Automatisk Katt-vattenfontän",       trendScore: 92, category: "Husdjur",    estimatedMargin: "50–65 %", competitionLevel: "Låg",   monthlySearches: "9 000",  suggestedPrice: "329 kr" },
  { name: "Interaktiv Laser-leksak för Katter", trendScore: 83, category: "Husdjur",    estimatedMargin: "70–85 %", competitionLevel: "Låg",   monthlySearches: "7 500",  suggestedPrice: "149 kr" },
  { name: "Självuppvärmd Hundbädd L",           trendScore: 77, category: "Husdjur",    estimatedMargin: "55–70 %", competitionLevel: "Medel", monthlySearches: "5 800",  suggestedPrice: "499 kr" },

  // Hem & Organisation
  { name: "Under-säng Förvaringslåda (4-pack)", trendScore: 71, category: "Organisation", estimatedMargin: "65–80 %", competitionLevel: "Låg", monthlySearches: "11 000", suggestedPrice: "249 kr" },
  { name: "Minimalistisk Skrivbordsorganizer",   trendScore: 68, category: "Organisation", estimatedMargin: "70–85 %", competitionLevel: "Låg", monthlySearches: "7 200",  suggestedPrice: "179 kr" },
];

// ── Nyckelord → kategori-mapping ───────────────────────────────────────────────
const KEYWORD_MAP: Record<string, string> = {
  bambu:       "Kök & Hem",
  kök:         "Kök & Hem",
  hem:         "Kök & Hem",
  köksredskap: "Kök & Hem",
  skärbräda:   "Kök & Hem",
  led:         "Gadgets",
  gadget:      "Gadgets",
  laddare:     "Gadgets",
  projektor:   "Gadgets",
  tech:        "Gadgets",
  fitness:     "Fitness",
  träning:     "Fitness",
  yoga:        "Fitness",
  massage:     "Fitness",
  sport:       "Fitness",
  katt:        "Husdjur",
  hund:        "Husdjur",
  husdjur:     "Husdjur",
  djur:        "Husdjur",
  förvaring:   "Organisation",
  organisation:"Organisation",
  skrivbord:   "Organisation",
};

/**
 * Sök produkter baserat på fritext.
 * Returnerar max 4 träffar sorterade på trendScore (högst först).
 * Om ingen nyckelordsmatch hittas returneras de 4 hetaste produkterna.
 */
export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();

  // Hitta matchande kategorier från nyckelorden i frågan
  const matchedCategories = new Set(
    Object.entries(KEYWORD_MAP)
      .filter(([kw]) => q.includes(kw))
      .map(([, cat]) => cat)
  );

  const filtered =
    matchedCategories.size > 0
      ? ALL_PRODUCTS.filter((p) => matchedCategories.has(p.category))
      : ALL_PRODUCTS; // ingen match → visa allt

  // Sortera på trendScore, ta topp 4
  return [...filtered]
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, 4);
}

/** Returnerar alla tillgängliga mock-kategorier (för filter-UI). */
export function getCategories(): string[] {
  return [...new Set(ALL_PRODUCTS.map((p) => p.category))];
}
