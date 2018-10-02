import text from '../util/text';
import styleDefaults from './StyleDefaults';

export default class Window {
  constructor(x, y, width, height, title, style) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 10;
    this.height = height || 10;

    this.title = title || '';

    this.style = Object.assign(styleDefaults, style);

    this.renderBorder = this.renderBorder.bind(this);
    this.renderTitle = this.renderTitle.bind(this);
  }

  render(display) {
    this.renderBorder(display);
    if (this.title) {
      this.renderTitle(display);
    }
  }

  renderBorder(display) {
    const { windowLeft, windowRight,
      windowTop, windowBottom } = this.windowBorders();

    // Draw Border
    for (let row = windowTop; row < windowBottom + 1; row++) {
      for (let col = windowLeft; col < windowRight + 1; col++) {
        let char = this.style.fieldChar;
        let fgColor = this.style.lineColor;
        let bgColor = this.style.fieldBgColor;

        // Corners
        if (row === windowTop && col === windowLeft) {
          char = this.style.upperLeftCornerChar;
          bgColor = this.style.borderBgColor;
        }
        else if (row === windowTop && col === windowRight) {
          char = this.style.upperRightCornerChar;
          bgColor = this.style.borderBgColor;
        }
        else if (row === windowBottom && col === windowLeft) {
          char = this.style.lowerLeftCornerChar;
          bgColor = this.style.borderBgColor;
        }
        else if (row === windowBottom && col === windowRight) {
          char = this.style.lowerRightCornerChar;
          bgColor = this.style.borderBgColor;
        }

        // Verticals
        else if (col === windowLeft || col === windowRight) {
          char = this.style.verticalChar;
          bgColor = this.style.borderBgColor;
        }

        // Horizontals
        else if (row === windowTop || row === windowBottom) {
          char = this.style.horizontalChar;
          bgColor = this.style.borderBgColor;
        }

        // Draw character
        display.draw(col, row, char, fgColor, bgColor);
      }
    }
  }

  renderTitle(display) {
    const { windowLeft, windowTop } = this.windowBorders();

    // Draw Title
    // Title is limited by corner chars and title brackets
    const { startingCol, truncatedText } = text
      .truncateAndCenterText(this.title, windowLeft, this.width - 4);

    // Form the color format substring
    const colorPrefix =
          `%c{${this.style.titleColor}}%b{${this.style.borderBgColor}}`;
    const formattedTitle = `${colorPrefix}${truncatedText}`;

    display.drawText(startingCol, windowTop, formattedTitle);

    // Draw title brackets
    display.draw(
      startingCol - 1, windowTop,
      this.style.titleBracketLeft,
      this.style.lineColor, this.style.borderBgColor);
    display.draw(
      startingCol + truncatedText.length, windowTop,
      this.style.titleBracketRight,
      this.style.lineColor, this.style.borderBgColor);
  }

  windowBorders() {
    return {
      windowLeft: this.x,
      windowRight: this.x + this.width,
      windowTop: this.y,
      windowBottom: this.y + this.height };
  }

  inputHandler() {
    // Override me
  }

  getCommands() {
    // Override me
  }
}
