import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { AssetLoader } from './AssetLoader.js';
import { FixtureManager } from './FixtureManager.js';
import { UIManager } from './UIManager.js';
import { RoomManager } from './RoomManager.js';
import { LibraryManager } from './LibraryManager.js';
import { LightboxManager } from './LightboxManager.js';
import { InputManager } from './InputManager.js';
import { LayoutManager } from './LayoutManager.js';
import { RaycasterManager } from './RaycasterManager.js';
import { AlignmentManager } from './AlignmentManager.js';
import { CONFIG } from './config.js';

class App {
  constructor() {
    this.ui = new UIManager();
    this.scene = new SceneManager(this.ui.canvas);
    this.assets = new AssetLoader();
    this.fixtures = new FixtureManager(this.scene.scene, this.assets);
    this.room = new RoomManager(this.scene.scene, this.assets, this.scene, this.ui);
    this.lightboxes = new LightboxManager(this.scene.scene, this.assets, this.fixtures);
    this.library = new LibraryManager(this.ui, this.assets, this.fixtures);
    this.layout = new LayoutManager(this);
    this.raycaster = new RaycasterManager(this.scene.camera, new THREE.Plane(new THREE.Vector3(0, 1, 0), -CONFIG.FLOOR_Y));
    this.align = new AlignmentManager(this);
    this.input = new InputManager(this);

    this.activeFile = null;
    this.toolMode = 'select';
    this.defaultsPlaced = false;
    this.clipboard = null;

    this.init();
  }

  init() {
    this.ui.setEditModeUI(false);
    this.scene.setShadowsEnabled(false); // Default to clean view
    
    if (this.ui.editToggleBtn) {
      this.ui.editToggleBtn.onclick = () => {
        const newState = !this.room.isEditMode;
        this.room.setEditMode(newState);
        this.ui.setEditModeUI(newState);
        
        // Speed up Edit Mode by disabling shadows and high-res tone mapping
        this.scene.setShadowsEnabled(!newState); 

        if (!newState) {
          this.ui.deselect(this.scene.scene);
          this.scene.controls.enabled = true;
        }
        this.ui.setStatus(newState ? 'Edit Mode: ON (High Performance)' : 'Edit Mode: OFF (High Quality)');
      };
    }

    this.align.setup();
    this.library.setup((file, label) => {
      this.activeFile = file;
      this.setToolMode('place');
      this.ui.deselect(this.scene.scene);
      this.ui.setStatus(`"${label}" selected. Click floor to place.`);
    });

    this.room.load(() => {
      this.checkAndPlaceDefaults();
    });

    // Merchandise Handlers
    this.ui.onMerchClick = (path) => {
      const selected = this.ui.selected;
      if (!selected) return;
      
      const key = this.ui.merchPlacement === 'front' ? 'merchPathsFront' : 'merchPathsBack';
      if (!selected.userData[key].includes(path)) {
        if (selected.userData[key].length >= 4) {
          selected.userData[key].shift(); // Keep max 4
        }
        selected.userData[key].push(path);
        this.fixtures.renderMerchandise(selected);
        this.fixtures.pushHistory();
      }
    };

    this.ui.clearMerchBtn.onclick = () => {
      const selected = this.ui.selected;
      if (!selected) return;
      
      selected.userData.merchPathsFront = [];
      selected.userData.merchPathsBack = [];
      this.fixtures.renderMerchandise(selected);
      this.fixtures.pushHistory();
    };

    this.layout.setup();
    this.input.setup();
    this.animate();
  }

  checkAndPlaceDefaults() {
    if (this.defaultsPlaced) return;
    
    // Use files from DEFAULT_LAYOUT if available, otherwise fallback to legacy config
    const layoutFiles = CONFIG.DEFAULT_LAYOUT ? CONFIG.DEFAULT_LAYOUT.map(item => item.file) : [];
    
    const requiredFiles = new Set(layoutFiles.length > 0 ? layoutFiles : [
      CONFIG.MANNEQUIN_FILE, 
      ...CONFIG.DEFAULT_FIXTURES.map(f => f.file),
      ...CONFIG.CALLOUTS.map(c => c.file)
    ]);

    // Split into models and textures
    const filesArray = Array.from(requiredFiles);
    const isModel = f => f.endsWith('.glb') || f.endsWith('.gltf');
    const allLoaded = filesArray.every(f => {
        if (f === 'empty') return true; // Special case for empty frames
        if (isModel(f)) return this.assets.isLoaded(f);
        return !!this.assets.getTexture(f);
    });

    if (allLoaded) {
      this.defaultsPlaced = true;
      setTimeout(() => {
        if (CONFIG.DEFAULT_LAYOUT) {
            this.fixtures.restoreLayout(CONFIG.DEFAULT_LAYOUT);
        } else {
            this.library.autoPlaceFixtures();
            this.library.autoPlaceMannequins(this.scene.scene);
            this.library.autoPlaceCallouts(this.scene.scene);
        }
        this.ui.setStatus('Default layout loaded.');
      }, 500);
    } else {
      // Retry in a bit
      setTimeout(() => this.checkAndPlaceDefaults(), 500);
    }
  }

  setToolMode(mode) {
    this.toolMode = mode;
    this.ui.setToolUI(mode);
  }

  deleteSelected() {
    if (this.ui.selectedItems.length > 0) {
      [...this.ui.selectedItems].forEach(item => {
        this.fixtures.removeFixture(item);
      });
      this.ui.deselect(this.scene.scene);
    }
  }

  copySelected() {
    if (this.ui.selectedItems.length > 0) {
      this.clipboard = this.ui.selectedItems.map(item => this.fixtures.serializeFixture(item));
      this.ui.setStatus(`Copied ${this.ui.selectedItems.length} items`);
    }
  }

  pasteSelected() {
    if (this.clipboard) {
      const items = Array.isArray(this.clipboard) ? this.clipboard : [this.clipboard];
      this.ui.deselect(this.scene.scene);
      
      items.forEach(data => {
        const pos = new THREE.Vector3(
          data.position.x + CONFIG.PASTE_OFFSET,
          CONFIG.FLOOR_Y,
          data.position.z + CONFIG.PASTE_OFFSET
        );
        
        const newFixture = this.fixtures.placeFixture(pos, data.file, {
          userScale: data.userScale,
          scaleY: data.scaleY,
          userRot: data.userRot,
          yOverride: data.baseY,
          merchRot: data.merchRot,
          merchRotX: data.merchRotX,
          merchRotZ: data.merchRotZ,
          merchPathsFront: data.merchPathsFront,
          merchPathsBack: data.merchPathsBack,
          category: data.category,
          commit: false // Commit once at the end
        });

        if (newFixture) {
          this.ui.addToSelection(newFixture, this.scene.scene);
        }
      });
      
      this.fixtures.pushHistory();
      this.ui.setStatus(`Pasted ${items.length} items`);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.scene.render();
    this.ui.updateSelectionHelper();
    this.ui.showCameraDebug(this.scene.camera, this.scene.controls);
    this.room.updateCutaway();
  }
}

new App();
