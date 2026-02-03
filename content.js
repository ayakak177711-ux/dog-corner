const DEFAULTS = {
  enabled: true,
  size: 120,
  opacity: 1.0,
  imageDataUrl: "",
  position: null // { left: number, top: number } を保存
};

const ID = "dog-corner-overlay-root";
const STYLE_ID = "dog-corner-overlay-style";

function injectStyleOnce() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
	#${ID}{
	  position: fixed;
	  z-index: 2147483647;
	  user-select: none;
	  -webkit-user-select: none;
	  touch-action: none;
	}
	#${ID} .dc-wrap{
	  position: relative;
	  display: inline-block;
	}
	#${ID} img{
	  display: block;
	  border-radius: 14px;
	  cursor: grab;
	}
	#${ID}.dragging img{
	  cursor: grabbing;
	}
	#${ID} .dc-close{
	  position: absolute;
	  top: -10px;
	  right: -10px;
	  width: 26px;
	  height: 26px;
	  border-radius: 999px;
	  border: 1px solid rgba(0,0,0,.12);
	  background: rgba(255,255,255,.92);
	  box-shadow: 0 6px 18px rgba(0,0,0,.12);
	  display: grid;
	  place-items: center;
	  font-size: 16px;
	  line-height: 1;
	  cursor: pointer;
	  opacity: 0;
	  transform: scale(.9);
	  transition: opacity .12s ease, transform .12s ease;
	  pointer-events: none; /* hover中だけクリック可にする */
	}
	#${ID}:hover .dc-close{
	  opacity: 1;
	  transform: scale(1);
	  pointer-events: auto;
	}
  `;
  document.documentElement.appendChild(style);
}

function ensureOverlay() {
  let root = document.getElementById(ID);
  if (root) return root;

  injectStyleOnce();

  root = document.createElement("div");
  root.id = ID;

  // 初期位置（positionが無いとき）
  root.style.right = "14px";
  root.style.bottom = "14px";

  const wrap = document.createElement("div");
  wrap.className = "dc-wrap";

  const img = document.createElement("img");
  img.alt = "";
  img.decoding = "async";
  img.loading = "lazy";

  const close = document.createElement("button");
  close.className = "dc-close";
  close.type = "button";
  close.setAttribute("aria-label", "remove image");
  close.textContent = "✕";

  wrap.appendChild(img);
  wrap.appendChild(close);
  root.appendChild(wrap);

  document.documentElement.appendChild(root);
  return root;
}

function setRootPosition(root, position) {
  if (position && Number.isFinite(position.left) && Number.isFinite(position.top)) {
	const rect = root.getBoundingClientRect();
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const margin = 6;

	const safeLeft = clamp(position.left, margin, vw - rect.width - margin);
	const safeTop  = clamp(position.top,  margin, vh - rect.height - margin);

	root.style.left = `${safeLeft}px`;
	root.style.top  = `${safeTop}px`;
	root.style.right = "auto";
	root.style.bottom = "auto";
  } else {
	root.style.left = "auto";
	root.style.top = "auto";
	root.style.right = "14px";
	root.style.bottom = "14px";
  }
}


function applySettings(settings) {
  const root = ensureOverlay();
  const img = root.querySelector("img");

  const { enabled, size, opacity, imageDataUrl, position } = settings;

  const visible = enabled && imageDataUrl;
  root.style.display = visible ? "block" : "none";
  if (!visible) return;

  img.src = imageDataUrl;
  img.style.width = `${size}px`;
  img.style.height = "auto";
  img.style.opacity = String(opacity);

  setRootPosition(root, position);
}

async function savePosition(left, top) {
  await chrome.storage.local.set({ position: { left, top } });
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

function enableDragAndClose() {
  const root = ensureOverlay();
  const img = root.querySelector("img");
  const close = root.querySelector(".dc-close");

  // ✕：画像削除（非表示化）
  close.addEventListener("click", async (e) => {
	e.preventDefault();
	e.stopPropagation();
	await chrome.storage.local.set({ imageDataUrl: "" });
  });

  // ドラッグ（Pointer Events）
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  img.addEventListener("pointerdown", async (e) => {
	// 右クリックなど無視
	if (e.button !== 0) return;

	// 現在位置を left/top に正規化（right/bottom指定の状態でもドラッグ開始できるように）
	const rect = root.getBoundingClientRect();
	startLeft = rect.left;
	startTop = rect.top;

	// left/top 固定に切り替える（ここ重要）
	root.style.left = `${startLeft}px`;
	root.style.top = `${startTop}px`;
	root.style.right = "auto";
	root.style.bottom = "auto";

	dragging = true;
	root.classList.add("dragging");
	startX = e.clientX;
	startY = e.clientY;

	img.setPointerCapture(e.pointerId);
	e.preventDefault();
  });

  img.addEventListener("pointermove", async (e) => {
	if (!dragging) return;

	const dx = e.clientX - startX;
	const dy = e.clientY - startY;

	const rect = root.getBoundingClientRect(); // サイズ取得
	const vw = window.innerWidth;
	const vh = window.innerHeight;

	// 画面内に収める（少し余白）
	const margin = 6;
	const nextLeft = clamp(startLeft + dx, margin, vw - rect.width - margin);
	const nextTop = clamp(startTop + dy, margin, vh - rect.height - margin);

	root.style.left = `${nextLeft}px`;
	root.style.top = `${nextTop}px`;

	e.preventDefault();
  });

  img.addEventListener("pointerup", async (e) => {
	if (!dragging) return;
	dragging = false;
	root.classList.remove("dragging");

	const rect = root.getBoundingClientRect();
	await savePosition(rect.left, rect.top);

	e.preventDefault();
  });

  img.addEventListener("pointercancel", async () => {
	dragging = false;
	root.classList.remove("dragging");
  });
}

async function init() {
  const settings = await chrome.storage.local.get(DEFAULTS);
  applySettings(settings);
  enableDragAndClose();

  chrome.storage.onChanged.addListener((changes, area) => {
	if (area !== "local") return;
	chrome.storage.local.get(DEFAULTS).then(applySettings);
  });
}

init();
