// ==UserScript==
// @name         Void++
// @namespace    https://github.com/0-V-linuxdo/Void
// @version      [20260819] v1.0.0
// @description  A modification for grok.com
// @author       Prism & Void Contributors
// @environment  Production
// @homepageURL  https://github.com/0-V-linuxdo/Void
// @icon         https://raw.githubusercontent.com/imjustprism/Void/main/assets/logos/app-icon/void-icon-256.png
// @match        *://grok.com/*
// @run-at       document-start
// @noframes
// @grant        none
// @license      GPL-3.0-or-later
// @supportURL   https://github.com/0-V-linuxdo/Void
// @downloadURL  https://raw.githubusercontent.com/0-V-linuxdo/Void/Void%2B%2B/userscript/Void.user.js
// @updateURL    https://raw.githubusercontent.com/0-V-linuxdo/Void/Void%2B%2B/userscript/Void.user.js
// ==/UserScript==

(() => {
  const CSS = `
button[aria-label="Share Project"],
button[aria-label*="Share Project"] {
    display: none !important;
}
div:has(> button[aria-label="Share Project"]),
div:has(> button[aria-label*="Share Project"]) {
    display: none !important;
}
`;
  const style = document.createElement("style");
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);
  console.log("[Void++] NoShareLink active");
})();
