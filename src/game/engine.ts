import * as THREE from 'three';
import {
  Lane,
  GameStatus,
  PlayerStats,
  ActivePowerUp,
  PowerUpType,
  CharacterSkin,
  HoverboardSkin,
  EnvironmentTheme,
  Mission,
  LevelCelebration
} from '../types/game';
import {
  LANE_COORDINATES,
  INITIAL_SPEED,
  MAX_SPEED,
  SPEED_ACCELERATION,
  LANE_SWITCH_DURATION,
  INPUT_BUFFER_DURATION,
  COYOTE_TIME,
  JUMP_VELOCITY,
  SNEAKERS_JUMP_VELOCITY,
  GRAVITY,
  FAST_FALL_GRAVITY,
  SLIDE_DURATION,
  HOVERBOARD_DURATION,
  POWERUP_DEFAULT_DURATION,
  JETPACK_Y,
  JETPACK_DURATION,
  MAGNET_RADIUS,
  TRAIN_HEIGHT,
  TRAIN_LENGTH,
  LOW_BARRIER_HEIGHT,
  HIGH_BARRIER_HEIGHT,
  SPAWN_AHEAD_DISTANCE
} from './constants';
import { Character } from './character';
import { ObstacleManager } from './obstacles';
import { EnvironmentManager } from './environment';
import { CourseGenerator } from './courseGenerator';
import { InspectorManager } from './inspector';
import { soundManager } from '../audio/soundManager';

export interface LevelDefinition {
  level: number;
  title: string;
  targetDistance: number;
  rewardCoins: number;
}

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  { level: 1, title: 'Subway Rookie', targetDistance: 250, rewardCoins: 100 },
  { level: 2, title: 'Track Sprinter', targetDistance: 550, rewardCoins: 150 },
  { level: 3, title: 'Tunnel Cruiser', targetDistance: 950, rewardCoins: 200 },
  { level: 4, title: 'Rail Master', targetDistance: 1500, rewardCoins: 300 },
  { level: 5, title: 'Speed Demon', targetDistance: 2200, rewardCoins: 400 },
  { level: 6, title: 'Neon Phantom', targetDistance: 3000, rewardCoins: 500 },
  { level: 7, title: 'Velocity King', targetDistance: 4000, rewardCoins: 650 },
  { level: 8, title: 'Apex Runner', targetDistance: 5200, rewardCoins: 800 },
  { level: 9, title: 'Cyber Legend', targetDistance: 6600, rewardCoins: 1000 },
  { level: 10, title: 'Subway God', targetDistance: 8200, rewardCoins: 1500 },
];

export function getLevelForDistance(dist: number): {
  level: number;
  title: string;
  progress: number;
  targetDistance: number;
  rewardCoins: number;
} {
  let prevTarget = 0;
  for (let i = 0; i < LEVEL_DEFINITIONS.length; i++) {
    const def = LEVEL_DEFINITIONS[i];
    if (dist < def.targetDistance) {
      const span = def.targetDistance - prevTarget;
      const prog = Math.max(0, Math.min(1, (dist - prevTarget) / span));
      return {
        level: def.level,
        title: def.title,
        progress: prog,
        targetDistance: def.targetDistance,
        rewardCoins: def.rewardCoins,
      };
    }
    prevTarget = def.targetDistance;
  }

  const overflow = dist - 8200;
  const extraLevels = Math.floor(overflow / 1500);
  const extraProgress = (overflow % 1500) / 1500;
  return {
    level: 10 + extraLevels,
    title: 'Subway God',
    progress: extraProgress,
    targetDistance: 8200 + (extraLevels + 1) * 1500,
    rewardCoins: 2000,
  };
}

export class GameEngine {
  // Three.js Core
  private container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  // Subsystems
  public character: Character;
  public obstacleManager: ObstacleManager;
  public environment: EnvironmentManager;
  public inspector: InspectorManager;
  private courseGen: CourseGenerator;

  // Game Loop & State
  public status: GameStatus = 'idle';
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  public speed: number = INITIAL_SPEED;

  // Control Swap configuration (Interchange left & right commands)
  public swapLeftRightControls: boolean = false;

  // Player Kinematics & Timing Control
  public currentLane: Lane = 0;
  public playerX: number = 0;
  public playerY: number = 0;
  public playerZ: number = 0;
  private velocityY: number = 0;
  private currentGroundY: number = 0;
  private isSliding: boolean = false;
  private slideTimer: number = 0;
  private invulnerabilityTimer: number = 0;

  // Deterministic Lane Transition Timing
  private laneStartX: number = 0;
  private laneTargetX: number = 0;
  private laneTransitionTimer: number = LANE_SWITCH_DURATION;
  private laneTransitionDuration: number = LANE_SWITCH_DURATION;

  // Input Buffering & Coyote Time
  private bufferedAction: { action: 'jump' | 'slide' | 'left' | 'right'; timer: number } | null = null;
  private coyoteTimer: number = 0;
  private wasOnGround: boolean = true;

  // Power-Ups
  private activePowerUps: Map<PowerUpType, number> = new Map();
  private isJetpackDescending: boolean = false;
  private jetpackDescentTimer: number = 0;
  private jetpackSputterPlayed: boolean = false;

  // Screen Effects
  private screenShake: number = 0;
  private baseFOV: number = 64;
  private cameraTarget: THREE.Vector3 = new THREE.Vector3();

