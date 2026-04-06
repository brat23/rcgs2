import * as THREE from 'three';
import { CONFIG } from './config.js';

export class LibraryManager {
  constructor(ui, assets, fixtures) {
    this.ui = ui;
    this.assets = assets;
    this.fixtures = fixtures;
  }

  setup(onSelect) {
    // Load Callout assets and report progress
    CONFIG.CALLOUTS.forEach(c => {
      this.ui.registerAssetRequest(c.file);
      this.assets.loadModel(c.file).then((gltf) => {
        this.fixtures.prepareFixtureMaterials(gltf.scene);
        this.ui.assetFinished(c.file);
      });
    });

    CONFIG.FIXTURES_META.forEach(meta => {
      const card = document.createElement('div');
      card.className = 'fixture-card loading';
      card.innerHTML = `
        <span class="icon">${meta.icon}</span>
        <div class="info">
          <div class="name">${meta.label}</div>
          <div class="dims">${meta.desc}</div>
        </div>
        <span class="badge">...</span>`;

      card.addEventListener('click', () => {
        if (!this.assets.isLoaded(meta.file)) return;
        this.ui.highlightCard(card);
        onSelect(meta.file, meta.label);
      });

      this.ui.libEl.appendChild(card);

      this.ui.registerAssetRequest(meta.file);
      this.assets.loadModel(meta.file)
        .then(gltf => {
          this.fixtures.prepareFixtureMaterials(gltf.scene);
          card.classList.remove('loading');
          card.querySelector('.badge').textContent = 'OK';
          this.ui.assetFinished(meta.file);
        })
        .catch(err => {
          card.querySelector('.badge').textContent = 'ERR';
          this.ui.assetFinished(meta.file); // Mark as finished even on error
          console.error(meta.file, err);
        });
    });
  }

  autoPlaceMannequins(scene, onPlaced) {
    const miShelves = [];
    scene.traverse(obj => {
      const name = (obj.name || '').toLowerCase();
      if (name.includes('mi')) miShelves.push(obj);
    });

    CONFIG.DEFAULT_MANNEQUINS.forEach((m) => {
      let y = 1.45; 
      const isBackWall = m.pos[1] < -2.0;
      const offset = isBackWall ? 0.1 : 0.0; // Apply 4" only to back wall
      
      let nearest = null;
      let minDist = Infinity;
      const targetPos = new THREE.Vector3(m.pos[0], 0, m.pos[1]);

      miShelves.forEach(shelf => {
        const box = new THREE.Box3().setFromObject(shelf);
        const center = box.getCenter(new THREE.Vector3());
        center.y = 0;
        const d = center.distanceTo(targetPos);
        if (d < minDist) {
          minDist = d;
          nearest = shelf;
        }
      });

      if (nearest && minDist < 3.0) {
        y = new THREE.Box3().setFromObject(nearest).max.y + offset;
      } else {
        y = 1.45 + offset;
      }

      this.fixtures.placeFixture(new THREE.Vector3(m.pos[0], 0, m.pos[1]), CONFIG.MANNEQUIN_FILE, {
        commit: false, yOverride: y, userRot: m.rot * Math.PI / 180
      });
    });
    this.fixtures.pushHistory();
    if (onPlaced) onPlaced();
  }

  autoPlaceCallouts(scene, onPlaced) {
    const miShelves = [];
    scene.traverse(obj => {
      const name = (obj.name || '').toLowerCase();
      if (name.includes('mi')) miShelves.push(obj);
    });

    CONFIG.CALLOUTS.forEach((c) => {
      let y = 1.45; 
      const isBackWall = c.pos[1] < -2.0;
      const offset = isBackWall ? 0.1 : 0.0; // Apply 4" only to back wall
      
      let nearest = null;
      let minDist = Infinity;
      const targetPos = new THREE.Vector3(c.pos[0], 0, c.pos[1]);

      miShelves.forEach(shelf => {
        const box = new THREE.Box3().setFromObject(shelf);
        const center = box.getCenter(new THREE.Vector3());
        center.y = 0;
        const d = center.distanceTo(targetPos);
        if (d < minDist) {
          minDist = d;
          nearest = shelf;
        }
      });

      if (nearest && minDist < 3.0) {
        y = new THREE.Box3().setFromObject(nearest).max.y + offset;
      } else {
        y = 1.45 + offset;
      }

      // We use placeFixture but it needs to handle .gltf too if not already
      this.fixtures.placeFixture(new THREE.Vector3(c.pos[0], 0, c.pos[1]), c.file, {
        commit: false, 
        yOverride: y, 
        userRot: c.rot * Math.PI / 180,
        userScale: c.scale || 1.0,
        category: c.category
      });
    });
    this.fixtures.pushHistory();
    if (onPlaced) onPlaced();
  }

  autoPlaceFixtures(onPlaced) {
    CONFIG.DEFAULT_FIXTURES.forEach(f => {
      this.fixtures.placeFixture(
        new THREE.Vector3(f.pos[0], 0, f.pos[1]),
        f.file,
        {
          commit: false,
          userRot: f.rot * Math.PI / 180,
          userScale: f.scale || 1.0
        }
      );
    });
    this.fixtures.pushHistory();
    if (onPlaced) onPlaced();
  }
}
