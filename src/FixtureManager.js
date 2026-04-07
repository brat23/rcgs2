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
    const group = new THREE.Group();
    const clone = proto.clone(true);
    
    // Get the bounding box of the original mesh
    const box = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    // Calculate auto-scale factor
    const longest = Math.max(size.x, size.z, 0.01);
    const autoScale = longest > 1 ? 1 / longest : 1;
    
    // Center the clone relative to the group's origin
    // We want (0,0,0) to be at the center of the footprint and at the floor level (min Y)
    clone.position.set(-center.x, -box.min.y, -center.z);
    group.add(clone);
    
    return { group, autoScale };
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

  getInternalMultiplier(file) {
    if (file === CONFIG.MANNEQUIN_FILE) return CONFIG.MANNEQUIN_SCALE_ADJUST;
    if (file === 'fixture/4fh.glb' || file === 'fixture/4sh.glb') return 1.25;
    return 1.0;
  }

  placeFixture(position, file, options = {}) {
    const isLightbox = file === 'empty' || CONFIG.LIGHTBOX.IMAGES.some(img => img.file === file);
    if (isLightbox) {
      return this.placeLightbox(position, file, options);
    }
    const proto = this.assetLoader.getPrototype(file);
    if (!proto) return null;

    let { group, autoScale } = this.normalisedClone(proto);
    const category = options.category || (file.includes('lightbox/meshes/') ? CONFIG.CALLOUTS.find(c => c.file === file)?.category : null);
    
    if (file.includes('lightbox/meshes/')) {
        group = proto.clone(true);
        autoScale = 1.0;
        
        if (category) {
            let matchesFound = 0;
            const nodes = [];
            const clean = (s) => (s || "").toUpperCase().split('.')[0].replace(/\d+$/, '').replace(/S$/, '');
            const cleanCat = clean(category);

            group.traverse(child => {
                if (child.isMesh || child.isGroup) {
                    const name = child.name || "";
                    if (name && !['SCENE', 'ROOT'].includes(name.toUpperCase())) {
                        const cleanNode = clean(name);
                        const isMatch = cleanNode.includes(cleanCat) || cleanCat.includes(cleanNode);
                        if (isMatch) matchesFound++;
                        nodes.push({ child, isMatch });
                    }
                }
            });

            if (matchesFound > 0) {
                nodes.forEach(({ child, isMatch }) => {
                    if (!isMatch) child.visible = false;
                });
            }
        }
    }

    const internalMultiplier = this.getInternalMultiplier(file);
    const uScale = options.userScale ?? 1.0;
    let uScaleY = options.scaleY ?? uScale;

    // Legacy Fix: Detect if 1.25 or 0.3 was already baked into the save file
    if (file === CONFIG.MANNEQUIN_FILE && Math.abs(uScaleY - 0.3) < 0.05) uScaleY = 1.0;
    if ((file === 'fixture/4sh.glb' || file === 'fixture/4fh.glb') && Math.abs(uScaleY - 1.25) < 0.05) uScaleY = 1.0;

    const finalX = autoScale * internalMultiplier * uScale;
    const finalY = autoScale * internalMultiplier * uScaleY;

    group.scale.set(finalX, finalY, finalX);
    const userRot = options.userRot ?? 0;
    const baseY = options.yOverride ?? (CONFIG.FLOOR_Y + CONFIG.FLOOR_CLEARANCE);
    
    group.position.set(position.x, 0, position.z);
    group.rotation.y = userRot;
    this.alignToHeight(group, baseY);

    let meta = CONFIG.FIXTURES_META.find(m => m.file === file);
    if (!meta) {
      const callout = CONFIG.CALLOUTS.find(c => c.file === file && c.category === category);
      if (callout) meta = { label: callout.label };
      else {
          const firstCallout = CONFIG.CALLOUTS.find(c => c.file === file);
          if (firstCallout) meta = { label: firstCallout.label };
      }
    }
    if (meta) group.name = meta.label;

    group.userData = { 
      file, 
      userScale: uScale, 
      scaleY: uScaleY,
      autoScale, 
      userRot, 
      baseY,
      category,
      merchPathsFront: options.merchPathsFront || [],
      merchPathsBack: options.merchPathsBack || [],
      merchRot: options.merchRot, // Keep undefined if not provided
      merchRotX: options.merchRotX || 0,
      merchRotZ: options.merchRotZ || 0,
      merchMeshes: []
    };

    this.scene.add(group);
    this.placed.push(group);
    
    // Initial merch render
    this.renderMerchandise(group);

    if (options.commit !== false) this.pushHistory();
    return group;
  }

  renderMerchandise(group) {
    // Clean old meshes
    if (group.userData.merchMeshes) {
      group.userData.merchMeshes.forEach(m => group.remove(m));
      group.userData.merchMeshes = [];
    }

    const file = group.userData.file || "";
    const refRot = (group.userData.merchRot !== undefined && group.userData.merchRot !== null) 
      ? group.userData.merchRot 
      : this.getRefRotation(group);
    
    const localRot = refRot - (group.userData.userRot || 0);
    const rx = group.userData.merchRotX || 0;
    const rz = group.userData.merchRotZ || 0;

    const C = CONFIG.MERCHANDISE.CONSTANTS;
    const s = 1.0 / (48 * C.GLB_SCALE);
    const mScale = 1.0 / group.userData.autoScale; // Factor to match internal model units
    const isFrontal = file.includes('fh.glb') || file.includes('fu.glb') || file.includes('2fh.glb') || file.includes('4fh.glb');
    
    // Adjusted pivot point: added 6 units to shift merchandise up
    const pivotY_norm = (isFrontal ? 54.5 : 52) * C.GLB_SCALE * s;
    const pivotZ_norm = (isFrontal ? -2.5 : 0) * C.GLB_SCALE * s;

    const merchGroup = new THREE.Group();
    merchGroup.name = "MerchandiseGroup";
    // Scale the merchGroup so its internal 0..1 coordinates match the model's units
    merchGroup.scale.setScalar(mScale);
    // Position it at the model's pivot height/depth
    merchGroup.position.set(0, pivotY_norm * mScale, pivotZ_norm * mScale);
    merchGroup.rotation.set(rx, localRot, rz);
    group.add(merchGroup);
    group.userData.merchMeshes = [merchGroup];

    if (isFrontal) {
      this.renderFrontal(group, merchGroup, pivotY_norm, pivotZ_norm);
    } else if (file.includes('sh.glb') || file.includes('sidehanging.glb')) {
      this.renderSideHanging(group, merchGroup, pivotY_norm, pivotZ_norm);
    }
  }

  getRefRotation(group) {
    let nearestTorso = null;
    let minDist = Infinity;
    this.placed.forEach(other => {
      if (other !== group && other.userData.file && (other.userData.file.includes('mannequin/') || other.userData.file.includes('torso'))) {
        const d = other.position.distanceTo(group.position);
        if (d < minDist) {
          minDist = d;
          nearestTorso = other;
        }
      }
    });

    if (nearestTorso) return nearestTorso.userData.userRot || 0;
    
    // Fallback to wall-based orientation if no torso nearby
    const pos = group.position;
    if (pos.x < -8) return Math.PI / 2;    // Left wall faces +X
    if (pos.z < -2.5) return 0;            // Back wall faces +Z
    if (pos.x > 8) return -Math.PI / 2;   // Right wall faces -X
    if (pos.z > 2.5) return Math.PI;       // Top wall faces -Z
    return 0;
  }

  renderFrontal(group, merchGroup, pY, pZ) {
    const frontPaths = group.userData.merchPathsFront || [];
    const backPaths = group.userData.merchPathsBack || [];
    const C = CONFIG.MERCHANDISE.CONSTANTS;
    const s = 1.0 / (48 * C.GLB_SCALE); 

    const renderSection = (paths, yTop, zStart, relativeRot) => {
      if (paths.length === 0) return;
      for (let col = 0; col < 2; col++) {
        const pathIdx = Math.min(paths.length - 1, col);
        const path = paths[pathIdx];
        // xOff is relative to the fixture center
        const xOff = col === 0 ? -12 * C.GLB_SCALE : 12 * C.GLB_SCALE;
        this.addMerchCluster(group, merchGroup, path, xOff * s, yTop * s, zStart * s, 8, relativeRot, pY, pZ);
      }
    };

    // Shifted yTop up by 6 units
    renderSection(frontPaths, 52 * C.GLB_SCALE, 2 * C.GLB_SCALE, 0);
    renderSection(backPaths, 57 * C.GLB_SCALE, -7 * C.GLB_SCALE, Math.PI);
  }

  renderSideHanging(group, merchGroup, pY, pZ) {
    const paths = (group.userData.merchPathsFront || []).concat(group.userData.merchPathsBack || []);
    const C = CONFIG.MERCHANDISE.CONSTANTS;

    if (paths.length > 0) {
      const s = 1.0 / (48 * C.GLB_SCALE);
      const totalItems = 24;
      const startX = -(48 / 2 - 1) * C.GLB_SCALE;
      const xStep = ((48 - 2) / (totalItems - 1)) * C.GLB_SCALE;
      
      for (let i = 0; i < totalItems; i++) {
        const pathIdx = Math.min(paths.length - 1, Math.floor(i / (totalItems / paths.length)));
        const path = paths[pathIdx];
        // Shifted yTop up by 6 units
        this.addMerchCluster(group, merchGroup, path, (startX + i * xStep) * s, (52 * C.GLB_SCALE) * s, 0, 1, Math.PI / 2, pY, pZ);
      }
    }
  }

  addMerchCluster(group, merchGroup, path, xOff, yTop, zStart, numLayers, rotation = 0, pY = 0, pZ = 0) {
    if (!path) return [];
    
    const texture = this.assetLoader.getTexture(path);
    if (!texture) {
      this.assetLoader.loadTexture(path).then(() => {
        this.renderMerchandise(group);
      });
      return [];
    }

    const C = CONFIG.MERCHANDISE.CONSTANTS;
    const s = 1.0 / (48 * C.GLB_SCALE);
    const merchW = C.MERCH_WIDTH * s;
    const merchH = C.MERCH_HEIGHT * s;
    const gap = C.LAYER_GAP * s;

    const merchMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      alphaTest: 0.5,
    });
    
    const centerY = yTop - merchH / 2;
    
    const stackGroup = new THREE.Group();
    // Position relative to the pivot in normalized 0..1 space
    stackGroup.position.set(xOff, centerY - pY, zStart - pZ);
    stackGroup.rotation.y = rotation;
    merchGroup.add(stackGroup);

    for (let i = 0; i < numLayers; i++) {
      const merchGeom = new THREE.PlaneGeometry(merchW, merchH);
      const merchMesh = new THREE.Mesh(merchGeom, merchMat);
      // Center the plane geometry horizontally on its own stack origin
      merchMesh.position.set(0, 0, i * gap);
      stackGroup.add(merchMesh);
    }
    
    return [stackGroup];
  }

  placeLightbox(position, file, options = {}) {
    const userScale = options.userScale ?? 1.0;
    const scaleY = options.scaleY ?? userScale;
    const userRot = options.userRot ?? 0;
    const baseY = options.yOverride ?? (CONFIG.LIGHTBOX.Y_LEVEL - CONFIG.LIGHTBOX.HEIGHT / 2);

    const group = new THREE.Group();
    group.position.set(position.x, 0, position.z);
    group.rotation.y = userRot;

    const frameGeo = new THREE.BoxGeometry(CONFIG.LIGHTBOX.WIDTH, CONFIG.LIGHTBOX.HEIGHT, CONFIG.LIGHTBOX.DEPTH);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x050505 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.scale.set(userScale, scaleY, userScale);
    frame.name = "LightboxFrame";
    group.add(frame);

    const border = 0.025; 
    const contentW = CONFIG.LIGHTBOX.WIDTH - border * 2;
    const contentH = CONFIG.LIGHTBOX.HEIGHT - border * 2;
    const contentGeo = new THREE.PlaneGeometry(contentW, contentH);
    
    const contentMat = new THREE.MeshStandardMaterial({ 
      color: (file === 'empty') ? 0x111111 : 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: (file === 'empty') ? 0 : 0.5,
      side: THREE.FrontSide
    });

    const content = new THREE.Mesh(contentGeo, contentMat);
    content.name = "LightboxContent";
    content.scale.set(userScale, scaleY, 1);
    content.position.z = (CONFIG.LIGHTBOX.DEPTH / 2 + 0.001) * userScale;
    group.add(content);

    group.userData = {
      file,
      type: 'lightbox',
      userScale,
      scaleY,
      autoScale: 1.0,
      userRot,
      baseY
    };

    if (options.yOverride !== undefined) {
       this.alignToHeight(group, baseY);
    } else {
       group.position.y = baseY + (CONFIG.LIGHTBOX.HEIGHT * scaleY) / 2;
    }

    if (file !== 'empty') {
      const texture = this.assetLoader.getTexture(file);
      if (texture) {
        contentMat.map = contentMat.emissiveMap = texture;
        group.name = "Lightbox: " + file.split('/').pop();
      } else {
        this.assetLoader.loadTexture(file).then(tex => {
          contentMat.map = contentMat.emissiveMap = tex;
          contentMat.needsUpdate = true;
        });
      }
    } else {
      group.name = "Empty Frame";
    }

    this.scene.add(group);
    this.placed.push(group);
    if (options.commit !== false) this.pushHistory();
    return group;
  }

  serializeFixture(group) {
    return {
      file: group.userData.file,
      userScale: group.userData.userScale,
      scaleY: group.userData.scaleY,
      userRot: group.userData.userRot || 0,
      merchRot: group.userData.merchRot,
      merchRotX: group.userData.merchRotX || 0,
      merchRotZ: group.userData.merchRotZ || 0,
      baseY: group.userData.baseY,
      category: group.userData.category,
      merchPathsFront: group.userData.merchPathsFront,
      merchPathsBack: group.userData.merchPathsBack,
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
          scaleY: item.scaleY,
          userRot: item.userRot,
          merchRot: item.merchRot,
          merchRotX: item.merchRotX,
          merchRotZ: item.merchRotZ,
          yOverride: item.baseY,
          category: item.category,
          merchPathsFront: item.merchPathsFront,
          merchPathsBack: item.merchPathsBack,
          commit: false,
        }
      );
    });
    this.suppressHistory = false;
  }

  clearAll() {
    this.placed.forEach(g => {
        if (g.userData.merchMeshes) {
            g.userData.merchMeshes.forEach(m => g.remove(m));
        }
        this.scene.remove(g);
    });
    this.placed.length = 0;
  }

  removeFixture(group) {
    if (group.userData.merchMeshes) {
        group.userData.merchMeshes.forEach(m => group.remove(m));
    }
    this.scene.remove(group);
    const idx = this.placed.indexOf(group);
    if (idx >= 0) this.placed.splice(idx, 1);
    this.pushHistory();
  }
}
