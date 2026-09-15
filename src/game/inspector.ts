import * as THREE from 'three';
import { soundManager } from '../audio/soundManager';

export class InspectorManager {
  public group: THREE.Group;
  private inspectorRoot: THREE.Group;
  private dogRoot: THREE.Group;

  // Inspector limb groups for animation
  private inspLeftArm: THREE.Group;
  private inspRightArm: THREE.Group;
  private inspLeftLeg: THREE.Group;
  private inspRightLeg: THREE.Group;
  private inspHead: THREE.Group;

  // Dog limb groups
  private dogLegFL: THREE.Group;
  private dogLegFR: THREE.Group;
  private dogLegBL: THREE.Group;
  private dogLegBR: THREE.Group;
  private dogHead: THREE.Group;
  private dogTail: THREE.Group;
  private dogTongue: THREE.Mesh;

  // Animation timing & state
  private runAnimTime: number = 0;
  private followDistance: number = 5.2; // default chase distance behind runner (meters)
  private targetDistance: number = 5.2;
  private isAlerted: boolean = false;
  private alertTimer: number = 0;
  private whistleTimer: number = 0;
  public isCatching: boolean = false;
  private catchProgress: number = 0;

  constructor() {
    this.group = new THREE.Group();

    // 1. Build The Grumpy Inspector
    this.inspectorRoot = new THREE.Group();
    const { inspMesh, lArm, rArm, lLeg, rLeg, head } = this.buildInspectorModel();
    this.inspectorRoot.add(inspMesh);
    this.inspLeftArm = lArm;
    this.inspRightArm = rArm;
    this.inspLeftLeg = lLeg;
    this.inspRightLeg = rLeg;
    this.inspHead = head;
    this.group.add(this.inspectorRoot);

    // 2. Build The Pitbull Bulldog
    this.dogRoot = new THREE.Group();
    const { dogMesh, fl, fr, bl, br, dogHead, tail, tongue } = this.buildDogModel();
    this.dogRoot.add(dogMesh);
    this.dogLegFL = fl;
    this.dogLegFR = fr;
    this.dogLegBL = bl;
    this.dogLegBR = br;
    this.dogHead = dogHead;
    this.dogTail = tail;
    this.dogTongue = tongue;
    this.group.add(this.dogRoot);

    // Initial positioning
    this.inspectorRoot.position.set(0.3, 0, 0);
    this.dogRoot.position.set(-0.7, 0, 0.4);
  }

