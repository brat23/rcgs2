import { engine } from "./core/engine.js";
import { initSidebar } from "./ui/sidebar.js";
import { store } from "./state/store.js";
import { FIXTURE_DATA } from "./data/fixturesData.js";
import { fixtureManager } from "./fixtures/FixtureManager.js";
import "./ui/dock.js"; // Import to run the subscription

// Load Layout Logic
function loadLayoutJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (!data.sequence) throw new Error("Invalid layout file");
      
      store.clearLayout();
      
      if (data.globalFinish) {
        store.setFinish(data.globalFinish);
        document.querySelectorAll(".swatch-btn").forEach((b) =>
          b.classList.toggle("active", b.dataset.finish === data.globalFinish)
        );
      }
      
      if (data.showBackdrop !== undefined && data.showBackdrop !== store.showBackdrop) {
        window.toggleBackdrop();
      }
      
      data.sequence.forEach((item) => {
        window.addFixture(item.type);
      });
    } catch (err) {
      alert("Error loading layout: " + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

function saveLayoutJSON() {
  if (store.layout.length === 0) return alert("Layout is empty!");
  const totalPath = store.layout.reduce((sum, item) => sum + FIXTURE_DATA[item.type].width, 0);
  
  const manifest = {
    projectName: "VMSD Fixture Layout",
    exportedAt: new Date().toISOString(),
    globalFinish: store.currentFinish,
    showBackdrop: store.showBackdrop,
    totalPathInches: totalPath,
    fixtureCount: store.layout.filter((i) => !FIXTURE_DATA[i.type].isTurn && i.type !== "empty").length,
    sequence: store.layout.map((item) => ({ type: item.type })),
  };
  
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vmsd-layout-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function saveMerchFile() {
  if (store.layout.length === 0) return alert("Nothing to save!");
  
  const merchData = {
    projectName: "VMSD Merchandise Layout",
    exportedAt: new Date().toISOString(),
    merchandise: store.layout.map(item => ({
      front: item.merchPathsFront || [],
      back: item.merchPathsBack || []
    }))
  };

  const blob = new Blob([JSON.stringify(merchData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vmsd-merch-${Date.now()}.merch`;
  a.click();
  URL.revokeObjectURL(url);
}

function loadMerchFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (!data.merchandise) throw new Error("Invalid .merch file");
      store.applyMerchData(data.merchandise);
    } catch (err) {
      alert("Error loading merchandise: " + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

// Bootstrap
window.onload = () => {
  engine.init("viewer-container", "viewer-canvas");
  initSidebar();

  document.getElementById("clear-btn")?.addEventListener("click", () => store.clearLayout());
  document.getElementById("save-json-btn")?.addEventListener("click", saveLayoutJSON);
  document.getElementById("load-json-btn")?.addEventListener("click", () => document.getElementById("load-json-input").click());
  document.getElementById("load-json-input")?.addEventListener("change", loadLayoutJSON);
  
  document.getElementById("save-merch-btn")?.addEventListener("click", saveMerchFile);
  document.getElementById("load-merch-btn")?.addEventListener("click", () => document.getElementById("load-merch-input").click());
  document.getElementById("load-merch-input")?.addEventListener("change", loadMerchFile);

  // Load default layout
  fetch("./rcg.json")
    .then((response) => response.json())
    .then((data) => {
      if (data.globalFinish) {
        store.setFinish(data.globalFinish);
        document.querySelectorAll(".swatch-btn").forEach((b) =>
          b.classList.toggle("active", b.dataset.finish === data.globalFinish)
        );
      }
      if (data.showBackdrop !== undefined && data.showBackdrop !== store.showBackdrop) {
        window.toggleBackdrop();
      }
      if (data.sequence) {
        data.sequence.forEach((item) => window.addFixture(item.type));
      }
    })
    .catch((err) => {
      console.warn("Default layout rcg.json not found, loading fallback.");
      window.addFixture("4sh");
    });
};
