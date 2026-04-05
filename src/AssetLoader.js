import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export class AssetLoader {
  constructor() {
    this.draco = new DRACOLoader();
    this.draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/libs/draco/');
    this.loader = new GLTFLoader();
    this.loader.setDRACOLoader(this.draco);
    this.textureLoader = new THREE.TextureLoader();
    this.prototypes = {};
    this.textures = {};
  }

  loadTexture(path) {
    if (this.textures[path]) return Promise.resolve(this.textures[path]);
    return new Promise((resolve, reject) => {
      this.textureLoader.load(path, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        this.textures[path] = tex;
        resolve(tex);
      }, undefined, reject);
    });
  }

  getTexture(path) {
    return this.textures[path];
  }

  loadModel(path, onProgress) {
    return new Promise((resolve, reject) => {
      this.loader.load(path, (gltf) => {
        this.prototypes[path] = gltf.scene;
        resolve(gltf);
      }, onProgress, reject);
    });
  }

  getPrototype(path) {
    return this.prototypes[path];
  }

  isLoaded(path) {
    return !!this.prototypes[path];
  }
}
