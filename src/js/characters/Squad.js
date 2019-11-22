import utils from '../util/utils';

import rankOrder from './data/rankOrder.json';

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

    this.stats = ['aggression', 'resilience', 'presence', 'luck'];

    // By default, there's no vehicle
    this.vehicle = null;
  }

  addVehicle(vehicle) {
    this.vehicle = vehicle;
    this.members.push(this.vehicle);
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

  getBattleMembersByNumber() {
    return this.members
      .filter(member => member.inBattle)
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
      .filter(member => member.isAtXY(x, y));
    return members[0] || null;
  }

  getAliveByXY(x, y) {
    const members = this.members
      .filter(member => member.alive)
      .filter(member => member.isAtXY(x, y));
    return members[0] || null;
  }

  getAliveByRank() {
    return this.getAliveMembers()
      .sort((l, r) => rankOrder.indexOf(r.rank) - rankOrder.indexOf(l.rank));
  }

  getNearAliveByMember(member, distance) {
    const { x, y } = member;
    const nearMembers = this.nearMembers
      .filter(nearMember => nearMember.alive)
      .filter(nearMember => utils.tileLine(x, y, nearMember.x, nearMember.y).length <= distance);
    return nearMembers[0] || null;
  }

  numberOfAliveMembers() {
    return this.members
      .map(member => member.alive ? 1 : 0)
      .reduce((acc, l) => acc + l);
  }

  levelUp() {
    const leveledUps = this.members
      .map(member => this.stats
        .map(name => member.levelUp(name))
        .filter(leveledUp => leveledUp))
      .filter(leveledUps => leveledUps.length > 0);
    if (leveledUps.length > 0) {
      return leveledUps;
    }
    return null;
  }

  hitMemberByNumber(number) {
    console.log(`hitMemberByNumber: ${number}`);
    const member = this.getByNumber(number);
    const killed = member.hit();

    if (killed) {
      this.killMemberByNumber(number);
    }
  }

  killMemberByNumber(number) {
    console.log(`killMemberByNumber: ${number}`);
    const member = this.getByNumber(number);
    member.kill();

    this.inventory
      .getItemsByMemberNumber(member.number)
      .forEach(item => this.inventory.unassignItem(item.number));

    const aliveMembers = this.getAliveMembersByNumber();
    if (aliveMembers.length > 0) {
      aliveMembers[aliveMembers.length - 1].pointman = true;
    }

    console.log(member);
  }

  addMembersToBattle() {
    this.getAliveMembers().forEach(member => member.inBattle = true);
  }

  removeMembersFromBattle() {
    this.members.forEach(member => member.inBattle = false);
  }

  populate(text) {
    const pointman = this.getPointman();
    const restRanked = this.getAliveByRank()
      .filter(member => member.number !== pointman.number);

    const highestRanking = restRanked[0];
    const other1 = restRanked.length >= 2 ? restRanked[restRanked.length - 1] : null;
    const other2 = restRanked.length >= 3 ? restRanked[restRanked.length - 2] : null;
    const other3 = restRanked.length >= 4 ? restRanked[restRanked.length - 3] : null;

    return text
      .replace(/POINTMAN/g, this.getPointman().name)
      .replace(/LEADER/g, highestRanking.name)
      .replace(/OTHER1/g, other1.name)
      .replace(/OTHER2/g, other2.name)
      .replace(/OTHER3/g, other3.name);
  }

  populateNames(text) {
    // Check if the text is a corpus (it will be an array)
    if (Array.isArray(text)) {
      return text.map(paragraph => {
        const { name, text } = paragraph;
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
