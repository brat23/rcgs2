import * as THREE from 'three';
import { CONFIG } from './config.js';

export class UIManager {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.statusEl = document.getElementById('status');
    this.statusTextEl = document.getElementById('statusText');
    this.progressBarEl = document.getElementById('progressBar');
    this.tutorialEl = document.getElementById('tutorialHints');
    this.editToggleBtn = document.getElementById('editToggle');
    this.toolboxEl = document.getElementById('toolbox');
    this.sidebarEl = document.getElementById('sidebar');
    this.toastEl = document.getElementById('toast');
    this.toastTimer = null;

    // Registry to track specific asset load requests
    this.loadRegistry = new Set();
    this.finishedRegistry = new Set();

    this.selectedInfo = document.getElementById('selectedInfo');
    this.selectedInfo.style.cursor = 'pointer';
    this.selectedInfo.title = 'Click to copy position';
    this.selectedInfo.onclick = () => {
      if (this.selectedItems.length === 0) return;
      let text = "";
      if (this.selectedItems.length === 1) {
          const sel = this.selected;
          const { x, z } = sel.position;
          const rot = Math.round((sel.userData.userRot || 0) * 180 / Math.PI);
          const label = CONFIG.FIXTURES_META.find(item => item.file === sel.userData.file)?.label || sel.name || 'fixture';
          text = `${label}: { pos: [${x.toFixed(3)}, ${z.toFixed(3)}], rot: ${rot} }`;
      } else {
          text = this.selectedItems.map(sel => {
              const label = CONFIG.FIXTURES_META.find(item => item.file === sel.userData.file)?.label || sel.name || 'fixture';
              const rot = Math.round((sel.userData.userRot || 0) * 180 / Math.PI);
              return `${label}: { pos: [${sel.position.x.toFixed(3)}, ${sel.position.z.toFixed(3)}], rot: ${rot} }`;
          }).join('\n');
      }
      
      navigator.clipboard.writeText(text).then(() => {
        this.setStatus('Position & Rotation copied!');
      });
    };
    this.deleteBtn = document.getElementById('deleteBtn');

    // Transform Panel
    this.transformPanel = document.getElementById('transformPanel');
    this.posXSlider = document.getElementById('posXSlider');
    this.posXValEl = document.getElementById('posXVal');
    this.posZSlider = document.getElementById('posZSlider');
    this.posZValEl = document.getElementById('posZVal');
    this.scaleSlider = document.getElementById('scaleSlider');
    this.scaleValEl = document.getElementById('scaleVal');
    this.rotSlider = document.getElementById('rotSlider');
    this.rotValEl = document.getElementById('rotVal');

    this.libEl = document.getElementById('fixtureLibrary');
    this.debugEl = document.getElementById('debugInfo');

    this.selectToolBtn = document.getElementById('selectTool');
    this.placeToolBtn = document.getElementById('placeTool');
    this.deleteToolBtn = document.getElementById('deleteTool');
    this.undoToolBtn = document.getElementById('undoTool');

    this.saveBtn = document.getElementById('saveBtn');
    this.loadBtn = document.getElementById('loadBtn');
    this.layoutInput = document.getElementById('layoutInput');

    this.topBtn = document.getElementById('topBtn');
    this.perspBtn = document.getElementById('perspBtn');

    this.contextMenuEl = document.getElementById('contextMenu');

    // Alignment UI
    this.alignmentPanel = document.getElementById('alignmentPanel');
    this.alignLeftBtn = document.getElementById('alignLeft');
    this.alignCenterXBtn = document.getElementById('alignCenterX');
    this.alignRightBtn = document.getElementById('alignRight');
    this.alignTopBtn = document.getElementById('alignTop');
    this.alignCenterZBtn = document.getElementById('alignCenterZ');
    this.alignBottomBtn = document.getElementById('alignBottom');
    this.distributeXBtn = document.getElementById('distributeX');
    this.distributeZBtn = document.getElementById('distributeZ');

    this.selectedItems = []; // Array of selected groups
    this.selectionHelpers = new Map(); // Map: group -> BoxHelper
    
    // For backward compatibility/simpler access to the "primary" selected item
    Object.defineProperty(this, 'selected', {
      get: () => this.selectedItems[this.selectedItems.length - 1] || null
    });
    
    // Add camera debug element
    this.cameraDebugEl = document.createElement('div');
    this.cameraDebugEl.style.cssText = 'position: absolute; bottom: 40px; right: 10px; background: rgba(0,0,0,0.6); color: #fff; padding: 5px 10px; font-family: monospace; font-size: 11px; cursor: pointer; pointer-events: auto; border-radius: 4px; user-select: all; z-index: 1000;';
    this.cameraDebugEl.title = 'Click to copy coordinates';
    document.body.appendChild(this.cameraDebugEl);

