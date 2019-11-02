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
        properties.contextCommandsHeight - 1);
    this.game = game;
    this.system = system;

    this.squad = game.playState.squad;

    this.columnWidth = 15;
    this.columnPadding = 3;

    this.pointmanGlyph = 'ᐃ';
    this.stats = ['aggression', 'resilience', 'presence', 'luck'];
  }

  render(display) {
    const { day, watch } = this.game.playState;
    const dateLine = textUtils.dateLine(day, watch);
    this.title = `Squad ◷ ${dateLine}`;
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
      const { value, deficit, extra } = member.getStatDisplayLevel(name);
      const remaining = maxlevel - extra - deficit - value;

      // console.log(`name: ${name}`);
      // console.log(`i: ${i}`);
      // console.log(`row: ${row}`);
      this.renderBar(display, col, row + i, glyph, value, deficit, extra, remaining);
    });
  }

  renderBar(display, col, row, glyph, value, deficit, extra, remaining) {
    // console.log(`col: ${col} row: ${row}`);
    const valueBar = glyph.repeat(value);
    const deficitBar = glyph.repeat(deficit);
    const extraBar = glyph.repeat(extra);
    const remainingBar = glyph.repeat(remaining);
    let formattedText =
      `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}${valueBar}` +
      `%c{${this.style.lineColor}}%b{${this.style.fieldBgColor}}${deficitBar}` +
      `%c{${this.style.titleColor}}%b{${this.style.fieldBgColor}}${extraBar}` +
      `%c{${this.style.inactiveTextColor}}%b{${this.style.fieldBgColor}}${remainingBar}`;
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