  private buildInspectorModel() {
    const inspMesh = new THREE.Group();

    // Materials
    const uniformMat = new THREE.MeshStandardMaterial({ color: 0x1a2b4c, roughness: 0.6 }); // Navy blue officer uniform
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85, roughness: 0.2 }); // Badge & buttons
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b0, roughness: 0.7 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.8 }); // Brown mustache & hair
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x221810, roughness: 0.5 }); // Leather belt
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }); // Black polished boots

    // Torso (Stout, authoritarian police officer build)
    const torsoGeo = new THREE.BoxGeometry(0.72, 0.88, 0.44);
    const torso = new THREE.Mesh(torsoGeo, uniformMat);
    torso.position.y = 1.32;
    torso.castShadow = true;
    inspMesh.add(torso);

    // Police Belt with Gold Buckle
    const beltGeo = new THREE.BoxGeometry(0.74, 0.12, 0.46);
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 0.92;
    inspMesh.add(belt);

    const buckleGeo = new THREE.BoxGeometry(0.18, 0.14, 0.48);
    const buckle = new THREE.Mesh(buckleGeo, goldMat);
    buckle.position.y = 0.92;
    inspMesh.add(buckle);

    // Golden Police Shield Badge on Chest
    const badgeGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.03, 6);
    const badge = new THREE.Mesh(badgeGeo, goldMat);
    badge.rotation.x = Math.PI / 2;
    badge.position.set(-0.2, 1.48, 0.23);
    inspMesh.add(badge);

    // Golden Buttons down front
    for (let y = 1.1; y <= 1.45; y += 0.16) {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 8), goldMat);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(0, y, 0.23);
      inspMesh.add(btn);
    }

    // Head
    const head = new THREE.Group();
    head.position.y = 1.95;

    const headGeo = new THREE.SphereGeometry(0.32, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    head.add(headMesh);

    // Big bushy Inspector mustache
    const stacheGeo = new THREE.BoxGeometry(0.34, 0.09, 0.14);
    const stache = new THREE.Mesh(stacheGeo, hairMat);
    stache.position.set(0, -0.06, 0.29);
    head.add(stache);

    // Bulbous nose
    const noseGeo = new THREE.SphereGeometry(0.08, 10, 10);
    const nose = new THREE.Mesh(noseGeo, skinMat);
    nose.position.set(0, 0.02, 0.34);
    head.add(nose);

    // Stern Grumpy Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
    eyeL.position.set(-0.11, 0.08, 0.3);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.11;
    head.add(eyeL);
    head.add(eyeR);

    // Stern bushy eyebrows
    const browGeo = new THREE.BoxGeometry(0.12, 0.04, 0.05);
    const browL = new THREE.Mesh(browGeo, hairMat);
    browL.rotation.z = -0.2;
    browL.position.set(-0.11, 0.14, 0.31);
    const browR = browL.clone();
    browR.rotation.z = 0.2;
    browR.position.x = 0.11;
    head.add(browL);
    head.add(browR);

    // Police Peaked Officer Cap
    const capGeo = new THREE.CylinderGeometry(0.38, 0.34, 0.18, 18);
    const cap = new THREE.Mesh(capGeo, uniformMat);
    cap.position.y = 0.22;
    cap.rotation.x = -0.12;

    const visorGeo = new THREE.BoxGeometry(0.38, 0.04, 0.24);
    const visor = new THREE.Mesh(visorGeo, bootMat);
    visor.position.set(0, 0.14, 0.28);
    visor.rotation.x = 0.18;

    const capBadge = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 8), goldMat);
    capBadge.rotation.x = Math.PI / 2;
    capBadge.position.set(0, 0.24, 0.32);

    head.add(cap);
    head.add(visor);
    head.add(capBadge);
    inspMesh.add(head);

    // Left Arm & Right Arm (Pumping vigorously)
    const lArm = new THREE.Group();
    lArm.position.set(-0.46, 1.6, 0);
    const lUpper = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.46, 0.18), uniformMat);
    lUpper.position.y = -0.22;
    lArm.add(lUpper);
    const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), skinMat);
    lHand.position.y = -0.48;
    lArm.add(lHand);
    inspMesh.add(lArm);

    const rArm = new THREE.Group();
    rArm.position.set(0.46, 1.6, 0);
    const rUpper = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.46, 0.18), uniformMat);
    rUpper.position.y = -0.22;
    rArm.add(rUpper);
    const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), skinMat);
    rHand.position.y = -0.48;
    rArm.add(rHand);

    // Silver whistle in right hand
    const whistleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.14, 8);
    const whistleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95 });
    const whistle = new THREE.Mesh(whistleGeo, whistleMat);
    whistle.rotation.x = Math.PI / 2;
    whistle.position.set(0, -0.48, 0.1);
    rArm.add(whistle);

    inspMesh.add(rArm);

    // Left Leg & Right Leg
    const lLeg = new THREE.Group();
    lLeg.position.set(-0.2, 0.88, 0);
    const lPants = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.52, 0.24), uniformMat);
    lPants.position.y = -0.26;
    lLeg.add(lPants);
    const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.22, 0.38), bootMat);
    lBoot.position.set(0, -0.56, 0.07);
    lLeg.add(lBoot);
    inspMesh.add(lLeg);

    const rLeg = new THREE.Group();
    rLeg.position.set(0.2, 0.88, 0);
    const rPants = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.52, 0.24), uniformMat);
    rPants.position.y = -0.26;
    rLeg.add(rPants);
    const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.22, 0.38), bootMat);
    rBoot.position.set(0, -0.56, 0.07);
    rLeg.add(rBoot);
    inspMesh.add(rLeg);

    return { inspMesh, lArm, rArm, lLeg, rLeg, head };
  }

  private buildDogModel() {
    const dogMesh = new THREE.Group();

    // Materials
    const furMat = new THREE.MeshStandardMaterial({ color: 0xa06535, roughness: 0.85 }); // Warm brown bulldog fur
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xd69f7e, roughness: 0.85 }); // Lighter belly/chest
    const snoutMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.9 }); // Dark bulldog muzzle
    const collarMat = new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.4 }); // Spiked red collar
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.9, roughness: 0.1 });
    const tongueMat = new THREE.MeshStandardMaterial({ color: 0xff6688, roughness: 0.3 });

    // Chubby Bulldog Body
    const bodyGeo = new THREE.SphereGeometry(0.38, 14, 14);
    const body = new THREE.Mesh(bodyGeo, furMat);
    body.scale.set(1.1, 0.95, 1.4);
    body.position.y = 0.46;
    body.castShadow = true;
    dogMesh.add(body);

    // Chest / Belly
    const chestGeo = new THREE.SphereGeometry(0.32, 12, 12);
    const chest = new THREE.Mesh(chestGeo, bellyMat);
    chest.scale.set(0.9, 0.8, 1.1);
    chest.position.set(0, 0.38, 0.15);
    dogMesh.add(chest);

    // Spiked Red Collar
    const collarGeo = new THREE.TorusGeometry(0.26, 0.05, 8, 16);
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0.58, 0.42);
    dogMesh.add(collar);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.06, 6), spikeMat);
      spike.rotation.x = Math.PI / 2;
      spike.rotation.z = angle;
      spike.position.set(Math.cos(angle) * 0.28, 0.58, 0.42 + Math.sin(angle) * 0.28);
      dogMesh.add(spike);
    }

    // Dog Head
    const dogHead = new THREE.Group();
    dogHead.position.set(0, 0.65, 0.55);

    const headGeo = new THREE.SphereGeometry(0.26, 14, 14);
    const head = new THREE.Mesh(headGeo, furMat);
    head.scale.set(1.15, 1.0, 1.0);
    dogHead.add(head);

    // Broad bulldog snout & jowls
    const snoutGeo = new THREE.BoxGeometry(0.28, 0.18, 0.24);
    const snout = new THREE.Mesh(snoutGeo, snoutMat);
    snout.position.set(0, -0.06, 0.18);
    dogHead.add(snout);

    // Black nose
    const noseGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const nose = new THREE.Mesh(noseGeo, new THREE.MeshBasicMaterial({ color: 0x111111 }));
    nose.position.set(0, 0.02, 0.3);
    dogHead.add(nose);

    // Floppy ears
    const earGeo = new THREE.BoxGeometry(0.08, 0.18, 0.12);
    const earL = new THREE.Mesh(earGeo, snoutMat);
    earL.position.set(-0.25, 0.08, -0.04);
    earL.rotation.z = 0.5;
    earL.rotation.x = 0.2;
    const earR = earL.clone();
    earR.position.x = 0.25;
    earR.rotation.z = -0.5;
    dogHead.add(earL);
    dogHead.add(earR);

    // Pink panting tongue hanging out
    const tongueGeo = new THREE.BoxGeometry(0.1, 0.02, 0.16);
    const tongue = new THREE.Mesh(tongueGeo, tongueMat);
    tongue.position.set(0.06, -0.14, 0.28);
    tongue.rotation.x = 0.3;
    dogHead.add(tongue);

    // Dog Eyes
    const dEyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const dEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), dEyeMat);
    dEyeL.position.set(-0.11, 0.09, 0.2);
    const dEyeR = dEyeL.clone();
    dEyeR.position.x = 0.11;
    dogHead.add(dEyeL);
    dogHead.add(dEyeR);

    dogMesh.add(dogHead);

    // Dog Legs (Short, stocky legs)
    const legGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.32, 10);
    const footGeo = new THREE.BoxGeometry(0.12, 0.08, 0.14);

    const makeDogLeg = (x: number, z: number) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(x, 0.34, z);
      const legMesh = new THREE.Mesh(legGeo, furMat);
      legMesh.position.y = -0.16;
      legGroup.add(legMesh);
      const foot = new THREE.Mesh(footGeo, bellyMat);
      foot.position.set(0, -0.3, 0.03);
      legGroup.add(foot);
      dogMesh.add(legGroup);
      return legGroup;
    };

    const fl = makeDogLeg(-0.24, 0.28);
    const fr = makeDogLeg(0.24, 0.28);
    const bl = makeDogLeg(-0.24, -0.28);
    const br = makeDogLeg(0.24, -0.28);

    // Little wagging tail
    const tail = new THREE.Group();
    tail.position.set(0, 0.55, -0.45);
    const tailMesh = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 6), furMat);
    tailMesh.rotation.x = -1.2;
    tail.add(tailMesh);
    dogMesh.add(tail);

    return { dogMesh, fl, fr, bl, br, dogHead, tail, tongue };
  }

  /**
   * Called when player stumbles (clips a barrier, bumps a train, or makes a near-miss).
   * Inspector blows whistle, dog barks, and both surge right behind the player's heels!
   */
  public triggerAlert() {
    this.isAlerted = true;
    this.alertTimer = 5.5; // Stay close for 5.5 seconds of clean running
    this.targetDistance = 2.1; // Surge forward to right behind player!

    soundManager.playWhistle();
    soundManager.playDogBark();
  }

  /**
   * Called on fatal crash: Inspector and Dog slide in and catch the fallen player!
   */
  public triggerCatch() {
    this.isCatching = true;
    this.catchProgress = 0;
    this.targetDistance = 0.8; // Catch range right at player
    soundManager.playWhistle();
  }

  public reset(startZ: number = 0) {
    this.followDistance = 5.4;
    this.targetDistance = 5.4;
    this.isAlerted = false;
    this.alertTimer = 0;
    this.whistleTimer = 0;
    this.isCatching = false;
    this.catchProgress = 0;

    this.group.position.set(0, 0, startZ - 5.4);
    this.group.visible = true;
  }

  public update(delta: number, playerX: number, playerY: number, playerZ: number, playerSpeed: number) {
    if (this.isCatching) {
      this.catchProgress = Math.min(1, this.catchProgress + delta * 2.8);
      // Move right in front of player for confrontation
      this.group.position.z = THREE.MathUtils.lerp(this.group.position.z, playerZ - 0.7, 0.18);
      this.group.position.x = THREE.MathUtils.lerp(this.group.position.x, playerX + 0.3, 0.15);
      this.group.position.y = THREE.MathUtils.lerp(this.group.position.y, playerY, 0.2);

      // Inspector stands with arms crossed or shaking fist
      this.inspRightArm.rotation.x = Math.sin(performance.now() * 0.01) * 0.4 - 1.2;
      this.inspLeftArm.rotation.x = 0.2;
      this.inspLeftLeg.rotation.x = 0;
      this.inspRightLeg.rotation.x = 0;
      this.dogTail.rotation.y = Math.sin(performance.now() * 0.02) * 0.8;
      return;
    }

    // Handle alert duration: gradually drop back to safe distance if player runs cleanly
    if (this.isAlerted) {
      this.alertTimer -= delta;
      if (this.alertTimer <= 0) {
        this.isAlerted = false;
        this.targetDistance = 5.4; // Fall back to safe distance
      } else {
        // Whistle chirp intermittently when alerted
        this.whistleTimer += delta;
        if (this.whistleTimer > 3.0) {
          this.whistleTimer = 0;
          soundManager.playWhistle();
        }
      }
    }

    // Smooth follow distance adjustment
    this.followDistance = THREE.MathUtils.lerp(this.followDistance, this.targetDistance, delta * 3.2);

    // Position behind the runner along tracks
    const targetZ = playerZ - this.followDistance;
    this.group.position.z = THREE.MathUtils.lerp(this.group.position.z, targetZ, 0.25);
    // Smooth lane following with slight delay for realistic pursuit physics
    this.group.position.x = THREE.MathUtils.lerp(this.group.position.x, playerX, delta * 8.5);
    this.group.position.y = playerY;

    // Running animation cycle
    const animSpeed = Math.max(10, playerSpeed * 0.6);
    this.runAnimTime += delta * animSpeed;

    // 1. Inspector Running Animation
    const inspLegSwing = Math.sin(this.runAnimTime) * 0.85;
    this.inspLeftLeg.rotation.x = inspLegSwing;
    this.inspRightLeg.rotation.x = -inspLegSwing;

    this.inspLeftArm.rotation.x = -inspLegSwing * 0.9;
    this.inspRightArm.rotation.x = inspLegSwing * 0.9 - 0.3; // holding whistle forward
    this.inspHead.rotation.x = Math.sin(this.runAnimTime * 2) * 0.08;

    // 2. Bulldog Galloping Animation
    const dogGallop = Math.sin(this.runAnimTime * 1.5) * 0.75;
    this.dogLegFL.rotation.x = dogGallop;
    this.dogLegFR.rotation.x = -dogGallop;
    this.dogLegBL.rotation.x = -dogGallop * 0.8;
    this.dogLegBR.rotation.x = dogGallop * 0.8;
    this.dogTail.rotation.y = Math.sin(this.runAnimTime * 3) * 0.6;
    this.dogHead.rotation.x = Math.sin(this.runAnimTime * 1.5) * 0.15;
  }

  public getAlertStatus(): { isAlerted: boolean; distanceRatio: number } {
    // 1.0 = right on heels, 0.0 = safe distance
    const ratio = Math.max(0, Math.min(1, (5.4 - this.followDistance) / (5.4 - 1.8)));
    return {
      isAlerted: this.isAlerted,
      distanceRatio: ratio,
    };
  }
}
