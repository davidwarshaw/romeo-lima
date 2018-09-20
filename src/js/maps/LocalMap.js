
import properties from '../properties';
import utils from '../util/utils';

import Cache from '../util/Cache';
import Window from '../ui/Window';

import tileDictionary from './data/tileDictionary.json';

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
    return tileDictionary[name];
  }

  brightnessForWatch() {
    const watch = this.playState.watch;
    const brightness = Math.round(Math.pow(Math.abs(watch - 6), 2) * -3);
    return brightness;
  }

  render(display) {
    const watchBrightness = this.brightnessForWatch();

    Object.values(this.map).forEach((tile) => {

      const tileDef = tileDictionary[tile.name];

      // If the tile is visible, brightness comes from time of day (watch)
      // Otherwise, tile gets default not visible brightness
      const visibleTile = this.battleSystem.playerSquadFov
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

      display.draw(this.x + tile.x, this.y + tile.y, tileDef.glyph,
        fgAdjusted, bgAdjusted);
    });

    this.renderTargetLine(display, watchBrightness);
    this.renderProjectile(display, watchBrightness);

    this.enemySquad
      .renderSquadMembers(display, watchBrightness, this, this.x, this.y,
        this.battleSystem.playerSquadFov);
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
      const tileDef = tileDictionary[tile.name];
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
    projectile.line

      // Only render visible points of the line
      .filter(point =>
        this.battleSystem.playerSquadFov.isVisible(point.x, point.y))
      .forEach((point, i) => {
        const tile = this.map[utils.keyFromXY(point.x, point.y)];
        const tileDef = tileDictionary[tile.name];
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
    this.battleSystem.tryToMoveSquad(input, this);

    // Trigger a redraw
    this.game.refresh();
  }

}
