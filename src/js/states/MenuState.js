import State from './State';

import Window from '../ui/Window';

export default class MenuState extends State {
  constructor(game) {
    super(game);

    const menu1 = new Window(game, 5, 5, 20, 12, 'Menu 1');
    const menu2 = new Window(game, 7, 7, 22, 16, 'Menu 2');
    this.windowManager.addWindow(menu1);
    this.windowManager.addWindow(menu2);
  }

}
