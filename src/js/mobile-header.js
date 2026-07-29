// Wires up the mobile header's icon-based controls (see 70.css for the
// layout those controls drive):
//  - a hamburger toggle that reveals the Fandoms/Browse/Search/About site
//    nav as a dropdown panel
//  - a search-icon toggle that reveals the quick search box in the same
//    panel
//  - the account avatar doubling as the "Hi, username!" dropdown trigger,
//    instead of two separate controls fighting for space
//
// AO3's own site nav dropdowns (Fandoms/Browse/etc.) already open on tap
// via their native `.open`-class handling — this script only adds the two
// new panel toggles and the label/avatar rewiring layered on top of them.
// Everything here is additive: on desktop widths 70.css keeps these
// elements display:none, and the extra spans/clone this script inserts are
// inert until that breakpoint applies.
(function () {
  "use strict";

  const HEADER_SELECTOR = "#header";
  const NAV_OPEN_CLASS = "ao3am-nav-open";
  const SEARCH_OPEN_CLASS = "ao3am-search-open";
  const LABEL_CLASS = "ao3am-label";

  function buildToggle(className, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-expanded", "false");
    return button;
  }

  function closePanels(header, buttons) {
    header.classList.remove(NAV_OPEN_CLASS, SEARCH_OPEN_CLASS);
    buttons.forEach((button) => button.setAttribute("aria-expanded", "false"));
  }

  function initPanelToggles(header) {
    const siteNav = header.querySelector('nav[aria-label="Site"] > ul.primary');
    if (!siteNav || header.querySelector(".ao3am-nav-toggle")) return;

    const searchField = siteNav.querySelector(":scope > li.search");

    const navToggle = buildToggle("ao3am-nav-toggle", "Menu");
    const searchToggle = buildToggle("ao3am-search-toggle", "Search");
    const buttons = [navToggle, searchToggle];

    header.insertBefore(navToggle, header.firstChild);
    header.appendChild(searchToggle);

    function setOpen(button, openClass) {
      const willOpen = !header.classList.contains(openClass);
      closePanels(header, buttons);
      header.classList.toggle(openClass, willOpen);
      button.setAttribute("aria-expanded", String(willOpen));
      if (willOpen && button === searchToggle && searchField) {
        const input = searchField.querySelector(
          "#site_search, input[type='text'], input[type='search']"
        );
        if (input) input.focus();
      }
    }

    navToggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setOpen(navToggle, NAV_OPEN_CLASS);
    });

    searchToggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setOpen(searchToggle, SEARCH_OPEN_CLASS);
    });

    document.addEventListener("click", (event) => {
      if (!header.contains(event.target)) closePanels(header, buttons);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closePanels(header, buttons);
    });
  }

  // Wraps an anchor's existing text in a span so it can be visually hidden
  // at mobile widths (via clip, in 70.css) while staying in the
  // accessibility tree — unlike display:none, which would strip the
  // control's only accessible name once the label is hidden.
  function wrapLabel(link) {
    if (!link || link.querySelector(":scope > ." + LABEL_CLASS)) return;
    const span = document.createElement("span");
    span.className = LABEL_CLASS;
    while (link.firstChild) span.appendChild(link.firstChild);
    link.appendChild(span);
  }

  function initAccountTrigger(header) {
    const greeting = header.querySelector("#greeting");
    if (!greeting) return;

    const avatarLink = greeting.querySelector("p.icon > a");
    const avatarImg = avatarLink ? avatarLink.querySelector("img") : null;
    if (!avatarLink || !avatarImg) return;

    const href = avatarLink.getAttribute("href");
    const trigger = href
      ? greeting.querySelector(
          'ul.user.navigation.actions > li.dropdown > a[href="' + CSS.escape(href) + '"]'
        )
      : null;
    if (!trigger || trigger.classList.contains("ao3am-account-trigger")) return;

    wrapLabel(trigger);
    trigger.classList.add("ao3am-account-trigger");

    const avatarClone = avatarImg.cloneNode(true);
    avatarClone.className = "ao3am-avatar-mobile";
    avatarClone.alt = "";
    avatarClone.removeAttribute("width");
    avatarClone.removeAttribute("height");
    avatarClone.setAttribute("aria-hidden", "true");
    trigger.insertBefore(avatarClone, trigger.firstChild);
  }

  function initIconLabels(header) {
    const greeting = header.querySelector("#greeting");
    if (!greeting) return;

    const postLink = greeting.querySelector('ul.user.navigation.actions a[href$="/works/new"]');
    const logoutLink = greeting.querySelector(
      'ul.user.navigation.actions > li > a[href*="/logout"]'
    );

    wrapLabel(postLink);
    wrapLabel(logoutLink);
  }

  function init() {
    const header = document.querySelector(HEADER_SELECTOR);
    if (!header) return;

    initPanelToggles(header);
    initAccountTrigger(header);
    initIconLabels(header);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
