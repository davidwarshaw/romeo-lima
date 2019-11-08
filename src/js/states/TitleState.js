
import State from './State';

import TitleSystem from '../systems/TitleSystem';

import ImageBox from '../ui/ImageBox';
import ImageAnimation from '../ui/animation/ImageAnimation';

import card01 from '../systems/data/images/card-01.unipaint.json';
import card02 from '../systems/data/images/card-02.unipaint.json';
import card03 from '../systems/data/images/card-03.unipaint.json';
import card04 from '../systems/data/images/card-04.unipaint.json';
import card05 from '../systems/data/images/card-05.unipaint.json';
import card06 from '../systems/data/images/card-06.unipaint.json';
import card07 from '../systems/data/images/card-07.unipaint.json';

import menuBackground from '../systems/data/images/menu-background.unipaint.json';

export default class TitleState extends State {
  constructor(game) {
    super(game);

    this.titleSystem = new TitleSystem(this.game, this, this.imageAnimations);

    const loop = false;
    const updateFunction = function(stopX) {
      return function() {
        if (this.x > stopX) { // eslint-disable-line no-invalid-this
          this.x -= 5; // eslint-disable-line no-invalid-this
        }
        else {
          this.frame(); // eslint-disable-line no-invalid-this
        }
      };
    };
    const cards = [card01, card02, card03, card04, card05, card06, card07];
    this.imageAnimations = [];
    this.imageAnimations.push(
      new ImageAnimation(100, 2, loop, updateFunction(10), cards, menuBackground));
    this.imageAnimations.push(
      new ImageAnimation(100, 2, loop, updateFunction(25), cards, menuBackground));
    this.imageAnimations.push(
      new ImageAnimation(100, 2, loop, updateFunction(40), cards, menuBackground));
    this.imageAnimations.push(
      new ImageAnimation(100, 2, loop, updateFunction(55), cards, menuBackground));
    this.imageAnimations.push(
      new ImageAnimation(100, 2, loop, updateFunction(70), cards, menuBackground));

    this.imageAnimations.push(
      new ImageAnimation(100, 16, loop, updateFunction(15), cards, menuBackground));
    this.imageAnimations.push(
      new ImageAnimation(100, 16, loop, updateFunction(30), cards, menuBackground));
    this.imageAnimations.push(
      new ImageAnimation(100, 16, loop, updateFunction(45), cards, menuBackground));
    this.imageAnimations.push(
      new ImageAnimation(100, 16, loop, updateFunction(60), cards, menuBackground));

    this.sceneWindow =
      new ImageBox(this.titleSystem.goToMenuState, menuBackground, this.imageAnimations);
    this.windowManager.addWindow(this.sceneWindow);
  }

  enter() {
    this.titleSystem.startAnimation();
  }
}
