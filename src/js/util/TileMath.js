import properties from '../properties';

function tileLine(x0, y0, x1, y1) {
  const linePoints = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = (x0 < x1) ? 1 : -1;
  const sy = (y0 < y1) ? 1 : -1;

  let x = x0;
  let y = y0;
  let err = dx - dy;

  linePoints.push({ x, y });
  while((x !== x1) || (y !== y1)) {
    //console.log(`${x}-${y}`);
    const err2 = 2 * err;
    if (err2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (err2 < dx) {
      err += dx;
      y += sy;
    }
    linePoints.push({ x, y });
  }

  return linePoints;
}

function tileRay(x0, y0, x1, y1) {
  const linePoints = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = (x0 < x1) ? 1 : -1;
  const sy = (y0 < y1) ? 1 : -1;

  let x = x0;
  let y = y0;
  let err = dx - dy;

  linePoints.push({ x, y });
  while(
    ((x !== 0) && (x !== properties.localWidth - 1)) &&
    ((y !== 0) && (y !== properties.localHeight - 1))) {
    const err2 = 2 * err;
    if (err2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (err2 < dx) {
      err += dx;
      y += sy;
    }
    linePoints.push({ x, y });
  }

  return linePoints;
}

function distance(x0, y0, x1, y1) {
  return Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
}

export default {
  tileLine,
  tileRay,
  distance
};
