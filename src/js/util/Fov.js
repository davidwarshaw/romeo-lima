import properties from '../properties';
import utils from './utils';
import TileMath from './TileMath';
import Cache from './Cache';

import tileDictionary from '../maps/data/tileDictionary.json';

export default class Fov {
  constructor(map, members) {
    this.map = map;
    this.members = members;
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
        let sightBlockage = 0;
        let stillVisible = true;
        while (stillVisible) {
          const { x, y } = tileLine[tileIndex];
          const tile = this.map[utils.keyFromXY(x, y)];
          const tileDef = tileDictionary[tile.name];

          // Set the tile as visible
          this.visibleMap[utils.keyFromXY(x, y)] = true;

          // Accumulate sight line blockage until 100% blocked
          // The first two tiles don't contribute to sight blockage
          // and are automatically visible
          if (tileIndex >= 2) {
            sightBlockage += tileDef.sightBlockPercent;
            if (sightBlockage >= 100) {
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
