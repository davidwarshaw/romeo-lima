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

  renderText(display, messages) {
    // Check if the text is a corpus (it will be an array)
    if (Array.isArray(messages)) {
      let textY = this.y + 2;
      const messageLines = text.formatMessages(messages, this.width);
      const messageText = text.textFromMessageLines(messageLines, this.style);
      const fullText = messageText
        .join('\n\n');
      display.drawText(this.x + 2, textY, fullText);
    }

    // Just normal text
    else {
      const formattedText =
        `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}` +
          `${messages}`;
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
