import { CONSTANTS } from "../../data/constants.js";
import { addMerchCluster } from "../Merchandise.js";

export function renderFrontal(item, data, pos, currentRotation) {
  let meshes = [];
  const frontPaths = item.merchPathsFront || [];
  const backPaths = item.merchPathsBack || [];

  const totalCols = data.width >= 48 ? 2 : 1;

  const renderSection = (paths, yTop, zStart) => {
    if (paths.length === 0) return;
    for (let col = 0; col < totalCols; col++) {
      const pathIdx = Math.min(
        paths.length - 1,
        Math.floor(col / (totalCols / paths.length))
      );
      const path = paths[pathIdx];
      const xOff =
        totalCols === 2
          ? col === 0
            ? -12 * CONSTANTS.GLB_SCALE
            : 12 * CONSTANTS.GLB_SCALE
          : 0;
      const newMeshes = addMerchCluster(pos, currentRotation, path, xOff, yTop, zStart, 8);
      meshes = meshes.concat(newMeshes);
    }
  };

  renderSection(frontPaths, 46 * CONSTANTS.GLB_SCALE, 2 * CONSTANTS.GLB_SCALE);
  renderSection(backPaths, 51 * CONSTANTS.GLB_SCALE, -7 * CONSTANTS.GLB_SCALE);
  return meshes;
}
