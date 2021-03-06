
import properties from '../properties';
import utils from '../util/utils';

import Cache from '../util/Cache';
import Window from '../ui/Window';

import overworldTileDictionary from './data/overworldTileDictionary.json';

export default class OverworldMap extends Window {
  constructor(game, journeySystem) {
    super(
      0, 0,
      properties.width, properties.overworldHeight,
      'Overworld Map');

    this.game = game;
    this.journeySystem = journeySystem;

    this.playState = game.playState;
    this.map = game.playState.map;
    this.enemies = game.playState.enemies;
    this.squad = game.playState.squad;

    this.cache = new Cache();
  }

  getTile(x, y) {
    const name = this.map[utils.keyFromXY(x, y)].name;
    const tileDef = overworldTileDictionary[name];
    tileDef.name = name;
    return tileDef;
  }

  brightnessForWatch() {
    const watch = this.playState.watch;
    const brightness = Math.round(Math.pow(Math.abs(watch - 6), 2) * -3);
    return brightness;
  }

  render(display) {
    const watchBrightness = this.brightnessForWatch();

    Object.values(this.map).forEach((tile) => {
      const tileDef = overworldTileDictionary[tile.name];

      // If the tile is visible, brightness comes from time of day (watch)
      // Otherwise, tile gets default not visible brightness
      const visibleTile = this.journeySystem.playerSquadOverworldFov
        .isVisible(tile.x, tile.y);
      const tileBrightness = visibleTile ?
        watchBrightness : properties.overworldMapNotVisibleBrightness;

      // Cache the adjusted colors for speediness
      const fgCacheKey = `${tileDef.fgColor}-${tileBrightness}`;
      const fgAdjusted = this.cache.get(
        fgCacheKey,
        () => utils.adjustBrightness(tileDef.fgColor, tileBrightness));
      const bgCacheKey = `${tileDef.bgColor}-${tileBrightness}`;
      const bgAdjusted = this.cache.get(
        bgCacheKey,
        () => utils.adjustBrightness(tileDef.bgColor, tileBrightness));

      display.draw(this.x + tile.x, this.y + tile.y, tileDef.glyph,
        fgAdjusted, bgAdjusted);
    });

    this.enemies
      .forEach(enemy => enemy
        .renderSquad(display, watchBrightness, this, this.x, this.y,
          this.journeySystem.playerSquadOverworldFov));
    this.squad.renderSquad(display, watchBrightness, this, this.x, this.y);
  }

  inputHandler(input) {
    // Map handles many stateful inputs, so dispatch to the system
    const shouldStep = this.journeySystem.handleInput(input, this);
    if (shouldStep) {
      this.journeySystem.step();
    }

    // Trigger a redraw
    this.game.refresh();
  }

  getCommands() {
    return [
      '[←→↑↓] March',
      '[Z] Rest',
      '[I] Inventory'
    ];
  }
}
