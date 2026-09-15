export const LANE_WIDTH = 2.4;
export const LANE_COORDINATES: Record<number, number> = {
  [-1]: -LANE_WIDTH,
  [0]: 0,
  [1]: LANE_WIDTH,
};

export const INITIAL_SPEED = 22; // units per second (smooth starting pace)
export const MAX_SPEED = 50; // adrenaline top speed for veteran runners
export const SPEED_ACCELERATION = 0.12; // speed added per second continuously

export const LANE_SWITCH_DURATION = 0.11; // seconds for snappy, crisp lane switch
export const INPUT_BUFFER_DURATION = 0.16; // seconds for action buffering
export const COYOTE_TIME = 0.10; // seconds grace period after leaving a surface

export const JUMP_VELOCITY = 13.8;
export const SNEAKERS_JUMP_VELOCITY = 20.0;
export const GRAVITY = 38;
export const FAST_FALL_GRAVITY = 75;

export const SLIDE_DURATION = 0.65; // seconds
export const HOVERBOARD_DURATION = 25; // seconds
export const POWERUP_DEFAULT_DURATION = 12; // seconds

export const CHUNK_LENGTH = 80;
export const TOTAL_ACTIVE_CHUNKS = 4;
export const SPAWN_AHEAD_DISTANCE = 220;

export const JETPACK_Y = 10.5;
export const JETPACK_DURATION = 10;
export const MAGNET_RADIUS = 10;

export const TRAIN_HEIGHT = 3.6;
export const TRAIN_WIDTH = 2.1;
export const TRAIN_LENGTH = 22;

export const HIGH_BARRIER_HEIGHT = 2.6;
export const HIGH_BARRIER_CLEARANCE = 1.3;

export const LOW_BARRIER_HEIGHT = 1.1;

export const THEME_CONFIGS = {
  tokyo_day: {
    name: 'Daylight City',
    skyColor: 0x87ceeb,
    fogColor: 0xc6e4f6,
    ambientLight: 0xffffff,
    ambientIntensity: 1.1,
    sunLight: 0xfffaed,
    sunIntensity: 1.6,
    groundColor: 0x3d3f44,
    railColor: 0xcccccc,
    sleeperColor: 0x7a5230,
    wallColor: 0x8a929a,
    buildingColors: [0x50728c, 0xe07a5f, 0x3d5a80, 0xee6c4d, 0x293241],
  },
  neon_night: {
    name: 'Neon Cyber Subway',
    skyColor: 0x070913,
    fogColor: 0x120d26,
    ambientLight: 0x44337a,
    ambientIntensity: 0.9,
    sunLight: 0x00f0ff,
    sunIntensity: 1.4,
    groundColor: 0x15161e,
    railColor: 0x00f0ff,
    sleeperColor: 0x241b3b,
    wallColor: 0x1a1c2e,
    buildingColors: [0x1a153b, 0x0f2b46, 0x321345, 0x0d3838, 0x1c1942],
  },
  sunset_rails: {
    name: 'Sunset Express',
    skyColor: 0xfd5e53,
    fogColor: 0xff9966,
    ambientLight: 0xffccaa,
    ambientIntensity: 1.0,
    sunLight: 0xffaa44,
    sunIntensity: 1.7,
    groundColor: 0x382d2c,
    railColor: 0xffaa77,
    sleeperColor: 0x5a3322,
    wallColor: 0x6e4e46,
    buildingColors: [0x5c2b3c, 0x8c3a4a, 0x3a1f38, 0x9b4d42, 0x48243b],
  },
  rio_beach: {
    name: 'Rio Carnival Coast',
    skyColor: 0x00b4d8,
    fogColor: 0x90e0ef,
    ambientLight: 0xffffff,
    ambientIntensity: 1.25,
    sunLight: 0xffd166,
    sunIntensity: 1.8,
    groundColor: 0xe9d8a6,
    railColor: 0x06d6a0,
    sleeperColor: 0x7a4e2d,
    wallColor: 0xee9b00,
    buildingColors: [0xef476f, 0xffd166, 0x06d6a0, 0x118ab2, 0x073b4c],
  },
  cairo_dunes: {
    name: 'Cairo Sand Dunes',
    skyColor: 0xddb892,
    fogColor: 0xb08968,
    ambientLight: 0xffedd8,
    ambientIntensity: 1.1,
    sunLight: 0xffb703,
    sunIntensity: 1.85,
    groundColor: 0x9c6644,
    railColor: 0xd4a373,
    sleeperColor: 0x582f0e,
    wallColor: 0x7f4f24,
    buildingColors: [0x7f4f24, 0x936639, 0xa68a64, 0xb6ad90, 0xc2c5aa],
  }
};
