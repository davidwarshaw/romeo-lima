
import SquadStatus from './SquadStatus';

export default class JourneySquadStatus extends SquadStatus {
  constructor(game, system) {
    super(game, system);
  }

  renderMember(display, member, i) {
    const columnWidth = 15;
    const col = 3 + (columnWidth * i);
    const pointIndicator = member.pointman ? 'ᐃ ' : '';

    // Name
    let formattedText =
      `%c{${this.style.nameColor}}%b{${this.style.fieldBgColor}}` +
        `${pointIndicator}${member.rank} ${member.name}`;
    display.drawText(col, this.y + 1, formattedText, columnWidth);

    // Number and role
    formattedText =
      `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}` +
        `${member.number} ${member.role}`;
    display.drawText(col, this.y + 2, formattedText, columnWidth);

    // Weapon
    formattedText =
      `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}` +
        `${member.weapon.name}`;
    display.drawText(col, this.y + 3, formattedText, columnWidth);

    // Stats row is two lower than weapon row, to leve room for position
    const statsRow = this.y + 5;
    super.renderStats(display, member, i, col, statsRow);
  }

  inputHandler(input) {
    console.log(input);
  }
}
