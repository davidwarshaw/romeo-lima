
export default class SmokeAnimation {
  constructor(x, y, updateFunction, bgTileArrays) {
    this.x = x;
    this.y = y;
    this.updateFunction = updateFunction;
    this.bgTileArrays = bgTileArrays;

    this.glyph = '◆';
    this.colorFg = '#ff0000';
  }

  render(display) {
    const { x, y, glyph, colorFg } = this;
    const colorBg = (y >= 0 && y < this.bgTileArrays.length) &&
      (x >= 0 && x < this.bgTileArrays[0].length) ?
      this.bgTileArrays[y][x].colorBg :
      null;
    display.draw(x, y, glyph, colorFg, colorBg);
  }

  frame() {
  }
}
