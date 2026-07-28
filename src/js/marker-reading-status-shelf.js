// Groups AO3 Advanced Marker's per-chapter reading-status buttons (Mark as
// Read, Chapter Read, Mark Do Not Read, Want to Read, + Re-read) into a
// single collapsible "Reading Status" menu on individual work/chapter
// pages, instead of five separate buttons crowding the work's action bar.
//
// The extension appends these as plain, class-less <li> elements at the
// end of ul.work.navigation.actions — AO3 itself never renders an
// unclassed <li> there, so the absence of a class (plus the extension's
// own href="javascript:void(0);" marker) is what identifies them, rather
// than anything extension-specific that could change between versions.
//
// Reuses AO3's own button.collapsed + ul.expandable.secondary.hidden
// accordion markup — the same pattern "Chapter Index" and "Download" use
// right next to it — so it inherits their existing styling with no extra
// CSS. The toggle itself is handled here rather than via AO3's own
// setupAccordion(): that only binds click handlers to elements present
// when it runs once at page load, so it would never see this shelf (or
// the marker extension's own buttons), and it isn't reachable from this
// isolated-world content script anyway.
(function () {
  "use strict";

  const NAV_SELECTOR = "ul.work.navigation.actions";
  const SHELF_CLASS = "ao3am-marker-shelf";
  const SHELF_LABEL = "Reading Status";
  const WATCH_TIMEOUT_MS = 15000;

  function isMarkerItem(li) {
    if (li.tagName !== "LI" || li.className) return false;
    const onlyChild = li.children.length === 1 ? li.children[0] : null;
    return Boolean(
      onlyChild &&
        onlyChild.tagName === "A" &&
        onlyChild.getAttribute("href") === "javascript:void(0);"
    );
  }

  function buildEmptyShelf() {
    const shelf = document.createElement("li");
    shelf.className = SHELF_CLASS;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "collapsed";
    button.textContent = SHELF_LABEL;
    button.setAttribute("aria-expanded", "false");

    const panel = document.createElement("ul");
    panel.className = "expandable secondary hidden";

    button.addEventListener("click", (e) => {
      e.preventDefault();
      const expand = button.classList.contains("collapsed");
      button.classList.toggle("collapsed", !expand);
      button.classList.toggle("expanded", expand);
      panel.classList.toggle("hidden", !expand);
      button.setAttribute("aria-expanded", String(expand));
    });

    shelf.appendChild(button);
    shelf.appendChild(panel);
    return shelf;
  }

  // Idempotent and repeat-safe: sweeps up whatever marker <li>s are
  // currently sitting loose in nav and files them into the shelf, creating
  // the shelf on first use. The extension can add its buttons one at a
  // time rather than all at once, so this has to keep working on repeat
  // calls instead of a single one-shot "found it" check — otherwise only
  // whichever button happened to exist on the very first sweep would ever
  // make it into the shelf.
  function absorbMarkerItems(nav) {
    const markerItems = Array.prototype.filter.call(nav.children, isMarkerItem);
    if (markerItems.length === 0) return;

    let shelf = nav.querySelector(":scope > ." + SHELF_CLASS);
    if (!shelf) {
      shelf = buildEmptyShelf();
      nav.appendChild(shelf);
    }
    const panel = shelf.querySelector("ul.expandable");
    markerItems.forEach((li) => panel.appendChild(li));
  }

  function init() {
    const nav = document.querySelector(NAV_SELECTOR);
    if (!nav) return;

    absorbMarkerItems(nav);

    // The marker extension does its own async setup and may add its
    // buttons after this script already ran, and/or trickle them in one
    // at a time rather than all at once — keep watching and absorbing
    // whatever shows up, but give up eventually if nothing ever does.
    const observer = new MutationObserver(() => absorbMarkerItems(nav));
    observer.observe(nav, { childList: true });
    setTimeout(() => observer.disconnect(), WATCH_TIMEOUT_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
