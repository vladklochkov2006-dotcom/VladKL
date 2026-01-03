import { Market, MarketCategory } from '../types';

// ==========================================
// 1. CONFIGURATION & CONSTANTS
// ==========================================

const USE_REAL_API = false; 
// FIX: Хардкодимо URL, щоб уникнути помилки читання .env
const API_ENDPOINT = 'https://api.kalshi.com/v1'; 
const CACHE_DURATION_MS = 60 * 1000; 

const COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#14F195',
  DEFI: '#E91E63',
  NFT: '#9C27B0',
  POLITICS: '#FFD700',
  SPORTS: '#FF4500',
  UNKNOWN: '#888888'
};

// ==========================================
// 2. CACHING LAYER
// ==========================================

let marketsCache: Market[] | null = null;
let lastFetchTime = 0;

// ==========================================
// 3. DETERMINISTIC COORDINATE SYSTEM
// ==========================================
// Це критично важливо: Планети мають бути на тих самих місцях для одного й того ж ID.

const stringToHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

// Генератор псевдо-випадкових чисел на основі сіду (ID ринку)
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const getCategoryBasePosition = (category: string): [number, number, number] => {
  switch (category) {
    case 'BTC': return [100, 0, 0];
    case 'ETH': return [-80, 40, 40];
    case 'SOL': return [0, -100, 50];
    case 'DEFI': return [60, -60, -60];
    case 'NFT': return [-50, 80, -30];
    case 'POLITICS': return [0, 150, 0];
    case 'SPORTS': return [120, -50, 100];
    default: return [0, 0, 0];
  }
};

const generateCoordinates = (id: string, category: string): [number, number, number] => {
  const seed = stringToHash(id);
  const basePos = getCategoryBasePosition(category);
  
  // Розкид всередині "галактики" (Sector)
  const spread = 60; 
  
  // Використовуємо seededRandom замість Math.random, щоб позиція була фіксована для цього ID
  const r1 = seededRandom(seed) - 0.5;
  const r2 = seededRandom(seed + 1) - 0.5;
  const r3 = seededRandom(seed + 2) - 0.5;

  return [
    basePos[0] + r1 * spread,
    basePos[1] + r2 * spread,
    basePos[2] + r3 * spread
  ];
};

// ==========================================
// 4. DATA FETCHING & MAPPING
// ==========================================

export const getMarkets = async (): Promise<Market[]> => {
  const now = Date.now();

  // Return cached data if valid
  if (marketsCache && (now - lastFetchTime < CACHE_DURATION_MS)) {
    console.log('Returning cached markets');
    return marketsCache;
  }

  try {
    let markets: Market[] = [];

    if (USE_REAL_API) {
      markets = await fetchRealMarkets();
    } else {
      markets = await generateMockMarkets(50); // Симуляція затримки мережі
    }

    // Update Cache
    marketsCache = markets;
    lastFetchTime = now;
    
    return markets;
  } catch (error) {
    console.error("Failed to fetch markets:", error);
    // Fallback to empty or cached stale data if available
    return marketsCache || [];
  }
};

// --- REAL API IMPLEMENTATION STUB ---
const fetchRealMarkets = async (): Promise<Market[]> => {
    // Тут буде реальний fetch до твого Proxy сервера або напряму до Kalshi (якщо CORS дозволяє)
    // const response = await fetch(`${API_ENDPOINT}/markets`);
    // const rawData = await response.json();
    
    // MOCK реалізації мапінгу (заміни це на реальну структуру відповіді API)
    return []; 
};

// --- MOCK GENERATOR (Improved) ---
const generateMockMarkets = async (count: number): Promise<Market[]> => {
    // Симуляція асинхронності
    await new Promise(resolve => setTimeout(resolve, 800));

    const categories: MarketCategory[] = ['BTC', 'ETH', 'SOL', 'DEFI', 'NFT', 'POLITICS', 'SPORTS'];
    const markets: Market[] = [];

    for (let i = 0; i < count; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const id = `market-${category}-${i}`; // Стабільний ID для демо
        const coords = generateCoordinates(id, category);

        markets.push({
            id: id,
            category,
            question: getMockQuestion(category),
            volume: Math.floor(Math.random() * 1000000) + 5000,
            yesPrice: Number(Math.random().toFixed(2)),
            endDate: new Date(Date.now() + 86400000 * 5).toLocaleDateString(),
            description: "Mock market description for beta testing.",
            coordinates: coords,
            color: COLORS[category] || COLORS.UNKNOWN
        });
    }
    return markets;
};

const getMockQuestion = (cat: string) => {
    if (cat === 'POLITICS') return "Will Candidate X win?";
    if (cat === 'BTC') return "BTC > 100k in 2024?";
    return `Will ${cat} rise?`;
}

// ==========================================
// 5. UTILS
// ==========================================

export const getRankTitle = (points: number): string => {
  if (points < 100) return "Rookie Rover";
  if (points < 500) return "Star Cadet";
  if (points < 1000) return "Galactic Voyager";
  return "Cosmic Oracle";
};