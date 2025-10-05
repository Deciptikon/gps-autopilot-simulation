import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js";

import { Grid } from "./grid.js";
import { ListPath } from "./list_path.js";
import { allSegments, findPointsInAABB } from "./function.js";

const Y_LAND = -1.9;

export default class Autopilot {
  constructor(scene, step = 10, width = 3) {
    this.scene = scene;
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

    this.geometry = new THREE.BufferGeometry();
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    this.createMesh(material);
    this.scene.add(this.mesh);
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
