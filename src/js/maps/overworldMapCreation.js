import ROT from 'rot-js';
import properties from '../properties';
import utils from '../util/utils';

import mapProcedures from './mapProcedures';

function createBaseOverworldMap(width, height) {
  let map = {};

  const widthScale = 0.05;
  const heightScale = 0.15;
  const noise = new ROT.Noise.Simplex(100);

  let highestTerrain = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const slopeToSea = 10 * ((width - x) / width);
      const positiveSimplex = noise.get(x * widthScale, y * heightScale) + 1;
      const terrainHeight = ~~(positiveSimplex * slopeToSea);
      highestTerrain = Math.max(terrainHeight, highestTerrain);
      let name;
      switch (terrainHeight) {
        case 0: name = 'Shallow Water';
          break;
        case 1: name = 'Low Grasses';
          break;
        case 2: name = 'Low Grasses';
          break;
        case 3: name = 'Low Grasses';
          break;
        case 4: name = 'Low Grasses';
          break;
        case 5: name = 'Low Grasses';
          break;
        case 6: name = 'Low Mountains';
          break;
        case 7: name = 'Low Mountains';
          break;
        case 8: name = 'Rocky Mountains';
          break;
        case 9: name = 'Steep Mountains';
          break;
        case 10: name = 'Steep Mountains';
          break;
        case 11: name = 'Steep Mountains';
          break;
        case 12: name = 'Steep Mountains';
          break;
        case 13: name = 'Steep Mountains';
          break;
        case 14: name = 'Mountain Tops';
          break;
        case 15: name = 'Mountain Tops';
          break;
        default:
          name = 'Mountain Tops';
      }
      const secondPass = false;
      map[utils.keyFromXY(x, y)] = { name, x, y, terrainHeight, secondPass };
    }
  }

  return { map, highestTerrain };
}

function assignSea(map, initialX, initialY) {

  const nameToFind = map[utils.keyFromXY(initialX, initialY)].name;
  mapProcedures.searchAndAssign(
    map, initialX, initialY, nameToFind, 'Sea Water');
}

function assignRivers(map, highestTerrain) {
  const riverSourceName = 'Mountain Spring';
  const riverName = 'River Water';
  const riverTerminalName = 'Sea Water';

  // Find highest points and assign mountain springs
  Object.values(map)
    .filter(tile => tile.terrainHeight === highestTerrain)
    .forEach((highestTile) => {
      const riverSourceNeighbors =
        mapProcedures.neighborCount(
          map, highestTile.x, highestTile.y, riverSourceName);
      if (riverSourceNeighbors === 0) {
        highestTile.name = riverSourceName;
        highestTile.secondPass = true;
      }
    });

  // Follow mountain springs down to the sea to make rivers and deltas
  Object.values(map)
    .filter(tile => tile.name === riverSourceName)
    .forEach((springTile) => {

      let currentTile = springTile;

      let riverMeetsSea = false;
      while (!riverMeetsSea) {
        const { x, y, terrainHeight } = currentTile;

        // Collect and go through neighbors descending and find the lowest tile
        const neighbors = [
          map[utils.keyFromXY(x + 1, y - 1)],
          map[utils.keyFromXY(x + 1, y)],
          map[utils.keyFromXY(x + 1, y + 1)]
        ]
          .filter(neighbor => neighbor)

          // Next tile should be no more than 2 above current tile
          .filter(neighbor => neighbor.terrainHeight <= terrainHeight + 2)
          .sort((l, r) => l.terrainHeight - r.terrainHeight);

        let nextTile = neighbors[0];

        // If there's not a next tile, or the next tile is the sea, then stop
        if (!nextTile || nextTile.name === riverTerminalName) {
          riverMeetsSea = true;
        }
        else {
          currentTile = nextTile;

          // Make the current tile to be a river
          currentTile.name = riverName;
        }
      }
    });

  return map;

}

function assignBuildings(map) {
  Object.values(map)

    // Consider only sites on mostly low Grasses, next to some water source
    .filter(tile =>
      tile.name === 'Low Grasses' &&
      mapProcedures.neighborCount(map, tile.x, tile.y, ['Low Grasses']) >= 5 &&
      mapProcedures.neighborCount(map, tile.x, tile.y,
        ['Shallow Water', 'River Water', 'Sand Beach']) >= 1
    )

    // Append a random number
    .map(tile => ({
      x: tile.x, y: tile.y, randomOrder: properties.rng.getUniform()
    }))
    .sort((l, r) => l.randomOrder - r.randomOrder)

    // Keep 5 sites
    .slice(0, 10)
    .forEach(site =>
      map[utils.keyFromXY(site.x, site.y)].name = 'Small Village');

  mapProcedures.tilesWithNeighbors(map, 'Low Grasses', 'Small Village', 1)
    .forEach(tile => tile.name = 'Village Field');
  mapProcedures.tilesWithNeighbors(map, 'Low Grasses', 'Village Field', 1)
    .forEach(tile => tile.name = 'Village Field');

  mapProcedures.tilesWithNeighbors(map, 'Village Field',
    ['Shallow Water', 'River Water'], 1)
    .forEach(tile => tile.name = 'Rice Paddy');
  mapProcedures.tilesWithNeighbors(map, 'Village Field', 'Rice Paddy', 2)
    .forEach(tile => tile.name = 'Rice Paddy');
}

