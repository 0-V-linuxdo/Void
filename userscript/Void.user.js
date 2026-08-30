// ==UserScript==
// @name         Void++
// @namespace    https://github.com/0-V-linuxdo/Void
// @version      [20260830.22] v1.0.0
// @description  A modification for grok.com
// @author       Prism & Void Contributors
// @environment  Production
// @homepageURL  https://github.com/0-V-linuxdo/Void
// @icon         https://raw.githubusercontent.com/0-V-linuxdo/Void/Void%2B%2B/assets/logos/app-icon/void-icon.svg
// @match        *://grok.com/*
// @match        *://*.grok-sandbox.com/*
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_setClipboard
// @connect      raw.githubusercontent.com
// @connect      *
// @compatible   chrome
// @compatible   firefox
// @compatible   edge
// @compatible   opera
// @license      GPL-3.0-or-later
// @supportURL   https://github.com/0-V-linuxdo/Void
// @downloadURL  https://raw.githubusercontent.com/0-V-linuxdo/Void/Void%2B%2B/userscript/Void.user.js
// @updateURL    https://raw.githubusercontent.com/0-V-linuxdo/Void/Void%2B%2B/userscript/Void.user.js
// ==/UserScript==

/**
 * Void++ [20260830.22] v1.0.0 — A modification for grok.com
 * (c) 2026 Prism & Void Contributors
 * Licensed under GPL-3.0-or-later
 * Source: https://github.com/0-V-linuxdo/Void
 */
(() => {
  var __defProp = Object.defineProperty;
  var __returnValue = (v) => v;
  function __exportSetter(name, newValue) {
    this[name] = __returnValue.bind(null, newValue);
  }
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, {
        get: all[name],
        enumerable: true,
        configurable: true,
        set: __exportSetter.bind(all, name)
      });
  };

  // src/utils/Logger.ts
  var isBrowser = typeof window !== "undefined";
  var CAP_GRADIENT = {
    log: "linear-gradient(135deg,#b4befe,#cba6f7)",
    info: "linear-gradient(135deg,#89b4fa,#74c7ec)",
    warn: "linear-gradient(135deg,#f9e2af,#fab387)",
    error: "linear-gradient(135deg,#f38ba8,#eba0ac)",
    debug: "linear-gradient(135deg,#6c7086,#9399b2)"
  };
  var LEVEL_ANSI = {
    log: "\x1B[32m",
    info: "\x1B[34m",
    warn: "\x1B[33m",
    error: "\x1B[31m",
    debug: "\x1B[90m"
  };
  var CAP = "color:#11111b;font-weight:700;padding:2px 7px;border-radius:7px 0 0 7px;";
  var BODY = "background:#1e1e2e;font-weight:600;padding:2px 8px;border-radius:0 7px 7px 0;";

  class Logger {
    name;
    color;
    constructor(name, color = "#cdd6f4") {
      this.name = name;
      this.color = color;
    }
    _log(level, args) {
      if (isBrowser) {
        const sink = level === "debug" ? console.debug : console.log;
        sink(`%cVoid%c${this.name}%c`, `${CAP}background:${CAP_GRADIENT[level]};`, `${BODY}color:${this.color};`, "", ...args);
        return;
      }
      console[level](`${LEVEL_ANSI[level]}\x1B[1m${this.name}\x1B[0m`, ...args);
    }
    log(...args) {
      this._log("log", args);
    }
    info(...args) {
      this._log("info", args);
    }
    error(...args) {
      this._log("error", args);
    }
    warn(...args) {
      this._log("warn", args);
    }
    debug(...args) {
      this._log("debug", args);
    }
  }

  // src/utils/lazy.ts
  var logger = new Logger("Lazy");
  var unconfigurable = ["arguments", "caller", "prototype"];
  var SYM_LAZY_GET = Symbol.for("void.lazy.get");
  var SYM_LAZY_CACHED = Symbol.for("void.lazy.cached");
  var handler = {};
  for (const method of [
    "apply",
    "construct",
    "defineProperty",
    "deleteProperty",
    "getPrototypeOf",
    "has",
    "isExtensible",
    "preventExtensions",
    "set",
    "setPrototypeOf"
  ]) {
    handler[method] = (target, ...args) => Reflect[method](target[SYM_LAZY_GET]?.() ?? target, ...args);
  }
  handler.ownKeys = (target) => {
    const v = target[SYM_LAZY_GET]?.() ?? target;
    const keys = Reflect.ownKeys(v);
    for (const key of unconfigurable) {
      if (!keys.includes(key))
        keys.push(key);
    }
    return keys;
  };
  handler.getOwnPropertyDescriptor = (target, p) => {
    if (typeof p === "string" && unconfigurable.includes(p))
      return Reflect.getOwnPropertyDescriptor(target, p);
    const resolved = target[SYM_LAZY_GET]?.() ?? target;
    const descriptor = Reflect.getOwnPropertyDescriptor(resolved, p);
    if (descriptor)
      Object.defineProperty(target, p, descriptor);
    return descriptor;
  };
  handler.get = (target, p, receiver) => {
    if (p === SYM_LAZY_CACHED || p === SYM_LAZY_GET)
      return Reflect.get(target, p, receiver);
    const value = target[SYM_LAZY_GET]();
    if (value == null)
      return;
    if (typeof value === "object" || typeof value === "function")
      return Reflect.get(value, p, receiver);
    throw new Error("proxyLazy: factory returned a primitive value");
  };
  var MAX_RETRIES = 50;
  function makeLazy(factory, maxRetries = MAX_RETRIES) {
    let cache;
    let resolved = false;
    let attempts = 0;
    return () => {
      if (!resolved) {
        if (attempts >= maxRetries) {
          if (false) {}
          return cache;
        }
        cache = factory();
        attempts++;
        if (cache != null)
          resolved = true;
      }
      return cache;
    };
  }
  function proxyLazy(factory) {
    const getter = makeLazy(factory);
    const proxyDummy = Object.assign(() => {}, {
      [SYM_LAZY_CACHED]: undefined,
      [SYM_LAZY_GET]() {
        const result = getter();
        proxyDummy[SYM_LAZY_CACHED] = result;
        return result;
      }
    });
    return new Proxy(proxyDummy, handler);
  }

  // src/utils/lazyReact.ts
  var _createElement = null;
  function setCreateElement(fn) {
    _createElement = fn;
  }
  var LAZY_MAX_RETRIES = 200;
  function LazyComponent(name, factory) {
    const resolve = makeLazy(factory, LAZY_MAX_RETRIES);
    const wrapper = (props) => {
      const cached = resolve();
      if (!cached || !_createElement)
        return null;
      return _createElement(cached, props);
    };
    Object.defineProperty(wrapper, "name", { value: name });
    return new Proxy(wrapper, {
      get(target, prop, receiver) {
        const cached = resolve();
        if (cached && Reflect.has(cached, prop))
          return Reflect.get(cached, prop);
        return Reflect.get(target, prop, receiver);
      }
    });
  }

  // src/utils/text.ts
  var CAMEL_BOUNDARY = /([a-z])([A-Z])/g;
  var WORD_SEPARATOR = /[-_]/g;
  var WORD_START = /\b\w/g;
  var REGEXP_SPECIALS = /[.*+?^${}()|[\]\\]/g;
  function humanizeKey(key, acronyms) {
    const title = key.replaceAll(CAMEL_BOUNDARY, "$1 $2").replaceAll(WORD_SEPARATOR, " ").replaceAll(WORD_START, (c) => c.toUpperCase());
    if (!acronyms)
      return title;
    let result = title;
    for (const [from, to] of Object.entries(acronyms)) {
      result = result.replaceAll(new RegExp(`\\b${escapeRegExp(from)}\\b`, "g"), to);
    }
    return result;
  }
  function escapeRegExp(s) {
    return s.replaceAll(REGEXP_SPECIALS, "\\$&");
  }
  function pluralize(count, singular, plural) {
    return `${count} ${count === 1 ? singular : plural ?? singular + "s"}`;
  }
  function escapeHtml(s, quotes = false) {
    const base = s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    return quotes ? base.replaceAll('"', "&quot;") : base;
  }

  // src/turbopack/fnSource.ts
  var fnSourceCache = new WeakMap;
  function getFnSource(fn) {
    let src = fnSourceCache.get(fn);
    if (src === undefined) {
      src = String(fn);
      fnSourceCache.set(fn, src);
    }
    return src;
  }

  // src/turbopack/match.ts
  function matchesPattern(text, pattern) {
    if (typeof pattern === "string")
      return text.includes(pattern);
    pattern.lastIndex = 0;
    return pattern.test(text);
  }
  function matchesAllPatterns(text, patterns) {
    return patterns.every((p) => matchesPattern(text, p));
  }

  // src/utils/patches.ts
  var iToken = "(?:[A-Za-z_$][\\w$]*)";
  function canonicalizeMatch(match) {
    if (typeof match === "string") {
      const canon = match.replaceAll(/#{i18n::([^}]+)}/g, (_, key) => `"${key}"`);
      return canon === match ? match : canon;
    }
    const { source } = match;
    let canonSource = source.replaceAll(/#{i18n::([^}]+)}/g, (_, key) => `"${key.replaceAll(".", "\\.")}"`);
    canonSource = canonSource.replaceAll(/\\jsx\{([^}]*)\}/g, (_, comp) => `\\(0,\\i\\.jsxs?\\)\\(${comp},`);
    canonSource = canonSource.replaceAll(/\\jsx(?![\w{])/g, "\\(0,\\i\\.jsxs?\\)\\(");
    canonSource = canonSource.replaceAll(/\\c\{(\d+)\}/g, (_, n) => `\\(0,\\i\\.c\\)\\(${n}\\)`);
    canonSource = canonSource.replaceAll(/\\c(?![\w{])/g, "\\(0,\\i\\.c\\)\\(\\d+\\)");
    canonSource = canonSource.replaceAll(/(\\*)\\i/g, (_m, leadingEscapes) => leadingEscapes.length % 2 === 0 ? `${leadingEscapes}${iToken}` : `${leadingEscapes}\\i`);
    canonSource = canonSource.replaceAll(/\\e\{(\w+)\}/g, (_, name) => `["']${name}["'],(?:\\d+,|\\(\\)=>${iToken})`);
    if (canonSource === source)
      return match;
    const canonRegex = new RegExp(canonSource, match.flags);
    canonRegex.toString = match.toString.bind(match);
    return canonRegex;
  }
  function canonicalizeReplace(replace, pluginPath) {
    if (typeof replace !== "function")
      return replace.replaceAll("$self", pluginPath);
    return (match, ...groups) => replace(match, ...groups).replaceAll("$self", pluginPath);
  }
  function canonicalizeReplacement(replacement, pluginPath) {
    replacement.match = canonicalizeMatch(replacement.match);
    replacement.replace = canonicalizeReplace(replacement.replace, pluginPath);
  }
  function canonicalizeFind(patch) {
    patch.find = Array.isArray(patch.find) ? patch.find.map((f) => canonicalizeMatch(f)) : canonicalizeMatch(patch.find);
  }

  // src/turbopack/injection.ts
  var exportInjections = [];
  var injectionsById = new Map;
  var injectionProxies = new Map;
  var injectionTargets = new Map;
  var injectionSeamInstalled = false;
  var moduleCache;
  var getRuntimeFactoryRegistry = () => null;
  function setInjectionContext(cache, registry) {
    moduleCache = cache;
    getRuntimeFactoryRegistry = registry;
  }
  function injectExports(find, exports) {
    const injection = { find: canonicalizeMatch(find), exports };
    exportInjections.push(injection);
    injectionsById.clear();
    const registry = getRuntimeFactoryRegistry();
    if (!registry || !moduleCache)
      return;
    for (const [id, factory] of registry) {
      if (!matchesPattern(getFnSource(factory), injection.find))
        continue;
      const cached = moduleCache.get(id);
      if (cached == null)
        continue;
      const ns = injectionTargets.get(id) ?? cached;
      injectionProxies.delete(id);
      injectionTargets.delete(id);
      const injected = resolveInjections(id);
      moduleCache.set(id, injected ? proxyWithInjections(ns, id, injected) : ns);
    }
  }
  function resolveInjections(id) {
    const registry = getRuntimeFactoryRegistry();
    if (!exportInjections.length || !registry)
      return null;
    const cached = injectionsById.get(id);
    if (cached !== undefined)
      return cached;
    const factory = registry.get(id);
    if (!factory)
      return null;
    const source = getFnSource(factory);
    const merged = {};
    let any = false;
    for (const inj of exportInjections) {
      if (!matchesPattern(source, inj.find))
        continue;
      Object.assign(merged, inj.exports);
      any = true;
    }
    const result = any ? merged : null;
    injectionsById.set(id, result);
    return result;
  }
  function proxyWithInjections(ns, id, injected) {
    const cached = injectionProxies.get(id);
    if (cached)
      return cached;
    const proxy = new Proxy(ns, {
      get(target, key, receiver) {
        if (typeof key === "string" && key in injected)
          return injected[key](ns);
        return Reflect.get(target, key, receiver);
      },
      has(target, key) {
        return typeof key === "string" && key in injected || Reflect.has(target, key);
      }
    });
    injectionProxies.set(id, proxy);
    injectionTargets.set(id, ns);
    return proxy;
  }
  function installInjectionSeam(helpers) {
    if (injectionSeamInstalled)
      return;
    const proto = Object.getPrototypeOf(helpers);
    if (!proto || typeof proto.i !== "function")
      return;
    injectionSeamInstalled = true;
    const originalImport = proto.i;
    proto.i = function(id) {
      const ns = originalImport.call(this, id);
      if (ns == null)
        return ns;
      const injected = resolveInjections(id);
      if (!injected)
        return ns;
      const proxy = proxyWithInjections(ns, id, injected);
      if (moduleCache.get(id) === ns)
        moduleCache.set(id, proxy);
      return proxy;
    };
  }

  // src/turbopack/patchReport.ts
  var logger2 = new Logger("TurbopackPatcher", "#e78284");
  var patchResults = [];
  var validateMisses = new Set;
  var patchStats = {
    applied: 0,
    noEffect: 0,
    errors: 0,
    runtimeFallbacks: 0,
    patchedModules: new Set
  };
  var chunkFingerprint = new Set;
  function getChunkFingerprint() {
    return [...chunkFingerprint];
  }
  function isFactoryPending(patch) {
    const registry = getRuntimeFactoryRegistry2();
    if (!registry)
      return false;
    const find = Array.isArray(patch.find) ? patch.find : [patch.find];
    for (const [, factory] of registry) {
      if (matchesAllPatterns(getFnSource(factory), find))
        return true;
    }
    return false;
  }
  function patchReport() {
    const orphaned = [];
    const pending = [];
    for (const p of patches) {
      if (p.all)
        continue;
      const entry = { plugin: p.plugin, find: String(p.find) };
      (isFactoryPending(p) ? pending : orphaned).push(entry);
    }
    return { stats: { ...patchStats, patchedModules: [...patchStats.patchedModules] }, results: patchResults, orphaned, pending };
  }
  function reportOrphanedPatches() {
    const orphaned = patches.filter((p) => !p.all && !isFactoryPending(p));
    const warnOrphaned = orphaned.filter((p) => !p.noWarn);
    if (warnOrphaned.length)
      logger2.warn(`${warnOrphaned.length} patch(es) found no module:`, warnOrphaned.map((p) => `${p.plugin}: ${String(p.find)}`));
    if (!patchStats.applied && (warnOrphaned.length || patchStats.noEffect)) {
      logger2.warn("Zero patches applied this session — grok build likely changed, run the reporter.");
    }
    if (validateMisses.size) {
      logger2.warn(`${validateMisses.size} disabled-plugin patch(es) no longer match:`, [...validateMisses]);
    }
    if (patchStats.noEffect || patchStats.errors) {
      for (const result of patchResults) {
        for (const rep of result.replacements) {
          if (rep.status === "noEffect" && !result.noWarn)
            logger2.debug(`[no effect] ${result.plugin}: ${rep.match}`);
          else if (rep.status === "error")
            logger2.debug(`[error] ${result.plugin}: ${rep.match}`);
        }
      }
    }
    if (false) {}
  }

  // src/turbopack/types.ts
  var SYM_ORIGINAL = Symbol("Void.originalFactory");
  var SYM_PATCHED = Symbol("Void.patched");
  var SYM_PATCHED_BY = Symbol("Void.patchedBy");
  var SYM_PATCHED_CODE = Symbol("Void.patchedCode");

  // src/turbopack/patchTurbopack.ts
  var logger3 = new Logger("TurbopackPatcher", "#e78284");
  var pageWindow = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
  var FACTORY_PROBE_ID = 2147483646;
  var motionSymbol = Symbol.for("motionComponentSymbol");
  var compileCounter = 0;
  var compileFactory = (code, header, sourceUrl) => {
    const key = `__void_eval_${compileCounter++}`;
    const script = document.createElement("script");
    let src = `window["${key}"]=(${code});`;
    if (header)
      src = `${header}
${src}`;
    if (sourceUrl)
      src += `
${sourceUrl}`;
    script.textContent = src;
    try {
      (document.head ?? document.documentElement).appendChild(script);
    } finally {
      script.remove();
    }
    const fn = pageWindow[key];
    pageWindow[key] = undefined;
    if (!fn)
      throw new Error("Factory compilation failed (CSP?)");
    return fn;
  };
  var patches = [];
  var moduleCache2 = new Map;
  var waitForSubscriptions = new Map;
  var originalPush = null;
  var runtimeModuleCache = null;
  var runtimeFactoryRegistry = null;
  var turbopackHelpers = null;
  var _resolveReady;
  var onceReady = new Promise((r) => _resolveReady = r);
  function getModuleCache() {
    return moduleCache2;
  }
  function getRuntimeModuleCache() {
    return runtimeModuleCache;
  }
  var lastSyncRtCount = 0;
  function syncLazyModules() {
    if (!runtimeModuleCache)
      return;
    const keys = Object.keys(runtimeModuleCache);
    if (keys.length === lastSyncRtCount)
      return;
    for (const id of keys) {
      const numId = Number(id);
      const mod = runtimeModuleCache[numId];
      if (mod?.exports == null)
        continue;
      if (!moduleCache2.has(numId))
        notifyModuleLoaded(mod.exports, numId);
    }
    lastSyncRtCount = keys.length;
  }
  function getRuntimeFactoryRegistry2() {
    return runtimeFactoryRegistry;
  }
  function getTurbopackHelpers() {
    return turbopackHelpers;
  }
  setInjectionContext(moduleCache2, getRuntimeFactoryRegistry2);
  function addWaitForSubscription(filter, cb) {
    waitForSubscriptions.set(filter, cb);
  }
  function removeWaitForSubscription(filter) {
    waitForSubscriptions.delete(filter);
  }
  var moduleLoadListeners = new Set;
  function onModuleLoad(cb) {
    moduleLoadListeners.add(cb);
    return () => moduleLoadListeners.delete(cb);
  }
  var badExports = new WeakSet;
  var IGNORED_TYPES = [HTMLElement, ArrayBuffer, MessagePort, Map, Set, WeakMap, WeakSet];
  function shouldIgnoreValue(value) {
    if (value == null)
      return true;
    const t = typeof value;
    if (t !== "object" && t !== "function")
      return true;
    if (value === window || value === document || value === document.documentElement)
      return true;
    try {
      if (value[Symbol.toStringTag] === "DOMTokenList")
        return true;
      if (value[motionSymbol])
        return true;
    } catch {
      return true;
    }
    return IGNORED_TYPES.some((T) => value instanceof T) || ArrayBuffer.isView(value) || typeof WebSocket !== "undefined" && value instanceof WebSocket;
  }
  var warnsSuppressed = false;
  function silenceWarns(fn) {
    if (warnsSuppressed)
      return fn();
    warnsSuppressed = true;
    const orig = console.warn;
    console.warn = (...args) => {
      if (args.some((a) => typeof a === "string" && (a.includes("has been renamed to") || a.includes("silence this warning"))))
        return;
      if (args.length === 1 && args[0] === "")
        return;
      orig.apply(console, args);
    };
    try {
      return fn();
    } finally {
      console.warn = orig;
      warnsSuppressed = false;
    }
  }
  function blacklistBadModules() {
    silenceWarns(() => {
      for (const [, exports] of moduleCache2) {
        if (shouldIgnoreValue(exports)) {
          if (exports != null && (typeof exports === "object" || typeof exports === "function"))
            badExports.add(exports);
          continue;
        }
        if (typeof exports !== "object")
          continue;
        for (const key in exports) {
          try {
            const v = exports[key];
            if (shouldIgnoreValue(v) && v != null && (typeof v === "object" || typeof v === "function"))
              badExports.add(v);
          } catch {}
        }
      }
    });
  }
  function isBlacklisted(value) {
    if (value == null)
      return false;
    const t = typeof value;
    if (t !== "object" && t !== "function")
      return false;
    if (badExports.has(value))
      return true;
    if (shouldIgnoreValue(value)) {
      badExports.add(value);
      return true;
    }
    return false;
  }
  function notifyModuleLoaded(exports, id) {
    if (exports == null || typeof exports.then === "function")
      return;
    const existing = moduleCache2.get(id);
    if (existing === exports || existing != null && existing === injectionProxies.get(id))
      return;
    const injected = resolveInjections(id);
    const value = injected ? proxyWithInjections(exports, id, injected) : exports;
    moduleCache2.set(id, value);
    if (waitForSubscriptions.size) {
      for (const [filter, callback] of waitForSubscriptions) {
        try {
          if (!waitForSubscriptions.has(filter))
            continue;
          if (filter(exports)) {
            waitForSubscriptions.delete(filter);
            callback(exports, id);
          }
        } catch (e) {
          logger3.error("WaitFor listener error:", e);
        }
      }
    }
    if (moduleLoadListeners.size) {
      for (const cb of moduleLoadListeners) {
        try {
          cb();
        } catch (e) {
          logger3.error("Module load listener error:", e);
        }
      }
    }
  }
  function patchFactory(moduleId, factory) {
    if (!patches.length)
      return null;
    const originalCode = getFnSource(factory);
    const codeLen = originalCode.length;
    let code = originalCode;
    const patchedBy = new Set;
    for (let i = 0;i < patches.length; i++) {
      const patch = patches[i];
      if (patch.predicate) {
        try {
          if (!patch.predicate())
            continue;
        } catch (e) {
          logger3.error(`predicate threw for ${patch.plugin}:`, e);
          continue;
        }
      }
      const finds = Array.isArray(patch.find) ? patch.find : [patch.find];
      const maxFindLen = Math.max(0, ...finds.map((f) => typeof f === "string" ? f.length : 0));
      if (maxFindLen > codeLen)
        continue;
      const findStart = 0;
      const findMatches = Array.isArray(patch.find) ? matchesAllPatterns(originalCode, patch.find) : matchesPattern(originalCode, patch.find);
      const findElapsed = 0;
      if (!findMatches)
        continue;
      const replacements = Array.isArray(patch.replacement) ? patch.replacement : [patch.replacement];
      if (patch.validateOnly) {
        for (const replacement of replacements) {
          if (replacement.predicate && !replacement.predicate())
            continue;
          const { match } = replacement;
          const matches = matchesPattern(originalCode, match);
          if (!matches && !patch.noWarn && !replacement.noWarn) {
            validateMisses.add(`${patch.plugin}: ${String(match)}`);
          }
        }
        if (!patch.all)
          patches.splice(i--, 1);
        continue;
      }
      const previousCode = code;
      let allSucceeded = true;
      let groupApplied = 0;
      let groupNoEffect = 0;
      let groupErrors = 0;
      const result = {
        plugin: patch.plugin,
        find: String(patch.find),
        moduleId,
        noWarn: patch.noWarn,
        replacements: []
      };
      for (const replacement of replacements) {
        if (replacement.predicate) {
          try {
            if (!replacement.predicate())
              continue;
          } catch (e) {
            logger3.error(`replacement predicate threw for ${patch.plugin}:`, e);
            continue;
          }
        }
        const lastCode = code;
        try {
          const { match } = replacement;
          const start = 0;
          const newCode = code.replace(match, replacement.replace);
          if (false)
            ;
          if (newCode === code) {
            groupNoEffect++;
            result.replacements.push({ match: String(match), status: "noEffect" });
            if (patch.group) {
              allSucceeded = false;
              break;
            }
            continue;
          }
          code = newCode;
          patchedBy.add(patch.plugin);
          groupApplied++;
          result.replacements.push({ match: String(match), status: "applied" });
        } catch (err) {
          groupErrors++;
          result.replacements.push({ match: String(replacement.match), status: "error" });
          logger3.error(`Error in patch by ${patch.plugin} on module ${moduleId}:`, err);
          code = lastCode;
          if (patch.group) {
            allSucceeded = false;
            break;
          }
        }
      }
      if (patch.group && !allSucceeded) {
        code = previousCode;
        patchedBy.delete(patch.plugin);
        for (const r of result.replacements) {
          if (r.status === "applied")
            r.status = "reverted";
        }
        patchResults.push(result);
        if (!patch.noWarn)
          logger3.warn(`Group patch by ${patch.plugin} failed, reverting`);
        continue;
      }
      patchResults.push(result);
      patchStats.applied += groupApplied;
      patchStats.noEffect += groupNoEffect;
      patchStats.errors += groupErrors;
      if (groupApplied)
        patchStats.patchedModules.add(moduleId);
      if (!patch.all)
        patches.splice(i--, 1);
    }
    if (!patchedBy.size)
      return null;
    return { code, plugins: [...patchedBy] };
  }
  function createLazyFactory(moduleId, patchResult, original) {
    const { code, plugins } = patchResult;
    let compiled = null;
    const lazy = function(helpers, mod, exports) {
      if (!compiled) {
        try {
          compiled = compileFactory(code, `// Turbopack Module ${moduleId} - Patched by ${plugins.join(", ")}`, `//# sourceURL=file:///TurbopackModule${moduleId}`);
        } catch (err) {
          logger3.error(`Failed to compile patched module ${moduleId} (${plugins.join(", ")}), using original:`, err);
          patchStats.errors++;
          compiled = original;
        }
      }
      compiled.call(this, helpers, mod, exports);
    };
    Object.defineProperty(lazy, "name", { value: `VoidPatched_${moduleId}` });
    lazy.toString = () => getFnSource(original);
    lazy[SYM_ORIGINAL] = original;
    lazy[SYM_PATCHED] = true;
    lazy[SYM_PATCHED_BY] = plugins;
    lazy[SYM_PATCHED_CODE] = code;
    return lazy;
  }
  function createFactoryWrapper(moduleId, factory, exec) {
    const wrapped = function(helpers, mod, exports) {
      captureRuntimeState(helpers);
      try {
        exec(this, helpers, mod, exports);
      } finally {
        try {
          const actualId = mod?.id ?? moduleId;
          if (mod?.exports != null)
            notifyModuleLoaded(mod.exports, actualId);
        } catch (e) {
          logger3.error(`Module notification error for ${mod?.id ?? moduleId}:`, e);
        }
        fnSourceCache.delete(factory);
      }
    };
    wrapped.toString = () => getFnSource(factory);
    return wrapped;
  }
  function wrapFactory(moduleId, factory) {
    const patchResult = patchFactory(moduleId, factory);
    const patched = patchResult ? createLazyFactory(moduleId, patchResult, factory) : factory;
    const original = patched[SYM_ORIGINAL] ?? factory;
    const isPatched = !!patched[SYM_PATCHED];
    const wrapped = createFactoryWrapper(moduleId, factory, (ctx, helpers, mod, exports) => {
      try {
        patched.call(ctx, helpers, mod, exports);
      } catch (err) {
        if (!isPatched)
          throw err;
        patchStats.runtimeFallbacks++;
        logger3.error(`Patched module ${mod?.id ?? moduleId} errored, using original:`, err);
        try {
          original.call(ctx, helpers, mod, exports);
        } catch (origErr) {
          logger3.error(`Original module ${mod?.id ?? moduleId} also errored:`, origErr);
          throw origErr;
        }
      }
    });
    wrapped[SYM_ORIGINAL] = original;
    if (isPatched) {
      wrapped[SYM_PATCHED] = true;
      wrapped[SYM_PATCHED_BY] = patched[SYM_PATCHED_BY];
      wrapped[SYM_PATCHED_CODE] = patched[SYM_PATCHED_CODE];
    }
    return wrapped;
  }
  var chunksWithFactories = 0;
  var chunksWithoutFactories = 0;
  function patchChunkEntry(entry) {
    if (typeof entry[0] === "string")
      chunkFingerprint.add(entry[0]);
    let patchedEntry = null;
    const wrappedInChunk = new Map;
    for (let i = 1;i < entry.length; i++) {
      if (typeof entry[i] !== "function")
        continue;
      const prev = entry[i - 1];
      if (typeof prev !== "number")
        continue;
      if (!patchedEntry)
        patchedEntry = [...entry];
      const factory = entry[i];
      const existing = wrappedInChunk.get(factory);
      if (existing) {
        patchedEntry[i] = existing;
      } else {
        const wrapped = wrapFactory(prev, factory);
        wrappedInChunk.set(factory, wrapped);
        patchedEntry[i] = wrapped;
      }
    }
    if (entry.length > 2) {
      if (wrappedInChunk.size)
        chunksWithFactories++;
      else
        chunksWithoutFactories++;
      if (false)
        ;
    }
    return patchedEntry ?? entry;
  }
  function handleChunkPush(...args) {
    for (let i = 0;i < args.length; i++) {
      if (Array.isArray(args[i])) {
        try {
          args[i] = patchChunkEntry(args[i]);
        } catch (e) {
          logger3.error("Failed to patch chunk entry:", e);
        }
      }
    }
    return originalPush(...args);
  }
  function scanCache(cache) {
    let count = 0;
    for (const id in cache) {
      const mod = cache[id];
      if (mod?.exports == null)
        continue;
      const numId = Number(id);
      if (moduleCache2.get(numId) !== mod.exports) {
        notifyModuleLoaded(mod.exports, numId);
        count++;
      }
    }
    return count;
  }
  function rescanRuntimeModules() {
    if (!runtimeModuleCache)
      return;
    const count = scanCache(runtimeModuleCache);
    if (count > 0)
      logger3.info(`Rescan found ${count} new/updated modules`);
  }
  function captureFactoryRegistry() {
    const origMapSet = Map.prototype.set;
    let captured = null;
    Map.prototype.set = function(key, value) {
      if (!captured && key === FACTORY_PROBE_ID && typeof value === "function") {
        captured = this;
      }
      return origMapSet.call(this, key, value);
    };
    try {
      originalPush(["void-factory-probe", FACTORY_PROBE_ID, () => {}]);
    } finally {
      Map.prototype.set = origMapSet;
    }
    const registry = captured;
    registry?.delete(FACTORY_PROBE_ID);
    if (registry) {
      let valid = 0;
      for (const [k, v] of registry) {
        if (typeof k === "number" && typeof v === "function" && ++valid >= 3)
          break;
      }
      if (valid < 3) {
        logger3.debug("Captured Map doesn't look like a factory registry, discarding");
        return null;
      }
    }
    return registry;
  }
  var LOAD_BEARING_HELPERS = ["i", "r", "s", "v", "l", "c", "M"];
  var helperContractChecked = false;
  function checkHelperContract(helpers) {
    helperContractChecked = true;
    const missing = LOAD_BEARING_HELPERS.filter((h) => helpers[h] == null);
    if (missing.length)
      logger3.warn(`Turbopack runtime contract changed, missing helper(s): ${missing.join(", ")} — patching may be degraded.`);
  }
  function captureRuntimeState(helpers) {
    if (!turbopackHelpers)
      turbopackHelpers = helpers;
    if (!helperContractChecked)
      checkHelperContract(helpers);
    installInjectionSeam(helpers);
    if (!runtimeModuleCache && helpers.c) {
      runtimeModuleCache = helpers.c;
      const count = scanCache(runtimeModuleCache);
      if (false)
        ;
    }
    if (!runtimeFactoryRegistry && helpers.M)
      runtimeFactoryRegistry = helpers.M;
  }
  function captureModuleCache(factoryRegistry) {
    const PROBE_ID = FACTORY_PROBE_ID - 1;
    factoryRegistry.set(PROBE_ID, (helpers) => captureRuntimeState(helpers));
    originalPush(["void-cache-probe", { otherChunks: [], runtimeModuleIds: [PROBE_ID] }]);
    queueMicrotask(() => factoryRegistry.delete(PROBE_ID));
  }
  function wrapExistingFactories() {
    runtimeFactoryRegistry = captureFactoryRegistry();
    if (runtimeFactoryRegistry) {
      const registry = runtimeFactoryRegistry;
      const wrapped = new Map;
      const ensureWrapped = (id, factory) => {
        const existing = wrapped.get(factory);
        const w = existing ?? wrapFactory(id, factory);
        if (!existing)
          wrapped.set(factory, w);
        registry.set(id, w);
        return w;
      };
      const origGet = registry.get.bind(registry);
      registry.get = function(id) {
        const factory = origGet(id);
        if (factory == null || factory[SYM_ORIGINAL])
          return factory;
        return ensureWrapped(id, factory);
      };
      for (const [id, factory] of registry) {
        if (factory[SYM_ORIGINAL])
          continue;
        ensureWrapped(id, factory);
      }
    }
    if (!runtimeModuleCache && runtimeFactoryRegistry) {
      captureModuleCache(runtimeFactoryRegistry);
    }
  }
  function adoptTurbopack(tp, drain) {
    originalPush = tp.push.bind(tp);
    tp.push = handleChunkPush;
    drain?.();
    try {
      wrapExistingFactories();
    } catch (e) {
      logger3.error("Failed to wrap existing factories:", e);
    }
  }
  function patchTurbopack() {
    const existingTp = pageWindow.TURBOPACK;
    if (existingTp && !Array.isArray(existingTp) && typeof existingTp.push === "function") {
      adoptTurbopack(existingTp);
      return;
    }
    const queuedChunks = [];
    if (Array.isArray(existingTp))
      queuedChunks.push(...existingTp);
    let currentTurbopack = existingTp ?? [];
    Object.defineProperty(pageWindow, "TURBOPACK", {
      configurable: true,
      get() {
        return currentTurbopack;
      },
      set(newValue) {
        if (newValue && !Array.isArray(newValue) && typeof newValue.push === "function") {
          const tp = newValue;
          adoptTurbopack(tp, () => {
            currentTurbopack = tp;
            for (const chunk of queuedChunks) {
              try {
                handleChunkPush(chunk);
              } catch (e) {
                logger3.error("Failed to process queued chunk:", e);
              }
            }
            queuedChunks.length = 0;
          });
        } else {
          currentTurbopack = newValue;
        }
      }
    });
    if (Array.isArray(currentTurbopack)) {
      const origPush = currentTurbopack.push.bind(currentTurbopack);
      currentTurbopack.push = (...args) => {
        queuedChunks.push(...args);
        return origPush(...args);
      };
    }
  }

  // src/turbopack/turbopack.ts
  var logger4 = new Logger("TurbopackFinder", "#a6d189");
  var zustandStoreCache = new Map;
  var finderRegistry = null;
  function trackFinder(type, args, resolve) {
    finderRegistry?.push({ type, args, resolve });
  }
  function reportFailedFinders() {
    if (!finderRegistry?.length)
      return;
    const failed = [];
    for (const record of finderRegistry) {
      try {
        const value = record.resolve();
        if (value == null || typeof value === "object" && !Object.keys(value).length)
          failed.push(`${record.type}(${record.args.map((a) => JSON.stringify(a)).join(", ")})`);
      } catch (e) {
        logger4.warn("Finder resolution error:", e);
      }
    }
    if (failed.length)
      logger4.debug(`${failed.length} finder(s) resolved to nothing:`, failed);
  }
  function toZustandHookName(name) {
    if (name.startsWith("use"))
      return name;
    return name.endsWith("Store") ? `use${name}` : `use${name}Store`;
  }
  function isZustandStore(val) {
    return typeof val === "function" && typeof val.getState === "function" && typeof val.setState === "function" && typeof val.subscribe === "function";
  }
  var filters = {
    byProps: (...props) => {
      return props.length === 1 ? (m) => m[props[0]] != null : (m) => props.every((p) => m[p] != null);
    },
    byCode: (...code) => {
      return (m) => {
        if (typeof m !== "function")
          return false;
        return matchesAllPatterns(getFnSource(m), code);
      };
    },
    byDisplayName: (name) => {
      return (m) => m?.displayName === name || m?.render?.displayName === name;
    },
    byStoreName: (name) => {
      const hookName = toZustandHookName(name);
      return (m) => {
        if (typeof m !== "object" || m === null)
          return false;
        const hook = m[hookName];
        return typeof hook === "function" && typeof hook.getState === "function";
      };
    },
    componentByCode: (...code) => {
      const byCode = filters.byCode(...code);
      return (m) => {
        if (byCode(m))
          return true;
        if (!m?.$$typeof)
          return false;
        if (m.type)
          return byCode(m.type);
        if (m.render)
          return byCode(m.render);
        return false;
      };
    },
    byClassName: (...classes) => {
      return (m) => {
        if (typeof m !== "object" || m === null)
          return false;
        return classes.every((c) => typeof m[c] === "string");
      };
    }
  };
  function withLazySync(scan, isEmpty) {
    return silenceWarns(() => {
      const result = scan();
      if (!isEmpty(result))
        return result;
      const prevSize = getModuleCache().size;
      syncLazyModules();
      if (getModuleCache().size === prevSize)
        return result;
      return scan();
    });
  }
  var STOP = Symbol("stop");
  function scanExports(exports, visit, topLevelOnly = false) {
    if (exports == null || isBlacklisted(exports))
      return false;
    try {
      if (visit(exports) === STOP)
        return true;
    } catch {}
    if (topLevelOnly || typeof exports !== "object")
      return false;
    for (const key in exports) {
      try {
        const nested = exports[key];
        if (nested == null || isBlacklisted(nested))
          continue;
        if (visit(nested) === STOP)
          return true;
      } catch {}
    }
    return false;
  }
  function forEachModuleValue(visit, topLevelOnly = false) {
    for (const [, exports] of getModuleCache())
      if (scanExports(exports, visit, topLevelOnly))
        return;
  }
  function searchCache(filter, collectAll = false, topLevelOnly = false) {
    return withLazySync(() => scanModuleCache(filter, collectAll, topLevelOnly), (result) => collectAll ? !result.length : !result);
  }
  function scanModuleCache(filter, collectAll, topLevelOnly) {
    if (!collectAll) {
      let match = null;
      forEachModuleValue((value) => {
        if (filter(value)) {
          match = value;
          return STOP;
        }
      }, topLevelOnly);
      return match;
    }
    const results = [];
    const seen = new Set;
    forEachModuleValue((value) => {
      if (filter(value) && !seen.has(value)) {
        seen.add(value);
        results.push(value);
      }
    }, topLevelOnly);
    return results;
  }
  function find(filter) {
    return searchCache(filter);
  }
  function findAll(filter) {
    return searchCache(filter, true);
  }
  function findLazy(filter) {
    const cached = searchCache(filter);
    if (cached)
      return cached;
    trackFinder("find", [String(filter)], () => searchCache(filter));
    return proxyLazy(() => searchCache(filter));
  }
  function makeFinder(name, filterFactory) {
    const finder = (...args) => find(filterFactory(...args));
    const lazy = (...args) => {
      const resolve = () => finder(...args);
      trackFinder(name, args.map(String), resolve);
      return proxyLazy(resolve);
    };
    return [finder, lazy];
  }
  var [findByProps, findByPropsLazy] = makeFinder("findByProps", filters.byProps);
  var [findByCode, findByCodeLazy] = makeFinder("findByCode", filters.byCode);
  var [findByDisplayName, findByDisplayNameLazy] = makeFinder("findByDisplayName", filters.byDisplayName);
  function findComponentByCode(...code) {
    return find(filters.componentByCode(...code));
  }
  function findComponentByCodeLazy(...code) {
    const resolve = () => findComponentByCode(...code);
    trackFinder("findComponentByCode", code.map(String), resolve);
    return LazyComponent("findComponentByCode", resolve);
  }
  function findExportedComponent(...props) {
    return withLazySync(() => scanExportedComponent(props), (result) => !result);
  }
  function scanExportedComponent(props) {
    const cache = getModuleCache();
    for (const [, exports] of cache) {
      if (exports == null || typeof exports !== "object" || isBlacklisted(exports))
        continue;
      for (const prop of props) {
        try {
          const comp = exports[prop];
          if (comp == null || isBlacklisted(comp))
            continue;
          if (typeof comp === "function" || comp?.$$typeof)
            return comp;
        } catch {}
      }
    }
    return null;
  }
  function findExportedComponentLazy(...props) {
    const resolve = () => findExportedComponent(...props);
    trackFinder("findExportedComponent", props, resolve);
    return LazyComponent(props[0], resolve);
  }
  function collectStores() {
    for (const [, exports] of getModuleCache()) {
      if (exports == null || typeof exports !== "object" || isBlacklisted(exports))
        continue;
      for (const key in exports) {
        try {
          if (zustandStoreCache.has(key))
            continue;
          const val = exports[key];
          if (isZustandStore(val))
            zustandStoreCache.set(key, val);
        } catch {}
      }
    }
  }
  function populateStoreCache() {
    withLazySync(collectStores, () => true);
  }
  function findStore(name) {
    const hookName = toZustandHookName(name);
    if (zustandStoreCache.has(hookName))
      return zustandStoreCache.get(hookName);
    if (!zustandStoreCache.size)
      populateStoreCache();
    if (zustandStoreCache.has(hookName))
      return zustandStoreCache.get(hookName);
    const mod = find(filters.byStoreName(name));
    const hook = mod?.[hookName] ?? mod;
    if (!hook || !isZustandStore(hook))
      return;
    zustandStoreCache.set(hookName, hook);
    return hook;
  }
  function findStoreLazy(name) {
    const resolve = () => findStore(name);
    trackFinder("findStore", [name], resolve);
    return proxyLazy(resolve);
  }
  function findByEventName(name) {
    const id = findModuleId(`logEventGlobal)("${name}"`);
    return id == null ? undefined : requireModule(id) ?? undefined;
  }
  function findByEventNameLazy(name) {
    const resolve = () => findByEventName(name);
    trackFinder("findByEventName", [name], resolve);
    return proxyLazy(resolve);
  }
  function getAllStores() {
    if (!zustandStoreCache.size)
      populateStoreCache();
    return new Map(zustandStoreCache);
  }
  function findCssClasses(...classes) {
    const mod = searchCache(filters.byClassName(...classes), false, true);
    if (!mod)
      return {};
    return mapMangledCssClasses(mod, classes);
  }
  function findCssClassesLazy(...classes) {
    const resolve = () => findCssClasses(...classes);
    trackFinder("findCssClasses", classes, resolve);
    return proxyLazy(resolve);
  }
  function mapMangledCssClasses(mod, classes) {
    const result = {};
    for (const name of classes) {
      const regex = new RegExp(`(?:\\b|_)${escapeRegExp(name)}(?:\\b|_)`);
      for (const key in mod) {
        if (typeof mod[key] === "string" && regex.test(mod[key])) {
          result[name] = mod[key];
          break;
        }
      }
      if (!(name in result))
        logger4.warn(`mapMangledCssClasses: class "${name}" not found in module`);
    }
    return result;
  }
  function findBulk(...filterFns) {
    const { length } = filterFns;
    if (length < 2) {
      logger4.warn("findBulk called with fewer than 2 filters, use find instead.");
      return length === 1 ? [find(filterFns[0])] : [];
    }
    const scan = () => {
      const activeFilters = [...filterFns];
      const results2 = new Array(length).fill(null);
      let found2 = 0;
      forEachModuleValue((value) => {
        for (let j = 0;j < length; j++) {
          const filter = activeFilters[j];
          if (!filter)
            continue;
          try {
            if (filter(value)) {
              results2[j] = value;
              activeFilters[j] = undefined;
              if (++found2 === length)
                return STOP;
            }
          } catch {}
        }
      });
      return { results: results2, found: found2 };
    };
    const { results, found } = withLazySync(scan, (r) => r.found < length);
    if (found !== length)
      logger4.warn(`findBulk: got ${length} filters but only found ${found} modules.`);
    return results;
  }
  function forEachMatchingFactory(code, visit) {
    const registry = getRuntimeFactoryRegistry2();
    if (!registry)
      return;
    for (const [id, factory] of registry) {
      if (matchesAllPatterns(getFnSource(factory), code) && visit(id, factory) === STOP)
        return;
    }
  }
  function findModuleFactory(...code) {
    let result = null;
    forEachMatchingFactory(code, (id, factory) => {
      result = [id, factory];
      return STOP;
    });
    return result;
  }
  function findModuleId(...code) {
    return findModuleFactory(...code)?.[0] ?? null;
  }
  function mapMangledModule(code, mappers) {
    const result = {};
    const id = findModuleId(...code);
    if (id == null)
      return result;
    const mod = requireModule(id);
    if (mod == null)
      return result;
    return silenceWarns(() => {
      const mapperEntries = Object.entries(mappers);
      let found = 0;
      outer:
        for (const key in mod) {
          try {
            const member = mod[key];
            for (let i = 0;i < mapperEntries.length; i++) {
              const [name, filter] = mapperEntries[i];
              if (name in result)
                continue;
              if (filter(member)) {
                result[name] = member;
                if (++found === mapperEntries.length)
                  break outer;
                break;
              }
            }
          } catch {}
        }
      return result;
    });
  }
  function mapMangledModuleLazy(code, mappers) {
    const resolve = () => mapMangledModule(code, mappers);
    trackFinder("mapMangledModule", code.map(String), resolve);
    return proxyLazy(resolve);
  }
  var IDENT = "[A-Za-z_$][\\w$]*";
  var DefaultChunkLoadRegex = new RegExp(`Promise\\.all\\(\\[([^\\]]+)\\]\\.map\\(${IDENT}=>${IDENT}\\.l\\(${IDENT}\\)\\)\\)\\.then\\(\\(\\)=>${IDENT}\\((\\d+)\\)\\)`);
  var ChunkPathRegex = /"(static\/chunks\/[^"]+)"/g;
  async function extractAndLoadChunks(code, matcher = DefaultChunkLoadRegex) {
    const factory = findModuleFactory(...code);
    if (!factory) {
      logger4.warn("extractAndLoadChunks: no module factory found for:", code);
      return false;
    }
    const match = getFnSource(factory[1]).match(matcher);
    if (!match) {
      logger4.warn("extractAndLoadChunks: no chunk loading pattern found in factory for:", code);
      return false;
    }
    const [, rawChunkPaths, entryPointId] = match;
    if (entryPointId == null) {
      logger4.warn("extractAndLoadChunks: matcher did not capture entry point ID for:", code);
      return false;
    }
    const helpers = getTurbopackHelpers();
    if (!helpers) {
      logger4.warn("extractAndLoadChunks: Turbopack helpers not available.");
      return false;
    }
    if (rawChunkPaths) {
      const chunkPaths = Array.from(rawChunkPaths.matchAll(ChunkPathRegex), (m) => m[1]);
      if (chunkPaths.length) {
        try {
          await Promise.all(chunkPaths.map((path) => helpers.l(path)));
        } catch (e) {
          logger4.warn("extractAndLoadChunks: chunk loading failed:", e);
          return false;
        }
      }
    }
    const entryPoint = Number(entryPointId);
    try {
      requireModule(entryPoint);
    } catch (e) {
      logger4.warn("extractAndLoadChunks: entry point module failed:", e);
      return false;
    }
    return true;
  }
  function extractAndLoadChunksLazy(code, matcher = DefaultChunkLoadRegex) {
    let cache = null;
    return () => {
      if (cache)
        return cache;
      const promise = extractAndLoadChunks(code, matcher);
      promise.then((ok) => {
        if (!ok)
          cache = null;
      }, () => {
        cache = null;
      });
      cache = promise;
      return promise;
    };
  }
  function search(...code) {
    const results = {};
    forEachMatchingFactory(code, (id, factory) => {
      results[id] = factory;
    });
    return results;
  }
  function requireModule(moduleId) {
    const cache = getModuleCache();
    if (cache.has(moduleId))
      return cache.get(moduleId);
    const helpers = getTurbopackHelpers();
    if (!helpers)
      return null;
    try {
      return helpers.i(moduleId);
    } catch (e) {
      logger4.warn(`Failed to require module ${moduleId}:`, e);
      return null;
    }
  }
  function importModule(moduleId) {
    const helpers = getTurbopackHelpers();
    if (!helpers)
      return Promise.reject(new Error("Turbopack helpers not available"));
    return helpers.A(moduleId);
  }
  function findMatchInExports(exports, filter) {
    return silenceWarns(() => {
      let match = null;
      scanExports(exports, (value) => {
        if (filter(value)) {
          match = value;
          return STOP;
        }
      });
      return match;
    });
  }
  function waitFor(filter, callback, timeout = 0) {
    const cached = searchCache(filter);
    if (cached) {
      callback(cached, -1);
      return () => {};
    }
    let lastMatch = null;
    const wrappedFilter = (exports) => {
      lastMatch = findMatchInExports(exports, filter);
      return lastMatch != null;
    };
    let timeoutId = null;
    const wrappedCallback = (_exports, id) => {
      if (timeoutId)
        clearTimeout(timeoutId);
      removeWaitForSubscription(wrappedFilter);
      try {
        if (lastMatch)
          callback(lastMatch, id);
        lastMatch = null;
      } catch (e) {
        logger4.error("waitFor callback error:", e);
      }
    };
    addWaitForSubscription(wrappedFilter, wrappedCallback);
    const cancel = () => {
      if (timeoutId)
        clearTimeout(timeoutId);
      removeWaitForSubscription(wrappedFilter);
    };
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        cancel();
        if (!searchCache(filter)) {
          logger4.warn(`waitFor timed out after ${timeout}ms:`, filter);
        }
      }, timeout);
    }
    return cancel;
  }

  // src/turbopack/common/react.tsx
  var React;
  var useState;
  var useEffect;
  var useLayoutEffect;
  var useMemo;
  var useRef;
  var useReducer;
  var useCallback;
  var useContext;
  var useId;
  var useTransition;
  var useDeferredValue;
  var useSyncExternalStore;
  var createElement;
  var useReducedMotion;
  waitFor(filters.byProps("useReducedMotion"), (mod) => {
    ({ useReducedMotion } = mod);
  });
  waitFor(filters.byProps("useState", "createElement"), (mod) => {
    const m = mod;
    React = m;
    ({ useState, useEffect, useLayoutEffect, useMemo, useRef, useReducer, useCallback, useContext, useId, useTransition, useDeferredValue, useSyncExternalStore, createElement } = m);
    setCreateElement(m.createElement);
  });
  var Fragment = Symbol.for("react.fragment");

  // src/components/icons.tsx
  var svg = (props, ...children) => /* @__PURE__ */ React.createElement("svg", {
    width: props.width ?? props.size ?? "1em",
    height: props.height ?? props.size ?? "1em",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: props.strokeWidth ?? 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: props.className,
    "aria-hidden": "true"
  }, children);
  var filledSvg = (props, viewBox, ...children) => /* @__PURE__ */ React.createElement("svg", {
    width: props.width ?? props.size ?? "1em",
    height: props.height ?? props.size ?? "1em",
    viewBox,
    fill: "currentColor",
    className: props.className,
    "aria-hidden": "true"
  }, children);
  var BracesIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"
  }));
  var CopyIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("rect", {
    x: "3",
    y: "8",
    width: "13",
    height: "13",
    rx: "4",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M13 2.00004L12.8842 2.00002C12.0666 1.99982 11.5094 1.99968 11.0246 2.09611C9.92585 2.31466 8.95982 2.88816 8.25008 3.69274C7.90896 4.07944 7.62676 4.51983 7.41722 5.00004H9.76392C10.189 4.52493 10.7628 4.18736 11.4147 4.05768C11.6802 4.00488 12.0228 4.00004 13 4.00004H14.6C15.7366 4.00004 16.5289 4.00081 17.1458 4.05121C17.7509 4.10066 18.0986 4.19283 18.362 4.32702C18.9265 4.61464 19.3854 5.07358 19.673 5.63807C19.8072 5.90142 19.8994 6.24911 19.9488 6.85428C19.9992 7.47112 20 8.26343 20 9.40004V11C20 11.9773 19.9952 12.3199 19.9424 12.5853C19.8127 13.2373 19.4748 13.8114 19 14.2361V16.5829C20.4795 15.9374 21.5804 14.602 21.9039 12.9755C22.0004 12.4907 22.0002 11.9334 22 11.1158L22 11V9.40004V9.35725C22 8.27346 22 7.3993 21.9422 6.69141C21.8826 5.96256 21.7568 5.32238 21.455 4.73008C20.9757 3.78927 20.2108 3.02437 19.27 2.545C18.6777 2.24322 18.0375 2.1174 17.3086 2.05785C16.6007 2.00002 15.7266 2.00003 14.6428 2.00004L14.6 2.00004H13Z",
    fill: "currentColor"
  }));
  var ChromiumIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M10.88 21.94 15.46 14"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M21.17 8H12"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M3.95 6.06 8.54 14"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "4"
  }));
  var CircleAlertIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /* @__PURE__ */ React.createElement("line", {
    x1: "12",
    x2: "12",
    y1: "8",
    y2: "12"
  }), /* @__PURE__ */ React.createElement("line", {
    x1: "12",
    x2: "12.01",
    y1: "16",
    y2: "16"
  }));
  var PaletteIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "13.5",
    cy: "6.5",
    r: ".5",
    fill: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "17.5",
    cy: "10.5",
    r: ".5",
    fill: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "6.5",
    cy: "12.5",
    r: ".5",
    fill: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "8.5",
    cy: "7.5",
    r: ".5",
    fill: "currentColor"
  }));
  var TrashIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M3 6h18"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
  }));
  var Trash2Icon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M10 11v6"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M14 11v6"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M3 6h18"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
  }));
  var TestTubeIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M21 7 6.82 21.18a2.83 2.83 0 0 1-3.99-.01a2.83 2.83 0 0 1 0-4L17 3"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m16 2 6 6"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12 16H4"
  }));
  var DownloadIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "7 10 12 15 17 10"
  }), /* @__PURE__ */ React.createElement("line", {
    x1: "12",
    x2: "12",
    y1: "15",
    y2: "3"
  }));
  var UnplugIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "m19 5 3-3"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m2 22 3-3"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M7.5 13.5 10 11"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M10.5 16.5 13 14"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z"
  }));
  var Cross2Icon = (props = {}) => filledSvg(props, "0 0 15 15", /* @__PURE__ */ React.createElement("path", {
    d: "M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z",
    fill: "currentColor",
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
  var PinIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M12 17v5"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"
  }));
  var PinFilledIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M12 17v5"
  }), /* @__PURE__ */ React.createElement("path", {
    fill: "currentColor",
    d: "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"
  }));
  var StarIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
  }));
  var StarFilledIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    fill: "currentColor",
    d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
  }));
  var GhostFilledIcon = (props = {}) => filledSvg(props, "0 0 24 24", /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M12 3C9.86974 3 8.36758 3.44687 7.30331 4.30861C6.24544 5.16518 5.77303 6.31294 5.44931 7.34656C5.34315 7.68552 5.24989 8.01119 5.16061 8.32293C4.67184 10.0297 4.3026 11.3191 2.59045 12.0877L2 12.3528V13C2 13.5638 2.1227 14.0439 2.36548 14.4568C2.59992 14.8555 2.9079 15.1234 3.14945 15.3133C3.24924 15.3917 3.33688 15.4587 3.41432 15.5178L3.41445 15.5179C3.75134 15.7753 3.89523 15.8852 4.00625 16.153C4.02083 16.1882 4.05258 16.3202 4.01681 16.6105C3.98277 16.8867 3.89932 17.2176 3.78078 17.5898C3.67031 17.9367 3.54072 18.2855 3.41195 18.6321L3.38617 18.7015C3.25634 19.0512 3.11722 19.4276 3.03341 19.7437L2.70025 21H7.87689L12 22.0308L16.1231 21H21.3378L20.9591 19.7169C20.8577 19.3732 20.7296 19.016 20.6096 18.6814L20.6 18.6547C20.4736 18.302 20.3539 17.9667 20.2541 17.6336C20.0498 16.9516 19.971 16.4061 20.0567 15.9647C20.0994 15.7444 20.1593 15.7043 20.6831 15.3528L20.697 15.3435C20.9367 15.1826 21.2889 14.9346 21.5621 14.5365C21.8517 14.1145 22 13.6069 22 13V12.3528L21.4095 12.0877C19.6974 11.3191 19.3282 10.0297 18.8394 8.32294L18.8392 8.32236C18.75 8.01083 18.6568 7.68526 18.5507 7.34656C18.227 6.31294 17.7546 5.16518 16.6967 4.30861C15.6324 3.44687 14.1303 3 12 3ZM11 10.625C11 11.7986 10.3284 12.75 9.5 12.75C8.67157 12.75 8 11.7986 8 10.625C8 9.4514 8.67157 8.5 9.5 8.5C10.3284 8.5 11 9.4514 11 10.625ZM14.5 12.75C15.3284 12.75 16 11.7986 16 10.625C16 9.4514 15.3284 8.5 14.5 8.5C13.6716 8.5 13 9.4514 13 10.625C13 11.7986 13.6716 12.75 14.5 12.75Z"
  }));
  var TriangleAlert = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12 9v4"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12 17h.01"
  }));
  var ScalingIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M14 15H9v-5"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M16 3h5v5"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M21 3 9 15"
  }));
  var PencilIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m15 5 4 4"
  }));
  var GlobeIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M2 12h20"
  }));
  var CircleXIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m15 9-6 6"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m9 9 6 6"
  }));
  var CircleCheckIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m9 12 2 2 4-4"
  }));
  var FolderIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
  }));
  var CircleGaugeIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M15.6 2.7a10 10 0 1 0 5.7 5.7"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "2"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M13.4 10.6 19 5"
  }));
  var LoaderCircleIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M21 12a9 9 0 1 1-6.219-8.56"
  }));
  var ChevronsDownUpIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "m7 20 5-5 5 5"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m7 4 5 5 5-5"
  }));
  var RotateCcwIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M3 3v5h5"
  }));
  var AppWindowIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("rect", {
    x: "2",
    y: "4",
    width: "20",
    height: "16",
    rx: "2"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M10 4v4"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M2 8h20"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M6 4v4"
  }));
  var BrushCleaningIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "m16 22-1-4"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M19 13.99a1 1 0 0 0 1-1V12a2 2 0 0 0-2-2h-3a1 1 0 0 1-1-1V4a2 2 0 0 0-4 0v5a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2v.99a1 1 0 0 0 1 1"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M5 14h14l1.973 6.767A1 1 0 0 1 20 22H4a1 1 0 0 1-.973-1.233z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m8 22 1-4"
  }));
  var BlendIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("circle", {
    cx: "9",
    cy: "9",
    r: "7"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "15",
    cy: "15",
    r: "7"
  }));
  var TerminalIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("polyline", {
    points: "4 17 10 11 4 5"
  }), /* @__PURE__ */ React.createElement("line", {
    x1: "12",
    x2: "20",
    y1: "19",
    y2: "19"
  }));
  var MicOffIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("line", {
    x1: "2",
    x2: "22",
    y1: "2",
    y2: "22"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M5 10v2a7 7 0 0 0 12 5"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M15 9.34V5a3 3 0 0 0-5.68-1.33"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M9 9v3a3 3 0 0 0 5.12 2.12"
  }), /* @__PURE__ */ React.createElement("line", {
    x1: "12",
    x2: "12",
    y1: "19",
    y2: "22"
  }));
  var BotOffIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M13.67 8H18a2 2 0 0 1 2 2v4.33"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M2 14h2"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M20 14h2"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M22 22 2 2"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M8 8H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 1.414-.586"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M9 13v2"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M9.67 4H12v2.33"
  }));
  var Link2OffIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M9 17H7A5 5 0 0 1 7 7"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M15 7h2a5 5 0 0 1 4 8"
  }), /* @__PURE__ */ React.createElement("line", {
    x1: "8",
    x2: "12",
    y1: "12",
    y2: "12"
  }), /* @__PURE__ */ React.createElement("line", {
    x1: "2",
    x2: "22",
    y1: "2",
    y2: "22"
  }));
  var UserRoundXIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M2 21a8 8 0 0 1 11.873-7"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "10",
    cy: "8",
    r: "5"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m17 17 5 5"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m22 17-5 5"
  }));
  var CatIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M8 14v.5"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M16 14v.5"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M11.25 16.25h1.5L12 17l-.75-.75Z"
  }));
  var BellIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M10.268 21a2 2 0 0 0 3.464 0"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
  }));
  var EyeOffIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M14.084 14.158a3 3 0 0 1-4.242-4.242"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m2 2 20 20"
  }));
  var UnfoldHorizontalIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M16 12h6"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M8 12H2"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12 2v2"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12 8v2"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12 14v2"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12 20v2"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m19 15 3-3-3-3"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m5 9-3 3 3 3"
  }));
  var FilesIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M20 7h-3a2 2 0 0 1-2-2V2"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8"
  }));
  var ImagesIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M18 22H4a2 2 0 0 1-2-2V6"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "12",
    cy: "8",
    r: "2"
  }), /* @__PURE__ */ React.createElement("rect", {
    width: "16",
    height: "16",
    x: "6",
    y: "2",
    rx: "2"
  }));
  var LinkIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
  }));
  var PanelLeftIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("rect", {
    width: "18",
    height: "18",
    x: "3",
    y: "3",
    rx: "2"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M9 3v18"
  }));
  var ScrollTextIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M15 12h-5"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M15 8h-5"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M19 17V5a2 2 0 0 0-2-2H4"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"
  }));
  var Volume2Icon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M16 9a5 5 0 0 1 0 6"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M19.364 18.364a9 9 0 0 0 0-12.728"
  }));
  var FileDownIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M14 2v4a2 2 0 0 0 2 2h4"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12 18v-6"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m9 15 3 3 3-3"
  }));
  var ChevronLeftIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "m15 18-6-6 6-6"
  }));
  var ChevronRightIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "m9 18 6-6-6-6"
  }));
  var HistoryIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M3 3v5h5"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12 7v5l4 2"
  }));
  var ClockIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "12 6 12 12 16 14"
  }));
  var TextCursorInputIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M12 20h-1a2 2 0 0 1-2-2 2 2 0 0 1-2 2H6"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M6 4h1a2 2 0 0 1 2 2 2 2 0 0 1 2-2h1"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M9 6v12"
  }));
  var LayoutGridIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("rect", {
    width: "7",
    height: "7",
    x: "3",
    y: "3",
    rx: "1"
  }), /* @__PURE__ */ React.createElement("rect", {
    width: "7",
    height: "7",
    x: "14",
    y: "3",
    rx: "1"
  }), /* @__PURE__ */ React.createElement("rect", {
    width: "7",
    height: "7",
    x: "14",
    y: "14",
    rx: "1"
  }), /* @__PURE__ */ React.createElement("rect", {
    width: "7",
    height: "7",
    x: "3",
    y: "14",
    rx: "1"
  }));
  var SparklesIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M20 3v4"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M22 5h-4"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M4 17v2"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M5 18H3"
  }));
  var ShieldOffIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "m2 2 20 20"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M5 5a1 1 0 0 0-1 1v7c0 5 3.5 7.5 7.67 8.94a1 1 0 0 0 .67.01c2.35-.82 4.48-1.97 5.9-3.71"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M9.309 3.652A12.252 12.252 0 0 0 11.24 2.28a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v7a9.784 9.784 0 0 1-.08 1.264"
  }));
  var SettingsIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }));
  var Settings2Icon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M20 7h-9"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M14 17H5"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "17",
    cy: "17",
    r: "3"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "7",
    cy: "7",
    r: "3"
  }));
  var ListFilterIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M3 6h18"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M7 12h10"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M10 18h4"
  }));
  var Minimize2Icon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "m14 10 7-7"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M20 10h-6V4"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m3 21 7-7"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M4 14h6v6"
  }));
  var VoidIcon = (props = {}) => svg({ ...props, strokeWidth: props.strokeWidth ?? 2.15 }, /* @__PURE__ */ React.createElement("path", {
    d: "M2.2 7.4 L8.4 20.2 L13.03 11.30"
  }), /* @__PURE__ */ React.createElement("path", {
    fill: "currentColor",
    stroke: "none",
    d: "M13.985 11.792 L14.045 11.678 L14.104 11.567 L14.163 11.458 L14.222 11.352 L14.280 11.249 L14.338 11.148 L14.395 11.049 L14.452 10.953 L14.508 10.859 L14.563 10.768 L14.618 10.679 L14.673 10.592 L14.727 10.508 L14.781 10.426 L14.834 10.347 L14.887 10.270 L14.939 10.195 L14.992 10.122 L15.044 10.052 L15.095 9.984 L15.147 9.918 L15.198 9.855 L15.249 9.794 L15.300 9.735 L15.351 9.678 L15.402 9.623 L15.452 9.571 L15.503 9.521 L15.554 9.473 L15.606 9.427 L15.657 9.384 L15.709 9.342 L15.760 9.303 L15.813 9.267 L15.865 9.232 L15.918 9.200 L15.972 9.170 L16.026 9.142 L16.081 9.117 L16.136 9.094 L16.191 9.074 L16.248 9.056 L16.305 9.041 L16.363 9.028 L16.421 9.018 L16.480 9.011 L16.540 9.006 L16.600 9.005 L23.700 9.005 L23.700 7.555 L16.600 7.555 L16.494 7.556 L16.388 7.560 L16.282 7.566 L16.177 7.574 L16.071 7.585 L15.966 7.598 L15.860 7.615 L15.755 7.634 L15.650 7.655 L15.545 7.680 L15.440 7.707 L15.336 7.737 L15.231 7.771 L15.127 7.807 L15.024 7.846 L14.921 7.888 L14.818 7.933 L14.716 7.981 L14.614 8.032 L14.513 8.086 L14.413 8.144 L14.313 8.204 L14.214 8.267 L14.116 8.334 L14.018 8.403 L13.922 8.475 L13.826 8.550 L13.731 8.629 L13.638 8.710 L13.545 8.794 L13.453 8.882 L13.363 8.972 L13.273 9.065 L13.185 9.161 L13.098 9.260 L13.012 9.361 L12.927 9.466 L12.844 9.573 L12.762 9.684 L12.681 9.797 L12.601 9.913 L12.522 10.031 L12.445 10.153 L12.369 10.277 L12.294 10.404 L12.221 10.533 L12.149 10.666 L12.077 10.800 Z"
  }), /* @__PURE__ */ React.createElement("g", {
    fill: "currentColor",
    stroke: "none"
  }, /* @__PURE__ */ React.createElement("rect", {
    x: "16.775",
    y: "5.78",
    width: "1.45",
    height: "5.0"
  }), /* @__PURE__ */ React.createElement("rect", {
    x: "20.475",
    y: "5.78",
    width: "1.45",
    height: "5.0"
  })));

  // src/utils/constants.ts
  var Devs = Object.freeze({
    Prism: "Prism",
    adryd: "adryd",
    p: "0-V"
  });

  // src/utils/css.ts
  var logger5 = new Logger("Styles", "#a6d189");
  var styleRegistry = new Map;
  var activeStyles = new Map;
  var container = null;
  var pendingStyles = [];
  function getContainer() {
    if (container?.isConnected)
      return container;
    if (!document.head)
      return null;
    const wasDisconnected = container != null;
    container = document.createElement("void-styles");
    document.head.appendChild(container);
    if (wasDisconnected) {
      for (const [name, el] of activeStyles) {
        if (!el.isConnected) {
          const css = styleRegistry.get(name);
          if (css) {
            const fresh = document.createElement("style");
            fresh.dataset.void = name;
            fresh.textContent = css;
            fresh.disabled = el.disabled;
            container.appendChild(fresh);
            activeStyles.set(name, fresh);
          }
        }
      }
    }
    return container;
  }
  function flushPending() {
    const root = getContainer();
    if (!root)
      return;
    for (const [name, css] of pendingStyles) {
      inject(root, name, css);
    }
    pendingStyles = [];
  }
  function inject(root, name, css) {
    const existing = activeStyles.get(name);
    if (existing) {
      if (existing.textContent !== css)
        existing.textContent = css;
      return;
    }
    const el = document.createElement("style");
    el.dataset.void = name;
    el.textContent = css;
    root.appendChild(el);
    activeStyles.set(name, el);
  }
  function registerStyle(name, css) {
    styleRegistry.set(name, css);
    const root = getContainer();
    if (root) {
      inject(root, name, css);
    } else {
      pendingStyles.push([name, css]);
      if (pendingStyles.length === 1) {
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", flushPending, { once: true });
        } else {
          flushPending();
        }
      }
    }
  }
  function enableStyle(name) {
    const existing = activeStyles.get(name);
    if (existing) {
      if (existing.disabled) {
        existing.disabled = false;
        return true;
      }
      return false;
    }
    const css = styleRegistry.get(name);
    if (!css) {
      logger5.warn(`Style "${name}" not registered.`);
      return false;
    }
    const root = getContainer();
    if (!root)
      return false;
    inject(root, name, css);
    return true;
  }
  function disableStyle(name) {
    const el = activeStyles.get(name);
    if (!el)
      return false;
    el.disabled = true;
    return true;
  }
  function unregisterStyle(name) {
    activeStyles.get(name)?.remove();
    activeStyles.delete(name);
    styleRegistry.delete(name);
  }
  var classNameFactory = (prefix = "") => (...args) => {
    if (args.length === 1 && typeof args[0] === "string")
      return prefix + args[0];
    const classNames = new Set;
    for (const arg of args) {
      if (typeof arg === "string")
        classNames.add(arg);
      else if (Array.isArray(arg)) {
        for (const name of arg)
          classNames.add(name);
      } else if (arg && typeof arg === "object") {
        for (const [name, value] of Object.entries(arg)) {
          if (value)
            classNames.add(name);
        }
      }
    }
    return Array.from(classNames, (name) => prefix + name).join(" ");
  };
  function classes(...names) {
    return names.filter(Boolean).join(" ");
  }

  // src/utils/types.ts
  function definePlugin(p) {
    return p;
  }
  var StartAt;
  ((StartAt2) => {
    StartAt2["Init"] = "Init";
    StartAt2["DOMContentLoaded"] = "DOMContentLoaded";
    StartAt2["TurbopackReady"] = "TurbopackReady";
  })(StartAt ||= {});
  var OptionType;
  ((OptionType2) => {
    OptionType2[OptionType2["STRING"] = 0] = "STRING";
    OptionType2[OptionType2["NUMBER"] = 1] = "NUMBER";
    OptionType2[OptionType2["BIGINT"] = 2] = "BIGINT";
    OptionType2[OptionType2["BOOLEAN"] = 3] = "BOOLEAN";
    OptionType2[OptionType2["SELECT"] = 4] = "SELECT";
    OptionType2[OptionType2["SLIDER"] = 5] = "SLIDER";
    OptionType2[OptionType2["COMPONENT"] = 6] = "COMPONENT";
    OptionType2[OptionType2["CUSTOM"] = 7] = "CUSTOM";
  })(OptionType ||= {});

  // src/plugins/themedScrollbar/index.ts
  var STYLE_NAME = "themedScrollbar";
  var FRAME_STYLE_ID = "void-themed-scrollbar";
  var MSG = "void-themed-scrollbar";
  var MSG_HELLO = "void-themed-scrollbar-hello";
  var SCROLLER = '[class*="pane-card"] :is([class*="overflow-auto"],[class*="overflow-y-auto"],[class*="overflow-scroll"],[class*="overflow-y-scroll"])';
  var IFRAME_SEL = 'iframe[title="Preview"], [class*="pane-card"] iframe';
  var THUMB = "hsl(var(--border-l2))";
  var THUMB_HOVER = "hsl(var(--fg-tertiary))";
  var TRACK = "hsl(var(--surface-l1))";
  var CSS = `
${SCROLLER} {
    scrollbar-width: thin !important;
    scrollbar-color: ${THUMB} ${TRACK} !important;
}

${SCROLLER}::-webkit-scrollbar {
    width: 0.5rem !important;
    height: 0.5rem !important;
}

${SCROLLER}::-webkit-scrollbar-track,
${SCROLLER}::-webkit-scrollbar-corner {
    background: ${TRACK} !important;
}

${SCROLLER}::-webkit-scrollbar-thumb {
    background-color: ${THUMB} !important;
    background-clip: padding-box !important;
    border: 0.125rem solid transparent !important;
    border-radius: 999px !important;
}

${SCROLLER}::-webkit-scrollbar-thumb:hover {
    background-color: ${THUMB_HOVER} !important;
}
`;
  var domObs = null;
  var themeObs = null;
  var hooked = new WeakSet;
  function isGrokPreviewFrame() {
    const host = location.hostname;
    return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
  }
  function isDark() {
    const html = document.documentElement;
    const tokens = `${html.className} ${document.body?.className ?? ""} ${html.getAttribute("data-theme") ?? ""} ${html.getAttribute("data-color-scheme") ?? ""}`.toLowerCase();
    return html.classList.contains("dark") || html.getAttribute("data-theme") === "dark" || /(^|[\s_-])(dark|night)([\s_-]|$)/.test(tokens);
  }
  function frameCss(dark) {
    const thumb = dark ? "#4a4a52" : "#c4c4cc";
    const track = dark ? "#141416" : "#f4f4f5";
    const hover = dark ? "#9a9aa3" : "#8a8a94";
    return `html,body{scrollbar-width:thin!important;scrollbar-color:${thumb} ${track}!important}` + "html::-webkit-scrollbar,body::-webkit-scrollbar{width:.5rem!important;height:.5rem!important}" + `html::-webkit-scrollbar-track,body::-webkit-scrollbar-track,html::-webkit-scrollbar-corner,body::-webkit-scrollbar-corner{background:${track}!important}` + `html::-webkit-scrollbar-thumb,body::-webkit-scrollbar-thumb{background-color:${thumb}!important;background-clip:padding-box!important;border:.125rem solid transparent!important;border-radius:999px!important}` + `html::-webkit-scrollbar-thumb:hover,body::-webkit-scrollbar-thumb:hover{background-color:${hover}!important}`;
  }
  function applyToDocument(doc, dark) {
    let el = doc.getElementById(FRAME_STYLE_ID);
    if (!el) {
      el = doc.createElement("style");
      el.id = FRAME_STYLE_ID;
      (doc.head ?? doc.documentElement).appendChild(el);
    }
    el.textContent = frameCss(dark);
  }
  function bootstrapPreviewFrame() {
    applyToDocument(document, matchMedia("(prefers-color-scheme: dark)").matches);
    window.addEventListener("message", onFrameMessage);
    try {
      window.parent.postMessage({ type: MSG_HELLO }, "*");
    } catch {}
  }
  function onFrameMessage(event) {
    const { data } = event;
    if (!data || data.type !== MSG)
      return;
    applyToDocument(document, data.dark === true);
  }
  function paintIframe(iframe) {
    const dark = isDark();
    try {
      const doc = iframe.contentDocument;
      if (doc)
        applyToDocument(doc, dark);
    } catch {}
    try {
      iframe.contentWindow?.postMessage({ type: MSG, dark }, "*");
    } catch {}
  }
  function hookIframe(iframe) {
    paintIframe(iframe);
    if (hooked.has(iframe))
      return;
    hooked.add(iframe);
    iframe.addEventListener("load", () => paintIframe(iframe));
  }
  function scanIframes() {
    document.querySelectorAll(IFRAME_SEL).forEach(hookIframe);
  }
  function onParentMessage(event) {
    const { data } = event;
    if (!data || data.type !== MSG_HELLO)
      return;
    const src = event.source;
    if (!src)
      return;
    try {
      src.postMessage({ type: MSG, dark: isDark() }, event.origin === "null" ? "*" : event.origin);
    } catch {
      src.postMessage({ type: MSG, dark: isDark() }, "*");
    }
  }
  function startParent() {
    registerStyle(STYLE_NAME, CSS);
    scanIframes();
    window.addEventListener("message", onParentMessage);
    domObs = new MutationObserver(scanIframes);
    domObs.observe(document.documentElement, { childList: true, subtree: true });
    themeObs = new MutationObserver(scanIframes);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "data-color-scheme"] });
  }
  function stopParent() {
    unregisterStyle(STYLE_NAME);
    window.removeEventListener("message", onParentMessage);
    domObs?.disconnect();
    themeObs?.disconnect();
    domObs = null;
    themeObs = null;
  }
  var themedScrollbar_default = definePlugin({
    name: "ThemedScrollbar",
    icon: ScrollTextIcon,
    description: "Makes the project pane scrollbar follow Grok's dark and light theme.",
    authors: [Devs.p],
    tags: ["ui"],
    enabledByDefault: true,
    start() {
      startParent();
    },
    stop() {
      stopParent();
    }
  });

  // src/Void.ts
  var exports_Void = {};
  __export(exports_Void, {
    ChunkPathRegex: () => ChunkPathRegex,
    DefaultChunkLoadRegex: () => DefaultChunkLoadRegex,
    Devs: () => Devs,
    ErrorBoundary: () => ErrorBoundary,
    Logger: () => Logger,
    NoticeType: () => NoticeType,
    OptionType: () => OptionType,
    PlainSettings: () => PlainSettings,
    Settings: () => Settings,
    SettingsStore: () => SettingsStore3,
    StartAt: () => StartAt,
    ToastType: () => ToastType,
    addChatBarButton: () => addChatBarButton,
    addContextMenuItem: () => addContextMenuItem,
    addLocalTheme: () => addLocalTheme,
    addPatch: () => addPatch,
    addTheme: () => addTheme,
    clamp: () => clamp,
    classNameFactory: () => classNameFactory,
    classes: () => classes,
    closeAllModals: () => closeAllModals,
    closeModal: () => closeModal,
    closeNotice: () => closeNotice,
    common: () => exports_common,
    copyToClipboard: () => copyToClipboard,
    createExternalStore: () => createExternalStore,
    debounce: () => debounce,
    definePlugin: () => definePlugin,
    definePluginSettings: () => definePluginSettings,
    disableStyle: () => disableStyle,
    disableTheme: () => disableTheme,
    dismissToast: () => dismissToast,
    dispatch: () => dispatch,
    enableStyle: () => enableStyle,
    enableTheme: () => enableTheme,
    errorMessage: () => errorMessage,
    escapeHtml: () => escapeHtml,
    escapeRegExp: () => escapeRegExp,
    extractAndLoadChunks: () => extractAndLoadChunks,
    extractAndLoadChunksLazy: () => extractAndLoadChunksLazy,
    fetchExternal: () => fetchExternal,
    filters: () => filters,
    find: () => find,
    findAll: () => findAll,
    findBulk: () => findBulk,
    findByCode: () => findByCode,
    findByCodeLazy: () => findByCodeLazy,
    findByDisplayName: () => findByDisplayName,
    findByDisplayNameLazy: () => findByDisplayNameLazy,
    findByEventName: () => findByEventName,
    findByEventNameLazy: () => findByEventNameLazy,
    findByProps: () => findByProps,
    findByPropsLazy: () => findByPropsLazy,
    findComponentByCode: () => findComponentByCode,
    findComponentByCodeLazy: () => findComponentByCodeLazy,
    findCssClasses: () => findCssClasses,
    findCssClassesLazy: () => findCssClassesLazy,
    findExportedComponent: () => findExportedComponent,
    findExportedComponentLazy: () => findExportedComponentLazy,
    findLazy: () => findLazy,
    findModuleFactory: () => findModuleFactory,
    findModuleId: () => findModuleId,
    findStore: () => findStore,
    findStoreLazy: () => findStoreLazy,
    fnSourceCache: () => fnSourceCache,
    formatCountdown: () => formatCountdown,
    formatDuration: () => formatDuration,
    getAllStores: () => getAllStores,
    getFiber: () => getFiber,
    getFnSource: () => getFnSource,
    getModuleCache: () => getModuleCache,
    getReactRoot: () => getReactRoot,
    getRuntimeFactoryRegistry: () => getRuntimeFactoryRegistry2,
    getRuntimeModuleCache: () => getRuntimeModuleCache,
    getThemes: () => getThemes,
    getTurbopackHelpers: () => getTurbopackHelpers,
    humanizeKey: () => humanizeKey,
    importModule: () => importModule,
    init: () => init,
    initSettings: () => initSettings,
    injectExports: () => injectExports,
    isBlacklisted: () => isBlacklisted,
    isNonNullish: () => isNonNullish,
    isObject: () => isObject,
    isOnlineThemesEnabled: () => isOnlineThemesEnabled,
    isPluginEnabled: () => isPluginEnabled,
    isThemesEnabled: () => isThemesEnabled,
    isTruthy: () => isTruthy,
    isZustandStore: () => isZustandStore,
    makeLazy: () => makeLazy,
    mapGetOrCreate: () => mapGetOrCreate,
    mapMangledCssClasses: () => mapMangledCssClasses,
    mapMangledModule: () => mapMangledModule,
    mapMangledModuleLazy: () => mapMangledModuleLazy,
    matchesAllPatterns: () => matchesAllPatterns,
    matchesPattern: () => matchesPattern,
    mergeDefaults: () => mergeDefaults,
    migratePluginSetting: () => migratePluginSetting,
    migratePluginSettings: () => migratePluginSettings,
    migrateSettingsToPlugin: () => migrateSettingsToPlugin,
    onModuleLoad: () => onModuleLoad,
    onceReady: () => onceReady,
    onlyOnce: () => onlyOnce,
    openModal: () => openModal,
    patchReport: () => patchReport,
    patchResults: () => patchResults,
    patchStats: () => patchStats,
    patches: () => patches,
    plugins: () => plugins,
    pluralize: () => pluralize,
    proxyLazy: () => proxyLazy,
    registerPlugin: () => registerPlugin,
    registerStyle: () => registerStyle,
    removeChatBarButton: () => removeChatBarButton,
    removeContextMenuItem: () => removeContextMenuItem,
    removeTheme: () => removeTheme,
    reportFailedFinders: () => reportFailedFinders,
    requireModule: () => requireModule,
    sanitizeFilename: () => sanitizeFilename,
    search: () => search,
    sendBrowserNotification: () => sendBrowserNotification,
    setOnlineThemesEnabled: () => setOnlineThemesEnabled,
    setThemesEnabled: () => setThemesEnabled,
    showNotice: () => showNotice,
    showToast: () => showToast,
    sleep: () => sleep,
    sortedEntries: () => sortedEntries,
    startPlugin: () => startPlugin,
    stopPlugin: () => stopPlugin,
    subscribe: () => subscribe,
    syncLazyModules: () => syncLazyModules,
    unregisterStyle: () => unregisterStyle,
    updateLocalTheme: () => updateLocalTheme,
    useEventSubscription: () => useEventSubscription,
    useExternalStore: () => useExternalStore,
    useForceUpdater: () => useForceUpdater,
    useIsStreaming: () => useIsStreaming,
    useSelectionHas: () => useSelectionHas,
    useSelectionSize: () => useSelectionSize,
    waitFor: () => waitFor,
    walkFiberTree: () => walkFiberTree,
    walkFiberUp: () => walkFiberUp
  });

  // src/utils/idb.ts
  var logger6 = new Logger("IDB");
  var DB_NAME = "Void";
  var STORE_NAME = "kv";
  var DB_VERSION = 1;
  var dbPromise = null;
  function open() {
    if (dbPromise)
      return dbPromise;
    const promise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE_NAME)) {
          req.result.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    promise.catch((e) => {
      dbPromise = null;
      if (false)
        ;
    });
    dbPromise = promise;
    return promise;
  }
  async function withStore(mode, run) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      run(tx.objectStore(STORE_NAME), resolve);
      tx.onerror = () => reject(tx.error);
    });
  }
  function idbGet(key) {
    return withStore("readonly", (store, resolve) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
    });
  }
  function idbSet(key, value) {
    return withStore("readwrite", (store, resolve) => {
      store.put(value, key);
      store.transaction.oncomplete = () => resolve();
    });
  }

  // src/utils/guards.ts
  function isTruthy(item) {
    return Boolean(item);
  }
  function isNonNullish(item) {
    return item != null;
  }
  function isObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  // src/utils/misc.ts
  function mergeDefaults(target, defaults) {
    for (const [key, defaultValue] of Object.entries(defaults)) {
      const value = target[key];
      if (isObject(value)) {
        mergeDefaults(value, defaultValue);
      } else if (value === undefined) {
        target[key] = defaultValue;
      }
    }
    return target;
  }
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      if (typeof GM_setClipboard === "function") {
        GM_setClipboard(text);
      }
    }
  }
  function onlyOnce(fn) {
    let result;
    let f = fn;
    return (...args) => {
      if (!f)
        return result;
      result = f(...args);
      f = null;
      return result;
    };
  }
  function debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }
  var FETCH_TIMEOUT_MS = 30000;
  function fetchExternal(url) {
    if (typeof GM_xmlhttpRequest === "undefined") {
      const controller = new AbortController;
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
    }
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url,
        responseType: "blob",
        timeout: FETCH_TIMEOUT_MS,
        onload(resp) {
          resolve(new Response(resp.response, {
            status: resp.status,
            statusText: resp.statusText
          }));
        },
        ontimeout() {
          reject(new Error("fetch timeout"));
        },
        onerror() {
          reject(new Error("fetch error"));
        },
        onabort() {
          reject(new Error("fetch aborted"));
        }
      });
    });
  }
  function createExternalStore() {
    const listeners = new Set;
    let version = 0;
    return {
      notify() {
        version++;
        for (const fn of listeners)
          fn();
      },
      subscribe(callback) {
        listeners.add(callback);
        return () => {
          listeners.delete(callback);
        };
      },
      getSnapshot() {
        return version;
      }
    };
  }
  function createSelectionStore() {
    const set = new Set;
    const store = createExternalStore();
    return {
      ...store,
      has: (id) => set.has(id),
      toggle(id) {
        if (set.has(id))
          set.delete(id);
        else
          set.add(id);
        store.notify();
      },
      add(id) {
        if (!set.has(id)) {
          set.add(id);
          store.notify();
        }
      },
      remove(id) {
        if (set.delete(id))
          store.notify();
      },
      clear() {
        if (set.size) {
          set.clear();
          store.notify();
        }
      },
      all: () => [...set],
      size: () => set.size
    };
  }
  var pad = (n) => String(n).padStart(2, "0");
  function hms(totalSeconds) {
    return [Math.floor(totalSeconds / 3600), Math.floor(totalSeconds % 3600 / 60), totalSeconds % 60];
  }
  function formatCountdown(totalSeconds) {
    if (totalSeconds <= 0)
      return "0:00";
    const [h, m, s] = hms(totalSeconds);
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }
  function formatDuration(totalSeconds) {
    if (totalSeconds <= 0)
      return "0m";
    const [h, m] = hms(totalSeconds);
    if (h > 0 && m > 0)
      return `${h}h ${m}m`;
    return h > 0 ? `${h}h` : `${m}m`;
  }
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  function errorMessage(err) {
    return err instanceof Error ? err.message : String(err);
  }
  var FILENAME_ILLEGAL = /[<>:"/\\|?*\x00-\x1f]/g;
  var WHITESPACE_RUN = /\s+/g;
  function sanitizeFilename(title, fallback = "file") {
    return title.replaceAll(FILENAME_ILLEGAL, "").trim().replaceAll(WHITESPACE_RUN, "-") || fallback;
  }
  function mapGetOrCreate(map, key, create) {
    let value = map.get(key);
    if (value === undefined) {
      value = create();
      map.set(key, value);
    }
    return value;
  }
  function safeUrl(url) {
    try {
      const { protocol } = new URL(url);
      return protocol === "https:" || protocol === "http:" || protocol === "mailto:" ? url : null;
    } catch {
      return null;
    }
  }
  function randomId(prefix = "") {
    const tail = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return prefix ? `${prefix}-${tail}` : tail;
  }
  function sortedEntries(map) {
    return [...map.entries()].toSorted(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0));
  }
  function sendBrowserNotification(title, body, icon = "/favicon.ico") {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((p) => {
        if (p === "granted")
          new Notification(title, { body, icon });
      }).catch(() => {});
    }
  }

  // src/api/Events.ts
  var logger7 = new Logger("Events");
  var listeners = new Map;
  function subscribe(event, handler2) {
    const set = mapGetOrCreate(listeners, event, () => new Set);
    set.add(handler2);
    return () => {
      set.delete(handler2);
      if (!set.size)
        listeners.delete(event);
    };
  }
  function dispatch(event, ...args) {
    const set = listeners.get(event);
    if (!set?.size)
      return;
    const data = args[0];
    for (const handler2 of Array.from(set)) {
      try {
        handler2(data);
      } catch (e) {
        logger7.error(`Event handler error (${event}):`, e);
      }
    }
  }

  // src/turbopack/common/stores.ts
  var exports_stores = {};
  __export(exports_stores, {
    ChatPageStore: () => ChatPageStore,
    ConversationStore: () => ConversationStore,
    FeatureStore: () => FeatureStore,
    FilesPageStore: () => FilesPageStore,
    MediaStore: () => MediaStore,
    ModesStore: () => ModesStore,
    ResponseStore: () => ResponseStore,
    RoutingStore: () => RoutingStore,
    SessionStore: () => SessionStore,
    SettingsDialogStore: () => SettingsDialogStore,
    SettingsStore: () => SettingsStore,
    SubscriptionsStore: () => SubscriptionsStore,
    TextToSpeechStore: () => TextToSpeechStore
  });
  var ChatPageStore = findByPropsLazy("useChatPageStore");
  var ConversationStore = findByPropsLazy("useConversationStore", "createOptimisticConversation");
  var FeatureStore = findByPropsLazy("useFeatureStore");
  var FilesPageStore = findByPropsLazy("useFilesPageStore", "useAssetsList");
  var MediaStore = findByPropsLazy("useMediaStore", "useImagineModeStore");
  var ModesStore = findByPropsLazy("useModesStore");
  var ResponseStore = findByPropsLazy("useResponseStore", "createOptimisticResponse");
  var RoutingStore = findByPropsLazy("useRoutingStore", "formatUrl");
  var SessionStore = findByPropsLazy("useSession", "SessionStoreProvider");
  var SettingsDialogStore = findByPropsLazy("useSettingsDialogStore");
  var SettingsStore = findByPropsLazy("useSettingsStore", "modelConfigOverrideSchema");
  var SubscriptionsStore = findByPropsLazy("useSubscriptionsStore");
  var TextToSpeechStore = findByPropsLazy("useTextToSpeechStore");

  // src/utils/react.ts
  function findFiberKey(el) {
    for (const k in el) {
      if (k.startsWith("__reactFiber$"))
        return k;
    }
    return null;
  }
  function getFiber(el) {
    let cur = el;
    while (cur) {
      const k = findFiberKey(cur);
      if (k)
        return cur[k];
      cur = cur.parentElement;
    }
    return null;
  }
  function getReactRoot() {
    for (const el of [document.body, document.getElementById("__next"), document.getElementById("root")]) {
      if (!el)
        continue;
      const k = findFiberKey(el);
      if (k)
        return el[k];
    }
    return null;
  }
  function walkFiberTree(root, visit, maxProcessed) {
    const visited = new WeakSet;
    const queue = [root];
    let processed = 0;
    while (queue.length && processed < maxProcessed) {
      const fiber = queue.shift();
      if (visited.has(fiber))
        continue;
      visited.add(fiber);
      processed++;
      if (visit(fiber) === false)
        return;
      if (fiber.child)
        queue.push(fiber.child);
      if (fiber.sibling)
        queue.push(fiber.sibling);
    }
  }
  function walkFiberUp(fiber, max, test) {
    const seen = new WeakSet;
    let cur = fiber;
    let d = 0;
    while (cur && d < max) {
      if (seen.has(cur))
        return null;
      seen.add(cur);
      if (test(cur))
        return cur;
      cur = cur.return;
      d++;
    }
    return null;
  }
  function resolveLazy(v) {
    return typeof v === "function" ? v() : v;
  }
  function useExternalStore(store) {
    useSyncExternalStore(store.subscribe, store.getSnapshot);
  }
  function useSelectionHas(store, id) {
    useExternalStore(store);
    return store.has(id);
  }
  function useSelectionSize(store) {
    useExternalStore(store);
    return store.size();
  }
  function useIsStreaming(conversationId) {
    return ChatPageStore.useChatPageStore((s) => !!s.streamedMessageId && (conversationId == null || s.conversationId === conversationId));
  }
  function useForceUpdater() {
    return useReducer((x) => x + 1, 0)[1];
  }
  function useEventSubscription(event, handler2) {
    const ref = useRef(handler2);
    ref.current = handler2;
    useEffect(() => subscribe(event, () => ref.current()), [event]);
  }
  function useFiltered(list, search2, getKey) {
    return useMemo(() => {
      const q = search2.toLowerCase().trim();
      if (!q)
        return list;
      return list.filter((item) => getKey(item).toLowerCase().includes(q));
    }, [list, search2, getKey]);
  }
  function useAsyncAction(fn) {
    const [busy, setBusy] = useState(false);
    const fnRef = useRef(fn);
    fnRef.current = fn;
    const execute = useCallback(async () => {
      setBusy(true);
      try {
        await fnRef.current();
      } finally {
        setBusy(false);
      }
    }, []);
    return [busy, execute];
  }

  // src/utils/SettingsStore.ts
  var logger8 = new Logger("SettingsStore");
  var STORAGE_KEY = "VoidSettings";
  var SAVE_DEBOUNCE_MS = 100;
  function parseStoredSettings(raw) {
    if (isObject(raw))
      return raw;
    if (typeof raw !== "string" || !raw)
      return null;
    try {
      const parsed = JSON.parse(raw);
      if (isObject(parsed))
        return parsed;
      if (typeof parsed === "string") {
        const nested = JSON.parse(parsed);
        return isObject(nested) ? nested : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  class SettingsStore2 {
    globalListeners = new Set;
    pathListeners = new Map;
    prefixListeners = new Map;
    defaultGetters = new Map;
    saveTimer = null;
    proxyCache = new WeakMap;
    constructor(plain) {
      this.plain = plain;
      this.store = this.makeProxy(plain);
      window.addEventListener("beforeunload", () => this.flush(), { once: true });
    }
    flush() {
      if (this.saveTimer) {
        clearTimeout(this.saveTimer);
        this.saveTimer = null;
      }
      this.save();
    }
    setDefaultGetter(prefix, getter) {
      this.defaultGetters.set(prefix, getter);
    }
    makeProxy(target, path = "") {
      const cached = this.proxyCache.get(target);
      if (cached)
        return cached;
      const proxy = new Proxy(target, {
        get: (t, key) => {
          let value = t[key];
          if (value === undefined && key !== "__proto__") {
            const fullPath = path ? `${path}.${key}` : key;
            for (const [prefix, getter] of this.defaultGetters) {
              if (fullPath.startsWith(prefix)) {
                const settingKey = fullPath.slice(prefix.length + 1);
                if (settingKey && !settingKey.includes(".")) {
                  const defaultVal = getter(settingKey);
                  if (defaultVal !== undefined) {
                    t[key] = defaultVal;
                    value = defaultVal;
                  }
                  break;
                }
              }
            }
          }
          if (isObject(value)) {
            return this.makeProxy(value, path ? `${path}.${key}` : key);
          }
          return value;
        },
        set: (t, key, value) => {
          if (t[key] === value)
            return true;
          t[key] = value;
          const fullPath = path ? `${path}.${key}` : key;
          this.notifyListeners(fullPath);
          return true;
        },
        deleteProperty: (t, key) => {
          if (!(key in t))
            return true;
          delete t[key];
          const fullPath = path ? `${path}.${key}` : key;
          this.notifyListeners(fullPath);
          return true;
        }
      });
      this.proxyCache.set(target, proxy);
      return proxy;
    }
    invokeListeners(listeners2, path) {
      for (const l of Array.from(listeners2)) {
        try {
          l(path);
        } catch (e) {
          logger8.error("Settings listener error:", e);
        }
      }
    }
    notifyListeners(path) {
      this.invokeListeners(this.globalListeners, path);
      const listeners2 = this.pathListeners.get(path);
      if (listeners2)
        this.invokeListeners(listeners2, path);
      for (const [prefix, set] of Array.from(this.prefixListeners)) {
        if (path.startsWith(prefix))
          this.invokeListeners(set, path);
      }
      this.scheduleSave();
    }
    scheduleSave() {
      if (this.saveTimer)
        return;
      this.saveTimer = setTimeout(() => {
        this.saveTimer = null;
        this.save();
      }, SAVE_DEBOUNCE_MS);
    }
    save() {
      try {
        const json = JSON.stringify(this.plain);
        if (typeof GM_setValue === "function") {
          try {
            GM_setValue(STORAGE_KEY, this.plain);
          } catch {
            try {
              GM_setValue(STORAGE_KEY, json);
            } catch (e2) {
              logger8.warn("Failed to save settings to GM:", e2);
            }
          }
        } else {
          try {
            localStorage.setItem(STORAGE_KEY, json);
          } catch {}
        }
        idbSet(STORAGE_KEY, json).catch((e) => logger8.warn("Failed to save settings to IndexedDB:", e));
      } catch (e) {
        logger8.error("Failed to save settings:", e);
      }
    }
    markAsChanged() {
      this.notifyListeners("");
    }
    addGlobalChangeListener(listener) {
      this.globalListeners.add(listener);
    }
    removeGlobalChangeListener(listener) {
      this.globalListeners.delete(listener);
    }
    addToMap(map, key, listener) {
      mapGetOrCreate(map, key, () => new Set).add(listener);
    }
    removeFromMap(map, key, listener) {
      const set = map.get(key);
      if (set) {
        set.delete(listener);
        if (!set.size)
          map.delete(key);
      }
    }
    addChangeListener(path, listener) {
      this.addToMap(this.pathListeners, path, listener);
    }
    removeChangeListener(path, listener) {
      this.removeFromMap(this.pathListeners, path, listener);
    }
    addPrefixChangeListener(prefix, listener) {
      this.addToMap(this.prefixListeners, prefix, listener);
    }
    removePrefixChangeListener(prefix, listener) {
      this.removeFromMap(this.prefixListeners, prefix, listener);
    }
  }

  // src/api/Settings.ts
  var logger9 = new Logger("Settings");
  var DefaultSettings = { plugins: {} };
  var settings = {};
  mergeDefaults(settings, DefaultSettings);
  var SettingsStore3 = new SettingsStore2(settings);
  var PlainSettings = settings;
  var Settings = SettingsStore3.store;
  var pluginPath = (name, key) => key ? `plugins.${name}.${key}` : `plugins.${name}`;
  async function readGmValue() {
    if (typeof GM_getValue !== "function")
      return null;
    try {
      const value = GM_getValue(STORAGE_KEY, null);
      if (value != null && typeof value.then === "function") {
        return await value;
      }
      return value;
    } catch (e) {
      logger9.warn("Failed to read GM storage:", e);
      return null;
    }
  }
  async function readStoredSettings() {
    const gm = parseStoredSettings(await readGmValue());
    if (gm)
      return gm;
    try {
      const idb = parseStoredSettings(await idbGet(STORAGE_KEY) ?? null);
      if (idb)
        return idb;
    } catch (e) {
      logger9.warn("Failed to read IndexedDB:", e);
    }
    try {
      return parseStoredSettings(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      logger9.warn("Failed to read localStorage:", e);
      return null;
    }
  }
  async function initSettings() {
    const parsed = await readStoredSettings();
    if (parsed)
      Object.assign(settings, parsed);
    mergeDefaults(settings, DefaultSettings);
    const meta = settings.plugins.Settings;
    if (meta && meta.enabled === false)
      meta.enabled = true;
  }
  function migratePluginSettings(name, ...oldNames) {
    const { plugins } = SettingsStore3.plain;
    if (name in plugins)
      return;
    for (const oldName of oldNames) {
      if (oldName in plugins) {
        logger9.info(`Migrating settings from old name ${oldName} to ${name}`);
        plugins[name] = plugins[oldName];
        delete plugins[oldName];
        SettingsStore3.markAsChanged();
        break;
      }
    }
  }
  function migratePluginSetting(pluginName, newKey, oldKey) {
    const pluginSettings = SettingsStore3.plain.plugins[pluginName];
    if (!pluginSettings || !(oldKey in pluginSettings) || newKey in pluginSettings)
      return;
    logger9.info(`Migrating setting ${oldKey} -> ${newKey} in ${pluginName}`);
    pluginSettings[newKey] = pluginSettings[oldKey];
    delete pluginSettings[oldKey];
    SettingsStore3.markAsChanged();
  }
  function migrateSettingsToPlugin(targetPlugin, sourcePlugin, ...settingKeys) {
    const source = SettingsStore3.plain.plugins[sourcePlugin];
    if (!source)
      return;
    const target = SettingsStore3.plain.plugins[targetPlugin] ??= { enabled: false };
    let changed = false;
    for (const key of settingKeys) {
      if (key in source && !(key in target)) {
        target[key] = source[key];
        delete source[key];
        changed = true;
      }
    }
    if (changed) {
      logger9.info(`Migrated settings [${settingKeys.join(", ")}] from ${sourcePlugin} to ${targetPlugin}`);
      SettingsStore3.markAsChanged();
    }
  }
  function getSettingsPluginData() {
    return Settings.plugins.Settings ?? {};
  }
  function updateSettingsPluginData(patch) {
    Settings.plugins.Settings = { ...Settings.plugins.Settings ?? { enabled: true }, ...patch };
  }
  function getPinnedPlugins() {
    return getSettingsPluginData().pinnedPlugins ?? [];
  }
  function isPluginPinned(name) {
    return getPinnedPlugins().includes(name);
  }
  function togglePluginPinned(name) {
    const current = getPinnedPlugins();
    const pinned = current.includes(name);
    updateSettingsPluginData({
      pinnedPlugins: pinned ? current.filter((n) => n !== name) : [name, ...current]
    });
    return !pinned;
  }
  function getStarredPlugins() {
    return getSettingsPluginData().starredPlugins ?? [];
  }
  function isPluginStarred(name) {
    return getStarredPlugins().includes(name);
  }
  function togglePluginStarred(name) {
    const current = getStarredPlugins();
    const starred = current.includes(name);
    updateSettingsPluginData({
      starredPlugins: starred ? current.filter((n) => n !== name) : [name, ...current]
    });
    return !starred;
  }
  function mergePluginSettings(name, patch) {
    Settings.plugins[name] = { ...Settings.plugins[name] ?? { enabled: false }, ...patch };
  }
  function resolveDefault(setting) {
    if ("default" in setting)
      return setting.default;
    if (setting.type === 4 /* SELECT */)
      return setting.options.find((o) => o.default)?.value;
    return;
  }
  function definePluginSettings(def, checks) {
    let _pluginName = "";
    const definedSettings = {
      get store() {
        if (!_pluginName)
          throw new Error("Cannot access settings before plugin is initialized");
        return Settings.plugins[_pluginName];
      },
      get plain() {
        if (!_pluginName)
          throw new Error("Cannot access settings before plugin is initialized");
        return PlainSettings.plugins[_pluginName];
      },
      def,
      checks: checks ?? {},
      get pluginName() {
        return _pluginName;
      },
      set pluginName(name) {
        _pluginName = name;
        if (!name)
          return;
        if (!PlainSettings.plugins[name])
          PlainSettings.plugins[name] = {};
        SettingsStore3.setDefaultGetter(pluginPath(name), (key) => {
          const setting = def[key];
          return setting ? resolveDefault(setting) : undefined;
        });
      },
      use(keys) {
        const forceUpdate = useForceUpdater();
        useEffect(() => {
          const prefix = pluginPath(_pluginName);
          let listener = forceUpdate;
          if (keys?.length) {
            const watched = keys.map((k) => `${prefix}.${String(k)}`);
            listener = (path) => {
              if (watched.some((p) => path.startsWith(p) || p.startsWith(path + ".")))
                forceUpdate();
            };
          }
          SettingsStore3.addPrefixChangeListener(prefix, listener);
          return () => SettingsStore3.removePrefixChangeListener(prefix, listener);
        }, []);
        return definedSettings.store;
      },
      withPrivateSettings() {
        return this;
      }
    };
    return definedSettings;
  }

  // src/api/BuildHealth.ts
  var logger10 = new Logger("TurbopackPatcher", "#e78284");
  var chunkBasename = (path) => path.slice(path.lastIndexOf("/") + 1);
  function checkBuildFingerprint() {
    const domChunks = [...document.querySelectorAll('script[src*="/_next/static/chunks/"]')].map((s) => chunkBasename(s.src));
    const current = [...new Set([...domChunks, ...getChunkFingerprint().map(chunkBasename)])];
    if (!current.length)
      return;
    const previous = getSettingsPluginData().chunkFingerprint;
    if (previous?.length) {
      const prev = new Set(previous);
      const overlap = current.filter((c) => prev.has(c)).length / current.length;
      if (overlap < 0.5)
        logger10.warn("grok build changed (chunk fingerprint shifted)");
    }
    updateSettingsPluginData({ chunkFingerprint: current });
  }
  // void-css:/tmp/Void/src/components/ColorSettingRow.css
  registerStyle("ColorSettingRow", `/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

.void-color-picker-input {
    width: 2rem;
    height: 2rem;
    border: 1px solid hsl(var(--border-l2));
    border-radius: 0.5rem;
    cursor: pointer;
    padding: 0.125rem;
    background-color: transparent;
}
`);

  // src/components/ColorSettingRow.tsx
  var cl = classNameFactory("void-color-picker-");
  function ColorSettingRow({ value, onChange, title, description }) {
    return /* @__PURE__ */ React.createElement(SettingsRow, {
      action: /* @__PURE__ */ React.createElement(Flex, {
        alignItems: "center",
        gap: "0.5rem"
      }, /* @__PURE__ */ React.createElement("input", {
        type: "color",
        className: cl("input"),
        value,
        onChange: (e) => onChange(e.target.value)
      }), /* @__PURE__ */ React.createElement(Text2, {
        size: "sm",
        color: "muted"
      }, value))
    }, /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0"
    }, /* @__PURE__ */ React.createElement(SettingsTitle, null, title), /* @__PURE__ */ React.createElement(SettingsDescription, null, description)));
  }
  // void-css:/tmp/Void/src/components/ConfirmDialog.css
  registerStyle("ConfirmDialog", `.void-confirm-dialog {
    width: 100%;
    max-width: 28rem;
    padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid hsl(var(--border-l1));
    background: hsl(var(--surface-l1));
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}
`);

  // src/turbopack/common/settingsPrimitives.ts
  var cl2 = classNameFactory("void-settings-");
  var captured = {};
  function FallbackTitle({ children, className }) {
    return React.createElement("div", { className: classes(cl2("title"), className) }, children);
  }
  function FallbackDescription({ children }) {
    return React.createElement("div", { className: cl2("description") }, children);
  }
  function FallbackRow({ children, action, hidden, className }) {
    if (hidden)
      return null;
    return React.createElement("div", { className: classes(cl2("row"), className) }, React.createElement("div", { className: cl2("row-body") }, children), action ?? null);
  }
  var fallbacks = {
    SettingsTitle: FallbackTitle,
    SettingsDescription: FallbackDescription,
    SettingsRow: FallbackRow
  };
  function setSettingsPrimitive(name, component) {
    captured[name] = component;
  }
  var SettingsTitle = (props) => React.createElement(captured.SettingsTitle ?? fallbacks.SettingsTitle, props);
  var SettingsDescription = (props) => React.createElement(captured.SettingsDescription ?? fallbacks.SettingsDescription, props);
  var SettingsRow = (props) => React.createElement(captured.SettingsRow ?? fallbacks.SettingsRow, props);

  // src/turbopack/common/components.ts
  function createModuleLazy(...filterProps) {
    let mod = null;
    waitFor(filters.byProps(...filterProps), (m) => {
      mod = m;
    });
    return (name) => LazyComponent(name, () => mod?.[name] ?? findExportedComponent(name));
  }
  function lazyExport(name) {
    return LazyComponent(name, () => findExportedComponent(name));
  }
  var buttonLazy = createModuleLazy("Button", "IconButton");
  var Button = buttonLazy("Button");
  function buttonWithTooltip(props) {
    const { tooltipContent, tooltipProps, tooltipContentProps, stayOpenOnClick, ...rest } = props;
    if (!createElement)
      return null;
    return createElement(Button, {
      ...rest,
      tooltip: tooltipContent == null ? undefined : {
        content: tooltipContent,
        props: tooltipProps,
        contentProps: tooltipContentProps,
        stayOpenOnClick
      }
    });
  }
  var ButtonWithTooltip = buttonWithTooltip;
  var ButtonWithTooltipOptimized = ButtonWithTooltip;
  var cardLazy = createModuleLazy("Card", "CardContent", "CardHeader", "CardTitle");
  var Card = cardLazy("Card");
  var CardContent = cardLazy("CardContent");
  var CardHeader = cardLazy("CardHeader");
  var CardTitle = cardLazy("CardTitle");
  var dialogLazy = createModuleLazy("Dialog", "DialogContent", "DialogHeader");
  var Dialog = dialogLazy("Dialog");
  var DialogContent = dialogLazy("DialogContent");
  var DialogHeader = dialogLazy("DialogHeader");
  var DialogTitle = dialogLazy("DialogTitle");
  var DialogDescription = dialogLazy("DialogDescription");
  var DialogFooter = dialogLazy("DialogFooter");
  var DialogClose = dialogLazy("DialogClose");
  var DialogTrigger = dialogLazy("DialogTrigger");
  var DialogOverlay = dialogLazy("DialogOverlay");
  var DialogPortal = dialogLazy("DialogPortal");
  var drawerLazy = createModuleLazy("Drawer", "DrawerContent", "DrawerTrigger");
  var Drawer = drawerLazy("Drawer");
  var DrawerContent = drawerLazy("DrawerContent");
  var DrawerTrigger = drawerLazy("DrawerTrigger");
  var DrawerDescription = drawerLazy("DrawerDescription");
  var DrawerFooter = drawerLazy("DrawerFooter");
  var DrawerHeader = drawerLazy("DrawerHeader");
  var DrawerTitle = drawerLazy("DrawerTitle");
  var ResponsiveDialog = drawerLazy("ResponsiveDialog");
  var dropdownMenuLazy = createModuleLazy("DropdownMenu", "DropdownMenuContent", "DropdownMenuTrigger");
  var DropdownMenu = dropdownMenuLazy("DropdownMenu");
  var DropdownMenuTrigger = dropdownMenuLazy("DropdownMenuTrigger");
  var DropdownMenuContent = dropdownMenuLazy("DropdownMenuContent");
  var DropdownMenuItem = dropdownMenuLazy("DropdownMenuItem");
  var DropdownMenuCheckboxItem = dropdownMenuLazy("DropdownMenuCheckboxItem");
  var DropdownMenuRadioGroup = dropdownMenuLazy("DropdownMenuRadioGroup");
  var DropdownMenuRadioItem = dropdownMenuLazy("DropdownMenuRadioItem");
  var DropdownMenuSeparator = dropdownMenuLazy("DropdownMenuSeparator");
  var DropdownMenuSub = dropdownMenuLazy("DropdownMenuSub");
  var DropdownMenuSubTrigger = dropdownMenuLazy("DropdownMenuSubTrigger");
  var DropdownMenuSubContent = dropdownMenuLazy("DropdownMenuSubContent");
  var DropdownMenuPortal = dropdownMenuLazy("DropdownMenuPortal");
  var hoverCardLazy = createModuleLazy("HoverCard", "HoverCardContent", "HoverCardTrigger");
  var HoverCard = hoverCardLazy("HoverCard");
  var HoverCardContent = hoverCardLazy("HoverCardContent");
  var HoverCardTrigger = hoverCardLazy("HoverCardTrigger");
  var Input = lazyExport("Input");
  var Label = lazyExport("Label");
  var MotionDiv = LazyComponent("MotionDiv", () => findByProps("motion")?.motion?.div);
  var Portal = lazyExport("Portal");
  var selectLazy = createModuleLazy("Select", "SelectContent", "SelectTrigger");
  var Select = selectLazy("Select");
  var SelectTrigger = selectLazy("SelectTrigger");
  var SelectContent = selectLazy("SelectContent");
  var SelectItem = selectLazy("SelectItem");
  var SelectValue = selectLazy("SelectValue");
  var Separator = lazyExport("Separator");
  var Skeleton = lazyExport("Skeleton");
  var Slider = lazyExport("Slider");
  var Switch = lazyExport("Switch");
  var tableLazy = createModuleLazy("Table", "TableBody", "TableCell");
  var Table = tableLazy("Table");
  var TableBody = tableLazy("TableBody");
  var TableCell = tableLazy("TableCell");
  var TableHead = tableLazy("TableHead");
  var TableHeader = tableLazy("TableHeader");
  var TableRow = tableLazy("TableRow");
  var tooltipLazy = createModuleLazy("Tooltip", "TooltipTrigger", "TooltipContent");
  var Tooltip = tooltipLazy("Tooltip");
  var TooltipTrigger = tooltipLazy("TooltipTrigger");
  var TooltipContent = tooltipLazy("TooltipContent");
  var TooltipProvider = tooltipLazy("TooltipProvider");
  var Textarea = lazyExport("Textarea");
  var Checkbox = lazyExport("Checkbox");
  var Spinner = lazyExport("Spinner");
  var Avatar = lazyExport("Avatar");
  var popoverLazy = createModuleLazy("Popover", "PopoverContent", "PopoverTrigger");
  var Popover = popoverLazy("Popover");
  var PopoverTrigger = popoverLazy("PopoverTrigger");
  var PopoverContent = popoverLazy("PopoverContent");
  var PopoverArrow = popoverLazy("PopoverArrow");
  function buttonWithPopover({ popoverContent, popoverProps, popoverContentProps, children, ...rest }) {
    if (!createElement)
      return null;
    return createElement(Popover, popoverProps, createElement(PopoverTrigger, { asChild: true }, createElement(Button, rest, children)), createElement(PopoverContent, popoverContentProps, popoverContent));
  }
  var ButtonWithPopover = buttonWithPopover;
  var tabsLazy = createModuleLazy("Tabs", "TabsList", "TabsTrigger", "TabsContent");
  var Tabs = tabsLazy("Tabs");
  var TabsList = tabsLazy("TabsList");
  var TabsTrigger = tabsLazy("TabsTrigger");
  var TabsContent = tabsLazy("TabsContent");
  var accordionLazy = createModuleLazy("Accordion", "AccordionContent", "AccordionItem");
  var Accordion = accordionLazy("Accordion");
  var AccordionItem = accordionLazy("AccordionItem");
  var AccordionTrigger = accordionLazy("AccordionTrigger");
  var AccordionContent = accordionLazy("AccordionContent");
  var commandLazy = createModuleLazy("Command", "CommandInput", "CommandList", "CommandItem");
  var Command = commandLazy("Command");
  var CommandInput = commandLazy("CommandInput");
  var CommandList = commandLazy("CommandList");
  var CommandItem = commandLazy("CommandItem");
  var CommandGroup = commandLazy("CommandGroup");
  var CommandEmpty = commandLazy("CommandEmpty");
  var Badge = lazyExport("Badge");
  var alertDialogLazy = createModuleLazy("AlertDialog", "AlertDialogContent", "AlertDialogAction");
  var AlertDialog = alertDialogLazy("AlertDialog");
  var AlertDialogTrigger = alertDialogLazy("AlertDialogTrigger");
  var AlertDialogContent = alertDialogLazy("AlertDialogContent");
  var AlertDialogHeader = alertDialogLazy("AlertDialogHeader");
  var AlertDialogFooter = alertDialogLazy("AlertDialogFooter");
  var AlertDialogTitle = alertDialogLazy("AlertDialogTitle");
  var AlertDialogDescription = alertDialogLazy("AlertDialogDescription");
  var AlertDialogAction = alertDialogLazy("AlertDialogAction");
  var AlertDialogCancel = alertDialogLazy("AlertDialogCancel");
  var toggleGroupLazy = createModuleLazy("ToggleGroup", "ToggleGroupItem");
  var ToggleGroup = toggleGroupLazy("ToggleGroup");
  var ToggleGroupItem = toggleGroupLazy("ToggleGroupItem");
  var SidebarComponents = findByPropsLazy("Sidebar", "SidebarContent", "SidebarProvider");
  var AnimatePresence = lazyExport("AnimatePresence");

  // src/components/ConfirmDialog.tsx
  function ConfirmDialog({ open: open2, onOpenChange, title, description, confirmText = "Confirm", cancelText = "Cancel", danger, onConfirm }) {
    return /* @__PURE__ */ React.createElement(AlertDialog, {
      open: open2,
      onOpenChange
    }, /* @__PURE__ */ React.createElement(AlertDialogContent, {
      className: "void-confirm-dialog"
    }, /* @__PURE__ */ React.createElement(AlertDialogHeader, null, /* @__PURE__ */ React.createElement(AlertDialogTitle, null, title), /* @__PURE__ */ React.createElement(AlertDialogDescription, null, description)), /* @__PURE__ */ React.createElement(AlertDialogFooter, null, /* @__PURE__ */ React.createElement(AlertDialogCancel, {
      asChild: true
    }, /* @__PURE__ */ React.createElement(Button, {
      variant: "secondary",
      size: "sm"
    }, cancelText)), /* @__PURE__ */ React.createElement(AlertDialogAction, {
      asChild: true
    }, /* @__PURE__ */ React.createElement(Button, {
      variant: danger ? "danger" : "primary",
      size: "sm",
      onClick: onConfirm
    }, confirmText)))));
  }
  // src/components/ErrorBoundary.tsx
  var ErrorBoundaryClass = null;
  function getErrorBoundaryClass() {
    if (ErrorBoundaryClass)
      return ErrorBoundaryClass;
    ErrorBoundaryClass = class VoidErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false };
      }
      static getDerivedStateFromError() {
        return { hasError: true };
      }
      componentDidCatch(error) {
        this.props.onError?.(error);
      }
      render() {
        if (this.state.hasError)
          return this.props.fallback ?? null;
        return this.props.children ?? null;
      }
    };
    return ErrorBoundaryClass;
  }
  function ErrorBoundaryWrapper(props) {
    const Cls = getErrorBoundaryClass();
    return /* @__PURE__ */ React.createElement(Cls, {
      ...props
    });
  }
  var ErrorBoundary = ErrorBoundaryWrapper;
  Object.defineProperty(ErrorBoundary, "wrap", {
    value(Component, fallback = null) {
      const Wrapped = (props) => /* @__PURE__ */ React.createElement(ErrorBoundary, {
        fallback
      }, /* @__PURE__ */ React.createElement(Component, {
        ...props
      }));
      Object.defineProperty(Wrapped, "name", { value: `ErrorBoundary(${Component.displayName ?? Component.name ?? "Unknown"})` });
      return Wrapped;
    },
    configurable: true
  });
  // void-css:/tmp/Void/src/components/ErrorCard.css
  registerStyle("ErrorCard", `.void-error-card-root {
    contain: content;
    padding: 1rem;
    border-radius: 0.5rem;
    background: hsl(var(--fg-danger) / 12%);
    border: 1px solid hsl(var(--fg-danger) / 40%);
    color: hsl(var(--fg-danger));
}

.void-error-card-header {
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.void-error-card-root code {
    display: block;
    margin-top: 0.5rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    background: hsl(var(--black) / 20%);
    font-size: 0.85em;
    white-space: pre-wrap;
    overflow-wrap: break-word;
}
`);

  // src/components/ErrorCard.tsx
  var cl3 = classNameFactory("void-error-card-");
  // src/components/Flex.tsx
  function Flex({ flexDirection, gap = "1em", justifyContent, alignItems, flexWrap, children, style, ref, ...restProps }) {
    return /* @__PURE__ */ React.createElement("div", {
      ref,
      style: {
        display: "flex",
        flexDirection,
        gap,
        justifyContent,
        alignItems,
        flexWrap,
        ...style
      },
      ...restProps
    }, children);
  }
  // src/components/Grid.tsx
  function Grid({ columns, rows, gap = "0.75rem", justifyItems, alignItems, children, style, ...restProps }) {
    return /* @__PURE__ */ React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: columns,
        gridTemplateRows: rows,
        gap,
        justifyItems,
        alignItems,
        ...style
      },
      ...restProps
    }, children);
  }
  // src/turbopack/common/utils.ts
  var ApiClients = findByPropsLazy("chatApi", "modelsApi");
  var Toaster = findByPropsLazy("Toaster", "toast");
  var ClassNames = findByPropsLazy("cn", "middleTruncate");
  var FileUtils = findByPropsLazy("downloadBlob");

  // src/components/Text.tsx
  var sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl"
  };
  var weightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold"
  };
  var colorClasses = {
    primary: "",
    secondary: "text-secondary",
    muted: "text-secondary"
  };
  function Text2({ size = "sm", weight = "normal", color = "primary", as = "div", className, ...props }) {
    return createElement(as, {
      className: ClassNames.cn(sizeClasses[size], weightClasses[weight], colorClasses[color], className),
      ...props
    });
  }

  // src/components/Paragraph.tsx
  function Paragraph({ color = "secondary", className, children, ...props }) {
    return /* @__PURE__ */ React.createElement(Text2, {
      as: "p",
      size: "xs",
      color,
      className: ClassNames.cn("text-pretty", className),
      ...props
    }, children);
  }
  function SectionHeader({ title, description, className }) {
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0",
      className: ClassNames.cn("max-w-sm min-w-0", className)
    }, /* @__PURE__ */ React.createElement(Text2, {
      size: "sm",
      weight: "medium"
    }, title), description && /* @__PURE__ */ React.createElement(Paragraph, null, description));
  }
  // void-css:/tmp/Void/src/components/SelectionUI.css
  registerStyle("SelectionUI", `/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

.void-sel-wrap {
    display: none;
    align-items: center;
}

.void-sel-wrap:has([data-state="checked"]) {
    display: inline-flex;
}

.void-sel-checkbox {
    border-color: hsl(var(--border-l2)) !important;
}

.void-sel-action-bar {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
}

.void-sel-count {
    font-size: 0.75rem;
    font-weight: 600;
    color: hsl(var(--fg-tertiary));
}

.void-sel-buttons {
    display: flex;
    gap: 0.75rem;
}

.void-sel-buttons > button {
    flex: 1;
}
`);

  // src/components/SelectionUI.tsx
  var cl4 = classNameFactory("void-sel-");
  function SelectionCheckbox({ selection, id }) {
    const checked = useSelectionHas(selection, id);
    return /* @__PURE__ */ React.createElement("div", {
      onClick: (e) => {
        e.stopPropagation();
        e.preventDefault();
      },
      className: cl4("wrap")
    }, /* @__PURE__ */ React.createElement(Checkbox, {
      checked,
      onCheckedChange: () => selection.toggle(id),
      className: cl4("checkbox")
    }));
  }
  function SelectionActionBar({ selection, noun, title, onDelete }) {
    const count = useSelectionSize(selection);
    const [open2, setOpen] = useState(false);
    if (!count)
      return null;
    const handleConfirm = async () => {
      const ids = selection.all();
      selection.clear();
      await onDelete(ids);
    };
    return /* @__PURE__ */ React.createElement(Fragment, null, /* @__PURE__ */ React.createElement("div", {
      className: cl4("action-bar")
    }, /* @__PURE__ */ React.createElement("span", {
      className: cl4("count")
    }, "Selected · ", count), /* @__PURE__ */ React.createElement("div", {
      className: cl4("buttons")
    }, /* @__PURE__ */ React.createElement(Button, {
      variant: "primary",
      size: "sm",
      shape: "pill",
      onClick: () => selection.clear()
    }, "Cancel"), /* @__PURE__ */ React.createElement(Button, {
      variant: "danger",
      size: "sm",
      shape: "pill",
      onClick: () => setOpen(true)
    }, "Delete"))), /* @__PURE__ */ React.createElement(ConfirmDialog, {
      open: open2,
      onOpenChange: setOpen,
      title,
      description: `Are you sure you want to delete ${pluralize(count, noun)}? This cannot be undone.`,
      confirmText: "Delete",
      danger: true,
      onConfirm: handleConfirm
    }));
  }
  // src/components/ChatBarButton.tsx
  var preventOpenFocus = (e) => e.preventDefault();
  var TOOLTIP_PROPS = { delayDuration: 100 };
  var TOOLTIP_CONTENT_PROPS = { side: "top", sideOffset: 8 };
  var POPOVER_PROPS = { modal: false };
  var POPOVER_CONTENT_PROPS = { side: "top", align: "center", onOpenAutoFocus: preventOpenFocus };
  function ChatBarButton({
    icon,
    tooltip,
    popover,
    onClick,
    variant = "tertiary",
    size = "md",
    shape = "circle",
    disabled,
    active,
    className,
    "aria-label": ariaLabel
  }) {
    const cls = classes(active && "bg-button-ghost-hover", className);
    const label = ariaLabel ?? (typeof tooltip === "string" ? tooltip : undefined);
    if (popover) {
      return /* @__PURE__ */ React.createElement(ButtonWithPopover, {
        variant,
        size,
        shape,
        disabled,
        className: cls,
        popoverContent: popover,
        popoverProps: POPOVER_PROPS,
        popoverContentProps: POPOVER_CONTENT_PROPS,
        onClick,
        "aria-label": label
      }, icon);
    }
    return /* @__PURE__ */ React.createElement(ButtonWithTooltip, {
      variant,
      size,
      shape,
      disabled,
      className: cls,
      tooltipContent: tooltip,
      tooltipProps: TOOLTIP_PROPS,
      tooltipContentProps: TOOLTIP_CONTENT_PROPS,
      onClick,
      "aria-label": label
    }, icon);
  }

  // src/api/registry.ts
  function createRegistry() {
    const map = new Map;
    const store = createExternalStore();
    return {
      store,
      set(id, value) {
        map.set(id, value);
        store.notify();
      },
      delete(id) {
        const had = map.delete(id);
        if (had)
          store.notify();
        return had;
      },
      get size() {
        return map.size;
      },
      sorted: () => sortedEntries(map)
    };
  }

  // src/api/ChatBarButtons.tsx
  var buttons = createRegistry();
  function addChatBarButton(id, def) {
    buttons.set(id, def);
  }
  function removeChatBarButton(id) {
    buttons.delete(id);
  }
  function renderEntry(def) {
    return /* @__PURE__ */ React.createElement(ChatBarButton, {
      icon: resolveLazy(def.icon),
      tooltip: resolveLazy(def.tooltip),
      popover: resolveLazy(def.popover),
      onClick: def.onClick,
      variant: def.variant,
      size: def.size,
      shape: def.shape,
      disabled: resolveLazy(def.disabled),
      active: resolveLazy(def.active),
      "aria-label": def["aria-label"],
      className: def.className
    });
  }
  function VoidChatBarButtons({ location: location2 = "chat" }) {
    useExternalStore(buttons.store);
    if (!buttons.size)
      return null;
    const entries = buttons.sorted().filter(([, def]) => (def.locations ?? ["chat"]).includes(location2));
    if (!entries.length)
      return null;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, entries.map(([id, def]) => /* @__PURE__ */ React.createElement(ErrorBoundary, {
      key: id
    }, renderEntry(def))));
  }

  // src/api/ContextMenus.tsx
  var menuPrimitivesContext = null;
  function getMenuPrimitivesContext() {
    return menuPrimitivesContext ??= React.createContext(null);
  }
  function makeMenuPrimitive(key, fallback) {
    return (props) => {
      const ctx = React.useContext(getMenuPrimitivesContext());
      const C = ctx?.[key] ?? fallback;
      return /* @__PURE__ */ React.createElement(C, {
        ...props
      });
    };
  }
  var MenuItem = makeMenuPrimitive("Item", DropdownMenuItem);
  var MenuSub = makeMenuPrimitive("Sub", DropdownMenuSub);
  var MenuSubTrigger = makeMenuPrimitive("SubTrigger", DropdownMenuSubTrigger);
  var MenuSubContent = makeMenuPrimitive("SubContent", DropdownMenuSubContent);
  var registries = new Map;
  function getRegistry(location2) {
    return mapGetOrCreate(registries, location2, () => createRegistry());
  }
  function addContextMenuItem(location2, id, def) {
    getRegistry(location2).set(id, def);
  }
  function removeContextMenuItem(location2, id) {
    getRegistry(location2).delete(id);
  }
  function renderEntry2(def, ctx) {
    if (def.render) {
      const Render = def.render;
      return /* @__PURE__ */ React.createElement(Render, {
        ...ctx
      });
    }
    return /* @__PURE__ */ React.createElement(MenuItem, {
      onSelect: () => def.onSelect?.(ctx)
    }, resolveLazy(def.icon), resolveLazy(def.label));
  }
  function VoidContextMenuItems({ location: location2, menu, ...ctx }) {
    const registry = getRegistry(location2);
    useExternalStore(registry.store);
    if (!registry.size)
      return null;
    const sorted = registry.sorted();
    const content = /* @__PURE__ */ React.createElement(React.Fragment, null, sorted.map(([id, def]) => /* @__PURE__ */ React.createElement(ErrorBoundary, {
      key: id,
      fallback: null
    }, renderEntry2(def, ctx))));
    if (menu) {
      const Ctx = getMenuPrimitivesContext();
      return /* @__PURE__ */ React.createElement(Ctx.Provider, {
        value: menu
      }, content);
    }
    return content;
  }

  // src/api/PluginManager.ts
  var logger11 = new Logger("PluginManager", "#b4befe");
  var plugins = {};
  var pluginUnsubscribers = new Map;
  var initialized = false;
  var storeRegistry = exports_stores;
  function runUnsubs(pluginName) {
    const unsubs = pluginUnsubscribers.get(pluginName);
    if (!unsubs)
      return;
    for (const unsub of unsubs) {
      try {
        unsub();
      } catch (e) {
        logger11.error(`Unsub error in ${pluginName}:`, e);
      }
    }
    pluginUnsubscribers.delete(pluginName);
  }
  function markAsEnabledDependency(plugin) {
    mergePluginSettings(plugin.name, { enabled: true });
    plugin.isDependency = true;
  }
  function removePluginContextMenuItems(plugin) {
    if (!plugin.contextMenuItems)
      return;
    for (const location2 of Object.keys(plugin.contextMenuItems)) {
      removeContextMenuItem(location2, plugin.name);
    }
  }
  function isPluginEnabled(pluginName) {
    const plugin = plugins[pluginName];
    if (!plugin)
      return false;
    if (plugin.chrome && !window.chrome)
      return false;
    if (plugin.required || plugin.isDependency)
      return true;
    return Settings.plugins[pluginName]?.enabled ?? plugin.enabledByDefault ?? false;
  }
  function togglePlugin(name) {
    const plugin = plugins[name];
    if (!plugin || plugin.required || plugin.isDependency)
      return false;
    const enabled = isPluginEnabled(name);
    mergePluginSettings(name, { enabled: !enabled });
    if (!enabled)
      startPlugin(plugin, true);
    else
      stopPlugin(plugin);
    dispatch("pluginToggle");
    return !!(plugin.patches?.length || plugin.requiresRestart);
  }
  function addPatch(newPatch, pluginName) {
    const patch = newPatch;
    patch.plugin = pluginName;
    if (patch.predicate && !patch.predicate())
      return;
    canonicalizeFind(patch);
    if (!Array.isArray(patch.replacement)) {
      patch.replacement = [patch.replacement];
    }
    const pluginPath2 = `Void.plugins[${JSON.stringify(pluginName)}]`;
    for (const replacement of patch.replacement) {
      if (false) {}
      canonicalizeReplacement(replacement, pluginPath2);
    }
    patches.push(patch);
  }
  function startDependenciesRecursive(plugin, visiting = new Set) {
    if (!plugin.dependencies)
      return true;
    for (const depName of plugin.dependencies) {
      const dep = plugins[depName];
      if (!dep) {
        logger11.warn(`Missing dependency ${depName} for ${plugin.name}`);
        return false;
      }
      if (dep.started)
        continue;
      if (visiting.has(depName)) {
        logger11.error(`Circular dependency detected: ${plugin.name} -> ${depName}`);
        return false;
      }
      markAsEnabledDependency(dep);
      visiting.add(depName);
      if (!startDependenciesRecursive(dep, visiting))
        return false;
      if (!startPlugin(dep))
        return false;
    }
    return true;
  }
  function isSubscribable(val) {
    return val != null && typeof val.subscribe === "function";
  }
  function resolveStoreHook(storeName) {
    const lazy = storeRegistry[storeName];
    if (!lazy)
      return null;
    const resolved = lazy[SYM_LAZY_GET]?.() ?? lazy;
    if (!resolved)
      return null;
    const hook = resolved[`use${storeName}`];
    if (isSubscribable(hook))
      return hook;
    return Object.values(resolved).find(isSubscribable) ?? null;
  }
  function ensureMethodsBound(plugin) {
    for (const key of Object.keys(plugin)) {
      if (key === "start" || key === "stop")
        continue;
      const val = plugin[key];
      if (typeof val === "function" && !val.$$voidBound) {
        const bound = val.bind(plugin);
        bound.$$voidBound = true;
        plugin[key] = bound;
      }
    }
  }
  function startPlugin(plugin, silent = false) {
    if (plugin.started)
      return true;
    try {
      if (!startDependenciesRecursive(plugin)) {
        logger11.error(`Failed to start dependencies for ${plugin.name}`);
        return false;
      }
      ensureMethodsBound(plugin);
      if (plugin.managedStyle)
        enableStyle(plugin.managedStyle);
      if (!plugin.hidden && !silent)
        logger11.info(`Starting plugin ${plugin.name}`);
      plugin.start?.();
      if (plugin.chatBarButton) {
        addChatBarButton(plugin.name, plugin.chatBarButton);
      }
      if (plugin.contextMenuItems) {
        for (const [location2, def] of Object.entries(plugin.contextMenuItems)) {
          addContextMenuItem(location2, plugin.name, def);
        }
      }
      const unsubs = [];
      pluginUnsubscribers.set(plugin.name, unsubs);
      if (plugin.events) {
        for (const [event, handler2] of Object.entries(plugin.events)) {
          if (handler2)
            unsubs.push(subscribe(event, handler2));
        }
      }
      if (plugin.zustand) {
        for (const [storeName, sub] of Object.entries(plugin.zustand)) {
          const wrappedHandler = (current, prev) => {
            try {
              sub.handler(current, prev);
            } catch (e) {
              logger11.error(`Zustand handler error in ${plugin.name} for ${storeName}:`, e);
            }
          };
          const attach = (store2) => {
            unsubs.push(sub.selector ? store2.subscribe(sub.selector, wrappedHandler) : store2.subscribe(wrappedHandler));
          };
          const store = resolveStoreHook(storeName);
          if (store) {
            attach(store);
            continue;
          }
          let cancelled = false;
          const cancelWait = waitFor(filters.byProps(`use${storeName}`), () => {
            if (cancelled)
              return;
            const resolved = resolveStoreHook(storeName);
            if (resolved)
              attach(resolved);
            else
              logger11.warn(`Store "${storeName}" resolved module missing hook for plugin ${plugin.name}`);
          });
          unsubs.push(() => {
            cancelled = true;
            cancelWait();
          });
        }
      }
      if (plugin.onSettingsChange) {
        const prefix = pluginPath(plugin.name);
        const listener = () => plugin.onSettingsChange();
        SettingsStore3.addPrefixChangeListener(prefix, listener);
        unsubs.push(() => SettingsStore3.removePrefixChangeListener(prefix, listener));
      }
      plugin.started = true;
      return true;
    } catch (e) {
      logger11.error(`Failed to start plugin ${plugin.name}:`, e);
      if (plugin.managedStyle)
        disableStyle(plugin.managedStyle);
      removeChatBarButton(plugin.name);
      removePluginContextMenuItems(plugin);
      runUnsubs(plugin.name);
      return false;
    }
  }
  function stopPlugin(plugin) {
    if (!plugin.started)
      return true;
    try {
      plugin.stop?.();
    } catch (e) {
      logger11.error(`Error in ${plugin.name}.stop():`, e);
    }
    runUnsubs(plugin.name);
    const tryCleanup = (fn) => {
      try {
        fn();
        return false;
      } catch (e) {
        logger11.error(`Cleanup error in ${plugin.name}:`, e);
        return true;
      }
    };
    const failed = [
      tryCleanup(() => removeChatBarButton(plugin.name)),
      tryCleanup(() => removePluginContextMenuItems(plugin)),
      tryCleanup(() => {
        if (plugin.managedStyle && !plugin.patches?.length)
          disableStyle(plugin.managedStyle);
      }),
      tryCleanup(() => {
        if (plugin.cleanupSelectors)
          for (const s of plugin.cleanupSelectors)
            for (const el of document.querySelectorAll(s))
              el.remove();
      })
    ].some(Boolean);
    plugin.started = false;
    if (failed)
      logger11.error(`Plugin ${plugin.name} stopped with errors`);
    return !failed;
  }
  function startAllPlugins(target) {
    for (const [name, plugin] of Object.entries(plugins)) {
      if (!isPluginEnabled(name))
        continue;
      if ((plugin.startAt ?? "Init" /* Init */) !== target)
        continue;
      try {
        startPlugin(plugin);
      } catch (e) {
        logger11.error(`Unexpected error starting ${name}:`, e);
      }
    }
  }
  function registerPlugin(plugin) {
    if (plugins[plugin.name])
      return;
    plugins[plugin.name] = plugin;
    plugin.started = false;
    if (plugin.settings) {
      plugin.settings.pluginName = plugin.name;
    }
  }
  var NEW_PLUGIN_TTL = 2 * 24 * 60 * 60 * 1000;
  function isNewPlugin(name) {
    const seen = getSettingsPluginData().knownPlugins?.[name];
    return seen != null && Date.now() - seen < NEW_PLUGIN_TTL;
  }
  function trackNewPlugins() {
    const known = getSettingsPluginData().knownPlugins ?? {};
    const visible = Object.keys(plugins).filter((n) => !plugins[n].hidden && !plugins[n].required);
    let changed = false;
    for (const name of visible) {
      if (!(name in known)) {
        known[name] = Date.now();
        changed = true;
      }
    }
    if (changed)
      updateSettingsPluginData({ knownPlugins: known });
  }
  function pruneOrphanedPluginSettings() {
    const stored = PlainSettings.plugins;
    const orphaned = Object.keys(stored).filter((name) => !plugins[name]);
    for (const name of orphaned) {
      logger11.info(`Pruning settings for removed plugin: ${name}`);
      delete stored[name];
    }
    if (orphaned.length)
      SettingsStore3.markAsChanged();
  }
  function promoteCleanerDefault() {
    const data = getSettingsPluginData();
    if (data.cleanerDefaultOn)
      return;
    mergePluginSettings("Cleaner", { enabled: true });
    updateSettingsPluginData({ cleanerDefaultOn: 1 });
  }
  function initPluginManager() {
    if (initialized)
      return;
    initialized = true;
    pruneOrphanedPluginSettings();
    trackNewPlugins();
    promoteCleanerDefault();
    const neededApis = new Set;
    for (const [name, plugin] of Object.entries(plugins)) {
      if (!isPluginEnabled(name))
        continue;
      for (const d of plugin.dependencies ?? []) {
        const dep = plugins[d];
        if (!dep) {
          logger11.warn(`Plugin ${name} has unresolved dependency ${d}`);
          continue;
        }
        markAsEnabledDependency(dep);
      }
      if (plugin.chatBarButton)
        neededApis.add("ChatBarButtonAPI");
      if (plugin.contextMenuItems)
        neededApis.add("ContextMenuAPI");
    }
    for (const api of neededApis) {
      const dep = plugins[api];
      if (dep)
        markAsEnabledDependency(dep);
    }
    for (const [name, plugin] of Object.entries(plugins)) {
      const enabled = isPluginEnabled(name);
      if (enabled)
        ensureMethodsBound(plugin);
      if (plugin.patches) {
        try {
          for (const patch of plugin.patches) {
            if (enabled)
              addPatch(patch, name);
            else if (false)
              ;
          }
        } catch (e) {
          logger11.error(`Failed to register patches for ${name}`, e);
        }
      }
    }
  }
  var RETRY_TIMEOUT_MS = 15000;
  var RETRY_DEBOUNCE_MS = 200;
  var getFailed = () => Object.values(plugins).filter((p) => !p.started && isPluginEnabled(p.name) && (p.startAt ?? "Init" /* Init */) === "TurbopackReady" /* TurbopackReady */);
  function retryFailedPlugins() {
    if (!getFailed().length)
      return;
    let retryTimer = null;
    const tryRetry = () => {
      if (retryTimer)
        clearTimeout(retryTimer);
      retryTimer = setTimeout(() => {
        retryTimer = null;
        rescanRuntimeModules();
        for (const p of getFailed())
          startPlugin(p, true);
        if (!getFailed().length) {
          unsub();
          clearTimeout(timeout);
          logger11.info("All previously failed plugins started after late module load");
        }
      }, RETRY_DEBOUNCE_MS);
    };
    const unsub = onModuleLoad(tryRetry);
    const timeout = setTimeout(() => {
      unsub();
      if (retryTimer)
        clearTimeout(retryTimer);
      rescanRuntimeModules();
      const remaining = getFailed();
      for (const p of remaining)
        startPlugin(p, true);
      const stillFailed = getFailed();
      if (stillFailed.length) {
        logger11.warn(`${stillFailed.length} plugin(s) still failed after retry window: ${stillFailed.map((p) => p.name).join(", ")}`);
      }
    }, RETRY_TIMEOUT_MS);
  }

  // src/api/StreamEvents.ts
  var started = false;
  function initStreamEvents() {
    if (started)
      return;
    started = true;
    waitFor(filters.byProps("useChatPageStore"), (mod) => {
      mod.useChatPageStore.subscribe((s) => s.streamedMessageId, (current, prev) => {
        if (!current && prev)
          dispatch("streamEnd", { responseId: prev });
      });
    });
  }

  // src/plugins/_core/fixChrome.chrome/index.ts
  var fixChrome_default = definePlugin({
    name: "FixChrome",
    icon: ChromiumIcon,
    description: "Fixes Chromium-specific performance issues like backdrop blur lag.",
    authors: [Devs.Prism],
    required: true,
    patches: [
      {
        find: "backdrop-blur-",
        all: true,
        replacement: {
          match: /backdrop-blur-(?:\w+|\[[^\]]+\]) ?/g,
          replace: ""
        }
      }
    ]
  });

  // void-css:/tmp/Void/src/plugins/_core/settings/styles.css
  registerStyle("settings", `.void-settings-version,
.void-settings-version * {
    user-select: text;
    font-size: 0.625rem !important;
    line-height: 1rem !important;
}

.void-settings-version {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.75rem;
    opacity: 0.3;
    color: hsl(var(--fg-secondary));
    pointer-events: none;
}

.void-settings-version-link {
    text-decoration: none;
    color: inherit;
    pointer-events: auto;
}

.void-settings-version-link:hover {
    text-decoration: underline;
}

.void-settings-menu-icon {
    width: 1rem;
    height: 1rem;
    margin-inline-end: 0.5rem;
    color: hsl(var(--fg-secondary));
    flex-shrink: 0;
}

.void-settings-plugin-menu {
    max-height: min(24rem, calc(100vh - 6rem));
    overflow-y: auto;
    overscroll-behavior: contain;
}

.void-settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    contain: content;
}

.void-settings-row-body {
    min-width: 0;
    flex: 1;
}

.void-settings-title {
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.25rem;
    color: hsl(var(--fg-primary));
}

.void-settings-description {
    font-size: 0.75rem;
    line-height: 1rem;
    color: hsl(var(--fg-secondary));
}
`);

  // src/api/Themes.ts
  var logger12 = new Logger("Themes", "#c6a0f6");
  function themeStyleId(url) {
    let hash = 0;
    for (let i = 0;i < url.length; i++) {
      hash = (hash << 5) - hash + url.charCodeAt(i) | 0;
    }
    return `void-theme-${(hash >>> 0).toString(36)}`;
  }
  function registerDisabledStyle(id, css) {
    registerStyle(id, css);
    disableStyle(id);
  }
  function parseThemeMeta(css) {
    const header = css.match(/\/\*\*[\s\S]*?\*\//)?.[0] ?? "";
    return {
      name: header.match(/@name\s+(.+)/)?.[1]?.trim() ?? "",
      author: header.match(/@author\s+(.+)/)?.[1]?.trim() ?? "",
      description: header.match(/@description\s+(.+)/)?.[1]?.trim() ?? ""
    };
  }
  function getThemes() {
    const { themes } = getSettingsPluginData();
    return Array.isArray(themes) ? themes : [];
  }
  function setThemes(themes) {
    updateSettingsPluginData({ themes });
  }
  function patchTheme(url, patch) {
    setThemes(getThemes().map((t) => t.url === url ? { ...t, ...patch } : t));
  }
  function isThemeStillActive(url) {
    return isThemesEnabled() && (getThemes().find((t) => t.url === url)?.enabled ?? false);
  }
  function isThemesEnabled() {
    return getSettingsPluginData().themesEnabled !== false;
  }
  function toggleThemeStyles(enabled, filter) {
    const toggle = enabled ? enableStyle : disableStyle;
    for (const t of getThemes()) {
      if (t.enabled && (!filter || filter(t)))
        toggle(themeStyleId(t.url));
    }
  }
  function setThemesEnabled(enabled) {
    updateSettingsPluginData({ themesEnabled: enabled });
    toggleThemeStyles(enabled);
  }
  function isOnlineThemesEnabled() {
    return getSettingsPluginData().onlineThemesEnabled !== false;
  }
  function setOnlineThemesEnabled(enabled) {
    updateSettingsPluginData({ onlineThemesEnabled: enabled });
    toggleThemeStyles(enabled, (t) => !t.local);
  }
  function validateThemeUrl(url) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("Enter a valid URL.");
    }
    if (parsed.protocol !== "https:")
      throw new Error("Enter a valid URL.");
    if (!/\.css(?:[?#]|$)/i.test(url))
      throw new Error("URL must point to a .css file.");
  }
  async function addTheme(url) {
    validateThemeUrl(url);
    if (getThemes().some((t) => t.url === url)) {
      throw new Error("This theme is already added.");
    }
    const resp = await fetchExternal(url);
    if (!resp.ok)
      throw new Error(`Failed to fetch theme (${resp.status}).`);
    const css = await resp.text();
    if (!css.trim())
      throw new Error("Theme file is empty.");
    if (getThemes().some((t) => t.url === url)) {
      throw new Error("This theme is already added.");
    }
    const meta = parseThemeMeta(css);
    const theme = {
      url,
      name: meta.name || (url.split("/").pop() ?? url).replace(/\.css$/i, "").replaceAll(/[-_]/g, " "),
      author: meta.author,
      description: meta.description,
      enabled: false
    };
    registerDisabledStyle(themeStyleId(url), css);
    setThemes([...getThemes(), theme]);
    logger12.info(`Added theme "${theme.name}" from ${url}`);
    return theme;
  }
  function addLocalTheme(name, css) {
    if (!name.trim())
      throw new Error("Name is required.");
    if (!css.trim())
      throw new Error("CSS is required.");
    const id = randomId("local");
    const meta = parseThemeMeta(css);
    const theme = {
      url: id,
      name: name.trim(),
      author: meta.author || "Local",
      description: meta.description,
      enabled: false,
      local: true,
      css
    };
    registerDisabledStyle(themeStyleId(id), css);
    setThemes([...getThemes(), theme]);
    logger12.info(`Added local theme "${theme.name}"`);
    return theme;
  }
  function updateLocalTheme(url, data) {
    const themes = getThemes().map((t) => {
      if (t.url !== url || !t.local)
        return t;
      const updated = { ...t };
      if (data.name != null)
        updated.name = data.name.trim();
      if (data.css != null) {
        updated.css = data.css;
        const meta = parseThemeMeta(data.css);
        if (meta.description)
          updated.description = meta.description;
        if (updated.enabled && isThemesEnabled())
          registerStyle(themeStyleId(url), data.css);
      }
      return updated;
    });
    setThemes(themes);
  }
  function removeTheme(url) {
    unregisterStyle(themeStyleId(url));
    setThemes(getThemes().filter((t) => t.url !== url));
  }
  async function enableTheme(url) {
    patchTheme(url, { enabled: true });
    if (!isThemesEnabled())
      return;
    const theme = getThemes().find((t) => t.url === url);
    if (!theme)
      return;
    if (!theme.local && !isOnlineThemesEnabled())
      return;
    const id = themeStyleId(url);
    if (enableStyle(id))
      return;
    if (theme.local) {
      if (theme.css)
        registerStyle(id, theme.css);
      return;
    }
    let css;
    try {
      const resp = await fetchExternal(url);
      if (!resp.ok) {
        logger12.warn(`Failed to fetch theme CSS (${resp.status}):`, url);
        return;
      }
      if (!isThemeStillActive(url))
        return;
      css = await resp.text();
    } catch (e) {
      logger12.warn("Failed to fetch theme CSS:", url, e);
      return;
    }
    if (!isThemeStillActive(url))
      return;
    registerStyle(id, css);
  }
  function disableTheme(url) {
    patchTheme(url, { enabled: false });
    disableStyle(themeStyleId(url));
  }
  async function loadSavedThemes() {
    if (!isThemesEnabled())
      return;
    const enabled = getThemes().filter((t) => t.enabled);
    for (const t of enabled) {
      if (t.local && t.css) {
        registerStyle(themeStyleId(t.url), t.css);
      }
    }
    const remote = isOnlineThemesEnabled() ? enabled.filter((t) => !t.local) : [];
    const results = await Promise.allSettled(remote.map(async (t) => {
      const resp = await fetchExternal(t.url);
      if (!resp.ok)
        throw new Error(`HTTP ${resp.status}`);
      const css = await resp.text();
      if (!isThemeStillActive(t.url))
        return;
      registerStyle(themeStyleId(t.url), css);
    }));
    for (const [i, result] of results.entries()) {
      if (result.status === "rejected") {
        logger12.warn(`Failed to load theme "${remote[i].name}":`, result.reason);
      }
    }
  }

  // void-css:/tmp/Void/src/components/settings/tabs/CustomCSSTab.css
  registerStyle("CustomCSSTab", `.void-css-root {
    contain: content;
    height: 100%;
    min-height: 0;
}

.void-css-header {
    flex-shrink: 0;
}
`);

  // void-css:/tmp/Void/src/components/settings/CssEditor.css
  registerStyle("CssEditor", `.void-css-wrap {
    flex: 1;
    min-height: 0;
    border: 1px solid hsl(var(--border-l1));
    border-radius: 0.75rem;
    background: transparent;
    overflow: auto;
    display: grid;
}

.void-css-highlight,
.void-css-input {
    grid-area: 1 / 1;
    margin: 0;
    padding: 0.75rem;
    font-family: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, "DejaVu Sans Mono", monospace;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 400;
    letter-spacing: normal;
    word-spacing: normal;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    tab-size: 4;
}

.void-css-input::placeholder {
    font-family: inherit;
    color: hsl(var(--fg-tertiary));
}

.void-css-highlight {
    pointer-events: none;
    color: hsl(var(--fg-tertiary));
}

.void-css-input {
    color: transparent;
    caret-color: hsl(var(--fg-primary));
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    overflow: hidden;
}

.void-css-sel {
    color: hsl(215deg 50% 68%);
}

.void-css-prop {
    color: hsl(195deg 35% 64%);
}

.void-css-val {
    color: hsl(28deg 45% 68%);
}

.void-css-str {
    color: hsl(155deg 30% 64%);
}

.void-css-num {
    color: hsl(265deg 30% 74%);
}

.void-css-com {
    color: hsl(var(--fg-tertiary));
    font-style: italic;
}

.void-css-at {
    color: hsl(335deg 35% 70%);
}

.void-css-brace {
    color: hsl(var(--fg-secondary));
}

.void-css-punct {
    color: hsl(var(--fg-tertiary));
}
`);

  // src/components/settings/CssEditor.tsx
  var cl5 = classNameFactory("void-css-");
  var TOKEN = /\/\*[\s\S]*?\*\/|@[\w-]+|"[^"]*"|'[^']*'|#[\da-fA-F]{3,8}|[\d.]+(?:px|em|rem|%|vh|vw|s|ms|deg|fr|ch)?|[\w-]+|[{}:;,()!]/g;
  function span(cls, text) {
    return `<span class="${cl5(cls)}">${escapeHtml(text)}</span>`;
  }
  function highlightCss(css) {
    let inBlock = 0;
    let afterColon = false;
    let result = "";
    let lastEnd = 0;
    for (const m of css.matchAll(TOKEN)) {
      const idx = m.index ?? 0;
      if (idx > lastEnd)
        result += escapeHtml(css.slice(lastEnd, idx));
      lastEnd = idx + m[0].length;
      const t = m[0];
      if (t.startsWith("/*")) {
        result += span("com", t);
        afterColon = false;
      } else if (t.startsWith("@"))
        result += span("at", t);
      else if (t === "{") {
        inBlock++;
        afterColon = false;
        result += span("brace", t);
      } else if (t === "}") {
        inBlock = Math.max(0, inBlock - 1);
        afterColon = false;
        result += span("brace", t);
      } else if (t === ":") {
        afterColon = inBlock > 0;
        result += span("punct", t);
      } else if (t === ";" || t === ",") {
        afterColon = false;
        result += span("punct", t);
      } else if (t === "(" || t === ")" || t === "!")
        result += span("punct", t);
      else if (t.startsWith('"') || t.startsWith("'"))
        result += span("str", t);
      else if (t.startsWith("#") || /^[\d.]/.test(t))
        result += span("num", t);
      else if (afterColon)
        result += span("val", t);
      else if (inBlock > 0)
        result += span("prop", t);
      else
        result += span("sel", t);
    }
    if (lastEnd < css.length)
      result += escapeHtml(css.slice(lastEnd));
    return result;
  }
  function formatCss(raw) {
    let out = "";
    let indent = 0;
    const pad2 = () => "    ".repeat(indent);
    const tokens = raw.replaceAll(/\s+/g, " ").trim().split(/(?=[{}:;])|(?<=[{}:;])/g);
    for (const t of tokens) {
      const s = t.trim();
      if (!s)
        continue;
      if (s === "{") {
        out += ` {
`;
        indent++;
      } else if (s === "}") {
        indent = Math.max(0, indent - 1);
        out += pad2() + `}

`;
      } else if (s === ";")
        out += `;
`;
      else if (s === ":")
        out += ": ";
      else if (indent > 0)
        out += pad2() + s;
      else
        out += s;
    }
    return out.replaceAll(/\n{3,}/g, `

`).trim() + `
`;
  }
  function CssEditor({ value, onChange, disabled, className, placeholder }) {
    const highlightRef = useRef(null);
    const valueRef = useRef(value);
    valueRef.current = value;
    useLayoutEffect(() => {
      if (highlightRef.current)
        highlightRef.current.innerHTML = highlightCss(value) + `
`;
    }, [value]);
    const handlePaste = useCallback((e) => {
      const pasted = e.clipboardData.getData("text/plain");
      if (!pasted.includes("{") || pasted.includes(`
`))
        return;
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const formatted = formatCss(pasted);
      const next = valueRef.current.slice(0, start) + formatted + valueRef.current.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        const pos = start + formatted.length;
        ta.selectionStart = pos;
        ta.selectionEnd = pos;
      });
    }, [onChange]);
    return /* @__PURE__ */ React.createElement("div", {
      className: classes(cl5("wrap"), className)
    }, /* @__PURE__ */ React.createElement("pre", {
      ref: highlightRef,
      className: cl5("highlight"),
      "aria-hidden": "true"
    }), /* @__PURE__ */ React.createElement("textarea", {
      className: cl5("input"),
      value,
      placeholder,
      onChange: (e) => onChange(e.target.value),
      onPaste: handlePaste,
      disabled,
      spellCheck: false,
      autoComplete: "off",
      autoCorrect: "off",
      autoCapitalize: "off"
    }));
  }

  // src/components/settings/tabs/CustomCSSTab.tsx
  var cl6 = classNameFactory("void-css-");
  var STYLE_ID = "void-custom-css";
  function setCustomCSSEnabled(enabled) {
    updateSettingsPluginData({ customCSSEnabled: enabled });
    if (!enabled)
      return disableStyle(STYLE_ID);
    const css = getSettingsPluginData().customCSS;
    if (typeof css === "string" && css) {
      registerStyle(STYLE_ID, css);
      enableStyle(STYLE_ID);
    }
  }
  function loadSavedCSS() {
    const { customCSS: saved, customCSSEnabled } = getSettingsPluginData();
    if (typeof saved === "string" && saved && customCSSEnabled !== false) {
      registerStyle(STYLE_ID, saved);
    }
    return typeof saved === "string" ? saved : "";
  }
  function CustomCSSTab() {
    const [enabled, setEnabled] = useState(() => getSettingsPluginData().customCSSEnabled !== false);
    const [css, setCss] = useState(loadSavedCSS);
    const apply = useCallback((val) => {
      setCss(val);
      updateSettingsPluginData({ customCSS: val });
      if (getSettingsPluginData().customCSSEnabled !== false)
        registerStyle(STYLE_ID, val);
    }, []);
    const handleToggle = (checked) => {
      setEnabled(checked);
      setCustomCSSEnabled(checked);
    };
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "1rem",
      className: classes(cl6("root"), "void-tab-root")
    }, /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      justifyContent: "space-between",
      className: cl6("header")
    }, /* @__PURE__ */ React.createElement(SectionHeader, {
      title: "Quick CSS",
      description: "Write CSS that applies instantly as you type. Stored only on this device. Disable to keep your code without applying it."
    }), /* @__PURE__ */ React.createElement(Switch, {
      checked: enabled,
      onCheckedChange: handleToggle
    })), /* @__PURE__ */ React.createElement(CssEditor, {
      value: css,
      onChange: apply,
      disabled: !enabled
    }));
  }

  // void-css:/tmp/Void/src/components/settings/shared.css
  registerStyle("shared", `/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

.void-dialog-content {
    width: 32rem;
    max-width: calc(100vw - 2rem);
    max-height: calc(100vh - 2rem);
    padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid hsl(var(--border-l1));
    background: hsl(var(--surface-l1));
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: hidden;
}

.void-dialog-content-sm {
    width: 28rem;
}

.void-dialog-content-md {
    width: 32rem;
}

.void-dialog-content-lg {
    width: 37.5rem;
    min-height: 26.25rem;
}

.void-dialog-overlay-nested {
    background: transparent;
}

.void-dialog-close {
    position: absolute;
    right: 1rem;
    top: 1rem;
    z-index: 10;
}

.void-dialog-header {
    text-align: left;
    padding-right: 2.5rem;
}

.void-dialog-footer {
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: auto;
}

.void-search-bar-input {
    flex: 1;
    min-width: 0;
}

.void-search-bar-select {
    width: 7.5rem;
}

.void-tab-root {
    padding: 0 0.75rem;
}

.void-tab-empty {
    text-align: center;
    padding: 2rem 0;
}
`);

  // void-css:/tmp/Void/src/components/settings/tabs/PluginsTab.css
  registerStyle("PluginsTab", `.void-plugins-reload-banner {
    padding: 0.625rem 0.75rem;
    border-radius: 0.5rem;
    background: hsl(var(--fg-warning) / 12%);
    border: 1px solid hsl(var(--fg-warning) / 40%);
    color: hsl(var(--fg-warning));
}

.void-plugins-reload-text {
    color: inherit;
    flex: 1;
}

.void-plugins-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.125rem;
    border-bottom: 1px solid hsl(var(--border-l1));
}

.void-plugins-tab {
    position: relative;
    color: hsl(var(--fg-secondary));
}

.void-plugins-tab-active {
    color: hsl(var(--fg-primary));
}

.void-plugins-tab-active::after {
    content: "";
    position: absolute;
    inset-inline: 0.5rem;
    bottom: -1px;
    height: 2px;
    border-radius: 1px;
    background: hsl(var(--fg-primary));
}
`);

  // void-css:/tmp/Void/src/components/settings/PluginCard.css
  registerStyle("PluginCard", `.void-plugin-card-required-icon,
.void-plugin-card-badge,
.void-plugin-card-crashed-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: hsl(var(--fg-tertiary));
    flex-shrink: 0;
    line-height: 0;
}

.void-plugin-card-crashed-icon {
    color: hsl(var(--fg-danger));
}

.void-plugin-card-required {
    opacity: 0.4;
}

.void-plugin-card-crashed {
    opacity: 0.5;
    border-color: hsl(var(--fg-danger) / 45%);
}

.void-plugin-card-crashed-icon svg {
    width: 1em;
    height: 1em;
}

.void-plugin-card-pin {
    color: hsl(var(--fg-tertiary));
}

.void-plugin-card-pin-active {
    color: hsl(var(--fg-primary));
}

.void-plugin-card-star {
    color: hsl(var(--fg-tertiary));
}

.void-plugin-card-star-active {
    color: hsl(var(--fg-primary));
}

.void-plugin-card-settings {
    color: hsl(var(--fg-tertiary));
}
`);

  // void-css:/tmp/Void/src/components/settings/BaseCard.css
  registerStyle("BaseCard", `/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

.void-card-root {
    contain: content;
    padding: 0;
    display: flex;
    flex-direction: column;
    border-radius: 0.5rem;
    border: 1px solid hsl(var(--border-l1));
    background: hsl(var(--surface-l1));
    min-height: 7.5rem;
    min-width: 0;
    overflow: hidden;
}

.void-card-body {
    padding: 0.625rem 0.75rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.void-card-name {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
    flex: 1;
    overflow: hidden;
}

.void-card-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.875rem;
    font-weight: 500;
    flex-shrink: 1;
    min-width: 0;
}

.void-card-controls {
    flex-shrink: 0;
}

.void-card-desc {
    font-size: 0.8125rem;
    color: hsl(var(--fg-secondary));
    line-height: 1.5;
    margin-top: 0.25rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.void-card-separator {
    height: 1px;
    background: hsl(var(--border-l1));
}

.void-card-footer {
    display: flex;
    align-items: center;
    padding: 0.375rem 0.75rem;
    gap: 0.375rem;
}

.void-card-author {
    font-size: 0.7rem;
    color: hsl(var(--fg-tertiary));
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.void-card-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.5rem;
    color: hsl(var(--fg-primary));
    background: hsl(var(--fg-primary) / 0.10);
    line-height: 0;
}

.void-card-icon svg {
    width: 0.875rem;
    height: 0.875rem;
}
`);

  // src/components/settings/BaseCard.tsx
  var cl7 = classNameFactory("void-card-");
  function BaseCard({ className, name, nameClassName, icon, badges, description, controls, footer }) {
    return /* @__PURE__ */ React.createElement(Card, {
      className: classes(cl7("root"), className)
    }, /* @__PURE__ */ React.createElement("div", {
      className: cl7("body")
    }, /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.5rem"
    }, /* @__PURE__ */ React.createElement("div", {
      className: classes(cl7("name"), nameClassName)
    }, icon != null && /* @__PURE__ */ React.createElement("span", {
      className: cl7("icon")
    }, icon), /* @__PURE__ */ React.createElement(Tooltip, null, /* @__PURE__ */ React.createElement(TooltipTrigger, {
      asChild: true
    }, /* @__PURE__ */ React.createElement("span", {
      className: cl7("title")
    }, name)), /* @__PURE__ */ React.createElement(TooltipContent, null, name)), badges), /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      gap: "0.375rem",
      className: cl7("controls")
    }, controls)), description && /* @__PURE__ */ React.createElement("div", {
      className: cl7("desc")
    }, description)), /* @__PURE__ */ React.createElement("div", {
      className: cl7("separator")
    }), /* @__PURE__ */ React.createElement("div", {
      className: cl7("footer")
    }, footer));
  }

  // src/components/settings/IconButton.tsx
  function IconButton({ icon: Icon, label, onClick, className }) {
    return /* @__PURE__ */ React.createElement(Button, {
      variant: "tertiary",
      size: "xs",
      shape: "square",
      "aria-label": label,
      onClick,
      className
    }, /* @__PURE__ */ React.createElement(Icon, {
      size: 14
    }));
  }

  // src/components/settings/pluginBadges.tsx
  function TooltipIcon({ icon: Icon, tooltip, className, as = "span" }) {
    return /* @__PURE__ */ React.createElement(Tooltip, null, /* @__PURE__ */ React.createElement(TooltipTrigger, {
      asChild: true
    }, /* @__PURE__ */ React.createElement(Text2, {
      as,
      className
    }, /* @__PURE__ */ React.createElement(Icon, null))), /* @__PURE__ */ React.createElement(TooltipContent, null, tooltip));
  }
  var badges = [
    { key: "dev", icon: GhostFilledIcon, tooltip: "Dev Only" },
    { key: "chrome", icon: ChromiumIcon, tooltip: "Chromium Only" }
  ];
  function PluginBadges({ plugin, className }) {
    return badges.filter((b) => plugin[b.key]).map((b) => /* @__PURE__ */ React.createElement(TooltipIcon, {
      key: b.key,
      icon: b.icon,
      tooltip: b.tooltip,
      className
    }));
  }

  // src/components/settings/utils.ts
  var PLUGIN_CATEGORY_TABS = [
    { id: "favorites", label: "Favorites" },
    { id: "all", label: "All" },
    { id: "chat", label: "Chat" },
    { id: "ui", label: "UI" },
    { id: "privacy", label: "Privacy" },
    { id: "other", label: "Other" }
  ];
  var CATEGORY_TAGS = new Set(["chat", "ui", "privacy"]);
  function pluginMatchesCategory(plugin, category) {
    if (category === "all" || category === "favorites")
      return true;
    const tags = (plugin.tags ?? []).map((t) => t === "sidebar" ? "ui" : t);
    if (category === "other")
      return !plugin.required && !tags.some((t) => CATEGORY_TAGS.has(t));
    return tags.includes(category);
  }
  function isVisibleSetting([, s]) {
    return s.type !== 7 /* CUSTOM */ && !s.hidden;
  }
  function hasVisibleSettings(plugin) {
    return !!plugin.settings?.def && Object.entries(plugin.settings.def).some(isVisibleSetting);
  }

  // src/components/settings/PluginCard.tsx
  var cl8 = classNameFactory("void-plugin-card-");
  function PluginCard({ name, onSettings, onReload }) {
    const plugin = plugins[name];
    const { icon: Icon } = plugin;
    const forceUpdate = useForceUpdater();
    const enabled = isPluginEnabled(name);
    const pinned = isPluginPinned(name);
    const starred = isPluginStarred(name);
    const crashed = enabled && !plugin.started && !plugin.required;
    const handleToggle = () => {
      const needsReload = togglePlugin(name);
      forceUpdate();
      if (needsReload)
        onReload(name);
    };
    const handlePin = () => {
      togglePluginPinned(name);
      forceUpdate();
      dispatch("pluginPin");
    };
    const handleStar = () => {
      togglePluginStarred(name);
      forceUpdate();
      dispatch("pluginStar");
    };
    return /* @__PURE__ */ React.createElement(BaseCard, {
      className: classes(plugin.required && cl8("required"), crashed && cl8("crashed")),
      name,
      icon: Icon ? /* @__PURE__ */ React.createElement(Icon, {
        size: 14
      }) : /* @__PURE__ */ React.createElement(UnplugIcon, {
        size: 14
      }),
      badges: /* @__PURE__ */ React.createElement(React.Fragment, null, crashed && /* @__PURE__ */ React.createElement(TooltipIcon, {
        icon: TriangleAlert,
        tooltip: "This plugin failed to start",
        className: cl8("crashed-icon")
      }), plugin.required && /* @__PURE__ */ React.createElement(TooltipIcon, {
        icon: CircleAlertIcon,
        tooltip: "This plugin is required for Void to work",
        className: cl8("required-icon")
      }), /* @__PURE__ */ React.createElement(PluginBadges, {
        plugin,
        className: cl8("badge")
      }), isNewPlugin(name) && /* @__PURE__ */ React.createElement(Badge, {
        variant: "accent"
      }, "New")),
      description: plugin.description,
      controls: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(IconButton, {
        icon: starred ? StarFilledIcon : StarIcon,
        label: starred ? "Remove from favorites" : "Add to favorites",
        className: classes(cl8("star"), starred && cl8("star-active")),
        onClick: handleStar
      }), !plugin.required && /* @__PURE__ */ React.createElement(IconButton, {
        icon: pinned ? PinFilledIcon : PinIcon,
        label: pinned ? "Unpin from top" : "Pin to top",
        className: classes(cl8("pin"), pinned && cl8("pin-active")),
        onClick: handlePin
      }), hasVisibleSettings(plugin) && /* @__PURE__ */ React.createElement(Tooltip, null, /* @__PURE__ */ React.createElement(TooltipTrigger, {
        asChild: true
      }, /* @__PURE__ */ React.createElement(IconButton, {
        icon: Settings2Icon,
        label: "config",
        className: cl8("settings"),
        onClick: () => onSettings(name)
      })), /* @__PURE__ */ React.createElement(TooltipContent, null, "config")), /* @__PURE__ */ React.createElement(Switch, {
        checked: enabled,
        disabled: plugin.required,
        onCheckedChange: handleToggle
      })),
      footer: /* @__PURE__ */ React.createElement("div", {
        className: "void-card-author"
      }, plugin.authors?.join(", ") || " ")
    });
  }

  // void-css:/tmp/Void/src/components/settings/tabs/PluginDialog.css
  registerStyle("PluginDialog", `.void-plugin-dialog-settings-list>.px-3 {
    padding-left: 0;
    padding-right: 0;
}

.void-plugin-dialog-settings {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
}

.void-plugin-dialog-settings-list {
    margin-top: 0.5rem;
    min-height: 0;
    max-height: min(24rem, calc(100vh - 18rem));
    overflow: auto;
    overscroll-behavior: contain;
}

.void-plugin-dialog-footer {
    margin-top: auto;
    justify-content: flex-end;
}
`);

  // void-css:/tmp/Void/src/components/settings/SettingField.css
  registerStyle("SettingField", `.void-setting-slider-row {
    align-items: center;
    width: 100%;
}

.void-setting-slider-wrap {
    position: relative;
    flex: 1;
    min-width: 0;
    height: 1.25rem;
}

.void-setting-slider-rail {
    position: absolute;
    left: 0.5rem;
    right: 0.5rem;
    top: 50%;
    height: 0.375rem;
    transform: translateY(-50%);
    border-radius: 999px;
    background: hsl(var(--fg-primary) / 22%);
    pointer-events: none;
}

.void-setting-slider-fill {
    height: 100%;
    border-radius: inherit;
    background: hsl(var(--fg-primary));
}

.void-setting-slider-thumb {
    position: absolute;
    top: 50%;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: hsl(var(--fg-primary));
    transform: translate(-50%, -50%);
    pointer-events: none;
}

.void-setting-slider {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    opacity: 0;
    cursor: pointer;
}

.void-setting-slider-wrap:focus-within {
    outline: 2px solid hsl(var(--fg-primary));
    outline-offset: 2px;
    border-radius: 0.5rem;
}

.void-setting-slider-value {
    font-variant-numeric: tabular-nums;
    min-width: 3ch;
    text-align: right;
    flex-shrink: 0;
}

.void-setting-number-input {
    width: 6rem;
}

.void-setting-string-input {
    width: 100%;
}
`);

  // src/components/settings/SettingField.tsx
  var cl9 = classNameFactory("void-setting-");
  function usePluginSetting(pluginName, id, setting) {
    const resolve = () => (Settings.plugins[pluginName] ?? {})[id] ?? resolveDefault(setting);
    const [value, setValue] = useState(resolve);
    useEffect(() => {
      const path = pluginPath(pluginName, id);
      const listener = () => setValue(resolve());
      SettingsStore3.addChangeListener(path, listener);
      return () => SettingsStore3.removeChangeListener(path, listener);
    }, [pluginName, id]);
    const update = useCallback((val) => {
      setValue(val);
      mergePluginSettings(pluginName, { [id]: val });
      setting.onChange?.(val);
      if (setting.restartNeeded)
        dispatch("reloadNeeded");
    }, [id, pluginName, setting]);
    return [value, update];
  }
  function SettingLabel({ id, setting }) {
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0"
    }, /* @__PURE__ */ React.createElement(SettingsTitle, null, humanizeKey(id)), setting.description && /* @__PURE__ */ React.createElement(SettingsDescription, null, setting.description));
  }
  function LabeledField({ id, setting, children }) {
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.5rem"
    }, /* @__PURE__ */ React.createElement(SettingLabel, {
      id,
      setting
    }), children);
  }
  var BooleanField = ({ id, setting, pluginName }) => {
    const [value, update] = usePluginSetting(pluginName, id, setting);
    return /* @__PURE__ */ React.createElement(SettingsRow, {
      action: /* @__PURE__ */ React.createElement(Switch, {
        checked: !!value,
        onCheckedChange: update
      })
    }, /* @__PURE__ */ React.createElement(SettingLabel, {
      id,
      setting
    }));
  };
  var SelectField = ({ id, setting, pluginName }) => {
    const [value, update] = usePluginSetting(pluginName, id, setting);
    const { options } = setting;
    const valueMap = useMemo(() => new Map(options.map((o) => [String(o.value), o.value])), [options]);
    return /* @__PURE__ */ React.createElement(SettingsRow, {
      action: /* @__PURE__ */ React.createElement(Select, {
        value: String(value ?? ""),
        onValueChange: (v) => update(valueMap.get(v) ?? v)
      }, /* @__PURE__ */ React.createElement(SelectTrigger, null, /* @__PURE__ */ React.createElement(SelectValue, null)), /* @__PURE__ */ React.createElement(SelectContent, null, options.map((o) => /* @__PURE__ */ React.createElement(SelectItem, {
        key: String(o.value),
        value: String(o.value)
      }, o.label))))
    }, /* @__PURE__ */ React.createElement(SettingLabel, {
      id,
      setting
    }));
  };
  var SliderField = ({ id, setting, pluginName }) => {
    const [value, update] = usePluginSetting(pluginName, id, setting);
    const { min, max } = setting;
    const n = typeof value === "number" ? value : min;
    const pct = max === min ? 100 : (n - min) / (max - min) * 100;
    return /* @__PURE__ */ React.createElement(LabeledField, {
      id,
      setting
    }, /* @__PURE__ */ React.createElement(Flex, {
      gap: "0.75rem",
      className: cl9("slider-row")
    }, /* @__PURE__ */ React.createElement("div", {
      className: cl9("slider-wrap")
    }, /* @__PURE__ */ React.createElement("div", {
      className: cl9("slider-rail"),
      "aria-hidden": "true"
    }, /* @__PURE__ */ React.createElement("div", {
      className: cl9("slider-fill"),
      style: { width: `${pct}%` }
    }), /* @__PURE__ */ React.createElement("div", {
      className: cl9("slider-thumb"),
      style: { left: `${pct}%` }
    })), /* @__PURE__ */ React.createElement("input", {
      type: "range",
      min,
      max,
      step: 1,
      value: n,
      onChange: (e) => {
        const v = Number(e.target.value);
        if (!Number.isNaN(v))
          update(v);
      },
      className: cl9("slider"),
      "aria-valuemin": min,
      "aria-valuemax": max,
      "aria-valuenow": n
    })), /* @__PURE__ */ React.createElement(Text2, {
      size: "sm",
      color: "secondary",
      className: cl9("slider-value")
    }, n)));
  };
  var ComponentField = ({ setting, pluginName }) => {
    const [, update] = usePluginSetting(pluginName, "component", setting);
    const Comp = setting.component;
    return /* @__PURE__ */ React.createElement(Comp, {
      setValue: update,
      option: setting
    });
  };
  var NumberField = ({ id, setting, pluginName }) => {
    const [value, update] = usePluginSetting(pluginName, id, setting);
    return /* @__PURE__ */ React.createElement(LabeledField, {
      id,
      setting
    }, /* @__PURE__ */ React.createElement(Input, {
      type: "number",
      value: String(value ?? ""),
      onChange: (e) => {
        const n = Number(e.target.value);
        if (!isNaN(n))
          update(n);
      },
      className: cl9("number-input")
    }));
  };
  var BigIntField = ({ id, setting, pluginName }) => {
    const [value, update] = usePluginSetting(pluginName, id, setting);
    return /* @__PURE__ */ React.createElement(LabeledField, {
      id,
      setting
    }, /* @__PURE__ */ React.createElement(Input, {
      type: "text",
      inputMode: "numeric",
      value: String(value ?? ""),
      onChange: (e) => {
        const raw = e.target.value.trim();
        if (!raw)
          return update(0n);
        try {
          update(BigInt(raw));
        } catch {}
      },
      className: cl9("number-input")
    }));
  };
  var StringField = ({ id, setting, pluginName }) => {
    const [value, update] = usePluginSetting(pluginName, id, setting);
    return /* @__PURE__ */ React.createElement(LabeledField, {
      id,
      setting
    }, /* @__PURE__ */ React.createElement(Input, {
      type: "text",
      value: String(value ?? ""),
      onChange: (e) => update(e.target.value),
      placeholder: setting.placeholder,
      className: cl9("string-input")
    }));
  };
  var FIELD_MAP = {
    [3 /* BOOLEAN */]: BooleanField,
    [4 /* SELECT */]: SelectField,
    [5 /* SLIDER */]: SliderField,
    [6 /* COMPONENT */]: ComponentField,
    [1 /* NUMBER */]: NumberField,
    [2 /* BIGINT */]: BigIntField,
    [0 /* STRING */]: StringField,
    [7 /* CUSTOM */]: null
  };
  function SettingField({ id, setting, pluginName }) {
    const Field = FIELD_MAP[setting.type];
    if (!Field)
      return null;
    return /* @__PURE__ */ React.createElement(Field, {
      id,
      setting,
      pluginName
    });
  }

  // src/components/settings/tabs/VoidDialogShell.tsx
  function VoidDialogShell({ title, subtitle, onClose, children, size = "md", nested }) {
    return /* @__PURE__ */ React.createElement(Dialog, {
      open: true,
      onOpenChange: (v) => {
        if (!v)
          onClose();
      }
    }, /* @__PURE__ */ React.createElement(DialogContent, {
      className: classes("void-dialog-content", `void-dialog-content-${size}`),
      overlayClassname: nested ? "void-dialog-overlay-nested" : undefined,
      ...subtitle ? {} : { "aria-describedby": undefined }
    }, /* @__PURE__ */ React.createElement(DialogClose, {
      asChild: true
    }, /* @__PURE__ */ React.createElement(Button, {
      variant: "tertiary",
      size: "sm",
      shape: "square",
      "aria-label": "Close",
      className: "void-dialog-close"
    }, /* @__PURE__ */ React.createElement(Cross2Icon, null))), /* @__PURE__ */ React.createElement(DialogHeader, {
      className: "void-dialog-header"
    }, /* @__PURE__ */ React.createElement(DialogTitle, null, title), subtitle && /* @__PURE__ */ React.createElement(DialogDescription, null, subtitle)), children));
  }
  function DialogField({ label, className, children }) {
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.25rem",
      className
    }, /* @__PURE__ */ React.createElement(Text2, {
      size: "sm",
      weight: "medium"
    }, label), children);
  }
  function DialogActions({ className, onCancel, confirmLabel, onConfirm, confirmDisabled }) {
    return /* @__PURE__ */ React.createElement(DialogFooter, {
      className: classes("void-dialog-footer", className)
    }, /* @__PURE__ */ React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      onClick: onCancel
    }, "Cancel"), /* @__PURE__ */ React.createElement(Button, {
      variant: "primary",
      size: "sm",
      onClick: onConfirm,
      disabled: confirmDisabled
    }, confirmLabel));
  }

  // src/components/settings/tabs/PluginDialog.tsx
  var cl10 = classNameFactory("void-plugin-dialog-");
  function PluginDialog({ plugin, onClose }) {
    const entries = useMemo(() => Object.entries(plugin.settings?.def ?? {}).filter(isVisibleSetting), [plugin.settings?.def]);
    const [resetOpen, setResetOpen] = useState(false);
    const resetSettings = useCallback(() => {
      const current = Settings.plugins[plugin.name];
      if (!current)
        return;
      const entryKeys = new Set(entries.map(([key]) => key));
      Settings.plugins[plugin.name] = Object.fromEntries(Object.entries(current).filter(([k]) => !entryKeys.has(k)));
    }, [plugin.name, entries]);
    return /* @__PURE__ */ React.createElement(VoidDialogShell, {
      title: plugin.name,
      subtitle: plugin.description,
      onClose,
      nested: true
    }, /* @__PURE__ */ React.createElement(Separator, null), !!plugin.authors?.length && /* @__PURE__ */ React.createElement(DialogField, {
      label: "Authors"
    }, /* @__PURE__ */ React.createElement(Paragraph, null, plugin.authors.join(", "))), /* @__PURE__ */ React.createElement(DialogField, {
      label: "Settings",
      className: cl10("settings")
    }, entries.length ? /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.75rem",
      className: cl10("settings-list")
    }, entries.map(([key, setting]) => /* @__PURE__ */ React.createElement(SettingField, {
      key,
      id: key,
      setting,
      pluginName: plugin.name
    }))) : /* @__PURE__ */ React.createElement(Paragraph, null, "No configurable settings.")), !!entries.length && /* @__PURE__ */ React.createElement(DialogFooter, {
      className: cl10("footer")
    }, /* @__PURE__ */ React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      onClick: () => setResetOpen(true)
    }, "Reset")), /* @__PURE__ */ React.createElement(ConfirmDialog, {
      open: resetOpen,
      onOpenChange: setResetOpen,
      title: "Reset settings",
      description: "Reset this plugin's settings to defaults? This cannot be undone.",
      confirmText: "Reset",
      danger: true,
      onConfirm: resetSettings
    }));
  }

  // src/components/settings/tabs/SearchFilterBar.tsx
  function SearchFilterBar({ placeholder, search: search2, onSearchChange, filter, onFilterChange, options }) {
    return /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      gap: "0.75rem"
    }, /* @__PURE__ */ React.createElement(Input, {
      type: "text",
      placeholder,
      value: search2,
      onChange: (e) => onSearchChange(e.target.value),
      className: "void-search-bar-input"
    }), /* @__PURE__ */ React.createElement(Select, {
      value: filter,
      onValueChange: (v) => onFilterChange(v)
    }, /* @__PURE__ */ React.createElement(SelectTrigger, {
      className: "void-search-bar-select"
    }, /* @__PURE__ */ React.createElement(SelectValue, null)), /* @__PURE__ */ React.createElement(SelectContent, null, options.map((o) => /* @__PURE__ */ React.createElement(SelectItem, {
      key: o.value,
      value: o.value
    }, o.label)))));
  }

  // src/components/settings/tabs/PluginsTab.tsx
  var cl11 = classNameFactory("void-plugins-");
  var FILTER_OPTIONS = [
    { value: "all", label: "All" },
    { value: "enabled", label: "Enabled" },
    { value: "disabled", label: "Disabled" }
  ];
  var getPluginKey = (name) => `${name} ${plugins[name].description ?? ""}`;
  function filterByEnabled(list, filter) {
    if (filter === "all")
      return list;
    const enabled = filter === "enabled";
    return list.filter((n) => isPluginEnabled(n) === enabled);
  }
  function emptyHint(search2, category) {
    if (search2)
      return "No plugins match your search.";
    if (category === "favorites")
      return "No favorites yet. Star a plugin to see it here.";
    return "No plugins available.";
  }
  function sortPinnedFirst(list) {
    const pinned = getPinnedPlugins();
    if (!pinned.length)
      return list;
    const rank = new Map(pinned.map((n, i) => [n, i]));
    return list.toSorted((a, b) => {
      const pa = rank.has(a);
      const pb = rank.has(b);
      if (pa !== pb)
        return pa ? -1 : 1;
      if (pa)
        return (rank.get(a) ?? 0) - (rank.get(b) ?? 0);
      return 0;
    });
  }
  var pendingPluginDialog = null;
  function setPendingPluginDialog(name) {
    pendingPluginDialog = name;
  }
  function consumePendingPluginDialog() {
    const name = pendingPluginDialog;
    pendingPluginDialog = null;
    return name;
  }
  function PluginsTab() {
    const [search2, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [category, setCategory] = useState("favorites");
    const [dialogName, setDialogName] = useState(null);
    const [showReload, setShowReload] = useState(false);
    const [needsReload, setNeedsReload] = useState(false);
    const [toggleTick, setToggleTick] = useState(0);
    const { userPlugins, requiredPlugins } = useMemo(() => {
      const userPlugins2 = [];
      const requiredPlugins2 = [];
      for (const n of Object.keys(plugins).toSorted((a, b) => a.localeCompare(b))) {
        if (plugins[n].hidden)
          continue;
        (plugins[n].required ? requiredPlugins2 : userPlugins2).push(n);
      }
      return { userPlugins: userPlugins2, requiredPlugins: requiredPlugins2 };
    }, []);
    const initialStatesRef = useRef(null);
    const changedPluginsRef = useRef(new Set);
    const dismissedRef = useRef(false);
    useEffect(() => {
      if (initialStatesRef.current)
        return;
      const map = new Map;
      for (const n of [...userPlugins, ...requiredPlugins])
        map.set(n, isPluginEnabled(n));
      initialStatesRef.current = map;
    }, [userPlugins, requiredPlugins]);
    useEffect(() => {
      const pending = consumePendingPluginDialog();
      if (pending) {
        setCategory("all");
        setDialogName(pending);
      }
    }, []);
    useEffect(() => {
      const bump = () => setToggleTick((t) => t + 1);
      const unsubs = [subscribe("pluginToggle", bump), subscribe("pluginPin", bump), subscribe("pluginStar", bump)];
      return () => {
        for (const u of unsubs)
          u();
      };
    }, []);
    useEffect(() => subscribe("reloadNeeded", () => {
      changedPluginsRef.current.add("__settings__");
      setNeedsReload(true);
      if (!dismissedRef.current)
        setShowReload(true);
    }), []);
    const visibleTabs = useMemo(() => PLUGIN_CATEGORY_TABS.filter((t) => {
      if (t.id === "favorites" || t.id === "all")
        return true;
      const pool = t.id === "other" ? userPlugins : [...userPlugins, ...requiredPlugins];
      return pool.some((n) => pluginMatchesCategory(plugins[n], t.id));
    }), [userPlugins, requiredPlugins]);
    const { tabUser, tabRequired } = useMemo(() => {
      if (category === "favorites") {
        const starred = getStarredPlugins().filter((n) => {
          const p = plugins[n];
          return !!p && !p.hidden;
        });
        return { tabUser: filterByEnabled(starred, filter), tabRequired: [] };
      }
      if (category === "all") {
        return {
          tabUser: sortPinnedFirst(filterByEnabled(userPlugins, filter)),
          tabRequired: filterByEnabled(requiredPlugins, filter)
        };
      }
      const matchingUser = userPlugins.filter((n) => pluginMatchesCategory(plugins[n], category));
      const matchingRequired = requiredPlugins.filter((n) => pluginMatchesCategory(plugins[n], category));
      return {
        tabUser: sortPinnedFirst(filterByEnabled([...matchingUser, ...matchingRequired], filter)),
        tabRequired: []
      };
    }, [category, filter, userPlugins, requiredPlugins, toggleTick]);
    const filteredUser = useFiltered(tabUser, search2, getPluginKey);
    const filteredRequired = useFiltered(tabRequired, search2, getPluginKey);
    const dialogPlugin = dialogName ? plugins[dialogName] : null;
    const hasResults = filteredUser.length > 0 || filteredRequired.length > 0;
    const onReload = useCallback((pluginName) => {
      const initialStates = initialStatesRef.current;
      if (!initialStates)
        return;
      const changed = changedPluginsRef.current;
      if (isPluginEnabled(pluginName) === initialStates.get(pluginName))
        changed.delete(pluginName);
      else
        changed.add(pluginName);
      if (!changed.size) {
        setNeedsReload(false);
        setShowReload(false);
        dismissedRef.current = false;
      } else {
        setNeedsReload(true);
        if (!dismissedRef.current)
          setShowReload(true);
      }
    }, []);
    const onDismiss = useCallback(() => {
      dismissedRef.current = true;
      setShowReload(false);
    }, []);
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "1rem",
      className: "void-tab-root"
    }, /* @__PURE__ */ React.createElement(SectionHeader, {
      title: "Plugins",
      description: "Turn Void features on or off. Some require a reload to apply. Click the sliders icon to configure a plugin."
    }), needsReload && !showReload && /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      className: cl11("reload-banner")
    }, /* @__PURE__ */ React.createElement(Text2, {
      size: "xs",
      className: cl11("reload-text")
    }, "Reload the page to apply plugin changes."), /* @__PURE__ */ React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      onClick: () => location.reload()
    }, "Reload")), /* @__PURE__ */ React.createElement(Flex, {
      className: cl11("tabs"),
      gap: "0.125rem",
      flexWrap: "wrap"
    }, visibleTabs.map((t) => /* @__PURE__ */ React.createElement(Button, {
      key: t.id,
      variant: "tertiary",
      size: "sm",
      className: classes(cl11("tab"), category === t.id && cl11("tab-active")),
      onClick: () => setCategory(t.id)
    }, t.label))), /* @__PURE__ */ React.createElement(SearchFilterBar, {
      placeholder: `Search ${tabUser.length + tabRequired.length} plugins...`,
      search: search2,
      onSearchChange: setSearch,
      filter,
      onFilterChange: setFilter,
      options: FILTER_OPTIONS
    }), filteredUser.length > 0 && /* @__PURE__ */ React.createElement(Grid, {
      columns: "repeat(2, 1fr)"
    }, filteredUser.map((n) => /* @__PURE__ */ React.createElement(ErrorBoundary, {
      key: n,
      fallback: null
    }, /* @__PURE__ */ React.createElement(PluginCard, {
      name: n,
      onSettings: setDialogName,
      onReload
    })))), filteredRequired.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Separator, null), /* @__PURE__ */ React.createElement(Grid, {
      columns: "repeat(2, 1fr)"
    }, filteredRequired.map((n) => /* @__PURE__ */ React.createElement(ErrorBoundary, {
      key: n,
      fallback: null
    }, /* @__PURE__ */ React.createElement(PluginCard, {
      name: n,
      onSettings: setDialogName,
      onReload
    }))))), !hasResults && /* @__PURE__ */ React.createElement(Paragraph, {
      color: "secondary",
      className: "void-tab-empty"
    }, emptyHint(search2, category)), dialogPlugin && /* @__PURE__ */ React.createElement(PluginDialog, {
      plugin: dialogPlugin,
      onClose: () => setDialogName(null)
    }), /* @__PURE__ */ React.createElement(ConfirmDialog, {
      open: showReload,
      onOpenChange: (v) => {
        if (!v)
          onDismiss();
      },
      title: "Reload required",
      description: "This plugin patches Grok's code, so you need to reload the page.",
      confirmText: "Reload",
      cancelText: "Later",
      onConfirm: () => location.reload()
    }));
  }

  // void-css:/tmp/Void/src/components/settings/tabs/ThemesTab.css
  registerStyle("ThemesTab", `.void-themes-add-error {
    color: hsl(var(--fg-danger));
}

.void-themes-local-css-field {
    flex: 1;
    min-height: 0;
}

.void-themes-local-editor {
    min-height: 15.625rem;
    max-height: 25rem;
    resize: vertical;
}

.void-themes-local-footer {
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: auto;
}
`);

  // void-css:/tmp/Void/src/components/settings/ThemeCard.css
  registerStyle("ThemeCard", `.void-theme-card-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.void-theme-card-footer-icon {
    flex-shrink: 0;
    color: hsl(var(--fg-tertiary));
}
`);

  // src/components/settings/ThemeCard.tsx
  var logger13 = new Logger("ThemeCard");
  var cl12 = classNameFactory("void-theme-card-");
  function ThemeCard({ theme, onRemove, onToggle, onEdit }) {
    const handleToggle = () => {
      if (theme.enabled)
        disableTheme(theme.url);
      else
        enableTheme(theme.url).catch((e) => logger13.error("Failed to enable theme:", e));
      onToggle();
    };
    const SourceIcon = theme.local ? FolderIcon : GlobeIcon;
    return /* @__PURE__ */ React.createElement(BaseCard, {
      name: theme.name ?? theme.url,
      nameClassName: cl12("name"),
      icon: /* @__PURE__ */ React.createElement(PaletteIcon, {
        size: 14
      }),
      description: theme.description,
      controls: /* @__PURE__ */ React.createElement(React.Fragment, null, theme.local ? /* @__PURE__ */ React.createElement(IconButton, {
        icon: PencilIcon,
        label: "Edit",
        onClick: onEdit
      }) : /* @__PURE__ */ React.createElement(IconButton, {
        icon: CopyIcon,
        label: "Copy URL",
        onClick: () => {
          copyToClipboard(theme.url).catch((e) => logger13.error("Failed to copy URL:", e));
        }
      }), /* @__PURE__ */ React.createElement(IconButton, {
        icon: Trash2Icon,
        label: "Remove",
        onClick: () => onRemove(theme.url)
      }), /* @__PURE__ */ React.createElement(Switch, {
        checked: theme.enabled,
        onCheckedChange: handleToggle
      })),
      footer: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(SourceIcon, {
        size: 12,
        className: cl12("footer-icon")
      }), /* @__PURE__ */ React.createElement("div", {
        className: "void-card-author"
      }, theme.author ?? " "))
    });
  }

  // src/components/settings/tabs/ThemesTab.tsx
  var cl13 = classNameFactory("void-themes-");
  var FILTER_OPTIONS2 = [
    { value: "all", label: "All" },
    { value: "enabled", label: "Enabled" },
    { value: "disabled", label: "Disabled" },
    { value: "online", label: "Online" },
    { value: "local", label: "Local" }
  ];
  var getThemeKey = (t) => `${t.name} ${t.description ?? ""} ${t.author ?? ""}`;
  function OnlineThemeDialog({ onClose, onSave }) {
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const handleImport = async () => {
      const trimmed = url.trim();
      if (!trimmed)
        return;
      setError("");
      setLoading(true);
      try {
        await addTheme(trimmed);
        onSave();
        onClose();
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    };
    return /* @__PURE__ */ React.createElement(VoidDialogShell, {
      title: "Add Online Theme",
      onClose,
      size: "sm",
      nested: true
    }, /* @__PURE__ */ React.createElement(DialogField, {
      label: "URL"
    }, /* @__PURE__ */ React.createElement(Input, {
      type: "text",
      placeholder: "https://raw.githubusercontent.com/...",
      value: url,
      onChange: (e) => {
        setUrl(e.target.value);
        setError("");
      },
      onKeyDown: (e) => {
        if (e.key === "Enter")
          handleImport();
      }
    })), error && /* @__PURE__ */ React.createElement(Text2, {
      size: "xs",
      className: cl13("add-error")
    }, error), /* @__PURE__ */ React.createElement(DialogActions, {
      className: cl13("local-footer"),
      onCancel: onClose,
      confirmLabel: loading ? "Importing..." : "Import",
      onConfirm: handleImport,
      confirmDisabled: loading || !url.trim()
    }));
  }
  function LocalThemeDialog({ onClose, theme, onSave }) {
    const [name, setName] = useState(theme?.name ?? "");
    const [css, setCss] = useState(theme?.css ?? "");
    const [error, setError] = useState("");
    const handleSave = () => {
      setError("");
      try {
        if (theme) {
          updateLocalTheme(theme.url, { name, css });
        } else {
          addLocalTheme(name, css);
        }
        onSave();
        onClose();
      } catch (e) {
        setError(errorMessage(e));
      }
    };
    return /* @__PURE__ */ React.createElement(VoidDialogShell, {
      title: theme ? "Edit Local Theme" : "New Local Theme",
      onClose,
      size: "lg",
      nested: true
    }, /* @__PURE__ */ React.createElement(DialogField, {
      label: "Name"
    }, /* @__PURE__ */ React.createElement(Input, {
      type: "text",
      placeholder: "My Theme",
      value: name,
      onChange: (e) => setName(e.target.value)
    })), /* @__PURE__ */ React.createElement(DialogField, {
      label: "CSS",
      className: cl13("local-css-field")
    }, /* @__PURE__ */ React.createElement(CssEditor, {
      className: cl13("local-editor"),
      value: css,
      onChange: setCss,
      placeholder: "Paste your CSS here..."
    })), error && /* @__PURE__ */ React.createElement(Text2, {
      size: "xs",
      className: cl13("add-error")
    }, error), /* @__PURE__ */ React.createElement(DialogActions, {
      className: cl13("local-footer"),
      onCancel: onClose,
      confirmLabel: theme ? "Save" : "Create",
      onConfirm: handleSave,
      confirmDisabled: !name.trim() || !css.trim()
    }));
  }
  function ThemesTab() {
    const [search2, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [themes, setThemes2] = useState(getThemes);
    const [localDialogOpen, setLocalDialogOpen] = useState(false);
    const [onlineDialogOpen, setOnlineDialogOpen] = useState(false);
    const [editingTheme, setEditingTheme] = useState();
    const refreshThemes = () => setThemes2(getThemes());
    const visible = useMemo(() => {
      switch (filter) {
        case "enabled":
          return themes.filter((t) => t.enabled);
        case "disabled":
          return themes.filter((t) => !t.enabled);
        case "online":
          return themes.filter((t) => !t.local);
        case "local":
          return themes.filter((t) => t.local);
        default:
          return themes;
      }
    }, [themes, filter]);
    const filtered = useFiltered(visible, search2, getThemeKey);
    const [removeUrl, setRemoveUrl] = useState(null);
    const removeTarget = removeUrl ? themes.find((t) => t.url === removeUrl) : null;
    const handleRemove = () => {
      if (!removeUrl)
        return;
      removeTheme(removeUrl);
      setRemoveUrl(null);
      refreshThemes();
    };
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "1rem",
      className: "void-tab-root"
    }, /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.75rem"
    }, /* @__PURE__ */ React.createElement(SectionHeader, {
      title: "Online Themes",
      description: "Load themes from a URL. Re-fetched on every page load so updates apply automatically."
    }), /* @__PURE__ */ React.createElement(Button, {
      variant: "secondary",
      size: "md",
      onClick: () => setOnlineDialogOpen(true)
    }, "Manage")), /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.75rem"
    }, /* @__PURE__ */ React.createElement(SectionHeader, {
      title: "Local Themes",
      description: "Custom CSS stored only on this device. Good for private tweaks or drafts you don't want to host publicly."
    }), /* @__PURE__ */ React.createElement(Button, {
      variant: "secondary",
      size: "md",
      onClick: () => {
        setEditingTheme(undefined);
        setLocalDialogOpen(true);
      }
    }, "Manage")), /* @__PURE__ */ React.createElement(Separator, null), themes.length > 0 && /* @__PURE__ */ React.createElement(SearchFilterBar, {
      placeholder: `Search ${themes.length} themes...`,
      search: search2,
      onSearchChange: setSearch,
      filter,
      onFilterChange: setFilter,
      options: FILTER_OPTIONS2
    }), filtered.length > 0 && /* @__PURE__ */ React.createElement(Grid, {
      columns: "repeat(2, 1fr)"
    }, filtered.map((t) => /* @__PURE__ */ React.createElement(ErrorBoundary, {
      key: t.url,
      fallback: null
    }, /* @__PURE__ */ React.createElement(ThemeCard, {
      theme: t,
      onRemove: setRemoveUrl,
      onToggle: refreshThemes,
      onEdit: t.local ? () => {
        setEditingTheme(t);
        setLocalDialogOpen(true);
      } : undefined
    })))), themes.length > 0 && !filtered.length && /* @__PURE__ */ React.createElement(Paragraph, {
      color: "secondary",
      className: "void-tab-empty"
    }, "No themes match your search."), /* @__PURE__ */ React.createElement(ConfirmDialog, {
      open: removeUrl != null,
      onOpenChange: (v) => {
        if (!v)
          setRemoveUrl(null);
      },
      title: "Remove theme",
      description: `Are you sure you want to remove "${removeTarget?.name ?? "this theme"}"?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      danger: true,
      onConfirm: handleRemove
    }), onlineDialogOpen && /* @__PURE__ */ React.createElement(OnlineThemeDialog, {
      onClose: () => setOnlineDialogOpen(false),
      onSave: refreshThemes
    }), localDialogOpen && /* @__PURE__ */ React.createElement(LocalThemeDialog, {
      onClose: () => setLocalDialogOpen(false),
      theme: editingTheme,
      onSave: refreshThemes
    }));
  }
  // src/components/settings/tabs/index.ts
  var CustomCSSTab2 = ErrorBoundary.wrap(CustomCSSTab);
  var PluginsTab2 = ErrorBoundary.wrap(PluginsTab);
  var ThemesTab2 = ErrorBoundary.wrap(ThemesTab);

  // void-css:/tmp/Void/src/plugins/experiments/styles.css
  registerStyle("experiments", `.void-experiments-section {
    padding: 0 0.75rem;
}

.void-experiments-modified {
    margin-left: 0.375rem;
    color: hsl(var(--fg-warning));
}

.void-experiments-warning {
    margin: 0 0.75rem;
    padding: 0.625rem 0.75rem;
    border-radius: 0.5rem;
    background: hsl(var(--fg-warning) / 12%);
    border-color: hsl(var(--fg-warning) / 40%);
    color: hsl(var(--fg-warning));
}

.void-experiments-warning-text {
    color: inherit;
    line-height: 1.5;
}

.void-experiments-clear-btn {
    flex-shrink: 0;
    border-color: hsl(var(--fg-warning) / 40%);
    color: hsl(var(--fg-warning));
}

.void-experiments-search-input {
    flex: 1;
}

.void-experiments-filter-select {
    width: 7rem;
}

.void-experiments-empty {
    text-align: center;
    padding: 2rem;
}

.void-experiments-badge {
    margin-left: 0.375rem;
}
`);

  // src/api/Notifications.ts
  var ToastType;
  ((ToastType2) => {
    ToastType2[ToastType2["MESSAGE"] = 0] = "MESSAGE";
    ToastType2[ToastType2["SUCCESS"] = 1] = "SUCCESS";
    ToastType2[ToastType2["ERROR"] = 2] = "ERROR";
    ToastType2[ToastType2["INFO"] = 3] = "INFO";
    ToastType2[ToastType2["WARNING"] = 4] = "WARNING";
    ToastType2[ToastType2["LOADING"] = 5] = "LOADING";
  })(ToastType ||= {});
  var TOAST_FN = {
    [0 /* MESSAGE */]: null,
    [1 /* SUCCESS */]: "success",
    [2 /* ERROR */]: "error",
    [3 /* INFO */]: "info",
    [4 /* WARNING */]: "warning",
    [5 /* LOADING */]: "loading"
  };
  var logger14 = new Logger("Notifications");
  function showToast(message, type = 0 /* MESSAGE */, options) {
    if (!Toaster.toast) {
      logger14.warn("showToast called before Toaster initialized, discarding:", message);
      return -1;
    }
    const { toast } = Toaster;
    const key = TOAST_FN[type];
    return key ? toast[key](message, options) : toast(message, options);
  }
  function dismissToast(id) {
    Toaster.toast?.dismiss(id);
  }

  // src/plugins/experiments/index.tsx
  var cl14 = classNameFactory("void-experiments-");
  var NEW_FLAG_TTL = 24 * 60 * 60 * 1000;
  var settings2 = definePluginSettings({
    toastNotifications: {
      type: 3 /* BOOLEAN */,
      description: "Show a toast when experiment flags change.",
      default: true
    },
    browserNotifications: {
      type: 3 /* BOOLEAN */,
      description: "Show a browser notification when experiment flags change.",
      default: true
    }
  }).withPrivateSettings();
  function getBooleanKeys(config) {
    return Object.keys(config).filter((k) => typeof config[k] === "boolean");
  }
  var lastConfigSnapshot = {};
  function formatFlagList(label, flags) {
    if (!flags.length)
      return "";
    const names = flags.map(prettifyKey).join(", ");
    return `${pluralize(flags.length, "flag")} ${label}: ${names}`;
  }
  function notifyChanges(newFlags, removedFlags, flipped) {
    const parts = [
      formatFlagList("added", newFlags),
      formatFlagList("removed", removedFlags),
      formatFlagList("changed", flipped)
    ].filter(Boolean);
    if (!parts.length)
      return;
    const message = parts.join(`
`);
    if (settings2.store.toastNotifications)
      showToast(message, 3 /* INFO */);
    if (settings2.store.browserNotifications)
      sendBrowserNotification("Grok Experiments", message);
  }
  function syncKnownFlags(config) {
    const booleanKeys = getBooleanKeys(config);
    if (!booleanKeys.length)
      return;
    const existing = settings2.plain.knownFlags;
    const firstRun = existing == null;
    const known = { ...existing };
    const now = Date.now();
    let changed = firstRun;
    const newFlags = [];
    for (const key of booleanKeys) {
      if (!(key in known)) {
        known[key] = firstRun ? 0 : now;
        if (!firstRun)
          newFlags.push(key);
        changed = true;
      }
    }
    const removedFlags = [];
    const currentSet = new Set(booleanKeys);
    for (const key of Object.keys(known)) {
      if (!currentSet.has(key)) {
        removedFlags.push(key);
        delete known[key];
        changed = true;
      }
    }
    const flipped = [];
    if (!firstRun && Object.keys(lastConfigSnapshot).length) {
      for (const key of booleanKeys) {
        if (key in lastConfigSnapshot && config[key] !== lastConfigSnapshot[key])
          flipped.push(key);
      }
    }
    lastConfigSnapshot = Object.fromEntries(booleanKeys.map((k) => [k, !!config[k]]));
    if (changed) {
      settings2.store.knownFlags = { ...known };
    }
    if (!firstRun)
      notifyChanges(newFlags, removedFlags, flipped);
  }
  function isNewFlag(key) {
    const seen = settings2.plain.knownFlags?.[key];
    if (seen == null)
      return false;
    return Date.now() - seen < NEW_FLAG_TTL;
  }
  var FLAG_ACRONYMS = {
    Mcp: "MCP",
    Ui: "UI",
    Api: "API",
    Url: "URL",
    Gcal: "GCal",
    Mie: "MIE",
    Xlsx: "XLSX",
    Nux: "NUX",
    Xai: "xAI",
    Grok: "Grok",
    Id: "ID"
  };
  function tryDecodeBase64Key(key) {
    if (key.includes("_") || key.includes("-") || key.length < 10)
      return null;
    if (!/^[A-Za-z0-9+/=]+$/.test(key))
      return null;
    try {
      const decoded = atob(key);
      if (/^[a-z][a-z0-9_]+$/.test(decoded))
        return decoded;
    } catch {
      return null;
    }
    return null;
  }
  var prettifyKey = (key) => humanizeKey(tryDecodeBase64Key(key) ?? key, FLAG_ACRONYMS);
  function ExperimentRow({ flagKey, isNew }) {
    const config = FeatureStore.useFeatureStore((s) => s.config[flagKey]);
    const override = FeatureStore.useFeatureStore((s) => s.overrides[flagKey]);
    const isOverridden = override !== undefined;
    const checked = isOverridden ? !!override : !!config;
    const decodedKey = useMemo(() => tryDecodeBase64Key(flagKey), [flagKey]);
    const handleToggle = useCallback((value) => {
      const { setOverride, clearOverride, config: c } = FeatureStore.useFeatureStore.getState();
      if (value === !!c[flagKey])
        clearOverride(flagKey);
      else
        setOverride(flagKey, value);
    }, [flagKey]);
    return /* @__PURE__ */ React.createElement(SettingsRow, {
      action: /* @__PURE__ */ React.createElement(Switch, {
        checked,
        onCheckedChange: handleToggle
      })
    }, /* @__PURE__ */ React.createElement(SettingsTitle, null, prettifyKey(flagKey), isNew && /* @__PURE__ */ React.createElement(Badge, {
      variant: "accent",
      className: cl14("badge")
    }, "New"), decodedKey && /* @__PURE__ */ React.createElement(Badge, {
      className: cl14("badge")
    }, "Encrypted"), isOverridden && /* @__PURE__ */ React.createElement(Text2, {
      size: "xs",
      as: "span",
      className: cl14("modified")
    }, "(modified)")), /* @__PURE__ */ React.createElement(SettingsDescription, null, decodedKey ?? flagKey));
  }
  function ExperimentsTab() {
    const [search2, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const config = FeatureStore.useFeatureStore((s) => s.config);
    const overrides = FeatureStore.useFeatureStore((s) => s.overrides);
    const booleanKeys = useMemo(() => getBooleanKeys(config).sort(), [config]);
    const getFlagSearchText = useCallback((k) => {
      const decoded = tryDecodeBase64Key(k);
      return decoded ? `${k} ${decoded} ${prettifyKey(k)}` : `${k} ${prettifyKey(k)}`;
    }, []);
    const filterFn = useCallback((k) => {
      if (filter === "all")
        return true;
      const override = overrides[k];
      const enabled = override !== undefined ? !!override : !!config[k];
      if (filter === "enabled")
        return enabled;
      if (filter === "disabled")
        return !enabled;
      if (filter === "new")
        return isNewFlag(k);
      if (filter === "encrypted")
        return tryDecodeBase64Key(k) != null;
      return override !== undefined;
    }, [filter, config, overrides]);
    const prefiltered = useMemo(() => booleanKeys.filter(filterFn), [booleanKeys, filterFn]);
    const filtered = useFiltered(prefiltered, search2, getFlagSearchText);
    const overrideCount = Object.keys(overrides).length;
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "1rem"
    }, /* @__PURE__ */ React.createElement(SectionHeader, {
      title: "Experiments",
      description: "Toggle unreleased Grok features. These are experimental and may break. New flags are marked when they appear.",
      className: cl14("section")
    }), /* @__PURE__ */ React.createElement(Card, {
      variant: "ghost",
      className: cl14("warning")
    }, /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.75rem"
    }, /* @__PURE__ */ React.createElement(Text2, {
      size: "xs",
      className: cl14("warning-text")
    }, "Only enable flags you understand. Changing the wrong setting can break Grok or cause unexpected behavior."), overrideCount > 0 && /* @__PURE__ */ React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      className: cl14("clear-btn"),
      onClick: () => FeatureStore.useFeatureStore.getState().clearAllOverrides()
    }, "Clear ", pluralize(overrideCount, "override")))), /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      gap: "0.5rem",
      className: cl14("section")
    }, /* @__PURE__ */ React.createElement(Input, {
      placeholder: `Search ${prefiltered.length} flags...`,
      value: search2,
      onChange: (e) => setSearch(e.target.value),
      className: cl14("search-input")
    }), /* @__PURE__ */ React.createElement(Select, {
      value: filter,
      onValueChange: (v) => setFilter(v)
    }, /* @__PURE__ */ React.createElement(SelectTrigger, {
      className: cl14("filter-select")
    }, /* @__PURE__ */ React.createElement(SelectValue, null)), /* @__PURE__ */ React.createElement(SelectContent, null, /* @__PURE__ */ React.createElement(SelectItem, {
      value: "all"
    }, "All"), /* @__PURE__ */ React.createElement(SelectItem, {
      value: "enabled"
    }, "Enabled"), /* @__PURE__ */ React.createElement(SelectItem, {
      value: "disabled"
    }, "Disabled"), /* @__PURE__ */ React.createElement(SelectItem, {
      value: "new"
    }, "New"), /* @__PURE__ */ React.createElement(SelectItem, {
      value: "modified"
    }, "Modified"), /* @__PURE__ */ React.createElement(SelectItem, {
      value: "encrypted"
    }, "Encrypted")))), filtered.map((key) => /* @__PURE__ */ React.createElement(ErrorBoundary, {
      key,
      fallback: null
    }, /* @__PURE__ */ React.createElement(ExperimentRow, {
      flagKey: key,
      isNew: isNewFlag(key)
    }))), !filtered.length && /* @__PURE__ */ React.createElement(Paragraph, {
      color: "muted",
      className: cl14("empty")
    }, search2 ? `No flags matching "${search2}"` : `No ${filter} flags`));
  }
  var Tab = ErrorBoundary.wrap(ExperimentsTab);
  function overrideProxy(config, getState) {
    return new Proxy(config, {
      get(target, key) {
        const { overrides } = getState();
        return overrides && typeof key === "string" && key in overrides ? overrides[key] : Reflect.get(target, key);
      }
    });
  }
  var experiments_default = definePlugin({
    name: "Experiments",
    icon: TestTubeIcon,
    description: "Unlock and toggle unreleased Grok features.",
    authors: [Devs.Prism],
    settings: settings2,
    startAt: "TurbopackReady" /* TurbopackReady */,
    _proxy: overrideProxy,
    start() {
      if (settings2.store.browserNotifications && Notification.permission === "default")
        Notification.requestPermission().catch(() => {});
      const state = FeatureStore.useFeatureStore.getState();
      if (state.status === "ready")
        syncKnownFlags(state.config);
    },
    zustand: {
      FeatureStore: {
        selector: (s) => s.status === "ready" ? s.config : null,
        handler(config) {
          if (config)
            syncKnownFlags(config);
        }
      }
    },
    patches: [
      {
        find: "xai-ff-overrides",
        all: true,
        replacement: {
          match: /return \i\.overridesEnabled&&(void 0!==\i\.overrides\[\i\])/,
          replace: "return $1"
        }
      },
      {
        find: '"Feature flag overrides active","Feature flag overrides active"',
        replacement: {
          match: /\.toast\.warning\(\i\("Feature flag overrides active","Feature flag overrides active"\).{0,60}?\)/,
          replace: "&&void 0"
        }
      },
      {
        find: "feature-store-set-override",
        all: true,
        group: true,
        replacement: [
          {
            match: /config:("ready"===\i\.status\?\i\.serverConfig:\{\})/,
            replace: "config:$self._proxy($1,this.get)"
          },
          {
            match: /"ready"===\i\.status\)\i\(this\.config\)/,
            replace: "$&,this.config=$self._proxy(this.config,this.get)"
          }
        ]
      }
    ]
  });

  // void-css:/tmp/Void/src/plugins/pluginsFlyout/styles.css
  registerStyle("pluginsFlyout", `.void-pf-icon {
    width: 1rem;
    height: 1rem;
    color: hsl(var(--fg-secondary));
    flex-shrink: 0;
}

.void-pf-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 0;
    max-height: min(20rem, calc(100vh - 22rem));
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-inline-end: 0.25rem;
}
`);

  // src/plugins/pluginsFlyout/index.tsx
  var PLUGIN_NAME = "PluginsFlyout";
  var cl15 = classNameFactory("void-pf-");
  var settings3 = definePluginSettings({
    menuPlugins: {
      type: 6 /* COMPONENT */,
      description: "Plugins shown under Void → Plugins.",
      component: MenuPluginsEditor,
      default: {}
    }
  }).withPrivateSettings();
  function listedPlugins() {
    return Object.keys(plugins).filter((n) => !plugins[n].hidden).toSorted((a, b) => a.localeCompare(b));
  }
  function menuPluginMap() {
    const raw = settings3.store.menuPlugins;
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  }
  function isShownInPluginMenu(name) {
    const map = menuPluginMap();
    if (name in map)
      return !!map[name];
    return hasVisibleSettings(plugins[name]);
  }
  function setShownInPluginMenu(name, shown) {
    settings3.store.menuPlugins = { ...menuPluginMap(), [name]: shown };
  }
  function getVisibleMenuPlugins() {
    const names = listedPlugins();
    if (!isPluginEnabled(PLUGIN_NAME))
      return names.filter((n) => hasVisibleSettings(plugins[n]));
    return names.filter(isShownInPluginMenu);
  }
  function usePluginMenu() {
    settings3.use(["menuPlugins"]);
    return getVisibleMenuPlugins();
  }
  function MenuPluginsEditor() {
    settings3.use(["menuPlugins"]);
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.5rem",
      className: cl15("root")
    }, /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0"
    }, /* @__PURE__ */ React.createElement(SettingsTitle, null, "Plugin menu"), /* @__PURE__ */ React.createElement(SettingsDescription, null, "Choose which plugins appear under Void → Plugins.")), /* @__PURE__ */ React.createElement("div", {
      className: cl15("list")
    }, listedPlugins().map((name) => {
      const Icon = plugins[name].icon ?? UnplugIcon;
      return /* @__PURE__ */ React.createElement(SettingsRow, {
        key: name,
        action: /* @__PURE__ */ React.createElement(Switch, {
          checked: isShownInPluginMenu(name),
          onCheckedChange: (v) => setShownInPluginMenu(name, v)
        })
      }, /* @__PURE__ */ React.createElement(Flex, {
        alignItems: "center",
        gap: "0.5rem"
      }, /* @__PURE__ */ React.createElement(Icon, {
        className: cl15("icon")
      }), /* @__PURE__ */ React.createElement(SettingsTitle, null, name)));
    })));
  }
  var pluginsFlyout_default = definePlugin({
    name: PLUGIN_NAME,
    icon: ListFilterIcon,
    description: "Choose which plugins appear in the avatar Void → Plugins menu.",
    authors: [Devs.p],
    tags: ["ui", "settings"],
    enabledByDefault: true,
    settings: settings3
  });

  // src/plugins/_core/settings/index.tsx
  var logger15 = new Logger("Settings");
  var cl16 = classNameFactory("void-settings-");
  var settings4 = definePluginSettings({
    showVoidMenu: {
      type: 3 /* BOOLEAN */,
      description: "Show the Void sub-menu in the avatar dropdown.",
      default: true
    }
  });
  var PLUGINS_TAB_ID = "void_plugins_tab";
  var allTabs = [
    { id: PLUGINS_TAB_ID, name: "Plugins", icon: UnplugIcon, component: PluginsTab2 },
    { id: "void_themes_tab", name: "Themes", icon: PaletteIcon, component: ThemesTab2 },
    { id: "void_css_tab", name: "Quick CSS", icon: BracesIcon, component: CustomCSSTab2 },
    { id: "void_experiments_tab", name: "Experiments", icon: TestTubeIcon, component: Tab, plugin: "Experiments" }
  ];
  function getVisibleTabs() {
    return allTabs.filter((t) => !t.plugin || isPluginEnabled(t.plugin));
  }
  var Dot = () => /* @__PURE__ */ React.createElement(Text2, {
    as: "span",
    color: "secondary"
  }, "•");
  function VersionLink({ href, children }) {
    return /* @__PURE__ */ React.createElement("a", {
      href,
      target: "_blank",
      rel: "noreferrer",
      className: cl16("version-link")
    }, /* @__PURE__ */ React.createElement(Text2, {
      as: "span",
      color: "secondary"
    }, children));
  }
  function VersionInfo() {
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0",
      className: cl16("version")
    }, /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      gap: "0.25rem"
    }, /* @__PURE__ */ React.createElement(VersionLink, {
      href: "https://github.com/imjustprism/Void"
    }, "Void"), /* @__PURE__ */ React.createElement(Dot, null), /* @__PURE__ */ React.createElement(Text2, {
      as: "span",
      color: "secondary"
    }, "[20260830.22] v1.0.0"), /* @__PURE__ */ React.createElement(Dot, null), /* @__PURE__ */ React.createElement(VersionLink, {
      href: `${"https://github.com/imjustprism/Void"}/commit/${"dcee62e"}`
    }, `(${"dcee62e"})`)), /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      gap: "0.25rem"
    }, /* @__PURE__ */ React.createElement(Text2, {
      as: "span",
      color: "secondary"
    }, "Production"), /* @__PURE__ */ React.createElement(Dot, null), /* @__PURE__ */ React.createElement(Text2, {
      as: "span",
      color: "secondary"
    }, "Userscript")));
  }
  function openSettingsTab(tab) {
    const store = SettingsDialogStore.useSettingsDialogStore.getState();
    store.setTab(tab);
    store.setOpen(true);
  }
  function openPluginSettings(name) {
    setPendingPluginDialog(name);
    openSettingsTab(PLUGINS_TAB_ID);
  }
  function VoidMenu() {
    const forceUpdate = useForceUpdater();
    useEventSubscription("pluginToggle", forceUpdate);
    const { showVoidMenu } = settings4.use(["showVoidMenu"]);
    const menuPlugins = usePluginMenu();
    if (!showVoidMenu)
      return null;
    return /* @__PURE__ */ React.createElement(DropdownMenuSub, null, /* @__PURE__ */ React.createElement(DropdownMenuSubTrigger, null, /* @__PURE__ */ React.createElement(VoidIcon, {
      className: cl16("menu-icon")
    }), "Void"), /* @__PURE__ */ React.createElement(DropdownMenuSubContent, null, menuPlugins.length > 0 && /* @__PURE__ */ React.createElement(DropdownMenuSub, null, /* @__PURE__ */ React.createElement(DropdownMenuSubTrigger, null, /* @__PURE__ */ React.createElement(UnplugIcon, {
      className: cl16("menu-icon")
    }), "Plugins"), /* @__PURE__ */ React.createElement(DropdownMenuSubContent, {
      className: cl16("plugin-menu")
    }, menuPlugins.map((name) => {
      const Icon = plugins[name].icon ?? UnplugIcon;
      return /* @__PURE__ */ React.createElement(DropdownMenuItem, {
        key: name,
        onSelect: () => openPluginSettings(name)
      }, /* @__PURE__ */ React.createElement(Icon, {
        className: cl16("menu-icon")
      }), name);
    }))), getVisibleTabs().filter((t) => t.id !== PLUGINS_TAB_ID).map((t) => {
      const Icon = t.icon;
      return /* @__PURE__ */ React.createElement(DropdownMenuItem, {
        key: t.id,
        onSelect: () => openSettingsTab(t.id)
      }, /* @__PURE__ */ React.createElement(Icon, {
        className: cl16("menu-icon")
      }), t.name);
    })));
  }
  var WrappedVoidMenu = ErrorBoundary.wrap(VoidMenu);
  var settings_default = definePlugin({
    name: "Settings",
    icon: SettingsIcon,
    description: "Adds Void settings UI.",
    authors: [Devs.Prism],
    required: true,
    settings: settings4,
    _renderVoidMenu: () => createElement(WrappedVoidMenu),
    _setPrimitive(name, component) {
      setSettingsPrimitive(name, component);
      return component;
    },
    _tabEntries() {
      return getVisibleTabs().map((t) => ({
        id: t.id,
        group: "void",
        icon: t.icon,
        i18nKey: t.name,
        defaultLabel: t.name,
        visible: () => true,
        component: t.component
      }));
    },
    _tabLabel(tab) {
      return tab.defaultLabel || tab.i18nKey || tab.id;
    },
    _renderVersion() {
      return /* @__PURE__ */ React.createElement(VersionInfo, {
        key: "void-version"
      });
    },
    start() {
      registerStyle("void-global", "[data-sonner-toast] [data-title]{font-weight:400}");
      try {
        if (document.head)
          loadSavedCSS();
        else
          document.addEventListener("DOMContentLoaded", loadSavedCSS, { once: true });
      } catch (e) {
        logger15.error("Failed to load saved CSS:", e);
      }
      loadSavedThemes().catch((e) => logger15.error("Failed to load saved themes:", e));
    },
    patches: [
      {
        find: "avatar_menu_click",
        all: true,
        replacement: {
          match: /\(0,(\i)\.jsxs\)\((\i)\.DropdownMenuSub,\{children:\[\(0,\1\.jsxs\)\(\2\.DropdownMenuSubTrigger,\{(?:\i:\i,)*children:\[.{0,100}"user-dropdown\.help"/,
          replace: "$self._renderVoidMenu(),$&"
        }
      },
      {
        find: "pressed_cmd_settings",
        replacement: [
          {
            match: /\i\.filter\(\i=>\i\.visible\(\i\)\)/,
            replace: "[...$&,...$self._tabEntries()]"
          },
          {
            match: /(\["general","grok","payments","data","other"),("team-management"\])/,
            replace: '$1,"void",$2'
          },
          {
            match: /(case"other":return \i\("settings-nav-group\.other","Other"\);)(case"team-management":)/,
            replace: '$1case"void":return"Void";$2'
          },
          {
            match: /default:return\(0,\i\.logError\)\("SettingsDialog:tabLabel",`No label for settings tab \${(\i)\.id}`\),\1\.id/,
            replace: "default:return $self._tabLabel($1)"
          }
        ]
      },
      {
        find: '"SettingsTitle",0,',
        all: true,
        replacement: [
          {
            match: /("SettingsTitle",0,)(\i)/,
            replace: '$1$self._setPrimitive("SettingsTitle",$2)'
          },
          {
            match: /("SettingsDescription",0,)(\i)/,
            replace: '$1$self._setPrimitive("SettingsDescription",$2)'
          },
          {
            match: /("SettingsRow",0,)(?!function)(\i)/,
            replace: '$1$self._setPrimitive("SettingsRow",$2)'
          },
          {
            match: /("SettingsRow",0,)(function\(\i\)\{[\s\S]*?\})(?=,"Settings)/,
            replace: '$1$self._setPrimitive("SettingsRow",$2)'
          }
        ]
      }
    ]
  });

  // src/plugins/_core/noTelemetry/index.ts
  var noTelemetry_default = definePlugin({
    name: "NoTelemetry",
    icon: ShieldOffIcon,
    description: "Disables all tracking, telemetry, and event logging.",
    authors: [Devs.Prism],
    tags: ["privacy"],
    required: true,
    patches: [
      {
        find: '"opentelemetry.js.api."',
        replacement: {
          match: /("onRouterTransitionStart",0,)function\([^)]*\)\{[^}]{0,200}\}/,
          replace: "$1function(){}"
        }
      },
      {
        find: '"after-init"),(0,',
        group: true,
        replacement: [
          {
            match: /(function \i\(\)\{)if\(Object\.prototype\.hasOwnProperty\.call\(\i\.default,"get_distinct_id"\)\)return;/,
            replace: "$1return}function _ignore(){"
          },
          {
            match: /"startRecordingImagineSession",0,function\(\)\{[\s\S]{0,300}?start_session_recording\(\)\}/,
            replace: '"startRecordingImagineSession",0,function(){}'
          },
          {
            match: /"stopRecordingImagineSession",0,function\(\)\{[\s\S]{0,300}?stop_session_recording\(\)\},\d+e?\d*\)\}/,
            replace: '"stopRecordingImagineSession",0,function(){}'
          }
        ]
      },
      {
        find: "sendBatchLogEvent",
        all: true,
        group: true,
        replacement: [
          {
            match: /sendBatchLogEvent=\i=>\{[^}]{0,150}\}/,
            replace: "sendBatchLogEvent=()=>{}"
          },
          {
            match: /sendBatchLogExperimentExposure=\i=>\{[^}]{0,150}\}/,
            replace: "sendBatchLogExperimentExposure=()=>{}"
          }
        ]
      },
      {
        find: '"/api/log_metric"',
        replacement: {
          match: /"\/api\/log_metric",\i\)/,
          replace: '"/api/log_metric",[])'
        }
      },
      {
        find: "isEnvVarsSet(){return void 0!=",
        replacement: {
          match: /isEnvVarsSet\(\)\{return void 0!=\i&&""!=\i\|\|!!this\.customEndpoint\}/,
          replace: "isEnvVarsSet(){return false}"
        }
      }
    ]
  });

  // src/api/Modals.tsx
  var nextId = 0;
  var modalStack = [];
  var store = createExternalStore();
  function openModal(render, options) {
    const key = options?.modalKey ?? `void-modal-${nextId++}`;
    const idx = modalStack.findIndex((m) => m.key === key);
    if (idx !== -1)
      modalStack.splice(idx, 1);
    modalStack.push({ key, render });
    store.notify();
    return key;
  }
  function closeModal(key) {
    const idx = modalStack.findIndex((m) => m.key === key);
    if (idx !== -1) {
      modalStack.splice(idx, 1);
      store.notify();
    }
  }
  function closeAllModals() {
    modalStack.length = 0;
    store.notify();
  }
  var ModalInstance = ErrorBoundary.wrap(function ModalInstance2({ entry }) {
    const onClose = useCallback(() => closeModal(entry.key), [entry.key]);
    return entry.render({ onClose });
  });
  function ModalContainer() {
    useExternalStore(store);
    if (!modalStack.length)
      return null;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, modalStack.map((entry) => /* @__PURE__ */ React.createElement(ModalInstance, {
      key: entry.key,
      entry
    })));
  }

  // src/plugins/_api/chatBarButtons/index.tsx
  function Buttons() {
    return /* @__PURE__ */ React.createElement(Fragment, null, /* @__PURE__ */ React.createElement(VoidChatBarButtons, {
      location: "chat"
    }), /* @__PURE__ */ React.createElement(ModalContainer, null));
  }
  function ImagineButtons() {
    return /* @__PURE__ */ React.createElement(VoidChatBarButtons, {
      location: "imagine"
    });
  }
  var chatBarButtons_default = definePlugin({
    name: "ChatBarButtonAPI",
    description: "Adds buttons to the chat input bar.",
    authors: [Devs.Prism],
    required: true,
    hidden: true,
    renderButtons: ErrorBoundary.wrap(Buttons),
    renderImagineButtons: ErrorBoundary.wrap(ImagineButtons),
    patches: [
      {
        find: "data-query-bar-mode-select",
        all: true,
        replacement: [
          {
            match: /\},"mode-select"\),/,
            replace: "$&$self.renderButtons(),"
          },
          {
            match: /style:\i(?:\|\|\i)*\?void 0:(\{paddingInlineEnd:\i\})/,
            replace: "style:$1"
          }
        ]
      },
      {
        find: 'imagine-query-bar-placeholder","Type to imagine"',
        replacement: {
          match: /("Generation mode"\)\}\)\}\),)(\i(?:&&!?\i){0,4}&&\(0,\i\.jsx\)\(\i\.DictationButton,)/,
          replace: "$1$self.renderImagineButtons(),$2"
        }
      }
    ]
  });

  // src/plugins/_api/contextMenu/index.tsx
  var contextMenu_default = definePlugin({
    name: "ContextMenuAPI",
    description: "Adds items to context menus.",
    authors: [Devs.Prism],
    required: true,
    hidden: true,
    renderItems(location2, ctx, menu) {
      return /* @__PURE__ */ React.createElement(ErrorBoundary, null, /* @__PURE__ */ React.createElement(VoidContextMenuItems, {
        location: location2,
        menu,
        ...ctx
      }));
    },
    patches: [
      {
        find: '"Editing actions","Editing actions"',
        all: true,
        group: true,
        replacement: [
          {
            match: /onSaveEdit:(\i),([^}]{0,80}?route:\i)\}\)(?!\{)/,
            replace: "onSaveEdit:$1,id:arguments[0].id,$2})"
          },
          {
            match: /onEditClick:(\i),route:(\i)\}\)(?!\{)/g,
            replace: "onEditClick:$1,id:arguments[0].id,route:$2})"
          },
          {
            match: /Item:(\i)\.(Dropdown|Context)MenuItem,/g,
            replace: "$&VoidMenu:{Item:$1.$2MenuItem,Sub:$1.$2MenuSub,SubTrigger:$1.$2MenuSubTrigger,SubContent:$1.$2MenuSubContent,Separator:$1.$2MenuSeparator},"
          },
          {
            match: /=(\i)&&(\jsx{\i}\{onSelect:\(\)=>\1\(\),)(?=.{0,80}TrashIcon)/,
            replace: '=$self.renderItems("conversation",{conversationId:arguments[0].id},arguments[0].VoidMenu),$1&&$2'
          }
        ]
      },
      {
        find: '"more-actions-dropdown"',
        all: true,
        replacement: {
          match: /"more-action\.copy-model-hash".{0,80}slice\(0,5\)\}\}\)\}\)/,
          replace: '$&,$self.renderItems("message",{response:arguments[0].response})'
        }
      },
      {
        find: '"user-dropdown.upgrade","Upgrade plan"',
        all: true,
        replacement: {
          match: /(\jsx{\i\.DropdownMenuItem}\{)(?=[^}]{0,60}SignOutIcon)/,
          replace: '$self.renderItems("user"),$1'
        }
      }
    ]
  });

  // void-css:/tmp/Void/src/plugins/inputHistory/styles.css
  registerStyle("inputHistory", `.void-ih-hud {
    contain: content;
    position: fixed;
    z-index: 2147483646;
    padding: 0.25rem 0.5rem;
    border: 1px solid hsl(var(--border-l2));
    border-radius: 0.5rem;
    background: hsl(var(--surface-l2));
    color: hsl(var(--fg-secondary));
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
    pointer-events: none;
    opacity: 0;
    transform: translate(-50%, -100%);
    transition: opacity 0.12s ease;
}

.void-ih-hud-on {
    opacity: 1;
}

.void-ih-panel {
    min-width: 0;
}

.void-ih-head {
    min-width: 0;
}

.void-ih-search {
    width: 100%;
}

.void-ih-empty {
    margin: 0;
    color: hsl(var(--fg-tertiary));
}

.void-ih-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow: auto;
    max-height: min(22rem, 45vh);
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--border-l2) / 80%) transparent;
}

.void-ih-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    border: 1px solid transparent;
    border-radius: 0.75rem;
    background: hsl(var(--surface-l1) / 72%);
}

.void-ih-item:hover {
    background: hsl(var(--surface-l2));
    border-color: hsl(var(--border-l2) / 45%);
}

.void-ih-item-on {
    align-items: start;
    background: hsl(var(--surface-l2));
    border-color: hsl(var(--border-l2) / 60%);
}

.void-ih-item:focus-visible {
    outline: 2px solid hsl(var(--fg-primary));
    outline-offset: 2px;
}

.void-ih-main {
    min-width: 0;
    cursor: pointer;
}

.void-ih-body {
    display: block;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    color: hsl(var(--fg-primary));
    font-size: 0.8125rem;
    line-height: 1.45;
}

.void-ih-clamp {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
}

.void-ih-item-on .void-ih-body {
    max-height: 12rem;
    overflow: auto;
    scrollbar-width: thin;
}

.void-ih-side {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.5rem;
}

.void-ih-item-on .void-ih-side {
    align-items: flex-start;
    padding-top: 0.125rem;
}

.void-ih-lines {
    min-width: 1.5rem;
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    background: hsl(var(--surface-l2));
    color: hsl(var(--fg-tertiary));
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    line-height: 1.3;
    text-align: center;
}

.void-ih-actions {
    display: flex;
    gap: 0.125rem;
    padding: 0.125rem;
    border-radius: 0.5rem;
    background: hsl(var(--surface-l2) / 90%);
}

.void-ih-actions :is(button) {
    width: 2.25rem;
    height: 2.25rem;
    min-width: 2.25rem;
    min-height: 2.25rem;
}

.void-ih-item-on .void-ih-actions,
.void-ih-item:hover .void-ih-actions {
    background: hsl(var(--surface-l1));
}

.void-ih-pager {
    min-width: 0;
}

.void-ih-page {
    min-width: 3.5rem;
    color: hsl(var(--fg-secondary));
    font-size: 0.8125rem;
    font-variant-numeric: tabular-nums;
    text-align: center;
}

@media (prefers-reduced-motion: reduce) {
    .void-ih-hud {
        transition: none;
    }
}
`);

  // src/plugins/inputHistory/index.tsx
  var logger16 = new Logger("InputHistory");
  var cl17 = classNameFactory("void-ih-");
  var EDITOR_SEL = '.query-bar .tiptap.ProseMirror[contenteditable="true"]';
  var ZWSP = /\u200B/g;
  var MAX_MIN = 10;
  var MAX_MAX = 500;
  var MAX_DEFAULT = 100;
  var HUD_GAP_PX = 8;
  var APPLY_QUIET_MS = 120;
  var CAPTURE_DEDUPE_MS = 2000;
  var PAGE_SIZE = 10;
  var settings5 = definePluginSettings({
    maxEntries: {
      type: 5 /* SLIDER */,
      description: "Maximum stored prompts.",
      min: MAX_MIN,
      max: MAX_MAX,
      default: MAX_DEFAULT
    },
    history: {
      type: 6 /* COMPONENT */,
      component: HistoryPanel
    }
  }).withPrivateSettings();
  var recentAt = new Map;
  var cursor = 0;
  var draft = "";
  var recalling = false;
  var applying = false;
  var applyGen = 0;
  var keys = null;
  var applyTimer;
  var applyEl = null;
  var applyAtStart = true;
  function getEntries() {
    const raw = settings5.plain.entries;
    return Array.isArray(raw) ? raw.filter((x) => typeof x === "string") : [];
  }
  function cap(entries) {
    const max = clamp(settings5.store.maxEntries ?? MAX_DEFAULT, MAX_MIN, MAX_MAX);
    return entries.length > max ? entries.slice(entries.length - max) : entries;
  }
  function setEntries(entries) {
    settings5.store.entries = entries;
  }
  function normalize(text) {
    return text.replaceAll(ZWSP, "").replace(/\n$/, "").trim();
  }
  function resetBrowse(length) {
    cursor = length;
    draft = "";
    recalling = false;
    hideHud();
  }
  function chatEditor(t) {
    if (t instanceof Text)
      return t.parentElement?.closest(EDITOR_SEL) ?? null;
    if (t instanceof Element)
      return t.closest(EDITOR_SEL) ?? null;
    return null;
  }
  function editorText(el) {
    const blocks = el.querySelectorAll(":scope > *");
    const raw = blocks.length ? Array.from(blocks, (b) => b.textContent ?? "").join(`
`) : el.innerText ?? el.textContent ?? "";
    return normalize(raw);
  }
  function spanHeight(range) {
    const rects = range.getClientRects();
    let top = Infinity;
    let bottom = -Infinity;
    for (const r of rects) {
      if (r.height === 0 && r.width === 0)
        continue;
      if (r.top < top)
        top = r.top;
      if (r.bottom > bottom)
        bottom = r.bottom;
    }
    if (top === Infinity)
      return range.getBoundingClientRect().height;
    return bottom - top;
  }
  function caretOnEdge(el) {
    const sel = window.getSelection();
    if (!sel?.rangeCount || !sel.isCollapsed)
      return { first: false, last: false };
    const caret = sel.getRangeAt(0);
    if (!el.contains(caret.startContainer))
      return { first: false, last: false };
    if (!el.innerText?.trim())
      return { first: true, last: true };
    const before = document.createRange();
    before.selectNodeContents(el);
    before.setEnd(caret.startContainer, caret.startOffset);
    const after = document.createRange();
    after.selectNodeContents(el);
    after.setStart(caret.startContainer, caret.startOffset);
    const { lineHeight, fontSize } = getComputedStyle(el);
    const lh = parseFloat(lineHeight);
    const fs = parseFloat(fontSize) || 16;
    const budget = (lh > 0 ? lh : fs * 1.5) * 1.5;
    return {
      first: spanHeight(before) <= budget,
      last: spanHeight(after) <= budget
    };
  }
  function matchesRecall(el) {
    if (!recalling)
      return false;
    const list = getEntries();
    const expected = cursor < list.length ? list[cursor] : draft;
    return editorText(el) === expected || normalize(el.innerText ?? "") === expected;
  }
  function dropRecall(el) {
    cursor = getEntries().length;
    draft = editorText(el);
    recalling = false;
    hideHud();
  }
  function placeCaret(el, atStart) {
    try {
      const view = el.pmViewDesc?.view;
      if (view) {
        const Sel = view.state.selection.constructor;
        const pmSel = atStart ? Sel.atStart(view.state.doc) : Sel.atEnd(view.state.doc);
        view.dispatch(view.state.tr.setSelection(pmSel).scrollIntoView());
        return;
      }
    } catch (err) {
      logger16.debug("placeCaret pm failed:", err);
    }
    const native = window.getSelection();
    if (!native)
      return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(atStart);
    native.removeAllRanges();
    native.addRange(range);
  }
  function scheduleApplyEnd(gen) {
    clearTimeout(applyTimer);
    applyTimer = setTimeout(() => {
      if (gen !== applyGen)
        return;
      applying = false;
      const el = applyEl;
      if (!el)
        return;
      if (recalling && !matchesRecall(el))
        dropRecall(el);
      else
        placeCaret(el, applyAtStart);
    }, APPLY_QUIET_MS);
  }
  function setEditorText(el, text, atStart) {
    el.focus();
    const sel = window.getSelection();
    if (!sel)
      return;
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
    applying = true;
    applyEl = el;
    applyAtStart = atStart;
    const gen = ++applyGen;
    try {
      if (!text)
        document.execCommand("delete");
      else
        document.execCommand("insertText", false, text);
    } catch (err) {
      logger16.debug("insertText failed:", err);
    }
    placeCaret(el, atStart);
    scheduleApplyEnd(gen);
  }
  function hudEl() {
    let el = document.querySelector(`.${cl17("hud")}`);
    if (el)
      return el;
    el = document.createElement("div");
    el.className = cl17("hud");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
    return el;
  }
  function hideHud() {
    document.querySelector(`.${cl17("hud")}`)?.classList.remove(cl17("hud-on"));
  }
  function showHud(label, editor) {
    const bar = editor.closest(".query-bar");
    if (!bar)
      return;
    const el = hudEl();
    el.textContent = label;
    requestAnimationFrame(() => {
      const r = bar.getBoundingClientRect();
      el.style.left = `${r.left + r.width / 2}px`;
      el.style.top = `${r.top - HUD_GAP_PX}px`;
      el.classList.add(cl17("hud-on"));
    });
  }
  function pushEntry(text) {
    const value = normalize(text);
    if (!value)
      return;
    const now = Date.now();
    const prev = recentAt.get(value);
    if (prev != null && now - prev < CAPTURE_DEDUPE_MS)
      return;
    recentAt.set(value, now);
    const list = getEntries();
    if (list[list.length - 1] === value) {
      resetBrowse(list.length);
      return;
    }
    const next = cap([...list, value]);
    setEntries(next);
    resetBrowse(next.length);
  }
  function cycle(older, el) {
    const list = getEntries();
    if (!list.length && older)
      return;
    if (cursor >= list.length) {
      draft = editorText(el);
      cursor = list.length;
    }
    const next = older ? cursor - 1 : cursor + 1;
    if (next < 0 || next > list.length)
      return;
    cursor = next;
    recalling = true;
    setEditorText(el, next === list.length ? draft : list[next], older);
    if (next < list.length)
      showHud(`${next + 1} / ${list.length}`, el);
    else
      hideHud();
  }
  function onKeyDown(e) {
    if (e.isComposing || e.keyCode === 229)
      return;
    if (e.ctrlKey || e.metaKey)
      return;
    const el = chatEditor(e.target);
    if (!el)
      return;
    if (e.key === "Escape" && recalling && !e.altKey && !e.shiftKey) {
      dropRecall(el);
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.altKey) {
      pushEntry(editorText(el));
      return;
    }
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown")
      return;
    if (e.shiftKey)
      return;
    const older = e.key === "ArrowUp";
    const force = e.altKey;
    const list = getEntries();
    if (!force) {
      const edge = caretOnEdge(el);
      if (older && !edge.first || !older && !edge.last)
        return;
    }
    if (older && (!list.length || cursor <= 0))
      return;
    if (!older && cursor >= list.length)
      return;
    e.preventDefault();
    e.stopImmediatePropagation();
    cycle(older, el);
  }
  function onPointerDown(e) {
    if (!recalling || applying)
      return;
    const el = chatEditor(e.target);
    if (!el)
      return;
    dropRecall(el);
  }
  function onInput(e) {
    const el = chatEditor(e.target);
    if (!el)
      return;
    if (applying) {
      scheduleApplyEnd(applyGen);
      return;
    }
    if (matchesRecall(el))
      return;
    dropRecall(el);
  }
  function onSubmit(e) {
    const form = e.target;
    if (!(form instanceof HTMLFormElement))
      return;
    const editor = form.querySelector(EDITOR_SEL);
    if (editor instanceof HTMLElement)
      pushEntry(editorText(editor));
  }
  function onClick(e) {
    const t = e.target;
    if (!(t instanceof Element))
      return;
    const ctrl = t.closest("button, [role='button']");
    if (!ctrl)
      return;
    const bar = ctrl.closest(".query-bar");
    if (!bar || ctrl.closest("[data-query-bar-mode-select]"))
      return;
    const label = (ctrl.getAttribute("aria-label") ?? "").toLowerCase();
    const submit = ctrl instanceof HTMLButtonElement && ctrl.type === "submit";
    if (!submit && !label.includes("send") && !label.includes("submit"))
      return;
    const editor = bar.querySelector(EDITOR_SEL);
    if (editor instanceof HTMLElement)
      pushEntry(editorText(editor));
  }
  function removeEntry(index) {
    const list = getEntries();
    if (index < 0 || index >= list.length)
      return;
    const next = list.filter((_, i) => i !== index);
    setEntries(next);
    resetBrowse(next.length);
  }
  function HistoryPanel() {
    const { entries } = settings5.use(["entries"]);
    const list = entries ?? [];
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(0);
    const [openId, setOpenId] = useState(null);
    const [confirm, setConfirm] = useState(false);
    const needle = query.trim().toLowerCase();
    const visible = list.map((text, index) => ({ text, index })).filter((row) => !needle || row.text.toLowerCase().includes(needle)).reverse();
    const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    const current = Math.min(page, pageCount - 1);
    const slice = visible.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.65rem",
      className: cl17("panel")
    }, /* @__PURE__ */ React.createElement(Flex, {
      className: cl17("head"),
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.75rem"
    }, /* @__PURE__ */ React.createElement(Paragraph, null, needle ? pluralize(visible.length, "match", "matches") : pluralize(list.length, "stored prompt")), /* @__PURE__ */ React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      shape: "rectangle",
      disabled: !list.length,
      onClick: () => setConfirm(true)
    }, "Clear history")), list.length > 0 && /* @__PURE__ */ React.createElement(Input, {
      type: "text",
      placeholder: "Search prompts",
      value: query,
      onChange: (e) => {
        setQuery(e.target.value);
        setPage(0);
      },
      className: cl17("search")
    }), list.length === 0 && /* @__PURE__ */ React.createElement(Paragraph, {
      className: cl17("empty")
    }, "No stored prompts."), list.length > 0 && visible.length === 0 && /* @__PURE__ */ React.createElement(Paragraph, {
      className: cl17("empty")
    }, "No matches."), slice.length > 0 && /* @__PURE__ */ React.createElement("div", {
      className: cl17("list")
    }, slice.map((row) => {
      const lines = row.text.split(`
`).length;
      const expanded = openId === row.index;
      return /* @__PURE__ */ React.createElement("div", {
        key: row.index,
        className: cl17("item", expanded && "item-on")
      }, /* @__PURE__ */ React.createElement("div", {
        className: cl17("main"),
        role: "button",
        tabIndex: 0,
        onClick: () => setOpenId(expanded ? null : row.index),
        onKeyDown: (e) => {
          if (e.key !== "Enter" && e.key !== " ")
            return;
          e.preventDefault();
          setOpenId(expanded ? null : row.index);
        }
      }, /* @__PURE__ */ React.createElement("span", {
        className: cl17("body", !expanded && "clamp")
      }, row.text)), /* @__PURE__ */ React.createElement("div", {
        className: cl17("side")
      }, lines > 1 && /* @__PURE__ */ React.createElement("span", {
        className: cl17("lines")
      }, lines), /* @__PURE__ */ React.createElement("div", {
        className: cl17("actions")
      }, /* @__PURE__ */ React.createElement(ButtonWithTooltip, {
        variant: "tertiary",
        size: "sm",
        shape: "square",
        tooltipContent: "Copy",
        "aria-label": "Copy",
        onClick: () => {
          copyToClipboard(row.text).catch((err) => logger16.error("copy failed:", err));
        }
      }, /* @__PURE__ */ React.createElement(CopyIcon, {
        size: 18
      })), /* @__PURE__ */ React.createElement(ButtonWithTooltip, {
        variant: "tertiary",
        size: "sm",
        shape: "square",
        tooltipContent: "Delete",
        "aria-label": "Delete",
        onClick: () => {
          if (openId === row.index)
            setOpenId(null);
          removeEntry(row.index);
        }
      }, /* @__PURE__ */ React.createElement(Trash2Icon, {
        size: 18
      })))));
    })), visible.length > PAGE_SIZE && /* @__PURE__ */ React.createElement(Flex, {
      className: cl17("pager"),
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem"
    }, /* @__PURE__ */ React.createElement(Button, {
      variant: "tertiary",
      size: "sm",
      shape: "square",
      "aria-label": "Previous page",
      disabled: current <= 0,
      onClick: () => setPage(current - 1)
    }, /* @__PURE__ */ React.createElement(ChevronLeftIcon, {
      size: 18
    })), /* @__PURE__ */ React.createElement("span", {
      className: cl17("page")
    }, current + 1, " / ", pageCount), /* @__PURE__ */ React.createElement(Button, {
      variant: "tertiary",
      size: "sm",
      shape: "square",
      "aria-label": "Next page",
      disabled: current >= pageCount - 1,
      onClick: () => setPage(current + 1)
    }, /* @__PURE__ */ React.createElement(ChevronRightIcon, {
      size: 18
    }))), /* @__PURE__ */ React.createElement(ConfirmDialog, {
      open: confirm,
      onOpenChange: setConfirm,
      title: "Clear input history",
      description: "Delete all stored prompts? This cannot be undone.",
      confirmText: "Clear",
      danger: true,
      onConfirm: () => {
        setEntries([]);
        resetBrowse(0);
        setOpenId(null);
        setQuery("");
        setPage(0);
      }
    }));
  }
  var inputHistory_default = definePlugin({
    name: "InputHistory",
    icon: HistoryIcon,
    description: "Recall previous chat prompts with Arrow Up and Arrow Down, like a shell.",
    authors: [Devs.p],
    tags: ["chat"],
    enabledByDefault: true,
    settings: settings5,
    managedStyle: "inputHistory",
    cleanupSelectors: [".void-ih-hud"],
    start() {
      if (keys)
        return;
      cursor = getEntries().length;
      recalling = false;
      keys = new AbortController;
      const { signal } = keys;
      document.addEventListener("keydown", onKeyDown, { capture: true, signal });
      document.addEventListener("input", onInput, { capture: true, signal });
      document.addEventListener("submit", onSubmit, { capture: true, signal });
      document.addEventListener("click", onClick, { capture: true, signal });
      document.addEventListener("pointerdown", onPointerDown, { capture: true, signal });
    },
    stop() {
      keys?.abort();
      keys = null;
      hideHud();
      recentAt.clear();
      clearTimeout(applyTimer);
      applying = false;
      applyEl = null;
      recalling = false;
    },
    onSettingsChange() {
      const current = getEntries();
      const next = cap(current);
      if (next.length !== current.length)
        setEntries(next);
      if (cursor > next.length)
        cursor = next.length;
    }
  });

  // src/plugins/autoCollapse/index.ts
  var autoCollapse_default = definePlugin({
    name: "AutoCollapse",
    icon: ChevronsDownUpIcon,
    description: "Automatically collapse code blocks in responses.",
    authors: [Devs.Prism],
    tags: ["chat"],
    _collapse: () => true,
    patches: [
      {
        find: ["isInitiallyCollapsed", "showRunCode"],
        all: true,
        replacement: {
          match: /isInitiallyCollapsed:(\i)=!1/g,
          replace: "isInitiallyCollapsed:$1=$self._collapse()"
        }
      }
    ]
  });

  // src/plugins/responseNotification/index.ts
  var settings6 = definePluginSettings({
    sound: {
      type: 3 /* BOOLEAN */,
      description: "Play a notification sound.",
      default: true
    },
    soundUrl: {
      type: 0 /* STRING */,
      description: "Custom sound URL (leave empty for default beep).",
      default: "",
      placeholder: "https://example.com/sound.mp3"
    },
    browserNotification: {
      type: 3 /* BOOLEAN */,
      description: "Show a browser notification.",
      default: true
    },
    onlyWhenHidden: {
      type: 3 /* BOOLEAN */,
      description: "Only notify when the tab is not focused.",
      default: true
    }
  });
  var userGestured = false;
  var gestureCtrl = null;
  function playBeep() {
    const ctx = new AudioContext;
    const start = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.15;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      osc.onended = () => ctx.close();
    };
    if (ctx.state === "suspended")
      ctx.resume().then(start, () => ctx.close());
    else
      start();
  }
  function playSound() {
    if (!userGestured)
      return;
    const url = settings6.store.soundUrl?.trim();
    if (url) {
      const audio = new Audio(url);
      audio.volume = 0.3;
      audio.play().catch(() => playBeep());
    } else {
      playBeep();
    }
  }
  function onStreamEnd({ responseId }) {
    const response = ResponseStore.useResponseStore.getState().byId[responseId];
    if (!response || response.state !== "closed")
      return;
    if (settings6.store.onlyWhenHidden && document.visibilityState === "visible")
      return;
    if (settings6.store.sound)
      playSound();
    if (settings6.store.browserNotification)
      sendBrowserNotification("Grok", "Response complete.");
  }
  var responseNotification_default = definePlugin({
    name: "ResponseNotification",
    icon: BellIcon,
    description: "Notify when Grok finishes responding.",
    authors: [Devs.Prism],
    tags: ["chat"],
    settings: settings6,
    startAt: "TurbopackReady" /* TurbopackReady */,
    start() {
      if (gestureCtrl)
        return;
      gestureCtrl = new AbortController;
      const markGestured = () => {
        userGestured = true;
        gestureCtrl?.abort();
        gestureCtrl = null;
      };
      for (const evt of ["pointerdown", "keydown", "touchstart"]) {
        addEventListener(evt, markGestured, { capture: true, passive: true, signal: gestureCtrl.signal });
      }
    },
    stop() {
      gestureCtrl?.abort();
      gestureCtrl = null;
    },
    events: {
      streamEnd: onStreamEnd
    }
  });

  // void-css:/tmp/Void/src/plugins/betterImagine/styles.css
  registerStyle("betterImagine", `/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

.void-imagine-chip {
    background: hsl(var(--surface-l1));
}

.void-imagine-chip:hover {
    background: hsl(var(--surface-l2));
}

.void-imagine-search {
    width: 10rem;
    flex-shrink: 0;
    border-radius: 9999px;
}

.void-imagine-date-select,
.void-imagine-sort-select {
    flex-shrink: 0;
    border-radius: 9999px;
    font-size: 0.875rem;
    background: hsl(var(--surface-l1));
    color: hsl(var(--fg-secondary));
    border: none;
}

.void-imagine-sort-active {
    color: hsl(var(--fg-primary));
    background: hsl(var(--surface-l2));
}
`);

  // src/plugins/betterImagine/index.tsx
  var logger17 = new Logger("BetterImagine");
  var cl18 = classNameFactory("void-imagine-");
  var settings7 = definePluginSettings({
    hideDefaultPreviews: {
      type: 3 /* BOOLEAN */,
      description: "Hide the community image grid and templates on the Imagine home page.",
      default: true
    },
    noAutoplay: {
      type: 3 /* BOOLEAN */,
      description: "Stop video thumbnails from autoplaying.",
      default: true
    },
    playOnHover: {
      type: 3 /* BOOLEAN */,
      description: "Play video thumbnails when hovered.",
      default: true
    },
    hideModerated: {
      type: 3 /* BOOLEAN */,
      description: "Hide moderated images and videos that cannot be interacted with.",
      default: true
    },
    pauseWhenHidden: {
      type: 3 /* BOOLEAN */,
      description: "Pause any playing video thumbnails when the tab loses focus.",
      default: true
    },
    persistFilters: {
      type: 3 /* BOOLEAN */,
      description: "Remember Favorites filter + sort across reloads.",
      default: true
    },
    smartFilenames: {
      type: 3 /* BOOLEAN */,
      description: "Rename downloads to YYYY-MM-DD_prompt-slug_id.ext.",
      default: true
    },
    bypassPaywall: {
      type: 3 /* BOOLEAN */,
      description: "Skip the upsell dialog when picking 720p / 10s / video extend. The setting is applied locally; the server still enforces your subscription on generation.",
      default: false
    },
    ctrlClickSelect: {
      type: 3 /* BOOLEAN */,
      description: "Ctrl/Cmd-click an image to add it to the multi-select.",
      default: true
    }
  });
  function buildFilename(post, isVideo) {
    if (!settings7.store.smartFilenames || !post)
      return null;
    const prompt = (post.prompt ?? post.originalPrompt ?? "").trim();
    const slug = sanitizeFilename(prompt.slice(0, 60), "").slice(0, 60);
    const date = post.createTime ? new Date(post.createTime).toISOString().slice(0, 10) : "";
    const id = post.id?.slice(0, 8) ?? "";
    const ext = isVideo ? "mp4" : "png";
    const parts = [date, slug, id].filter(Boolean);
    if (!parts.length)
      return null;
    return `${parts.join("_")}.${ext}`;
  }
  var FILTER_MAP = {
    image: "MEDIA_POST_TYPE_IMAGE",
    video: "MEDIA_POST_TYPE_VIDEO"
  };
  var DATE_LABELS = {
    all: "Any time",
    today: "Today",
    week: "This week",
    month: "This month"
  };
  var SORT_LABELS = {
    newest: "Newest first",
    oldest: "Oldest first",
    "prompt-az": "Prompt A → Z",
    "prompt-za": "Prompt Z → A",
    random: "Shuffle"
  };
  var SORT_KEYS = Object.keys(SORT_LABELS);
  var DAY_MS = 86400000;
  var DATE_CUTOFFS = {
    all: 0,
    today: DAY_MS,
    week: 7 * DAY_MS,
    month: 30 * DAY_MS
  };
  var STORAGE_KEY2 = "void-imagine-filters";
  var DEFAULT_FILTERS = { filter: "all", search: "", date: "all", sort: "newest" };
  function loadFilters() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY2);
      if (!raw)
        return DEFAULT_FILTERS;
      const parsed = JSON.parse(raw);
      return {
        filter: ["all", "image", "video"].includes(parsed.filter) ? parsed.filter : "all",
        search: typeof parsed.search === "string" ? parsed.search : "",
        date: Object.keys(DATE_LABELS).includes(parsed.date) ? parsed.date : "all",
        sort: SORT_KEYS.includes(parsed.sort) ? parsed.sort : "newest"
      };
    } catch {
      return DEFAULT_FILTERS;
    }
  }
  var initial = loadFilters();
  var currentFilter = initial.filter;
  var currentSearch = initial.search;
  var currentDate = initial.date;
  var currentSort = initial.sort;
  var randomSeed = Date.now();
  var filterStore = createExternalStore();
  function persist() {
    if (!settings7.store.persistFilters)
      return;
    try {
      sessionStorage.setItem(STORAGE_KEY2, JSON.stringify({ filter: currentFilter, search: currentSearch, date: currentDate, sort: currentSort }));
    } catch {}
  }
  function setFilter(f) {
    currentFilter = f;
    filterStore.notify();
    persist();
  }
  var setSearch = debounce((s) => {
    currentSearch = s;
    filterStore.notify();
    persist();
  }, 200);
  function setDate(d) {
    currentDate = d;
    filterStore.notify();
    persist();
  }
  function setSort(s) {
    if (s === "random" && currentSort === "random")
      randomSeed = Date.now();
    currentSort = s;
    filterStore.notify();
    persist();
  }
  function resetFilters() {
    currentFilter = "all";
    currentSearch = "";
    currentDate = "all";
    currentSort = "newest";
    filterStore.notify();
    persist();
  }
  function hasActiveFilters() {
    return currentFilter !== "all" || currentSearch.length > 0 || currentDate !== "all";
  }
  function isModerated(p) {
    return !!(p.moderated || p.isModerated) && !p.mediaUrl;
  }
  var haystackCache = new WeakMap;
  var tsCache = new WeakMap;
  var promptCollator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });
  function getHaystack(p) {
    let h = haystackCache.get(p);
    if (h === undefined) {
      h = `${p.prompt ?? ""}
${p.originalPrompt ?? ""}`.toLowerCase();
      haystackCache.set(p, h);
    }
    return h;
  }
  function getTs(p) {
    let t = tsCache.get(p);
    if (t === undefined) {
      t = new Date(p.createTime).getTime() || 0;
      tsCache.set(p, t);
    }
    return t;
  }
  function matchesFilters(p, target, q, cutoff, hideModerated) {
    if (!p)
      return false;
    if (hideModerated && isModerated(p))
      return false;
    if (target && p.mediaType !== target)
      return false;
    if (cutoff && getTs(p) < cutoff)
      return false;
    if (q && !getHaystack(p).includes(q))
      return false;
    return true;
  }
  var cacheKey = null;
  var cacheList = null;
  var cacheResult = [];
  function filterItems(items) {
    const { hideModerated } = settings7.store;
    const key = `${items.length}|${currentFilter}|${currentSearch}|${currentDate}|${currentSort}|${hideModerated ? 1 : 0}|${randomSeed}`;
    if (cacheList === items && cacheKey === key)
      return cacheResult;
    const needsFilter = currentFilter !== "all" || currentSearch || currentDate !== "all" || hideModerated;
    let out = items;
    if (needsFilter) {
      const target = currentFilter !== "all" ? FILTER_MAP[currentFilter] : null;
      const q = currentSearch.toLowerCase();
      const cutoff = DATE_CUTOFFS[currentDate] ? Date.now() - DATE_CUTOFFS[currentDate] : 0;
      out = items.filter((p) => matchesFilters(p, target, q, cutoff, hideModerated));
    }
    cacheList = items;
    cacheKey = key;
    cacheResult = currentSort === "newest" ? out : sortItems(out);
    return cacheResult;
  }
  function mulberry32(seed) {
    let a = seed;
    return () => {
      a |= 0;
      a = a + 1831565813 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function sortItems(items) {
    if (items.length < 2)
      return items;
    const arr = [...items];
    switch (currentSort) {
      case "oldest":
        return arr.toSorted((a, b) => getTs(a) - getTs(b));
      case "prompt-az":
        return arr.toSorted((a, b) => promptCollator.compare(a.prompt ?? "", b.prompt ?? ""));
      case "prompt-za":
        return arr.toSorted((a, b) => promptCollator.compare(b.prompt ?? "", a.prompt ?? ""));
      case "random": {
        const rand = mulberry32(randomSeed);
        for (let i = arr.length - 1;i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      }
      default:
        return arr;
    }
  }
  var pending = new WeakMap;
  function pauseVideo(video) {
    const promise = pending.get(video);
    pending.delete(video);
    if (promise) {
      promise.then(() => {
        if (pending.has(video))
          return;
        video.pause();
        video.currentTime = 0;
      }).catch((e) => logger17.warn("Failed to pause video:", e));
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }
  var onMouseEnter = (e) => {
    const video = e.currentTarget.querySelector("video");
    if (video)
      pending.set(video, video.play().catch((e2) => logger17.error("Failed to play video", e2)));
  };
  var onMouseLeave = (e) => {
    const video = e.currentTarget.querySelector("video");
    if (video)
      pauseVideo(video);
  };
  function useFilteredFavorites() {
    const list = MediaStore.useMediaStore((s) => s.favoritesList);
    useExternalStore(filterStore);
    return filterItems(list);
  }
  function mediaState() {
    return MediaStore.useMediaStore.getState();
  }
  function selectVisible() {
    const state = mediaState();
    const list = state.favoritesList ?? [];
    const visible = filterItems(list);
    if (!visible.length)
      return;
    state.setMultiSelectItems(visible);
    Toaster.toast.success(`Selected ${pluralize(visible.length, "item")}.`);
  }
  function deselectAll() {
    const state = mediaState();
    state.clearMultiSelect?.();
  }
  function selectedPosts() {
    const state = mediaState();
    const ids = Object.keys(state.multiSelectIds ?? {});
    return ids.map((id) => state.byId[id]).filter((p) => !!p);
  }
  async function copyLines(lines, label) {
    if (!lines.length) {
      Toaster.toast.info(`Selected items have no ${label}s.`);
      return;
    }
    try {
      await copyToClipboard(lines.join(`
`));
      Toaster.toast.success(`Copied ${pluralize(lines.length, label)} to clipboard.`);
    } catch (e) {
      logger17.error(`Failed to copy ${label}s`, e);
      Toaster.toast.error(`Failed to copy ${label}s.`);
    }
  }
  async function copySelectedPrompts() {
    const posts = selectedPosts();
    if (!posts.length) {
      Toaster.toast.info("No items selected.");
      return;
    }
    await copyLines(posts.map((p) => (p.prompt ?? p.originalPrompt ?? "").trim()).filter(Boolean), "prompt");
  }
  async function copySelectedUrls() {
    const posts = selectedPosts();
    if (!posts.length) {
      Toaster.toast.info("No items selected.");
      return;
    }
    const { videoByMediaId } = mediaState();
    const urls = posts.map((p) => videoByMediaId[p.id]?.find((v) => v.hdMediaUrl)?.hdMediaUrl ?? p.mediaUrl).filter((u) => !!u);
    await copyLines(urls, "URL");
  }
  async function bulkUpscaleSelected() {
    const state = mediaState();
    const ids = Object.keys(state.multiSelectIds ?? {});
    let upscaled = 0;
    let alreadyHd = 0;
    let inProgress = 0;
    for (const id of ids) {
      const videos = state.videoByMediaId[id];
      if (!videos?.length)
        continue;
      for (const video of videos) {
        if (video.hdMediaUrl) {
          alreadyHd++;
          continue;
        }
        if (video.upscalingInProgress) {
          inProgress++;
          continue;
        }
        try {
          await state.upscaleVideo(id, video.id);
          upscaled++;
        } catch (e) {
          logger17.error("Failed to upscale video:", id, video.id, e);
        }
      }
    }
    if (upscaled)
      Toaster.toast.success(`Upscaling ${pluralize(upscaled, "video")}.`);
    else if (alreadyHd)
      Toaster.toast.info(`${pluralize(alreadyHd, "video")} already in HD.`);
    else if (inProgress)
      Toaster.toast.info(`${pluralize(inProgress, "video")} already upscaling.`);
    else
      Toaster.toast.info("No videos to upscale.");
  }
  function FilterButtons() {
    useExternalStore(filterStore);
    const [searchInput, setSearchInput] = useState(currentSearch);
    const showClear = hasActiveFilters() || currentSort !== "newest" || searchInput.length > 0;
    const sortActive = currentSort !== "newest";
    const lastSync = useRef(currentSearch);
    if (lastSync.current !== currentSearch) {
      lastSync.current = currentSearch;
      setSearchInput(currentSearch);
    }
    return /* @__PURE__ */ React.createElement(Fragment, null, /* @__PURE__ */ React.createElement(Select, {
      value: currentDate,
      onValueChange: (v) => setDate(v)
    }, /* @__PURE__ */ React.createElement(SelectTrigger, {
      className: cl18("date-select")
    }, /* @__PURE__ */ React.createElement(SelectValue, null)), /* @__PURE__ */ React.createElement(SelectContent, null, Object.keys(DATE_LABELS).map((d) => /* @__PURE__ */ React.createElement(SelectItem, {
      key: d,
      value: d
    }, DATE_LABELS[d])))), /* @__PURE__ */ React.createElement(Select, {
      value: currentSort,
      onValueChange: (v) => setSort(v)
    }, /* @__PURE__ */ React.createElement(SelectTrigger, {
      className: sortActive ? cl18("sort-select", "sort-active") : cl18("sort-select")
    }, /* @__PURE__ */ React.createElement(SelectValue, null)), /* @__PURE__ */ React.createElement(SelectContent, null, SORT_KEYS.map((s) => /* @__PURE__ */ React.createElement(SelectItem, {
      key: s,
      value: s
    }, SORT_LABELS[s])))), /* @__PURE__ */ React.createElement(Input, {
      type: "text",
      placeholder: "Search...",
      value: searchInput,
      onChange: (e) => {
        setSearchInput(e.target.value);
        setSearch(e.target.value);
      },
      className: cl18("search")
    }), ["image", "video"].map((f) => /* @__PURE__ */ React.createElement(Button, {
      key: f,
      variant: currentFilter === f ? "primary" : "tertiary",
      size: "sm",
      shape: "pill",
      className: currentFilter !== f ? cl18("chip") : undefined,
      onClick: () => setFilter(currentFilter === f ? "all" : f)
    }, f === "image" ? "Images" : "Videos")), showClear && /* @__PURE__ */ React.createElement(Button, {
      variant: "tertiary",
      size: "sm",
      shape: "pill",
      className: cl18("chip"),
      onClick: resetFilters
    }, "Clear"));
  }
  function UpscaleItem() {
    const [open2, setOpen] = useState(false);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(DropdownMenuItem, {
      onSelect: () => setOpen(true)
    }, /* @__PURE__ */ React.createElement(ScalingIcon, {
      className: "size-4 me-2"
    }), "Upscale videos"), /* @__PURE__ */ React.createElement(ConfirmDialog, {
      open: open2,
      onOpenChange: setOpen,
      title: "Upscale selected videos",
      description: "Start HD upscaling for the selected videos. Already-HD and in-progress videos will be skipped.",
      confirmText: "Upscale",
      onConfirm: bulkUpscaleSelected
    }));
  }
  function CopyActions() {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(DropdownMenuItem, {
      onSelect: copySelectedPrompts
    }, /* @__PURE__ */ React.createElement(CopyIcon, {
      className: "size-4 me-2"
    }), "Copy prompts"), /* @__PURE__ */ React.createElement(DropdownMenuItem, {
      onSelect: copySelectedUrls
    }, /* @__PURE__ */ React.createElement(CopyIcon, {
      className: "size-4 me-2"
    }), "Copy URLs"));
  }
  function isImaginePage() {
    const page = RoutingStore.useRoutingStore.getState().route?.page;
    return page === "imagine" || page === "imagine-favorites";
  }
  function isFavoritesPage() {
    return RoutingStore.useRoutingStore.getState().route?.page === "imagine-favorites";
  }
  function isTypingTarget(t) {
    if (!(t instanceof HTMLElement))
      return false;
    if (t.isContentEditable)
      return true;
    const tag = t.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }
  function onKeyDown2(e) {
    if (!isImaginePage())
      return;
    if (e.ctrlKey || e.metaKey || e.altKey)
      return;
    if (isTypingTarget(e.target))
      return;
    if (e.key === "i" || e.key === "I") {
      setFilter(currentFilter === "image" ? "all" : "image");
      e.preventDefault();
    } else if (e.key === "v" || e.key === "V") {
      setFilter(currentFilter === "video" ? "all" : "video");
      e.preventDefault();
    } else if (e.key === "r" || e.key === "R") {
      resetFilters();
      e.preventDefault();
    } else if (e.key === "A") {
      if (isFavoritesPage()) {
        deselectAll();
        e.preventDefault();
      }
    } else if (e.key === "a") {
      if (isFavoritesPage()) {
        selectVisible();
        e.preventDefault();
      }
    } else if (e.key === "c" || e.key === "C") {
      if (isFavoritesPage() && Object.keys(mediaState().multiSelectIds ?? {}).length) {
        copySelectedPrompts();
        e.preventDefault();
      }
    }
  }
  function onVisibilityChange() {
    if (!settings7.store.pauseWhenHidden)
      return;
    if (document.visibilityState !== "hidden")
      return;
    for (const video of document.querySelectorAll("video")) {
      if (!video.paused)
        video.pause();
    }
  }
  var abortCtrl = null;
  var betterImagine_default = definePlugin({
    name: "BetterImagine",
    icon: ImagesIcon,
    description: "Imagine polish: filter, sort, shortcuts, autoplay control, hide moderated, bulk upscale + copy-prompts, smart filenames, pause-on-hidden.",
    authors: [Devs.Prism],
    tags: ["ui"],
    settings: settings7,
    _hideDefault: () => settings7.store.hideDefaultPreviews,
    _NullGrid: () => null,
    _autoPlay: () => !settings7.store.noAutoplay,
    _bypassPaywall: () => settings7.store.bypassPaywall,
    _ctrlClickSelect: () => settings7.store.ctrlClickSelect,
    _hoverProps: () => settings7.store.playOnHover ? { onMouseEnter, onMouseLeave } : {},
    _useFilteredFavorites: useFilteredFavorites,
    _renderFilterButtons: ErrorBoundary.wrap(FilterButtons, null),
    _renderUpscaleItem: ErrorBoundary.wrap(UpscaleItem, null),
    _renderCopyActions: ErrorBoundary.wrap(CopyActions, null),
    _buildFilename: buildFilename,
    start() {
      if (abortCtrl)
        return;
      abortCtrl = new AbortController;
      const { signal } = abortCtrl;
      document.addEventListener("keydown", onKeyDown2, { capture: true, signal });
      document.addEventListener("visibilitychange", onVisibilityChange, { signal });
    },
    stop() {
      abortCtrl?.abort();
      abortCtrl = null;
    },
    patches: [
      {
        find: "image_feed_opened",
        group: true,
        replacement: [
          {
            match: /\(0,(\i\.jsx)\)\((\i),\{containerRef:(\i),variant:(\i),width:/,
            replace: '(0,$1)($self._hideDefault()&&"favorites"!==$4?$self._NullGrid:$2,{containerRef:$3,variant:$4,width:'
          },
          {
            match: /=\(0,\i\.useMediaStore\)\(\i=>\i\.favoritesList\)/,
            replace: "=$self._useFilteredFavorites()"
          }
        ]
      },
      {
        find: "image_feed_image_selected",
        group: true,
        replacement: [
          {
            match: /autoPlay:!0/g,
            replace: "autoPlay:$self._autoPlay()"
          },
          {
            match: /\.updateShiftPreview\(null\)\)\},onClick:/,
            replace: ".updateShiftPreview(null))},...$self._hoverProps(),onClick:"
          },
          {
            match: /if\(([^)]{1,40})\)return void (\i)\((\i)\);(?=let \i=\{imagine:"home-grid")/,
            replace: "if($1||($self._ctrlClickSelect()&&($3.ctrlKey||$3.metaKey)))return void $2($3);"
          },
          {
            match: /if\(([^)]{1,40})\)return void (\i)\((\i)\);(?=if\(!\i\)return;\i\.useMediaStore\.getState\(\)\.clearMultiSelect)/,
            replace: "if($1||($self._ctrlClickSelect()&&($3.ctrlKey||$3.metaKey)))return void $2($3);"
          }
        ]
      },
      {
        find: 'imagine-folder.all","All"',
        replacement: {
          match: /"imagine-folder\.all","All"\)\}\)/,
          replace: "$&,$self._renderFilterButtons({})"
        }
      },
      {
        find: "imagine-templates.section-title",
        all: true,
        noWarn: true,
        replacement: {
          match: /\?(\i)\.play\(\)\.catch\(\i\):\1\.pause\(\)/,
          replace: "&&$self._autoPlay()?$1.play().catch(()=>{}):$1.pause()"
        }
      },
      {
        find: '"imagine-set-resolution"',
        all: true,
        replacement: {
          match: /return void \i\.useUpsellStore\.getState\(\)\.openUpsell\(\{entrypointKey:"imagine-[\w-]+"\}\)/g,
          replace: "if(!$self._bypassPaywall())$&"
        }
      },
      {
        find: ["imagine-multiselect.add-to-tag", 'DropdownMenuContent,{align:"end",sideOffset:8,children:[(0,'],
        group: true,
        replacement: [
          {
            match: /(?<=\.DropdownMenuContent,\{align:"end",sideOffset:8,children:\[)/,
            replace: "$self._renderUpscaleItem(),$self._renderCopyActions(),"
          },
          {
            match: /`imagine-\$\{(\i)\.slice\(0,8\)\}\.\$\{(\i)\?"mp4":"png"\}`/,
            replace: '($self._buildFilename(e.byId[$1],$2)||`imagine-${$1.slice(0,8)}.${$2?"mp4":"png"}`)'
          }
        ]
      }
    ]
  });

  // src/plugins/noShareLink/index.ts
  var STYLE_NAME2 = "noShareLink";
  var settings8 = definePluginSettings({
    hideShareProject: {
      type: 3 /* BOOLEAN */,
      description: "Inside a project: hide the top-right Share Project button.",
      default: true
    },
    hideCreateShareLink: {
      type: 3 /* BOOLEAN */,
      description: "Not in a project: hide the top-right Create share link button on chats.",
      default: true
    }
  });
  function apply() {
    const rules = [];
    if (settings8.store.hideShareProject) {
      rules.push('button[aria-label="Share Project"]{display:none!important}');
    }
    if (settings8.store.hideCreateShareLink) {
      rules.push('button[aria-label="Create share link"]{display:none!important}');
    }
    registerStyle(STYLE_NAME2, rules.join(`
`));
  }
  var noShareLink_default = definePlugin({
    name: "NoShareLink",
    icon: Link2OffIcon,
    description: "Hide share buttons: Share Project (in a project) and Create share link (top-right of chats).",
    authors: [Devs.p],
    tags: ["ui", "privacy"],
    enabledByDefault: true,
    settings: settings8,
    start: apply,
    onSettingsChange: apply,
    stop() {
      unregisterStyle(STYLE_NAME2);
    }
  });

  // void-css:/tmp/Void/src/plugins/betterFiles/styles.css
  registerStyle("betterFiles", `/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

.group:hover .void-sel-wrap {
    display: inline-flex;
}
`);

  // src/plugins/betterFiles/index.tsx
  var logger18 = new Logger("BetterFiles");
  var selection = createSelectionStore();
  async function deleteAssets(ids) {
    const { deleteAsset } = FilesPageStore.useFilesPageStore.getState();
    for (const id of ids) {
      try {
        await deleteAsset(id);
      } catch (e) {
        logger18.error("Failed to delete asset", id, e);
      }
    }
  }
  function DeleteAllButton() {
    const [open2, setOpen] = useState(false);
    const list = FilesPageStore.useFilesPageStore((s) => s.list);
    if (!list.length)
      return null;
    return /* @__PURE__ */ React.createElement(Fragment, null, /* @__PURE__ */ React.createElement(Button, {
      variant: "tertiary",
      shape: "square",
      size: "sm",
      onClick: () => setOpen(true)
    }, /* @__PURE__ */ React.createElement(TrashIcon, {
      size: 18,
      className: "text-fg-secondary"
    })), /* @__PURE__ */ React.createElement(ConfirmDialog, {
      open: open2,
      onOpenChange: setOpen,
      title: "Delete all files",
      description: `Are you sure you want to delete all ${pluralize(list.length, "file")}? This cannot be undone.`,
      confirmText: "Delete all",
      danger: true,
      onConfirm: () => deleteAssets([...list])
    }));
  }
  var betterFiles_default = definePlugin({
    name: "BetterFiles",
    icon: FilesIcon,
    description: "Adds bulk delete to the files page.",
    authors: [Devs.Prism],
    tags: ["ui"],
    managedStyle: "betterFiles",
    start() {
      selection.clear();
    },
    stop() {
      selection.clear();
    },
    renderDeleteAllButton: ErrorBoundary.wrap(DeleteAllButton),
    _renderFileCheckbox: ErrorBoundary.wrap(({ id }) => /* @__PURE__ */ React.createElement(SelectionCheckbox, {
      selection,
      id
    }), null),
    _renderFileActionBar: ErrorBoundary.wrap(() => /* @__PURE__ */ React.createElement(SelectionActionBar, {
      selection,
      noun: "file",
      title: "Delete files",
      onDelete: deleteAssets
    }), null),
    _wrapFileClick(onClick2, asset) {
      return (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          selection.toggle(asset.assetId);
          return;
        }
        onClick2();
      };
    },
    patches: [
      {
        find: `files.no-results",'No files matching`,
        all: true,
        noWarn: true,
        group: true,
        replacement: [
          {
            match: /("files\.search","Search files"\).{0,600}?children:\[\i,\i)\]/,
            replace: "$1,$self.renderDeleteAllButton()]"
          },
          {
            match: /role:"button",(tabIndex:\i,"aria-disabled":\i,)onClick:(\i),(.{0,120}?children:\[)/,
            replace: 'role:"button",$1onClick:$self._wrapFileClick($2,arguments[0].asset),$3$self._renderFileCheckbox({id:arguments[0].asset.assetId}),'
          },
          {
            match: /("files\.show-less","Show less"\)(?:.{0,400}?children:\[\i,\i\]){2}.{0,400}?children:\[\i,\i)\]/,
            replace: "$1,$self._renderFileActionBar()]"
          }
        ]
      }
    ]
  });

  // src/plugins/noSidebarIdentity/index.ts
  var STYLE_NAME3 = "noSidebarIdentity";
  var FOOTER = '[data-sidebar="footer"]';
  var STACK = `${FOOTER} button[data-slot="button"] div.flex.flex-col.items-start.min-w-0.text-left`;
  var TEXT_WRAP = `${FOOTER} button[data-slot="button"]>div.min-w-0.flex-1.overflow-hidden,${FOOTER} button[data-state]>div.min-w-0.flex-1.overflow-hidden`;
  var settings9 = definePluginSettings({
    hideUsername: {
      type: 3 /* BOOLEAN */,
      description: "Hide the username next to the sidebar avatar.",
      default: true
    },
    hideEmail: {
      type: 3 /* BOOLEAN */,
      description: "Hide the email next to the sidebar avatar.",
      default: true
    }
  });
  function apply2() {
    const rules = [];
    if (settings9.store.hideUsername) {
      rules.push(`${STACK}>:first-child{display:none!important}`);
      rules.push(`${FOOTER} .void-sidebar-name{display:none!important}`);
    }
    if (settings9.store.hideEmail) {
      rules.push(`${STACK}>:nth-child(2){display:none!important}`);
    }
    if (settings9.store.hideUsername && settings9.store.hideEmail) {
      rules.push(`${TEXT_WRAP}{display:none!important}`);
      rules.push(`${FOOTER} .void-sidebar-info{display:none!important}`);
    }
    registerStyle(STYLE_NAME3, rules.join(`
`));
  }
  var noSidebarIdentity_default = definePlugin({
    name: "NoSidebarIdentity",
    icon: UserRoundXIcon,
    description: "Hide username and/or email in the Grok sidebar. Avatar stays clickable.",
    authors: [Devs.p],
    tags: ["ui", "privacy"],
    enabledByDefault: true,
    settings: settings9,
    start: apply2,
    onSettingsChange: apply2,
    stop() {
      unregisterStyle(STYLE_NAME3);
    }
  });

  // void-css:/tmp/Void/src/plugins/betterSidebar/styles.css
  registerStyle("betterSidebar", `.group.peer [data-sidebar="sidebar"] + div,
.group.peer [data-sidebar="content"] > .grow {
    cursor: default !important;
}

.group.peer [data-sidebar="sidebar"] + div::after {
    background-color: transparent !important;
}

.void-sidebar-card {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.15s ease;
    min-width: 0;
    flex: 1;
}

.void-sidebar-card:hover {
    background-color: hsl(var(--surface-l2));
}

.void-sidebar-card button[data-state] {
    pointer-events: none;
    background-color: transparent !important;
    outline: none !important;
    box-shadow: none !important;
}

.void-sidebar-info {
    min-width: 0;
    overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
    .void-sidebar-card { transition: none; }
}

.void-sidebar-name,
.void-sidebar-plan {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    user-select: none;
}

/* stylelint-disable-next-line selector-class-pattern */
.group\\/sidebar-menu-item:hover .void-sel-wrap {
    display: inline-flex;
}
`);

  // src/turbopack/common/plan.ts
  var PLAN_NAMES = {
    SUBSCRIPTION_TIER_X_BASIC: "X Basic",
    SUBSCRIPTION_TIER_X_PREMIUM: "X Premium",
    SUBSCRIPTION_TIER_X_PREMIUM_PLUS: "X Premium+",
    SUBSCRIPTION_TIER_SUPER_GROK_LITE: "SuperGrok Lite",
    SUBSCRIPTION_TIER_GROK_PRO: "SuperGrok",
    SUBSCRIPTION_TIER_SUPER_GROK_PRO: "SuperGrok Pro"
  };
  var X_SUB_NAMES = {
    PremiumPlus: "SuperGrok",
    Premium: "X Premium",
    Basic: "X Basic"
  };
  function getPlanName(bestSubscription, xSubscriptionType) {
    return (bestSubscription ? PLAN_NAMES[bestSubscription] : undefined) ?? (xSubscriptionType ? X_SUB_NAMES[xSubscriptionType] : undefined) ?? "Free";
  }

  // src/plugins/betterSidebar/index.tsx
  var logger19 = new Logger("BetterSidebar");
  var cl19 = classNameFactory("void-sidebar-");
  var settings10 = definePluginSettings({
    clickToToggle: {
      type: 3 /* BOOLEAN */,
      description: "Click anywhere on the sidebar to toggle it.",
      default: true
    },
    defaultCollapsed: {
      type: 3 /* BOOLEAN */,
      description: "Start with the sidebar collapsed on page load.",
      default: false
    },
    batchSelect: {
      type: 3 /* BOOLEAN */,
      description: "Show checkboxes on conversations for bulk selection and deletion.",
      default: true
    }
  });
  function UserCard({ AvatarMenu }) {
    const { open: open2 } = SidebarComponents.useSidebar();
    const { user } = SessionStore.useSession();
    const bestSubscription = SubscriptionsStore.useSubscriptionsStore((s) => s.bestSubscription);
    const cardRef = useRef(null);
    if (!open2 || !user)
      return /* @__PURE__ */ React.createElement(AvatarMenu, null);
    const forward = (e, type) => {
      if (!e.isTrusted)
        return;
      cardRef.current?.querySelector("button[data-state]")?.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, pointerType: "mouse" }));
    };
    return /* @__PURE__ */ React.createElement("div", {
      ref: cardRef,
      className: cl19("card"),
      onPointerDown: (e) => forward(e, "pointerdown"),
      onPointerUp: (e) => forward(e, "pointerup")
    }, /* @__PURE__ */ React.createElement(AvatarMenu, null), /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      justifyContent: "center",
      gap: "0",
      className: cl19("info")
    }, /* @__PURE__ */ React.createElement(Text2, {
      as: "span",
      size: "sm",
      weight: "medium",
      className: cl19("name")
    }, user.givenName ?? user.email?.split("@")[0] ?? "User"), /* @__PURE__ */ React.createElement(Text2, {
      as: "span",
      size: "xs",
      color: "secondary",
      className: cl19("plan")
    }, getPlanName(bestSubscription, user.xSubscriptionType))));
  }
  var selection2 = createSelectionStore();
  var CONVERSATION_PAGE = "chat";
  var isConversationRoute = (route) => route?.page === CONVERSATION_PAGE;
  async function deleteConversations(ids) {
    const currentConvId = ChatPageStore.useChatPageStore.getState().conversationId;
    if (currentConvId && ids.includes(currentConvId)) {
      ChatPageStore.useChatPageStore.getState().setConversationId(undefined);
    }
    const { fetchSoftDeleteConversation } = ConversationStore.useConversationStore.getState();
    await Promise.allSettled(ids.map((id) => fetchSoftDeleteConversation(id).catch((e) => logger19.error("Failed to delete", id, e))));
  }
  function SelectCheckbox({ id, route }) {
    const enabled = settings10.use(["batchSelect"]).batchSelect;
    if (!enabled || !id || !isConversationRoute(route))
      return null;
    return /* @__PURE__ */ React.createElement(SelectionCheckbox, {
      selection: selection2,
      id
    });
  }
  var WrappedCheckbox = ErrorBoundary.wrap(SelectCheckbox, null);
  var betterSidebar_default = definePlugin({
    name: "BetterSidebar",
    icon: PanelLeftIcon,
    description: "Various sidebar improvements.",
    authors: [Devs.Prism],
    tags: ["ui"],
    settings: settings10,
    managedStyle: "betterSidebar",
    _UserCard: ErrorBoundary.wrap(UserCard),
    _renderActionBar: ErrorBoundary.wrap(() => /* @__PURE__ */ React.createElement(SelectionActionBar, {
      selection: selection2,
      noun: "conversation",
      title: "Delete conversations",
      onDelete: deleteConversations
    }), null),
    _wrapCheckbox(item, id, route) {
      return createElement(Fragment, null, createElement(WrappedCheckbox, { id, route }), item);
    },
    _wrapSidebarClick(onClick2, id, route) {
      return (e) => {
        if (id && settings10.store.batchSelect && isConversationRoute(route) && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          e.stopPropagation();
          selection2.toggle(id);
          return;
        }
        onClick2?.(e);
      };
    },
    _defaultOpen() {
      return !settings10.store.defaultCollapsed;
    },
    _onSidebarClick() {
      if (!settings10.store.clickToToggle)
        return;
      return (e) => {
        const target = e.target;
        if (target.closest("button,a,input,[role=button],[data-sidebar=trigger],[data-sidebar=footer]"))
          return;
        e.currentTarget.closest("[data-state]")?.querySelector("[data-sidebar=trigger]")?.click();
      };
    },
    start() {
      selection2.clear();
    },
    stop() {
      selection2.clear();
    },
    patches: [
      {
        find: "AvatarDropdownMenu,{expanded:",
        replacement: {
          match: /\(0,(\i)\.jsx\)\((\i)\.AvatarDropdownMenu,\{/,
          replace: "(0,$1.jsx)($self._UserCard,{AvatarMenu:$2.AvatarDropdownMenu,"
        }
      },
      {
        find: "useSidebar must be used within a SidebarProvider",
        all: true,
        group: true,
        replacement: [
          {
            match: /\{defaultOpen:(\i),open:/,
            replace: "{defaultOpen:$1=$self._defaultOpen(),open:"
          },
          {
            match: /data-sidebar":"sidebar",className:/,
            replace: 'data-sidebar":"sidebar",onClick:$self._onSidebarClick(),className:'
          }
        ]
      },
      {
        find: '"Editing actions","Editing actions"',
        all: true,
        group: true,
        replacement: [
          {
            match: /=(\(0,\i\.jsx\)\(\i,\{title:\i,editing:\i,[^}]{0,80}?validationErrorMessage:\i[^}]{0,40}?\}\))/,
            replace: "=$self._wrapCheckbox($1,arguments[0].id,arguments[0].route)"
          },
          {
            match: /\((\i),\{route:(\i),onClick:(\i),(.{0,40}?className:)/,
            replace: "($1,{route:$2,onClick:$self._wrapSidebarClick($3,arguments[0].id,$2),$4"
          }
        ]
      },
      {
        find: '"sidebar-expand","Expand"',
        replacement: {
          match: /\(0,\i\.jsx\)\(\i\.SidebarSectionTitle,\{title:\i\("sidebar-history"/,
          replace: "$self._renderActionBar(),$&"
        }
      }
    ]
  });

  // void-css:/tmp/Void/src/plugins/settingsFlyout/styles.css
  registerStyle("settingsFlyout", `/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

.void-sf-menu-icon {
    width: 1rem;
    height: 1rem;
    margin-inline-end: 0.5rem;
    color: hsl(var(--fg-secondary));
    flex-shrink: 0;
}

.void-sf-group {
    padding: 0.25rem 0.5rem 0.125rem;
    pointer-events: none;
}

.void-sf-menu {
    max-height: min(24rem, calc(100vh - 6rem));
    overflow-y: auto;
    overscroll-behavior: contain;
}
`);

  // src/plugins/settingsFlyout/icons.tsx
  function grokSvg(props, ...children) {
    return /* @__PURE__ */ React.createElement("svg", {
      width: props.width ?? props.size ?? 16,
      height: props.height ?? props.size ?? 16,
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      className: props.className,
      "aria-hidden": "true"
    }, children);
  }
  var CogIcon = (props = {}) => grokSvg(props, /* @__PURE__ */ React.createElement("path", {
    fill: "currentColor",
    d: "m13.456 1.75.296.445c.832 1.247 1.198 1.654 1.558 1.818.321.146.82.172 2.242-.157l.54-.124 2.171 2.171-.124.54c-.328 1.423-.302 1.921-.156 2.243.164.36.57.726 1.817 1.557l.446.297v2.92l-.446.297c-1.247.831-1.653 1.198-1.817 1.558-.146.32-.172.82.156 2.242l.124.54-2.17 2.17-.54-.123c-1.423-.329-1.922-.303-2.243-.157-.36.164-.726.57-1.558 1.818l-.296.445h-2.92l-.297-.445c-.832-1.247-1.198-1.654-1.558-1.818-.321-.146-.82-.172-2.242.157l-.54.124-2.171-2.171.124-.54c.328-1.423.303-1.921.156-2.242-.164-.36-.57-.727-1.817-1.558l-.445-.297v-2.92l.445-.297c1.247-.831 1.653-1.198 1.817-1.557.147-.322.172-.82-.156-2.243l-.124-.54 2.17-2.17.541.123c1.422.329 1.92.303 2.242.157.36-.164.727-.57 1.558-1.818l.297-.445zm-1.853 2c-.637.93-1.249 1.699-2.092 2.083-.875.4-1.845.324-2.977.092l-.614.613c.232 1.132.308 2.102-.091 2.978-.385.842-1.153 1.454-2.083 2.09v.787c.93.636 1.698 1.248 2.083 2.091.399.876.323 1.845.091 2.977l.614.613c1.132-.232 2.102-.306 2.977.093.843.384 1.455 1.153 2.092 2.083h.785c.637-.93 1.249-1.699 2.092-2.083.875-.399 1.845-.325 2.976-.093l.614-.613c-.232-1.132-.306-2.101.093-2.977.384-.843 1.152-1.455 2.083-2.091v-.787c-.93-.636-1.7-1.248-2.083-2.09-.4-.876-.325-1.846-.093-2.978l-.614-.613c-1.131.232-2.1.307-2.976-.092-.843-.384-1.455-1.153-2.092-2.083zM14.001 12A2 2 0 1 0 10 12a2 2 0 0 0 4 0m2 0A4 4 0 1 1 8 12a4 4 0 0 1 8 0"
  }));
  var PersonIcon = (props = {}) => grokSvg(props, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M12 12.25C16.4183 12.25 20 15.8317 20 20.25V22H4V20.25C4 15.8317 7.58172 12.25 12 12.25ZM12 14.25C8.77005 14.25 6.13694 16.8022 6.00586 20H17.9941C17.8631 16.8022 15.23 14.25 12 14.25Z",
    fill: "currentColor"
  }), /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M12 2C14.4853 2 16.5 4.01472 16.5 6.5C16.5 8.98528 14.4853 11 12 11C9.51472 11 7.5 8.98528 7.5 6.5C7.5 4.01472 9.51472 2 12 2ZM12 4C10.6193 4 9.5 5.11929 9.5 6.5C9.5 7.88071 10.6193 9 12 9C13.3807 9 14.5 7.88071 14.5 6.5C14.5 5.11929 13.3807 4 12 4Z",
    fill: "currentColor"
  }));
  var PaintIcon = (props = {}) => grokSvg(props, /* @__PURE__ */ React.createElement("path", {
    fill: "currentColor",
    d: "M16.2637 3.19188C17.5328 2.03183 19.4908 2.07547 20.707 3.29149C21.9244 4.50883 21.967 6.46969 20.8037 7.73876L20.8027 7.73778L12.4814 16.9038C12.2753 19.4758 10.1251 21.4985 7.5 21.4985H2.5V16.4985C2.50025 13.8741 4.52251 11.7229 7.09375 11.5161L16.2637 3.19188ZM19.293 4.70653C18.8329 4.24643 18.0921 4.2299 17.6123 4.66942L17.6084 4.67333L9.58594 11.9546C10.67 12.453 11.5441 13.3277 12.043 14.4116L19.3262 6.39012L19.3291 6.3872C19.7688 5.90754 19.7529 5.16673 19.293 4.70653ZM4.5 19.4985H7.5C9.15685 19.4985 10.5 18.1554 10.5 16.4985C10.4997 14.8419 9.15669 13.4985 7.5 13.4985C5.84331 13.4985 4.50026 14.8419 4.5 16.4985V19.4985Z"
  }));
  var VisitIcon = (props = {}) => grokSvg(props, /* @__PURE__ */ React.createElement("path", {
    fill: "currentColor",
    d: "M21.5 14.5L19.2402 16.1201L22.0596 18.9404L19.9404 21.0596L17.1201 18.2402L15.5 20.5L13 12L21.5 14.5Z"
  }), /* @__PURE__ */ React.createElement("path", {
    fill: "currentColor",
    d: "M18.5 2C20.433 2 22 3.567 22 5.5V11H20V5.5C20 4.67157 19.3284 4 18.5 4H5.5C4.67157 4 4 4.67157 4 5.5V16.5C4 17.3284 4.67157 18 5.5 18H12V20H5.5C3.567 20 2 18.433 2 16.5V5.5C2 3.567 3.567 2 5.5 2H18.5Z"
  }), /* @__PURE__ */ React.createElement("path", {
    fill: "currentColor",
    d: "M10.4941 5.52441C10.7365 5.57269 10.9591 5.69148 11.1338 5.86621C11.3085 6.04094 11.4273 6.26352 11.4756 6.50586C11.5238 6.74833 11.4999 7.00011 11.4053 7.22852C11.3107 7.45691 11.1499 7.65171 10.9443 7.78906C10.7388 7.92641 10.4972 8 10.25 8C9.91848 8 9.60063 7.86821 9.36621 7.63379C9.13179 7.39937 9 7.08152 9 6.75C9 6.50277 9.07359 6.26123 9.21094 6.05566C9.34829 5.85012 9.54309 5.68933 9.77148 5.59473C9.99989 5.50012 10.2517 5.47618 10.4941 5.52441Z"
  }), /* @__PURE__ */ React.createElement("path", {
    fill: "currentColor",
    d: "M6.75 5.5C7.08152 5.5 7.39937 5.63179 7.63379 5.86621C7.86821 6.10063 8 6.41848 8 6.75C8 6.99723 7.92641 7.23877 7.78906 7.44434C7.65171 7.64988 7.45691 7.81067 7.22852 7.90527C7.00011 7.99988 6.74833 8.02382 6.50586 7.97559C6.26352 7.92731 6.04094 7.80852 5.86621 7.63379C5.69148 7.45906 5.57269 7.23648 5.52441 6.99414C5.47618 6.75167 5.50012 6.49989 5.59473 6.27148C5.68933 6.04309 5.85012 5.84829 6.05566 5.71094C6.26123 5.57359 6.50277 5.5 6.75 5.5Z"
  }), /* @__PURE__ */ React.createElement("path", {
    fill: "currentColor",
    d: "M13.75 5.5C14.0815 5.5 14.3994 5.63179 14.6338 5.86621C14.8682 6.10063 15 6.41848 15 6.75C15 6.99723 14.9264 7.23877 14.7891 7.44434C14.6517 7.64988 14.4569 7.81067 14.2285 7.90527C14.0001 7.99988 13.7483 8.02382 13.5059 7.97559C13.2635 7.92731 13.0409 7.80852 12.8662 7.63379C12.6915 7.45906 12.5727 7.23648 12.5244 6.99414C12.4762 6.75167 12.5001 6.49989 12.5947 6.27148C12.6893 6.04309 12.8501 5.84829 13.0557 5.71094C13.2612 5.57359 13.5028 5.5 13.75 5.5Z"
  }));
  var SlidersIcon = (props = {}) => grokSvg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M21 7H10M14 17H3M20.25 17C20.25 18.6569 18.9069 20 17.25 20C15.5931 20 14.25 18.6569 14.25 17C14.25 15.3431 15.5931 14 17.25 14C18.9069 14 20.25 15.3431 20.25 17ZM9.75 7C9.75 8.65685 8.40685 10 6.75 10C5.09315 10 3.75 8.65685 3.75 7C3.75 5.34315 5.09315 4 6.75 4C8.40685 4 9.75 5.34315 9.75 7Z",
    stroke: "currentColor",
    strokeLinejoin: "round",
    strokeWidth: "2"
  }));
  var PaymentsIcon = (props = {}) => grokSvg(props, /* @__PURE__ */ React.createElement("path", {
    fill: "currentColor",
    d: "M12.9004 7.83984C13.0629 7.87413 13.2225 7.91676 13.376 7.96777C13.9053 8.14378 14.4688 8.45248 14.8301 8.95215L13.3711 10.0068C13.3148 9.92902 13.1447 9.78764 12.8086 9.67578C12.4889 9.56951 12.1071 9.52104 11.75 9.5459C11.3842 9.57147 11.1204 9.6686 10.9727 9.77734C10.6672 10.0025 10.7901 10.4692 11.0615 10.6533C11.3259 10.8325 11.7135 10.964 12.2734 11.1426C12.7633 11.2988 13.4271 11.5024 13.9502 11.8574C14.5404 12.2581 15.0008 12.8825 15.001 13.8027C15.001 14.6074 14.6157 15.2292 14.0645 15.6318C13.716 15.8862 13.3104 16.0473 12.9004 16.1426V17.5H11.1006V16.1924C10.8876 16.158 10.6783 16.1108 10.4785 16.0488C9.92674 15.8775 9.3358 15.5675 8.95996 15.0479L10.4189 13.9932C10.4778 14.0743 10.6555 14.2195 11.0117 14.3301C11.3503 14.4351 11.7577 14.4787 12.1426 14.4453C12.5359 14.411 12.8313 14.303 13.0029 14.1777C13.3128 13.9513 13.2321 13.5454 12.9395 13.3467C12.6751 13.1673 12.2868 13.0361 11.7266 12.8574C11.2368 12.7012 10.5739 12.4974 10.0508 12.1426C9.46027 11.7419 9.00013 11.1178 9 10.1973V10.1328C9 9.34586 9.36032 8.72911 9.9043 8.32812C10.2629 8.06395 10.6821 7.90612 11.1006 7.82129V6.5H12.9004V7.83984Z"
  }), /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z",
    fill: "currentColor"
  }));
  var LightningIcon = (props = {}) => grokSvg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M5 14.25L14 4L13 9.75H19L10 20L11 14.25H5Z",
    stroke: "currentColor",
    strokeWidth: "2"
  }));
  var DatabaseIcon = (props = {}) => grokSvg(props, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M20.5 18C20.5 18.7778 20.1017 19.4178 19.5977 19.8945C19.0957 20.3692 18.423 20.7505 17.6748 21.0498C16.1726 21.6507 14.1657 22 12 22C9.83428 22 7.82743 21.6507 6.3252 21.0498C5.57697 20.7505 4.90428 20.3692 4.40234 19.8945C3.89825 19.4178 3.5 18.7778 3.5 18V5.5C3.5 4.71709 3.97721 4.13013 4.4707 3.74121C4.97543 3.34352 5.64416 3.02877 6.38086 2.7832C7.86497 2.28858 9.85158 2 12 2C14.1484 2 16.135 2.28858 17.6191 2.7832C18.3558 3.02877 19.0246 3.34352 19.5293 3.74121C20.0228 4.13013 20.5 4.71709 20.5 5.5V18ZM18.5 14.166C18.2396 14.3063 17.963 14.4345 17.6748 14.5498C16.1726 15.1507 14.1657 15.5 12 15.5C9.83428 15.5 7.82743 15.1507 6.3252 14.5498C6.03697 14.4345 5.76036 14.3063 5.5 14.166V18C5.5 18.0506 5.52142 18.2003 5.77637 18.4414C6.03343 18.6845 6.4595 18.9488 7.06836 19.1924C8.28059 19.6773 10.0236 20 12 20C13.9764 20 15.7194 19.6773 16.9316 19.1924C17.5405 18.9488 17.9666 18.6845 18.2236 18.4414C18.4786 18.2003 18.5 18.0506 18.5 18V14.166ZM5.5 11.5C5.5 11.5506 5.52142 11.7003 5.77637 11.9414C6.03343 12.1845 6.4595 12.4488 7.06836 12.6924C8.28059 13.1773 10.0236 13.5 12 13.5C13.9764 13.5 15.7194 13.1773 16.9316 12.6924C17.5405 12.4488 17.9666 12.1845 18.2236 11.9414C18.4786 11.7003 18.5 11.5506 18.5 11.5V7.86914C18.2226 7.99709 17.9273 8.11407 17.6191 8.2168C16.135 8.71142 14.1484 9 12 9C9.85158 9 7.86497 8.71142 6.38086 8.2168C6.07267 8.11407 5.77737 7.99709 5.5 7.86914V11.5ZM12 4C10.0065 4 8.24301 4.27056 7.0127 4.68066C6.39238 4.88745 5.96226 5.11212 5.70801 5.3125C5.59875 5.39864 5.5459 5.46254 5.51953 5.5C5.5459 5.53746 5.59875 5.60136 5.70801 5.6875C5.96226 5.88788 6.39238 6.11255 7.0127 6.31934C8.24301 6.72944 10.0065 7 12 7C13.9935 7 15.757 6.72944 16.9873 6.31934C17.6076 6.11255 18.0377 5.88788 18.292 5.6875C18.4008 5.60171 18.453 5.53752 18.4795 5.5C18.453 5.46248 18.4008 5.39829 18.292 5.3125C18.0377 5.11212 17.6076 4.88745 16.9873 4.68066C15.757 4.27056 13.9935 4 12 4Z",
    fill: "currentColor"
  }));

  // src/plugins/settingsFlyout/index.tsx
  var cl20 = classNameFactory("void-sf-");
  var settings11 = definePluginSettings({
    showOpenSettings: {
      type: 3 /* BOOLEAN */,
      description: 'Show "Open Settings" (last used tab).',
      default: true
    },
    voidPosition: {
      type: 4 /* SELECT */,
      description: "Place Void tabs above or below Grok tabs.",
      options: [
        { label: "Above Grok tabs", value: "above", default: true },
        { label: "Below Grok tabs", value: "below" }
      ]
    },
    plugins: {
      type: 3 /* BOOLEAN */,
      description: "Plugins",
      default: true
    },
    themes: {
      type: 3 /* BOOLEAN */,
      description: "Themes",
      default: true
    },
    css: {
      type: 3 /* BOOLEAN */,
      description: "Quick CSS",
      default: true
    },
    account: {
      type: 3 /* BOOLEAN */,
      description: "Account",
      default: true
    },
    appearance: {
      type: 3 /* BOOLEAN */,
      description: "Appearance",
      default: true
    },
    behavior: {
      type: 3 /* BOOLEAN */,
      description: "Behavior",
      default: true
    },
    customize: {
      type: 3 /* BOOLEAN */,
      description: "Customize",
      default: true
    },
    billing: {
      type: 3 /* BOOLEAN */,
      description: "Billing",
      default: true
    },
    usage: {
      type: 3 /* BOOLEAN */,
      description: "Usage",
      default: true
    },
    data: {
      type: 3 /* BOOLEAN */,
      description: "Data Controls",
      default: true
    }
  });
  var GROK_TABS = [
    { id: "account", name: "Account", setting: "account", icon: PersonIcon },
    { id: "appearance", name: "Appearance", setting: "appearance", icon: PaintIcon },
    { id: "behavior", name: "Behavior", setting: "behavior", icon: VisitIcon },
    { id: "personality", name: "Customize", setting: "customize", icon: SlidersIcon },
    { id: "billing", name: "Billing", setting: "billing", icon: PaymentsIcon },
    { id: "usage", name: "Usage", setting: "usage", icon: LightningIcon },
    { id: "data", name: "Data Controls", setting: "data", icon: DatabaseIcon }
  ];
  var VOID_TABS = [
    { id: "void_plugins_tab", name: "Plugins", setting: "plugins", icon: UnplugIcon },
    { id: "void_themes_tab", name: "Themes", setting: "themes", icon: PaletteIcon },
    { id: "void_css_tab", name: "Quick CSS", setting: "css", icon: BracesIcon }
  ];
  function openTab(tab, onOpen, event) {
    const store2 = SettingsDialogStore.useSettingsDialogStore.getState();
    if (tab) {
      store2.setTab(tab);
      store2.setOpen(true);
      return;
    }
    try {
      onOpen?.(event);
    } catch {}
    store2.setOpen(true);
  }
  function tabItems(tabs) {
    return tabs.map((t) => {
      const Icon = t.icon;
      return /* @__PURE__ */ React.createElement(DropdownMenuItem, {
        key: t.id,
        onSelect: () => openTab(t.id)
      }, /* @__PURE__ */ React.createElement(Icon, {
        className: cl20("menu-icon")
      }), t.name);
    });
  }
  function VoidSection({ tabs }) {
    if (tabs.length === 0)
      return null;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text2, {
      size: "xs",
      color: "secondary",
      className: cl20("group")
    }, "Void"), tabItems(tabs));
  }
  function SettingsMenu({ onOpen }) {
    const cfg = settings11.use([
      "showOpenSettings",
      "voidPosition",
      "plugins",
      "themes",
      "css",
      "account",
      "appearance",
      "behavior",
      "customize",
      "billing",
      "usage",
      "data"
    ]);
    const grokTabs = GROK_TABS.filter((t) => cfg[t.setting]);
    const voidTabs = VOID_TABS.filter((t) => cfg[t.setting]);
    const showOpen = cfg.showOpenSettings || grokTabs.length === 0 && voidTabs.length === 0;
    const voidFirst = cfg.voidPosition !== "below";
    const hasBoth = grokTabs.length > 0 && voidTabs.length > 0;
    return /* @__PURE__ */ React.createElement(DropdownMenuSub, null, /* @__PURE__ */ React.createElement(DropdownMenuSubTrigger, null, /* @__PURE__ */ React.createElement(CogIcon, {
      className: cl20("menu-icon")
    }), "Settings"), /* @__PURE__ */ React.createElement(DropdownMenuSubContent, {
      className: cl20("menu")
    }, showOpen && /* @__PURE__ */ React.createElement(DropdownMenuItem, {
      onSelect: (e) => openTab(undefined, onOpen, e)
    }, /* @__PURE__ */ React.createElement(CogIcon, {
      className: cl20("menu-icon")
    }), "Open Settings"), showOpen && (voidTabs.length > 0 || grokTabs.length > 0) && /* @__PURE__ */ React.createElement(DropdownMenuSeparator, null), voidFirst && /* @__PURE__ */ React.createElement(VoidSection, {
      tabs: voidTabs
    }), voidFirst && hasBoth && /* @__PURE__ */ React.createElement(DropdownMenuSeparator, null), tabItems(grokTabs), !voidFirst && hasBoth && /* @__PURE__ */ React.createElement(DropdownMenuSeparator, null), !voidFirst && /* @__PURE__ */ React.createElement(VoidSection, {
      tabs: voidTabs
    })));
  }
  var WrappedSettingsMenu = ErrorBoundary.wrap(SettingsMenu);
  var settingsFlyout_default = definePlugin({
    name: "SettingsFlyout",
    icon: Settings2Icon,
    description: "Replace the avatar Settings item with a flyout of shortcuts to Void and Grok settings tabs.",
    authors: [Devs.p],
    tags: ["ui", "settings"],
    enabledByDefault: true,
    requiresRestart: true,
    settings: settings11,
    _renderSettingsMenu: (onOpen) => createElement(WrappedSettingsMenu, { onOpen }),
    patches: [
      {
        find: '"user-dropdown.settings","Settings"',
        replacement: {
          match: /\jsx{\i\.DropdownMenuItem}\{onSelect:(\i),children:\[\jsx{\i\.CogIcon}\{[^}]{0,80}\}\),\i\("user-dropdown\.settings","Settings"\)\]\}\)/,
          replace: "$self._renderSettingsMenu($1)"
        }
      }
    ]
  });

  // src/plugins/composerOpacity/index.ts
  var STYLE_NAME4 = "composerOpacity";
  var SHELL = ".query-bar";
  var FRAME = "form:has(.query-bar),form:has(.query-bar)>:first-child";
  var FRAME_KIDS = "form:has(.query-bar)>:first-child>*";
  var BACKDROP = ".chat-input-backdrop,.pointer-events-none.absolute.bottom-0.z-0[class*=bg-gradient-to-t]";
  var RADIUS = "var(--border-t-radius,10rem) var(--border-t-radius,10rem) var(--border-b-radius,10rem) var(--border-b-radius,10rem)";
  var settings12 = definePluginSettings({
    opacity: {
      type: 5 /* SLIDER */,
      description: "Background opacity of the chat input. 100 is fully opaque.",
      min: 0,
      max: 100,
      default: 100
    },
    blur: {
      type: 5 /* SLIDER */,
      description: "Backdrop blur in pixels. Helps when opacity is below 100.",
      min: 0,
      max: 40,
      default: 16
    }
  });
  function apply3() {
    const pct = clamp(settings12.store.opacity, 0, 100);
    const blur = clamp(settings12.store.blur, 0, 40);
    const alpha = pct / 100;
    const frost = pct < 100 && blur > 0 ? `-webkit-backdrop-filter:blur(${blur}px)!important;backdrop-filter:blur(${blur}px)!important;` : "-webkit-backdrop-filter:none!important;backdrop-filter:none!important;";
    registerStyle(STYLE_NAME4, `${FRAME}{background:transparent!important;background-image:none!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;pointer-events:none!important}` + `${FRAME_KIDS}{pointer-events:auto!important}` + `${BACKDROP}{display:none!important}` + `${SHELL}{` + `background-color:hsl(var(--surface-l1)/${alpha})!important;` + "background-image:none!important;" + `border-radius:${RADIUS}!important;` + "overflow:hidden!important;" + `clip-path:inset(0 round ${RADIUS})!important;` + frost + "}");
  }
  var composerOpacity_default = definePlugin({
    name: "ComposerOpacity",
    icon: BlendIcon,
    description: "Customizable chat input background opacity so content behind the bar cannot show through.",
    authors: [Devs.p],
    tags: ["ui", "chat"],
    enabledByDefault: true,
    settings: settings12,
    start: apply3,
    onSettingsChange: apply3,
    stop() {
      unregisterStyle(STYLE_NAME4);
    }
  });

  // void-css:/tmp/Void/src/plugins/usageDisplay/styles.css
  registerStyle("usageDisplay", `/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

.void-ud-trigger {
    display: flex;
    gap: 0.25rem;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
}

.void-ud-label {
    font-size: 0.875rem;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
}

button:has(.void-ud-trigger) {
    height: 2.5rem;
    min-height: 2.5rem;
}

button:has(.void-ud-icon-only) {
    width: 2.5rem;
    min-width: 2.5rem;
    padding-inline: 0;
}

button:has(.void-ud-trigger > .void-ud-label) {
    width: auto;
    border-radius: 999px;
    padding-inline: 0.5rem;
}

.void-ud-ring {
    display: block;
    color: inherit;
}

.void-ud-ring-track {
    fill: none;
    stroke: color-mix(in srgb, currentcolor 35%, transparent);
    stroke-width: 2;
}

.void-ud-ring-fill {
    fill: none;
    stroke: currentcolor;
    stroke-width: 2;
    stroke-linecap: round;
}

.void-ud-ring-warning {
    color: hsl(var(--fg-warning));
}

.void-ud-ring-danger {
    color: hsl(var(--fg-danger));
}

.void-ud-panel {
    min-width: 11rem;
}

.void-ud-used {
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
}

.void-ud-today {
    padding-bottom: 0.5rem;
    border-bottom: 1px solid color-mix(in srgb, currentcolor 16%, transparent);
}

.void-ud-history {
    min-height: 0;
    flex: 1;
}

.void-ud-chart {
    min-height: 0;
    overflow-x: auto;
    height: 9.25rem;
    outline: none;
}

.void-ud-bar {
    flex: 1 0 2.5rem;
    min-width: 2.5rem;
    height: 100%;
    padding: 0.25rem 0.15rem 0.2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 0.3rem;
    border-radius: 0.5rem;
    color: inherit;
    cursor: pointer;
}

.void-ud-bar:hover,
.void-ud-bar-on {
    background: hsl(var(--surface-l2));
}

.void-ud-bar-track {
    display: flex;
    flex: 1;
    align-items: flex-end;
    justify-content: center;
    width: 100%;
    min-height: 0;
}

.void-ud-bar-fill {
    width: 1.1rem;
    min-height: 2px;
    border-radius: 4px 4px 0 0;
    background: hsl(var(--fg-primary) / 0.45);
}

.void-ud-bar-on .void-ud-bar-fill {
    background: hsl(var(--fg-primary));
}

.void-ud-bar-empty .void-ud-bar-fill {
    background: hsl(var(--border-l1));
}

.void-ud-bar-value {
    font-size: 0.6875rem;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    font-weight: 550;
    min-height: 0.6875rem;
    white-space: nowrap;
    opacity: 0.85;
}

.void-ud-bar-empty .void-ud-bar-value {
    opacity: 0;
}

.void-ud-bar-on .void-ud-bar-value {
    opacity: 1;
}

.void-ud-bar-label {
    font-size: 0.6875rem;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    opacity: 0.7;
    white-space: nowrap;
}

.void-ud-bar-on .void-ud-bar-label {
    opacity: 1;
    font-weight: 550;
}

.void-ud-detail {
    padding-top: 0.5rem;
    border-top: 1px solid color-mix(in srgb, currentcolor 16%, transparent);
}

.void-ud-formula {
    width: max-content;
    max-width: 100%;
    font-variant-numeric: tabular-nums;
}

.void-ud-formula-term,
.void-ud-formula-op-col {
    min-width: 0;
}

.void-ud-formula-label,
.void-ud-formula-value,
.void-ud-formula-op {
    display: block;
    width: 100%;
    text-align: center;
    font-size: 0.875rem;
    line-height: 1.2;
}

.void-ud-formula-label,
.void-ud-formula-op {
    color: hsl(var(--fg-secondary));
}

.void-ud-formula-value {
    font-weight: 550;
}

.void-ud-toggle {
    width: 100%;
}
`);

  // src/plugins/usageDisplay/credits.ts
  var CREDITS_CONFIG_PATH = "/grok_api_v2.GrokBuildBilling/GetGrokCreditsConfig";
  var REQUEST_TIMEOUT_MS = 12000;
  var WEEKLY_LIMIT_RE = /Weekly SuperGrok.{0,24}Limit|每周.{0,24}SuperGrok.{0,24}(?:Limit|限额)/i;
  function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  function finiteNumber(value) {
    if (typeof value === "number")
      return Number.isFinite(value) ? value : null;
    if (typeof value !== "string" || value.trim() === "")
      return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  function normalizeText(value) {
    return String(value ?? "").replaceAll(" ", " ").replaceAll(/[\t ]+/g, " ").trim();
  }
  function formatPercent(value) {
    const number = finiteNumber(value);
    if (number === null)
      return "—";
    const rounded = Math.round(number * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
  }
  function usageTone(value) {
    const percent = finiteNumber(value);
    if (percent === null)
      return "waiting";
    if (percent >= 90)
      return "danger";
    if (percent >= 70)
      return "warning";
    return "normal";
  }
  function readProtoVarint(bytes, startIndex) {
    let value = 0;
    let index = startIndex;
    let shift = 0;
    for (let count = 0;index < bytes.length && count < 10; count++) {
      const byte = bytes[index++];
      value += (byte & 127) * 2 ** shift;
      if ((byte & 128) === 0)
        return { value, index };
      shift += 7;
    }
    return null;
  }
  function readProtoFields(bytes) {
    const fields = [];
    let index = 0;
    while (index < bytes.length) {
      const tag = readProtoVarint(bytes, index);
      if (!tag)
        break;
      index = tag.index;
      const fieldNumber = Math.floor(tag.value / 8);
      const wireType = tag.value & 7;
      if (fieldNumber <= 0)
        break;
      if (wireType === 0) {
        const value = readProtoVarint(bytes, index);
        if (!value)
          break;
        index = value.index;
        fields.push({ number: fieldNumber, wire: wireType, value: value.value });
      } else if (wireType === 1) {
        if (index + 8 > bytes.length)
          break;
        fields.push({ number: fieldNumber, wire: wireType, value: bytes.slice(index, index + 8) });
        index += 8;
      } else if (wireType === 2) {
        const length = readProtoVarint(bytes, index);
        if (!length || length.value < 0 || index + length.value > bytes.length)
          break;
        index = length.index;
        if (index + length.value > bytes.length)
          break;
        fields.push({ number: fieldNumber, wire: wireType, value: bytes.slice(index, index + length.value) });
        index += length.value;
      } else if (wireType === 5) {
        if (index + 4 > bytes.length)
          break;
        fields.push({ number: fieldNumber, wire: wireType, value: bytes.slice(index, index + 4) });
        index += 4;
      } else {
        break;
      }
    }
    return fields;
  }
  function grpcDataFrame(bytes) {
    let index = 0;
    while (index + 5 <= bytes.length) {
      const flags = bytes[index];
      const length = bytes[index + 1] * 16777216 + bytes[index + 2] * 65536 + bytes[index + 3] * 256 + bytes[index + 4];
      index += 5;
      if (index + length > bytes.length)
        return null;
      const frame = bytes.slice(index, index + length);
      index += length;
      if ((flags & 128) === 0)
        return frame;
    }
    return null;
  }
  function collectProtoTimestamps(bytes, output, depth) {
    if (depth > 6)
      return;
    for (const field of readProtoFields(bytes)) {
      if (field.wire === 0) {
        const value = finiteNumber(field.value);
        if (value !== null && value >= 1e9 && value <= 4102444800) {
          output.push(value);
        }
      } else if (field.wire === 2 && field.value instanceof Uint8Array) {
        collectProtoTimestamps(field.value, output, depth + 1);
      }
    }
  }
  function formatResetTime(seconds) {
    const value = finiteNumber(seconds);
    if (value === null)
      return "";
    try {
      return new Date(value * 1000).toLocaleString([], {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  }
  function parseResetAt(text) {
    const trimmed = normalizeText(text);
    if (!trimmed)
      return null;
    const parsed = Date.parse(trimmed.replace(/\s+at\s+/i, " "));
    return Number.isFinite(parsed) ? parsed : null;
  }
  function decodeCreditsConfig(bytes) {
    const data = grpcDataFrame(bytes);
    if (!data)
      return null;
    const configField = readProtoFields(data).find((field) => field.number === 1 && field.wire === 2);
    if (!configField || !(configField.value instanceof Uint8Array))
      return null;
    const percentField = readProtoFields(configField.value).find((field) => field.number === 1 && field.wire === 5);
    let usedPercent = 0;
    if (percentField && percentField.value instanceof Uint8Array && percentField.value.length >= 4) {
      const view = new DataView(percentField.value.buffer, percentField.value.byteOffset, percentField.value.byteLength);
      const decodedPercent = view.getFloat32(0, true);
      if (Number.isFinite(decodedPercent))
        usedPercent = clamp(decodedPercent, 0, 100);
    }
    const timestamps = [];
    collectProtoTimestamps(configField.value, timestamps, 0);
    const resetSeconds = timestamps.length ? Math.max(...timestamps) : null;
    return {
      weekly: {
        label: "Weekly SuperGrok Limit",
        usedPercent,
        resetText: formatResetTime(resetSeconds),
        resetAt: resetSeconds === null ? null : resetSeconds * 1000,
        categories: []
      }
    };
  }
  function normalizeNativeUsage(value) {
    if (!isRecord(value) || !isRecord(value.weekly))
      return null;
    const { weekly } = value;
    const usedPercent = finiteNumber(weekly.usedPercent);
    const resetText = normalizeText(weekly.resetText).slice(0, 160);
    const resetAt = finiteNumber(weekly.resetAt) ?? parseResetAt(resetText);
    const categories = Array.isArray(weekly.categories) ? weekly.categories.map((item) => {
      if (!isRecord(item))
        return null;
      const percent = finiteNumber(item.percent);
      const label = normalizeText(item.label).slice(0, 120);
      return label && percent !== null ? { label, percent: clamp(percent, 0, 100) } : null;
    }).filter((item) => item != null).slice(0, 20) : [];
    return {
      weekly: {
        label: normalizeText(weekly.label || "Weekly SuperGrok Limit").slice(0, 120),
        usedPercent: usedPercent === null ? null : clamp(usedPercent, 0, 100),
        resetText,
        resetAt,
        categories
      }
    };
  }
  function mergeNativeUsage(...sources) {
    let merged = null;
    for (const source of sources) {
      const next = normalizeNativeUsage(source);
      if (!next)
        continue;
      if (!merged) {
        merged = next;
        continue;
      }
      const previousWeekly = merged.weekly;
      const nextWeekly = next.weekly;
      merged = {
        weekly: {
          ...previousWeekly,
          ...nextWeekly,
          usedPercent: nextWeekly.usedPercent === null ? previousWeekly.usedPercent : nextWeekly.usedPercent,
          resetText: nextWeekly.resetText || previousWeekly.resetText,
          resetAt: nextWeekly.resetAt ?? previousWeekly.resetAt,
          categories: nextWeekly.categories.length ? nextWeekly.categories : previousWeekly.categories
        }
      };
    }
    return merged;
  }
  function linesFromPage() {
    const text = document.body?.innerText || document.body?.textContent;
    return String(text || "").split(/\r?\n/).map(normalizeText).filter(Boolean);
  }
  function findLineIndex(lines, pattern) {
    pattern.lastIndex = 0;
    return lines.findIndex((line) => {
      pattern.lastIndex = 0;
      return pattern.test(line);
    });
  }
  function readUsagePercentFromDom() {
    const selectors = [
      "number-flow-react[aria-label]",
      '[role="img"][aria-label]',
      '[aria-label*="%"]'
    ];
    const seen = new Set;
    for (const selector of selectors) {
      let elements;
      try {
        elements = document.querySelectorAll(selector);
      } catch {
        continue;
      }
      for (const element of elements) {
        if (seen.has(element))
          continue;
        seen.add(element);
        const ariaLabel = normalizeText(element.getAttribute("aria-label"));
        const match = ariaLabel.match(/^(\d+(?:\.\d+)?)\s*%$/);
        if (!match)
          continue;
        let ancestor = element;
        for (let depth = 0;ancestor && depth < 8; depth++) {
          const context = normalizeText(ancestor.textContent);
          WEEKLY_LIMIT_RE.lastIndex = 0;
          if (WEEKLY_LIMIT_RE.test(context) && /\bused\b|已使用/i.test(context)) {
            return Number(match[1]);
          }
          ancestor = ancestor.parentElement;
        }
      }
    }
    return null;
  }
  function usedPercentFromPage(domPercent, usedMatch) {
    if (domPercent !== null)
      return domPercent;
    if (usedMatch)
      return Number(usedMatch[1]);
    return null;
  }
  function readNativeUsage(lines = linesFromPage()) {
    const weeklyIndex = findLineIndex(lines, WEEKLY_LIMIT_RE);
    if (weeklyIndex < 0)
      return null;
    const weeklyLines = [];
    for (const line of lines.slice(weeklyIndex, weeklyIndex + 16)) {
      if (weeklyLines.length > 0 && /^(?:Usage Limit Reset|Extra Usage Credits|使用限额重置|额外使用额度)$/i.test(line)) {
        break;
      }
      weeklyLines.push(line);
    }
    const usedLineIndex = weeklyLines.findIndex((line) => /\bused\b|已使用/i.test(line));
    const usedLine = usedLineIndex >= 0 ? weeklyLines[usedLineIndex] : "";
    const previousLine = usedLineIndex > 0 ? weeklyLines[usedLineIndex - 1] : "";
    const usedMatch = `${previousLine} ${usedLine}`.match(/(\d+(?:\.\d+)?)\s*%\s*(?:used|已使用)/i);
    const domPercent = readUsagePercentFromDom();
    const resetLine = weeklyLines.find((line) => /Resets|重置/i.test(line));
    const resetMatch = resetLine?.match(/(?:Resets|重置)\s+(.+)/i);
    const categories = [];
    for (const line of weeklyLines) {
      const match = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*%$/);
      if (!match || /used|已使用|resets|重置/i.test(match[1]))
        continue;
      categories.push({ label: normalizeText(match[1]), percent: Number(match[2]) });
    }
    return {
      weekly: {
        label: lines[weeklyIndex],
        usedPercent: usedPercentFromPage(domPercent, usedMatch),
        resetText: resetMatch ? normalizeText(resetMatch[1]) : "",
        resetAt: resetMatch ? parseResetAt(resetMatch[1]) : null,
        categories
      }
    };
  }
  async function fetchOfficialUsage() {
    const controller = typeof AbortController === "function" ? new AbortController : null;
    const timeout = controller ? window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;
    try {
      const response = await fetch(new URL(CREDITS_CONFIG_PATH, location.href).href, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          accept: "*/*",
          "content-type": "application/grpc-web+proto",
          "x-grpc-web": "1",
          "x-user-agent": "connect-es/2.1.1"
        },
        body: new Uint8Array([0, 0, 0, 0, 0]),
        ...controller ? { signal: controller.signal } : {}
      });
      if (!response.ok)
        throw new Error(`HTTP ${response.status}`);
      const usage = decodeCreditsConfig(new Uint8Array(await response.arrayBuffer()));
      if (!usage)
        throw new Error("unsupported-official-usage-schema");
      return usage;
    } finally {
      if (timeout !== null)
        window.clearTimeout(timeout);
    }
  }
  var STORAGE_PREFIX = "void-usage-display:v1:";
  function readStoredUsage(userId) {
    if (!userId)
      return null;
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_PREFIX + userId) || "null");
      if (!isRecord(stored) || stored.version !== 1 || stored.userId !== userId)
        return null;
      return normalizeNativeUsage(stored.nativeUsage);
    } catch {
      return null;
    }
  }
  function persistUsage(userId, usage, updatedAt) {
    if (!userId)
      return;
    try {
      localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify({
        version: 1,
        userId,
        updatedAt,
        nativeUsage: normalizeNativeUsage(usage)
      }));
    } catch {}
  }

  // src/plugins/usageDisplay/stats.ts
  var STATS_STORAGE_PREFIX = "void-usage-display:stats:v1:";
  var STATS_VERSION = 1;
  var RESET_DROP_PERCENT = 5;
  var RETAIN_MIN = 7;
  var RETAIN_MAX = 180;
  var RETAIN_DEFAULT = 90;
  var DELAY_MIN = 0;
  var DELAY_MAX = 5;
  var DELAY_DEFAULT = 1;
  var CHART_WINDOW = 7;
  var CHART_SCALE_MIN = 20;
  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  var DAY_MS2 = 86400000;
  var logger20 = new Logger("UsageDisplay");
  function isRecord2(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  function clampPercent(value) {
    const n = finiteNumber(value);
    return n == null ? null : clamp(n, 0, 100);
  }
  function localDateKey(at) {
    const d = new Date(at);
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function startOfLocalDay(at) {
    const d = new Date(at);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  function emptyDay(date, now) {
    return {
      date,
      startPercent: null,
      lastPercent: null,
      resetAt: null,
      updatedAt: now
    };
  }
  function normalizeDay(date, value) {
    if (!DATE_RE.test(date) || !isRecord2(value))
      return null;
    return {
      date,
      startPercent: clampPercent(value.startPercent),
      lastPercent: clampPercent(value.lastPercent),
      resetAt: finiteNumber(value.resetAt),
      updatedAt: finiteNumber(value.updatedAt) ?? 0
    };
  }
  function emptyStore(userId) {
    return { version: STATS_VERSION, userId, days: {} };
  }
  var memory = new Map;
  function storeGet(key) {
    if (typeof localStorage === "undefined")
      return memory.get(key) ?? null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      logger20.debug("Failed to read usage stats", error);
      return memory.get(key) ?? null;
    }
  }
  function storeSet(key, value) {
    if (typeof localStorage === "undefined") {
      memory.set(key, value);
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      logger20.debug("Failed to persist usage stats", error);
      memory.set(key, value);
    }
  }
  function storeRemove(key) {
    if (typeof localStorage === "undefined") {
      memory.delete(key);
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger20.debug("Failed to clear usage stats", error);
      memory.delete(key);
    }
  }
  function loadStore(userId) {
    if (!userId)
      return emptyStore("");
    try {
      const raw = JSON.parse(storeGet(STATS_STORAGE_PREFIX + userId) || "null");
      if (!isRecord2(raw) || raw.version !== STATS_VERSION || raw.userId !== userId || !isRecord2(raw.days)) {
        return emptyStore(userId);
      }
      const days = {};
      for (const [date, value] of Object.entries(raw.days)) {
        const rec = normalizeDay(date, value);
        if (rec)
          days[date] = rec;
      }
      return { version: STATS_VERSION, userId, days };
    } catch (error) {
      logger20.debug("Failed to read usage stats", error);
      return emptyStore(userId);
    }
  }
  function saveStore(file) {
    if (!file.userId)
      return;
    storeSet(STATS_STORAGE_PREFIX + file.userId, JSON.stringify(file));
  }
  function applySnapshot(record, percent, resetAt, now) {
    const next = { ...record, updatedAt: now };
    if (resetAt != null && next.resetAt != null && resetAt !== next.resetAt) {
      next.startPercent = percent;
      next.lastPercent = percent;
      next.resetAt = resetAt;
      return next;
    }
    if (resetAt != null)
      next.resetAt = resetAt;
    if (percent == null)
      return next;
    if (next.lastPercent != null && percent < next.lastPercent - RESET_DROP_PERCENT) {
      next.startPercent = percent;
      next.lastPercent = percent;
      return next;
    }
    if (next.startPercent == null)
      next.startPercent = percent;
    next.lastPercent = percent;
    return next;
  }
  function dayDelta(record) {
    if (record.startPercent == null || record.lastPercent == null)
      return null;
    return Math.max(0, record.lastPercent - record.startPercent);
  }
  function formatDelta(value) {
    if (value == null)
      return "—";
    const label = formatPercent(value);
    return value > 0 ? `+${label}` : label;
  }
  function formatDayLabel(date) {
    const parts = date.split("-").map(Number);
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];
    if (!y || !m || !d)
      return date;
    return new Date(y, m - 1, d).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
  }
  function formatDayNumber(date) {
    const day = date.split("-")[2];
    return day ? String(Number(day)) : date;
  }
  function shiftDateKey(date, days) {
    const parts = date.split("-").map(Number);
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];
    if (!y || !m || !d)
      return date;
    return localDateKey(new Date(y, m - 1, d + days).getTime());
  }
  function fillChartDays(records, now = Date.now()) {
    const today = localDateKey(now);
    const byDate = new Map;
    let oldest = today;
    for (const rec of records) {
      byDate.set(rec.date, rec);
      if (rec.date < oldest)
        oldest = rec.date;
    }
    const weekStart = shiftDateKey(today, 1 - CHART_WINDOW);
    const start = oldest < weekStart ? oldest : weekStart;
    const out = [];
    for (let key = start;key <= today; key = shiftDateKey(key, 1)) {
      out.push(byDate.get(key) ?? emptyDay(key, now));
    }
    return out;
  }
  function chartScale(records) {
    let max = 0;
    for (const rec of records) {
      const delta = dayDelta(rec);
      if (delta != null && delta > max)
        max = delta;
    }
    return Math.max(CHART_SCALE_MIN, Math.ceil(max / 10) * 10);
  }
  function pruneDays(days, retainDays, now) {
    const keep = clamp(Math.floor(retainDays), RETAIN_MIN, RETAIN_MAX);
    const cutoff = localDateKey(startOfLocalDay(now) - (keep - 1) * DAY_MS2);
    const out = {};
    for (const [date, rec] of Object.entries(days)) {
      if (date >= cutoff)
        out[date] = rec;
    }
    return out;
  }
  function persistDay(userId, date, record, retainDays, now) {
    const file = loadStore(userId);
    file.days[date] = record;
    file.days = pruneDays(file.days, retainDays, now);
    saveStore(file);
    return file.days[date] ?? record;
  }
  function recordSnapshot(userId, percent, resetAt, retainDays, now = Date.now()) {
    if (!userId)
      return null;
    const date = localDateKey(now);
    const current = loadStore(userId).days[date] ?? emptyDay(date, now);
    return persistDay(userId, date, applySnapshot(current, percent, resetAt, now), retainDays, now);
  }
  function readToday(userId, now = Date.now()) {
    if (!userId)
      return null;
    return loadStore(userId).days[localDateKey(now)] ?? null;
  }
  function listDays(userId) {
    if (!userId)
      return [];
    const { days } = loadStore(userId);
    const out = [];
    for (const date of Object.keys(days).toSorted((a, b) => b.localeCompare(a))) {
      const rec = days[date];
      if (rec)
        out.push(rec);
    }
    return out;
  }
  function clearStats(userId) {
    if (!userId)
      return;
    storeRemove(STATS_STORAGE_PREFIX + userId);
  }
  function retainDaysOf(value) {
    return clamp(Math.floor(finiteNumber(value) ?? RETAIN_DEFAULT), RETAIN_MIN, RETAIN_MAX);
  }
  function hoverDelayOf(value) {
    return clamp(Math.floor(finiteNumber(value) ?? DELAY_DEFAULT), DELAY_MIN, DELAY_MAX);
  }

  // src/plugins/usageDisplay/index.tsx
  var logger21 = new Logger("UsageDisplay");
  var cl21 = classNameFactory("void-ud-");
  var settings13 = definePluginSettings({
    usageStats: {
      type: 3 /* BOOLEAN */,
      description: "Record daily usage. Hover shows today after a delay; click opens history.",
      default: false
    },
    showPercent: {
      type: 3 /* BOOLEAN */,
      description: "Show the used-percent label next to the ring.",
      default: false
    },
    hoverStatsDelay: {
      type: 5 /* SLIDER */,
      description: "Seconds to hover before showing today's usage stats.",
      min: DELAY_MIN,
      max: DELAY_MAX,
      default: DELAY_DEFAULT
    },
    retainDays: {
      type: 5 /* SLIDER */,
      description: "Days of usage history to keep.",
      min: RETAIN_MIN,
      max: RETAIN_MAX,
      default: RETAIN_DEFAULT
    },
    clearStats: {
      type: 6 /* COMPONENT */,
      component: ClearStats
    }
  });
  var AUTO_REFRESH_MS = 60 * 1000;
  var STALE_MS = 30 * 1000;
  var DAY_SECONDS = 86400;
  var RING_SIZE = 18;
  var RING_RADIUS = 7;
  var RING_CENTER = RING_SIZE / 2;
  var RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  var LOCAL_ACCOUNT = "local";
  var store2 = createExternalStore();
  var state = {
    loading: false,
    lastFetchAt: 0,
    lastUpdatedAt: 0,
    usage: null,
    userId: ""
  };
  var refreshPromise = null;
  function sessionUser() {
    try {
      const user = SessionStore.getSessionStoreState?.()?.user;
      if (user)
        return user;
    } catch {}
    try {
      return SessionStore.sessionStoreState?.getState?.()?.user;
    } catch {
      return;
    }
  }
  function currentUserId() {
    const user = sessionUser();
    return user?.userId || user?.xUserId || LOCAL_ACCOUNT;
  }
  function loadMemory(userId) {
    if (!userId || userId === state.userId)
      return;
    const stored = readStoredUsage(userId);
    state.userId = userId;
    state.usage = stored;
    state.lastUpdatedAt = stored ? Date.now() : 0;
    state.lastFetchAt = 0;
    store2.notify();
  }
  function syncAccount() {
    const userId = currentUserId();
    if (!userId)
      return;
    loadMemory(userId);
  }
  function migrateUsageStats() {
    const stored = PlainSettings.plugins.UsageDisplay;
    if (!stored || !("trackStats" in stored))
      return;
    if (stored.trackStats === true)
      stored.usageStats = true;
    delete stored.trackStats;
    SettingsStore3.markAsChanged();
  }
  function snapshotToday() {
    if (!settings13.store.usageStats)
      return;
    syncAccount();
    if (!state.userId)
      return;
    recordSnapshot(state.userId, state.usage?.weekly.usedPercent ?? null, state.usage?.weekly.resetAt ?? null, retainDaysOf(settings13.store.retainDays));
  }
  async function refresh(reason = "manual") {
    if (refreshPromise)
      return refreshPromise;
    if (reason === "poll" && Date.now() - state.lastFetchAt < STALE_MS)
      return false;
    syncAccount();
    state.loading = true;
    state.lastFetchAt = Date.now();
    store2.notify();
    refreshPromise = (async () => {
      try {
        const pageUsage = readNativeUsage();
        const remote = await fetchOfficialUsage().then((usage) => ({ ok: true, usage })).catch((error) => {
          logger21.warn("Failed to fetch official usage", error);
          return { ok: false };
        });
        const merged = mergeNativeUsage(state.usage, remote.ok ? remote.usage : null, pageUsage);
        if (merged)
          state.usage = merged;
        if (state.usage || pageUsage)
          state.lastUpdatedAt = Date.now();
        if (state.userId)
          persistUsage(state.userId, state.usage, state.lastUpdatedAt);
        snapshotToday();
        return Boolean(state.usage);
      } finally {
        state.loading = false;
        refreshPromise = null;
        store2.notify();
      }
    })();
    return refreshPromise;
  }
  function onVisibility() {
    if (!document.hidden && Date.now() - state.lastFetchAt > STALE_MS)
      refresh("visible");
  }
  function onStreamEnd2() {
    refresh("stream");
  }
  function readPlan() {
    let bestSubscription;
    try {
      bestSubscription = SubscriptionsStore.useSubscriptionsStore.getState().bestSubscription;
    } catch {
      bestSubscription = undefined;
    }
    return getPlanName(bestSubscription, sessionUser()?.xSubscriptionType) === "Free";
  }
  function triggerLabel(isFree, percent, loading, showPercent) {
    if (isFree)
      return "Free";
    if (!showPercent)
      return null;
    if (percent !== null)
      return formatPercent(percent);
    return loading ? "…" : "—";
  }
  function usedLabel(isFree, percent, loading) {
    if (isFree)
      return "Free";
    if (percent !== null)
      return `${formatPercent(percent)} used`;
    return loading ? "…" : "—";
  }
  function formatResetCountdown(totalSeconds) {
    if (totalSeconds <= 0)
      return formatCountdown(0);
    const days = Math.floor(totalSeconds / DAY_SECONDS);
    const rest = totalSeconds % DAY_SECONDS;
    return days > 0 ? `${days}d ${formatCountdown(rest)}` : formatCountdown(rest);
  }
  function ProgressRing({ percent, tone }) {
    const fraction = percent === null ? 0 : clamp(percent, 0, 100) / 100;
    return /* @__PURE__ */ React.createElement("svg", {
      width: RING_SIZE,
      height: RING_SIZE,
      viewBox: `0 0 ${RING_SIZE} ${RING_SIZE}`,
      className: classes(cl21("ring"), cl21(`ring-${tone}`))
    }, /* @__PURE__ */ React.createElement("circle", {
      cx: RING_CENTER,
      cy: RING_CENTER,
      r: RING_RADIUS,
      className: cl21("ring-track")
    }), /* @__PURE__ */ React.createElement("circle", {
      cx: RING_CENTER,
      cy: RING_CENTER,
      r: RING_RADIUS,
      className: cl21("ring-fill"),
      strokeDasharray: RING_CIRCUMFERENCE,
      strokeDashoffset: RING_CIRCUMFERENCE * (1 - fraction),
      transform: `rotate(-90 ${RING_CENTER} ${RING_CENTER})`
    }));
  }
  function ButtonIcon() {
    useExternalStore(store2);
    const { showPercent } = settings13.use(["showPercent"]);
    const weekly = state.usage?.weekly;
    const percent = weekly?.usedPercent ?? null;
    const tone = usageTone(percent);
    const isFree = readPlan();
    const label = triggerLabel(isFree, percent, state.loading, showPercent);
    useEffect(() => {
      refresh("initial");
      const id = window.setInterval(() => {
        if (!document.hidden)
          refresh("poll");
      }, AUTO_REFRESH_MS);
      document.addEventListener("visibilitychange", onVisibility);
      return () => {
        window.clearInterval(id);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }, []);
    return /* @__PURE__ */ React.createElement("span", {
      className: classes(cl21("trigger"), label == null && cl21("icon-only"))
    }, /* @__PURE__ */ React.createElement(ProgressRing, {
      percent: isFree ? null : percent,
      tone: isFree ? "waiting" : tone
    }), label != null && /* @__PURE__ */ React.createElement("span", {
      className: cl21("label")
    }, label));
  }
  function WeekBlock({ isFree, percent, resetAt, loading, labeled }) {
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
      if (resetAt == null)
        return;
      const id = window.setInterval(() => setNow(Date.now()), 1000);
      return () => window.clearInterval(id);
    }, [resetAt]);
    const left = resetAt == null ? 0 : Math.max(0, Math.ceil((resetAt - now) / 1000));
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: 2,
      className: cl21("week")
    }, labeled && /* @__PURE__ */ React.createElement(Text2, {
      size: "xs",
      color: "muted"
    }, "Week"), /* @__PURE__ */ React.createElement(Text2, {
      size: "sm",
      weight: "semibold",
      className: cl21("used")
    }, usedLabel(isFree, percent, loading)), resetAt != null && /* @__PURE__ */ React.createElement(Text2, {
      size: "xs",
      color: "muted"
    }, "Resets in ", formatResetCountdown(left)));
  }
  function TodayBlock({ isFree, percent }) {
    const today = state.userId ? readToday(state.userId) : null;
    const delta = today ? dayDelta(today) : null;
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: 2,
      className: cl21("today")
    }, /* @__PURE__ */ React.createElement(Text2, {
      size: "xs",
      color: "muted"
    }, "Today"), !isFree && /* @__PURE__ */ React.createElement(Text2, {
      size: "sm",
      weight: "semibold",
      className: cl21("used")
    }, formatDelta(delta ?? (percent != null ? 0 : null)), " of weekly quota"));
  }
  function UsagePanel() {
    useExternalStore(store2);
    const { usageStats, hoverStatsDelay } = settings13.use(["usageStats", "hoverStatsDelay"]);
    const delay = hoverDelayOf(hoverStatsDelay);
    const [showToday, setShowToday] = useState(usageStats && delay <= 0);
    const weekly = state.usage?.weekly;
    const percent = weekly?.usedPercent ?? null;
    const isFree = readPlan();
    const resetAt = weekly?.resetAt ?? null;
    useEffect(() => {
      if (!usageStats) {
        setShowToday(false);
        return;
      }
      if (delay <= 0) {
        setShowToday(true);
        return;
      }
      setShowToday(false);
      const id = window.setTimeout(() => setShowToday(true), delay * 1000);
      return () => window.clearTimeout(id);
    }, [usageStats, delay]);
    useEffect(() => {
      if (!showToday)
        return;
      snapshotToday();
      store2.notify();
    }, [showToday, percent]);
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: 8,
      className: cl21("panel")
    }, showToday && /* @__PURE__ */ React.createElement(TodayBlock, {
      isFree,
      percent
    }), /* @__PURE__ */ React.createElement(WeekBlock, {
      isFree,
      percent,
      resetAt,
      loading: state.loading,
      labeled: showToday
    }));
  }
  function StatsToggle() {
    const { usageStats } = settings13.use(["usageStats"]);
    return /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.75rem",
      className: cl21("toggle")
    }, /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0"
    }, /* @__PURE__ */ React.createElement(Text2, {
      size: "sm",
      weight: "medium"
    }, "Daily usage stats"), /* @__PURE__ */ React.createElement(Text2, {
      size: "xs",
      color: "muted"
    }, "Record local daily usage on this device.")), /* @__PURE__ */ React.createElement(Switch, {
      checked: !!usageStats,
      onCheckedChange: (value) => {
        settings13.store.usageStats = value;
        store2.notify();
        if (value)
          refresh("manual");
      }
    }));
  }
  function StatsModal({ onClose }) {
    useExternalStore(store2);
    const { usageStats } = settings13.use(["usageStats"]);
    const days = usageStats && state.userId ? listDays(state.userId) : [];
    const todayKey = localDateKey(Date.now());
    const bars = days.length ? fillChartDays(days) : [];
    const scale = chartScale(bars);
    const [selected, setSelected] = useState(todayKey);
    const active = bars.find((d) => d.date === selected) ?? bars.at(-1) ?? null;
    const chartRef = useRef(null);
    useEffect(() => {
      const node = chartRef.current;
      if (node)
        node.scrollLeft = node.scrollWidth;
    }, [bars.length]);
    useEffect(() => {
      chartRef.current?.querySelector(`.${cl21("bar-on")}`)?.scrollIntoView({ inline: "nearest", block: "nearest" });
    }, [selected]);
    return /* @__PURE__ */ React.createElement(VoidDialogShell, {
      title: "Usage by date",
      subtitle: "Stored on this device.",
      onClose,
      size: "sm"
    }, /* @__PURE__ */ React.createElement(StatsToggle, null), !usageStats ? /* @__PURE__ */ React.createElement(Paragraph, null, "Turn on daily usage stats to keep a per-day log. Hover shows today after a delay.") : days.length === 0 ? /* @__PURE__ */ React.createElement(Paragraph, null, "No days recorded yet. Stats start from the moment you enable tracking.") : /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.75rem",
      className: cl21("history")
    }, /* @__PURE__ */ React.createElement(Flex, {
      ref: chartRef,
      className: cl21("chart"),
      alignItems: "stretch",
      gap: "0.35rem",
      tabIndex: 0,
      role: "listbox",
      "aria-label": "Daily usage",
      onKeyDown: (e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight")
          return;
        e.preventDefault();
        const i = Math.max(0, bars.findIndex((d) => d.date === active?.date));
        const next = bars[clamp(i + (e.key === "ArrowRight" ? 1 : -1), 0, bars.length - 1)];
        if (next)
          setSelected(next.date);
      }
    }, bars.map((rec) => {
      const delta = dayDelta(rec);
      const empty = delta == null;
      const on = rec.date === active?.date;
      const pct = empty || !scale ? 0 : clamp(delta / scale * 100, 0, 100);
      return /* @__PURE__ */ React.createElement(Button, {
        key: rec.date,
        variant: "none",
        size: "none",
        shape: "rectangle",
        tabIndex: -1,
        role: "option",
        "aria-selected": on,
        "aria-label": `${rec.date === todayKey ? "Today" : formatDayLabel(rec.date)}, ${formatDelta(delta)}`,
        className: classes(cl21("bar"), on && cl21("bar-on"), empty && cl21("bar-empty")),
        onClick: () => setSelected(rec.date)
      }, /* @__PURE__ */ React.createElement("span", {
        className: cl21("bar-value")
      }, empty ? " " : formatPercent(delta)), /* @__PURE__ */ React.createElement("span", {
        className: cl21("bar-track")
      }, /* @__PURE__ */ React.createElement("span", {
        className: cl21("bar-fill"),
        style: { height: `${pct}%` }
      })), /* @__PURE__ */ React.createElement("span", {
        className: cl21("bar-label")
      }, rec.date === todayKey ? "Today" : formatDayNumber(rec.date)));
    })), active != null && /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.35rem",
      className: cl21("detail")
    }, /* @__PURE__ */ React.createElement(Text2, {
      size: "sm",
      weight: "semibold"
    }, active.date === todayKey ? "Today" : formatDayLabel(active.date)), /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "flex-start",
      gap: "0.5rem",
      className: cl21("formula")
    }, /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      alignItems: "center",
      className: cl21("formula-term")
    }, /* @__PURE__ */ React.createElement("span", {
      className: cl21("formula-label")
    }, active.date === todayKey ? "Current" : "Last"), /* @__PURE__ */ React.createElement("span", {
      className: cl21("formula-value")
    }, formatPercent(active.lastPercent))), /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      alignItems: "center",
      className: cl21("formula-op-col")
    }, /* @__PURE__ */ React.createElement("span", {
      className: cl21("formula-op")
    }, "−"), /* @__PURE__ */ React.createElement("span", {
      className: cl21("formula-op")
    }, "−")), /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      alignItems: "center",
      className: cl21("formula-term")
    }, /* @__PURE__ */ React.createElement("span", {
      className: cl21("formula-label")
    }, "Start"), /* @__PURE__ */ React.createElement("span", {
      className: cl21("formula-value")
    }, formatPercent(active.startPercent))), /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      alignItems: "center",
      className: cl21("formula-op-col")
    }, /* @__PURE__ */ React.createElement("span", {
      className: cl21("formula-op")
    }, "="), /* @__PURE__ */ React.createElement("span", {
      className: cl21("formula-op")
    }, "=")), /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      alignItems: "center",
      className: cl21("formula-term")
    }, /* @__PURE__ */ React.createElement("span", {
      className: cl21("formula-label")
    }, "Used"), /* @__PURE__ */ React.createElement("span", {
      className: cl21("formula-value")
    }, formatPercent(dayDelta(active))))))));
  }
  function ClearStats() {
    useExternalStore(store2);
    const [open2, setOpen] = useState(false);
    const userId = state.userId || currentUserId();
    const days = userId ? listDays(userId) : [];
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.5rem"
    }, /* @__PURE__ */ React.createElement(Paragraph, null, pluralize(days.length, "recorded day"), "."), /* @__PURE__ */ React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      shape: "rectangle",
      disabled: !days.length,
      onClick: () => setOpen(true)
    }, "Clear usage history"), /* @__PURE__ */ React.createElement(ConfirmDialog, {
      open: open2,
      onOpenChange: setOpen,
      title: "Clear usage history",
      description: "Delete all locally recorded daily usage? This cannot be undone.",
      confirmText: "Clear",
      danger: true,
      onConfirm: () => {
        if (userId)
          clearStats(userId);
        store2.notify();
      }
    }));
  }
  function openHistory() {
    refresh("manual");
    openModal((props) => /* @__PURE__ */ React.createElement(SafeStatsModal, {
      ...props
    }), { modalKey: "void-ud-stats" });
  }
  var SafeButtonIcon = ErrorBoundary.wrap(ButtonIcon);
  var SafeUsagePanel = ErrorBoundary.wrap(UsagePanel);
  var SafeStatsModal = ErrorBoundary.wrap(StatsModal);
  var BUTTON_BASE = {
    icon: () => /* @__PURE__ */ React.createElement(SafeButtonIcon, null),
    onClick: () => openHistory(),
    order: 1,
    className: "text-fg-primary",
    "aria-label": "Grok usage",
    locations: ["chat", "imagine"]
  };
  var usageDisplay_default = definePlugin({
    name: "UsageDisplay",
    icon: CircleGaugeIcon,
    description: "Shows official weekly SuperGrok usage in the chat bar, with optional daily stats.",
    authors: [Devs.p],
    tags: ["chat"],
    enabledByDefault: true,
    settings: settings13,
    start() {
      migrateUsageStats();
    },
    chatBarButton: { ...BUTTON_BASE, tooltip: () => /* @__PURE__ */ React.createElement(SafeUsagePanel, null) },
    events: {
      streamEnd: onStreamEnd2
    },
    onSettingsChange() {
      if (settings13.store.usageStats)
        refresh("manual");
    }
  });

  // src/plugins/cleaner/index.ts
  var settings14 = definePluginSettings({
    hideUpgradePlan: {
      type: 3 /* BOOLEAN */,
      description: "Hide the upgrade plan button in the user menu.",
      default: true
    },
    hideUpsellCard: {
      type: 3 /* BOOLEAN */,
      description: "Hide the upsell card banner.",
      default: true
    },
    hideUpsellSmall: {
      type: 3 /* BOOLEAN */,
      description: "Hide the small SuperGrok upsell banner.",
      default: true
    },
    hideModelUpsell: {
      type: 3 /* BOOLEAN */,
      description: "Hide the upgrade prompt in the model selector.",
      default: true
    },
    hideInaccessibleModels: {
      type: 3 /* BOOLEAN */,
      description: "Hide locked/inaccessible models in the model selector.",
      default: true
    },
    hideNotificationBanner: {
      type: 3 /* BOOLEAN */,
      description: 'Hide the "Get notified when Grok finishes answering" banner.',
      default: true
    },
    hideConnectX: {
      type: 3 /* BOOLEAN */,
      description: 'Hide the "Connect your \uD835\uDD4F account" upsell popout.',
      default: true
    }
  });
  var hideComponentPatch = (name, setting, all = true) => ({
    find: `"${name}",0,`,
    all,
    replacement: {
      match: new RegExp(`"${name}",0,`),
      replace: `"${name}",0,$self.settings.store.${setting}?()=>null:`
    }
  });
  var cleaner_default = definePlugin({
    name: "Cleaner",
    icon: BrushCleaningIcon,
    description: "Hides upgrade nags and upsell banners.",
    authors: [Devs.Prism],
    tags: ["ui"],
    enabledByDefault: true,
    settings: settings14,
    patches: [
      {
        find: '"user-dropdown.upgrade","Upgrade plan"',
        all: true,
        replacement: {
          match: /,(\i)(?=\?null:.{0,160}"user-dropdown\.upgrade")/,
          replace: ",$self.settings.store.hideUpgradePlan||$1"
        }
      },
      {
        find: "UPSELL_CARD_PRIORITY)",
        all: true,
        replacement: {
          match: /(\(0,\i\.useIsUpsellLayerVisible\)\(\i\.UPSELL_CARD_PRIORITY\))/,
          replace: "$1&&!$self.settings.store.hideUpsellCard"
        }
      },
      hideComponentPatch("UpsellSuperGrokSmall", "hideUpsellSmall"),
      hideComponentPatch("UpsellButton", "hideUpsellSmall", false),
      {
        find: "connect-x-upsell-dismissed",
        replacement: {
          match: /\.ENABLE_X_INTEGRATION&&(\i\.SHOW_CONNECT_X_UPSELL)/,
          replace: ".ENABLE_X_INTEGRATION&&!$self.settings.store.hideConnectX&&$1"
        }
      },
      hideComponentPatch("BrowserNotificationBanner", "hideNotificationBanner"),
      {
        find: ["mode-select.search-placeholder", "UPSELL_MODEL_SELECT_PRIORITY"],
        all: true,
        group: true,
        replacement: [
          {
            match: /UPSELL_MODEL_SELECT_PRIORITY\),.{0,200}?if\(/,
            replace: "$&$self.settings.store.hideModelUpsell||"
          },
          {
            match: /upgradePrimaryModes:(\i),unavailablePrimaryModes:(\i)\}/,
            replace: "upgradePrimaryModes:$self.settings.store.hideInaccessibleModels?[]:$1,unavailablePrimaryModes:$self.settings.store.hideInaccessibleModels?[]:$2}"
          }
        ]
      }
    ]
  });

  // void-css:/tmp/Void/src/plugins/cloneChats/styles.css
  registerStyle("cloneChats", `.void-clone-icon {
    margin-inline-end: 0.5rem;
}
`);

  // src/plugins/cloneChats/index.tsx
  var logger22 = new Logger("CloneChats");
  async function cloneChat(conversationId) {
    const lastResponseId = ResponseStore.useResponseStore.getState().nodesByConversationId[conversationId]?.at(-1)?.responseId;
    if (!lastResponseId)
      throw new Error("No responses found in conversation.");
    const { shareLinkId } = await ApiClients.chatApi.chatShareConversation({
      conversationId,
      body: { responseId: lastResponseId, allowIndexing: false }
    });
    if (!shareLinkId)
      throw new Error("Failed to create share link.");
    try {
      const { conversation } = await ApiClients.chatApi.chatCloneConversation({ shareLinkId, body: {} });
      if (conversation?.conversationId) {
        RoutingStore.useRoutingStore.getState().push({ page: "chat", conversationId: conversation.conversationId });
      }
    } finally {
      ApiClients.chatApi.chatDeleteShareLink({ shareLinkId }).catch(() => {});
    }
  }
  function CloneItem({ conversationId }) {
    const streaming = useIsStreaming(conversationId);
    return /* @__PURE__ */ React.createElement(MenuItem, {
      onSelect: () => cloneChat(conversationId).catch((e) => logger22.error("Failed to clone chat:", e)),
      disabled: streaming
    }, /* @__PURE__ */ React.createElement(CopyIcon, {
      size: 16,
      className: "void-clone-icon"
    }), "Clone");
  }
  var cloneChats_default = definePlugin({
    name: "CloneChats",
    icon: CopyIcon,
    description: "Clone conversations from the context-menu.",
    authors: [Devs.Prism],
    tags: ["chat"],
    contextMenuItems: {
      conversation: {
        label: "Clone",
        render: ErrorBoundary.wrap(CloneItem)
      }
    }
  });

  // src/plugins/betterLinks/index.tsx
  var DEFAULT_LINK = "#4a9eff";
  var DEFAULT_VISITED = "#9b59b6";
  var STYLE_NAME5 = "better-links-dynamic";
  var DOMAIN_RE = /(?<![a-zA-Z0-9@/:.#])(?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.(?:com|org|net|io|dev|app|co|ai|gov|edu|me|xyz|gg|tv|cc|so|is|info|tech|pro|site|store|cloud|online|icu|top|be|ly|sh|to|fm|am|us|uk|ca|de|fr|es|it|nl|jp|cn|ru|br|au|in|eu)(?:\/[^\s<>"'`)\]},]*)?/g;
  function isValidHex(c) {
    return /^#[0-9a-fA-F]{6}$/.test(c);
  }
  function getColor(key, fallback) {
    const val = settings15.store[key];
    return val && isValidHex(val) ? val : fallback;
  }
  function applyColors() {
    const link = getColor("linkColor", DEFAULT_LINK);
    let css = `.void-colored-link{color:${link}!important;text-decoration-color:${link}!important}`;
    if (settings15.store.enableVisitedColor) {
      const visited = getColor("visitedColor", DEFAULT_VISITED);
      css += `.void-colored-link:visited{color:${visited}!important;text-decoration-color:${visited}!important}`;
    }
    registerStyle(STYLE_NAME5, css);
  }
  function ColorRow({ settingKey, title, description, fallback }) {
    settings15.use([settingKey]);
    return /* @__PURE__ */ React.createElement(ColorSettingRow, {
      value: getColor(settingKey, fallback),
      onChange: (v) => {
        settings15.store[settingKey] = v;
        applyColors();
      },
      title,
      description
    });
  }
  var settings15 = definePluginSettings({
    linkifyDomains: {
      type: 3 /* BOOLEAN */,
      description: "Detect bare domains in messages and make them clickable.",
      default: true
    },
    enableVisitedColor: {
      type: 3 /* BOOLEAN */,
      description: "Apply a different color to links you already visited.",
      default: false,
      onChange: applyColors
    },
    linkColor: {
      type: 6 /* COMPONENT */,
      component: () => /* @__PURE__ */ React.createElement(ColorRow, {
        settingKey: "linkColor",
        title: "Link color",
        description: "Colorize links in messages.",
        fallback: DEFAULT_LINK
      })
    },
    visitedColor: {
      type: 6 /* COMPONENT */,
      component: () => /* @__PURE__ */ React.createElement(ColorRow, {
        settingKey: "visitedColor",
        title: "Visited color",
        description: "Colorize links you already visited.",
        fallback: DEFAULT_VISITED
      })
    }
  }).withPrivateSettings();
  var betterLinks_default = definePlugin({
    name: "BetterLinks",
    icon: LinkIcon,
    description: "Colorize links and detect bare domains in chat messages.",
    authors: [Devs.Prism],
    tags: ["chat"],
    settings: settings15,
    patches: [
      {
        find: "chat-markdown:a:link",
        all: true,
        replacement: {
          match: /target:"_blank",rel:"noopener noreferrer nofollow",onClick:/,
          replace: 'target:"_blank",rel:"noopener noreferrer nofollow",className:"void-colored-link",onClick:'
        }
      },
      {
        find: "chat-markdown-load-third-party",
        replacement: {
          match: /singleDollarTextMath:!1\}\],([^\]]{0,200})\]/,
          replace: "singleDollarTextMath:!1}],$1,$self._remarkLinkify]"
        }
      }
    ],
    _remarkLinkify() {
      const { store: store3 } = settings15;
      return (tree) => {
        try {
          if (!store3.linkifyDomains)
            return;
          const walk = (node) => {
            if (!node.children)
              return;
            const out = [];
            let changed = false;
            for (const child of node.children) {
              if (child.type !== "text") {
                walk(child);
                out.push(child);
                continue;
              }
              DOMAIN_RE.lastIndex = 0;
              if (!DOMAIN_RE.test(child.value)) {
                out.push(child);
                continue;
              }
              DOMAIN_RE.lastIndex = 0;
              let last = 0;
              let m;
              while ((m = DOMAIN_RE.exec(child.value)) != null) {
                if (m.index > last)
                  out.push({ type: "text", value: child.value.slice(last, m.index) });
                out.push({ type: "link", url: "https://" + m[0], children: [{ type: "text", value: m[0] }] });
                last = m.index + m[0].length;
              }
              if (last < child.value.length)
                out.push({ type: "text", value: child.value.slice(last) });
              changed = true;
            }
            if (changed)
              node.children = out;
          };
          walk(tree);
        } catch {
          return tree;
        }
      };
    },
    start() {
      settings15.store.linkColor ??= DEFAULT_LINK;
      settings15.store.visitedColor ??= DEFAULT_VISITED;
      applyColors();
      enableStyle(STYLE_NAME5);
    },
    stop() {
      disableStyle(STYLE_NAME5);
    }
  });

  // src/plugins/compactModeSelect/index.ts
  var compactModeSelect_default = definePlugin({
    name: "CompactModeSelect",
    icon: Minimize2Icon,
    description: "Always show the chat input model selector as an icon, even on wide screens.",
    authors: [Devs.p],
    tags: ["chat", "ui"],
    enabledByDefault: true,
    patches: [
      {
        find: "data-query-bar-mode-select",
        all: true,
        replacement: {
          match: /ModeSelect,\{compact:\i\|\|\i,/,
          replace: "ModeSelect,{compact:!0,"
        }
      }
    ]
  });

  // src/plugins/autoRetry/index.ts
  var logger23 = new Logger("AutoRetry");
  var CONTENT_MODERATED = "grok:content-moderated";
  var settings16 = definePluginSettings({
    retryModeration: {
      type: 3 /* BOOLEAN */,
      description: "Retry content moderation errors.",
      default: true
    },
    retryNetwork: {
      type: 3 /* BOOLEAN */,
      description: "Retry network and stream errors.",
      default: true
    },
    maxRetries: {
      type: 1 /* NUMBER */,
      description: "Maximum consecutive retries per conversation.",
      default: 3
    },
    delay: {
      type: 1 /* NUMBER */,
      description: "Seconds to wait before retrying.",
      default: 2
    }
  });
  var retryCounts = new Map;
  var pendingTimer = null;
  function clearPending() {
    if (pendingTimer != null) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }
  }
  function isModeration(response) {
    return String(response.error?.message ?? "").includes(CONTENT_MODERATED);
  }
  function shouldRetry(response) {
    if (isModeration(response))
      return settings16.store.retryModeration;
    return settings16.store.retryNetwork;
  }
  function retry(responseId, conversationId, response) {
    const count = (retryCounts.get(conversationId) ?? 0) + 1;
    const max = settings16.store.maxRetries;
    if (count > max) {
      showToast("Max retries reached.", 2 /* ERROR */);
      retryCounts.delete(conversationId);
      return;
    }
    retryCounts.set(conversationId, count);
    const delaySec = settings16.store.delay;
    showToast(`Retrying... (${count}/${max})`, 0 /* MESSAGE */);
    logger23.info(`Retry ${count}/${max} for ${conversationId} in ${delaySec}s`);
    clearPending();
    pendingTimer = setTimeout(() => {
      pendingTimer = null;
      const state2 = ChatPageStore.useChatPageStore.getState();
      if (state2.streamedMessageId)
        return;
      state2.sendResponse({
        message: "",
        parentResponseId: responseId,
        conversationId,
        fileAttachmentIds: response.fileAttachments,
        setOpimisticUserResponse: false,
        setUserResponse: false,
        enableRetries: true
      });
    }, delaySec * 1000);
  }
  function onStreamEnd3({ responseId }) {
    const response = ResponseStore.useResponseStore.getState().byId[responseId];
    if (!response || response.state !== "error") {
      const convId = ChatPageStore.useChatPageStore.getState().conversationId;
      if (convId)
        retryCounts.delete(convId);
      return;
    }
    if (!shouldRetry(response))
      return;
    const { conversationId } = ChatPageStore.useChatPageStore.getState();
    if (!conversationId)
      return;
    retry(responseId, conversationId, response);
  }
  var autoRetry_default = definePlugin({
    name: "AutoRetry",
    icon: RotateCcwIcon,
    description: "Automatically retry failed messages on moderation or network errors.",
    authors: [Devs.Prism],
    tags: ["chat"],
    settings: settings16,
    startAt: "TurbopackReady" /* TurbopackReady */,
    start() {
      retryCounts.clear();
      clearPending();
    },
    stop() {
      clearPending();
      retryCounts.clear();
    },
    events: {
      streamEnd: onStreamEnd3
    }
  });

  // void-css:/tmp/Void/src/plugins/recentTopics/styles.css
  registerStyle("recentTopics", `.void-rt-root,
.void-rt-root:popover-open {
    isolation: isolate;
    position: fixed !important;
    inset: 0 !important;
    z-index: 2147483647 !important;
    display: block !important;
    width: 100vw !important;
    height: 100dvh !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    border: none !important;
    background: transparent !important;
    color: inherit;
    pointer-events: auto !important;
}

.void-rt-root::backdrop {
    background: transparent;
}

html.void-rt-open [data-sidebar="sidebar"],
html.void-rt-open [data-sidebar="gap"] {
    z-index: 0 !important;
}

.void-rt-panel,
.void-rt-card,
.void-rt-meta,
.void-rt-name,
.void-rt-host,
.void-rt-empty {
    font-family: inherit;
    letter-spacing: inherit;
}

.void-rt-panel,
.void-rt-panel * {
    box-sizing: border-box;
}

.void-rt-panel {
    --void-rt-accent: hsl(var(--fg-primary));
    --void-rt-card-width: clamp(136px, calc((100vw - 68px) / 5), 204px);
    --void-rt-gap: 8px;
    --void-rt-padding-panel: 12px;
    --void-rt-padding-card: 8px;
    --void-rt-border-card: 1px;
    --void-rt-radius-panel: 16px;
    --void-rt-radius-card: calc(var(--void-rt-radius-panel) - var(--void-rt-padding-panel));
    --void-rt-radius-thumb: calc(var(--void-rt-radius-card) - var(--void-rt-padding-card) - var(--void-rt-border-card));
    --void-rt-radius-icon: 8px;
    --void-rt-radius-title-icon: 8px;
    --void-rt-meta-inline-padding: 4px;
    --void-rt-motion-card: 180ms cubic-bezier(0.22, 1, 0.36, 1);
    --void-rt-motion-cover: 220ms cubic-bezier(0.22, 1, 0.36, 1);
    --void-rt-thumb-stroke-inset: -0.5px;
    --void-rt-thumb-stroke-radius-offset: 0.5px;
    --void-rt-thumb-stroke-color: hsl(var(--border-l2));
    --void-rt-title-icon-size: 16px;
    --void-rt-title-icon-gap: 4px;

    all: unset;
    color-scheme: inherit;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate3d(-50%, -50%, 0);
    transform-origin: center center;
    z-index: 1;
    display: block;
    width: fit-content;
    max-width: calc(100vw - 24px);
    overflow: auto hidden;
    scrollbar-width: none;
    color: hsl(var(--fg-primary));
    background: hsl(var(--surface-l1) / 92%);
    border: 1px solid hsl(var(--border-l1));
    border-radius: var(--void-rt-radius-panel);
    box-shadow: 0 4px 16px hsl(var(--black) / 12%);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: var(--void-rt-padding-panel);
    pointer-events: auto;
    opacity: 0;
    transition: opacity 90ms ease;
    will-change: opacity;
}

.void-rt-panel::-webkit-scrollbar {
    display: none;
}

.void-rt-panel[data-visible="true"] {
    opacity: 1;
}

.void-rt-list {
    display: grid;
    grid-template-columns: repeat(var(--void-rt-count, 5), var(--void-rt-card-width));
    gap: var(--void-rt-gap);
    width: max-content;
    max-width: 100%;
    padding: 2px;
}

.void-rt-card {
    all: unset;
    box-sizing: border-box;
    width: var(--void-rt-card-width);
    min-width: var(--void-rt-card-width);
    max-width: var(--void-rt-card-width);
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-radius: var(--void-rt-radius-card);
    border: var(--void-rt-border-card) solid transparent;
    outline: 0;
    background: transparent;
    padding: var(--void-rt-padding-card);
    color: hsl(var(--fg-primary));
    cursor: pointer;
    box-shadow: none;
    transition:
        border-color 140ms ease,
        box-shadow var(--void-rt-motion-card);
}

.void-rt-card[data-active="true"] {
    z-index: 1;
    border-color: color-mix(in srgb, var(--void-rt-card-accent, var(--void-rt-accent)) 82%, hsl(var(--border-l2)));
    background: transparent;
    box-shadow:
        0 0 0 1px color-mix(in srgb, var(--void-rt-card-accent, var(--void-rt-accent)) 55%, transparent);
}

.void-rt-card:focus-visible {
    border-color: color-mix(in srgb, var(--void-rt-card-accent, var(--void-rt-accent)) 88%, hsl(var(--border-l2)));
    box-shadow:
        0 0 0 1px color-mix(in srgb, var(--void-rt-card-accent, var(--void-rt-accent)) 60%, transparent);
}

.void-rt-thumb {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: var(--void-rt-radius-thumb);
    background: color-mix(in srgb, var(--void-rt-card-accent, var(--void-rt-accent)) 14%, hsl(var(--surface-l1)));
}

.void-rt-thumb::after {
    content: "";
    position: absolute;
    inset: var(--void-rt-thumb-stroke-inset);
    z-index: 2;
    border-radius: calc(var(--void-rt-radius-thumb) + var(--void-rt-thumb-stroke-radius-offset));
    box-sizing: border-box;
    border: 1px solid var(--void-rt-thumb-stroke-color);
    box-shadow: none;
    pointer-events: none;
}

.void-rt-shot {
    position: absolute;
    inset: 0;
    z-index: 1;
    overflow: hidden;
    pointer-events: none;
    user-select: none;
}

.void-rt-shot,
.void-rt-shot * {
    pointer-events: none !important;
    scrollbar-width: none;
}

.void-rt-thumb:has(.void-rt-shot) .void-rt-fallback {
    display: none;
}

.void-rt-cover {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    object-position: top center;
}

.void-rt-mark {
    display: none !important;
}

.void-rt-page {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 8px;
    overflow: hidden;
    padding: 8px 12px 12px;
    background: hsl(var(--surface-l1));
    color: hsl(var(--fg-primary));
    font-family: inherit;
}

.void-rt-page-line {
    display: -webkit-box;
    align-self: flex-start;
    width: fit-content;
    max-width: 94%;
    overflow: hidden;
    color: hsl(var(--fg-secondary));
    font-size: 11px;
    font-weight: 400;
    line-height: 1.35;
    overflow-wrap: anywhere;
    /* stylelint-disable-next-line property-no-vendor-prefix */
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    line-clamp: 4;
}

.void-rt-page-line-user,
.void-rt-page-line[data-role="user"] {
    align-self: flex-end;
    width: fit-content;
    max-width: 78%;
    padding: 6px 8px;
    border-radius: 12px 12px 4px 12px;
    background: hsl(var(--surface-l2));
    color: hsl(var(--fg-primary));
    -webkit-line-clamp: 2;
    line-clamp: 2;
}

.void-rt-page-line[data-role="assistant"] {
    align-self: flex-start;
    padding: 0;
    border-radius: 0;
    background: none;
    color: hsl(var(--fg-secondary));
}

.void-rt-fallback {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.void-rt-favicon {
    width: 38px;
    height: 38px;
    border-radius: var(--void-rt-radius-icon);
    object-fit: cover;
    display: block;
}

.void-rt-favicon[data-broken="true"],
.void-rt-title-favicon[data-broken="true"] {
    visibility: hidden;
}

.void-rt-meta {
    min-width: 0;
    display: grid;
    gap: 4px;
    padding: 0 var(--void-rt-meta-inline-padding);
}

.void-rt-name-row {
    min-width: 0;
}

.void-rt-title-favicon {
    display: none;
}

.void-rt-name {
    min-width: 0;
    display: block;
    overflow: hidden;
    color: hsl(var(--fg-primary));
    font-size: 12px;
    font-weight: 500;
    line-height: 1.16;
    letter-spacing: inherit;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.void-rt-host {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 4px;
    overflow: hidden;
    color: hsl(var(--fg-secondary));
    font-size: 11px;
    font-weight: 500;
    line-height: 1.18;
}

.void-rt-folder {
    width: 12px;
    height: 12px;
    flex: 0 0 12px;
    display: block;
}

.void-rt-host-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.void-rt-empty {
    min-width: min(22rem, calc(100vw - 3rem));
    padding: 16px 20px;
    color: hsl(var(--fg-primary));
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
}

.void-rt-panel[data-theme="dark"] {
    color-scheme: dark;
}
`);

  // src/plugins/recentTopics/index.tsx
  var logger24 = new Logger("RecentTopics");
  var cl22 = classNameFactory("void-rt-");
  var HOME_KEY = "home";
  var HOME_SEP = "home:";
  var TRIGGER_CODES = new Set(["Backquote", "IntlBackslash"]);
  var TRIGGER_KEYS = new Set(["`", "~", "·", "｀", "～", "Dead", "Process"]);
  var TITLE_TAIL = /\s*[·|—–-]\s*Grok.*$/i;
  var SKIP_LABEL = /^(more|history|today|yesterday|projects|new chat|new conversation|see all(?: chats| conversations)?|show all(?: chats| conversations)?|view all(?: chats| conversations)?|all chats|all conversations|查看全部|显示全部|查看所有|全部会话|所有对话)$/i;
  var SKIP_NOISE = /^(copy|share|retry|edit|more|thinking|analyzing|searching|continue from here|what can i help with\??)$/i;
  var TIME_TOKEN = /(?:^|\s)\d{1,2}:\d{2}\s*(?:am|pm)\b/gi;
  var STATUS_TOKEN = /\b(?:connected to computer|continuing the(?: task)?|worked for \d+\s*m(?:\s*\d+\s*s)?|worked for \d+\s*s)\b/gi;
  var COUNT_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({ label: String(n), value: n, default: n === 5 }));
  var settings17 = definePluginSettings({
    maxRecent: {
      type: 4 /* SELECT */,
      description: "How many recently opened conversations to show.",
      options: COUNT_OPTIONS
    },
    includeHome: {
      type: 3 /* BOOLEAN */,
      description: "Include new-chat home pages in the switcher.",
      default: true
    }
  }).withPrivateSettings();
  var thumbs = new Map;
  var wsNames = {};
  var open2 = false;
  var selected = 0;
  var held = false;
  var ctrlHeld = false;
  var keys2 = null;
  var host = null;
  var paintedKey = "";
  var sidebarSnap = null;
  var pendingWs = new Set;
  function isSkipLabel(name) {
    const t = name.replaceAll(/\s+/g, " ").trim();
    if (!t)
      return false;
    SKIP_LABEL.lastIndex = 0;
    return SKIP_LABEL.test(t);
  }
  function usableName(name) {
    const t = name.replaceAll(/\s+/g, " ").trim();
    return t && !isSkipLabel(t) ? t : "";
  }
  function unique(ids) {
    const seen = new Set;
    const out = [];
    for (const id of ids) {
      if (seen.has(id))
        continue;
      seen.add(id);
      out.push(id);
    }
    return out;
  }
  function readVisits() {
    return settings17.plain.visits ?? [];
  }
  function maxCount() {
    const n = Number(settings17.store.maxRecent);
    return Number.isFinite(n) && n > 0 ? n : 5;
  }
  function capVisits(ids) {
    const allowHome = settings17.store.includeHome;
    return unique(ids).filter((id) => isHomeId(id) ? allowHome && (id === HOME_KEY || !!workspaceFromHomeId(id)) : !!id).slice(0, maxCount());
  }
  function pruneRecord(source, ids) {
    const keep = {};
    if (!source)
      return keep;
    for (const id of ids) {
      if (source[id])
        keep[id] = source[id];
    }
    return keep;
  }
  function sameList(a, b) {
    return a.length === b.length && a.every((id, i) => id === b[i]);
  }
  function sameRecord(a, b) {
    const src = a ?? {};
    const keys3 = Object.keys(b);
    if (Object.keys(src).length !== keys3.length)
      return false;
    return keys3.every((k) => src[k] === b[k]);
  }
  function assignRecord(key, next) {
    if (sameRecord(settings17.plain[key], next))
      return false;
    settings17.store[key] = next;
    return true;
  }
  var writing = false;
  function writeVisits(next) {
    if (writing)
      return;
    writing = true;
    try {
      const visits = capVisits(next);
      const rawWs = pruneRecord(settings17.plain.workspaceByConv, visits);
      const workspaceByConv = {};
      for (const [id, value] of Object.entries(rawWs)) {
        const ws = asWorkspaceId(value);
        if (ws)
          workspaceByConv[id] = ws;
      }
      const pages = pruneRecord(settings17.plain.pages, visits);
      const usedWs = new Set(Object.values(workspaceByConv));
      for (const id of visits) {
        const ws = workspaceFromHomeId(id);
        if (!ws)
          continue;
        usedWs.add(ws);
        workspaceByConv[id] = ws;
      }
      const keepProjects = {};
      for (const [id, name] of Object.entries(settings17.plain.projectNames ?? {})) {
        const n = usableName(name);
        if (usedWs.has(id) && n)
          keepProjects[id] = n;
      }
      let changed = false;
      if (!sameList(readVisits(), visits)) {
        settings17.store.visits = visits;
        changed = true;
      }
      if (assignRecord("titles", pruneRecord(settings17.plain.titles, visits)))
        changed = true;
      if (assignRecord("workspaceByConv", workspaceByConv))
        changed = true;
      if (assignRecord("pages", pages))
        changed = true;
      if (assignRecord("projectNames", keepProjects))
        changed = true;
      if (changed && open2)
        paint();
    } finally {
      writing = false;
    }
  }
  function rememberTitle(id, title) {
    const t = title?.trim();
    if (!id || isHomeId(id) || !t)
      return;
    const prev = settings17.plain.titles ?? {};
    if (prev[id] === t)
      return;
    settings17.store.titles = { ...prev, [id]: t };
  }
  function isHomeId(id) {
    return id === HOME_KEY || id.startsWith(HOME_SEP);
  }
  function homeId(workspaceId) {
    const ws = asWorkspaceId(workspaceId);
    return ws ? HOME_SEP + ws : HOME_KEY;
  }
  function workspaceFromHomeId(id) {
    return id.startsWith(HOME_SEP) ? asWorkspaceId(id.slice(HOME_SEP.length)) : "";
  }
  function routeConvId(route) {
    if (!route)
      return null;
    if (route.conversationId)
      return route.conversationId;
    if (typeof route.chat === "string" && route.chat)
      return route.chat;
    if (route.page === "main")
      return HOME_KEY;
    if (route.page === "workspace" && asWorkspaceId(route.workspaceId) && !route.conversationId)
      return homeId(route.workspaceId);
    return null;
  }
  function projectIdFromUrl() {
    const m = location.pathname.match(/^\/project\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i) ?? location.pathname.match(/^\/project\/(deepsearch)(?:\/|$)/i);
    return m?.[1] ?? "";
  }
  function chatIdFromUrl() {
    try {
      const u = new URL(location.href);
      const q = u.searchParams.get("chat");
      if (q)
        return q;
      return u.pathname.match(/^\/c\/([^/?#]+)/i)?.[1] ?? "";
    } catch {
      return "";
    }
  }
  var WS_ID = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|deepsearch)$/i;
  function asWorkspaceId(value) {
    if (typeof value === "string") {
      const s = value.trim();
      return WS_ID.test(s) ? s : "";
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const id = asWorkspaceId(item);
        if (id)
          return id;
      }
      return "";
    }
    if (value && typeof value === "object") {
      const rec = value;
      return asWorkspaceId(rec.workspaceId ?? rec.id ?? rec.projectId);
    }
    return "";
  }
  function hrefFor(id, workspaceId) {
    if (isHomeId(id)) {
      const ws2 = workspaceFromHomeId(id) || asWorkspaceId(workspaceId);
      return ws2 ? `/project/${ws2}` : "/";
    }
    const ws = asWorkspaceId(workspaceId);
    if (!id)
      return ws ? `/project/${ws}` : "/";
    if (ws)
      return `/project/${ws}?chat=${encodeURIComponent(id)}`;
    return `/c/${encodeURIComponent(id)}`;
  }
  function hrefParts(href) {
    if (!href)
      return { ws: "", chat: "" };
    try {
      const u = new URL(href, location.origin);
      const ws = asWorkspaceId(u.pathname.match(/^\/project\/([^/?#]+)/i)?.[1]);
      const chat = u.searchParams.get("chat") || u.pathname.match(/^\/c\/([^/?#]+)/i)?.[1] || "";
      return { ws, chat };
    } catch {
      return { ws: "", chat: "" };
    }
  }
  function currentVisit() {
    const urlChat = chatIdFromUrl();
    if (urlChat)
      return urlChat;
    try {
      const { conversationId, optimisticConversationId } = ChatPageStore.useChatPageStore.getState();
      if (conversationId)
        return conversationId;
      if (optimisticConversationId)
        return optimisticConversationId;
    } catch (e) {
      logger24.debug("ChatPageStore unavailable:", e);
    }
    try {
      const fromRoute = routeConvId(RoutingStore.useRoutingStore.getState().route);
      if (fromRoute != null)
        return fromRoute;
    } catch (e) {
      logger24.debug("RoutingStore unavailable:", e);
    }
    const ws = projectIdFromUrl();
    return ws ? homeId(ws) : null;
  }
  function idsFromHistory() {
    try {
      const { route, historyStack } = RoutingStore.useRoutingStore.getState();
      const ids = [];
      const add = (r) => {
        const id = routeConvId(r);
        if (id != null)
          ids.push(id);
      };
      add(route);
      for (let i = (historyStack?.length ?? 0) - 1;i >= 0; i--)
        add(historyStack[i]);
      return unique(ids);
    } catch (e) {
      logger24.debug("historyStack unavailable:", e);
      return [];
    }
  }
  function pageTitle() {
    const raw = document.title.replace(TITLE_TAIL, "").trim();
    if (!raw || /^grok$/i.test(raw))
      return "";
    return raw;
  }
  function lookup(id) {
    try {
      const { byId, byIdWithWorkspaces, list } = ConversationStore.useConversationStore.getState();
      return byId[id] ?? byIdWithWorkspaces[id] ?? list.find((c) => c.conversationId === id);
    } catch (e) {
      logger24.debug("Conversation lookup failed:", e);
      return;
    }
  }
  function titleOf(id) {
    if (!id || isHomeId(id))
      return "New chat";
    const conv = lookup(id);
    if (conv?.title?.trim())
      return conv.title.trim();
    const cached = settings17.plain.titles?.[id];
    if (cached)
      return cached;
    if (id === currentVisit())
      return pageTitle() || "Untitled";
    return "Untitled";
  }
  function liveWorkspaceId() {
    try {
      const pid = asWorkspaceId(ChatPageStore.useChatPageStore.getState().projectId);
      if (pid)
        return pid;
    } catch {}
    try {
      const { workspaceId } = RoutingStore.useRoutingStore.getState().route;
      const id = asWorkspaceId(workspaceId);
      if (id)
        return id;
    } catch {}
    return asWorkspaceId(projectIdFromUrl());
  }
  function workspaceFromHistory(id) {
    try {
      const { route, historyStack } = RoutingStore.useRoutingStore.getState();
      if (routeConvId(route) === id) {
        const ws = asWorkspaceId(route.workspaceId);
        if (ws)
          return ws;
      }
      for (let i = (historyStack?.length ?? 0) - 1;i >= 0; i--) {
        const r = historyStack[i];
        if (routeConvId(r) === id) {
          const ws = asWorkspaceId(r?.workspaceId);
          if (ws)
            return ws;
        }
      }
    } catch {}
    return "";
  }
  function convWorkspaceId(id) {
    try {
      const { byId, byIdWithWorkspaces } = ConversationStore.useConversationStore.getState();
      const resolved = ConversationStore.resolveConversationProjectWorkspaceId?.(byId[id], byIdWithWorkspaces[id]);
      const fromResolver = asWorkspaceId(resolved);
      if (fromResolver)
        return fromResolver;
      const conv = byId[id] ?? byIdWithWorkspaces[id];
      return asWorkspaceId(conv?.workspaceId) || asWorkspaceId(conv?.workspaces);
    } catch (e) {
      logger24.debug("convWorkspaceId failed:", e);
      return asWorkspaceId(lookup(id)?.workspaceId) || asWorkspaceId(lookup(id)?.workspaces);
    }
  }
  function workspaceFromDom(id) {
    if (!id)
      return "";
    try {
      for (const a of document.querySelectorAll("a[href]")) {
        const href = a.getAttribute("href");
        if (!href || !href.includes(id))
          continue;
        const { ws, chat } = hrefParts(href);
        if (chat === id && ws)
          return ws;
      }
    } catch {}
    return "";
  }
  function shortOwnText(el) {
    const parts = [];
    for (const n of el.childNodes) {
      if (n.nodeType === Node.TEXT_NODE) {
        parts.push(n.textContent ?? "");
        continue;
      }
      if (!(n instanceof HTMLElement))
        continue;
      if (n.matches("svg, a[href]"))
        continue;
      const nestedHref = n.getAttribute("href") ?? "";
      if (nestedHref.includes("chat=") || nestedHref.includes("/c/"))
        continue;
      if (n.querySelector("a[href*='chat='], a[href*='/c/']"))
        continue;
      const t = (n.textContent ?? "").replaceAll(/\s+/g, " ").trim();
      if (t.length > 0 && t.length <= 64)
        parts.push(t);
    }
    const out = parts.join(" ").replaceAll(/\s+/g, " ").trim();
    return out.length >= 2 && out.length <= 64 ? out : "";
  }
  function folderLabel(el) {
    if (!el.querySelector("svg"))
      return "";
    return usableName(shortOwnText(el));
  }
  function projectNameFromAncestors(el) {
    const sidebar = el.closest("[data-sidebar=sidebar]");
    let cur = el.parentElement;
    while (cur && cur !== sidebar) {
      let sib = cur;
      while (sib) {
        const name = folderLabel(sib);
        if (name)
          return name;
        sib = sib.previousElementSibling;
      }
      cur = cur.parentElement;
    }
    return "";
  }
  function invalidateSidebar() {
    sidebarSnap = null;
  }
  function sidebarIndex() {
    const empty = { wsByConv: {}, nameByWs: {}, nameByConv: {} };
    const sidebar = document.querySelector("[data-sidebar=sidebar]");
    if (!sidebar)
      return empty;
    const key = `${sidebar.childElementCount}:${(sidebar.textContent ?? "").length}`;
    if (sidebarSnap?.key === key)
      return sidebarSnap.index;
    const index = { wsByConv: {}, nameByWs: {}, nameByConv: {} };
    let currentName = "";
    const assignConv = (chat, ws, name) => {
      if (!chat || !ws)
        return;
      index.wsByConv[chat] = ws;
      const label = usableName(name || currentName || index.nameByWs[ws] || "");
      if (label) {
        index.nameByWs[ws] = label;
        index.nameByConv[chat] = label;
      }
    };
    for (const el of sidebar.querySelectorAll("a[href], button, [role='button']")) {
      const { ws, chat } = hrefParts(el.getAttribute("href"));
      if (chat) {
        assignConv(chat, ws, currentName);
        if (ws && !index.nameByConv[chat]) {
          const up = usableName(projectNameFromAncestors(el));
          if (up) {
            index.nameByConv[chat] = up;
            index.nameByWs[ws] ??= up;
            currentName ||= up;
          }
        }
        continue;
      }
      const label = shortOwnText(el) || folderLabel(el);
      if (isSkipLabel(label) && !ws) {
        currentName = "";
        continue;
      }
      if (ws) {
        const n = usableName(label);
        if (n) {
          currentName = n;
          index.nameByWs[ws] = n;
        } else if (isSkipLabel(label)) {
          currentName = index.nameByWs[ws] || "";
        }
        continue;
      }
      const folder = folderLabel(el);
      if (folder)
        currentName = folder;
    }
    sidebarSnap = { key, index };
    return index;
  }
  function workspaceFetchedEmpty(id) {
    try {
      const { byIdWithWorkspaces } = ConversationStore.useConversationStore.getState();
      return !!byIdWithWorkspaces[id] && !convWorkspaceId(id);
    } catch {
      return false;
    }
  }
  function routeWorkspaceFor(id) {
    if (id === chatIdFromUrl())
      return asWorkspaceId(projectIdFromUrl());
    try {
      const { route } = RoutingStore.useRoutingStore.getState();
      const chat = route.conversationId || (typeof route.chat === "string" ? route.chat : "");
      if (chat === id)
        return asWorkspaceId(route.workspaceId);
    } catch {}
    return "";
  }
  function dropWorkspace(id) {
    const prev = settings17.plain.workspaceByConv ?? {};
    if (!prev[id])
      return;
    const next = { ...prev };
    delete next[id];
    settings17.store.workspaceByConv = next;
  }
  function workspaceOf(id) {
    if (!id)
      return "";
    if (isHomeId(id)) {
      const fromKey = workspaceFromHomeId(id);
      if (fromKey)
        return fromKey;
      return id === currentVisit() ? liveWorkspaceId() : asWorkspaceId(settings17.plain.workspaceByConv?.[id]);
    }
    const fromConv = convWorkspaceId(id);
    if (fromConv)
      return fromConv;
    if (workspaceFetchedEmpty(id))
      return "";
    const fromSidebar = sidebarIndex().wsByConv[id] || workspaceFromDom(id);
    if (fromSidebar)
      return fromSidebar;
    const cached = asWorkspaceId(settings17.plain.workspaceByConv?.[id]);
    if (cached)
      return cached;
    const fromHist = workspaceFromHistory(id);
    if (fromHist)
      return fromHist;
    if (id === currentVisit())
      return routeWorkspaceFor(id);
    return "";
  }
  function readOpenProjectName() {
    const idx = sidebarIndex();
    const live = liveWorkspaceId();
    if (live) {
      const n = usableName(idx.nameByWs[live]);
      if (n)
        return n;
    }
    const current = currentVisit();
    const ws = current ? workspaceOf(current) : "";
    if (!current || !ws)
      return "";
    return usableName(idx.nameByConv[current] || idx.nameByWs[ws]);
  }
  function projectNameOf(id) {
    if (!id)
      return "";
    const ws = workspaceOf(id);
    if (!ws)
      return "";
    const idx = sidebarIndex();
    const named = usableName(idx.nameByConv[id] || idx.nameByWs[ws] || wsNames[ws] || settings17.plain.projectNames?.[ws] || "");
    if (!named)
      return "";
    const live = liveWorkspaceId();
    const liveName = readOpenProjectName();
    if (live && ws !== live && liveName && named === liveName)
      return "";
    return named;
  }
  function rememberProject(id) {
    if (!id)
      return;
    const ws = workspaceOf(id);
    if (!ws)
      return;
    const prevWs = settings17.plain.workspaceByConv ?? {};
    if (prevWs[id] !== ws)
      settings17.store.workspaceByConv = { ...prevWs, [id]: ws };
    const idx = sidebarIndex();
    const sidebarName = idx.nameByConv[id] || idx.nameByWs[ws] || "";
    const liveName = ws === liveWorkspaceId() ? readOpenProjectName() : "";
    const name = usableName(sidebarName || wsNames[ws] || liveName || settings17.plain.projectNames?.[ws] || "");
    if (!name)
      return;
    wsNames[ws] = name;
    const prevNames = settings17.plain.projectNames ?? {};
    if (prevNames[ws] !== name)
      settings17.store.projectNames = { ...prevNames, [ws]: name };
  }
  function reconcileSidebarCache() {
    const idx = sidebarIndex();
    const prevWs = { ...settings17.plain.workspaceByConv };
    const prevNames = { ...settings17.plain.projectNames };
    let wsChanged = false;
    let namesChanged = false;
    for (const [conv, ws] of Object.entries(idx.wsByConv)) {
      if (prevWs[conv] !== ws) {
        prevWs[conv] = ws;
        wsChanged = true;
      }
    }
    for (const [ws, name] of Object.entries(idx.nameByWs)) {
      const n = usableName(name);
      if (!n)
        continue;
      wsNames[ws] = n;
      if (prevNames[ws] !== n) {
        prevNames[ws] = n;
        namesChanged = true;
      }
    }
    for (const [ws, name] of Object.entries(prevNames)) {
      if (usableName(name))
        continue;
      delete prevNames[ws];
      delete wsNames[ws];
      namesChanged = true;
    }
    if (wsChanged)
      settings17.store.workspaceByConv = prevWs;
    if (namesChanged)
      settings17.store.projectNames = prevNames;
  }
  function requestWorkspace(id) {
    if (!id || isHomeId(id) || pendingWs.has(id))
      return;
    if (convWorkspaceId(id))
      return;
    if (workspaceFetchedEmpty(id)) {
      dropWorkspace(id);
      return;
    }
    if (sidebarIndex().wsByConv[id])
      return;
    pendingWs.add(id);
    try {
      const { fetchGetConversationWithWorkspaces, fetchGetConversation } = ConversationStore.useConversationStore.getState();
      const fetchConv = fetchGetConversationWithWorkspaces ?? fetchGetConversation;
      if (!fetchConv) {
        pendingWs.delete(id);
        return;
      }
      fetchConv(id).then((conv) => {
        const ws = asWorkspaceId(ConversationStore.resolveConversationProjectWorkspaceId?.(conv)) || asWorkspaceId(conv?.workspaceId) || asWorkspaceId(conv?.workspaces);
        if (!ws) {
          dropWorkspace(id);
          if (open2)
            paint();
          return;
        }
        const prev = settings17.plain.workspaceByConv ?? {};
        if (prev[id] !== ws)
          settings17.store.workspaceByConv = { ...prev, [id]: ws };
        const live = liveWorkspaceId();
        const liveName = usableName(readOpenProjectName());
        const names = settings17.plain.projectNames ?? {};
        if (live && ws !== live && liveName && names[ws] === liveName) {
          const next = { ...names };
          delete next[ws];
          settings17.store.projectNames = next;
          delete wsNames[ws];
        }
        if (open2)
          paint();
      }).catch((e) => logger24.debug("workspace fetch failed:", e)).finally(() => {
        pendingWs.delete(id);
      });
    } catch {
      pendingWs.delete(id);
    }
  }
  function chatPane() {
    const main = document.querySelector("main");
    if (!main)
      return null;
    let best = null;
    let bestScore = 0;
    for (const n of main.querySelectorAll("[class*='overflow-y-auto'], [class*='overflow-auto']")) {
      if (n.closest("[data-sidebar], .void-rt-root, #void-rt-host"))
        continue;
      const r = n.getBoundingClientRect();
      if (r.width < 240 || r.height < 120)
        continue;
      const score = r.width * r.height;
      if (score > bestScore) {
        best = n;
        bestScore = score;
      }
    }
    return best;
  }
  function messageList(pane) {
    let node = pane;
    for (let i = 0;i < 8; i++) {
      const kids = [...node.children].filter((c) => c instanceof HTMLElement);
      if (kids.length === 1 && kids[0].children.length > 1) {
        node = kids[0];
        continue;
      }
      break;
    }
    return node;
  }
  function chromeOff(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll("button, .void-timestamp, time, nav, svg, [class*='timestamp']").forEach((n) => n.remove());
    return clone;
  }
  function userBubble(root) {
    const tagged = root.querySelector("[data-void-rt-role='user'], .void-rt-user-msg");
    if (tagged)
      return tagged;
    const cands = [...root.querySelectorAll("[class*='justify-end'], [class*='self-end'], [class*='ml-auto'], [class*='ms-auto'], [class*='items-end']")];
    if (/justify-end|self-end|ml-auto|ms-auto|items-end/.test(root.className))
      cands.unshift(root);
    if (!cands.length)
      return null;
    const inner = cands.filter((el) => !cands.some((other) => other !== el && el.contains(other)));
    inner.sort((a, b) => (a.innerText?.length ?? 0) - (b.innerText?.length ?? 0));
    return inner[0] ?? null;
  }
  function extractTurn(kid) {
    const bubble = userBubble(kid);
    const userText = bubble ? scrubText(chromeOff(bubble).innerText ?? "") : "";
    const rest = chromeOff(kid);
    if (bubble && bubble !== kid) {
      rest.querySelectorAll("[class*='justify-end'], [class*='self-end'], [class*='ml-auto']").forEach((n) => n.remove());
    }
    let asstText = scrubText(rest.innerText ?? "");
    if (userText && asstText.includes(userText))
      asstText = scrubText(asstText.replace(userText, " "));
    const lines = [];
    if (userText)
      lines.push({ role: "user", text: userText });
    if (asstText && asstText !== userText)
      lines.push({ role: "assistant", text: asstText });
    return lines;
  }
  function extractMarks(root) {
    const marks = [...root.querySelectorAll(".void-rt-mark")];
    if (!marks.length)
      return [];
    const out = [];
    for (const m of marks) {
      const role = m.getAttribute("data-role") === "user" ? "user" : "assistant";
      const text = scrubText(m.textContent ?? "");
      if (text)
        out.push({ role, text });
    }
    return lastRound(out);
  }
  function extractLines(pane) {
    const fromMarks = extractMarks(pane);
    if (fromMarks.length)
      return fromMarks;
    const source = messageList(pane);
    const kids = [...source.children].filter((c) => c instanceof HTMLElement);
    const out = [];
    for (const kid of kids)
      out.push(...extractTurn(kid));
    return lastRound(out);
  }
  function scrubText(raw) {
    let t = raw.replaceAll(/\s+/g, " ").trim();
    t = t.replace(TIME_TOKEN, " ").replace(STATUS_TOKEN, " ");
    t = t.replaceAll(/\s+/g, " ").trim();
    if (!t || SKIP_NOISE.test(t))
      return "";
    return t;
  }
  function plainText(md) {
    const t = md.replace(/```[\s\S]*?```/g, " ").replace(/`([^`]+)`/g, "$1").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/^#{1,6}\s+/gm, "").replace(/[*_~]{1,3}/g, "").replace(/^>\s+/gm, "");
    return scrubText(t);
  }
  function clipLine(text, max) {
    const t = scrubText(text);
    if (t.length <= max)
      return t;
    return `${t.slice(0, Math.max(1, max - 1))}…`;
  }
  function lastRound(lines) {
    const cleaned = lines.map((line) => ({ role: line.role, text: scrubText(line.text) })).filter((line) => !!line.text);
    if (!cleaned.length)
      return [];
    let asst = -1;
    let user = -1;
    for (let i = cleaned.length - 1;i >= 0; i--) {
      if (asst < 0 && cleaned[i].role === "assistant")
        asst = i;
      if (user < 0 && cleaned[i].role === "user")
        user = i;
      if (asst >= 0 && user >= 0)
        break;
    }
    const pick = user >= 0 && asst >= 0 && user < asst ? [cleaned[user], cleaned[asst]] : user >= 0 && (asst < 0 || user > asst) ? [cleaned[user]] : asst >= 0 ? [cleaned[asst]] : cleaned.slice(-1);
    return pick.map((line) => ({
      role: line.role,
      text: clipLine(line.text, line.role === "user" ? 72 : 140)
    }));
  }
  function pickUserText(query, message) {
    const q = plainText(query);
    const m = plainText(message);
    if (q && m) {
      if (m.startsWith(q) && m.length > q.length)
        return q;
      return q.length <= m.length ? q : m;
    }
    return q || m;
  }
  function walkThread(startId) {
    if (!startId)
      return [];
    try {
      const { byId } = ResponseStore.useResponseStore.getState();
      const out = [];
      const seen = new Set;
      let id = startId;
      while (id && !seen.has(id) && out.length < 50) {
        seen.add(id);
        const r = byId[id];
        if (!r)
          break;
        out.unshift(r);
        id = r.parentResponseId;
      }
      return out;
    } catch {
      return [];
    }
  }
  function responsesOf(id) {
    const { byConversationId, byId, nodesByConversationId } = ResponseStore.useResponseStore.getState();
    const nodes = nodesByConversationId[id] ?? [];
    if (nodes.length) {
      const list = nodes.map((n) => byId[n.responseId]).filter((r) => !!r);
      if (list.length)
        return list;
      const walked = walkThread(nodes.at(-1)?.responseId);
      if (walked.length)
        return walked;
    }
    const cached = byConversationId[id];
    if (cached?.length)
      return [...cached].sort((a, b) => String(a.createTime ?? "").localeCompare(String(b.createTime ?? "")));
    try {
      const chat = ChatPageStore.useChatPageStore.getState();
      if (chat.conversationId === id) {
        return walkThread(chat.lastMessageId ?? chat.streamedMessageId ?? chat.optimisticMessageId);
      }
    } catch {}
    return [];
  }
  function responsesToLines(list) {
    const out = [];
    for (const r of list) {
      if (!r || r.isControl)
        continue;
      const sender = String(r.sender ?? "").toLowerCase();
      const human = sender === "human" || sender === "user";
      if (human) {
        const text = pickUserText(r.query || "", r.message || "");
        if (text)
          out.push({ role: "user", text });
        continue;
      }
      const query = pickUserText(r.query || "", "");
      let message = plainText(r.message || "");
      if (query && message.startsWith(query) && message.length > query.length) {
        message = scrubText(message.slice(query.length));
      }
      if (query && out.at(-1)?.text !== query)
        out.push({ role: "user", text: query });
      if (message && message !== query)
        out.push({ role: "assistant", text: message });
    }
    return lastRound(out);
  }
  function linesFromStore(id) {
    if (!id)
      return [];
    try {
      return responsesToLines(responsesOf(id));
    } catch (e) {
      logger24.debug("ResponseStore snapshot failed:", e);
      return [];
    }
  }
  function betterLines(store3, dom) {
    const pair = (lines) => lines.some((l) => l.role === "user") && lines.some((l) => l.role === "assistant");
    if (pair(store3))
      return store3;
    if (pair(dom))
      return dom;
    return store3.length ? store3 : dom;
  }
  function parseSnap(raw) {
    if (!raw)
      return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.lines) || !parsed.lines.length)
        return null;
      return {
        title: typeof parsed.title === "string" ? parsed.title : "",
        theme: parsed.theme === "light" ? "light" : "dark",
        lines: lastRound(parsed.lines.filter((line) => !!line && (line.role === "user" || line.role === "assistant") && typeof line.text === "string"))
      };
    } catch {
      return null;
    }
  }
  function snapOf(id) {
    return thumbs.get(id) ?? parseSnap(settings17.plain.pages?.[id]);
  }
  function rememberPage(id, snap) {
    const json = JSON.stringify(snap);
    const prev = settings17.plain.pages ?? {};
    if (prev[id] === json)
      return;
    settings17.store.pages = { ...prev, [id]: json };
  }
  function applyLineStyle(el, role, theme) {
    el.style.display = "-webkit-box";
    el.style.webkitBoxOrient = "vertical";
    el.style.overflow = "hidden";
    el.style.width = "fit-content";
    el.style.overflowWrap = "anywhere";
    el.style.fontSize = "11px";
    el.style.lineHeight = "1.35";
    if (role === "user") {
      el.style.alignSelf = "flex-end";
      el.style.maxWidth = "78%";
      el.style.padding = "6px 9px";
      el.style.borderRadius = "14px 14px 4px 14px";
      el.style.background = theme === "light" ? "#e8e6e0" : "#2f2f2f";
      el.style.color = theme === "light" ? "#171717" : "#fff";
      el.style.webkitLineClamp = "2";
    } else {
      el.style.alignSelf = "flex-start";
      el.style.maxWidth = "94%";
      el.style.padding = "0";
      el.style.background = "transparent";
      el.style.color = theme === "light" ? "#3f3f3f" : "#c4c4c4";
      el.style.webkitLineClamp = "4";
    }
  }
  function buildPageShot(snap) {
    const page = node("span", cl22("page"));
    page.dataset.theme = snap.theme;
    for (const line of lastRound(snap.lines)) {
      const el = node("span", cl22("page-line", line.role === "user" && "page-line-user"), line.text);
      el.dataset.role = line.role;
      applyLineStyle(el, line.role, snap.theme);
      page.append(el);
    }
    return page;
  }
  function captureId(id) {
    if (!id)
      return;
    const fromStore = linesFromStore(id);
    let fromDom = [];
    if (id === currentVisit()) {
      const pane = chatPane();
      if (pane)
        fromDom = extractLines(pane);
    }
    const lines = betterLines(fromStore, fromDom);
    if (!lines.length)
      return;
    const snap = {
      title: titleOf(id),
      theme: detectTheme(),
      lines: lastRound(lines)
    };
    thumbs.set(id, snap);
    rememberPage(id, snap);
  }
  var capturing = false;
  function captureCurrent() {
    if (capturing || open2)
      return;
    capturing = true;
    try {
      const current = currentVisit();
      if (current)
        captureId(current);
      for (const id of capVisits(readVisits())) {
        if (id && id !== current)
          captureId(id);
      }
    } catch (e) {
      logger24.debug("snapshot failed:", e);
    } finally {
      capturing = false;
    }
  }
  function scheduleCapture() {
    if (open2)
      return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!open2)
          captureCurrent();
      });
    });
  }
  function bump(id) {
    if (!id)
      return;
    if (isHomeId(id) && !settings17.store.includeHome)
      return;
    writeVisits(capVisits([id, ...readVisits()]));
    if (isHomeId(id)) {
      if (shouldRememberProject(id))
        rememberProject(id);
      return;
    }
    const conv = lookup(id);
    rememberTitle(id, conv?.title || (id === currentVisit() ? pageTitle() : undefined));
    if (shouldRememberProject(id))
      rememberProject(id);
  }
  function shouldRememberProject(id) {
    if (!id || workspaceFetchedEmpty(id))
      return false;
    return !!workspaceOf(id);
  }
  function hydrate() {
    invalidateSidebar();
    const current = currentVisit();
    const merged = current == null ? [...idsFromHistory(), ...readVisits()] : [current, ...idsFromHistory(), ...readVisits()];
    writeVisits(capVisits(merged));
    reconcileSidebarCache();
    if (current) {
      rememberTitle(current, lookup(current)?.title || pageTitle());
      if (shouldRememberProject(current))
        rememberProject(current);
    }
    for (const id of capVisits(readVisits())) {
      if (id)
        requestWorkspace(id);
    }
  }
  function topics() {
    return capVisits(readVisits()).map((id) => ({
      id,
      title: titleOf(id),
      project: projectNameOf(id)
    }));
  }
  function parseHref(href) {
    try {
      const u = new URL(href, location.origin);
      const parsed = RoutingStore.urlToRoute(u.pathname, new URLSearchParams(u.search), u.hash.replace(/^#/, ""));
      if (parsed?.page && parsed.page !== "unknown")
        return parsed;
    } catch (e) {
      logger24.debug("urlToRoute failed:", e);
    }
    return null;
  }
  function applyChatPage(id, workspaceId) {
    try {
      const chat = ChatPageStore.useChatPageStore.getState();
      chat.setConversationId(id || undefined);
      chat.setProjectId(asWorkspaceId(workspaceId) || undefined);
    } catch (e) {
      logger24.debug("ChatPageStore update failed:", e);
    }
  }
  function navigateTo(id) {
    try {
      const routing = RoutingStore.useRoutingStore.getState();
      const { route } = routing;
      const teamId = route.teamId ?? null;
      if (isHomeId(id) || !id) {
        const ws = workspaceFromHomeId(id) || asWorkspaceId(workspaceOf(id));
        const hereWs = asWorkspaceId(route.workspaceId) || projectIdFromUrl();
        const hereChat = route.conversationId || chatIdFromUrl();
        if (!ws) {
          if (!hereChat && (route.page === "main" || !hereWs))
            return;
          routing.push({ page: "main", teamId });
          applyChatPage("");
          return;
        }
        if (!hereChat && hereWs === ws)
          return;
        routing.push({ page: "workspace", workspaceId: ws, tab: "conversations", teamId });
        applyChatPage("", ws);
        return;
      }
      const workspaceId = workspaceOf(id);
      const href = hrefFor(id, workspaceId);
      const parsed = parseHref(href);
      const dest = workspaceId ? {
        page: "workspace",
        workspaceId,
        tab: "conversations",
        conversationId: id,
        teamId
      } : {
        page: "chat",
        conversationId: id,
        temporary: lookup(id)?.temporary ?? false,
        teamId
      };
      if (parsed?.page === "workspace" && asWorkspaceId(parsed.workspaceId)) {
        dest.page = "workspace";
        dest.workspaceId = asWorkspaceId(parsed.workspaceId);
        dest.conversationId = parsed.conversationId || id;
        dest.tab = parsed.tab || "conversations";
        if (parsed.filePath)
          dest.filePath = parsed.filePath;
      } else if (parsed?.page === "chat" && parsed.conversationId && !workspaceId) {
        dest.page = "chat";
        dest.conversationId = parsed.conversationId;
        dest.temporary = parsed.temporary ?? dest.temporary;
      }
      if (dest.page === "workspaces" || dest.page === "workspace" && !asWorkspaceId(dest.workspaceId)) {
        dest.page = "chat";
        dest.conversationId = id;
        delete dest.workspaceId;
        delete dest.tab;
      }
      if (routeConvId(route) === dest.conversationId && (asWorkspaceId(route.workspaceId) || "") === (asWorkspaceId(dest.workspaceId) || "") && route.page === dest.page)
        return;
      routing.push(dest);
      applyChatPage(id, asWorkspaceId(dest.workspaceId));
      if (dest.page !== "workspace") {
        try {
          const { fetchGetConversationWithWorkspaces, fetchGetConversation } = ConversationStore.useConversationStore.getState();
          const fetchConv = fetchGetConversationWithWorkspaces ?? fetchGetConversation;
          fetchConv?.(id).then((conv) => {
            const ws = asWorkspaceId(ConversationStore.resolveConversationProjectWorkspaceId?.(conv)) || convWorkspaceId(id);
            if (!ws)
              return;
            const now = RoutingStore.useRoutingStore.getState();
            if (routeConvId(now.route) !== id)
              return;
            now.replace({
              page: "workspace",
              workspaceId: ws,
              tab: "conversations",
              conversationId: id,
              teamId
            });
            applyChatPage(id, ws);
            rememberProject(id);
          }).catch((e) => logger24.debug("workspace resolve failed:", e));
        } catch (e) {
          logger24.debug("workspace fetch skipped:", e);
        }
      }
    } catch (e) {
      logger24.error("Failed to navigate:", e);
      try {
        location.assign(hrefFor(id, workspaceOf(id) || undefined));
      } catch (navErr) {
        logger24.error("Fallback navigation failed:", navErr);
      }
    }
  }
  function isTrigger(e) {
    if (TRIGGER_CODES.has(e.code) || e.keyCode === 192)
      return true;
    return TRIGGER_KEYS.has(e.key);
  }
  function isCtrlKey(e) {
    return e.key === "Control" || e.code === "ControlLeft" || e.code === "ControlRight";
  }
  function begin(reverse, fromHold) {
    held = fromHold;
    open2 = false;
    captureCurrent();
    open2 = true;
    selected = 0;
    try {
      hydrate();
      const current = currentVisit();
      if (current != null)
        bump(current);
      if (topics().length > 1)
        selected = reverse ? topics().length - 1 : 1;
    } catch (e) {
      logger24.error("Failed to open switcher:", e);
    }
    paint();
  }
  function cycle2(reverse) {
    const { length } = topics();
    if (!length)
      return;
    selected = (selected + (reverse ? -1 : 1) + length) % length;
    paint();
  }
  function commit() {
    if (!open2)
      return;
    const target = topics()[selected];
    open2 = false;
    held = false;
    paint();
    if (target)
      navigateTo(target.id);
  }
  function cancel() {
    if (!open2)
      return;
    open2 = false;
    held = false;
    paint();
  }
  function onKeyDown3(e) {
    if (isCtrlKey(e)) {
      ctrlHeld = true;
      return;
    }
    const combo = (e.ctrlKey || ctrlHeld) && !e.altKey && !e.metaKey && isTrigger(e) && !e.repeat;
    if (combo) {
      e.preventDefault();
      e.stopImmediatePropagation();
      try {
        if (open2)
          cycle2(e.shiftKey);
        else
          begin(e.shiftKey, true);
      } catch (err) {
        logger24.error("Hotkey failed:", err);
      }
      return;
    }
    if (!open2)
      return;
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
      return;
    }
    if (e.key === "Tab" && (e.ctrlKey || ctrlHeld)) {
      e.preventDefault();
      cycle2(e.shiftKey);
    }
  }
  function onKeyUp(e) {
    if (!isCtrlKey(e))
      return;
    ctrlHeld = false;
    if (open2 && held)
      commit();
  }
  function onBeforeInput(e) {
    if (!ctrlHeld && !open2)
      return;
    const { data } = e;
    if (data && TRIGGER_KEYS.has(data))
      e.preventDefault();
  }
  function onWindowBlur() {
    ctrlHeld = false;
  }
  function onVisibility2() {
    if (document.hidden) {
      ctrlHeld = false;
      cancel();
    }
  }
  function pick(index) {
    selected = index;
    commit();
  }
  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className)
      el.className = className;
    if (text)
      el.textContent = text;
    return el;
  }
  function fillShot(box, id) {
    const snap = snapOf(id);
    if (!snap) {
      const fallback = node("span", cl22("fallback"));
      fallback.append(faviconImg(cl22("favicon")));
      box.append(fallback);
      return;
    }
    const shot = node("span", cl22("shot"));
    shot.append(buildPageShot(snap));
    box.append(shot);
  }
  var GROK_BG_PATH = "M0 256C0 166.392 0 121.587 17.439 87.3615C32.7787 57.2556 57.2556 32.7787 87.3615 17.439C121.587 0 166.392 0 256 0C345.608 0 390.413 0 424.638 17.439C454.744 32.7787 479.221 57.2556 494.561 87.3615C512 121.587 512 166.392 512 256C512 345.608 512 390.413 494.561 424.638C479.221 454.744 454.744 479.221 424.638 494.561C390.413 512 345.608 512 256 512C166.392 512 121.587 512 87.3615 494.561C57.2556 479.221 32.7787 454.744 17.439 424.638C0 390.413 0 345.608 0 256Z";
  var GROK_MARK_P1 = "M210.484 312.759L343.465 210.383C349.984 205.364 359.302 207.322 362.408 215.117C378.758 256.231 371.454 305.64 338.925 339.563C306.397 373.487 261.137 380.927 219.768 363.983L174.577 385.803C239.394 432.008 318.104 420.581 367.289 369.251C406.303 328.564 418.386 273.104 407.088 223.091L407.19 223.198C390.807 149.726 411.218 120.359 453.03 60.3072C454.02 58.8833 455.01 57.4595 456 56L400.978 113.382V113.204L210.45 312.794";
  var GROK_MARK_P2 = "M183.042 337.641C136.519 291.294 144.54 219.567 184.236 178.203C213.59 147.59 261.683 135.096 303.666 153.464L348.755 131.75C340.632 125.627 330.221 119.042 318.275 114.414C264.277 91.2407 199.63 102.774 155.735 148.516C113.513 192.549 100.236 260.254 123.036 318.027C140.069 361.206 112.148 391.748 84.0229 422.575C74.0561 433.503 64.0553 444.431 56 456L183.007 337.677";
  var GROK_ICON_DATA = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="${GROK_BG_PATH}" fill="#050505"/><path d="${GROK_MARK_P1}" fill="#FCFCFC"/><path d="${GROK_MARK_P2}" fill="#FCFCFC"/></svg>`)}`;
  var ACCENTS = [
    "rgb(37, 99, 235)",
    "rgb(14, 165, 233)",
    "rgb(20, 184, 166)",
    "rgb(249, 115, 22)",
    "rgb(100, 116, 139)"
  ];
  function accentOf(id) {
    if (!id)
      return ACCENTS[4];
    let hash = 0;
    for (let i = 0;i < id.length; i++)
      hash = hash * 31 + id.charCodeAt(i) >>> 0;
    return ACCENTS[hash % ACCENTS.length];
  }
  function detectTheme() {
    const html = document.documentElement;
    const { body } = document;
    const tokens = `${html.className} ${body?.className ?? ""} ${html.getAttribute("data-theme") ?? ""} ${html.getAttribute("data-color-scheme") ?? ""}`.toLowerCase();
    if (/(^|[\s_-])(dark|night)([\s_-]|$)/.test(tokens) || html.classList.contains("dark") || html.getAttribute("dark") != null)
      return "dark";
    if (/(^|[\s_-])(light|day)([\s_-]|$)/.test(tokens) || html.classList.contains("light"))
      return "light";
    try {
      const bg = getComputedStyle(body || html).backgroundColor;
      const m = bg.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
      if (m) {
        const r = Number(m[1]) / 255;
        const g = Number(m[2]) / 255;
        const b = Number(m[3]) / 255;
        const lin = [r, g, b].map((c) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
        const lum = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
        return lum < 0.42 ? "dark" : "light";
      }
    } catch {}
    const scheme = getComputedStyle(html).colorScheme;
    if (scheme.includes("light") && !scheme.includes("dark"))
      return "light";
    return "dark";
  }
  function grokFaviconSrc() {
    try {
      if (/\.grok\.com$|^grok\.com$/.test(location.hostname)) {
        const link = document.querySelector('link[rel*="icon"]:not(#void-chat-state-favicon)');
        const href = link?.href;
        if (href && !href.startsWith("data:"))
          return href;
        return `${location.origin}/images/favicon.svg`;
      }
    } catch {}
    return GROK_ICON_DATA;
  }
  function faviconImg(className) {
    const img = document.createElement("img");
    img.className = className;
    img.alt = "";
    img.draggable = false;
    img.src = grokFaviconSrc();
    img.addEventListener("error", () => {
      if (img.src === GROK_ICON_DATA) {
        img.dataset.broken = "true";
        return;
      }
      img.src = GROK_ICON_DATA;
    });
    return img;
  }
  function folderIcon() {
    const svg2 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg2.setAttribute("class", cl22("folder"));
    svg2.setAttribute("viewBox", "0 0 24 24");
    svg2.setAttribute("fill", "none");
    svg2.setAttribute("stroke", "currentColor");
    svg2.setAttribute("stroke-width", "2");
    svg2.setAttribute("stroke-linecap", "round");
    svg2.setAttribute("stroke-linejoin", "round");
    svg2.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z");
    svg2.append(path);
    return svg2;
  }
  function applyTheme(panel) {
    const theme = detectTheme();
    panel.setAttribute("data-theme", theme);
    panel.style.colorScheme = theme;
  }
  function buildHost() {
    const root = node("div", cl22("root"));
    root.id = "void-rt-host";
    root.setAttribute("role", "presentation");
    root.addEventListener("click", cancel);
    const panel = node("div", cl22("panel"));
    panel.setAttribute("role", "listbox");
    panel.setAttribute("aria-label", "Recent conversations");
    panel.addEventListener("click", (e) => e.stopPropagation());
    panel.append(node("div", cl22("list")));
    root.append(panel);
    return root;
  }
  function renderList(items) {
    if (!host)
      return;
    const panel = host.querySelector(`.${cl22("panel")}`);
    if (!panel)
      return;
    let list = panel.querySelector(`.${cl22("list")}`);
    if (!list) {
      panel.replaceChildren();
      list = node("div", cl22("list"));
      panel.append(list);
    }
    list.replaceChildren();
    items.forEach((topic, i) => {
      const btn = node("button", cl22("card"));
      btn.type = "button";
      btn.tabIndex = -1;
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-label", topic.project ? `${topic.title}, ${topic.project}` : topic.title);
      btn.style.setProperty("--void-rt-card-accent", accentOf(topic.id));
      btn.addEventListener("pointerenter", () => {
        if (selected === i)
          return;
        selected = i;
        syncActive();
      });
      btn.addEventListener("focus", () => {
        if (selected === i)
          return;
        selected = i;
        syncActive();
      });
      btn.addEventListener("click", () => pick(i));
      const shot = node("span", cl22("thumb"));
      shot.setAttribute("aria-hidden", "true");
      fillShot(shot, topic.id);
      const meta = node("span", cl22("meta"));
      meta.append(node("span", cl22("name"), topic.title));
      if (topic.project) {
        const proj = node("span", cl22("host"));
        proj.append(folderIcon(), node("span", cl22("host-name"), topic.project));
        meta.append(proj);
      }
      btn.append(shot, meta);
      list.append(btn);
    });
  }
  function syncActive() {
    if (!host)
      return;
    const cards = host.querySelectorAll(`.${cl22("card")}`);
    cards.forEach((card, i) => {
      const on = i === selected;
      card.setAttribute("data-active", on ? "true" : "false");
      card.setAttribute("aria-selected", on ? "true" : "false");
      card.tabIndex = on ? 0 : -1;
      if (on)
        card.setAttribute("aria-current", "true");
      else
        card.removeAttribute("aria-current");
    });
    cards[selected]?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }
  function paint() {
    document.documentElement.classList.toggle("void-rt-open", open2);
    if (!open2) {
      detachHost();
      return;
    }
    const items = topics();
    const key = items.map((t) => `${t.id}\x00${t.title}\x00${t.project}`).join("|") || "__empty__";
    if (!host) {
      host = buildHost();
      mountOverlay(host);
    }
    const panel = host.querySelector(`.${cl22("panel")}`);
    if (!panel)
      return;
    applyTheme(panel);
    panel.style.setProperty("--void-rt-count", String(Math.max(1, items.length)));
    if (!items.length) {
      if (paintedKey !== "__empty__") {
        panel.replaceChildren(node("div", cl22("empty"), "Open a few chats, then hold Ctrl+` to switch."));
        paintedKey = "__empty__";
      }
      requestAnimationFrame(() => panel.setAttribute("data-visible", "true"));
      return;
    }
    if (paintedKey === "__empty__" || !panel.querySelector(`.${cl22("list")}`)) {
      panel.replaceChildren(node("div", cl22("list")));
      paintedKey = "";
    }
    if (paintedKey !== key) {
      renderList(items);
      paintedKey = key;
    }
    syncActive();
    requestAnimationFrame(() => panel.setAttribute("data-visible", "true"));
  }
  function detachHost() {
    document.documentElement.classList.remove("void-rt-open");
    paintedKey = "";
    if (host) {
      try {
        host.hidePopover();
      } catch {}
      host.remove();
      host = null;
    }
    document.getElementById("void-rt-host")?.remove();
    document.querySelectorAll("dialog.void-rt-root, [popover].void-rt-root").forEach((el) => {
      const p = el;
      try {
        p.hidePopover?.();
      } catch {}
      try {
        p.close?.();
      } catch {}
      el.remove();
    });
  }
  function mountOverlay(root) {
    root.style.cssText = "position:fixed;inset:0;width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:none;overflow:hidden;z-index:2147483647;display:block;background:transparent;pointer-events:auto;";
    document.documentElement.append(root);
    document.documentElement.classList.add("void-rt-open");
    if (typeof root.showPopover !== "function")
      return;
    root.setAttribute("popover", "manual");
    try {
      root.showPopover();
    } catch {
      root.removeAttribute("popover");
    }
  }
  var recentTopics_default = definePlugin({
    name: "RecentTopics",
    icon: LayoutGridIcon,
    description: "Switch recently opened conversations with Ctrl+` like Arc's tab switcher.",
    authors: [Devs.p],
    tags: ["chat", "ui"],
    enabledByDefault: true,
    settings: settings17,
    managedStyle: "recentTopics",
    _mark({ response }) {
      try {
        if (!response || response.isControl)
          return null;
        const sender = String(response.sender ?? "").toLowerCase();
        const human = sender === "human" || sender === "user";
        const text = human ? pickUserText(response.query || "", response.message || "") : plainText(response.message || "");
        if (!text)
          return null;
        return React.createElement("span", {
          className: "void-rt-mark",
          "data-role": human ? "user" : "assistant",
          hidden: true
        }, text);
      } catch {
        return null;
      }
    },
    patches: [
      {
        find: "response-family:handleEditSave",
        all: true,
        replacement: {
          match: /\(0,\i\.jsx\)\(\i\.MessageBubble,\{isUser:\i,isIncognito:\i,responseId:(\i)\.responseId/,
          replace: "$self._mark({response:$1}),$&"
        }
      }
    ],
    start() {
      detachHost();
      open2 = false;
      held = false;
      ctrlHeld = false;
      try {
        hydrate();
        const current = currentVisit();
        if (current != null)
          bump(current);
        scheduleCapture();
      } catch (e) {
        logger24.error("Hydrate failed:", e);
      }
      if (!keys2) {
        keys2 = new AbortController;
        const { signal } = keys2;
        window.addEventListener("keydown", onKeyDown3, { capture: true, signal });
        window.addEventListener("keyup", onKeyUp, { capture: true, signal });
        window.addEventListener("blur", onWindowBlur, { signal });
        document.addEventListener("visibilitychange", onVisibility2, { signal });
        document.addEventListener("beforeinput", onBeforeInput, { capture: true, signal });
      }
    },
    stop() {
      keys2?.abort();
      keys2 = null;
      open2 = false;
      held = false;
      ctrlHeld = false;
      thumbs.clear();
      detachHost();
    },
    onSettingsChange() {
      try {
        writeVisits(capVisits(readVisits()));
      } catch (e) {
        logger24.error("Settings update failed:", e);
      }
    },
    zustand: {
      RoutingStore: {
        selector: (s) => routeConvId(s.route),
        handler(id) {
          if (open2)
            return;
          const current = currentVisit();
          if (current == null)
            return;
          if (id && isHomeId(current) && !isHomeId(id))
            return;
          bump(current);
          scheduleCapture();
        }
      },
      ChatPageStore: {
        selector: (s) => `${s.conversationId ?? ""}|${s.projectId ?? ""}`,
        handler() {
          if (open2)
            return;
          const id = currentVisit();
          if (id == null)
            return;
          bump(id);
          scheduleCapture();
        }
      },
      ResponseStore: {
        selector: (s) => {
          const id = currentVisit();
          if (!id || isHomeId(id))
            return "";
          const list = s.byConversationId[id];
          const last = list?.[list.length - 1];
          return last ? `${last.responseId}:${last.message?.length ?? 0}` : "";
        },
        handler() {
          if (open2)
            return;
          scheduleCapture();
        }
      }
    }
  });

  // src/plugins/chatStateFavicons/detect.ts
  var EDITOR_SEL2 = '.tiptap.ProseMirror[contenteditable="true"]';
  var STOP_SELECTORS = [
    'button[aria-label="Stop model response"]',
    'button[aria-label*="Stop"]',
    'button[aria-label*="stop"]',
    'button[aria-label*="停止"]'
  ];
  var SEND_SELECTORS = [
    'button[aria-label*="Send"]',
    'button[aria-label*="Submit"]',
    'button[type="submit"]'
  ];
  function isVisible(el) {
    if (!(el instanceof HTMLElement) || !el.isConnected)
      return false;
    if (!el.getClientRects().length)
      return false;
    const style = getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none";
  }
  function isStopControl(el) {
    const label = el.getAttribute("aria-label") ?? "";
    const text = el.textContent ?? "";
    return /stop|停止/i.test(label) || /\bstop\b/i.test(text) || text.includes("停止");
  }
  function getActiveEditor() {
    const list = Array.from(document.querySelectorAll(EDITOR_SEL2));
    return list.find(isVisible) ?? list[0] ?? null;
  }
  function getComposerRoot() {
    const editor = getActiveEditor();
    return editor?.closest("form") ?? editor?.closest("div.relative") ?? editor?.parentElement ?? document.body;
  }
  function collectStopButtons(root) {
    const candidates = [];
    for (const sel of STOP_SELECTORS) {
      for (const node2 of root.querySelectorAll(sel)) {
        if (node2 instanceof HTMLElement)
          candidates.push(node2);
      }
    }
    if (candidates.length === 0) {
      for (const btn of root.querySelectorAll("button")) {
        if (btn instanceof HTMLElement && isStopControl(btn))
          candidates.push(btn);
      }
    }
    return candidates;
  }
  function getStopButton() {
    const candidates = collectStopButtons(document);
    return candidates.find(isVisible) ?? candidates[0] ?? null;
  }
  function isDisabledControl(el) {
    if (el instanceof HTMLButtonElement && el.disabled)
      return true;
    if (el.hasAttribute("disabled"))
      return true;
    if (el.getAttribute("aria-disabled") === "true")
      return true;
    if (el.getAttribute("data-disabled") === "true")
      return true;
    return el.classList.contains("opacity-50") || el.classList.contains("cursor-not-allowed");
  }
  function getSubmitButton() {
    for (const root of [getComposerRoot(), document]) {
      for (const sel of SEND_SELECTORS) {
        for (const node2 of root.querySelectorAll(sel)) {
          if (!(node2 instanceof HTMLElement) || isStopControl(node2))
            continue;
          if (isVisible(node2) || isDisabledControl(node2))
            return node2;
        }
      }
    }
    return null;
  }
  function submitIsGray() {
    const btn = getSubmitButton();
    return !!btn && isDisabledControl(btn);
  }
  function isInputEmpty() {
    const editor = getActiveEditor();
    if (!editor)
      return true;
    if (editor.querySelector("p.is-empty.is-editor-empty"))
      return true;
    return (editor.textContent ?? "").replaceAll("​", "").trim().length === 0;
  }
  function conversationToken() {
    const params = new URLSearchParams(location.search);
    const paramId = params.get("conversationId") ?? params.get("conversation_id") ?? params.get("chatId") ?? params.get("chat_id") ?? params.get("cid") ?? params.get("id") ?? "";
    const lastSeg = location.pathname.split("/").filter(Boolean).slice(-1)[0] ?? "";
    const pathId = /^[a-z0-9_-]{8,}$/i.test(lastSeg) ? lastSeg : "";
    const dataId = document.querySelector("[data-conversation-id]")?.getAttribute("data-conversation-id") ?? "";
    return [dataId, paramId, pathId].filter(Boolean).join("|");
  }
  function contextKeyFromUrl(token) {
    const base = `${location.origin}${location.pathname}`;
    return token ? `${base}|${token}` : `${base}|draft`;
  }

  // src/plugins/chatStateFavicons/icons.ts
  var ICON_STYLES = ["original", "badge", "dot", "hole", "bg"];
  var STYLE_OPTIONS = [
    { label: "only emoji", value: "original" },
    { label: "Badge + glyph", value: "badge", default: true },
    { label: "Color dot", value: "dot" },
    { label: "Mark tint", value: "hole" },
    { label: "Background tint", value: "bg" }
  ];
  var KIND_COLOR = {
    rotate: "#3B82F6",
    done: "#22C55E",
    ready: "#F59E0B",
    error: "#EF4444"
  };
  var HOLE_IDLE = "#050505";
  var MARK_FILL = "#FCFCFC";
  var GROK_MARK_PATH = "M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815";
  var GROK_BG_PATH2 = "M0 256C0 166.392 0 121.587 17.439 87.3615C32.7787 57.2556 57.2556 32.7787 87.3615 17.439C121.587 0 166.392 0 256 0C345.608 0 390.413 0 424.638 17.439C454.744 32.7787 479.221 57.2556 494.561 87.3615C512 121.587 512 166.392 512 256C512 345.608 512 390.413 494.561 424.638C479.221 454.744 454.744 479.221 424.638 494.561C390.413 512 345.608 512 256 512C166.392 512 121.587 512 87.3615 494.561C57.2556 479.221 32.7787 454.744 17.439 424.638C0 390.413 0 345.608 0 256Z";
  var GROK_MARK_P12 = "M210.484 312.759L343.465 210.383C349.984 205.364 359.302 207.322 362.408 215.117C378.758 256.231 371.454 305.64 338.925 339.563C306.397 373.487 261.137 380.927 219.768 363.983L174.577 385.803C239.394 432.008 318.104 420.581 367.289 369.251C406.303 328.564 418.386 273.104 407.088 223.091L407.19 223.198C390.807 149.726 411.218 120.359 453.03 60.3072C454.02 58.8833 455.01 57.4595 456 56L400.978 113.382V113.204L210.45 312.794";
  var GROK_MARK_P22 = "M183.042 337.641C136.519 291.294 144.54 219.567 184.236 178.203C213.59 147.59 261.683 135.096 303.666 153.464L348.755 131.75C340.632 125.627 330.221 119.042 318.275 114.414C264.277 91.2407 199.63 102.774 155.735 148.516C113.513 192.549 100.236 260.254 123.036 318.027C140.069 361.206 112.148 391.748 84.0229 422.575C74.0561 433.503 64.0553 444.431 56 456L183.007 337.677";
  var ORIGINAL_EMOJI = {
    rotate: "\uD83D\uDD04",
    done: "✔️",
    ready: "\uD83D\uDC4D",
    error: "\uD83D\uDEAB"
  };
  function isIconStyle(value) {
    return typeof value === "string" && ICON_STYLES.includes(value);
  }
  function svgEmoji(emoji) {
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${emoji}</text></svg>`)}`;
  }
  function toSvgData(inner, viewBox = "0 0 64 64") {
    const svg2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="64" height="64">${inner}</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg2)}`;
  }
  function grokMarkSvg() {
    return [
      `<rect width="64" height="64" rx="14" fill="${HOLE_IDLE}"/>`,
      `<g transform="translate(8 8) scale(2)" fill="${MARK_FILL}" fill-rule="evenodd">`,
      `<path d="${GROK_MARK_PATH}"/>`,
      "</g>"
    ].join("");
  }
  function officialGrokSvg(markColor, bgColor) {
    return [
      `<path d="${GROK_BG_PATH2}" fill="${bgColor}"/>`,
      `<path d="${GROK_MARK_P12}" fill="${markColor}"/>`,
      `<path d="${GROK_MARK_P22}" fill="${markColor}"/>`
    ].join("");
  }
  function badgeGlyph(kind) {
    if (kind === "rotate") {
      return [
        '<g transform="translate(51.5 51.5)"><g>',
        '<path d="M0-6.1 A6.1 6.1 0 1 1 -5.3 3.05" fill="none" stroke="#fff" stroke-width="2.15" stroke-linecap="round"/>',
        '<animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="0.85s" repeatCount="indefinite"/>',
        "</g></g>"
      ].join("");
    }
    if (kind === "done") {
      return '<path d="M46.6 51.7 L50.1 55.3 L56.8 47.4" fill="none" stroke="#fff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>';
    }
    if (kind === "ready") {
      return [
        '<path d="M51.5 56.4 V46.8" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
        '<path d="M46.6 51.2 L51.5 46.2 L56.4 51.2" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
      ].join("");
    }
    return [
      '<path d="M47.2 47.2 L55.8 55.8" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
      '<path d="M55.8 47.2 L47.2 55.8" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>'
    ].join("");
  }
  function composeIcon(style, kind, officialHref) {
    if (style === "original") {
      if (kind === "wait")
        return officialHref;
      return svgEmoji(ORIGINAL_EMOJI[kind]);
    }
    const color = kind === "wait" ? undefined : KIND_COLOR[kind];
    if (style === "hole") {
      return toSvgData(officialGrokSvg(color ?? MARK_FILL, HOLE_IDLE), "0 0 512 512");
    }
    if (style === "bg") {
      return toSvgData(officialGrokSvg(MARK_FILL, color ?? HOLE_IDLE), "0 0 512 512");
    }
    if (!color || kind === "wait")
      return toSvgData(grokMarkSvg());
    const badge = style === "dot" ? [
      '<circle cx="52.2" cy="52.2" r="10.4" fill="#050505"/>',
      `<circle cx="52.2" cy="52.2" r="7.7" fill="${color}"/>`
    ].join("") : [
      '<circle cx="51.5" cy="51.5" r="12.15" fill="#050505"/>',
      `<circle cx="51.5" cy="51.5" r="9.55" fill="${color}"/>`,
      badgeGlyph(kind)
    ].join("");
    return toSvgData(grokMarkSvg() + badge);
  }
  function buildIcons(style, officialHref) {
    return {
      wait: composeIcon(style, "wait", officialHref),
      rotate: composeIcon(style, "rotate", officialHref),
      done: composeIcon(style, "done", officialHref),
      ready: composeIcon(style, "ready", officialHref),
      error: composeIcon(style, "error", officialHref)
    };
  }

  // src/plugins/chatStateFavicons/index.ts
  var logger25 = new Logger("ChatStateFavicons");
  var ICON_ID = "void-chat-state-favicon";
  var LIVE_RESPONSE = new Set(["streaming", "optimistic", "reconnecting"]);
  var settings18 = definePluginSettings({
    style: {
      type: 4 /* SELECT */,
      description: "How the Grok mark is overlaid with chat state.",
      options: STYLE_OPTIONS
    }
  });
  var officialHref = "/images/favicon.svg";
  var icons = buildIcons("badge", officialHref);
  var kind = "wait";
  var wasStreaming = false;
  var justFinished = false;
  var streamContext = null;
  var lockedToken = "";
  var lastWasError = false;
  var lastConvId = "";
  var primedReady = true;
  var faviconObs = null;
  var globalObs = null;
  var composerObs = null;
  var buttonObs = null;
  var inputCtrl = null;
  var unsubRoute = null;
  var unsubPage = null;
  var raf = 0;
  var started2 = false;
  function currentStyle() {
    const value = settings18.store.style;
    return isIconStyle(value) ? value : "badge";
  }
  function captureOfficial() {
    const existing = document.querySelector(`link[rel~="icon"]:not(#${ICON_ID})`);
    const href = existing?.href;
    if (href && !href.startsWith("data:"))
      return href;
    return `${location.origin}/images/favicon.svg`;
  }
  function isIconLink(node2) {
    return node2 instanceof HTMLLinkElement && (node2.relList.contains("icon") || /\bicon\b/i.test(node2.rel));
  }
  function stripCompetitors() {
    const { head } = document;
    if (!head)
      return;
    for (const node2 of head.querySelectorAll("link")) {
      if (node2.id !== ICON_ID && isIconLink(node2))
        node2.remove();
    }
  }
  function applyHref(href) {
    const { head } = document;
    if (!head)
      return;
    stripCompetitors();
    let link = document.getElementById(ICON_ID);
    if (!link) {
      link = document.createElement("link");
      link.id = ICON_ID;
      link.rel = "icon shortcut icon";
      link.type = "image/svg+xml";
      link.setAttribute("sizes", "any");
      head.prepend(link);
    } else if (head.firstChild !== link) {
      head.prepend(link);
    }
    if (link.getAttribute("href") !== href)
      link.setAttribute("href", href);
  }
  function setKind(next) {
    kind = next;
    applyHref(icons[next]);
  }
  function rebuildIcons() {
    icons = buildIcons(currentStyle(), officialHref);
    applyHref(icons[kind]);
  }
  function liveResponse(id, byId) {
    if (!id)
      return false;
    const response = byId[id];
    if (!response)
      return false;
    if (response.partial)
      return true;
    return LIVE_RESPONSE.has(response.state ?? "");
  }
  function storeStreaming() {
    try {
      const page = ChatPageStore.useChatPageStore.getState();
      if (page.streamedMessageId || page.showStreamingIndicator)
        return true;
      const { byId } = ResponseStore.useResponseStore.getState();
      return liveResponse(page.streamedMessageId, byId) || liveResponse(page.lastMessageId, byId);
    } catch (e) {
      logger25.debug("stream stores unavailable:", e);
      return false;
    }
  }
  function isStreaming() {
    if (storeStreaming())
      return true;
    return getStopButton() != null;
  }
  function currentConversationId() {
    try {
      const { route } = RoutingStore.useRoutingStore.getState();
      if (route.conversationId)
        return String(route.conversationId);
    } catch (e) {
      logger25.debug("RoutingStore unavailable:", e);
    }
    try {
      const id = ChatPageStore.useChatPageStore.getState().conversationId;
      if (id)
        return id;
    } catch (e) {
      logger25.debug("ChatPageStore unavailable:", e);
    }
    return conversationToken();
  }
  function getContextKey() {
    const id = currentConversationId();
    const key = id || contextKeyFromUrl("");
    if (isStreaming()) {
      if (!lockedToken && key)
        lockedToken = key;
      return lockedToken;
    }
    lockedToken = "";
    return key;
  }
  function sameStreamContext(key) {
    return !!streamContext && !!key && streamContext === key;
  }
  function resetStreamFlags() {
    wasStreaming = false;
    justFinished = false;
    streamContext = null;
    lockedToken = "";
    lastWasError = false;
  }
  function onConversationSwitch(id) {
    lastConvId = id;
    resetStreamFlags();
    primedReady = false;
    composerObs?.disconnect();
    composerObs = null;
    buttonObs?.disconnect();
    buttonObs = null;
    setKind("wait");
  }
  function hasError() {
    if (lastWasError)
      return true;
    try {
      const { byId } = ResponseStore.useResponseStore.getState();
      const page = ChatPageStore.useChatPageStore.getState();
      const id = page.streamedMessageId ?? page.lastMessageId;
      if (!id)
        return false;
      const response = byId[id];
      return response?.state === "error" || response?.error != null;
    } catch (e) {
      logger25.debug("ResponseStore unavailable:", e);
      return false;
    }
  }
  function evaluateState() {
    if (!started2)
      return;
    const conv = currentConversationId();
    if (lastConvId && conv && lastConvId !== conv) {
      onConversationSwitch(conv);
      return;
    }
    if (conv)
      lastConvId = conv;
    const contextKey = getContextKey();
    const streaming = isStreaming();
    const empty = isInputEmpty();
    const gray = submitIsGray();
    if (hasError() && !streaming) {
      setKind("error");
      wasStreaming = false;
      justFinished = false;
      streamContext = null;
      lastWasError = false;
      return;
    }
    if (streaming && empty) {
      wasStreaming = true;
      justFinished = false;
      lastWasError = false;
      streamContext = contextKey;
      setKind("rotate");
      return;
    }
    if (wasStreaming) {
      const sameContext = sameStreamContext(contextKey);
      wasStreaming = false;
      if (sameContext && gray) {
        justFinished = true;
        streamContext = contextKey;
        setKind("done");
        return;
      }
      justFinished = false;
      streamContext = null;
    }
    if (justFinished) {
      const contextChanged = !!(streamContext && contextKey && streamContext !== contextKey);
      if (contextChanged) {
        justFinished = false;
        streamContext = null;
      } else if (empty) {
        setKind("done");
        return;
      } else if (primedReady) {
        justFinished = false;
        setKind("ready");
        return;
      } else {
        justFinished = false;
        setKind("wait");
        return;
      }
    }
    streamContext = null;
    lastWasError = false;
    if (empty)
      setKind("wait");
    else if (primedReady)
      setKind("ready");
    else
      setKind("wait");
  }
  function nodeTouchesStop(node2) {
    if (!(node2 instanceof Element))
      return false;
    if (node2 instanceof HTMLElement && node2.tagName === "BUTTON" && isStopControl(node2))
      return true;
    for (const btn of node2.querySelectorAll("button")) {
      if (isStopControl(btn))
        return true;
    }
    return false;
  }
  function stopButtonMutation(list) {
    for (const m of list) {
      if (nodeTouchesStop(m.target))
        return true;
      for (const n of m.addedNodes) {
        if (nodeTouchesStop(n))
          return true;
      }
      for (const n of m.removedNodes) {
        if (nodeTouchesStop(n))
          return true;
      }
      if (m.type === "attributes" && m.attributeName === "aria-label" && m.target instanceof HTMLElement) {
        if (isStopControl(m.target) || /stop|停止/i.test(String(m.oldValue ?? "")))
          return true;
      }
    }
    return false;
  }
  function nodeInEditor(node2) {
    const el = node2 instanceof Element ? node2 : node2?.parentElement;
    return !!el?.closest(EDITOR_SEL2);
  }
  function mutationsAreEditorOnly(list) {
    if (!list.length)
      return false;
    for (const m of list) {
      if (!nodeInEditor(m.target))
        return false;
      for (const n of m.addedNodes) {
        if (n instanceof Text)
          continue;
        if (!nodeInEditor(n))
          return false;
      }
      for (const n of m.removedNodes) {
        if (n instanceof Text)
          continue;
        if (!nodeInEditor(n))
          return false;
      }
    }
    return true;
  }
  function onDomMutate(list) {
    if (kind === "rotate" || wasStreaming) {
      if (mutationsAreEditorOnly(list))
        return;
      if (!stopButtonMutation(list))
        return;
    }
    scheduleEvaluate();
  }
  function onEditorInput() {
    primedReady = true;
    scheduleEvaluate();
  }
  function scheduleEvaluate() {
    if (!started2 || raf)
      return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!started2)
        return;
      bindEditorInput();
      const root = getComposerRoot();
      if (!composerObs || !root.isConnected) {
        observeComposer();
        observeButtons();
      }
      evaluateState();
    });
  }
  function onStreamEnd4({ responseId }) {
    try {
      const response = ResponseStore.useResponseStore.getState().byId[responseId];
      lastWasError = response?.state === "error" || response?.error != null;
    } catch (e) {
      logger25.debug("ResponseStore unavailable:", e);
    }
  }
  function startFaviconGuard() {
    faviconObs?.disconnect();
    const { head } = document;
    if (!head)
      return;
    faviconObs = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === "attributes" && isIconLink(m.target) && m.target.id !== ICON_ID) {
          applyHref(icons[kind]);
          return;
        }
        for (const node2 of m.addedNodes) {
          if (isIconLink(node2) && node2.id !== ICON_ID) {
            applyHref(icons[kind]);
            return;
          }
        }
      }
    });
    faviconObs.observe(head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href", "rel"]
    });
  }
  function bindEditorInput() {
    const editor = getActiveEditor();
    if (!editor || editor.dataset.voidCsfBound === "1")
      return;
    editor.dataset.voidCsfBound = "1";
    editor.addEventListener("input", onEditorInput, { passive: true });
    editor.addEventListener("compositionend", onEditorInput, { passive: true });
  }
  function observeComposer() {
    composerObs?.disconnect();
    const root = getComposerRoot();
    composerObs = new MutationObserver(onDomMutate);
    composerObs.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-label", "aria-disabled", "disabled", "data-testid", "class"],
      attributeOldValue: true
    });
  }
  function observeButtons() {
    buttonObs?.disconnect();
    const target = getComposerRoot();
    buttonObs = new MutationObserver(onDomMutate);
    buttonObs.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-label", "type"],
      attributeOldValue: true
    });
  }
  function attachStores() {
    unsubRoute?.();
    unsubPage?.();
    try {
      const routeStore = RoutingStore.useRoutingStore;
      if (typeof routeStore?.subscribe === "function") {
        unsubRoute = routeStore.subscribe((s) => s.route.conversationId, (id, prev) => {
          if (!id || id === prev)
            return;
          onConversationSwitch(String(id));
        });
      }
    } catch (e) {
      logger25.debug("RoutingStore subscribe failed:", e);
      try {
        unsubRoute = RoutingStore.useRoutingStore.subscribe(() => scheduleEvaluate());
      } catch (err) {
        logger25.debug("RoutingStore full subscribe failed:", err);
      }
    }
    try {
      const pageStore = ChatPageStore.useChatPageStore;
      if (typeof pageStore?.subscribe === "function") {
        unsubPage = pageStore.subscribe((s) => s.conversationId, (id, prev) => {
          if (!id || id === prev)
            return;
          onConversationSwitch(id);
        });
      }
    } catch (e) {
      logger25.debug("ChatPageStore subscribe failed:", e);
    }
  }
  function restoreOfficial() {
    faviconObs?.disconnect();
    faviconObs = null;
    document.getElementById(ICON_ID)?.remove();
    const { head } = document;
    if (!head)
      return;
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = officialHref;
    head.prepend(link);
  }
  var chatStateFavicons_default = definePlugin({
    name: "ChatStateFavicons",
    icon: AppWindowIcon,
    description: "Show streaming, done, ready, and error states on the tab favicon.",
    authors: [Devs.p],
    tags: ["chat", "ui"],
    enabledByDefault: true,
    settings: settings18,
    startAt: "TurbopackReady" /* TurbopackReady */,
    cleanupSelectors: [`#${ICON_ID}`],
    start() {
      started2 = true;
      officialHref = captureOfficial();
      rebuildIcons();
      startFaviconGuard();
      inputCtrl?.abort();
      inputCtrl = new AbortController;
      window.addEventListener("popstate", scheduleEvaluate, { signal: inputCtrl.signal });
      globalObs?.disconnect();
      globalObs = new MutationObserver(onDomMutate);
      globalObs.observe(document.body, { childList: true, subtree: true });
      bindEditorInput();
      observeComposer();
      observeButtons();
      attachStores();
      evaluateState();
    },
    stop() {
      started2 = false;
      if (raf)
        cancelAnimationFrame(raf);
      raf = 0;
      inputCtrl?.abort();
      inputCtrl = null;
      unsubRoute?.();
      unsubRoute = null;
      unsubPage?.();
      unsubPage = null;
      globalObs?.disconnect();
      globalObs = null;
      composerObs?.disconnect();
      composerObs = null;
      buttonObs?.disconnect();
      buttonObs = null;
      wasStreaming = false;
      justFinished = false;
      streamContext = null;
      lockedToken = "";
      lastConvId = "";
      primedReady = true;
      lastWasError = false;
      restoreOfficial();
    },
    onSettingsChange: rebuildIcons,
    events: {
      streamEnd: onStreamEnd4
    }
  });

  // void-css:/tmp/Void/src/plugins/exportChat/styles.css
  registerStyle("exportChat", `.void-export-icon {
    margin-inline-end: 0.5rem;
}
`);

  // src/plugins/exportChat/index.tsx
  var logger26 = new Logger("ExportChat");
  function buildExportMessage(r) {
    return {
      id: r.responseId,
      sender: r.sender,
      message: r.message,
      query: r.query,
      createTime: r.createTime,
      model: r.requestMetadata?.model ?? r.model,
      ...r.thinkingTrace && { thinkingTrace: r.thinkingTrace },
      ...r.webSearchResults?.length && { webSearchResults: r.webSearchResults },
      ...r.generatedImageUrls?.length && { generatedImageUrls: r.generatedImageUrls },
      ...r.fileAttachments?.length && { fileAttachments: r.fileAttachments },
      ...r.steps?.length && { steps: r.steps }
    };
  }
  function formatTs(ts) {
    return ts ? new Date(ts).toLocaleString() : "";
  }
  function sender(s) {
    return s.toLowerCase() === "human" ? "You" : "Grok";
  }
  function toMarkdown(title, messages) {
    const lines = [`# ${title}`, ""];
    for (const m of messages) {
      const ts = formatTs(m.createTime);
      lines.push(`## ${sender(m.sender)}${ts ? ` — ${ts}` : ""}${m.model ? ` (${m.model})` : ""}`, "");
      if (m.thinkingTrace)
        lines.push("<details><summary>Thinking</summary>", "", m.thinkingTrace, "", "</details>", "");
      const mdText = m.query || m.message;
      if (mdText)
        lines.push(mdText, "");
      if (m.generatedImageUrls?.length) {
        for (const url of m.generatedImageUrls)
          lines.push(`![image](${url})`);
        lines.push("");
      }
      if (m.webSearchResults?.length) {
        lines.push("**Web search results:**", "");
        for (const r of m.webSearchResults) {
          const { title: t, url } = r;
          if (url)
            lines.push(`- [${t ?? url}](${url})`);
        }
        lines.push("");
      }
      lines.push("---", "");
    }
    return lines.join(`
`);
  }
  function toPlainText(title, messages) {
    const lines = [title, "=".repeat(title.length), ""];
    for (const m of messages) {
      const ts = formatTs(m.createTime);
      lines.push(`[${sender(m.sender)}]${ts ? ` ${ts}` : ""}${m.model ? ` (${m.model})` : ""}`, "");
      if (m.thinkingTrace)
        lines.push("[Thinking]", m.thinkingTrace, "");
      const txtText = m.query || m.message;
      if (txtText)
        lines.push(txtText, "");
      if (m.generatedImageUrls?.length) {
        for (const url of m.generatedImageUrls)
          lines.push(`  ${url}`);
        lines.push("");
      }
      if (m.webSearchResults?.length) {
        for (const r of m.webSearchResults) {
          const { title: t, url } = r;
          if (url)
            lines.push(`  ${t ?? ""} - ${url}`);
        }
        lines.push("");
      }
      lines.push("-".repeat(40), "");
    }
    return lines.join(`
`);
  }
  var HTML_HEAD = [
    '<!DOCTYPE html><html><head><meta charset="utf-8">',
    "<style>",
    "body{font-family:system-ui,sans-serif;max-width:50rem;margin:2rem auto;padding:0 1rem;background:#0d0d0d;color:#e0e0e0}",
    ".m{margin:1.5rem 0;padding:1rem;border-radius:.5rem;border:1px solid #222}",
    ".h{background:#1a1a2e}.g{background:#111}",
    ".s{font-weight:600;margin-bottom:.5rem;color:#aaa}.t{font-size:.8rem;color:#666}",
    ".th{margin:.5rem 0;padding:.5rem;background:#1a1a1a;border-left:3px solid #444;font-size:.9rem;color:#999}",
    "a{color:#6ea8fe}",
    "</style></head><body>"
  ].join(`
`);
  function toHtml(title, messages) {
    const p = [HTML_HEAD, `<h1>${escapeHtml(title)}</h1>`];
    for (const m of messages) {
      const cls = m.sender.toLowerCase() === "human" ? "h" : "g";
      const ts = formatTs(m.createTime);
      p.push(`<div class="m ${cls}"><div class="s">${sender(m.sender)} <span class="t">${ts ? escapeHtml(ts) : ""}${m.model ? ` · ${escapeHtml(m.model)}` : ""}</span></div>`);
      if (m.thinkingTrace)
        p.push(`<details><summary>Thinking</summary><div class="th">${escapeHtml(m.thinkingTrace)}</div></details>`);
      const text = m.query || m.message;
      if (text)
        p.push(`<div>${escapeHtml(text).replaceAll(`
`, "<br>")}</div>`);
      if (m.generatedImageUrls?.length) {
        for (const url of m.generatedImageUrls) {
          const safe = safeUrl(url);
          if (safe)
            p.push(`<img src="${escapeHtml(safe, true)}" style="max-width:100%;margin:.5rem 0">`);
        }
      }
      if (m.webSearchResults?.length) {
        p.push("<ul>");
        for (const r of m.webSearchResults) {
          const { title: t, url } = r;
          if (!url)
            continue;
          const safe = safeUrl(url);
          if (safe)
            p.push(`<li><a href="${escapeHtml(safe, true)}" rel="noopener noreferrer">${escapeHtml(t ?? safe)}</a></li>`);
          else
            p.push(`<li>${escapeHtml(t ?? url)}</li>`);
        }
        p.push("</ul>");
      }
      p.push("</div>");
    }
    p.push("</body></html>");
    return p.join(`
`);
  }
  var FORMATS = [
    { fmt: "json", label: "JSON" },
    { fmt: "md", label: "Markdown" },
    { fmt: "txt", label: "Plain Text" },
    { fmt: "html", label: "HTML" }
  ];
  async function exportChat(conversationId, format) {
    const { responses } = await ApiClients.chatApi.chatListResponses({ conversationId }) ?? {};
    if (!responses?.length)
      return;
    const conversation = ConversationStore.useConversationStore.getState().byId[conversationId];
    const title = conversation?.title ?? "Untitled Chat";
    const messages = responses.map(buildExportMessage);
    const filename = sanitizeFilename(title, "chat");
    let content;
    let mime;
    switch (format) {
      case "json":
        content = JSON.stringify({ conversationId, title, exportedAt: new Date().toISOString(), messages }, null, 2);
        mime = "application/json";
        break;
      case "md":
        content = toMarkdown(title, messages);
        mime = "text/markdown";
        break;
      case "txt":
        content = toPlainText(title, messages);
        mime = "text/plain";
        break;
      case "html":
        content = toHtml(title, messages);
        mime = "text/html";
        break;
    }
    await FileUtils.downloadBlob(new Blob([content], { type: mime }), `${filename}.${format}`);
  }
  function ExportMenu({ conversationId }) {
    const streaming = useIsStreaming(conversationId);
    return /* @__PURE__ */ React.createElement(MenuSub, null, /* @__PURE__ */ React.createElement(MenuSubTrigger, {
      disabled: streaming
    }, /* @__PURE__ */ React.createElement(DownloadIcon, {
      size: 16,
      className: "void-export-icon"
    }), "Export"), /* @__PURE__ */ React.createElement(MenuSubContent, null, FORMATS.map(({ fmt, label }) => /* @__PURE__ */ React.createElement(MenuItem, {
      key: fmt,
      onSelect: () => exportChat(conversationId, fmt).catch((e) => logger26.error("Failed to export chat", e))
    }, label))));
  }
  var exportChat_default = definePlugin({
    name: "ExportChat",
    icon: FileDownIcon,
    description: "Export conversations in multiple formats from the right-click menu.",
    authors: [Devs.Prism],
    tags: ["chat"],
    contextMenuItems: {
      conversation: {
        label: "Export",
        render: ErrorBoundary.wrap(ExportMenu)
      }
    }
  });

  // void-css:/tmp/Void/src/plugins/placeholder/styles.css
  registerStyle("placeholder", `.void-ph-root {
    contain: content;
}

.void-ph-textarea-wrap {
    border: 1px solid hsl(var(--border-l2));
    border-radius: 0.75rem;
}

.void-ph-textarea-wrap:focus-within {
    outline: 2px solid hsl(var(--fg-primary));
    outline-offset: 2px;
}

.void-ph-textarea {
    width: 100%;
    min-height: 7.5rem;
    padding: 0.75rem;
    background: transparent;
    border: none;
    border-radius: 0.75rem;
    color: hsl(var(--fg-primary));
    font-size: 0.875rem;
    resize: vertical;
}

.void-ph-textarea:focus {
    outline: none;
}
`);

  // src/plugins/placeholder/index.tsx
  var cl23 = classNameFactory("void-ph-");
  var DEFAULT_PHRASES = [
    "What do you want to know?",
    "How can I help you today?",
    "What's on your mind?"
  ].join(`
`);
  function parsePhrases(raw) {
    return String(raw ?? "").split(`
`).map((s) => s.trim()).filter(Boolean);
  }
  var settings19 = definePluginSettings({
    phrases: {
      type: 6 /* COMPONENT */,
      default: DEFAULT_PHRASES,
      component: PhrasesEditor
    }
  }).withPrivateSettings();
  function PhrasesEditor() {
    const { phrases } = settings19.use(["phrases"]);
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.5rem",
      className: cl23("root")
    }, /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0"
    }, /* @__PURE__ */ React.createElement(Text2, {
      size: "sm",
      weight: "medium"
    }, "Phrases"), /* @__PURE__ */ React.createElement(Paragraph, null, "One placeholder per line. Empty list uses Grok's defaults.")), /* @__PURE__ */ React.createElement("div", {
      className: cl23("textarea-wrap")
    }, /* @__PURE__ */ React.createElement(Textarea, {
      className: cl23("textarea"),
      value: phrases ?? DEFAULT_PHRASES,
      onChange: (e) => {
        settings19.store.phrases = e.target.value;
      },
      placeholder: DEFAULT_PHRASES
    })));
  }
  var placeholder_default = definePlugin({
    name: "Placeholder",
    icon: TextCursorInputIcon,
    description: "Replace the rotating chat input placeholder.",
    authors: [Devs.p],
    tags: ["chat"],
    settings: settings19,
    _phrases() {
      const lines = parsePhrases(settings19.store.phrases ?? DEFAULT_PHRASES);
      return lines.length ? lines : null;
    },
    patches: [
      {
        find: `query-bar-placeholder.whats-on-your-mind","What's on your mind?"`,
        replacement: {
          match: /("query-bar-placeholder\.whats-on-your-mind","What's on your mind\?"\)\],\[\i,\i,\i,\i\]\),)(\i)=(\i\(\)),(\i)=(\i)\.map\(\2\)/,
          replace: "$1$2=$3,$4=($self._phrases()??$5).map($2)"
        }
      }
    ]
  });

  // void-css:/tmp/Void/src/plugins/messageTimestamps/styles.css
  registerStyle("messageTimestamps", `.void-timestamp {
    margin-bottom: 0.125rem;
}

@media print {
    .void-timestamp {
        display: none;
    }
}
`);

  // src/plugins/messageTimestamps/index.tsx
  var settings20 = definePluginSettings({
    showDate: {
      type: 3 /* BOOLEAN */,
      description: "Show the full date for messages older than today.",
      default: true
    },
    hideOwnMessages: {
      type: 3 /* BOOLEAN */,
      description: "Hide timestamps on your own messages.",
      default: false
    }
  });
  function formatTimestamp(iso, showDate) {
    const date = new Date(iso);
    const now = new Date;
    const today = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (!showDate || today)
      return time;
    return date.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + time;
  }
  var messageTimestamps_default = definePlugin({
    name: "MessageTimestamps",
    icon: ClockIcon,
    description: "Shows timestamps on chat messages.",
    authors: [Devs.Prism],
    tags: ["chat"],
    settings: settings20,
    _renderTimestamp: ErrorBoundary.wrap(({ response }) => {
      if (!response?.createTime)
        return null;
      if (settings20.store.hideOwnMessages && response.sender === "human")
        return null;
      return /* @__PURE__ */ React.createElement(Text2, {
        as: "span",
        size: "xs",
        color: "muted",
        className: "void-timestamp"
      }, formatTimestamp(response.createTime, settings20.store.showDate));
    }),
    patches: [
      {
        find: "response-family:handleEditSave",
        all: true,
        replacement: {
          match: /\(0,\i\.jsx\)\(\i\.MessageBubble,\{isUser:\i,isIncognito:\i,responseId:(\i)\.responseId/,
          replace: "$self._renderTimestamp({response:$1}),$&"
        }
      }
    ]
  });

  // void-css:/tmp/Void/src/plugins/chatListStatus/styles.css
  registerStyle("chatListStatus", `/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

[data-sidebar] :is(
    [data-sidebar="menu-button"],
    [data-sidebar="menu-sub-button"],
    a
):has(> .void-cls):not([data-void-cls-nest]) {
    display: flex;
    align-items: center;
    min-width: 0;
}

.void-cls {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 0.75rem;
    height: 0.75rem;
    margin-right: 0.25rem;
    pointer-events: none;
    color: #3b82f6;
}

.void-cls[data-kind="done"],
.void-cls[data-kind="error"] {
    width: 0.45rem;
    height: 0.45rem;
    margin-right: 0.3rem;
    border-radius: 999px;
    background: #3b82f6;
}

.void-cls[data-kind="error"] {
    background: #ef4444;
}

[data-void-cls-nest] {
    position: relative;
}

[data-void-cls-nest] > .void-cls {
    position: absolute;
    top: 50%;
    left: 0.25rem;
    z-index: 1;
    margin: 0;
    transform: translateY(-50%);
}

.void-cls[data-kind="streaming"] svg {
    display: block;
    width: 100%;
    height: 100%;
    animation: void-cls-spin 0.8s linear infinite;
}

@keyframes void-cls-spin {
    to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
    .void-cls[data-kind="streaming"] svg {
        animation: none;
    }
}
`);

  // src/plugins/chatListStatus/index.ts
  var logger27 = new Logger("ChatListStatus");
  var MARK = "void-cls";
  var LIVE = new Set(["streaming", "optimistic", "reconnecting", "in_progress", "in-progress"]);
  var DEAD = new Set(["closed", "error", "done", "completed", "complete", "cancelled", "canceled", "aborted", "idle", "success", "worked", "failed"]);
  var LIVE_WORD = /^(working|running|in[_-]?progress|executing|processing|pending|continuing|started)$/i;
  var LIVE_FLAG = /^(isWorking|isRunning|inProgress|isInProgress|isExecuting|working)$/;
  var SKIP_KEY = /^(message|content|html|query|text|title|thinkingTrace)$/i;
  var EXTRA_HINT = /computer|sandbox|agent|taskResult/i;
  var OWN_HOOKS = new Set(["useChatPageStore", "useConversationStore", "useResponseStore", "useRoutingStore"]);
  var SIDEBAR = '[data-sidebar="sidebar"], [data-sidebar="content"]';
  var HOST = '[data-sidebar="menu-button"], [data-sidebar="menu-sub-button"]';
  var ROW = 'a[href*="/c/"], a[href*="/chat/"], a[href*="chat="]';
  var SPIN_PATH = "M21 12a9 9 0 1 1-6.219-8.56";
  var marks = new Map;
  var rowById = new Map;
  var extraStores = [];
  var extraSeen = new WeakSet;
  var extraScanned = new Set;
  var extraUnsubs = [];
  var raf2 = 0;
  var extraScanRaf = 0;
  var extraBusy = false;
  var started3 = false;
  var obs = null;
  var extraOff = null;
  function isConvId(value) {
    return typeof value === "string" && value.length >= 8 && /^[a-z0-9_-]+$/i.test(value);
  }
  function isLiveStatus(value) {
    if (typeof value !== "string")
      return false;
    const status = value.trim().toLowerCase();
    if (!status || DEAD.has(status))
      return false;
    return LIVE.has(status) || LIVE_WORD.test(status);
  }
  function shallowLive(value) {
    if (value == null)
      return false;
    if (typeof value === "string")
      return isLiveStatus(value);
    if (typeof value !== "object")
      return false;
    const rec = value;
    if (isLiveStatus(rec.status ?? rec.state ?? rec.phase ?? rec.activity ?? rec.taskStatus))
      return true;
    for (const key of Object.keys(rec)) {
      if (LIVE_FLAG.test(key) && rec[key] === true)
        return true;
    }
    return false;
  }
  function isLiveResponse(r) {
    if (!r)
      return false;
    if (r.partial)
      return true;
    const state2 = r.state ?? "";
    return !!state2 && LIVE.has(state2);
  }
  function isErrorResponse(r) {
    return !!r && (r.state === "error" || r.error != null);
  }
  function collectConvIds(value, out, depth = 0) {
    if (value == null || typeof value !== "object" || depth > 3)
      return;
    if (Array.isArray(value)) {
      const start = Math.max(0, value.length - 8);
      for (let i = start;i < value.length; i++)
        collectConvIds(value[i], out, depth + 1);
      return;
    }
    const rec = value;
    const id = rec.conversationId ?? rec.optimisticConversationId ?? rec.chat ?? rec.conversation_id;
    if (isConvId(id))
      out.add(id);
    let n = 0;
    for (const [key, child] of Object.entries(rec)) {
      if (++n > 24)
        break;
      if (SKIP_KEY.test(key))
        continue;
      if (isConvId(key))
        out.add(key);
      if (child && typeof child === "object")
        collectConvIds(child, out, depth + 1);
    }
  }
  function currentIds() {
    const ids = [];
    const add = (value) => {
      if (isConvId(value) && !ids.includes(value))
        ids.push(value);
    };
    try {
      const page = ChatPageStore.useChatPageStore.getState();
      add(page.conversationId);
      add(page.optimisticConversationId);
    } catch (e) {
      logger27.debug("page ids unavailable:", e);
    }
    try {
      const { route } = RoutingStore.useRoutingStore.getState();
      add(route.conversationId);
      add(route.chat);
    } catch (e) {
      logger27.debug("route ids unavailable:", e);
    }
    try {
      const url = new URL(location.href);
      add(url.searchParams.get("chat"));
      add(url.searchParams.get("conversationId"));
      add(url.pathname.match(/^\/(?:c|chat)\/([^/?#]+)/i)?.[1]);
    } catch (e) {
      logger27.debug("url ids unavailable:", e);
    }
    return ids;
  }
  function considerConversation(ids, conversation) {
    if (!conversation?.conversationId)
      return;
    if (shallowLive(conversation.taskResult))
      ids.add(conversation.conversationId);
  }
  function looksExtraStore(name, state2) {
    if (EXTRA_HINT.test(name))
      return true;
    return Object.keys(state2).some((key) => EXTRA_HINT.test(key));
  }
  function scanModule(exports) {
    if (exports == null || typeof exports !== "object" || isBlacklisted(exports))
      return;
    const mod = exports;
    for (const key of Object.keys(mod)) {
      if (OWN_HOOKS.has(key))
        continue;
      const val = mod[key];
      if (!isZustandStore(val) || extraSeen.has(val))
        continue;
      let state2;
      try {
        state2 = val.getState();
      } catch {
        continue;
      }
      if (!state2 || typeof state2 !== "object")
        continue;
      if (!looksExtraStore(key, state2))
        continue;
      extraSeen.add(val);
      extraStores.push(val);
      extraUnsubs.push(val.subscribe(() => schedule()));
      logger27.info("extra store", key);
    }
  }
  function attachExtraStores() {
    if (extraBusy)
      return;
    extraBusy = true;
    try {
      silenceWarns(() => syncLazyModules());
      const before = extraStores.length;
      for (const [id, exports] of getModuleCache()) {
        if (extraScanned.has(id))
          continue;
        extraScanned.add(id);
        scanModule(exports);
      }
      if (extraStores.length !== before)
        schedule();
    } finally {
      extraBusy = false;
    }
  }
  function queueExtraScan() {
    if (!started3 || extraScanRaf)
      return;
    extraScanRaf = requestAnimationFrame(() => {
      extraScanRaf = 0;
      if (started3)
        attachExtraStores();
    });
  }
  function extraLiveIds(ids) {
    for (const store3 of extraStores) {
      let state2;
      try {
        state2 = store3.getState();
      } catch {
        continue;
      }
      if (!shallowLive(state2))
        continue;
      const found = new Set;
      collectConvIds(state2, found);
      for (const id of found)
        ids.add(id);
    }
  }
  function liveIds() {
    const ids = new Set;
    try {
      const page = ChatPageStore.useChatPageStore.getState();
      const currents = currentIds();
      const { byId, inflightPromisesByConversationId } = ResponseStore.useResponseStore.getState();
      if (page.showStreamingIndicator) {
        for (const id of currents)
          ids.add(id);
      }
      if (isLiveResponse(byId[page.streamedMessageId ?? ""]) || isLiveResponse(byId[page.lastMessageId ?? ""]) || isLiveResponse(byId[page.sidePanelResponseId ?? ""])) {
        for (const id of currents)
          ids.add(id);
      }
      for (const id of Object.keys(inflightPromisesByConversationId ?? {}))
        ids.add(id);
    } catch (e) {
      logger27.debug("stream stores unavailable:", e);
    }
    try {
      const { list, byId } = ConversationStore.useConversationStore.getState();
      const rows = list?.length ? list : Object.values(byId ?? {});
      for (const conversation of rows)
        considerConversation(ids, conversation);
    } catch (e) {
      logger27.debug("conversation store unavailable:", e);
    }
    extraLiveIds(ids);
    return ids;
  }
  function errorOf(id) {
    try {
      const { byConversationId, byId } = ResponseStore.useResponseStore.getState();
      const list = byConversationId[id];
      if (list?.length) {
        for (let i = list.length - 1;i >= 0; i--) {
          const r = list[i];
          if (String(r.sender ?? "").toLowerCase() === "human")
            continue;
          return isErrorResponse(r);
        }
      }
      const page = ChatPageStore.useChatPageStore.getState();
      if ((page.conversationId === id || page.optimisticConversationId === id) && page.lastMessageId) {
        return isErrorResponse(byId[page.lastMessageId]);
      }
    } catch (e) {
      logger27.debug("error lookup failed:", e);
    }
    return false;
  }
  function refreshMarks() {
    const live = liveIds();
    const opened = new Set(currentIds());
    for (const id of live)
      marks.set(id, "streaming");
    for (const [id, kind2] of marks) {
      let next = kind2;
      if (kind2 === "streaming" && !live.has(id)) {
        next = errorOf(id) ? "error" : "done";
        marks.set(id, next);
      }
      if (next !== "streaming" && opened.has(id))
        marks.delete(id);
    }
  }
  function convOfResponse(responseId) {
    try {
      const { byConversationId } = ResponseStore.useResponseStore.getState();
      for (const [id, list] of Object.entries(byConversationId ?? {})) {
        if (list?.some((r) => r.responseId === responseId))
          return id;
      }
      return currentIds()[0] ?? "";
    } catch (e) {
      logger27.debug("conv lookup failed:", e);
      return "";
    }
  }
  function onStreamEnd5({ responseId }) {
    const cid = convOfResponse(responseId);
    if (!cid)
      return;
    if (liveIds().has(cid)) {
      schedule();
      return;
    }
    if (currentIds().includes(cid)) {
      marks.delete(cid);
      schedule();
      return;
    }
    try {
      const response = ResponseStore.useResponseStore.getState().byId[responseId];
      marks.set(cid, isErrorResponse(response) ? "error" : "done");
    } catch (e) {
      logger27.debug("streamEnd failed:", e);
      marks.set(cid, "done");
    }
    schedule();
  }
  function idFromHref(href) {
    if (!href)
      return "";
    try {
      const u = new URL(href, location.origin);
      const id = u.searchParams.get("chat") || u.searchParams.get("conversationId") || u.pathname.match(/^\/(?:c|chat)\/([^/?#]+)/i)?.[1] || "";
      return isConvId(id) ? id : "";
    } catch {
      return "";
    }
  }
  function hrefId(el) {
    const a = el instanceof HTMLAnchorElement ? el : el.closest("a[href]") ?? el.querySelector("a[href]");
    return idFromHref(a?.getAttribute("href") ?? el.getAttribute("href") ?? "");
  }
  function rowHost(el, root) {
    if (el.classList.contains(MARK))
      return null;
    if (el.closest('[data-sidebar="menu-action"], [data-sidebar="footer"], [data-sidebar="header"]'))
      return null;
    if (!hrefId(el))
      return null;
    const wrapped = el.closest(HOST);
    return wrapped && root.contains(wrapped) ? wrapped : el;
  }
  function isNestedHost(el) {
    if (el.matches('[data-sidebar="menu-sub-button"]'))
      return true;
    const a = el instanceof HTMLAnchorElement ? el : el.querySelector("a[href]");
    const href = a?.getAttribute("href") ?? el.getAttribute("href") ?? "";
    return href.includes("chat=") || href.includes("/project/");
  }
  function spinSvg() {
    const svg2 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg2.setAttribute("viewBox", "0 0 24 24");
    svg2.setAttribute("fill", "none");
    svg2.setAttribute("stroke", "currentColor");
    svg2.setAttribute("stroke-width", "2.5");
    svg2.setAttribute("stroke-linecap", "round");
    svg2.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", SPIN_PATH);
    svg2.append(path);
    return svg2;
  }
  function placeNestMark(btn, mark) {
    if (!btn.hasAttribute("data-void-cls-nest")) {
      mark.style.removeProperty("left");
      return;
    }
    const pad2 = parseFloat(getComputedStyle(btn).paddingLeft);
    const width = mark.offsetWidth || 12;
    const left = Math.max(2, (Number.isFinite(pad2) ? pad2 : 8) - width - 4);
    mark.style.left = `${left}px`;
  }
  function ensureMark(btn, kind2) {
    btn.toggleAttribute("data-void-cls-nest", isNestedHost(btn));
    let mark = btn.querySelector(`:scope > .${MARK}`);
    if (!mark) {
      mark = document.createElement("span");
      mark.className = MARK;
      mark.setAttribute("aria-hidden", "true");
      btn.prepend(mark);
    }
    if (mark.dataset.kind !== kind2 || kind2 === "streaming" && !mark.querySelector("svg")) {
      mark.dataset.kind = kind2;
      mark.replaceChildren();
      if (kind2 === "streaming")
        mark.append(spinSvg());
    }
    placeNestMark(btn, mark);
  }
  function clearMark(btn) {
    btn.querySelector(`:scope > .${MARK}`)?.remove();
    btn.removeAttribute("data-void-cls-nest");
  }
  function roots() {
    const found = [...document.querySelectorAll(SIDEBAR)];
    return found.length ? found : [document.body];
  }
  function rowForId(root, id) {
    if (!isConvId(id))
      return null;
    for (const a of root.querySelectorAll(`a[href*="${id}"]`)) {
      if (hrefId(a) !== id)
        continue;
      const host2 = rowHost(a, root);
      if (host2)
        return host2;
    }
    return null;
  }
  function paint2() {
    if (!started3)
      return;
    refreshMarks();
    const usedIds = new Set;
    const seen = new Set;
    for (const root of roots()) {
      for (const el of root.querySelectorAll(ROW)) {
        const host2 = rowHost(el, root);
        if (!host2 || seen.has(host2))
          continue;
        seen.add(host2);
        const id = hrefId(host2);
        if (!id) {
          clearMark(host2);
          continue;
        }
        usedIds.add(id);
        rowById.set(id, host2);
        const kind2 = marks.get(id);
        if (kind2)
          ensureMark(host2, kind2);
        else
          clearMark(host2);
      }
    }
    for (const [id, el] of rowById) {
      if (!el.isConnected || !usedIds.has(id))
        rowById.delete(id);
    }
    for (const [id, kind2] of marks) {
      if (rowById.get(id)?.isConnected)
        continue;
      for (const root of roots()) {
        const host2 = rowForId(root, id);
        if (!host2)
          continue;
        rowById.set(id, host2);
        ensureMark(host2, kind2);
        break;
      }
    }
  }
  function schedule() {
    if (!started3 || raf2)
      return;
    raf2 = requestAnimationFrame(() => {
      raf2 = 0;
      if (started3)
        paint2();
    });
  }
  function ownMutation(list) {
    if (!list.length)
      return false;
    for (const m of list) {
      const { target } = m;
      if (target instanceof Element && (target.classList.contains(MARK) || target.closest(`.${MARK}`)))
        continue;
      for (const n of m.addedNodes) {
        if (n instanceof Element && (n.classList.contains(MARK) || n.querySelector(`.${MARK}`)))
          continue;
        return false;
      }
      for (const n of m.removedNodes) {
        if (n instanceof Element && n.classList.contains(MARK))
          continue;
        return false;
      }
      if (m.type === "attributes")
        return false;
    }
    return true;
  }
  function observe() {
    obs?.disconnect();
    const node2 = document.querySelector(SIDEBAR) ?? document.body;
    obs = new MutationObserver((list) => {
      if (ownMutation(list))
        return;
      if (node2 === document.body && document.querySelector(SIDEBAR))
        observe();
      schedule();
    });
    obs.observe(node2, node2 === document.body ? { childList: true, subtree: true } : { childList: true, subtree: true, attributes: true, attributeFilter: ["href"] });
  }
  function pageKey(s) {
    return `${s.conversationId ?? ""}|${s.optimisticConversationId ?? ""}|${s.streamedMessageId ?? ""}|${s.sidePanelResponseId ?? ""}|${s.showStreamingIndicator ? 1 : 0}`;
  }
  function responseKey(s) {
    return Object.keys(s.inflightPromisesByConversationId ?? {}).join(",");
  }
  function conversationKey(s) {
    const live = [];
    const seen = new Set;
    const consider = (conversation) => {
      if (!conversation?.conversationId || seen.has(conversation.conversationId))
        return;
      if (!shallowLive(conversation.taskResult))
        return;
      seen.add(conversation.conversationId);
      live.push(conversation.conversationId);
    };
    const rows = s.list?.length ? s.list : Object.values(s.byId ?? {});
    for (const conversation of rows)
      consider(conversation);
    return live.join(",");
  }
  function routeKey(s) {
    const { route } = s;
    return `${route.conversationId ?? ""}|${route.chat ?? ""}|${route.workspaceId ?? ""}`;
  }
  var chatListStatus_default = definePlugin({
    name: "ChatListStatus",
    icon: LoaderCircleIcon,
    description: "Show Grok reply status on sidebar chats: spinner, blue dot, or error.",
    authors: [Devs.p],
    tags: ["chat", "ui"],
    enabledByDefault: true,
    startAt: "TurbopackReady" /* TurbopackReady */,
    managedStyle: "chatListStatus",
    cleanupSelectors: [`.${MARK}`],
    start() {
      started3 = true;
      attachExtraStores();
      extraOff = onModuleLoad(queueExtraScan);
      const sidebar = document.querySelector('[data-sidebar="sidebar"]');
      logger27.info("start", "sidebar", !!sidebar, "rows", sidebar?.querySelectorAll(ROW).length ?? 0, "live", liveIds().size, "current", currentIds()[0] ?? "");
      observe();
      schedule();
    },
    stop() {
      started3 = false;
      if (raf2)
        cancelAnimationFrame(raf2);
      raf2 = 0;
      if (extraScanRaf)
        cancelAnimationFrame(extraScanRaf);
      extraScanRaf = 0;
      obs?.disconnect();
      obs = null;
      extraOff?.();
      extraOff = null;
      for (const unsub of extraUnsubs)
        unsub();
      extraUnsubs.length = 0;
      extraStores.length = 0;
      extraSeen = new WeakSet;
      extraScanned.clear();
      for (const el of document.querySelectorAll(`.${MARK}`)) {
        el.parentElement?.removeAttribute("data-void-cls-nest");
        el.remove();
      }
      marks.clear();
      rowById.clear();
    },
    events: {
      streamEnd: onStreamEnd5
    },
    zustand: {
      ChatPageStore: {
        selector: pageKey,
        handler: schedule
      },
      ResponseStore: {
        selector: responseKey,
        handler: schedule
      },
      ConversationStore: {
        selector: conversationKey,
        handler: schedule
      },
      RoutingStore: {
        selector: routeKey,
        handler: schedule
      }
    }
  });

  // src/plugins/starry/index.tsx
  var DEFAULT_COLOR = "#ffffff";
  var StarsBackground = findExportedComponentLazy("StarsBackground");
  function hexToRgb(hex) {
    const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
    if (!m)
      return [255, 255, 255];
    const n = parseInt(m[1], 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  function ColorRow2() {
    const { starColor } = settings21.use(["starColor"]);
    return /* @__PURE__ */ React.createElement(ColorSettingRow, {
      value: starColor,
      onChange: (v) => {
        settings21.store.starColor = v;
      },
      title: "Star color",
      description: "Color of the twinkling stars."
    });
  }
  function StarryBackground() {
    const { starColor } = settings21.use(["starColor"]);
    return /* @__PURE__ */ React.createElement("div", {
      "aria-hidden": true,
      className: "fixed inset-0 -z-10 pointer-events-none"
    }, /* @__PURE__ */ React.createElement(StarsBackground, {
      starColor: hexToRgb(starColor)
    }));
  }
  var WrappedStarry = ErrorBoundary.wrap(StarryBackground);
  var settings21 = definePluginSettings({
    starColor: {
      type: 6 /* COMPONENT */,
      default: DEFAULT_COLOR,
      component: ColorRow2
    }
  }).withPrivateSettings();
  var starry_default = definePlugin({
    name: "Starry",
    icon: SparklesIcon,
    description: "Adds Grok's native twinkling starry background to the main page.",
    authors: [Devs.Prism],
    tags: ["ui"],
    settings: settings21,
    _StarryBg() {
      return /* @__PURE__ */ React.createElement(WrappedStarry, {
        key: "void-starry-bg"
      });
    },
    patches: [
      {
        find: '"chat-page")',
        replacement: {
          match: /(children:\[)((?:\i,){2,8}\i\]\},"chat-page"\))/,
          replace: "$1$self._StarryBg(),$2"
        }
      }
    ]
  });

  // src/plugins/noGrokBot/index.ts
  var STYLE_NAME6 = "noGrokBot";
  var CSS2 = `
#grok-bot-nav-button,
div:has(> #grok-bot-nav-button) {
    display: none !important;
}
#promo-portal [aria-label*="Grok Bot"] {
    display: none !important;
}
`;
  var noGrokBot_default = definePlugin({
    name: "NoGrokBot",
    icon: BotOffIcon,
    description: "Hide the top-right Grok Bot promo button.",
    authors: [Devs.p],
    tags: ["ui"],
    enabledByDefault: true,
    start() {
      registerStyle(STYLE_NAME6, CSS2);
    },
    stop() {
      unregisterStyle(STYLE_NAME6);
    }
  });

  // void-css:/tmp/Void/src/plugins/downloadTTS/styles.css
  registerStyle("downloadTTS", `.void-download-tts-spinner {
    pointer-events: none;
}
`);

  // src/plugins/downloadTTS/index.tsx
  var cl24 = classNameFactory("void-download-tts-");
  var logger28 = new Logger("DownloadTTS");
  async function fetchAndDownload() {
    const { currentStreamId } = TextToSpeechStore.useTextToSpeechStore.getState();
    if (!currentStreamId)
      return;
    const voiceId = ChatPageStore.useChatPageStore.getState().voiceId;
    let url = `/http/app-chat/read-response-audio-file/${currentStreamId}`;
    if (voiceId)
      url += `?voiceId=${encodeURIComponent(voiceId)}`;
    const res = await fetch(url);
    if (!res.ok)
      throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    await FileUtils.downloadBlob(blob, `tts-${currentStreamId.slice(0, 8)}.wav`);
  }
  function DownloadButton() {
    const [loading, onClick2] = useAsyncAction(async () => {
      try {
        await fetchAndDownload();
      } catch (e) {
        logger28.error("Failed to download TTS audio:", e);
      }
    });
    return /* @__PURE__ */ React.createElement(Button, {
      "aria-label": "Download audio",
      onClick: onClick2,
      disabled: loading,
      size: "md",
      shape: "square",
      variant: "tertiary"
    }, loading ? /* @__PURE__ */ React.createElement(Spinner, {
      size: "sm",
      className: cl24("spinner")
    }) : /* @__PURE__ */ React.createElement(DownloadIcon, {
      size: 16
    }));
  }
  var downloadTTS_default = definePlugin({
    name: "DownloadTTS",
    icon: Volume2Icon,
    description: "Add a download button to the TTS playback controls.",
    authors: [Devs.Prism],
    tags: ["chat"],
    patches: [{
      find: 'tts-controls.stop.label","Stop"',
      all: true,
      replacement: {
        match: /("tts-controls\.stop\.label","Stop"\).{0,600}?,children:\[(?:\i,){1,8}\i)\]/,
        replace: "$1,$self._renderDownloadButton()]"
      }
    }],
    _renderDownloadButton: ErrorBoundary.wrap(DownloadButton)
  });

  // src/plugins/noDictation/index.ts
  var STYLE_NAME7 = "noDictation";
  var REFINEMENT_MARK = "void-no-dictation-refinement";
  var BUTTON_CSS = `
button[aria-label="Dictation"]:not([role="dialog"] *),
button[aria-label^="Dictation ("]:not([role="dialog"] *),
div:has(> button[aria-label="Dictation"]):not([role="dialog"] *),
div:has(> button[aria-label^="Dictation ("]):not([role="dialog"] *) {
    display: none !important;
}
`;
  var REFINEMENT_CSS = `.${REFINEMENT_MARK}{display:none!important}`;
  var settings22 = definePluginSettings({
    hideDictationRefinement: {
      type: 3 /* BOOLEAN */,
      description: 'Hide "Dictation Refinement" in the Grok Settings dialog (Behavior tab).',
      default: true
    }
  });
  function apply4() {
    const rules = [BUTTON_CSS];
    if (settings22.store.hideDictationRefinement)
      rules.push(REFINEMENT_CSS);
    registerStyle(STYLE_NAME7, rules.join(`
`));
  }
  var noDictation_default = definePlugin({
    name: "NoDictation",
    icon: MicOffIcon,
    description: "Hide the Dictation (voice input) button from the chat input bar, and optionally Dictation Refinement in Settings.",
    authors: [Devs.p],
    tags: ["chat", "ui"],
    enabledByDefault: true,
    settings: settings22,
    patches: [
      {
        find: 'settings.behavior.dictation-refinement.description","How much Grok refines your speech-to-text transcriptions',
        replacement: {
          match: /DISABLE_VOICE_MODE&&\(0,(\i)\.jsxs\)\(\i\.Fragment,\{/,
          replace: `DISABLE_VOICE_MODE&&(0,$1.jsxs)("div",{className:"${REFINEMENT_MARK}",style:{display:"contents"},`
        }
      }
    ],
    start: apply4,
    onSettingsChange: apply4,
    stop() {
      unregisterStyle(STYLE_NAME7);
    }
  });

  // src/plugins/consoleJanitor/index.ts
  var warnNoop = { match: /console\.warn\(\i\)/, replace: "void 0" };
  var consoleJanitor_default = definePlugin({
    name: "ConsoleJanitor",
    icon: TerminalIcon,
    description: "Silences noisy warnings and info logs in the browser console.",
    authors: [Devs.Prism],
    patches: [
      { find: "x.ai/careers", replacement: { match: /console\.info\("[^"]{0,3000}"\)/, replace: "void 0" } },
      { find: "useDrawerContext must be used within a Drawer.Root", all: true, replacement: warnNoop },
      { find: "DialogDescriptionWarning", all: true, replacement: warnNoop },
      { find: "window.PressureObserver", replacement: { match: /if\(!window\.PressureObserver\)return/, replace: "return" } },
      { find: "NO_I18NEXT_INSTANCE", all: true, replacement: { match: /console\.warn\(\.\.\.\i\)/, replace: "void 0" } }
    ]
  });

  // src/plugins/oneko/index.ts
  var ONEKO_GIF = "https://raw.githubusercontent.com/adryd325/oneko.js/14bab15a755d0e35cd4ae19c931d96d306f99f42/oneko.gif";
  var ONEKO_SCRIPT = '(function oneko(){const nekoEl=document.createElement("div");let nekoPosX=32,nekoPosY=32,mousePosX=0,mousePosY=0,frameCount=0,idleTime=0,idleAnimation=null,idleAnimationFrame=0;const nekoSpeed=10;const spriteSets={idle:[[-3,-3]],alert:[[-7,-3]],scratchSelf:[[-5,0],[-6,0],[-7,0]],scratchWallN:[[0,0],[0,-1]],scratchWallS:[[-7,-1],[-6,-2]],scratchWallE:[[-2,-2],[-2,-3]],scratchWallW:[[-4,0],[-4,-1]],tired:[[-3,-2]],sleeping:[[-2,0],[-2,-1]],N:[[-1,-2],[-1,-3]],NE:[[0,-2],[0,-3]],E:[[-3,0],[-3,-1]],SE:[[-5,-1],[-5,-2]],S:[[-6,-3],[-7,-2]],SW:[[-5,-3],[-6,-1]],W:[[-4,-2],[-4,-3]],NW:[[-1,0],[-1,-1]]};function init(){nekoEl.id="oneko";nekoEl.ariaHidden=true;nekoEl.style.width="32px";nekoEl.style.height="32px";nekoEl.style.position="fixed";nekoEl.style.pointerEvents="none";nekoEl.style.imageRendering="pixelated";nekoEl.style.left=nekoPosX-16+"px";nekoEl.style.top=nekoPosY-16+"px";nekoEl.style.zIndex=2147483647;nekoEl.style.backgroundImage="url(ONEKO_GIF_URL)";document.body.appendChild(nekoEl);document.addEventListener("mousemove",function(e){mousePosX=e.clientX;mousePosY=e.clientY});window.requestAnimationFrame(onAnimationFrame)}let lastFrameTimestamp;function onAnimationFrame(timestamp){if(!nekoEl.isConnected)return;if(!lastFrameTimestamp)lastFrameTimestamp=timestamp;if(timestamp-lastFrameTimestamp>100){lastFrameTimestamp=timestamp;frame()}window.requestAnimationFrame(onAnimationFrame)}function setSprite(name,frame){const sprite=spriteSets[name][frame%spriteSets[name].length];nekoEl.style.backgroundPosition=sprite[0]*32+"px "+sprite[1]*32+"px"}function resetIdleAnimation(){idleAnimation=null;idleAnimationFrame=0}function idle(){idleTime+=1;if(idleTime>10&&Math.floor(Math.random()*200)==0&&idleAnimation==null){let a=["sleeping","scratchSelf"];if(nekoPosX<32)a.push("scratchWallW");if(nekoPosY<32)a.push("scratchWallN");if(nekoPosX>window.innerWidth-32)a.push("scratchWallE");if(nekoPosY>window.innerHeight-32)a.push("scratchWallS");idleAnimation=a[Math.floor(Math.random()*a.length)]}switch(idleAnimation){case"sleeping":if(idleAnimationFrame<8){setSprite("tired",0);break}setSprite("sleeping",Math.floor(idleAnimationFrame/4));if(idleAnimationFrame>192)resetIdleAnimation();break;case"scratchWallN":case"scratchWallS":case"scratchWallE":case"scratchWallW":case"scratchSelf":setSprite(idleAnimation,idleAnimationFrame);if(idleAnimationFrame>9)resetIdleAnimation();break;default:setSprite("idle",0);return}idleAnimationFrame+=1}function frame(){frameCount+=1;const diffX=nekoPosX-mousePosX;const diffY=nekoPosY-mousePosY;const distance=Math.sqrt(diffX**2+diffY**2);if(distance<nekoSpeed||distance<48){idle();return}idleAnimation=null;idleAnimationFrame=0;if(idleTime>1){setSprite("alert",0);idleTime=Math.min(idleTime,7);idleTime-=1;return}let direction;direction=diffY/distance>0.5?"N":"";direction+=diffY/distance<-0.5?"S":"";direction+=diffX/distance>0.5?"W":"";direction+=diffX/distance<-0.5?"E":"";setSprite(direction,frameCount);nekoPosX-=(diffX/distance)*nekoSpeed;nekoPosY-=(diffY/distance)*nekoSpeed;nekoPosX=Math.min(Math.max(16,nekoPosX),window.innerWidth-16);nekoPosY=Math.min(Math.max(16,nekoPosY),window.innerHeight-16);nekoEl.style.left=nekoPosX-16+"px";nekoEl.style.top=nekoPosY-16+"px"}init()})();';
  var oneko_default = definePlugin({
    name: "Oneko",
    icon: CatIcon,
    description: "Cat follows your mouse cursor.",
    authors: [Devs.adryd],
    tags: ["ui"],
    cleanupSelectors: ["#oneko"],
    start() {
      const s = ONEKO_SCRIPT.replace("ONEKO_GIF_URL", ONEKO_GIF);
      const el = document.createElement("script");
      el.src = URL.createObjectURL(new Blob([s], { type: "text/javascript" }));
      document.head.appendChild(el);
      el.addEventListener("load", () => {
        el.remove();
        URL.revokeObjectURL(el.src);
      }, { once: true });
    }
  });

  // void-css:/tmp/Void/src/plugins/streamerMode/styles.css
  registerStyle("streamerMode", `/* stylelint-disable no-descending-specificity */

/* Sidebar avatar */
html.void-streamer-sidebar-avatar [data-sidebar="footer"] button[data-state]>div {
    filter: blur(6px);
    transition: filter 0.2s ease;
}

html.void-streamer-sidebar-avatar [data-sidebar="footer"] button[data-state]:hover>div,
html.void-streamer-sidebar-avatar .void-sidebar-card:hover button[data-state]>div {
    filter: none;
}

/* Sidebar username */
html.void-streamer-sidebar-name .void-sidebar-info {
    filter: blur(6px);
    transition: filter 0.2s ease;
}

html.void-streamer-sidebar-name .void-sidebar-card:hover .void-sidebar-info {
    filter: none;
}

/* Account tab avatar (inside settings dialog) */
html.void-streamer-account-avatar [role="dialog"] .w-12.h-12 img {
    filter: blur(6px);
    transition: filter 0.2s ease;
}

html.void-streamer-account-avatar [role="dialog"] .w-12.h-12:hover img {
    filter: none;
}

/* Account tab username */
html.void-streamer-account-name [role="dialog"] .p-1.min-w-0.text-sm>.text-sm.font-medium {
    filter: blur(6px);
    transition: filter 0.2s ease;
}

html.void-streamer-account-name [role="dialog"] .p-1.min-w-0.text-sm:hover>.text-sm.font-medium {
    filter: none;
}

/* Account tab email */
html.void-streamer-account-email [role="dialog"] .p-1.min-w-0.text-sm>.text-secondary.truncate {
    filter: blur(6px);
    transition: filter 0.2s ease;
}

html.void-streamer-account-email [role="dialog"] .p-1.min-w-0.text-sm:hover>.text-secondary.truncate {
    filter: none;
}

/* Account tab birth year */
html.void-streamer-account-age [role="dialog"] .text-fg-secondary.font-normal {
    filter: blur(6px);
    transition: filter 0.2s ease;
}

html.void-streamer-account-age [role="dialog"] .text-fg-secondary.font-normal:hover {
    filter: none;
}

/* Conversation titles in sidebar (pinned + recent buckets) */
html.void-streamer-conversations [data-sidebar="content"] a[href*="/c/"]>span {
    filter: blur(6px);
    transition: filter 0.2s ease;
}

html.void-streamer-conversations [data-sidebar="content"] a[href*="/c/"]:hover>span {
    filter: none;
}

/* Project names in sidebar */
html.void-streamer-projects [data-sidebar="content"] a[href*="/project/"]>span {
    filter: blur(6px);
    transition: filter 0.2s ease;
}

html.void-streamer-projects [data-sidebar="content"] a[href*="/project/"]:hover>span {
    filter: none;
}

@media (prefers-reduced-motion: reduce) {
    html.void-streamer-sidebar-avatar [data-sidebar="footer"] button[data-state]>div,
    html.void-streamer-sidebar-name .void-sidebar-info,
    html.void-streamer-account-avatar [role="dialog"] .w-12.h-12 img,
    html.void-streamer-account-name [role="dialog"] .p-1.min-w-0.text-sm>.text-sm.font-medium,
    html.void-streamer-account-email [role="dialog"] .p-1.min-w-0.text-sm>.text-secondary.truncate,
    html.void-streamer-account-age [role="dialog"] .text-fg-secondary.font-normal,
    html.void-streamer-conversations [data-sidebar="content"] a[href*="/c/"]>span,
    html.void-streamer-projects [data-sidebar="content"] a[href*="/project/"]>span { transition: none; }
}
`);

  // src/plugins/streamerMode/index.ts
  var CSS_CLASSES = {
    sidebarAvatar: "void-streamer-sidebar-avatar",
    sidebarName: "void-streamer-sidebar-name",
    accountAvatar: "void-streamer-account-avatar",
    accountName: "void-streamer-account-name",
    accountEmail: "void-streamer-account-email",
    accountAge: "void-streamer-account-age",
    projects: "void-streamer-projects",
    conversations: "void-streamer-conversations"
  };
  var settings23 = definePluginSettings({
    sidebarAvatar: {
      type: 3 /* BOOLEAN */,
      description: "Blur your avatar in the sidebar.",
      default: true
    },
    sidebarName: {
      type: 3 /* BOOLEAN */,
      description: "Blur your username in the sidebar.",
      default: true
    },
    accountAvatar: {
      type: 3 /* BOOLEAN */,
      description: "Blur your avatar in the account settings tab.",
      default: true
    },
    accountName: {
      type: 3 /* BOOLEAN */,
      description: "Blur your name in the account settings tab.",
      default: true
    },
    accountEmail: {
      type: 3 /* BOOLEAN */,
      description: "Blur your email in the account settings tab.",
      default: true
    },
    accountAge: {
      type: 3 /* BOOLEAN */,
      description: "Blur your birth year in the account settings tab.",
      default: true
    },
    projects: {
      type: 3 /* BOOLEAN */,
      description: "Blur project names in the sidebar.",
      default: true
    },
    conversations: {
      type: 3 /* BOOLEAN */,
      description: "Blur conversation titles in the sidebar.",
      default: true
    }
  });
  function syncClasses() {
    const { classList } = document.documentElement;
    for (const [key, cls] of Object.entries(CSS_CLASSES)) {
      classList.toggle(cls, !!settings23.store[key]);
    }
  }
  var streamerMode_default = definePlugin({
    name: "StreamerMode",
    icon: EyeOffIcon,
    description: "Blurs personal information for privacy while streaming.",
    authors: [Devs.Prism],
    tags: ["privacy"],
    settings: settings23,
    start: syncClasses,
    onSettingsChange: syncClasses,
    stop() {
      const { classList } = document.documentElement;
      for (const cls of Object.values(CSS_CLASSES)) {
        classList.remove(cls);
      }
    }
  });

  // src/plugins/incognito/index.ts
  var store3 = () => SettingsStore.useSettingsStore.getState();
  var unsubscribe = null;
  function enforce() {
    if (!store3().isIncognito)
      store3().setIsIncognito(true);
  }
  var incognito_default = definePlugin({
    name: "Incognito",
    icon: GhostFilledIcon,
    description: "Force private chat mode for new conversations.",
    authors: [Devs.Prism],
    tags: ["privacy"],
    startAt: "TurbopackReady" /* TurbopackReady */,
    start() {
      enforce();
      unsubscribe = SettingsStore.useSettingsStore.subscribe(enforce);
    },
    stop() {
      unsubscribe?.();
      unsubscribe = null;
      store3().setIsIncognito(false);
    }
  });

  // void-css:/tmp/Void/src/plugins/customInstructions/styles.css
  registerStyle("customInstructions", `.void-ci-root {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.void-ci-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
}

.void-ci-card {
    position: relative;
    display: flex;
    width: 100%;
    align-items: center;
    gap: 0.625rem;
    border-radius: 1rem;
    padding: 0.625rem 0.75rem;
    height: 3.25rem;
    color: hsl(var(--fg-primary));
    background: hsl(var(--surface-l1));
    box-shadow: inset 0 0 0 1px hsl(var(--border-l1));
    cursor: pointer;
}

.void-ci-card:hover {
    background: var(--button-ghost-hover, rgb(255 255 255 / 8%));
}

.void-ci-card-add {
    justify-content: center;
    box-shadow: none;
    border: 1px dashed hsl(var(--border-l1));
}

.void-ci-avatar {
    position: relative;
    flex-shrink: 0;
}

.void-ci-card-name {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
    flex: 1;
    gap: 0.125rem;
}

.void-ci-card-name>* {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
}

.void-ci-card-actions {
    position: absolute;
    inset-block: 0;
    inset-inline-end: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.125rem;
    opacity: 0;
    transition: opacity 0.15s;
}

.void-ci-card:hover .void-ci-card-actions {
    opacity: 1;
}

.void-ci-card:focus-visible {
    outline: 2px solid hsl(var(--fg-primary));
    outline-offset: 2px;
}

.void-ci-editor {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.void-ci-label {
    padding-inline: 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: hsl(var(--fg-primary));
}

.void-ci-input {
    width: 100%;
}

.void-ci-textarea-wrap {
    border: 1px solid hsl(var(--border-l2));
    border-radius: 0.75rem;
}

.void-ci-textarea-wrap:focus-within {
    outline: 2px solid hsl(var(--fg-primary));
    outline-offset: 2px;
}

.void-ci-textarea-wrap-error {
    border-color: hsl(var(--fg-danger));
}

.void-ci-textarea {
    width: 100%;
    min-height: 7.5rem;
    padding: 0.75rem;
    background: transparent;
    border: none;
    border-radius: 0.75rem;
    color: hsl(var(--fg-primary));
    font-size: 0.875rem;
    resize: vertical;
}

.void-ci-textarea:focus {
    outline: none;
}

.void-ci-editor-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-inline: 0.25rem;
}

.void-ci-error-text {
    color: hsl(var(--fg-danger));
}

.void-ci-trigger {
    gap: 0.5rem;
}

.void-ci-menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}

@media (prefers-reduced-motion: reduce) {
    .void-ci-card-actions {
        transition: none;
    }
}
`);

  // src/plugins/customInstructions/index.tsx
  var cl25 = classNameFactory("void-ci-");
  var PixelAvatarModule = findByPropsLazy("PixelAvatar");
  var CheckIcon = findExportedComponentLazy("CheckIcon");
  var BookIcon = findExportedComponentLazy("BookIcon");
  var PenIcon = findExportedComponentLazy("PenIcon");
  var TrashIcon2 = findExportedComponentLazy("TrashIcon");
  var PlusIcon = findExportedComponentLazy("PlusIcon");
  var MAX_LENGTH = 4000;
  var settings24 = definePluginSettings({
    editor: {
      type: 6 /* COMPONENT */,
      component: () => /* @__PURE__ */ React.createElement(PresetsEditor, null)
    }
  }).withPrivateSettings();
  function getPresets() {
    return settings24.plain.presets ?? [];
  }
  function setPresets(presets) {
    settings24.store.presets = presets;
  }
  function getAssignments() {
    return settings24.plain.assignments ?? {};
  }
  function PresetCard({ preset, onEdit, onDelete }) {
    return /* @__PURE__ */ React.createElement("div", {
      role: "button",
      className: cl25("card"),
      onClick: onEdit
    }, /* @__PURE__ */ React.createElement("div", {
      className: cl25("avatar")
    }, /* @__PURE__ */ React.createElement(PixelAvatarModule.PixelAvatar, {
      seed: preset.id,
      size: 32
    })), /* @__PURE__ */ React.createElement("div", {
      className: cl25("card-name")
    }, /* @__PURE__ */ React.createElement(Text2, {
      size: "sm",
      weight: "medium"
    }, preset.name || "Untitled")), /* @__PURE__ */ React.createElement("div", {
      className: cl25("card-actions")
    }, /* @__PURE__ */ React.createElement(ButtonWithTooltip, {
      variant: "tertiary",
      size: "xs",
      shape: "square",
      tooltipContent: "Edit",
      onClick: (e) => {
        e.stopPropagation();
        onEdit();
      }
    }, /* @__PURE__ */ React.createElement(PenIcon, {
      className: "size-3.5 text-secondary"
    })), /* @__PURE__ */ React.createElement(ButtonWithTooltip, {
      variant: "tertiary",
      size: "xs",
      shape: "square",
      tooltipContent: "Delete",
      onClick: (e) => {
        e.stopPropagation();
        onDelete();
      }
    }, /* @__PURE__ */ React.createElement(TrashIcon2, {
      className: "size-3.5 text-secondary"
    }))));
  }
  function PresetEditor({ preset, onUpdate, onClose }) {
    const overLimit = preset.prompt.length > MAX_LENGTH;
    return /* @__PURE__ */ React.createElement("div", {
      className: cl25("editor")
    }, /* @__PURE__ */ React.createElement(Text2, {
      size: "sm",
      weight: "medium",
      className: cl25("label")
    }, "Name"), /* @__PURE__ */ React.createElement(Input, {
      type: "text",
      className: cl25("input"),
      placeholder: "Preset name",
      value: preset.name,
      onChange: (e) => onUpdate({ ...preset, name: e.target.value }),
      autoComplete: "off"
    }), /* @__PURE__ */ React.createElement(Text2, {
      size: "sm",
      weight: "medium",
      className: cl25("label")
    }, "Instructions"), /* @__PURE__ */ React.createElement("div", {
      className: cl25("textarea-wrap", { "textarea-wrap-error": overLimit })
    }, /* @__PURE__ */ React.createElement(Textarea, {
      className: cl25("textarea"),
      placeholder: "How should Grok behave?",
      value: preset.prompt,
      onChange: (e) => onUpdate({ ...preset, prompt: e.target.value })
    })), /* @__PURE__ */ React.createElement("div", {
      className: cl25("editor-footer")
    }, /* @__PURE__ */ React.createElement(Text2, {
      size: "xs",
      color: overLimit ? undefined : "muted",
      className: overLimit ? cl25("error-text") : undefined
    }, preset.prompt.length, "/", MAX_LENGTH), /* @__PURE__ */ React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      shape: "rectangle",
      onClick: onClose
    }, "Done")));
  }
  function PresetsEditor() {
    const presets = settings24.use(["presets"]).presets ?? [];
    const [editingId, setEditingId] = useState(null);
    const updatePreset = useCallback((updated) => {
      setPresets(getPresets().map((p) => p.id === updated.id ? updated : p));
    }, []);
    const deletePreset = useCallback((id) => {
      setPresets(getPresets().filter((p) => p.id !== id));
      const a = { ...getAssignments() };
      for (const [k, v] of Object.entries(a)) {
        if (v === id)
          delete a[k];
      }
      settings24.store.assignments = a;
      setEditingId((prev) => prev === id ? null : prev);
    }, []);
    const addPreset = useCallback(() => {
      const id = randomId();
      setPresets([...getPresets(), { id, name: "", prompt: "" }]);
      setEditingId(id);
    }, []);
    const editing = presets.find((p) => p.id === editingId);
    return /* @__PURE__ */ React.createElement("div", {
      className: cl25("root")
    }, /* @__PURE__ */ React.createElement("div", {
      className: cl25("grid")
    }, presets.map((p) => /* @__PURE__ */ React.createElement(PresetCard, {
      key: p.id,
      preset: p,
      onEdit: () => setEditingId(editingId === p.id ? null : p.id),
      onDelete: () => deletePreset(p.id)
    })), /* @__PURE__ */ React.createElement("div", {
      role: "button",
      className: cl25("card", "card-add"),
      onClick: addPreset
    }, /* @__PURE__ */ React.createElement(PlusIcon, {
      className: "size-4 text-secondary"
    }), /* @__PURE__ */ React.createElement(Text2, {
      size: "sm",
      weight: "medium",
      color: "muted"
    }, "New"))), editing && /* @__PURE__ */ React.createElement(PresetEditor, {
      preset: editing,
      onUpdate: updatePreset,
      onClose: () => setEditingId(null)
    }));
  }
  function InstructionsMenu({ conversationId }) {
    const presets = settings24.use(["presets"]).presets ?? [];
    const assignments = settings24.use(["assignments"]).assignments ?? {};
    const activePresetId = assignments[conversationId];
    const assign = useCallback((presetId) => {
      const a = { ...getAssignments() };
      if (presetId)
        a[conversationId] = presetId;
      else
        delete a[conversationId];
      settings24.store.assignments = a;
    }, [conversationId]);
    if (!presets.length)
      return null;
    return /* @__PURE__ */ React.createElement(MenuSub, null, /* @__PURE__ */ React.createElement(MenuSubTrigger, {
      className: cl25("trigger")
    }, /* @__PURE__ */ React.createElement(BookIcon, {
      size: 16
    }), " Instructions"), /* @__PURE__ */ React.createElement(MenuSubContent, null, /* @__PURE__ */ React.createElement(MenuItem, {
      onSelect: () => assign(),
      className: cl25("menu-item")
    }, /* @__PURE__ */ React.createElement(Text2, {
      size: "sm"
    }, "None"), !activePresetId && /* @__PURE__ */ React.createElement(CheckIcon, {
      className: "size-3.5 shrink-0"
    })), presets.map((p) => /* @__PURE__ */ React.createElement(MenuItem, {
      key: p.id,
      onSelect: () => assign(p.id),
      className: cl25("menu-item")
    }, /* @__PURE__ */ React.createElement(Text2, {
      size: "sm"
    }, p.name || "Untitled"), activePresetId === p.id && /* @__PURE__ */ React.createElement(CheckIcon, {
      className: "size-3.5 shrink-0"
    })))));
  }
  var customInstructions_default = definePlugin({
    name: "CustomInstructions",
    icon: ScrollTextIcon,
    description: "Create instruction presets and assign them to conversations.",
    authors: [Devs.Prism],
    tags: ["chat"],
    settings: settings24,
    contextMenuItems: {
      conversation: {
        label: "Instructions",
        render: ErrorBoundary.wrap(InstructionsMenu)
      }
    },
    _getPrompt() {
      const { conversationId } = ChatPageStore.useChatPageStore.getState();
      if (!conversationId)
        return;
      const presetId = getAssignments()[conversationId];
      if (!presetId)
        return;
      const preset = getPresets().find((p) => p.id === presetId);
      return preset?.prompt?.trim() || undefined;
    },
    patches: [
      {
        find: ["customInstructions:e.customInstructions,customPersonality:e.customPersonality"],
        all: true,
        replacement: {
          match: /customInstructions:(\i)\.customInstructions/g,
          replace: "customInstructions:$1.customInstructions||$self._getPrompt()"
        }
      }
    ]
  });

  // src/plugins/widerChat/index.ts
  var STYLE_NAME8 = "widerChat";
  var settings25 = definePluginSettings({
    width: {
      type: 1 /* NUMBER */,
      description: "Maximum chat width in rem.",
      default: 64
    }
  });
  function applyWidth() {
    const w = settings25.store.width;
    registerStyle(STYLE_NAME8, `.breakout{--content-max-width:${w}rem!important}` + `.max-w-breakout{max-width:${w}rem!important}` + '.max-w-breakout [class*="w-4/5"]{width:100%!important}');
  }
  var widerChat_default = definePlugin({
    name: "WiderChat",
    icon: UnfoldHorizontalIcon,
    description: "Adjustable chat width for big monitors.",
    authors: [Devs.Prism],
    tags: ["chat", "ui"],
    settings: settings25,
    start: applyWidth,
    onSettingsChange: applyWidth,
    stop() {
      unregisterStyle(STYLE_NAME8);
    }
  });

  // virtual:~plugins
  fixChrome_default.chrome = true;
  fixChrome_default.hidden = !window.chrome;
  var __plugins_default = { [fixChrome_default.name]: fixChrome_default, [settings_default.name]: settings_default, [noTelemetry_default.name]: noTelemetry_default, [chatBarButtons_default.name]: chatBarButtons_default, [contextMenu_default.name]: contextMenu_default, [inputHistory_default.name]: inputHistory_default, [autoCollapse_default.name]: autoCollapse_default, [responseNotification_default.name]: responseNotification_default, [betterImagine_default.name]: betterImagine_default, [noShareLink_default.name]: noShareLink_default, [themedScrollbar_default.name]: themedScrollbar_default, [betterFiles_default.name]: betterFiles_default, [noSidebarIdentity_default.name]: noSidebarIdentity_default, [betterSidebar_default.name]: betterSidebar_default, [settingsFlyout_default.name]: settingsFlyout_default, [composerOpacity_default.name]: composerOpacity_default, [usageDisplay_default.name]: usageDisplay_default, [pluginsFlyout_default.name]: pluginsFlyout_default, [cleaner_default.name]: cleaner_default, [cloneChats_default.name]: cloneChats_default, [betterLinks_default.name]: betterLinks_default, [compactModeSelect_default.name]: compactModeSelect_default, [autoRetry_default.name]: autoRetry_default, [recentTopics_default.name]: recentTopics_default, [chatStateFavicons_default.name]: chatStateFavicons_default, [exportChat_default.name]: exportChat_default, [placeholder_default.name]: placeholder_default, [experiments_default.name]: experiments_default, [messageTimestamps_default.name]: messageTimestamps_default, [chatListStatus_default.name]: chatListStatus_default, [starry_default.name]: starry_default, [noGrokBot_default.name]: noGrokBot_default, [downloadTTS_default.name]: downloadTTS_default, [noDictation_default.name]: noDictation_default, [consoleJanitor_default.name]: consoleJanitor_default, [oneko_default.name]: oneko_default, [streamerMode_default.name]: streamerMode_default, [incognito_default.name]: incognito_default, [customInstructions_default.name]: customInstructions_default, [widerChat_default.name]: widerChat_default };
  // void-css:/tmp/Void/src/api/Notices.css
  registerStyle("Notices", `.void-notice-root {
    contain: content;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    white-space: nowrap;
}

.void-notice-icon {
    flex-shrink: 0;
    display: flex;
    color: hsl(var(--fg-secondary));
}

.void-notice-icon-info {
    color: hsl(var(--fg-secondary));
}

.void-notice-icon-success {
    color: hsl(var(--fg-primary));
}

.void-notice-icon-warning {
    color: hsl(var(--fg-warning));
}

.void-notice-icon-error {
    color: hsl(var(--fg-danger));
}

.void-notice-message {
    flex: 1;
    min-width: 0;
    color: hsl(var(--fg-primary));
}

.void-notice-close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    cursor: pointer;
    color: hsl(var(--fg-secondary));
    background: none;
    border: none;
    opacity: 0.6;
    transition: opacity 0.15s ease;
}

.void-notice-close:hover,
.void-notice-close:focus-visible {
    opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
    .void-notice-close { transition: none; }
}
`);

  // src/api/Notices.tsx
  var NoticeType;
  ((NoticeType2) => {
    NoticeType2["INFO"] = "info";
    NoticeType2["WARNING"] = "warning";
    NoticeType2["ERROR"] = "error";
    NoticeType2["SUCCESS"] = "success";
  })(NoticeType ||= {});
  var cl26 = classNameFactory("void-notice-");
  var ICONS = {
    ["info" /* INFO */]: () => /* @__PURE__ */ React.createElement(CircleAlertIcon, {
      size: 18
    }),
    ["warning" /* WARNING */]: () => /* @__PURE__ */ React.createElement(TriangleAlert, {
      size: 18
    }),
    ["error" /* ERROR */]: () => /* @__PURE__ */ React.createElement(CircleXIcon, {
      size: 18
    }),
    ["success" /* SUCCESS */]: () => /* @__PURE__ */ React.createElement(CircleCheckIcon, {
      size: 18
    })
  };
  var activeNoticeId = null;
  function Notice({ message, type, action, onClose }) {
    return /* @__PURE__ */ React.createElement("div", {
      className: cl26("root")
    }, /* @__PURE__ */ React.createElement("span", {
      className: cl26("icon")
    }, ICONS[type ?? "info" /* INFO */]()), /* @__PURE__ */ React.createElement("span", {
      className: cl26("message")
    }, message), action && /* @__PURE__ */ React.createElement(Button, {
      variant: "primary",
      size: "sm",
      shape: "pill",
      onClick: action.onClick
    }, action.icon, action.label), /* @__PURE__ */ React.createElement(Button, {
      variant: "tertiary",
      size: "sm",
      shape: "square",
      className: cl26("close"),
      onClick: onClose
    }, /* @__PURE__ */ React.createElement(Cross2Icon, {
      size: 16
    })));
  }
  function showNotice(options) {
    closeNotice();
    const { toast } = Toaster;
    if (!toast)
      return -1;
    activeNoticeId = toast.custom((id) => /* @__PURE__ */ React.createElement(Notice, {
      ...options,
      onClose: () => {
        toast.dismiss(id);
        activeNoticeId = null;
      }
    }), { duration: options.duration ?? Infinity });
    return activeNoticeId;
  }
  function closeNotice() {
    if (activeNoticeId != null) {
      Toaster.toast?.dismiss(activeNoticeId);
      activeNoticeId = null;
    }
  }
  // src/turbopack/common/index.ts
  var exports_common = {};
  __export(exports_common, {
    Accordion: () => Accordion,
    AccordionContent: () => AccordionContent,
    AccordionItem: () => AccordionItem,
    AccordionTrigger: () => AccordionTrigger,
    AlertDialog: () => AlertDialog,
    AlertDialogAction: () => AlertDialogAction,
    AlertDialogCancel: () => AlertDialogCancel,
    AlertDialogContent: () => AlertDialogContent,
    AlertDialogDescription: () => AlertDialogDescription,
    AlertDialogFooter: () => AlertDialogFooter,
    AlertDialogHeader: () => AlertDialogHeader,
    AlertDialogTitle: () => AlertDialogTitle,
    AlertDialogTrigger: () => AlertDialogTrigger,
    AnimatePresence: () => AnimatePresence,
    ApiClients: () => ApiClients,
    Avatar: () => Avatar,
    Badge: () => Badge,
    Button: () => Button,
    ButtonWithPopover: () => ButtonWithPopover,
    ButtonWithTooltip: () => ButtonWithTooltip,
    ButtonWithTooltipOptimized: () => ButtonWithTooltipOptimized,
    Card: () => Card,
    CardContent: () => CardContent,
    CardHeader: () => CardHeader,
    CardTitle: () => CardTitle,
    ChatPageStore: () => ChatPageStore,
    Checkbox: () => Checkbox,
    ClassNames: () => ClassNames,
    Command: () => Command,
    CommandEmpty: () => CommandEmpty,
    CommandGroup: () => CommandGroup,
    CommandInput: () => CommandInput,
    CommandItem: () => CommandItem,
    CommandList: () => CommandList,
    ConversationStore: () => ConversationStore,
    Dialog: () => Dialog,
    DialogClose: () => DialogClose,
    DialogContent: () => DialogContent,
    DialogDescription: () => DialogDescription,
    DialogFooter: () => DialogFooter,
    DialogHeader: () => DialogHeader,
    DialogOverlay: () => DialogOverlay,
    DialogPortal: () => DialogPortal,
    DialogTitle: () => DialogTitle,
    DialogTrigger: () => DialogTrigger,
    Drawer: () => Drawer,
    DrawerContent: () => DrawerContent,
    DrawerDescription: () => DrawerDescription,
    DrawerFooter: () => DrawerFooter,
    DrawerHeader: () => DrawerHeader,
    DrawerTitle: () => DrawerTitle,
    DrawerTrigger: () => DrawerTrigger,
    DropdownMenu: () => DropdownMenu,
    DropdownMenuCheckboxItem: () => DropdownMenuCheckboxItem,
    DropdownMenuContent: () => DropdownMenuContent,
    DropdownMenuItem: () => DropdownMenuItem,
    DropdownMenuPortal: () => DropdownMenuPortal,
    DropdownMenuRadioGroup: () => DropdownMenuRadioGroup,
    DropdownMenuRadioItem: () => DropdownMenuRadioItem,
    DropdownMenuSeparator: () => DropdownMenuSeparator,
    DropdownMenuSub: () => DropdownMenuSub,
    DropdownMenuSubContent: () => DropdownMenuSubContent,
    DropdownMenuSubTrigger: () => DropdownMenuSubTrigger,
    DropdownMenuTrigger: () => DropdownMenuTrigger,
    FeatureStore: () => FeatureStore,
    FileUtils: () => FileUtils,
    FilesPageStore: () => FilesPageStore,
    Fragment: () => Fragment,
    HoverCard: () => HoverCard,
    HoverCardContent: () => HoverCardContent,
    HoverCardTrigger: () => HoverCardTrigger,
    Input: () => Input,
    Label: () => Label,
    LazyComponent: () => LazyComponent,
    MediaStore: () => MediaStore,
    ModesStore: () => ModesStore,
    MotionDiv: () => MotionDiv,
    Popover: () => Popover,
    PopoverArrow: () => PopoverArrow,
    PopoverContent: () => PopoverContent,
    PopoverTrigger: () => PopoverTrigger,
    Portal: () => Portal,
    React: () => React,
    ResponseStore: () => ResponseStore,
    ResponsiveDialog: () => ResponsiveDialog,
    RoutingStore: () => RoutingStore,
    Select: () => Select,
    SelectContent: () => SelectContent,
    SelectItem: () => SelectItem,
    SelectTrigger: () => SelectTrigger,
    SelectValue: () => SelectValue,
    Separator: () => Separator,
    SessionStore: () => SessionStore,
    SettingsDescription: () => SettingsDescription,
    SettingsDialogStore: () => SettingsDialogStore,
    SettingsRow: () => SettingsRow,
    SettingsStore: () => SettingsStore,
    SettingsTitle: () => SettingsTitle,
    SidebarComponents: () => SidebarComponents,
    Skeleton: () => Skeleton,
    Slider: () => Slider,
    Spinner: () => Spinner,
    SubscriptionsStore: () => SubscriptionsStore,
    Switch: () => Switch,
    Table: () => Table,
    TableBody: () => TableBody,
    TableCell: () => TableCell,
    TableHead: () => TableHead,
    TableHeader: () => TableHeader,
    TableRow: () => TableRow,
    Tabs: () => Tabs,
    TabsContent: () => TabsContent,
    TabsList: () => TabsList,
    TabsTrigger: () => TabsTrigger,
    TextToSpeechStore: () => TextToSpeechStore,
    Textarea: () => Textarea,
    Toaster: () => Toaster,
    ToggleGroup: () => ToggleGroup,
    ToggleGroupItem: () => ToggleGroupItem,
    Tooltip: () => Tooltip,
    TooltipContent: () => TooltipContent,
    TooltipProvider: () => TooltipProvider,
    TooltipTrigger: () => TooltipTrigger,
    createElement: () => createElement,
    onceReady: () => onceReady,
    useCallback: () => useCallback,
    useContext: () => useContext,
    useDeferredValue: () => useDeferredValue,
    useEffect: () => useEffect,
    useId: () => useId,
    useLayoutEffect: () => useLayoutEffect,
    useMemo: () => useMemo,
    useReducedMotion: () => useReducedMotion,
    useReducer: () => useReducer,
    useRef: () => useRef,
    useState: () => useState,
    useSyncExternalStore: () => useSyncExternalStore,
    useTransition: () => useTransition
  });

  // src/Void.ts
  var logger29 = new Logger("TurbopackPatcher", "#e78284");
  var FALLBACK_MS = 15000;
  var ORPHAN_REPORT_DELAY_MS = 5000;
  function safely(name, fn) {
    try {
      fn();
    } catch (e) {
      logger29.error(`${name} failed:`, e);
    }
  }
  function deferOrphanReport() {
    if (!patches.some((p) => !p.all))
      return;
    setTimeout(() => {
      reportOrphanedPatches();
      reportFailedFinders();
    }, ORPHAN_REPORT_DELAY_MS);
  }
  function waitForModulesStable() {
    const fire = onlyOnce(() => {
      if (cancelWaitFor)
        cancelWaitFor();
      clearTimeout(fallbackTimer);
      rescanRuntimeModules();
      safely("blacklistBadModules", blacklistBadModules);
      safely("initStreamEvents", initStreamEvents);
      safely("_resolveReady", _resolveReady);
      safely("startAllPlugins", () => startAllPlugins("TurbopackReady" /* TurbopackReady */));
      logger29.info(`${getModuleCache().size} modules loaded, ready`);
      safely("retryFailedPlugins", retryFailedPlugins);
      safely("deferOrphanReport", deferOrphanReport);
      safely("checkBuildFingerprint", checkBuildFingerprint);
    });
    const cancelWaitFor = waitFor(filters.byProps("useRoutingStore", "formatUrl"), fire);
    const fallbackTimer = setTimeout(fire, FALLBACK_MS);
  }
  var _initialized = false;
  function init() {
    if (_initialized)
      return;
    _initialized = true;
    for (const plugin of Object.values(__plugins_default)) {
      safely("registerPlugin", () => registerPlugin(plugin));
    }
    safely("initPluginManager", initPluginManager);
    safely("patchTurbopack", patchTurbopack);
    safely("startAllPlugins(Init)", () => startAllPlugins("Init" /* Init */));
    const fireDomContent = () => safely("startAllPlugins(DOMContentLoaded)", () => startAllPlugins("DOMContentLoaded" /* DOMContentLoaded */));
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fireDomContent, { once: true });
    else
      fireDomContent();
    safely("waitForModulesStable", waitForModulesStable);
  }

  // src/index.ts
  var target = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
  if (isGrokPreviewFrame()) {
    bootstrapPreviewFrame();
  } else if (window === window.top && !target.Void) {
    Object.defineProperty(target, "Void", {
      value: exports_Void,
      writable: false,
      configurable: true
    });
    initSettings().then(() => init()).catch((e) => console.error("[Void] Fatal init error:", e));
  }
})();
