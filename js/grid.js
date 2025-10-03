export class Grid {
  constructor() {
    this.data = new Map();
    this.bounds = {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    };
  }

  _updateBounds(x, y) {
    this.bounds.minX = Math.min(this.bounds.minX, x);
    this.bounds.maxX = Math.max(this.bounds.maxX, x);
    this.bounds.minY = Math.min(this.bounds.minY, y);
    this.bounds.maxY = Math.max(this.bounds.maxY, y);
  }

  _key(x, y) {
    return `${x},${y}`;
  }

  set(x, y, value) {
    const key = this._key(x, y);
    this.data.set(key, value);
    this._updateBounds(x, y);
    return this;
  }

  get(x, y, defaultValue = null) {
    const key = this._key(x, y);
    return this.data.has(key) ? this.data.get(key) : defaultValue;
  }

  has(x, y) {
    return this.data.has(this._key(x, y));
  }

  delete(x, y) {
    const key = this._key(x, y);
    const deleted = this.data.delete(key);

    // Если удалили элемент на границе, нужно пересчитать границы
    if (
      deleted &&
      (x === this.bounds.minX ||
        x === this.bounds.maxX ||
        y === this.bounds.minY ||
        y === this.bounds.maxY)
    ) {
      this._recalculateBounds();
    }
    return deleted;
  }

  _recalculateBounds() {
    this.bounds = {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    };

    for (const key of this.data.keys()) {
      const [x, y] = key.split(",").map(Number);
      this._updateBounds(x, y);
    }
  }

  // Получить все занятые ячейки
  entries() {
    return Array.from(this.data.entries()).map(([key, value]) => {
      const [x, y] = key.split(",").map(Number);
      return { x, y, value };
    });
  }

  // Получить размеры сетки
  getSize() {
    if (this.data.size === 0) return { width: 0, height: 0 };
    return {
      width: this.bounds.maxX - this.bounds.minX + 1,
      height: this.bounds.maxY - this.bounds.minY + 1,
    };
  }

  // Получить границы
  getBounds() {
    return { ...this.bounds };
  }

  // Итерация по всем занятым ячейкам
  forEach(callback) {
    this.data.forEach((value, key) => {
      const [x, y] = key.split(",").map(Number);
      callback(value, x, y);
    });
  }

  // Преобразовать в плотный 2D массив (если нужно)
  toDenseArray(defaultValue = null) {
    if (this.data.size === 0) return [];

    const { minX, maxX, minY, maxY } = this.bounds;
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    const array = Array(height)
      .fill()
      .map(() => Array(width).fill(defaultValue));

    this.forEach((value, x, y) => {
      array[y - minY][x - minX] = value;
    });

    return array;
  }

  // Очистить сетку
  clear() {
    this.data.clear();
    this.bounds = {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    };
  }

  // Количество занятых ячеек
  get size() {
    return this.data.size;
  }
}
