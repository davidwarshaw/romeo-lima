import properties from '../properties';
import utils from '../util/utils';

import Window from './Window';

export default class Menu extends Window {
  constructor(game, states) {
    super(0, 0, properties.localWidth, properties.localHeight);
    
    this.game = game;
    this.states = states;

    this.pointer = 0;

    this.bgColor = '#051e3e';
  }

  render(display) {

    const menuX = 80;
    const menuY = 22;
    display.drawText(menuX, menuY,
      `%c{${this.style.titleColor}}%b{${this.bgColor}}New Game`);
    display.drawText(menuX, menuY + 2,
      `%c{${this.style.titleColor}}%b{${this.bgColor}}Intro`);
    display.drawText(menuX, menuY + 4,
      `%c{${this.style.titleColor}}%b{${this.bgColor}}Options`);
    display.drawText(menuX, menuY + 6,
      `%c{${this.style.titleColor}}%b{${this.bgColor}}Manual`);

    const pointerX = 78;
    const pointerY = menuY + (this.pointer * 2);
    display.drawText(pointerX, pointerY,
      `%c{${this.style.titleColor}}%b{${this.bgColor}}♠`);
  }

  inputHandler(input) {
    switch (input) {
      case 'UP':
        this.pointer = utils.wrap(this.pointer - 1, 0, this.states.length - 1);
        break;
      case 'DOWN':
        this.pointer = utils.wrap(this.pointer + 1, 0, this.states.length - 1);
        break;
      case 'ENTER':
        this.game.switchState(this.states[this.pointer]);
        break;
    }
    this.game.refresh();
  }

}
