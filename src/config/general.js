export const GENERAL = {
  FLOOR_Y: 0.07,
  FLOOR_CLEARANCE: 0.03,
  PASTE_OFFSET: 0.6,
  HISTORY_LIMIT: 100,
};

export const SHORTCUTS = {
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
  COPY: {
    key: "c",
    ctrl: true,
    description: "Copy selected fixture",
  },
  PASTE: {
    key: "v",
    ctrl: true,
    description: "Paste copied fixture",
  },
};
