import ROT from 'rot-js';

ROT.RNG.setSeed(200);
ROT.Display.Rect.cache = true;

export default {
  width: 126,
  height: 38,
  overworldHeight: 30,
  localWidth: 100,
  localHeight: 30,
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
    [ROT.VK_I]: 'INVENTORY'
  },
  localMapNotVisibleBrightness: -75,
  projectileIntervalMillis: 1,
  projectileRoundBreakFrames: 1,
  projectileBurstBreakFrames: 5,
  maxInjuries: 2
};
