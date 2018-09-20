import utils from '../util/utils';
import Squad from './Squad';

export default class EnemySquad extends Squad {

  constructor(members, x, y) {
    super(members, x, y);

    this.overworldGlyph = 'A';
    this.fgColor = '#FF0000';
    this.bgColor = null;
  }

  renderSquadMembers(display, watchBrightness, map, xOffset, yOffset,
    playerSquadFov) {
    this.getMembersByNumber().forEach((member) => {
      const { x, y } = member;

      // Early exit if the tile the member is on is not visible
      if (!playerSquadFov.isVisible(x, y)) {
        return;
      }
      const tile = map.getTile(x, y);
      const bgAdjusted = utils.adjustBrightness(tile.bgColor, watchBrightness);
      const fgColor = member.selected ? tile.bgColor : this.fgColor;
      const bgColor = member.selected ? this.fgColor : bgAdjusted;
      const roleGlyph = member.role[0].toLowerCase();
      const glyph = member.alive ? roleGlyph : this.deadGlyph;
      display.draw(xOffset + x, yOffset + y, glyph,
        fgColor, bgColor);
    });
  }

  actionForTurn(member) {
    return {
      action: 'WAIT',
      message: {
        name: member.name,
        text: 'waits.'
      }
    };
  }
}
