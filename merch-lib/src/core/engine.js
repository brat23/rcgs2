import { store } from "../state/store.js";
import { CONSTANTS } from "../data/constants.js";

import { setupRoomEnvironment } from "./environment.js";

class Engine {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.pmremGenerator = null;
  }

  init(containerId, canvasId) {
    const container = document.getElementById(containerId);
    const canvas = document.getElementById(canvasId);

    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 3, 8);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.7;
    this.controls.zoomSpeed = 1.2;
    this.controls.screenSpacePanning = true;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    this.controls.target.set(0, 1, 0);

    this.setupLighting();
    
    // Grid
    const grid = new THREE.GridHelper(20, 20, 0x2a2a2e, 0x1a1a1e);
    this.scene.add(grid);

    this.animate = this.animate.bind(this);
    this.animate();

    window.addEventListener("resize", () => this.onWindowResize(container));
  }

  setupLighting() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    // Setup PMREM for environment reflections
    setupRoomEnvironment(); // Restore the polyfill
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
    
    if (THREE.RoomEnvironment) {
      this.scene.environment = this.pmremGenerator.fromScene(
        new THREE.RoomEnvironment(),
        0.04
      ).texture;
    }
  }

  onWindowResize(container) {
    if (!container || !this.renderer) return;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  focusOn(positionVector) {
    // Offset the target slightly up
    const newTarget = new THREE.Vector3(positionVector.x, 1 * CONSTANTS.GLB_SCALE * 50, positionVector.z);
    this.controls.target.copy(newTarget);
    this.controls.update();
  }
}

export const engine = new Engine();