    this.cameraDebugEl.onclick = () => {
      const text = this.cameraDebugEl.textContent;
      navigator.clipboard.writeText(text).then(() => {
        const original = this.cameraDebugEl.style.background;
        this.cameraDebugEl.style.background = '#44aa44';
        this.setStatus('Coordinates copied to clipboard!');
        setTimeout(() => this.cameraDebugEl.style.background = original, 500);
      });
    };
  }

  showCameraDebug(camera, controls) {
    const p = camera.position;
    const t = controls.target;
    if (this.cameraDebugEl) {
      this.cameraDebugEl.textContent = `Cam: [${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}] | Trg: [${t.x.toFixed(2)}, ${t.y.toFixed(2)}, ${t.z.toFixed(2)}]`;
    }
  }

  setStatus(msg) {
    this.showToast(msg);
  }

  showToast(msg, duration = 3000) {
    if (!this.toastEl) return;
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('visible');
    
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.remove('visible');
    }, duration);
  }

  highlightCard(activeCard) {
    document.querySelectorAll('.fixture-card').forEach(el => el.classList.remove('active'));
    if (activeCard) activeCard.classList.add('active');
  }

  registerAssetRequest(path) {
    this.loadRegistry.add(path);
    this.updateLoadingStatus();
  }

  assetFinished(path) {
    this.finishedRegistry.add(path);
    this.updateLoadingStatus();
  }

  updateLoadingStatus() {
    const total = this.loadRegistry.size;
    const finished = this.finishedRegistry.size;
    if (total === 0) return;

    const percent = Math.min(100, (finished / total) * 100);
    
    if (this.progressBarEl) this.progressBarEl.style.width = `${percent}%`;
    if (this.statusTextEl) this.statusTextEl.textContent = `Initializing Assets (${finished}/${total})`;
    
    const hints = [
      "Tip: Press 1-7 to focus on wall sections.",
      "Tip: Press 8 for Top View, 9 for Perspective.",
      "Tip: Double-press a camera key for a shake effect!",
      "Tip: Press TAB anytime to enter Edit Mode.",
      "Optimizing 3D textures..."
    ];
    if (this.tutorialEl) {
      this.tutorialEl.textContent = hints[Math.floor(Date.now() / 3000) % hints.length];
    }

    if (finished >= total && total > 0) {
      this.hideLoading();
    }
  }

  hideLoading() {
    if (this.statusEl) {
      this.statusEl.classList.add('hidden');
      // Re-enable interactions once hidden
      setTimeout(() => {
        this.statusEl.style.display = 'none';
      }, 1000);
    }
  }

  setEditModeUI(isEdit) {
    if (this.sidebarEl) this.sidebarEl.style.display = isEdit ? 'flex' : 'none';
    if (this.toolboxEl) this.toolboxEl.style.display = isEdit ? 'flex' : 'none';
    if (this.editToggleBtn) this.editToggleBtn.classList.toggle('active', isEdit);
    
    // Also hide camera debug when not editing for a cleaner view
    if (this.cameraDebugEl) this.cameraDebugEl.style.display = isEdit ? 'block' : 'none';

    if (!isEdit) {
      this.transformPanel.style.display = 'none';
    }
  }

  showDebug() {
    if (this.selectedItems.length === 0) { if (this.debugEl) this.debugEl.textContent = ''; return; }
    if (this.selectedItems.length > 1) {
      if (this.debugEl) this.debugEl.textContent = `${this.selectedItems.length} items selected`;
      return;
    }
    
    const sel = this.selected;
    const { x, z } = sel.position;
    const rot = (sel.rotation.y * 180 / Math.PI).toFixed(0);
    if (this.debugEl) this.debugEl.textContent = `Pos: [${x.toFixed(3)}, ${z.toFixed(3)}], Rot: ${rot}°`;
    
    if (document.activeElement !== this.posXValEl && document.activeElement !== this.posXSlider) {
        this.posXSlider.value = this.posXValEl.value = x.toFixed(2);
    }
    if (document.activeElement !== this.posZValEl && document.activeElement !== this.posZSlider) {
        this.posZSlider.value = this.posZValEl.value = z.toFixed(2);
    }
  }

  select(group, scene) {
    this.deselect(scene);
    if (!group) return;
    this.addToSelection(group, scene);
  }

  toggleSelection(group, scene) {
    if (this.selectedItems.includes(group)) {
      this.removeFromSelection(group, scene);
    } else {
      this.addToSelection(group, scene);
    }
  }

  addToSelection(group, scene) {
    if (!group || this.selectedItems.includes(group)) return;
    
    this.selectedItems.push(group);
    const helper = new THREE.BoxHelper(group, 0x6c63ff);
    this.selectionHelpers.set(group, helper);
    scene.add(helper);

    this.updateUIForSelection();
  }

  removeFromSelection(group, scene) {
    const idx = this.selectedItems.indexOf(group);
    if (idx === -1) return;
    
    this.selectedItems.splice(idx, 1);
    const helper = this.selectionHelpers.get(group);
    if (helper) {
      scene.remove(helper);
      this.selectionHelpers.delete(group);
    }

    this.updateUIForSelection();
  }

  updateUIForSelection() {
    if (this.selectedItems.length === 0) {
      this.selectedInfo.textContent = 'Click a fixture to select';
      this.deleteBtn.disabled = true;
      this.transformPanel.style.display = 'none';
    } else if (this.selectedItems.length === 1) {
      const group = this.selected;
      const label = CONFIG.FIXTURES_META.find(item => item.file === group.userData.file)?.label || group.name || 'fixture';
      this.selectedInfo.textContent = `${label} · (${group.position.x.toFixed(2)}, ${group.position.z.toFixed(2)})`;
      this.deleteBtn.disabled = false;

      this.transformPanel.style.display = 'flex';
      this.posXSlider.value = this.posXValEl.value = group.position.x.toFixed(2);
      this.posZSlider.value = this.posZValEl.value = group.position.z.toFixed(2);
      this.scaleSlider.value = group.userData.userScale;
      this.scaleValEl.value = Number(group.userData.userScale).toFixed(2);
      this.rotSlider.value = this.rotValEl.value = Math.round((group.userData.userRot || 0) * 180 / Math.PI);
    } else {
      this.selectedInfo.textContent = `${this.selectedItems.length} items selected`;
      this.deleteBtn.disabled = false;
      this.transformPanel.style.display = 'none'; // Hide transform for multi-select for now
    }
    
    // Toggle alignment panel visibility
    if (this.alignmentPanel) {
        this.alignmentPanel.style.display = (this.selectedItems.length > 1) ? 'block' : 'none';
    }
    
    this.showDebug();
  }

  setupAlignment(handlers) {
    if (!this.alignmentPanel) return;
    this.alignLeftBtn.onclick = handlers.onAlignLeft;
    this.alignCenterXBtn.onclick = handlers.onAlignCenterX;
    this.alignRightBtn.onclick = handlers.onAlignRight;
    this.alignTopBtn.onclick = handlers.onAlignTop;
    this.alignCenterZBtn.onclick = handlers.onAlignCenterZ;
    this.alignBottomBtn.onclick = handlers.onAlignBottom;
    this.distributeXBtn.onclick = handlers.onDistributeX;
    this.distributeZBtn.onclick = handlers.onDistributeZ;
  }

  deselect(scene) {
    this.selectionHelpers.forEach(helper => scene.remove(helper));
    this.selectionHelpers.clear();
    this.selectedItems = [];
    
    this.selectedInfo.textContent = 'Click a fixture to select';
    this.deleteBtn.disabled = true;
    this.transformPanel.style.display = 'none';
    this.showDebug();
  }

  setToolUI(mode) {
    this.selectToolBtn.classList.toggle('active', mode === 'select');
    this.placeToolBtn.classList.toggle('active', mode === 'place');
    if (mode === 'select') { this.highlightCard(null); this.canvas.style.cursor = 'default'; }
    else this.canvas.style.cursor = 'crosshair';
  }

  updateSelectionHelper() {
    this.selectionHelpers.forEach(helper => helper.update());
  }

  showContextMenu(x, y, items, onSelect) {
    if (!this.contextMenuEl) return;
    this.contextMenuEl.innerHTML = '';
    
    const header = document.createElement('div');
    header.className = 'context-menu-header';
    header.textContent = 'Frame Content';
    this.contextMenuEl.appendChild(header);

    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'context-menu-item';
    emptyDiv.innerHTML = `<div style="width:28px;height:28px;background:#111;border:1px solid #444;border-radius:4px;"></div> <span>Empty Frame</span>`;
    emptyDiv.onclick = () => { onSelect('empty'); this.hideContextMenu(); };
    this.contextMenuEl.appendChild(emptyDiv);

    const scrollContainer = document.createElement('div');
    scrollContainer.style.maxHeight = '300px';
    scrollContainer.style.overflowY = 'auto';

    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'context-menu-item';
      div.innerHTML = `<img src="${item.file}" /> <span>${item.file.split('/').pop()}</span>`;
      div.onclick = (e) => {
        e.stopPropagation();
        console.log("Context menu selection:", item.file);
        onSelect(item.file);
        this.hideContextMenu();
      };
      scrollContainer.appendChild(div);
    });
    this.contextMenuEl.appendChild(scrollContainer);

    this.contextMenuEl.style.display = 'block';
    
    // Position check to keep within window
    const menuWidth = 180;
    const menuHeight = items.length * 40 + 30;
    let finalX = x;
    let finalY = y;
    
    if (x + menuWidth > window.innerWidth) finalX = x - menuWidth;
    if (y + menuHeight > window.innerHeight) finalY = y - menuHeight;

    this.contextMenuEl.style.left = `${finalX}px`;
    this.contextMenuEl.style.top = `${finalY}px`;

    // Close menu when clicking elsewhere, but allow clicks inside to propagate first
    const closer = (e) => {
      if (this.contextMenuEl && !this.contextMenuEl.contains(e.target)) {
        this.hideContextMenu();
        window.removeEventListener('mousedown', closer);
      }
    };
    setTimeout(() => window.addEventListener('mousedown', closer), 10);
  }

  hideContextMenu() {
    if (this.contextMenuEl) {
        this.contextMenuEl.style.display = 'none';
        // Force a cleanup of the global listener if it exists
    }
  }
}
