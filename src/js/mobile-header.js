// Wires up the mobile header's icon-based controls (see 70.css for the
// layout those controls drive):
//  - a hamburger toggle that reveals the Fandoms/Browse/Search/About site
//    nav as a dropdown panel
//  - a search-icon toggle that reveals the quick search box in the same
//    panel
//  - the account avatar doubling as the "Hi, username!" dropdown trigger,
//    instead of two separate controls fighting for space
//  - Log Out moved into that same account dropdown, off the icon row
//
// It also enforces "only one thing open at a time" for the whole header:
// opening any of the above, or any of AO3's own dropdowns (Fandoms/
// Browse/Search/About, the account menu, the Post menu), closes whatever
// else was already open first. Without this, e.g. opening the hamburger
// panel and then tapping the avatar left both floating open at once.
(function () {
  "use strict";

  const HEADER_SELECTOR = "#header";
  const NAV_OPEN_CLASS = "ao3am-nav-open";
  const SEARCH_OPEN_CLASS = "ao3am-search-open";
  const LABEL_CLASS = "ao3am-label";
  const OPENER_SELECTOR =
    ".ao3am-nav-toggle, .ao3am-search-toggle, .dropdown > a, .dropdown > .dropdown-toggle";

  function buildToggle(className, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-expanded", "false");
    return button;
  }

  function syncToggleAria(header) {
    const navToggle = header.querySelector(".ao3am-nav-toggle");
    const searchToggle = header.querySelector(".ao3am-search-toggle");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", String(header.classList.contains(NAV_OPEN_CLASS)));
    }
    if (searchToggle) {
      searchToggle.setAttribute(
        "aria-expanded",
        String(header.classList.contains(SEARCH_OPEN_CLASS))
      );
    }
  }

  // Closes every open panel/dropdown in the header except whatever
  // `opener` belongs to (its own dropdown, or itself for the hamburger/
  // search toggles). Passing no opener closes everything.
  //
  // The WTR queue widget (#ao3-wtr-header-li, added by the separate AO3
  // Advanced Marker PRO extension if installed) manages its own open
  // state — including its own outside-click handler — via an inline
  // style alongside the "open" class, so forcibly clearing that class
  // here would desync it from that inline style. It's excluded below.
  function closeEverythingExcept(header, opener) {
    const sitePanel = header.querySelector('nav[aria-label="Site"]');
    const openerInSitePanel = Boolean(opener && sitePanel && sitePanel.contains(opener));

    if (!openerInSitePanel) {
      if (!opener || !opener.classList.contains("ao3am-nav-toggle")) {
        header.classList.remove(NAV_OPEN_CLASS);
      }
      if (!opener || !opener.classList.contains("ao3am-search-toggle")) {
        header.classList.remove(SEARCH_OPEN_CLASS);
      }
    }
    syncToggleAria(header);

    header.querySelectorAll(".dropdown.open").forEach((li) => {
      if (li.id === "ao3-wtr-header-li") return;
      if (!opener || !li.contains(opener)) li.classList.remove("open");
    });

    const active = document.activeElement;
    if (
      active &&
      active !== document.body &&
      header.contains(active) &&
      (!opener || !active.contains(opener)) &&
      (!opener || !opener.contains(active))
    ) {
      active.blur();
    }
  }

  function initPanelToggles(header) {
    const siteNav = header.querySelector('nav[aria-label="Site"] > ul.primary');
    if (!siteNav || header.querySelector(".ao3am-nav-toggle")) return;

    const searchField = siteNav.querySelector(":scope > li.search");

    const navToggle = buildToggle("ao3am-nav-toggle", "Menu");
    const searchToggle = buildToggle("ao3am-search-toggle", "Search");

    header.insertBefore(navToggle, header.firstChild);
    header.appendChild(searchToggle);

    function setOpen(button, openClass) {
      const willOpen = !header.classList.contains(openClass);
      header.classList.toggle(openClass, willOpen);
      syncToggleAria(header);
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

    // Capture phase, so this always runs before the click reaches its
    // target — including before any stopPropagation() above — and before
    // AO3's own dropdown click handling runs, so whichever control is
    // being opened starts from a clean slate.
    document.addEventListener(
      "click",
      (event) => {
        const opener = event.target.closest(OPENER_SELECTOR);
        if (opener && header.contains(opener)) closeEverythingExcept(header, opener);
      },
      true
    );

    document.addEventListener("click", (event) => {
      if (!header.contains(event.target)) closeEverythingExcept(header, null);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeEverythingExcept(header, null);
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
    const accountLi = trigger.closest("li");
    if (accountLi) accountLi.classList.add("ao3am-account-li");

    const avatarClone = avatarImg.cloneNode(true);
    avatarClone.className = "ao3am-avatar-mobile";
    avatarClone.alt = "";
    avatarClone.removeAttribute("width");
    avatarClone.removeAttribute("height");
    avatarClone.setAttribute("aria-hidden", "true");
    trigger.insertBefore(avatarClone, trigger.firstChild);
  }

  function initPostLabel(header) {
    const greeting = header.querySelector("#greeting");
    if (!greeting) return;
    const postLink = greeting.querySelector('ul.user.navigation.actions a[href$="/works/new"]');
    wrapLabel(postLink);
    const postLi = postLink ? postLink.closest("li") : null;
    if (postLi) postLi.classList.add("ao3am-post-li");
  }

  // Moves Log Out from its own top-level control into the account
  // dropdown (as the last item, below My Preferences), matching the rest
  // of that menu's icon+label rows — it already has a mask icon and a
  // red "destructive action" treatment defined for that context in
  // 30.css. Runs unconditionally (not just at mobile widths): it's a DOM
  // move, not a media-query-gated style, so it applies everywhere.
  function moveLogoutIntoAccountMenu(header) {
    const greeting = header.querySelector("#greeting");
    if (!greeting) return;
    const actionsList = greeting.querySelector(":scope > ul.user.navigation.actions");
    if (!actionsList) return;

    let logoutLi = null;
    actionsList.querySelectorAll(":scope > li").forEach((li) => {
      if (logoutLi || li.classList.contains("dropdown")) return;
      if (li.querySelector(":scope > a[href*='/logout']")) logoutLi = li;
    });
    if (!logoutLi) return;

    const accountMenu = actionsList.querySelector(":scope > li.dropdown > ul.menu");
    if (!accountMenu || accountMenu.querySelector("a[href*='/logout']")) return;

    const logoutLink = logoutLi.querySelector("a");
    if (!logoutLink) return;

    const item = document.createElement("li");
    item.appendChild(logoutLink);
    accountMenu.appendChild(item);
    logoutLi.remove();
  }

  function init() {
    const header = document.querySelector(HEADER_SELECTOR);
    if (!header) return;

    moveLogoutIntoAccountMenu(header);
    initPanelToggles(header);
    initAccountTrigger(header);
    initPostLabel(header);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
