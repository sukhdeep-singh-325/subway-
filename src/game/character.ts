import * as THREE from 'three';
import { CharacterSkin, HoverboardSkin } from '../types/game';

export class Character {
  public mesh: THREE.Group;
  public hitbox: THREE.Box3;

  // Body parts for animation
  private bodyRoot: THREE.Group;
  private head: THREE.Group;
  private torsoGroup: THREE.Group;
  private hoodie: THREE.Mesh;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private hoverboardMesh: THREE.Group;
  private jetpackMesh: THREE.Group;
  private sneakerMeshes: THREE.Group[] = [];

  // Headwear & face accessories
  private headwearGroup: THREE.Group;
  private faceGroup: THREE.Group;
  private backAccessoryGroup: THREE.Group;

  // Particle systems
  private jetpackFlames: THREE.Mesh[] = [];
  private runDustParticles: THREE.Points;
  private dustPositions: Float32Array;

  // Dynamic animation elements
  private ninjaScarf?: THREE.Mesh;
  private chestReactor?: THREE.Mesh;
  private visorLight?: THREE.Mesh;
  private tagbotKey?: THREE.Group;
  private alienAntennae?: THREE.Group;
  private freshBoombox?: THREE.Group;

  // State
  private runCycleTime: number = 0;
  public isSliding: boolean = false;
  public isJumping: boolean = false;
  public isHoverboard: boolean = false;
  public isJetpack: boolean = false;
  public hasSneakers: boolean = false;
  public isShieldActive: boolean = false;
  public isCrashed: boolean = false;
  public tiltAngle: number = 0; // for lane change banking

  private shieldBubble: THREE.Mesh;
  private currentSkin: CharacterSkin;
  private currentBoardSkin: HoverboardSkin;

