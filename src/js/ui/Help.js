import properties from '../properties';
import utils from '../util/utils';

import MenuState from '../states/MenuState';

import help from '../systems/data/help/help';

import Window from './Window';

export default class Help extends Window {
  constructor(game, state) {
    super(0, 0, properties.localWidth, properties.localHeight);

    this.game = game;
    this.state = state;

    this.pointer = 0;
    this.setView();
  }

  render(display) {

    const { title, text } = help[this.pointer];

    const titleX = 35;
    const titleY = 9;
    const formattedTitle = `%c{${this.style.fieldBgColor}}%b{${this.bgColor}}${title}`;
    display.drawText(titleX, titleY, formattedTitle, this.width);

    const textX = 35;
    const textY = 15;
    const formattedText = `%c{${this.style.fieldBgColor}}%b{${this.bgColor}}${text}`;
    display.drawText(textX, textY, formattedText, this.width);
  }

  inputHandler(input) {
    console.log(input);
    switch (input) {
      case 'LEFT':
        this.pointer = utils.clamp(this.pointer - 1, 0, help.length - 1);
        break;
      case 'RIGHT':
        this.pointer = utils.clamp(this.pointer + 1, 0, help.length - 1);
        break;
      case 'ENTER/EXIT':
        this.game.switchState(new MenuState(this.game));
        break;
    }
    this.setView();
    this.game.refresh();
  }

  setView() {
    this.bgColor = '#ffffd7';
    this.state.showPage();

    // on the first page, show the cover
    const { pageType } = help[this.pointer];
    if (pageType === 'cover') {
      this.bgColor = '#ffffd7';
      this.state.showCover();

    }
    else if (pageType === 'quote') {
      this.bgColor = '#fefefe';
      this.state.showLoose();
    }
  }

  getCommands() {
    return [
      '[←] Previous Page',
      '[→] Next Page',
      '[E] Escape to Menu'
    ];
  }
}
