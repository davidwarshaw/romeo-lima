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

    let bindEventToState = (event) => {
      window.addEventListener(event, (e) => {
        this.currentState.handleInput(event, e);
      });
    };

    bindEventToState('keydown');
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
