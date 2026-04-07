import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      logarithmicDepthBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x16161e);
    this.scene.fog = new THREE.FogExp2(0x16161e, 0.018);

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.05, 150);
    this.camera.position.set(0, 12, 16);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2.02;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 50;
    this.controls.screenSpacePanning = true;
    this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: null // Allow context menu
    };

    this.setupLights();
    
    // Animation state
    this.animating = false;
    this.animStart = 0;
    this.animDuration = 600; // Faster (600ms)
    this.camStart = new THREE.Vector3();
    this.camEnd = new THREE.Vector3();
    this.trgStart = new THREE.Vector3();
    this.trgEnd = new THREE.Vector3();

    // Shake state
    this.shaking = false;
    this.shakeStart = 0;
    this.shakeDuration = 400;
    this.shakeIntensity = 0.4; // Increased intensity
    this.shakeOff = new THREE.Vector3();

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  setupLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
    sun.position.set(8, 18, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0005;
    Object.assign(sun.shadow.camera, {
      near: 0.5,
      far: 80,
      left: -18,
      right: 18,
      top: 12,
      bottom: -12,
    });
    this.scene.add(sun);

    const fillLight = new THREE.DirectionalLight(0xb8d0ff, 0.5);
    fillLight.position.set(-8, 10, -6);
    this.scene.add(fillLight);
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  focusCamera(position, target) {
    this.camStart.copy(this.camera.position);
    this.camEnd.copy(position);
    this.trgStart.copy(this.controls.target);
    this.trgEnd.copy(target);
    
    if (this.trgEnd.y < 0.1) this.trgEnd.y = 0;
    if (this.trgStart.y < 0.1) this.trgStart.y = 0;

    this.animStart = performance.now();
    this.animating = true;
    this.controls.enableDamping = false;
  }

  setTopView() {
    this.focusCamera(
      new THREE.Vector3(this.controls.target.x, 25, this.controls.target.z),
      new THREE.Vector3(this.controls.target.x, 0, this.controls.target.z)
    );
  }

  setPerspectiveView() {
    this.focusCamera(
      new THREE.Vector3(0, 12, 16),
      new THREE.Vector3(0, 0, 0)
    );
  }

  shakeCamera() {
    this.shakeStart = performance.now();
    this.shaking = true;
  }

  updateAnimation() {
    const now = performance.now();
    this.shakeOff.set(0, 0, 0);

    if (this.shaking) {
      const st = (now - this.shakeStart) / this.shakeDuration;
      if (st >= 1) {
        this.shaking = false;
      } else {
        const decay = 1 - st;
        // High frequency jitter
        const freq = 40;
        this.shakeOff.set(
          Math.sin(now * freq) * this.shakeIntensity * decay,
          Math.cos(now * freq * 1.1) * this.shakeIntensity * decay,
          Math.sin(now * freq * 0.8) * this.shakeIntensity * decay
        );
      }
    }

    if (this.animating) {
      let t = (now - this.animStart) / this.animDuration;
      if (t >= 1) {
        t = 1;
        this.animating = false;
        this.controls.enableDamping = true;
      }
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      this.camera.position.lerpVectors(this.camStart, this.camEnd, ease);
      this.controls.target.lerpVectors(this.trgStart, this.trgEnd, ease);

    }

    // Apply shake at the very end so it isn't overwritten
    this.camera.position.add(this.shakeOff);
    this.controls.update();
  }

  setShadowsEnabled(enabled) {
    this.renderer.shadowMap.enabled = enabled;
    // Disable tone mapping for extra speed in edit mode if needed
    this.renderer.toneMapping = enabled ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    
    this.scene.traverse(obj => {
      if (obj.isLight && obj.castShadow !== undefined) {
        obj.castShadow = enabled;
      }
    });
    // Force materials to recompile/refresh if necessary
    this.scene.traverse(obj => {
      if (obj.isMesh && obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.needsUpdate = true);
        else obj.material.needsUpdate = true;
      }
    });
  }

  render() {
    this.updateAnimation();
    this.renderer.render(this.scene, this.camera);
  }
}
