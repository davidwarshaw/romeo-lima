import properties from '../properties';
import utils from '../util/utils';

import Window from './Window';

export default class Menu extends Window {
  constructor(game, states) {
    super(0, 0, properties.localWidth, properties.localHeight);
    this.game = game;
    this.states = states;

    this.pointer = 0;

    this.bgColor = '#ffff5f';
  }

  render(display) {

    const menuX = 60;
    const menuY = 22;
    display.drawText(menuX, menuY,
      `%c{${this.style.titleColor}}%b{${this.bgColor}}New Game`);
    display.drawText(menuX, menuY + 2,
      `%c{${this.style.titleColor}}%b{${this.bgColor}}Intro`);
    display.drawText(menuX, menuY + 4,
      `%c{${this.style.titleColor}}%b{${this.bgColor}}Help`);

    const pointerX = 58;
    const pointerY = menuY + (this.pointer * 2);
    display.drawText(pointerX, pointerY,
      `%c{${this.style.titleColor}}%b{${this.bgColor}}♠`);
  }

  inputHandler(input) {
    switch (input) {
      case 'UP':
        this.pointer = utils.wrap(this.pointer - 1, 0, 2);
        break;
      case 'DOWN':
        this.pointer = utils.wrap(this.pointer + 1, 0, 2);
        break;
      case 'ENTER':
        this.game.switchState(this.states[this.pointer]);
        break;
    }
    this.game.refresh();
  }

}
