const fileEl = document.getElementById("file");
const previewEl = document.getElementById("preview");
const enabledEl = document.getElementById("enabled");
const sizeEl = document.getElementById("size");
const opacityEl = document.getElementById("opacity");
const sizeVal = document.getElementById("sizeVal");
const opacityVal = document.getElementById("opacityVal");
const clearBtn = document.getElementById("clear");
const resetBtn = document.getElementById("reset");

const DEFAULTS = {
  enabled: true,
  size: 120,     // px
  opacity: 1.0,  // 0.2〜1
  imageDataUrl: "" // data URL
};

function setLabels() {
  sizeVal.textContent = `${sizeEl.value}px`;
  opacityVal.textContent = `${opacityEl.value}`;
}

async function loadSettings() {
  const data = await chrome.storage.local.get(DEFAULTS);
  enabledEl.checked = data.enabled;
  sizeEl.value = data.size;
  opacityEl.value = data.opacity;
  previewEl.src = data.imageDataUrl || "";
  previewEl.style.display = data.imageDataUrl ? "block" : "none";
  setLabels();
}

async function save(partial) {
  await chrome.storage.local.set(partial);
}

fileEl.addEventListener("change", async () => {
  const file = fileEl.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
	const imageDataUrl = String(reader.result || "");
	await save({ imageDataUrl, enabled: true });
	previewEl.src = imageDataUrl;
	previewEl.style.display = "block";
	enabledEl.checked = true;
  };
  reader.readAsDataURL(file);
});

enabledEl.addEventListener("change", () => save({ enabled: enabledEl.checked }));
sizeEl.addEventListener("input", () => { setLabels(); save({ size: Number(sizeEl.value) }); });
opacityEl.addEventListener("input", () => { setLabels(); save({ opacity: Number(opacityEl.value) }); });

clearBtn.addEventListener("click", async () => {
  await save({ imageDataUrl: "" });
  previewEl.src = "";
  previewEl.style.display = "none";
});

resetBtn.addEventListener("click", async () => {
  await chrome.storage.local.set(DEFAULTS);
  await loadSettings();
});

loadSettings();
