import utils from '../util/utils';
import Squad from './Squad';

export default class PlayerSquad extends Squad {

  constructor(members, x, y, inventory) {
    super(members, x, y, inventory);
    this.visibleToEnemies = false;
  }

  renderSquadMembers(display, watchBrightness, map, xOffset, yOffset) {
    this.getMembersByNumber().forEach((member) => {
      const tile = map.getTile(member.x, member.y);
      const bgAdjusted = utils.adjustBrightness(tile.bgColor, watchBrightness);
      const fgColor = member.selected ? tile.bgColor : this.fgColor;
      const bgColor = member.selected ? this.fgColor : bgAdjusted;
      const glyph = member.alive ? member.number : this.deadGlyph;

      display.draw(xOffset + member.x, yOffset + member.y, glyph,
        fgColor, bgColor);
    });
  }
}
