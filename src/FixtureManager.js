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

  getInternalMultiplier(file) {
    if (file === CONFIG.MANNEQUIN_FILE) return CONFIG.MANNEQUIN_SCALE_ADJUST;
    if (file === 'fixture/4fh.glb' || file === 'fixture/4sh.glb') return 1.25;
    return 1.0;
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
      category
    };

    this.scene.add(group);
    this.placed.push(group);
    
    if (options.commit !== false) this.pushHistory();
    return group;
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
          scaleY: item.scaleY,
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