  // Train interaction states for dynamic cinematic camera angles
  private isClimbingTrain: boolean = false;
  private trainClimbProgress: number = 0;
  private isOnTrainRoof: boolean = false;
  private wasOnTrainRoof: boolean = false;
  private leavingTrainTimer: number = 0;
  private currentLookTarget: THREE.Vector3 = new THREE.Vector3(0, 1.8, 6);
  private playerPosVector: THREE.Vector3 = new THREE.Vector3();

  // Player Stats
  public stats: PlayerStats = {
    score: 0,
    highScore: 0,
    coins: 0,
    totalCoins: 0,
    multiplier: 1,
    distance: 0,
    hoverboardsRemaining: 3,
    isHoverboardActive: false,
    hoverboardTimeLeft: 0,
    level: 1,
    levelTitle: 'Subway Rookie',
    levelProgress: 0,
    levelTargetDistance: 250,
  };

  // Callbacks to React
  public onStatsUpdate?: (stats: PlayerStats) => void;
  public onPowerUpsUpdate?: (powerUps: ActivePowerUp[]) => void;
  public onGameOver?: (finalStats: PlayerStats) => void;
  public onMissionProgress?: (type: Mission['type'], count: number) => void;
  public onLevelUp?: (celebration: LevelCelebration) => void;

  constructor(
    container: HTMLElement,
    characterSkin: CharacterSkin,
    hoverboardSkin: HoverboardSkin,
    theme: EnvironmentTheme = 'tokyo_day'
  ) {
    this.container = container;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(this.baseFOV, aspect, 0.1, 450);
    this.camera.position.set(0, 4.2, -6.8);
    this.camera.lookAt(0, 1.8, 6);

    // 3. Renderer with high-fidelity tone mapping & soft shadows
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Subsystems
    this.environment = new EnvironmentManager(this.scene, theme);
    this.obstacleManager = new ObstacleManager(this.scene);
    this.character = new Character(characterSkin, hoverboardSkin);
    this.scene.add(this.character.mesh);
    this.inspector = new InspectorManager();
    this.scene.add(this.inspector.group);
    this.courseGen = new CourseGenerator();

    // Load persisted stats
    const savedHighScore = localStorage.getItem('subway_high_score');
    if (savedHighScore) this.stats.highScore = parseInt(savedHighScore, 10);

    const savedTotalCoins = localStorage.getItem('subway_total_coins');
    if (savedTotalCoins) this.stats.totalCoins = parseInt(savedTotalCoins, 10);

    const savedHoverboards = localStorage.getItem('subway_hoverboards');
    if (savedHoverboards) this.stats.hoverboardsRemaining = parseInt(savedHoverboards, 10);

    // Resize listener
    window.addEventListener('resize', this.handleResize);

    // Render initial preview scene
    this.renderer.render(this.scene, this.camera);
  }

