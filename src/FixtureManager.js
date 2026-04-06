import * as THREE from 'three';
import { CONFIG } from './config.js';

export class FixtureManager {
  constructor(scene, assetLoader) {
    this.scene = scene;
    this.assetLoader = assetLoader;
    this.placed = [];
    this.historyStack = [];
    this.suppressHistory = false;
  }

  alignToHeight(group, targetY) {
    const box = new THREE.Box3().setFromObject(group);
    group.position.y += targetY - box.min.y;
  }

  normalisedClone(proto) {
    const clone = proto.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const longest = Math.max(size.x, size.z, 0.01);
    const autoScale = longest > 1 ? 1 / longest : 1;
    clone.scale.setScalar(autoScale);
    return { group: clone, autoScale };
  }

  prepareFixtureMaterials(root) {
    root.traverse(obj => {
      if (!obj.isMesh) return;
      obj.visible = true;
      if (Array.isArray(obj.material)) {
        obj.material = obj.material.map(m => this.cloneMaterial(m));
      } else {
        obj.material = this.cloneMaterial(obj.material);
      }
      obj.castShadow = true;
      obj.receiveShadow = true;
    });
  }

  cloneMaterial(material) {
    if (!material) return material;
    const clone = material.clone();
    clone.visible = true;
    clone.colorWrite = true;
    clone.envMapIntensity = clone.envMapIntensity ?? 1;
    clone.needsUpdate = true;
    return clone;
  }

  placeFixture(position, file, options = {}) {
    const isLightbox = CONFIG.LIGHTBOX.IMAGES.some(img => img.file === file);
    if (isLightbox) {
      return this.placeLightbox(position, file, options);
    }
    const proto = this.assetLoader.getPrototype(file);
    if (!proto) return null;

    let { group, autoScale } = this.normalisedClone(proto);
    const category = options.category || (file.includes('lightbox/meshes/') ? CONFIG.CALLOUTS.find(c => c.file === file)?.category : null);
    
    // Skip normalization for callouts to preserve their Blender scale
    if (file.includes('lightbox/meshes/')) {
        group = proto.clone(true);
        autoScale = 1.0;
        
        // Filter by category to avoid overlapping words
        if (category) {
            group.traverse(child => {
                if (child.isMesh || child.isGroup) {
                    const nodeName = (child.name || "").split('.')[0].toUpperCase();
                    if (nodeName && !['SCENE', 'ROOT'].includes(nodeName)) {
                        // Robust match (e.g., "MENS" matches "MENS_TEXT", "BOY" matches "BOYS")
                        const isMatch = nodeName.includes(category) || category.includes(nodeName);
                        if (!isMatch) {
                            child.visible = false;
                        } else {
                            child.visible = true;
                        }
                    }
                }
            });
        }
    }

    // Custom scale multipliers for specific fixtures
    let scaleMultiplier = 1.0;
    if (file === CONFIG.MANNEQUIN_FILE) {
      scaleMultiplier = CONFIG.MANNEQUIN_SCALE_ADJUST;
    } else if (file === 'fixture/4fh.glb' || file === 'fixture/4sh.glb') {
      scaleMultiplier = 1.25;
    }

    const userScale = (options.userScale ?? 1.0) * scaleMultiplier;
    const userRot = options.userRot ?? 0;
    const baseY = options.yOverride ?? (CONFIG.FLOOR_Y + CONFIG.FLOOR_CLEARANCE);

    group.scale.multiplyScalar(userScale);
    group.position.set(position.x, 0, position.z);
    group.rotation.y = userRot;
    
    this.alignToHeight(group, baseY);

    let meta = CONFIG.FIXTURES_META.find(m => m.file === file);
    if (!meta) {
      // Look in CALLOUTS with the specific category if possible
      const callout = CONFIG.CALLOUTS.find(c => c.file === file && c.category === category);
      if (callout) meta = { label: callout.label };
      else {
          // Fallback to first matching file if category doesn't match
          const firstCallout = CONFIG.CALLOUTS.find(c => c.file === file);
          if (firstCallout) meta = { label: firstCallout.label };
      }
    }
    if (meta) group.name = meta.label;

    group.userData = { 
      file, 
      userScale: options.userScale ?? 1.0, 
      autoScale, 
      userRot, 
      baseY,
      category
    };

    this.scene.add(group);
    this.placed.push(group);
    
    if (options.commit !== false) this.pushHistory();
    return group;
  }

