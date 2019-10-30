import properties from '../properties';
import utils from '../util/utils';
import TileMath from '../util/TileMath';

import localTileDictionary from '../maps/data/localTileDictionary.json';

export default class BallisticsSystem {
  constructor(map,
    playerSquad, playerSquadLocalFov,
    enemySquad, enemySquadLocalFov) {
    this.map = map;

    this.playerSquad = playerSquad;
    this.playerSquadLocalFov = playerSquadLocalFov;

    this.enemySquad = enemySquad;
    this.enemySquadLocalFov = enemySquadLocalFov;
  }

  effectFire(character, weapon, intendedLine) {
    // console.log('effectFire');
    // console.log(weapon);
    switch (weapon.type) {
      case 'sidearm':
      case 'rifle':
      case 'automatic rifle':
      case 'machine gun':
        return this.effectSmallArmsFire(character, weapon, intendedLine);
      case 'grenade':
      case 'grenade launcher':
      case 'rocket launcher':
        return this.effectExplosives(character, weapon, intendedLine);
      case 'flame thrower':
        return this.effectFlame(character, weapon, intendedLine);
    }
  }

  effectFlame(character, weapon, intendedLine) {
    const { power, blastRadius, accuracy, range } = weapon;
    const attackActions = {};
    const effectAreas = [];
    const smokeAreas = [];
    const fireAreas = [];

    const xpStatNames = ['aggression', 'presence'];

    // One flame shot to every tile in the blast ring
    const origin = intendedLine[0];
    const center = intendedLine[intendedLine.length - 1];
    const blastCircle = TileMath.tileCircleFilled(center.x, center.y, blastRadius);

    const flamePoints = [];
    Object.keys(blastCircle)

      // Convert map of keys to points
      .map(key => utils.xyFromKey(key))
      .forEach((endPoint) => {
        const flameShotLine = TileMath.tileLine(origin.x, origin.y, endPoint.x, endPoint.y);

        // We only want each point affected by the flame to be included once, so add them to a map
        const flameLine = this.simulateProjectile(
          power, accuracy, range, flameShotLine, character,
          false, xpStatNames, attackActions);

        // If the flame is long enough separate smoke and fire
        if (flameLine.length >= 4) {

          // The last tile of each flame line is smoke
          const smokePoint = flameLine[flameLine.length - 1];
          smokeAreas.push({ x: smokePoint.x, y: smokePoint.y, amount: weapon.smoke });

          // The the second to last is fire
          const firePoint = flameLine[flameLine.length - 2];
          fireAreas.push({ x: firePoint.x, y: firePoint.y, amount: weapon.fire });
        }
        else if (flameLine.length > 0) {

          // The last tiles are smoke and fire
          const point = flameLine[flameLine.length - 1];
          smokeAreas.push({ x: point.x, y: point.y, amount: weapon.smoke });
          fireAreas.push({ x: point.x, y: point.y, amount: weapon.fire });
        }

        const effectAreaDistance = 4;
        let effectAreaIndex = 0;
        for (let i = 0; i < flameLine.length; i += effectAreaDistance) {
          if (typeof flamePoints[effectAreaIndex] === 'undefined') {
            flamePoints[effectAreaIndex] = {};
          }
          flameLine.slice(i, i + effectAreaDistance)
            .forEach(point =>
              flamePoints[effectAreaIndex][utils.keyFromXY(point.x, point.y)] =
                { x: point.x, y: point.y });
          effectAreaIndex++;
        }
      });
    flamePoints
      .forEach(flamePointArea => effectAreas.push([...Object.values(flamePointArea)]));

    return { effectAreas, smokeAreas, fireAreas, attackActions };
  }

