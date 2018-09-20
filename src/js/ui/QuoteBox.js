import properties from '../properties';
import styleDefaults from './StyleDefaults';

export default class QuoteBox {
  constructor(cb, text, style) {
    this.cb = cb;
    this.text = text;
    this.style = Object.assign(styleDefaults, style);

    const textRows = text.split('\n');
    const longestRow = textRows.sort((l, r) => r.length - l.length)[0];
    this.width = longestRow.length;
    this.height = textRows.length;

    this.x = Math.round((properties.width - this.width) / 2);
    this.y = Math.round((properties.height - this.height) / 2);
  }

  render(display) {
    const formattedText =
      `%c{${this.style.textColor}}%b{${this.style.bgColor}}${this.text}`;
    display.drawText(this.x, this.y,
      formattedText, this.width);
  }

  inputHandler(input) {
    if(input === 'ENTER') {
      this.cb();
    }
  }

}
