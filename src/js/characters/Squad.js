import utils from '../util/utils';

export default class Squad {

  constructor(members, x, y, inventory) {
    this.members = members;
    this.x = x;
    this.y = y;
    this.inventory = inventory;

    this.formations = ['File', 'Abreast'];
    this.formation = this.formations[1];

    this.alive = true;

    this.overworldGlyph = 'S';
    this.deadGlyph = '%';
    this.fgColor = '#FFFFFF';
    this.bgColor = null;
  }

  getAliveMembers() {
    return this.members.filter(member => member.alive);
  }

  getMembersByNumber() {
    return this.members.sort((l, r) => l.number - r.number);
  }

  getAliveMembersByNumber() {
    return this.members
      .filter(member => member.alive)
      .sort((l, r) => l.number - r.number);
  }

  getPointman() {
    const members = this.members.filter(member => member.pointman);
    return members[0] || null;
  }

  getByRole(role) {
    const members = this.members.filter(member => member.role === role);
    return members[0] || null;
  }

  getByNumber(number) {
    const members = this.members.filter(member => member.number === number);
    return members[0] || null;
  }

  getByXY(x, y) {
    const members = this.members
      .filter(member => member.x === x && member.y === y);
    return members[0] || null;
  }

  numberOfAliveMembers() {
    return this.members
      .map(member => member.alive ? 1 : 0)
      .reduce((acc, l) => acc + l);
  }

  killMemberByNumber(number) {
    const member = this.getByNumber(number);
    member.alive = false;
    member.pointman = false;
    
    this.inventory
      .getItemsByMemberNumber(member.number)
      .forEach(item => this.inventory.unassignItem(item.number));

    const aliveMembers = this.getAliveMembersByNumber();
    if (aliveMembers.length > 0) {
      aliveMembers[aliveMembers.length - 1].pointman = true;
    }

    console.log(member);
  }

  populate(text) {
    // TODO needs formatting
    return text
      .replace('${Pointman}', this.getPointman().name)
      .replace('${Squad Lead}', this.getByRole('Squad Lead').name);
  }

  populateNames(text) {
    // Check if the text is a corpus (it will be an array)
    if (Array.isArray(text)) {
      return text.map(paragraph => {
        console.log(paragraph);
        const { name, text } = paragraph;
        console.log(this.populate(name));
        return { name: this.populate(name), text: this.populate(text) };
      });
    }

    // Just normal text
    else {
      return this.populate(text);
    }
  }

  renderSquad(display, watchBrightness, map, xOffset, yOffset) {
    const tile = map.getTile(this.x, this.y);
    const glyph = this.alive ? this.overworldGlyph : this.deadGlyph;
    const bgAdjusted = utils.adjustBrightness(tile.bgColor, watchBrightness);
    display.draw(xOffset + this.x, yOffset + this.y, glyph,
      this.fgColor, bgAdjusted);
  }

}
