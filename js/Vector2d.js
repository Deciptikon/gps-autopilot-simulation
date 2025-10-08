export default class Vector2d {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  // Копирует вектор
  copy() {
    return new Vector2d(this.x, this.y);
  }

  // Сложение с другим вектором
  add(v) {
    return new Vector2d(this.x + v.x, this.y + v.y);
  }

  // Вычитание другого вектора
  sub(v) {
    return new Vector2d(this.x - v.x, this.y - v.y);
  }

  // Умножение на скаляр
  mul(scalar) {
    return new Vector2d(this.x * scalar, this.y * scalar);
  }

  // Вычисление длины вектора
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  // Нормализация вектора (с масштабированием)
  normalize(scalar = 1) {
    const mag = this.magnitude();
    if (mag > 0) {
      return this.mul(scalar / mag);
    }
    return new Vector2d();
  }

  ortho() {
    return new Vector2d(-this.y, this.x);
  }
}
