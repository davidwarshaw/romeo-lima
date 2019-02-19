import properties from '../properties';
import utils from '../util/utils';

function neighborCount(map, x, y, neighbors) {
  const neighborsToCheck = Array.isArray(neighbors) ? neighbors : [neighbors];
  return [
    // y - 1
    map[utils.keyFromXY(x - 1, y - 1)],
    map[utils.keyFromXY(x, y - 1)],
    map[utils.keyFromXY(x + 1, y - 1)],

    // y
    map[utils.keyFromXY(x - 1, y)],
    map[utils.keyFromXY(x + 1, y)],

    // y + 1
    map[utils.keyFromXY(x - 1, y + 1)],
    map[utils.keyFromXY(x, y + 1)],
    map[utils.keyFromXY(x + 1, y + 1)]
  ]
    .filter(tile => tile)
    .map(tile => neighborsToCheck.includes(tile.name))
    .filter(matchingTile => matchingTile)
    .length;
}

function tilesWithNeighbors(map, target, neighbors, count) {
  const targetsToCheck = Array.isArray(target) ? target : [target];
  return Object.values(map)
    .filter(tile => targetsToCheck.includes(tile.name))
    .filter(tile => neighborCount(map, tile.x, tile.y, neighbors) >= count);
}

function tilesByChance(map, target, chance) {
  const targetsToCheck = Array.isArray(target) ? target : [target];
  return Object.values(map)
    .filter(tile => targetsToCheck.includes(tile.name))
    .filter(() => properties.rng.getPercentage() <= chance);
}

function searchAndAssign(map, x, y, nameToFind, nameToAssign) {
  if(map[utils.keyFromXY(x, y)]) {
    if(map[utils.keyFromXY(x, y)].name !== nameToFind ||
        map[utils.keyFromXY(x, y)].secondPass) {
      return;
    }
    map[utils.keyFromXY(x, y)].secondPass = true;
    map[utils.keyFromXY(x, y)].name = nameToAssign;
    searchAndAssign(map, x, y + 1, nameToFind, nameToAssign);
    searchAndAssign(map, x, y - 1, nameToFind, nameToAssign);
    searchAndAssign(map, x - 1, y, nameToFind, nameToAssign);
    searchAndAssign(map, x + 1, y, nameToFind, nameToAssign);
  }
}

export default {
  neighborCount,
  tilesWithNeighbors,
  tilesByChance,
  searchAndAssign
};
