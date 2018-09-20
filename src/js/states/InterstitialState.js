
import State from './State';

import QuoteBox from '../ui/QuoteBox';
import JourneyState from './JourneyState';

export default class InterstitialState extends State {
  constructor(game, text) {
    super(game);
    const quoteBox = new QuoteBox(() => this.goToNextState(), text);
    this.windowManager.addWindow(quoteBox);
  }

  goToNextState() {
    this.game.switchState(new JourneyState(this.game));
  }
}
