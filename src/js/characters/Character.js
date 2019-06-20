import utils from '../util/utils';

import squadProcedures from './squadProcedures';

export default class Character {

  constructor(number, definition) {
    this.number = number;

    this.playerControlled = definition.playerControlled;
    this.faction = definition.faction;
    this.rank = definition.rank;
    this.role = definition.role;
    this.marchingOrder = definition.marchingOrder;
    this.pointman = definition.pointman;

    this.stats = squadProcedures.rollStats();
    this.name = squadProcedures.nameCharacter();

    this.weapon = weapon;
    this.secondary = null;
    this.primarySelected =true;

    this.alive = true;
    this.prone = false;
    this.inBattle = false,
    this.selected = false;
  }

  // render(display, watchBrightness, map, xOffset, yOffset) {
  //   const tile = map.getTile(this.x, this.y);
  //   const glyph = this.alive ? this.overworldGlyph : this.deadGlyph;
  //   const bgAdjusted = utils.adjustBrightness(tile.bgColor, watchBrightness);
  //   display.draw(xOffset + this.x, yOffset + this.y, glyph,
  //     this.fgColor, bgAdjusted);
  // }

}
