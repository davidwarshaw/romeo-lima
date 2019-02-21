
import properties from '../properties';
import utils from '../util/utils';

import Cache from '../util/Cache';
import Window from '../ui/Window';

import localTileDictionary from './data/localTileDictionary.json';

export default class LocalMap extends Window {
  constructor(game, battleSystem) {
    super(
      properties.width - properties.localWidth, 0,
      properties.localWidth, properties.localHeight,
      'Local Map', 0);

    this.game = game;
    this.battleSystem = battleSystem;

    this.playState = game.playState;
    this.map = game.playState.localMap;
    this.squad = game.playState.squad;

    this.enemySquad = battleSystem.enemySquad;

    this.cache = new Cache();
  }

  getTile(x, y) {
    const name = this.map[utils.keyFromXY(x, y)].name;
    return localTileDictionary[name];
  }

  brightnessForWatch() {
    const watch = this.playState.watch;
    const brightness = Math.round(Math.pow(Math.abs(watch - 6), 2) * -3);
    return brightness;
  }

  render(display) {
    const watchBrightness = this.brightnessForWatch();

    Object.values(this.map).forEach((tile) => {

      const tileDef = localTileDictionary[tile.name];

      // If the tile is visible, brightness comes from time of day (watch)
      // Otherwise, tile gets default not visible brightness
      const visibleTile = this.battleSystem.playerSquadLocalFov
        .isVisible(tile.x, tile.y);
      const tileBrightness = visibleTile ?
        watchBrightness : properties.localMapNotVisibleBrightness;

      // Cache the adjusted colors for speediness
      const fgCacheKey = `${tileDef.fgColor}-${tileBrightness}`;
      const fgAdjusted = this.cache.get(
        fgCacheKey,
        () => utils.adjustBrightness(tileDef.fgColor, tileBrightness));
      const bgCacheKey = `${tileDef.bgColor}-${tileBrightness}`;
      const bgAdjusted = this.cache.get(
        bgCacheKey,
        () => utils.adjustBrightness(tileDef.bgColor, tileBrightness));

      // If we want to show the enemy FOV, query it and adjust the BG
      // color accordingly
      const enemyFovTile = properties.debug.showEnemyFov ?
        this.battleSystem.enemySquadLocalFov.isVisible(tile.x, tile.y) :
        false;
      const enemyCoverMapTile = properties.debug.showEnemyCoverMap ?
        this.battleSystem.enemySquad.coverMap.isVisible(tile.x, tile.y) :
        false;

      let bgDebugAdjusted = bgAdjusted;
      if (enemyFovTile) {
        bgDebugAdjusted = properties.debug.enemyFovBgColor;
      }
      if (enemyCoverMapTile) {
        bgDebugAdjusted = properties.debug.enemyCoverMapBgColor;
      }

      display.draw(this.x + tile.x, this.y + tile.y, tileDef.glyph,
        fgAdjusted, bgDebugAdjusted);
    });

    this.renderTargetLine(display, watchBrightness);
    this.renderProjectile(display, watchBrightness);

    this.enemySquad
      .renderSquadMembers(display, watchBrightness, this, this.x, this.y,
        this.battleSystem.playerSquadLocalFov);
    this.squad
      .renderSquadMembers(display, watchBrightness, this, this.x, this.y);
  }

  renderTargetLine(display) {
    const { target, projectile } = this.battleSystem;

    // Early exit if projectile is in flight
    if (projectile.active) {
      return;
    }
    target.line.forEach((point) => {
      const tile = this.map[utils.keyFromXY(point.x, point.y)];
      const tileDef = localTileDictionary[tile.name];
      const highlightValue = 20;
      const fgAdjusted = utils
        .adjustBrightness(tileDef.fgColor, highlightValue);
      const bgAdjusted = utils
        .adjustBrightness(tileDef.bgColor, highlightValue);
      display.draw(this.x + point.x, this.y + point.y, tileDef.glyph,
        fgAdjusted, bgAdjusted);
    });
  }

  renderProjectile(display, watchBrightness) {
    const { projectile } = this.battleSystem;
    const roundInFlight = projectile.fireSequence[projectile.fireSequenceIndex];
    if (!projectile.active || !roundInFlight) {
      return;
    }

    // Index of the actual projectile line is the number of true fire sequence
    // items at or before the current fire sequence index
    const actualLinesIndex = projectile.fireSequence
      .slice(0, projectile.fireSequenceIndex)
      .filter(fireSequenceItem => fireSequenceItem)
      .length;

    console.log(actualLinesIndex);
    console.log(projectile.actualLines);

    projectile.actualLines[actualLinesIndex]

      // Only render visible points of the line
      .filter(point =>
        this.battleSystem.playerSquadLocalFov.isVisible(point.x, point.y))
      .forEach((point, i) => {
        const tile = this.map[utils.keyFromXY(point.x, point.y)];
        const tileDef = localTileDictionary[tile.name];
        const brighterThanWatch = Math.round(watchBrightness / 3);
        const glyph = i === 1 ?
          projectile.muzzleGlyph :
          projectile.glyph;
        const bgAdjusted = i === 1 ?
          projectile.muzzleFgColor :
          utils.adjustBrightness(tileDef.bgColor, brighterThanWatch);
        display.draw(this.x + point.x, this.y + point.y, glyph,
          projectile.fgColor, bgAdjusted);
      });
  }

  inputHandler(input) {
    // Map handles many stateful inputs, so dispatch to the system
    this.battleSystem.handleInput(input, this);

    // Trigger a redraw
    this.game.refresh();
  }

  getCommands() {
    const actionCommands = [
      '[←→↑↓] Move',
      '[Z] Wait',
      '[P] Prone/Stand',
      '[A] Target',
      '[I] Inventory',
      '[E] Escape'
    ];
    const attackCommands = [
      '[←→↑↓] Move',
      '[↵] Fire',
      '[S] Next Target',
      '[A] Cancel'
    ];
    return this.battleSystem.targetMode ?
      attackCommands : actionCommands;
  }
}
