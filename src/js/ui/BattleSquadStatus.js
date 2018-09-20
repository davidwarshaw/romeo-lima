
import SquadStatus from './SquadStatus';

export default class OverworldSquadStatus extends SquadStatus {
  constructor(game, system) {
    super(game, system);
  }

  renderMember(display, member, i) {
    const memberIsSelected =
      this.system.currentCharacter.number === member.number &&
      this.system.currentCharacter.playerControlled;
    const columnWidth = 15;
    const col = 3 + (columnWidth * i);
    const pointIndicator = member.pointman ? 'ᐃ ' : '';

    const nameColor = member.selected ?
      this.style.fieldBgColor : this.style.nameColor;
    const bgColor = member.selected ?
      this.style.nameColor : this.style.fieldBgColor;

    let statusRow = 0;

    // Name
    statusRow++;
    let formattedText =
      `%c{${nameColor}}%b{${bgColor}}` +
        `${pointIndicator}${member.rank} ${member.name}`;
    display.drawText(col, this.y + statusRow, formattedText, columnWidth);

    // Number and role
    statusRow++;
    formattedText =
      `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}` +
        `${member.number} ${member.role}`;
    display.drawText(col, this.y + statusRow, formattedText, columnWidth);

    // Weapon
    statusRow++;
    formattedText =
      `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}` +
        `${member.weapon.name}`;
    display.drawText(col, this.y + statusRow, formattedText, columnWidth);

    // Position
    if (member.prone) {
      const proneText = member.prone ? 'Prone' : 'Standing';
      statusRow++;
      formattedText =
        `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}` + proneText;
      display.drawText(col, this.y + statusRow, formattedText, columnWidth);
    }

    // If this member is selected add text for moves left or attack mode
    if (memberIsSelected) {
      let moveText = '';
      if (this.system.targetMode) {
        moveText = 'Targetting';
      }
      else if (!member.prone) {
        moveText = `Moves: ${this.system.currentCharacterMoves}`;
      }

      statusRow++;
      formattedText =
      `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}` + moveText;
      display.drawText(col, this.y + statusRow, formattedText, columnWidth);
    }

  }

  inputHandler(input) {
    console.log(input);
  }
}
