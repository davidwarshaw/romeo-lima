import properties from '../properties';

import JourneyState from '../states/JourneyState';

export default class SplashSystem {
  constructor(game, state) {
    this.game = game;
    this.state = state;
    this.frameNumber = 0;

    // Start this at -1 so it can be ticked forward
    this.sceneIndex = -1;

    this.scene = [
      { name: 'placeTitle', length: 30 },
      { name: 'sunset', length: 99 },
      { name: 'explosion', length: 1 },
      { name: 'crash', length: 20 },
      { name: 'preBattle', length: 30 },
      { name: 'contact', length: 30 }
    ];

    // This method is passed as a callback, so must be bound
    this.nextScene = this.nextScene.bind(this);
  }

  startAnimation() {
    this.intervalId = setInterval(
      () => this.animationFrame(),
      properties.animationIntervalMillis);
    this.nextScene();
  }

  nextScene() {
    this.frameNumber = 0;
    this.sceneIndex++;
    if (this.sceneIndex < this.scene.length) {
      this.state.setUiForScene(this.scene[this.sceneIndex].name);
      this.game.refresh();
    }
    else {
      clearInterval(this.intervalId);
      this.game.switchState(new JourneyState(this.game));
    }
  }

  animationFrame() {
    if (this.frameNumber > this.scene[this.sceneIndex].length) {
      this.nextScene();
    }

    if (this.state.imageAnimations) {
      this.state.imageAnimations.forEach(imageAnimation => imageAnimation.updateFunction());
      this.state.imageAnimations.forEach(imageAnimation => imageAnimation.frame());
      this.game.refresh();
    }

    this.frameNumber++;
  }
}
