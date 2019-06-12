import utils from '../util/utils';

export default class Vehicle {

  constructor(x, y, vehicleDefinition) {
    this.x = x;
    this.y = y;
    // Copy props to vehicle
    Object.entries(vehicleDefinition)
      .forEach(entry => this[entry[0]] = entry[1]);
  }

  render(display, watchBrightness, map, xOffset, yOffset,
    playerSquadOverworldFov) {
    // Vehicle tiles are a rectangular 2D array
    for (let col = 0; col < this.tiles.length; col++) {
      for (let row = 0; row < this.tiles[0].length; row++) {
        const mapX = this.x + this.xOffset + col;
        const mapY = this.y + this.yOffset + row;
        const glyph = this.tiles[row][col];
        // Early exit if the tile is not visible
        const tileIsVisible = playerSquadOverworldFov.isVisible(mapX, mapY);
        if (!tileIsVisible) {
          continue;
        }
        display.draw(xOffset + mapX, yOffset + mapY, glyph, this.fgColor, this.bgColor);
      }
    }
  }

}
