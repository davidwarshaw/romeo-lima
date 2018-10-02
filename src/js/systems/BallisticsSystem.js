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

  effectFire(firingCharacter, targetLine) {
    const { roundsPerBurst, bursts, power, accuracy } = firingCharacter.weapon;
    const roundsToSimulate = roundsPerBurst * bursts;
    const fireActions = {};
    for (let round = 0; round < roundsToSimulate; round++) {
      this.simulateRound(
        round, power, accuracy,
        targetLine, firingCharacter.stats, fireActions);
    }
    return fireActions;
  }

  simulateRound(roundNumber, weaponPower, weaponAccuracy,
    targetLine, firingStats, fireActions) {
    let roundTraveling = true;
    let remainingPower = weaponPower;

    // Start one tile away from firing character
    let targetLineIndex = 2;
    while (roundTraveling) {
      const { x, y } = targetLine[targetLineIndex];
      const tile = this.map[utils.keyFromXY(x, y)];
      const tileDef = localTileDictionary[tile.name];

      // Check to see if the round is stopped by terrain
      const roll = properties.rng.getPercentage();
      const chanceToBeStopped = this
        .chanceToBeStoppedByTerrain(firingStats, weaponAccuracy, tileDef);
      if (roll <= chanceToBeStopped) {
        remainingPower--;

        // console.log(`${x}x${y}: ${roll} <= ${chanceToBeStopped}` +
        //   `: power reduced to ${remainingPower}`);
      }

      // Check the squads for characters who may have been hit
      const characterInTile = this.enemySquad.getByXY(x, y) ||
        this.playerSquad.getByXY(x, y);

      // Only living characters can be hit by fire
      if (characterInTile && characterInTile.alive) {
        const roll = properties.rng.getPercentage();
        const chanceToHit = this.chanceToHitCharacter(
          firingStats, weaponAccuracy, characterInTile.stats, tileDef);

        // console.log(`${x}x${y}: ${roll} <= ${chanceToHit}` +
        //   `: ${characterInTile.name}`);
        if (roll <= chanceToHit) {
          this.hitCharacter(characterInTile, fireActions);

          // Hitting a character decreases power
          remainingPower--;
        }
      }

      // Stop if we run out of power
      if (remainingPower === 0) {
        roundTraveling = false;
      }

      targetLineIndex++;

      // Stop if we run out of target line
      if (targetLineIndex >= targetLine.length) {
        roundTraveling = false;
      }
    }

    return fireActions;
  }

  chanceToBeStoppedByTerrain(firingStats, weaponAccuracy, tileDef) {
    const impatience = (100 - firingStats.patience) / 100;
    const weaponInaccuracy = (100 - weaponAccuracy) / 100;
    const tileBlockedness = (tileDef.concealment) / 100;
    const chance = (impatience * weaponInaccuracy * tileBlockedness) * 100;
    return chance;
  }

  chanceToHitCharacter(firingStats, weaponAccuracy, targetStats) {
    const characterAttack = firingStats.patience / 100;
    const accuracy = weaponAccuracy / 100;
    const targetVulnerability = (100 - targetStats.presence) / 100;
    const chance = (characterAttack * accuracy * targetVulnerability) * 100;
    return chance;
  }

  hitCharacter(characterToHit, fireActions) {
    this.addHitAction(characterToHit, fireActions);

    characterToHit.injuries++;
    if (characterToHit.injuries > properties.maxInjuries) {
      characterToHit.alive = false;

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
