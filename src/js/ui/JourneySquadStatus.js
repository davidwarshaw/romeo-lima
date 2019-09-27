
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
      const weaponName = member.weapon ? member.weapon.name : 'Unarmed';
      formattedText =
      `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}` +
        `${weaponName}`;
      display.drawText(col, this.y + 3, formattedText, this.columnWidth);

      // Secondary
      const secondaryName = member.secondary ? member.secondary.name : '';
      formattedText =
      `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}` +
        `${secondaryName}`;
      display.drawText(col, this.y + 4, formattedText, this.columnWidth);


      // Stats row is two lower than secondary row, to leave room for position
      const statsRow = this.y + 6;
      super.renderStats(display, member, col, statsRow);
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

  mouseHandler() {
    // Nothing
  }

}
