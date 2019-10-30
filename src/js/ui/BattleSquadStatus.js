
import SquadStatus from './SquadStatus';

export default class OverworldSquadStatus extends SquadStatus {
  constructor(game, system) {
    super(game, system);
  }

  renderMember(display, member, i) {
    const memberIsSelected =
      this.system.currentCharacter.number === member.number &&
      this.system.currentCharacter.playerControlled;
    const col = this.columnPadding + (this.columnWidth * i);
    const pointIndicator = member.pointman ? this.pointmanGlyph : '';

    const nameColor = member.selected ?
      this.style.fieldBgColor : this.style.nameColor;
    const bgColor = member.selected ?
      this.style.nameColor : this.style.fieldBgColor;

    const primaryWeaponFgColor = member.primarySelected ?
      this.style.fieldBgColor : this.style.textColor;
    const primaryWeaponBgColor = member.primarySelected ?
      this.style.textColor : this.style.fieldBgColor;

    // If member is alive show more detail
    if (member.alive) {

      // Name
      let formattedText =
        `%c{${nameColor}}%b{${bgColor}}` +
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
      `%c{${primaryWeaponFgColor}}%b{${primaryWeaponBgColor}}` +
        `${weaponName}`;
      display.drawText(col, this.y + 3, formattedText, this.columnWidth);

      // Secondary
      const secondaryName = member.secondary ? member.secondary.name : '';
      formattedText =
      `%c{${primaryWeaponBgColor}}%b{${primaryWeaponFgColor}}` +
        `${secondaryName}`;
      display.drawText(col, this.y + 4, formattedText, this.columnWidth);

      // Position
      if (member.prone) {
        const proneText = member.prone ? 'Prone' : 'Standing';
        formattedText =
          `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}` +
          proneText;
        display.drawText(col, this.y + 5, formattedText, this.columnWidth);
      }

      // If this member is selected add text for moves left or attack mode
      if (memberIsSelected) {
        let moveText = '';
        if (this.system.targetMode) {
          moveText = 'Targetting';
        }
        else {
          const moveType = member.prone ? 'Crawl' : 'Move';
          moveText = `${moveType}: ${this.system.currentCharacterMoves}`;
        }
        formattedText =
        `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}` + moveText;
        display.drawText(col, this.y + 5, formattedText, this.columnWidth);
      }

      super.renderStats(display, member, col, this.y + 6);
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
