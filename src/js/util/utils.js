import ROT from 'rot-js';

function keyFromXY(x, y) {
  return `${x}-${y}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function adjustBrightness(colorHex, value) {
  const colorString = ROT.Color.fromString(colorHex);
  const adjustedColor = ROT.Color.add(colorString, [value, value, value]);
  return ROT.Color.toHex(adjustedColor);
}


function highlight(colorHex, value) {
  const colorString = ROT.Color.fromString(colorHex);
  const adjustedColor = ROT.Color.add(colorString, [0, value, value]);
  return ROT.Color.toHex(adjustedColor);
}

export default {
  keyFromXY,
  clamp,
  adjustBrightness,
  highlight
};
