import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../i18n.jsx';
import { X, ScanLine, CheckCircle2, AlertCircle, Wifi, Edit3 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

// ─── PLU Datenbank — Frische Produkte (Obst & Gemüse) ──────────────────────
const PLU_DB = {
  3011: { name: 'Banane', calories: 89, protein: 1.1, carbs: 23.0, fat: 0.3, serving: '100g' },
  4011: { name: 'Banane', calories: 89, protein: 1.1, carbs: 23.0, fat: 0.3, serving: '100g' },
  3107: { name: 'Apfel', calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, serving: '100g' },
  4129: { name: 'Apfel', calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, serving: '100g' },
  3283: { name: 'Birne', calories: 57, protein: 0.4, carbs: 15.2, fat: 0.1, serving: '100g' },
  4409: { name: 'Birne', calories: 57, protein: 0.4, carbs: 15.2, fat: 0.1, serving: '100g' },
  3030: { name: 'Orange', calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1, serving: '100g' },
  4051: { name: 'Orange', calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1, serving: '100g' },
  3337: { name: 'Zitrone', calories: 29, protein: 1.1, carbs: 9.3, fat: 0.3, serving: '100g' },
  4053: { name: 'Zitrone', calories: 29, protein: 1.1, carbs: 9.3, fat: 0.3, serving: '100g' },
  4290: { name: 'Erdbeeren', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, serving: '100g' },
  3222: { name: 'Erdbeeren', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, serving: '100g' },
  4432: { name: 'Trauben', calories: 69, protein: 0.7, carbs: 18.1, fat: 0.2, serving: '100g' },
  3428: { name: 'Trauben', calories: 69, protein: 0.7, carbs: 18.1, fat: 0.2, serving: '100g' },
  4196: { name: 'Karotten', calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, serving: '100g' },
  3030: { name: 'Zwiebel', calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, serving: '100g' },
  4082: { name: 'Kartoffeln', calories: 77, protein: 2.0, carbs: 17.5, fat: 0.1, serving: '100g' },
  4072: { name: 'Kartoffeln', calories: 77, protein: 2.0, carbs: 17.5, fat: 0.1, serving: '100g' },
  4664: { name: 'Tomate', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, serving: '100g' },
  3421: { name: 'Cherrytomaten', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, serving: '100g' },
  4067: { name: 'Gurke', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, serving: '100g' },
  4225: { name: 'Zucchini', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, serving: '100g' },
  4688: { name: 'Aubergine', calories: 25, protein: 1.0, carbs: 5.7, fat: 0.2, serving: '100g' },
  3123: { name: 'Peperoni (Rot)', calories: 31, protein: 1.0, carbs: 6.0, fat: 0.3, serving: '100g' },
  3122: { name: 'Peperoni (Grün)', calories: 20, protein: 0.9, carbs: 4.6, fat: 0.2, serving: '100g' },
  4080: { name: 'Champignons', calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, serving: '100g' },
  3104: { name: 'Spargel', calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1, serving: '100g' },
  4081: { name: 'Mais', calories: 86, protein: 3.3, carbs: 19.0, fat: 1.4, serving: '100g' },
  4601: { name: 'Lauch', calories: 61, protein: 1.5, carbs: 14.1, fat: 0.3, serving: '100g' },
  4677: { name: 'Kürbis', calories: 26, protein: 1.0, carbs: 6.5, fat: 0.1, serving: '100g' },
};

function lookupPLU(code) {
  const s = code.toString().trim();
  // Bio-PLU: 5-stellig, startet mit 9
  const key = s.startsWith('9') && s.length === 5 ? s.slice(1) : s;
  const product = PLU_DB[key] || PLU_DB[s];
  if (!product) return null;
  return { ...product, category: 'Obst & Gemüse', isBio: s.startsWith('9') && s.length === 5, source: 'PLU' };
}

// ─── CH-Basics Datenbank — Häufigste Schweizer Produkte ────────────────────
// Abgedeckt: Migros, Coop, Rivella, Ovomaltine, Zweifel, Emmi, Appenzeller, Kambly
const CH_DB = {
  // Rivella
  '7616600010003': { name: 'Rivella Rot', brand: 'Rivella', calories: 37, protein: 0.1, carbs: 8.9, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '7616600010034': { name: 'Rivella Blau', brand: 'Rivella', calories: 37, protein: 0.1, carbs: 8.9, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '7616600010010': { name: 'Rivella Grün', brand: 'Rivella', calories: 23, protein: 0.1, carbs: 5.3, fat: 0.0, serving: '100ml', category: 'Getränk' },
  // Ovomaltine
  '7617100004152': { name: 'Ovomaltine Pulver', brand: 'Wander', calories: 382, protein: 14.4, carbs: 64.2, fat: 7.7, serving: '100g', category: 'Fitness & Protein' },
  '7617100036048': { name: 'Ovomaltine Crunchy Cream', brand: 'Wander', calories: 508, protein: 6.7, carbs: 56.2, fat: 28.1, serving: '100g', category: 'Aufstrich' },
  '7617100055544': { name: 'Ovomaltine Riegel', brand: 'Wander', calories: 423, protein: 6.7, carbs: 63.4, fat: 15.4, serving: '100g', category: 'Snack' },
  // Zweifel
  '7610848040079': { name: 'Zweifel Original Chips', brand: 'Zweifel', calories: 519, protein: 6.5, carbs: 51.3, fat: 31.3, serving: '100g', category: 'Snack' },
  '7610848022105': { name: 'Zweifel Paprika Chips', brand: 'Zweifel', calories: 519, protein: 5.9, carbs: 52.1, fat: 31.5, serving: '100g', category: 'Snack' },
  '7610848061050': { name: 'Zweifel Popcorn', brand: 'Zweifel', calories: 478, protein: 8.3, carbs: 62.4, fat: 20.1, serving: '100g', category: 'Snack' },
  // Migros Eigenmarken
  '7610807000015': { name: 'M-Classic Vollmilch', brand: 'Migros', calories: 61, protein: 3.3, carbs: 4.7, fat: 3.5, serving: '100ml', category: 'Milch & Milchprodukte' },
  '7610807002934': { name: 'M-Classic Halbrahm', brand: 'Migros', calories: 136, protein: 2.9, carbs: 3.7, fat: 12.5, serving: '100ml', category: 'Milch & Milchprodukte' },
  '7613034626608': { name: 'Farmer Müesli Klassik', brand: 'Migros', calories: 369, protein: 9.1, carbs: 64.8, fat: 7.2, serving: '100g', category: 'Frühstück' },
  '7613034369499': { name: 'Farmer Nuss Mix Müesli', brand: 'Migros', calories: 406, protein: 9.8, carbs: 54.3, fat: 15.8, serving: '100g', category: 'Frühstück' },
  '7610807004006': { name: 'M-Classic Haferflocken', brand: 'Migros', calories: 370, protein: 12.5, carbs: 60.2, fat: 6.9, serving: '100g', category: 'Frühstück' },
  '7613034843173': { name: 'Migros Protein Joghurt', brand: 'Migros', calories: 85, protein: 10.2, carbs: 5.6, fat: 2.4, serving: '100g', category: 'Fitness & Protein' },
  // Emmi
  '7610399001099': { name: 'Emmi Caffè Latte Macchiato', brand: 'Emmi', calories: 72, protein: 2.5, carbs: 11.4, fat: 1.8, serving: '100ml', category: 'Milch & Milchprodukte' },
  '7610399001075': { name: 'Emmi Caffè Latte Cappuccino', brand: 'Emmi', calories: 72, protein: 2.5, carbs: 11.2, fat: 1.9, serving: '100ml', category: 'Milch & Milchprodukte' },
  '7610399004144': { name: 'Emmi Protein Shake Schokolade', brand: 'Emmi', calories: 62, protein: 7.0, carbs: 5.0, fat: 1.4, serving: '100ml', category: 'Fitness & Protein' },
  // Käse CH
  '7610836000011': { name: 'Appenzeller Käse', brand: 'Appenzeller', calories: 399, protein: 25.9, carbs: 0.0, fat: 32.0, serving: '100g', category: 'Milch & Milchprodukte' },
  '7616600041007': { name: 'Gruyère AOP', brand: 'Le Gruyère', calories: 413, protein: 29.8, carbs: 0.0, fat: 32.5, serving: '100g', category: 'Milch & Milchprodukte' },
  // Coop Eigenmarken
  '7613269061847': { name: 'Naturaplan Bio Vollmilch', brand: 'Coop', calories: 61, protein: 3.3, carbs: 4.7, fat: 3.5, serving: '100ml', category: 'Milch & Milchprodukte' },
  '7613269070009': { name: 'Prix Garantie Joghurt Natur', brand: 'Coop', calories: 60, protein: 4.0, carbs: 4.7, fat: 2.8, serving: '100g', category: 'Milch & Milchprodukte' },
  // Schokolade CH
  '7610815011232': { name: 'Frey Milchschokolade', brand: 'Frey', calories: 537, protein: 7.2, carbs: 57.3, fat: 30.9, serving: '100g', category: 'Snack' },
  '7610839985030': { name: 'Lindt Milchschokolade', brand: 'Lindt', calories: 535, protein: 7.5, carbs: 56.7, fat: 30.5, serving: '100g', category: 'Snack' },
  // Kambly / Ricola
  '7614400023510': { name: 'Kambly Bretzeli', brand: 'Kambly', calories: 459, protein: 9.4, carbs: 66.3, fat: 16.6, serving: '100g', category: 'Snack' },
  '7612100055006': { name: 'Ricola Kräuterzucker', brand: 'Ricola', calories: 376, protein: 0.0, carbs: 93.8, fat: 0.0, serving: '100g', category: 'Snack' },
};

// ─── EU-Datenbank — Erweiterte Europäische Produktdatenbank ─────────────────
// DE/CH/AT/FR/IT/ES + Fitness-Brands — 278+ Topseller
const EU_DB = {

  // ═══════════════════════════════════════════════════════════════
  // GETRÄNKE
  // ═══════════════════════════════════════════════════════════════

  // Coca-Cola
  '5449000000996': { name: 'Coca-Cola Classic',         brand: 'Coca-Cola', calories: 42,  protein: 0.0, carbs: 10.6, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '5449000054227': { name: 'Coca-Cola Zero Sugar',      brand: 'Coca-Cola', calories: 0,   protein: 0.0, carbs: 0.0,  fat: 0.0, serving: '100ml', category: 'Getränk' },
  '5449000054234': { name: 'Coca-Cola Light',           brand: 'Coca-Cola', calories: 0,   protein: 0.0, carbs: 0.0,  fat: 0.0, serving: '100ml', category: 'Getränk' },
  '5449000131805': { name: 'Fanta Orange',              brand: 'Fanta',     calories: 42,  protein: 0.0, carbs: 10.4, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '5449000133328': { name: 'Sprite',                    brand: 'Sprite',    calories: 29,  protein: 0.0, carbs: 7.0,  fat: 0.0, serving: '100ml', category: 'Getränk' },
  '4003865000108': { name: 'Fanta Lemon',               brand: 'Fanta',     calories: 30,  protein: 0.0, carbs: 7.3,  fat: 0.0, serving: '100ml', category: 'Getränk' },
  '4056489000006': { name: 'Coca-Cola 330ml Dose',      brand: 'Coca-Cola', calories: 42,  protein: 0.0, carbs: 10.6, fat: 0.0, serving: '100ml', category: 'Getränk' },

  // Pepsi
  '4056489001003': { name: 'Pepsi Cola',                brand: 'Pepsi',     calories: 41,  protein: 0.0, carbs: 10.6, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '4056489002000': { name: 'Pepsi Max',                 brand: 'Pepsi',     calories: 1,   protein: 0.0, carbs: 0.0,  fat: 0.0, serving: '100ml', category: 'Getränk' },
  '4056489003007': { name: 'Pepsi Twist Lemon',         brand: 'Pepsi',     calories: 41,  protein: 0.0, carbs: 10.6, fat: 0.0, serving: '100ml', category: 'Getränk' },

  // Red Bull (erweitert)
  '9002490100070': { name: 'Red Bull Energy Drink 250ml', brand: 'Red Bull', calories: 45, protein: 0.0, carbs: 11.3, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '9002490200077': { name: 'Red Bull Sugarfree',          brand: 'Red Bull', calories: 5,  protein: 0.7, carbs: 0.5,  fat: 0.0, serving: '100ml', category: 'Getränk' },
  '9002490300074': { name: 'Red Bull White Edition',      brand: 'Red Bull', calories: 46, protein: 0.0, carbs: 11.5, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '9002490400071': { name: 'Red Bull Red Edition',        brand: 'Red Bull', calories: 47, protein: 0.0, carbs: 11.6, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '9002490500078': { name: 'Red Bull Blue Edition',       brand: 'Red Bull', calories: 46, protein: 0.0, carbs: 11.4, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '9002490100186': { name: 'Red Bull 473ml Dose',         brand: 'Red Bull', calories: 45, protein: 0.0, carbs: 11.3, fat: 0.0, serving: '100ml', category: 'Getränk' },

  // Monster (erweitert)
  '5060517882498': { name: 'Monster Energy Original',   brand: 'Monster', calories: 46,  protein: 0.0, carbs: 11.0, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '5060517882504': { name: 'Monster Energy Zero',       brand: 'Monster', calories: 5,   protein: 0.5, carbs: 0.4,  fat: 0.0, serving: '100ml', category: 'Getränk' },
  '5060517882511': { name: 'Monster Ultra White',       brand: 'Monster', calories: 5,   protein: 0.5, carbs: 0.4,  fat: 0.0, serving: '100ml', category: 'Getränk' },
  '5060517882528': { name: 'Monster Mango Loco',        brand: 'Monster', calories: 52,  protein: 0.0, carbs: 13.0, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '5060517882535': { name: 'Monster Pipeline Punch',    brand: 'Monster', calories: 52,  protein: 0.0, carbs: 13.0, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '5060517882542': { name: 'Monster Watermelon',        brand: 'Monster', calories: 52,  protein: 0.0, carbs: 13.0, fat: 0.0, serving: '100ml', category: 'Getränk' },

  // Rivella (CH)
  '7616600010003': { name: 'Rivella Rot',               brand: 'Rivella', calories: 37, protein: 0.1, carbs: 8.9, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '7616600010034': { name: 'Rivella Blau',              brand: 'Rivella', calories: 37, protein: 0.1, carbs: 8.9, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '7616600010010': { name: 'Rivella Grün',              brand: 'Rivella', calories: 23, protein: 0.1, carbs: 5.3, fat: 0.0, serving: '100ml', category: 'Getränk' },

  // Vitamin Well (Schweden)
  '7350042710017': { name: 'Vitamin Well Reload',       brand: 'Vitamin Well', calories: 22, protein: 0.0, carbs: 5.2, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '7350042710024': { name: 'Vitamin Well Hydrate',      brand: 'Vitamin Well', calories: 20, protein: 0.0, carbs: 4.8, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '7350042710031': { name: 'Vitamin Well Antioxidant',  brand: 'Vitamin Well', calories: 22, protein: 0.0, carbs: 5.1, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '7350042710048': { name: 'Vitamin Well Relax',        brand: 'Vitamin Well', calories: 21, protein: 0.0, carbs: 5.0, fat: 0.0, serving: '100ml', category: 'Getränk' },

  // Almdudler (AT)
  '9000297000012': { name: 'Almdudler Kräuterlimonade', brand: 'Almdudler', calories: 46, protein: 0.0, carbs: 11.5, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '9000297000029': { name: 'Almdudler Light',           brand: 'Almdudler', calories: 10, protein: 0.0, carbs: 2.5,  fat: 0.0, serving: '100ml', category: 'Getränk' },

  // Powerade / Gatorade
  '5449000054272': { name: 'Powerade Mountain Blast',   brand: 'Powerade',  calories: 21, protein: 0.0, carbs: 5.2, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '5449000054289': { name: 'Powerade Berry Ice',        brand: 'Powerade',  calories: 21, protein: 0.0, carbs: 5.2, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '5000112546852': { name: 'Gatorade Orange',           brand: 'Gatorade',  calories: 26, protein: 0.0, carbs: 6.4, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '5000112546869': { name: 'Gatorade Lemon-Lime',       brand: 'Gatorade',  calories: 26, protein: 0.0, carbs: 6.4, fat: 0.0, serving: '100ml', category: 'Getränk' },

  // Eistee
  '4056489100007': { name: 'Fuze Tea Schwarztee Pfirsich',  brand: 'Fuze Tea', calories: 20, protein: 0.0, carbs: 4.8, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '7610807020013': { name: 'Migros Eistee Pfirsich',        brand: 'Migros',   calories: 23, protein: 0.0, carbs: 5.6, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '4001467123412': { name: 'Lipton Ice Tea Pfirsich',       brand: 'Lipton',   calories: 21, protein: 0.0, carbs: 5.2, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '4001467124006': { name: 'Lipton Ice Tea Grüntee',        brand: 'Lipton',   calories: 18, protein: 0.0, carbs: 4.4, fat: 0.0, serving: '100ml', category: 'Getränk' },

  // Wasser
  '3228857000166': { name: 'Evian Mineralwasser',            brand: 'Evian',    calories: 0,  protein: 0.0, carbs: 0.0, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '7610807000046': { name: 'Valser Mineralwasser Still',     brand: 'Valser',   calories: 0,  protein: 0.0, carbs: 0.0, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '7610807000053': { name: 'Valser Mineralwasser Classic',   brand: 'Valser',   calories: 0,  protein: 0.0, carbs: 0.0, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '4000177102001': { name: 'Volvic Mineralwasser',           brand: 'Volvic',   calories: 0,  protein: 0.0, carbs: 0.0, fat: 0.0, serving: '100ml', category: 'Getränk' },

  // Pflanzliche Milch — Alpro (erweitert)
  '5411188119593': { name: 'Alpro Soja Drink Original',      brand: 'Alpro', calories: 45, protein: 3.3, carbs: 2.5, fat: 1.8, serving: '100ml', category: 'Getränk' },
  '5411188004752': { name: 'Alpro Hafer Drink',              brand: 'Alpro', calories: 45, protein: 1.0, carbs: 6.6, fat: 1.5, serving: '100ml', category: 'Getränk' },
  '5411188119616': { name: 'Alpro Mandel Drink Ungesüsst',   brand: 'Alpro', calories: 13, protein: 0.5, carbs: 0.2, fat: 1.1, serving: '100ml', category: 'Getränk' },
  '5411188119623': { name: 'Alpro Kokos Drink',              brand: 'Alpro', calories: 22, protein: 0.1, carbs: 2.6, fat: 1.3, serving: '100ml', category: 'Getränk' },
  '5411188119630': { name: 'Alpro Cashew Drink',             brand: 'Alpro', calories: 21, protein: 0.4, carbs: 2.7, fat: 1.0, serving: '100ml', category: 'Getränk' },
  '5411188119647': { name: 'Alpro Hafer Drink Barista',      brand: 'Alpro', calories: 54, protein: 1.4, carbs: 7.1, fat: 2.2, serving: '100ml', category: 'Getränk' },

  // Oatly
  '7394376616027': { name: 'Oatly Haferdrink Original',      brand: 'Oatly', calories: 49, protein: 1.0, carbs: 6.7, fat: 1.5, serving: '100ml', category: 'Getränk' },
  '7394376616034': { name: 'Oatly Haferdrink Barista',       brand: 'Oatly', calories: 60, protein: 1.2, carbs: 7.3, fat: 2.8, serving: '100ml', category: 'Getränk' },
  '7394376616041': { name: 'Oatly Haferdrink Kakao',         brand: 'Oatly', calories: 72, protein: 1.2, carbs: 12.0, fat: 1.5, serving: '100ml', category: 'Getränk' },

  // ═══════════════════════════════════════════════════════════════
  // MILCH & MILCHPRODUKTE
  // ═══════════════════════════════════════════════════════════════

  // Ehrmann (erweitert)
  '4009233001004': { name: 'Ehrmann High Protein Joghurt Natur',     brand: 'Ehrmann', calories: 68,  protein: 12.0, carbs: 3.2, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '4009233001011': { name: 'Ehrmann High Protein Joghurt Vanille',   brand: 'Ehrmann', calories: 72,  protein: 12.0, carbs: 4.2, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '4009233001028': { name: 'Ehrmann High Protein Joghurt Erdbeere',  brand: 'Ehrmann', calories: 72,  protein: 12.0, carbs: 4.5, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '4009233001035': { name: 'Ehrmann High Protein Joghurt Schokolade',brand: 'Ehrmann', calories: 78,  protein: 11.5, carbs: 5.5, fat: 0.5, serving: '100g', category: 'Milch & Milchprodukte' },
  '4009233001042': { name: 'Ehrmann Protein Pudding Schokolade',     brand: 'Ehrmann', calories: 92,  protein: 11.0, carbs: 7.5, fat: 1.8, serving: '100g', category: 'Milch & Milchprodukte' },
  '4009233001059': { name: 'Ehrmann Protein Pudding Vanille',        brand: 'Ehrmann', calories: 88,  protein: 11.0, carbs: 7.0, fat: 1.5, serving: '100g', category: 'Milch & Milchprodukte' },
  '4009233001066': { name: 'Ehrmann Almighty Quark Natur',           brand: 'Ehrmann', calories: 74,  protein: 13.0, carbs: 3.5, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '4009233002001': { name: 'Ehrmann Grand Dessert Schokolade',       brand: 'Ehrmann', calories: 145, protein: 4.0,  carbs: 17.0, fat: 6.5, serving: '100g', category: 'Milch & Milchprodukte' },

  // Danone (erweitert)
  '3033710065967': { name: 'Danone Activia Natur',                   brand: 'Danone', calories: 66,  protein: 3.9, carbs: 7.0,  fat: 2.3, serving: '100g', category: 'Milch & Milchprodukte' },
  '3033710062799': { name: 'Danone Danette Schokolade',              brand: 'Danone', calories: 131, protein: 3.8, carbs: 18.0, fat: 4.5, serving: '100g', category: 'Milch & Milchprodukte' },
  '3033710062805': { name: 'Danone Danette Vanille',                 brand: 'Danone', calories: 119, protein: 3.8, carbs: 17.0, fat: 3.5, serving: '100g', category: 'Milch & Milchprodukte' },
  '3033710063000': { name: 'Danone Oikos Griechisch Natur',          brand: 'Danone', calories: 97,  protein: 9.0, carbs: 4.0,  fat: 5.0, serving: '100g', category: 'Milch & Milchprodukte' },
  '3033710063017': { name: 'Danone Oikos Griechisch 0%',             brand: 'Danone', calories: 57,  protein: 9.5, carbs: 4.5,  fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '3033710070008': { name: 'Danone Actimel Natur',                   brand: 'Danone', calories: 72,  protein: 3.5, carbs: 11.0, fat: 1.5, serving: '100g', category: 'Milch & Milchprodukte' },

  // Lindahls (Schweden)
  '7300400481090': { name: 'Lindahls Kvarg Natur',                   brand: 'Lindahls', calories: 73, protein: 13.3, carbs: 4.3, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '7300400481106': { name: 'Lindahls Kvarg Vanille',                 brand: 'Lindahls', calories: 78, protein: 13.0, carbs: 5.0, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '7300400481113': { name: 'Lindahls Kvarg Erdbeere',               brand: 'Lindahls', calories: 80, protein: 12.8, carbs: 5.5, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '7300400481120': { name: 'Lindahls Kvarg Blaubeere',              brand: 'Lindahls', calories: 80, protein: 12.8, carbs: 5.5, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },

  // Arla Protein
  '5710085003006': { name: 'Arla Protein Joghurt Natur',             brand: 'Arla', calories: 73,  protein: 12.5, carbs: 4.3, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '5710085003013': { name: 'Arla Protein Joghurt Vanille',           brand: 'Arla', calories: 79,  protein: 12.3, carbs: 5.3, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '5710085003020': { name: 'Arla Protein Quark Vanille',             brand: 'Arla', calories: 75,  protein: 11.5, carbs: 5.2, fat: 0.3, serving: '100g', category: 'Milch & Milchprodukte' },
  '5710085003037': { name: 'Arla Skyr Natur',                        brand: 'Arla', calories: 63,  protein: 11.0, carbs: 4.0, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '5710085003044': { name: 'Arla Skyr Erdbeere',                     brand: 'Arla', calories: 71,  protein: 10.0, carbs: 6.8, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },

  // Emmi (CH, erweitert)
  '7610399001099': { name: 'Emmi Caffè Latte Macchiato',            brand: 'Emmi', calories: 72, protein: 2.5, carbs: 11.4, fat: 1.8, serving: '100ml', category: 'Milch & Milchprodukte' },
  '7610399001075': { name: 'Emmi Caffè Latte Cappuccino',           brand: 'Emmi', calories: 72, protein: 2.5, carbs: 11.2, fat: 1.9, serving: '100ml', category: 'Milch & Milchprodukte' },
  '7610399001044': { name: 'Emmi Activ Drink Vanille',              brand: 'Emmi', calories: 71, protein: 3.2, carbs: 11.4, fat: 1.0, serving: '100ml', category: 'Milch & Milchprodukte' },
  '7610399004144': { name: 'Emmi Protein Shake Schokolade',         brand: 'Emmi', calories: 62, protein: 7.0, carbs: 5.0,  fat: 1.4, serving: '100ml', category: 'Milch & Milchprodukte' },
  '7610399004151': { name: 'Emmi Protein Shake Vanille',            brand: 'Emmi', calories: 60, protein: 7.0, carbs: 4.5,  fat: 1.3, serving: '100ml', category: 'Milch & Milchprodukte' },
  '7610399004168': { name: 'Emmi Protein Shake Erdbeere',           brand: 'Emmi', calories: 62, protein: 7.0, carbs: 5.2,  fat: 1.3, serving: '100ml', category: 'Milch & Milchprodukte' },

  // Migros Milchprodukte (CH)
  '7610807000015': { name: 'M-Classic Vollmilch',                   brand: 'Migros', calories: 61,  protein: 3.3, carbs: 4.7, fat: 3.5, serving: '100ml', category: 'Milch & Milchprodukte' },
  '7613034843173': { name: 'Migros Protein Joghurt Natur',          brand: 'Migros', calories: 85,  protein: 10.2, carbs: 5.6, fat: 2.4, serving: '100g', category: 'Milch & Milchprodukte' },
  '7613034843180': { name: 'Migros Protein Joghurt Vanille',        brand: 'Migros', calories: 88,  protein: 10.0, carbs: 6.0, fat: 2.4, serving: '100g', category: 'Milch & Milchprodukte' },
  '7613034843197': { name: 'Migros Protein Joghurt Erdbeere',       brand: 'Migros', calories: 90,  protein: 9.8,  carbs: 6.5, fat: 2.4, serving: '100g', category: 'Milch & Milchprodukte' },
  '7613269061847': { name: 'Coop Naturaplan Bio Vollmilch',         brand: 'Coop', calories: 61,    protein: 3.3, carbs: 4.7, fat: 3.5, serving: '100ml', category: 'Milch & Milchprodukte' },
  '7613269070009': { name: 'Coop Prix Garantie Joghurt Natur',      brand: 'Coop', calories: 60,    protein: 4.0, carbs: 4.7, fat: 2.8, serving: '100g', category: 'Milch & Milchprodukte' },

  // Lidl Milbona (DE/EU)
  '4056489066965': { name: 'Milbona Protein Joghurt Natur',         brand: 'Milbona', calories: 65, protein: 10.0, carbs: 4.0, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '4056489218174': { name: 'Milbona Skyr Natur',                    brand: 'Milbona', calories: 63, protein: 11.0, carbs: 4.0, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '4056489218181': { name: 'Milbona Skyr Vanille',                  brand: 'Milbona', calories: 71, protein: 10.2, carbs: 6.5, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '4056489218198': { name: 'Milbona Skyr Erdbeere',                 brand: 'Milbona', calories: 73, protein: 10.0, carbs: 7.0, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '4056489218204': { name: 'Milbona Griechischer Joghurt',          brand: 'Milbona', calories: 117, protein: 5.0, carbs: 4.2, fat: 9.0, serving: '100g', category: 'Milch & Milchprodukte' },

  // Yoplait
  '3175681851463': { name: 'Yoplait Nature 0%',                      brand: 'Yoplait', calories: 42, protein: 5.3, carbs: 5.0, fat: 0.1, serving: '100g', category: 'Milch & Milchprodukte' },
  '3175681851470': { name: 'Yoplait Nature Standard',                brand: 'Yoplait', calories: 66, protein: 5.0, carbs: 5.0, fat: 2.5, serving: '100g', category: 'Milch & Milchprodukte' },
  '3175681851487': { name: 'Yoplait Erdbeere',                       brand: 'Yoplait', calories: 92, protein: 3.5, carbs: 15.5, fat: 2.0, serving: '100g', category: 'Milch & Milchprodukte' },

  // Käse (CH)
  '7610836000011': { name: 'Appenzeller Käse',                       brand: 'Appenzeller', calories: 399, protein: 25.9, carbs: 0.0, fat: 32.0, serving: '100g', category: 'Milch & Milchprodukte' },
  '7616600041007': { name: 'Gruyère AOP',                            brand: 'Le Gruyère',  calories: 413, protein: 29.8, carbs: 0.0, fat: 32.5, serving: '100g', category: 'Milch & Milchprodukte' },
  '7610807001012': { name: 'M-Classic Emmentaler',                   brand: 'Migros',      calories: 390, protein: 28.5, carbs: 0.0, fat: 30.0, serving: '100g', category: 'Milch & Milchprodukte' },

  // ═══════════════════════════════════════════════════════════════
  // FITNESS & PROTEIN (massiv erweitert)
  // ═══════════════════════════════════════════════════════════════

  // ESN (vollständig)
  '4260426834017': { name: 'ESN Designer Whey Vanilla',              brand: 'ESN', calories: 380, protein: 79.0, carbs: 4.4, fat: 5.0, serving: '100g', category: 'Fitness & Protein' },
  '4260426834024': { name: 'ESN Designer Whey Chocolate',            brand: 'ESN', calories: 378, protein: 78.0, carbs: 5.0, fat: 5.2, serving: '100g', category: 'Fitness & Protein' },
  '4260426834031': { name: 'ESN Designer Whey Strawberry',           brand: 'ESN', calories: 376, protein: 78.5, carbs: 4.8, fat: 5.0, serving: '100g', category: 'Fitness & Protein' },
  '4260426834048': { name: 'ESN Designer Whey Cookies & Cream',      brand: 'ESN', calories: 381, protein: 77.5, carbs: 5.5, fat: 5.3, serving: '100g', category: 'Fitness & Protein' },
  '4260426830484': { name: 'ESN Iso Whey Zero Vanilla',              brand: 'ESN', calories: 369, protein: 82.5, carbs: 2.7, fat: 3.5, serving: '100g', category: 'Fitness & Protein' },
  '4260426830491': { name: 'ESN Iso Whey Zero Chocolate',            brand: 'ESN', calories: 367, protein: 82.0, carbs: 3.0, fat: 3.5, serving: '100g', category: 'Fitness & Protein' },
  '4260426834055': { name: 'ESN Crank Pre-Workout',                  brand: 'ESN', calories: 362, protein: 3.5,  carbs: 82.5, fat: 0.5, serving: '100g', category: 'Fitness & Protein' },
  '4260426834062': { name: 'ESN Protein Pancakes',                   brand: 'ESN', calories: 368, protein: 38.0, carbs: 40.5, fat: 5.5, serving: '100g', category: 'Fitness & Protein' },

  // More Nutrition (vollständig)
  '4260340197552': { name: 'More Nutrition Total Protein Vanilla',   brand: 'More Nutrition', calories: 382, protein: 80.0, carbs: 4.6, fat: 5.5, serving: '100g', category: 'Fitness & Protein' },
  '4260340197569': { name: 'More Nutrition Total Protein Chocolate', brand: 'More Nutrition', calories: 378, protein: 79.0, carbs: 5.5, fat: 5.8, serving: '100g', category: 'Fitness & Protein' },
  '4260340197583': { name: 'More Nutrition Defined Whey Vanilla',    brand: 'More Nutrition', calories: 374, protein: 81.0, carbs: 3.2, fat: 4.1, serving: '100g', category: 'Fitness & Protein' },
  '4260340197590': { name: 'More Nutrition Defined Whey Chocolate',  brand: 'More Nutrition', calories: 372, protein: 80.5, carbs: 3.8, fat: 4.3, serving: '100g', category: 'Fitness & Protein' },
  '4260340197606': { name: 'More Nutrition Core Whey Vanilla',       brand: 'More Nutrition', calories: 385, protein: 78.0, carbs: 6.0, fat: 5.5, serving: '100g', category: 'Fitness & Protein' },
  '4260340197613': { name: 'More Nutrition Vegan Protein',           brand: 'More Nutrition', calories: 370, protein: 73.0, carbs: 8.5, fat: 6.5, serving: '100g', category: 'Fitness & Protein' },
  '4260340197620': { name: 'More Nutrition Protein Pudding Schoko',  brand: 'More Nutrition', calories: 95,  protein: 12.5, carbs: 6.5, fat: 1.8, serving: '100g', category: 'Fitness & Protein' },
  '4260340197637': { name: 'More Nutrition Just Flavour',            brand: 'More Nutrition', calories: 365, protein: 2.0,  carbs: 86.0, fat: 0.5, serving: '100g', category: 'Fitness & Protein' },

  // MyProtein (erweitert)
  '5060343746031': { name: 'MyProtein Impact Whey Vanilla',          brand: 'Myprotein', calories: 391, protein: 82.0, carbs: 4.5, fat: 4.5, serving: '100g', category: 'Fitness & Protein' },
  '5060343746048': { name: 'MyProtein Impact Whey Chocolate',        brand: 'Myprotein', calories: 388, protein: 81.0, carbs: 5.5, fat: 4.8, serving: '100g', category: 'Fitness & Protein' },
  '5060343746055': { name: 'MyProtein Impact Whey Strawberry',       brand: 'Myprotein', calories: 386, protein: 81.5, carbs: 5.0, fat: 4.5, serving: '100g', category: 'Fitness & Protein' },
  '5060343746062': { name: 'MyProtein Impact Whey Cookies & Cream',  brand: 'Myprotein', calories: 392, protein: 79.5, carbs: 6.5, fat: 5.0, serving: '100g', category: 'Fitness & Protein' },
  '5060343743139': { name: 'MyProtein Protein Bar',                  brand: 'Myprotein', calories: 370, protein: 31.0, carbs: 37.0, fat: 9.0, serving: '100g', category: 'Fitness & Protein' },
  '5060343743146': { name: 'MyProtein Layered Bar Chocolate',        brand: 'Myprotein', calories: 412, protein: 30.5, carbs: 42.0, fat: 12.5, serving: '100g', category: 'Fitness & Protein' },
  '5060343770050': { name: 'MyProtein Vegan Protein Vanilla',        brand: 'Myprotein', calories: 377, protein: 73.0, carbs: 9.5, fat: 6.0, serving: '100g', category: 'Fitness & Protein' },
  '5060343770067': { name: 'MyProtein Vegan Protein Chocolate',      brand: 'Myprotein', calories: 374, protein: 72.5, carbs: 10.5, fat: 6.2, serving: '100g', category: 'Fitness & Protein' },

  // Foodspring (erweitert)
  '4018400400001': { name: 'Foodspring Protein Bar Chocolate',       brand: 'Foodspring', calories: 352, protein: 29.0, carbs: 34.0, fat: 10.0, serving: '100g', category: 'Fitness & Protein' },
  '4018400400018': { name: 'Foodspring Protein Bar Erdbeere',        brand: 'Foodspring', calories: 348, protein: 29.5, carbs: 33.0, fat: 9.5, serving: '100g', category: 'Fitness & Protein' },
  '4018400503406': { name: 'Foodspring Whey Protein Vanilla',        brand: 'Foodspring', calories: 383, protein: 80.0, carbs: 5.0, fat: 5.5, serving: '100g', category: 'Fitness & Protein' },
  '4018400503413': { name: 'Foodspring Shape Shake Vanilla',         brand: 'Foodspring', calories: 355, protein: 55.0, carbs: 22.0, fat: 6.5, serving: '100g', category: 'Fitness & Protein' },
  '4018400503420': { name: 'Foodspring Vegan Protein Chocolate',     brand: 'Foodspring', calories: 372, protein: 72.0, carbs: 9.0, fat: 7.5, serving: '100g', category: 'Fitness & Protein' },
  '4018400503437': { name: 'Foodspring Protein Bread',               brand: 'Foodspring', calories: 249, protein: 33.0, carbs: 12.0, fat: 6.5, serving: '100g', category: 'Fitness & Protein' },
  '4018400503444': { name: 'Foodspring Protein Müsli',               brand: 'Foodspring', calories: 395, protein: 27.0, carbs: 36.5, fat: 13.5, serving: '100g', category: 'Fitness & Protein' },

  // Optimum Nutrition (vollständig)
  '748927028751':  { name: 'ON Gold Standard Whey Vanilla',          brand: 'Optimum Nutrition', calories: 388, protein: 79.4, carbs: 6.5, fat: 5.3, serving: '100g', category: 'Fitness & Protein' },
  '748927028768':  { name: 'ON Gold Standard Whey Chocolate',        brand: 'Optimum Nutrition', calories: 388, protein: 77.5, carbs: 8.8, fat: 5.3, serving: '100g', category: 'Fitness & Protein' },
  '748927028775':  { name: 'ON Gold Standard Whey Strawberry',       brand: 'Optimum Nutrition', calories: 385, protein: 79.0, carbs: 7.0, fat: 5.0, serving: '100g', category: 'Fitness & Protein' },
  '748927028782':  { name: 'ON Gold Standard Whey Double Choc',      brand: 'Optimum Nutrition', calories: 390, protein: 77.0, carbs: 9.0, fat: 5.5, serving: '100g', category: 'Fitness & Protein' },
  '748927054576':  { name: 'ON Serious Mass Chocolate',              brand: 'Optimum Nutrition', calories: 389, protein: 31.0, carbs: 62.0, fat: 3.0, serving: '100g', category: 'Fitness & Protein' },
  '748927054583':  { name: 'ON Serious Mass Vanilla',                brand: 'Optimum Nutrition', calories: 388, protein: 31.0, carbs: 62.0, fat: 3.0, serving: '100g', category: 'Fitness & Protein' },

  // Barebells (erweitert)
  '7340005519082': { name: 'Barebells Cookies & Cream',              brand: 'Barebells', calories: 374, protein: 32.4, carbs: 32.0, fat: 10.4, serving: '100g', category: 'Fitness & Protein' },
  '7340005519099': { name: 'Barebells Vanilla Toffee',               brand: 'Barebells', calories: 374, protein: 32.4, carbs: 32.0, fat: 10.0, serving: '100g', category: 'Fitness & Protein' },
  '7340005519075': { name: 'Barebells Hazelnut & Nougat',            brand: 'Barebells', calories: 374, protein: 32.4, carbs: 33.0, fat: 10.0, serving: '100g', category: 'Fitness & Protein' },
  '7340005519105': { name: 'Barebells Salty Peanut',                 brand: 'Barebells', calories: 382, protein: 32.0, carbs: 32.0, fat: 11.5, serving: '100g', category: 'Fitness & Protein' },
  '7340005519112': { name: 'Barebells White Salty Caramel',          brand: 'Barebells', calories: 374, protein: 32.0, carbs: 33.0, fat: 10.0, serving: '100g', category: 'Fitness & Protein' },
  '7340005519129': { name: 'Barebells Caramel Cashew',               brand: 'Barebells', calories: 382, protein: 32.0, carbs: 32.0, fat: 11.5, serving: '100g', category: 'Fitness & Protein' },

  // Grenade
  '5060245601091': { name: 'Grenade Carb Killa Chocolate Chip',      brand: 'Grenade', calories: 341, protein: 31.6, carbs: 22.0, fat: 12.3, serving: '100g', category: 'Fitness & Protein' },
  '5060245601107': { name: 'Grenade Carb Killa Peanut Butter',       brand: 'Grenade', calories: 367, protein: 30.0, carbs: 21.0, fat: 14.5, serving: '100g', category: 'Fitness & Protein' },
  '5060245601114': { name: 'Grenade Carb Killa White Choc',          brand: 'Grenade', calories: 351, protein: 32.0, carbs: 22.5, fat: 12.5, serving: '100g', category: 'Fitness & Protein' },
  '5060245601121': { name: 'Grenade Carb Killa Birthday Cake',       brand: 'Grenade', calories: 354, protein: 31.0, carbs: 24.0, fat: 12.5, serving: '100g', category: 'Fitness & Protein' },

  // Fulfil
  '5391529031021': { name: 'Fulfil Protein Bar Chocolate Hazelnut',  brand: 'Fulfil', calories: 340, protein: 29.0, carbs: 25.0, fat: 13.0, serving: '100g', category: 'Fitness & Protein' },
  '5391529031038': { name: 'Fulfil Protein Bar Peanut Caramel',      brand: 'Fulfil', calories: 358, protein: 28.5, carbs: 25.5, fat: 14.0, serving: '100g', category: 'Fitness & Protein' },
  '5391529031045': { name: 'Fulfil Protein Bar Raspberry',           brand: 'Fulfil', calories: 330, protein: 29.5, carbs: 23.0, fat: 12.5, serving: '100g', category: 'Fitness & Protein' },

  // GymBeam (erweitert)
  '8586023080121': { name: 'GymBeam Whey Protein Vanilla',           brand: 'GymBeam', calories: 385, protein: 80.0, carbs: 5.8, fat: 5.2, serving: '100g', category: 'Fitness & Protein' },
  '8586023080138': { name: 'GymBeam Whey Protein Chocolate',         brand: 'GymBeam', calories: 383, protein: 79.0, carbs: 6.5, fat: 5.5, serving: '100g', category: 'Fitness & Protein' },
  '8586023080145': { name: 'GymBeam Vegan Protein Chocolate',        brand: 'GymBeam', calories: 370, protein: 71.5, carbs: 9.5, fat: 7.0, serving: '100g', category: 'Fitness & Protein' },
  '8586023080152': { name: 'GymBeam Protein Bar Chocolate',          brand: 'GymBeam', calories: 368, protein: 28.5, carbs: 36.0, fat: 11.5, serving: '100g', category: 'Fitness & Protein' },

  // Bulk (erweitert)
  '5060614841034': { name: 'Bulk Pure Whey Protein Vanilla',         brand: 'Bulk', calories: 386, protein: 81.0, carbs: 4.5, fat: 4.5, serving: '100g', category: 'Fitness & Protein' },
  '5060614841041': { name: 'Bulk Pure Whey Protein Chocolate',       brand: 'Bulk', calories: 383, protein: 80.0, carbs: 5.5, fat: 4.8, serving: '100g', category: 'Fitness & Protein' },
  '5060614841058': { name: 'Bulk Pure Whey Protein Strawberry',      brand: 'Bulk', calories: 381, protein: 80.5, carbs: 5.0, fat: 4.5, serving: '100g', category: 'Fitness & Protein' },
  '5060614841065': { name: 'Bulk Macro Munch Bar Chocolate',         brand: 'Bulk', calories: 379, protein: 30.5, carbs: 39.0, fat: 11.0, serving: '100g', category: 'Fitness & Protein' },

  // Prozis (erweitert)
  '5600781310031': { name: 'Prozis Whey Premium Vanilla',            brand: 'Prozis', calories: 376, protein: 78.0, carbs: 5.8, fat: 4.5, serving: '100g', category: 'Fitness & Protein' },
  '5600781310048': { name: 'Prozis Whey Premium Chocolate',          brand: 'Prozis', calories: 374, protein: 77.5, carbs: 6.5, fat: 4.8, serving: '100g', category: 'Fitness & Protein' },
  '5600781310055': { name: 'Prozis Vegan Protein Vanilla',           brand: 'Prozis', calories: 368, protein: 72.0, carbs: 9.0, fat: 6.5, serving: '100g', category: 'Fitness & Protein' },

  // Clif / PhD / Scitec
  '4000417244007': { name: 'Clif Bar Chocolate Chip',                brand: 'Clif',   calories: 376, protein: 9.5, carbs: 64.0, fat: 7.0, serving: '100g', category: 'Fitness & Protein' },
  '4000417244014': { name: 'Clif Bar White Chocolate Macadamia',     brand: 'Clif',   calories: 378, protein: 9.0, carbs: 64.5, fat: 7.5, serving: '100g', category: 'Fitness & Protein' },
  '3700339001050': { name: 'PhD Smart Bar Chocolate',                brand: 'PhD',    calories: 335, protein: 32.5, carbs: 24.5, fat: 9.0, serving: '100g', category: 'Fitness & Protein' },
  '5999076219346': { name: 'Scitec 100% Whey Vanilla',               brand: 'Scitec', calories: 388, protein: 77.0, carbs: 7.5, fat: 6.0, serving: '100g', category: 'Fitness & Protein' },
  '5999076219353': { name: 'Scitec 100% Whey Chocolate',             brand: 'Scitec', calories: 385, protein: 76.5, carbs: 8.0, fat: 6.2, serving: '100g', category: 'Fitness & Protein' },

  // Ovomaltine (CH)
  '7617100004152': { name: 'Ovomaltine Pulver',                      brand: 'Wander', calories: 382, protein: 14.4, carbs: 64.2, fat: 7.7, serving: '100g', category: 'Fitness & Protein' },
  '7617100036048': { name: 'Ovomaltine Crunchy Cream',               brand: 'Wander', calories: 508, protein: 6.7,  carbs: 56.2, fat: 28.1, serving: '100g', category: 'Aufstrich' },
  '7617100055544': { name: 'Ovomaltine Riegel',                      brand: 'Wander', calories: 423, protein: 6.7,  carbs: 63.4, fat: 15.4, serving: '100g', category: 'Snack' },

  // Migros Protein CH
  '7613034843173': { name: 'Migros Protein Joghurt Natur',           brand: 'Migros', calories: 85,  protein: 10.2, carbs: 5.6, fat: 2.4, serving: '100g', category: 'Fitness & Protein' },

  // ═══════════════════════════════════════════════════════════════
  // SNACKS & SCHOKOLADE
  // ═══════════════════════════════════════════════════════════════

  // Milka (erweitert)
  '7622210421999': { name: 'Milka Vollmilch 100g',                   brand: 'Milka', calories: 535, protein: 7.5, carbs: 57.7, fat: 30.5, serving: '100g', category: 'Snack' },
  '7622210422002': { name: 'Milka Oreo',                             brand: 'Milka', calories: 530, protein: 7.0, carbs: 60.0, fat: 28.5, serving: '100g', category: 'Snack' },
  '7622210422019': { name: 'Milka Caramel',                          brand: 'Milka', calories: 528, protein: 6.5, carbs: 60.5, fat: 28.0, serving: '100g', category: 'Snack' },
  '7622210422026': { name: 'Milka Haselnuss',                        brand: 'Milka', calories: 547, protein: 7.5, carbs: 54.5, fat: 32.5, serving: '100g', category: 'Snack' },
  '7622210422033': { name: 'Milka Trauben-Nuss',                     brand: 'Milka', calories: 518, protein: 7.0, carbs: 59.5, fat: 27.5, serving: '100g', category: 'Snack' },
  '7622210422040': { name: 'Milka Alpenmilch 300g',                  brand: 'Milka', calories: 535, protein: 7.5, carbs: 57.7, fat: 30.5, serving: '100g', category: 'Snack' },
  '7622210444095': { name: 'Milka Tender',                           brand: 'Milka', calories: 442, protein: 6.0, carbs: 58.0, fat: 21.5, serving: '100g', category: 'Snack' },

  // Lindt (erweitert)
  '7610839985030': { name: 'Lindt Vollmilch Schokolade 100g',        brand: 'Lindt', calories: 535, protein: 7.5, carbs: 56.7, fat: 30.5, serving: '100g', category: 'Snack' },
  '7610839985047': { name: 'Lindt Excellence 70% Dunkel',            brand: 'Lindt', calories: 565, protein: 9.0, carbs: 38.5, fat: 41.5, serving: '100g', category: 'Snack' },
  '7610839985054': { name: 'Lindt Excellence 85% Dunkel',            brand: 'Lindt', calories: 585, protein: 10.5, carbs: 28.5, fat: 46.5, serving: '100g', category: 'Snack' },
  '7610839985061': { name: 'Lindt Lindor Vollmilch',                 brand: 'Lindt', calories: 567, protein: 5.5, carbs: 50.5, fat: 37.0, serving: '100g', category: 'Snack' },
  '7610839985078': { name: 'Lindt Lindor Weiss',                     brand: 'Lindt', calories: 590, protein: 5.5, carbs: 52.5, fat: 39.0, serving: '100g', category: 'Snack' },

  // Ritter Sport (DE)
  '4000417224009': { name: 'Ritter Sport Vollmilch',                 brand: 'Ritter Sport', calories: 535, protein: 7.5, carbs: 55.5, fat: 31.5, serving: '100g', category: 'Snack' },
  '4000417224016': { name: 'Ritter Sport Nuss',                      brand: 'Ritter Sport', calories: 560, protein: 9.5, carbs: 48.0, fat: 36.0, serving: '100g', category: 'Snack' },
  '4000417224023': { name: 'Ritter Sport Marzipan',                  brand: 'Ritter Sport', calories: 486, protein: 6.5, carbs: 56.5, fat: 26.5, serving: '100g', category: 'Snack' },
  '4000417224030': { name: 'Ritter Sport Dunkel',                    brand: 'Ritter Sport', calories: 548, protein: 6.5, carbs: 52.5, fat: 33.0, serving: '100g', category: 'Snack' },
  '4000417224047': { name: 'Ritter Sport Olympia',                   brand: 'Ritter Sport', calories: 532, protein: 7.0, carbs: 56.0, fat: 30.5, serving: '100g', category: 'Snack' },

  // Kinder / Ferrero
  '8000500037560': { name: 'Ferrero Rocher 3er',                     brand: 'Ferrero', calories: 587, protein: 7.3, carbs: 47.3, fat: 39.6, serving: '100g', category: 'Snack' },
  '8000500158449': { name: 'Kinder Schokolade',                      brand: 'Kinder',  calories: 556, protein: 8.0, carbs: 57.0, fat: 33.0, serving: '100g', category: 'Snack' },
  '8000500158456': { name: 'Kinder Riegel',                          brand: 'Kinder',  calories: 519, protein: 5.5, carbs: 60.0, fat: 28.5, serving: '100g', category: 'Snack' },
  '8000500158463': { name: 'Kinder Bueno',                           brand: 'Kinder',  calories: 571, protein: 7.5, carbs: 52.5, fat: 36.5, serving: '100g', category: 'Snack' },
  '8000500158470': { name: 'Kinder Pingui',                          brand: 'Kinder',  calories: 416, protein: 6.5, carbs: 48.5, fat: 22.5, serving: '100g', category: 'Snack' },
  '8000500158487': { name: 'Kinder Country',                         brand: 'Kinder',  calories: 526, protein: 8.0, carbs: 54.5, fat: 30.0, serving: '100g', category: 'Snack' },
  '3017624010701': { name: 'Nutella 400g',                           brand: 'Ferrero', calories: 539, protein: 6.3, carbs: 57.5, fat: 30.9, serving: '100g', category: 'Aufstrich' },
  '3017624047003': { name: 'Nutella B-ready',                        brand: 'Ferrero', calories: 526, protein: 7.5, carbs: 63.0, fat: 26.5, serving: '100g', category: 'Snack' },

  // Haribo (DE)
  '4001686301135': { name: 'Haribo Goldbären 200g',                  brand: 'Haribo', calories: 343, protein: 6.5, carbs: 77.0, fat: 0.5, serving: '100g', category: 'Snack' },
  '4001686301142': { name: 'Haribo Smurfs',                          brand: 'Haribo', calories: 343, protein: 6.5, carbs: 77.0, fat: 0.5, serving: '100g', category: 'Snack' },
  '4001686301159': { name: 'Haribo Happy Cola',                      brand: 'Haribo', calories: 340, protein: 6.0, carbs: 78.0, fat: 0.0, serving: '100g', category: 'Snack' },
  '4001686301166': { name: 'Haribo Starmix',                         brand: 'Haribo', calories: 343, protein: 6.5, carbs: 77.0, fat: 0.5, serving: '100g', category: 'Snack' },
  '4001686301173': { name: 'Haribo Twin Snakes',                     brand: 'Haribo', calories: 336, protein: 5.5, carbs: 79.0, fat: 0.0, serving: '100g', category: 'Snack' },

  // Chips — Zweifel / Pringles / Lays
  '7610848040079': { name: 'Zweifel Original Chips',                 brand: 'Zweifel', calories: 519, protein: 6.5, carbs: 51.3, fat: 31.3, serving: '100g', category: 'Snack' },
  '7610848022105': { name: 'Zweifel Paprika Chips',                  brand: 'Zweifel', calories: 519, protein: 5.9, carbs: 52.1, fat: 31.5, serving: '100g', category: 'Snack' },
  '7610848061050': { name: 'Zweifel Popcorn',                        brand: 'Zweifel', calories: 478, protein: 8.3, carbs: 62.4, fat: 20.1, serving: '100g', category: 'Snack' },
  '5053990101008': { name: 'Pringles Original',                      brand: 'Pringles', calories: 529, protein: 5.5, carbs: 55.5, fat: 31.0, serving: '100g', category: 'Snack' },
  '5053990101015': { name: 'Pringles Sour Cream & Onion',            brand: 'Pringles', calories: 525, protein: 5.5, carbs: 55.0, fat: 31.0, serving: '100g', category: 'Snack' },
  '5053990101022': { name: 'Pringles Paprika',                       brand: 'Pringles', calories: 524, protein: 5.5, carbs: 55.0, fat: 31.0, serving: '100g', category: 'Snack' },
  '5053990101039': { name: 'Pringles Pizza',                         brand: 'Pringles', calories: 524, protein: 5.5, carbs: 55.0, fat: 31.0, serving: '100g', category: 'Snack' },
  '5000167023602': { name: "Lay's Classic",                          brand: "Lay's",   calories: 536, protein: 6.5, carbs: 53.5, fat: 32.5, serving: '100g', category: 'Snack' },
  '5000167023619': { name: "Lay's Paprika",                          brand: "Lay's",   calories: 533, protein: 6.5, carbs: 54.0, fat: 32.0, serving: '100g', category: 'Snack' },
  '5000167023626': { name: "Lay's Sour Cream",                       brand: "Lay's",   calories: 528, protein: 6.0, carbs: 54.5, fat: 31.5, serving: '100g', category: 'Snack' },

  // Kambly / Ricola (CH)
  '7614400023510': { name: 'Kambly Bretzeli',                        brand: 'Kambly', calories: 459, protein: 9.4, carbs: 66.3, fat: 16.6, serving: '100g', category: 'Snack' },
  '7614400000014': { name: 'Kambly Spécialités Schnitten',           brand: 'Kambly', calories: 495, protein: 6.5, carbs: 63.0, fat: 24.5, serving: '100g', category: 'Snack' },
  '7612100055006': { name: 'Ricola Kräuterzucker',                   brand: 'Ricola', calories: 376, protein: 0.0, carbs: 93.8, fat: 0.0, serving: '100g', category: 'Snack' },

  // Manner (AT)
  '9008700102993': { name: 'Manner Schnitten Original',              brand: 'Manner', calories: 497, protein: 7.2, carbs: 65.9, fat: 22.6, serving: '100g', category: 'Snack' },
  '9008700102999': { name: 'Manner Schnitten Haselnuss',             brand: 'Manner', calories: 503, protein: 7.0, carbs: 63.5, fat: 24.0, serving: '100g', category: 'Snack' },

  // Mars / Snickers / Twix (DE/EU)
  '5000159407144': { name: 'Mars Riegel',                            brand: 'Mars',    calories: 448, protein: 4.0, carbs: 67.0, fat: 17.5, serving: '100g', category: 'Snack' },
  '5000159407151': { name: 'Snickers Riegel',                        brand: 'Snickers',calories: 488, protein: 8.5, carbs: 57.5, fat: 24.5, serving: '100g', category: 'Snack' },
  '5000159407168': { name: 'Twix Riegel',                            brand: 'Twix',    calories: 495, protein: 4.5, carbs: 63.0, fat: 24.5, serving: '100g', category: 'Snack' },
  '5000159407175': { name: 'Bounty Riegel',                          brand: 'Bounty',  calories: 472, protein: 3.5, carbs: 59.5, fat: 24.0, serving: '100g', category: 'Snack' },
  '5000159407182': { name: 'KitKat Riegel',                          brand: 'KitKat',  calories: 507, protein: 6.5, carbs: 59.5, fat: 26.5, serving: '100g', category: 'Snack' },
  '5000159407199': { name: 'Maltesers',                              brand: 'Maltesers',calories: 480, protein: 8.5, carbs: 59.0, fat: 23.5, serving: '100g', category: 'Snack' },

  // Frey Schokolade (CH)
  '7610815011232': { name: 'Frey Milchschokolade',                   brand: 'Frey', calories: 537, protein: 7.2, carbs: 57.3, fat: 30.9, serving: '100g', category: 'Snack' },
  '7610815011249': { name: 'Frey Nussschokolade',                    brand: 'Frey', calories: 557, protein: 8.5, carbs: 50.5, fat: 34.5, serving: '100g', category: 'Snack' },
  '7610815011256': { name: 'Frey Dunkelschokolade 72%',              brand: 'Frey', calories: 565, protein: 9.0, carbs: 39.0, fat: 40.0, serving: '100g', category: 'Snack' },

  // ═══════════════════════════════════════════════════════════════
  // FRÜHSTÜCK & CEREALIEN
  // ═══════════════════════════════════════════════════════════════

  // Kellogg's (erweitert)
  '5010029010007': { name: "Kellogg's Corn Flakes",                  brand: "Kellogg's", calories: 378, protein: 7.5, carbs: 84.0, fat: 0.9, serving: '100g', category: 'Frühstück' },
  '5010029010014': { name: "Kellogg's Frosties",                     brand: "Kellogg's", calories: 381, protein: 5.5, carbs: 88.0, fat: 0.5, serving: '100g', category: 'Frühstück' },
  '5010029010021': { name: "Kellogg's Special K Original",           brand: "Kellogg's", calories: 378, protein: 15.0, carbs: 72.0, fat: 1.5, serving: '100g', category: 'Frühstück' },
  '5010029010038': { name: "Kellogg's Crunchy Nut",                  brand: "Kellogg's", calories: 404, protein: 7.5, carbs: 83.5, fat: 5.0, serving: '100g', category: 'Frühstück' },
  '5010029010045': { name: "Kellogg's Coco Pops",                    brand: "Kellogg's", calories: 391, protein: 5.5, carbs: 85.5, fat: 3.5, serving: '100g', category: 'Frühstück' },
  '5010029010052': { name: "Kellogg's All-Bran",                     brand: "Kellogg's", calories: 334, protein: 14.0, carbs: 46.0, fat: 3.5, serving: '100g', category: 'Frühstück' },
  '5010029010069': { name: "Kellogg's Müsli",                        brand: "Kellogg's", calories: 368, protein: 8.5, carbs: 68.0, fat: 5.5, serving: '100g', category: 'Frühstück' },

  // Nestlé Cerealien
  '7613036271004': { name: 'Nestlé Nesquik Cerealien',               brand: 'Nestlé', calories: 387, protein: 7.0, carbs: 83.0, fat: 3.5, serving: '100g', category: 'Frühstück' },
  '7613036271011': { name: 'Nestlé Fitness Original',                brand: 'Nestlé', calories: 374, protein: 10.0, carbs: 76.0, fat: 2.5, serving: '100g', category: 'Frühstück' },
  '7613036271028': { name: 'Nestlé Lion Cerealien',                  brand: 'Nestlé', calories: 422, protein: 6.5, carbs: 75.5, fat: 10.5, serving: '100g', category: 'Frühstück' },
  '7613036271035': { name: 'Nestlé Honey Shreddies',                 brand: 'Nestlé', calories: 378, protein: 7.5, carbs: 80.0, fat: 1.5, serving: '100g', category: 'Frühstück' },
  '7613037534651': { name: 'Nestlé Milo Cerealien',                  brand: 'Nestlé', calories: 380, protein: 9.0, carbs: 78.0, fat: 3.0, serving: '100g', category: 'Frühstück' },

  // Farmer Müsli / Migros Frühstück (CH)
  '7613034626608': { name: 'Farmer Müesli Klassik',                  brand: 'Migros', calories: 369, protein: 9.1,  carbs: 64.8, fat: 7.2, serving: '100g', category: 'Frühstück' },
  '7613034369499': { name: 'Farmer Nuss Mix Müesli',                 brand: 'Migros', calories: 406, protein: 9.8,  carbs: 54.3, fat: 15.8, serving: '100g', category: 'Frühstück' },
  '7610807004006': { name: 'M-Classic Haferflocken',                 brand: 'Migros', calories: 370, protein: 12.5, carbs: 60.2, fat: 6.9, serving: '100g', category: 'Frühstück' },
  '7613034580009': { name: 'Farmer Crunchy Müesli',                  brand: 'Migros', calories: 425, protein: 8.5,  carbs: 62.0, fat: 15.5, serving: '100g', category: 'Frühstück' },
  '7613034580016': { name: 'Farmer Protein Müesli',                  brand: 'Migros', calories: 395, protein: 18.5, carbs: 52.0, fat: 10.5, serving: '100g', category: 'Frühstück' },

  // Haferflocken / Müsli allgemein
  '4056489000102': { name: 'Lidl Bio Haferflocken',                  brand: 'Freshona', calories: 368, protein: 12.5, carbs: 59.5, fat: 7.0, serving: '100g', category: 'Frühstück' },
  '4003225000003': { name: 'Knusperone Müsli',                       brand: 'Knusperone', calories: 428, protein: 8.5, carbs: 65.0, fat: 15.5, serving: '100g', category: 'Frühstück' },
  '4006040000007': { name: 'Seitenbacher Müsli Schoko',              brand: 'Seitenbacher', calories: 406, protein: 12.0, carbs: 63.5, fat: 11.5, serving: '100g', category: 'Frühstück' },
  '4003950000005': { name: 'Verival Bio Porridge',                   brand: 'Verival', calories: 355, protein: 13.5, carbs: 54.5, fat: 6.5, serving: '100g', category: 'Frühstück' },

  // Brotaufstriche
  '3017624010701': { name: 'Nutella 400g',                           brand: 'Ferrero', calories: 539, protein: 6.3, carbs: 57.5, fat: 30.9, serving: '100g', category: 'Aufstrich' },
  '7611251030009': { name: 'Thomy Senf',                             brand: 'Thomy',  calories: 93,  protein: 4.0, carbs: 7.5,  fat: 5.0, serving: '100g', category: 'Aufstrich' },

  // ═══════════════════════════════════════════════════════════════
  // PASTA, REIS & KOHLENHYDRATE
  // ═══════════════════════════════════════════════════════════════

  // Barilla (IT, erweitert)
  '8076800195057': { name: 'Barilla Spaghetti No.5',                 brand: 'Barilla', calories: 353, protein: 13.0, carbs: 70.2, fat: 1.4, serving: '100g', category: 'Hauptgericht' },
  '8076800105053': { name: 'Barilla Penne Rigate',                   brand: 'Barilla', calories: 353, protein: 13.0, carbs: 70.2, fat: 1.4, serving: '100g', category: 'Hauptgericht' },
  '8076800107088': { name: 'Barilla Fusilli',                        brand: 'Barilla', calories: 353, protein: 13.0, carbs: 70.2, fat: 1.4, serving: '100g', category: 'Hauptgericht' },
  '8076800107095': { name: 'Barilla Rigatoni',                       brand: 'Barilla', calories: 353, protein: 13.0, carbs: 70.2, fat: 1.4, serving: '100g', category: 'Hauptgericht' },
  '8076800270270': { name: 'Barilla Spaghetti Vollkorn',             brand: 'Barilla', calories: 338, protein: 14.0, carbs: 63.0, fat: 2.5, serving: '100g', category: 'Hauptgericht' },
  '8076800912007': { name: 'Barilla Farfalle',                       brand: 'Barilla', calories: 353, protein: 13.0, carbs: 70.2, fat: 1.4, serving: '100g', category: 'Hauptgericht' },

  // Reis / Körner
  '4000521001001': { name: "Uncle Ben's Langkornreis",                brand: "Uncle Ben's", calories: 355, protein: 7.5, carbs: 79.5, fat: 1.0, serving: '100g', category: 'Hauptgericht' },
  '4000521001018': { name: "Uncle Ben's Jasminreis",                  brand: "Uncle Ben's", calories: 355, protein: 7.0, carbs: 80.0, fat: 1.0, serving: '100g', category: 'Hauptgericht' },
  '4000521001025': { name: "Uncle Ben's Basmatireis",                 brand: "Uncle Ben's", calories: 352, protein: 8.0, carbs: 78.5, fat: 0.8, serving: '100g', category: 'Hauptgericht' },
  '4000521002008': { name: "Uncle Ben's Mikrowellen Reis Natur",      brand: "Uncle Ben's", calories: 127, protein: 2.5, carbs: 27.5, fat: 0.5, serving: '100g', category: 'Hauptgericht' },

  // ═══════════════════════════════════════════════════════════════
  // BROT & BACKWAREN
  // ═══════════════════════════════════════════════════════════════

  '4056489100106': { name: 'Wasa Knäckebrot Hafer',                  brand: 'Wasa',   calories: 348, protein: 13.0, carbs: 59.5, fat: 5.0, serving: '100g', category: 'Brot & Backwaren' },
  '4056489100113': { name: 'Wasa Knäckebrot Sesam',                  brand: 'Wasa',   calories: 358, protein: 12.5, carbs: 60.0, fat: 5.5, serving: '100g', category: 'Brot & Backwaren' },
  '4056489100120': { name: 'Wasa Knäckebrot Vollkorn',               brand: 'Wasa',   calories: 338, protein: 12.5, carbs: 62.5, fat: 3.0, serving: '100g', category: 'Brot & Backwaren' },
  '7613033000003': { name: 'Hug Knäckebrot',                         brand: 'Hug',    calories: 368, protein: 10.4, carbs: 73.1, fat: 3.1, serving: '100g', category: 'Brot & Backwaren' },

  // ═══════════════════════════════════════════════════════════════
  // FERTIGPRODUKTE / CONVENIENCE
  // ═══════════════════════════════════════════════════════════════

  '4000400250000': { name: 'Knorr Fix Bolognese',                    brand: 'Knorr',  calories: 350, protein: 12.5, carbs: 63.0, fat: 5.5, serving: '100g', category: 'Fertiggericht' },
  '4000400260009': { name: 'Knorr Fix Chili con Carne',              brand: 'Knorr',  calories: 345, protein: 13.0, carbs: 60.5, fat: 6.0, serving: '100g', category: 'Fertiggericht' },
  '4000400270008': { name: 'Knorr Pasta Snack',                      brand: 'Knorr',  calories: 395, protein: 10.5, carbs: 67.0, fat: 10.0, serving: '100g', category: 'Fertiggericht' },
  '7613034000001': { name: "Migros Anna's Best Lasagne",            brand: 'Migros', calories: 120, protein: 7.5,  carbs: 10.5, fat: 5.0, serving: '100g', category: 'Fertiggericht' },
  '4056489200001': { name: 'Lidl Pasta Carbonara Fertig',            brand: 'Lidl',   calories: 155, protein: 6.5,  carbs: 18.5, fat: 5.5, serving: '100g', category: 'Fertiggericht' },

  // ═══════════════════════════════════════════════════════════════
  // ÖSTERREICH EIGENMARKEN
  // ═══════════════════════════════════════════════════════════════

  '9004600001006': { name: 'Ottakringer Bier',                       brand: 'Ottakringer', calories: 43, protein: 0.5, carbs: 4.3, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '9004540002108': { name: 'Zott Monte',                             brand: 'Zott',        calories: 447, protein: 5.0, carbs: 46.0, fat: 26.0, serving: '100g', category: 'Snack' },
  '9008700115009': { name: 'Manner Prinzen Rolle',                   brand: 'Manner',      calories: 472, protein: 7.0, carbs: 67.0, fat: 19.0, serving: '100g', category: 'Snack' },
  '9008580100009': { name: 'Nuss-Nougat Creme Billa',                brand: 'Billa',       calories: 536, protein: 6.0, carbs: 57.5, fat: 30.5, serving: '100g', category: 'Aufstrich' },

  // ═══════════════════════════════════════════════════════════════
  // SPANIEN (Mercadona / Häufige ES Produkte)
  // ═══════════════════════════════════════════════════════════════

  '8480017075376': { name: 'Hacendado Joghurt Natur',                brand: 'Hacendado', calories: 61, protein: 3.7, carbs: 5.3, fat: 2.5, serving: '100g', category: 'Milch & Milchprodukte' },
  '8480017043145': { name: 'Hacendado Arroz',                        brand: 'Hacendado', calories: 352, protein: 7.0, carbs: 79.5, fat: 0.8, serving: '100g', category: 'Hauptgericht' },
  '8410188081162': { name: 'Danone Activia ES Natur',                brand: 'Danone',    calories: 63, protein: 3.5, carbs: 7.2, fat: 2.2, serving: '100g', category: 'Milch & Milchprodukte' },

  // ═══════════════════════════════════════════════════════════════
  // ITALIEN (häufige IT Produkte)
  // ═══════════════════════════════════════════════════════════════

  '8001505005707': { name: 'Mulino Bianco Kekse',                    brand: 'Mulino Bianco', calories: 450, protein: 7.5, carbs: 73.0, fat: 14.5, serving: '100g', category: 'Snack' },
  '8001505010701': { name: 'Pavesini Kekse',                         brand: 'Barilla',       calories: 403, protein: 8.5, carbs: 74.0, fat: 8.0, serving: '100g', category: 'Snack' },
  '8000430200005': { name: 'Grana Padano Käse',                      brand: 'Grana Padano',  calories: 384, protein: 33.0, carbs: 0.0, fat: 28.0, serving: '100g', category: 'Milch & Milchprodukte' },

  // ═══════════════════════════════════════════════════════════════
  // FRANKREICH (häufige FR Produkte)
  // ═══════════════════════════════════════════════════════════════

  '3250391673007': { name: 'St. Hubert Omega 3 Margarine',           brand: 'St. Hubert', calories: 628, protein: 0.5, carbs: 0.5, fat: 69.0, serving: '100g', category: 'Aufstrich' },
  '3560070462506': { name: 'Bonne Maman Konfitüre Erdbeere',         brand: 'Bonne Maman', calories: 249, protein: 0.5, carbs: 62.0, fat: 0.0, serving: '100g', category: 'Aufstrich' },
  '3560070462513': { name: 'Bonne Maman Konfitüre Aprikose',         brand: 'Bonne Maman', calories: 249, protein: 0.5, carbs: 62.0, fat: 0.0, serving: '100g', category: 'Aufstrich' },
  '3274080005003': { name: 'Evian Mineralwasser 500ml',              brand: 'Evian',       calories: 0,   protein: 0.0, carbs: 0.0, fat: 0.0, serving: '100ml', category: 'Getränk' },

  // ══ TIEFKÜHLPRODUKTE ══════════════════════════════════════════

  // Dr. Oetker Pizza
  '4001724028015': { name: 'Dr. Oetker Ristorante Pizza Mozzarella',    brand: 'Dr. Oetker', calories: 237, protein: 10.5, carbs: 29.5, fat: 8.5,  serving: '100g', category: 'Tiefkühl' },
  '4001724028022': { name: 'Dr. Oetker Ristorante Pizza Salami',        brand: 'Dr. Oetker', calories: 255, protein: 11.0, carbs: 29.0, fat: 10.5, serving: '100g', category: 'Tiefkühl' },
  '4001724028039': { name: 'Dr. Oetker Ristorante Pizza Funghi',        brand: 'Dr. Oetker', calories: 232, protein: 10.0, carbs: 29.5, fat: 8.0,  serving: '100g', category: 'Tiefkühl' },
  '4001724028046': { name: 'Dr. Oetker Ristorante Pizza Vegetale',      brand: 'Dr. Oetker', calories: 228, protein: 9.5,  carbs: 30.0, fat: 7.5,  serving: '100g', category: 'Tiefkühl' },
  '4001724028053': { name: 'Dr. Oetker Ristorante Pizza Tonno',         brand: 'Dr. Oetker', calories: 240, protein: 11.5, carbs: 29.0, fat: 9.0,  serving: '100g', category: 'Tiefkühl' },
  '4001724028060': { name: 'Dr. Oetker Big Pizza Schinken',             brand: 'Dr. Oetker', calories: 258, protein: 12.0, carbs: 29.5, fat: 10.5, serving: '100g', category: 'Tiefkühl' },
  '4001724028077': { name: 'Dr. Oetker Big Pizza Peperoni',             brand: 'Dr. Oetker', calories: 262, protein: 11.5, carbs: 29.5, fat: 11.0, serving: '100g', category: 'Tiefkühl' },

  // Wagner Pizza (DE)
  '4009233100001': { name: 'Wagner Steinofenpizza Salami',               brand: 'Wagner', calories: 252, protein: 11.0, carbs: 31.5, fat: 8.5,  serving: '100g', category: 'Tiefkühl' },
  '4009233100018': { name: 'Wagner Steinofenpizza Schinken',             brand: 'Wagner', calories: 248, protein: 11.5, carbs: 31.0, fat: 8.0,  serving: '100g', category: 'Tiefkühl' },
  '4009233100025': { name: 'Wagner Steinofenpizza Mozzarella',           brand: 'Wagner', calories: 243, protein: 10.5, carbs: 31.5, fat: 7.5,  serving: '100g', category: 'Tiefkühl' },
  '4009233100032': { name: 'Wagner Pizza Big City NYC Pepperoni',        brand: 'Wagner', calories: 268, protein: 12.0, carbs: 29.5, fat: 11.0, serving: '100g', category: 'Tiefkühl' },

  // iglo (DE/AT)
  '4003015110001': { name: 'iglo Fischstäbchen',                        brand: 'iglo',   calories: 195, protein: 11.5, carbs: 18.5, fat: 8.0,  serving: '100g', category: 'Tiefkühl' },
  '4003015110018': { name: 'iglo Backfisch',                            brand: 'iglo',   calories: 218, protein: 10.5, carbs: 21.5, fat: 9.5,  serving: '100g', category: 'Tiefkühl' },
  '4003015110025': { name: 'iglo Schlemmerfilet à la Bordelaise',       brand: 'iglo',   calories: 198, protein: 12.5, carbs: 13.0, fat: 10.5, serving: '100g', category: 'Tiefkühl' },
  '4003015110032': { name: 'iglo Rahmspinat',                           brand: 'iglo',   calories: 73,  protein: 3.5,  carbs: 3.5,  fat: 5.0,  serving: '100g', category: 'Tiefkühl' },
  '4003015110049': { name: 'iglo Gemüse-Ideen Erbsen & Möhren',        brand: 'iglo',   calories: 58,  protein: 3.5,  carbs: 8.5,  fat: 0.5,  serving: '100g', category: 'Tiefkühl' },
  '4003015110056': { name: 'iglo Chicken Nuggets',                      brand: 'iglo',   calories: 228, protein: 14.0, carbs: 17.5, fat: 11.0, serving: '100g', category: 'Tiefkühl' },

  // Findus (FR/EU)
  '3222473630001': { name: 'Findus Fischstäbchen',                      brand: 'Findus', calories: 185, protein: 12.0, carbs: 17.5, fat: 7.0,  serving: '100g', category: 'Tiefkühl' },
  '3222473630018': { name: 'Findus Crunchy Chicken',                    brand: 'Findus', calories: 220, protein: 14.5, carbs: 16.0, fat: 10.5, serving: '100g', category: 'Tiefkühl' },
  '3222473630025': { name: 'Findus Épinards à la crème',                brand: 'Findus', calories: 68,  protein: 3.0,  carbs: 3.5,  fat: 4.5,  serving: '100g', category: 'Tiefkühl' },

  // McCain / Pommes (DE/EU)
  '5010228000001': { name: 'McCain Pommes Frites Classic',              brand: 'McCain', calories: 165, protein: 2.5, carbs: 24.5, fat: 6.5,  serving: '100g', category: 'Tiefkühl' },
  '5010228000018': { name: 'McCain Smiles',                             brand: 'McCain', calories: 175, protein: 2.5, carbs: 26.5, fat: 6.5,  serving: '100g', category: 'Tiefkühl' },
  '5010228000025': { name: 'McCain Kroketten',                          brand: 'McCain', calories: 178, protein: 2.5, carbs: 25.0, fat: 7.0,  serving: '100g', category: 'Tiefkühl' },
  '5010228000032': { name: 'McCain Oven Chips',                         brand: 'McCain', calories: 155, protein: 2.0, carbs: 23.5, fat: 5.5,  serving: '100g', category: 'Tiefkühl' },
  '5010228000049': { name: 'McCain Wedges',                             brand: 'McCain', calories: 162, protein: 2.5, carbs: 24.0, fat: 6.0,  serving: '100g', category: 'Tiefkühl' },

  // TK Gemüse
  '4056489300001': { name: 'Lidl TK Erbsen',                            brand: 'Freshona', calories: 74,  protein: 5.5, carbs: 11.0, fat: 0.5, serving: '100g', category: 'Tiefkühl' },
  '4056489300018': { name: 'Lidl TK Brokkoli',                          brand: 'Freshona', calories: 32,  protein: 3.5, carbs: 3.5,  fat: 0.5, serving: '100g', category: 'Tiefkühl' },
  '4056489300025': { name: 'Lidl TK Rahmspinat',                        brand: 'Freshona', calories: 68,  protein: 3.0, carbs: 3.0,  fat: 4.5, serving: '100g', category: 'Tiefkühl' },
  '4056489300032': { name: 'Lidl TK Blumenkohl',                        brand: 'Freshona', calories: 28,  protein: 2.5, carbs: 3.5,  fat: 0.5, serving: '100g', category: 'Tiefkühl' },
  '7610807050003': { name: 'Migros TK Beeren-Mix',                      brand: 'Migros',   calories: 48,  protein: 1.0, carbs: 10.5, fat: 0.5, serving: '100g', category: 'Tiefkühl' },
  '7610807050010': { name: 'Migros TK Erdbeeren',                       brand: 'Migros',   calories: 32,  protein: 0.7, carbs: 7.0,  fat: 0.5, serving: '100g', category: 'Tiefkühl' },
  '7610807050027': { name: 'Migros TK Himbeeren',                       brand: 'Migros',   calories: 34,  protein: 1.0, carbs: 6.0,  fat: 0.5, serving: '100g', category: 'Tiefkühl' },

  // Rösti (CH spezifisch)
  '7610807060002': { name: 'Migros Rösti',                              brand: 'Migros',   calories: 115, protein: 2.0, carbs: 18.5, fat: 3.5,  serving: '100g', category: 'Tiefkühl' },
  '7610807060019': { name: 'Coop Rösti',                                brand: 'Coop',     calories: 118, protein: 2.0, carbs: 19.0, fat: 3.5,  serving: '100g', category: 'Tiefkühl' },

  // Chicken Nuggets / Burger
  '5052012000001': { name: 'Birds Eye Chicken Nuggets',                  brand: 'Birds Eye', calories: 222, protein: 13.5, carbs: 17.5, fat: 11.0, serving: '100g', category: 'Tiefkühl' },
  '5052012000018': { name: 'Birds Eye Fischstäbchen',                   brand: 'Birds Eye', calories: 188, protein: 12.0, carbs: 18.0, fat: 7.0,  serving: '100g', category: 'Tiefkühl' },

  // Schnitzel / Cordon Bleu (CH/DE)
  '7613034100001': { name: 'Migros Poulet Schnitzel',                   brand: 'Migros',   calories: 165, protein: 20.5, carbs: 7.5,  fat: 5.5,  serving: '100g', category: 'Tiefkühl' },
  '7613269100001': { name: 'Coop Poulet Cordon Bleu',                   brand: 'Coop',     calories: 215, protein: 16.5, carbs: 10.5, fat: 12.0, serving: '100g', category: 'Tiefkühl' },
  '4056489400001': { name: 'Lidl Schnitzel Paniert',                    brand: 'Lidl',     calories: 205, protein: 15.5, carbs: 12.0, fat: 11.0, serving: '100g', category: 'Tiefkühl' },

  // Fertiggerichte TK
  '4001724050001': { name: 'Dr. Oetker Lasagne Bolognese',              brand: 'Dr. Oetker', calories: 118, protein: 6.5,  carbs: 12.5, fat: 4.5,  serving: '100g', category: 'Tiefkühl' },
  '4009233200001': { name: 'Wagner Gustavo Gusto Pizza Truffle',        brand: 'Gustavo Gusto', calories: 265, protein: 11.5, carbs: 28.5, fat: 11.5, serving: '100g', category: 'Tiefkühl' },
  '4009233200018': { name: 'Wagner Gustavo Gusto Pizza Diavolo',        brand: 'Gustavo Gusto', calories: 272, protein: 12.0, carbs: 28.0, fat: 12.0, serving: '100g', category: 'Tiefkühl' },

  // ══ FLEISCH & WURST ═══════════════════════════════════════════

  // Aufschnitt DE/CH
  '7613034200001': { name: 'Migros Kochschinken',                       brand: 'Migros', calories: 95,  protein: 16.5, carbs: 1.0,  fat: 2.5,  serving: '100g', category: 'Fleisch & Wurst' },
  '7613034200018': { name: 'Migros Cervelat',                           brand: 'Migros', calories: 285, protein: 15.5, carbs: 1.5,  fat: 24.5, serving: '100g', category: 'Fleisch & Wurst' },
  '7613034200025': { name: 'Migros Lyoner',                             brand: 'Migros', calories: 248, protein: 14.0, carbs: 2.0,  fat: 21.0, serving: '100g', category: 'Fleisch & Wurst' },
  '7613269200001': { name: 'Coop Kochschinken',                         brand: 'Coop',   calories: 92,  protein: 16.5, carbs: 1.0,  fat: 2.0,  serving: '100g', category: 'Fleisch & Wurst' },
  '7613269200018': { name: 'Coop Roastbeef',                            brand: 'Coop',   calories: 115, protein: 22.0, carbs: 0.5,  fat: 2.5,  serving: '100g', category: 'Fleisch & Wurst' },
  '7613269200025': { name: 'Coop Salami',                               brand: 'Coop',   calories: 398, protein: 23.5, carbs: 1.0,  fat: 33.5, serving: '100g', category: 'Fleisch & Wurst' },
  '4311501100001': { name: 'REWE Kochschinken',                         brand: 'REWE',   calories: 94,  protein: 16.5, carbs: 1.5,  fat: 2.5,  serving: '100g', category: 'Fleisch & Wurst' },
  '4056489500001': { name: 'Lidl Kochschinken',                         brand: 'Lidl',   calories: 95,  protein: 16.5, carbs: 1.5,  fat: 2.5,  serving: '100g', category: 'Fleisch & Wurst' },
  '4056489500018': { name: 'Lidl Salami',                               brand: 'Lidl',   calories: 398, protein: 23.0, carbs: 1.0,  fat: 34.0, serving: '100g', category: 'Fleisch & Wurst' },

  // Würstchen
  '7613034200032': { name: 'Migros Wienerli',                           brand: 'Migros', calories: 268, protein: 12.5, carbs: 1.5,  fat: 23.5, serving: '100g', category: 'Fleisch & Wurst' },
  '7613034200049': { name: 'Migros Bratwurst',                          brand: 'Migros', calories: 285, protein: 13.0, carbs: 2.0,  fat: 25.0, serving: '100g', category: 'Fleisch & Wurst' },
  '4311501100018': { name: 'REWE Wiener Würstchen',                     brand: 'REWE',   calories: 268, protein: 12.5, carbs: 1.5,  fat: 23.5, serving: '100g', category: 'Fleisch & Wurst' },
  '9004600100001': { name: 'Ottakringer Grillwurst',                    brand: 'Österreich', calories: 310, protein: 13.0, carbs: 2.5, fat: 27.5, serving: '100g', category: 'Fleisch & Wurst' },

  // Poulet / Chicken (CH)
  '7613034200056': { name: 'Migros Pouletbrust',                        brand: 'Migros', calories: 110, protein: 23.5, carbs: 0.0,  fat: 1.5,  serving: '100g', category: 'Fleisch & Wurst' },
  '7613034200063': { name: 'Migros Pouletgeschnetzeltes',               brand: 'Migros', calories: 108, protein: 23.0, carbs: 0.0,  fat: 1.5,  serving: '100g', category: 'Fleisch & Wurst' },
  '7613269200032': { name: 'Coop Pouletbrust',                          brand: 'Coop',   calories: 112, protein: 23.5, carbs: 0.0,  fat: 1.8,  serving: '100g', category: 'Fleisch & Wurst' },
  '4056489500025': { name: 'Lidl Hähnchenbrust',                        brand: 'Lidl',   calories: 108, protein: 23.5, carbs: 0.5,  fat: 1.5,  serving: '100g', category: 'Fleisch & Wurst' },

  // Burger Patties
  '7613034200070': { name: 'Migros Beef Burger Patty',                  brand: 'Migros', calories: 252, protein: 18.5, carbs: 0.5,  fat: 20.0, serving: '100g', category: 'Fleisch & Wurst' },
  '7613034200087': { name: 'Migros Plant Burger',                       brand: 'Migros', calories: 218, protein: 17.0, carbs: 10.0, fat: 12.0, serving: '100g', category: 'Fleisch & Wurst' },
  '4056489500032': { name: 'Lidl Beef Burger',                          brand: 'Lidl',   calories: 258, protein: 18.0, carbs: 1.0,  fat: 20.5, serving: '100g', category: 'Fleisch & Wurst' },

  // ══ BROT & BÄCKEREI ══════════════════════════════════════════

  // Toast & Sandwichbrot
  '4001500100001': { name: "Harry's Toast",                            brand: "Harry's", calories: 264, protein: 8.5, carbs: 50.5, fat: 3.0, serving: '100g', category: 'Brot & Backwaren' },
  '4001500100018': { name: "Harry's Vollkorntoast",                    brand: "Harry's", calories: 242, protein: 9.5, carbs: 44.5, fat: 2.5, serving: '100g', category: 'Brot & Backwaren' },
  '4001500100025': { name: "Harry's Toasties",                         brand: "Harry's", calories: 268, protein: 9.0, carbs: 51.5, fat: 3.0, serving: '100g', category: 'Brot & Backwaren' },
  '7610807070001': { name: 'Migros Sandwichbrot Weiss',                 brand: 'Migros',   calories: 261, protein: 8.0, carbs: 51.0, fat: 2.5, serving: '100g', category: 'Brot & Backwaren' },
  '7610807070018': { name: 'Migros Sandwichbrot Vollkorn',              brand: 'Migros',   calories: 245, protein: 9.5, carbs: 44.5, fat: 3.0, serving: '100g', category: 'Brot & Backwaren' },
  '7613269300001': { name: 'Coop Toast Weiss',                          brand: 'Coop',     calories: 260, protein: 8.5, carbs: 50.0, fat: 2.5, serving: '100g', category: 'Brot & Backwaren' },
  '4056489600001': { name: 'Lidl Toast Weiss',                          brand: 'Lidl',     calories: 264, protein: 8.5, carbs: 50.5, fat: 3.0, serving: '100g', category: 'Brot & Backwaren' },

  // Wraps & Tortillas
  '5015868100001': { name: 'Old El Paso Weizen Tortillas',              brand: 'Old El Paso', calories: 306, protein: 8.5, carbs: 55.5, fat: 5.0, serving: '100g', category: 'Brot & Backwaren' },
  '5015868100018': { name: 'Old El Paso Vollkorn Tortillas',            brand: 'Old El Paso', calories: 295, protein: 9.5, carbs: 51.0, fat: 5.5, serving: '100g', category: 'Brot & Backwaren' },
  '7610807070025': { name: 'Migros Wraps Weizen',                       brand: 'Migros',   calories: 305, protein: 8.5, carbs: 55.0, fat: 5.0, serving: '100g', category: 'Brot & Backwaren' },

  // Knäckebrot (erweitert)
  '4056489100137': { name: 'Wasa Knäckebrot Rustikant',                 brand: 'Wasa', calories: 342, protein: 12.5, carbs: 63.5, fat: 3.5, serving: '100g', category: 'Brot & Backwaren' },

  // Proteinbrot
  '4018400600001': { name: 'Foodspring Protein Bread',                  brand: 'Foodspring', calories: 249, protein: 33.0, carbs: 12.0, fat: 6.5, serving: '100g', category: 'Brot & Backwaren' },
  '4056489600018': { name: 'Lidl Proteinbrot',                          brand: 'Lidl',   calories: 235, protein: 20.0, carbs: 18.5, fat: 7.5, serving: '100g', category: 'Brot & Backwaren' },

  // ══ SAUCEN & PASTA CONVENIENCE ════════════════════════════════

  // Barilla Saucen
  '8076800200001': { name: 'Barilla Basilikum Tomatensauce',             brand: 'Barilla', calories: 52,  protein: 1.5, carbs: 8.0,  fat: 1.5, serving: '100g', category: 'Hauptgericht' },
  '8076800200018': { name: 'Barilla Bolognese Sauce',                    brand: 'Barilla', calories: 78,  protein: 4.5, carbs: 7.0,  fat: 3.5, serving: '100g', category: 'Hauptgericht' },
  '8076800200025': { name: 'Barilla Arrabiata Sauce',                    brand: 'Barilla', calories: 55,  protein: 1.5, carbs: 8.5,  fat: 1.5, serving: '100g', category: 'Hauptgericht' },

  // De Cecco Pasta (IT)
  '8001250100001': { name: 'De Cecco Spaghetti No.12',                   brand: 'De Cecco', calories: 353, protein: 12.5, carbs: 70.5, fat: 1.5, serving: '100g', category: 'Hauptgericht' },
  '8001250100018': { name: 'De Cecco Penne Rigate',                      brand: 'De Cecco', calories: 353, protein: 12.5, carbs: 70.5, fat: 1.5, serving: '100g', category: 'Hauptgericht' },
  '8001250100025': { name: 'De Cecco Fusilli',                           brand: 'De Cecco', calories: 353, protein: 12.5, carbs: 70.5, fat: 1.5, serving: '100g', category: 'Hauptgericht' },

  // Knorr Saucen & Fix
  '4000400300001': { name: 'Knorr Hollandaise Sauce',                    brand: 'Knorr', calories: 468, protein: 2.5, carbs: 10.5, fat: 47.0, serving: '100g', category: 'Hauptgericht' },
  '4000400300018': { name: 'Knorr Fix Schnitzel',                        brand: 'Knorr', calories: 348, protein: 11.0, carbs: 63.5, fat: 5.5, serving: '100g', category: 'Hauptgericht' },
  '4000400300025': { name: 'Knorr Veloutée Basis',                       brand: 'Knorr', calories: 425, protein: 8.5, carbs: 55.0, fat: 19.0, serving: '100g', category: 'Hauptgericht' },
  '4000400300032': { name: 'Knorr Instant Bouillon Rind',                brand: 'Knorr', calories: 245, protein: 16.5, carbs: 25.5, fat: 8.5, serving: '100g', category: 'Hauptgericht' },

  // Dolmio Saucen
  '5010024000001': { name: 'Dolmio Bolognese Sauce Original',            brand: 'Dolmio', calories: 62, protein: 2.5, carbs: 10.0, fat: 1.5, serving: '100g', category: 'Hauptgericht' },
  '5010024000018': { name: 'Dolmio Carbonara Sauce',                     brand: 'Dolmio', calories: 98, protein: 3.0, carbs: 6.5,  fat: 7.0, serving: '100g', category: 'Hauptgericht' },

  // Risotto
  '8001810100001': { name: 'Riso Scotti Risotto Classico',               brand: 'Riso Scotti', calories: 355, protein: 7.0, carbs: 79.0, fat: 0.8, serving: '100g', category: 'Hauptgericht' },
  '8001810100018': { name: 'Riso Scotti Risotto ai Funghi',              brand: 'Riso Scotti', calories: 358, protein: 7.5, carbs: 78.5, fat: 1.0, serving: '100g', category: 'Hauptgericht' },

  // ══ KAFFEEGETRÄNKE & PROTEIN DRINKS ══════════════════════════

  // Kaffeegetränke (erweitert)
  '4056489700001': { name: 'Lidl Milbona Cappuccino to go',              brand: 'Milbona', calories: 68, protein: 2.5, carbs: 10.5, fat: 1.8, serving: '100ml', category: 'Getränk' },
  '4056489700018': { name: 'Lidl Milbona Latte Macchiato to go',        brand: 'Milbona', calories: 65, protein: 2.5, carbs: 10.0, fat: 1.8, serving: '100ml', category: 'Getränk' },
  '7613034300001': { name: 'Migros Ice Coffee',                          brand: 'Migros', calories: 72, protein: 2.5, carbs: 11.2, fat: 1.8, serving: '100ml', category: 'Getränk' },
  '4000177200001': { name: 'Nescafé Gold Instant',                       brand: 'Nescafé', calories: 353, protein: 14.0, carbs: 47.0, fat: 9.0, serving: '100g', category: 'Getränk' },
  '4000177200018': { name: 'Nescafé 3in1 Classic',                       brand: 'Nescafé', calories: 455, protein: 5.5, carbs: 73.0, fat: 15.5, serving: '100g', category: 'Getränk' },

  // Protein Drinks (ready-to-drink)
  '4009233300001': { name: 'ESN Protein Shake Ready Vanilla',            brand: 'ESN',  calories: 55, protein: 8.5, carbs: 3.5, fat: 0.8, serving: '100ml', category: 'Fitness & Protein' },
  '4009233300018': { name: 'ESN Protein Shake Ready Chocolate',         brand: 'ESN',  calories: 57, protein: 8.5, carbs: 4.0, fat: 1.0, serving: '100ml', category: 'Fitness & Protein' },
  '5060343800001': { name: 'MyProtein Ready Protein Shake Vanilla',     brand: 'Myprotein', calories: 52, protein: 8.5, carbs: 3.0, fat: 0.8, serving: '100ml', category: 'Fitness & Protein' },
  '5060343800018': { name: 'MyProtein Ready Protein Shake Chocolate',   brand: 'Myprotein', calories: 55, protein: 8.5, carbs: 3.5, fat: 1.0, serving: '100ml', category: 'Fitness & Protein' },

  // Clear Whey / Protein Water
  '5060343810000': { name: 'MyProtein Clear Whey Isolate Peach',        brand: 'Myprotein', calories: 98, protein: 20.0, carbs: 1.5, fat: 0.2, serving: '100g', category: 'Fitness & Protein' },
  '5060343810017': { name: 'MyProtein Clear Whey Isolate Lemon',        brand: 'Myprotein', calories: 96, protein: 20.0, carbs: 1.2, fat: 0.2, serving: '100g', category: 'Fitness & Protein' },
  '4260426840001': { name: 'ESN Clear Iso Whey Peach',                  brand: 'ESN', calories: 94, protein: 20.5, carbs: 1.0, fat: 0.2, serving: '100g', category: 'Fitness & Protein' },
  '4260426840018': { name: 'ESN Clear Iso Whey Watermelon',             brand: 'ESN', calories: 93, protein: 20.5, carbs: 0.8, fat: 0.2, serving: '100g', category: 'Fitness & Protein' },

  // Mezzo Mix / Bionade
  '4003865100001': { name: 'Mezzo Mix Orange',                          brand: 'Coca-Cola', calories: 39, protein: 0.0, carbs: 9.8, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '4003865100018': { name: 'Bionade Holunder',                          brand: 'Bionade', calories: 22, protein: 0.0, carbs: 5.5, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '4003865100025': { name: 'Bionade Ginger-Orange',                     brand: 'Bionade', calories: 20, protein: 0.0, carbs: 5.0, fat: 0.0, serving: '100ml', category: 'Getränk' },
  '4003865100032': { name: 'Bionade Litschi',                           brand: 'Bionade', calories: 22, protein: 0.0, carbs: 5.5, fat: 0.0, serving: '100ml', category: 'Getränk' },

  // Fruit Juice
  '4056489700025': { name: 'Lidl Orangen-Direktsaft',                   brand: 'Freshona', calories: 44, protein: 0.7, carbs: 10.0, fat: 0.2, serving: '100ml', category: 'Getränk' },
  '7610807020001': { name: 'Migros Orangensaft',                        brand: 'Migros', calories: 44, protein: 0.7, carbs: 10.0, fat: 0.2, serving: '100ml', category: 'Getränk' },
  '7613269400001': { name: 'Coop Apfelsaft',                            brand: 'Coop', calories: 46, protein: 0.1, carbs: 11.0, fat: 0.1, serving: '100ml', category: 'Getränk' },
  '4001467300001': { name: 'Innocent Smoothie Mango',                   brand: 'Innocent', calories: 55, protein: 0.7, carbs: 13.0, fat: 0.2, serving: '100ml', category: 'Getränk' },
  '4001467300018': { name: 'Innocent Smoothie Beeren',                  brand: 'Innocent', calories: 52, protein: 0.7, carbs: 12.5, fat: 0.2, serving: '100ml', category: 'Getränk' },

  // ══ VEGANE PRODUKTE ═══════════════════════════════════════════

  // Beyond Meat / Impossible
  '0810113020089': { name: 'Beyond Burger Patty',                       brand: 'Beyond Meat', calories: 245, protein: 20.0, carbs: 7.0, fat: 16.0, serving: '100g', category: 'Vegan' },
  '0810113020096': { name: 'Beyond Sausage',                            brand: 'Beyond Meat', calories: 250, protein: 16.0, carbs: 8.0, fat: 18.0, serving: '100g', category: 'Vegan' },
  '0810113020102': { name: 'Beyond Mince',                              brand: 'Beyond Meat', calories: 165, protein: 18.0, carbs: 5.0, fat: 8.5,  serving: '100g', category: 'Vegan' },

  // V-Love (Migros CH)
  '7613034400001': { name: 'Migros V-Love Burger',                      brand: 'V-Love',  calories: 218, protein: 17.0, carbs: 10.0, fat: 12.0, serving: '100g', category: 'Vegan' },
  '7613034400018': { name: 'Migros V-Love Spiessli',                    brand: 'V-Love',  calories: 195, protein: 15.5, carbs: 8.5,  fat: 11.0, serving: '100g', category: 'Vegan' },
  '7613034400025': { name: 'Migros V-Love Hack',                        brand: 'V-Love',  calories: 158, protein: 17.5, carbs: 5.5,  fat: 7.5,  serving: '100g', category: 'Vegan' },

  // Garden Gourmet (Nestlé)
  '7613037000001': { name: 'Garden Gourmet Incredible Burger',          brand: 'Garden Gourmet', calories: 235, protein: 17.5, carbs: 10.0, fat: 13.0, serving: '100g', category: 'Vegan' },
  '7613037000018': { name: 'Garden Gourmet Vegane Schnitzel',           brand: 'Garden Gourmet', calories: 195, protein: 14.5, carbs: 13.5, fat: 8.5,  serving: '100g', category: 'Vegan' },
  '7613037000025': { name: 'Garden Gourmet Vegane Hackbällchen',        brand: 'Garden Gourmet', calories: 188, protein: 14.0, carbs: 12.5, fat: 8.0,  serving: '100g', category: 'Vegan' },

  // Tofu / Tempeh
  '4056489800001': { name: 'Lidl Bio Tofu Natur',                       brand: 'Bioness', calories: 118, protein: 12.5, carbs: 1.5, fat: 7.0, serving: '100g', category: 'Vegan' },
  '4056489800018': { name: 'Lidl Bio Tofu Geräuchert',                  brand: 'Bioness', calories: 145, protein: 15.0, carbs: 1.5, fat: 8.5, serving: '100g', category: 'Vegan' },
  '7613034400032': { name: 'Migros Bio Tofu Natur',                     brand: 'Migros',  calories: 118, protein: 12.5, carbs: 1.5, fat: 7.0, serving: '100g', category: 'Vegan' },

  // Vegane Milchprodukte Soja Joghurt
  '5411188200001': { name: 'Alpro Soja Joghurt Natur',                  brand: 'Alpro', calories: 50, protein: 4.5, carbs: 2.5, fat: 1.8, serving: '100g', category: 'Vegan' },
  '5411188200018': { name: 'Alpro Soja Joghurt Erdbeere',               brand: 'Alpro', calories: 78, protein: 4.0, carbs: 10.5, fat: 1.8, serving: '100g', category: 'Vegan' },
  '7394376700001': { name: 'Oatly Hafer Joghurt',                       brand: 'Oatly', calories: 72, protein: 1.5, carbs: 9.5,  fat: 2.8, serving: '100g', category: 'Vegan' },

  // ══ WEITERE SUPERMARKT EIGENMARKEN ═══════════════════════════

  // Aldi Süd / Hofer
  '4088600100001': { name: 'Aldi Joghurt Natur 3.5%',                   brand: 'Aldi',   calories: 68,  protein: 4.0, carbs: 4.8, fat: 3.5, serving: '100g', category: 'Milch & Milchprodukte' },
  '4088600100018': { name: 'Aldi Vollmilch 3.5%',                       brand: 'Aldi',   calories: 64,  protein: 3.4, carbs: 4.8, fat: 3.5, serving: '100ml', category: 'Milch & Milchprodukte' },
  '4088600100025': { name: 'Aldi Proteinjoghurt',                       brand: 'Aldi',   calories: 66,  protein: 10.0, carbs: 4.2, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '4088600100032': { name: 'Aldi Hafermilch Bio',                       brand: 'Aldi',   calories: 46,  protein: 1.0, carbs: 7.0, fat: 1.5, serving: '100ml', category: 'Getränk' },

  // Kaufland K-Classic
  '4017100100001': { name: 'K-Classic Joghurt Natur',                   brand: 'K-Classic', calories: 60, protein: 4.0, carbs: 4.5, fat: 2.5, serving: '100g', category: 'Milch & Milchprodukte' },
  '4017100100018': { name: 'K-Classic Vollmilch',                       brand: 'K-Classic', calories: 64, protein: 3.4, carbs: 4.8, fat: 3.5, serving: '100ml', category: 'Milch & Milchprodukte' },
  '4017100100025': { name: 'K-Classic Haferflocken',                    brand: 'K-Classic', calories: 368, protein: 12.5, carbs: 60.0, fat: 7.0, serving: '100g', category: 'Frühstück' },

  // Spar / Eurospar
  '9005600100001': { name: 'S-Budget Joghurt Natur',                    brand: 'Spar', calories: 58, protein: 4.0, carbs: 4.5, fat: 2.0, serving: '100g', category: 'Milch & Milchprodukte' },
  '9005600100018': { name: 'Spar Natur Pure Joghurt',                   brand: 'Spar', calories: 62, protein: 4.0, carbs: 4.6, fat: 2.3, serving: '100g', category: 'Milch & Milchprodukte' },
  '9005600100025': { name: 'Spar Vital Protein Joghurt',                brand: 'Spar', calories: 66, protein: 10.0, carbs: 4.2, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },

  // Edeka
  '4311501200001': { name: 'Edeka Joghurt Natur 3.5%',                  brand: 'Edeka', calories: 68, protein: 4.0, carbs: 4.8, fat: 3.5, serving: '100g', category: 'Milch & Milchprodukte' },
  '4311501200018': { name: 'Edeka Bio Vollmilch',                       brand: 'Edeka', calories: 64, protein: 3.4, carbs: 4.8, fat: 3.5, serving: '100ml', category: 'Milch & Milchprodukte' },

  // Carrefour (FR/ES/IT)
  '3560071000001': { name: 'Carrefour Joghurt Natur',                   brand: 'Carrefour', calories: 62, protein: 3.8, carbs: 5.0, fat: 2.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '3560071000018': { name: 'Carrefour Bio Haferdrink',                  brand: 'Carrefour', calories: 44, protein: 1.0, carbs: 6.5, fat: 1.5, serving: '100ml', category: 'Getränk' },
  '3560071000025': { name: 'Carrefour Protein Joghurt',                 brand: 'Carrefour', calories: 64, protein: 10.0, carbs: 4.0, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },

  // Mercadona (ES)
  '8480017100001': { name: 'Hacendado Arroz Grano Largo',               brand: 'Hacendado', calories: 352, protein: 7.0, carbs: 79.5, fat: 0.8, serving: '100g', category: 'Hauptgericht' },
  '8480017100018': { name: 'Hacendado Pasta Espaguetis',                brand: 'Hacendado', calories: 352, protein: 12.5, carbs: 70.0, fat: 1.5, serving: '100g', category: 'Hauptgericht' },
  '8480017100025': { name: 'Hacendado Leche Entera',                    brand: 'Hacendado', calories: 64, protein: 3.4, carbs: 4.8, fat: 3.5, serving: '100ml', category: 'Milch & Milchprodukte' },

  // REWE erweitert
  '4311501300001': { name: 'REWE Beste Wahl Haferflocken',              brand: 'REWE',   calories: 368, protein: 12.5, carbs: 60.0, fat: 7.0, serving: '100g', category: 'Frühstück' },
  '4311501300018': { name: 'REWE Beste Wahl Vollmilch',                 brand: 'REWE',   calories: 64, protein: 3.4, carbs: 4.8, fat: 3.5, serving: '100ml', category: 'Milch & Milchprodukte' },
  '4311501300025': { name: 'REWE Bio Joghurt Natur',                    brand: 'REWE',   calories: 60, protein: 4.0, carbs: 4.5, fat: 2.0, serving: '100g', category: 'Milch & Milchprodukte' },
  '4311501300032': { name: 'REWE Bio Hafermilch',                       brand: 'REWE',   calories: 46, protein: 1.1, carbs: 6.7, fat: 1.5, serving: '100ml', category: 'Getränk' },

  // ══ FITNESS EXTRAS — Pre-Workout, Creatine, BCAA ═════════════

  // Creatine
  '4260426850001': { name: 'ESN Creatine Monohydrat',                   brand: 'ESN', calories: 0,   protein: 0.0,  carbs: 0.0,  fat: 0.0, serving: '100g', category: 'Fitness & Protein' },
  '5060343850001': { name: 'MyProtein Creatine Monohydrate',            brand: 'Myprotein', calories: 0, protein: 0.0, carbs: 0.0, fat: 0.0, serving: '100g', category: 'Fitness & Protein' },
  '4260340250001': { name: 'More Nutrition Pure Creatine',              brand: 'More Nutrition', calories: 0, protein: 0.0, carbs: 0.0, fat: 0.0, serving: '100g', category: 'Fitness & Protein' },

  // Pre-Workout
  '4260426860001': { name: 'ESN Crank Pre-Workout Tropical',            brand: 'ESN', calories: 32, protein: 3.0, carbs: 3.5, fat: 0.2, serving: '100g', category: 'Fitness & Protein' },
  '5060343860001': { name: 'MyProtein Pre-Workout Impact',              brand: 'Myprotein', calories: 30, protein: 3.0, carbs: 3.0, fat: 0.2, serving: '100g', category: 'Fitness & Protein' },

  // BCAA
  '4260426870001': { name: 'ESN BCAA 4:1:1 Powder',                    brand: 'ESN', calories: 220, protein: 55.0, carbs: 0.0, fat: 0.0, serving: '100g', category: 'Fitness & Protein' },
  '4260340260001': { name: 'More Nutrition BCAA Peach',                 brand: 'More Nutrition', calories: 215, protein: 54.0, carbs: 0.5, fat: 0.0, serving: '100g', category: 'Fitness & Protein' },

  // Protein Pancakes / Oats
  '4260426880001': { name: 'ESN Protein Pancakes Blueberry',            brand: 'ESN', calories: 365, protein: 38.0, carbs: 40.0, fat: 5.5, serving: '100g', category: 'Fitness & Protein' },
  '4018400700001': { name: 'Foodspring Protein Oats Chocolate',         brand: 'Foodspring', calories: 388, protein: 24.5, carbs: 49.5, fat: 8.5, serving: '100g', category: 'Fitness & Protein' },
  '4018400700018': { name: 'Foodspring Protein Oats Banana',            brand: 'Foodspring', calories: 385, protein: 24.0, carbs: 50.0, fat: 8.0, serving: '100g', category: 'Fitness & Protein' },
  '5060343870001': { name: 'MyProtein Protein Oats Vanilla',            brand: 'Myprotein', calories: 382, protein: 23.5, carbs: 51.0, fat: 7.5, serving: '100g', category: 'Fitness & Protein' },

  // Protein Chips / Snacks
  '4260426890001': { name: 'ESN Protein Chips BBQ',                     brand: 'ESN', calories: 382, protein: 35.0, carbs: 39.5, fat: 8.5, serving: '100g', category: 'Fitness & Protein' },
  '4260426890018': { name: 'ESN Protein Chips Sour Cream',              brand: 'ESN', calories: 380, protein: 35.0, carbs: 40.0, fat: 8.0, serving: '100g', category: 'Fitness & Protein' },
  '5060614900001': { name: 'Bulk Protein Crisps BBQ',                   brand: 'Bulk', calories: 375, protein: 35.0, carbs: 38.5, fat: 8.5, serving: '100g', category: 'Fitness & Protein' },

  // Chia / Superfoods
  '4056489900001': { name: 'Lidl Bio Chiasamen',                        brand: 'Freshona', calories: 486, protein: 17.0, carbs: 42.0, fat: 31.0, serving: '100g', category: 'Fitness & Protein' },
  '7613034500001': { name: 'Migros Chiasamen Bio',                      brand: 'Migros', calories: 486, protein: 17.0, carbs: 42.0, fat: 31.0, serving: '100g', category: 'Fitness & Protein' },

  // Nuss-Produkte (häufig für Fitness)
  '7613034500018': { name: 'Migros Mandeln',                            brand: 'Migros', calories: 579, protein: 21.5, carbs: 6.5,  fat: 50.5, serving: '100g', category: 'Snack' },
  '7613034500025': { name: 'Migros Walnüsse',                           brand: 'Migros', calories: 654, protein: 14.5, carbs: 7.0,  fat: 62.5, serving: '100g', category: 'Snack' },
  '4056489900018': { name: 'Lidl Cashews',                              brand: 'Freshona', calories: 553, protein: 18.0, carbs: 30.0, fat: 42.0, serving: '100g', category: 'Snack' },
  '4056489900025': { name: 'Lidl Erdnüsse Geröstet',                    brand: 'Freshona', calories: 599, protein: 26.0, carbs: 16.0, fat: 49.5, serving: '100g', category: 'Snack' },

  // Erdnussbutter
  '5000325000001': { name: 'Whole Earth Erdnussbutter Crunchy',         brand: 'Whole Earth', calories: 616, protein: 26.5, carbs: 10.0, fat: 52.0, serving: '100g', category: 'Aufstrich' },
  '5000325000018': { name: 'Whole Earth Erdnussbutter Smooth',          brand: 'Whole Earth', calories: 612, protein: 26.5, carbs: 9.5,  fat: 51.5, serving: '100g', category: 'Aufstrich' },
  '4260340300001': { name: 'More Nutrition PB Peanut Butter',           brand: 'More Nutrition', calories: 618, protein: 28.0, carbs: 8.5, fat: 52.5, serving: '100g', category: 'Aufstrich' },
  '7613034500032': { name: 'Migros Erdnussbutter',                      brand: 'Migros', calories: 605, protein: 26.0, carbs: 11.5, fat: 50.5, serving: '100g', category: 'Aufstrich' },

  // ══ SCHWEIZ — WEITERE PRODUKTE ═══════════════════════════════

  // Migros weitere
  '7610807090001': { name: 'M-Classic Eier 10er',                       brand: 'Migros', calories: 143, protein: 12.5, carbs: 0.5, fat: 10.0, serving: '100g', category: 'Frühstück' },
  '7613034600001': { name: 'Migros Bio Joghurt Natur',                  brand: 'Migros', calories: 62, protein: 4.0, carbs: 4.5, fat: 2.5, serving: '100g', category: 'Milch & Milchprodukte' },
  '7613034600018': { name: 'Migros Quark Natur',                        brand: 'Migros', calories: 68, protein: 9.5, carbs: 4.0, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '7613034600025': { name: 'Migros Hüttenkäse',                         brand: 'Migros', calories: 82, protein: 12.0, carbs: 2.5, fat: 2.5, serving: '100g', category: 'Milch & Milchprodukte' },

  // Coop weitere
  '7613269500001': { name: 'Coop Naturaplan Bio Joghurt',               brand: 'Coop', calories: 62, protein: 4.0, carbs: 4.5, fat: 2.5, serving: '100g', category: 'Milch & Milchprodukte' },
  '7613269500018': { name: 'Coop Quark Natur',                          brand: 'Coop', calories: 68, protein: 9.5, carbs: 4.0, fat: 0.2, serving: '100g', category: 'Milch & Milchprodukte' },
  '7613269500025': { name: 'Coop Free From Joghurt Soja',               brand: 'Coop', calories: 52, protein: 4.5, carbs: 2.5, fat: 1.8, serving: '100g', category: 'Vegan' },

  // Twinner / Delicorn (CH Eigenmarken)
  '7610807090018': { name: 'Migros Bio Granola',                        brand: 'Migros', calories: 428, protein: 8.5, carbs: 64.0, fat: 15.5, serving: '100g', category: 'Frühstück' },
  '7613034600032': { name: 'Migros Protein Granola',                    brand: 'Migros', calories: 415, protein: 18.5, carbs: 52.0, fat: 12.5, serving: '100g', category: 'Frühstück' },
  '7613269500032': { name: 'Coop Bio Granola',                          brand: 'Coop', calories: 430, protein: 8.0, carbs: 64.5, fat: 15.5, serving: '100g', category: 'Frühstück' },

  // CH-spezifische Snacks
  '7614400100001': { name: 'Kambly Elmer Chöpfli',                      brand: 'Kambly', calories: 448, protein: 8.5, carbs: 63.0, fat: 18.5, serving: '100g', category: 'Snack' },
  '7614400100018': { name: 'Kambly Petit-Beurre',                       brand: 'Kambly', calories: 435, protein: 7.0, carbs: 72.0, fat: 12.5, serving: '100g', category: 'Snack' },

};

function lookupEU(barcode) {
  const product = EU_DB[barcode.trim()];
  if (!product) return null;
  return { ...product, source: 'EU-Datenbank' };
}


function lookupCH(barcode) {
  const product = CH_DB[barcode.trim()];
  if (!product) return null;
  return { ...product, source: 'CH-Datenbank' };
}

// ─── Open Food Facts API ────────────────────────────────────────────────────
const OFF_USER_AGENT = 'BuildUp Fitness App - Contact: fatlind@buildup.app';

async function fetchOFF(barcode) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_de,brands,nutriments,serving_size`,
      {
        signal: controller.signal,
        headers: { 'User-Agent': OFF_USER_AGENT },
      }
    );
    clearTimeout(timeout);

    // Validierung: kein HTML, muss JSON sein
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json')) {
      return { status: 'api_error', msgKey: 'scanner.api_unavailable' };
    }
    if (res.status === 429) {
      return { status: 'rate_limit', msgKey: 'scanner.rate_limit' };
    }
    if (!res.ok) {
      return { status: 'api_error', message: 'Serverfehler. Bitte nochmals versuchen.' };
    }

    const data = await res.json();

    if (data.status !== 1 || !data.product) {
      return { status: 'not_found' };
    }

    const p = data.product;
    const n = p.nutriments || {};
    const kcal = n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0;

    // Makros auf 1 Dezimalstelle
    return {
      status: 'found',
      product: {
        name: p.product_name_de || p.product_name || 'Unbekanntes Produkt',
        brand: p.brands || '',
        serving: p.serving_size || '100g',
        calories: Math.round(kcal * 10) / 10,
        protein:  Math.round((n.proteins_100g ?? 0) * 10) / 10,
        carbs:    Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
        fat:      Math.round((n.fat_100g ?? 0) * 10) / 10,
        category: 'Gescannt',
        source: 'OpenFoodFacts',
      },
    };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      return { status: 'timeout', msgKey: 'scanner.timeout' };
    }
    return { status: 'api_error', msgKey: 'scanner.network_error' };
  }
}

// ─── Haupt-Lookup: PLU → CH-DB → OFF → not found ───────────────────────────
async function lookupBarcode(barcode) {
  const raw = barcode.trim();

  // Normalize barcode — preserve leading zeros, strip spaces
  const code = raw.replace(/\s/g, '');

  // 1. PLU (Frische Produkte — 4-5 Stellen)
  if (/^\d{4,5}$/.test(code)) {
    const plu = lookupPLU(code);
    if (plu) return { status: 'found', product: plu };
  }

  // 2. CH-Datenbank (Schweizer Eigenmarken)
  const ch = lookupCH(code);
  if (ch) return { status: 'found', product: ch };

  // 3. EU-Datenbank (DE/AT/FR/IT/ES + Fitness-Brands)
  const eu = lookupEU(code);
  if (eu) return { status: 'found', product: eu };

  // 4. Open Food Facts — mit EAN-8 → EAN-13 Fallback
  const offResult = await fetchOFF(code);
  if (offResult.status === 'found') return offResult;

  // 5. Fallback: EAN-8 mit führender 0 versuchen (z.B. 40084310 → 040084310)
  if (code.length === 8) {
    const padded = '0' + code;
    const offPadded = await fetchOFF(padded);
    if (offPadded.status === 'found') return offPadded;
  }

  // 6. Fallback: UPC-A (12-stellig) mit führender 0 → EAN-13
  if (code.length === 12) {
    const ean13 = '0' + code;
    const local = lookupCH(ean13) || lookupEU(ean13);
    if (local) return { status: 'found', product: local };
    const offEan13 = await fetchOFF(ean13);
    if (offEan13.status === 'found') return offEan13;
  }

  return offResult; // not_found or error
}

// ─── UI Komponente ──────────────────────────────────────────────────────────
export default function BarcodeScanner({ onAddFood, onClose }) {
  const { t } = useI18n();
  const scannerRef  = useRef(null);
  const isMounted   = useRef(true);
  const [phase, setPhase]       = useState('scanning'); // scanning | loading | found | notfound | error | manual
  const [product, setProduct]   = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [manual, setManual]     = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });

  useEffect(() => {
    isMounted.current = true;
    // FIX 2: Lock body scroll while scanner is open
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    startScanner();

    return () => {
      isMounted.current = false;
      // FIX 2: Restore scroll on unmount
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      // FIX 1: Clean stop on unmount
      const sc = scannerRef.current;
      if (sc) {
        sc.stop().catch(() => {}).finally(() => {
          try { sc.clear(); } catch {}
          scannerRef.current = null;
        });
      }
    };
  }, []);

  function startScanner() {
    const scanner = new Html5Qrcode('barcode-reader');
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 160 } },
        async (code) => {
          if (!isMounted.current) return;
          try { await scanner.stop(); } catch {}
          if (!isMounted.current) return;
          setPhase('loading');
          const result = await lookupBarcode(code);
          if (!isMounted.current) return;

          if (result.status === 'found') {
            setProduct(result.product);
            setPhase('found');
          } else if (result.status === 'not_found') {
            setPhase('notfound');
          } else {
            // api_error | rate_limit | timeout
            setErrorMsg(result.msgKey ? t(result.msgKey) : (result.message || t('scanner.api_unavailable')));
            setPhase('error');
          }
        },
        () => {} // Kein Fehler bei jedem nicht-erkannten Frame
      )
      .then(() => {})
      .catch(() => {
        if (!isMounted.current) return;
        setErrorMsg(t('scanner.camera_error'));
        setPhase('error');
      });
  }

  function addToLog() {
    if (!product) return;
    onAddFood({
      id:       Date.now(),
      name:     product.brand ? `${product.name} (${product.brand})` : product.name,
      category: product.category || 'Gescannt',
      serving:  product.serving || '100g',
      calories: product.calories,
      protein:  product.protein,
      carbs:    product.carbs,
      fat:      product.fat,
    });
    onClose();
  }

  function addManual() {
    if (!manual.name || !manual.calories) return;
    onAddFood({
      id:       Date.now(),
      name:     manual.name,
      category: 'Manuell',
      serving:  '100g',
      calories: parseFloat(manual.calories) || 0,
      protein:  parseFloat(manual.protein)  || 0,
      carbs:    parseFloat(manual.carbs)    || 0,
      fat:      parseFloat(manual.fat)      || 0,
    });
    onClose();
  }

  function rescan() {
    setProduct(null);
    setErrorMsg('');
    setPhase('scanning');
    const sc = scannerRef.current;
    if (sc) {
      sc.stop().catch(() => {}).finally(() => {
        try { sc.clear(); } catch {}
        scannerRef.current = null;
        if (isMounted.current) setTimeout(() => startScanner(), 150);
      });
    } else {
      setTimeout(() => startScanner(), 150);
    }
  }

  const sourceLabel = {
    'PLU': t('scanner.source_plu'),
    'CH-Datenbank': t('scanner.source_ch'),
    'OpenFoodFacts': t('scanner.source_off'),
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-inner">
            <ScanLine size={20} color="var(--green)" />
            <div>
              <h2 className="modal-title">Barcode scannen</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                {phase === 'scanning' && t('scanner.aim')}
                {phase === 'loading'  && t('scanner.loading')}
                {phase === 'found'    && t('scanner.found')}
                {phase === 'notfound' && t('scanner.not_found_title')}
                {phase === 'error'    && t('scanner.error_title')}
                {phase === 'manual'   && t('scanner.manual_title')}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* Scanner View */}
          {(phase === 'scanning' || phase === 'loading') && (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', marginBottom: 12 }}>
              {/* Camera feed */}
              <div id="barcode-reader" style={{ width: '100%' }} />

              {/* Scan overlay — frame + line */}
              {phase === 'scanning' && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                }}>
                  {/* Dark vignette top/bottom */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.45) 100%)',
                  }} />

                  {/* Barcode frame — landscape, corner-only style */}
                  <div style={{
                    position: 'relative',
                    width: '82%',
                    height: 100,
                  }}>
                    {/* Corner TL */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: 22, height: 22,
                      borderTop: '2px solid var(--green)', borderLeft: '2px solid var(--green)',
                      borderRadius: '2px 0 0 0',
                      filter: 'drop-shadow(0 0 4px var(--green))',
                    }} />
                    {/* Corner TR */}
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 22, height: 22,
                      borderTop: '2px solid var(--green)', borderRight: '2px solid var(--green)',
                      borderRadius: '0 2px 0 0',
                      filter: 'drop-shadow(0 0 4px var(--green))',
                    }} />
                    {/* Corner BL */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: 22, height: 22,
                      borderBottom: '2px solid var(--green)', borderLeft: '2px solid var(--green)',
                      borderRadius: '0 0 0 2px',
                      filter: 'drop-shadow(0 0 4px var(--green))',
                    }} />
                    {/* Corner BR */}
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22,
                      borderBottom: '2px solid var(--green)', borderRight: '2px solid var(--green)',
                      borderRadius: '0 0 2px 0',
                      filter: 'drop-shadow(0 0 4px var(--green))',
                    }} />

                    {/* Scan line */}
                    <div style={{
                      position: 'absolute', left: 4, right: 4,
                      height: 1,
                      background: 'linear-gradient(to right, transparent, var(--green), transparent)',
                      opacity: 0.7,
                      animation: 'scanLine 2s ease-in-out infinite',
                      top: '50%',
                    }} />
                  </div>
                </div>
              )}

              {/* Loading overlay */}
              {phase === 'loading' && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: 'rgba(8,8,8,0.85)',
                  backdropFilter: 'blur(4px)',
                }}>
                  <div style={{
                    width: 36, height: 36, border: '2.5px solid rgba(34,197,94,0.2)',
                    borderTop: '2.5px solid var(--green)', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                </div>
              )}
            </div>
          )}

          {/* Hint text under scanner */}
          {phase === 'scanning' && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {t('scanner.aim')}
              </div>
            </div>
          )}

          {/* Gefunden */}
          {phase === 'found' && product && (
            <div style={{ animation: 'slideUpFade 0.25s ease both' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                padding: '8px 12px', borderRadius: 8,
                background: 'var(--green-glow)', border: '1px solid var(--border-active)',
              }}>
                <CheckCircle2 size={14} color="var(--green)" />
                <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
                  {sourceLabel[product.source] || product.source}
                  {product.isBio && ' · Bio'}
                </span>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                  {product.name}
                </div>
                {product.brand && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{product.brand}</div>
                )}
              </div>

              {/* Makros */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16,
              }}>
                {[
                  { label: t('scanner.kcal'), value: product.calories, unit: 'kcal', color: 'var(--green)' },
                  { label: 'Protein',  value: product.protein,  unit: 'g',    color: 'var(--red)' },
                  { label: 'Carbs',    value: product.carbs,    unit: 'g',    color: 'var(--orange)' },
                  { label: 'Fett',     value: product.fat,      unit: 'g',    color: 'var(--yellow)' },
                ].map(m => (
                  <div key={m.label} style={{
                    background: 'var(--bg-card-2)', borderRadius: 10, padding: '10px 8px',
                    textAlign: 'center', border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: m.color }}>
                      {m.value}<span style={{ fontSize: 10, fontWeight: 400 }}>{m.unit}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16, textAlign: 'center' }}>
                {t('scanner.per_100g').replace('{serving}', product.serving)}
              </div>

              <button className="btn btn-primary" onClick={addToLog}
                style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}>
                <CheckCircle2 size={15} /> Zum Tagesprotokoll hinzufügen
              </button>
              <button className="btn btn-ghost" onClick={rescan}
                style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
                Nochmals scannen
              </button>
            </div>
          )}

          {/* Nicht gefunden */}
          {phase === 'notfound' && (
            <div style={{ textAlign: 'center', padding: '8px 0', animation: 'slideUpFade 0.25s ease both' }}>
              <AlertCircle size={38} color="var(--text-muted)" strokeWidth={1.2} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                Produkt nicht in der Datenbank
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
                Dieses Produkt ist noch nicht erfasst. Du kannst es manuell hinzufügen.
              </div>
              <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                <button className="btn btn-primary" onClick={() => setPhase('manual')}
                  style={{ justifyContent: 'center' }}>
                  <Edit3 size={14} /> Manuell eingeben
                </button>
                <button className="btn btn-secondary" onClick={rescan}
                  style={{ justifyContent: 'center' }}>
                  Nochmals scannen
                </button>
              </div>
            </div>
          )}

          {/* API Fehler */}
          {phase === 'error' && (
            <div style={{ textAlign: 'center', padding: '8px 0', animation: 'slideUpFade 0.25s ease both' }}>
              <Wifi size={38} color="var(--text-muted)" strokeWidth={1.2} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                Verbindungsproblem
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
                {errorMsg}
              </div>
              <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                <button className="btn btn-primary" onClick={rescan}
                  style={{ justifyContent: 'center' }}>
                  Nochmals versuchen
                </button>
                <button className="btn btn-secondary" onClick={() => setPhase('manual')}
                  style={{ justifyContent: 'center' }}>
                  <Edit3 size={14} /> Manuell eingeben
                </button>
              </div>
            </div>
          )}

          {/* Manuell */}
          {phase === 'manual' && (
            <div style={{ animation: 'slideUpFade 0.25s ease both' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Gib die Nährwerte pro 100g ein.
                </div>
                {[
                  { key: 'name',     label: t('scanner.product_name'),  type: 'text',   required: true },
                  { key: 'calories', label: 'Kalorien (kcal)', type: 'number', required: true },
                  { key: 'protein',  label: 'Protein (g)',  type: 'number', required: false },
                  { key: 'carbs',    label: 'Kohlenhydrate (g)', type: 'number', required: false },
                  { key: 'fat',      label: 'Fett (g)',     type: 'number', required: false },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>
                      {f.label}{f.required && ' *'}
                    </label>
                    <input
                      type={f.type}
                      className="form-input"
                      placeholder={f.key === 'name' ? 'z.B. Coop Joghurt Natur' : '0'}
                      value={manual[f.key]}
                      onChange={e => setManual(m => ({ ...m, [f.key]: e.target.value }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                ))}
              </div>
              <button
                className="btn btn-primary"
                onClick={addManual}
                disabled={!manual.name || !manual.calories}
                style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}>
                <CheckCircle2 size={15} /> Hinzufügen
              </button>
              <button className="btn btn-ghost" onClick={rescan}
                style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
                Zurück zum Scanner
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
