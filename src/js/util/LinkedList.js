export default class LinkedList {
  constructor() {
    this.head = null;
  }
  tail() {
    let node = this.head;
    while (node && node.next !== null) {
      node = node.next;
    }
    return node;
  }
  addToBegining(item) {
    const node = { item, next: this.head };
    this.head = node;
  }
  addToEnd(item) {
    const node = { item, next: null };
    const tail = this.tail();
    if (tail) {
      tail.next = node;
    }
    else {
      this.head = node;
    }
  }
  findById(id) {
    let node = this.head;
    while (node && node.next !== null) {
      if (node.item.id === id) {
        return node;
      }
      node = node.next;
    }
    return null;
  }
  removeFromBegining() {
    const node = this.head;
    this.head = node.next || null;
    return node;
  }
  removeFromEnd() {
    let node = this.head;
    let prevNode = null;
    while (node && node.next !== null) {
      prevNode = node;
      node = node.next;
    }
    prevNode.next = null;
    return node;
  }
}
