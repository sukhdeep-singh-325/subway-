import { CharacterSkin, HoverboardSkin, Mission } from '../types/game';

export const DEFAULT_CHARACTERS: CharacterSkin[] = [
  {
    id: 'jake_classic',
    name: 'Jake (Classic)',
    cost: 0,
    unlocked: true,
    description: 'The legendary subway surfer graffiti artist with street charm.',
    characterModel: 'classic_runner',
    colorScheme: {
      hoodie: 0x2266dd, // Royal blue
      pants: 0x222233, // Navy denim
      cap: 0xff3b30,   // Red cap
      shoes: 0xffffff, // White kicks
      accent: 0xffcc00, // Gold zipper
      skinTone: 0xffd3b6,
      hairColor: 0x4a2e18,
    }
  },
  {
    id: 'tricky_neon',
    name: 'Tricky (Neon)',
    cost: 4000,
    unlocked: false,
    description: 'High-octane skater girl with neon ponytail bangs and star style.',
    characterModel: 'punk_skater',
    colorScheme: {
      hoodie: 0xff007f, // Hot pink
      pants: 0x1a1a2e, // Dark
      cap: 0x00f0ff,   // Cyan
      shoes: 0x00f0ff,
      accent: 0xffd700,
      skinTone: 0xffe0bd,
      hairColor: 0xffe600,
    }
  },
  {
    id: 'lucy_punk',
    name: 'Lucy (Rebel Punk)',
    cost: 8000,
    unlocked: false,
    description: 'Biker jacket rebel with electric violet spiky hair and spiked cuffs.',
    characterModel: 'punk_skater',
    colorScheme: {
      hoodie: 0x7928ca, // Deep violet leather
      pants: 0x0f0f14, // Dark pitch jeans
      cap: 0xff0055,   // Hot crimson
      shoes: 0xff0055,
      accent: 0x00f0ff,
      skinTone: 0xffe2d1,
      hairColor: 0xbf00ff,
    }
  },
  {
    id: 'fresh_cyber',
    name: 'Fresh (Cyber)',
    cost: 15000,
    unlocked: false,
    description: 'Audiophile subway runner equipped with cyber boombox headphones.',
    characterModel: 'street_graffiti',
    colorScheme: {
      hoodie: 0x30d158, // Cyber green
      pants: 0x111111, // Stealth black
      cap: 0x30d158,
      shoes: 0x0a84ff,
      accent: 0x5e5ce6,
      skinTone: 0x8d5524,
      hairColor: 0x1c1c1c,
    }
  },
  {
    id: 'yuto_tokyo',
    name: 'Yuto (Tokyo Drip)',
    cost: 25000,
    unlocked: false,
    description: 'Harajuku streetwear icon with bucket hat and holographic spray cans.',
    characterModel: 'street_graffiti',
    colorScheme: {
      hoodie: 0xf77f00, // Sunset orange windbreaker
      pants: 0x2b2d42, // Techwear cargo
      cap: 0x06d6a0,   // Mint bucket hat
      shoes: 0xffffff,
      accent: 0xef476f,
      skinTone: 0xf7d9c4,
      hairColor: 0x2b2b2b,
    }
  },
  {
    id: 'spike_gold',
    name: 'Spike (Golden Punk)',
    cost: 40000,
    unlocked: false,
    description: 'Rock & roll punk rebel with spiked golden hair and chrome sunglasses.',
    characterModel: 'punk_skater',
    colorScheme: {
      hoodie: 0xffd700, // Pure gold
      pants: 0x3a2e12, // Dark bronze
      cap: 0xffb703,
      shoes: 0xffffff,
      accent: 0xff4500,
      skinTone: 0xfcd0a1,
      hairColor: 0xffd700,
    }
  },
  {
    id: 'volt_cyborg',
    name: 'Volt (Mecha Cyborg)',
    cost: 60000,
    unlocked: false,
    description: 'Next-generation android with holographic eye visor and arc core.',
    characterModel: 'cyber_cyborg',
    colorScheme: {
      hoodie: 0x1a2332, // Titanium alloy
      pants: 0x0b1118, // Matte carbon fiber
      cap: 0x00ffff,   // Cyan HUD visor
      shoes: 0x00ffff,
      accent: 0x00f0ff,
      skinTone: 0x8892b0,
      visorColor: 0x00ffff,
    }
  },
  {
    id: 'frank_suit',
    name: 'Frank (The Masked)',
    cost: 85000,
    unlocked: false,
    description: 'Enigmatic gentleman in a sharp tuxedo with silk crimson tie and signature rabbit masquerade mask.',
    characterModel: 'frank_masquerade',
    colorScheme: {
      hoodie: 0x151515, // Midnight tuxedo jacket
      pants: 0x181818, // Tailored dress pants
      cap: 0xfafafa,   // White rabbit mask
      shoes: 0x0a0a0a, // Polished patent leather
      accent: 0xd90429, // Crimson necktie
      skinTone: 0xf5cac3,
      hairColor: 0x222222,
    }
  },
  {
    id: 'kai_shinobi',
    name: 'Kai (Shadow Shinobi)',
    cost: 110000,
    unlocked: false,
    description: 'Midnight ninja with twin back swords, flowing scarf, and stealth wraps.',
    characterModel: 'ninja_shinobi',
    colorScheme: {
      hoodie: 0x0d0d12, // Shadow obsidian
      pants: 0x16161f, // Shinobi hakama
      cap: 0xe63946,   // Crimson ninja scarf
      shoes: 0x222222,
      accent: 0xe63946,
      skinTone: 0xffd3b6,
      visorColor: 0xffffff,
    }
  },
  {
    id: 'yutani_alien',
    name: 'Yutani (Alien Genius)',
    cost: 140000,
    unlocked: false,
    description: 'Science prodigy in an iconic extraterrestrial green suit with triple alien eyes and antennae.',
    characterModel: 'alien_yutani',
    colorScheme: {
      hoodie: 0x52b788, // Alien lime green
      pants: 0x2d6a4f, // Deep emerald
      cap: 0x74c69d,   // Antenna dome
      shoes: 0xffffff, // White space boots
      accent: 0xd8f3dc, // Celestial white
      skinTone: 0xffd3b6,
      hairColor: 0x1b4332,
    }
  },
  {
    id: 'tagbot_windup',
    name: 'Tagbot (Retro Bot)',
    cost: 180000,
    unlocked: false,
    description: 'Classic yellow tin-toy subway robot with CRT screen face, pressure dials, and spinning brass windup key.',
    characterModel: 'tagbot_retro',
    colorScheme: {
      hoodie: 0xffbe0b, // Retro yellow tin
      pants: 0x3a0ca3, // Metallic blue joints
      cap: 0xfb5607,   // Red antenna beacon
      shoes: 0x4361ee, // Magnetic clamp treads
      accent: 0x00f5d4, // Cyan CRT screen
      skinTone: 0xcccccc,
      visorColor: 0x00f5d4,
    }
  },
  {
    id: 'king_royalty',
    name: 'King (Subway Majesty)',
    cost: 250000,
    unlocked: false,
    description: 'Regal sovereign clad in crimson velvet mantle with ermine fur and a sparkling jeweled gold crown.',
    characterModel: 'king_royal',
    colorScheme: {
      hoodie: 0xb7094c, // Royal velvet crimson
      pants: 0x001219, // Royal navy
      cap: 0xffd700,   // Pure gold crown
      shoes: 0xffb703, // Gold royal shoes
      accent: 0xffd700, // Gold embroidery
      skinTone: 0xffd166,
      hairColor: 0x5c4d3c,
    }
  },
  {
    id: 'brody_surfer',
    name: 'Brody (Beach Lifeguard)',
    cost: 32000,
    unlocked: false,
    description: 'Chilled Hawaiian beach surfer and lifeguard with tropical floral board shorts, shades, and rescue buoy.',
    characterModel: 'surfer_brody',
    colorScheme: {
      hoodie: 0x00b4d8, // Ocean cyan surf tank
      pants: 0xff7b00, // Sunset orange board shorts
      cap: 0xffd166,   // Beach blonde hair / sun visor
      shoes: 0xffffff, // White beach kicks
      accent: 0x06d6a0, // Tropical palm green
      skinTone: 0xdf9a57, // Sun-kissed tan
      hairColor: 0xf6bd60,
    }
  },
  {
    id: 'zoe_zombie',
    name: 'Zoe (Zombie Skater)',
    cost: 125000,
    unlocked: false,
    description: 'Funky undead skater girl with mint skin, safety-pin denim vest, and mismatched neon high-tops.',
    characterModel: 'zombie_zoe',
    colorScheme: {
      hoodie: 0x3d348b, // Grunge purple vest
      pants: 0x1f1f2e, // Ripped charcoal denim
      cap: 0x7678ed,   // Violet streak hair
      shoes: 0x00f5d4, // Mismatched neon kicks
      accent: 0xf72585, // Hot neon pink stitches
      skinTone: 0xa8dadc, // Pale mint undead skin
      hairColor: 0x47126b,
    }
  },
  {
    id: 'prince_k_gold',
    name: 'Prince K (Diamond Royalty)',
    cost: 300000,
    unlocked: false,
    description: 'Extravagant prince draped in pure gold lamé, diamond-rimmed aviators, and jeweled royal turban.',
    characterModel: 'prince_k',
    colorScheme: {
      hoodie: 0xffd700, // Pure metallic 24k gold
      pants: 0xcca000, // Gilded gold harem joggers
      cap: 0xfffdf0,   // Ivory & gold jeweled turban
      shoes: 0xffd700, // Pure gold sneakers
      accent: 0xe63946, // Ruby jewel medallions
      skinTone: 0x784421, // Deep warm skin
      hairColor: 0x111111,
    }
  },
  {
    id: 'boombot_sub',
    name: 'Boombot (Bass Subwoofer)',
    cost: 400000,
    unlocked: false,
    description: 'High-voltage sound system robot with twin subwoofers, active spectrum analyzer LEDs, and turntable decks.',
    characterModel: 'boombot_dj',
    colorScheme: {
      hoodie: 0x121212, // Matte speaker cabinet
      pants: 0x1e1e24, // Carbon fiber subwoofer legs
      cap: 0x00f5d4,   // Frequency visualizer glow
      shoes: 0xff0055, // Bass booster kicks
      accent: 0x00f5d4, // Cyan audio LED lights
      skinTone: 0x2b2d42,
      visorColor: 0x00f5d4,
    }
  }
];

