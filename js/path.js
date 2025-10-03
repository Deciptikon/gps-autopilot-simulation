export class Path {
  constructor(width = 1) {
    this.width = width;
    this.points = [];

    this.startIndex = 0;
    this.finishIndex = 0;

    this.leftBound = [];
    this.rightBound = [];
  }

  app(point, index) {
    if (this.points.length === 0) {
      this.startIndex = index;
    }
    this.points.push(point);
    if (index > this.finishIndex) {
      this.finishIndex = index;
    }
  }

  getStartIndex() {
    return this.startIndex;
  }

  getFinishIndex() {
    return this.finishIndex;
  }

  get() {
    return this.points;
  }

  draw(scene) {}
}
