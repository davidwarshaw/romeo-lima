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
  }

  formatMessages() {
    const messageLines = [];
    let messageLine = { name: '', text: '' };
    let lineChar = 0;
    const addMessageLine = () => {
      messageLine.text = messageLine.text.trimEnd();
      messageLines.push(messageLine);
      messageLine = { name: '', text: '' };
      lineChar = 0;
    };

    this.battleSystem.messages.forEach((message) => {
      // console.log(`message: ${JSON.stringify(message)}`);
      message.name.split(' ').forEach(token => {
        // console.log(`token: ${JSON.stringify(token)}`);
        if (token.length >= (this.width - lineChar)) {
          addMessageLine();
        }
        messageLine.name += token + ' ';
        lineChar += token.length + 1;
      });
      message.text.split(' ').forEach(token => {
        // console.log(`token: ${JSON.stringify(token)}`);
        if (token.length >= (this.width - lineChar)) {
          addMessageLine();
        }
        messageLine.text += token + ' ';
        lineChar += token.length + 1;
      });
      addMessageLine();
    });
    messageLines.push(messageLine);

    // console.log('messageLines:');
    // console.log(`${JSON.stringify(messageLines)}`);
    return messageLines;
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
    const fullText = this.formatMessages()
      .slice(-1 * (this.height - 2))
      .map(message => {
        const formattedText =
        `%c{${this.style.nameColor}}%b{${this.style.fieldBgColor}}` +
          `${message.name}` +
        `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}` +
          `${message.text}`;
        return formattedText;
      })
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