export const DEFAULT_HOVERBOARDS: HoverboardSkin[] = [
  {
    id: 'classic_deck',
    name: 'Classic Cruiser',
    cost: 0,
    unlocked: true,
    color: 0xff3b30,
    trailColor: '#00ffff',
    speedBoostPercent: 0
  },
  {
    id: 'star_surfer',
    name: 'Star Surfer',
    cost: 6000,
    unlocked: false,
    color: 0x00f0ff,
    trailColor: '#ff007f',
    speedBoostPercent: 5
  },
  {
    id: 'flame_rider',
    name: 'Flame Rider',
    cost: 20000,
    unlocked: false,
    color: 0xff9500,
    trailColor: '#ff3b30',
    speedBoostPercent: 10
  },
  {
    id: 'chrome_pulse',
    name: 'Chrome Pulse',
    cost: 50000,
    unlocked: false,
    color: 0xaf52de,
    trailColor: '#30d158',
    speedBoostPercent: 15
  }
];

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'mission_jump_1',
    title: 'High Jumper',
    description: 'Jump 10 times during runs',
    target: 10,
    current: 0,
    rewardCoins: 100,
    completed: false,
    claimed: false,
    type: 'jump'
  },
  {
    id: 'mission_slide_1',
    title: 'Smooth Slider',
    description: 'Slide under 6 barriers',
    target: 6,
    current: 0,
    rewardCoins: 120,
    completed: false,
    claimed: false,
    type: 'slide'
  },
  {
    id: 'mission_coins_1',
    title: 'Coin Hoarder',
    description: 'Collect 80 coins',
    target: 80,
    current: 0,
    rewardCoins: 150,
    completed: false,
    claimed: false,
    type: 'coins'
  },
  {
    id: 'mission_score_1',
    title: 'Score Crusher',
    description: 'Reach a score of 3,000 points',
    target: 3000,
    current: 0,
    rewardCoins: 200,
    completed: false,
    claimed: false,
    type: 'score'
  },
  {
    id: 'mission_distance_1',
    title: 'Marathon Runner',
    description: 'Cover 600 meters along the subway tracks',
    target: 600,
    current: 0,
    rewardCoins: 250,
    completed: false,
    claimed: false,
    type: 'distance'
  }
];
