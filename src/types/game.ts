export type Lane = -1 | 0 | 1;

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';

export type PowerUpType = 'magnet' | 'jetpack' | 'sneakers' | 'multiplier' | 'mystery_box' | 'letter' | 'shield';

export interface ActivePowerUp {
  type: PowerUpType;
  duration: number;
  timeLeft: number;
  label?: string;
}

export type ObstacleType = 
  | 'low_barrier'    // Jump over
  | 'high_barrier'   // Roll/slide under
  | 'train_stopped'  // Solid stationary train block or ramp
  | 'train_moving'   // Coming towards player
  | 'traffic_light'  // Overhead pillar / obstacle
  | 'ramp_train';    // Train with climbable ramp in front

export interface ObstacleData {
  id: string;
  type: ObstacleType;
  lane: Lane;
  z: number;
  length?: number;
  height?: number;
  hasRamp?: boolean;
  speed?: number; // for moving trains
}

export interface CoinData {
  id: string;
  lane: Lane;
  y: number; // height (e.g. 0.8 for ground, 2.5 for train roof or jumping arc)
  z: number;
  collected?: boolean;
}

export interface PowerUpItemData {
  id: string;
  type: PowerUpType;
  lane: Lane;
  y: number;
  z: number;
  collected?: boolean;
}

export interface ChunkData {
  id: number;
  zStart: number;
  length: number;
  obstacles: ObstacleData[];
  coins: CoinData[];
  powerUps: PowerUpItemData[];
}

export interface PlayerStats {
  score: number;
  highScore: number;
  coins: number;
  totalCoins: number;
  multiplier: number;
  distance: number;
  hoverboardsRemaining: number;
  isHoverboardActive: boolean;
  hoverboardTimeLeft: number;
  level: number;
  levelTitle: string;
  levelProgress: number; // 0 to 1
  levelTargetDistance: number;
  currentSpeed?: number;
  speedMultiplier?: number;
  speedTier?: string;
  inspectorDistanceRatio?: number;
  isInspectorAlerted?: boolean;
  mysteryBoxesCollected?: number;
  wordHuntLetters?: { letter: string; collected: boolean }[];
  keys?: number;
}

export interface LevelCelebration {
  level: number;
  title: string;
  rewardCoins: number;
}

export interface CharacterSkin {
  id: string;
  name: string;
  cost: number;
  unlocked: boolean;
  description?: string;
  characterModel?: 'classic_runner' | 'punk_skater' | 'cyber_cyborg' | 'ninja_shinobi' | 'street_graffiti' | 'alien_yutani' | 'frank_masquerade' | 'king_royal' | 'tagbot_retro' | 'surfer_brody' | 'prince_k' | 'zombie_zoe' | 'boombot_dj';
  colorScheme: {
    hoodie: number;
    pants: number;
    cap: number;
    shoes: number;
    accent: number;
    skinTone?: number;
    hairColor?: number;
    visorColor?: number;
  };
}

export interface HoverboardSkin {
  id: string;
  name: string;
  cost: number;
  unlocked: boolean;
  color: number;
  trailColor: string;
  speedBoostPercent: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardCoins: number;
  completed: boolean;
  claimed: boolean;
  type: 'score' | 'coins' | 'jump' | 'slide' | 'distance';
}

export type EnvironmentTheme = 'tokyo_day' | 'neon_night' | 'sunset_rails' | 'rio_beach' | 'cairo_dunes';
 
export interface RunRecord {
  id: string;
  score: number;
  distance: number;
  coins: number;
  characterName: string;
  date: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  badge: 'Diamond' | 'Gold' | 'Silver' | 'Bronze';
  character: string;
  isPlayer?: boolean;
}
