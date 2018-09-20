import properties from '../properties';

import Window from './Window';

export default class SquadStatus extends Window {
  constructor(game, system) {
    super(0, properties.overworldHeight, properties.width - 1, 7, 'Squad');
    this.game = game;
    this.system = system;

    this.squad = game.playState.squad;
  }

  render(display) {
    super.renderBorder(display);
    if (this.title) {
      super.renderTitle(display);
    }
    this.renderSquad(display);
  }

  renderSquad(display) {
    this.squad.getMembersByNumber()
      .forEach((member, i) => {
        this.renderMember(display, member, i);
      });
  }

  renderMember(display, member, i) {
    // I should be overridden
    console.log(i);
  }

  inputHandler(input) {
    // I should be overridden
    console.log(input);
  }
}
