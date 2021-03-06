
export default class ImageAnimation {
  constructor(x, y, loop, updateFunction, animationArrays, bgTileArrays) {
    this.x = x;
    this.y = y;
    this.loop = loop;
    this.updateFunction = updateFunction;
    this.animationArrays = animationArrays;
    this.bgTileArrays = bgTileArrays;
    this.animationFrameIndex = 0;
  }

  complete() {
    return !this.loop && this.animationFrameIndex === this.animationArrays.length - 1;
  }

  render(display) {
    const tileArrays = this.animationArrays[this.animationFrameIndex];
    tileArrays.forEach((row, y) =>
      row.forEach((tile, x) => {
        const tileX = this.x + x;
        const tileY = this.y + y;
        const { glyph, colorFg, colorBg } = tile;
        const bgTileBgColor = (tileY >= 0 && tileY < this.bgTileArrays.length) &&
          (tileX >= 0 && tileX < this.bgTileArrays[0].length) ?
          this.bgTileArrays[tileY][tileX].colorBg :
          null;
        const bgColor = colorBg !== '#ffffff' ? colorBg : bgTileBgColor;
        const adjustedGlyph = glyph === ' ' && colorBg === '#ffffff' ? '' : glyph;
        display.draw(tileX, tileY, adjustedGlyph, colorFg, bgColor);
      }));
  }

  frame() {
    this.animationFrameIndex++;
    if (this.animationFrameIndex >= this.animationArrays.length) {
      this.animationFrameIndex = this.loop ? 0 : this.animationArrays.length - 1;
    }
  }
}
