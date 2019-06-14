import properties from '../properties';
import utils from '../util/utils';

import localTileDictionary from '../maps/data/localTileDictionary.json';

export default class Vehicle {

  constructor(x, y, vehicleDefinition, map) {
    this.x = x;
    this.y = y;

    this.actionActive = false;
    this.actionSequence = [];
    this.actionSequenceIndex = 0;

    // Copy props to vehicle
    Object.entries(vehicleDefinition)
      .forEach(entry => this[entry[0]] = entry[1]);

    // Set height and width from tiles (must be rectangular)
    this.height = this.tiles.length;
    this.width = this.tiles[0].length;

    console.log(this);

    if (this.traversableTiles.length > 0) {
      this.placeInMap(map);
    }

    this.turretRotations = [
      { x: 1, y: 0, glyph: "─" },
      { x: 1, y: -1, glyph: "/" },
      { x: 0, y: -1, glyph: "|" },
      { x: -1, y: -1, glyph: "\\" },
      { x: -1, y: 0, glyph: "─" },
      { x: -1, y: 1, glyph: "/" },
      { x: 0, y: 1, glyph: "|" },
      { x: 1, y: 1, glyph: "\\" }
    ];
    this.turretFacing = 2;
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

    // If the vehicle has a turret draw it at the correct offset for the facing
    if (this.hasTurret) {
      const turret = this.turretRotations[this.turretFacing];
      const mapX = this.x + turret.x;
      const mapY = this.y + turret.y;
      display.draw(xOffset + mapX, yOffset + mapY, turret.glyph, this.fgColor, this.bgColor);
    }
  }

}
