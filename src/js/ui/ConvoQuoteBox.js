import properties from '../properties';
import styleDefaults from './StyleDefaults';

import Window from './Window';

export default class ConvoQuoteBox extends Window {
  constructor(game, cb, textRows, style) {
    super(0, 0, properties.width, properties.height, '', style);
    this.game = game;
    this.cb = cb;
    this.textRows = textRows;
    this.style = Object.assign(styleDefaults, style);

    const longestRow = textRows.sort((l, r) => r.length - l.length)[0];
    this.width = longestRow.length;
    this.height = textRows.length + 1;

    this.centerX = Math.round((properties.width - this.width) / 2);
    this.centerY = Math.round((properties.height - this.height) / 2);

    this.rowIndex = 1;
  }

  render(display) {
    const text = this.textRows.slice(0, this.rowIndex).join('\n\n');
    const formattedText =
      `%c{${this.style.textColor}}%b{${this.style.bgColor}}${text}`;
    display.drawText(this.centerX, this.centerY,
      formattedText, this.width);
  }

  inputHandler(input) {
    if(input === 'ENTER') {
      console.log(this.rowIndex);
      if (this.rowIndex < this.textRows.length) {
        console.log('nextRow');
        this.rowIndex++;
        this.game.refresh();
      }
      else {
        console.log('cb');
        this.cb();
      }
    }
  }

  mouseHandler() {
    // Nothing
  }

}
