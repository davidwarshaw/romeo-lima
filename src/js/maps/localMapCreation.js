import properties from '../properties';
import utils from '../util/utils';
import TileMath from '../util/TileMath';

import buildingCreation from './buildingCreation';
import mapProcedures from './mapProcedures';

const forestTiles = [
  'Low Grass',
  'Medium Grass 1', 'Medium Grass 2',
  'Tall Grass 1', 'Tall Grass 2',
  'Medium Tree 1', 'Medium Tree 2', 'Medium Tree 3',
  'Bush 1', 'Bush 2', 'Bush 3'];

const marshGrassTiles = [
  'Low Grass',
  'Medium Grass 1', 'Medium Grass 2',
  'Tall Grass 1', 'Tall Grass 2'
];

const mapCreators = {
  forest(width, height, argument) {
    const { percentDense } = argument;
    const baseWeight = (width * height) * (1 / percentDense);
    const forestWeights = {
      'Low Grass': baseWeight,
      'Medium Tree 1': 1,
      'Medium Tree 2': 1,
      'Medium Tree 3': 1
    };
    let map = {};
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const name = properties.rng.getWeightedValue(forestWeights);
        const terrainHeight = 0;
        const secondPass = false;
        map[utils.keyFromXY(x, y)] = { name, x, y, terrainHeight, secondPass };
      }
    }

    // Add groves around trees
    mapProcedures.tilesWithNeighbors(map, 'Low Grass', 'Medium Tree 1', 1)
      .forEach(tile => tile.name = 'Bush 1');
    mapProcedures.tilesWithNeighbors(map, 'Low Grass', 'Medium Tree 2', 1)
      .forEach(tile => tile.name = 'Bush 2');
    mapProcedures.tilesWithNeighbors(map, 'Low Grass', 'Medium Tree 3', 1)
      .forEach(tile => tile.name = 'Bush 3');

    mapProcedures.tilesWithNeighbors(map, 'Low Grass', 'Bush 1', 3)
      .forEach(tile => tile.name = 'Tall Grass 1');
    mapProcedures.tilesWithNeighbors(map, 'Low Grass', 'Bush 2', 3)
      .forEach(tile => tile.name = 'Tall Grass 2');
    mapProcedures.tilesWithNeighbors(map, 'Low Grass', 'Bush 3', 3)
      .forEach(tile => tile.name = 'Tall Grass 1');

    mapProcedures.tilesWithNeighbors(map, 'Low Grass',
      ['Bush 1', 'Bush 2', 'Bush 3'], 1)
      .forEach(tile => tile.name = 'Medium Grass 2');
    mapProcedures.tilesWithNeighbors(map, 'Low Grass',
      ['Bush 1', 'Bush 2', 'Bush 3'], 2)
      .forEach(tile => tile.name = 'Medium Grass 1');

    mapProcedures.tilesWithNeighbors(map, 'Low Grass',
      ['Medium Grass 1', 'Medium Grass 2'], 2)
      .forEach(tile => tile.name = 'Medium Grass 1');

    return map;
  },

  steppes(width, height, argument) {
    const { percentDense, angle, steepness } = argument;

    const edgeTile = TileMath.edgeTileFromAngle(angle);
    const inclineType = edgeTile.x <= properties.width / 2 ?
      'Left Incline' : 'Right Incline';

    const hypotenuse =
      Math.round(Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)));
    const plateauLength = Math.round(hypotenuse / (steepness + 1));
    const numPlateaus = Math.floor(hypotenuse / plateauLength);
    const isos = [];
    for (let i = 1; i <= numPlateaus; i++) {
      const radius = i * plateauLength;
      const xNoise = Math.round(properties.rng.getNormal(0, 5));
      const yNoise = Math.round(properties.rng.getNormal(0, 5));
      isos.push({ radius, xNoise, yNoise });
    }

    const map = mapCreators.forest(width, height, { percentDense });

    Object.entries(map)
      .forEach(tile => {
        const x = tile[1].x - edgeTile.x;
        const y = tile[1].y - edgeTile.y;
        isos.forEach(iso => {
          const { radius, xNoise, yNoise } = iso;
          const distance = Math.round(Math.sqrt(
            Math.pow(x + xNoise, 2) + Math.pow(y + yNoise, 2)));

          // Make incline at radius and radius plus one so its thicker
          if (distance === radius || distance === radius + 1) {
            // console.log(`${radius}, ${distance}: ${tile[1]}`);
            tile[1].name = inclineType;
          }
        });
      });

    return map;
  },

  marsh(width, height, argument) {
    const { percentDense } = argument;
    const baseWeight = (width * height) * (1 / percentDense);
    const forestWeights = {
      'Deep Marsh Water': baseWeight,
      'Marsh Grass': 2,
      'Low Grass': 2,
      'Medium Grass 1': 2,
      'Medium Tree 1': 1
    };
    let map = {};
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const name = properties.rng.getWeightedValue(forestWeights);
        const terrainHeight = 0;
        const secondPass = false;
        map[utils.keyFromXY(x, y)] = { name, x, y, terrainHeight, secondPass };
      }
    }

    // Grow the land
    mapProcedures
      .tilesWithNeighbors(map, 'Deep Marsh Water', 'Marsh Grass', 1)
      .forEach(tile => tile.name = 'Low Grass');
    mapProcedures
      .tilesWithNeighbors(map, 'Deep Marsh Water', 'Low Grass', 1)
      .forEach(tile => tile.name = 'Low Grass');
    mapProcedures
      .tilesWithNeighbors(map, 'Deep Marsh Water', 'Medium Tree 1', 1)
      .forEach(tile => tile.name = 'Low Grass');

    // Add marsh grass
    mapProcedures
      .tilesWithNeighbors(map, 'Low Grass', 'Deep Marsh Water', 2)
      .forEach(tile => tile.name = 'Marsh Grass');
    mapProcedures
      .tilesWithNeighbors(map, 'Low Grass', 'Marsh Grass', 3)
      .forEach(tile => tile.name = 'Marsh Grass');
    mapProcedures
      .tilesWithNeighbors(map, 'Deep Marsh Water', 'Marsh Grass', 3)
      .forEach(tile => tile.name = 'Marsh Grass');


    mapProcedures
      .tilesWithNeighbors(map, 'Low Grass',
        ['Marsh Grass', 'Medium Grass 1'], 2)
      .forEach(tile => tile.name = 'Medium Grass 1');

    // Add the bushes
    mapProcedures
      .tilesWithNeighbors(map, 'Marsh Grass', 'Deep Marsh Water', 1)
      .forEach(tile => tile.name = 'Bush 5');
    mapProcedures
      .tilesWithNeighbors(map, 'Marsh Grass', 'Bush 5', 3)
      .forEach(tile => tile.name = 'Bush 5');
    mapProcedures
      .tilesWithNeighbors(map, 'Marsh Grass', 'Bush 5', 4)
      .forEach(tile => tile.name = 'Bush 5');

    // Add deep water
    mapProcedures
      .tilesWithNeighbors(map, 'Deep Marsh Water', 'Bush 5', 1)
      .forEach(tile => tile.name = 'Shallow Marsh Water');

    // Add mud grass
    mapProcedures
      .tilesByChance(map, 'Bush 5', 20)
      .forEach(tile => tile.name = 'Mud Grass');

    return map;
  },

  forestRiver(width, height, argument) {
    const { percentDense, angle, radius, noiseStd } = argument;

    const riverHalfWidth = 4;
    const riverMin = radius - riverHalfWidth;
    const riverMax = radius + riverHalfWidth;

    const x0 = Math.round(properties.localWidth / 2);
    const y0 = Math.round(properties.localHeight / 2);
    const x1 = Math.round(x0 + (radius * Math.cos(angle)));
    const y1 = Math.round(y0 + (radius * Math.sin(angle)));

    const map = mapCreators.forest(width, height, { percentDense });

    Object.entries(map)
      .forEach(tile => {
        const x = tile[1].x - x1;
        const y = tile[1].y - y1;
        const noise = Math.round(properties.rng.getNormal(0, noiseStd));
        const distance = Math.round(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));

        if (distance >= riverMin - noise && distance <= riverMax + noise) {
          // console.log(`${radius}, ${distance}: ${tile[1]}`);
          tile[1].name = 'Deep River Water';
        }
      });

    // Consolidate water
    mapProcedures
      .tilesWithNeighbors(map, forestTiles, 'Deep River Water', 3)
      .forEach(tile => tile.name = 'Deep River Water');
    mapProcedures
      .tilesWithNeighbors(map, 'Deep River Water', forestTiles, 5)
      .forEach(tile => tile.name = 'Low Grass');

    // Add shalllows
    mapProcedures
      .tilesWithNeighbors(map, 'Deep River Water', forestTiles, 2)
      .forEach(tile => tile.name = 'Shallow River Water');
    mapProcedures
      .tilesWithNeighbors(map,
        'Deep River Water', 'Shallow River Water', 2)
      .forEach(tile => tile.name = 'Shallow River Water');
    mapProcedures
      .tilesWithNeighbors(map,
        'Deep River Water', 'Shallow River Water', 3)
      .forEach(tile => tile.name = 'Shallow River Water');

    // Add shore line marshes
    mapProcedures
      .tilesWithNeighbors(map, marshGrassTiles, 'Shallow River Water', 1)
      .forEach(tile => tile.name = 'Medium Grass 2');
    mapProcedures
      .tilesWithNeighbors(map, marshGrassTiles, 'Marsh Grass', 3)
      .forEach(tile => tile.name = 'Medium Grass 1');

    // Add mud grass
    mapProcedures
      .tilesByChance(map, 'Shallow River Water', 20)
      .forEach(tile => tile.name = 'Mud Grass');

    return map;
  },

  waterfall(width, height, argument) {
    const { percentDense, southBend } = argument;

    const riverAngle = southBend ? 1 / 2 * Math.PI : 3 / 2 * Math.PI;
    const riverRadius = 200;
    const riverNoiseStd = 1;

    const cliffAngle = southBend ? 0 : Math.PI;
    const cliffRadius = 80;
    const cliffNoise = 0.25;

    const cliffHalfWidth = 2;
    const cliffMin = cliffRadius - cliffHalfWidth;
    const cliffMax = cliffRadius + cliffHalfWidth;

    const riverTiles = ['Shallow River Water', 'Deep River Water'];

    const x0 = Math.round(properties.localWidth / 2);
    const y0 = Math.round(properties.localHeight / 2);
    const x1 = Math.round(x0 + (cliffRadius * Math.cos(cliffAngle)));
    const y1 = Math.round(y0 + (cliffRadius * Math.sin(cliffAngle)));

    const map = mapCreators.map(width, height,
      {
        percentDense,
        angle: riverAngle,
        radius: riverRadius,
        noiseStd: riverNoiseStd
      });

    Object.entries(map)
      .forEach(tile => {
        const x = tile[1].x - x1;
        const y = tile[1].y - y1;
        const noise = Math.round(properties.rng.getNormal(0, cliffNoise));
        const distance = Math.round(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));

        if (distance >= cliffMin - noise && distance <= cliffMax + noise) {
          // console.log(`${radius}, ${distance}: ${tile[1]}`);
          if (riverTiles.includes(tile[1].name)) {
            // The bottom of the falls
            if (distance === cliffMin - noise) {
              tile[1].name = 'Churning Water';
            }

            // The top of the falls
            else if (distance === cliffMax + noise) {
              tile[1].name = 'Rapid Water';
            }

            // The middle of the falls
            else {
              tile[1].name = 'Falling Water';
            }
          }

          // On the land
          else {
            tile[1].name = 'Sheer Bank';
          }
        }
      });

    // Add to rapids
    mapProcedures
      .tilesWithNeighbors(map, 'Deep River Water', 'Rapid Water', 1)
      .forEach(tile => tile.name = 'Rapid Water');
    mapProcedures
      .tilesWithNeighbors(map, 'Deep River Water', 'Rapid Water', 2)
      .forEach(tile => tile.name = 'Rapid Water');
    mapProcedures
      .tilesWithNeighbors(map, 'Deep River Water', 'Rapid Water', 2)
      .forEach(tile => tile.name = 'Rapid Water');
    mapProcedures
      .tilesWithNeighbors(map, 'Shallow River Water', 'Rapid Water', 2)
      .forEach(tile => tile.name = 'Rapid Water');

    // Add to churning
    mapProcedures
      .tilesWithNeighbors(map, 'Deep River Water', 'Churning Water', 1)
      .forEach(tile => tile.name = 'Churning Water');
    mapProcedures
      .tilesWithNeighbors(map, 'Deep River Water', 'Churning Water', 2)
      .forEach(tile => tile.name = 'Churning Water');
    mapProcedures
      .tilesWithNeighbors(map, 'Deep River Water', 'Churning Water', 2)
      .forEach(tile => tile.name = 'Churning Water');
    mapProcedures
      .tilesWithNeighbors(map,
        'Shallow River Water', 'Churning Water', 2)
      .forEach(tile => tile.name = 'Churning Water');

    // Make the top and bottom shallower
    mapProcedures
      .tilesWithNeighbors(map, 'Deep River Water',
        ['Rapid Water', 'Churning Water'], 1)
      .forEach(tile => tile.name = 'Shallow River Water');
    mapProcedures
      .tilesWithNeighbors(map, 'Deep River Water',
        'Shallow River Water', 2)
      .forEach(tile => tile.name = 'Shallow River Water');
    mapProcedures
      .tilesWithNeighbors(map, 'Deep River Water',
        'Shallow River Water', 2)
      .forEach(tile => tile.name = 'Shallow River Water');

    return map;
  },

  village(width, height, argument) {
    const { percentDense } = argument;
    const baseWeight = (width * height) * (1 / percentDense);
    const forestWeights = {
      'Low Grass': baseWeight,
      'Medium Tree 1': 1,
      'Medium Tree 2': 1,
      'Medium Tree 3': 1
    };

    let map = {};
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const terrainHeight = 0;
        const secondPass = false;
        const name = properties.rng.getWeightedValue(forestWeights);
        map[utils.keyFromXY(x, y)] = { name, x, y, terrainHeight, secondPass };
      }
    }

    const numBuildings = Math
      .round(properties.rng.getNormal(6, 2));

    const xCenter = Math.round(width * (1 / 4));
    const yCenter = Math.round(height * (1 / 4));
    const std = 10;
    let xMax = Math.round(utils.clamp(
      properties.rng.getNormal(xCenter, std),
      xCenter - 10,
      xCenter + 10));
    let yMax = Math.round(utils.clamp(
      properties.rng.getNormal(yCenter, std),
      yCenter - 10,
      yCenter + 10));
    let frontToSouth = true;

    let xGlobalMin = xMax;
    let yGlobalMax = yMax;

    const buildings = [...Array(numBuildings).keys()].map((i) => {
      const stringDim = properties.rng
        .getWeightedValue(buildingCreation.buildingWeights);
      const buildingHeight = Number(stringDim.split('x')[0]);
      const buildingWidth = Number(stringDim.split('x')[1]);
      const justHutTiles = true;

      if (yMax < buildingHeight) {
        yMax = buildingHeight + 2;
      }
      console.log(`xMax: ${xMax} yMax: ${yMax}`);
      const x = utils.clamp(xMax, 0, width - buildingWidth);
      const y = utils.clamp(yMax - buildingHeight, 0, height - buildingHeight);
      xMax = x + buildingWidth + 2;

      if (i > numBuildings / 2) {
        yMax = yGlobalMax + 2;
        xMax = Math.round(xGlobalMin + ((xMax - xGlobalMin) / 2));
        frontToSouth = false;
      }
      yGlobalMax = Math.max(yGlobalMax, yMax + buildingHeight);
      return { x, y, stringDim, buildingWidth, buildingHeight, frontToSouth, justHutTiles };
    });

    // Add groves around trees
    mapProcedures.tilesWithNeighbors(map, 'Low Grass', 'Medium Tree 1', 1)
      .forEach(tile => tile.name = 'Bush 1');
    mapProcedures.tilesWithNeighbors(map, 'Low Grass', 'Medium Tree 2', 1)
      .forEach(tile => tile.name = 'Tall Grass 1');
    mapProcedures.tilesWithNeighbors(map, 'Low Grass', 'Medium Tree 2', 1)
      .forEach(tile => tile.name = 'Tall Grass 2');

    mapProcedures.tilesWithNeighbors(map, 'Low Grass', 'Bush 1', 3)
      .forEach(tile => tile.name = 'Medium Grass 1');
    mapProcedures.tilesWithNeighbors(map, 'Bush 1', 'Low Grass', 3)
      .forEach(tile => tile.name = 'Medium Grass 2');

    buildings.forEach(building => buildingCreation
      .placeBuildingInLocalMap(map, building));

    buildingCreation.placePathsInLocalMap(map);

    // Smooth out the path
    mapProcedures.tilesWithNeighbors(map, marshGrassTiles, 'Path', 1)
      .forEach(tile => tile.name = 'Path');
    mapProcedures.tilesWithNeighbors(map, marshGrassTiles, 'Path', 1)
      .forEach(tile => tile.name = 'Path');
    mapProcedures.tilesWithNeighbors(map, marshGrassTiles, 'Path', 1)
      .forEach(tile => tile.name = 'Path');

    // Add some grass with mud
    mapProcedures.tilesWithNeighbors(map, 'Path', 'Low Grass', 3)
      .forEach(tile => tile.name = 'Mud Grass');
    mapProcedures
      .tilesByChance(map, 'Path', 10)
      .forEach(tile => tile.name = 'Mud Grass');
    mapProcedures.tilesWithNeighbors(map, 'Mud Grass', 'Hut Wall', 1)
      .forEach(tile => tile.name = 'Path');

    return map;
  },

  clearing(width, height, argument) {
    const { percentDense } = argument;

    const largeEllipseChance = 45;
    const smallEllipseChance = 65;

    const map = mapCreators.forest(width, height, { percentDense });
    const largeEllipse = TileMath
      .tileEllipseFilled(width / 2, height / 2, width / 4, height / 4);
    const smallEllipse = TileMath
      .tileEllipseFilled(width / 2, height / 2, width / 6, height / 6);

    Object.entries(map)
      .forEach(tile => {
        const inLargeEllipse =
          largeEllipse[utils.keyFromXY(tile[1].x, tile[1].y)];
        const inSmallEllipse =
          smallEllipse[utils.keyFromXY(tile[1].x, tile[1].y)];
        if (inLargeEllipse) {
          const chance = properties.rng.getPercentage();
          if (chance <= largeEllipseChance) {
            tile[1].name = 'Low Grass';
          }
        }
        if (inSmallEllipse) {
          const chance = properties.rng.getPercentage();
          if (chance <= smallEllipseChance) {
            tile[1].name = 'Low Grass';
          }
        }
      });

    return map;
  },

  highway(width, height) {
    const percentDense = 25;
    const map = mapCreators.forest(width, height, { percentDense });
    const centerOffset = Math.round((properties.rng.getPercentage() - 50) / 4);
    const roadXCenter = Math.round((width * 0.75) + centerOffset);
    const roadHalfWidth = 6;
    let roadDriftX = roadXCenter;

    for (let y = 0; y < height; y++) {

      const chance = properties.rng.getPercentage();
      let roadDriftAmount = 0;
      if (chance <= 15) {
        roadDriftAmount = -1;
      }
      else if (chance >= 85) {
        roadDriftAmount = 1;
      }
      roadDriftX = roadDriftX + roadDriftAmount;

      // console.log(`roadDriftX: ${roadDriftX} roadDriftAmount: ${roadDriftAmount}`);
      for (let x = roadDriftX - roadHalfWidth; x <= roadDriftX + roadHalfWidth; x++) {
        const terrainHeight = 0;
        const secondPass = false;
        let name = 'Highway';
        if (x === roadDriftX - roadHalfWidth || x === roadDriftX + roadHalfWidth) {
          name = 'Highway Edge';
        }
        else if (x === roadDriftX) {
          name = 'Highway Center';
        }
        map[utils.keyFromXY(x, y)] = { name, x, y, terrainHeight, secondPass };
      }
    }

    mapProcedures.tilesWithNeighbors(map, forestTiles, 'Highway Edge', 1)
      .forEach(tile => tile.name = 'Path');
    mapProcedures.tilesWithNeighbors(map, forestTiles, 'Path', 2)
      .forEach(tile => {
        const chance = properties.rng.getPercentage();
        if (chance <= 50) {
          tile.name = 'Path';
        }
      });
    mapProcedures.tilesWithNeighbors(map, forestTiles, 'Path', 2)
      .forEach(tile => tile.name = 'Medium Grass 1');

    return map;
  },

  ricePaddy(width, height, argument) {
    const { percentDense } = argument;

    const map = mapCreators.forest(width, height, { percentDense: 5 });

    const numRows = Math.round(properties.rng.getNormal(1, 1)) + 1;
    const numCols = Math.round(properties.rng.getNormal(4, 1)) + 1;
    const rowSpacing = 1;
    const colSpacing = 2;
    const borderSize = Math.max(Math.round(properties.rng.getNormal(2, 2)) + 1, 1);
    console.log(`numRows: ${numRows} numCols: ${numCols} borderSize: ${borderSize}`);


    const rowheight = Math.round(
      (height - (2 * borderSize) - ((numRows - 1) * rowSpacing)) / numRows);
    const colWidth = Math.round(
      (width - (2 * borderSize) - ((numCols - 1) * colSpacing)) / numCols);
    console.log(rowheight);
    console.log(colWidth);

    const rowRanges = [...Array(numRows).keys()]
      .map(i => {
        console.log(i);
        const start = borderSize + (i * (rowheight + rowSpacing));
        const stop = start + rowheight;
        return { start, stop };
      });
    const colRanges = [...Array(numCols).keys()]
      .map(i => {
        console.log(i);
        const start = borderSize + (i * (colWidth + colSpacing));
        const stop = start + colWidth;
        return { start, stop };
      });
    console.log(rowRanges);
    console.log(colRanges);

    Object.entries(map)
      .filter(tile => {
        const inRowRange = rowRanges.some(range => tile[1].y >= range.start && tile[1].y < range.stop);
        const inColRange = colRanges.some(range => tile[1].x >= range.start && tile[1].x < range.stop);
        return inRowRange && inColRange;
      })
      .forEach(tile => {
        tile[1].name = 'Rice Paddy';
      });

    return map;
  },

  crashSite(width, height, argument) {
    // The crash site is a clearing with the crashed helicopters
    const map = mapCreators.clearing(width, height, argument);
    const helicopterVertical = {
      x: 60, y: 3,
      stringDim: 'Crashed Helicopter Vertical',
      buildingWidth: 5, buildingHeight: 8,
      frontToSouth: true,
      justHutTiles: false
    };
    buildingCreation.placeBuildingInLocalMap(map, helicopterVertical);
    const helicopterHorizontal = {
      x: 30, y: 8,
      stringDim: 'Crashed Helicopter Horizontal',
      buildingWidth: 10, buildingHeight: 5,
      frontToSouth: true,
      justHutTiles: false
    };
    buildingCreation.placeBuildingInLocalMap(map, helicopterHorizontal);
    console.log(map);
    return map;
  }

};
function createLocalMap(seedTile, width, height) {
  const createFunction = seedTile.localMapCreationFunction;
  const createArgument = JSON.parse(seedTile.localMapCreationArgument);
  return mapCreators[createFunction](width, height, createArgument);

  // const argument = { percentDense: 50 };
  const argument = {
    percentDense: 50,
    angle: 0.75,
    radius: 60,
    noiseStd: 3,
    southBend: true
  };
  //
  // return mapCreators.village(width, height, argument);
  // return mapCreators.highway(width, height, argument);
  // return mapCreators.crashSite(width, height, argument);
  return mapCreators.ricePaddy(width, height, argument);
}

export default { createLocalMap };
