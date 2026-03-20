if (typeof browser === "undefined") {
    var browser = chrome;
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        window.postMessage({
            type: "void:meta",
            meta: {
                EXTENSION_VERSION: browser.runtime.getManifest().version,
                EXTENSION_BASE_URL: browser.runtime.getURL(""),
            }
        }, window.location.origin);
    },
    { once: true }
);
