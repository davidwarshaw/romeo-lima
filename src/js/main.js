import ROT from 'rot-js';

import Game from './Game.js';

import JourneyState from './states/JourneyState';
import InterstitialState from './states/InterstitialState';

import introText from './systems/data/introText.json';

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

    const journeyState = new JourneyState(game);
    game.switchState(new InterstitialState(game, introText.text, journeyState));
  }
};
