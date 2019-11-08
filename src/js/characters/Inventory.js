import utils from '../util/utils';

export default class Inventory {
  constructor() {
    this.inventory = [];
  }

  addItem(itemName, itemDetail) {
    const numbers = this.inventory.map(item => item.number);
    const largestNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const itemNumber = largestNumber + 1;
    const newItem = Object.assign({},
      { name: itemName, number: itemNumber }, itemDetail);
    this.inventory.push(newItem);
    return itemNumber;
  }

  assignItem(itemNumber, memberNumber) {
    const { item } = this.getItemByNumber(itemNumber);

    // Only assign if item is assignable
    if (item.assignable) {

      // If another item assignable to the same slot is already assigned
      // to this member, clear it
      const itemSlot = item.slot;
      this.inventory
        .filter(item =>
          item.assigned === memberNumber && item.slot === itemSlot)
        .forEach(item => this.unassignItem(item.number));

      // Assign the item
      item.assigned = memberNumber;

      // Assigned items are inherently singular
      item.count = 1;
    }
  }

  unassignItem(itemNumber) {
    const { item } = this.getItemByNumber(itemNumber);

    // Only assign if item is assignable
    if (item.assignable) {
      item.assigned = 0;
    }
  }

  destroyItem(itemNumber) {
    const { item, i } = this.getItemByNumber(itemNumber);
    console.log(`Destroying itemNumber: ${itemNumber}: ${item.name}`);
    this.inventory.splice(i, 1);
  }

  expendAmmoForWeapon(weapon, squad) {
    console.log('inventory:');
    console.log(this.inventory);
    if (!weapon) {
      return null;
    }

    const smallArms = ['sidearm', 'rifle', 'automatic rifle', 'machine gun'];

    const smallArm = smallArms.includes(weapon.type);

    const weaponAmmoUsage = smallArm ? weapon.bursts * weapon.roundsPerBurst : 1;

    // If the weapon uses ammo, find it. Other wise the weapon is it's own ammo
    let ammoUnits = [];
    if (weapon.ammo) {
      ammoUnits = this.inventory
        .filter(item => item.type === 'ammunition' && item.name === weapon.ammo)
        .slice(0, weaponAmmoUsage);
    }
    else {
      const { item } = this.getItemByNumber(weapon.number);

      // Find the member and unassign the weapon from them
      const currentlyAssigned = squad.getByNumber(item.assigned);
      currentlyAssigned.secondary = null;

      // Unassign the item
      this.unassignItem(item.number);

      ammoUnits = [item];
    }

    const ammoExpendedCount = ammoUnits.length;

    console.log(ammoUnits);
    ammoUnits.forEach(unit => this.destroyItem(unit.number));

    console.log(`Expending ${ammoExpendedCount} of ${weaponAmmoUsage} of type ${weapon.ammo}`);
    return ammoExpendedCount;
  }

  size() {
    return this.inventory.length;
  }

  getItems() {
    return this.inventory;
  }

  getItemByNumber(number) {
    const itemPairs = this.inventory
      .map((item, i) => ({ item, i }))
      .filter(itemPair => itemPair.item.number === number);
    const { item, i } = itemPairs.length > 0 ? itemPairs[0] : { item: null, i: null };
    return { item, i };
  }

  getItemsByMemberNumber(memberNumber) {
    return this.inventory.filter(item => item.assigned === memberNumber);
  }

  getAmmoCountForWeapon(weapon) {
    if (!weapon) {
      return null;
    }

    // If the weapon doesn't take ammo, then it's its own ammo
    if (!weapon.ammo) {
      return 1;
    }
    const ammoCount = this.inventory
      .filter(item => item.type === 'ammunition' && item.name === weapon.ammo)
      .length;
    console.log('weapon:');
    console.log(weapon);
    console.log(`ammoCount: ${ammoCount}`);
    return ammoCount;
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
          case 'rifle':
            item.typeSort = 0;
            break;
          case 'automatic rifle':
            item.typeSort = 1;
            break;
          case 'sidearm':
            item.typeSort = 2;
            break;
          case 'grenade':
            item.typeSort = 3;
            break;
          case 'grenade launcher':
            item.typeSort = 4;
            break;
          case 'rocket launcher':
            item.typeSort = 5;
            break;
          case 'flame thrower':
            item.typeSort = 6;
            break;
          case 'ammunition':
            item.typeSort = 7;
            break;
          case 'medical equipment':
            item.typeSort = 8;
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
