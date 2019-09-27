
import State from './State';

import SplashSystem from '../systems/SplashSystem';

import QuoteBox from '../ui/QuoteBox';
import ConvoQuoteBox from '../ui/ConvoQuoteBox';
import ImageBox from '../ui/ImageBox';
import ImageAnimation from '../ui/animation/ImageAnimation';
import SmokeAnimation from '../ui/animation/SmokeAnimation';
import RocketAnimation from '../ui/animation/RocketAnimation';

import sunset from '../systems/data/images/sunset.unipaint.json';
import explosion from '../systems/data/images/explosion.unipaint.json';

import helicopterFlying0 from '../systems/data/images/helicopter-flying-00.unipaint.json';
import helicopterFlying1 from '../systems/data/images/helicopter-flying-01.unipaint.json';

import helicopterSpinning0 from '../systems/data/images/helicopter-spinning-00.unipaint.json';
import helicopterSpinning1 from '../systems/data/images/helicopter-spinning-01.unipaint.json';
import helicopterSpinning2 from '../systems/data/images/helicopter-spinning-02.unipaint.json';

export default class SplashState extends State {
  constructor(game) {
    super(game);

    this.splashSystem = new SplashSystem(this.game, this, this.imageAnimations);
  }

  setUiForScene(name) {
    switch (name) {

      case 'placeTitle': {
        this.sceneWindow = new QuoteBox(this.splashSystem.nextScene, `
          1967

          Laotian-Vietnamese border

          90km west of the Gulf of Tonkin
        `);
        this.windowManager.addWindow(this.sceneWindow);
      }
        break;

      case 'sunset': {
        this.windowManager.removeWindow(this.sceneWindow.id);
        const updateFunction = function() {
          this.x++; // eslint-disable-line no-invalid-this
        };
        const rocketFunction = function() {
          this.x -= 3; // eslint-disable-line no-invalid-this
          this.y -= 3; // eslint-disable-line no-invalid-this
        };
        const helicopters = [helicopterFlying0, helicopterFlying1];
        this.imageAnimations = [];
        this.imageAnimations.push(new ImageAnimation(-10, 11, updateFunction, helicopters, sunset));
        this.imageAnimations.push(new ImageAnimation(-30, 15, updateFunction, helicopters, sunset));
        this.imageAnimations.push(new RocketAnimation(393, 313, rocketFunction, sunset));
        this.imageAnimations.push(new RocketAnimation(398, 317, rocketFunction, sunset));
        this.imageAnimations.push(new RocketAnimation(391, 310, rocketFunction, sunset));
        this.imageAnimations.push(new RocketAnimation(395, 314, rocketFunction, sunset));
        this.imageAnimations.push(new RocketAnimation(371, 309, rocketFunction, sunset));
        this.imageAnimations.push(new RocketAnimation(377, 307, rocketFunction, sunset));
        this.imageAnimations.push(new RocketAnimation(369, 310, rocketFunction, sunset));
        this.imageAnimations.push(new RocketAnimation(372, 311, rocketFunction, sunset));
        this.sceneWindow = new ImageBox(this.splashSystem.nextScene, sunset, this.imageAnimations);
        this.windowManager.addWindow(this.sceneWindow);
      }
        break;

      case 'explosion': {
        this.windowManager.removeWindow(this.sceneWindow.id);
        const helicopters = [helicopterFlying0, helicopterFlying1];
        this.imageAnimations = [];
        this.imageAnimations.push(new ImageAnimation(90, 11, () => {}, helicopters, explosion));
        this.imageAnimations.push(new ImageAnimation(70, 15, () => {}, helicopters, explosion));
        this.sceneWindow = new ImageBox(this.splashSystem.nextScene, explosion, this.imageAnimations);
        this.windowManager.addWindow(this.sceneWindow);
      }
        break;

      case 'crash': {
        this.windowManager.removeWindow(this.sceneWindow.id);
        const updateFunction = function() {
          this.y++; // eslint-disable-line no-invalid-this
          this.x += 2; // eslint-disable-line no-invalid-this
        };
        const helicopter1 = [helicopterSpinning0, helicopterSpinning1, helicopterSpinning2];
        const helicopter2 = [helicopterSpinning1, helicopterSpinning2, helicopterSpinning0];
        this.imageAnimations = [];
        this.imageAnimations.push(new ImageAnimation(90, 11, updateFunction, helicopter1, sunset));
        this.imageAnimations.push(new ImageAnimation(70, 15, updateFunction, helicopter2, sunset));
        this.imageAnimations.push(new SmokeAnimation(90, 11, updateFunction, sunset));
        this.imageAnimations.push(new SmokeAnimation(70, 15, updateFunction, sunset));
        this.sceneWindow = new ImageBox(this.splashSystem.nextScene, sunset, this.imageAnimations);
        this.windowManager.addWindow(this.sceneWindow);
      }
        break;
      case 'preBattle': {
        this.windowManager.removeWindow(this.sceneWindow.id);
        const convo = [
          'Hey! Hey! Hey! Any idea where we are?',
          'No, what?'
        ];
        this.sceneWindow = new ConvoQuoteBox(this.game, this.splashSystem.nextScene, convo);
        this.windowManager.addWindow(this.sceneWindow);
      }
        break;
      case 'contact': {
        this.windowManager.removeWindow(this.sceneWindow.id);
        this.sceneWindow = new QuoteBox(this.splashSystem.nextScene, 'Contact! Contact! Contact!');
        this.windowManager.addWindow(this.sceneWindow);
      }
        break;
    }
  }

  enter() {
    this.splashSystem.startAnimation();
  }
}
