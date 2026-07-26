// Collapses blank "spacer" paragraphs that a work uses to double-space its
// prose, but only in chapters where that turns out to be the author's
// consistent formatting choice — not an occasional intentional blank line
// (e.g. a scene break), which is left untouched.
(function () {
  "use strict";

  // "div.userstuff" (not "blockquote.userstuff") specifically targets the
  // chapter body — author's notes render as a <blockquote class="userstuff">
  // and must never be touched by this script.
  const CHAPTER_SELECTOR = "#chapters div.userstuff";
  const HIDDEN_CLASS = "ao3am-hidden-break";
  const TOGGLE_CLASS = "ao3am-linebreak-toggle";
  const STORAGE_PREFIX = "ao3am:linebreaks:";

  // Fraction of paragraph-to-paragraph gaps that must be a lone blank
  // paragraph before we treat double-spacing as the demonstrated pattern.
  const RATIO_THRESHOLD = 0.85;
  // Minimum number of qualifying gaps required before we trust the ratio at
  // all — avoids acting on short chapters/drabbles with too little signal.
  const MIN_SAMPLE_GAPS = 6;

  function isBlankParagraph(p) {
    if (p.querySelector("img, hr, iframe, audio, video, embed")) return false;
    const text = p.textContent.replace(/ /g, " ").trim();
    return text === "";
  }

  // Looks at every gap that follows a non-blank paragraph. A gap filled by
  // exactly one blank paragraph is a "spacer" gap (the double-break pattern);
  // a gap with no blank paragraph is a normal single break; a gap with two or
  // more blank paragraphs in a row is treated as an intentional scene break
  // and is never touched.
  function analyze(paragraphs) {
    let contentGaps = 0;
    let isolatedSpacerGaps = 0;
    const isolatedSpacers = [];

    for (let i = 0; i < paragraphs.length; i++) {
      if (isBlankParagraph(paragraphs[i])) continue;

      const next = paragraphs[i + 1];
      if (!next) continue;

      contentGaps++;

      if (isBlankParagraph(next)) {
        const afterNext = paragraphs[i + 2];
        const isIsolated = !afterNext || !isBlankParagraph(afterNext);
        if (isIsolated) {
          isolatedSpacerGaps++;
          isolatedSpacers.push(next);
        }
      }
    }

    if (contentGaps < MIN_SAMPLE_GAPS || isolatedSpacers.length === 0) {
      return { eligible: false };
    }

    return {
      eligible: true,
      shouldCollapse: isolatedSpacerGaps / contentGaps >= RATIO_THRESHOLD,
      spacers: isolatedSpacers,
    };
  }

  function chapterKey(container, allContainers) {
    const workMatch = location.pathname.match(/\/works\/(\d+)/);
    const workId = workMatch ? workMatch[1] : "unknown";
    const chapterEl = container.closest('[id^="chapter-"]');
    const chapterId = chapterEl
      ? chapterEl.id
      : "idx-" + allContainers.indexOf(container);
    return STORAGE_PREFIX + workId + ":" + chapterId;
  }

  function getOverride(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function setOverride(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      // localStorage unavailable (private mode, quota, etc.) — the toggle
      // still works for the current page view, it just won't persist.
    }
  }

  function ensureStyles() {
    if (document.getElementById("ao3am-linebreak-style")) return;
    const style = document.createElement("style");
    style.id = "ao3am-linebreak-style";
    style.textContent =
      "." + HIDDEN_CLASS + " { display: none !important; }\n" +
      "." + TOGGLE_CLASS + " {\n" +
      "  display: inline-block;\n" +
      "  margin: 0 0 1em;\n" +
      "  font-size: 0.8em;\n" +
      "  opacity: 0.7;\n" +
      "  cursor: pointer;\n" +
      "  background: none;\n" +
      "  border: 1px solid currentColor;\n" +
      "  border-radius: 3px;\n" +
      "  padding: 0.15em 0.6em;\n" +
      "}\n" +
      "." + TOGGLE_CLASS + ":hover { opacity: 1; }";
    document.head.appendChild(style);
  }

  function applyState(spacers, collapsed) {
    spacers.forEach((p) => p.classList.toggle(HIDDEN_CLASS, collapsed));
  }

  function toggleLabel(collapsed) {
    return collapsed
      ? "Line spacing condensed – click to restore original"
      : "Restore condensed line spacing";
  }

  function addToggle(container, spacers, collapsed, key) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = TOGGLE_CLASS;
    button.setAttribute("aria-pressed", String(collapsed));
    button.textContent = toggleLabel(collapsed);

    button.addEventListener("click", () => {
      collapsed = !collapsed;
      applyState(spacers, collapsed);
      setOverride(key, collapsed ? "collapsed" : "expanded");
      button.setAttribute("aria-pressed", String(collapsed));
      button.textContent = toggleLabel(collapsed);
    });

    container.parentNode.insertBefore(button, container);
  }

  function processChapter(container, allContainers) {
    const paragraphs = Array.from(container.children).filter(
      (el) => el.tagName === "P"
    );
    if (paragraphs.length === 0) return;

    const result = analyze(paragraphs);
    if (!result.eligible) return;

    const key = chapterKey(container, allContainers);
    const override = getOverride(key);
    const collapsed =
      override === "collapsed"
        ? true
        : override === "expanded"
        ? false
        : result.shouldCollapse;

    applyState(result.spacers, collapsed);

    // Only surface the manual toggle when it's actionable: either the
    // auto-heuristic collapsed this chapter, or the reader previously set an
    // override. A chapter with a couple of stray blanks that never crossed
    // the threshold gets no UI at all — nothing to see, nothing to undo.
    if (collapsed || override !== null) {
      addToggle(container, result.spacers, collapsed, key);
    }
  }

  function init() {
    const containers = Array.from(document.querySelectorAll(CHAPTER_SELECTOR));
    if (containers.length === 0) return;
    ensureStyles();
    containers.forEach((container) => processChapter(container, containers));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
