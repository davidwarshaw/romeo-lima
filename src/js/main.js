import Game from './Game.js';

import TitleState from './states/TitleState';

window.onload = () => {
  const game = new Game();
  game.init();
  document
    .querySelector('#game-container')
    .appendChild(game.display.getContainer());

  game.switchState(new TitleState(game));
};
