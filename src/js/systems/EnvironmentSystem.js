import properties from '../properties';
import utils from '../util/utils';

import localTileDictionary from '../maps/data/localTileDictionary.json';

export default class EnvironmentSystem {
  constructor(map,
    playerSquad, playerSquadLocalFov,
    enemySquad, enemySquadLocalFov) {
    this.map = map;

    this.playerSquad = playerSquad;
    this.playerSquadLocalFov = playerSquadLocalFov;

    this.enemySquad = enemySquad;
    this.enemySquadLocalFov = enemySquadLocalFov;

    this.smoke = {};
    this.fire = {};
    Object.entries(this.map)
      .forEach((entry) => {
        const key = entry[0];
        this.smoke[key] = {
          amount: 0,
          distributed: null, distributeOrder: null
        };
        this.fire[key] = {
          amount: 0, onFire: false, burnedDown: false,
          distributed: null, distributeOrder: null
        };
      });

    this.fireConsumption = 5;
    this.catchFireThreshold = 120;
    this.baselineFireFuel = 25;
    this.fireSmokeAmount = 10;

    this.fullSmokeColor = '#ffffff';
    this.fullFireFgColor = '#ffae19';
    this.fullFireBgColor = '#ff755e';

    this.burnedGroundTileName = 'Burned Ground';
    this.burnedStructureTileName = 'Burned Structure';
    this.structureTileNames = ['Hut Furniture', 'Hut Door', 'Hut Window', 'Hut Wall'];

    this.windSpeed = 10;
    this.windDirection = 'North';
  }

  addSmoke(point, additionalAmount) {
    const key = utils.keyFromXY(point.x, point.y);
    let existingAmount = 0;
    if (key in this.smoke) {
      existingAmount = this.smoke[key].amount;
    }

    // console.log('addSmoke');
    // console.log(`this.smoke[key]: ${JSON.stringify(this.smoke[key])}`);
    this.smoke[key].amount = existingAmount + additionalAmount;
    if (this.smoke[key].amount < 10) {
      // The smoke has cleared
      this.smoke[key].amount = 0;
    }
  }

  addFire(point, amount) {
    const fireTile = this.fire[utils.keyFromXY(point.x, point.y)];
    if (!fireTile) {
      return;
    }

    // If the tile is already on fire, don't add more
    if (fireTile.onFire) {
      return;
    }

    fireTile.onFire = true;
    fireTile.amount = amount;

    // console.log('addFire');
    // console.log(`fireTile: ${JSON.stringify(fireTile)}`);
  }

  subtractFire(point, amount) {
    const key = utils.keyFromXY(point.x, point.y);
    const fireTile = this.fire[key];
    if (!fireTile) {
      return;
    }

    // If the tile is not on fire, or already burned down, don't subtract fire
    if (!fireTile.onFire || fireTile.burnedDown) {
      return;
    }

    fireTile.amount = fireTile.amount - amount;

    // If the fire is extinguished, then change the tile type to the burned down tile
    if (fireTile.amount <= 0) {
      fireTile.amount = 0;
      fireTile.onFire = false;
      fireTile.burnedDown = true;
      this.map[key].name = this.structureTileNames.includes(this.map[key].name) ?
        this.burnedStructureTileName :
        this.burnedGroundTileName;
    }
  }

  randomizeDistributionOrder(field) {
    // Reset the distributed flag and randomize the ordering for distributing
    Object.entries(field).forEach(entry => {
      entry[1].distributed = false;
      entry[1].distributeOrder = properties.rng.getPercentage();
    });
  }

  update() {
    this.randomizeDistributionOrder(this.smoke);
    this.randomizeDistributionOrder(this.fire);
    this.updateSmoke();
    this.updateFire();
  }

