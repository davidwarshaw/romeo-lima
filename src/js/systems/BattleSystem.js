import properties from '../properties';
import utils from '../util/utils';
import text from '../util/text';
import TileMath from '../util/TileMath';
import LocalFov from '../maps/LocalFov';

import BallisticsSystem from './BallisticsSystem';

import localMapCreation from '../maps/localMapCreation';
import vehicleCreation from '../maps/vehicleCreation';

import squadProcedures from '../characters/squadProcedures';

export default class BattleSystem {
  constructor(game, state, overworld, ambushState, playerSide) {
    this.game = game;
    this.state = state;
    this.ambushState = ambushState;
    this.playerSide = playerSide;

    this.playState = game.playState;
    this.playerSquad = game.playState.squad;

    this.enemySquad = state.enemySquad;

    // The action messages
    this.messages = [];

    // Get the overworld tile from the squad
    this.overworldTile = overworld
      .getTile(this.playerSquad.x, this.playerSquad.y);

    // Create the local map and any vehicles
    game.playState.localMap = localMapCreation.createLocalMap(
      this.overworldTile,
      properties.localWidth, properties.localHeight);
    this.map = game.playState.localMap;

    // game.playState.vehicles = vehicleCreation.createVehicles(
    //   game.playState.localMap);
    // this.vehicles = game.playState.vehicles;

    // Add the participating squad members to the battle and place them
    // in the map
    this.playerSquad.addMembersToBattle();
    this.enemySquad.addMembersToBattle();

    squadProcedures.placePlayerSquadInLocalMap(
      this.playerSquad, this.map, this.ambushState, this.playerSide);
    squadProcedures.placeEnemySquadInLocalMap(
      this.enemySquad, this.map, this.ambushState, this.playerSide);

    // Build one FOV map for each squad. Each squad member sees the same FOV.
    this.playerSquadLocalFov = new LocalFov(
      this.map, this.playerSquad.members, properties.fovConcealmentThreshold);
    this.enemySquadLocalFov = new LocalFov(
      this.map, this.enemySquad.members, properties.fovConcealmentThreshold);

    // Initialize the enemy squad cover map for the AI
    this.enemySquad.initCoverMap(this.map, this.playerSquad.members);

    this.ballisticsSystem = new BallisticsSystem(
      this.map,
      this.playerSquad, this.playerSquadLocalFov,
      this.enemySquad, this.enemySquadLocalFov,
      this.playerSquad);

    // Set the next controlled character
    this.characters = squadProcedures
      .getAllMembersByTurnOrder(this.playerSquad, this.enemySquad);

    // Character index is bumped at the begining, so start it at -1
    this.characterIndex = -1;

    // Initialize the selected character
    this.nextCharacter();

    // Targeting
    //
    // We're either in attack mode or move mode
    this.targetMode = false;

    // Keep track of whether we've started to move and now can't stop
    this.characterIsMoving = false;

    // Default target the center of the screen
    this.defaultTarget = {
      x: Math.round(properties.localWidth / 2),
      y: Math.round(properties.localHeight / 2)
    };
    this.target = {
      enemy: null,
      x: this.defaultTarget.x,
      y: this.defaultTarget.y,
      line: []
    };

    // The projectile
    //
    this.projectile = {
      intervalId: null,
      active: false,
      target: {
        x: null,
        y: null
      },
      intendedLine: [],
      actualLines: [],
      fireSequence: [],
      fireSequenceIndex: 0,
      glyphOctants: ['-', '\\', '|', '/', '-', '\\', '|', '/'],
      glyph: '-',
      fgColor: '#FFFFFF',
      muzzleGlyph: '*',
      muzzleFgColor: '#FFAE19'
    };

    // Character movement
    this.movement = {
      intervalId: null,
      line: [],
      index: 0
    };
  }

