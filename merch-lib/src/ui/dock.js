import { store } from "../state/store.js";
import { FIXTURE_DATA } from "../data/fixturesData.js";
import { fixtureManager } from "../fixtures/FixtureManager.js";
import { engine } from "../core/engine.js";

export function renderDock() {
  const dock = document.getElementById("dock-list");
  if (!dock) return;

  dock.innerHTML = store.layout.map((item, idx) => {
    const data = FIXTURE_DATA[item.type];
    let style = "";
    if (data.isTurn) style = "border-color: var(--ss); background: rgba(184,192,204,0.1);";
    if (item.type === "empty") style = "opacity: 0.6; font-style: italic;";

    const isSelected = store.selectedFixtureIdx === idx ? "selected" : "";
    const hasMerch = item.merchPathsFront || item.merchPathsBack;
    const merchTag = hasMerch
      ? (item.merchPathsFront?.length && item.merchPathsBack?.length ? "📦📦" : "📦")
      : "";

    return `
      <div class="dock-item ${isSelected}" data-idx="${idx}">
        <span>${data.name} ${merchTag}</span>
        <button class="remove-btn" data-remove="${idx}">✕</button>
      </div>
    `;
  }).join("");

  // Bind Events
  dock.querySelectorAll('.dock-item').forEach(el => {
    el.addEventListener('click', (e) => {
      // Don't select if they clicked remove
      if (e.target.classList.contains('remove-btn')) return;
      const idx = parseInt(el.dataset.idx);
      store.selectFixture(idx);
      
      const item = store.layout[idx];
      if (item && item.model) {
        const targetPos = new THREE.Vector3();
        item.model.getWorldPosition(targetPos);
        engine.focusOn(targetPos);
      }
    });
  });

  dock.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.remove);
      store.removeFixture(idx);
    });
  });
}

export function updateStats() {
  let totalPathLength = 0;
  let count = 0;

  store.layout.forEach(item => {
    const data = FIXTURE_DATA[item.type];
    totalPathLength += data.width;
    if (!data.isTurn && item.type !== "empty") {
      count++;
    }
  });

  const widthEl = document.getElementById("stat-width");
  const countEl = document.getElementById("stat-count");
  if (widthEl) widthEl.textContent = totalPathLength + '"';
  if (countEl) countEl.textContent = count;
}

// Bind to store updates
store.subscribe(() => {
  renderDock();
  updateStats();
});
