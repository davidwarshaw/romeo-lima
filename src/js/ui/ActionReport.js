import properties from '../properties';
import text from '../util/text';

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
  }

  render(display) {
    super.renderBorder(display);
    if (this.title) {
      super.renderTitle(display);
    }
    this.renderMessages(display);
  }

  renderMessages(display) {
    let textY = this.y + 1;
    const messageLines = text.formatMessages(this.battleSystem.messages, this.width);
    const messageText = text.textFromMessageLines(messageLines, this.style);
    const fullText = messageText
      .slice(-1 * this.height)
      .join('\n');
    display.drawText(this.x + 1, textY, fullText);
  }

  inputHandler(input) {
    console.log(input);
  }

  mouseHandler() {
    // Nothing
  }

}
