import * as THREE from 'three';

export class RaycasterManager {
  constructor(camera, groundPlane) {
    this.camera = camera;
    this.groundPlane = groundPlane;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
  }

  updatePointer(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
  }

  getPointerOnGround(e, canvas) {
    this.updatePointer(e, canvas);
    const pt = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.groundPlane, pt) ? pt : null;
  }

  getIntersectingObject(e, canvas, objects) {
    this.updatePointer(e, canvas);
    const meshes = [];
    objects.forEach(g => g.traverse(o => { if (o.isMesh && o.visible) meshes.push(o); }));
    const hits = this.raycaster.intersectObjects(meshes);
    
    if (hits.length) {
      let target = hits[0].object;
      while (target && !objects.includes(target)) target = target.parent;
      return target;
    }
    return null;
  }
}
