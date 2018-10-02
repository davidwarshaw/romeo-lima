import utils from '../util/utils';

export default class Inventory {
  constructor() {
    this.inventory = [];
  }

  addItem(itemName, itemDetail) {
    const itemNumber = this.inventory.length;
    const newItem = Object.assign({},
      { name: itemName, number: itemNumber }, itemDetail);
    this.inventory.push(newItem);
    return itemNumber;
  }

  assignItem(itemNumber, memberNumber) {
    const item = this.inventory[itemNumber];

    // Only assign if item is assignable
    if (item.assignable) {

      // If another item of the same type is already assigned
      // to this member, clear it
      const assignType = item.type;
      this.inventory
        .filter(item =>
          item.assigned === memberNumber && item.type === assignType)
        .forEach(item => item.assigned = 0);

      // Assign the item
      item.assigned = memberNumber;

      // Assigned items are inherently singular
      item.count = 1;
    }
  }

  size() {
    return this.inventory.length;
  }

  getItems() {
    return this.inventory;
  }
  
  getDisplayForm() {
    // Group unassigned equipment
    const groupable = this.inventory
      .filter(item => !item.assigned);
    const assigned = this.inventory
      .filter(item => item.assigned);
    const grouped = Object.values(utils.groupBy(groupable, 'name'))
      .map(group => {
        const groupedItem = group[0];
        groupedItem.count = group.length;
        return groupedItem;
      });

    // Recombine assigned and unassigned items and sort by name
    return assigned.concat(grouped)

      // Attach iem type sort
      .map(item => {
        switch(item.type) {
          case 'weapon':
            item.typeSort = 0;
            break;
          case 'ammunition':
            item.typeSort = 1;
            break;
          case 'medical equipment':
            item.typeSort = 2;
            break;
          default:
            item.typeSort = 3;
            break;
        }
        return item;
      })
      .sort((l, r) => {
        // First, sort by type
        if (l.typeSort < r.typeSort) {
          return -1;
        }
        if (l.typeSort > r.typeSort) {
          return 1;
        }

        // Then sort by name
        const lName = l.name.toUpperCase(); // ignore upper and lowercase
        const rName = r.name.toUpperCase(); // ignore upper and lowercase
        if (lName < rName) {
          return -1;
        }
        if (lName > rName) {
          return 1;
        }

        // names must be equal
        return 0;
      });
  }

}
