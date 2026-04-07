// Centralized application state
class Store {
  constructor() {
    this.layout = [];
    this.showBackdrop = false;
    this.currentFinish = "rose";
    this.selectedFixtureIdx = -1;
    this.merchPlacement = "front"; // "front" or "back"
    
    // Simple pub/sub for reacting to state changes
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener(this));
  }

  // Actions
  addFixture(type) {
    const entry = { 
      id: Date.now() + Math.random(), 
      type, 
      model: null,
      merchPathsFront: [],
      merchPathsBack: [],
      merchMeshes: []
    };
    this.layout.push(entry);
    this.notify();
    return entry;
  }

  removeFixture(index) {
    this.layout.splice(index, 1);
    // Adjust selection if needed
    if (this.selectedFixtureIdx === index) {
      this.selectedFixtureIdx = -1;
    } else if (this.selectedFixtureIdx > index) {
      this.selectedFixtureIdx--;
    }
    this.notify();
  }

  clearLayout() {
    this.layout = [];
    this.selectedFixtureIdx = -1;
    this.notify();
  }

  setLayout(newLayout) {
    this.layout = newLayout;
    this.notify();
  }

  setFinish(finish) {
    this.currentFinish = finish;
    this.notify();
  }

  setBackdrop(show) {
    this.showBackdrop = show;
    this.notify();
  }

  selectFixture(index) {
    this.selectedFixtureIdx = index;
    this.notify();
  }

  setMerchPlacement(placement) {
    this.merchPlacement = placement;
    this.notify();
  }

  applyMerchData(merchArray) {
    merchArray.forEach((data, i) => {
      if (this.layout[i]) {
        this.layout[i].merchPathsFront = data.front || [];
        this.layout[i].merchPathsBack = data.back || [];
      }
    });
    this.notify();
  }
}

export const store = new Store();
