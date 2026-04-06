import * as THREE from 'three';
import { ToolManager } from './ToolManager.js';
import { TransformManager } from './TransformManager.js';
import { CONFIG } from './config.js';

export class InputManager {
  constructor(app) {
    this.app = app;
    this.tool = new ToolManager(app);
    this.transform = new TransformManager(app);
    this.mouseDownPos = new THREE.Vector2();
    this.dragSnapshot = null;
    this.isDragging = false;
    this.lastCamKey = null;
  }

  setup() {
    this.tool.setup();
    this.transform.setup();
    this.setupMouse();
    this.setupKeyboard();
  }

  setupMouse() {
    const { ui, scene, raycaster, fixtures, room } = this.app;
    ui.canvas.onmousedown = (e) => {
      if (!room.isEditMode) return; // Only allow in edit mode
      if (e.button !== 0) return;
      this.mouseDownPos.set(e.clientX, e.clientY);
      this.dragSnapshot = ui.selected ? JSON.stringify(fixtures.serializeFixture(ui.selected)) : null;
      this.isDragging = false;
    };

    ui.canvas.onmousemove = (e) => {
      if (!room.isEditMode) return; // Only allow in edit mode
      if (e.buttons !== 1 || ui.selectedItems.length === 0) return;
      const dx = e.clientX - this.mouseDownPos.x, dy = e.clientY - this.mouseDownPos.y;
      if (!this.isDragging && Math.sqrt(dx*dx + dy*dy) > 5) {
          this.isDragging = true;
          // Store start positions for all selected items
          this.dragStartPositions = ui.selectedItems.map(item => item.position.clone());
          const pt = raycaster.getPointerOnGround(e, ui.canvas);
          this.dragStartPointer = pt ? pt.clone() : new THREE.Vector3();
      }
      if (!this.isDragging) return;

      scene.controls.enabled = false;
      const pt = raycaster.getPointerOnGround(e, ui.canvas);
      if (!pt) return;
      
      const delta = pt.clone().sub(this.dragStartPointer);

      ui.selectedItems.forEach((sel, i) => {
          const startPos = this.dragStartPositions[i];
          const newPos = startPos.clone().add(delta);
          
          newPos.x = THREE.MathUtils.clamp(newPos.x, room.floorMin.x, room.floorMax.x);
          newPos.z = THREE.MathUtils.clamp(newPos.z, room.floorMin.z, room.floorMax.z);
          
          sel.position.set(newPos.x, sel.position.y, newPos.z);
          fixtures.alignToHeight(sel, sel.userData.baseY);
      });
      
      ui.showDebug();
    };

    ui.canvas.onmouseup = (e) => {
      if (!room.isEditMode) return; // Only allow in edit mode
      
      if (this.isDragging) {
        if (ui.selectedItems.length > 0) fixtures.pushHistory();
        this.isDragging = false;
        // Keep controls disabled if we still have something selected
        scene.controls.enabled = ui.selectedItems.length === 0;
        return;
      }
      if (e.button !== 0) return;

      const target = raycaster.getIntersectingObject(e, ui.canvas, fixtures.placed);
      if (target) {
        if (e.shiftKey) {
            ui.toggleSelection(target, scene.scene);
        } else {
            ui.select(target, scene.scene);
        }
        scene.controls.enabled = ui.selectedItems.length === 0;
        return;
      }

      if (this.app.toolMode === 'place' && this.app.activeFile) {
        const pt = raycaster.getPointerOnGround(e, ui.canvas);
        if (pt) {
          const newFix = fixtures.placeFixture(pt, this.app.activeFile);
          if (e.shiftKey) ui.addToSelection(newFix, scene.scene);
          else ui.select(newFix, scene.scene);
          scene.controls.enabled = false;
        }
      } else {
        ui.deselect(scene.scene);
        scene.controls.enabled = true;
      }
    };
  }

