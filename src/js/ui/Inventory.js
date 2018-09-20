import properties from '../properties';
import utils from '../util/utils';

import Window from './Window';

export default class Inventory extends Window {
  constructor(game, system, exitCb) {
    const width = 80;
    const height = 20;
    const x = Math.round((properties.width - width) / 2);
    const y = Math.round((properties.height - height) / 2);
    super(x, y, width, height, 'Inventory');
    this.game = game;
    this.system = system;
    this.exitCb = exitCb;

    this.squad = game.playState.squad;

    this.listCol = this.x + 1;
    this.nameCol = this.listCol + 10;
    this.detailCol = this.nameCol + 20;

    this.maxDisplayedItems = height - 2;
    this.listIndex = 0;
  }

  render(display) {
    super.renderBorder(display);
    if (this.title) {
      super.renderTitle(display);
    }
    this.renderList(display);
    this.renderDetail(display);

    this.renderSeparator(display);
  }

  renderSeparator(display) {
    const col = this.detailCol - 1;
    const fgColor = this.style.lineColor;
    const bgColor = this.style.borderBgColor;
    for (let row = 0; row <= this.height; row++) {
      let char = this.style.verticalChar;
      if (row === 0) {
        char = this.style.downAnd;
      }
      else if (row === this.height) {
        char = this.style.upAnd;
      }
      display.draw(col, this.y + row, char, fgColor, bgColor);
    }
  }

  renderList(display) {
    this.squad.getSortedInventory()
      .forEach((item, i) => {
        const itemSelected = this.listIndex === i;
        const textColor = itemSelected ?
          this.style.fieldBgColor : this.style.textColor;
        const bgColor = itemSelected ?
          this.style.textColor : this.style.fieldBgColor;
        let formattedText =
          `%c{${textColor}}%b{${bgColor}}${item.name}`;
        display.drawText(this.listCol, this.y + 1 + i, formattedText);

        const member = this.squad.getByNumber(item.memberNumber);
        if (member) {
          const assignment = `${member.number} ${member.role}`;
          const padding = ' '
            .repeat(this.detailCol - this.nameCol - assignment.length - 4);
          formattedText =
            `%c{${this.style.nameColor}}%b{${this.style.fieldBgColor}}` +
            `[${assignment}${padding}]`;
          display.drawText(this.nameCol, this.y + 1 + i, formattedText);
        }
      });
  }

  renderDetail(display) {
    const item = this.squad.getSortedInventory()[this.listIndex];
    const burstWord = item.bursts === 1 ? 'burst' : 'bursts';
    const name =
      `${item.name}\n`;
    const body =
      `${item.faction} ${item.type}\n` +
      `${item.description}\n\n` +
      `${burstWord}: ${item.bursts}\n` +
      `rounds per burst: ${item.roundsPerBurst}\n` +
      `power: ${item.power}\n` +
      `accuracy: ${item.accuracy}`;
    const formattedText =
      `%c{${this.style.nameColor}}%b{${this.style.fieldBgColor}}${name}` +
      `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}${body}`;
    const detailWidth = (this.width + this.x) - this.detailCol - 1;
    display.drawText(
      this.detailCol + 1, this.y + 2, formattedText, detailWidth);
  }

  inputHandler(input) {
    switch (input) {
      case 'UP':
        this.listIndex =
          utils.clamp(this.listIndex - 1, 0, this.squad.inventory.length - 1);
        break;
      case 'DOWN':
        this.listIndex =
          utils.clamp(this.listIndex + 1, 0, this.squad.inventory.length - 1);
        break;
      case 'INVENTORY':
        this.exitCb();
        break;
    }

    // Trigger a redraw
    this.game.refresh();
  }
}
