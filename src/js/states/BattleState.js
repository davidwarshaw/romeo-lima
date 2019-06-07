
import State from './State';

import JourneyState from '../states/JourneyState';
import InterstitialState from '../states/InterstitialState';

import BattleSystem from '../systems/BattleSystem';

import ActionReport from '../ui/ActionReport';
import ContextCommands from '../ui/ContextCommands';
import BattleSquadStatus from '../ui/BattleSquadStatus';
import Dialog from '../ui/Dialog';
import LootModal from '../ui/LootModal';

import LocalMap from '../maps/LocalMap';

export default class BattleState extends State {
  constructor(game, overworld, enemySquad, ambushState, playerSide) {
    super(game);

    this.enemySquad = enemySquad;
    this.battleSystem = new BattleSystem(
      game, this, overworld, ambushState, playerSide);

    this.ActionReport = new ActionReport(game, this.battleSystem);
    this.windowManager.addWindow(this.ActionReport);

    this.contextCommands = new ContextCommands(game, this.windowManager);
    this.windowManager.addWindow(this.contextCommands);

    this.squadStatus = new BattleSquadStatus(game, this.battleSystem);
    this.windowManager.addWindow(this.squadStatus);

    this.localMap = new LocalMap(game, this.battleSystem);
    this.windowManager.addWindow(this.localMap);
  }

  endBattle() {
    this.game.switchState(new JourneyState(this.game));
  }

  endGame() {
    const header = 'After Action Report:\n\n';
    const memberStats = this.game.playState.squad.getMembersByNumber()
      .map(member => `${member.rank} ${member.name}: Killed in action.`);
    const memberStatsParagraph = memberStats.join('\n');
    const endGameText = `${header}${memberStatsParagraph}`;

    const journeyState = new JourneyState(this.game);
    this.game.switchState(
      new InterstitialState(this.game, endGameText, journeyState));
  }

  showLoot(loot) {
    this.lootBox = new LootModal(
      this.game, this.battleSystem,
      () => {
        this.windowManager.removeWindow(this.lootBox);
        this.lootBox = null;
        this.game.refresh();
        this.endBattle();
      },
      loot);
    this.windowManager.addWindow(this.lootBox);
  }

  showYouDiedBox() {
    const title = null;
    const text = 'All members of the squad have perished.';
    this.youDiedBox = new Dialog(
      this.game, 30, 10, title, text, 'Ok',
      () => {
        this.windowManager.removeWindow(this.youDiedBox);
        this.youDiedBox = null;
        this.game.refresh();
        this.endGame();
      });
    this.windowManager.addWindow(this.youDiedBox);
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

  showEscapeBox() {
    const title = null;
    const text = 'You escape.';
    this.escapeBox = new Dialog(
      this.game, 30, 10, title, text, 'Ok',
      () => {
        this.windowManager.removeWindow(this.escapeBox);
        this.escapeBox = null;
        this.game.refresh();
        this.endBattle();
      });
    this.windowManager.addWindow(this.escapeBox);
  }
}
