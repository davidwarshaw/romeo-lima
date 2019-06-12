import properties from '../properties';
import utils from '../util/utils';

import squadProcedures from './squadProcedures';

export default class Character {

  constructor(number, memberDefinition, weapon) {
    this.number = number;

    this.playerControlled = memberDefinition.playerControlled;
    this.faction = memberDefinition.faction;
    this.rank = memberDefinition.rank;
    this.role = memberDefinition.role;
    this.marchingOrder = memberDefinition.marchingOrder;
    this.pointman = memberDefinition.pointman;

    this.name = squadProcedures.nameCharacter(this.faction, this.role);

    this.weapon = weapon;
    this.secondary = null;
    this.primarySelected = true;

    this.statMax = 130;
    this.statFactor = 10;
    this.rollStats();

    this.x = null;
    this.y = null;
    this.alive = true;
    this.prone = false;
    this.inBattle = false,
    this.selected = false;
  }

  rollStats() {
    this.stats = {};
    this.stats.aggression = this.rollStat();
    this.stats.resilience = this.rollStat();
    this.stats.presence = this.rollStat();
    this.stats.luck = this.rollStat();
  }

  rollStat() {
    const raw = properties.rng.getNormal(this.statMax * (2 / 5), this.statFactor);
    return utils.clamp(raw, 0, this.statMax);
  }

  isAtXY(x, y) {
    return x === this.x && y === this.y;
  }

  getTurnOrder() {
    return this.stats.presence;
  }

  getNumberOfMoves() {
    return Math.round(this.stats.aggression / this.statFactor);
  }

  getNumberOfMeleeAttacs() {
    return Math.round(this.stats.presence / this.statFactor);
  }

  getMeleeAttackChance() {
    const chance = this.stats.aggression / this.statMax;
    return chance;
  }

  getMeleeVulnerableChance() {
    const chance = (this.statMax - this.stats.resilience) / this.statMax;
    return chance;
  }

  getWeaponAttackChance() {
    const chance = this.stats.presence / this.statMax;
    return chance;
  }

  getWeaponVulnerableChance() {
    const presenceChance = (this.statMax - this.stats.presence) / this.statMax;
    const resilienceChance = (this.statMax - this.stats.resilience) / this.statMax;
    const chance = (presenceChance + resilienceChance) / 2;
    return chance;
  }

  getStatDisplayLevel(stat) {
    return Math.round(this.stats[stat] / this.statFactor);
  }

  hit() {
    console.log(`hit: ${this.number} ${this.name}`);
    console.log(this.stats);
    let killed = false;

    this.stats.luck -= this.statFactor;
    if (this.stats.luck <= 0) {
      this.stats.luck = 0;
      killed = true;
    }

    return killed;
  }

  kill() {
    console.log(`killed: ${this.number} ${this.name}`);
    this.alive = false;
    this.pointman = false;
  }

  // render(display, watchBrightness, map, xOffset, yOffset) {
  //   const tile = map.getTile(this.x, this.y);
  //   const glyph = this.alive ? this.overworldGlyph : this.deadGlyph;
  //   const bgAdjusted = utils.adjustBrightness(tile.bgColor, watchBrightness);
  //   display.draw(xOffset + this.x, yOffset + this.y, glyph,
  //     this.fgColor, bgAdjusted);
  // }

}
