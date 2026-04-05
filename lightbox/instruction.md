# Lightbox 3D Models — Integration Guide

> **Read-only assets. Do not modify files in this folder.**  
> These models are placed on top of shelves in the existing Three.js scene (`index.html`).  
> All changes to the codebase remain the responsibility of the active developers.

---

## Folder Structure

```
lightbox/
├── meshes/
│   ├── girls.gltf       # GLTF descriptor (JSON)
│   ├── girls.bin        # Binary geometry buffer
│   ├── boys.gltf
│   ├── boys.bin
│   ├── mens.gltf
│   ├── mens.bin
│   ├── womens.gltf
│   ├── womens.bin
│   ├── newborn.gltf
│   └── newborn.bin
└── textures/
    ├── Wood_Diffuse2.jpg          ← Oak base color
    ├── Wood_Normal 2.jpg          ← Oak normal map
    ├── Wood_Roughness2.jpg        ← Oak roughness
    ├── Wood_imperfection2.jpg     ← Oak imperfection
    ├── Wood_Displace2.jpg         ← Oak displacement
    ├── LightWW_BaseColor.jpg      ← Glow white base color
    ├── LightWW_Normal.jpg         ← Glow white normal map
    ├── LightWW_Roughness.jpg      ← Glow white roughness
    └── LightWW_Emission.jpg       ← Glow white emission map
```

> The `Image_0–5` PNG files in `/textures` are intermediate exports — not referenced by any model, can be ignored or deleted.

---

## Model Descriptions

Each model is a two-mesh lightbox sign:

| Mesh in GLTF | Role        | Material                  |
|---|---|---|
| Back base    | 3" deep backing board | Polished Oak Wood (PBR)   |
| Front base   | 1" shallow front face | Warm White Glow (PBR + Emission) |

The front face sits slightly in front of and inset from the back base, creating a lit-panel effect.

**Available models:** `girls`, `boys`, `mens`, `womens`, `newborn`

---

## Loading in Three.js

Use `GLTFLoader`. The `.gltf` files reference textures via **relative paths** — keep the `meshes/` and `textures/` folders at the same level as shown above.

```js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

// Adjust the base path to match your server root
loader.load(
  'assets/3dModel/lightbox/meshes/girls.gltf',
  (gltf) => {
    const model = gltf.scene;

    // Position on top of shelf — adjust Y to match your shelf height
    model.position.set(x, shelfTopY, z);

    // Optional: scale down if needed (models are in Blender metres)
    // model.scale.setScalar(0.01); // use if your scene is in centimetres

    scene.add(model);
  },
  undefined,
  (err) => console.error('GLTF load error:', err)
);
```

---

## Material Notes

### Back Base — Polished Oak Wood (PBR)
- `map`             → `Wood_Diffuse2.jpg`
- `normalMap`       → `Wood_Normal 2.jpg`
- `roughnessMap`    → `Wood_Roughness2.jpg`
- `aoMap`           → `Wood_imperfection2.jpg`
- `displacementMap` → `Wood_Displace2.jpg` (low strength: 0.01–0.05)

### Front Base — Warm White Glow (PBR + Emission)
- `map`              → `LightWW_BaseColor.jpg`
- `normalMap`        → `LightWW_Normal.jpg`
- `roughnessMap`     → `LightWW_Roughness.jpg`
- `emissiveMap`      → `LightWW_Emission.jpg`
- `emissive`         → `0xffffff`
- `emissiveIntensity`→ `1.0` (increase for stronger glow)

> The GLTF files carry full PBR material definitions automatically. These notes are for reference if you need to override or debug materials manually.

---

## Enabling Emission Glow (Bloom)

The front face uses an emission map. To get the glowing lightbox effect, enable UnrealBloomPass in your post-processing pipeline:

```js
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.4,   // strength
  0.4,   // radius
  0.85   // threshold
);
composer.addPass(bloomPass);
```

> Do not add this if the codebase already has a bloom pass — check with the active developer first.

---

## Positioning on Shelf

Models have their origin at Blender world (0, 0, 0). After loading:

1. Get the shelf top surface Y coordinate in your Three.js scene.
2. Set `model.position.y = shelfTopY`.
3. Space along X axis with ~0.05–0.1 unit gaps between signs.

```js
const labels   = ['girls', 'boys', 'mens', 'womens', 'newborn'];
const spacingX = 3.2;  // approx width per sign in Blender metres — adjust as needed
const shelfY   = 2.1;  // replace with your actual shelf top Y

labels.forEach((label, i) => {
  loader.load(`assets/3dModel/lightbox/meshes/${label}.gltf`, (gltf) => {
    const model = gltf.scene;
    model.position.set(i * spacingX, shelfY, 0);
    scene.add(model);
  });
});
```

---

## CORS / Local Server

GLTF files with external `.bin` and texture references **require a local HTTP server** — they will not load via `file://`. Ensure the Three.js app is served via HTTP (Live Server, Vite, or any static server).

---

## Source

Models created in Blender 5.0.1.  
Materials: BlenderKit — *Polished Oak Wood* + *AR3DMat PBR Light Warm White*.  
Exported as `GLTF_SEPARATE` (mesh + binary geometry + external textures).
