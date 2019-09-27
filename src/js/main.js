import ROT from 'rot-js';

import Game from './Game.js';

import MenuState from './states/MenuState';

window.onload = () => {
  if (!ROT.isSupported()) {
    console.log('ROT.js not supported!');
  }
  else {
    const game = new Game();
    game.init();
    document
      .querySelector('#game-container')
      .appendChild(game.display.getContainer());

    game.switchState(new MenuState(game));
  }
};
