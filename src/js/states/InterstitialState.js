
import State from './State';

import QuoteBox from '../ui/QuoteBox';

export default class InterstitialState extends State {
  constructor(game, text, nextState) {
    super(game);
    this.nextState = nextState;
    const quoteBox = new QuoteBox(() => this.goToNextState(), text);
    this.windowManager.addWindow(quoteBox);
  }

  goToNextState() {
    this.game.switchState(this.nextState);
  }
}
