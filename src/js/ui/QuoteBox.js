import properties from '../properties';
import styleDefaults from './StyleDefaults';

import Window from './Window';

export default class QuoteBox extends Window {
  constructor(cb, text, style) {
    super(0, 0, properties.width, properties.height, '', style);
    this.cb = cb;
    this.text = text;
    this.style = Object.assign(styleDefaults, style);

    const textRows = text.split('\n');
    const longestRow = textRows.sort((l, r) => r.length - l.length)[0];
    this.width = longestRow.length;
    this.height = textRows.length;

    this.centerX = Math.round((properties.width - this.width) / 2);
    this.centerY = Math.round((properties.height - this.height) / 2);
  }

  render(display) {
    const formattedText =
      `%c{${this.style.textColor}}%b{${this.style.bgColor}}${this.text}`;
    display.drawText(this.centerX, this.centerY,
      formattedText, this.width);
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
