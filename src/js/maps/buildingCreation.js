import properties from '../properties';
import utils from '../util/utils';

import TileMath from '../util/TileMath';

const buildingWeights = {
  '11x11': 1,
  '7x11': 3,
  '11x7': 3,
  '9x7': 5,
  '7x9': 5,
  '5x5': 4,
  '3x3': 2
};
const hutTiles = ['Hut Floor', 'Hut Door', 'Hut Wall', 'Hut Window'];


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
  const { x, y, buildingWidth, buildingHeight, frontToSouth } = building;

  const windowSpan = utils
    .clamp(Math.round(properties.rng.getNormal(8, 2)), 5, 10);

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

      if (topWall || bottomWall || leftWall || rightWall) {
        if ((frontToSouth && middle && bottomWall) ||
            (!frontToSouth && middle && topWall)) {
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
  placePathsInLocalMap,
  placeBuildingInLocalMap
};
