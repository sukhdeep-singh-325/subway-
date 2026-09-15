import * as THREE from 'three';
import { ObstacleData, CoinData, PowerUpItemData, Lane, PowerUpType } from '../types/game';
import { LANE_COORDINATES, TRAIN_HEIGHT, TRAIN_LENGTH, TRAIN_WIDTH, LOW_BARRIER_HEIGHT, HIGH_BARRIER_HEIGHT } from './constants';

export class ObstacleManager {
  private scene: THREE.Scene;
  public obstacleObjects: Map<string, THREE.Group> = new Map();
  public coinObjects: Map<string, THREE.Mesh> = new Map();
  public powerUpObjects: Map<string, THREE.Group> = new Map();

  // Object Pools for Zero-Garbage Collection recycling
  private coinPool: THREE.Mesh[] = [];
  private obstaclePool: Map<string, THREE.Group[]> = new Map();
  private powerUpPool: Map<string, THREE.Group[]> = new Map();

  // Shared Geometries & Materials
  private coinGeometry: THREE.CylinderGeometry;
  private coinMaterial: THREE.MeshStandardMaterial;
  private coinStarGeometry: THREE.BufferGeometry;

  private lowBarrierGroup: THREE.Group;
  private highBarrierGroup: THREE.Group;
  private trainGroup: THREE.Group;
  private rampTrainGroup: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // High fidelity 3D gold coin with bevel
    this.coinGeometry = new THREE.CylinderGeometry(0.38, 0.38, 0.09, 20);
    this.coinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.92,
      roughness: 0.15,
      emissive: 0xff9900,
      emissiveIntensity: 0.45,
    });

    // Star icon inside coin
    this.coinStarGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.11, 5);

    // Pre-build detailed models
    this.lowBarrierGroup = this.buildLowBarrierTemplate();
    this.highBarrierGroup = this.buildHighBarrierTemplate();
    this.trainGroup = this.buildTrainTemplate(false);
    this.rampTrainGroup = this.buildTrainTemplate(true);
  }

  private buildLowBarrierTemplate(): THREE.Group {
    const group = new THREE.Group();

    // Heavy duty metal support legs
    const legGeo = new THREE.BoxGeometry(0.14, LOW_BARRIER_HEIGHT, 0.14);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x33373d, metalness: 0.8, roughness: 0.4 });
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.95, LOW_BARRIER_HEIGHT / 2, 0);
    legL.castShadow = true;
    const legR = legL.clone();
    legR.position.x = 0.95;
    group.add(legL);
    group.add(legR);

    // Triangular base footings
    const footGeo = new THREE.BoxGeometry(0.3, 0.08, 0.6);
    const footL = new THREE.Mesh(footGeo, legMat);
    footL.position.set(-0.95, 0.04, 0);
    const footR = footL.clone();
    footR.position.x = 0.95;
    group.add(footL);
    group.add(footR);

    // Hazard striped main barricade plank
    const plankGeo = new THREE.BoxGeometry(2.1, 0.45, 0.12);
    const plankMat = new THREE.MeshStandardMaterial({
      color: 0xff3b30,
      roughness: 0.35,
    });
    const plank = new THREE.Mesh(plankGeo, plankMat);
    plank.position.set(0, LOW_BARRIER_HEIGHT - 0.22, 0);
    plank.castShadow = true;
    group.add(plank);

    // Diagonal high-contrast warning stripes
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    for (let i = -0.8; i <= 0.8; i += 0.38) {
      const stripeGeo = new THREE.BoxGeometry(0.16, 0.47, 0.14);
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(i, LOW_BARRIER_HEIGHT - 0.22, 0);
      group.add(stripe);
    }

    // Top flashing amber warning beacon
    const beaconGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 12);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff9500 });
    const beaconL = new THREE.Mesh(beaconGeo, beaconMat);
    beaconL.position.set(-0.95, LOW_BARRIER_HEIGHT + 0.08, 0);
    const beaconR = beaconL.clone();
    beaconR.position.x = 0.95;
    group.add(beaconL);
    group.add(beaconR);

    return group;
  }

  private buildHighBarrierTemplate(): THREE.Group {
    const group = new THREE.Group();

    // Tall industrial gantry side posts
    const postGeo = new THREE.CylinderGeometry(0.12, 0.14, HIGH_BARRIER_HEIGHT + 0.6, 10);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x22262c, metalness: 0.85, roughness: 0.3 });
    const postL = new THREE.Mesh(postGeo, postMat);
    postL.position.set(-1.1, (HIGH_BARRIER_HEIGHT + 0.6) / 2, 0);
    postL.castShadow = true;
    const postR = postL.clone();
    postR.position.x = 1.1;
    postR.castShadow = true;
    group.add(postL);
    group.add(postR);

    // Clearance warning bar
    const barGeo = new THREE.BoxGeometry(2.4, 0.65, 0.22);
    const barMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      roughness: 0.3,
      metalness: 0.2,
    });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(0, HIGH_BARRIER_HEIGHT, 0);
    bar.castShadow = true;
    group.add(bar);

    // Black chevron caution stripes
    const blackStripeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    for (let i = -0.9; i <= 0.9; i += 0.38) {
      const sGeo = new THREE.BoxGeometry(0.18, 0.67, 0.24);
      const s = new THREE.Mesh(sGeo, blackStripeMat);
      s.position.set(i, HIGH_BARRIER_HEIGHT, 0);
      group.add(s);
    }

    // Hanging clearance chains & warning tag
    const chainMat = new THREE.MeshBasicMaterial({ color: 0x777777 });
    [-0.5, 0.5].forEach((cX) => {
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6), chainMat);
      chain.position.set(cX, HIGH_BARRIER_HEIGHT - 0.45, 0);
      group.add(chain);
    });

    const tag = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.3, 0.04),
      new THREE.MeshBasicMaterial({ color: 0xff3b30 })
    );
    tag.position.set(0, HIGH_BARRIER_HEIGHT - 0.6, 0);
    group.add(tag);

    return group;
  }

  private buildTrainTemplate(hasRamp: boolean): THREE.Group {
    const group = new THREE.Group();

    // 1. Train Body (Vibrant Subway Livery)
    // Front is at Z = 0, extending backwards to Z = +TRAIN_LENGTH
    const bodyGeo = new THREE.BoxGeometry(TRAIN_WIDTH, TRAIN_HEIGHT, TRAIN_LENGTH);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xd92d20, // Vivid Subway Crimson
      roughness: 0.25,
      metalness: 0.55,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, TRAIN_HEIGHT / 2, TRAIN_LENGTH / 2);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Silver lower skirt / bumper
    const skirtGeo = new THREE.BoxGeometry(TRAIN_WIDTH + 0.04, 0.45, TRAIN_LENGTH);
    const skirtMat = new THREE.MeshStandardMaterial({
      color: 0xb0b8c4,
      metalness: 0.85,
      roughness: 0.2,
    });
    const skirt = new THREE.Mesh(skirtGeo, skirtMat);
    skirt.position.set(0, 0.25, TRAIN_LENGTH / 2);
    group.add(skirt);

    // 2. Train Roof (Walkable track surface!)
    const roofGeo = new THREE.BoxGeometry(TRAIN_WIDTH * 0.96, 0.18, TRAIN_LENGTH);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x3d4148,
      roughness: 0.65,
      metalness: 0.35,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, TRAIN_HEIGHT + 0.09, TRAIN_LENGTH / 2);
    roof.receiveShadow = true;
    group.add(roof);

    // Roof AC Units & Pantograph
    const acGeo = new THREE.BoxGeometry(1.2, 0.35, 2.5);
    const acMat = new THREE.MeshStandardMaterial({ color: 0x2b2e35, metalness: 0.7 });
    for (let acZ = 4; acZ < TRAIN_LENGTH - 3; acZ += 7) {
      const acUnit = new THREE.Mesh(acGeo, acMat);
      acUnit.position.set(0, TRAIN_HEIGHT + 0.3, acZ);
      acUnit.castShadow = true;
      group.add(acUnit);
    }

    // 3. Front Windshield (Dark reflective glass) - facing oncoming player at Z < 0
    const windshieldGeo = new THREE.PlaneGeometry(TRAIN_WIDTH * 0.8, 1.3);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f1d2e,
      roughness: 0.05,
      metalness: 0.95,
      side: THREE.DoubleSide,
    });
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, TRAIN_HEIGHT - 1.05, -0.02);
    windshield.rotation.y = Math.PI;
    group.add(windshield);

    // 4. Glowing Headlights with Forward Light Beam facing oncoming player (-Z)
    const lightGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 14);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftLight = new THREE.Mesh(lightGeo, lightMat);
    leftLight.rotation.x = -Math.PI / 2;
    leftLight.position.set(-0.68, 0.95, -0.06);
    const rightLight = leftLight.clone();
    rightLight.position.x = 0.68;
    group.add(leftLight);
    group.add(rightLight);

    // Forward Light Cone (simulated headlight beam on track towards player)
    const coneGeo = new THREE.ConeGeometry(1.4, 7.5, 12, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfff0aa,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    const beamL = new THREE.Mesh(coneGeo, coneMat);
    beamL.rotation.x = -Math.PI / 2 - 0.1;
    beamL.position.set(-0.68, 0.9, -3.8);
    const beamR = beamL.clone();
    beamR.position.x = 0.68;
    group.add(beamL);
    group.add(beamR);

    // 5. Side passenger windows (illuminated warm interior)
    const winGeo = new THREE.PlaneGeometry(0.02, 0.95, 1.6);
    const winMat = new THREE.MeshBasicMaterial({ color: 0xffe89e });
    for (let z = 3.2; z < TRAIN_LENGTH - 2; z += 3.2) {
      const leftWin = new THREE.Mesh(winGeo, winMat);
      leftWin.rotation.y = Math.PI / 2;
      leftWin.position.set(-TRAIN_WIDTH / 2 - 0.01, TRAIN_HEIGHT - 1.25, z);
      const rightWin = leftWin.clone();
      rightWin.position.x = TRAIN_WIDTH / 2 + 0.01;
      group.add(leftWin);
      group.add(rightWin);
    }

    // 6. Ramp or Front Cowcatcher
    if (hasRamp) {
      // Ramp extends in FRONT of the train from Z = -rampLength (ground) to Z = 0 (roof)
      const rampLength = 6.0;
      const rampGeo = new THREE.BoxGeometry(TRAIN_WIDTH * 0.92, 0.22, rampLength);
      const rampMat = new THREE.MeshStandardMaterial({
        color: 0xf5a623,
        roughness: 0.4,
        metalness: 0.3,
      });
      const ramp = new THREE.Mesh(rampGeo, rampMat);

      const angle = -Math.atan2(TRAIN_HEIGHT, rampLength);
      ramp.rotation.x = angle;
      ramp.position.set(0, TRAIN_HEIGHT / 2, -rampLength / 2);
      ramp.receiveShadow = true;
      ramp.castShadow = true;
      group.add(ramp);

      // High visibility Chevron arrows on ramp face pointing up towards train roof
      const arrowGeo = new THREE.ConeGeometry(0.4, 0.9, 4);
      const arrowMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.rotation.x = angle - Math.PI / 2;
      arrow.position.set(0, TRAIN_HEIGHT / 2 + 0.18, -rampLength / 2);
      group.add(arrow);
    } else {
      // Train Cowcatcher / Grate at front bumper
      const grateGeo = new THREE.BoxGeometry(TRAIN_WIDTH * 0.9, 0.6, 0.3);
      const grateMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 });
      const grate = new THREE.Mesh(grateGeo, grateMat);
      grate.position.set(0, 0.3, -0.15);
      group.add(grate);
    }

    return group;
  }

  public spawnObstacle(obs: ObstacleData): THREE.Group {
    const laneX = LANE_COORDINATES[obs.lane];
    let pool = this.obstaclePool.get(obs.type);
    if (!pool) {
      pool = [];
      this.obstaclePool.set(obs.type, pool);
    }

    let instance = pool.pop();
    if (!instance) {
      if (obs.type === 'low_barrier') {
        instance = this.lowBarrierGroup.clone();
      } else if (obs.type === 'high_barrier') {
        instance = this.highBarrierGroup.clone();
      } else if (obs.type === 'ramp_train') {
        instance = this.rampTrainGroup.clone();
      } else {
        instance = this.trainGroup.clone();
      }
      this.scene.add(instance);
    }

    instance.visible = true;
    instance.position.set(laneX, 0, obs.z);
    instance.userData = {
      id: obs.id,
      type: obs.type,
      lane: obs.lane,
      laneX: laneX,
      speed: obs.speed || 0,
      hasRamp: obs.hasRamp,
    };

    this.obstacleObjects.set(obs.id, instance);
    return instance;
  }

  public spawnCoin(coin: CoinData): THREE.Mesh {
    let mesh = this.coinPool.pop();
    if (!mesh) {
      mesh = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
      mesh.castShadow = true;
      const star = new THREE.Mesh(
        this.coinStarGeometry,
        new THREE.MeshStandardMaterial({ color: 0xffea70, metalness: 0.95, roughness: 0.1 })
      );
      mesh.add(star);
      this.scene.add(mesh);
    }

    mesh.visible = true;
    mesh.rotation.set(Math.PI / 2, 0, 0);
    mesh.position.set(LANE_COORDINATES[coin.lane], coin.y, coin.z);
    mesh.userData = { id: coin.id, lane: coin.lane, initialY: coin.y };

    this.coinObjects.set(coin.id, mesh);
    return mesh;
  }

  public spawnPowerUp(p: PowerUpItemData): THREE.Group {
    let pool = this.powerUpPool.get(p.type);
    if (!pool) {
      pool = [];
      this.powerUpPool.set(p.type, pool);
    }

    let group = pool.pop();
    if (!group) {
      group = new THREE.Group();

      if (p.type === 'mystery_box') {
        // Iconic Subway Surfers Mystery Box
        const boxGeo = new THREE.BoxGeometry(0.82, 0.82, 0.82);
        const boxMat = new THREE.MeshStandardMaterial({
          color: 0x7b2cbf,
          roughness: 0.3,
          metalness: 0.2,
        });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.castShadow = true;
        group.add(box);

        const trimMat = new THREE.MeshStandardMaterial({
          color: 0xffd700,
          metalness: 0.85,
          roughness: 0.2,
        });
        const ribH = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.12, 0.86), trimMat);
        const ribV = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.86, 0.86), trimMat);
        group.add(ribH);
        group.add(ribV);

        const qDot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe600 }));
        qDot.position.set(0, -0.22, 0.44);
        group.add(qDot);

        const qHook = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.05, 8, 12, Math.PI * 1.3), new THREE.MeshBasicMaterial({ color: 0xffe600 }));
        qHook.position.set(0, 0.1, 0.44);
        group.add(qHook);

        const aura = new THREE.Mesh(
          new THREE.RingGeometry(0.65, 0.78, 16),
          new THREE.MeshBasicMaterial({ color: 0xc77dff, side: THREE.DoubleSide })
        );
        aura.rotation.x = Math.PI / 2;
        group.add(aura);
      } else if (p.type === 'letter') {
        const tileGeo = new THREE.BoxGeometry(0.75, 0.75, 0.22);
        const tileMat = new THREE.MeshStandardMaterial({
          color: 0xffb703,
          roughness: 0.15,
          metalness: 0.8,
          emissive: 0xfb8500,
          emissiveIntensity: 0.35,
        });
        const tile = new THREE.Mesh(tileGeo, tileMat);
        tile.castShadow = true;
        group.add(tile);

        const frameGeo = new THREE.BoxGeometry(0.82, 0.82, 0.18);
        const frameMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        group.add(frame);
      } else if (p.type === 'shield') {
        const shieldGeo = new THREE.CylinderGeometry(0.5, 0.36, 0.14, 6);
        const shieldMat = new THREE.MeshStandardMaterial({
          color: 0x00f5d4,
          roughness: 0.12,
          metalness: 0.85,
          emissive: 0x00b4d8,
          emissiveIntensity: 0.7,
        });
        const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        shieldMesh.rotation.x = Math.PI / 2;
        group.add(shieldMesh);

        const ringGeo = new THREE.TorusGeometry(0.72, 0.06, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        group.add(ring);

        const coreGeo = new THREE.OctahedronGeometry(0.24);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.z = 0.12;
        group.add(core);
      } else {
        let color = 0x00ffff;
        if (p.type === 'magnet') color = 0xff2d55;
        else if (p.type === 'jetpack') color = 0xff9500;
        else if (p.type === 'sneakers') color = 0x34c759;
        else if (p.type === 'multiplier') color = 0xaf52de;

        const tokenGeo = new THREE.OctahedronGeometry(0.55, 0);
        const tokenMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.1,
          metalness: 0.85,
          emissive: color,
          emissiveIntensity: 0.65,
        });
        const token = new THREE.Mesh(tokenGeo, tokenMat);
        group.add(token);

        const ringGeo = new THREE.TorusGeometry(0.7, 0.05, 8, 20);
        const ringMat = new THREE.MeshBasicMaterial({ color: color });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        group.add(ring);
      }

      this.scene.add(group);
    }

    group.visible = true;
    group.position.set(LANE_COORDINATES[p.lane], p.y, p.z);
    group.userData = { id: p.id, type: p.type, lane: p.lane, initialY: p.y };

    this.powerUpObjects.set(p.id, group);
    return group;
  }

  public update(delta: number, playerZ: number, speed: number) {
    const time = performance.now() * 0.0035;

    // Spin coins with gleaming sparkle
    this.coinObjects.forEach((coinMesh) => {
      coinMesh.rotation.z += delta * 4.5;
      coinMesh.position.y = coinMesh.userData.initialY + Math.sin(time + coinMesh.position.z * 0.8) * 0.14;
    });

    // Animate power-up tokens on multiple axes
    this.powerUpObjects.forEach((group) => {
      group.rotation.y += delta * 3.0;
      group.rotation.x += delta * 1.8;
      group.position.y = group.userData.initialY + Math.sin(time * 1.6 + group.position.z) * 0.2;
    });

    // Advance oncoming moving trains towards player (-Z direction)
    this.obstacleObjects.forEach((obsGroup) => {
      if (obsGroup.userData.type === 'train_moving') {
        const trainSpeed = obsGroup.userData.speed || 16;
        obsGroup.position.z -= trainSpeed * delta;
      }
    });
  }

  public removeObstacle(id: string) {
    const group = this.obstacleObjects.get(id);
    if (group) {
      group.visible = false;
      const type = group.userData.type || 'train_stopped';
      let pool = this.obstaclePool.get(type);
      if (!pool) {
        pool = [];
        this.obstaclePool.set(type, pool);
      }
      pool.push(group);
      this.obstacleObjects.delete(id);
    }
  }

  public removeCoin(id: string) {
    const mesh = this.coinObjects.get(id);
    if (mesh) {
      mesh.visible = false;
      this.coinPool.push(mesh);
      this.coinObjects.delete(id);
    }
  }

  public removePowerUp(id: string) {
    const group = this.powerUpObjects.get(id);
    if (group) {
      group.visible = false;
      const type = group.userData.type || 'magnet';
      let pool = this.powerUpPool.get(type);
      if (!pool) {
        pool = [];
        this.powerUpPool.set(type, pool);
      }
      pool.push(group);
      this.powerUpObjects.delete(id);
    }
  }

  public removeOldObjects(minZ: number) {
    this.obstacleObjects.forEach((group, id) => {
      // Clear obstacle once its full geometry (including train length) has passed behind the camera
      if (group.position.z + TRAIN_LENGTH < minZ - 10) {
        this.removeObstacle(id);
      }
    });

    this.coinObjects.forEach((mesh, id) => {
      if (mesh.position.z < minZ - 12) {
        this.removeCoin(id);
      }
    });

    this.powerUpObjects.forEach((group, id) => {
      if (group.position.z < minZ - 12) {
        this.removePowerUp(id);
      }
    });
  }

  public clearAll() {
    this.obstacleObjects.forEach((group, id) => {
      group.visible = false;
      const type = group.userData.type || 'train_stopped';
      let pool = this.obstaclePool.get(type);
      if (!pool) {
        pool = [];
        this.obstaclePool.set(type, pool);
      }
      pool.push(group);
    });
    this.obstacleObjects.clear();

    this.coinObjects.forEach((mesh) => {
      mesh.visible = false;
      this.coinPool.push(mesh);
    });
    this.coinObjects.clear();

    this.powerUpObjects.forEach((group) => {
      group.visible = false;
      const type = group.userData.type || 'magnet';
      let pool = this.powerUpPool.get(type);
      if (!pool) {
        pool = [];
        this.powerUpPool.set(type, pool);
      }
      pool.push(group);
    });
    this.powerUpObjects.clear();
  }
}