  constructor(skin: CharacterSkin, hoverboardSkin: HoverboardSkin) {
    this.currentSkin = skin;
    this.currentBoardSkin = hoverboardSkin;
    this.mesh = new THREE.Group();
    this.hitbox = new THREE.Box3();

    this.bodyRoot = new THREE.Group();
    this.mesh.add(this.bodyRoot);

    this.head = new THREE.Group();
    this.torsoGroup = new THREE.Group();
    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.leftLeg = new THREE.Group();
    this.rightLeg = new THREE.Group();
    this.headwearGroup = new THREE.Group();
    this.faceGroup = new THREE.Group();
    this.backAccessoryGroup = new THREE.Group();

    // Placeholder mesh for hoodie before build
    this.hoodie = new THREE.Mesh();

    // Running dust particles
    const dustCount = 28;
    const dustGeo = new THREE.BufferGeometry();
    this.dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      this.dustPositions[i * 3] = (Math.random() - 0.5) * 0.7;
      this.dustPositions[i * 3 + 1] = Math.random() * 0.35;
      this.dustPositions[i * 3 + 2] = -Math.random() * 1.6;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xdddddd,
      size: 0.18,
      transparent: true,
      opacity: 0.65,
    });
    this.runDustParticles = new THREE.Points(dustGeo, dustMat);
    this.mesh.add(this.runDustParticles);

    // Soft ground shadow beneath runner
    const shadowGeo = new THREE.PlaneGeometry(1.4, 1.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    this.mesh.add(shadow);

    // Hoverboard & Jetpack placeholders
    this.hoverboardMesh = new THREE.Group();
    this.jetpackMesh = new THREE.Group();

    // 3D Holographic Aegis Shield Bubble
    const shieldBubbleGeo = new THREE.SphereGeometry(1.26, 24, 24);
    const shieldBubbleMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      transparent: true,
      opacity: 0.38,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x00b4d8,
      emissiveIntensity: 0.5,
    });
    this.shieldBubble = new THREE.Mesh(shieldBubbleGeo, shieldBubbleMat);
    this.shieldBubble.position.y = 1.05;
    this.shieldBubble.visible = false;
    this.mesh.add(this.shieldBubble);

    // Build the full 3D character model
    this.buildCharacter();
  }

  public setShieldActive(active: boolean) {
    this.isShieldActive = active;
    this.shieldBubble.visible = active;
  }

  private buildCharacter() {
    // Clear existing children from bodyRoot
    while (this.bodyRoot.children.length > 0) {
      this.bodyRoot.remove(this.bodyRoot.children[0]);
    }

    const skin = this.currentSkin;
    const model = skin.characterModel || 'classic_runner';
    const isRobot = model === 'cyber_cyborg' || model === 'tagbot_retro';
    const isNinja = model === 'ninja_shinobi';
    const isAlien = model === 'alien_yutani';
    const isFrank = model === 'frank_masquerade';
    const isKing = model === 'king_royal';
    const isTagbot = model === 'tagbot_retro';
    const isBrody = model === 'surfer_brody';
    const isPrinceK = model === 'prince_k';
    const isZoe = model === 'zombie_zoe';
    const isBoombot = model === 'boombot_dj';
    const isFresh = skin.id === 'fresh_cyber';
    const isSpike = skin.id === 'spike_gold';
    const isLucy = skin.id === 'lucy_punk';

    const skinColor = skin.colorScheme.skinTone ?? (isRobot ? 0x8892b0 : 0xffd3b6);
    const hairColor = skin.colorScheme.hairColor ?? 0x332211;

    // High quality MeshStandardMaterials with tuned PBR parameters
    const hoodieMat = new THREE.MeshStandardMaterial({
      color: skin.colorScheme.hoodie,
      roughness: isRobot ? 0.22 : 0.45,
      metalness: isRobot ? 0.75 : 0.08,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: isRobot ? 0.28 : 0.58,
      metalness: isRobot ? 0.6 : 0.02,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: skin.colorScheme.pants,
      roughness: isRobot ? 0.35 : 0.7,
      metalness: isRobot ? 0.5 : 0.04,
    });
    const capMat = new THREE.MeshStandardMaterial({
      color: skin.colorScheme.cap,
      roughness: 0.35,
      metalness: isRobot ? 0.65 : 0.12,
    });
    const shoesMat = new THREE.MeshStandardMaterial({
      color: skin.colorScheme.shoes,
      roughness: 0.28,
      metalness: 0.1,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: skin.colorScheme.accent,
      roughness: 0.2,
      metalness: isRobot ? 0.85 : 0.4,
      emissive: isRobot ? skin.colorScheme.accent : 0x000000,
      emissiveIntensity: isRobot ? 0.35 : 0,
    });

    // ==========================================
    // 1. Torso & Upper Body (Stylized 3D Sculpt)
    // ==========================================
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.y = 1.16;

    // Main sculpted torso: upper chest + tapered athletic waist
    const upperChestGeo = new THREE.BoxGeometry(0.74, 0.52, 0.48);
    this.hoodie = new THREE.Mesh(upperChestGeo, hoodieMat);
    this.hoodie.position.y = 0.20;
    this.hoodie.castShadow = true;
    this.torsoGroup.add(this.hoodie);

    // Tapered lower torso / abdomen
    const lowerTorsoGeo = new THREE.BoxGeometry(0.68, 0.36, 0.44);
    const lowerTorso = new THREE.Mesh(lowerTorsoGeo, hoodieMat);
    lowerTorso.position.y = -0.16;
    lowerTorso.castShadow = true;
    this.torsoGroup.add(lowerTorso);

    // Ribbed waistband hem
    const hemGeo = new THREE.BoxGeometry(0.70, 0.08, 0.45);
    const hemMat = new THREE.MeshStandardMaterial({
      color: skin.colorScheme.hoodie,
      roughness: 0.6,
      metalness: 0.05,
    });
    const hem = new THREE.Mesh(hemGeo, hemMat);
    hem.position.y = -0.36;
    this.torsoGroup.add(hem);

    // 3D Collar / Hoodie Neck rim
    const collarGeo = new THREE.CylinderGeometry(0.24, 0.27, 0.12, 16);
    const collar = new THREE.Mesh(collarGeo, isFrank ? new THREE.MeshStandardMaterial({ color: 0xffffff }) : accentMat);
    collar.position.set(0, 0.48, 0);
    this.torsoGroup.add(collar);

    // 3D Draped Hood on back of neck
    if (!isRobot && !isFrank && !isAlien && !isKing) {
      const drapedHoodGeo = new THREE.BoxGeometry(0.54, 0.32, 0.18);
      const drapedHood = new THREE.Mesh(drapedHoodGeo, hoodieMat);
      drapedHood.position.set(0, 0.36, -0.26);
      drapedHood.rotation.x = -0.22;
      this.torsoGroup.add(drapedHood);
    }

    // Front zipper line / necktie / suit styling
    if (isFrank) {
      // White shirt triangle
      const shirtGeo = new THREE.BoxGeometry(0.26, 0.45, 0.06);
      const shirtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const shirt = new THREE.Mesh(shirtGeo, shirtMat);
      shirt.position.set(0, 0.22, 0.24);
      this.torsoGroup.add(shirt);

      // Red silk necktie with gold clip
      const tieGeo = new THREE.BoxGeometry(0.08, 0.44, 0.04);
      const tieMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.35 });
      const tie = new THREE.Mesh(tieGeo, tieMat);
      tie.position.set(0, 0.14, 0.27);
      this.torsoGroup.add(tie);

      const tieClip = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.025, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      tieClip.position.set(0, 0.20, 0.28);
      this.torsoGroup.add(tieClip);

      // Tuxedo Lapels
      const lapelGeo = new THREE.BoxGeometry(0.12, 0.52, 0.04);
      const lapelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });
      const lapelL = new THREE.Mesh(lapelGeo, lapelMat);
      lapelL.position.set(-0.16, 0.20, 0.26);
      lapelL.rotation.z = -0.15;
      const lapelR = lapelL.clone();
      lapelR.position.x = 0.16;
      lapelR.rotation.z = 0.15;
      this.torsoGroup.add(lapelL);
      this.torsoGroup.add(lapelR);
    } else if (isKing) {
      // Royal gold sash & crest
      const sashGeo = new THREE.BoxGeometry(0.14, 0.88, 0.50);
      const sashMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85, roughness: 0.2 });
      const sash = new THREE.Mesh(sashGeo, sashMat);
      sash.rotation.z = -0.42;
      this.torsoGroup.add(sash);

      // Royal Gold Medallion
      const medalGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.03, 16);
      const medal = new THREE.Mesh(medalGeo, sashMat);
      medal.rotation.x = Math.PI / 2;
      medal.position.set(0, 0.18, 0.26);
      this.torsoGroup.add(medal);
    } else if (isAlien) {
      // Yutani astronaut suit belly patch with Saturn emblem
      const patchGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.04, 18);
      const patchMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const patch = new THREE.Mesh(patchGeo, patchMat);
      patch.rotation.x = Math.PI / 2;
      patch.position.set(0, 0.06, 0.25);
      this.torsoGroup.add(patch);

      const ringGeo = new THREE.TorusGeometry(0.13, 0.022, 8, 20);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x52b788 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 0.06, 0.28);
      ring.rotation.x = 0.55;
      this.torsoGroup.add(ring);
    } else if (isPrinceK) {
      // Prince K pure gold layered chains with ruby medallion
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1 });
      const chain1 = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 20), goldMat);
      chain1.rotation.x = Math.PI / 3;
      chain1.position.set(0, 0.26, 0.23);
      this.torsoGroup.add(chain1);

      const chain2 = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 8, 20), goldMat);
      chain2.rotation.x = Math.PI / 3;
      chain2.position.set(0, 0.18, 0.24);
      this.torsoGroup.add(chain2);

      const rubyMedal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16),
        new THREE.MeshStandardMaterial({ color: 0xe63946, metalness: 0.8, roughness: 0.1 })
      );
      rubyMedal.rotation.x = Math.PI / 2;
      rubyMedal.position.set(0, 0.06, 0.26);
      this.torsoGroup.add(rubyMedal);
    } else if (isBrody) {
      // Brody lifeguard white cross emblem on chest
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      crossV.position.set(0, 0.16, 0.25);
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      crossH.position.set(0, 0.16, 0.25);
      this.torsoGroup.add(crossV);
      this.torsoGroup.add(crossH);

      // Silver lifeguard whistle
      const whistle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8),
        new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9 })
      );
      whistle.position.set(0, 0.02, 0.26);
      this.torsoGroup.add(whistle);
    } else if (isZoe) {
      // Zoe grunge stitched neon pink patch & safety pins
      const patch = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.18, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xf72585, roughness: 0.8 })
      );
      patch.rotation.z = -0.15;
      patch.position.set(-0.14, 0.12, 0.25);
      this.torsoGroup.add(patch);

      const pin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 })
      );
      pin.rotation.z = 0.8;
      pin.position.set(0.16, 0.20, 0.26);
      this.torsoGroup.add(pin);
    } else if (isBoombot) {
      // Boombot audio amplifier VU meter LEDs on chest
      const meter = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.28, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 })
      );
      meter.position.set(0, 0.12, 0.25);
      this.torsoGroup.add(meter);

      for (let i = -3; i <= 3; i++) {
        const barHeight = 0.06 + (4 - Math.abs(i)) * 0.035;
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, barHeight, 0.02),
          new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x00f5d4 : 0xff0055 })
        );
        bar.position.set(i * 0.065, 0.10, 0.28);
        this.torsoGroup.add(bar);
      }
    } else if (!isTagbot) {
      // 3D zipper teeth & metallic pull tag
      const zipGeo = new THREE.BoxGeometry(0.035, 0.74, 0.04);
      const zipMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.9, roughness: 0.2 });
      const zipper = new THREE.Mesh(zipGeo, zipMat);
      zipper.position.set(0, 0.05, 0.245);
      this.torsoGroup.add(zipper);

      const pullTag = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.08, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      pullTag.position.set(0, 0.32, 0.27);
      this.torsoGroup.add(pullTag);
    }

    // Chest detailing / Pockets / Tech reactor
    if (isTagbot) {
      // Retro robot gauge meter & flashing LED dials
      const meterGeo = new THREE.BoxGeometry(0.46, 0.28, 0.05);
      const meterMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
      const meter = new THREE.Mesh(meterGeo, meterMat);
      meter.position.set(0, 0.12, 0.25);
      this.torsoGroup.add(meter);

      const ledGeo = new THREE.SphereGeometry(0.045, 10, 10);
      const led1 = new THREE.Mesh(ledGeo, new THREE.MeshBasicMaterial({ color: 0x00f5d4 }));
      led1.position.set(-0.14, 0.12, 0.28);
      const led2 = new THREE.Mesh(ledGeo, new THREE.MeshBasicMaterial({ color: 0xff0055 }));
      led2.position.set(0.14, 0.12, 0.28);
      this.torsoGroup.add(led1);
      this.torsoGroup.add(led2);
    } else if (isRobot) {
      // Arc reactor power core with pulsing glow ring
      const coreGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.06, 20);
      const coreMat = new THREE.MeshBasicMaterial({ color: skin.colorScheme.accent });
      this.chestReactor = new THREE.Mesh(coreGeo, coreMat);
      this.chestReactor.rotation.x = Math.PI / 2;
      this.chestReactor.position.set(0, 0.12, 0.25);
      this.torsoGroup.add(this.chestReactor);

      const coreRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.15, 0.025, 8, 20),
        new THREE.MeshStandardMaterial({ color: 0x8892b0, metalness: 0.95 })
      );
      coreRing.position.set(0, 0.12, 0.27);
      this.torsoGroup.add(coreRing);

      // Carbon fiber armor breastplates
      const plateGeo = new THREE.BoxGeometry(0.68, 0.38, 0.05);
      const plateMat = new THREE.MeshStandardMaterial({ color: 0x1f2735, metalness: 0.9, roughness: 0.25 });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.set(0, 0.12, 0.23);
      this.torsoGroup.add(plate);
    } else if (!isFrank && !isKing && !isAlien) {
      // 3D Kangaroo pocket with curved stitching
      const pocketGeo = new THREE.BoxGeometry(0.50, 0.28, 0.09);
      const pocket = new THREE.Mesh(pocketGeo, hoodieMat);
      pocket.position.set(0, -0.16, 0.24);
      this.torsoGroup.add(pocket);

      // Hoodie Drawstrings with metallic tips (aglets)
      const strGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.26, 6);
      const strMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const agletMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 });

      const strL = new THREE.Mesh(strGeo, strMat);
      strL.position.set(-0.11, 0.14, 0.26);
      const agletL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 6), agletMat);
      agletL.position.y = -0.13;
      strL.add(agletL);

      const strR = strL.clone();
      strR.position.x = 0.11;
      this.torsoGroup.add(strL);
      this.torsoGroup.add(strR);
    }

    // ==========================================
    // Back Accessory (Backpack, Katana, Key, etc.)
    // ==========================================
    this.backAccessoryGroup = new THREE.Group();
    if (isTagbot) {
      // Brass clockwork wind-up key that spins dynamically!
      this.tagbotKey = new THREE.Group();
      this.tagbotKey.position.set(0, 1.25, -0.28);

      const stemGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.22, 10);
      const goldBrassMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.15 });
      const stem = new THREE.Mesh(stemGeo, goldBrassMat);
      stem.rotation.x = Math.PI / 2;
      stem.position.z = -0.11;
      this.tagbotKey.add(stem);

      const wingL = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.04, 10, 20), goldBrassMat);
      wingL.position.set(-0.11, 0, -0.22);
      const wingR = wingL.clone();
      wingR.position.x = 0.11;
      this.tagbotKey.add(wingL);
      this.tagbotKey.add(wingR);

      this.backAccessoryGroup.add(this.tagbotKey);
    } else if (isKing) {
      // Flowing royal velvet mantle with ermine fur collar and gold trim
      const capeGeo = new THREE.BoxGeometry(0.78, 1.28, 0.06);
      const capeMat = new THREE.MeshStandardMaterial({ color: 0x9b0e36, roughness: 0.85 });
      const cape = new THREE.Mesh(capeGeo, capeMat);
      cape.position.set(0, 0.90, -0.26);
      cape.rotation.x = 0.12;

      // Ermine fur collar with spotted accents
      const furGeo = new THREE.BoxGeometry(0.82, 0.18, 0.12);
      const furMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.9 });
      const fur = new THREE.Mesh(furGeo, furMat);
      fur.position.set(0, 1.48, -0.24);
      this.backAccessoryGroup.add(cape);
      this.backAccessoryGroup.add(fur);
    } else if (isNinja) {
      // Twin crossed ninjato swords on back
      const scabbardGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.22, 8);
      const scabbardMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
      const hiltMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85 });

      const sword1 = new THREE.Mesh(scabbardGeo, scabbardMat);
      sword1.rotation.z = 0.65;
      sword1.position.set(0, 1.2, -0.28);
      const hilt1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.36, 8), hiltMat);
      hilt1.position.y = 0.68;
      sword1.add(hilt1);

      const sword2 = new THREE.Mesh(scabbardGeo, scabbardMat);
      sword2.rotation.z = -0.65;
      sword2.position.set(0, 1.2, -0.28);
      const hilt2 = hilt1.clone();
      sword2.add(hilt2);

      this.backAccessoryGroup.add(sword1);
      this.backAccessoryGroup.add(sword2);
    } else if (isAlien) {
      // Yutani dual rocket oxygen booster tanks
      const tankGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.58, 14);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.2 });
      const tankL = new THREE.Mesh(tankGeo, tankMat);
      tankL.position.set(-0.17, 1.2, -0.32);
      const tankR = tankL.clone();
      tankR.position.x = 0.17;
      this.backAccessoryGroup.add(tankL);
      this.backAccessoryGroup.add(tankR);
    } else if (isFresh) {
      // Fresh's Retro Stereo Boombox on shoulder
      this.freshBoombox = this.createBoombox();
      this.freshBoombox.position.set(0.38, 1.48, -0.15);
      this.backAccessoryGroup.add(this.freshBoombox);
    } else if (isBrody) {
      // Brody: Lifeguard rescue flotation buoy (torpedo buoy)
      const buoyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.92, 14);
      const buoyMat = new THREE.MeshStandardMaterial({ color: 0xff3b30, roughness: 0.35 });
      const buoy = new THREE.Mesh(buoyGeo, buoyMat);
      buoy.rotation.z = 0.55;
      buoy.position.set(0, 1.25, -0.28);

      const strapGeo = new THREE.TorusGeometry(0.36, 0.02, 6, 18);
      const strap = new THREE.Mesh(strapGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      strap.position.set(0, 1.25, -0.26);

      this.backAccessoryGroup.add(buoy);
      this.backAccessoryGroup.add(strap);
    } else if (isPrinceK) {
      // Prince K: Gilded pure gold royal capelet
      const capeGeo = new THREE.BoxGeometry(0.72, 1.15, 0.05);
      const capeMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.15 });
      const cape = new THREE.Mesh(capeGeo, capeMat);
      cape.position.set(0, 0.92, -0.26);
      cape.rotation.x = 0.12;
      this.backAccessoryGroup.add(cape);
    } else if (isBoombot) {
      // Boombot: Twin vinyl LP turntables mounted on back
      const vinylMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.95, roughness: 0.1 });
      const vinylL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 20), vinylMat);
      vinylL.rotation.x = Math.PI / 2;
      vinylL.position.set(-0.20, 1.25, -0.28);
      const vinylR = vinylL.clone();
      vinylR.position.x = 0.20;
      this.backAccessoryGroup.add(vinylL);
      this.backAccessoryGroup.add(vinylR);
    } else if (!isFrank) {
      // Classic Urban Streetwear Backpack
      const packGeo = new THREE.BoxGeometry(0.54, 0.66, 0.28);
      const pack = new THREE.Mesh(packGeo, accentMat);
      pack.position.set(0, 1.2, -0.32);
      pack.castShadow = true;
      this.backAccessoryGroup.add(pack);

      // Spray paint cans holstered on backpack
      const canGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.30, 12);
      const canMat = new THREE.MeshStandardMaterial({ color: skin.colorScheme.cap, metalness: 0.75 });
      const canL = new THREE.Mesh(canGeo, canMat);
      canL.position.set(-0.30, 1.15, -0.30);
      const canR = canL.clone();
      canR.position.x = 0.30;
      this.backAccessoryGroup.add(canL);
      this.backAccessoryGroup.add(canR);
    }
    this.bodyRoot.add(this.backAccessoryGroup);
    this.bodyRoot.add(this.torsoGroup);

    // ==========================================
    // 2. Head & Facial Expressions (Stylized 3D)
    // ==========================================
    this.head = new THREE.Group();
    this.head.position.y = 1.90;

    // Stylized Head Mesh: smooth sphere with slight jaw taper
    const headGeo = new THREE.SphereGeometry(0.35, 20, 20);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // 3D Sculpted Ears
    if (!isRobot) {
      const earGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.04, 10);
      const earL = new THREE.Mesh(earGeo, skinMat);
      earL.rotation.z = Math.PI / 2;
      earL.position.set(-0.35, 0.02, 0);
      const earR = earL.clone();
      earR.position.x = 0.35;
      this.head.add(earL);
      this.head.add(earR);

      // Spike & Lucy punk piercings
      if (isSpike || isLucy) {
        const ringGeo = new THREE.TorusGeometry(0.035, 0.012, 6, 12);
        const silverMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 });
        const ring = new THREE.Mesh(ringGeo, silverMat);
        ring.position.set(-0.36, -0.02, 0.02);
        this.head.add(ring);
      }
    }

    // 3D Sculpted Nose
    if (!isRobot && !isFrank && !isAlien) {
      const noseGeo = new THREE.ConeGeometry(0.05, 0.10, 6);
      const nose = new THREE.Mesh(noseGeo, skinMat);
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, 0.02, 0.36);
      this.head.add(nose);
    }

    // Expressive Eyes / Visor / Masks
    this.faceGroup = new THREE.Group();
    if (isTagbot) {
      // CRT Monitor Face with Cyan Pixel Grid
      const screenGeo = new THREE.BoxGeometry(0.50, 0.40, 0.06);
      const screenMat = new THREE.MeshBasicMaterial({ color: 0x002222 });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, 0.02, 0.32);
      this.faceGroup.add(screen);

      // Glowing digital cyan pixel eyes
      const pixelEyeGeo = new THREE.BoxGeometry(0.11, 0.09, 0.02);
      const pixelEyeMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
      const pEyeL = new THREE.Mesh(pixelEyeGeo, pixelEyeMat);
      pEyeL.position.set(-0.12, 0.06, 0.36);
      const pEyeR = pEyeL.clone();
      pEyeR.position.x = 0.12;
      this.faceGroup.add(pEyeL);
      this.faceGroup.add(pEyeR);

      // Glowing digital smile
      const smileGeo = new THREE.BoxGeometry(0.24, 0.035, 0.02);
      const smile = new THREE.Mesh(smileGeo, pixelEyeMat);
      smile.position.set(0, -0.06, 0.36);
      this.faceGroup.add(smile);
    } else if (isFrank) {
      // Frank's iconic sculpted white rabbit masquerade mask
      const maskGeo = new THREE.BoxGeometry(0.58, 0.46, 0.14);
      const maskMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.3 });
      const mask = new THREE.Mesh(maskGeo, maskMat);
      mask.position.set(0, 0.04, 0.32);
      this.faceGroup.add(mask);

      // Dark sinister eye cutouts
      const darkEyeGeo = new THREE.BoxGeometry(0.13, 0.07, 0.04);
      const darkEyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const dEyeL = new THREE.Mesh(darkEyeGeo, darkEyeMat);
      dEyeL.position.set(-0.13, 0.06, 0.40);
      const dEyeR = dEyeL.clone();
      dEyeR.position.x = 0.13;
      this.faceGroup.add(dEyeL);
      this.faceGroup.add(dEyeR);

      // Long white rabbit ears with pink inner lining
      const earGeo = new THREE.BoxGeometry(0.13, 0.58, 0.06);
      const innerEarGeo = new THREE.BoxGeometry(0.07, 0.46, 0.03);
      const pinkMat = new THREE.MeshStandardMaterial({ color: 0xff85a1, roughness: 0.5 });

      const makeBunnyEar = (x: number, angleZ: number) => {
        const ear = new THREE.Group();
        ear.position.set(x, 0.48, 0.18);
        ear.rotation.z = angleZ;
        const outer = new THREE.Mesh(earGeo, maskMat);
        ear.add(outer);
        const inner = new THREE.Mesh(innerEarGeo, pinkMat);
        inner.position.z = 0.03;
        ear.add(inner);
        return ear;
      };

      this.faceGroup.add(makeBunnyEar(-0.16, 0.15));
      this.faceGroup.add(makeBunnyEar(0.16, -0.15));
    } else if (isAlien) {
      // Yutani 3 Alien Eye Stalks on top of forehead with blinking pupils
      const stalkGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.28, 8);
      const stalkMat = new THREE.MeshStandardMaterial({ color: 0x52b788, roughness: 0.5 });
      const alienEyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const alienPupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

      const angles = [-0.17, 0, 0.17];
      angles.forEach((xPos) => {
        const stalkGroup = new THREE.Group();
        stalkGroup.position.set(xPos, 0.28, 0.2);
        stalkGroup.rotation.z = -xPos * 1.5;

        const stalk = new THREE.Mesh(stalkGeo, stalkMat);
        stalk.position.y = 0.12;
        stalkGroup.add(stalk);

        const eyeBall = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), alienEyeMat);
        eyeBall.position.set(0, 0.27, 0.04);
        stalkGroup.add(eyeBall);

        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), alienPupilMat);
        pupil.position.set(0, 0.27, 0.12);
        stalkGroup.add(pupil);

        this.faceGroup.add(stalkGroup);
      });

      // Cute mouth
      const mouth = new THREE.Mesh(
        new THREE.TorusGeometry(0.08, 0.02, 6, 14, Math.PI),
        new THREE.MeshBasicMaterial({ color: 0x222222 })
      );
      mouth.position.set(0, -0.08, 0.34);
      this.faceGroup.add(mouth);
    } else if (isRobot) {
      // Holographic Visor Screen across face
      const visorGeo = new THREE.BoxGeometry(0.52, 0.13, 0.12);
      const visorMat = new THREE.MeshBasicMaterial({ color: skin.colorScheme.visorColor ?? 0x00ffff });
      this.visorLight = new THREE.Mesh(visorGeo, visorMat);
      this.visorLight.position.set(0, 0.04, 0.32);
      this.faceGroup.add(this.visorLight);
    } else if (isNinja) {
      // Ninja cowl / stealth mask covering mouth and nose
      const maskGeo = new THREE.CylinderGeometry(0.34, 0.36, 0.26, 18);
      const maskMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.5 });
      const mask = new THREE.Mesh(maskGeo, maskMat);
      mask.position.set(0, -0.1, 0.05);
      this.faceGroup.add(mask);

      // Glowing white shinobi eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.035, 0.02), eyeMat);
      eyeL.position.set(-0.11, 0.08, 0.34);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.11;
      this.faceGroup.add(eyeL);
      this.faceGroup.add(eyeR);

      // Flowing red ninja scarf tails
      const scarfGeo = new THREE.BoxGeometry(0.20, 0.06, 0.72);
      const scarfMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.3 });
      this.ninjaScarf = new THREE.Mesh(scarfGeo, scarfMat);
      this.ninjaScarf.position.set(0, -0.16, -0.42);
      this.faceGroup.add(this.ninjaScarf);
    } else if (isBoombot) {
      // Boombot Speaker Grill Face & Woofer Eyes
      const grill = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.44, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x161616, metalness: 0.9, roughness: 0.2 })
      );
      grill.position.set(0, 0, 0.30);
      this.faceGroup.add(grill);

      const wooferL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.08, 0.05, 16),
        new THREE.MeshStandardMaterial({ color: 0x00f5d4, emissive: 0x00f5d4, emissiveIntensity: 0.7 })
      );
      wooferL.rotation.x = Math.PI / 2;
      wooferL.position.set(-0.14, 0.06, 0.36);
      const wooferR = wooferL.clone();
      wooferR.position.x = 0.14;
      this.faceGroup.add(wooferL);
      this.faceGroup.add(wooferR);

      const wave = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.04, 0.02),
        new THREE.MeshBasicMaterial({ color: 0xff0055 })
      );
      wave.position.set(0, -0.10, 0.36);
      this.faceGroup.add(wave);
    } else {
      // 3D Cartoon Expressive Eyes & Smirk
      const scleraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1c1c1c });
      const gleamMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      // Left eye
      const eyeGroupL = new THREE.Group();
      eyeGroupL.position.set(-0.11, 0.07, 0.32);

      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), scleraMat);
      eyeWhite.scale.set(1, 1.25, 0.5);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.040, 10, 10), pupilMat);
      pupil.position.set(0, 0, 0.042);
      const gleam = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), gleamMat);
      gleam.position.set(0.02, 0.02, 0.062);

      eyeGroupL.add(eyeWhite);
      eyeGroupL.add(pupil);
      eyeGroupL.add(gleam);

      // Confident Eyebrow
      const browGeo = new THREE.BoxGeometry(0.12, 0.03, 0.03);
      const browMat = new THREE.MeshBasicMaterial({ color: hairColor });
      const browL = new THREE.Mesh(browGeo, browMat);
      browL.position.set(-0.11, 0.18, 0.34);
      browL.rotation.z = -0.18;

      const eyeGroupR = eyeGroupL.clone();
      eyeGroupR.position.x = 0.11;
      const browR = browL.clone();
      browR.position.x = 0.11;
      browR.rotation.z = 0.18;

      // Cool sunglasses for Spike, Fresh, Prince K
      if (isSpike) {
        const shadesGeo = new THREE.BoxGeometry(0.58, 0.15, 0.08);
        const shadesMat = new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.95, roughness: 0.1 });
        const shades = new THREE.Mesh(shadesGeo, shadesMat);
        shades.position.set(0, 0.06, 0.35);
        this.faceGroup.add(shades);
      } else if (isPrinceK) {
        // Prince K: 24k Gold Aviator Sunglasses with Diamond Accents
        const shadesGeo = new THREE.BoxGeometry(0.56, 0.14, 0.06);
        const goldFrameMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1 });
        const shades = new THREE.Mesh(shadesGeo, goldFrameMat);
        shades.position.set(0, 0.06, 0.35);

        const lensGeo = new THREE.BoxGeometry(0.22, 0.11, 0.02);
        const lensMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 });
        const lensL = new THREE.Mesh(lensGeo, lensMat);
        lensL.position.set(-0.12, 0.06, 0.38);
        const lensR = lensL.clone();
        lensR.position.x = 0.12;

        this.faceGroup.add(shades);
        this.faceGroup.add(lensL);
        this.faceGroup.add(lensR);
      } else {
        this.faceGroup.add(eyeGroupL);
        this.faceGroup.add(eyeGroupR);
        this.faceGroup.add(browL);
        this.faceGroup.add(browR);
      }

      // Smirking Mouth with White Teeth Flash
      const mouthGeo = new THREE.BoxGeometry(0.16, 0.04, 0.03);
      const mouthMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
      const mouth = new THREE.Mesh(mouthGeo, mouthMat);
      mouth.position.set(0.03, -0.12, 0.33);
      mouth.rotation.z = 0.12;
      this.faceGroup.add(mouth);

      const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.035), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      teeth.position.set(0.03, -0.11, 0.335);
      teeth.rotation.z = 0.12;
      this.faceGroup.add(teeth);

      // Zoe: Zombie cheek stitch mark
      if (isZoe) {
        const stitchBase = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.02), new THREE.MeshBasicMaterial({ color: 0x222222 }));
        stitchBase.position.set(-0.16, -0.06, 0.34);
        stitchBase.rotation.z = 0.35;
        this.faceGroup.add(stitchBase);

        for (let s = -1; s <= 1; s++) {
          const cross = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, 0.02), new THREE.MeshBasicMaterial({ color: 0xf72585 }));
          cross.position.set(-0.16 + s * 0.04, -0.06, 0.35);
          cross.rotation.z = 0.35;
          this.faceGroup.add(cross);
        }
      }

      // King's royal beard
      if (isKing) {
        const beardGeo = new THREE.ConeGeometry(0.18, 0.30, 10);
        const beardMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.8 });
        const beard = new THREE.Mesh(beardGeo, beardMat);
        beard.rotation.x = -0.4;
        beard.position.set(0, -0.22, 0.30);
        this.faceGroup.add(beard);
      }
    }
    this.head.add(this.faceGroup);

    // ==========================================
    // Headwear & Hair (Stylized by Character)
    // ==========================================
    this.headwearGroup = new THREE.Group();
    if (isAlien) {
      // Yutani alien antennae with bobbing green spheres
      this.alienAntennae = new THREE.Group();
      const antMat = new THREE.MeshStandardMaterial({ color: 0x52b788, roughness: 0.5 });
      const orbMat = new THREE.MeshStandardMaterial({ color: 0x74c69d, emissive: 0x52b788, emissiveIntensity: 0.5 });

      const makeAntenna = (x: number, angleZ: number) => {
        const aGroup = new THREE.Group();
        aGroup.position.set(x, 0.36, 0);
        aGroup.rotation.z = angleZ;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 8), antMat);
        stem.position.y = 0.18;
        aGroup.add(stem);
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), orbMat);
        orb.position.y = 0.38;
        aGroup.add(orb);
        return aGroup;
      };

      this.alienAntennae.add(makeAntenna(-0.2, 0.35));
      this.alienAntennae.add(makeAntenna(0.2, -0.35));
      this.headwearGroup.add(this.alienAntennae);
    } else if (isKing) {
      // Majestic 24k Golden Crown with 5 Spired Points, Rubies, and Sapphires
      const crownBaseGeo = new THREE.CylinderGeometry(0.38, 0.35, 0.16, 18);
      const crownMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.15 });
      const crownBase = new THREE.Mesh(crownBaseGeo, crownMat);
      crownBase.position.y = 0.3;
      this.headwearGroup.add(crownBase);

      const rubyMat = new THREE.MeshStandardMaterial({ color: 0xe63946, metalness: 0.85, roughness: 0.1 });
      const sapphireMat = new THREE.MeshStandardMaterial({ color: 0x0077b6, metalness: 0.85, roughness: 0.1 });

      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const point = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 6), crownMat);
        point.position.set(Math.cos(angle) * 0.35, 0.46, Math.sin(angle) * 0.35);
        this.headwearGroup.add(point);

        const gem = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), i % 2 === 0 ? rubyMat : sapphireMat);
        gem.position.set(Math.cos(angle) * 0.38, 0.34, Math.sin(angle) * 0.38);
        this.headwearGroup.add(gem);
      }
    } else if (isTagbot) {
      // Spring Antenna with Red Glowing Beacon
      const antStem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.36, 8),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 })
      );
      antStem.position.set(0, 0.50, 0);
      this.headwearGroup.add(antStem);

      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xff0055 })
      );
      beacon.position.set(0, 0.70, 0);
      this.headwearGroup.add(beacon);
    } else if (model === 'classic_runner') {
      // Jake's Backwards Baseball Cap with Seam Panels and Gold Badge
      const capCrownGeo = new THREE.SphereGeometry(0.37, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.52);
      const cap = new THREE.Mesh(capCrownGeo, capMat);
      cap.position.y = 0.06;

      const capBrimGeo = new THREE.BoxGeometry(0.40, 0.06, 0.36);
      const capBrim = new THREE.Mesh(capBrimGeo, capMat);
      capBrim.position.set(0, 0.09, -0.36);
      capBrim.rotation.x = 0.16;

      const capBadge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.02, 14),
        new THREE.MeshBasicMaterial({ color: 0xffd700 })
      );
      capBadge.rotation.x = Math.PI / 2;
      capBadge.position.set(0, 0.2, 0.36);

      // Hair tufts peeking out from cap sides
      const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.6 });
      const hairTuftL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), hairMat);
      hairTuftL.rotation.z = 0.6;
      hairTuftL.position.set(-0.32, -0.04, 0.15);
      const hairTuftR = hairTuftL.clone();
      hairTuftR.rotation.z = -0.6;
      hairTuftR.position.x = 0.32;

      this.headwearGroup.add(cap);
      this.headwearGroup.add(capBrim);
      this.headwearGroup.add(capBadge);
      this.headwearGroup.add(hairTuftL);
      this.headwearGroup.add(hairTuftR);

      // DJ Headphones around neck
      this.addHeadphones(this.headwearGroup, accentMat, capMat);
    } else if (model === 'punk_skater') {
      if (skin.id === 'tricky_neon') {
        // Tricky: Sideways Cap with Blonde Ponytail
        const capCrownGeo = new THREE.SphereGeometry(0.37, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.52);
        const cap = new THREE.Mesh(capCrownGeo, capMat);
        cap.position.y = 0.06;

        const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 0.34), capMat);
        capBrim.rotation.y = 0.6;
        capBrim.position.set(0.26, 0.08, 0.22);
        this.headwearGroup.add(cap);
        this.headwearGroup.add(capBrim);

        // Blonde side bangs & bouncy ponytail
        const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.5 });
        const ponyGeo = new THREE.CylinderGeometry(0.09, 0.16, 0.48, 12);
        const pony = new THREE.Mesh(ponyGeo, hairMat);
        pony.rotation.x = 0.8;
        pony.position.set(-0.26, 0.12, -0.36);
        this.headwearGroup.add(pony);
      } else {
        // Spike & Lucy: 5-Spike Punk Mohawk
        const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.35 });
        for (let i = -0.22; i <= 0.22; i += 0.1) {
          const spikeGeo = new THREE.ConeGeometry(0.09, 0.42, 6);
          const spike = new THREE.Mesh(spikeGeo, hairMat);
          spike.position.set(i, 0.42, (Math.random() - 0.5) * 0.18);
          spike.rotation.z = -i * 1.5;
          this.headwearGroup.add(spike);
        }
      }
    } else if (model === 'ninja_shinobi') {
      // Shinobi Forehead Protector (Hitai-ate)
      const bandGeo = new THREE.TorusGeometry(0.36, 0.065, 8, 24);
      const bandMat = new THREE.MeshStandardMaterial({ color: 0x111118 });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.12;
      this.headwearGroup.add(band);

      // Engraved Metal Forehead Guard
      const plateGeo = new THREE.BoxGeometry(0.25, 0.11, 0.04);
      const plateMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95 });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.set(0, 0.14, 0.35);
      this.headwearGroup.add(plate);
    } else if (model === 'street_graffiti') {
      // Trendsetting Streetwear Bucket Hat
      const hatBrimGeo = new THREE.CylinderGeometry(0.50, 0.48, 0.05, 24);
      const hatMat = new THREE.MeshStandardMaterial({ color: skin.colorScheme.cap, roughness: 0.5 });
      const brim = new THREE.Mesh(hatBrimGeo, hatMat);
      brim.position.y = 0.16;

      const crownGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.24, 24);
      const crown = new THREE.Mesh(crownGeo, hatMat);
      crown.position.y = 0.27;

      this.headwearGroup.add(brim);
      this.headwearGroup.add(crown);
      this.addHeadphones(this.headwearGroup, accentMat, capMat);
    } else if (model === 'cyber_cyborg') {
      // Cybernetic Antenna & Titanium Ear modules
      const earGeo = new THREE.BoxGeometry(0.09, 0.26, 0.16);
      const earMat = new THREE.MeshStandardMaterial({ color: 0x1a2332, metalness: 0.95 });
      const earL = new THREE.Mesh(earGeo, earMat);
      earL.position.set(-0.36, 0.05, 0);
      const earR = earL.clone();
      earR.position.x = 0.36;
      this.headwearGroup.add(earL);
      this.headwearGroup.add(earR);
    } else if (model === 'surfer_brody') {
      // Brody: Beach blonde surfer hair + perched orange sunglasses on forehead
      const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.55 });
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI - Math.PI / 2;
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.36, 6), hairMat);
        tuft.position.set(Math.sin(angle) * 0.28, 0.32, Math.cos(angle) * 0.22);
        tuft.rotation.z = -Math.sin(angle) * 0.4;
        tuft.rotation.x = 0.25;
        this.headwearGroup.add(tuft);
      }

      // Sunglasses pushed up onto forehead
      const shadesFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.12, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xff7b00, metalness: 0.6, roughness: 0.2 })
      );
      shadesFrame.position.set(0, 0.26, 0.32);
      shadesFrame.rotation.x = -0.35;
      this.headwearGroup.add(shadesFrame);

      const lensGeo = new THREE.BoxGeometry(0.22, 0.10, 0.02);
      const lensMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.95 });
      const lensL = new THREE.Mesh(lensGeo, lensMat);
      lensL.position.set(-0.12, 0.26, 0.36);
      lensL.rotation.x = -0.35;
      const lensR = lensL.clone();
      lensR.position.x = 0.12;
      this.headwearGroup.add(lensL);
      this.headwearGroup.add(lensR);
    } else if (model === 'prince_k') {
      // Prince K: Regal draped ivory turban with 24k gold aigrette & diamond brooch
      const turbanCrown = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6),
        new THREE.MeshStandardMaterial({ color: 0xfffdf0, roughness: 0.4 })
      );
      turbanCrown.position.y = 0.15;
      this.headwearGroup.add(turbanCrown);

      const bandGeo = new THREE.TorusGeometry(0.38, 0.08, 10, 24);
      const goldSashMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.15 });
      const band = new THREE.Mesh(bandGeo, goldSashMat);
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.18;
      this.headwearGroup.add(band);

      // Diamond feather aigrette brooch on front center
      const brooch = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.40, 8),
        goldSashMat
      );
      brooch.position.set(0, 0.42, 0.34);
      brooch.rotation.x = -0.15;
      this.headwearGroup.add(brooch);

      const diamond = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.06),
        new THREE.MeshStandardMaterial({ color: 0x00f5d4, metalness: 0.9, roughness: 0.05 })
      );
      diamond.position.set(0, 0.24, 0.44);
      this.headwearGroup.add(diamond);
    } else if (model === 'zombie_zoe') {
      // Zoe: High side punk ponytail with bright purple streak
      const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.6 });
      const streakMat = new THREE.MeshStandardMaterial({ color: 0xf72585, roughness: 0.4 });

      const hairBase = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
        hairMat
      );
      hairBase.position.y = 0.08;
      this.headwearGroup.add(hairBase);

      const pony = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.18, 0.55, 12), hairMat);
      pony.position.set(0.34, 0.32, -0.15);
      pony.rotation.z = -0.55;
      pony.rotation.x = -0.25;
      this.headwearGroup.add(pony);

      const streak = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.56, 8), streakMat);
      streak.position.set(0.34, 0.32, -0.12);
      streak.rotation.z = -0.55;
      streak.rotation.x = -0.25;
      this.headwearGroup.add(streak);

      // Neon green hair clip
      const clip = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.06, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x00f5d4 })
      );
      clip.position.set(0.28, 0.38, -0.08);
      this.headwearGroup.add(clip);
    } else if (model === 'boombot_dj') {
      // Boombot: Dual side speaker horn ear modules & top audio visualizer bar crown
      const hornMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 });
      const coneMat = new THREE.MeshStandardMaterial({ color: 0x00f5d4, emissive: 0x00f5d4, emissiveIntensity: 0.6 });

      const makeSideHorn = (x: number) => {
        const hornGroup = new THREE.Group();
        hornGroup.position.set(x, 0.05, 0);
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.12, 0.16, 16), hornMat);
        rim.rotation.z = x > 0 ? -Math.PI / 2 : Math.PI / 2;
        hornGroup.add(rim);

        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.08, 14), coneMat);
        cone.rotation.z = x > 0 ? -Math.PI / 2 : Math.PI / 2;
        hornGroup.add(cone);
        return hornGroup;
      };

      this.headwearGroup.add(makeSideHorn(-0.40));
      this.headwearGroup.add(makeSideHorn(0.40));

      // Top frequency bar crown
      for (let i = -3; i <= 3; i++) {
        const barH = 0.12 + Math.abs(i) * 0.04;
        const topBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, barH, 0.04),
          new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x00f5d4 : 0xff0055 })
        );
        topBar.position.set(i * 0.065, 0.44 + barH / 2, 0);
        this.headwearGroup.add(topBar);
      }
    }
    this.head.add(this.headwearGroup);
    this.bodyRoot.add(this.head);

    // ==========================================
    // 3. Articulated Arms & Hands
    // ==========================================
    this.leftArm = this.createArticulatedArm(hoodieMat, skinMat, accentMat, isRobot, false);
    this.leftArm.position.set(-0.52, 1.48, 0);
    this.bodyRoot.add(this.leftArm);

    this.rightArm = this.createArticulatedArm(hoodieMat, skinMat, accentMat, isRobot, true);
    this.rightArm.position.set(0.52, 1.48, 0);
    this.bodyRoot.add(this.rightArm);

    // ==========================================
    // 4. Articulated Legs & Chunky High-Tops
    // ==========================================
    this.leftLeg = this.createArticulatedLeg(pantsMat, shoesMat, accentMat, false);
    this.leftLeg.position.set(-0.24, 0.74, 0);
    this.bodyRoot.add(this.leftLeg);

    this.rightLeg = this.createArticulatedLeg(pantsMat, shoesMat, accentMat, true);
    this.rightLeg.position.set(0.24, 0.74, 0);
    this.bodyRoot.add(this.rightLeg);

    // ==========================================
    // 5. Hoverboard, Jetpack & Power-Up Accessories
    // ==========================================
    this.hoverboardMesh = this.createHoverboard(this.currentBoardSkin);
    this.hoverboardMesh.visible = false;
    this.bodyRoot.add(this.hoverboardMesh);

    this.jetpackMesh = this.createJetpack();
    this.jetpackMesh.visible = false;
    this.bodyRoot.add(this.jetpackMesh);

    // Super sneakers spring overlay
    this.sneakerMeshes = [this.createSneakerOverlay(), this.createSneakerOverlay()];
    this.leftLeg.add(this.sneakerMeshes[0]);
    this.rightLeg.add(this.sneakerMeshes[1]);
    this.sneakerMeshes[0].visible = false;
    this.sneakerMeshes[1].visible = false;
  }

  private addHeadphones(group: THREE.Group, bandMat: THREE.Material, padMat: THREE.Material) {
    const bandGeo = new THREE.TorusGeometry(0.38, 0.05, 8, 24, Math.PI * 1.15);
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = -0.08;
    group.add(band);

    const earPadGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.1, 14);
    const leftPad = new THREE.Mesh(earPadGeo, padMat);
    leftPad.rotation.z = Math.PI / 2;
    leftPad.position.set(-0.36, 0.02, 0);
    const rightPad = leftPad.clone();
    rightPad.position.x = 0.36;
    group.add(leftPad);
    group.add(rightPad);
  }

  private createBoombox(): THREE.Group {
    const group = new THREE.Group();
    // Boombox Body
    const bodyGeo = new THREE.BoxGeometry(0.65, 0.36, 0.24);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Dual Speakers with Silver Grilles
    const speakerGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.03, 16);
    const speakerMat = new THREE.MeshStandardMaterial({ color: 0x0a84ff, metalness: 0.7 });
    const speakerL = new THREE.Mesh(speakerGeo, speakerMat);
    speakerL.rotation.x = Math.PI / 2;
    speakerL.position.set(-0.20, 0, 0.12);
    const speakerR = speakerL.clone();
    speakerR.position.x = 0.20;
    group.add(speakerL);
    group.add(speakerR);

    // Cassette Deck & Equalizer LEDs
    const deckGeo = new THREE.BoxGeometry(0.16, 0.14, 0.03);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(0, 0, 0.12);
    group.add(deck);

    // Carrying Handle & Antenna
    const handleGeo = new THREE.TorusGeometry(0.18, 0.025, 6, 16, Math.PI);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, 0.18, 0);
    group.add(handle);

    return group;
  }

  private createArticulatedArm(
    sleeveMat: THREE.Material,
    skinMat: THREE.Material,
    accentMat: THREE.Material,
    isRobot: boolean,
    isRight: boolean
  ): THREE.Group {
    const group = new THREE.Group();

    // Upper sleeve with deltoid pivot (pivots at shoulder 0,0,0)
    const sleeveGeo = new THREE.BoxGeometry(0.24, 0.44, 0.24);
    sleeveGeo.translate(0, -0.22, 0);
    const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
    sleeve.castShadow = true;
    group.add(sleeve);

    // Forearm / Wrist cuff
    const cuffGeo = new THREE.BoxGeometry(0.25, 0.09, 0.25);
    const cuff = new THREE.Mesh(cuffGeo, accentMat);
    cuff.position.y = -0.42;
    group.add(cuff);

    // Hand with sculpted athletic palm
    const handGeo = new THREE.BoxGeometry(0.19, 0.22, 0.19);
    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.position.set(0, -0.56, 0);
    group.add(hand);

    // Distinct sculpted thumb
    const thumbGeo = new THREE.BoxGeometry(0.08, 0.11, 0.08);
    const thumb = new THREE.Mesh(thumbGeo, skinMat);
    thumb.position.set(isRight ? -0.11 : 0.11, -0.54, 0.07);
    group.add(thumb);

    return group;
  }

  private createArticulatedLeg(
    pantsMat: THREE.Material,
    shoesMat: THREE.Material,
    accentMat: THREE.Material,
    isRight: boolean
  ): THREE.Group {
    const group = new THREE.Group();

    // Upper & Lower leg (pivoting at hip 0,0,0)
    const legGeo = new THREE.BoxGeometry(0.27, 0.74, 0.27);
    legGeo.translate(0, -0.37, 0);
    const leg = new THREE.Mesh(legGeo, pantsMat);
    leg.castShadow = true;
    group.add(leg);

    // Detailed 3D Chunky Streetwear Sneaker
    const sneaker = this.createDetailedSneaker(shoesMat, accentMat, isRight);
    sneaker.position.set(0, -0.72, 0.08);
    group.add(sneaker);

    return group;
  }

  private createDetailedSneaker(shoesMat: THREE.Material, accentMat: THREE.Material, isRight: boolean): THREE.Group {
    const group = new THREE.Group();

    // 1. Main shoe upper
    const bodyGeo = new THREE.BoxGeometry(0.29, 0.23, 0.50);
    const body = new THREE.Mesh(bodyGeo, shoesMat);
    body.castShadow = true;
    group.add(body);

    // 2. Thick sculpted white runner midsole & tread sole
    const soleGeo = new THREE.BoxGeometry(0.33, 0.10, 0.55);
    const soleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
    const sole = new THREE.Mesh(soleGeo, soleMat);
    sole.position.y = -0.11;
    group.add(sole);

    // 3. Accent speed swoosh stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.07, 0.34), accentMat);
    stripe.position.y = 0.02;
    group.add(stripe);

    // 4. Front toe bumper rubber cap
    const capGeo = new THREE.BoxGeometry(0.31, 0.13, 0.16);
    const toeCap = new THREE.Mesh(capGeo, soleMat);
    toeCap.position.set(0, -0.05, 0.21);
    group.add(toeCap);

    // 5. 3D Criss-cross shoelaces
    const laceMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const laceGeo = new THREE.BoxGeometry(0.18, 0.025, 0.04);
    for (let i = 0; i < 3; i++) {
      const lace = new THREE.Mesh(laceGeo, laceMat);
      lace.position.set(0, 0.12, 0.05 + i * 0.08);
      group.add(lace);
    }

    return group;
  }

  private createHoverboard(skin: HoverboardSkin): THREE.Group {
    const group = new THREE.Group();
    group.position.set(0, 0.12, 0);

    // Aerodynamic curved deck
    const deckGeo = new THREE.BoxGeometry(0.85, 0.1, 2.1);
    const deckMat = new THREE.MeshStandardMaterial({
      color: skin.color,
      roughness: 0.15,
      metalness: 0.85,
      emissive: skin.color,
      emissiveIntensity: 0.35,
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.castShadow = true;
    group.add(deck);

    // Neon underglow trim
    const trimGeo = new THREE.BoxGeometry(0.9, 0.04, 2.15);
    const trimMat = new THREE.MeshBasicMaterial({ color: skin.color });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    group.add(trim);

    // Under-deck LED glow plane
    const underlightGeo = new THREE.PlaneGeometry(0.72, 1.9);
    const underlightMat = new THREE.MeshBasicMaterial({
      color: skin.color,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const underlight = new THREE.Mesh(underlightGeo, underlightMat);
    underlight.rotation.x = Math.PI / 2;
    underlight.position.y = -0.06;
    group.add(underlight);

    // Dual Thrusters
    const thrusterGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.32, 14);
    const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 });
    const leftThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    leftThruster.rotation.x = Math.PI / 2;
    leftThruster.position.set(-0.28, -0.04, -1.05);
    const rightThruster = leftThruster.clone();
    rightThruster.position.x = 0.28;
    group.add(leftThruster);
    group.add(rightThruster);

    // Plasma flame cones
    const glowGeo = new THREE.ConeGeometry(0.16, 0.8, 8);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.85 });
    const leftGlow = new THREE.Mesh(glowGeo, glowMat);
    leftGlow.rotation.x = -Math.PI / 2;
    leftGlow.position.set(-0.28, -0.04, -1.4);
    const rightGlow = leftGlow.clone();
    rightGlow.position.x = 0.28;
    group.add(leftGlow);
    group.add(rightGlow);

    return group;
  }

  private createJetpack(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(0, 1.25, -0.42);

    // Dual Aerospace Rocket Booster Canisters
    const tankGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.88, 16);
    const tankMat = new THREE.MeshStandardMaterial({
      color: 0xe63946,
      metalness: 0.85,
      roughness: 0.18,
    });
    const leftTank = new THREE.Mesh(tankGeo, tankMat);
    leftTank.position.set(-0.22, 0, 0);
    const rightTank = leftTank.clone();
    rightTank.position.x = 0.22;
    group.add(leftTank);
    group.add(rightTank);

    // Chrome intake dome caps & exhaust nozzles
    const capGeo = new THREE.SphereGeometry(0.17, 14, 14);
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.95, roughness: 0.1 });
    const topCapL = new THREE.Mesh(capGeo, chromeMat);
    topCapL.position.set(-0.22, 0.44, 0);
    const topCapR = topCapL.clone();
    topCapR.position.x = 0.22;
    group.add(topCapL);
    group.add(topCapR);

    // Connecting high-pressure chrome fuel manifold pipe
    const manifoldGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.44, 12);
    const manifold = new THREE.Mesh(manifoldGeo, chromeMat);
    manifold.rotation.z = Math.PI / 2;
    manifold.position.set(0, 0.1, 0);
    group.add(manifold);

    // Dual-layer glowing plasma flame cones
    const flameGeo = new THREE.ConeGeometry(0.16, 0.75, 10);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff9500, transparent: true, opacity: 0.95 });
    const leftFlame = new THREE.Mesh(flameGeo, flameMat);
    leftFlame.rotation.x = Math.PI;
    leftFlame.position.set(-0.22, -0.60, 0);
    const rightFlame = leftFlame.clone();
    rightFlame.position.x = 0.22;
    group.add(leftFlame);
    group.add(rightFlame);

    // Inner hot white/yellow plasma core
    const coreGeo = new THREE.ConeGeometry(0.09, 0.50, 8);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    const innerL = new THREE.Mesh(coreGeo, coreMat);
    innerL.rotation.x = Math.PI;
    innerL.position.set(-0.22, -0.48, 0);
    const innerR = innerL.clone();
    innerR.position.x = 0.22;
    group.add(innerL);
    group.add(innerR);

    this.jetpackFlames = [leftFlame, rightFlame];
    return group;
  }

  private createSneakerOverlay(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(0, -0.72, 0.08);

    // Neon spring coils
    const coilGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.25, 10);
    const coilMat = new THREE.MeshStandardMaterial({
      color: 0x30d158,
      emissive: 0x30d158,
      emissiveIntensity: 0.8,
    });
    const coil = new THREE.Mesh(coilGeo, coilMat);
    coil.position.y = -0.15;
    group.add(coil);

    return group;
  }

  public updateSkins(skin: CharacterSkin, hoverboardSkin: HoverboardSkin) {
    this.currentSkin = skin;
    this.currentBoardSkin = hoverboardSkin;
    this.buildCharacter();
  }

  public update(delta: number, currentSpeed: number) {
    this.runCycleTime += delta * (currentSpeed / 2.0);

    // Accessories visibility
    this.hoverboardMesh.visible = this.isHoverboard;
    this.jetpackMesh.visible = this.isJetpack;
    this.sneakerMeshes[0].visible = this.hasSneakers;
    this.sneakerMeshes[1].visible = this.hasSneakers;

    // Running dust particles animation
    if (!this.isJumping && !this.isJetpack) {
      this.runDustParticles.visible = true;
      const positions = (this.runDustParticles.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 2] -= delta * currentSpeed * 0.85;
        if (positions[i * 3 + 2] < -2.2) {
          positions[i * 3] = (Math.random() - 0.5) * 0.6;
          positions[i * 3 + 1] = Math.random() * 0.3;
          positions[i * 3 + 2] = -0.2;
        }
      }
      this.runDustParticles.geometry.attributes.position.needsUpdate = true;
    } else {
      this.runDustParticles.visible = false;
    }

    // Ninja scarf dynamic fluttering in the wind
    if (this.ninjaScarf) {
      this.ninjaScarf.rotation.y = Math.sin(this.runCycleTime * 4) * 0.25;
      this.ninjaScarf.rotation.z = Math.cos(this.runCycleTime * 3) * 0.15;
    }

    // Robot visor & chest reactor pulsing glow
    if (this.visorLight) {
      const pulse = 0.85 + Math.sin(performance.now() * 0.008) * 0.15;
      this.visorLight.scale.set(1, pulse, 1);
    }

    // Tagbot retro clockwork wind-up key spinning
    if (this.tagbotKey) {
      this.tagbotKey.rotation.z += delta * (currentSpeed * 0.35);
    }

    // Yutani antennae bouncy bobbing
    if (this.alienAntennae) {
      this.alienAntennae.rotation.z = Math.sin(this.runCycleTime * 3) * 0.12;
      this.alienAntennae.rotation.x = Math.cos(this.runCycleTime * 2.5) * 0.08;
    }

    // Athletic banking tilt when lane changing
    this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, this.tiltAngle, 0.25);
    this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, -this.tiltAngle * 0.75, 0.25);

    // Shield bubble pulse & rotation
    if (this.isShieldActive) {
      this.shieldBubble.rotation.y += delta * 2.2;
      this.shieldBubble.rotation.x += delta * 1.4;
      const pulse = 1.0 + Math.sin(performance.now() * 0.008) * 0.04;
      this.shieldBubble.scale.set(pulse, pulse, pulse);
    }

    if (this.isCrashed) {
      // Dynamic crash stumble & knockback tumble
      this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, -1.25, 0.35);
      this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, 0.35, 0.3);
      this.leftLeg.rotation.x = 0.8;
      this.rightLeg.rotation.x = -0.6;
      this.leftArm.rotation.x = 1.6;
      this.rightArm.rotation.x = 1.5;
      this.hoodie.scale.set(1, 0.92, 1);
      return;
    }

    if (this.isJetpack) {
      // Rocket flames flicker
      const flicker = 0.8 + Math.random() * 0.4;
      this.jetpackFlames.forEach((f) => f.scale.set(flicker, flicker, flicker));

      // Flying pose: forward aerodynamic tilt
      this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, 0.38, 0.2);
      this.leftLeg.rotation.x = 0.25;
      this.rightLeg.rotation.x = 0.3;
      this.leftArm.rotation.x = -0.6;
      this.rightArm.rotation.x = -0.6;
      this.hoodie.scale.set(1, 1, 1);
      this.head.position.y = 1.90;
      return;
    }

    if (this.isHoverboard) {
      // Surfing pose: side stance, knees bent, dynamic board banking
      this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, 0, 0.2);
      const surfBob = Math.sin(this.runCycleTime * 2.2) * 0.06;
      this.hoverboardMesh.position.y = 0.14 + surfBob;
      this.hoverboardMesh.rotation.z = Math.sin(this.runCycleTime * 1.8) * 0.12;

      this.leftLeg.rotation.x = 0.25;
      this.rightLeg.rotation.x = -0.35;
      this.leftLeg.rotation.z = -0.2;
      this.rightLeg.rotation.z = 0.2;

      this.leftArm.rotation.x = 0.45;
      this.leftArm.rotation.z = -0.65;
      this.rightArm.rotation.x = -0.45;
      this.rightArm.rotation.z = 0.65;

      this.hoodie.scale.set(1, 1, 1);
      this.head.position.y = 1.90;
      return;
    }

    if (this.isSliding) {
      // Slide pose: compact tuck, roll forward
      this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, 0.75, 0.35);
      this.hoodie.scale.set(1, 0.52, 1.25);
      this.head.position.y = 1.35;

      this.leftLeg.rotation.x = 1.5;
      this.rightLeg.rotation.x = 1.5;
      this.leftArm.rotation.x = -1.3;
      this.rightArm.rotation.x = -1.3;
      return;
    }

    if (this.isJumping) {
      // Dynamic airborne jump pose
      this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, -0.18, 0.2);
      this.hoodie.scale.set(1, 1, 1);
      this.head.position.y = 1.90;

      this.leftLeg.rotation.x = -0.6;
      this.rightLeg.rotation.x = -0.3;
      this.leftArm.rotation.x = -1.2;
      this.rightArm.rotation.x = -1.0;
      return;
    }

    // High energy athletic running animation
    this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, 0.12, 0.2);
    this.hoodie.scale.set(1, 1, 1);
    this.head.position.y = 1.90 + Math.abs(Math.sin(this.runCycleTime * 2)) * 0.08;

    // Organic torso sway
    this.torsoGroup.rotation.y = Math.sin(this.runCycleTime) * 0.12;

    const armSwing = Math.sin(this.runCycleTime) * 0.85;
    const legSwing = Math.sin(this.runCycleTime) * 0.95;

    this.leftArm.rotation.x = -armSwing;
    this.rightArm.rotation.x = armSwing;

    this.leftLeg.rotation.x = legSwing;
    this.rightLeg.rotation.x = -legSwing;
  }

  public updateHitbox() {
    this.hitbox.setFromObject(this.mesh);
    if (this.isSliding) {
      this.hitbox.max.y = this.mesh.position.y + 1.05;
    }
  }
}
