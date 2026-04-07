export const FIXTURE_DATA = {
  "4sh": { name: "4' Side Hanging", width: 48, depth: 18, glb: "./4sh.glb", typeGroup: "side" },
  "4fh": { name: "4' Front Hanging", width: 48, depth: 18, glb: "./4fh.glb", typeGroup: "frontal" },
  "2sh": { name: "2' Side Hanging", width: 24, depth: 18, glb: "./2sh.glb", typeGroup: "side" },
  "2fh": { name: "2' Front Hanging", width: 24, depth: 18, glb: "./2fh.glb", typeGroup: "frontal" },
  "2kfh": { name: "2' K Front Hanging", width: 24, depth: 18, glb: "./2kfh.glb", typeGroup: "kids" },
  empty: { name: "Empty Space", width: 24, depth: 18, glb: null, typeGroup: "empty" },
  "turn-l": {
    name: "90° Turn Left",
    width: 0,
    depth: 18,
    glb: null,
    isTurn: true,
    angle: Math.PI / 2,
    typeGroup: "turn"
  },
  "turn-r": {
    name: "90° Turn Right",
    width: 0,
    depth: 18,
    glb: null,
    isTurn: true,
    angle: -Math.PI / 2,
    typeGroup: "turn"
  },
};
