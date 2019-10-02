import properties from '../properties';
import utils from '../util/utils';
import TileMath from '../util/TileMath';

import LocalFov from '../maps/LocalFov';
import AStar from '../maps/AStar';

import Squad from './Squad';

export default class EnemySquad extends Squad {

  constructor(members, x, y, inventory, overworldGlyph, overworldVisible) {
    super(members, x, y, inventory);
    this.overworldGlyph = overworldGlyph;
    this.overworldVisible = overworldVisible;

    this.coverMap = null;

    this.fgColor = '#FF0000';
    this.bgColor = null;

  }

  renderSquadMembers(display, watchBrightness, map, xOffset, yOffset,
    playerSquadLocalFov) {
    this.getBattleMembersByNumber().forEach((member) => {
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

    // If there's a vehicle, render it
    if (this.vehicle) {
      this.vehicle.render(display, watchBrightness, map, xOffset, yOffset,
        playerSquadLocalFov);
    }
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

  initCoverMap(map, playerSquadMembers) {
    // The cover map is just an FOV that uses cover instead of concealment
    this.coverMap = new LocalFov(
      map, playerSquadMembers, properties.fovCoverThreshold, 'cover');
  }

  actionForTurn(
    member, numberOfMoves, map, enemySquadOverworldFov, playerSquad) {

    this.coverMap.recalculate();
    this.astar = new AStar(map, playerSquad, this);

    const waitAction = {
      action: 'WAIT',
      message: {
        name: member.name,
        text: 'waits'
      }
    };
    const attackAction = {
      action: 'ATTACK',
      message: {
        name: member.name,
        text: 'attacks'
      }
    };
    const moveAction = {
      action: 'MOVE',
      message: {
        name: member.name,
        text: 'moves'
      }
    };

    const uncovered = this.coverMap.isVisible(member.x, member.y);
    const coveredReachableTilesByDistance = Object.values(map)
      .filter(tile => !this.coverMap.isVisible(tile.x, tile.y))
      .filter(tile =>
        TileMath.tileLine(member.x, member.y, tile.x, tile.y).length <= numberOfMoves * 2)
      .map((tile) => {
        const path = this.astar.findPath({ x: member.x, y: member.y }, { x: tile.x, y: tile.y });
        return { tile, path };
      })
      .filter(tilePath => tilePath.path.length > 0)
      .sort((l, r) => l.path.length - r.path.length);

    const closestCoveredTilePath = coveredReachableTilesByDistance.length > 0 ?
      coveredReachableTilesByDistance.slice(0, 1)[0] :
      null;

    if (uncovered && closestCoveredTilePath) {
      moveAction.moveLine = closestCoveredTilePath.path.slice(1, numberOfMoves + 1);
      return moveAction;
    }

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