  effectExplosives(character, weapon, intendedLine) {
    const { impactPower, blastRadius, blastPower, accuracy, range } = weapon;
    const attackActions = {};
    const effectAreas = [];
    const smokeAreas = [];
    const fireAreas = [];

    const xpStatNames = ['resilience'];

    // First simulate the impact of the explosive itself
    const impactLine = this.simulateProjectile(
      impactPower, accuracy, range, intendedLine, character,
      false, xpStatNames, attackActions);

    // Now the impact point of the explosive becomes the center of the blast
    const center = impactLine[impactLine.length - 1];
    const blastRing = TileMath.tileCircle(center.x, center.y, blastRadius);

    // For each point on the blast radius simulate shrapnel
    const blastPoints = {};
    Object.keys(blastRing)

      // Convert map of keys to points
      .map(key => utils.xyFromKey(key))
      .forEach((endPoint) => {
        const shrapnelLine = TileMath.tileLine(center.x, center.y, endPoint.x, endPoint.y);

        // We only want each point affected by the blast to be included once, so add them to a map
        this.simulateProjectile(
          blastPower, accuracy, range, shrapnelLine, character,
          true, xpStatNames, attackActions)
          .forEach(point =>
            blastPoints[utils.keyFromXY(point.x, point.y)] = { x: point.x, y: point.y });
      });

    // Now we send back two weapon effect lines, the impact line and the blast lines all together
    effectAreas.push(impactLine);
    effectAreas.push([...Object.values(blastPoints)]);

    // Add environmental effects
    for (let x = center.x - 1; x < center.x + 1; x++) {
      for (let y = center.y - 1; y < center.y + 1; y++) {
        const tile = this.map[utils.keyFromXY(x, y)];
        if (!tile) {
          continue;
        }
        const tileType = localTileDictionary[tile.name];
        if (tileType.concealment === 100) {
          continue;
        }
        if (x === center.x && y === center.y) {
          smokeAreas.push({ x, y, amount: weapon.smoke });
        }
        else {
          smokeAreas.push({ x, y, amount: Math.round(0.50 * weapon.smoke) });
        }
      }
    }
    fireAreas.push({ x: center.x, y: center.y, amount: weapon.fire });

    return { effectAreas, smokeAreas, fireAreas, attackActions };
  }

  effectMelee(attacker, defender) {
    const attackActions = {};
    const defenderSquad = attacker.playerControlled ? this.enemySquad : this.playerSquad;
    const roll = properties.rng.getPercentage();
    const chanceToHit = this.chanceForMeleeToHit(attacker, defender);
    if (roll <= chanceToHit) {
      // Melee hits add aggresion xp
      attacker.xp('aggression');

      [...Array(attacker.getNumberOfMeleeAttacks()).keys()]
        .forEach(() => this.hitCharacter(defenderSquad, defender, attackActions));
    }
    return attackActions;
  }

  chanceForMeleeToHit(attacker, defender) {
    const chance = (attacker.getMeleeAttackChance() * defender.getMeleeVulnerableChance()) * 100;
    return chance;
  }

  effectSmallArmsFire(character, weapon, intendedLine) {
    const { roundsPerBurst, bursts, power, accuracy, range } = weapon;
    const attackActions = {};
    const effectAreas = [];
    const smokeAreas = [];
    const fireAreas = [];

    const xpStatNames = ['presence'];

    // Simulate each round from each burst
    const roundsToSimulate = roundsPerBurst * bursts;
    for (let round = 0; round < roundsToSimulate; round++) {
      effectAreas.push(this.simulateProjectile(
        power, accuracy, range, intendedLine, character,
        false, xpStatNames, attackActions));
    }
    return { effectAreas, smokeAreas, fireAreas, attackActions };
  }

