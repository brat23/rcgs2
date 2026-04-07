# RCGS2 - 3D Retail Store Planner

A professional, modular Three.js application for interactive 3D retail store layout planning. This project features a data-driven architecture where layouts are serialized to JSON and assets are automatically normalized for consistent real-world scaling.

## 🚀 Core Features

- **Intelligent 3D Editor**: Toggle "Edit Mode" (TAB) to move fixtures, mannequins, and lightboxes.
- **Auto-Normalization Engine**: Automatically scales mismatched 3D models (Blender 100x vs Meters) to consistent real-world dimensions using internal correction multipliers.
- **Smart Lightbox System**: Right-click any wall frame to update its image or set it to an "Empty Frame" look with a 1" black border.
- **Multi-Select & Bulk Tools**: 
  - `Shift + Click` to select multiple items.
  - Arrow keys for minute (0.01) or fast (0.05 with Shift) nudging.
  - Dedicated **Align & Distribute** panel for professional arrangements.
- **Perspective Shortcuts**: Keys `1-7` for wall focus, `8` for Top View, `9` for Perspective.
- **State Persistence**: Complete layout serialization (position, rotation, scale, images) to JSON with Undo/Redo (Ctrl+Z) support.

## 🏗️ Architecture (Manager Pattern)

The application is orchestrated by `src/App.js`, which delegates specialized logic to various managers:

| Manager | Responsibility |
| :--- | :--- |
| **`SceneManager.js`** | Three.js boilerplate: Renderer (ACES Filmic), Camera, Lights, and OrbitControls. |
| **`FixtureManager.js`** | **CRITICAL**: The source of truth for all placed objects. Handles cloning, scaling logic, and layout serialization. |
| **`LightboxManager.js`** | Manages the dynamic "Framed Group" objects and texture updates. |
| **`RoomManager.js`** | Environment loading (`scene.glb`) and the **Dynamic Cutaway** system (hiding walls that block the camera). |
| **`InputManager.js`** | Bridges keyboard/mouse events to actions (Dragging, Shortcuts, Multi-selection). |
| **`AlignmentManager.js`** | Logic for Bounding-Box based alignment and distribution. |
| **`UIManager.js`** | Synchronizes the HTML/CSS sidebar with the 3D state. |

## 📐 Scaling Logic (Critical for AI/Devs)

To prevent regressions where models appear "super big" or "skewed," follow the standard in `FixtureManager.js`:

1.  **Normalization (`autoScale`)**: Calculated automatically on load to bring any model to a 1-meter bounding box baseline.
2.  **Internal Multiplier**: Applied based on model type (e.g., Mannequins = `0.3`, Shelves = `1.25`).
3.  **User Scale**: The relative scale set by the user in UI/JSON (where `1.0` is the standard corrected size).
4.  **Final Formula**: `scale = autoScale * internalMultiplier * userScale`

## 📂 Project Structure & Config

- `/src/config/` - **Look here first to modify defaults.**
  - `default_layout.js`: The current master layout (positions/rotations).
  - `fixtures.js`: Metadata for the sidebar library.
  - `mannequins.js`: Correction factors and initial placements.
  - `general.js`: Floor heights and shortcuts.
- `/fixture/`, `/mannequin/`, `/lightbox/` - 3D models and textures.

## ⌨️ Shortcuts

- **TAB**: Toggle Edit Mode.
- **V / A**: Select Mode / Place Mode.
- **Ctrl + C / Ctrl + V**: Copy & Paste selected items.
- **Arrows**: Move selected items (0.01 step).
- **Shift + Arrows**: Move selected items (0.05 step).
- **Delete**: Remove selected items.
- **ESC**: Deselect all.
- **1 - 7**: Focus camera on specific wall sections.
- **0 / 8 / 9**: Camera views (Top / Perspective).

## 🛠️ Modifying the Code

- **Adding a new Fixture**: Add the `.glb` to `/fixture/` and its metadata to `src/config/fixtures.js`.
- **Changing Initial Layout**: Modify `src/config/default_layout.js`. This file is the primary "Save State" used on refresh.
- **Fixing Interaction**: Check `InputManager.js` for event listeners and `RaycasterManager.js` for object picking logic.
