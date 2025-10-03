import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js";

export default class SceneManager {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.ground = null;
    this.grid = null;

    this.init();
  }

  init() {
    // Создаем сцену
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // голубой фон

    // Создаем камеру
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    // Создаем рендерер
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Создаем землю
    this.createGround();

    // Создаем сетку
    this.createGrid();

    // Обработчик изменения размера окна
    window.addEventListener("resize", () => this.onWindowResize());
  }

  createGround() {
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x90ee90, // светло-зеленый
      side: THREE.DoubleSide,
    });

    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = Math.PI / 2; // Поворачиваем плоскость горизонтально
    this.ground.position.y = -2; // Опускаем землю ниже
    this.scene.add(this.ground);
  }

  createGrid() {
    // Параметры сетки
    const size = 200; // Размер сетки (должен соответствовать размеру земли)
    const divisions = 200; // Количество делений (1 деление = 1 метр при размере 20)

    // Создаем сетку
    this.grid = new THREE.GridHelper(size, divisions, 0x000000, 0x000000);

    // Настраиваем внешний вид сетки
    this.grid.material.opacity = 0.2;
    this.grid.material.transparent = true;

    // Позиционируем сетку чуть выше земли, чтобы избежать конфликта z-fighting
    this.grid.position.y = -1.95;
    //this.grid.rotation.x = Math.PI / 2; // Поворачиваем горизонтально, как землю

    this.scene.add(this.grid);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

  updateCamera(data) {
    const [position, lookAt] = data;

    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
  }
}
