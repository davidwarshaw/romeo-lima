import ROT from 'rot-js';

import State from './State';
import JourneyState from './JourneyState';

export default class SplashState extends State {
  constructor(game) {
    super(game);
  }

  render(display) {
    display.drawText(1, 1, '%c{yellow} Javascript Roguelike');
    display.drawText(1, 2, 'Press Enter to Start!');
  }

  handleInput(inputType, inputData) {
    if (inputType === 'keydown') {
      if (inputData.keyCode === ROT.VK_RETURN) {
        this.game.switchState(new JourneyState(this.game));
      }
    }
  }
}
