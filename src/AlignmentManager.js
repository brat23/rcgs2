import * as THREE from 'three';

export class AlignmentManager {
  constructor(app) {
    this.app = app;
  }

  setup() {
    this.app.ui.setupAlignment({
      onAlignLeft: () => this.align('x', 'min'),
      onAlignCenterX: () => this.align('x', 'center'),
      onAlignRight: () => this.align('x', 'max'),
      onAlignTop: () => this.align('z', 'min'),
      onAlignCenterZ: () => this.align('z', 'center'),
      onAlignBottom: () => this.align('z', 'max'),
      onDistributeX: () => this.distribute('x'),
      onDistributeZ: () => this.distribute('z'),
    });
  }

  getBounds(items) {
    return items.map(item => {
      const box = new THREE.Box3().setFromObject(item);
      return { item, box, center: box.getCenter(new THREE.Vector3()) };
    });
  }

  align(axis, type) {
    const selected = this.app.ui.selectedItems;
    if (selected.length < 2) return;

    const bounds = this.getBounds(selected);
    let targetValue;

    if (type === 'min') {
      targetValue = Math.min(...bounds.map(b => b.box.min[axis]));
    } else if (type === 'max') {
      targetValue = Math.max(...bounds.map(b => b.box.max[axis]));
    } else {
      // Center
      const min = Math.min(...bounds.map(b => b.box.min[axis]));
      const max = Math.max(...bounds.map(b => b.box.max[axis]));
      targetValue = (min + max) / 2;
    }

    bounds.forEach(b => {
      const size = b.box.max[axis] - b.box.min[axis];
      if (type === 'min') {
        b.item.position[axis] = targetValue + size / 2;
      } else if (type === 'max') {
        b.item.position[axis] = targetValue - size / 2;
      } else {
        b.item.position[axis] = targetValue;
      }
      // Note: This simple assignment assumes the object's local origin is its center.
      // If it's not, we need to adjust by the offset between local origin and box center.
      const boxAfter = new THREE.Box3().setFromObject(b.item);
      const centerAfter = boxAfter.getCenter(new THREE.Vector3());
      const offset = b.item.position[axis] - centerAfter[axis];
      b.item.position[axis] += offset;
      
      this.app.fixtures.alignToHeight(b.item, b.item.userData.baseY);
    });

    this.app.fixtures.pushHistory();
    this.app.ui.setStatus(`Aligned ${selected.length} items`);
  }

  distribute(axis) {
    const selected = [...this.app.ui.selectedItems];
    if (selected.length < 3) {
        this.app.ui.setStatus('Select at least 3 items to distribute');
        return;
    }

    const bounds = this.getBounds(selected);
    // Sort by current position on axis
    bounds.sort((a, b) => a.center[axis] - b.center[axis]);

    const first = bounds[0];
    const last = bounds[bounds.length - 1];
    
    const startPos = first.center[axis];
    const endPos = last.center[axis];
    const totalDist = endPos - startPos;
    const step = totalDist / (selected.length - 1);

    bounds.forEach((b, i) => {
      const targetCenter = startPos + i * step;
      const offset = b.item.position[axis] - b.center[axis];
      b.item.position[axis] = targetCenter + offset;
      this.app.fixtures.alignToHeight(b.item, b.item.userData.baseY);
    });

    this.app.fixtures.pushHistory();
    this.app.ui.setStatus(`Distributed ${selected.length} items`);
  }
}
