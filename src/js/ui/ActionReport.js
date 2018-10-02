import properties from '../properties';

import Window from './Window';

export default class ActionReport extends Window {
  constructor(game, battleSystem) {
    super(
      0, 0,
      properties.width - properties.localWidth - 1, properties.localHeight - 1,
      'Action Report');
    this.game = game;
    this.battleSystem = battleSystem;

    this.squad = game.playState.squad;

    this.messagesToDisplay = 11;
  }

  render(display) {
    super.renderBorder(display);
    if (this.title) {
      super.renderTitle(display);
    }
    this.renderMessages(display);
  }

  renderMessages(display) {
    let textY = this.y + 2;
    const fullText = this.battleSystem.messages
      .slice(-this.messagesToDisplay)
      .map(message => {
        const formattedText =
        `%c{${this.style.nameColor}}%b{${this.style.fieldBgColor}}` +
          `${message.name} ` +
        `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}` +
          `${message.text}`;
        return formattedText;
      })
      .join('\n\n');
    display.drawText(
      this.x + 2, textY,
      fullText, this.width - 4);

    // .forEach(message => {
    //   let formattedText =
    //   `%c{${this.style.nameColor}}%b{${this.style.fieldBgColor}}` +
    //     `${message.name}`;
    //   display.drawText(
    //     this.x + 2, textY,
    //     formattedText, this.width - 4);
    //   formattedText =
    //   `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}` +
    //     `${message.text}`;
    //
    //   // Indent text two chars
    //   display.drawText(
    //     this.x + 4, textY + 1,
    //     formattedText, this.width - 6);
    //
    //   // The new text y is the old y, plus 1 line for the name,
    //   // 1 line for the paragraph space, and an estimate of the text lines
    //   textY = textY + Math.ceil((this.width - 6) / message.text.length);
    // });
  }

  inputHandler(input) {
    console.log(input);
  }
}
