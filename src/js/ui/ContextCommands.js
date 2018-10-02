import properties from '../properties';

import Window from './Window';

export default class ContextCommands extends Window {
  constructor(game, windowManager) {
    super(
      0,
      properties.overworldHeight,
      properties.width - 1,
      2,
      'Commands');
    this.game = game;
    this.windowManager = windowManager;
  }

  render(display) {
    super.renderBorder(display);
    if (this.title) {
      super.renderTitle(display);
    }
    this.renderCommands(display);
  }

  renderCommands(display) {
    const commandWidth = 20;
    this.windowManager.getWindowCommands()
      .forEach((command, i) => {
        const col = this.x + (commandWidth * i) + 1;
        const row = this.y + 1;
        const commandText =
          `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}${command}`;
        display.drawText(col, row, commandText);
      });
  }

  inputHandler(input) {
    // I should be overridden
    console.log(input);
  }
}
