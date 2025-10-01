import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js";

export default class SceneManager {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.ground = null;

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

    // Обработчик изменения размера окна
    window.addEventListener("resize", () => this.onWindowResize());
  }

  createGround() {
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x90ee90, // светло-зеленый
      side: THREE.DoubleSide,
    });

    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = Math.PI / 2; // Поворачиваем плоскость горизонтально
    this.ground.position.y = -2; // Опускаем землю ниже
    this.scene.add(this.ground);
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
    console.log(position, "  ", lookAt);

    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
  }
}
