
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
      const fgBrightnessAdjusted = this.cache.get(
        fgCacheKey,
        () => utils.adjustBrightness(tileDef.fgColor, tileBrightness));
      const bgCacheKey = `${tileDef.bgColor}-${tileBrightness}`;
      const bgBrightnessAdjusted = this.cache.get(
        bgCacheKey,
        () => utils.adjustBrightness(tileDef.bgColor, tileBrightness));

      // Only render environment if the tile is visible
      let fgAdjusted = fgBrightnessAdjusted;
      let bgAdjusted = bgBrightnessAdjusted;
      if (visibleTile) {
        // Adjust colors again for enviroment effects. Smoke overwrites fire.
        const fgSmokeAdjusted = utils.adjustFire(
          tile, fgBrightnessAdjusted, this.battleSystem.environmentSystem, true);
        const bgSmokeAdjusted = utils.adjustFire(
          tile, bgBrightnessAdjusted, this.battleSystem.environmentSystem, false);

        fgAdjusted = utils.adjustSmoke(
          tile, fgSmokeAdjusted, this.battleSystem.environmentSystem);
        bgAdjusted = utils.adjustSmoke(
          tile, bgSmokeAdjusted, this.battleSystem.environmentSystem);
      }

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
    this.renderFiring(display, watchBrightness);

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

  renderFiring(display, watchBrightness) {
    const { projectile } = this.battleSystem;
    if (!projectile.active) {
      return;
    }
    const {
      weaponType,
      fireSequence,
      fireSequenceIndex
    } = projectile.fireAnimation;

    const roundInFlight = fireSequence[fireSequenceIndex];
    if (!roundInFlight) {
      return;
    }

    switch (weaponType) {
      case 'sidearm':
      case 'rifle':
      case 'automatic rifle':
        this.renderSmallArmsFire(display, watchBrightness, projectile);
        break;
      case 'grenade':
      case 'grenade launcher':
      case 'rocket launcher':
        this.renderExplosivesFire(display, watchBrightness, projectile);
        break;
      case 'flame thrower':
        this.renderFlameFire(display, watchBrightness, projectile);
        break;
    }
  }

  renderSmallArmsFire(display, watchBrightness, projectile) {
    const {
      fireSequence,
      fireSequenceIndex,
      fireGlyph,
      fireFgColor,
      muzzleGlyph,
      muzzleFgColor
    } = projectile.fireAnimation;

    // Index of the actual projectile line is the number of true fire sequence
    // items at or before the current fire sequence index
    const effectAreasIndex = fireSequence
      .slice(0, fireSequenceIndex)
      .filter(fireSequenceItem => fireSequenceItem)
      .length;

    // console.log(effectAreasIndex);
    // console.log(projectile.effectAreas);

    projectile.effectAreas[effectAreasIndex]

      // Only render visible points of the line
      .filter(point =>
        this.battleSystem.playerSquadLocalFov.isVisible(point.x, point.y))
      .forEach((point, i) => {
        const tile = this.map[utils.keyFromXY(point.x, point.y)];
        const tileDef = localTileDictionary[tile.name];
        const brighterThanWatch = Math.round(watchBrightness / 3);
        const glyph = i === 1 ? muzzleGlyph : fireGlyph;
        const bgAdjusted = i === 1 ?
          muzzleFgColor :
          utils.adjustBrightness(tileDef.bgColor, brighterThanWatch);
        display.draw(this.x + point.x, this.y + point.y, glyph, fireFgColor, bgAdjusted);
      });
  }

  renderExplosivesFire(display, watchBrightness, projectile) {
    const {
      fireSequence,
      fireSequenceIndex,
      fireGlyph,
      fireFgColor,
      muzzleGlyph,
      muzzleFgColor
    } = projectile.fireAnimation;

    if (fireSequenceIndex === 1) {
      const { x, y } = fireSequence[1];
      display.draw(this.x + x, this.y + y, muzzleGlyph, fireFgColor, muzzleFgColor);
    }
    else if (fireSequenceIndex > 1) {
      const { x, y } = fireSequence[fireSequenceIndex];

      // Only render visible points of the line
      if (!this.battleSystem.playerSquadLocalFov.isVisible(x, y)) {
        return;
      }
      const tile = this.map[utils.keyFromXY(x, y)];
      const tileDef = localTileDictionary[tile.name];
      const brighterThanWatch = Math.round(watchBrightness / 3);
      const bgAdjusted = utils.adjustBrightness(tileDef.bgColor, brighterThanWatch);
      display.draw(this.x + x, this.y + y, fireGlyph, fireFgColor, bgAdjusted);
    }
    if (fireSequenceIndex >= fireSequence.length - 3) {
      projectile.effectAreas[1]

        // Only render visible points of the line
        .filter(point => this.battleSystem.playerSquadLocalFov.isVisible(point.x, point.y))
        .forEach((point) => {
          const tile = this.map[utils.keyFromXY(point.x, point.y)];
          const tileDef = localTileDictionary[tile.name];
          const brighterThanWatch = Math.round(watchBrightness / 3);
          const fgAdjusted = utils.adjustBrightness(tileDef.fgColor, brighterThanWatch);
          const bgAdjusted = utils.adjustBrightness(tileDef.bgColor, brighterThanWatch);

          // console.log(`blast: ${point.x}x${point.y}`);
          display.draw(this.x + point.x, this.y + point.y, tileDef.glyph, bgAdjusted, fgAdjusted);
        });
    }
  }

  renderFlameFire(display, watchBrightness, projectile) {
    const {
      fireSequence,
      fireSequenceIndex,
      fireGlyph,
      fireFgColor,
      fireBgColor
    } = projectile.fireAnimation;

    fireSequence.slice(0, fireSequenceIndex)
      .forEach(area =>
        area

          // Only render visible points of the line
          .filter(point =>
            this.battleSystem.playerSquadLocalFov.isVisible(point.x, point.y))
          .forEach((point) => {
            const brighterThanWatch = Math.round(watchBrightness / 3);
            const bgAdjusted = utils.adjustBrightness(fireBgColor, brighterThanWatch);
            display.draw(this.x + point.x, this.y + point.y, fireGlyph, fireFgColor, bgAdjusted);
          }));
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
      '[D] Toggle Weapon',
      '[S] Next Target',
      '[A] Cancel'
    ];
    return this.battleSystem.targetMode ?
      attackCommands : actionCommands;
  }
}