  nextCharacter() {
    // If there is nobody from the enemy squad, end the battle
    if (this.enemySquad.numberOfAliveMembers() <= 0) {
      this.enemySquad.alive = false;

      const outcome = { win: true, escape: false };
      this.endBattle(outcome);
      return;
    }

    // If there is nobody from the player squad, end the battle
    if (this.playerSquad.numberOfAliveMembers() <= 0) {
      this.playerSquad.alive = false;

      const outcome = { win: false, escape: false };
      this.endBattle(outcome);
      return;
    }

    // Deselect previous character
    if (this.currentCharacter) {
      this.currentCharacter.selected = false;
    }

    // Bump the character index and assign the next character
    this.characterIndex++;
    if (this.characterIndex >= this.characters.length) {
      this.characterIndex = 0;
    }

    // Keep going if next character is not alive
    while(!this.characters[this.characterIndex].alive) {
      this.characterIndex++;
      if (this.characterIndex >= this.characters.length) {
        this.characterIndex = 0;
      }
    }

    this.currentCharacter = this.characters[this.characterIndex];

    // Fill the available moves
    this.characterIsMoving = false;
    this.currentCharacterMoves = squadProcedures
      .getMovesForMember(this.currentCharacter);

    // Select this character if in the player squad, otherwise AI exeutes turn
    if (this.currentCharacter.playerControlled) {
      this.currentCharacter.selected = true;
      console.log('player turn');
    }
    else {
      console.log('AI turn');
      const action = this.enemySquad.actionForTurn(
        this.currentCharacter,
        this.currentCharacterMoves,
        this.map,
        this.enemySquadLocalFov,
        this.playerSquad);
      console.log(action);

      if (action.action === 'WAIT') {
        this.nextCharacter();
      }
      else if (action.action === 'MOVE') {
        this.movement.line = action.moveLine;
        this.movement.index = 0;
        this.movement.intervalId = setInterval(
          () => this.moveAnimationFrame(),
          properties.moveIntervalMillis);
      }
      else if (action.action === 'ATTACK') {
        this.shouldFireProjectile(action.target);

        // Turn off target mode
        this.targetMode = false;
        this.clearTarget();
      }

      this.messages.push(action.message);
    }

  }

  handleInput(input, local) {
    // Don't accept input while a projectile is in flight
    if (this.projectile.active) {
      return;
    }
    switch (input) {
      case 'LEFT':
        if (this.targetMode) {
          this.target.x =
            utils.clamp(this.target.x - 1, 0, local.width - 1);
          this.setTarget();
        }
        else if (!this.currentCharacter.prone) {
          const { x, y } = this.currentCharacter;
          if (!this.shouldMove(local, x - 1, y)) {
            break;
          }
          this.currentCharacter.x =
            utils.clamp(x - 1, 0, local.width - 1);
          this.currentCharacterMoves--;
          this.characterIsMoving = true;
          this.playerSquadLocalFov.recalculate();
        }
        break;
      case 'RIGHT':
        if (this.targetMode) {
          this.target.x =
            utils.clamp(this.target.x + 1, 0, local.width - 1);
          this.setTarget();
        }
        else if (!this.currentCharacter.prone) {
          const { x, y } = this.currentCharacter;
          if (!this.shouldMove(local, x + 1, y)) {
            break;
          }
          this.currentCharacter.x =
            utils.clamp(x + 1, 0, local.width - 1);
          this.currentCharacterMoves--;
          this.characterIsMoving = true;
          this.playerSquadLocalFov.recalculate();
        }
        break;
      case 'UP':
        if (this.targetMode) {
          this.target.y =
            utils.clamp(this.target.y - 1, 0, local.height - 1);
          this.setTarget();
        }
        else if (!this.currentCharacter.prone) {
          const { x, y } = this.currentCharacter;
          if (!this.shouldMove(local, x, y - 1)) {
            break;
          }
          this.currentCharacter.y =
            utils.clamp(y - 1, 0, local.height - 1);
          this.currentCharacterMoves--;
          this.characterIsMoving = true;
          this.playerSquadLocalFov.recalculate();
        }

        break;
      case 'DOWN':
        if (this.targetMode) {
          this.target.y =
            utils.clamp(this.target.y + 1, 0, local.height - 1);
          this.setTarget();
        }
        else if (!this.currentCharacter.prone) {
          const { x, y } = this.currentCharacter;
          if (!this.shouldMove(local, x, y + 1)) {
            break;
          }
          this.currentCharacter.y =
            utils.clamp(y + 1, 0, local.height - 1);
          this.currentCharacterMoves--;
          this.characterIsMoving = true;
          this.playerSquadLocalFov.recalculate();
        }
        break;
      case 'WAIT':
        // Waiting uses up all moves and clears the target
        this.currentCharacterMoves = 0;
        this.targetMode = false;
        this.clearTarget();

        this.messages.push(
          { name: this.currentCharacter.name, text: 'waits.' });
        break;
      case 'ATTACK':
        // Only attack if not already moving
        if (!this.characterIsMoving) {
          // Turn on target mode and auto target the nearest enemy
          if (!this.targetMode) {
            this.targetMode = true;
            this.target.enemy = this.targetClosestEnemy();
            this.setTarget(this.target.enemy);
          }

          // Turn off target mode and clear the target
          else {
            this.targetMode = false;
            this.clearTarget();
          }
        }
        break;
      case 'NEXT TARGET':
        // Only attack if not already moving
        if (this.targetMode) {
          this.target.enemy = this.targetNextEnemy();
          this.setTarget(this.target.enemy);
        }
        break;
      case 'ENTER':
        // Only attack if not already moving
        if (this.targetMode) {

          this.shouldFireProjectile(this.target);

          // Turn off target mode
          this.targetMode = false;
          this.clearTarget();

          // TODO don't do this for firing
          // Firing uses up a character's turn
          //this.currentCharacterMoves = 0;
        }
        break;
      case 'PRONE':
        // Only go prone or get up if not already moving
        if (!this.characterIsMoving) {

          this.currentCharacter.prone = !this.currentCharacter.prone;

          // Going prone or geting up uses up all moves and clears the target
          this.currentCharacterMoves = 0;
          this.targetMode = false;
          this.clearTarget();

          const message = this.currentCharacter.prone ?
            { name: this.currentCharacter.name, text: 'goes prone.' } :
            { name: this.currentCharacter.name, text: 'stands.' };
          this.messages.push(message);
        }
        break;
      case 'ENTER/EXIT':
        if (this.enemySquad.numberOfAliveMembers() <= 0) {
          const outcome = { win: false, escape: true };
          this.endBattle(outcome);
        }
        else {
          console.log('this.state.showCantLeaveBox()');
          this.state.showCantLeaveBox();
        }
        break;
    }

    // If they've run out of moves, select the next character
    if (this.currentCharacterMoves <= 0) {
      this.nextCharacter();
    }
  }

