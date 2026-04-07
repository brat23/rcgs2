import * as THREE from 'three';
import { CONFIG } from './config.js';

export class LightboxManager {
  constructor(scene, assetLoader, fixtures) {
    this.scene = scene;
    this.assetLoader = assetLoader;
    this.fixtures = fixtures;
    this.geometry = new THREE.BoxGeometry(CONFIG.LIGHTBOX.WIDTH, CONFIG.LIGHTBOX.HEIGHT, CONFIG.LIGHTBOX.DEPTH);
    this.preloading = Promise.all(CONFIG.LIGHTBOX.IMAGES.map(img => this.assetLoader.loadTexture(img.file)));
  }

  async placeLightboxes(walls, roomCenter) {
    await this.preloading;
    if (!walls || walls.length === 0) return;

    const images = CONFIG.LIGHTBOX.IMAGES;
    const center = roomCenter || new THREE.Vector3(0, CONFIG.LIGHTBOX.Y_LEVEL, 0);

    // 1. Identify and measure candidate walls
    const wallData = walls.map(w => {
      const name = (w.name || '').toLowerCase();
      if (name.includes('door')) return null;

      const box = new THREE.Box3().setFromObject(w);
      const size = new THREE.Vector3();
      box.getSize(size);
      
      // Filter out non-walls (pillars, small returns, or short segments)
      if (size.y < 2.2 || Math.max(size.x, size.z) < 1.2) return null;

      const isFacingZ = size.x >= size.z;
      const length = isFacingZ ? size.x : size.z;
      const wallCtr = box.getCenter(new THREE.Vector3());

      return { mesh: w, length, isFacingZ, wallCtr, size };
    }).filter(d => d !== null);

    if (wallData.length === 0) return;

    // 2. Distribute 10 image "quotas" based on wall length
    const totalLength = wallData.reduce((sum, d) => sum + d.length, 0);
    wallData.forEach(d => {
      d.rawQuota = (d.length / totalLength) * images.length;
      d.count = Math.floor(d.rawQuota);
      d.remainder = d.rawQuota - d.count;
    });

    // Ensure we use exactly 10 images
    let currentTotal = wallData.reduce((sum, d) => sum + d.count, 0);
    
    // Sort by remainder to distribute extra images to the relatively longest walls
    const sortedByRemainder = [...wallData].sort((a, b) => b.remainder - a.remainder);
    for (let i = 0; i < (images.length - currentTotal); i++) {
        sortedByRemainder[i % sortedByRemainder.length].count++;
    }

    // 3. Place lightboxes using the quota
    let imageIdx = 0;
    for (const d of wallData) {
      const count = d.count;
      if (count <= 0) continue;

      for (let i = 0; i < count; i++) {
        if (imageIdx >= images.length) break;

        // Calculate position: centered if count=1, balanced if count > 1
        const segmentWidth = d.length / (count + 1);
        const offsetDist = (i + 1) * segmentWidth - d.length / 2;
        
        const pos = d.wallCtr.clone();
        if (d.isFacingZ) pos.x += offsetDist;
        else pos.z += offsetDist;

        // Inward orientation
        const toCenterDir = center.clone().sub(pos).normalize();
        let rotationY = 0;
        let pushDir = new THREE.Vector3();

        if (d.isFacingZ) {
          if (toCenterDir.z > 0) { rotationY = 0; pushDir.set(0, 0, 1); }
          else { rotationY = Math.PI; pushDir.set(0, 0, -1); }
        } else {
          if (toCenterDir.x > 0) { rotationY = Math.PI / 2; pushDir.set(1, 0, 0); }
          else { rotationY = -Math.PI / 2; pushDir.set(-1, 0, 0); }
        }

        const thickness = d.isFacingZ ? d.size.z : d.size.x;
        const frontOffset = thickness / 2 + CONFIG.LIGHTBOX.DEPTH / 2 + 0.12;
        pos.add(pushDir.multiplyScalar(frontOffset));
        pos.y = CONFIG.LIGHTBOX.Y_LEVEL - CONFIG.LIGHTBOX.HEIGHT / 2;

        await this.createLightbox(pos, images[imageIdx].file, rotationY);
        imageIdx++;
      }
    }
  }

  async createLightbox(position, imagePath, rotationY) {
    const texture = await this.assetLoader.loadTexture(imagePath);
    
    // Create materials: 0: right, 1: left, 2: top, 3: bottom, 4: front, 5: back
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0x333333 }), // side
      new THREE.MeshStandardMaterial({ color: 0x333333 }), // side
      new THREE.MeshStandardMaterial({ color: 0x333333 }), // top
      new THREE.MeshStandardMaterial({ color: 0x333333 }), // bottom
      new THREE.MeshStandardMaterial({ 
        map: texture, 
        emissive: 0xffffff, 
        emissiveMap: texture, 
        emissiveIntensity: 0.5 
      }), // front (image)
      new THREE.MeshStandardMaterial({ color: 0x333333 })  // back
    ];

    const mesh = new THREE.Mesh(this.geometry, materials);
    mesh.position.copy(position);
    mesh.rotation.y = rotationY;
    mesh.name = "Lightbox: " + imagePath.split('/').pop();

    // To make it compatible with FixtureManager
    mesh.userData = {
      file: imagePath, // Treat path as "file" for serialization
      type: 'lightbox',
      userScale: 1.0,
      autoScale: 1.0,
      userRot: rotationY,
      baseY: position.y
    };

    this.scene.add(mesh);
    this.fixtures.placed.push(mesh);
    
    return mesh;
  }

  async updateLightboxImage(group, imagePath) {
    const content = group.getObjectByName('LightboxContent');
    if (!content) return;

    if (!imagePath || imagePath === 'empty') {
      content.material.map = null;
      content.material.emissiveMap = null;
      content.material.emissiveIntensity = 0;
      content.material.color.set(0x111111);
      content.material.needsUpdate = true;
      group.userData.file = 'empty';
      group.name = "Empty Frame";
    } else {
      const texture = await this.assetLoader.loadTexture(imagePath);
      content.material.map = texture;
      content.material.emissiveMap = texture;
      content.material.emissiveIntensity = 0.5; // Restore glow
      content.material.color.set(0xffffff);
      content.material.needsUpdate = true;
      group.userData.file = imagePath;
      group.name = "Lightbox: " + imagePath.split('/').pop();
    }
    this.fixtures.pushHistory();
  }
}
