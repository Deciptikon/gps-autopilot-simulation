// Основной класс симуляции
class GPSSimulation {
  constructor() {
    this.vehicle = new Vehicle();
    this.steeringSystem = new SteeringSystem();
    this.navigation = new NavigationSystem();
    this.gpsSensor = new GPSSensor(this.vehicle);
    this.controller = new SteeringController();
    this.mode = "follow"; // текущий режим работы

    this.waypoints = [];
    this.isRunning = true;
    this.emergencyStop = false;
  }

  update(deltaTime) {
    if (!this.isRunning || this.emergencyStop) {
      this.vehicle.speed = 0;
      return;
    }

    // Получаем GPS данные
    const gpsData = this.gpsSensor.getData();

    // Обновляем навигацию
    const routeCompleted = this.navigation.update(gpsData.position);

    // Получаем текущую цель
    const currentTarget = this.navigation.getCurrentTarget();

    if (currentTarget) {
      // Алгоритм управления с учетом режима
      const targetSteering = this.controller.calculate(
        gpsData,
        this.navigation.getPathToNext(),
        this.mode
      );

      // Применяем управление к рулевой системе
      const actualSteering = this.steeringSystem.update(
        targetSteering,
        deltaTime
      );

      this.updateWayPoints(gpsData.position, this.navigation);

      // Обновляем скорость в зависимости от режима
      this.updateSpeedBasedOnMode();

      // Обновляем vehicle
      this.vehicle.update(deltaTime, actualSteering);

      // Обновляем UI данные
      this.updateDebugInfo(
        gpsData,
        targetSteering,
        actualSteering,
        currentTarget
      );
    } else {
      this.vehicle.speed *= 0.95; // плавная остановка
      this.vehicle.update(deltaTime, 0);
    }
  }

  updateSpeedBasedOnMode() {
    const speedConfig = {
      stop: 0,
      follow: 5.0,
      precision: 2.0,
      aggressive: 8.0,
      smooth: 4.0,
    };

    const targetSpeed = speedConfig[this.mode] || 5.0;

    // Плавное изменение скорости
    const acceleration = 2.0;
    if (this.vehicle.speed < targetSpeed) {
      this.vehicle.speed = Math.min(
        this.vehicle.speed + acceleration * 0.016,
        targetSpeed
      );
    } else if (this.vehicle.speed > targetSpeed) {
      this.vehicle.speed = Math.max(
        this.vehicle.speed - acceleration * 0.016,
        targetSpeed
      );
    }
  }

  updateDebugInfo(gpsData, targetSteering, actualSteering, currentTarget) {
    this.debugInfo = {
      speed: this.vehicle.speed,
      targetSteering: targetSteering,
      actualSteering: actualSteering,
      backlashState: this.steeringSystem.backlashState,
      currentWaypoint: this.navigation.currentWaypointIndex + 1,
      totalWaypoints: this.navigation.waypoints.length,
      distanceToTarget: Math.sqrt(
        Math.pow(gpsData.position.x - currentTarget.x, 2) +
          Math.pow(gpsData.position.y - currentTarget.y, 2)
      ),
      angleError: this.controller.lastAngleError || 0,
    };
  }

  setMode(mode) {
    this.mode = mode;
    console.log(`Режим изменен на: ${mode}`);
  }

  addWaypoint(x, y) {
    this.navigation.addWaypoint(x, y);
    this.waypoints.push({ x, y });
  }

  clearWaypoints() {
    this.navigation.clearWaypoints();
    this.waypoints = [];
  }

  updateWayPoints(position, navigation) {
    if (this.waypoints === null || this.waypoints.length < 1) {
      return;
    }

    const distance = Math.sqrt(
      Math.pow(position.x - this.waypoints[0].x, 2) +
        Math.pow(position.y - this.waypoints[0].y, 2)
    );

    if (distance < 5) {
      this.waypoints.shift();
      navigation.shiftWayPoints();
    }
  }

  reset() {
    this.vehicle.reset();
    this.steeringSystem.reset();
    this.navigation.reset();
    this.emergencyStop = false;
  }

  triggerEmergencyStop() {
    this.emergencyStop = true;
    this.vehicle.speed = 0;
    this.steeringSystem.reset();
  }
}

// Модель транспортного средства
class Vehicle {
  constructor() {
    this.reset();
  }

