import properties from '../properties';

import Window from './Window';

export default class SquadStatus extends Window {
  constructor(game, system) {
    super(
      0,
      properties.overworldHeight + properties.contextCommandsHeight,
      properties.width - 1,
      properties.height - properties.overworldHeight -
        properties.contextCommandsHeight - 1,
      'Squad');
    this.game = game;
    this.system = system;

    this.squad = game.playState.squad;

    this.columnWidth = 15;
    this.columnPadding = 3;

    this.pointmanGlyph = 'ᐃ';
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

  renderStats(display, member, i, col, row) {
    this.renderBar(display, col, row, '♠', 10, '♠', 3);
    this.renderBar(display, col, row + 1, '♥', 13, '♥', 0);
    this.renderBar(display, col, row + 2, '♣', 13, '♣', 0);
    this.renderBar(display, col, row + 3, '♦', 13, '♦', 0);
  }

  renderBar(display, col, row, full, fullValue, empty, emptyValue) {
    const fullBar = full.repeat(fullValue);
    const emptyBar = empty.repeat(emptyValue);
    let formattedText =
      `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}${fullBar}` +
      `%c{${this.style.lineColor}}%b{${this.style.fieldBgColor}}${emptyBar}`;
    display.drawText(col, row, formattedText);
  }

  inputHandler(input) {
    // I should be overridden
    console.log(input);
  }

  mouseHandler() {
    // Nothing
  }

}
