import properties from '../properties';
import utils from '../util/utils';
import TileMath from '../util/TileMath';
import Cache from '../util/Cache';

export default class OverworldFov {
  constructor(map, detachments) {
    this.map = map;

    // detachments should be an array
    this.detachments = Array.isArray(detachments) ? detachments : [detachments];
    this.cache = new Cache();

    this.recalculate();
  }

  isVisible(x, y) {
    const tileIsVisible = !!this.visibleMap[utils.keyFromXY(x, y)];
    return tileIsVisible;
  }

  recalculate() {
    this.visibleMap = [];

    // Left and right map edges
    for (let x = 0; x < properties.overworldWidth; x++) {
      this.processSightLines(x, 0);
      this.processSightLines(x, properties.overworldHeight - 1);
    }

    // Top and bottom map edges
    for (let y = 0; y < properties.overworldHeight; y++) {
      this.processSightLines(0, y);
      this.processSightLines(properties.overworldWidth - 1, y);
    }
  }

  processSightLines(x, y) {
    this.detachments
      .map(detachment => TileMath.tileLine(detachment.x, detachment.y, x, y))

      // Only if the tile line has points
      .filter(tileLine => tileLine.length > 0)
      .forEach(tileLine => {
        // For every tile in the line, if the
        let maxHighSoFar = 0;
        let uphillStarted = false;
        let lastHeight = null;
        for (let tileIndex = 0; tileIndex < tileLine.length; tileIndex++) {
          const { x, y } = tileLine[tileIndex];
          const tile = this.map[utils.keyFromXY(x, y)];

          if (lastHeight && tile.terrainHeight > lastHeight) {
            uphillStarted = true;
          }

          // Tiles are visible if they're the same height or higher than
          // the highest tile seen so far. The first two tiles don't
          // are always visible
          if (tileIndex < 2 || tile.terrainHeight >= maxHighSoFar) {
            // Set the tile as visible
            this.visibleMap[utils.keyFromXY(x, y)] = true;
          }

          if (uphillStarted) {
            maxHighSoFar = Math.max(maxHighSoFar, tile.terrainHeight);
          }

          lastHeight = tile.terrainHeight;
        }
      });
  }
}
