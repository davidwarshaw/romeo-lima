
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
  }

  inputHandler(input) {
    console.log(input);
  }
}
