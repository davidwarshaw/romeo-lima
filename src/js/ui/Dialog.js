import properties from '../properties';
import text from '../util/text';

import Window from './Window';

export default class Dialog extends Window {
  constructor(game, width, height,
    title, text,
    yesLabel, yesCb, noLabel, noCb,
    style) {
    const x = Math.round((properties.width - width) / 2);
    const y = Math.round((properties.height - height) / 2);
    super(x, y, width, height, title, style);
    this.game = game;
    this.text = text;
    this.singleButton = yesCb && !noCb;
    this.buttons = {
      yes: { label: yesLabel, selected: false, cb: yesCb },
      no: { label: noLabel, selected: false, cb: noCb }
    };

    // If there's not two buttons, auto select
    if (this.singleButton) {
      this.buttons.yes.selected = true;
    }
  }

  render(display) {
    super.renderBorder(display);
    if (this.title) {
      super.renderTitle(display);
    }
    this.renderText(display, this.text);
    this.renderButton(display, this.buttons.yes, true);

    // Render the "no" button only if there's not a single button
    if (!this.singleButton) {
      this.renderButton(display, this.buttons.no, false);
    }
  }

  renderText(display, text) {
    // Check if the text is a corpus (it will be an array)
    if (Array.isArray(text)) {
      let textY = this.y + 2;
      text.forEach(paragraph => {
        let formattedText =
          `%c{${this.style.nameColor}}%b{${this.style.fieldBgColor}}` +
            `${paragraph.name}`;
        display.drawText(
          this.x + 2, textY,
          formattedText, this.width - 4);
        formattedText =
          `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}` +
            `${paragraph.text}`;

        // Indent text two chars
        display.drawText(
          this.x + 4, textY + 1,
          formattedText, this.width - 6);

        // The new text y is the old y, plus 1 line for the name,
        // 1 line for the paragraph space, and an estimate of the text lines
        textY = textY + 3 + Math.ceil((this.width - 6) / paragraph.text.length);
      });
    }

    // Just normal text
    else {
      const formattedText =
        `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}` +
          `${text}`;
      display.drawText(
        this.x + 2, this.y + 2,
        formattedText, this.width - 4);
    }
  }

  renderButton(display, button, left) {
    const bracketLeft = left ? 1 : Math.round(this.width / 2) + 1;
    const bracketRight = left ? Math.round(this.width / 2) - 1 : this.width - 1;
    const buttonWidth = bracketRight - bracketLeft;
    const { startingCol, truncatedText } = text.truncateAndCenterText(
      button.label, this.x + bracketLeft, buttonWidth);

    const lineColor = button.selected ?
      this.style.borderBgColor : this.style.titleColor;
    const bgColor = button.selected ?
      this.style.titleColor : this.style.borderBgColor;

    // Button background
    const bgWhiteSpace = new Array(buttonWidth - 1).join(' ');
    const bgText = `${this.style.buttonBracketLeft}` + `${bgWhiteSpace}` +
      `${this.style.buttonBracketRight}`;
    const formattedBg = `%c{${lineColor}}%b{${bgColor}}${bgText}`;
    display.drawText(
      this.x + bracketLeft, this.y + this.height - 1,
      formattedBg, buttonWidth);

    // Button text
    const formattedText =
        `%c{${lineColor}}%b{${bgColor}}${truncatedText}`;
    display.drawText(
      startingCol, this.y + this.height - 1,
      formattedText, this.width);
  }

  inputHandler(input) {
    switch (input) {
      case 'LEFT':
        // Only allow input switching if not a single button
        if (!this.buttons.yes.selected && !this.singleButton) {
          this.buttons.yes.selected = true;
          this.buttons.no.selected = false;
        }
        break;
      case 'RIGHT':
        // Only allow input switching if not a single button
        if (!this.buttons.no.selected && !this.singleButton) {
          this.buttons.no.selected = true;
          this.buttons.yes.selected = false;
        }
        break;
      case 'ENTER':
        if (this.buttons.yes.selected) {
          this.buttons.yes.cb();
        }
        else if (this.buttons.no.selected) {
          this.buttons.no.cb();
        }
        break;
    }

    // Trigger a redraw
    this.game.refresh();
  }

  mouseHandler() {
    // Nothing
  }

  getCommands() {
    const singleButtonCommands = [
      '[↵] Select'
    ];
    const twoButtonCommands = [
      '[←→] Toggle',
      '[↵] Select'
    ];
    return this.singleButton ?
      singleButtonCommands : twoButtonCommands;
  }
}
