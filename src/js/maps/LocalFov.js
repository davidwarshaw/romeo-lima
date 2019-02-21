import properties from '../properties';
import utils from '../util/utils';
import TileMath from '../util/TileMath';
import Cache from '../util/Cache';

import localTileDictionary from '../maps/data/localTileDictionary.json';

export default class LocalFov {
  constructor(map, members, threshold, field) {
    this.map = map;
    this.members = members;
    this.threshold = threshold;
    this.field = field || 'concealment';
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
    for (let x = 0; x < properties.localWidth; x++) {
      this.processSightLines(x, 0);
      this.processSightLines(x, properties.localHeight - 1);
    }

    // Top and bottom map edges
    for (let y = 0; y < properties.localHeight; y++) {
      this.processSightLines(0, y);
      this.processSightLines(properties.localWidth - 1, y);
    }
  }

  processSightLines(x, y) {
    this.members
      .map(member => TileMath.tileLine(member.x, member.y, x, y))

      // Only if the tile line has points
      .filter(tileLine => tileLine.length > 0)
      .forEach(tileLine => {
        let tileIndex = 0;
        let totalValue = 0;
        let stillVisible = true;
        while (stillVisible) {
          const { x, y } = tileLine[tileIndex];
          const tile = this.map[utils.keyFromXY(x, y)];
          const tileDef = localTileDictionary[tile.name];

          // Set the tile as visible
          this.visibleMap[utils.keyFromXY(x, y)] = true;

          // Accumulate sight line blockage until 100% blocked
          // The first two tiles only contribute to sight blockage
          // if they're 100% concealment
          if ((tileIndex < 2 && tileDef[this.field] === this.threshold) ||
              tileIndex >= 2) {
            totalValue += tileDef[this.field];
            if (totalValue >= this.threshold) {
              stillVisible = false;
            }
          }

          // If we run out of tile line, we can't see anymore!
          tileIndex++;
          if (tileIndex >= tileLine.length) {
            stillVisible = false;
          }
        }
      });
  }
}
