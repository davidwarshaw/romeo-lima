import properties from '../properties';
import utils from '../util/utils';

import OverworldFov from '../maps/OverworldFov';

import events from './events';

import Dialog from '../ui/Dialog';

import InterstitialState from '../states/InterstitialState';
import BattleState from '../states/BattleState';

import squadProcedures from '../characters/squadProcedures';

export default class JourneySystem {
  constructor(game, state) {
    this.game = game;
    this.state = state;

    this.playState = game.playState;
    this.enemies = game.playState.enemies;
    this.playerSquad = game.playState.squad;

    this.map = this.playState.map;

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
    const roll = properties.rng.getPercentage();
    const eventCandidates = events
      .filter(event => roll <= event.chanceToHappen);
    const event = eventCandidates[0];
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
    const { name, description, proceedLabel, skipLabel } = event;
    this.eventDialog = new Dialog(
      this.game, 40, 20,
      name, this.playerSquad.populateNames(description.setup),
      proceedLabel, () => this.proceedEvent(event),
      skipLabel, () => this.endEvent(event));
    this.state.windowManager.addWindow(this.eventDialog);
  }

  proceedEvent(event) {
    const { name, description } = event;

    // Check for event success
    const roll = properties.rng.getPercentage();
    if (roll <= event.chanceToSucceed) {
      // Remove the setup dialog and put up the success dialog
      this.state.windowManager.removeWindow(this.eventDialog.id);
      this.eventDialog = new Dialog(
        this.game, 40, 20,
        name, description.success,
        'Continue', () => this.endEvent(event));
      this.state.windowManager.addWindow(this.eventDialog);
    }
    else {
      // Remove the setup dialog and put up the failure dialog
      this.state.windowManager.removeWindow(this.eventDialog.id);
      this.eventDialog = new Dialog(
        this.game, 40, 20,
        name, description.failure,
        'Continue', () => this.endEvent(event));
      this.state.windowManager.addWindow(this.eventDialog);

      // Failure advances the watch and triggers a redraw
      this.advanceWatch();
      this.game.refresh();
    }

  }

  endEvent() {
    this.state.windowManager.removeWindow(this.eventDialog.id);
  }
}
