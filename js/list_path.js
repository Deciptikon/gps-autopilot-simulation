import { Path } from "./path.js";

export class ListPath {
  constructor() {
    this.listPath = [];
  }

  app(point, index) {
    for (const path of this.listPath) {
      if (path.getFinishIndex() + 1 === index) {
        path.app(point, index);
        return;
      }
    }

    const newPath = new Path();
    newPath.app(point, index);
    this.listPath.push(newPath);
  }

  get() {
    return this.listPath;
  }
}
