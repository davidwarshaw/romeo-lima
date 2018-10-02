import properties from '../properties';
import utils from '../util/utils';

const buildingWeights = {
  '11x11': 1,
  '7x11': 3,
  '11x7': 3,
  '9x7': 5,
  '7x9': 5,
  '5x5': 4,
  '3x3': 2
};

function placeBuildingInLocalMap(map, building) {
  const { x, y, buildingWidth, buildingHeight, frontToSouth } = building;

  const windowSpan = utils
    .clamp(Math.round(properties.rng.getNormal(7, 2)), 5, 10);
  const additionalDoorChance = 5;

  for (let row = y; row < y + buildingHeight; row++) {
    for (let col = x; col < x + buildingWidth; col++) {
      let buildingTileName = 'Hut Floor';

      const topWall = row === y;
      const bottomWall = row === y + buildingHeight - 1;
      const leftWall = col === x;
      const rightWall = col === x + buildingWidth - 1;
      const middle = col === x + Math.floor(buildingWidth / 2);

      const wallCol = col - x + 1;
      const wallRow = row - y + 1;

      const rng = properties.rng.getPercentage();

      if (topWall || bottomWall || leftWall || rightWall) {
        if ((frontToSouth && middle && bottomWall) ||
            (!frontToSouth && middle && topWall)) {
          buildingTileName = 'Hut Door';
        }
        else if (rng <= additionalDoorChance) {
          buildingTileName = 'Hut Door';
        }
        else if (wallCol % windowSpan === 0 || wallRow % windowSpan === 0) {
          buildingTileName = 'Hut Window';
        }
        else {
          buildingTileName = 'Hut Wall';
        }
      }
      map[utils.keyFromXY(col, row)].name = buildingTileName;
    }
  }
}

export default {
  buildingWeights,
  placeBuildingInLocalMap
};