  updateSmoke() {

    // For each tile with smoke, distribute smoke to its neighbors by averaging their smoke amounts
    const deltas = [];
    Object.entries(this.smoke)

      // Traverse the smoke tiles in a random order to minimize artifacts
      .sort((l, r) => l[1].distributeOrder - r[1].distributeOrder)

      // Only distribute from tiles with smoke
      .filter(entry => entry[1].amount > 0)
      .forEach((entry) => {
        const key = entry[0];
        const point = utils.xyFromKey(key);
        let neighborsSum = 0;
        let neighborsCount = 0;
        const neighbors = [];
        for (let col = point.x - 1; col <= point.x + 1; col++) {
          for (let row = point.y - 1; row <= point.y + 1; row++) {

            // If the tile is not on the map, don't distribute smoke
            const tile = this.map[utils.keyFromXY(col, row)];
            if (!tile) {
              continue;
            }

            // If the tile is already distributed, don't distribute
            const neighbor = this.smoke[utils.keyFromXY(col, row)];
            if (neighbor.distributed) {
              continue;
            }

            // If the tile conceals 100%, don't distribute
            const tileType = localTileDictionary[tile.name];
            if (tileType.concealment === 100) {
              continue;
            }

            neighborsSum += neighbor.amount;
            neighborsCount += 1;
            neighbor.distributed = true;
            neighbors.push({ x: col, y: row, amount: neighbor.amount });
          }
        }
        neighbors.forEach((neighbor) => {
          const smokeAmount = Math.round(neighborsSum / neighborsCount);
          const smokeDelta = smokeAmount - neighbor.amount;

          // console.log(`neighborsSum: ${neighborsSum} neighborsCount: ${neighborsCount}`);
          // console.log(`smokeAmount: ${smokeAmount} smokeDelta: ${smokeDelta}`);
          deltas.push({ x: neighbor.x, y: neighbor.y, d: smokeDelta });
        });
      });
    console.log('updateSmoke: deltas');
    console.log(deltas);
    deltas.forEach(delta => this.addSmoke(delta, delta.d));
  }

  updateFire() {
    // Get all tiles adjacent to fire tiles
    const neighborKeysNotOnFire = [];
    Object.entries(this.fire)

      // Traverse the fire tiles in a random order to minimize artifacts
      .sort((l, r) => l[1].distributeOrder - r[1].distributeOrder)

      // Only tile with fire, but not tiles that are burned down
      .filter(entry => entry[1].amount > 0 && !entry[1].burnedDown)
      .forEach((entry) => {
        const key = entry[0];
        const point = utils.xyFromKey(key);
        for (let col = point.x - 1; col <= point.x + 1; col++) {
          for (let row = point.y - 1; row <= point.y + 1; row++) {

            // If the tile is not on the map, don't distribute fire
            const tile = this.map[utils.keyFromXY(col, row)];
            if (!tile) {
              continue;
            }

            // If the tile already has fire or is burned down, don't distribute fire
            const neighborFire = this.fire[utils.keyFromXY(col, row)];
            if (neighborFire.onFire || neighborFire.burnedDown) {
              continue;
            }

            neighborKeysNotOnFire.push(utils.keyFromXY(col, row));
          }
        }
      });

    console.log(`neighborKeysNotOnFire: ${neighborKeysNotOnFire.length}`);

    // Tiles not on fire catch fire if they're adjacent to 3 tiles with fire greater
    // than the threshold.
    neighborKeysNotOnFire.forEach((neighborKey) => {

      // If the tile is already distributed, don't distribute
      const neighbor = this.fire[neighborKey];
      if (neighbor.distributed) {
        return;
      }

      const point = utils.xyFromKey(neighborKey);
      const neighborSum = this.sumNeighbors(point.x, point.y, this.fire);
      if (neighborSum >= this.catchFireThreshold) {

        // Fires begin with amount equal to the concealment of the tile
        const tile = this.map[utils.keyFromXY(point.x, point.y)];
        const tileType = localTileDictionary[tile.name];
        const fireAmount = this.baselineFireFuel + (2 * tileType.concealment);
        this.addFire(point, fireAmount);

        // console.log(`neighborSum: ${neighborSum} fireAmount: ${fireAmount}`);
      }
    });

    // Decrease each fire by the consumption rate and add smoke
    console.log('updateFire: fireConsumption');
    Object.entries(this.fire)
      .filter(entry => entry[1].onFire)
      .forEach((entry) => {
        const point = utils.xyFromKey(entry[0]);
        this.addSmoke(point, this.fireSmokeAmount);
        this.subtractFire(point, this.fireConsumption);
      });
  }

  sumNeighbors(x, y, field) {
    return [

      // y - 1
      field[utils.keyFromXY(x - 1, y - 1)],
      field[utils.keyFromXY(x, y - 1)],
      field[utils.keyFromXY(x + 1, y - 1)],

      // y
      field[utils.keyFromXY(x - 1, y)],
      field[utils.keyFromXY(x + 1, y)],

      // y + 1
      field[utils.keyFromXY(x - 1, y + 1)],
      field[utils.keyFromXY(x, y + 1)],
      field[utils.keyFromXY(x + 1, y + 1)]
    ]
      .filter(tile => tile)
      .map(tile => tile.amount)
      .reduce((agg, e) => agg + e);
  }
}
