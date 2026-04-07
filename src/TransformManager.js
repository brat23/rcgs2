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
    this.setupMerchRotationSync();
    this.setupMerchRotationXSync();
    this.setupMerchRotationZSync();
  }

  setupMerchRotationSync() {
    const sync = () => {
      const deg = parseInt(this.ui.merchRotValEl.value);
      if (isNaN(deg)) return;
      this.ui.merchRotSlider.value = deg;
      const sel = this.ui.selected;
      if (sel) {
        sel.userData.merchRot = deg * Math.PI / 180;
        this.fixtures.renderMerchandise(sel);
      }
    };
    this.ui.merchRotSlider.oninput = () => {
      this.ui.merchRotValEl.value = this.ui.merchRotSlider.value;
      sync();
    };
    this.ui.merchRotValEl.oninput = sync;
    this.ui.merchRotSlider.onchange = this.ui.merchRotValEl.onchange = () => {
      if (this.ui.selected) this.fixtures.pushHistory();
    };
  }

  setupMerchRotationXSync() {
    const sync = () => {
      const deg = parseInt(this.ui.merchRotXValEl.value);
      if (isNaN(deg)) return;
      this.ui.merchRotXSlider.value = deg;
      const sel = this.ui.selected;
      if (sel) {
        sel.userData.merchRotX = deg * Math.PI / 180;
        this.fixtures.renderMerchandise(sel);
      }
    };
    this.ui.merchRotXSlider.oninput = () => {
      this.ui.merchRotXValEl.value = this.ui.merchRotXSlider.value;
      sync();
    };
    this.ui.merchRotXValEl.oninput = sync;
    this.ui.merchRotXSlider.onchange = this.ui.merchRotXValEl.onchange = () => {
      if (this.ui.selected) this.fixtures.pushHistory();
    };
  }

  setupMerchRotationZSync() {
    const sync = () => {
      const deg = parseInt(this.ui.merchRotZValEl.value);
      if (isNaN(deg)) return;
      this.ui.merchRotZSlider.value = deg;
      const sel = this.ui.selected;
      if (sel) {
        sel.userData.merchRotZ = deg * Math.PI / 180;
        this.fixtures.renderMerchandise(sel);
      }
    };
    this.ui.merchRotZSlider.oninput = () => {
      this.ui.merchRotZValEl.value = this.ui.merchRotZSlider.value;
      sync();
    };
    this.ui.merchRotZValEl.oninput = sync;
    this.ui.merchRotZSlider.onchange = this.ui.merchRotZValEl.onchange = () => {
      if (this.ui.selected) this.fixtures.pushHistory();
    };
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