  setupKeyboard() {
    window.onkeydown = (e) => {
      // Don't trigger shortcuts if typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      const { ui } = this.app;
      const { SHORTCUTS } = CONFIG;
      const key = e.key.toLowerCase(), ctrl = e.ctrlKey;

      if (key === SHORTCUTS.UNDO.key && ctrl) { e.preventDefault(); if(this.app.room.isEditMode) this.app.ui.undoToolBtn.click(); }
      else if (key === SHORTCUTS.COPY.key && ctrl) { e.preventDefault(); if(this.app.room.isEditMode) this.app.copySelected(); }
      else if (key === SHORTCUTS.PASTE.key && ctrl) { e.preventDefault(); if(this.app.room.isEditMode) this.app.pasteSelected(); }
      else if (key === SHORTCUTS.SELECT_MODE.key && !ctrl) { if(this.app.room.isEditMode) this.app.setToolMode('select'); }
      else if (key === SHORTCUTS.PLACE_MODE.key && this.app.activeFile) { if(this.app.room.isEditMode) this.app.setToolMode('place'); }
      else if (key === SHORTCUTS.DELETE.key) { if(this.app.room.isEditMode) this.app.deleteSelected(); }
      else if (key === SHORTCUTS.ESCAPE.key) { 
        if(this.app.room.isEditMode) {
          this.app.setToolMode('select'); 
          this.app.ui.deselect(this.app.scene.scene);
          this.app.scene.controls.enabled = true;
        }
      }
      else if (key === SHORTCUTS.TOGGLE_EDIT.key) {
        e.preventDefault();
        const newState = !this.app.room.isEditMode;
        this.app.room.setEditMode(newState);
        this.app.ui.setEditModeUI(newState);
        if (!newState) this.app.ui.deselect(this.app.scene.scene);
        this.app.ui.setStatus(newState ? 'Edit Mode: ON' : 'Edit Mode: OFF');
      } 
 else if (key === SHORTCUTS.QUICK_SAVE.key && ctrl) {
        e.preventDefault();
        this.app.layout.quickSave();
      } else if (key === SHORTCUTS.QUICK_LOAD.key && ctrl) {
        e.preventDefault();
        this.app.layout.quickLoad();
      }

      // Arrow Key Movement
      const step = e.shiftKey ? 0.05 : 0.01;
      if (ui.selectedItems.length > 0 && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        ui.selectedItems.forEach(sel => {
          if (key === 'arrowup') sel.position.z -= step;
          if (key === 'arrowdown') sel.position.z += step;
          if (key === 'arrowleft') sel.position.x -= step;
          if (key === 'arrowright') sel.position.x += step;
          
          sel.position.x = THREE.MathUtils.clamp(sel.position.x, this.app.room.floorMin.x, this.app.room.floorMax.x);
          sel.position.z = THREE.MathUtils.clamp(sel.position.z, this.app.room.floorMin.z, this.app.room.floorMax.z);
          
          this.app.fixtures.alignToHeight(sel, sel.userData.baseY);
        });
        ui.showDebug();
      }

      // Camera Focus Shortcuts
      if ('0123456789'.includes(key)) {
        if (this.lastCamKey === key) {
          this.app.scene.shakeCamera();
        }
        this.lastCamKey = key;
      }

      if (key === '1') {
        this.app.scene.focusCamera(new THREE.Vector3(-3.00, 1.64, 0.37), new THREE.Vector3(-10.40, 1.53, 0.37));
        this.app.ui.setStatus('Focus: View 1');
      } else if (key === '2') {
        this.app.scene.focusCamera(new THREE.Vector3(-7.18, 1.89, 3.21), new THREE.Vector3(-7.17, 1.79, -3.35));
        this.app.ui.setStatus('Focus: View 2');
      } else if (key === '3') {
        this.app.scene.focusCamera(new THREE.Vector3(-0.89, 1.63, 3.22), new THREE.Vector3(-0.88, 1.53, -3.34));
        this.app.ui.setStatus('Focus: View 3');
      } else if (key === '4') {
        this.app.scene.focusCamera(new THREE.Vector3(5.33, 1.37, 2.90), new THREE.Vector3(5.34, 1.27, -3.32));
        this.app.ui.setStatus('Focus: View 4');
      } else if (key === '5') {
        this.app.scene.focusCamera(new THREE.Vector3(4.05, 1.43, -0.35), new THREE.Vector3(10.39, 1.33, -0.35));
        this.app.ui.setStatus('Focus: View 5');
      } else if (key === '6') {
        this.app.scene.focusCamera(new THREE.Vector3(5.40, 1.80, -3.19), new THREE.Vector3(5.66, 1.70, 3.36));
        this.app.ui.setStatus('Focus: View 6');
      } else if (key === '7') {
        this.app.scene.focusCamera(new THREE.Vector3(-5.41, 1.75, -3.11), new THREE.Vector3(-5.13, 1.64, 3.79));
        this.app.ui.setStatus('Focus: View 7');
      } else if (key === '8') {
        this.app.scene.focusCamera(new THREE.Vector3(16.05, 9.88, 6.70), new THREE.Vector3(0.00, 0.00, 0.00));
        this.app.ui.setStatus('Focus: View 8');
      } else if (key === '9') {
        this.app.scene.focusCamera(new THREE.Vector3(-1.46, 10.46, 14.06), new THREE.Vector3(-1.51, 1.67, 0.30));
        this.app.ui.setStatus('Focus: View 9');
      } else if (key === '0') {
        this.app.scene.focusCamera(new THREE.Vector3(-2.16, 17.56, 0.21), new THREE.Vector3(-2.16, 1.80, 0.21));
        this.app.ui.setStatus('Focus: View 0 (Top)');
      }
    };

    window.onkeyup = (e) => {
      const key = e.key.toLowerCase();
      if (this.app.ui.selected && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        this.app.fixtures.pushHistory();
      }
    };
  }
}
