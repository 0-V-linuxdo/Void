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

const VOID_ALLOWED_ORIGINS = new Set(["https://grok.com", "https://accounts.x.ai"]);
const VOID_SENDER_HOSTS = ["grok.com", ".grok.com"];

function isAllowedSender(url) {
    try {
        const { hostname } = new URL(url);
        return VOID_SENDER_HOSTS.some(h => hostname === h.replace(/^\./, "") || hostname.endsWith(h));
    } catch {
        return false;
    }
}

function isAllowedTargetUrl(url) {
    return typeof url === "string" && VOID_ALLOWED_ORIGINS.has(url);
}

function callCookies(method, details) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const done = (err, value) => {
            if (settled) return;
            settled = true;
            if (err) reject(err instanceof Error ? err : new Error(String(err?.message ?? err)));
            else resolve(value);
        };
        try {
            const maybe = chrome.cookies[method](details, value => done(chrome.runtime?.lastError, value));
            if (maybe && typeof maybe.then === "function") maybe.then(v => done(null, v), e => done(e));
        } catch (e) { done(e); }
    });
}

async function voidCookieOp(op, payload, storeId) {
    const storeOpt = storeId ? { storeId } : {};
    const url = payload?.url;
    if (!isAllowedTargetUrl(url)) throw new Error(`url not allowed: ${url}`);

    if (op === "list") return (await callCookies("getAll", { url, ...storeOpt })) || [];
    if (op === "set") {
        const { name, value, domain, path, secure, httpOnly, sameSite, expirationDate } = payload;
        return (await callCookies("set", { url, name, value, domain, path, secure, httpOnly, sameSite, expirationDate, ...storeOpt })) || null;
    }
    if (op === "remove") return (await callCookies("remove", { url, name: payload.name, ...storeOpt })) || null;
    throw new Error(`unknown op: ${op}`);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || msg.type !== "void-cookies") return;
    if (!sender.url || !isAllowedSender(sender.url)) {
        sendResponse({ ok: false, error: "forbidden" });
        return;
    }
    const storeId = sender.tab?.cookieStoreId;
    voidCookieOp(msg.op, msg.payload, storeId)
        .then(result => sendResponse({ ok: true, result }))
        .catch(err => sendResponse({ ok: false, error: String(err?.message ?? err) }));
    return true;
});

const manifestVersion = chrome.runtime.getManifest().manifest_version;
if (manifestVersion < 3 && chrome.webRequest?.onHeadersReceived) {
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
        ["blocking", "responseHeaders"],
    );
}