  private handleResize = () => {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public startGame() {
    this.status = 'playing';
    this.speed = INITIAL_SPEED;
    this.playerZ = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.velocityY = 0;
    this.currentLane = 0;
    this.currentGroundY = 0;
    this.isSliding = false;
    this.slideTimer = 0;
    this.invulnerabilityTimer = 0;
    this.screenShake = 0;
    this.character.isCrashed = false;
    this.character.setShieldActive(false);

    // Reset camera & train interaction states
    this.isClimbingTrain = false;
    this.trainClimbProgress = 0;
    this.isOnTrainRoof = false;
    this.wasOnTrainRoof = false;
    this.leavingTrainTimer = 0;
    this.currentLookTarget.set(0, 1.8, 6);

    // Reset timing & kinematics
    this.laneStartX = 0;
    this.laneTargetX = 0;
    this.laneTransitionTimer = LANE_SWITCH_DURATION;
    this.bufferedAction = null;
    this.coyoteTimer = 0;
    this.wasOnGround = true;

    this.stats.score = 0;
    this.stats.coins = 0;
    this.stats.multiplier = 1;
    this.stats.distance = 0;
    this.stats.isHoverboardActive = false;
    this.stats.hoverboardTimeLeft = 0;
    this.stats.level = 1;
    this.stats.levelTitle = 'Subway Rookie';
    this.stats.levelProgress = 0;
    this.stats.levelTargetDistance = 250;
    this.stats.currentSpeed = Math.round(INITIAL_SPEED);
    this.stats.speedMultiplier = 1.0;
    this.stats.speedTier = 'NORMAL';
    this.stats.mysteryBoxesCollected = 0;
    this.stats.keys = parseInt(localStorage.getItem('subway_keys') || '5', 10);
    this.stats.wordHuntLetters = [
      { letter: 'S', collected: false },
      { letter: 'U', collected: false },
      { letter: 'R', collected: false },
      { letter: 'F', collected: false },
    ];

    this.activePowerUps.clear();
    this.obstacleManager.clearAll();
    this.environment.reset(0);
    this.courseGen.reset();
    this.inspector.reset(this.playerZ);

    // Spawn first few obstacle segments ahead
    this.generateCourseAhead();

    this.character.mesh.position.set(0, 0, 0);
    this.character.isSliding = false;
    this.character.isJumping = false;
    this.character.isHoverboard = false;
    this.character.isJetpack = false;
    this.character.hasSneakers = false;

    this.lastTime = performance.now();
    soundManager.startBGM();
    this.loop(this.lastTime);
  }

  // CONTROLS - DETERMINISTIC HIGH-SPEED TIMING & KINEMATICS
  // Execute Left Command (interchanges to moveRight when swapLeftRightControls is true)
  public executeLeftCommand() {
    if (this.swapLeftRightControls) {
      this.moveRight();
    } else {
      this.moveLeft();
    }
  }

  // Execute Right Command (interchanges to moveLeft when swapLeftRightControls is true)
  public executeRightCommand() {
    if (this.swapLeftRightControls) {
      this.moveLeft();
    } else {
      this.moveRight();
    }
  }

  public moveLeft() {
    if (this.status !== 'playing') return;
    // Queue lane switch if tween is actively in progress to prevent glitchy overlap
    if (this.laneTransitionTimer < this.laneTransitionDuration * 0.65) {
      this.bufferAction('left');
      return;
    }
    if (this.currentLane > -1) {
      this.currentLane = (this.currentLane - 1) as Lane;
      this.laneStartX = this.playerX;
      this.laneTargetX = LANE_COORDINATES[this.currentLane];
      this.laneTransitionTimer = 0;
      soundManager.playLaneSwitch();
      this.character.tiltAngle = 0.44; // energetic bank into turn
    } else {
      this.character.tiltAngle = 0.15; // lane boundary cushion
    }
  }

  public moveRight() {
    if (this.status !== 'playing') return;
    // Queue lane switch if tween is actively in progress to prevent glitchy overlap
    if (this.laneTransitionTimer < this.laneTransitionDuration * 0.65) {
      this.bufferAction('right');
      return;
    }
    if (this.currentLane < 1) {
      this.currentLane = (this.currentLane + 1) as Lane;
      this.laneStartX = this.playerX;
      this.laneTargetX = LANE_COORDINATES[this.currentLane];
      this.laneTransitionTimer = 0;
      soundManager.playLaneSwitch();
      this.character.tiltAngle = -0.44; // energetic bank into turn
    } else {
      this.character.tiltAngle = -0.15; // lane boundary cushion
    }
  }

  public jump() {
    if (this.status !== 'playing') return;

    // Player can jump if on ground, on train roof, or within coyote time grace window
    const isGrounded = Math.abs(this.playerY - this.currentGroundY) < 0.14;
    const canJump = (isGrounded || this.coyoteTimer > 0) && !this.activePowerUps.has('jetpack');

    if (canJump) {
      const hasSneakers = this.activePowerUps.has('sneakers');
      this.velocityY = hasSneakers ? SNEAKERS_JUMP_VELOCITY : JUMP_VELOCITY;
      this.character.isJumping = true;
      this.isSliding = false; // instantaneous slide cancel
      this.slideTimer = 0;
      this.character.isSliding = false;
      this.coyoteTimer = 0;
      this.bufferedAction = null;
      soundManager.playJump();
      if (this.onMissionProgress) this.onMissionProgress('jump', 1);
    } else {
      // Buffer jump action if pressed shortly before touchdown
      this.bufferAction('jump');
    }
  }

  public slide() {
    if (this.status !== 'playing') return;

    const isGrounded = Math.abs(this.playerY - this.currentGroundY) < 0.14;
    if (!isGrounded) {
      // FAST FALL! Downward slam from mid-air to land instantly into a slide
      this.velocityY = -FAST_FALL_GRAVITY * 0.55;
    }

    this.isSliding = true;
    this.slideTimer = SLIDE_DURATION;
    this.character.isSliding = true;
    this.character.isJumping = false;
    this.bufferedAction = null;
    soundManager.playSlide();
    if (this.onMissionProgress) this.onMissionProgress('slide', 1);
  }

  public bufferAction(action: 'jump' | 'slide' | 'left' | 'right') {
    this.bufferedAction = {
      action,
      timer: INPUT_BUFFER_DURATION,
    };
  }

  public activateHoverboard() {
    if (this.status !== 'playing') return;
    if (this.stats.hoverboardsRemaining <= 0 || this.stats.isHoverboardActive) return;

    this.stats.hoverboardsRemaining--;
    this.stats.isHoverboardActive = true;
    this.stats.hoverboardTimeLeft = HOVERBOARD_DURATION;
    localStorage.setItem('subway_hoverboards', this.stats.hoverboardsRemaining.toString());

    this.character.isHoverboard = true;
    soundManager.playHoverboard();
  }

  private triggerCrash() {
    if (this.invulnerabilityTimer > 0) return;

    // Check if Aegis Shield power-up can save player!
    if (this.activePowerUps.has('shield')) {
      this.activePowerUps.delete('shield');
      this.character.setShieldActive(false);
      this.invulnerabilityTimer = 2.0;
      this.screenShake = 0.5;
      this.inspector.triggerAlert();
      soundManager.playHoverboardBreak();
      soundManager.playStumble();

      // Clear obstacles right in front of player to prevent instant re-hit
      this.obstacleManager.obstacleObjects.forEach((obsGroup) => {
        if (Math.abs(obsGroup.position.z - this.playerZ) < 16) {
          this.obstacleManager.removeObstacle(obsGroup.userData.id);
        }
      });
      return;
    }

    // Check if hoverboard can save player!
    if (this.stats.isHoverboardActive) {
      this.stats.isHoverboardActive = false;
      this.stats.hoverboardTimeLeft = 0;
      this.character.isHoverboard = false;
      this.invulnerabilityTimer = 1.8;
      this.screenShake = 0.45;
      this.inspector.triggerAlert();
      soundManager.playHoverboardBreak();
      soundManager.playStumble();

      // Clear obstacles right in front of player to prevent instant re-hit
      this.obstacleManager.obstacleObjects.forEach((obsGroup) => {
        if (Math.abs(obsGroup.position.z - this.playerZ) < 14) {
          this.obstacleManager.removeObstacle(obsGroup.userData.id);
        }
      });
      return;
    }

    // Full Game Over Crash: Inspector apprehends the player!
    this.status = 'gameover';
    this.character.isCrashed = true;
    this.inspector.triggerCatch();
    soundManager.playCrash();
    soundManager.playDogBark();
    soundManager.stopBGM();
    this.screenShake = 0.85;

    // Persist scores
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      localStorage.setItem('subway_high_score', this.stats.highScore.toString());
    }

    this.stats.totalCoins += this.stats.coins;
    localStorage.setItem('subway_total_coins', this.stats.totalCoins.toString());

    // Save run record to local run history for Leaderboard
    try {
      const historyStr = localStorage.getItem('subway_run_history') || '[]';
      const history = JSON.parse(historyStr);
      history.unshift({
        id: `run_${Date.now()}`,
        score: this.stats.score,
        distance: this.stats.distance,
        coins: this.stats.coins,
        characterName: 'Skate Runner',
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      });
      localStorage.setItem('subway_run_history', JSON.stringify(history.slice(0, 15)));
    } catch {
      // ignore storage errors
    }

    if (this.onGameOver) {
      this.onGameOver({ ...this.stats });
    }
  }

