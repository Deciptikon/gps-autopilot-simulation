import { SCALE } from "./constants.js";
import Vector2d from "./Vector2d.js";

export default class VirtualCanvas {
  constructor(physicalCanvas, ground, virtualScale = 1) {
    this.physicalCanvas = physicalCanvas; // Твой ограниченный canvas-текстура
    this.ctx = physicalCanvas.getContext("2d");

    // Виртуальный canvas в N раз больше физического
    this.virtualScale = virtualScale;
    this.virtualCanvas = document.createElement("canvas");
    this.virtualCanvas.width = physicalCanvas.width * 1.1;
    this.virtualCanvas.height = physicalCanvas.height * 1.1;
    this.virtualCtx = this.virtualCanvas.getContext("2d");

    this.ground = ground;

    // Область просмотра (какую часть виртуального canvas показывать)
    this.viewport = {
      x: this.virtualCanvas.width / 2 - physicalCanvas.width / 2,
      y: this.virtualCanvas.height / 2 - physicalCanvas.height / 2,
      width: physicalCanvas.width,
      height: physicalCanvas.height,
    };
  }

  update(AL, AR, BL, BR, color = "rgba(0, 0, 255, 0.7)") {
    const al = this.convert(AL);
    const ar = this.convert(AR);
    const bl = this.convert(BL);
    const br = this.convert(BR);
    this.drawSegment(this.virtualCtx, al, ar, bl, br, color);
    this.renderViewport();
  }

  centered(point) {
    const p = this.convert(point);
    console.log("h=", this.virtualCanvas.height);

    console.log("p=", p);

    // Авто-центрирование viewport на последней точке
    this.viewport.x = p.x - this.physicalCanvas.width / 2;
    this.viewport.y = p.y - this.physicalCanvas.height / 2;

    this.centeredGround(point);
  }

  centeredGround(point) {
    this.ground.position.x = point.x;
    this.ground.position.z = point.y;
  }

  drawSegment(ctx, AL, AR, BL, BR, color = "rgba(0, 0, 255, 0.7)") {
    ctx.beginPath();
    ctx.moveTo(AL.x, AL.y);
    ctx.lineTo(BL.x, BL.y);
    ctx.lineTo(BR.x, BR.y);
    ctx.lineTo(AR.x, AR.y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    //this.ctx.strokeStyle = "rgba(0,0,0,0.3)";
    //this.ctx.stroke();
  }

  renderViewport() {
    // Очищаем физический canvas
    this.ctx.clearRect(
      0,
      0,
      this.physicalCanvas.width,
      this.physicalCanvas.height
    );

    // Копируем видимую область из виртуального canvas
    this.ctx.drawImage(
      this.virtualCanvas,
      this.viewport.x,
      this.viewport.y, // что копируем (из виртуального)
      this.viewport.width,
      this.viewport.height,
      0,
      0, // куда копируем (в физический)
      this.physicalCanvas.width,
      this.physicalCanvas.height
    );
  }

  convert(point) {
    const y = this.virtualCanvas.height / 2 - point.y * SCALE;
    const x = this.virtualCanvas.width / 2 + point.x * SCALE;
    return new Vector2d(x, y);
  }
}
