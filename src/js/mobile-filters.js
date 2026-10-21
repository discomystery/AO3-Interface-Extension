// Turns the Works/Bookmarks filter sidebar into an on-demand overlay below
// the breakpoint where it can no longer sit beside the listing as a sticky
// column (see 40.css / 60.css).
//
// AO3 emits #work-filters/#bookmark-filters AFTER the entire (often
// multi-page) listing in the document — the desktop layout already works
// around that with position: sticky/absolute, pulling the form out of
// normal flow. Below the breakpoint, 40.css/60.css previously let it fall
// back to its natural flow position instead, which meant it rendered as a
// block stacked under every work/bookmark blurb — reachable only after
// scrolling past the whole listing.
//
// This adds a "Filters" button fixed to the viewport (so it's reachable
// from anywhere on the page, regardless of scroll position) that reveals
// the existing form as a fixed bottom sheet. No part of the form itself
// moves in the DOM; 40.css does the rest with position: fixed once the
// toggle class below is set.
(function () {
  "use strict";

  const FORM_SELECTOR = "#work-filters.filters, #bookmark-filters.filters";
  const OPEN_CLASS = "ao3am-filters-open";

  function buildFab() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ao3am-filters-fab";
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-expanded", "false");
    button.textContent = "Filters";
    return button;
  }

  function buildBackdrop() {
    const div = document.createElement("div");
    div.className = "ao3am-filters-backdrop";
    div.setAttribute("aria-hidden", "true");
    return div;
  }

  function buildCloseButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ao3am-filters-close";
    button.setAttribute("aria-label", "Close filters");
    return button;
  }

  function init() {
    const form = document.querySelector(FORM_SELECTOR);
    if (!form || form.dataset.ao3amFiltersWired) return;
    form.dataset.ao3amFiltersWired = "true";

    const fab = buildFab();
    const backdrop = buildBackdrop();
    const closeButton = buildCloseButton();

    form.insertBefore(closeButton, form.firstChild);

    // Inserted as the form's own siblings, not appended to <body>: #main
    // carries its own position: relative; z-index: 1 (30.css), which traps
    // any fixed-position descendant's z-index inside that low value when
    // compared against true body-level siblings — a backdrop appended
    // straight to <body> would then paint ABOVE this fixed sheet instead
    // of behind it, regardless of either element's own z-index. Sharing
    // the form's actual parent keeps both compared in the same local
    // stacking context as the sheet, so the z-index values on them
    // (40.css) compare correctly against each other.
    form.parentNode.insertBefore(backdrop, form);
    form.parentNode.insertBefore(fab, form);

    function setOpen(open) {
      document.body.classList.toggle(OPEN_CLASS, open);
      fab.setAttribute("aria-expanded", String(open));
      if (open) {
        closeButton.focus();
      } else {
        fab.focus();
      }
    }

    fab.addEventListener("click", () => setOpen(true));
    closeButton.addEventListener("click", () => setOpen(false));
    backdrop.addEventListener("click", () => setOpen(false));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && document.body.classList.contains(OPEN_CLASS)) {
        setOpen(false);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