  public reviveGame(): boolean {
    if (this.status !== 'gameover') return false;

    // Clear obstacles around player (32m runway) so runner doesn't collide on revival
    this.obstacleManager.obstacleObjects.forEach((obsGroup) => {
      if (Math.abs(obsGroup.position.z - this.playerZ) < 32) {
        this.obstacleManager.removeObstacle(obsGroup.userData.id);
      }
    });

    this.character.isCrashed = false;
    this.character.mesh.rotation.x = 0;
    this.character.mesh.rotation.z = 0;
    this.status = 'playing';
    this.invulnerabilityTimer = 3.0; // 3 seconds invulnerability
    this.screenShake = 0;
    this.playerY = this.currentGroundY;
    this.velocityY = 0;
    this.lastTime = performance.now();
    soundManager.startBGM();
    soundManager.playPowerup();
    this.loop(this.lastTime);
    return true;
  }

  public pauseGame() {
    if (this.status !== 'playing') return;
    this.status = 'paused';
    soundManager.stopBGM();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public resumeGame() {
    if (this.status !== 'paused') return;
    this.status = 'playing';
    this.lastTime = performance.now();
    soundManager.startBGM();
    this.loop(this.lastTime);
  }

  public resetGame() {
    this.startGame();
  }

  public activatePowerUp(type: PowerUpType) {
    soundManager.playPowerup();

    if (type === 'jetpack') {
      this.activePowerUps.set('jetpack', JETPACK_DURATION);
      this.character.isJetpack = true;
      this.isJetpackDescending = false;
      this.jetpackDescentTimer = 0;
      this.jetpackSputterPlayed = false;
      this.invulnerabilityTimer = 1.0;
      soundManager.startJetpackLoop();

      // Rocket ascent boost
      this.velocityY = 16;
    } else if (type === 'sneakers') {
      this.activePowerUps.set('sneakers', POWERUP_DEFAULT_DURATION);
      this.character.hasSneakers = true;
    } else if (type === 'shield') {
      this.activePowerUps.set('shield', 20);
      this.character.setShieldActive(true);
    } else {
      this.activePowerUps.set(type, POWERUP_DEFAULT_DURATION);
    }
  }

  private updatePowerUps(delta: number) {
    const expired: PowerUpType[] = [];

    this.activePowerUps.forEach((timeLeft, type) => {
      const newTime = timeLeft - delta;
      if (type === 'jetpack' && newTime <= 2.2 && !this.jetpackSputterPlayed) {
        soundManager.playJetpackSputter();
        this.jetpackSputterPlayed = true;
      }
      if (newTime <= 0) {
        expired.push(type);
      } else {
        this.activePowerUps.set(type, newTime);
      }
    });

    expired.forEach((type) => {
      this.activePowerUps.delete(type);
      if (type === 'jetpack') {
        // Initiate smooth descent glide down to ground / train roof
        this.isJetpackDescending = true;
        this.jetpackDescentTimer = 1.4;
        soundManager.stopJetpackLoop();
      } else if (type === 'sneakers') {
        this.character.hasSneakers = false;
      } else if (type === 'shield') {
        this.character.setShieldActive(false);
      }
    });

    // Update hoverboard duration
    if (this.stats.isHoverboardActive) {
      this.stats.hoverboardTimeLeft -= delta;
      if (this.stats.hoverboardTimeLeft <= 0) {
        this.stats.isHoverboardActive = false;
        this.stats.hoverboardTimeLeft = 0;
        this.character.isHoverboard = false;
      }
    }

    if (this.onPowerUpsUpdate) {
      const list: ActivePowerUp[] = [];
      this.activePowerUps.forEach((timeLeft, type) => {
        const duration = type === 'jetpack' ? JETPACK_DURATION : type === 'shield' ? 20 : POWERUP_DEFAULT_DURATION;
        list.push({ type, timeLeft, duration });
      });
      this.onPowerUpsUpdate(list);
    }
  }

  private generateCourseAhead() {
    const isJetpack = this.activePowerUps.has('jetpack');
    const targetZ = this.playerZ + SPAWN_AHEAD_DISTANCE;
    const segment = this.courseGen.generateNextSegment(targetZ, isJetpack, this.playerZ, this.speed);

    segment.obstacles.forEach((obs) => {
      this.obstacleManager.spawnObstacle(obs);
    });

    segment.coins.forEach((coin) => {
      this.obstacleManager.spawnCoin(coin);
    });

    segment.powerUps.forEach((pw) => {
      this.obstacleManager.spawnPowerUp(pw);
    });
  }

  private updateGroundElevation() {
    // Train Roof & Ramp Walkway Detection (based on physical X alignment)
    let newGroundY = 0;
    let climbing = false;
    let climbProg = 0;
    let onRoof = false;

    this.obstacleManager.obstacleObjects.forEach((obsGroup) => {
      if (!obsGroup.visible) return;
      const obsType = obsGroup.userData.type;
      const obsZ = obsGroup.position.z;
      const xDiff = Math.abs(this.playerX - obsGroup.position.x);

      if (xDiff < 1.15) {
        if (obsType === 'ramp_train' || obsType === 'train_stopped' || obsType === 'train_moving') {
          const trainStartZ = obsZ;
          const trainEndZ = obsZ + TRAIN_LENGTH;

          if (obsGroup.userData.hasRamp) {
            // Ramp slopes up smoothly from trainStartZ - 6.0 (ground) to trainStartZ (train roof)
            const rampStart = trainStartZ - 6.0;
            const rampEnd = trainStartZ;
            if (this.playerZ >= rampStart && this.playerZ < rampEnd) {
              const progress = Math.max(0, Math.min(1, (this.playerZ - rampStart) / 6.0));
              newGroundY = Math.max(newGroundY, progress * TRAIN_HEIGHT);
              climbing = true;
              climbProg = Math.max(climbProg, progress);
            } else if (this.playerZ >= rampEnd && this.playerZ <= trainEndZ) {
              newGroundY = Math.max(newGroundY, TRAIN_HEIGHT);
              if (this.playerY >= TRAIN_HEIGHT - 0.45) {
                onRoof = true;
              }
            }
          } else {
            // Running on train roof if player jumped or landed on it
            if (this.playerZ >= trainStartZ - 0.3 && this.playerZ <= trainEndZ) {
              if (this.playerY >= TRAIN_HEIGHT - 0.35) {
                newGroundY = Math.max(newGroundY, TRAIN_HEIGHT);
                onRoof = true;
              }
            }
          }
        }
      }
    });

    // Detect climbing when ascending towards train roof
    if (!climbing && !onRoof && newGroundY >= TRAIN_HEIGHT - 0.2 && this.playerY > 0.6 && this.velocityY > 0.8) {
      climbing = true;
      climbProg = Math.min(1, this.playerY / TRAIN_HEIGHT);
    }

    // Detect leaving train: player was on train roof and is now stepping/jumping/falling off
    if (this.wasOnTrainRoof && !onRoof && !climbing && this.playerY > 0.15) {
      this.leavingTrainTimer = 0.9;
    }

    this.isClimbingTrain = climbing;
    this.trainClimbProgress = climbProg;
    this.isOnTrainRoof = onRoof;
    this.wasOnTrainRoof = onRoof;
    this.currentGroundY = newGroundY;
  }

  private checkCollisions() {
    const isJetpack = this.activePowerUps.has('jetpack');
    const isJetpackFlight = isJetpack || this.isJetpackDescending;

    // 1. Obstacle Hits (fair physical X proximity check & invisible train collision prevention)
    if (!isJetpackFlight && this.invulnerabilityTimer <= 0) {
      this.obstacleManager.obstacleObjects.forEach((obsGroup) => {
        if (!obsGroup.visible) return;
        const obsType = obsGroup.userData.type;
        const obsZ = obsGroup.position.z;

        // CRITICAL PROTECTION: Never collide with an obstacle already passed or far ahead
        if (obsType === 'train_stopped' || obsType === 'train_moving' || obsType === 'ramp_train') {
          if (obsZ + TRAIN_LENGTH < this.playerZ - 0.6) return;
          if (obsZ > this.playerZ + 65) return;
        } else {
          if (obsZ < this.playerZ - 1.2 || obsZ > this.playerZ + 65) return;
        }

        const xDiff = Math.abs(this.playerX - obsGroup.position.x);

        // Only collide if player's physical body is aligned with obstacle lane (generous dodge clearance)
        if (xDiff < 0.88) {
          const zDiff = Math.abs(obsZ - this.playerZ);

          if (obsType === 'low_barrier') {
            if (zDiff < 0.82) {
              // Jump clearance: if player has jumped above barrier height, safe!
              if (this.playerY < LOW_BARRIER_HEIGHT + 0.1) {
                this.triggerCrash();
              } else if (this.playerY < LOW_BARRIER_HEIGHT + 0.45) {
                // Near miss / close jump stumble: alerts Inspector!
                this.inspector.triggerAlert();
                soundManager.playStumble();
              }
            }
          } else if (obsType === 'high_barrier') {
            if (zDiff < 0.82) {
              // Safe if airborne (cleared over top of barrier) OR sliding cleanly underneath
              if (this.playerY > HIGH_BARRIER_HEIGHT + 0.15) {
                // Jumped or flying cleanly over top of high barrier: Safe!
              } else if (this.isSliding && this.playerY < 0.55) {
                // Sliding cleanly underneath high barrier: Safe!
              } else {
                this.triggerCrash();
              }
            }
          } else if (obsType === 'train_stopped' || obsType === 'train_moving') {
            // Only crash if hitting the front of the train while on the ground!
            if (!this.isOnTrainRoof && this.currentGroundY < TRAIN_HEIGHT - 0.25) {
              if (this.playerZ >= obsZ - 0.35 && this.playerZ <= obsZ + 0.75) {
                if (this.playerY < TRAIN_HEIGHT - 0.35) {
                  this.triggerCrash();
                }
              }
            }
          } else if (obsType === 'ramp_train') {
            // Ramp train is safe for ascending and running across roof!
            // Never crash when climbing ramp or running on roof
            if (!this.isClimbingTrain && !this.isOnTrainRoof && this.currentGroundY < 0.5) {
              // Only crash if walking into the side of the train body behind the ramp from another lane
              if (this.playerZ >= obsZ + 0.6 && this.playerZ <= obsZ + TRAIN_LENGTH - 0.5) {
                if (this.playerY < TRAIN_HEIGHT - 0.35) {
                  this.triggerCrash();
                }
              }
            }
          }
        }
      });
    }

    // 2. Coin Collection (Optimized with Z-culling & reusable Vector3)
    const isMagnet = this.activePowerUps.has('magnet');
    const playerPos = this.playerPosVector.set(this.playerX, this.playerY + 1.0, this.playerZ);
    const magnetReach = isMagnet ? MAGNET_RADIUS : 1.6;

    this.obstacleManager.coinObjects.forEach((coinMesh, id) => {
      const coinZ = coinMesh.position.z;
      // Fast Z-axis rejection
      if (Math.abs(coinZ - this.playerZ) > magnetReach + 1.0) return;

      const dist = playerPos.distanceTo(coinMesh.position);

      // Magnet attraction
      if (isMagnet && dist < MAGNET_RADIUS) {
        coinMesh.position.lerp(playerPos, 0.28);
      }

      // Collect coin
      if (dist < 1.5) {
        this.obstacleManager.removeCoin(id);
        soundManager.playCoin();
        this.stats.coins++;
        this.stats.score += 50 * this.stats.multiplier;
        if (this.onMissionProgress) this.onMissionProgress('coins', 1);
      }
    });

    // 3. Power-Up Collection (Optimized with Z-culling)
    this.obstacleManager.powerUpObjects.forEach((pwGroup, id) => {
      const pwZ = pwGroup.position.z;
      if (Math.abs(pwZ - this.playerZ) > 2.8) return;

      const dist = playerPos.distanceTo(pwGroup.position);
      if (dist < 1.6) {
        const type = pwGroup.userData.type as PowerUpType;
        this.obstacleManager.removePowerUp(id);

        if (type === 'mystery_box') {
          soundManager.playMysteryBox();
          this.stats.mysteryBoxesCollected = (this.stats.mysteryBoxesCollected || 0) + 1;
          const roll = Math.random();
          if (roll < 0.6) {
            const rewardCoins = 250;
            this.stats.coins += rewardCoins;
            this.stats.score += rewardCoins * 10;
          } else if (roll < 0.85) {
            this.stats.hoverboardsRemaining += 1;
            localStorage.setItem('subway_hoverboards', String(this.stats.hoverboardsRemaining));
          } else {
            this.stats.keys = (this.stats.keys || 0) + 1;
            localStorage.setItem('subway_keys', String(this.stats.keys));
          }
        } else if (type === 'letter') {
          soundManager.playLetterCollect();
          if (this.stats.wordHuntLetters) {
            const nextUncollected = this.stats.wordHuntLetters.find((l) => !l.collected);
            if (nextUncollected) {
              nextUncollected.collected = true;
              const allDone = this.stats.wordHuntLetters.every((l) => l.collected);
              if (allDone) {
                soundManager.playLevelUp();
                this.stats.coins += 1000;
                this.stats.score += 20000;
                if (this.onLevelUp) {
                  this.onLevelUp({
                    level: this.stats.level,
                    title: 'SURF COMPLETED! +1000 COINS',
                    rewardCoins: 1000,
                  });
                }
              }
            }
          }
        } else {
          this.activatePowerUp(type);
        }
      }
    });
  }

  private loop = (time: number) => {
    if (this.status !== 'playing') return;

    const delta = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    // Speed progression
    this.speed = Math.min(MAX_SPEED, this.speed + SPEED_ACCELERATION * delta);

    // Forward progression
    this.playerZ += this.speed * delta;
    this.stats.distance = Math.floor(this.playerZ);

    // Dynamic Level Progression Check
    const lvlInfo = getLevelForDistance(this.stats.distance);
    this.stats.levelProgress = lvlInfo.progress;
    this.stats.levelTargetDistance = lvlInfo.targetDistance;

    if (lvlInfo.level > this.stats.level) {
      this.stats.level = lvlInfo.level;
      this.stats.levelTitle = lvlInfo.title;
      this.stats.multiplier += 1;
      this.stats.coins += lvlInfo.rewardCoins;
      this.stats.totalCoins += lvlInfo.rewardCoins;
      localStorage.setItem('subway_total_coins', String(this.stats.totalCoins));

      const savedMaxLevel = parseInt(localStorage.getItem('subway_max_level') || '1', 10);
      if (this.stats.level > savedMaxLevel) {
        localStorage.setItem('subway_max_level', String(this.stats.level));
      }

      soundManager.playLevelUp();
      if (this.onLevelUp) {
        this.onLevelUp({
          level: lvlInfo.level,
          title: lvlInfo.title,
          rewardCoins: lvlInfo.rewardCoins,
        });
      }
    }

    // Score accumulation
    const mult = (this.activePowerUps.has('multiplier') ? 2 : 1) * this.stats.multiplier;
    this.stats.score += Math.floor(this.speed * delta * 5 * mult);

    if (this.onMissionProgress) {
      this.onMissionProgress('score', this.stats.score);
      this.onMissionProgress('distance', this.stats.distance);
    }

    // Action input buffer processing
    if (this.bufferedAction) {
      this.bufferedAction.timer -= delta;
      if (this.bufferedAction.timer <= 0) {
        this.bufferedAction = null;
      } else {
        const act = this.bufferedAction.action;
        const isGrounded = Math.abs(this.playerY - this.currentGroundY) < 0.14;
        if (act === 'jump' && isGrounded) {
          this.bufferedAction = null;
          this.jump();
        } else if (act === 'slide') {
          this.bufferedAction = null;
          this.slide();
        } else if (act === 'left' && this.laneTransitionTimer >= this.laneTransitionDuration * 0.65) {
          this.bufferedAction = null;
          this.moveLeft();
        } else if (act === 'right' && this.laneTransitionTimer >= this.laneTransitionDuration * 0.65) {
          this.bufferedAction = null;
          this.moveRight();
        }
      }
    }

    // Highly responsive, deterministic lane position timing (sinusoidal ease-out)
    if (this.laneTransitionTimer < this.laneTransitionDuration) {
      this.laneTransitionTimer += delta;
      const t = Math.min(1, this.laneTransitionTimer / this.laneTransitionDuration);
      const ease = Math.sin((t * Math.PI) / 2);
      this.playerX = THREE.MathUtils.lerp(this.laneStartX, this.laneTargetX, ease);
      if (t >= 1) {
        this.playerX = this.laneTargetX;
      }
    } else {
      this.playerX = this.laneTargetX;
    }

    // Reset tilt angle gradually with athletic snap-back
    this.character.tiltAngle = THREE.MathUtils.lerp(this.character.tiltAngle, 0, 1 - Math.exp(-14 * delta));

    // Slide state timer
    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.character.isSliding = false;
      }
    }

