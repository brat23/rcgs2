import { CONSTANTS } from "../data/constants.js";
import { engine } from "../core/engine.js";

const textureLoader = new THREE.TextureLoader();

export function addMerchCluster(pos, currentRotation, path, xOff, yTop, zStart, numLayers, rotation = 0) {
  if (!path) return [];
  
  const texture = textureLoader.load(path);
  const merchMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    alphaTest: 0.5,
  });
  
  const centerY = yTop - CONSTANTS.MERCH_HEIGHT / 2;
  const forwardDir = new THREE.Vector3(Math.sin(currentRotation), 0, Math.cos(currentRotation));
  const sideDir = new THREE.Vector3(Math.cos(currentRotation), 0, -Math.sin(currentRotation));
  const meshes = [];

  for (let i = 0; i < numLayers; i++) {
    const merchGeom = new THREE.PlaneGeometry(CONSTANTS.MERCH_WIDTH, CONSTANTS.MERCH_HEIGHT);
    const merchMesh = new THREE.Mesh(merchGeom, merchMat);
    let merchOffset = new THREE.Vector3(0, centerY, 0);
    merchOffset.add(sideDir.clone().multiplyScalar(xOff));
    merchOffset.add(forwardDir.clone().multiplyScalar(zStart + i * CONSTANTS.LAYER_GAP));
    
    merchMesh.position.copy(pos).add(merchOffset);
    merchMesh.rotation.y = currentRotation + rotation;
    engine.scene.add(merchMesh);
    meshes.push(merchMesh);
  }
  
  return meshes;
}
