import properties from '../properties';

import State from './State';

import ImageBox from '../ui/ImageBox';
import ImageAnimation from '../ui/animation/ImageAnimation';
import Menu from '../ui/Menu';

import SplashState from '../states/SplashState';
import JourneyState from '../states/JourneyState';

import card07R from '../systems/data/images/card-07-R.unipaint.json';
import card07O from '../systems/data/images/card-07-O.unipaint.json';
import card07M from '../systems/data/images/card-07-M.unipaint.json';
import card07E from '../systems/data/images/card-07-E.unipaint.json';
import card07L from '../systems/data/images/card-07-L.unipaint.json';
import card07I from '../systems/data/images/card-07-I.unipaint.json';
import card07A from '../systems/data/images/card-07-A.unipaint.json';

import menuBackground from '../systems/data/images/menu-background.unipaint.json';

export default class MenuState extends State {
  constructor(game) {
    super(game);

    const menuStates = [
      new JourneyState(this.game),
      new SplashState(this.game),
      new JourneyState(this.game)
    ];

    const loop = false;
    this.imageAnimations = [];
    this.imageAnimations.push(new ImageAnimation(10, 2, loop, () => {}, [card07R], menuBackground));
    this.imageAnimations.push(new ImageAnimation(25, 2, loop, () => {}, [card07O], menuBackground));
    this.imageAnimations.push(new ImageAnimation(40, 2, loop, () => {}, [card07M], menuBackground));
    this.imageAnimations.push(new ImageAnimation(55, 2, loop, () => {}, [card07E], menuBackground));
    this.imageAnimations.push(new ImageAnimation(70, 2, loop, () => {}, [card07O], menuBackground));

    this.imageAnimations.push(new ImageAnimation(15, 16, loop, () => {}, [card07L], menuBackground));
    this.imageAnimations.push(new ImageAnimation(30, 16, loop, () => {}, [card07I], menuBackground));
    this.imageAnimations.push(new ImageAnimation(45, 16, loop, () => {}, [card07M], menuBackground));
    this.imageAnimations.push(new ImageAnimation(60, 16, loop, () => {}, [card07A], menuBackground));

    this.windowManager.addWindow(new ImageBox(null, menuBackground, this.imageAnimations));

    this.windowManager.addWindow(new Menu(game, menuStates));
  }
}
