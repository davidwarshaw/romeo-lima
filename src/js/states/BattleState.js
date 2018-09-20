
import State from './State';

import JourneyState from '../states/JourneyState';

import BattleSystem from '../systems/BattleSystem';

import ActionReport from '../ui/ActionReport';
import BattleSquadStatus from '../ui/BattleSquadStatus';
import Dialog from '../ui/Dialog';

import LocalMap from '../maps/LocalMap';

export default class BattleState extends State {
  constructor(game, overworld, enemySquad) {
    super(game);

    this.enemySquad = enemySquad;
    this.battleSystem = new BattleSystem(game, this, overworld);

    this.ActionReport = new ActionReport(game, this.battleSystem);
    this.windowManager.addWindow(this.ActionReport);

    this.squadStatus = new BattleSquadStatus(game, this.battleSystem);
    this.windowManager.addWindow(this.squadStatus);

    this.localMap = new LocalMap(game, this.battleSystem);
    this.windowManager.addWindow(this.localMap);
  }

  endBattle() {
    this.game.switchState(new JourneyState(this.game));
  }

  showCantLeaveBox() {
    const title = null;
    const text = 'To escape while enemies are present, ' +
      'first move the entire squad to the border of the map.';
    this.cantLeaveBox = new Dialog(
      this.game, 30, 10, title, text, 'Ok',
      () => {
        this.windowManager.removeWindow(this.cantLeaveBox);
        this.cantLeaveBox = null;
        this.game.refresh();
      });
    this.windowManager.addWindow(this.cantLeaveBox);
  }
}
