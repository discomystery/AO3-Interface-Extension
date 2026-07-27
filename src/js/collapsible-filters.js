// Adds a collapse/expand toggle to the "Include" / "Exclude" / "More Options"
// sections of the work and bookmark filter sidebars. AO3's own markup has no
// hook for this (unlike the Ratings/Warnings/etc. sub-groups, which AO3
// already makes collapsible via its own JS), so this reproduces the same
// disclosure pattern at the section level. State is remembered per section
// type across every page that shows a filter sidebar.
(function () {
  "use strict";

  const FORM_SELECTOR = "#work-filters.filters, #bookmark-filters.filters";
  const TOGGLE_CLASS = "ao3am-filter-toggle";
  const COLLAPSED_CLASS = "ao3am-filter-collapsed";
  const STORAGE_PREFIX = "ao3am:filter-section:";

  function sectionType(dt) {
    if (dt.classList.contains("include")) return "include";
    if (dt.classList.contains("exclude")) return "exclude";
    if (dt.classList.contains("more")) return "more";
    return null;
  }

  function getOverride(key) {
    try {
      return window.localStorage.getItem(STORAGE_PREFIX + key);
    } catch (err) {
      return null;
    }
  }

  function setOverride(key, value) {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, value);
    } catch (err) {
      // localStorage unavailable — toggle still works for this page view.
    }
  }

  function applyState(dt, button, collapsed) {
    dt.classList.toggle(COLLAPSED_CLASS, collapsed);
    button.setAttribute("aria-expanded", String(!collapsed));
  }

  function addToggle(dt, type) {
    const label = dt.querySelector("h4.heading");
    const title = label ? label.textContent.trim() : "section";

    const button = document.createElement("button");
    button.type = "button";
    button.className = TOGGLE_CLASS;
    button.setAttribute("aria-label", "Toggle " + title + " section");
    dt.appendChild(button);

    const collapsed = getOverride(type) === "collapsed";
    applyState(dt, button, collapsed);

    button.addEventListener("click", () => {
      const next = !dt.classList.contains(COLLAPSED_CLASS);
      applyState(dt, button, next);
      setOverride(type, next ? "collapsed" : "expanded");
    });
  }

  function processForm(form) {
    form.querySelectorAll(":scope > fieldset > dl > dt.heading").forEach((dt) => {
      const type = sectionType(dt);
      if (!type || dt.querySelector("." + TOGGLE_CLASS)) return;
      const dd = dt.nextElementSibling;
      if (!dd || dd.tagName !== "DD") return;
      addToggle(dt, type);
    });
  }

  function init() {
    document.querySelectorAll(FORM_SELECTOR).forEach(processForm);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