function assignRoads(map, width, height) {
  const roadMean = width * (3 / 4);

  let roadX = Math.round(properties.rng.getNormal(roadMean, 15));
  let roadY = 0;
  let roadName = 'North-South Highway';
  let roadComplete = false;
  while (!roadComplete) {
    map[utils.keyFromXY(roadX, roadY)].name = roadName;

    const candidates = [
      map[utils.keyFromXY(roadX - 1, roadY)],
      map[utils.keyFromXY(roadX + 1, roadY)],
      map[utils.keyFromXY(roadX, roadY + 1)]
    ]
      .filter(tile => tile)
      .filter(tile =>
        [
          'Low Grasses', 'Medium Grasses',
          'River Water', 'River Rapids'
        ].includes(tile.name))

      // First, take tiles that go south
      .sort((l, r) => r.y - l.y)

      // Then, take tiles that go towards the road X mean
      .sort((l, r) => Math.abs(l.x - roadMean) - Math.abs(r.x - roadMean))

      // Last, take tiles that go in the same direction
      .sort((l, r) => Math.abs(l.x - roadX) - Math.abs(r.x - roadX));

    const candidate = candidates[0];

    // If we're at the height of the map or we can't make a road, were done
    if (roadY === height - 1) {
      roadComplete = true;
    }
    else if (!candidate) {
      roadComplete = true;
      const prevRoad = map[utils.keyFromXY(roadX, roadY)];
      prevRoad.name = 'Water Tower';
    }
    else {
      const nextRoadX = candidates[0].x;
      const nextRoadY = candidates[0].y;

      const prevRoad = map[utils.keyFromXY(roadX, roadY)];
      const prevWest = map[utils.keyFromXY(roadX + 1, roadY)];
      const prevRoadWest = prevWest.name.includes('Highway');
      if (roadY === nextRoadY) {
        if (prevRoad.name === 'North-South Highway') {
          prevRoad.name = roadX < nextRoadX ?
            'East-North Highway' : 'West-North Highway';
        }
        roadName = 'East-West Highway';
      }
      else {
        if (prevRoad.name === 'East-West Highway') {
          prevRoad.name = prevRoadWest ?
            'West-South Highway' : 'East-South Highway';
        }
        roadName = 'North-South Highway';
      }
      roadX = nextRoadX;
      roadY = nextRoadY;
    }
  }
}

function developLandscape(map) {
  // Add beach
  mapProcedures.tilesWithNeighbors(map, 'Low Grasses', 'Sea Water', 1)
    .forEach(tile => tile.name = 'Sand Beach');
  mapProcedures.tilesWithNeighbors(map, 'Low Grasses', 'Sand Beach', 4)
    .forEach(tile => tile.name = 'Sand Beach');

  // Add tall Grasses
  mapProcedures.tilesWithNeighbors(map, 'Low Grasses', 'Shallow Water', 1)
    .forEach(tile => tile.name = 'Tall Grasses');
  mapProcedures.tilesWithNeighbors(map, 'Low Grasses', 'Tall Grasses', 3)
    .forEach(tile => tile.name = 'Tall Grasses');

  // Add medium Grasses
  mapProcedures.tilesWithNeighbors(map, 'Low Grasses', 'Tall Grasses', 1)
    .forEach(tile => tile.name = 'Medium Grasses');
  mapProcedures.tilesWithNeighbors(map, 'Low Grasses', 'Medium Grasses', 2)
    .forEach(tile => tile.name = 'Medium Grasses');
  mapProcedures.tilesWithNeighbors(map, 'Low Grasses', 'River Water', 4)
    .forEach(tile => tile.name = 'Medium Grasses');

  // Add large palm trees
  mapProcedures.tilesWithNeighbors(map, 'Low Grasses', 'River Water', 2)
    .forEach(tile => tile.name = 'Large Palm Trees');
  mapProcedures.tilesWithNeighbors(map, 'Low Grasses', 'Sand Beach', 1)
    .forEach(tile => tile.name = 'Large Palm Trees');
  mapProcedures.tilesWithNeighbors(map, 'Low Grasses', 'Palm Trees', 1)
    .forEach(tile => tile.name = 'Large Palm Trees');

  // Add regular palm trees
  mapProcedures.tilesWithNeighbors(map, 'Low Grasses', 'Large Palm Trees', 1)
    .forEach(tile => tile.name = 'Palm Trees');
  mapProcedures.tilesWithNeighbors(map, 'Low Grasses',
    ['Palm Trees', 'Medium Grasses'], 1)
    .forEach(tile => tile.name = 'Palm Trees');
  mapProcedures.tilesWithNeighbors(map, 'Medium Grasses',
    ['Large Palm Trees', 'Tall Grasses'], 3)
    .forEach(tile => tile.name = 'Palm Trees');

  // Add rapids
  mapProcedures.tilesWithNeighbors(map, 'River Water',
    ['Low Mountains', 'Rocky Mountains', 'Steep Mountains'], 3)
    .forEach(tile => tile.name = 'River Rapids');

  // Add water falls
  mapProcedures.tilesWithNeighbors(map, 'River Rapids',
    ['Rocky Mountains', 'Steep Mountains'], 4)
    .forEach(tile => tile.name = 'River Falls');

  // Erode beaches
  mapProcedures.tilesWithNeighbors(map, 'Sand Beach',
    ['River Water', 'Sea Water'], 4)
    .forEach(tile => tile.name = 'River Water');
}

export default {
  createBaseOverworldMap,
  assignSea,
  assignRivers,
  assignBuildings,
  assignRoads,
  developLandscape
};
