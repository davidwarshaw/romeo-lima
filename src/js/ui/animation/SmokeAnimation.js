import properties from '../../properties';

export default class SmokeAnimation {
  constructor(x, y, updateFunction, bgTileArrays) {
    this.x = x;
    this.y = y;
    this.updateFunction = updateFunction;
    this.bgTileArrays = bgTileArrays;

    this.maxLevel = 8;
    this.smokeLevels = [
      { glyph: '░', colorFg: '#8f8080' },
      { glyph: '░', colorFg: '#4f4040' },
      { glyph: '░', colorFg: '#2f2020' },
      { glyph: '░', colorFg: '#0f0000' }
    ];

    this.points = {};
  }

  addSmoke(x, y) {
    const colorBg = (y >= 0 && y < this.bgTileArrays.length) &&
      (x >= 0 && x < this.bgTileArrays[0].length) ?
      this.bgTileArrays[y][x].colorBg :
      null;

    const key = `${x}-${y}`;
    if (!this.points[key]) {
      const level = 0;
      const newPoint = { x, y, colorBg, level };
      this.points[key] = newPoint;
    }
    else {
      const { level } = this.points[key];
      if (level < this.maxLevel) {
        this.points[key].level = level + 1;
      }
    }
  }

  addSmokeToNeighbors(x, y) {
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        this.addSmoke(x + j, y + i);
      }
    }
  }

  render(display) {
    Object.entries(this.points)
      .forEach(entry => {
        const { x, y, level, colorBg } = entry[1];
        const adjustedLevel = Math.round((this.smokeLevels.length - 1) * (level / this.maxLevel));
        const { glyph, colorFg } = this.smokeLevels[adjustedLevel];
        display.draw(x, y, glyph, colorFg, colorBg);
      });
  }

  frame() {
    const { x, y } = this;

    // Add randomized smoke to where the helicopter is now
    const offset = Math.round(properties.rng.getNormal(0, 1));
    this.addSmokeToNeighbors(x + offset, y);

    // Chance to add smoke to the neighbors of each point
    Object.entries(this.points)
      .forEach(entry => {
        const { x, y } = entry[1];
        const roll = properties.rng.getPercentage();
        if (roll < 10) {
          this.addSmokeToNeighbors(x, y);
        }
      });
  }
}
