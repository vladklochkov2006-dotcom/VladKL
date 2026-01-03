export type MarketCategory = 'BTC' | 'ETH' | 'SOL' | 'DEFI' | 'NFT' | 'POLITICS' | 'SPORTS';

export interface Market {
  id: string;
  question: string;
  category: MarketCategory;
  volume: number; // Used for planet size
  yesPrice: number; // Used for color/glow (greenish vs reddish)
  endDate: string;
  description: string;
  coordinates: [number, number, number]; // 3D position
  color: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  reward: number;
  type: 'explore' | 'predict';
}

export interface UserState {
  level: number;
  points: number;
  title: string;
  scannedMarkets: string[];
}