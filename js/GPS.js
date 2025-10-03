export default class GPS {
  constructor(scene, noise = 1, Hz = 1) {
    this.scene = scene;
    this.position = { x: 0, y: 0, z: 0 };
    this.noise = noise;
    this.Hz = Math.max(Hz, 0.000001);
    this.elapsedTime = 1000 / this.Hz;

    this.points = [];
    this.lastUpdate = 0;
    this.isNewPoint = false;

    // Для визуализации траектории
    this.trajectoryLine = null;
    this.pointMarkers = [];
    this.trajectoryColor = 0x0000ff;

    this.initTrajectory();
  }

  initTrajectory() {
    // Создаем геометрию для линии траектории
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([], 3)
    );

    // Материал для линии
    const lineMaterial = new THREE.LineBasicMaterial({
      color: this.trajectoryColor,
      linewidth: 2,
    });

    // Создаем линию
    this.trajectoryLine = new THREE.Line(lineGeometry, lineMaterial);
    this.trajectoryLine.frustumCulled = false;
    this.scene.add(this.trajectoryLine);
  }

  update(positionVehicle) {
    if (performance.now() - this.lastUpdate < this.elapsedTime) {
      return;
    }

    // Добавляем шум к позиции
    this.position = {
      x: positionVehicle.x + (Math.random() - 0.5) * this.noise,
      y: positionVehicle.y + (Math.random() - 0.5) * this.noise,
      z: positionVehicle.z + (Math.random() - 0.5) * this.noise,
    };

    this.points.push({ ...this.position });
    this.lastUpdate = performance.now();
    this.isNewPoint = true;

    // Обновляем визуализацию траектории
    this.updateTrajectory();

    // Добавляем визуальный маркер точки (опционально)
    this.addPointMarker(this.position);
  }

  updateTrajectory() {
    if (this.points.length < 2) return;

    // Создаем массив позиций для линии
    const positions = [];
    for (const point of this.points) {
      positions.push(point.x, point.y + 0.1, point.z); // +0.1 чтобы линия была чуть выше земли
    }

    // Обновляем геометрию линии
    this.trajectoryLine.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    this.trajectoryLine.geometry.attributes.position.needsUpdate = true;
  }

  addPointMarker(position) {
    // Создаем маленькую сферу как маркер точки
    const markerGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000, // Красный цвет маркеров
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);

    marker.position.set(position.x, position.y + 0.1, position.z);
    this.scene.add(marker);
    this.pointMarkers.push(marker);
  }

  // Очистка траектории
  clearTrajectory() {
    this.points = [];

    // Очищаем геометрию линии
    this.trajectoryLine.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([], 3)
    );

    // Удаляем все маркеры точек
    for (const marker of this.pointMarkers) {
      this.scene.remove(marker);
    }
    this.pointMarkers = [];
  }

  // Изменение цвета траектории
  setTrajectoryColor(color) {
    this.trajectoryColor = color;
    this.trajectoryLine.material.color.set(color);
  }

  getPosition() {
    if (this.isNewPoint) {
      this.isNewPoint = false;
      return { ...this.position };
    }

    return null;
  }

  getPoints() {
    return this.points;
  }
}
