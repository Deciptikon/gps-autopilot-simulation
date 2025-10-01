import SceneManager from "./SceneManager.js";
import Vehicle from "./Vehicle.js";

class Game {
  constructor() {
    this.sceneManager = null;
    this.vehicle = null;
    this.keys = {};
    this.isRunning = false;

    this.init();
  }

  init() {
    // Инициализируем менеджер сцены
    this.sceneManager = new SceneManager();

    // Создаем транспортное средство
    this.vehicle = new Vehicle(this.sceneManager.getScene());

    // Настраиваем управление
    this.setupControls();

    // Запускаем игровой цикл
    this.start();
  }

  setupControls() {
    // Обработка нажатий клавиш
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;

      // Для отладки - логируем статус при нажатии пробела
      if (e.code === "Space") {
        this.vehicle.logStatus();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });
  }

  update() {
    let ang = 0;
    let gas = false;
    // Обрабатываем управление транспортным средством
    if (this.keys["KeyW"]) gas = true;
    if (this.keys["KeyS"]) gas = false;
    if (this.keys["KeyA"]) ang = 1;
    if (this.keys["KeyD"]) ang = -1;

    this.vehicle.move(ang, gas);

    // Обновляем физику даже когда клавиши не нажаты (для замедления)

    this.vehicle.updatePhysics();

    this.sceneManager.updateCamera(this.vehicle.getCameraData());
  }

  animate() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.animate());

    this.update();
    this.sceneManager.render();
  }

  start() {
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
  }
}

// Запускаем игру когда страница загружена
window.addEventListener("DOMContentLoaded", () => {
  new Game();
});
