import properties from '../properties';
import textUtils from '../util/text';

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
    this.stats = ['aggression', 'resilience', 'presence', 'luck'];
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

  renderStats(display, member, col, row) {
    const maxlevel = 13;
    this.stats.forEach((name, i) => {
      const glyph = textUtils.glyphForName(name);
      const statLevel = member.getStatDisplayLevel(name);
      const remainingLevel = maxlevel - statLevel;

      // console.log(`name: ${name}`);
      // console.log(`i: ${i}`);
      // console.log(`row: ${row}`);
      this.renderBar(display, col, row + i, glyph, statLevel, glyph, remainingLevel);
    });
  }

  renderBar(display, col, row, full, fullValue, empty, emptyValue) {
    // console.log(`col: ${col} row: ${row}`);
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
