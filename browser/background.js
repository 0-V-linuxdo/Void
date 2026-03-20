const VOID_CSP_DOMAINS = [
    "raw.githubusercontent.com",
    "*.github.io",
    "*.githubusercontent.com",
    "*.gitlab.io",
    "*.codeberg.page",
    "cdn.jsdelivr.net",
    "*.jsdelivr.net",
];

function patchCsp(csp) {
    const directives = new Map();
    for (const part of csp.split(";")) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const spaceIdx = trimmed.indexOf(" ");
        if (spaceIdx === -1) { directives.set(trimmed, ""); continue; }
        directives.set(trimmed.slice(0, spaceIdx), trimmed.slice(spaceIdx + 1));
    }

    const domains = VOID_CSP_DOMAINS.join(" ");

    if (directives.has("script-src")) {
        let val = directives.get("script-src");
        if (!val.includes("'unsafe-eval'")) val += " 'unsafe-eval'";
        if (!val.includes("blob:")) val += " blob:";
        val += " " + domains;
        directives.set("script-src", val);
    }

    if (directives.has("connect-src")) {
        directives.set("connect-src", directives.get("connect-src") + " " + domains);
    }

    if (directives.has("style-src")) {
        directives.set("style-src", directives.get("style-src") + " " + domains);
    }

    if (directives.has("img-src")) {
        let val = directives.get("img-src");
        if (!val.includes("blob:")) val += " blob:";
        directives.set("img-src", val);
    }

    return [...directives.entries()].map(([k, v]) => v ? `${k} ${v}` : k).join("; ");
}

chrome.webRequest.onHeadersReceived.addListener(
    ({ responseHeaders }) => {
        if (!responseHeaders) return;

        for (const header of responseHeaders) {
            const name = header.name.toLowerCase();
            if (name === "content-security-policy" || name === "content-security-policy-report-only") {
                header.value = patchCsp(header.value || "");
            }
        }
        return { responseHeaders };
    },
    { urls: ["*://grok.com/*"], types: ["main_frame"] },
    ["blocking", "responseHeaders"]
);
