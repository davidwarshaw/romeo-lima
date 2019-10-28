import Game from './Game.js';

import MenuState from './states/MenuState';

window.onload = () => {
  const game = new Game();
  game.init();
  document
    .querySelector('#game-container')
    .appendChild(game.display.getContainer());

  game.switchState(new MenuState(game));
};
