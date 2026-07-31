(function () {
  const api = typeof browser !== "undefined" ? browser : chrome;
  const DEFAULT_RAW_CSS_URL =
    "https://raw.githubusercontent.com/discomystery/AO3-Interface-Extension/main/dist/styles.css";
  const STYLE_TAG_ID = "ao3-live-css-override";

  api.storage.local.get(
    { live_css_enabled: false, live_css_repo_url: DEFAULT_RAW_CSS_URL },
    async (items) => {
      if (!items.live_css_enabled) return;

      try {
        const url = `${items.live_css_repo_url}?t=${Date.now()}`;
        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`GitHub responded with ${response.status}`);
        }

        const css = await response.text();

        let styleEl = document.getElementById(STYLE_TAG_ID);
        if (!styleEl) {
          styleEl = document.createElement("style");
          styleEl.id = STYLE_TAG_ID;
          document.head.appendChild(styleEl);
        }
        styleEl.textContent = css;
      } catch (error) {
        console.warn("[AO3 Live CSS] Failed to fetch latest styles from GitHub:", error);
      }
    },
  );
})();
