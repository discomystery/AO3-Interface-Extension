// Makes the work meta card (rating/warnings/fandom/tags/etc.) on a work's
// own page collapsible. AO3's markup has no hook for this, so this adds a
// toggle button the same way collapsible-filters.js does for the filter
// sidebar. Unlike that script, the default state here isn't fixed — it
// tracks viewport width (collapsed on phones, expanded on desktop) until
// the reader manually overrides it, at which point the override sticks
// across pages via localStorage.
//
// dt.stats/dd.stats (the "Stats:" row) is deliberately left out of the
// collapse: 55.css keeps it visible whether the card is collapsed or not,
// and additionally pins it to the bottom of the viewport on phones — this
// script only needs to leave that pair alone.
(function () {
  "use strict";

  const WRAPPER_SELECTOR =
    "#main.works-show > .work > .wrapper, #main.chapters-show > .work > .wrapper";
  const TOGGLE_CLASS = "ao3am-work-meta-toggle";
  const COLLAPSED_CLASS = "ao3am-work-meta-collapsed";
  const STORAGE_KEY = "ao3am:work-meta-collapsed";
  const MOBILE_QUERY = "(max-width: 48rem)";

  function getOverride() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return null;
    }
  }

  function setOverride(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (err) {
      // localStorage unavailable — toggle still works for this page view.
    }
  }

  function applyState(wrapper, button, collapsed) {
    wrapper.classList.toggle(COLLAPSED_CLASS, collapsed);
    button.setAttribute("aria-expanded", String(!collapsed));
  }

  function processWrapper(wrapper, mql) {
    const meta = wrapper.querySelector(":scope > dl.work.meta");
    if (!meta || wrapper.querySelector("." + TOGGLE_CLASS)) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = TOGGLE_CLASS;
    button.setAttribute("aria-label", "Toggle work details");
    wrapper.insertBefore(button, meta);

    const override = getOverride();
    const collapsed = override ? override === "collapsed" : mql.matches;
    applyState(wrapper, button, collapsed);

    button.addEventListener("click", () => {
      const next = !wrapper.classList.contains(COLLAPSED_CLASS);
      applyState(wrapper, button, next);
      setOverride(next ? "collapsed" : "expanded");
    });
  }

  function init() {
    const wrappers = document.querySelectorAll(WRAPPER_SELECTOR);
    if (!wrappers.length) return;
    const mql = window.matchMedia(MOBILE_QUERY);
    wrappers.forEach((wrapper) => processWrapper(wrapper, mql));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
