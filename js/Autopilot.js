import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js";

import { Grid } from "./grid.js";
import { ListPath } from "./list_path.js";
import {
  allSegments,
  drawCircle,
  fillGround,
  findPointsInAABB,
  worldToScreen,
  worldToScreenVec2d,
} from "./function.js";
import { CANVAS_SIZE, GROUND_SIZE, SCALE } from "./constants.js";
import Vector2d from "./Vector2d.js";
import VirtualCanvas from "./VirtualCanvas.js";

const Y_LAND = -1.9;

export default class Autopilot {
  constructor(scene, step = 10, width = 3) {
    this.scene = scene;
    this.ground = null;
    this.ctx = null;
    this.texture = null;
    this.material = null;
    this.virtualCanvas = null;

    this.position = { x: 0, y: 0, z: 0 };

    this.step = step;
    this.chunks = null;

    this.lastPosition = null;
    this.currentPosition = null;
    this.pointMarkers = [];

    this.width = width;
    this.points = [];
    this.leftPoints = [];
    this.rightPoints = [];

    this.vertices = [];
    this.indices = [];

    this.geometry = new THREE.BufferGeometry();
    this.mesh = null;

    this.active = true;
  }

  init() {
    this.chunks = new Grid();

    const canvas = document.createElement("canvas");
    canvas.height = CANVAS_SIZE.h;
    canvas.width = CANVAS_SIZE.w;
    this.ctx = canvas.getContext("2d");

    //fillGround(this.ctx, "#00ff00");

    this.texture = new THREE.CanvasTexture(canvas);
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      side: THREE.DoubleSide, // Важно для плоскости
      transparent: true, // Если используются прозрачные цвета
      opacity: 1.0,
    });

    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(GROUND_SIZE.w, GROUND_SIZE.h),
      this.material
    );
    this.ground.rotation.x = Math.PI / 2;
    this.ground.position.y = -2;
    this.scene.add(this.ground);

    this.virtualCanvas = new VirtualCanvas(canvas, this.ground, SCALE);
    //fillGround(this.ctx);
    //this.texture.needsUpdate = true;
  }

  _convert(val) {
    if (val > 0) {
      return val % this.step;
    } else {
      return (val - 1) % this.step;
    }
  }

  swapActive() {
    this.active = !this.active;
  }

  clear() {
    this.position = { x: 0, y: 0, z: 0 };
    this.chunks = null;

    this.lastPosition = null;
    this.currentPosition = null;
    this.pointMarkers = [];

    this.width = width;
    this.points = [];
    this.vertices = [];
    this.indices = [];

    this.geometry = null;
    this.mesh = null;
  }

  app(point, index) {
    const X = this._convert(point.x);
    const Y = this._convert(point.y);

    const chunk = this.chunks.get(X, Y);
    if (chunk === null) {
      const listPath = new ListPath();
      listPath.app(point, index);
      this.chunks.set(X, Y, listPath);
    } else {
      chunk.app(point, index);
      //this.chunks.set(X, Y, chunk);
    }
  }

  get(x, y) {
    const X = this._convert(x);
    const Y = this._convert(y);

    return this.chunks.get(X, Y);
  }

  update(gpsPosition) {
    if (gpsPosition === null || !this.active) {
      return;
    }

    this.lastPosition = this.currentPosition;
    this.currentPosition = new Vector2d(gpsPosition.x, gpsPosition.z);

    this.points.push(this.currentPosition);
    console.log(this.points.length);
    console.log("this.currentPosition = ", this.currentPosition);

    if (this.points.length < 2) {
      return;
    }

    const dir = this.currentPosition.sub(this.lastPosition);

    const orth = dir.ortho().normalize(this.width / 2);

    const leftPoint = this.currentPosition.sub(orth);
    const rightPoint = this.currentPosition.add(orth);

    this.leftPoints.push(leftPoint);
    this.rightPoints.push(rightPoint);

    const last = this.leftPoints.length - 1;
    if (last < 1) {
      return;
    }

    this.virtualCanvas.centered(this.currentPosition);

    this.virtualCanvas.update(
      this.leftPoints[last - 1],
      this.rightPoints[last - 1],
      this.leftPoints[last],
      this.rightPoints[last],
      "rgba(0, 0, 255, 0.72)"
    );

    /** 
    this.drawSegment(
      this.ctx,
      this.leftPoints[last - 1],
      this.rightPoints[last - 1],
      this.leftPoints[last],
      this.rightPoints[last],
      "rgba(255, 255, 0, 0.5)"
    );*/

    //fillGround(this.ctx); //, "#ff0000"
    //this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    //const p = worldToScreen2(this.currentPosition);
    //console.log(p);

    //drawCircle(this.ctx, this.currentPosition, 2 * SCALE);
    //console.log("---");

    this.texture.needsUpdate = true;
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

  update2(gpsPosition) {
    if (gpsPosition === null || !this.active) {
      return;
    }

    this.lastPosition = this.currentPosition;
    this.currentPosition = new THREE.Vector3(
      gpsPosition.x,
      Y_LAND,
      gpsPosition.z
    );

    this.points.push(this.currentPosition);

    const baseIndex = (this.points.length - 2) * 2;

    console.log(this.points.length);

    if (this.points.length < 2) {
      return;
    }

    const dir = new THREE.Vector3().subVectors(
      this.currentPosition,
      this.lastPosition
    );

    const orth = new THREE.Vector3(-dir.z, 0, dir.x)
      .normalize()
      .multiplyScalar(this.width / 2);

    const leftPoint = new THREE.Vector3().subVectors(
      this.currentPosition,
      orth
    );
    const rightPoint = new THREE.Vector3().addVectors(
      this.currentPosition,
      orth
    );
    this.leftPoints.push(leftPoint);
    this.rightPoints.push(rightPoint);

    if (this.vertices.length === 0) {
      this.leftPoints.push(leftPoint);
      this.rightPoints.push(rightPoint);
      this.vertices.push(
        leftPoint.x,
        leftPoint.y,
        leftPoint.z,
        rightPoint.x,
        rightPoint.y,
        rightPoint.z
      );
    }

    this.vertices.push(
      leftPoint.x,
      leftPoint.y,
      leftPoint.z,
      rightPoint.x,
      rightPoint.y,
      rightPoint.z
    );

    this.indices.push(
      baseIndex,
      baseIndex + 1,
      baseIndex + 2,
      baseIndex + 1,
      baseIndex + 3,
      baseIndex + 2
    );
    this.updateGeometry();

    const localPoints = findPointsInAABB(
      this.currentPosition,
      this.points,
      2 * this.width,
      1
    );

    const lSeg = allSegments(
      leftPoint,
      localPoints,
      this.leftPoints,
      this.rightPoints
    );
    const rSeg = allSegments(
      rightPoint,
      localPoints,
      this.leftPoints,
      this.rightPoints
    );
    if (lSeg.length !== 0) {
      console.log("trans leftPoint");
      this.addPointMarker(leftPoint);
    }
    if (rSeg.length !== 0) {
      console.log("trans rightPoint");
      this.addPointMarker(rightPoint);
    }
  }

  addPointMarker(position) {
    // Создаем маленькую сферу как маркер точки
    const markerGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);

    marker.position.set(position.x, position.y + 0.1, position.z);
    this.scene.add(marker);
    this.pointMarkers.push(marker);
  }

  createGeometry() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(this.vertices, 3)
    );
    geometry.setIndex(this.indices);
    return geometry;
  }

  createMesh(material) {
    if (!this.mesh) {
      this.mesh = new THREE.Mesh(this.geometry, material);
    }
    return this.mesh;
  }

  updateGeometry() {
    // Обновляем атрибуты геометрии
    this.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(this.vertices, 3)
    );
    this.geometry.setIndex(this.indices);

    // Помечаем атрибуты для обновления
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.index.needsUpdate = true;

    // Пересчитываем границы для правильного отображения
    this.geometry.computeBoundingSphere();
  }
}
