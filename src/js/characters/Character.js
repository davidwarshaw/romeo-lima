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
    // console.log(`xp: ${stat}`);
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

  hasSecondaryWeapon() {
    const weapons = ['grenage', 'grenade launcher', 'rocket launcher', 'flamethrower'];
    return this.secondary && weapons.includes(this.secondary.type);
  }

  hasSecondaryBoost() {
    const boosts = ['medical equipment', 'existence equipment'];
    return this.secondary && boosts.includes(this.secondary.type);
  }

  getAdjustedStat(stat) {
    let value = this.stats[stat].value;
    if (this.hasSecondaryBoost() && this.secondary.stat === stat) {
      value += (this.secondary.boost * this.statFactor);
    }
    return value;
  }

  getStatChance(stat) {
    //console.log(`${this.stats[stat].value} / ${this.statMax}`);
    return this.getAdjustedStat(stat) / this.statMax;
  }

  getTurnOrder() {
    return this.getAdjustedStat('presence');
  }

  getNumberOfMoves() {
    // You get half the moves as normal when prone
    const proneFactor = this.prone ? 0.50 : 1.0;
    const baseMoves = this.getAdjustedStat('aggression') / this.statFactor;
    return Math.round(proneFactor * baseMoves);
  }

  getNumberOfMeleeAttacks() {
    return Math.round(this.getAdjustedStat('presence') / this.statFactor);
  }

  getMeleeAttackChance() {
    const chance = this.getAdjustedStat('aggression') / this.statMax;
    return chance;
  }

  getMeleeVulnerableChance() {
    const chance = (this.statMax - this.getAdjustedStat('resilience')) / this.statMax;
    return chance;
  }

  getWeaponAttackChance() {
    // Attack while prone is 120% of normal
    const proneFactor = this.prone ? 1.20 : 1.0;
    const chance = proneFactor * (this.getAdjustedStat('presence') / this.statMax);
    return chance;
  }

  getWeaponVulnerableChance() {
    // Vulnerability while prone is only 60% of normal
    const proneFactor = this.prone ? 0.60 : 1.0;
    const presenceChance = (this.statMax - this.getAdjustedStat('presence')) / this.statMax;
    const resilienceChance = (this.statMax - this.getAdjustedStat('resilience')) / this.statMax;
    const chance = proneFactor * (presenceChance + resilienceChance) / 2;
    return chance;
  }

  getStatDisplayLevel(stat) {
    const value = Math.round(this.getAdjustedStat(stat) / this.statFactor);
    const max = Math.round(this.stats[stat].max / this.statFactor);
    const deficit = Math.max(0, max - value);
    const extra = Math.max(0, value - max);
    return { value, deficit, extra };
  }

  hit() {
    console.log(`hit: ${this.number} ${this.name}`);
    console.log(this.stats);
    let killed = false;

    this.stats.luck.value -= this.statFactor;
    if (this.getAdjustedStat('luck') <= 0) {
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
