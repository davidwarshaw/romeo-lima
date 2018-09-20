export default class Cache {
  constructor() {
    self.cache = {};
  }

  get(key, cb) {
    if (key in self.cache) {
      return self.cache[key];
    }
    else {
      const value = cb();
      self.cache[key] = value;
      return value;
    }
  }
}
