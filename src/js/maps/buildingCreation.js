import utils from '../util/utils';

import TileMath from '../util/TileMath';

import buildingDictionary from './data/buildingDictionary';
import localTileDictionary from './data/localTileDictionary';

const buildingWeights = {
  '11x11': 1,
  '7x11': 3,
  '11x7': 3,
  '9x7': 5,
  '7x9': 5,
  '5x5': 4,
  '3x3': 2
};
const hutTiles = [
  'Hut Floor', 'Hut Door', 'Hut Wall', 'Hut Window', 'Hut Furniture'];

function tileNameForGlyph(glyph) {
  const tileName = Object.entries(localTileDictionary)
    .map(entry => ({ name: entry[0], glyph: entry[1].glyph}))
    .filter(tile => tile.glyph === glyph && tile.name.startsWith('Hut'));
  if (tileName.length > 0) {
    return tileName[0].name;
  }
  return '';
}


function placePathsInLocalMap(map) {
  const doors = Object.entries(map)
    .filter(tile => tile[1].name === 'Hut Door');

  const pathPoints = {};
  doors.forEach(from => {
    doors.forEach(to => {
      TileMath.tileLine(from[1].x, from[1].y, to[1].x, to[1].y)
        .forEach(point => pathPoints[utils.keyFromXY(point.x, point.y)] = true);
    });
  });

  Object.entries(map)
    .forEach(tile => {
      const { x, y, name } = tile[1];
      if (pathPoints[utils.keyFromXY(x, y)] && !hutTiles.includes(name)) {
        tile[1].name = 'Path';
      }
    });
}

function placeBuildingInLocalMap(map, building) {
  const {
    x, y,
    stringDim,
    buildingWidth, buildingHeight,
    frontToSouth
  } = building;

  const buildingDef = buildingDictionary[stringDim];

  for (let row = y; row < y + buildingHeight; row++) {
    for (let col = x; col < x + buildingWidth; col++) {
      const buildingRow = frontToSouth ?
        row - y :
        (buildingHeight - 1) - (row - y);
      const buildingCol = col - x;
      const buildingGlyph = buildingDef[buildingRow][buildingCol];
      const buildingTileName = tileNameForGlyph(buildingGlyph);

      map[utils.keyFromXY(col, row)].name = buildingTileName;
    }
  }
}

export default {
  buildingWeights,
  placePathsInLocalMap,
  placeBuildingInLocalMap
};
