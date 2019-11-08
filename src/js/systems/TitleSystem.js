import properties from '../properties';

import MenuState from '../states/MenuState';

export default class TitleSystem {
  constructor(game, state) {
    this.game = game;
    this.state = state;
    this.frameNumber = 0;

    // This method is passed as a callback, so must be bound
    this.goToMenuState = this.goToMenuState.bind(this);
  }

  startAnimation() {
    this.intervalId = setInterval(
      () => this.animationFrame(),
      properties.animationIntervalMillis);
  }

  goToMenuState() {
    clearInterval(this.intervalId);
    this.game.switchState(new MenuState(this.game));
  }

  animationFrame() {
    // If all animations are complete, go to the menu
    const allComplete = this.state.imageAnimations
      .every(imageAnimation => imageAnimation.complete());
    if (allComplete) {
      this.goToMenuState();
      return;
    }

    if (this.state.imageAnimations) {
      this.state.imageAnimations.forEach(imageAnimation => imageAnimation.updateFunction());
      this.game.refresh();
    }

    this.frameNumber++;
  }
}
