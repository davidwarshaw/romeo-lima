import ROT from 'rot-js';

ROT.RNG.setSeed(200);
ROT.Display.Rect.cache = true;

export default {
  debug: {
    showInvisibleEnemies: true,
    invisibleEnemiesFgColor: '#AA9F9D'
  },
  width: 126,
  height: 38,
  overworldWidth: 126,
  overworldHeight: 25,
  localWidth: 100,
  localHeight: 25,
  contextCommandsHeight: 3,
  fontSize: 16,
  displaySpacing: 1.0,
  displayBorder: 0.0,
  rng: ROT.RNG,
  keyMap: {
    [ROT.VK_LEFT]: 'LEFT',
    [ROT.VK_RIGHT]: 'RIGHT',
    [ROT.VK_UP]: 'UP',
    [ROT.VK_DOWN]: 'DOWN',
    [ROT.VK_RETURN]: 'ENTER',
    [ROT.VK_Z]: 'WAIT',
    [ROT.VK_A]: 'ATTACK',
    [ROT.VK_S]: 'NEXT TARGET',
    [ROT.VK_P]: 'PRONE',
    [ROT.VK_E]: 'ENTER/EXIT',
    [ROT.VK_I]: 'INVENTORY',
    [ROT.VK_T]: 'TAKE',
    [ROT.VK_1]: 'NUM_1',
    [ROT.VK_2]: 'NUM_2',
    [ROT.VK_3]: 'NUM_3',
    [ROT.VK_4]: 'NUM_4',
    [ROT.VK_5]: 'NUM_5',
    [ROT.VK_6]: 'NUM_6',
    [ROT.VK_7]: 'NUM_7',
    [ROT.VK_8]: 'NUM_8'
  },
  localMapNotVisibleBrightness: -75,
  overworldMapNotVisibleBrightness: -60,
  baseOverworldEnemyProb: 0.60,
  xOverworldEnemyProb: 0.75,
  southernOverworldEnemyHeight: 5,
  southernOverworldEnemyProb: 0.99,
  localStartingDepth: 5,
  lootDropsPerEnemyMember: 5,
  projectileIntervalMillis: 1,
  projectileRoundBreakFrames: 1,
  projectileBurstBreakFrames: 5,
  maxInjuries: 2
};
