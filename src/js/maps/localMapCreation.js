import properties from '../properties';
import utils from '../util/utils';

import mapProcedures from './mapProcedures';

function forest(percentDense, width, height) {
  const baseWeight = (width * height) * (1 / percentDense);
  const forestWeights = {
    'Low Grass': baseWeight,
    'Medium Tree 1': 1,
    'Medium Tree 2': 1,
    'Medium Tree 3': 1
  };
  let map = {};
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const name = properties.rng.getWeightedValue(forestWeights);
      const terrainHeight = 0;
      const secondPass = false;
      map[utils.keyFromXY(x, y)] = { name, x, y, terrainHeight, secondPass };
    }
  }

  // Add groves around trees
  mapProcedures.tilesWithNeighbors(map, 'Low Grass', 'Medium Tree 1', 1)
    .forEach(tile => tile.name = 'Bush 1');
  mapProcedures.tilesWithNeighbors(map, 'Low Grass', 'Medium Tree 2', 1)
    .forEach(tile => tile.name = 'Bush 2');
  mapProcedures.tilesWithNeighbors(map, 'Low Grass', 'Medium Tree 3', 1)
    .forEach(tile => tile.name = 'Bush 3');

  mapProcedures.tilesWithNeighbors(map, 'Low Grass', 'Bush 1', 3)
    .forEach(tile => tile.name = 'Tall Grass 1');
  mapProcedures.tilesWithNeighbors(map, 'Low Grass', 'Bush 2', 3)
    .forEach(tile => tile.name = 'Tall Grass 2');
  mapProcedures.tilesWithNeighbors(map, 'Low Grass', 'Bush 3', 3)
    .forEach(tile => tile.name = 'Tall Grass 1');

  mapProcedures.tilesWithNeighbors(map, 'Low Grass',
    ['Bush 1', 'Bush 2', 'Bush 3'], 1)
    .forEach(tile => tile.name = 'Medium Grass 2');
  mapProcedures.tilesWithNeighbors(map, 'Low Grass',
    ['Bush 1', 'Bush 2', 'Bush 3'], 2)
    .forEach(tile => tile.name = 'Medium Grass 1');

  mapProcedures.tilesWithNeighbors(map, 'Low Grass',
    ['Medium Grass 1', 'Medium Grass 2'], 2)
    .forEach(tile => tile.name = 'Medium Grass 1');
  return map;
}

function createLocalMap(seedTile, width, height) {
  return forest(50, width, height);
}

export default {
  createLocalMap
};