  placeLightbox(position, file, options = {}) {
    const userScale = options.userScale ?? 1.0;
    const userRot = options.userRot ?? 0;
    const baseY = options.yOverride ?? (CONFIG.LIGHTBOX.Y_LEVEL - CONFIG.LIGHTBOX.HEIGHT / 2);

    const texture = this.assetLoader.getTexture(file);
    const geometry = new THREE.BoxGeometry(CONFIG.LIGHTBOX.WIDTH, CONFIG.LIGHTBOX.HEIGHT, CONFIG.LIGHTBOX.DEPTH);
    
    const createMesh = (tex) => {
      const materials = [
        new THREE.MeshStandardMaterial({ color: 0x333333 }),
        new THREE.MeshStandardMaterial({ color: 0x333333 }),
        new THREE.MeshStandardMaterial({ color: 0x333333 }),
        new THREE.MeshStandardMaterial({ color: 0x333333 }),
        new THREE.MeshStandardMaterial({ 
          map: tex, 
          emissive: 0xffffff, 
          emissiveMap: tex, 
          emissiveIntensity: 0.5 
        }),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      ];

      const mesh = new THREE.Mesh(geometry, materials);
      mesh.scale.setScalar(userScale);
      mesh.position.set(position.x, position.y, position.z);
      mesh.rotation.y = userRot;
      mesh.name = "Lightbox: " + file.split('/').pop();

      mesh.userData = {
        file,
        type: 'lightbox',
        userScale: userScale,
        autoScale: 1.0,
        userRot: userRot,
        baseY: baseY
      };

      if (options.yOverride !== undefined) {
         mesh.position.y = 0; 
         this.alignToHeight(mesh, baseY);
      } else {
         mesh.position.y = baseY + (CONFIG.LIGHTBOX.HEIGHT * userScale) / 2;
      }

      this.scene.add(mesh);
      this.placed.push(mesh);
      if (options.commit !== false) this.pushHistory();
      return mesh;
    };

    if (texture) {
      return createMesh(texture);
    } else {
      return this.assetLoader.loadTexture(file).then(tex => createMesh(tex));
    }
  }

  serializeFixture(group) {
    return {
      file: group.userData.file,
      userScale: group.userData.userScale,
      userRot: group.userData.userRot || 0,
      baseY: group.userData.baseY,
      category: group.userData.category,
      position: {
        x: group.position.x,
        z: group.position.z,
      },
    };
  }

  captureLayout() {
    return this.placed.map(g => this.serializeFixture(g));
  }

  pushHistory() {
    if (this.suppressHistory) return;
    const snapshot = JSON.stringify(this.captureLayout());
    if (this.historyStack[this.historyStack.length - 1] === snapshot) return;
    this.historyStack.push(snapshot);
    if (this.historyStack.length > CONFIG.HISTORY_LIMIT) this.historyStack.shift();
  }

  undo(onUpdate) {
    if (this.historyStack.length <= 1) return false;
    this.historyStack.pop();
    const layout = JSON.parse(this.historyStack[this.historyStack.length - 1]);
    this.restoreLayout(layout);
    return true;
  }

  restoreLayout(layout) {
    this.suppressHistory = true;
    this.clearAll();
    layout.forEach(item => {
      this.placeFixture(
        new THREE.Vector3(item.position.x, CONFIG.FLOOR_Y, item.position.z), 
        item.file, 
        {
          userScale: item.userScale,
          userRot: item.userRot,
          yOverride: item.baseY,
          category: item.category,
          commit: false,
        }
      );
    });
    this.suppressHistory = false;
  }

  clearAll() {
    this.placed.forEach(g => this.scene.remove(g));
    this.placed.length = 0;
  }

  removeFixture(group) {
    this.scene.remove(group);
    const idx = this.placed.indexOf(group);
    if (idx >= 0) this.placed.splice(idx, 1);
    this.pushHistory();
  }
}
