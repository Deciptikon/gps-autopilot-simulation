// Основной файл инициализации
class MainApp {
  constructor() {
    this.canvas = document.getElementById("canvas");
    this.simulation = new GPSSimulation();
    this.renderer = new GPSRenderer(this.canvas);

    this.initEventListeners();
    this.startGameLoop();

    // Добавляем тестовые точки
    this.addTestWaypoints();
  }

  initEventListeners() {
    // Клик по canvas для добавления точек
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x =
        (e.clientX - rect.left - this.canvas.width / 2) /
          this.renderer.camera.scale +
        this.renderer.camera.x;
      const y =
        (e.clientY - rect.top - this.canvas.height / 2) /
          this.renderer.camera.scale +
        this.renderer.camera.y;

      this.simulation.addWaypoint(x, y);
    });

    // Кнопки режимов
    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const mode = e.target.dataset.mode;
        this.setMode(mode);

        // Обновляем активную кнопку
        document
          .querySelectorAll(".mode-btn")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
      });
    });

    // Действия
    document.getElementById("resetBtn").addEventListener("click", () => {
      this.simulation.reset();
    });

    document.getElementById("clearBtn").addEventListener("click", () => {
      this.simulation.clearWaypoints();
    });

    document.getElementById("addRandomBtn").addEventListener("click", () => {
      this.addRandomWaypoints();
    });

    document.getElementById("emergencyStop").addEventListener("click", () => {
      this.simulation.triggerEmergencyStop();
    });

    // Обновление UI статуса
    setInterval(() => this.updateStatusPanel(), 100);
  }

  setMode(mode) {
    this.simulation.setMode(mode);
    document.getElementById("currentMode").textContent = mode.toUpperCase();
  }

  addTestWaypoints() {
    // Добавляем тестовый маршрут по кругу
    const centerX = 400;
    const centerY = 300;
    const radius = 100;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      this.simulation.addWaypoint(x, y);
    }
  }

  addRandomWaypoints() {
    const count = 8;
    const spread = 200;

    for (let i = 0; i < count; i++) {
      const x = 400 + (Math.random() - 0.5) * spread;
      const y = 300 + (Math.random() - 0.5) * spread;
      this.simulation.addWaypoint(x, y);
    }
  }

  updateStatusPanel() {
    const info = this.simulation.debugInfo;
    if (info) {
      document.getElementById("speed").textContent = (info.speed * 3.6).toFixed(
        1
      );
      document.getElementById("targetSteering").textContent =
        info.targetSteering.toFixed(1);
      document.getElementById("actualSteering").textContent =
        info.actualSteering.toFixed(1);
      document.getElementById("backlashState").textContent = info.backlashState;
      document.getElementById("currentWaypoint").textContent =
        info.currentWaypoint;
      document.getElementById("totalWaypoints").textContent =
        info.totalWaypoints;
      document.getElementById("distanceToTarget").textContent =
        info.distanceToTarget.toFixed(1);
      document.getElementById("angleError").textContent =
        info.angleError.toFixed(1);
    }
  }

  startGameLoop() {
    const loop = (currentTime) => {
      const deltaTime = 1 / 60; // фиксированный шаг для стабильности

      this.simulation.update(deltaTime);
      this.renderer.render(this.simulation);

      requestAnimationFrame(loop);
    };

    loop();
  }
}

// Запуск приложения когда DOM загружен
document.addEventListener("DOMContentLoaded", () => {
  new MainApp();
});
