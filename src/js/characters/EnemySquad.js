import properties from '../properties';
import utils from '../util/utils';
import TileMath from '../util/TileMath';

import Squad from './Squad';

export default class EnemySquad extends Squad {

  constructor(members, x, y, inventory, overworldGlyph, overworldVisible) {
    super(members, x, y, inventory);
    this.overworldGlyph = overworldGlyph;
    this.overworldVisible = overworldVisible;

    this.fgColor = '#FF0000';
    this.bgColor = null;
  }

  renderSquadMembers(display, watchBrightness, map, xOffset, yOffset,
    playerSquadLocalFov) {
    this.getMembersByNumber().forEach((member) => {
      const { x, y } = member;

      // Early exit if the tile the member is on is not visible
      const invisibleButShown = properties.debug.showInvisibleEnemies;
      if (!playerSquadLocalFov.isVisible(x, y) && !invisibleButShown) {
        return;
      }
      const tile = map.getTile(x, y);
      const bgAdjusted = utils.adjustBrightness(tile.bgColor, watchBrightness);
      const selectionFgColor = member.selected ? tile.bgColor : this.fgColor;
      const fgColor = invisibleButShown ?
        properties.debug.invisibleEnemiesFgColor :
        selectionFgColor;
      const bgColor = member.selected ? this.fgColor : bgAdjusted;
      const roleGlyph = member.role[0].toLowerCase();
      const glyph = member.alive ? roleGlyph : this.deadGlyph;
      display.draw(xOffset + x, yOffset + y, glyph,
        fgColor, bgColor);
    });
  }

  renderSquad(display, watchBrightness, map, xOffset, yOffset,
    playerSquadOverworldFov) {
    // Early exit if the tile the member is on is not visible or the enemy
    // is not visible on the overworld map
    const tileIsVisible = playerSquadOverworldFov.isVisible(this.x, this.y);
    const invisibleButShown =
      properties.debug.showInvisibleEnemies && !this.overworldVisible;
    if (!tileIsVisible || (!this.overworldVisible && !invisibleButShown)) {
      return;
    }
    const glyph = this.alive ? this.overworldGlyph : this.deadGlyph;
    const tile = map.getTile(this.x, this.y);
    const bgAdjusted = utils.adjustBrightness(tile.bgColor, watchBrightness);
    const fgColor = invisibleButShown ?
      properties.debug.invisibleEnemiesFgColor :
      this.fgColor;
    display.draw(xOffset + this.x, yOffset + this.y, glyph,
      fgColor, bgAdjusted);
  }

  actionForTurn(member, map, enemySquadOverworldFov, playerSquad) {
    const waitAction = {
      action: 'WAIT',
      message: {
        name: member.name,
        text: 'waits.'
      }
    };
    const attackAction = {
      action: 'ATTACK',
      message: {
        name: member.name,
        text: 'attacks.'
      }
    };
    const moveAction = {
      action: 'MOVE',
      message: {
        name: member.name,
        text: 'moves.'
      }
    };

    const targettableMembers = playerSquad.members
      .filter(targetMember => targetMember.alive)
      .filter(targetMember =>
        enemySquadOverworldFov.isVisible(targetMember.x, targetMember.y));

    if (targettableMembers.length === 0) {
      return waitAction;
    }

    const targettableMemberDistances = targettableMembers
      .map(targetMember => {
        const line = TileMath.tileLine(
          member.x, member.y, targetMember.x, targetMember.y);
        const distance = line.length;
        return { targetMember, distance };
      })
      .sort((l, r) => l.distance - r.distance);

    const closestTargettableMemberDistance = targettableMemberDistances[0];

    attackAction.target = closestTargettableMemberDistance.targetMember;
    return attackAction;
  }
}
