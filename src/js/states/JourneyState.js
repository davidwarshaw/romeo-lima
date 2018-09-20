
import State from './State';

import JourneySystem from '../systems/JourneySystem';

import JourneySquadStatus from '../ui/JourneySquadStatus';
import Inventory from '../ui/Inventory';
import OverworldMap from '../maps/OverworldMap';

export default class JourneyState extends State {
  constructor(game) {
    super(game);

    this.journeySystem = new JourneySystem(game, this);

    this.squadStatus = new JourneySquadStatus(game, this.journeySystem);
    this.windowManager.addWindow(this.squadStatus);

    this.overworldMap = new OverworldMap(game, this.journeySystem);
    this.windowManager.addWindow(this.overworldMap);
  }

  showInventory() {
    this.inventoryBox = new Inventory(
      this.game, this.journeySystem,
      () => {
        this.windowManager.removeWindow(this.inventoryBox);
        this.inventoryBox = null;
        this.game.refresh();
      });
    this.windowManager.addWindow(this.inventoryBox);
  }
}
