const api = typeof browser !== "undefined" ? browser : chrome;

const DEFAULT_RAW_CSS_URL =
  "https://raw.githubusercontent.com/discomystery/AO3-Interface-Extension/main/dist/styles.css";

const liveCssEnabledEl = document.getElementById("liveCssEnabled");
const repoUrlEl = document.getElementById("repoUrl");
const statusLineEl = document.getElementById("statusLine");
const bundledVersionEl = document.getElementById("bundledVersion");

function setStatus(message) {
  statusLineEl.textContent = message;
}

function loadSettings() {
  api.storage.local.get(
    { live_css_enabled: false, live_css_repo_url: DEFAULT_RAW_CSS_URL },
    (items) => {
      liveCssEnabledEl.checked = items.live_css_enabled;
      repoUrlEl.value = items.live_css_repo_url;
      setStatus(items.live_css_enabled ? "Live CSS is on — new AO3 page loads will pull from GitHub." : "");
    },
  );

  const manifest = api.runtime.getManifest();
  bundledVersionEl.textContent = manifest.version;
}

liveCssEnabledEl.addEventListener("change", () => {
  const enabled = liveCssEnabledEl.checked;
  api.storage.local.set({ live_css_enabled: enabled }, () => {
    setStatus(enabled ? "Live CSS is on — new AO3 page loads will pull from GitHub." : "Live CSS is off — using the bundled stylesheet.");
  });
});

repoUrlEl.addEventListener("change", () => {
  const url = repoUrlEl.value.trim() || DEFAULT_RAW_CSS_URL;
  repoUrlEl.value = url;
  api.storage.local.set({ live_css_repo_url: url }, () => {
    setStatus("Raw CSS URL updated.");
  });
});

loadSettings();