  shouldMove(local, nextX, nextY) {
    // Don't allow a move off the map
    const inMap = (nextX >= 0) && (nextX < local.width) &&
      (nextY >= 0) && (nextY < local.height);

    // Dont allow a move into a non-traversable tile
    const tile = local.getTile(nextX, nextY);

    // Dont allow a move into a tile with a squad member in it
    const playerSquadMemberInTile = this.playerSquad.getByXY(nextX, nextY);
    const enemySquadMemberInTile = this.enemySquad.getByXY(nextX, nextY);
    return tile.traversable && inMap &&
      !playerSquadMemberInTile && !enemySquadMemberInTile;
  }

  moveAnimationFrame() {
    this.game.refresh();

    const { x, y } = this.movement.line[this.movement.index];
    this.currentCharacter.x = x;
    this.currentCharacter.y = y;
    this.movement.index++;

    if (this.movement.index >=
      this.movement.line.length) {
      clearInterval(this.movement.intervalId);

      // Select the next character, and refresh the screen again
      this.nextCharacter();
      this.game.refresh();
    }
  }

  shouldFireProjectile(target) {
    // Set to the projectile to be in effect and set the interval
    this.projectile.active = true;
    this.projectile.intendedLine = TileMath.tileRay(
      this.currentCharacter.x, this.currentCharacter.y,
      target.x, target.y);
    this.projectile.intervalId = setInterval(
      () => this.fireAnimationFrame(),
      properties.projectileIntervalMillis);

    const {
      actualLines,
      fireActions
    } = this.ballisticsSystem
      .effectFire(this.currentCharacter, this.projectile.intendedLine);

    this.projectile.actualLines = actualLines;

    console.log(fireActions);
    text.createFireMessages(fireActions)
      .forEach(message => this.messages.push(message));

    this.projectile.fireSequenceIndex = 0;
    this.projectile.fireSequence = this.generateFireSequence(
      this.currentCharacter.weapon.bursts,
      this.currentCharacter.weapon.roundsPerBurst);

    // Use a glyph based on the angle of the firing line
    const octant = TileMath.octantOfLine(this.projectile.intendedLine);
    this.projectile.glyph = this.projectile.glyphOctants[octant];
  }

