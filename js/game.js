import Autopilot from "./Autopilot.js";
import GPS from "./GPS.js";
import SceneManager from "./SceneManager.js";
import Vehicle from "./Vehicle.js";

class Game {
  constructor() {
    this.sceneManager = null;
    this.vehicle = null;
    this.gps = null;

    this.keys = {};
    this.isRunning = false;

    this.init();
  }

  init() {
    // Инициализируем менеджер сцены
    this.sceneManager = new SceneManager();

    // Создаем транспортное средство
    this.vehicle = new Vehicle(this.sceneManager.getScene());

    // Создаём GPS
    this.gps = new GPS(this.sceneManager.getScene(), 0.4);

    this.autopilot = new Autopilot(this.sceneManager.getScene(), 50, 5);
    this.autopilot.init();

    // Настраиваем управление
    this.setupControls();

    this.addControlsInfo();

    // Запускаем игровой цикл
    this.start();
  }

  setupControls() {
    // Обработка нажатий клавиш
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;

      // Для отладки - логируем статус при нажатии пробела
      if (e.code === "Space") {
        this.autopilot.swapActive();
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

    this.gps.update(this.vehicle.getPosition());

    this.autopilot.update(this.gps.getPosition());
  }

  animate() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.animate());

    this.update();
    this.sceneManager.render();
  }

  addControlsInfo() {
    const controlsDiv = document.createElement("div");
    controlsDiv.className = "controls";
    controlsDiv.innerHTML = `
            <strong>Управление:</strong><br>
            W - вперед<br>
            A - влево<br>
            D - вправо<br>
            Space - вкл/выкл траекторию<br>
        `;
    document.body.appendChild(controlsDiv);
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
