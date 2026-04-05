export const CONFIG = {
  FLOOR_Y: 0.05,
  FLOOR_CLEARANCE: 0.02, // Slightly increased to help with Z-fighting
  PASTE_OFFSET: 0.6,
  HISTORY_LIMIT: 100,
  FIXTURES_META: [
    { file: "fixture/2fh.glb", label: "2FH", icon: "2F", desc: "2-face hang" },
    {
      file: "fixture/2kfh.glb",
      label: "2KFH",
      icon: "2K",
      desc: "2k-face hang",
    },
    { file: "fixture/2sh.glb", label: "2SH", icon: "2S", desc: "2-side hang" },
    { file: "fixture/4fh.glb", label: "4FH", icon: "4F", desc: "4-face hang" },
    { file: "fixture/4sh.glb", label: "4SH", icon: "4S", desc: "4-side hang" },
    {
      file: "fixture/nestingTable.glb",
      label: "Nesting Table",
      icon: "NT",
      desc: "Nesting table set",
    },
    {
      file: "fixture/sidehanging.glb",
      label: "Side Hanging",
      icon: "SH",
      desc: "Side hanging rail",
    },
    {
      file: "fixture/sofa.glb",
      label: "Sofa",
      icon: "SF",
      desc: "Comfortable sofa",
    },
    {
      file: "fixture/focal.glb",
      label: "Focal Point",
      icon: "FP",
      desc: "Focal point fixture",
    },
    {
      file: "mannequin/male_torso.glb",
      label: "Male Torso",
      icon: "MT",
      desc: "Male torso mannequin",
    },
  ],
  MANNEQUIN_FILE: "mannequin/male_torso.glb",
  MANNEQUIN_SCALE_ADJUST: 0.3,
  LIGHTBOX: {
    WIDTH: 0.61, // 2 feet in meters
    HEIGHT: 0.61, // 2 feet in meters
    DEPTH: 0.05,
    Y_LEVEL: 2.44, // 8 feet from floor to ceiling top
    IMAGES: [
      "lightbox/boy1.png",
      "lightbox/men1.png",
      "lightbox/girl1.png",
      "lightbox/girl2.png",
      "lightbox/boy2.png",
      "lightbox/men2.png",
      "lightbox/women1.png",
      "lightbox/women2.png",
      "lightbox/nb1.png",
      "lightbox/nb2.png",
    ],
  },
  CALLOUTS: [
    {
      file: "lightbox/meshes/mens.gltf",
      pos: [-10.15, 0.4],
      rot: 90,
      scale: 0.2,
      category: "MENS",
      label: "MENS",
    }, // Angle 1 - Left Wall
    {
      file: "lightbox/meshes/mens.gltf",
      pos: [-8.0, -3.15],
      rot: 0,
      scale: 0.2,
      category: "MENS",
      label: "MENS",
    }, // Angle 2 - Back Wall Left
    {
      file: "lightbox/meshes/newborn.gltf",
      pos: [6.0, -3.15],
      rot: 0,
      scale: 0.2,
      category: "NEWBORN",
      label: "NEWBORN",
    }, // Angle 4 - Back Wall Right
    {
      file: "lightbox/meshes/boys.gltf",
      pos: [10.15, -0.4],
      rot: -90,
      scale: 0.2,
      category: "BOYS",
      label: "BOYS",
    }, // Angle 5 - Right Wall
    {
      file: "lightbox/meshes/girls.gltf",
      pos: [6.0, 3.15],
      rot: 180,
      scale: 0.2,
      category: "GIRLS",
      label: "GIRLS",
    }, // Angle 6 - Front Wall Right
    {
      file: "lightbox/meshes/womens.gltf",
      pos: [-6.0, 3.15],
      rot: 180,
      scale: 0.2,
      category: "WOMENS",
      label: "WOMENS",
    }, // Angle 7 - Front Wall Left
  ],
  DEFAULT_MANNEQUINS: [
    { pos: [-9.9, 2.434], rot: -90 }, // Angle 1 MENS
    { pos: [-8.0, -2.957], rot: 0 }, // Angle 2 MENS
    { pos: [6.0, -2.993], rot: 0 }, // Angle 4 NEWBORN
    { pos: [9.9, -0.4], rot: 90 }, // Angle 5 BOYS
    { pos: [6.0, 2.993], rot: 180 }, // Angle 6 GIRLS
    { pos: [-6.0, 2.993], rot: 180 }, // Angle 7 WOMENS
  ],
  DEFAULT_FIXTURES: [
    { file: "fixture/nestingTable.glb", pos: [-8.685, 0.468], rot: 90 },
    { file: "fixture/nestingTable.glb", pos: [-5.364, -1.555], rot: 0 },
    { file: "fixture/nestingTable.glb", pos: [0.384, -1.5], rot: 0 },
    { file: "fixture/nestingTable.glb", pos: [6.428, -1.534], rot: 0 },
    { file: "fixture/nestingTable.glb", pos: [8.551, -0.43], rot: 270 },
    { file: "fixture/sidehanging.glb", pos: [-9.097, -1.829], rot: 90 },
    { file: "fixture/sidehanging.glb", pos: [-7.527, 1.701], rot: 90 },
    { file: "fixture/sidehanging.glb", pos: [-3.822, 1.792], rot: 90 },
    { file: "fixture/sidehanging.glb", pos: [-3.483, -1.874], rot: 90 },
    { file: "fixture/sidehanging.glb", pos: [4.532, 1.776], rot: 90 },
    { file: "fixture/sidehanging.glb", pos: [4.12, -1.889], rot: 90 },
    { file: "fixture/sidehanging.glb", pos: [8.774, -2.041], rot: 0 },
    { file: "fixture/sofa.glb", pos: [7.98, 1.7], rot: 180, scale: 2.05 }, // Updated Sofa
    { file: "fixture/focal.glb", pos: [-2.331, -0.301], rot: 0, scale: 1.5 },
    { file: "fixture/focal.glb", pos: [2.911, -0.302], rot: 0, scale: 1.5 },
  ],
  SHORTCUTS: {
    UNDO: { key: "z", ctrl: true, description: "Undo last action" },
    SELECT_MODE: { key: "v", description: "Switch to Select Mode" },
    PLACE_MODE: { key: "a", description: "Switch to Place Mode" },
    DELETE: { key: "delete", description: "Delete selected fixture" },
    ESCAPE: { key: "escape", description: "Deselect/Reset to Select Mode" },
    TOGGLE_EDIT: { key: "tab", description: "Toggle Edit Mode (Cutaway)" },
    QUICK_SAVE: {
      key: "s",
      ctrl: true,
      description: "Quick Save to Browser Storage",
    },
    QUICK_LOAD: {
      key: "l",
      ctrl: true,
      description: "Quick Load from Browser Storage",
    },
  },
};
