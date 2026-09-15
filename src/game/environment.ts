import * as THREE from 'three';
import { LANE_WIDTH, CHUNK_LENGTH, THEME_CONFIGS } from './constants';
import { EnvironmentTheme } from '../types/game';

export class EnvironmentManager {
  private scene: THREE.Scene;
  private currentTheme: EnvironmentTheme;

  // Track Chunks
  private chunks: THREE.Group[] = [];
  private chunkPoolSize = 6;
  public nextChunkZ = 0;

  // Lighting
  private ambientLight: THREE.AmbientLight;
  private dirLight: THREE.DirectionalLight;
  private hemisphereLight: THREE.HemisphereLight;

  // Atmospheric Dust Particles
  private dustParticles: THREE.Points;

  constructor(scene: THREE.Scene, theme: EnvironmentTheme = 'tokyo_day') {
    this.scene = scene;
    this.currentTheme = theme;

    const config = THEME_CONFIGS[theme];

    // Atmosphere
    this.scene.background = new THREE.Color(config.skyColor);
    this.scene.fog = new THREE.FogExp2(config.fogColor, 0.0075);

    // Dynamic Vibrant Lights
    this.ambientLight = new THREE.AmbientLight(config.ambientLight, config.ambientIntensity);
    this.scene.add(this.ambientLight);

    this.hemisphereLight = new THREE.HemisphereLight(config.skyColor, config.groundColor, 0.7);
    this.scene.add(this.hemisphereLight);

    this.dirLight = new THREE.DirectionalLight(config.sunLight, config.sunIntensity);
    this.dirLight.position.set(30, 50, 25);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 180;
    this.dirLight.shadow.camera.left = -30;
    this.dirLight.shadow.camera.right = 30;
    this.dirLight.shadow.camera.top = 30;
    this.dirLight.shadow.camera.bottom = -30;
    this.scene.add(this.dirLight);

    // Floating Atmospheric motes
    const pCount = 120;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 25;
      pPos[i * 3 + 1] = 1 + Math.random() * 12;
      pPos[i * 3 + 2] = Math.random() * 200;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.18,
      transparent: true,
      opacity: 0.45,
    });
    this.dustParticles = new THREE.Points(pGeo, pMat);
    this.scene.add(this.dustParticles);

    this.initChunks();
  }

  public setTheme(theme: EnvironmentTheme) {
    this.currentTheme = theme;
    const config = THEME_CONFIGS[theme];

    this.scene.background = new THREE.Color(config.skyColor);
    if (this.scene.fog) {
      (this.scene.fog as THREE.FogExp2).color.setHex(config.fogColor);
    }

    this.ambientLight.color.setHex(config.ambientLight);
    this.ambientLight.intensity = config.ambientIntensity;
    this.dirLight.color.setHex(config.sunLight);
    this.dirLight.intensity = config.sunIntensity;
    this.hemisphereLight.color.setHex(config.skyColor);
    this.hemisphereLight.groundColor.setHex(config.groundColor);

    this.clearChunks();
    this.initChunks();
  }

  private initChunks() {
    this.nextChunkZ = -20;
    for (let i = 0; i < this.chunkPoolSize; i++) {
      const chunk = this.createChunk(this.nextChunkZ);
      this.chunks.push(chunk);
      this.scene.add(chunk);
      this.nextChunkZ += CHUNK_LENGTH;
    }
  }

  private createChunk(zPos: number): THREE.Group {
    const group = new THREE.Group();
    group.position.z = zPos;

    const config = THEME_CONFIGS[this.currentTheme];

    // 1. Ground / Ballast (track bed with gravel tone)
    const trackWidth = LANE_WIDTH * 3 + 4.8;
    const groundGeo = new THREE.PlaneGeometry(trackWidth, CHUNK_LENGTH);
    const groundMat = new THREE.MeshStandardMaterial({
      color: config.groundColor,
      roughness: 0.85,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, CHUNK_LENGTH / 2);
    ground.receiveShadow = true;
    group.add(ground);

    // Ballast track shoulder curb
    const curbGeo = new THREE.BoxGeometry(0.3, 0.25, CHUNK_LENGTH);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.8 });
    const curbL = new THREE.Mesh(curbGeo, curbMat);
    curbL.position.set(-trackWidth / 2 + 0.15, 0.1, CHUNK_LENGTH / 2);
    const curbR = curbL.clone();
    curbR.position.x = trackWidth / 2 - 0.15;
    group.add(curbL);
    group.add(curbR);

    // 2. 3 Tracks: Gleaming Steel Rails & Wooden Sleepers
    const laneOffsets = [-LANE_WIDTH, 0, LANE_WIDTH];
    const sleeperGeo = new THREE.BoxGeometry(2.2, 0.14, 0.38);
    const sleeperMat = new THREE.MeshStandardMaterial({
      color: config.sleeperColor,
      roughness: 0.75,
    });

    // Metallic rail plates (tie plates on sleepers)
    const plateGeo = new THREE.BoxGeometry(0.24, 0.04, 0.3);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.3 });

    // Polished reflective steel rail profile
    const railGeo = new THREE.BoxGeometry(0.09, 0.2, CHUNK_LENGTH);
    const railMat = new THREE.MeshStandardMaterial({
      color: config.railColor,
      metalness: 0.95,
      roughness: 0.12,
    });

    laneOffsets.forEach((laneX) => {
      // Left rail & Right rail
      const leftRail = new THREE.Mesh(railGeo, railMat);
      leftRail.position.set(laneX - 0.76, 0.12, CHUNK_LENGTH / 2);
      leftRail.castShadow = true;
      const rightRail = new THREE.Mesh(railGeo, railMat);
      rightRail.position.set(laneX + 0.76, 0.12, CHUNK_LENGTH / 2);
      rightRail.castShadow = true;
      group.add(leftRail);
      group.add(rightRail);

      // Sleepers & metal tie-plates
      for (let z = 1.2; z < CHUNK_LENGTH; z += 1.6) {
        const sleeper = new THREE.Mesh(sleeperGeo, sleeperMat);
        sleeper.position.set(laneX, 0.05, z);
        sleeper.receiveShadow = true;
        group.add(sleeper);

        const plateL = new THREE.Mesh(plateGeo, plateMat);
        plateL.position.set(laneX - 0.76, 0.12, z);
        const plateR = plateL.clone();
        plateR.position.x = laneX + 0.76;
        group.add(plateL);
        group.add(plateR);
      }
    });

    // Continuous Overhead Catenary Electric Wires (3 cables)
    const wireGeo = new THREE.CylinderGeometry(0.02, 0.02, CHUNK_LENGTH, 6);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    laneOffsets.forEach((laneX) => {
      const wire = new THREE.Mesh(wireGeo, wireMat);
      wire.rotation.x = Math.PI / 2;
      wire.position.set(laneX, 6.8, CHUNK_LENGTH / 2);
      group.add(wire);
    });

    // 3. Side Retaining Walls with Brick Detailing & Graffiti Murals
    const wallHeight = 8.5;
    const wallGeo = new THREE.BoxGeometry(1.2, wallHeight, CHUNK_LENGTH);
    const wallMat = new THREE.MeshStandardMaterial({
      color: config.wallColor,
      roughness: 0.9,
    });

    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-trackWidth / 2 - 0.6, wallHeight / 2, CHUNK_LENGTH / 2);
    leftWall.receiveShadow = true;
    group.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(trackWidth / 2 + 0.6, wallHeight / 2, CHUNK_LENGTH / 2);
    rightWall.receiveShadow = true;
    group.add(rightWall);

    // Wall Top Coping Beam
    const capGeo = new THREE.BoxGeometry(1.6, 0.4, CHUNK_LENGTH);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x2d3138, roughness: 0.7 });
    const capL = new THREE.Mesh(capGeo, capMat);
    capL.position.set(-trackWidth / 2 - 0.6, wallHeight + 0.2, CHUNK_LENGTH / 2);
    const capR = capL.clone();
    capR.position.x = trackWidth / 2 + 0.6;
    group.add(capL);
    group.add(capR);

    // Vibrant Wall Posters & Graffiti Tags
    const posterColors = [0xff0055, 0x00e5ff, 0xffbe0b, 0x7209b7, 0x3a86ff, 0x00f5d4, 0xf72585];
    for (let z = 12; z < CHUNK_LENGTH; z += 20) {
      const pColor = posterColors[Math.floor(Math.random() * posterColors.length)];
      const pWidth = 3.5 + Math.random() * 1.5;
      const pHeight = 2.2 + Math.random() * 0.8;
      const pGeo = new THREE.PlaneGeometry(pWidth, pHeight);
      const pMat = new THREE.MeshBasicMaterial({ color: pColor, side: THREE.DoubleSide });

      const posterL = new THREE.Mesh(pGeo, pMat);
      posterL.rotation.y = Math.PI / 2;
      posterL.position.set(-trackWidth / 2 - 0.02, 3.8, z);
      group.add(posterL);

      const posterR = new THREE.Mesh(pGeo, pMat);
      posterR.rotation.y = -Math.PI / 2;
      posterR.position.set(trackWidth / 2 + 0.02, 3.8, z + 5);
      group.add(posterR);
    }

    // 4. Overhead Subway Station Gantry Arch
    const gantry = this.createSubwayGantry(trackWidth);
    gantry.position.set(0, 0, CHUNK_LENGTH / 2);
    group.add(gantry);

    // 5. Urban Skyline Skyscrapers with Glowing Windows & Neon Billboards
    for (let b = 0; b < 7; b++) {
      const isLeft = b % 2 === 0;
      const bWidth = 7 + Math.random() * 9;
      const bHeight = 18 + Math.random() * 32;
      const bDepth = 12 + Math.random() * 14;

      const bColor = config.buildingColors[b % config.buildingColors.length];
      const bMat = new THREE.MeshStandardMaterial({
        color: bColor,
        roughness: 0.65,
        metalness: 0.25,
      });

      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bWidth, bHeight, bDepth), bMat);
      const bX = (isLeft ? -1 : 1) * (trackWidth / 2 + 9 + Math.random() * 15);
      const bZ = (b * (CHUNK_LENGTH / 7)) + Math.random() * 4;
      bMesh.position.set(bX, bHeight / 2 - 2, bZ);
      group.add(bMesh);

      // Window Light Grids
      const winGeo = new THREE.PlaneGeometry(0.8, 1.1);
      const winMat = new THREE.MeshBasicMaterial({ color: 0xfff3a8 });
      for (let floor = 2; floor < 10; floor++) {
        if (Math.random() > 0.35) {
          const winMesh = new THREE.Mesh(winGeo, winMat);
          winMesh.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
          winMesh.position.set(
            bX + (isLeft ? bWidth / 2 + 0.02 : -bWidth / 2 - 0.02),
            floor * 3.2,
            bZ + (Math.random() * 4 - 2)
          );
          group.add(winMesh);
        }
      }

      // Neon Rooftop Billboard on select buildings
      if (b % 3 === 0) {
        const boardGeo = new THREE.BoxGeometry(0.2, 2.5, 6.0);
        const boardMat = new THREE.MeshBasicMaterial({
          color: isLeft ? 0x00ffff : 0xff007f,
        });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.set(bX, bHeight + 1.2, bZ);
        group.add(board);
      }
    }

    return group;
  }

  private createSubwayGantry(trackWidth: number): THREE.Group {
    const group = new THREE.Group();

    // Heavy Industrial Steel Trusses
    const pillarHeight = 7.8;
    const pillarGeo = new THREE.CylinderGeometry(0.22, 0.26, pillarHeight, 10);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3d4450, metalness: 0.85, roughness: 0.3 });

    const pillL = new THREE.Mesh(pillarGeo, pillarMat);
    pillL.position.set(-trackWidth / 2 - 0.2, pillarHeight / 2, 0);
    pillL.castShadow = true;
    const pillR = pillL.clone();
    pillR.position.x = trackWidth / 2 + 0.2;
    pillR.castShadow = true;
    group.add(pillL);
    group.add(pillR);

    // Cross Truss Spanning Tracks
    const beamGeo = new THREE.BoxGeometry(trackWidth + 1.4, 0.5, 0.5);
    const beam = new THREE.Mesh(beamGeo, pillarMat);
    beam.position.set(0, pillarHeight - 0.3, 0);
    beam.castShadow = true;
    group.add(beam);

    // Station Signboard in Center ("SUBWAY SURF")
    const signGeo = new THREE.BoxGeometry(4.0, 0.7, 0.15);
    const signMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.2,
      metalness: 0.8,
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, pillarHeight - 0.9, 0);
    group.add(sign);

    const signTextGeo = new THREE.BoxGeometry(3.6, 0.45, 0.18);
    const signTextMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const signText = new THREE.Mesh(signTextGeo, signTextMat);
    signText.position.set(0, pillarHeight - 0.9, 0);
    group.add(signText);

    // Track Status Signal Lamps (Green / Yellow)
    const sigGeo = new THREE.SphereGeometry(0.22, 12, 12);
    const sigMatGreen = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
    [-LANE_WIDTH, 0, LANE_WIDTH].forEach((laneX) => {
      const sig = new THREE.Mesh(sigGeo, sigMatGreen);
      sig.position.set(laneX, pillarHeight - 0.65, 0.3);
      group.add(sig);
    });

    return group;
  }

  public update(playerZ: number) {
    this.dirLight.position.z = playerZ + 25;
    this.dirLight.target.position.z = playerZ;
    this.dirLight.target.updateMatrixWorld();

    // Recycle chunks seamlessly
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      if (chunk.position.z + CHUNK_LENGTH < playerZ - 30) {
        chunk.position.z = this.nextChunkZ;
        this.nextChunkZ += CHUNK_LENGTH;
      }
    }

    // Drift atmospheric motes along with player
    this.dustParticles.position.z = playerZ - 20;
  }

  public reset(startZ: number = 0) {
    this.clearChunks();
    this.nextChunkZ = startZ - 20;
    for (let i = 0; i < this.chunkPoolSize; i++) {
      const chunk = this.createChunk(this.nextChunkZ);
      this.chunks.push(chunk);
      this.scene.add(chunk);
      this.nextChunkZ += CHUNK_LENGTH;
    }
  }

  private clearChunks() {
    this.chunks.forEach((chunk) => this.scene.remove(chunk));
    this.chunks = [];
  }
}
