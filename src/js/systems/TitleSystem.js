import properties from '../properties';

import MenuState from '../states/MenuState';

export default class TitleSystem {
  constructor(game, state) {
    this.game = game;
    this.state = state;
    this.frameNumber = 0;
  }

  startAnimation() {
    this.intervalId = setInterval(
      () => this.animationFrame(),
      properties.animationIntervalMillis);
  }

  animationFrame() {
    // If all animations are complete, go to the menu
    const allComplete = this.state.imageAnimations
      .every(imageAnimation => imageAnimation.complete());
    if (allComplete) {
      clearInterval(this.intervalId);
      this.game.switchState(new MenuState(this.game));
    }

    if (this.state.imageAnimations) {
      this.state.imageAnimations.forEach(imageAnimation => imageAnimation.updateFunction());
      this.game.refresh();
    }

    this.frameNumber++;
  }
}
