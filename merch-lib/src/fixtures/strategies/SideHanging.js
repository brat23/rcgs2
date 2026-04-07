import { CONSTANTS } from "../../data/constants.js";
import { addMerchCluster } from "../Merchandise.js";

export function renderSideHanging(item, data, pos, currentRotation) {
  let meshes = [];
  const paths = (item.merchPathsFront || []).concat(item.merchPathsBack || []);
  if (paths.length > 0) {
    const totalItems = data.width / 2; // 24 items for 4', 12 for 2'
    const startX = -(data.width / 2 - 1) * CONSTANTS.GLB_SCALE;
    const xStep = ((data.width - 2) / (totalItems - 1)) * CONSTANTS.GLB_SCALE;

    for (let i = 0; i < totalItems; i++) {
      const pathIdx = Math.min(
        paths.length - 1,
        Math.floor(i / (totalItems / paths.length))
      );
      const path = paths[pathIdx];
      const newMeshes = addMerchCluster(
        pos, currentRotation,
        path,
        startX + i * xStep,
        46 * CONSTANTS.GLB_SCALE,
        0,
        1,
        Math.PI / 2
      );
      meshes = meshes.concat(newMeshes);
    }
  }
  return meshes;
}
