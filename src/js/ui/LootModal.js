import properties from '../properties';
import utils from '../util/utils';

import Window from './Window';

export default class LootModal extends Window {
  constructor(game, system, exitCb, inventory) {
    const width = 48;
    const height = 16;
    const x = Math.round((properties.width - width) / 2);
    const y = Math.round((properties.height - height) / 2) - 3;
    super(x, y, width, height, 'Scavenged');
    this.game = game;
    this.system = system;
    this.exitCb = exitCb;
    this.inventory = inventory;

    // Track whether an item is dropped or taken
    this.dropItem = new Array(inventory.size()).fill(true);

    this.listCol = this.x + 1;
    this.countCol = this.listCol + 22;
    this.nameCol = this.countCol + 7;

    this.maxDisplayedItems = height - 2;
    this.listIndex = 0;
  }

  render(display) {
    super.renderBorder(display);
    if (this.title) {
      super.renderTitle(display);
    }
    this.renderList(display);
  }

  renderList(display) {
    const inventoryDisplayForm = this.inventory.getDisplayForm();
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
          `%c{${textColor}}%b{${bgColor}}(${item.count})`;
          display.drawText(this.countCol, this.y + 1 + i, formattedText);
        }

        // Show whether the item whould be taken or dropped
        const dropOrTake = this.dropItem[i + offset] ? 'Leave' : 'Take';
        const padding = ' '
          .repeat((this.width + this.x) - this.nameCol - dropOrTake.length - 2);
        const assignmentText = `[${dropOrTake}${padding}]`;
        formattedText =
          `%c{${nameColor}}%b{${bgColor}}${assignmentText}`;
        display.drawText(this.nameCol, this.y + 1 + i, formattedText);
      });
  }

  inputHandler(input) {
    const inventoryDisplayForm = this.inventory.getDisplayForm();

    switch (input) {
      case 'UP':
        this.listIndex =
          utils.clamp(this.listIndex - 1, 0, inventoryDisplayForm.length - 1);
        break;
      case 'DOWN':
        this.listIndex =
          utils.clamp(this.listIndex + 1, 0, inventoryDisplayForm.length - 1);
        break;
      case 'ENTER':
        this.dropItem[this.listIndex] = !this.dropItem[this.listIndex];

        // Toggling should move the list down one
        this.listIndex =
          utils.clamp(this.listIndex + 1, 0, inventoryDisplayForm.length - 1);
        break;
      case 'INVENTORY':
        // Add selected inventory to squad inventory
        this.inventory.getDisplayForm()
          .filter((item, i) => !this.dropItem[i])
          .forEach(item => {
            // Unassign the item before transfer
            item.assigned = null;

            // If there are more than one of the item, take them all
            [...Array(item.count).keys()]
              .forEach(() => this.system.playerSquad.inventory
                .addItem(item.name, item));
          });
        this.exitCb();
        break;
    }

    // Trigger a redraw
    this.game.refresh();
  }

  mouseHandler() {
    // Nothing
  }

  getCommands() {
    return [
      '[↑↓] Scroll',
      '[↵] Assign/Unassign',
      '[I] Close'
    ];
  }
}
