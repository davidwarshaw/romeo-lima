import properties from '../properties';

import State from './State';

import ImageBox from '../ui/ImageBox';
import ContextCommands from '../ui/ContextCommands';
import Help from '../ui/Help';

import fieldManualCover from '../systems/data/images/field-manual-cover.unipaint.json';
import fieldManualPage from '../systems/data/images/field-manual-page.unipaint.json';
import fieldManualLoose from '../systems/data/images/field-manual-loose.unipaint.json';

export default class HelpState extends State {
  constructor(game) {
    super(game);

    this.pageWindow = new ImageBox(() => {}, fieldManualPage, []);
    this.windowManager.addWindow(this.pageWindow);

    this.coverWindow = new ImageBox(() => {}, fieldManualCover, []);
    this.windowManager.addWindow(this.coverWindow);

    this.looseWindow = new ImageBox(() => {}, fieldManualLoose, []);
    this.windowManager.addWindow(this.looseWindow);

    this.contextCommands = new ContextCommands(game, this.windowManager);
    this.contextCommands.y = properties.height - this.contextCommands.height - 1;
    this.windowManager.addWindow(this.contextCommands);

    this.helpWindow = new Help(game, this);
    this.windowManager.addWindow(this.helpWindow);
  }

  showPage() {
    this.pageWindow.shouldRender = true;
    this.coverWindow.shouldRender = false;
    this.looseWindow.shouldRender = false;
  }

  showCover() {
    this.pageWindow.shouldRender = false;
    this.coverWindow.shouldRender = true;
    this.looseWindow.shouldRender = false;
  }

  showLoose() {
    this.pageWindow.shouldRender = false;
    this.coverWindow.shouldRender = false;
    this.looseWindow.shouldRender = true;
  }
}
