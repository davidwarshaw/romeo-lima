import properties from '../properties';
import utils from '../util/utils';
import text from '../util/text';
import TileMath from '../util/TileMath';
import LocalFov from '../maps/LocalFov';

import BallisticsSystem from './BallisticsSystem';
import EnvironmentSystem from './EnvironmentSystem';

import localMapCreation from '../maps/localMapCreation';

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

    // Create the local map
    game.playState.localMap = localMapCreation.createLocalMap(
      this.overworldTile,
      properties.localWidth, properties.localHeight);
    this.map = game.playState.localMap;

    // Add the participating squad members to the battle and place them
    // in the map
    this.playerSquad.addMembersToBattle();
    this.enemySquad.addMembersToBattle();

    squadProcedures.placePlayerSquadInLocalMap(
      this.playerSquad, this.map, this.ambushState, this.playerSide);
    squadProcedures.placeEnemySquadInLocalMap(
      this.enemySquad, this.map, this.ambushState, this.playerSide);

    // If we're on a highway and the miniboss hasn't been defeated, fight the miniboss
    if (this.overworldTile.name.endsWith('Highway') && !game.playState.minibossDefeated) {
      const members = this.enemySquad.getMembersByNumber();
      const vehicleNumber = members[members.length - 1].number + 1;
      const vehicle = squadProcedures.createVehicleSquadMember(
        vehicleNumber, 'BRT-60', false, 'NVA', this.map);
      this.enemySquad.addVehicle(vehicle);
    }

    // Build one FOV map for each squad. Each squad member sees the same FOV.
    this.playerSquadLocalFov = new LocalFov(
      this.map, this.playerSquad.members, properties.fovConcealmentThreshold);
    this.enemySquadLocalFov = new LocalFov(
      this.map, this.enemySquad.members, properties.fovConcealmentThreshold);

    // Initialize the enemy squad cover map for the AI
    this.enemySquad.initCoverMap(this.map, this.playerSquad.members);

    // Initialize the subsystems
    this.ballisticsSystem = new BallisticsSystem(
      this.map,
      this.playerSquad, this.playerSquadLocalFov,
      this.enemySquad, this.enemySquadLocalFov,
      this.playerSquad);

    this.environmentSystem = new EnvironmentSystem(
      this.map,
      this.playerSquad, this.playerSquadLocalFov,
      this.enemySquad, this.enemySquadLocalFov,
      this.playerSquad);

    // Set the next controlled character
    this.characters = squadProcedures
      .getAllMembersByTurnOrder(this.playerSquad, this.enemySquad);

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

    this.initProjectile();
    this.initMovement();

    // Character index is bumped at the begining, so start it at -1
    this.characterIndex = -1;

    // Initialize the selected character
    this.nextCharacter();
  }

  registerLocalMap(local) {
    this.local = local;
  }

  initProjectile() {
    // The projectile
    this.projectile = {
      intervalId: null,
      active: false,
      target: {
        x: null,
        y: null
      },
      intendedLine: [],
      effectAreas: [],
      smokeAreas: null,
      fireAreas: null,
      fireAnimation: null
    };
  }

  initMovement() {
    // Character movement
    this.movement = {
      intervalId: null,
      active: false,
      line: [],
      index: 0
    };
  }

  nextCharacter() {
    // console.log('nextCharacter:');
    // console.log(this.characterIndex);
    // console.log(this.characters);
    // Update the environment
    this.environmentSystem.update();

    // Resolve smoke and fire damage before characters are picked for actions
    const enemyEnvironmentDamageActions = this.environmentSystem
      .damageCharacters(this.ballisticsSystem, this.enemySquad);
    const playerEnvironmentDamageActions = this.environmentSystem
      .damageCharacters(this.ballisticsSystem, this.playerSquad);

    const smokeActions = Object.assign(
      enemyEnvironmentDamageActions.smokeActions,
      playerEnvironmentDamageActions.smokeActions);
    const fireActions = Object.assign(
      enemyEnvironmentDamageActions.fireActions,
      playerEnvironmentDamageActions.fireActions);

    text.createSmokeMessages(smokeActions).forEach(message => this.messages.push(message));
    text.createFireMessages(fireActions).forEach(message => this.messages.push(message));

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
    this.currentCharacterMoves = this.currentCharacter.getNumberOfMoves();

    // Select this character if in the player squad, otherwise AI exeutes turn
    if (this.currentCharacter.playerControlled) {
      this.currentCharacter.selected = true;
      console.log(`Player turn: ${this.currentCharacter.number}`);
      console.log(this.currentCharacter);
    }
    else {
      console.log(`AI turn: ${this.currentCharacter.number}`);
      console.log(this.currentCharacter);
      const action = this.enemySquad.actionForTurn(
        this.currentCharacter,
        this.currentCharacterMoves,
        this.map,
        this.enemySquadLocalFov,
        this.playerSquad,
        this.playerSquadLocalFov);
      console.log(action);

      if (action.action === 'MOVE') {
        // Log the action message
        this.messages.push(action.message);

        console.log(this.movement);
        this.movement.active = true;
        this.movement.line = action.moveLine;
        this.movement.index = 0;
        this.movement.intervalId = setInterval(
          () => this.moveEnemyCharacter(),
          properties.moveIntervalMillis);
      }
      else if (action.action === 'WAIT') {

        // Log the action message
        this.messages.push(action.message);

        this.nextCharacter();
      }
      else if (action.action === 'ATTACK') {

        // Use the primary or secondary weapon as specified by the action
        this.currentCharacter.primarySelected = action.primary;

        this.shouldFireProjectile(action.target);

        // Turn off target mode
        this.targetMode = false;
        this.clearTarget();
      }
      else if (action.action === 'PRONE') {
        this.currentCharacter.prone = !this.currentCharacter.prone;

        // Going prone or geting up uses up all moves and clears the target
        this.targetMode = false;
        this.clearTarget();

        // Log the action message
        const message = this.currentCharacter.prone ?
          { name: this.currentCharacter.name, text: 'goes prone' } :
          { name: this.currentCharacter.name, text: 'stands' };
        this.messages.push(message);
      }
    }
  }

  handleInput(input, local) {
    // Don't accept input while a projectile is in flight
    if (this.projectile.active) {
      return;
    }

    // Don't accept input while a character is moving
    if (this.movement.active) {
      return;
    }
    switch (input) {
      case 'LEFT':
        if (this.targetMode) {
          this.target.x =
            utils.clamp(this.target.x - 1, 0, local.width - 1);
          this.setTarget();
        }
        else {
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
        else {
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
        else {
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
        else {
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
          { name: this.currentCharacter.name, text: 'waits' });
        break;
      case 'ATTACK':
        // Only attack if not already moving
        if (!this.characterIsMoving) {

          // Only allow targetting if there is at least one unit of ammo for a weapon
          const primaryAmmoCount = this.playerSquad.inventory
            .getAmmoCountForWeapon(this.currentCharacter.weapon) || 0;
          const secondaryAmmoCount = this.playerSquad.inventory
            .getAmmoCountForWeapon(this.currentCharacter.secondary) || 0;

          // Neither primary nor secondary has ammo, so don't target
          if (primaryAmmoCount <= 0 && secondaryAmmoCount <= 0) {
            break;
          }

          // Only one has ammo, so switch to that one, but allow targetting
          else if (primaryAmmoCount > 0 && secondaryAmmoCount <= 0) {
            this.currentCharacter.primarySelected = true;
          }

          // Only one has ammo, so switch to that one, but allow targetting
          else if (primaryAmmoCount <= 0 && secondaryAmmoCount > 0) {
            this.currentCharacter.primarySelected = false;
          }

          // They both have ammo, so do not switch weapons and allow targetting

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
      case 'TOGGLE WEAPON': {

        // Only toggle in target mode
        if (!this.targetMode) {
          break;
        }

        // Only allow toggling to weapon if there is at least one unit of ammo for a weapon
        const primaryAmmoCount = this.playerSquad.inventory
          .getAmmoCountForWeapon(this.currentCharacter.weapon) || 0;
        const secondaryAmmoCount = this.playerSquad.inventory
          .getAmmoCountForWeapon(this.currentCharacter.secondary) || 0;

        console.log(`primaryAmmoCount: ${primaryAmmoCount}`);
        console.log(`secondaryAmmoCount: ${secondaryAmmoCount}`);

        // If the primary weapon is selected and there's a secondary weapon, then
        // select the secondary weapon
        if (this.currentCharacter.primarySelected &&
          this.currentCharacter.hasSecondaryWeapon() && secondaryAmmoCount > 0) {
          this.currentCharacter.primarySelected = false;

        // Otherwise vice versa
        }
        else if (!this.currentCharacter.primarySelected &&
          this.currentCharacter.weapon && primaryAmmoCount > 0) {
          this.currentCharacter.primarySelected = true;
        }
        break;
      }
      case 'ENTER':
        // Only attack if not already moving
        if (this.targetMode) {

          this.shouldFireProjectile(this.target);

          // Turn off target mode
          this.targetMode = false;
          this.clearTarget();
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
            { name: this.currentCharacter.name, text: 'goes prone' } :
            { name: this.currentCharacter.name, text: 'stands' };
          this.messages.push(message);
        }
        break;
      case 'ENTER/EXIT':
        if (this.enemySquad.numberOfAliveMembers() <= 0) {
          const outcome = { win: false, escape: true };
          this.endBattle(outcome);
        }
        else if (this.squadOnBorder(local)) {
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
    if (nextX < 0 || nextX >= local.width || nextY < 0 || nextY >= local.height) {
      return false;
    }

    // Dont allow a move into a non-traversable tile
    const tile = local.getTile(nextX, nextY);
    if (!tile.traversable) {
      return false;
    }

    const playerSquadMemberInTile = this.playerSquad.getAliveByXY(nextX, nextY);
    const enemySquadMemberInTile = this.enemySquad.getAliveByXY(nextX, nextY);

    if ((this.currentCharacter.playerControlled && playerSquadMemberInTile) ||
      (!this.currentCharacter.playerControlled && enemySquadMemberInTile)) {

      // Dont allow a move into a tile with a live squad member of the same controller in it
      return false;
    }
    else if ((this.currentCharacter.playerControlled && enemySquadMemberInTile) ||
      (!this.currentCharacter.playerControlled && playerSquadMemberInTile)) {

      // Moving into the square of an opposing character is a melee attack
      const defendingCharacter = playerSquadMemberInTile || enemySquadMemberInTile;
      const attackActions = this.ballisticsSystem
        .effectMelee(this.currentCharacter, defendingCharacter);

      // Log the melee action
      this.messages.push(text.createMeleeMessage(this.currentCharacter));

      // Log the effects from firing
      // console.log(`melee: attackActions: ${JSON.stringify(attackActions)}`);
      text.createBattleMessages(attackActions)
        .forEach(message => this.messages.push(message));

      // Melee uses all character moves
      this.currentCharacterMoves = 0;

      // No matter what happens with the attack, don't move into the tile
      return false;
    }

    // Moving is OK
    return true;
  }

  moveAnimationFrame() {
    this.game.refresh();

    console.log('this.movement');
    console.log(this.movement.line);
    console.log(this.movement.index);

    const { x, y } = this.movement.line[this.movement.index];
    this.currentCharacter.x = x;
    this.currentCharacter.y = y;
    this.movement.index++;

    if (this.movement.index >=
      this.movement.line.length) {
      clearInterval(this.movement.intervalId);

      this.initMovement();

      // Select the next character, and refresh the screen again
      this.nextCharacter();
      this.game.refresh();
    }
  }

  moveEnemyCharacter() {
    const { x, y } = this.movement.line[this.movement.index];
    const enemyShouldMove = this.shouldMove(this.local, x, y);

    // If the enemy should not move, then advance to the end of the movement index to make
    // sure that the characters movement ends on the next frame.
    if (enemyShouldMove) {
      this.moveAnimationFrame();
    }
    else {
      clearInterval(this.movement.intervalId);

      this.initMovement();

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

    const firedWeapon = this.currentCharacter.primarySelected ?
      this.currentCharacter.weapon :
      this.currentCharacter.secondary;

    // The player squad expends ammo
    let expendedAmmo = 0;
    if (this.currentCharacter.playerControlled) {
      expendedAmmo = this.playerSquad.inventory.expendAmmoForWeapon(firedWeapon, this.playerSquad);
    }
    console.log(`expendedAmmo: ${expendedAmmo}`);

    const {
      effectAreas,
      smokeAreas,
      fireAreas,
      attackActions
    } = this.ballisticsSystem
      .effectFire(this.currentCharacter, firedWeapon, this.projectile.intendedLine, expendedAmmo);

    this.projectile.effectAreas = effectAreas;
    this.projectile.smokeAreas = smokeAreas;
    this.projectile.fireAreas = fireAreas;

    // console.log('attackActions');
    // console.log(attackActions);

    // Log the firing action
    this.messages.push(text.createFireMessage(this.currentCharacter, firedWeapon));

    // Log the effects from firing
    // console.log(`firing: attackActions: ${JSON.stringify(attackActions)}`);
    text.createBattleMessages(attackActions)
      .forEach(message => this.messages.push(message));

    this.projectile.fireAnimation = this.ballisticsSystem
      .generateFireAnimation(firedWeapon, this.projectile.effectAreas, expendedAmmo);

    // console.log('this.projectile.fireAnimation');
    // console.log(this.projectile.fireAnimation);
  }

  fireAnimationFrame() {
    // console.log('fireAnimationFrame()');
    this.game.refresh();

    const { fireAnimation } = this.projectile;

    fireAnimation.fireSequenceIndex++;

    if (fireAnimation.fireSequenceIndex >= fireAnimation.fireSequence.length) {
      this.projectile.active = false;
      clearInterval(this.projectile.intervalId);

      // Add environmental effects
      this.projectile.smokeAreas
        .forEach(point => this.environmentSystem.addSmoke(point, point.amount));
      this.projectile.fireAreas
        .forEach(point => this.environmentSystem.addFire(point, point.amount));

      this.initProjectile();

      // Select the next character, and refresh the screen again
      this.nextCharacter();
      this.game.refresh();
    }
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

  squadOnBorder(local) {
    const someNotOnBorder = this.playerSquad.getAliveMembers()
      .some((member) => {
        // Not on the border
        if (member.x !== 0 && member.x !== local.width - 1 &&
          member.y !== 0 && member.y !== local.height - 1) {
          console.log(member);
          return true;
        }
        return false;
      });
    return !someNotOnBorder;
  }

  endBattle(outcome) {
    // Deselect the current character before switching states
    this.currentCharacter.selected = false;

    // Remove all the members from the battle
    this.playerSquad.removeMembersFromBattle();
    this.enemySquad.removeMembersFromBattle();

    if (outcome.win) {

      // Check to see if any members have leveled up
      const leveledUps = this.playerSquad.levelUp();
      console.log('leveledUps');
      console.log(leveledUps);

      // Create the loot and then show the loot window
      const loot = squadProcedures
        .getLootByEnemySquad(
          this.enemySquad.members, this.enemySquad.inventory);

      // If someone has leveled up, show this menu first. Otherwise, go right to the loot.
      if (leveledUps) {
        const leveledUpsText = text.createLevelUpMessages(leveledUps);
        console.log('this.state.showLevelUp(loot)');
        this.state.showLevelUp(leveledUpsText, loot);
      }
      else {
        console.log('this.state.showLoot(loot)');
        this.state.showLoot(loot);
      }

    }
    else if (!outcome.win && !outcome.escape) {
      console.log('this.state.showYouDiedBox()');
      this.state.showYouDiedBox();
    }
    else {
      console.log('this.state.showEscapeBox()');
      this.state.showEscapeBox();
    }
  }
}