  reset() {
    this.position = { x: 400, y: 300 };
    this.velocity = { x: 0, y: 0 };
    this.heading = 0; // направление движения (радианы)
    this.steeringAngle = 0; // угол поворота колес
    this.speed = 0;

    // Характеристики ТС
    this.wheelbase = 2.5;
    this.maxSteeringAngle = Math.PI / 4;
    this.length = 4.5;
    this.width = 1.8;
  }

  update(deltaTime, steeringAngle) {
    this.steeringAngle = (steeringAngle * Math.PI) / 180; // переводим в радианы

    // Кинематическая модель велосипеда
    if (Math.abs(this.steeringAngle) > 0.001 && Math.abs(this.speed) > 0.1) {
      const turnRadius = this.wheelbase / Math.tan(this.steeringAngle);
      const angularVelocity = this.speed / turnRadius;
      this.heading += angularVelocity * deltaTime;
    }

    // Обновление позиции
    this.position.x += Math.cos(this.heading) * this.speed * deltaTime;
    this.position.y += Math.sin(this.heading) * this.speed * deltaTime;

    // Нормализация угла
    while (this.heading > Math.PI) this.heading -= 2 * Math.PI;
    while (this.heading < -Math.PI) this.heading += 2 * Math.PI;
  }
}

// Рулевая система с люфтами
class SteeringSystem {
  constructor() {
    this.reset();
    this.config = {
      maxStepsPerSecond: 200,
      stepsPerDegree: 15,
      deadZone: 0.05,
      backlash: 3,
      nonlinearity: 0.4,
      friction: 0.15,
      maxSteeringAngle: 40,
    };
  }

  reset() {
    this.actualAngle = 0;
    this.targetAngle = 0;
    this.lastDirection = 0;
    this.backlashState = 0;
    this.backlashRemaining = 0;
  }

  update(targetAngle, deltaTime) {
    // Ограничение целевого угла
    this.targetAngle = Math.max(
      -this.config.maxSteeringAngle,
      Math.min(this.config.maxSteeringAngle, targetAngle)
    );

    const targetSteps = this.targetAngle * this.config.stepsPerDegree;
    const currentSteps = this.actualAngle * this.config.stepsPerDegree;
    let stepDifference = targetSteps - currentSteps;

    // Применяем люфт
    stepDifference = this.applyBacklash(stepDifference);

    // Нелинейность (больше сопротивление при больших углах)
    const angleRatio =
      Math.abs(this.actualAngle) / this.config.maxSteeringAngle;
    const nonlinearGain = 1 - angleRatio * this.config.nonlinearity;
    stepDifference *= nonlinearGain;

    // Трение (сильнее при малых скоростях изменения)
    const friction =
      this.config.friction * (1 - Math.abs(stepDifference) / 100);
    stepDifference *= 1 - friction;

    // Ограничение скорости шаговика
    const maxSteps = this.config.maxStepsPerSecond * deltaTime;
    const stepsToMove = Math.max(-maxSteps, Math.min(maxSteps, stepDifference));

    // Обновляем физический угол (игнорируем очень малые движения)
    if (
      Math.abs(stepsToMove) >
      this.config.deadZone * this.config.stepsPerDegree
    ) {
      this.actualAngle += stepsToMove / this.config.stepsPerDegree;
    }

    return this.actualAngle;
  }

  applyBacklash(stepDifference) {
    const direction = Math.sign(stepDifference);

    if (direction !== 0 && direction !== this.lastDirection) {
      // Смена направления - выбираем люфт
      if (this.backlashState !== direction) {
        const backlashSteps = this.config.backlash * direction;
        this.backlashState = direction;
        this.backlashRemaining = Math.abs(backlashSteps);

        // Поглощаем часть движения для выбора люфта
        const absorbed = Math.min(
          this.backlashRemaining,
          Math.abs(stepDifference)
        );
        stepDifference =
          Math.sign(stepDifference) * (Math.abs(stepDifference) - absorbed);
        this.backlashRemaining -= absorbed;
      }
    } else if (this.backlashRemaining > 0 && direction === this.lastDirection) {
      // Продолжаем выбирать люфт
      const absorbed = Math.min(
        this.backlashRemaining,
        Math.abs(stepDifference)
      );
      stepDifference =
        Math.sign(stepDifference) * (Math.abs(stepDifference) - absorbed);
      this.backlashRemaining -= absorbed;
    }

    this.lastDirection = direction;
    return stepDifference;
  }
}

