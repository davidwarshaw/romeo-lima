import properties from '../properties';

import WindowManager from '../ui/WindowManager';

export default class State {
  constructor(game) {
    this.game = game;
    this.windowManager = new WindowManager();

    this.keyMap = properties.keyMap;
  }

  enter() {
  }

  exit() {
  }

  render(display) {
    this.windowManager.render(display);
  }

  handleInput(inputType, inputData) {
    if (inputType === 'keydown') {
      // Get the string input code and pass to the window manager
      const input = this.keyMap[inputData.keyCode] || null;
      this.windowManager.inputToWindow(inputType, input);
    }
    else if (inputType === 'click') {
      // Get the tile coordinates of the mouse click
      const position = this.game.display.eventToPosition(event);
      this.windowManager.inputToWindow(inputType, position);
    }
    else if (inputType === 'mouseover') {
      // Get the tile coordinates of the mouseover
      const position = this.game.display.eventToPosition(event);
      this.windowManager.inputToWindow(inputType, position);
    }
  }

}