  simulateProjectile(
    projectilePower, projectileAccuracy, projectileRange, intendedLine,
    firingCharacter, impactsOrigin, xpStatNames, attackActions) {
    let roundTraveling = true;
    let remainingPower = projectilePower;

    let intendedLineIndex = 0;
    const actualProjectileLine = [];
    while (roundTraveling) {
      // console.log(intendedLineIndex);
      // console.log(intendedLine);
      // console.log(intendedLine[intendedLineIndex]);
      const { x, y } = intendedLine[intendedLineIndex];
      const tile = this.map[utils.keyFromXY(x, y)];

      // If we run out of map, we're done
      if (!tile) {
        roundTraveling = false;
        break;
      }
      const tileDef = localTileDictionary[tile.name];

      // If the round doesn't impact the origin, skip simulation after adding the
      // origin to the actual line.
      if (impactsOrigin || intendedLineIndex !== 0) {

        // If the tile adjacent to the origin is not 100 cover and the round does not impact
        // the origin, it's cover doesn't decrease the round's power. This is to simulate
        // shooting from behind partial cover.
        if (impactsOrigin || intendedLineIndex !== 1 || tileDef.cover !== 100) {
          // Reduce power by terrain
          remainingPower -= tileDef.cover;
        }

        // Check the squads for characters who may have been hit
        let characterToHit = this.enemySquad.getAliveByXY(x, y);
        let characterSquad = null;
        if (characterToHit) {
          characterSquad = this.enemySquad;
        }
        else {
          characterToHit = this.playerSquad.getAliveByXY(x, y);
          if (characterToHit) {
            characterSquad = this.playerSquad;
          }
        }

        // Only living characters can be hit by fire
        if (characterToHit && characterToHit.alive) {
          // const roll = properties.rng.getPercentage();
          // TODO: remove this!!!
          const roll = 0;
          const chanceToHit = this.chanceForFireToHit(
            firingCharacter, projectileAccuracy, characterToHit);

          // console.log(`${x}x${y}: ${roll} <= ${chanceToHit}` +
          //   `: ${characterToHit.name}`);
          if (roll <= chanceToHit) {
            // Successful hits add xp for each relevant stat
            xpStatNames.forEach(name => firingCharacter.xp(name));

            this.hitCharacter(characterSquad, characterToHit, attackActions);

            // Hitting a character decreases power by a constant
            remainingPower -= properties.hitCharacterPowerLoss;
          }
        }
      }

      // Stop if we run out of power
      if (remainingPower <= 0) {
        console.log(`${x}x${y}: Round out of power at index:` +
          `${intendedLineIndex}`);
        roundTraveling = false;
      }

      // Stop if we run out of weapon range
      if (intendedLineIndex === projectileRange) {
        console.log(`${x}x${y}: Round out of range at index:` +
          `${intendedLineIndex}`);
        roundTraveling = false;
      }

      intendedLineIndex++;

      // Stop if we run out of target line
      if (intendedLineIndex >= intendedLine.length) {
        roundTraveling = false;
      }

      // If we've made it this far, add this tile to the actual projectile line
      // Only add it if we've not run out of power.
      if (remainingPower > 0) {
        actualProjectileLine.push({ x, y });
      }
    }

    return actualProjectileLine;
  }

  chanceForFireToHit(firingCharacter, projectileAccuracy, targetedCharacter) {
    const attackChance = firingCharacter.getWeaponAttackChance();
    const accuracy = projectileAccuracy / 100;
    const vulnerableChance = targetedCharacter.getWeaponVulnerableChance();
    const chance = (attackChance * accuracy * vulnerableChance) * 100;
    return chance;
  }

  hitCharacter(characterSquad, characterToHit, attackActions) {
    this.addHitAction(characterToHit, attackActions);

    characterSquad.hitMemberByNumber(characterToHit.number);
    if (!characterToHit.alive) {
      characterSquad.killMemberByNumber(characterToHit.number);
      this.addKillAction(characterToHit, attackActions);
    }
  }

  addHitAction(characterToHit, attackActions) {
    if (characterToHit.name in attackActions) {
      attackActions[characterToHit.name].hits =
        attackActions[characterToHit.name].hits + 1;
    }
    else {
      attackActions[characterToHit.name] = { hits: 1, killed: false };
    }
  }

