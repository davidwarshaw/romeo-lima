import utils from '../util/utils';

import OverworldFov from '../maps/OverworldFov';

import Dialog from '../ui/Dialog';

import InterstitialState from '../states/InterstitialState';
import BattleState from '../states/BattleState';

import EventSystem from './EventSystem';

import squadProcedures from '../characters/squadProcedures';

export default class JourneySystem {
  constructor(game, state) {
    this.game = game;
    this.state = state;

    this.playState = game.playState;
    this.enemies = game.playState.enemies;
    this.playerSquad = game.playState.squad;

    this.map = this.playState.map;

    this.eventSystem = new EventSystem();

    this.eventDialogWidth = 90;
    this.eventDialogHeight = 14;
    this.eventDialog = null;

    this.playerSquadOverworldFov = new OverworldFov(this.map, this.playerSquad);

    // this.enemiesLocalFov = this.enemies
    //   .map(enemySquad => new LocalFov(this.map, enemySquad.members));
  }

  handleInput(input, overworld) {
    let shouldStep = false;
    const { x, y } = this.playerSquad;
    switch (input) {
      case 'LEFT':
        if (!this.shouldMove(overworld, x - 1, y, input)) {
          break;
        }
        this.playerSquad.x =
          utils.clamp(x - 1, 0, overworld.width - 1);
        this.playerSquadOverworldFov.recalculate();
        shouldStep = true;
        break;
      case 'RIGHT':
        if (!this.shouldMove(overworld, x + 1, y, input)) {
          break;
        }
        this.playerSquad.x =
          utils.clamp(x + 1, 0, overworld.width - 1);
        this.playerSquadOverworldFov.recalculate();
        shouldStep = true;
        break;
      case 'UP':
        if (!this.shouldMove(overworld, x, y - 1, input)) {
          break;
        }
        this.playerSquad.y =
          utils.clamp(y - 1, 0, overworld.height - 1);
        this.playerSquadOverworldFov.recalculate();
        shouldStep = true;
        break;
      case 'DOWN':
        if (!this.shouldMove(overworld, x, y + 1, input)) {
          break;
        }
        this.playerSquad.y =
          utils.clamp(y + 1, 0, overworld.height - 1);
        this.playerSquadOverworldFov.recalculate();
        shouldStep = true;
        break;
      case 'WAIT':
        shouldStep = true;
        break;
      case 'ENTER/EXIT':
        // TODO make this do something
        shouldStep = true;
        break;
      case 'INVENTORY':
        this.state.showInventory();
        break;
    }
    return shouldStep;
  }

  shouldMove(overworld, nextX, nextY, playerMoveDirection) {
    // If there's an alive enemy squad in the next tile, start combat
    const enemyInNextTile = squadProcedures
      .getEnemySquadByOverworldXY(this.enemies, nextX, nextY);
    if (enemyInNextTile && enemyInNextTile.alive) {
      this.startCombat(overworld, enemyInNextTile, playerMoveDirection);
    }
    return true;
  }

  step() {
    // Advance the clock
    this.advanceWatch();

    // Check for random events
    const event = this.eventSystem.checkForEvent(this.playState.watch, this.playerSquad);
    if (event) {
      this.startEvent(event);
    }
  }

  advanceWatch() {
    this.playState.watch++;
    if (this.playState.watch > 11) {
      this.playState.watch = 0;
      this.playState.day++;
    }
  }

  startCombat(overworld, enemy, playerMoveDirection) {
    // No ambush
    let ambushState = 'No-Ambush';
    let text = 'Enemy is nearby.';
    let playerSide;
    switch(playerMoveDirection) {
      case 'UP':
        playerSide = 'RIGHT';
        break;
      case 'DOWN':
        playerSide = 'LEFT';
        break;
      case 'LEFT':
        playerSide = 'RIGHT';
        break;
      case 'RIGHT':
        playerSide = 'LEFT';
        break;
    }

    // Enemy ambushes player
    if (this.playerSquad.visibleToEnemies && !enemy.overworldVisible) {
      ambushState = 'Player-Ambushed';
      text = 'Contact!';
    }

    // Player ambushes enemy
    else if (!this.playerSquad.visibleToEnemies && enemy.overworldVisible) {
      ambushState = 'Enemy-Ambushed';
      text = 'Enemy ahead. Engage.';
    }

    const battleState = new BattleState(
      this.game, overworld, enemy, ambushState, playerSide);
    this.game.switchState(new InterstitialState(this.game, text, battleState));
  }

  startEvent(event) {
    const { eventId, choice, name, text, proceedLabel, skipLabel } = event;

    if (choice) {
      this.eventDialog = new Dialog(
        this.game, this.eventDialogWidth, this.eventDialogHeight,
        name, this.playerSquad.populateNames(text),
        proceedLabel, () => this.proceedEvent(eventId),
        skipLabel, () => this.endEvent());
    }
    else {
      this.eventDialog = new Dialog(
        this.game, this.eventDialogWidth, this.eventDialogHeight,
        name, this.playerSquad.populateNames(text),
        proceedLabel, () => this.endEvent(eventId));
    }

    this.state.windowManager.addWindow(this.eventDialog);
  }

  proceedEvent(eventId) {
    // Check if the event succeeds or fails
    const { success, name, text } =
      this.eventSystem.proceedWithEvent(eventId, this.playerSquad);

    // Remove the setup dialog and put up the final dialog
    this.state.windowManager.removeWindow(this.eventDialog.id);
    this.eventDialog = new Dialog(
      this.game, this.eventDialogWidth, this.eventDialogHeight,
      name, text,
      'Continue', () => this.endEvent(event));
    this.state.windowManager.addWindow(this.eventDialog);

    // Failure advances the watch and triggers a redraw
    if (!success) {
      this.advanceWatch();
      this.game.refresh();
    }
  }

  endEvent() {
    this.state.windowManager.removeWindow(this.eventDialog.id);
  }
}
