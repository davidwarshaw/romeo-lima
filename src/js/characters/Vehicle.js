import properties from '../properties';
import utils from '../util/utils';

import Character from './Character';

export default class Vehicle extends Character {

  constructor(number, definition, weapon, map) {
    super(number, definition, weapon);

    // Copy props to vehicle
    Object.entries(definition)
      .forEach(entry => this[entry[0]] = entry[1]);

    // Set height and width from tiles (must be rectangular)
    this.height = this.tiles.alive.length;
    this.width = this.tiles.alive[0].length;

    if (this.traversableTiles.length > 0) {
      this.placeInMap(map);
    }

    this.enhanceStats();
  }

  enhanceStats() {
    // Vehicles have max resilience and high luck
    this.stats['resilience'].max = this.statMax;
    this.stats['resilience'].value = this.statMax;
    this.stats['luck'].max = 2 * this.statMax;
    this.stats['luck'].value = 2 * this.statMax;
  }

  placeInMap(map) {
    // Find a tile to place the vehicle on
    const startingTiles = Object.entries(map)
      .filter((entry) => {
        const point = utils.xyFromKey(entry[0]);
        const tile = entry[1];

        // If this tile isn't traversable for the vehicle, don't pick it
        if (!this.traversableTiles.includes(tile.name)) {
          return false;
        }

        // Check if the other vehicle tiles will fit
        for (let col = 0; col < this.height; col++) {
          for (let row = 0; row < this.width; row++) {
            const mapX = point.x + this.xOffset + col;
            const mapY = point.y + this.yOffset + row;
            const vehicleTile = map[utils.keyFromXY(mapX, mapY)];

            // If the vehicleTile is not on the map, don't pick this tile
            if (!vehicleTile) {
              return false;
            }

            // If this tile isn't traversable for the vehicle, don't pick it
            if (!this.traversableTiles.includes(vehicleTile.name)) {
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
      this.x = startingTiles[0].x;
      this.y = startingTiles[0].y;
    }
  }

  animationFrame() {

  }

  isAtXY(x, y) {
    // Check if the other vehicle tiles will fit
    for (let col = 0; col < this.height; col++) {
      for (let row = 0; row < this.width; row++) {
        if (x === this.x + this.xOffset + col && y === this.y + this.yOffset + row) {
          return true;
        }
      }
    }
    return false;
  }

  render(display, watchBrightness, map, xOffset, yOffset,
    playerSquadOverworldFov) {
    // Vehicle tiles are a rectangular 2D array
    for (let col = 0; col < this.width; col++) {
      for (let row = 0; row < this.height; row++) {
        const mapX = this.x + this.xOffset + col;
        const mapY = this.y + this.yOffset + row;
        const glyph = this.alive ? this.tiles.alive[row][col] : this.tiles.dead[row][col];

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
