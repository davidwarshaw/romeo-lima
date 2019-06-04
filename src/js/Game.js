import ROT from 'rot-js';

import properties from './properties';

import playState from './playState';

export default class Game {

  constructor() {
    this.display = null;
    this.currentState = null;
  }

  init() {
    this.playState = playState.createPlayState();
    this.display = new ROT.Display({
      width: properties.width,
      height: properties.height
    });
    this.display.setOptions({
      bg: '#000000',
      fontSize: properties.fontSize,

      spacing: properties.displaySpacing,
      border: properties.displayBorder
    });

    // Register listners for the events we're interested in capturing
    ['keydown', 'click', 'mouseover'].forEach((eventType) => {
      window.addEventListener(eventType, (event) => {
        this.currentState.handleInput(eventType, event);
      });
    });
  }


  switchState(state) {
    if (this.currentState !== null) {
      this.currentState.exit();
    }

    // Clear display
    this.display.clear();

    // Update current State
    this.currentState = state;
    if (!this.currentState !== null) {
      this.currentState.enter();
      this.refresh();
    }
  }


  refresh() {
    this.display.clear();
    this.currentState.render(this.display);
  }
}
