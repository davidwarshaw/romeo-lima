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

    this.commandWidth = 20;
  }

  render(display) {
    super.renderBorder(display);
    if (this.title) {
      super.renderTitle(display);
    }
    this.renderCommands(display);
  }

  renderCommands(display) {
    this.windowManager.getWindowCommands()
      .forEach((command, i) => {
        const col = this.x + (this.commandWidth * i) + 1;
        const row = this.y + 1;
        const commandText =
          `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}${command}`;
        display.drawText(col, row, commandText);
      });
  }

  inputHandler() {
    // Nothing
  }

  mouseHandler(inputType, position) {
    const commands = this.windowManager.getWindowCommands();
    commands.forEach((command, i) => {
      const col = this.x + (this.commandWidth * i) + 1;
      const row = this.y + 1;
      if (position.x >= col && position.x <= col + this.commandWidth &&
        position.y === row) {
        console.log(command);
      }
    });
  }
}
