import properties from '../properties';
import utils from '../util/utils';

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

  effectMelee(attacker, defender) {
    const meleeActions = {};
    const roll = properties.rng.getPercentage( );
    const chanceToHit = this.chanceForMeleeToHit(attacker.stats, defender.stats);
    if (roll <= chanceToHit) {
      this.hitCharacter(characterSquad, defender, meleeActions);
    }
  }

  chanceForMeleeToHit(attackerStats, defenderStats) {
    const characterAttack = attackerStats.patience / 100;
    const targetVulnerability = (100 - defenderStats.presence) / 100;
    const chance = (characterAttack * targetVulnerability) * 100;
    return chance;
  }

  effectFire(firingCharacter, targetLine) {
    const { roundsPerBurst, bursts, power, accuracy } = firingCharacter.weapon;
    const roundsToSimulate = roundsPerBurst * bursts;
    const fireActions = {};
    const actualLines = [];
    for (let round = 0; round < roundsToSimulate; round++) {
      actualLines.push(this.simulateRound(
        round, power, accuracy,
        targetLine, firingCharacter.stats, fireActions));
    }
    return { actualLines, fireActions };
  }

  simulateRound(roundNumber, weaponPower, weaponAccuracy,
    targetLine, firingStats, fireActions) {
    let roundTraveling = true;
    let remainingPower = weaponPower;

    // Start one tile away from firing character
    let targetLineIndex = 2;

    // Give the actual proejctile line two free spaces
    const actualProjectileLine = [];
    actualProjectileLine.push(targetLine[0]);
    actualProjectileLine.push(targetLine[1]);

    while (roundTraveling) {
      console.log(targetLineIndex);
      console.log(targetLine);
      console.log(targetLine[targetLineIndex]);
      const { x, y } = targetLine[targetLineIndex];
      const tile = this.map[utils.keyFromXY(x, y)];
      const tileDef = localTileDictionary[tile.name];

      // Reduce power by terrain
      remainingPower -= tileDef.cover;

      // Check the squads for characters who may have been hit
      this.enemySquad.getByXY(x, y);
      let characterToHit = this.enemySquad.getByXY(x, y);
      let characterSquad = null;
      if (characterToHit) {
        characterSquad = this.enemySquad;
      }
      else {
        characterToHit = this.playerSquad.getByXY(x, y);
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
          firingStats, weaponAccuracy, characterToHit.stats, tileDef);

        // console.log(`${x}x${y}: ${roll} <= ${chanceToHit}` +
        //   `: ${characterToHit.name}`);
        if (roll <= chanceToHit) {
          this.hitCharacter(characterSquad, characterToHit, fireActions);

          // Hitting a character decreases power by a constant
          remainingPower -= properties.hitCharacterPowerLoss;
        }
      }

      // Stop if we run out of power
      if (remainingPower <= 0) {
        console.log(`${x}x${y}: Round stopped early at index:` +
          `${targetLineIndex}`);
        roundTraveling = false;
      }

      targetLineIndex++;

      // Stop if we run out of target line
      if (targetLineIndex >= targetLine.length) {
        roundTraveling = false;
      }

      // If we've made it this far, add this tile to the actual projectile line
      actualProjectileLine.push({ x, y });
    }

    return actualProjectileLine;
  }

  chanceForFireToHit(firingStats, weaponAccuracy, targetStats) {
    const characterAttack = firingStats.patience / 100;
    const accuracy = weaponAccuracy / 100;
    const targetVulnerability = (100 - targetStats.presence) / 100;
    const chance = (characterAttack * accuracy * targetVulnerability) * 100;
    return chance;
  }

  hitCharacter(characterSquad, characterToHit, fireActions) {
    this.addHitAction(characterToHit, fireActions);

    characterToHit.injuries++;
    if (characterToHit.injuries > properties.maxInjuries) {
      characterSquad.killMemberByNumber(characterToHit.number);

      this.addKillAction(characterToHit, fireActions);
    }
  }

  addHitAction(characterToHit, fireActions) {
    if (characterToHit.name in fireActions) {
      fireActions[characterToHit.name].hits =
        fireActions[characterToHit.name].hits + 1;
    }
    else {
      fireActions[characterToHit.name] = { hits: 1, killed: false };
    }
  }

  addKillAction(characterToHit, fireActions) {
    if (characterToHit.name in fireActions) {
      fireActions[characterToHit.name].killed = true;
    }
    else {
      fireActions[characterToHit.name] = { hits: 0, killed: true };
    }
  }
}
