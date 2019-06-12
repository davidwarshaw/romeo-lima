import properties from '../properties';
import utils from '../util/utils';

import localTileDictionary from '../maps/data/localTileDictionary.json';

export default class Vehicle {

  constructor(x, y, vehicleDefinition, map) {
    this.x = x;
    this.y = y;

    // Copy props to vehicle
    Object.entries(vehicleDefinition)
      .forEach(entry => this[entry[0]] = entry[1]);

    // Set height and width from tiles (must be rectangular)
    this.height = this.tiles.length;
    this.width = this.tiles[0].length;

    if (this.traversableTiles.length > 0) {
      this.placeInMap(map);
    }
  }

  placeInMap(map) {
    // Find a tile to place the vehicle on
    const startingTiles = Object.entries(map)
      .filter((entry) => {
        const point = utils.xyFromKey(entry[0]);
        const tile = entry[1];
        const tileType = localTileDictionary[tile.name];

        // If this tile isn't traversable for the vehicle, don't pick it
        if (!this.traversableTiles.contains(tileType)) {
          return false;
        }

        // Check if the other vehicle tiles will fit
        for (let col = 0; col < this.height; col++) {
          for (let row = 0; row < this.width; row++) {
            const vehicleTile = map[utils.keyFromXY(point.x + col, point.y + row)];

            // If the vehicleTile is not on the map, don't pick this tile
            if (!vehicleTile) {
              return false;
            }

            // If this tile isn't traversable for the vehicle, don't pick it
            if (!this.traversableTiles.contains(vehicleTile)) {
              return false;
            }
          }
        }

        // This tile will work
        return true;
      })

      // Randomize the order
      .map((entry) => {
        const point = utils.xyFromKey(entry[0]);
        const rand = properties.rng.getPercentage();
        return { x: point.x, y: point.y, rand };
      })
      .sort((l, r) => l.rand - r.rand)
      .slice(0, 1);

    // If there's a good starting place, then place the tile
    if (startingTiles.length > 0) {
      this.x = startingTiles.x;
      this.y = startingTiles.y;
    }
  }

  render(display, watchBrightness, map, xOffset, yOffset,
    playerSquadOverworldFov) {
    // Vehicle tiles are a rectangular 2D array
    for (let col = 0; col < this.width; col++) {
      for (let row = 0; row < this.height; row++) {
        const mapX = this.x + this.xOffset + col;
        const mapY = this.y + this.yOffset + row;
        const glyph = this.tiles[row][col];

        // Early exit if the tile is not visible
        const tileIsVisible = playerSquadOverworldFov.isVisible(mapX, mapY);
        if (!tileIsVisible) {
          continue;
        }
        if (glyph !== '') {
          display.draw(xOffset + mapX, yOffset + mapY, glyph, this.fgColor, this.bgColor);
        }
      }
    }
  }

}
