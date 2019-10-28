import * as ROT from 'rot-js';

function keyFromXY(x, y) {
  return `${x}-${y}`;
}

function xyFromKey(key) {
  return { x: Number(key.split('-')[0]), y: Number(key.split('-')[1]) };
}

function groupBy(arr, key) {
  return arr.reduce((grouped, element) => {
    const val = element[key];
    grouped[val] = grouped[val] || [];
    grouped[val].push(element);
    return grouped;
  }, {});
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function wrap(value, min, max) {
  if (value > max) {
    return min;
  }
  else if (value < min) {
    return max;
  }
  return value;
}

function highlight(colorHex, value) {
  const colorString = ROT.Color.fromString(colorHex);
  const adjustedColor = ROT.Color.add(colorString, [0, value, value]);
  return ROT.Color.toHex(adjustedColor);
}

function adjustBrightness(colorHex, value) {
  const colorString = ROT.Color.fromString(colorHex);
  const adjustedColor = ROT.Color.add(colorString, [value, value, value]);
  return ROT.Color.toHex(adjustedColor);
}

function adjustSmoke(point, colorHex, environmentSystem) {
  // console.log(`point: ${point} color: ${color}`);
  const smokeLevel = environmentSystem.smoke[keyFromXY(point.x, point.y)].amount;

  // Eearly exit if no smoke
  if (!smokeLevel) {
    return colorHex;
  }
  const smokeFactor = (smokeLevel / 100.0);
  const colorString = ROT.Color.fromString(colorHex);
  const fullSmokeColor = ROT.Color.fromString(environmentSystem.fullSmokeColor);
  const adjustedColor = ROT.Color.interpolate(colorString, fullSmokeColor, smokeFactor);

  // console.log(`point: ${point.x}x${point.y} color: ${adjustedColor} smoke: ${smokeFactor}`);
  return ROT.Color.toHex(adjustedColor);
}

function adjustFire(point, colorHex, environmentSystem, foreGround) {
  // console.log(`point: ${point} color: ${color}`);
  const fireLevel = environmentSystem.fire[keyFromXY(point.x, point.y)].amount;

  // Eearly exit if no fire
  if (fireLevel <= 0) {
    return colorHex;
  }

  // const fireFactor = Math.round(fireLevel / 100.0);
  const fireFactor = fireLevel;
  const colorString = foreGround ?
    ROT.Color.fromString(environmentSystem.fullFireFgColor) :
    ROT.Color.fromString(environmentSystem.fullFireBgColor);
  const adjustedColor = ROT.Color.add(colorString, [fireFactor, fireFactor, fireFactor]);

  // console.log(`point: ${point.x}x${point.y} color: ${adjustedColor} smoke: ${smokeFactor}`);
  return ROT.Color.toHex(adjustedColor);
}

export default {
  keyFromXY,
  xyFromKey,
  groupBy,
  clamp,
  wrap,
  highlight,
  adjustBrightness,
  adjustSmoke,
  adjustFire
};