  fireAnimationFrame() {
    this.game.refresh();

    this.projectile.fireSequenceIndex++;

    if (this.projectile.fireSequenceIndex >=
      this.projectile.fireSequence.length) {
      this.projectile.active = false;
      clearInterval(this.projectile.intervalId);

      // Select the next character, and refresh the screen again
      this.nextCharacter();
      this.game.refresh();
    }
  }

  generateFireSequence(bursts, roundsPerBurst) {
    const roundsPattern =
      Array(roundsPerBurst).fill('-true-');
    const roundBreaksPattern =
      Array(properties.projectileRoundBreakFrames).fill('-false-');
    const roundsSequence = roundsPattern.join(roundBreaksPattern.join(''));

    const burstsPattern = Array(bursts).fill(roundsSequence);
    const burstBreaksPattern = '-false-'
      .repeat(properties.projectileBurstBreakFrames);
    const burstSequence = burstsPattern.join(burstBreaksPattern);

    const sequence = burstSequence
      .split('-')
      .filter(token => token)
      .map(token => token === 'true');

    // For the animation timing to look nice, there has to be a beat
    // at the begining and two beats at the end.
    const initialFalse = [false];
    sequence.push(false);
    sequence.push(false);
    initialFalse.push(...sequence);
    return initialFalse;
  }

  targetClosestEnemy() {
    const closestEnemies = this.enemySquad.members

      // Only target visible enemies
      .filter(member => this.playerSquadLocalFov.isVisible(member.x, member.y))

      // Only target alive enemies
      .filter(member => member.alive)

      // Find the enemy with the lowest distance to the squad member
      .map(member => {
        return {
          distance: TileMath.distance(
            this.currentCharacter.x, this.currentCharacter.y,
            member.x, member.y
          ),
          number: member.number
        };
      })
      .sort((l, r) => l.distance - r.distance);

    // If there is a closest enemy, target it. Other wise target the default
    const enemyNumber = closestEnemies.length > 0 ?
      closestEnemies[0].number : null;
    return this.enemySquad.getByNumber(enemyNumber);
  }

  targetNextEnemy() {
    if (!this.target.enemy) {
      return;
    }
    const currentTargetedNumber = this.target.enemy ?
      this.target.enemy.number : -1;

    const enemyNumbers = this.enemySquad.members

      // Only target visible enemies
      .filter(member => this.playerSquadLocalFov.isVisible(member.x, member.y))

      // Only target alive enemies
      .filter(member => member.alive)

      .sort((l, r) => l.number - r.number)
      .map(member => member.number);

    const currentTargetedIndex = enemyNumbers.indexOf(currentTargetedNumber);
    let nextTargetedIndex = currentTargetedIndex + 1;
    if (nextTargetedIndex >= enemyNumbers.length) {
      nextTargetedIndex = 0;
    }

    return this.enemySquad.getByNumber(enemyNumbers[nextTargetedIndex]);
  }

  clearTarget() {
    this.target.line = [];
  }

  setTarget(newTarget) {
    if (newTarget) {
      this.target.x = newTarget.x;
      this.target.y = newTarget.y;
    }
    this.target.line = TileMath.tileLine(
      this.currentCharacter.x, this.currentCharacter.y,
      this.target.x, this.target.y);
  }

  endBattle(outcome) {
    // Deselect the current character before switching states
    this.currentCharacter.selected = false;

    // Remove all the members from the battle
    this.playerSquad.removeMembersFromBattle();
    this.enemySquad.removeMembersFromBattle();

    if (outcome.win) {
      // Create the loot and then show the loot window
      const loot = squadProcedures
        .getLootByEnemySquad(
          this.enemySquad.members, this.enemySquad.inventory);
      console.log('this.state.showLoot(loot)');
      this.state.showLoot(loot);
    }
    else if (!outcome.win && !outcome.escape) {
      console.log('this.state.showYouDiedBox()');
      this.state.showYouDiedBox();
    }
  }
}
