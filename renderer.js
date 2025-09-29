// Рендерер для отображения симуляции
class GPSRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.camera = {
      x: 0,
      y: 0,
      scale: 1,
    };
  }

  render(simulation) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Настраиваем камеру слежения
    this.updateCamera(simulation.vehicle.position);
    this.applyCameraTransform();

    // Рисуем сетку
    this.drawGrid();

    // Рисуем маршрут
    this.drawRoute(
      simulation.waypoints,
      simulation.navigation.currentWaypointIndex
    );

    // Рисуем vehicle
    this.drawVehicle(simulation.vehicle, simulation.steeringSystem);

    // Рисуем целевую точку и траекторию
    this.drawTargetAndPath(simulation);

    // Сбрасываем трансформации для UI элементов
    this.resetTransform();

    // Рисуем UI информацию
    this.drawUI(simulation);
  }

  updateCamera(vehiclePosition) {
    // Плавное слежение за vehicle
    const targetX = vehiclePosition.x;
    const targetY = vehiclePosition.y;

    this.camera.x += (targetX - this.camera.x) * 0.1;
    this.camera.y += (targetY - this.camera.y) * 0.1;
  }

  applyCameraTransform() {
    this.ctx.save();
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.scale(this.camera.scale, this.camera.scale);
    this.ctx.translate(-this.camera.x, -this.camera.y);
  }

  resetTransform() {
    this.ctx.restore();
  }

  drawGrid() {
    this.ctx.strokeStyle = "#e0e0e0";
    this.ctx.lineWidth = 0.5;

    const gridSize = 50;
    const startX =
      Math.floor(
        (this.camera.x - this.canvas.width / 2 / this.camera.scale) / gridSize
      ) * gridSize;
    const startY =
      Math.floor(
        (this.camera.y - this.canvas.height / 2 / this.camera.scale) / gridSize
      ) * gridSize;
    const endX = startX + this.canvas.width / this.camera.scale + gridSize;
    const endY = startY + this.canvas.height / this.camera.scale + gridSize;

    for (let x = startX; x < endX; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }

    for (let y = startY; y < endY; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }
  }

  drawRoute(waypoints, currentIndex) {
    if (waypoints.length < 2) return;

    // Рисуем пройденный путь
    this.ctx.strokeStyle = "#95a5a6";
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(waypoints[0].x, waypoints[0].y);

    for (let i = 1; i <= currentIndex && i < waypoints.length; i++) {
      this.ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    this.ctx.stroke();

    // Рисуем оставшийся путь
    this.ctx.strokeStyle = "#e74c3c";
    this.ctx.setLineDash([]);
    this.ctx.beginPath();

    if (currentIndex < waypoints.length) {
      this.ctx.moveTo(waypoints[currentIndex].x, waypoints[currentIndex].y);
      for (let i = currentIndex + 1; i < waypoints.length; i++) {
        this.ctx.lineTo(waypoints[i].x, waypoints[i].y);
      }
      this.ctx.stroke();
    }

    // Рисуем точки маршрута
    waypoints.forEach((point, index) => {
      this.ctx.fillStyle =
        index === currentIndex
          ? "#e74c3c"
          : index < currentIndex
          ? "#95a5a6"
          : "#2ecc71";

      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      this.ctx.fill();

      // Номера точек
      this.ctx.fillStyle = "white";
      this.ctx.font = "10px Arial";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText((index + 1).toString(), point.x, point.y);
    });
  }

  drawVehicle(vehicle, steeringSystem) {
    this.ctx.save();
    this.ctx.translate(vehicle.position.x, vehicle.position.y);
    this.ctx.rotate(vehicle.heading);

    // Кузов
    this.ctx.fillStyle = "#3498db";
    this.ctx.fillRect(
      -vehicle.length / 2,
      -vehicle.width / 2,
      vehicle.length,
      vehicle.width
    );

    // Окна
    this.ctx.fillStyle = "#aed6f1";
    this.ctx.fillRect(
      -vehicle.length / 4,
      -vehicle.width / 2 + 0.1,
      vehicle.length / 2,
      vehicle.width - 0.2
    );

    // Колеса
    this.ctx.fillStyle = "#2c3e50";
    const wheelWidth = 0.3;
    const wheelLength = 0.8;

    // Передние колеса (поворачиваются)
    this.drawWheel(
      vehicle.length / 2 - 0.2,
      -vehicle.width / 2 - wheelWidth / 2,
      steeringSystem.actualAngle,
      wheelLength,
      wheelWidth
    );
    this.drawWheel(
      vehicle.length / 2 - 0.2,
      vehicle.width / 2 + wheelWidth / 2,
      steeringSystem.actualAngle,
      wheelLength,
      wheelWidth
    );

    // Задние колеса (не поворачиваются)
    this.drawWheel(
      -vehicle.length / 2 + 0.2,
      -vehicle.width / 2 - wheelWidth / 2,
      0,
      wheelLength,
      wheelWidth
    );
    this.drawWheel(
      -vehicle.length / 2 + 0.2,
      vehicle.width / 2 + wheelWidth / 2,
      0,
      wheelLength,
      wheelWidth
    );

    // Направление движения
    this.ctx.strokeStyle = "#e74c3c";
    this.ctx.lineWidth = 0.3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(vehicle.length, 0);
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawWheel(x, y, angle, length, width) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate((angle * Math.PI) / 180);
    this.ctx.fillRect(-length / 2, -width / 2, length, width);
    this.ctx.restore();
  }

  drawTargetAndPath(simulation) {
    const target = simulation.navigation.getCurrentTarget();
    if (!target) return;

    // Целевая точка
    this.ctx.fillStyle = "rgba(231, 76, 60, 0.3)";
    this.ctx.beginPath();
    this.ctx.arc(
      target.x,
      target.y,
      simulation.navigation.arrivalThreshold,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // Линия к цели
    this.ctx.strokeStyle = "rgba(231, 76, 60, 0.5)";
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([2, 2]);
    this.ctx.beginPath();
    this.ctx.moveTo(
      simulation.vehicle.position.x,
      simulation.vehicle.position.y
    );
    this.ctx.lineTo(target.x, target.y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  drawUI(simulation) {
    // Панель статуса
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    this.ctx.fillRect(10, 10, 250, 120);

    this.ctx.fillStyle = "#2c3e50";
    this.ctx.font = "12px Arial";
    this.ctx.textAlign = "left";

    const info = simulation.debugInfo;
    if (info) {
      const lines = [
        `Режим: ${simulation.mode.toUpperCase()}`,
        `Скорость: ${(info.speed * 3.6).toFixed(1)} км/ч`,
        `Целевой угол: ${info.targetSteering.toFixed(1)}°`,
        `Факт. угол: ${info.actualSteering.toFixed(1)}°`,
        `Точка: ${info.currentWaypoint}/${info.totalWaypoints}`,
        `Дистанция: ${info.distanceToTarget.toFixed(1)} м`,
        `Ошибка угла: ${info.angleError.toFixed(1)}°`,
      ];

      lines.forEach((line, index) => {
        this.ctx.fillText(line, 20, 30 + index * 15);
      });
    }

    // Предупреждение об аварийной остановке
    if (simulation.emergencyStop) {
      this.ctx.fillStyle = "rgba(231, 76, 60, 0.8)";
      this.ctx.fillRect(this.canvas.width / 2 - 100, 20, 200, 40);
      this.ctx.fillStyle = "white";
      this.ctx.font = "bold 16px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText("АВАРИЙНАЯ ОСТАНОВКА", this.canvas.width / 2, 45);
    }
  }
}