    // Invulnerability timer
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer -= delta;
      this.character.mesh.visible = Math.floor(time / 70) % 2 === 0;
    } else {
      this.character.mesh.visible = true;
    }

    // Update Ground Elevation & Surface Detection (train roofs, ramps)
    this.updateGroundElevation();

    // Jump & Gravity Physics
    const isJetpack = this.activePowerUps.has('jetpack');
    const isJetpackFlight = isJetpack || this.isJetpackDescending;

    if (isJetpack) {
      // Smoothly ascend and float in sky corridor
      this.playerY = THREE.MathUtils.lerp(this.playerY, JETPACK_Y, 0.12);
      this.velocityY = 0;
      this.character.isJetpack = true;
    } else if (this.isJetpackDescending) {
      this.jetpackDescentTimer -= delta;
      const progress = Math.max(0, this.jetpackDescentTimer / 1.4);
      // Smooth glide descent curve down to currentGroundY
      const targetSkyY = THREE.MathUtils.lerp(this.currentGroundY, JETPACK_Y, progress * progress);
      this.playerY = THREE.MathUtils.lerp(this.playerY, targetSkyY, 0.18);
      this.velocityY = 0;
      this.character.isJetpack = true;

      // Touchdown completion
      if (this.jetpackDescentTimer <= 0 || this.playerY <= this.currentGroundY + 0.1) {
        this.playerY = this.currentGroundY;
        this.isJetpackDescending = false;
        this.character.isJetpack = false;
        this.character.isJumping = false;
        this.invulnerabilityTimer = 2.0; // 2 seconds safety upon landing!
        this.wasOnGround = true;
        this.coyoteTimer = COYOTE_TIME;
        soundManager.playLanding();
      }
    } else {
      // Normal Gravity
      this.velocityY -= (this.isSliding ? FAST_FALL_GRAVITY : GRAVITY) * delta;
      this.playerY += this.velocityY * delta;

      // Ground / Train roof floor collision
      if (this.playerY <= this.currentGroundY) {
        this.playerY = this.currentGroundY;
        this.velocityY = 0;
        this.character.isJumping = false;
        this.coyoteTimer = COYOTE_TIME;
        this.wasOnGround = true;
      } else if (this.wasOnGround) {
        this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
      }
    }

    // Update 3D Character mesh position
    this.character.mesh.position.set(this.playerX, this.playerY, this.playerZ);
    this.character.update(delta, this.speed);

    // Update Grumpy Inspector & Dog pursuit physics
    this.inspector.update(delta, this.playerX, this.playerY, this.playerZ, this.speed);
    const alertInfo = this.inspector.getAlertStatus();
    this.stats.isInspectorAlerted = alertInfo.isAlerted;
    this.stats.inspectorDistanceRatio = alertInfo.distanceRatio;
    this.stats.currentSpeed = Math.round(this.speed);
    this.stats.speedMultiplier = Number((this.speed / INITIAL_SPEED).toFixed(1));
    this.stats.speedTier = this.speed >= 34 ? 'EXTREME' : this.speed >= 28 ? 'VERY FAST' : this.speed >= 22 ? 'FAST' : 'NORMAL';

    // Update obstacles, coins, and environment
    this.obstacleManager.update(delta, this.playerZ, this.speed);
    this.obstacleManager.removeOldObjects(this.playerZ);
    this.environment.update(this.playerZ);
    this.generateCourseAhead();

    // Check collisions and power-up durations
    this.checkCollisions();
    this.updatePowerUps(delta);

    // Leaving train transition timer decay
    if (this.leavingTrainTimer > 0) {
      if (this.playerY <= 0.08 && this.velocityY <= 0) {
        this.leavingTrainTimer = Math.max(0, this.leavingTrainTimer - delta * 3.0);
      } else {
        this.leavingTrainTimer = Math.max(0, this.leavingTrainTimer - delta);
      }
    }

    // Dynamic Cinematic Camera System:
    // Tailored angles for Ground, Jetpack Sky, Climbing, Rooftop, and Leaving/Diving transitions
    let targetCamDistZ = 6.6;
    let targetCamHeight = 4.1;
    let targetLookAheadZ = 6.0;
    let targetLookHeight = 1.7;
    let targetFOVOffset = 0;

    if (isJetpackFlight) {
      targetCamDistZ = 8.2;
      targetCamHeight = 3.6;
      targetLookAheadZ = 9.5;
      targetLookHeight = 1.2;
      targetFOVOffset = 14;
    } else if (this.isClimbingTrain) {
      // CLIMBING TRAIN CAMERA ANGLE:
      const climbFactor = Math.max(0.3, this.trainClimbProgress);
      targetCamDistZ = 7.8 + climbFactor * 0.5;
      targetCamHeight = 5.4 + climbFactor * 1.0;
      targetLookAheadZ = 9.2 + climbFactor * 1.6;
      targetLookHeight = 2.6 + climbFactor * 0.4;
      targetFOVOffset = 4;
    } else if (this.isOnTrainRoof) {
      // ROOFTOP CRUISING CAMERA ANGLE:
      targetCamDistZ = 7.2;
      targetCamHeight = 4.9;
      targetLookAheadZ = 7.8;
      targetLookHeight = 2.1;
      targetFOVOffset = 2;
    } else if (this.leavingTrainTimer > 0) {
      // LEAVING TRAIN CAMERA ANGLE:
      const leaveRatio = this.leavingTrainTimer / 0.9;
      targetCamDistZ = 6.6 + leaveRatio * 0.8;
      targetCamHeight = 4.4 + leaveRatio * 1.8;
      targetLookAheadZ = 5.2 - leaveRatio * 0.8;
      targetLookHeight = 0.9 + (1 - leaveRatio) * 0.8;
      targetFOVOffset = leaveRatio * 4;
    }

    const cameraTargetZ = this.playerZ - targetCamDistZ;
    const cameraTargetY = isJetpackFlight
      ? this.playerY + targetCamHeight
      : this.playerY * 0.46 + targetCamHeight;
    const cameraTargetX = this.playerX * 0.42;

    // Smooth camera position with natural damping
    const camPosLerp = 1 - Math.exp(-12 * delta);
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, cameraTargetX, camPosLerp);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, cameraTargetY, camPosLerp);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, cameraTargetZ, 1 - Math.exp(-14 * delta));

    // Smooth LookAt Target point (smoothly pans the camera pitch & angle)
    const targetX = this.playerX * 0.22;
    const targetY = isJetpackFlight
      ? this.playerY + targetLookHeight
      : this.playerY * 0.48 + targetLookHeight;
    const targetZ = this.playerZ + targetLookAheadZ;

    const camLookLerp = 1 - Math.exp(-11 * delta);
    this.currentLookTarget.x = THREE.MathUtils.lerp(this.currentLookTarget.x, targetX, camLookLerp);
    this.currentLookTarget.y = THREE.MathUtils.lerp(this.currentLookTarget.y, targetY, camLookLerp);
    this.currentLookTarget.z = THREE.MathUtils.lerp(this.currentLookTarget.z, targetZ, 1 - Math.exp(-13 * delta));

    this.camera.lookAt(this.currentLookTarget);

    // Screen Shake effect
    if (this.screenShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.screenShake;
      this.camera.position.y += (Math.random() - 0.5) * this.screenShake;
      this.screenShake = Math.max(0, this.screenShake - delta * 2.5);
    }

    // Dynamic FOV (widens with speed or special states)
    const targetFOV = this.baseFOV + (this.speed - INITIAL_SPEED) * 0.4 + targetFOVOffset;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, 0.12);
    this.camera.updateProjectionMatrix();

    // UI stats callback
    if (this.onStatsUpdate) {
      this.onStatsUpdate({ ...this.stats });
    }

    // Render 3D Frame
    this.renderer.render(this.scene, this.camera);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  public getPerformanceMetrics() {
    if (!this.renderer) return null;
    return {
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      lines: this.renderer.info.render.lines,
      points: this.renderer.info.render.points,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      programs: this.renderer.info.programs ? this.renderer.info.programs.length : 0,
      activeObstacles: this.obstacleManager ? this.obstacleManager.obstacleObjects.size : 0,
      activeCoins: this.obstacleManager ? this.obstacleManager.coinObjects.size : 0,
      activePowerUps: this.obstacleManager ? this.obstacleManager.powerUpObjects.size : 0,
      speed: this.speed,
      playerZ: this.playerZ,
    };
  }

  public destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    soundManager.stopBGM();
    this.obstacleManager.clearAll();
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
