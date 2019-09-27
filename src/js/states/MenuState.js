import properties from '../properties';

import State from './State';

import ImageBox from '../ui/ImageBox';
import ImageAnimation from '../ui/animation/ImageAnimation';
import Menu from '../ui/Menu';

import SplashState from '../states/SplashState';
import JourneyState from '../states/JourneyState';

import sunset from '../systems/data/images/sunset.unipaint.json';
import title from '../systems/data/images/title.unipaint.json';

export default class MenuState extends State {
  constructor(game) {
    super(game);

    const titleTop = 2;
    const titleLeft = Math.round((properties.width - title[0].length) / 2);

    const menuStates = [
      new JourneyState(this.game),
      new SplashState(this.game),
      new JourneyState(this.game)
    ];

    this.windowManager.addWindow(new ImageBox(null, sunset, []));
    this.windowManager.addWindow(new ImageAnimation(
      titleLeft, titleTop, () => {}, [title], sunset));
    this.windowManager.addWindow(new Menu(game, menuStates));
  }
}
