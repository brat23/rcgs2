import { store } from "../state/store.js";
import { FIXTURE_DATA } from "../data/fixturesData.js";
import { fixtureManager } from "../fixtures/FixtureManager.js";

export function initSidebar() {
  // Tabs
  document.getElementById("tab-fixtures")?.addEventListener("click", () => switchTab("fixtures"));
  document.getElementById("tab-merch")?.addEventListener("click", () => switchTab("merch"));

  // Placement Toggle
  document.getElementById("place-front")?.addEventListener("click", () => setMerchPlacement("front"));
  document.getElementById("place-back")?.addEventListener("click", () => setMerchPlacement("back"));

  // Finishes
  document.querySelectorAll(".swatch-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const finishKey = btn.dataset.finish;
      store.setFinish(finishKey);
      fixtureManager.updateMaterials();
      
      document.querySelectorAll(".swatch-btn").forEach((b) =>
        b.classList.toggle("active", b.dataset.finish === finishKey)
      );
    });
  });

  // Mobile Toggle
  document.getElementById("lib-toggle")?.addEventListener("click", () => {
    const lib = document.getElementById("library");
    if (window.innerWidth <= 860) lib.classList.toggle("open");
    else lib.classList.toggle("collapsed");
    setTimeout(() => window.dispatchEvent(new Event("resize")), 310);
  });
}

function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".lib-section").forEach((s) => (s.style.display = "none"));

  if (tab === "fixtures") {
    document.getElementById("tab-fixtures").classList.add("active");
    document.getElementById("lib-fixtures").style.display = "block";
  } else {
    document.getElementById("tab-merch").classList.add("active");
    document.getElementById("lib-merch").style.display = "block";
  }
}

function setMerchPlacement(place) {
  store.setMerchPlacement(place);
  document.getElementById("place-front").classList.toggle("active", place === "front");
  document.getElementById("place-back").classList.toggle("active", place === "back");
}

// Global hooks for inline onclick attributes in HTML
window.addFixture = (type) => {
  const entry = store.addFixture(type);
  fixtureManager.loadFixtureModel(entry);
};

window.applyMerch = (path) => {
  if (store.selectedFixtureIdx === -1) {
    alert("Please select a fixture from the sequence list first!");
    return;
  }
  const item = store.layout[store.selectedFixtureIdx];
  const data = FIXTURE_DATA[item.type];
  if (data.isTurn || item.type === "empty") {
    alert("Cannot add merchandise to turns or empty spaces.");
    return;
  }

  const key = store.merchPlacement === "front" ? "merchPathsFront" : "merchPathsBack";
  if (!item[key]) item[key] = [];

  if (path === null) {
    item[key] = [];
  } else {
    if (!item[key].includes(path) && item[key].length < 4) {
      item[key].push(path);
    }
  }
  // Trigger update
  store.notify();
};

window.toggleBackdrop = () => {
  store.setBackdrop(!store.showBackdrop);
  const status = document.getElementById("backdrop-status");
  const checkbox = document.getElementById("backdrop-checkbox");

  if (store.showBackdrop) {
    status.textContent = "ON · Click to toggle";
    if (checkbox) checkbox.checked = true;
  } else {
    status.textContent = "OFF · Click to toggle";
    if (checkbox) checkbox.checked = false;
  }
};
