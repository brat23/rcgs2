export class ToolManager {
  constructor(app) {
    this.app = app;
    this.ui = app.ui;
  }

  setup() {
    if (this.ui.selectToolBtn) this.ui.selectToolBtn.onclick = () => this.app.setToolMode('select');
    
    if (this.ui.placeToolBtn) {
      this.ui.placeToolBtn.onclick = () => {
        if (this.app.activeFile) {
          this.app.setToolMode('place');
        } else {
          this.ui.setStatus('Select a fixture first');
        }
      };
    }

    const deleteFn = () => {
      this.app.deleteSelected();
      this.app.scene.controls.enabled = true;
    }
    if (this.ui.deleteToolBtn) this.ui.deleteToolBtn.onclick = deleteFn;
    if (this.ui.deleteBtn) this.ui.deleteBtn.onclick = deleteFn;

    if (this.ui.undoToolBtn) {
      this.ui.undoToolBtn.onclick = () => {
        if (this.app.fixtures.undo()) {
          this.ui.setStatus('Undo complete');
          this.app.ui.deselect(this.app.scene.scene);
          this.app.scene.controls.enabled = true;
        }
      };
    }

    if (this.ui.topBtn) this.ui.topBtn.onclick = () => this.app.scene.setTopView();
    if (this.ui.perspBtn) this.ui.perspBtn.onclick = () => this.app.scene.setPerspectiveView();
  }
}
