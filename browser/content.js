if (typeof browser === "undefined") {
    var browser = chrome;
}

window.addEventListener("message", event => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== "void-cookies" || data.direction !== "req") return;

    browser.runtime.sendMessage({ type: "void-cookies", op: data.op, payload: data.payload }, response => {
        window.postMessage({
            source: "void-cookies",
            direction: "res",
            requestId: data.requestId,
            response: response || { ok: false, error: browser.runtime.lastError?.message || "no response" },
        }, window.location.origin);
    });
});
