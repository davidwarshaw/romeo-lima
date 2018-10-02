export default class WindowManager {
  constructor(game) {
    this.game = game;
    this.windows = [];
    this.currentId = 0;
  }

  render(display) {
    this.windows.forEach(window => window.render(display));
  }

  addWindow(window) {
    const id = this.currentId;
    this.currentId++;
    window.id = id;
    this.windows.push(window);
  }

  removeWindow(id) {
    const index = this.windows.findIndex(window => window.id === id);
    this.windows.splice(index, 1);
  }

  focusWindow() {
    return this.windows[this.windows.length - 1];
  }

  inputToWindow(input) {

    // If there is a window with focus, pass it the input
    const focusWindow = this.focusWindow();
    if (focusWindow) {
      focusWindow.inputHandler(input);
    }
  }

  getWindowCommands() {
    return this.focusWindow().getCommands();
  }
}
