import properties from '../properties';

import Window from './Window';

export default class ImageBox extends Window {
  constructor(cb, tileArrays, imageAnimations) {
    super(0, 0, properties.width, properties.height);
    this.cb = cb;
    this.tileArrays = tileArrays;
    this.imageAnimations = imageAnimations;
  }

  render(display) {
    this.tileArrays.forEach((row, y) =>
      row.forEach((tile, x) =>
        display.draw(x, y, tile.glyph, tile.colorFg, tile.colorBg)));
    this.imageAnimations.forEach(imageAnimation => imageAnimation.render(display));
  }

  inputHandler(input) {
    if(input === 'ENTER') {
      this.cb();
    }
  }

  mouseHandler() {
    // Nothing
  }

}
