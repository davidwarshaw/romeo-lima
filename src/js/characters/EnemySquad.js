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

    this.explosiveSafeDistance = 8;
    this.tooFarFromPlayerDistance = 20;
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
    member, numberOfMoves, map, enemySquadLocalFov, playerSquad, playerSquadLocalFov) {

    this.coverMap.recalculate();
    this.astar = new AStar(map, playerSquad, this, playerSquadLocalFov);

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
    const primaryAttackAction = {
      action: 'ATTACK',
      primary: true,
      message: {
        name: member.name,
        text: 'attacks'
      }
    };
    const secondaryAttackAction = {
      action: 'ATTACK',
      primary: false,
      message: {
        name: member.name,
        text: 'attacks'
      }
    };

    // Is the enemy winning or losing?
    const winning = this.getAliveMembers().length > playerSquad.getAliveMembers().length;

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
      .filter(targetMember => targetMember.alive);
      // .filter(targetMember =>
      //   enemySquadLocalFov.isVisible(targetMember.x, targetMember.y));

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
    const closestTarget = targettableMembers.length ?
      targettableMemberDistances[0].targetMember : null;
    const closestTargetDistance = targettableMembers.length ?
      targettableMemberDistances[0].distance : null;

    // Is there a friendly in the line of fire?
    function friendlyInTargetLine(target, enemySquad) {
      const targetLine = TileMath.tileLine(member.x, member.y, target.x, target.y);
      return targetLine.some(point => enemySquad.getAliveByXY(point.x, point.y));
    }
    const friendlyAtRisk = friendlyInTargetLine(closestTarget, this);

    // Is this member far enough away for grenades?
    const inGrenadeRange = closestTargetDistance < this.tooFarFromPlayerDistance &&
      closestTargetDistance >= this.explosiveSafeDistance;

    // Is the member too far from the battle?
    const tooFarFromPlayer = closestTargetDistance >= this.tooFarFromPlayerDistance;

    // Is this member close enough for melee?
    let pathToClosestTarget = null;
    let meleeInRange = false;
    if (closestTarget) {
      pathToClosestTarget = this.astar.findPath(
        { x: member.x, y: member.y },
        { x: closestTarget.x, y: closestTarget.y });
      meleeInRange = pathToClosestTarget.length > 0 &&
        pathToClosestTarget.length - 1 <= numberOfMoves;
    }

    // What direction is toward the player, and what direction is away?

    // Are you outside of a building shooting in, or the opposite?
    function inBuilding(member) {
      const tile = map[utils.keyFromXY(member.x, member.y)];
      return tile.name.startsWith('Hut');
    }
    const outsideShootingIn =
      closestTarget && inBuilding(closestTarget) && !inBuilding(member);
    const insideShootingOut =
      closestTarget && !inBuilding(closestTarget) && inBuilding(member);

    // Enemies with higher difficulty should use powerful weapons more
    const chanceToUseSecondary = Math.round(100 * (this.difficulty / properties.maxDifficulty));
    const roll = properties.rng.getPercentage();
    const useSecondary = roll <= chanceToUseSecondary;

    // Decision Making
    //

    console.log(`difficulty: ${this.difficulty}`);
    console.log(`tooFarFromPlayer: ${tooFarFromPlayer}`);
    console.log(`friendlyAtRisk: ${friendlyAtRisk}`);
    console.log(`winning: ${winning}`);
    console.log(`uncovered: ${uncovered}`);
    console.log(`closestCoveredTilePath: ${JSON.stringify(closestCoveredTilePath)}`);
    console.log(`closestTarget: ${JSON.stringify(closestTarget)}`);
    console.log(`closestTargetDistance: ${closestTargetDistance}`);
    console.log(`inGrenadeRange: ${inGrenadeRange}`);
    console.log(`pathToClosestTarget: ${JSON.stringify(pathToClosestTarget)}`);
    console.log(`meleeInRange: ${meleeInRange}`);
    console.log(`outsideShootingIn: ${outsideShootingIn}`);
    console.log(`insideShootingOut: ${insideShootingOut}`);
    console.log(`member.hasSecondaryWeapon(): ${member.hasSecondaryWeapon()}`);

    // If we're too far from the battle, move closer. Use the path to the closest target.
    if ((tooFarFromPlayer || friendlyAtRisk) && winning &&
      pathToClosestTarget && pathToClosestTarget.length > 0) {
      moveAction.moveLine = pathToClosestTarget.slice(1, numberOfMoves + 1);
      console.log('moveAction: close distance');
      console.log(moveAction);
      console.log(`member.x: ${member.x} member.y: ${member.y}`);
      console.log(`closestTarget.x: ${closestTarget.x} closestTarget.y: ${closestTarget.y}`);
      return moveAction;
    }

    // If you're uncovered and there's an enemy in melee distance, melee attack
    if (uncovered && meleeInRange && pathToClosestTarget.length > 0) {
      moveAction.moveLine = pathToClosestTarget.slice(1, numberOfMoves + 1);
      console.log('moveAction: melee');
      console.log(moveAction);
      console.log(`member.x: ${member.x} member.y: ${member.y}`);
      console.log(`closestTarget.x: ${closestTarget.x} closestTarget.y: ${closestTarget.y}`);
      return moveAction;
    }

    // If you're uncovered, there's cover nearby, move to cover.
    if (uncovered && closestCoveredTilePath && closestCoveredTilePath.path.length > 0) {
      moveAction.moveLine = closestCoveredTilePath.path.slice(1, numberOfMoves + 1);
      console.log('moveAction: move to cover');
      console.log(moveAction);
      return moveAction;
    }

    // Otherwise, if there's a player member nearby, attack them.
    //
    // Attack with smalls arms if we have no secondary or we're danger close
    if (closestTarget && !friendlyAtRisk &&
        (!inGrenadeRange || !member.hasSecondaryWeapon() || !useSecondary)) {
      primaryAttackAction.target = closestTarget;
      console.log('primaryAttackAction');
      console.log(primaryAttackAction);
      return primaryAttackAction;
    }

    // Attack with explosives if we have them and we're far enough away
    if (closestTarget && !friendlyAtRisk &&
        (inGrenadeRange && member.hasSecondaryWeapon() && useSecondary)) {
      secondaryAttackAction.target = closestTarget;
      console.log('secondaryAttackAction');
      console.log(secondaryAttackAction);
      return secondaryAttackAction;
    }

    // Do nothing.
    console.log('waitAction');
    console.log(waitAction);
    return waitAction;
  }
}
