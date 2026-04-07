import { CONSTANTS } from "../../data/constants.js";
import { addMerchCluster } from "../Merchandise.js";

export function renderKidsFrontal(item, data, pos, currentRotation) {
  let meshes = [];
  
  const renderKSection = (paths, zStart) => {
    if (!paths || paths.length === 0) return;
    const slots = [
      { y: 48 * CONSTANTS.GLB_SCALE, x: -6 * CONSTANTS.GLB_SCALE }, // Top Left
      { y: 48 * CONSTANTS.GLB_SCALE, x: 6 * CONSTANTS.GLB_SCALE },  // Top Right
      { y: 27 * CONSTANTS.GLB_SCALE, x: -6 * CONSTANTS.GLB_SCALE }, // Bottom Left
      { y: 27 * CONSTANTS.GLB_SCALE, x: 6 * CONSTANTS.GLB_SCALE }   // Bottom Right
    ];
    slots.forEach((slot, i) => {
      const pathIdx = Math.floor(i / (slots.length / Math.min(slots.length, paths.length)));
      const path = paths[pathIdx % paths.length];
      const newMeshes = addMerchCluster(pos, currentRotation, path, slot.x, slot.y, zStart, 8);
      meshes = meshes.concat(newMeshes);
    });
  };

  renderKSection(item.merchPathsFront, 2 * CONSTANTS.GLB_SCALE);
  renderKSection(item.merchPathsBack, -7 * CONSTANTS.GLB_SCALE);
  
  return meshes;
}
