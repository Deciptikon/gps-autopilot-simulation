import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js";

export default class Vehicle {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();

    // Физические параметры
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.speed = 0;
    this.maxSpeed = 0.01;
    this.acceleration = 0.0001;
    this.deceleration = 0.000001;
    this.turnSpeed = 0.003;

    // Управление
    this.angleRule = 0;
    this.angleLuft = 0.01;
    this.gas = true;

    this.init();
  }

  init() {
    // Основной корпус (длинный параллелепипед)
    const bodyGeometry = new THREE.BoxGeometry(1, 1, 3);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x4444ff });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 0.4;
    this.mesh.add(this.body);

    // Кабина (кубик сверху)
    const cabinGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cabinMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 });
    this.cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    this.cabin.position.set(0, 1, 1);
    this.body.add(this.cabin);

    // Гусеницы (два длинных параллелепипеда по бокам)
    const trackGeometry = new THREE.BoxGeometry(0.2, 1, 3);
    const trackMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });

    this.leftTrack = new THREE.Mesh(trackGeometry, trackMaterial);
    this.leftTrack.position.set(-0.6, -0.2, 0);
    this.body.add(this.leftTrack);

    this.rightTrack = new THREE.Mesh(trackGeometry, trackMaterial);
    this.rightTrack.position.set(0.6, -0.2, 0);
    this.body.add(this.rightTrack);

    // Ставим трактор на землю
    this.mesh.position.y = -1.2;
    this.scene.add(this.mesh);
  }

  // Управление движением с физикой
  move(angle, gas = true) {
    if (gas) {
      this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
    } else {
      this.speed = Math.max(this.speed - this.acceleration, 0);
    }
    if (Math.abs(angle) > this.angleLuft) {
      if (angle > 0) {
        this.rotation.y += this.turnSpeed;
      } else {
        this.rotation.y -= this.turnSpeed;
      }
    }
    this.updatePhysics();
  }

  // Упрощенная физика
  updatePhysics() {
    // Постепенное замедление
    if (this.speed > 0) {
      this.speed = Math.max(0, this.speed - this.deceleration * 0.1);
    } else if (this.speed < 0) {
      this.speed = Math.min(0, this.speed + this.deceleration * 0.1);
    }

    // Расчет новой позиции на основе скорости и направления
    const moveX = Math.sin(this.rotation.y) * this.speed;
    const moveZ = Math.cos(this.rotation.y) * this.speed;

    this.position.x -= moveX;
    this.position.z -= moveZ;

    this.updatePosition();
  }

  updatePosition() {
    if (this.mesh) {
      this.mesh.position.set(this.position.x, this.position.y, this.position.z);
      this.mesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
    }
  }

  getPosition() {
    return { ...this.position };
  }

  getSpeed() {
    return this.speed;
  }

  getCameraData() {
    const A = 10;
    const B = 10;
    const pos = this.getPosition();
    const dir = {
      x: Math.sin(this.rotation.y),
      y: 0,
      z: Math.cos(this.rotation.y),
    };

    const position = {
      x: pos.x + A * dir.x - 1,
      y: pos.y + A * dir.y + 10,
      z: pos.z + A * dir.z,
    };
    const look = {
      x: pos.x - B * dir.x,
      y: pos.y - B * dir.y,
      z: pos.z - B * dir.z,
    };
    return [position, look];
  }

  // Для отладки
  logStatus() {
    console.log(
      `Vehicle: x=${this.position.x.toFixed(2)}, z=${this.position.z.toFixed(
        2
      )}, speed=${this.speed.toFixed(2)}, rotation=${this.rotation.y.toFixed(
        2
      )}`
    );
  }
}
