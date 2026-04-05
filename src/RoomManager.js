import * as THREE from 'three';
import { CONFIG } from './config.js';

export class RoomManager {
  constructor(scene, assetLoader, sceneManager, ui) {
    this.scene = scene;
    this.assetLoader = assetLoader;
    this.sceneManager = sceneManager;
    this.ui = ui;
    this.cutawayMeshes = [];
    this.isEditMode = false;
    this.floorMin = new THREE.Vector3(-10.4, CONFIG.FLOOR_Y, -3.35);
    this.floorMax = new THREE.Vector3(10.4, CONFIG.FLOOR_Y, 3.35);
    this.floorCtr = new THREE.Vector3(0, CONFIG.FLOOR_Y, 0);
  }

  load(onLoaded) {
    if (this.ui) this.ui.registerAssetRequest('scene.glb');
    return this.assetLoader.loadModel('./scene.glb').then(gltf => {
      if (this.ui) this.ui.assetFinished('scene.glb');
      const room = gltf.scene;
      room.traverse(obj => {
        if (!obj.isMesh) return;
        this.prepareMaterials(obj);
        obj.castShadow = true;
        obj.receiveShadow = true;
        
        if (obj.name === 'floor' || obj.name.toLowerCase().includes('floor')) {
          obj.renderOrder = -1;
          if (obj.material) {
            obj.material.polygonOffset = true;
            obj.material.polygonOffsetFactor = 4;
            obj.material.polygonOffsetUnits = 4;
            obj.material.needsUpdate = true;
          }
        } else if (this.isCutawayCandidate(obj)) {
          // Cache wall data once to avoid expensive per-frame Box3 calculations
          const box = new THREE.Box3().setFromObject(obj);
          const center = new THREE.Vector3();
          box.getCenter(center);
          this.cutawayMeshes.push({
            mesh: obj,
            center: center,
            y: center.y
          });
        }
      });
      this.scene.add(room);
      // ... rest of load

      const floorMesh = room.getObjectByName('floor');
      if (floorMesh) {
        const floorBox = new THREE.Box3().setFromObject(floorMesh);
        this.floorMin.copy(floorBox.min);
        this.floorMin.y = CONFIG.FLOOR_Y;
        this.floorMax.copy(floorBox.max);
        this.floorMax.y = CONFIG.FLOOR_Y;
        floorBox.getCenter(this.floorCtr);
        this.floorCtr.y = CONFIG.FLOOR_Y;
      }

      this.sceneManager.controls.target.set(this.floorCtr.x, 0, this.floorCtr.z);
      this.sceneManager.camera.position.set(this.floorCtr.x, 12, this.floorCtr.z + 16);
      this.updateCutaway();
      if (this.ui) this.ui.updateLoadingStatus(this.assetLoader);
      if (onLoaded) onLoaded();
    });
  }

  prepareMaterials(mesh) {
    const cloneMaterial = (m) => {
      if (!m) return m;
      const clone = m.clone();
      clone.needsUpdate = true;
      return clone;
    };
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(cloneMaterial);
    } else {
      mesh.material = cloneMaterial(mesh.material);
    }
  }

  isCutawayCandidate(mesh) {
    const name = (mesh.name || '').toLowerCase();
    if (name.includes('floor')) return false;
    
    // Explicitly include anything that looks like a wall, pillar, column, or glass
    if (name.includes('wall') || name.includes('pillar') || name.includes('column') || name.includes('entrance') || name.includes('glass') || name.includes('window')) return true;
    
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    // If it's tall enough, it's likely a wall or structural element
    return size.y > 2.2;
  }

  updateCutaway() {
    if (!this.cutawayMeshes.length) return;
    const viewDir = new THREE.Vector3().subVectors(this.sceneManager.controls.target, this.sceneManager.camera.position).normalize();
    const targetDistance = this.sceneManager.camera.position.distanceTo(this.sceneManager.controls.target);

    this.cutawayMeshes.forEach(data => {
      if (!this.isEditMode) {
        data.mesh.visible = true;
        return;
      }
      
      const targetSide = data.center.clone().sub(this.sceneManager.controls.target).dot(viewDir);
      const cameraSideDistance = data.center.clone().sub(this.sceneManager.camera.position).dot(viewDir);
      
      // Use cached height and center
      const shouldHide = data.y > CONFIG.FLOOR_Y + 0.15 && targetSide < 0 && cameraSideDistance > 0 && cameraSideDistance < targetDistance + 1.5;
      data.mesh.visible = !shouldHide;
    });
  }

  setEditMode(val) {
    this.isEditMode = val;
    this.updateCutaway();
  }

  getWalls() {
    return this.cutawayMeshes.map(d => d.mesh);
  }
}
