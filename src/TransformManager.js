import * as THREE from 'three';
import { CONFIG } from './config.js';

export class TransformManager {
  constructor(app) {
    this.app = app;
    this.ui = app.ui;
    this.fixtures = app.fixtures;
  }

  setup() {
    this.setupPositionSync();
    this.setupScaleSync();
    this.setupRotationSync();
  }

  setupPositionSync() {
    const syncX = () => {
      const val = parseFloat(this.ui.posXValEl.value);
      if (isNaN(val)) return;
      this.ui.posXSlider.value = val;
      if (this.ui.selected) {
        this.ui.selected.position.x = val;
        this.ui.showDebug();
      }
    };
    this.ui.posXSlider.oninput = () => {
      this.ui.posXValEl.value = parseFloat(this.ui.posXSlider.value).toFixed(2);
      syncX();
    };
    this.ui.posXValEl.oninput = syncX;
    this.ui.posXSlider.onchange = this.ui.posXValEl.onchange = () => {
      if (this.ui.selected) this.fixtures.pushHistory();
    };

    const syncZ = () => {
      const val = parseFloat(this.ui.posZValEl.value);
      if (isNaN(val)) return;
      this.ui.posZSlider.value = val;
      if (this.ui.selected) {
        this.ui.selected.position.z = val;
        this.ui.showDebug();
      }
    };
    this.ui.posZSlider.oninput = () => {
      this.ui.posZValEl.value = parseFloat(this.ui.posZSlider.value).toFixed(2);
      syncZ();
    };
    this.ui.posZValEl.oninput = syncZ;
    this.ui.posZSlider.onchange = this.ui.posZValEl.onchange = () => {
      if (this.ui.selected) this.fixtures.pushHistory();
    };
  }

  setupScaleSync() {
    const sync = () => {
      const val = parseFloat(this.ui.scaleValEl.value);
      if (isNaN(val)) return;
      this.ui.scaleSlider.value = val;
      const sel = this.ui.selected;
      if (sel) {
        sel.userData.userScale = val;
        let mult = sel.userData.file === CONFIG.MANNEQUIN_FILE ? CONFIG.MANNEQUIN_SCALE_ADJUST : 1;
        sel.scale.setScalar(sel.userData.autoScale * val * mult);
        this.fixtures.alignToHeight(sel, sel.userData.baseY);
      }
    };
    this.ui.scaleSlider.oninput = () => {
      this.ui.scaleValEl.value = parseFloat(this.ui.scaleSlider.value).toFixed(2);
      sync();
    };
    this.ui.scaleValEl.oninput = sync;
    this.ui.scaleSlider.onchange = this.ui.scaleValEl.onchange = () => {
      if (this.ui.selected) this.fixtures.pushHistory();
    };
  }

  setupRotationSync() {
    const sync = () => {
      const deg = parseInt(this.ui.rotValEl.value);
      if (isNaN(deg)) return;
      this.ui.rotSlider.value = deg;
      const sel = this.ui.selected;
      if (sel) {
        sel.rotation.y = deg * Math.PI / 180;
        sel.userData.userRot = sel.rotation.y;
        this.ui.showDebug();
      }
    };
    this.ui.rotSlider.oninput = () => {
      this.ui.rotValEl.value = this.ui.rotSlider.value;
      sync();
    };
    this.ui.rotValEl.oninput = sync;
    this.ui.rotSlider.onchange = this.ui.rotValEl.onchange = () => {
      if (this.ui.selected) this.fixtures.pushHistory();
    };
  }
}
