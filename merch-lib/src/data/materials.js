// Ensure THREE is globally available or imported if using a bundler.
// Since we are using Vanilla JS + ES Modules with global script tags for Three.js, THREE is on window.

export const MATERIALS = {
  rose: new THREE.MeshStandardMaterial({
    name: "MAT_RoseBrushedGold",
    color: new THREE.Color(0.72, 0.45, 0.36),
    metalness: 1.0,
    roughness: 0.35,
    envMapIntensity: 1.6,
  }),
  ss: new THREE.MeshStandardMaterial({
    name: "MAT_StainlessSteel",
    color: new THREE.Color(0.75, 0.75, 0.75),
    metalness: 1.0,
    roughness: 0.2,
    envMapIntensity: 2.0,
  }),
  black: new THREE.MeshStandardMaterial({
    name: "MAT_BlackMetal",
    color: new THREE.Color(0.03, 0.03, 0.03),
    metalness: 1.0,
    roughness: 0.3,
    envMapIntensity: 1.2,
  }),
};

export const WOOD_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x2b1d16, // Dark Chocolate Brown (visual only)
  roughness: 0.9,
  metalness: 0.0,
});

export function applyFixtureMaterial(model, currentFinish) {
  if (!model) return;
  const mat = MATERIALS[currentFinish];
  model.traverse((child) => {
    if (child.isMesh) {
      if (Array.isArray(child.material)) {
        child.material = child.material.map((m) =>
          m && m.name && m.name.startsWith("MAT_") ? mat : m,
        );
      } else if (
        child.material &&
        child.material.name &&
        child.material.name.startsWith("MAT_")
      ) {
        child.material = mat;
      }
      child.castShadow = child.receiveShadow = true;
    }
  });
}
