import properties from '../properties';
import utils from '../util/utils';

import events from './events';

import Dialog from '../ui/Dialog';

import BattleState from '../states/BattleState';

export default class JourneySystem {
  constructor(game, state) {
    this.game = game;
    this.state = state;

    this.playState = game.playState;
    this.enemies = game.playState.enemies;
    this.squad = game.playState.squad;

    this.eventDialog = null;
  }

  tryToMoveSquad(input, overworld) {
    let moved = false;
    switch (input) {
      case 'LEFT':
        this.squad.x = utils.clamp(this.squad.x - 1, 0, overworld.width - 1);
        moved = true;
        break;
      case 'RIGHT':
        this.squad.x = utils.clamp(this.squad.x + 1, 0, overworld.width - 1);
        moved = true;
        break;
      case 'UP':
        this.squad.y = utils.clamp(this.squad.y - 1, 0, overworld.height - 1);
        moved = true;
        break;
      case 'DOWN':
        this.squad.y = utils.clamp(this.squad.y + 1, 0, overworld.height - 1);
        moved = true;
        break;
      case 'WAIT':
        moved = true;
        break;
      case 'ENTER/EXIT':
        // TODO add the enemies the right way
        this.game
          .switchState(new BattleState(this.game, overworld, this.enemies[0]));
        moved = true;
        break;
      case 'INVENTORY':
        this.state.showInventory();
        break;
    }
    return moved;
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

  startEvent(event) {
    const { name, description, proceedLabel, skipLabel } = event;
    this.eventDialog = new Dialog(
      this.game, 40, 20,
      name, this.squad.populateNames(description.setup),
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
