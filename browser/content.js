if (typeof browser === "undefined") {
    var browser = chrome;
}

window.addEventListener("message", event => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== "voidpp-cookies" || data.direction !== "req") return;

    browser.runtime.sendMessage({ type: "voidpp-cookies", op: data.op, payload: data.payload }, response => {
        window.postMessage({
            source: "voidpp-cookies",
            direction: "res",
            requestId: data.requestId,
            response: response || { ok: false, error: browser.runtime.lastError?.message || "no response" },
        }, window.location.origin);
    });
});
