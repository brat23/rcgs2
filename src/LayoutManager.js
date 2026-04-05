export class LayoutManager {
  constructor(app) {
    this.app = app;
    this.ui = app.ui;
    this.fixtures = app.fixtures;
  }

  setup() {
    this.ui.saveBtn.onclick = () => this.saveToFile();
    this.ui.loadBtn.onclick = () => this.ui.layoutInput.click();
    this.ui.layoutInput.onchange = (e) => this.loadFromFile(e);
  }

  saveToFile() {
    const data = JSON.stringify(this.fixtures.captureLayout(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `layout_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.ui.setStatus('Layout saved to file');
  }

  loadFromFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const layout = JSON.parse(event.target.result);
        this.fixtures.restoreLayout(layout);
        this.ui.setStatus('Layout loaded from file');
      } catch (err) {
        console.error('Failed to load layout:', err);
        this.ui.setStatus('Error: Invalid layout file');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  }

  quickSave() {
    const data = JSON.stringify(this.fixtures.captureLayout());
    localStorage.setItem('rcm_quick_save', data);
    this.ui.setStatus('Quick Save complete (Browser Storage)');
  }

  quickLoad() {
    const data = localStorage.getItem('rcm_quick_save');
    if (!data) return this.ui.setStatus('No quick save found');
    try {
      this.fixtures.restoreLayout(JSON.parse(data));
      this.ui.setStatus('Quick Load complete');
    } catch (err) {
      this.ui.setStatus('Error loading quick save');
    }
  }
}
