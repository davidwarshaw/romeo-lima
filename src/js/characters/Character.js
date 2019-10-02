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
    ['aggression', 'resilience', 'presence', 'luck']
      .forEach(name => {
        const roll = this.rollStat();
        this.stats[name] = { max: roll, value: roll, xp: 0, level: 0 };
      });
  }

  rollStat() {
    const raw = properties.rng.getNormal(this.statMax * (2 / 5), this.statFactor);
    return utils.clamp(raw, 0, this.statMax);
  }

  xp(stat) {
    this.stats[stat].xp += 1;
  }

  levelUp(stat) {
    const { value, xp } = this.stats[stat];
    const newValue = Math.floor(Math.log(xp + 1) * 2.5);
    if (newValue > value) {
      this.stats[stat].value = newValue;
      this.stats.luck.value = this.stats.luck.max;
      return { name: this.name, stat, value, newValue };
    }
    return null;
  }

  isAtXY(x, y) {
    return x === this.x && y === this.y;
  }

  getTurnOrder() {
    return this.stats.presence.value;
  }

  getNumberOfMoves() {
    return Math.round(this.stats.aggression.value / this.statFactor);
  }

  getNumberOfMeleeAttacks() {
    return Math.round(this.stats.presence.value / this.statFactor);
  }

  getMeleeAttackChance() {
    const chance = this.stats.aggression.value / this.statMax;
    return chance;
  }

  getMeleeVulnerableChance() {
    const chance = (this.statMax - this.stats.resilience.value) / this.statMax;
    return chance;
  }

  getWeaponAttackChance() {
    const chance = this.stats.presence.value / this.statMax;
    return chance;
  }

  getWeaponVulnerableChance() {
    const presenceChance = (this.statMax - this.stats.presence.value) / this.statMax;
    const resilienceChance = (this.statMax - this.stats.resilience.value) / this.statMax;
    const chance = (presenceChance + resilienceChance) / 2;
    return chance;
  }

  getStatDisplayLevel(stat) {
    return Math.round(this.stats[stat].value / this.statFactor);
  }

  hit() {
    console.log(`hit: ${this.number} ${this.name}`);
    console.log(this.stats);
    let killed = false;

    this.stats.luck.value -= this.statFactor;
    if (this.stats.luck.value <= 0) {
      this.stats.luck.value = 0;
      killed = true;
    }

    return killed;
  }

  kill() {
    console.log(`killed: ${this.number} ${this.name}`);
    this.alive = false;
    this.pointman = false;
  }

}