  addKillAction(characterToHit, attackActions) {
    if (characterToHit.name in attackActions) {
      attackActions[characterToHit.name].killed = true;
    }
    else {
      attackActions[characterToHit.name] = { hits: 0, killed: true };
    }
  }

  smallArmsFireSequence(bursts, roundsPerBurst) {
    const roundsPattern =
      Array(roundsPerBurst).fill('-true-');
    const roundBreaksPattern =
      Array(properties.projectileRoundBreakFrames).fill('-false-');
    const roundsSequence = roundsPattern.join(roundBreaksPattern.join(''));

    const burstsPattern = Array(bursts).fill(roundsSequence);
    const burstBreaksPattern = '-false-'
      .repeat(properties.projectileBurstBreakFrames);
    const burstSequence = burstsPattern.join(burstBreaksPattern);

    const sequence = burstSequence
      .split('-')
      .filter(token => token)
      .map(token => token === 'true');

    // For the animation timing to look nice, there has to be a beat
    // at the begining and two beats at the end.
    const initialFalse = [false];
    sequence.push(false);
    sequence.push(false);
    initialFalse.push(...sequence);
    return initialFalse;
  }

  explosiveFireSequence(effectAreas, projectileSpeed) {
    const effectArea = effectAreas[0];
    const fireSequence = [];

    // Always animate the origin and muzzle flash
    fireSequence.push(effectArea[0]);
    fireSequence.push(effectArea[1]);

    // Animate every projectileSpeed-th frame
    for (let i = 2; i < effectArea.length; i += projectileSpeed) {
      fireSequence.push(effectArea[i]);
    }

    // Add an extra three frames at the end for the blast
    fireSequence.push(effectArea[effectArea.length - 1]);
    fireSequence.push(effectArea[effectArea.length - 1]);
    fireSequence.push(effectArea[effectArea.length - 1]);
    return fireSequence;
  }

  flameFireSequence(effectAreas) {
    const fireSequence = [];
    effectAreas.forEach((effectArea) => {
      fireSequence.push(effectArea);
      fireSequence.push(effectArea);
    });
    return fireSequence;
  }

  generateFireAnimation(weapon, effectAreas) {
    // TODO do something with this
    const fireAnimation = {
      weaponType: weapon.type,
      fireSequence: [],
      fireSequenceIndex: 0,
      fireGlyph: '.',
      fireFgColor: '#ffffff',
      fireBgColor: null,
      muzzleGlyph: '*',
      muzzleFgColor: '#ffae19'
    };

    // console.log('generateFireAnimation(weapon)');
    // console.log(weapon);
    switch (fireAnimation.weaponType) {
      case 'sidearm':
      case 'rifle':
      case 'automatic rifle':
      case 'machine gun':
        fireAnimation.fireSequence = this.smallArmsFireSequence(
          weapon.bursts, weapon.roundsPerBurst);
        break;
      case 'grenade': {
        const projectileSpeed = 2;
        fireAnimation.fireSequence = this.explosiveFireSequence(effectAreas, projectileSpeed);
        fireAnimation.fireGlyph = 'o';
        break; }
      case 'grenade launcher': {
        const projectileSpeed = 3;
        fireAnimation.fireSequence = this.explosiveFireSequence(effectAreas, projectileSpeed);
        fireAnimation.fireGlyph = 'o';
        break; }
      case 'rocket launcher': {
        const projectileSpeed = 4;
        fireAnimation.fireSequence = this.explosiveFireSequence(effectAreas, projectileSpeed);
        fireAnimation.fireGlyph = '◆';
        break; }
      case 'flame thrower':
        fireAnimation.fireSequence = this.flameFireSequence(effectAreas);
        fireAnimation.fireGlyph = '১';
        fireAnimation.fireFgColor = '#ffae19';
        fireAnimation.fireBgColor = '#ff755e';
        break;
    }
    return fireAnimation;
  }

}
