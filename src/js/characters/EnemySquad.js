import properties from '../properties';
import utils from '../util/utils';
import TileMath from '../util/TileMath';

import LocalFov from '../maps/LocalFov';
import AStar from '../maps/AStar';

import Squad from './Squad';

export default class EnemySquad extends Squad {

  constructor(members, x, y, inventory, overworldGlyph, overworldVisible, difficulty) {
    super(members, x, y, inventory);
    this.overworldGlyph = overworldGlyph;
    this.overworldVisible = overworldVisible;
    this.difficulty = difficulty;

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
    const moveAction = {
      action: 'MOVE',
      message: {
        name: member.name,
        text: 'moves'
      }
    };
    const attackAction = {
      action: 'ATTACK',
      message: {
        name: member.name,
        text: 'attacks'
      }
    };

    // Is the member under cover, or not?
    const uncovered = this.coverMap.isVisible(member.x, member.y);

    // How far away is cover?
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

    // What's the path to the closest cover tile?
    const closestCoveredTilePath = coveredReachableTilesByDistance.length > 0 ?
      coveredReachableTilesByDistance.slice(0, 1)[0] :
      null;

    // What player squad members can be targetted?
    const targettableMembers = playerSquad.members
      .filter(targetMember => targetMember.alive)
      .filter(targetMember =>
        enemySquadOverworldFov.isVisible(targetMember.x, targetMember.y));

    // How far away are these members?
    const targettableMemberDistances = targettableMembers
      .map(targetMember => {
        const line = TileMath.tileLine(
          member.x, member.y, targetMember.x, targetMember.y);
        const distance = line.length;
        return { targetMember, distance };
      })
      .sort((l, r) => l.distance - r.distance);

    // Which is the closest?
    const closestTargettableMember = targettableMembers.length ?
      targettableMemberDistances[0].targetMember : null;

    // Is this member close enough for melee?
    let pathToMelee = null;
    let meleeInRange = false;
    if (closestTargettableMember) {
      pathToMelee = this.astar.findPath(
        { x: member.x, y: member.y },
        { x: closestTargettableMember.x, y: closestTargettableMember.y });
      meleeInRange = pathToMelee.length - 1 <= numberOfMoves;
    }

    // Are you outside of a building shooting in, or the opposite?
    function inBuilding(member) {
      const tile = map[utils.keyFromXY(member.x, member.y)];
      return tile.name.startsWith('Hut');
    }
    const outsideShootingIn =
      closestTargettableMember && inBuilding(closestTargettableMember) && !inBuilding(member);
    const insideShootingOut =
      closestTargettableMember && !inBuilding(closestTargettableMember) && inBuilding(member);

    // Decision Making
    //

    console.log(`uncovered: ${uncovered}`);
    console.log(`closestTargettableMember: ${closestTargettableMember}`);
    console.log(`meleeInRange: ${meleeInRange}`);
    console.log(`outsideShootingIn: ${outsideShootingIn}`);
    console.log(`insideShootingOut: ${insideShootingOut}`);

    // If you're uncovered and there's an enemy in melee distance, melee attack
    if (uncovered && meleeInRange) {
      moveAction.moveLine = pathToMelee.path.slice(1, numberOfMoves + 1);
      return moveAction;
    }

    // If you're uncovered and there's cover nearby, move to cover.
    if (uncovered && closestCoveredTilePath) {
      moveAction.moveLine = closestCoveredTilePath.path.slice(1, numberOfMoves + 1);
      return moveAction;
    }

    // Otherwise, if there's a player member nearby, attack them.
    if (closestTargettableMember) {
      attackAction.target = closestTargettableMember;
      return attackAction;
    }

    // Do nothing.
    return waitAction;
  }
}
