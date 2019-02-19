
import SquadStatus from './SquadStatus';

export default class JourneySquadStatus extends SquadStatus {
  constructor(game, system) {
    super(game, system);
  }

  renderMember(display, member, i) {
    const col = this.columnPadding + (this.columnWidth * i);
    const pointIndicator = member.pointman ? this.pointmanGlyph : '';

    // If member is alive show more detail
    if (member.alive) {

    // Name
      let formattedText =
      `%c{${this.style.nameColor}}%b{${this.style.fieldBgColor}}` +
        `${pointIndicator}${member.rank} ${member.name}`;
      display.drawText(col, this.y + 1, formattedText, this.columnWidth);

      // Number and role
      formattedText =
      `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}` +
        `${member.number} ${member.role}`;
      display.drawText(col, this.y + 2, formattedText, this.columnWidth);

      // Weapon
      formattedText =
      `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}` +
        `${member.weapon.name}`;
      display.drawText(col, this.y + 3, formattedText, this.columnWidth);

      // Stats row is two lower than weapon row, to leve room for position
      const statsRow = this.y + 5;
      super.renderStats(display, member, i, col, statsRow);
    }
    else {

    // Name
      let formattedText =
      `%c{${this.style.inactiveTextColor}}%b{${this.style.fieldBgColor}}` +
        `${pointIndicator}${member.rank} ${member.name}`;
      display.drawText(col, this.y + 1, formattedText, this.columnWidth);

      // Is member is not alive, show KIA instead of stats
      formattedText =
      `%c{${this.style.inactiveTextColor}}%b{${this.style.fieldBgColor}}` +
        'KIA';
      display.drawText(col, this.y + 2, formattedText, this.columnWidth);
    }
  }

  inputHandler(input) {
    console.log(input);
  }
}
