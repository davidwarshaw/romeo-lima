import properties from '../properties';
import utils from '../util/utils';

import Window from './Window';

export default class OrdersModal extends Window {
  constructor(game, system, exitCb) {
    const width = 90;
    const height = 14;
    const x = Math.round((properties.width - width) / 2);
    const y = Math.round((properties.height - height) / 2);
    super(x, y, width, height, 'Inventory');
    this.game = game;
    this.system = system;
    this.exitCb = exitCb;

    this.squad = game.playState.squad;

    this.listCol = this.x + 1;
    this.countCol = this.listCol + 25;
    this.nameCol = this.countCol + 4;
    this.detailCol = this.nameCol + 18;

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
    const inventoryDisplayForm = this.squad.inventory.getDisplayForm();
    const windowHalfHeight = Math.floor((this.height - 1) / 2);
    const maxOffset = utils.clamp(inventoryDisplayForm.length - this.height + 1,
      0, inventoryDisplayForm.length);
    const offset = utils.clamp(this.listIndex - windowHalfHeight,
      0, maxOffset);
    const from = offset;
    const to = utils.clamp(this.height - 1 + offset,
      0, inventoryDisplayForm.length);

    inventoryDisplayForm
      .slice(from, to)
      .forEach((item, i) => {
        const itemSelected = this.listIndex === i + offset;
        const textColor = itemSelected ?
          this.style.fieldBgColor : this.style.textColor;
        const nameColor = itemSelected ?
          this.style.fieldBgColor : this.style.nameColor;
        const bgColor = itemSelected ?
          this.style.textColor : this.style.fieldBgColor;

        let formattedText =
          `%c{${textColor}}%b{${bgColor}}${item.name}`;
        display.drawText(this.listCol, this.y + 1 + i, formattedText);

        // If there are more than one of the item, ahow a count
        if (item.count > 1) {
          formattedText =
          `%c{${textColor}}%b{${bgColor}}${item.count}`;
          display.drawText(this.countCol, this.y + 1 + i, formattedText);
        }

        // If the item is assignable, show who, if anyone, it's assigned to
        if (item.assignable) {
          let assignment = 'unassigned';

          // Cast to integer
          const assignedNumber = Number(item.assigned);

          // If it's assignable and assigned to a member, show the member
          if (assignedNumber > 0) {
            const member = this.squad.getByNumber(assignedNumber);
            assignment = `${member.number} ${member.name}`;
          }

          const padding = ' '
            .repeat(this.detailCol - this.nameCol - assignment.length - 4);
          const assignmentText = `[${assignment}${padding}]`;
          formattedText =
            `%c{${nameColor}}%b{${bgColor}}${assignmentText}`;
          display.drawText(this.nameCol, this.y + 1 + i, formattedText);
        }
      });
  }

  renderDetail(display) {
    const inventoryDisplayForm = this.squad.inventory.getDisplayForm();
    const item = inventoryDisplayForm[this.listIndex];
    const burstWord = item.bursts === 1 ? 'burst' : 'bursts';
    const name =
      `${item.name}\n\n`;
    const body =
      `${item.type}, ${item.faction}\n\n` +
      `${item.description}\n\n`;

    // Weapon body is blank for non weapons
    const weaponBody = item.type === 'weapon' ?
      `${burstWord}: ${item.bursts}\n` +
      `rounds per burst: ${item.roundsPerBurst}\n` +
      `power: ${item.power}\n` +
      `accuracy: ${item.accuracy}` :
      '';
    const formattedText =
      `%c{${this.style.nameColor}}%b{${this.style.fieldBgColor}}${name}` +
      `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}${body}` +
      `%c{${this.style.textColor}}%b{${this.style.fieldBgColor}}${weaponBody}`;
    const detailWidth = (this.width + this.x) - this.detailCol - 1;
    display.drawText(
      this.detailCol + 1, this.y + 2, formattedText, detailWidth);
  }

  inputHandler(input) {
    const inventoryDisplayForm = this.squad.inventory.getDisplayForm();
    const itemNumber = inventoryDisplayForm[this.listIndex].number;
    switch (input) {
      case 'UP':
        this.listIndex =
          utils.clamp(this.listIndex - 1, 0, inventoryDisplayForm.length - 1);
        break;
      case 'DOWN':
        this.listIndex =
          utils.clamp(this.listIndex + 1, 0, inventoryDisplayForm.length - 1);
        break;
      case 'INVENTORY':
        this.exitCb();
        break;
      case 'NUM_1':
        this.squad.inventory.assignItem(itemNumber, 1);
        break;
      case 'NUM_2':
        this.squad.inventory.assignItem(itemNumber, 2);
        break;
      case 'NUM_3':
        this.squad.inventory.assignItem(itemNumber, 3);
        break;
      case 'NUM_4':
        this.squad.inventory.assignItem(itemNumber, 4);
        break;
      case 'NUM_5':
        this.squad.inventory.assignItem(itemNumber, 5);
        break;
      case 'NUM_6':
        this.squad.inventory.assignItem(itemNumber, 6);
        break;
      case 'NUM_7':
        this.squad.inventory.assignItem(itemNumber, 7);
        break;
      case 'NUM_8':
        this.squad.inventory.assignItem(itemNumber, 8);
        break;
    }

    // Trigger a redraw
    this.game.refresh();
  }

  mouseHandler() {
    // Nothing
  }

}
