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
      this.windowManager.inputToWindow(input);
    }
  }

}
