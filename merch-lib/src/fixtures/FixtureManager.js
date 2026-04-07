import { store } from "../state/store.js";
import { FIXTURE_DATA } from "../data/fixturesData.js";
import { CONSTANTS } from "../data/constants.js";
import { engine } from "../core/engine.js";
import { applyFixtureMaterial } from "../data/materials.js";

// Strategies
import { renderSideHanging } from "./strategies/SideHanging.js";
import { renderFrontal } from "./strategies/Frontal.js";
import { renderKidsFrontal } from "./strategies/KidsFrontal.js";

class FixtureManager {
  constructor() {
    this.loader = new THREE.GLTFLoader();
    this.backdrops = [];
    this.selectionHelper = null;
    
    // Bind to store
    store.subscribe(() => this.updateLayout());
  }

  loadFixtureModel(entry) {
    const data = FIXTURE_DATA[entry.type];
    if (!data.glb) return;

    const loadingEl = document.getElementById("loading");
    if (loadingEl) loadingEl.style.display = "flex";

    this.loader.load(
      data.glb,
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());

        const wrapper = new THREE.Group();
        model.position.set(-center.x, -box.min.y, -center.z);
        wrapper.add(model);

        wrapper.scale.setScalar(CONSTANTS.GLB_SCALE);
        applyFixtureMaterial(wrapper, store.currentFinish);

        entry.model = wrapper;
        engine.scene.add(wrapper);
        
        // Notify store so updateLayout runs with the new model
        store.notify(); 
        
        if (loadingEl) loadingEl.style.display = "none";
      },
      undefined,
      (err) => {
        console.error("Error loading GLB:", err);
        if (loadingEl) loadingEl.style.display = "none";
      }
    );
  }

  // Called when material finish changes across the board
  updateMaterials() {
    store.layout.forEach((item) => {
      if (item.model) applyFixtureMaterial(item.model, store.currentFinish);
    });
  }

  clearSceneEntities() {
    this.backdrops.forEach((b) => engine.scene.remove(b));
    this.backdrops = [];

    if (this.selectionHelper) {
      engine.scene.remove(this.selectionHelper);
      this.selectionHelper = null;
    }

    store.layout.forEach((item) => {
      if (item.merchMeshes) {
        item.merchMeshes.forEach((m) => engine.scene.remove(m));
        item.merchMeshes = [];
      }
    });
  }

  updateLayout() {
    this.clearSceneEntities();

    let currentPos = new THREE.Vector3(0, 0, 0);
    let currentRotation = 0;

    store.layout.forEach((item, idx) => {
      const data = FIXTURE_DATA[item.type];
      const w = data.width * CONSTANTS.GLB_SCALE;
      const d = data.depth * CONSTANTS.GLB_SCALE;

      // Handle Turns
      if (data.isTurn) {
        const forwardDir = new THREE.Vector3(Math.cos(currentRotation), 0, -Math.sin(currentRotation));
        currentPos.add(forwardDir.multiplyScalar(d / 2));
        currentRotation += data.angle;
        const sideDir = new THREE.Vector3(Math.cos(currentRotation), 0, -Math.sin(currentRotation));
        currentPos.add(sideDir.multiplyScalar(d / 2));
        return;
      }

      const dir = new THREE.Vector3(Math.cos(currentRotation), 0, -Math.sin(currentRotation));
      const centerOffset = dir.clone().multiplyScalar(w / 2);
      const pos = currentPos.clone().add(centerOffset);

      // Place Physical Model
      if (item.model) {
        item.model.position.copy(pos);
        item.model.rotation.y = currentRotation;

        // Selection Box
        if (store.selectedFixtureIdx === idx) {
          this.selectionHelper = new THREE.BoxHelper(item.model, 0xc07850);
          engine.scene.add(this.selectionHelper);
        }
      }

      // Delegate Merchandise Rendering to Strategies
      if (item.type !== 'empty') {
        if (item.type.includes('sh')) {
          item.merchMeshes = renderSideHanging(item, data, pos, currentRotation);
        } else if (item.type === '2kfh') {
          item.merchMeshes = renderKidsFrontal(item, data, pos, currentRotation);
        } else {
          item.merchMeshes = renderFrontal(item, data, pos, currentRotation);
        }
      }

      // Render Backdrop
      if (store.showBackdrop && data.width > 0 && item.type !== "empty") {
        const bgGeom = new THREE.PlaneGeometry(w, CONSTANTS.BACKDROP_HEIGHT);
        const bgMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const bgMesh = new THREE.Mesh(bgGeom, bgMat);

        const normalDir = new THREE.Vector3(Math.sin(currentRotation), 0, Math.cos(currentRotation));
        const backOffset = normalDir.clone().multiplyScalar(d / 2 + 0.01);

        bgMesh.position.copy(pos).sub(backOffset);
        bgMesh.position.y = CONSTANTS.BACKDROP_HEIGHT / 2;
        bgMesh.rotation.y = currentRotation;

        engine.scene.add(bgMesh);
        this.backdrops.push(bgMesh);
      }

      // Advance Position
      const moveVec = new THREE.Vector3(Math.cos(currentRotation), 0, -Math.sin(currentRotation)).multiplyScalar(w);
      currentPos.add(moveVec);
    });
  }
}

export const fixtureManager = new FixtureManager();
