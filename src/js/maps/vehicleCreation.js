import properties from '../properties';
import utils from '../util/utils';

import vehicleDictionary from './data/vehicleDictionary';
import localTileDictionary from './data/localTileDictionary';

function tileNameForGlyph(glyph) {
  const tileName = Object.entries(localTileDictionary)
    .map(entry => ({ name: entry[0], glyph: entry[1].glyph}))
    .filter(tile => tile.glyph === glyph);
  if (tileName.length > 0) {
    return tileName[0].name;
  }
  return '';
}

function placeSampanInLocalMap(map, northSouth) {
  const vehicles = [];

  const sampanName = northSouth ? 'North-South Sampan' : 'East-West Sampan';
  const vehicleDef = vehicleDictionary[sampanName];

  const waterTiles = Object.entries(map)
    .filter(tile => tile[1].name === 'Deep River Water');

  let x;
  let y;
  let tilesFound;
  do {
    const tileIndex = Math.round(
      properties.rng.getUniform() * waterTiles.length);
    const tile = waterTiles[tileIndex];

    x = tile[1].x;
    y = tile[1].y;
    tilesFound = true;
    for (let row = y; row < y + vehicleDef.length; row++) {
      for (let col = x; col < x + vehicleDef[0].length; col++) {
        const mapTile = map[utils.keyFromXY(col, row)];
        if (!mapTile || (mapTile && mapTile.name !== 'Deep River Water')) {
          tilesFound = false;
          break;
        }
      }
      if (!tilesFound) {
        break;
      }
    }
  } while (!tilesFound);

  for (let row = y; row < y + vehicleDef.length; row++) {
    for (let col = x; col < x + vehicleDef[0].length; col++) {
      const vehicleRow = row - y;
      const vehicleCol = col - x;
      const vehicleGlyph = vehicleDef[vehicleRow][vehicleCol];
      const vehicleTileName = tileNameForGlyph(vehicleGlyph);

      const tile = {
        x: col,
        y: row,
        name: vehicleTileName,
      };
      vehicles[utils.keyFromXY(col, row)] = tile;
    }
  }

  return vehicles;
}

function createVehicles(map) {
  return placeSampanInLocalMap(map, true);
}

export default {
  createVehicles,
};
