import { Lane, ObstacleData, CoinData, PowerUpItemData, PowerUpType } from '../types/game';
import { TRAIN_HEIGHT, JETPACK_Y } from './constants';

export class CourseGenerator {
  private lastGeneratedZ = 30;
  private patternCounter = 0;

  public reset(startZ: number = 30) {
    this.lastGeneratedZ = startZ;
    this.patternCounter = 0;
  }

  /**
   * Generates the next course segment with progressive difficulty scaling:
   * - Spacing between obstacles contracts as distance increases (faster obstacle arrival)
   * - Moving trains travel faster toward the runner
   * - Complex obstacle combinations (rooftop barriers, train squeezes) unlock progressively
   */
  public generateNextSegment(
    targetZ: number,
    isJetpackActive: boolean,
    playerDistance: number = 0,
    currentSpeed: number = 22
  ): {
    obstacles: ObstacleData[];
    coins: CoinData[];
    powerUps: PowerUpItemData[];
  } {
    const obstacles: ObstacleData[] = [];
    const coins: CoinData[] = [];
    const powerUps: PowerUpItemData[] = [];

    // Calculate natural difficulty scaling factor (0.0 to 1.0 based on distance)
    const difficultyProgress = Math.min(1, Math.max(0, playerDistance / 2500));

    // Dynamic obstacle spacing factor: contracts from 1.25x (generous at start) to 0.66x (rapid fire at 2500m+)
    const spacingFactor = Math.max(0.66, 1.25 - difficultyProgress * 0.59);

    // Dynamic oncoming train speed: accelerates from 13 m/s up to 26 m/s
    const oncomingTrainSpeed = Math.round(13 + difficultyProgress * 13);

    while (this.lastGeneratedZ < targetZ) {
      const z = this.lastGeneratedZ;

      if (isJetpackActive) {
        // High-altitude sky coin ribbons while soaring with jetpack
        // Continuous, beautiful sinusoidal tracks across lanes without empty gaps
        const span = 28;
        for (let step = 0; step < span; step += 1.8) {
          const coinZ = z + step;
          const wave = Math.sin(coinZ * 0.12);
          const primaryLane: Lane = wave < -0.33 ? -1 : wave > 0.33 ? 1 : 0;
          
          // Primary flowing ribbon
          coins.push({
            id: `coin_sky_main_${coinZ}_${primaryLane}`,
            lane: primaryLane,
            y: JETPACK_Y + Math.sin(coinZ * 0.2) * 0.4,
            z: coinZ,
          });

          // Adjacent lane trail for dense coin collection
          if (step % 3.6 < 1.0) {
            const sideLane: Lane = primaryLane === 0 ? (wave > 0 ? 1 : -1) : 0;
            coins.push({
              id: `coin_sky_side_${coinZ}_${sideLane}`,
              lane: sideLane,
              y: JETPACK_Y + 0.2,
              z: coinZ,
            });
          }
        }
        this.lastGeneratedZ += span;
        continue;
      }

      this.patternCounter++;

      // Progressive pattern selection:
      // In early distance (Tier 1), stick to friendly patterns (0, 1, 4, 7).
      // As distance increases, introduce intense moving trains and rooftop hurdles!
      let availablePatterns = [0, 1, 4, 7];
      if (playerDistance >= 200) {
        availablePatterns = [0, 1, 2, 3, 4, 7];
      }
      if (playerDistance >= 600) {
        availablePatterns = [0, 1, 2, 3, 4, 5, 6, 7];
      }

      const patternType = availablePatterns[this.patternCounter % availablePatterns.length];

      switch (patternType) {
        case 0: {
          // Pattern: Ramp Train on Center Lane, Barrier on Left, Coins along Train Roof
          obstacles.push({
            id: `ramp_train_${z}`,
            type: 'ramp_train',
            lane: 0,
            z: z,
            hasRamp: true,
          });

          // Coins running up ramp and across roof
          for (let cZ = z; cZ < z + 22; cZ += 2.2) {
            coins.push({
              id: `coin_roof_${cZ}`,
              lane: 0,
              y: TRAIN_HEIGHT + 0.9,
              z: cZ,
            });
          }

          // Low barrier on Left lane
          obstacles.push({
            id: `low_bar_${z + 6}`,
            type: 'low_barrier',
            lane: -1,
            z: z + 6,
          });

          // Jump arc over low barrier
          coins.push(
            { id: `coin_arc_1_${z}`, lane: -1, y: 1.0, z: z + 3 },
            { id: `coin_arc_2_${z}`, lane: -1, y: 2.2, z: z + 6 },
            { id: `coin_arc_3_${z}`, lane: -1, y: 1.0, z: z + 9 }
          );

          // Right lane power-up chance
          if (Math.random() < 0.42) {
            powerUps.push(this.createRandomPowerUp(1, z + 10));
          }

          const baseSpacing = 34;
          this.lastGeneratedZ += Math.max(18, Math.round(baseSpacing * spacingFactor));
          break;
        }

        case 1: {
          // Pattern: High Barrier (Slide) & Low Barrier (Jump)
          const slideLane: Lane = Math.random() < 0.5 ? 0 : 1;
          const jumpLane: Lane = slideLane === 0 ? 1 : 0;
          const clearLane: Lane = -1;

          obstacles.push({
            id: `high_bar_${z}`,
            type: 'high_barrier',
            lane: slideLane,
            z: z,
          });

          // Low coins encouraging slide under barrier
          coins.push(
            { id: `coin_slide_1_${z}`, lane: slideLane, y: 0.6, z: z - 2 },
            { id: `coin_slide_2_${z}`, lane: slideLane, y: 0.6, z: z },
            { id: `coin_slide_3_${z}`, lane: slideLane, y: 0.6, z: z + 2 }
          );

          obstacles.push({
            id: `low_bar_${z + 3}`,
            type: 'low_barrier',
            lane: jumpLane,
            z: z + 3,
          });

          // Clean straight coin run in clear lane
          for (let cZ = z - 3; cZ <= z + 9; cZ += 2.5) {
            coins.push({
              id: `coin_straight_${cZ}`,
              lane: clearLane,
              y: 0.8,
              z: cZ,
            });
          }

          const baseSpacing = 26;
          this.lastGeneratedZ += Math.max(16, Math.round(baseSpacing * spacingFactor));
          break;
        }

        case 2: {
          // Pattern: High-Speed Moving Oncoming Train & Stopped Train Squeeze
          const movingLane: Lane = Math.random() < 0.5 ? -1 : 1;
          const openLane: Lane = 0;
          const stopLane: Lane = movingLane === -1 ? 1 : -1;

          obstacles.push({
            id: `train_moving_${z}`,
            type: 'train_moving',
            lane: movingLane,
            z: z + 28,
            speed: oncomingTrainSpeed,
          });

          obstacles.push({
            id: `train_stopped_${z}`,
            type: 'train_stopped',
            lane: stopLane,
            z: z,
          });

          // Safe passage coins in open middle lane
          for (let cZ = z; cZ < z + 22; cZ += 2.2) {
            coins.push({
              id: `coin_safe_${cZ}`,
              lane: openLane,
              y: 0.8,
              z: cZ,
            });
          }

          if (Math.random() < 0.48) {
            powerUps.push(this.createRandomPowerUp(openLane, z + 10));
          }

          const baseSpacing = 40;
          this.lastGeneratedZ += Math.max(20, Math.round(baseSpacing * spacingFactor));
          break;
        }

        case 3: {
          // Pattern: Rapid Slalom Hurdles (Left Jump -> Right Slide -> Center Jump)
          obstacles.push({
            id: `low_bar_left_${z}`,
            type: 'low_barrier',
            lane: -1,
            z: z,
          });
          obstacles.push({
            id: `high_bar_right_${z + 5}`,
            type: 'high_barrier',
            lane: 1,
            z: z + 5,
          });
          obstacles.push({
            id: `low_bar_center_${z + 11}`,
            type: 'low_barrier',
            lane: 0,
            z: z + 11,
          });

          // S-curve coin trail guiding smooth lane transitions
          coins.push(
            { id: `coin_s1_${z}`, lane: 0, y: 0.8, z: z },
            { id: `coin_s2_${z}`, lane: -1, y: 2.2, z: z + 3 },
            { id: `coin_s3_${z}`, lane: 0, y: 0.8, z: z + 6 },
            { id: `coin_s4_${z}`, lane: 1, y: 0.6, z: z + 8 },
            { id: `coin_s5_${z}`, lane: 0, y: 2.2, z: z + 11 }
          );

          const baseSpacing = 30;
          this.lastGeneratedZ += Math.max(16, Math.round(baseSpacing * spacingFactor));
          break;
        }

        case 4: {
          // Pattern: Dual Train Corridors with Center Ramp
          const sideLane: Lane = Math.random() < 0.5 ? -1 : 1;
          const otherSide: Lane = sideLane === -1 ? 1 : -1;

          obstacles.push({
            id: `ramp_train_${z}`,
            type: 'ramp_train',
            lane: 0,
            z: z,
            hasRamp: true,
          });

          obstacles.push({
            id: `train_side_${z + 4}`,
            type: 'train_stopped',
            lane: sideLane,
            z: z + 4,
          });

          // Roof coins
          for (let cZ = z; cZ < z + 22; cZ += 2.2) {
            coins.push({
              id: `coin_roof_mid_${cZ}`,
              lane: 0,
              y: TRAIN_HEIGHT + 0.9,
              z: cZ,
            });
          }

          // Barrier in the remaining side lane
          obstacles.push({
            id: `low_bar_side_${z + 6}`,
            type: 'low_barrier',
            lane: otherSide,
            z: z + 6,
          });

          if (Math.random() < 0.45) {
            powerUps.push(this.createRandomPowerUp(otherSide, z + 12));
          }

          const baseSpacing = 36;
          this.lastGeneratedZ += Math.max(20, Math.round(baseSpacing * spacingFactor));
          break;
        }

        case 5: {
          // Pattern: Rooftop Barrier Jump! (Ramp Train with a Hurdle ON TOP of the roof)
          obstacles.push({
            id: `ramp_train_rooftop_${z}`,
            type: 'ramp_train',
            lane: 0,
            z: z,
            hasRamp: true,
          });

          // Low hurdle mounted on top of the train roof!
          obstacles.push({
            id: `roof_barrier_${z + 12}`,
            type: 'low_barrier',
            lane: 0,
            z: z + 12,
          });

          // High coin arc leaping over the rooftop hurdle
          coins.push(
            { id: `coin_rf_1_${z}`, lane: 0, y: TRAIN_HEIGHT + 0.9, z: z + 8 },
            { id: `coin_rf_2_${z}`, lane: 0, y: TRAIN_HEIGHT + 2.3, z: z + 12 },
            { id: `coin_rf_3_${z}`, lane: 0, y: TRAIN_HEIGHT + 0.9, z: z + 16 }
          );

          // Moving train passing on one side
          const passLane: Lane = Math.random() < 0.5 ? -1 : 1;
          obstacles.push({
            id: `train_pass_${z}`,
            type: 'train_moving',
            lane: passLane,
            z: z + 26,
            speed: oncomingTrainSpeed,
          });

          const baseSpacing = 38;
          this.lastGeneratedZ += Math.max(22, Math.round(baseSpacing * spacingFactor));
          break;
        }

        case 6: {
          // Pattern: High Intensity Gauntlet - Consecutive Moving Trains & Barrier Squeeze
          const laneA: Lane = -1;
          const laneB: Lane = 1;

          obstacles.push({
            id: `moving_left_${z}`,
            type: 'train_moving',
            lane: laneA,
            z: z + 24,
            speed: oncomingTrainSpeed,
          });

          obstacles.push({
            id: `moving_right_${z + 12}`,
            type: 'train_moving',
            lane: laneB,
            z: z + 36,
            speed: oncomingTrainSpeed + 2,
          });

          // Low barrier in center lane
          obstacles.push({
            id: `mid_barrier_${z + 8}`,
            type: 'low_barrier',
            lane: 0,
            z: z + 8,
          });

          // Center coin sprint
          for (let cZ = z; cZ < z + 24; cZ += 2.2) {
            coins.push({
              id: `coin_sprint_${cZ}`,
              lane: 0,
              y: cZ === z + 8 ? 2.4 : 0.8,
              z: cZ,
            });
          }

          const baseSpacing = 42;
          this.lastGeneratedZ += Math.max(22, Math.round(baseSpacing * spacingFactor));
          break;
        }

        case 7:
        default: {
          // Pattern: Free Run with Multi-Lane Coin Arcs & Power-Up Runway
          [-1, 0, 1].forEach((l) => {
            const lane = l as Lane;
            for (let cZ = z; cZ < z + 18; cZ += 2.2) {
              if (Math.random() > 0.28) {
                coins.push({
                  id: `coin_free_${lane}_${cZ}`,
                  lane,
                  y: 0.8,
                  z: cZ,
                });
              }
            }
          });

          // Single barrier on one random lane
          const randLane: Lane = ([-1, 0, 1] as Lane[])[Math.floor(Math.random() * 3)];
          obstacles.push({
            id: `barrier_rand_${z + 8}`,
            type: Math.random() < 0.5 ? 'low_barrier' : 'high_barrier',
            lane: randLane,
            z: z + 8,
          });

          // Center powerup
          if (Math.random() < 0.5) {
            powerUps.push(this.createRandomPowerUp(0, z + 14));
          }

          const baseSpacing = 28;
          this.lastGeneratedZ += Math.max(16, Math.round(baseSpacing * spacingFactor));
          break;
        }
      }
    }

    return { obstacles, coins, powerUps };
  }

  private createRandomPowerUp(lane: Lane, z: number): PowerUpItemData {
    const roll = Math.random();
    let type: PowerUpType;
    if (roll < 0.22) {
      type = 'mystery_box';
    } else if (roll < 0.40) {
      type = 'letter';
    } else {
      const types: PowerUpType[] = ['magnet', 'jetpack', 'sneakers', 'multiplier', 'shield'];
      type = types[Math.floor(Math.random() * types.length)];
    }
    return {
      id: `pw_${type}_${z}`,
      type,
      lane,
      y: 1.2,
      z,
    };
  }
}