// Навигационная система
class NavigationSystem {
  constructor() {
    this.reset();
  }

  reset() {
    this.waypoints = [];
    this.currentWaypointIndex = 0;
    this.arrivalThreshold = 3.0;
  }

  addWaypoint(x, y) {
    this.waypoints.push({ x, y });
  }

  clearWaypoints() {
    this.waypoints = [];
    this.currentWaypointIndex = 0;
  }

  shiftWayPoints() {
    this.waypoints.shift();
  }

  getCurrentTarget() {
    if (this.waypoints.length === 0) {
      return null;
    }
    return this.waypoints[0];
  }

  update() {
    if (this.waypoints.length === 0) return true;

    const target = this.getCurrentTarget();
    if (!target) return true; // маршрут завершен

    return false;
  }

  getPathToNext() {
    if (this.waypoints.length === 0) return [];
    return this.waypoints;
  }
}

// GPS сенсор
class GPSSensor {
  constructor(vehicle) {
    this.vehicle = vehicle;
    this.noiseLevel = 0.3;
    this.updateFrequency = 5;
    this.lastUpdate = 0;
    this.lastData = null;
  }

  getData() {
    const now = Date.now();

    if (now - this.lastUpdate < 1000 / this.updateFrequency && this.lastData) {
      return this.lastData;
    }

    this.lastUpdate = now;

    // Добавляем шум
    const positionNoise = {
      x: (Math.random() - 0.5) * this.noiseLevel,
      y: (Math.random() - 0.5) * this.noiseLevel,
    };

    // Небольшой шум к углу
    const headingNoise = (Math.random() - 0.5) * 0.05;

    this.lastData = {
      position: {
        x: this.vehicle.position.x + positionNoise.x,
        y: this.vehicle.position.y + positionNoise.y,
      },
      heading: this.vehicle.heading + headingNoise,
      speed: this.vehicle.speed,
      timestamp: now,
    };

    return this.lastData;
  }
}

// Контроллер руления
class SteeringController {
  constructor() {
    this.lookaheadDistance = 8.0;
    this.maxSteeringAngle = 40;
    this.lastAngleError = 0;

    // Параметры для разных режимов
    this.modeParams = {
      stop: { kp: 0, ki: 0, kd: 0, lookahead: 0 },
      follow: { kp: 2.5, ki: 0.1, kd: 0.8, lookahead: 8.0 },
      precision: { kp: 3.0, ki: 0.2, kd: 1.2, lookahead: 5.0 },
      aggressive: { kp: 4.0, ki: 0.05, kd: 0.5, lookahead: 12.0 },
      smooth: { kp: 1.8, ki: 0.15, kd: 1.5, lookahead: 10.0 },
    };

    this.integralError = 0;
    this.lastError = 0;
  }

  calculate(gpsData, waypoints, mode) {
    if (waypoints.length < 1 || mode === "stop") {
      this.lastAngleError = 0;
      return 0;
    }

    const params = this.modeParams[mode] || this.modeParams.follow;
    const targetPoint = this.findTargetPoint(waypoints);

    if (!targetPoint) {
      this.lastAngleError = 0;
      return 0;
    }

    // Вычисляем желаемое направление
    const targetAngle = Math.atan2(
      targetPoint.y - gpsData.position.y,
      targetPoint.x - gpsData.position.x
    );
    console.log(`targetAngle = ${targetAngle}`);

    // Ошибка угла
    let angleError = targetAngle - gpsData.heading;

    // Нормализация ошибки в [-PI, PI]
    while (angleError > Math.PI) angleError -= 2 * Math.PI;
    while (angleError < -Math.PI) angleError += 2 * Math.PI;

    this.lastAngleError = angleError * (180 / Math.PI); // для отладки

    // Преобразуем в градусы и ограничиваем
    let steering = angleError * (180 / Math.PI) * 0.25;
    steering = Math.max(
      -this.maxSteeringAngle,
      Math.min(this.maxSteeringAngle, steering)
    );

    return steering;
  }

  findTargetPoint(waypoints) {
    if (waypoints !== null && waypoints.length > 0) {
      return waypoints[0];
    } else {
      return null;
    }
  }
}
