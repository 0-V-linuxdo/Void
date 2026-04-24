if (typeof browser === "undefined") {
    var browser = chrome;
}

function patchCsp(csp) {
    const directives = new Map();
    for (const part of csp.split(";")) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const spaceIdx = trimmed.indexOf(" ");
        if (spaceIdx === -1) { directives.set(trimmed, ""); continue; }
        directives.set(trimmed.slice(0, spaceIdx), trimmed.slice(spaceIdx + 1));
    }

    if (directives.has("script-src")) {
        let val = directives.get("script-src");
        if (!val.includes("'unsafe-eval'")) val += " 'unsafe-eval'";
        if (!val.includes("blob:")) val += " blob:";
        directives.set("script-src", val);
    }

    if (directives.has("connect-src") && !directives.get("connect-src").includes("https:")) {
        directives.set("connect-src", directives.get("connect-src") + " https:");
    }

    if (directives.has("img-src")) {
        let val = directives.get("img-src");
        if (!val.includes("blob:")) val += " blob:";
        directives.set("img-src", val);
    }

    return [...directives.entries()].map(([k, v]) => v ? `${k} ${v}` : k).join("; ");
}

const VOID_ALLOWED_TARGET_HOSTS = new Set(["grok.com", "x.ai", "accounts.x.ai"]);
const VOID_SENDER_HOSTS = new Set(["grok.com"]);
const VOID_PARTITION_SITES = ["https://grok.com"];
const VOID_ALLOWED_COOKIE_DOMAINS = ["grok.com", "x.ai"];

function isAllowedHost(hostname, set) {
    return typeof hostname === "string" && set.has(hostname);
}

function isAllowedSender(url) {
    try {
        const { protocol, hostname } = new URL(url);
        if (protocol !== "https:") return false;
        return isAllowedHost(hostname, VOID_SENDER_HOSTS);
    } catch {
        return false;
    }
}

function isAllowedTargetUrl(url) {
    if (typeof url !== "string") return false;
    try {
        const { protocol, hostname } = new URL(url);
        if (protocol !== "https:") return false;
        return isAllowedHost(hostname, VOID_ALLOWED_TARGET_HOSTS);
    } catch {
        return false;
    }
}

function isAllowedCookieDomain(domain) {
    if (typeof domain !== "string" || !domain) return false;
    const bare = domain.replace(/^\./, "");
    return VOID_ALLOWED_COOKIE_DOMAINS.some(h => bare === h || bare.endsWith("." + h));
}

function sanitizeSameSite(v) {
    return v === "no_restriction" || v === "lax" || v === "strict" || v === "unspecified" ? v : undefined;
}

function sanitizePartitionKey(pk) {
    if (!pk || typeof pk !== "object") return undefined;
    const top = pk.topLevelSite;
    if (typeof top !== "string") return undefined;
    if (!VOID_PARTITION_SITES.includes(top)) return undefined;
    return { topLevelSite: top };
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
            const maybe = browser.cookies[method](details, value => done(browser.runtime?.lastError, value));
            if (maybe && typeof maybe.then === "function") maybe.then(v => done(null, v), e => done(e));
        } catch (e) { done(e); }
    });
}

function cookieKey(c) {
    return `${c.domain}|${c.path}|${c.name}|${c.partitionKey?.topLevelSite ?? ""}`;
}

async function listCookiesAllPartitions(url, storeOpt) {
    const queries = [callCookies("getAll", { url, ...storeOpt }).catch(() => [])];
    for (const topLevelSite of VOID_PARTITION_SITES) {
        queries.push(callCookies("getAll", { url, partitionKey: { topLevelSite }, ...storeOpt }).catch(() => []));
    }
    const results = await Promise.all(queries);
    const seen = new Map();
    for (const list of results) for (const c of list) if (!seen.has(cookieKey(c))) seen.set(cookieKey(c), c);
    return [...seen.values()];
}

function buildSetDetails(cookie, url, storeOpt) {
    if (typeof cookie.name !== "string" || typeof cookie.value !== "string") {
        throw new Error("cookie name/value must be strings");
    }
    if (!isAllowedCookieDomain(cookie.domain)) {
        throw new Error(`cookie domain not allowed: ${cookie.domain}`);
    }
    const details = {
        url,
        name: cookie.name,
        value: cookie.value,
        path: typeof cookie.path === "string" ? cookie.path : "/",
        secure: cookie.secure === true,
        httpOnly: cookie.httpOnly === true,
        ...storeOpt,
    };
    const sameSite = sanitizeSameSite(cookie.sameSite);
    if (sameSite) details.sameSite = sameSite;
    if (cookie.hostOnly !== true) details.domain = cookie.domain;
    if (cookie.session !== true && typeof cookie.expirationDate === "number" && Number.isFinite(cookie.expirationDate)) {
        details.expirationDate = cookie.expirationDate;
    }
    const partitionKey = sanitizePartitionKey(cookie.partitionKey);
    if (partitionKey) details.partitionKey = partitionKey;
    return details;
}

async function voidCookieOp(op, payload, storeId) {
    const storeOpt = storeId ? { storeId } : {};
    if (!payload || typeof payload !== "object") throw new Error("invalid payload");
    const url = payload.url;
    if (!isAllowedTargetUrl(url)) throw new Error(`url not allowed: ${url}`);

    if (op === "list") return listCookiesAllPartitions(url, storeOpt);
    if (op === "set") return (await callCookies("set", buildSetDetails(payload, url, storeOpt))) || null;
    if (op === "remove") {
        if (typeof payload.name !== "string") throw new Error("cookie name must be a string");
        const details = { url, name: payload.name, ...storeOpt };
        const partitionKey = sanitizePartitionKey(payload.partitionKey);
        if (partitionKey) details.partitionKey = partitionKey;
        return (await callCookies("remove", details)) || null;
    }
    throw new Error(`unknown op: ${op}`);
}

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
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

const manifestVersion = browser.runtime.getManifest().manifest_version;
if (manifestVersion < 3 && browser.webRequest?.onHeadersReceived) {
    browser.webRequest.onHeadersReceived.addListener(
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
