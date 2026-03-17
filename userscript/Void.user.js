// ==UserScript==
// @name         Void
// @namespace    https://github.com/imjustprism/Void
// @version      0.3.1
// @description  A modification for grok.com
// @author       Prism & Void Contributors
// @environment  Production
// @match        *://grok.com/*
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @license      GPL-3.0-or-later
// @supportURL   https://discord.gg/4Rx3qUCR5Y
// @downloadURL  https://raw.githubusercontent.com/imjustprism/Void/main/userscript/Void.user.js
// @updateURL    https://raw.githubusercontent.com/imjustprism/Void/main/userscript/Void.user.js
// ==/UserScript==

/**
 * Void v0.3.1 — A modification for grok.com
 * (c) 2026 Prism & Void Contributors
 * Licensed under GPL-3.0-or-later
 * Source: https://github.com/imjustprism/Void
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

  // src/Void.ts
  var exports_Void = {};
  __export(exports_Void, {
    waitFor: () => waitFor,
    syncLazyModules: () => syncLazyModules,
    subscribe: () => subscribe,
    stopPlugin: () => stopPlugin,
    startPlugin: () => startPlugin,
    sleep: () => sleep,
    showToast: () => showToast,
    showNotice: () => showNotice,
    setThemesEnabled: () => setThemesEnabled,
    search: () => search,
    sanitizeFilename: () => sanitizeFilename,
    requireModule: () => requireModule,
    removeTheme: () => removeTheme,
    removeChatBarButton: () => removeChatBarButton,
    registerStyle: () => registerStyle,
    registerPlugin: () => registerPlugin,
    proxyLazy: () => proxyLazy,
    pluralize: () => pluralize,
    plugins: () => plugins,
    patches: () => patches,
    patchStats: () => patchStats,
    patchResults: () => patchResults,
    patchReport: () => patchReport,
    openModal: () => openModal,
    onlyOnce: () => onlyOnce,
    onceReady: () => onceReady,
    onModuleLoad: () => onModuleLoad,
    migrateSettingsToPlugin: () => migrateSettingsToPlugin,
    migratePluginSettings: () => migratePluginSettings,
    migratePluginSetting: () => migratePluginSetting,
    mergeDefaults: () => mergeDefaults,
    matchesPattern: () => matchesPattern,
    matchesAllPatterns: () => matchesAllPatterns,
    mapMangledModuleLazy: () => mapMangledModuleLazy,
    mapMangledModule: () => mapMangledModule,
    mapMangledCssClasses: () => mapMangledCssClasses,
    makeLazy: () => makeLazy,
    isZustandStore: () => isZustandStore,
    isTruthy: () => isTruthy,
    isThemesEnabled: () => isThemesEnabled,
    isPluginEnabled: () => isPluginEnabled,
    isObject: () => isObject,
    isNonNullish: () => isNonNullish,
    isBlacklisted: () => isBlacklisted,
    initSettings: () => initSettings,
    init: () => init,
    importModule: () => importModule,
    humanizeKey: () => humanizeKey,
    getTurbopackHelpers: () => getTurbopackHelpers,
    getThemes: () => getThemes,
    getRuntimeModuleCache: () => getRuntimeModuleCache,
    getRuntimeFactoryRegistry: () => getRuntimeFactoryRegistry,
    getModuleCache: () => getModuleCache,
    getAllStores: () => getAllStores,
    formatDuration: () => formatDuration,
    formatCountdown: () => formatCountdown,
    findStoreLazy: () => findStoreLazy,
    findStore: () => findStore,
    findModuleId: () => findModuleId,
    findModuleFactory: () => findModuleFactory,
    findLazy: () => findLazy,
    findExportedComponentLazy: () => findExportedComponentLazy,
    findExportedComponent: () => findExportedComponent,
    findCssClassesLazy: () => findCssClassesLazy,
    findCssClasses: () => findCssClasses,
    findComponentByCodeLazy: () => findComponentByCodeLazy,
    findComponentByCode: () => findComponentByCode,
    findByPropsLazy: () => findByPropsLazy,
    findByProps: () => findByProps,
    findByDisplayNameLazy: () => findByDisplayNameLazy,
    findByDisplayName: () => findByDisplayName,
    findByCodeLazy: () => findByCodeLazy,
    findByCode: () => findByCode,
    findBulk: () => findBulk,
    findAll: () => findAll,
    find: () => find,
    filters: () => filters,
    fetchExternal: () => fetchExternal,
    extractAndLoadChunksLazy: () => extractAndLoadChunksLazy,
    extractAndLoadChunks: () => extractAndLoadChunks,
    escapeRegExp: () => escapeRegExp,
    errorMessage: () => errorMessage,
    enableTheme: () => enableTheme,
    enableStyle: () => enableStyle,
    dispatch: () => dispatch,
    dismissToast: () => dismissToast,
    disableTheme: () => disableTheme,
    disableStyle: () => disableStyle,
    definePluginSettings: () => definePluginSettings,
    definePlugin: () => definePlugin,
    debounce: () => debounce,
    createExternalStore: () => createExternalStore,
    copyToClipboard: () => copyToClipboard,
    confirm: () => confirm,
    common: () => exports_common,
    closeNotice: () => closeNotice,
    closeModal: () => closeModal,
    closeAllModals: () => closeAllModals,
    classes: () => classes,
    classNameFactory: () => classNameFactory,
    clamp: () => clamp,
    addTheme: () => addTheme,
    addPatch: () => addPatch,
    addChatBarButton: () => addChatBarButton,
    ToastType: () => ToastType,
    StartAt: () => StartAt,
    SettingsStore: () => SettingsStore3,
    Settings: () => Settings,
    PlainSettings: () => PlainSettings,
    OptionType: () => OptionType,
    NoticeType: () => NoticeType,
    Logger: () => Logger,
    DefaultChunkLoadRegex: () => DefaultChunkLoadRegex,
    ChunkPathRegex: () => ChunkPathRegex
  });

  // src/turbopack/common/stores.ts
  var exports_stores = {};
  __export(exports_stores, {
    WorkspaceStore: () => WorkspaceStore,
    WorkspaceConnectorsStore: () => WorkspaceConnectorsStore,
    WorkspaceCollectionsStore: () => WorkspaceCollectionsStore,
    UpsellStore: () => UpsellStore,
    TourGuideStore: () => TourGuideStore,
    TextToSpeechStore: () => TextToSpeechStore,
    TasksStore: () => TasksStore,
    TabsManagerStore: () => TabsManagerStore,
    SuggestionStore: () => SuggestionStore,
    SubscriptionsStore: () => SubscriptionsStore,
    SourcesSelectorStore: () => SourcesSelectorStore,
    ShopStore: () => ShopStore,
    ShareStore: () => ShareStore,
    SettingsStore: () => SettingsStore,
    SettingsDialogStore: () => SettingsDialogStore,
    SessionStore: () => SessionStore,
    RoutingStore: () => RoutingStore,
    ResponseStore: () => ResponseStore,
    ReportStore: () => ReportStore,
    PersonalityStore: () => PersonalityStore,
    NotificationsStore: () => NotificationsStore,
    ModesStore: () => ModesStore,
    ModelsStore: () => ModelsStore,
    MentionMenuStore: () => MentionMenuStore,
    MediaStore: () => MediaStore,
    ImageEditorStore: () => ImageEditorStore,
    HighlightsStore: () => HighlightsStore,
    FilesPageStore: () => FilesPageStore,
    FileStore: () => FileStore,
    FeatureStore: () => FeatureStore,
    DictationStore: () => DictationStore,
    DevModelsStore: () => DevModelsStore,
    ConversationStore: () => ConversationStore,
    CommandMenuStore: () => CommandMenuStore,
    CodePageStore: () => CodePageStore,
    ChatPageStore: () => ChatPageStore,
    AssetStore: () => AssetStore
  });

  // src/utils/lazy.ts
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
  function makeLazy(factory) {
    let cache;
    let resolved = false;
    return () => {
      if (!resolved) {
        cache = factory();
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
  function LazyComponent(name, factory) {
    let cached = null;
    const wrapper = (props) => {
      cached ??= factory();
      if (!cached || !_createElement)
        return null;
      return _createElement(cached, props);
    };
    Object.defineProperty(wrapper, "name", { value: name });
    return new Proxy(wrapper, {
      get(target, prop, receiver) {
        if (prop === "$$voidGetWrapped")
          return () => cached ?? factory();
        cached ??= factory();
        if (cached && prop in cached)
          return cached[prop];
        return Reflect.get(target, prop, receiver);
      }
    });
  }

  // src/utils/Logger.ts
  var isBrowser = typeof window !== "undefined";
  var ANSI = {
    reset: "\x1B[0m",
    bold: "\x1B[1m",
    green: "\x1B[32m",
    red: "\x1B[31m",
    yellow: "\x1B[33m"
  };

  class Logger {
    name;
    color;
    constructor(name, color = "white") {
      this.name = name;
      this.color = color;
    }
    _log(level, args) {
      if (isBrowser) {
        console[level](`%c Void %c %c ${this.name} `, "background: white; color: black; font-weight: bold; border-radius: 5px;", "", `background: ${this.color}; color: black; font-weight: bold; border-radius: 5px;`, ...args);
        return;
      }
      const LEVEL_ANSI = { error: ANSI.red, warn: ANSI.yellow };
      const levelAnsi = LEVEL_ANSI[level] ?? ANSI.green;
      const prefix = `${ANSI.bold}${levelAnsi}[${this.name}]${ANSI.reset}`;
      console[level](prefix, ...args);
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

  // src/utils/text.ts
  function humanizeKey(key, acronyms) {
    const title = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    if (!acronyms)
      return title;
    return Object.entries(acronyms).reduce((s, [from, to]) => s.replace(new RegExp(`\\b${from}\\b`, "g"), to), title);
  }
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function pluralize(count, singular, plural) {
    return `${count} ${count === 1 ? singular : plural ?? singular + "s"}`;
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

  // src/turbopack/types.ts
  var SYM_ORIGINAL = Symbol("Void.originalFactory");
  var SYM_PATCHED = Symbol("Void.patched");
  var SYM_PATCHED_BY = Symbol("Void.patchedBy");
  var SYM_PATCHED_CODE = Symbol("Void.patchedCode");

  // src/turbopack/patchTurbopack.ts
  var logger = new Logger("TurbopackPatcher", "#e78284");
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
    (document.head ?? document.documentElement).appendChild(script);
    script.remove();
    const fn = pageWindow[key];
    delete pageWindow[key];
    if (!fn)
      throw new Error("Factory compilation failed (CSP?)");
    return fn;
  };
  var patches = [];
  var moduleCache = new Map;
  var waitForSubscriptions = new Map;
  var originalPush = null;
  var runtimeModuleCache = null;
  var runtimeFactoryRegistry = null;
  var turbopackHelpers = null;
  var _resolveReady;
  var onceReady = new Promise((r) => _resolveReady = r);
  var patchResults = [];
  var patchStats = {
    applied: 0,
    noEffect: 0,
    errors: 0,
    runtimeFallbacks: 0,
    patchedModules: new Set
  };
  function getModuleCache() {
    return moduleCache;
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
      if (!moduleCache.has(numId))
        notifyModuleLoaded(mod.exports, numId);
    }
    lastSyncRtCount = keys.length;
  }
  function getRuntimeFactoryRegistry() {
    return runtimeFactoryRegistry;
  }
  function getTurbopackHelpers() {
    return turbopackHelpers;
  }
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
    return value instanceof HTMLElement || value instanceof ArrayBuffer || value instanceof MessagePort || value instanceof Map || value instanceof Set || value instanceof WeakMap || value instanceof WeakSet || ArrayBuffer.isView(value) || typeof WebSocket !== "undefined" && value instanceof WebSocket;
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
      for (const [, exports] of moduleCache) {
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
    if (exports == null)
      return;
    if (moduleCache.get(id) === exports)
      return;
    moduleCache.set(id, exports);
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
          logger.error("WaitFor listener error:", e);
        }
      }
    }
    if (moduleLoadListeners.size) {
      for (const cb of moduleLoadListeners) {
        try {
          cb();
        } catch (e) {
          logger.error("Module load listener error:", e);
        }
      }
    }
  }
  function extractAnchor(match) {
    const source = match instanceof RegExp ? match.source : match;
    const literals = source.match(/(?:[A-Za-z_]{3,}(?:\.[A-Za-z_]+)*|"[^"]{2,}"|'[^']{2,}')/g);
    return literals?.[0]?.replace(/^["']|["']$/g, "") ?? null;
  }
  function codeSnippetAround(code, anchor, radius = 60) {
    const idx = code.indexOf(anchor);
    if (idx === -1)
      return "";
    return code.slice(Math.max(0, idx - radius), idx + anchor.length + radius).replace(/\n/g, "\\n");
  }
  function patchFactory(moduleId, factory) {
    if (!patches.length)
      return factory;
    const originalCode = String(factory);
    let code = originalCode;
    const patchedBy = new Set;
    for (let i = 0;i < patches.length; i++) {
      const patch = patches[i];
      if (patch.predicate && !patch.predicate())
        continue;
      const findMatches = Array.isArray(patch.find) ? matchesAllPatterns(originalCode, patch.find) : matchesPattern(originalCode, patch.find);
      if (!findMatches)
        continue;
      const replacements = Array.isArray(patch.replacement) ? patch.replacement : [patch.replacement];
      const previousCode = code;
      let allSucceeded = true;
      let groupApplied = 0;
      let groupNoEffect = 0;
      let groupErrors = 0;
      const result = {
        plugin: patch.plugin,
        find: String(patch.find),
        moduleId,
        replacements: []
      };
      for (const replacement of replacements) {
        if (replacement.predicate && !replacement.predicate())
          continue;
        const lastCode = code;
        try {
          const { match } = replacement;
          const start = performance.now();
          const newCode = code.replace(match, replacement.replace);
          const elapsed = performance.now() - start;
          if (false)
            ;
          if (newCode === code) {
            groupNoEffect++;
            result.replacements.push({ match: String(match), status: "noEffect" });
            if (!patch.noWarn && !replacement.noWarn) {
              const anchor = extractAnchor(match);
              const snippet = anchor ? codeSnippetAround(code, anchor) : "";
              logger.error(`Patch by ${patch.plugin} had no effect: ${String(match)}${snippet ? `
Near: …${snippet}…` : ""}`);
            }
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
          logger.error(`Error in patch by ${patch.plugin} on module ${moduleId}:`, err);
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
          logger.warn(`Group patch by ${patch.plugin} failed, reverting`);
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
    if (patchedBy.size) {
      const plugins = [...patchedBy].join(", ");
      const patchedFactory = compileFactory(code, `// Turbopack Module ${moduleId} - Patched by ${plugins}`, `//# sourceURL=file:///TurbopackModule${moduleId}`);
      patchedFactory[SYM_ORIGINAL] = factory;
      patchedFactory[SYM_PATCHED] = true;
      patchedFactory[SYM_PATCHED_CODE] = code;
      patchedFactory[SYM_PATCHED_BY] = [...patchedBy];
      return patchedFactory;
    }
    return factory;
  }
  function wrapFactory(moduleId, factory) {
    const patched = patchFactory(moduleId, factory);
    const original = patched[SYM_ORIGINAL] ?? factory;
    const wrapped = function(helpers, mod, exports) {
      captureRuntimeState(helpers);
      try {
        patched.call(this, helpers, mod, exports);
      } catch (err) {
        if (patched === factory)
          throw err;
        patchStats.runtimeFallbacks++;
        logger.error(`Patched module ${mod?.id ?? moduleId} errored, using original:`, err);
        try {
          original.call(this, helpers, mod, exports);
        } catch (origErr) {
          logger.error(`Original module ${mod?.id ?? moduleId} also errored:`, origErr);
          throw origErr;
        }
      }
      try {
        const actualId = mod?.id ?? moduleId;
        if (mod?.exports != null)
          notifyModuleLoaded(mod.exports, actualId);
      } catch (e) {
        logger.error(`Module notification error for ${mod?.id ?? moduleId}:`, e);
      }
    };
    wrapped.toString = () => String(factory);
    wrapped[SYM_ORIGINAL] = original;
    if (patched[SYM_PATCHED]) {
      wrapped[SYM_PATCHED] = true;
      wrapped[SYM_PATCHED_BY] = patched[SYM_PATCHED_BY];
      wrapped[SYM_PATCHED_CODE] = patched[SYM_PATCHED_CODE];
    }
    return wrapped;
  }
  function patchChunkEntry(entry) {
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
    return patchedEntry ?? entry;
  }
  function handleChunkPush(...args) {
    for (let i = 0;i < args.length; i++) {
      if (Array.isArray(args[i]))
        args[i] = patchChunkEntry(args[i]);
    }
    return originalPush(...args);
  }
  function patchReport() {
    return {
      stats: { ...patchStats, patchedModules: [...patchStats.patchedModules] },
      results: patchResults,
      orphaned: patches.filter((p) => !p.all).map((p) => ({ plugin: p.plugin, find: String(p.find) }))
    };
  }
  function reportOrphanedPatches() {
    const orphaned = patches.filter((p) => !p.all);
    const warnOrphaned = orphaned.filter((p) => !p.noWarn);
    if (warnOrphaned.length)
      logger.warn(`${warnOrphaned.length} patch(es) found no module:`, warnOrphaned.map((p) => `${p.plugin}: ${String(p.find)}`));
    if (patchStats.noEffect || patchStats.errors) {
      for (const result of patchResults) {
        for (const rep of result.replacements) {
          if (rep.status === "noEffect")
            logger.error(`[no effect] ${result.plugin} on ${result.moduleId}: ${rep.match}`);
          else if (rep.status === "error")
            logger.error(`[error] ${result.plugin} on ${result.moduleId}: ${rep.match}`);
        }
      }
    }
    if (false) {}
    logger.info(`Patches: ${patchStats.applied} applied, ${patchStats.noEffect} no-effect, ${patchStats.errors} errors, ${patchStats.runtimeFallbacks} fallbacks, ${orphaned.length} orphaned`);
  }
  function scanCache(cache) {
    let count = 0;
    for (const id in cache) {
      const mod = cache[id];
      if (mod?.exports == null)
        continue;
      const numId = Number(id);
      if (moduleCache.get(numId) !== mod.exports) {
        notifyModuleLoaded(mod.exports, numId);
        count++;
      }
    }
    return count;
  }
  function scanExistingModules(cache) {
    const count = scanCache(cache);
    if (false)
      ;
  }
  function rescanRuntimeModules() {
    if (!runtimeModuleCache)
      return;
    const count = scanCache(runtimeModuleCache);
    if (count > 0)
      logger.info(`Rescan found ${count} new/updated modules`);
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
    captured?.delete(FACTORY_PROBE_ID);
    return captured;
  }
  function captureRuntimeState(helpers) {
    if (!turbopackHelpers)
      turbopackHelpers = helpers;
    if (!runtimeModuleCache && helpers.c) {
      runtimeModuleCache = helpers.c;
      scanExistingModules(runtimeModuleCache);
    }
    if (!runtimeFactoryRegistry && helpers.M)
      runtimeFactoryRegistry = helpers.M;
  }
  function captureModuleCache(factoryRegistry) {
    const PROBE_ID = FACTORY_PROBE_ID - 1;
    factoryRegistry.set(PROBE_ID, (helpers) => captureRuntimeState(helpers));
    originalPush(["void-cache-probe", { otherChunks: [], runtimeModuleIds: [PROBE_ID] }]);
    Promise.resolve().then(() => factoryRegistry.delete(PROBE_ID));
  }
  function wrapExistingFactories() {
    runtimeFactoryRegistry = captureFactoryRegistry();
    if (runtimeFactoryRegistry) {
      const wrapped = new Map;
      for (const [id, factory] of runtimeFactoryRegistry) {
        const existing = wrapped.get(factory);
        if (existing) {
          runtimeFactoryRegistry.set(id, existing);
        } else {
          const w = wrapFactory(id, factory);
          wrapped.set(factory, w);
          runtimeFactoryRegistry.set(id, w);
        }
      }
    }
    if (!runtimeModuleCache && runtimeFactoryRegistry) {
      captureModuleCache(runtimeFactoryRegistry);
    }
  }
  function patchTurbopack() {
    const existingTp = pageWindow.TURBOPACK;
    if (existingTp && !Array.isArray(existingTp) && typeof existingTp.push === "function") {
      originalPush = existingTp.push.bind(existingTp);
      existingTp.push = (...args) => handleChunkPush(...args);
      wrapExistingFactories();
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
          originalPush = tp.push.bind(tp);
          tp.push = (...args) => handleChunkPush(...args);
          currentTurbopack = tp;
          for (const chunk of queuedChunks) {
            try {
              handleChunkPush(chunk);
            } catch (e) {
              logger.error("Failed to process queued chunk:", e);
            }
          }
          queuedChunks.length = 0;
          wrapExistingFactories();
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
  var logger2 = new Logger("TurbopackFinder", "#a6d189");
  var fnSourceCache = new WeakMap;
  var zustandStoreCache = new Map;
  function getFnSource(fn) {
    let src = fnSourceCache.get(fn);
    if (src === undefined) {
      src = String(fn);
      fnSourceCache.set(fn, src);
    }
    return src;
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
  function searchCache(filter, collectAll = false, topLevelOnly = false) {
    return withLazySync(() => scanModuleCache(filter, collectAll, topLevelOnly), (result) => collectAll ? !result.length : !result);
  }
  function scanModuleCache(filter, collectAll, topLevelOnly) {
    const results = [];
    const seen = collectAll ? new Set : null;
    const cache = getModuleCache();
    for (const [, exports] of cache) {
      if (exports == null || isBlacklisted(exports))
        continue;
      try {
        if (filter(exports)) {
          if (!collectAll)
            return exports;
          if (!seen.has(exports)) {
            seen.add(exports);
            results.push(exports);
          }
          continue;
        }
      } catch {}
      if (!topLevelOnly && typeof exports === "object") {
        for (const key in exports) {
          try {
            const nested = exports[key];
            if (nested == null || isBlacklisted(nested))
              continue;
            if (filter(nested)) {
              if (!collectAll)
                return nested;
              if (!seen.has(nested)) {
                seen.add(nested);
                results.push(nested);
              }
            }
          } catch {}
        }
      }
    }
    return collectAll ? results : null;
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
    return proxyLazy(() => searchCache(filter));
  }
  function findByProps(...props) {
    return find(filters.byProps(...props));
  }
  function findByPropsLazy(...props) {
    return proxyLazy(() => findByProps(...props));
  }
  function findByCode(...code) {
    return find(filters.byCode(...code));
  }
  function findByCodeLazy(...code) {
    return proxyLazy(() => findByCode(...code));
  }
  function findByDisplayName(name) {
    return find(filters.byDisplayName(name));
  }
  function findByDisplayNameLazy(name) {
    return proxyLazy(() => findByDisplayName(name));
  }
  function findComponentByCode(...code) {
    return find(filters.componentByCode(...code));
  }
  function findComponentByCodeLazy(...code) {
    return LazyComponent("findComponentByCode", () => findComponentByCode(...code));
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
    return LazyComponent(props[0], () => findExportedComponent(...props));
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
    silenceWarns(() => {
      collectStores();
      const prevSize = getModuleCache().size;
      syncLazyModules();
      if (getModuleCache().size !== prevSize)
        collectStores();
    });
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
    return proxyLazy(() => findStore(name));
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
    return proxyLazy(() => findCssClasses(...classes));
  }
  function mapMangledCssClasses(mod, classes) {
    const result = {};
    for (const name of classes) {
      const regex = new RegExp(`(?:\\b|_)${escapeRegExp(name)}(?:\\b|_)`);
      let found = false;
      for (const key in mod) {
        if (typeof mod[key] === "string" && regex.test(mod[key])) {
          result[name] = mod[key];
          found = true;
          break;
        }
      }
      if (!found)
        logger2.warn(`mapMangledCssClasses: class "${name}" not found in module`);
    }
    return result;
  }
  function findBulk(...filterFns) {
    const { length } = filterFns;
    if (length < 2) {
      logger2.warn("findBulk called with fewer than 2 filters, use find instead.");
      return length === 1 ? [find(filterFns[0])] : [];
    }
    const scan = () => {
      const activeFilters = [...filterFns];
      const results = new Array(length).fill(null);
      let found = 0;
      const cache = getModuleCache();
      outer:
        for (const [, exports] of cache) {
          if (exports == null || isBlacklisted(exports))
            continue;
          for (let j = 0;j < length; j++) {
            const filter = activeFilters[j];
            if (!filter)
              continue;
            try {
              if (filter(exports)) {
                results[j] = exports;
                activeFilters[j] = undefined;
                if (++found === length)
                  break outer;
              }
            } catch {}
          }
          if (typeof exports === "object") {
            for (const key in exports) {
              try {
                const nested = exports[key];
                if (nested == null || isBlacklisted(nested))
                  continue;
                for (let j = 0;j < length; j++) {
                  const filter = activeFilters[j];
                  if (!filter)
                    continue;
                  if (filter(nested)) {
                    results[j] = nested;
                    activeFilters[j] = undefined;
                    if (++found === length)
                      break outer;
                    break;
                  }
                }
              } catch {}
            }
          }
        }
      return { results, found };
    };
    return silenceWarns(() => {
      let { results, found } = scan();
      if (found < length) {
        const prevSize = getModuleCache().size;
        syncLazyModules();
        if (getModuleCache().size > prevSize)
          ({ results, found } = scan());
      }
      if (found !== length)
        logger2.warn(`findBulk: got ${length} filters but only found ${found} modules.`);
      return results;
    });
  }
  function findModuleFactory(...code) {
    const registry = getRuntimeFactoryRegistry();
    if (!registry)
      return null;
    for (const [id, factory] of registry) {
      if (matchesAllPatterns(getFnSource(factory), code))
        return [id, factory];
    }
    return null;
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
    return proxyLazy(() => mapMangledModule(code, mappers));
  }
  var IDENT = "[A-Za-z_$][\\w$]*";
  var DefaultChunkLoadRegex = new RegExp(`Promise\\.all\\(\\[([^\\]]+)\\]\\.map\\(${IDENT}=>${IDENT}\\.l\\(${IDENT}\\)\\)\\)\\.then\\(\\(\\)=>${IDENT}\\((\\d+)\\)\\)`);
  var ChunkPathRegex = /"(static\/chunks\/[^"]+)"/g;
  async function extractAndLoadChunks(code, matcher = DefaultChunkLoadRegex) {
    const factory = findModuleFactory(...code);
    if (!factory) {
      logger2.warn("extractAndLoadChunks: no module factory found for:", code);
      return false;
    }
    const match = getFnSource(factory[1]).match(matcher);
    if (!match) {
      logger2.warn("extractAndLoadChunks: no chunk loading pattern found in factory for:", code);
      return false;
    }
    const [, rawChunkPaths, entryPointId] = match;
    if (entryPointId == null) {
      logger2.warn("extractAndLoadChunks: matcher did not capture entry point ID for:", code);
      return false;
    }
    const helpers = getTurbopackHelpers();
    if (!helpers) {
      logger2.warn("extractAndLoadChunks: Turbopack helpers not available.");
      return false;
    }
    if (rawChunkPaths) {
      const chunkPaths = Array.from(rawChunkPaths.matchAll(ChunkPathRegex), (m) => m[1]);
      if (chunkPaths.length) {
        try {
          await Promise.all(chunkPaths.map((path) => helpers.l(path)));
        } catch (e) {
          logger2.warn("extractAndLoadChunks: chunk loading failed:", e);
          return false;
        }
      }
    }
    const entryPoint = Number(entryPointId);
    try {
      requireModule(entryPoint);
    } catch (e) {
      logger2.warn("extractAndLoadChunks: entry point module failed:", e);
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
    const registry = getRuntimeFactoryRegistry();
    if (!registry)
      return results;
    for (const [id, factory] of registry) {
      if (matchesAllPatterns(getFnSource(factory), code))
        results[id] = factory;
    }
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
    } catch {
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
      if (isBlacklisted(exports))
        return null;
      try {
        if (filter(exports))
          return exports;
        if (typeof exports === "object" && exports !== null) {
          for (const key in exports) {
            try {
              const nested = exports[key];
              if (nested != null && !isBlacklisted(nested) && filter(nested))
                return nested;
            } catch {}
          }
        }
      } catch {}
      return null;
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
      try {
        if (lastMatch)
          callback(lastMatch, id);
        lastMatch = null;
      } catch (e) {
        logger2.error("waitFor callback error:", e);
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
        if (!searchCache(filter)) {
          logger2.warn(`waitFor timed out after ${timeout}ms:`, filter);
          cancel();
        }
      }, timeout);
    }
    return cancel;
  }

  // src/turbopack/common/stores.ts
  var AssetStore = findByPropsLazy("useAssetStore");
  var ChatPageStore = findByPropsLazy("useChatPageStore", "getLatestThreadMessageId");
  var CodePageStore = findByPropsLazy("useCodePageStore");
  var CommandMenuStore = findByPropsLazy("useCommandMenuStore", "createSelection");
  var ConversationStore = findByPropsLazy("useConversationStore", "createOptimisticConversation");
  var DevModelsStore = findByPropsLazy("useDevModelsStore", "DRAFT_MODEL_ID");
  var DictationStore = findByPropsLazy("useDictationStore");
  var FeatureStore = findByPropsLazy("useFeatureStore");
  var FilesPageStore = findByPropsLazy("useFilesPageStore", "useAssetsList");
  var FileStore = findByPropsLazy("useFileStore");
  var HighlightsStore = findByPropsLazy("useHighlightsStore");
  var ImageEditorStore = findByPropsLazy("useImageEditorStore");
  var MediaStore = findByPropsLazy("useMediaStore", "useImagineModeStore");
  var MentionMenuStore = findByPropsLazy("useMentionMenuStore");
  var ModelsStore = findByPropsLazy("useModelsStore");
  var ModesStore = findByPropsLazy("useModesStore");
  var NotificationsStore = findByPropsLazy("useNotificationsStore", "useNotificationsStoreInit");
  var PersonalityStore = findByPropsLazy("usePersonalityStore", "DEFAULT_CUSTOM_PERSONALITY");
  var ReportStore = findByPropsLazy("useReportStore");
  var ResponseStore = findByPropsLazy("useResponseStore", "createOptimisticResponse");
  var RoutingStore = findByPropsLazy("useRoutingStore", "formatUrl");
  var SessionStore = findByPropsLazy("useSession", "SessionStoreProvider");
  var SettingsDialogStore = findByPropsLazy("useSettingsDialogStore");
  var SettingsStore = findByPropsLazy("useSettingsStore", "TOOL_NAMES");
  var ShareStore = findByPropsLazy("useShareStore");
  var ShopStore = findByPropsLazy("useShopStore");
  var SourcesSelectorStore = findByPropsLazy("useSourcesSelectorStore");
  var SubscriptionsStore = findByPropsLazy("useSubscriptionsStore");
  var SuggestionStore = findByPropsLazy("useSuggestionStore", "useSuggestionStoreInit");
  var TabsManagerStore = findByPropsLazy("useTabsManagerStore");
  var TasksStore = findByPropsLazy("useTasksStore");
  var TextToSpeechStore = findByPropsLazy("useTextToSpeechStore");
  var TourGuideStore = findByPropsLazy("useTourGuideStore", "useTourGuideTooltip");
  var UpsellStore = findByPropsLazy("useUpsellStore", "useShouldShowUpgradeButton");
  var WorkspaceCollectionsStore = findByPropsLazy("useWorkspaceCollectionsStore", "useWorkspaceActiveCollectionIds");
  var WorkspaceConnectorsStore = findByPropsLazy("useWorkspaceConnectorsStore", "useWorkspaceActiveConnectorIds");
  var WorkspaceStore = findByPropsLazy("useWorkspaceStore", "useWorkspacesList");

  // src/utils/css.ts
  var logger3 = new Logger("Styles", "#a6d189");
  var styleRegistry = new Map;
  var activeStyles = new Map;
  var container = null;
  var pendingStyles = [];
  function getContainer() {
    if (container)
      return container;
    if (!document.head)
      return null;
    container = document.createElement("void-styles");
    document.head.appendChild(container);
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
      logger3.warn(`Style "${name}" not registered.`);
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
  var classNameFactory = (prefix = "") => (...args) => {
    const classNames = new Set;
    for (const arg of args) {
      if (typeof arg === "string")
        classNames.add(arg);
      else if (Array.isArray(arg))
        arg.forEach((name) => classNames.add(name));
      else if (arg && typeof arg === "object")
        Object.entries(arg).forEach(([name, value]) => value && classNames.add(name));
    }
    return Array.from(classNames, (name) => prefix + name).join(" ");
  };
  function classes(...names) {
    return names.filter(Boolean).join(" ");
  }

  // src/utils/patches.ts
  var iToken = "(?:[A-Za-z_$][\\w$]*)";
  function canonicalizeMatch(match) {
    const isString = typeof match === "string";
    let canonSource = isString ? match : match.source;
    canonSource = canonSource.replaceAll(/#{i18n::([^}]+)}/g, (_, key) => isString ? `"${key}"` : `"${key.replaceAll(".", "\\.")}"`);
    if (!isString) {
      canonSource = canonSource.replaceAll(/(\\*)\\i/g, (m, leadingEscapes) => leadingEscapes.length % 2 === 0 ? `${leadingEscapes}${iToken}` : m.slice(1));
      canonSource = canonSource.replaceAll(/\\e\{(\w+)\}/g, (_, name) => `["']${name}["'],\\(\\)=>${iToken}`);
    }
    if (canonSource === (isString ? match : match.source))
      return match;
    if (isString)
      return canonSource;
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
    if (Array.isArray(patch.find)) {
      patch.find = patch.find.map((f) => canonicalizeMatch(f));
    } else {
      patch.find = canonicalizeMatch(patch.find);
    }
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

  // void-css:D:/Projects/Void/src/components/ChatBarButton.css
  registerStyle("ChatBarButton", `.void-chatbar-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.void-chatbar-wrapper:focus,
.void-chatbar-wrapper:focus-visible {
    outline: none;
}

.void-chatbar-wrapper:focus-visible {
    box-shadow: 0 0 0 1px hsl(var(--ring));
}

.void-chatbar-button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 2.5rem;
    border-radius: 9999px;
    box-shadow: inset 0 0 0 1px oklch(99.24% 0 none / 8%);
    color: hsl(var(--fg-primary));
    transition: background-color 0.15s ease-out;
}

.void-chatbar-button:hover {
    background-color: hsl(var(--surface-l3));
}

.void-chatbar-button-icon-only {
    aspect-ratio: 1;
    gap: 0.125rem;
}

.void-chatbar-button-with-text {
    padding: 0 0.625rem;
    gap: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
}

.void-chatbar-motion {
    display: flex;
    align-items: center;
    overflow: hidden;
    white-space: nowrap;
}
`);

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
  var ReactDOM = findByPropsLazy("createPortal", "flushSync");

  // src/turbopack/common/components.ts
  function createModuleLazy(...filterProps) {
    let mod = null;
    waitFor(filters.byProps(...filterProps), (m) => {
      mod = m;
    });
    return (name) => LazyComponent(name, () => mod?.[name] ?? findExportedComponent(name));
  }
  var buttonLazy = createModuleLazy("Button", "ButtonWithTooltipOptimized");
  var Button = buttonLazy("Button");
  var ButtonWithTooltip = buttonLazy("ButtonWithTooltip");
  var Card = LazyComponent("Card", () => findExportedComponent("Card"));
  var dialogLazy = createModuleLazy("Dialog", "DialogContent", "DialogHeader");
  var Dialog = dialogLazy("Dialog");
  var DialogContent = dialogLazy("DialogContent");
  var DialogHeader = dialogLazy("DialogHeader");
  var DialogTitle = dialogLazy("DialogTitle");
  var DialogDescription = dialogLazy("DialogDescription");
  var DialogFooter = dialogLazy("DialogFooter");
  var DialogClose = dialogLazy("DialogClose");
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
  var Input = LazyComponent("Input", () => findExportedComponent("Input"));
  var MotionDiv = LazyComponent("MotionDiv", () => findByProps("motion")?.motion?.div);
  var Select = LazyComponent("Select", () => findExportedComponent("Select"));
  var SelectTrigger = LazyComponent("SelectTrigger", () => findExportedComponent("SelectTrigger"));
  var SelectContent = LazyComponent("SelectContent", () => findExportedComponent("SelectContent"));
  var SelectItem = LazyComponent("SelectItem", () => findExportedComponent("SelectItem"));
  var SelectValue = LazyComponent("SelectValue", () => findExportedComponent("SelectValue"));
  var Separator = LazyComponent("Separator", () => findExportedComponent("Separator"));
  var Skeleton = LazyComponent("Skeleton", () => findExportedComponent("Skeleton"));
  var Slider = LazyComponent("Slider", () => findExportedComponent("Slider"));
  var SettingsRow = LazyComponent("SettingsRow", () => findExportedComponent("SettingsRow"));
  var SettingsTitle = LazyComponent("SettingsTitle", () => findExportedComponent("SettingsTitle"));
  var SettingsDescription = LazyComponent("SettingsDescription", () => findExportedComponent("SettingsDescription"));
  var Switch = LazyComponent("Switch", () => findExportedComponent("Switch"));
  var Tooltip = LazyComponent("Tooltip", () => findExportedComponent("Tooltip"));
  var TooltipTrigger = LazyComponent("TooltipTrigger", () => findExportedComponent("TooltipTrigger"));
  var TooltipContent = LazyComponent("TooltipContent", () => findExportedComponent("TooltipContent"));
  var Textarea = LazyComponent("Textarea", () => findExportedComponent("Textarea"));
  var Checkbox = LazyComponent("Checkbox", () => findExportedComponent("Checkbox"));
  var Spinner = LazyComponent("Spinner", () => findExportedComponent("Spinner"));
  var Avatar = LazyComponent("Avatar", () => findExportedComponent("Avatar"));
  var popoverLazy = createModuleLazy("Popover", "PopoverContent", "PopoverTrigger");
  var Popover = popoverLazy("Popover");
  var PopoverTrigger = popoverLazy("PopoverTrigger");
  var PopoverContent = popoverLazy("PopoverContent");
  var PopoverArrow = popoverLazy("PopoverArrow");
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
  var ResponsiveDialog = LazyComponent("ResponsiveDialog", () => findExportedComponent("ResponsiveDialog"));
  var SidebarComponents = findByPropsLazy("Sidebar", "SidebarContent", "SidebarProvider");
  var AnimatePresence = LazyComponent("AnimatePresence", () => findExportedComponent("AnimatePresence"));
  // src/turbopack/common/utils.ts
  var ApiClients = findByPropsLazy("chatApi", "modelsApi");
  var Toaster = findByPropsLazy("Toaster", "toast");
  var ClassNames = findByPropsLazy("cn", "middleTruncate");
  var ReasoningModeUtils = findByPropsLazy("reasoningModeToRequestKind", "reasoningModeToDeepsearchPreset");
  var zustandCreate = findByPropsLazy("create", "useStore");
  var i18n = findByPropsLazy("useTranslation");
  var EnvUtils = findByPropsLazy("getEnv", "useEnvironment");
  var AssetUtils = findByPropsLazy("getCachedAssetUrl", "getAssetUrl");
  var DownloadUtils = findByPropsLazy("downloadImage");
  var FileUtils = findByPropsLazy("downloadBlob", "downloadUri");
  var RateLimitUtils = findByPropsLazy("useRateLimits");
  var NextRouter = findByPropsLazy("useRouter", "usePathname");
  var TanStackQuery = findByPropsLazy("useQuery");
  var CopyUtils = findByPropsLazy("copyAndToast");
  var MonacoModule = findByPropsLazy("initMonaco");

  // src/components/Chip.tsx
  var BASE = "inline-flex items-center rounded-full border border-input-border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  var variantClasses = {
    default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
    secondary: "bg-popover border-border-l1 text-fg-secondary-foreground hover:bg-popover/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
    outline: "text-secondary"
  };
  function Chip({ variant = "secondary", className, children, ...props }) {
    return /* @__PURE__ */ React.createElement("div", {
      className: ClassNames.cn(BASE, variantClasses[variant], className),
      ...props
    }, children);
  }
  // void-css:D:/Projects/Void/src/components/ConfirmDialog.css
  registerStyle("ConfirmDialog", `.void-confirm-dialog {
    width: 100%;
    max-width: 28rem;
    padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid var(--border-l1);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}
`);

  // src/components/ConfirmDialog.tsx
  function ConfirmDialog({ open, onOpenChange, title, description, confirmText = "Confirm", cancelText = "Cancel", danger, onConfirm }) {
    return /* @__PURE__ */ React.createElement(Dialog, {
      open,
      onOpenChange
    }, /* @__PURE__ */ React.createElement(DialogContent, {
      className: "void-confirm-dialog"
    }, /* @__PURE__ */ React.createElement(DialogHeader, null, /* @__PURE__ */ React.createElement(DialogTitle, null, title), /* @__PURE__ */ React.createElement(DialogDescription, null, description)), /* @__PURE__ */ React.createElement(DialogFooter, null, /* @__PURE__ */ React.createElement(Button, {
      variant: "secondary",
      size: "md",
      onClick: () => onOpenChange(false)
    }, cancelText), /* @__PURE__ */ React.createElement(Button, {
      variant: danger ? "danger" : "primary",
      size: "md",
      onClick: () => {
        onOpenChange(false);
        onConfirm();
      }
    }, confirmText))));
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
  // void-css:D:/Projects/Void/src/components/ErrorCard.css
  registerStyle("ErrorCard", `.void-error-card-root {
    padding: 1rem;
    border-radius: var(--radius);
    background: hsl(var(--red-800) / 60%);
    border: 1px solid hsl(var(--red-700));
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
    border-radius: calc(var(--radius) / 2);
    background: hsl(var(--black) / 20%);
    font-size: 0.85em;
    white-space: pre-wrap;
    overflow-wrap: break-word;
}
`);

  // src/components/ErrorCard.tsx
  var cl = classNameFactory("void-error-card-");
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
  // src/components/icons/index.tsx
  var svg = (props, ...children) => /* @__PURE__ */ React.createElement("svg", {
    width: props.size ?? "1em",
    height: props.size ?? "1em",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
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
  var TelescopeIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m13.56 11.747 4.332-.924"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m16 21-3.105-6.21"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m6.158 8.633 1.114 4.456"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "m8 21 3.105-6.21"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "12",
    cy: "13",
    r: "2"
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
  var HeartCrackIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M12.409 5.824c-.702.792-1.15 1.496-1.415 2.166l2.153 2.156a.5.5 0 0 1 0 .707l-2.293 2.293a.5.5 0 0 0 0 .707L12 15"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M13.508 20.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5a5.5 5.5 0 0 1 9.591-3.677.6.6 0 0 0 .818.001A5.5 5.5 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5z"
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
  var Cross2Icon = (props = {}) => /* @__PURE__ */ React.createElement("svg", {
    width: props.size ?? "1em",
    height: props.size ?? "1em",
    viewBox: "0 0 15 15",
    fill: "none",
    className: props.className,
    "aria-hidden": "true"
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z",
    fill: "currentColor",
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
  var EllipsisVertical = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "1"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "12",
    cy: "5",
    r: "1"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "12",
    cy: "19",
    r: "1"
  }));
  var GhostFilledIcon = (props = {}) => /* @__PURE__ */ React.createElement("svg", {
    width: props.size ?? "1em",
    height: props.size ?? "1em",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    className: props.className,
    "aria-hidden": "true"
  }, /* @__PURE__ */ React.createElement("path", {
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
  var SquareMousePointerIcon = (props = {}) => svg(props, /* @__PURE__ */ React.createElement("path", {
    d: "M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"
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
    muted: "text-muted-foreground"
  };
  function Text({ size = "sm", weight = "normal", color = "primary", as = "div", className, ...props }) {
    return createElement(as, {
      className: ClassNames.cn(sizeClasses[size], weightClasses[weight], colorClasses[color], className),
      ...props
    });
  }

  // src/components/Paragraph.tsx
  function Paragraph({ color = "secondary", className, children, ...props }) {
    return /* @__PURE__ */ React.createElement("p", {
      className: ClassNames.cn("text-xs text-pretty", colorClasses[color], className),
      ...props
    }, children);
  }
  // src/components/ChatBarButton.tsx
  var cl2 = classNameFactory("void-chatbar-");
  var EXPAND = { width: "auto", opacity: 1 };
  var COLLAPSE = { width: 0, opacity: 0 };
  var TRANSITION = { duration: 0.2, ease: "easeOut" };
  function ChatBarButton({ icon, children, tooltip, onClick, className, iconOnly, "aria-label": ariaLabel }) {
    const label = typeof tooltip === "string" ? tooltip : ariaLabel;
    const reducedMotion = useReducedMotion();
    const hasShownText = useRef(false);
    const showText = !iconOnly && !!children;
    useEffect(() => {
      if (showText)
        hasShownText.current = true;
    }, [showText]);
    return /* @__PURE__ */ React.createElement(ButtonWithTooltip, {
      variant: "none",
      size: "none",
      className: cl2("wrapper"),
      tooltipContent: tooltip,
      tooltipProps: { delayDuration: 600 },
      tooltipContentProps: { side: "top" },
      onClick,
      "aria-label": label
    }, /* @__PURE__ */ React.createElement("div", {
      className: classes(cl2("button"), showText ? cl2("button-with-text") : cl2("button-icon-only"), className)
    }, icon, iconOnly != null ? /* @__PURE__ */ React.createElement(AnimatePresence, null, showText && /* @__PURE__ */ React.createElement(MotionDiv, {
      initial: reducedMotion || !hasShownText.current ? false : COLLAPSE,
      animate: EXPAND,
      exit: COLLAPSE,
      transition: reducedMotion ? { duration: 0 } : TRANSITION,
      className: cl2("motion")
    }, children)) : children));
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
    for (const key in defaults) {
      if (key === "__proto__" || key === "constructor" || key === "prototype")
        continue;
      const value = target[key];
      if (isObject(value)) {
        mergeDefaults(value, defaults[key]);
      } else if (value === undefined) {
        target[key] = defaults[key];
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
    let called = false;
    return (...args) => {
      if (called)
        return result;
      called = true;
      result = fn(...args);
      return result;
    };
  }
  function debounce(fn, ms) {
    let timer;
    const debounced = (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
    debounced.cancel = () => clearTimeout(timer);
    return debounced;
  }
  function fetchExternal(url) {
    if (typeof GM_xmlhttpRequest === "undefined")
      return fetch(url);
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url,
        responseType: "blob",
        onload(resp) {
          const blob = resp.response;
          resolve(new Response(blob, {
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
  var pad = (n) => String(n).padStart(2, "0");
  function formatCountdown(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor(totalSeconds % 3600 / 60);
    const s = totalSeconds % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }
  function formatDuration(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor(totalSeconds % 3600 / 60);
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
  function sanitizeFilename(title, fallback = "file") {
    return title.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "-") || fallback;
  }

  // src/api/Events.ts
  var logger4 = new Logger("Events");
  var listeners = new Map;
  function subscribe(event, handler2) {
    let set = listeners.get(event);
    if (!set) {
      set = new Set;
      listeners.set(event, set);
    }
    set.add(handler2);
    return () => {
      set.delete(handler2);
    };
  }
  function dispatch(event, data) {
    const set = listeners.get(event);
    if (!set?.size)
      return;
    for (const handler2 of [...set]) {
      try {
        handler2(data);
      } catch (e) {
        logger4.error(`Event handler error (${event}):`, e);
      }
    }
  }

  // src/utils/react.ts
  function resolveLazyNode(node) {
    return typeof node === "function" ? node() : node;
  }
  function useExternalStore(store) {
    useSyncExternalStore(store.subscribe, store.getSnapshot);
  }
  function useForceUpdater() {
    return useReducer((x) => x + 1, 0)[1];
  }
  function useEventSubscription(event, handler2) {
    useEffect(() => subscribe(event, handler2), [event, handler2]);
  }
  function useFiltered(list, search2, getKey) {
    return useMemo(() => {
      const q = search2.toLowerCase().trim();
      if (!q)
        return list;
      return list.filter((item) => getKey(item).toLowerCase().includes(q));
    }, [list, search2, getKey]);
  }

  // src/api/ChatBarButtons.tsx
  var buttons = new Map;
  var store = createExternalStore();
  function addChatBarButton(id, def) {
    buttons.set(id, def);
    store.notify();
  }
  function removeChatBarButton(id) {
    buttons.delete(id);
    store.notify();
  }
  function renderEntry(def, iconOnly) {
    if (def.render) {
      const Render = def.render;
      return /* @__PURE__ */ React.createElement(Render, {
        iconOnly
      });
    }
    return /* @__PURE__ */ React.createElement(ChatBarButton, {
      icon: resolveLazyNode(def.icon),
      tooltip: resolveLazyNode(def.tooltip),
      onClick: def.onClick,
      iconOnly
    });
  }
  function VoidChatBarButtons({ iconOnly }) {
    useExternalStore(store);
    if (!buttons.size)
      return null;
    const sorted = [...buttons.entries()].sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0));
    return /* @__PURE__ */ React.createElement(React.Fragment, null, sorted.map(([id, def]) => /* @__PURE__ */ React.createElement(ErrorBoundary, {
      key: id
    }, renderEntry(def, iconOnly))));
  }

  // src/api/ContextMenus.tsx
  var items = new Map;
  var store2 = createExternalStore();
  function getItems(location2) {
    let map = items.get(location2);
    if (!map) {
      map = new Map;
      items.set(location2, map);
    }
    return map;
  }
  function addContextMenuItem(location2, id, def) {
    getItems(location2).set(id, def);
    store2.notify();
  }
  function removeContextMenuItem(location2, id) {
    getItems(location2).delete(id);
    store2.notify();
  }
  function renderEntry2(def, ctx) {
    if (def.render) {
      const Render = def.render;
      return /* @__PURE__ */ React.createElement(Render, {
        ...ctx
      });
    }
    return /* @__PURE__ */ React.createElement(DropdownMenuItem, {
      onSelect: () => def.onSelect?.(ctx)
    }, resolveLazyNode(def.icon), resolveLazyNode(def.label));
  }
  function VoidContextMenuItems({ location: location2, ...ctx }) {
    useExternalStore(store2);
    const map = items.get(location2);
    if (!map?.size)
      return null;
    const sorted = [...map.entries()].sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0));
    return /* @__PURE__ */ React.createElement(React.Fragment, null, sorted.map(([id, def]) => /* @__PURE__ */ React.createElement(ErrorBoundary, {
      key: id,
      fallback: null
    }, renderEntry2(def, ctx))));
  }

  // src/utils/idb.ts
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
    promise.catch(() => {
      dbPromise = null;
    });
    dbPromise = promise;
    return promise;
  }
  async function idbGet(key) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbSet(key, value) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const req = tx.objectStore(STORE_NAME).put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // src/utils/SettingsStore.ts
  var logger5 = new Logger("SettingsStore");
  var STORAGE_KEY = "VoidSettings";
  var SAVE_DEBOUNCE_MS = 100;
  function getOrCreateSet(map, key) {
    let set = map.get(key);
    if (!set) {
      set = new Set;
      map.set(key, set);
    }
    return set;
  }

  class SettingsStore2 {
    globalListeners = new Set;
    pathListeners = new Map;
    prefixListeners = new Map;
    defaultGetters = new Map;
    saveTimer = null;
    constructor(plain) {
      this.plain = plain;
      this.store = this.makeProxy(plain);
      window.addEventListener("beforeunload", () => this.flush());
    }
    flush() {
      if (this.saveTimer) {
        clearTimeout(this.saveTimer);
        this.saveTimer = null;
        this.save();
      }
    }
    setDefaultGetter(prefix, getter) {
      this.defaultGetters.set(prefix, getter);
    }
    makeProxy(target, path = "") {
      return new Proxy(target, {
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
                }
                break;
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
    }
    notifyListeners(path) {
      for (const l of this.globalListeners)
        l(path);
      const listeners2 = this.pathListeners.get(path);
      if (listeners2)
        for (const l of listeners2)
          l(path);
      for (const [prefix, set] of this.prefixListeners) {
        if (path.startsWith(prefix))
          for (const l of set)
            l(path);
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
          GM_setValue(STORAGE_KEY, json);
        } else {
          idbSet(STORAGE_KEY, json).catch((e) => logger5.warn("Failed to save settings to IndexedDB:", e));
        }
      } catch (e) {
        logger5.error("Failed to save settings:", e);
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
    addChangeListener(path, listener) {
      getOrCreateSet(this.pathListeners, path).add(listener);
    }
    removeChangeListener(path, listener) {
      const set = this.pathListeners.get(path);
      if (set) {
        set.delete(listener);
        if (!set.size)
          this.pathListeners.delete(path);
      }
    }
    addPrefixChangeListener(prefix, listener) {
      getOrCreateSet(this.prefixListeners, prefix).add(listener);
    }
    removePrefixChangeListener(prefix, listener) {
      const set = this.prefixListeners.get(prefix);
      if (set) {
        set.delete(listener);
        if (!set.size)
          this.prefixListeners.delete(prefix);
      }
    }
  }

  // src/api/Settings.ts
  var logger6 = new Logger("Settings");
  var STORAGE_KEY2 = "VoidSettings";
  var DefaultSettings = {
    plugins: {},
    notifications: {
      timeout: 5000,
      position: "bottom-right"
    }
  };
  var settings = {};
  mergeDefaults(settings, DefaultSettings);
  var SettingsStore3 = new SettingsStore2(settings);
  var PlainSettings = settings;
  var Settings = SettingsStore3.store;
  async function initSettings() {
    if (typeof GM_getValue === "function") {
      try {
        const raw2 = GM_getValue(STORAGE_KEY2, null);
        if (raw2) {
          const parsed = JSON.parse(raw2);
          if (isObject(parsed))
            Object.assign(settings, parsed);
        }
      } catch (e) {
        logger6.error("Failed to load settings:", e);
      }
      mergeDefaults(settings, DefaultSettings);
      return;
    }
    let raw = null;
    try {
      raw = await idbGet(STORAGE_KEY2);
    } catch (e) {
      logger6.warn("Failed to read IndexedDB:", e);
    }
    if (!raw) {
      raw = migrateFromLocalStorage();
      if (raw)
        idbSet(STORAGE_KEY2, raw).catch((e) => logger6.debug("Failed to persist settings to IndexedDB:", e));
    }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (isObject(parsed))
          Object.assign(settings, parsed);
      } catch (e) {
        logger6.error("Failed to parse settings:", e);
      }
    }
    mergeDefaults(settings, DefaultSettings);
  }
  function migrateFromLocalStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY2);
      if (raw) {
        localStorage.removeItem(STORAGE_KEY2);
        logger6.info("Migrated settings from localStorage to IndexedDB");
        return raw;
      }
    } catch (e) {
      logger6.warn("Failed to read localStorage:", e);
    }
    return null;
  }
  function migratePluginSettings(name, ...oldNames) {
    const { plugins } = SettingsStore3.plain;
    if (name in plugins)
      return;
    for (const oldName of oldNames) {
      if (oldName in plugins) {
        logger6.info(`Migrating settings from old name ${oldName} to ${name}`);
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
    logger6.info(`Migrating setting ${oldKey} -> ${newKey} in ${pluginName}`);
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
      logger6.info(`Migrated settings [${settingKeys.join(", ")}] from ${sourcePlugin} to ${targetPlugin}`);
      SettingsStore3.markAsChanged();
    }
  }
  function getSettingsPluginData() {
    return Settings.plugins.Settings ?? {};
  }
  function updateSettingsPluginData(patch) {
    Settings.plugins.Settings = { ...Settings.plugins.Settings, ...patch };
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
          PlainSettings.plugins[name] = { enabled: false };
        SettingsStore3.setDefaultGetter(`plugins.${name}`, (key) => {
          const setting = def[key];
          return setting ? resolveDefault(setting) : undefined;
        });
      },
      use(keys) {
        const forceUpdate = useForceUpdater();
        useEffect(() => {
          const prefix = `plugins.${_pluginName}`;
          if (keys?.length) {
            const paths = keys.map((k) => `${prefix}.${String(k)}`);
            const listener = (path) => {
              if (paths.some((p) => path.startsWith(p)))
                forceUpdate();
            };
            SettingsStore3.addPrefixChangeListener(prefix, listener);
            return () => SettingsStore3.removePrefixChangeListener(prefix, listener);
          }
          SettingsStore3.addPrefixChangeListener(prefix, forceUpdate);
          return () => SettingsStore3.removePrefixChangeListener(prefix, forceUpdate);
        }, []);
        return definedSettings.store;
      },
      withPrivateSettings() {
        return this;
      }
    };
    return definedSettings;
  }

  // src/api/PluginManager.ts
  var logger7 = new Logger("PluginManager", "#b4befe");
  var plugins = {};
  var pluginUnsubscribers = new Map;
  var initialized = false;
  var storeRegistry = exports_stores;
  function isPluginEnabled(pluginName) {
    const plugin = plugins[pluginName];
    if (!plugin)
      return false;
    if (plugin.required || plugin.isDependency)
      return true;
    return Settings.plugins[pluginName]?.enabled ?? plugin.enabledByDefault ?? false;
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
    const pluginPath = `Void.plugins[${JSON.stringify(pluginName)}]`;
    for (const replacement of patch.replacement) {
      canonicalizeReplacement(replacement, pluginPath);
    }
    patch.replacement = patch.replacement.filter(({ predicate }) => !predicate || predicate());
    patches.push(patch);
  }
  function startDependenciesRecursive(plugin, visiting = new Set) {
    if (!plugin.dependencies)
      return true;
    for (const depName of plugin.dependencies) {
      const dep = plugins[depName];
      if (!dep) {
        logger7.warn(`Missing dependency ${depName} for ${plugin.name}`);
        return false;
      }
      if (dep.started)
        continue;
      if (visiting.has(depName)) {
        logger7.error(`Circular dependency detected: ${plugin.name} -> ${depName}`);
        return false;
      }
      dep.isDependency = true;
      Settings.plugins[depName] = { ...Settings.plugins[depName], enabled: true };
      visiting.add(depName);
      if (!startDependenciesRecursive(dep, visiting))
        return false;
      if (!startPlugin(dep))
        return false;
    }
    return true;
  }
  function resolveStoreHook(storeName) {
    const storeModule = storeRegistry[storeName];
    if (!storeModule)
      return null;
    const hookName = `use${storeName}`;
    const hook = storeModule[hookName];
    if (hook && typeof hook.subscribe === "function")
      return hook;
    for (const key in storeModule) {
      const val = storeModule[key];
      if (val && typeof val.subscribe === "function")
        return val;
    }
    return null;
  }
  function startPlugin(plugin, silent = false) {
    if (plugin.started)
      return true;
    try {
      if (!startDependenciesRecursive(plugin)) {
        logger7.error(`Failed to start dependencies for ${plugin.name}`);
        return false;
      }
      if (plugin.managedStyle)
        enableStyle(plugin.managedStyle);
      if (!plugin.hidden && !silent)
        logger7.info(`Starting plugin ${plugin.name}`);
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
      if (plugin.events) {
        for (const [event, handler2] of Object.entries(plugin.events)) {
          unsubs.push(subscribe(event, handler2));
        }
      }
      if (plugin.storeSubscriptions?.length) {
        for (const sub of plugin.storeSubscriptions) {
          unsubs.push(sub.store.subscribe(sub.callback, sub.selector));
        }
      }
      if (plugin.zustand) {
        for (const [storeName, sub] of Object.entries(plugin.zustand)) {
          const store3 = resolveStoreHook(storeName);
          if (!store3) {
            logger7.warn(`Store "${storeName}" not found for plugin ${plugin.name}`);
            continue;
          }
          const wrappedHandler = (current, prev) => {
            try {
              sub.handler(current, prev);
            } catch (e) {
              logger7.error(`Zustand handler error in ${plugin.name} for ${storeName}:`, e);
            }
          };
          const unsub = sub.selector ? store3.subscribe(sub.selector, wrappedHandler) : store3.subscribe(wrappedHandler);
          unsubs.push(unsub);
        }
      }
      if (plugin.eventListeners) {
        for (const el of plugin.eventListeners) {
          const target = el.target === "window" ? window : document;
          target.addEventListener(el.event, el.handler, el.options);
          unsubs.push(() => target.removeEventListener(el.event, el.handler, el.options));
        }
      }
      if (unsubs.length)
        pluginUnsubscribers.set(plugin.name, unsubs);
      plugin.started = true;
      return true;
    } catch (e) {
      logger7.error(`Failed to start plugin ${plugin.name}:`, e);
      if (plugin.managedStyle)
        disableStyle(plugin.managedStyle);
      removeChatBarButton(plugin.name);
      if (plugin.contextMenuItems) {
        for (const location2 of Object.keys(plugin.contextMenuItems)) {
          removeContextMenuItem(location2, plugin.name);
        }
      }
      const unsubs = pluginUnsubscribers.get(plugin.name);
      if (unsubs) {
        for (const unsub of unsubs)
          unsub();
        pluginUnsubscribers.delete(plugin.name);
      }
      return false;
    }
  }
  function stopPlugin(plugin) {
    if (!plugin.started)
      return true;
    try {
      const unsubs = pluginUnsubscribers.get(plugin.name);
      if (unsubs) {
        for (const unsub of unsubs)
          unsub();
        pluginUnsubscribers.delete(plugin.name);
      }
      removeChatBarButton(plugin.name);
      if (plugin.contextMenuItems) {
        for (const location2 of Object.keys(plugin.contextMenuItems)) {
          removeContextMenuItem(location2, plugin.name);
        }
      }
      if (plugin.managedStyle)
        disableStyle(plugin.managedStyle);
      if (plugin.cleanupSelectors) {
        for (const selector of plugin.cleanupSelectors) {
          document.querySelectorAll(selector).forEach((el) => el.remove());
        }
      }
      plugin.stop?.();
      plugin.started = false;
      return true;
    } catch (e) {
      plugin.started = false;
      logger7.error(`Failed to stop plugin ${plugin.name}:`, e);
      return false;
    }
  }
  function startAllPlugins(target) {
    for (const name in plugins) {
      const plugin = plugins[name];
      if (!isPluginEnabled(name))
        continue;
      if ((plugin.startAt ?? "Init" /* Init */) !== target)
        continue;
      startPlugin(plugin);
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
  function pruneOrphanedPluginSettings() {
    const stored = PlainSettings.plugins;
    let pruned = false;
    for (const name in stored) {
      if (!plugins[name]) {
        logger7.info(`Pruning settings for removed plugin: ${name}`);
        delete stored[name];
        pruned = true;
      }
    }
    if (pruned)
      SettingsStore3.markAsChanged();
  }
  function initPluginManager() {
    if (initialized)
      return;
    initialized = true;
    pruneOrphanedPluginSettings();
    const neededApis = new Set;
    for (const name in plugins) {
      if (!isPluginEnabled(name))
        continue;
      const plugin = plugins[name];
      plugin.dependencies?.forEach((d) => {
        const dep = plugins[d];
        if (!dep) {
          logger7.warn(`Plugin ${name} has unresolved dependency ${d}`);
          return;
        }
        Settings.plugins[d] = { ...Settings.plugins[d], enabled: true };
        dep.isDependency = true;
      });
      if (plugin.chatBarButton)
        neededApis.add("ChatBarButtonAPI");
      if (plugin.contextMenuItems)
        neededApis.add("ContextMenuAPI");
    }
    for (const api of neededApis) {
      const dep = plugins[api];
      if (!dep)
        continue;
      Settings.plugins[api] = { ...Settings.plugins[api], enabled: true };
      dep.isDependency = true;
    }
    for (const name in plugins) {
      if (!isPluginEnabled(name))
        continue;
      const plugin = plugins[name];
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
      if (plugin.patches) {
        for (const patch of plugin.patches)
          addPatch(patch, name);
      }
    }
  }

  // void-css:D:/Projects/Void/src/api/Notices.css
  registerStyle("Notices", `.void-notice-root {
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

.void-notice-close:hover {
    opacity: 1;
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
  var cl3 = classNameFactory("void-notice-");
  var ICONS = {
    ["info" /* INFO */]: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    ["warning" /* WARNING */]: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    ["error" /* ERROR */]: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    ["success" /* SUCCESS */]: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'
  };
  var activeNoticeId = null;
  function Notice({ message, type, action, onClose }) {
    const iconSvg = ICONS[type ?? "info" /* INFO */];
    return /* @__PURE__ */ React.createElement("div", {
      className: cl3("root")
    }, /* @__PURE__ */ React.createElement("span", {
      className: cl3("icon"),
      dangerouslySetInnerHTML: {
        __html: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>`
      }
    }), /* @__PURE__ */ React.createElement("span", {
      className: cl3("message")
    }, message), action && /* @__PURE__ */ React.createElement(Button, {
      variant: "primary",
      size: "md",
      shape: "pill",
      onClick: (e) => {
        e.stopPropagation();
        action.onClick();
      }
    }, action.icon, action.label), /* @__PURE__ */ React.createElement("button", {
      className: cl3("close"),
      onClick: (e) => {
        e.stopPropagation();
        onClose();
      }
    }, /* @__PURE__ */ React.createElement("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /* @__PURE__ */ React.createElement("line", {
      x1: "18",
      y1: "6",
      x2: "6",
      y2: "18"
    }), /* @__PURE__ */ React.createElement("line", {
      x1: "6",
      y1: "6",
      x2: "18",
      y2: "18"
    }))));
  }
  function showNotice(options) {
    closeNotice();
    const { toast } = Toaster;
    activeNoticeId = toast.custom((id) => createElement(Notice, {
      ...options,
      onClose: () => toast.dismiss(id)
    }), { duration: options.duration ?? Infinity });
    return activeNoticeId;
  }
  function closeNotice() {
    if (activeNoticeId != null) {
      Toaster.toast.dismiss(activeNoticeId);
      activeNoticeId = null;
    }
  }

  // src/utils/updateChecker.ts
  var logger8 = new Logger("UpdateChecker", "#85c1dc");
  var UPDATE_URL = "https://greasyfork.org/en/scripts/567871-void";
  function isNewer(remote, local) {
    const r = remote.split(".").map(Number);
    const l = local.split(".").map(Number);
    for (let i = 0;i < Math.max(r.length, l.length); i++) {
      const a = r[i] ?? 0, b = l[i] ?? 0;
      if (a > b)
        return true;
      if (a < b)
        return false;
    }
    return false;
  }
  async function checkForUpdates() {
    try {
      const resp = await fetchExternal(`${"https://raw.githubusercontent.com/imjustprism/Void"}/main/package.json`);
      if (!resp.ok)
        return;
      const { version: latest } = await resp.json();
      if (!latest || !isNewer(latest, "0.3.1")) {
        logger8.info(`Up to date (${"0.3.1"})`);
        return;
      }
      logger8.info(`Update available: ${"0.3.1"} → ${latest}`);
      showNotice({
        message: "Void is outdated, please update to the new version.",
        type: "warning" /* WARNING */,
        action: { label: "Update", onClick: () => window.open(UPDATE_URL, "_blank") }
      });
    } catch (e) {
      logger8.warn("Failed to check for updates", e);
    }
  }

  // src/utils/constants.ts
  var Devs = Object.freeze({
    Prism: "Prism",
    adryd: "adryd"
  });

  // src/plugins/_core/fixChrome.chrome/index.ts
  var fixChrome_default = definePlugin({
    name: "FixChrome",
    description: "Fixes Chromium-specific performance issues like backdrop blur lag.",
    authors: [Devs.Prism],
    required: true,
    patches: [
      {
        find: "bg-overlay backdrop-blur-[2px]",
        all: true,
        replacement: {
          match: /backdrop-blur-\[2px\] /,
          replace: " "
        }
      }
    ]
  });

  // src/plugins/_core/noTelemetry/index.ts
  var noTelemetry_default = definePlugin({
    name: "NoTelemetry",
    description: "Disables all tracking, telemetry, and event logging.",
    authors: [Devs.Prism],
    required: true,
    patches: [
      {
        find: "ingest.us.sentry.io",
        replacement: {
          match: /e\.s\(\["onRouterTransitionStart",\(\)=>\i\],(\d+)\);var/,
          replace: 'e.s(["onRouterTransitionStart",()=>function(){}],$1);return;var'
        }
      },
      {
        find: '"after-init"),(0,',
        replacement: {
          match: /function (\i)\(\)\{if\(Object\.prototype\.hasOwnProperty[\s\S]{0,450}setHasMixpanelInitialized\)\(!0\)\}\}\)\}/,
          replace: "function $1(){}"
        }
      },
      {
        find: "sendBatchLogEvent",
        all: true,
        replacement: [
          {
            match: /"sendBatchLogEvent",\i=>\{\i\(this\.address\+.{0,40},\i\)\}/,
            replace: '"sendBatchLogEvent",()=>{}'
          },
          {
            match: /"sendBatchLogExperimentExposure",\i=>\{\i\(this\.address\+.{0,50},\i\)\}/,
            replace: '"sendBatchLogExperimentExposure",()=>{}'
          },
          {
            match: /"\/api\/log_metric",\i\)/,
            replace: '"/api/log_metric",[])'
          }
        ]
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

  // void-css:D:/Projects/Void/src/plugins/_core/settings/styles.css
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
}
`);

  // src/api/Themes.ts
  var logger9 = new Logger("Themes", "#c6a0f6");
  function themeStyleId(url) {
    let hash = 0;
    for (let i = 0;i < url.length; i++) {
      hash = (hash << 5) - hash + url.charCodeAt(i) | 0;
    }
    return `void-theme-${(hash >>> 0).toString(36)}`;
  }
  function parseThemeMeta(css) {
    const meta = { name: "", author: "", description: "" };
    const header = css.match(/\/\*\*[\s\S]*?\*\//);
    if (!header)
      return meta;
    const nameMatch = header[0].match(/@name\s+(.+)/);
    const authorMatch = header[0].match(/@author\s+(.+)/);
    const descMatch = header[0].match(/@description\s+(.+)/);
    if (nameMatch)
      meta.name = nameMatch[1].trim();
    if (authorMatch)
      meta.author = authorMatch[1].trim();
    if (descMatch)
      meta.description = descMatch[1].trim();
    return meta;
  }
  function getThemes() {
    const s = getSettingsPluginData();
    return Array.isArray(s.themes) ? s.themes : [];
  }
  function isThemesEnabled() {
    return getSettingsPluginData().themesEnabled !== false;
  }
  function setThemesEnabled(enabled) {
    updateSettingsPluginData({ themesEnabled: enabled });
    for (const theme of getThemes()) {
      if (theme.enabled) {
        if (enabled)
          enableStyle(themeStyleId(theme.url));
        else
          disableStyle(themeStyleId(theme.url));
      }
    }
  }
  function validateThemeUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:")
        throw 0;
    } catch {
      throw new Error("Enter a valid URL.");
    }
    if (!/\.css(?:[?#]|$)/i.test(url))
      throw new Error("URL must point to a .css file.");
  }
  async function addTheme(url) {
    validateThemeUrl(url);
    const existing = getThemes();
    if (existing.some((t) => t.url === url)) {
      throw new Error("This theme is already added.");
    }
    const resp = await fetchExternal(url);
    if (!resp.ok)
      throw new Error(`Failed to fetch theme (${resp.status}).`);
    const css = await resp.text();
    if (!css.trim())
      throw new Error("Theme file is empty.");
    const meta = parseThemeMeta(css);
    const theme = {
      url,
      name: meta.name || (url.split("/").pop() ?? url).replace(/\.css$/i, "").replace(/[-_]/g, " "),
      author: meta.author,
      description: meta.description,
      enabled: false
    };
    registerStyle(themeStyleId(url), css);
    disableStyle(themeStyleId(url));
    updateSettingsPluginData({ themes: [...existing, theme] });
    logger9.info(`Added theme "${theme.name}" from ${url}`);
    return theme;
  }
  function removeTheme(url) {
    disableStyle(themeStyleId(url));
    updateSettingsPluginData({ themes: getThemes().filter((t) => t.url !== url) });
  }
  async function enableTheme(url) {
    updateSettingsPluginData({ themes: getThemes().map((t) => t.url === url ? { ...t, enabled: true } : t) });
    if (!isThemesEnabled())
      return;
    const id = themeStyleId(url);
    if (enableStyle(id))
      return;
    const resp = await fetchExternal(url);
    if (!resp.ok) {
      logger9.warn(`Failed to fetch theme CSS (${resp.status}):`, url);
      return;
    }
    const css = await resp.text();
    registerStyle(id, css);
  }
  function disableTheme(url) {
    updateSettingsPluginData({ themes: getThemes().map((t) => t.url === url ? { ...t, enabled: false } : t) });
    disableStyle(themeStyleId(url));
  }
  async function loadSavedThemes() {
    if (!isThemesEnabled())
      return;
    const enabled = getThemes().filter((t) => t.enabled);
    const results = await Promise.allSettled(enabled.map(async (t) => {
      const resp = await fetchExternal(t.url);
      if (!resp.ok)
        throw new Error(`HTTP ${resp.status}`);
      const css = await resp.text();
      registerStyle(themeStyleId(t.url), css);
    }));
    for (let i = 0;i < results.length; i++) {
      const result = results[i];
      if (result.status === "rejected") {
        logger9.warn(`Failed to load theme "${enabled[i].name}":`, result.reason);
      }
    }
  }

  // void-css:D:/Projects/Void/src/components/settings/tabs/CustomCSSTab.css
  registerStyle("CustomCSSTab", `.void-css-root {
    height: 100%;
    min-height: 0;
}

.void-css-header {
    padding: 0 0.75rem;
    flex-shrink: 0;
}

.void-css-wrap {
    flex: 1;
    min-height: 0;
    margin: 0 0.75rem;
    border: 1px solid var(--border-l1);
    background: hsl(var(--surface-l2));
    overflow: auto;
    display: grid;
}

.void-css-highlight,
.void-css-input {
    grid-area: 1 / 1;
    margin: 0;
    padding: 12px;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    tab-size: 4;
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

.void-css-sel { color: hsl(215deg 50% 68%); }
.void-css-prop { color: hsl(195deg 35% 64%); }
.void-css-val { color: hsl(28deg 45% 68%); }
.void-css-str { color: hsl(155deg 30% 64%); }
.void-css-num { color: hsl(265deg 30% 74%); }

.void-css-com {
    color: hsl(var(--fg-tertiary));
    font-style: italic;
}
.void-css-at { color: hsl(335deg 35% 70%); }
.void-css-brace { color: hsl(var(--fg-secondary)); }
.void-css-punct { color: hsl(var(--fg-tertiary)); }
`);

  // src/components/settings/tabs/CustomCSSTab.tsx
  var cl4 = classNameFactory("void-css-");
  var STYLE_ID = "void-custom-css";
  function setCustomCSSEnabled(enabled) {
    updateSettingsPluginData({ customCSSEnabled: enabled });
    if (enabled) {
      const css = getSettingsPluginData().customCSS;
      if (typeof css === "string" && css) {
        registerStyle(STYLE_ID, css);
        enableStyle(STYLE_ID);
      }
    } else {
      disableStyle(STYLE_ID);
    }
  }
  function loadSavedCSS() {
    const s = getSettingsPluginData();
    const saved = s.customCSS;
    if (typeof saved === "string" && saved && s.customCSSEnabled !== false) {
      registerStyle(STYLE_ID, saved);
      return saved;
    }
    return typeof saved === "string" ? saved : "";
  }
  function formatCSS(raw) {
    let out = "";
    let indent = 0;
    const pad2 = () => "    ".repeat(indent);
    const tokens = raw.replace(/\s+/g, " ").trim().split(/(?=[{}:;])|(?<=[{}:;])/g);
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
      } else if (s === ";") {
        out += `;
`;
      } else if (s === ":") {
        out += ": ";
      } else if (indent > 0) {
        out += pad2() + s;
      } else {
        out += s;
      }
    }
    return out.replace(/\n{3,}/g, `

`).trim() + `
`;
  }
  var TOKEN = /\/\*[\s\S]*?\*\/|@[\w-]+|"[^"]*"|'[^']*'|#[\da-fA-F]{3,8}|[\d.]+(?:px|em|rem|%|vh|vw|s|ms|deg|fr|ch)?|[\w-]+|[{}:;,()!]/g;
  function highlight(css) {
    let inBlock = 0;
    let afterColon = false;
    let result = "";
    let lastEnd = 0;
    for (const m of css.matchAll(TOKEN)) {
      if (m.index > lastEnd)
        result += esc(css.slice(lastEnd, m.index));
      lastEnd = m.index + m[0].length;
      const t = m[0];
      if (t.startsWith("/*")) {
        result += span("com", t);
        afterColon = false;
      } else if (t.startsWith("@")) {
        result += span("at", t);
      } else if (t === "{") {
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
      } else if (t === "(" || t === ")" || t === "!") {
        result += span("punct", t);
      } else if (t.startsWith('"') || t.startsWith("'")) {
        result += span("str", t);
      } else if (t.startsWith("#") || /^[\d.]/.test(t)) {
        result += span("num", t);
      } else if (afterColon) {
        result += span("val", t);
      } else if (inBlock > 0) {
        result += span("prop", t);
      } else {
        result += span("sel", t);
      }
    }
    if (lastEnd < css.length)
      result += esc(css.slice(lastEnd));
    return result;
  }
  function span(cls, text) {
    return `<span class="${cl4(cls)}">${esc(text)}</span>`;
  }
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function CustomCSSTab() {
    const highlightRef = useRef(null);
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
    const handlePaste = useCallback((e) => {
      const pasted = e.clipboardData.getData("text/plain");
      if (pasted.includes("{") && !pasted.includes(`
`)) {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const formatted = formatCSS(pasted);
        const next = css.slice(0, start) + formatted + css.slice(end);
        apply(next);
        requestAnimationFrame(() => {
          const pos = start + formatted.length;
          ta.selectionStart = pos;
          ta.selectionEnd = pos;
        });
      }
    }, [css, apply]);
    useEffect(() => {
      if (highlightRef.current)
        highlightRef.current.innerHTML = highlight(css) + `
`;
    }, [css]);
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.75rem",
      className: cl4("root")
    }, /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      justifyContent: "space-between",
      className: cl4("header")
    }, /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0"
    }, /* @__PURE__ */ React.createElement(Text, {
      size: "sm",
      weight: "medium"
    }, "Quick CSS"), /* @__PURE__ */ React.createElement(Paragraph, null, "Custom CSS applied live as you type.")), /* @__PURE__ */ React.createElement(Switch, {
      checked: enabled,
      onCheckedChange: handleToggle
    })), /* @__PURE__ */ React.createElement("div", {
      className: cl4("wrap")
    }, /* @__PURE__ */ React.createElement("pre", {
      ref: highlightRef,
      className: cl4("highlight"),
      "aria-hidden": "true"
    }), /* @__PURE__ */ React.createElement("textarea", {
      className: cl4("input"),
      value: css,
      onChange: (e) => apply(e.target.value),
      onPaste: handlePaste,
      disabled: !enabled,
      spellCheck: false,
      autoComplete: "off",
      autoCorrect: "off",
      autoCapitalize: "off"
    })));
  }

  // void-css:D:/Projects/Void/src/components/settings/tabs/PluginsTab.css
  registerStyle("PluginsTab", `.void-plugins-section {
    padding: 0 0.75rem;
}

.void-plugins-reload-banner {
    margin: 0 0.75rem;
    padding: 0.625rem 0.75rem;
    border-radius: var(--radius);
    background: hsl(var(--yellow-800) / 60%);
    border: 1px solid hsl(var(--yellow-700));
    color: hsl(var(--fg-warning));
}

.void-plugins-reload-text {
    color: inherit;
    flex: 1;
}

.void-plugins-search-input {
    flex: 1;
    min-width: 0;
}

.void-plugins-filter-select {
    width: 7rem;
}

.void-plugins-divider {
    margin: 0 0.75rem;
    width: auto;
}

.void-plugins-empty {
    text-align: center;
    padding: 2rem 0;
}
`);

  // void-css:D:/Projects/Void/src/components/settings/PluginCard.css
  registerStyle("PluginCard", `.void-plugin-card-root {
    padding: 0;
    display: flex;
    flex-direction: column;
    border-radius: 0.375rem;
    border: 1px solid var(--border-l1);
    background: var(--card);
    min-height: 120px;
}

.void-plugin-card-body {
    padding: 0.625rem 0.75rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.void-plugin-card-name {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
}

.void-plugin-card-required-icon,
.void-plugin-card-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: hsl(var(--fg-tertiary));
    flex-shrink: 0;
    line-height: 0;
}

.void-plugin-card-desc {
    font-size: 0.75rem;
    color: hsl(var(--fg-secondary));
    line-height: 1.5;
    margin-top: 0.5rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.void-plugin-card-controls {
    flex-shrink: 0;
}

.void-plugin-card-separator {
    height: 1px;
    background: var(--border-l1);
}

.void-plugin-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.375rem 0.75rem;
    gap: 0.75rem;
}

.void-plugin-card-authors {
    font-size: 0.7rem;
    color: hsl(var(--fg-tertiary));
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.void-plugin-card-required {
    opacity: 0.4;
}

.void-plugin-card-crashed {
    opacity: 0.5;
    border-color: hsl(var(--red-700));
}

.void-plugin-card-crashed-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: hsl(var(--fg-danger));
    flex-shrink: 0;
    line-height: 0;
}

.void-plugin-card-crashed-icon svg {
    width: 1em;
    height: 1em;
}
`);

  // src/components/settings/pluginBadges.tsx
  var badges = [
    { key: "dev", icon: GhostFilledIcon, tooltip: "Dev Only" },
    { key: "chrome", icon: ChromiumIcon, tooltip: "Chromium Only" },
    { key: "preview", icon: TelescopeIcon, tooltip: "Preview plugin, may be removed once Grok ships this." }
  ];
  function PluginBadges({ plugin, className }) {
    return badges.filter((b) => plugin[b.key]).map((b) => /* @__PURE__ */ React.createElement(Tooltip, {
      key: b.key
    }, /* @__PURE__ */ React.createElement(TooltipTrigger, {
      asChild: true
    }, /* @__PURE__ */ React.createElement("span", {
      className
    }, /* @__PURE__ */ React.createElement(b.icon, null))), /* @__PURE__ */ React.createElement(TooltipContent, null, b.tooltip)));
  }

  // src/components/settings/utils.ts
  function isVisibleSetting([, s]) {
    return s.type !== 7 /* CUSTOM */ && !(("hidden" in s) && s.hidden);
  }
  function hasVisibleSettings(plugin) {
    return !!plugin.settings?.def && Object.entries(plugin.settings.def).some(isVisibleSetting);
  }

  // src/components/settings/PluginCard.tsx
  var cl5 = classNameFactory("void-plugin-card-");
  function PluginCard({ name, onSettings, onReload }) {
    const plugin = plugins[name];
    const forceUpdate = useForceUpdater();
    const enabled = isPluginEnabled(name);
    const crashed = enabled && !plugin.started && !plugin.required;
    const hasPatches = !!plugin.patches?.length;
    const handleToggle = () => {
      Settings.plugins[name] = { ...Settings.plugins[name], enabled: !enabled };
      if (!enabled)
        startPlugin(plugin, true);
      else
        stopPlugin(plugin);
      forceUpdate();
      dispatch("pluginToggle");
      if (hasPatches)
        onReload(name);
    };
    return /* @__PURE__ */ React.createElement("div", {
      className: classes(cl5("root"), plugin.required && cl5("required"), crashed && cl5("crashed"))
    }, /* @__PURE__ */ React.createElement("div", {
      className: cl5("body")
    }, /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.5rem"
    }, /* @__PURE__ */ React.createElement(Text, {
      as: "span",
      className: cl5("name")
    }, name, crashed && /* @__PURE__ */ React.createElement(Tooltip, null, /* @__PURE__ */ React.createElement(TooltipTrigger, {
      asChild: true
    }, /* @__PURE__ */ React.createElement(Text, {
      as: "span",
      className: cl5("crashed-icon")
    }, /* @__PURE__ */ React.createElement(TriangleAlert, null))), /* @__PURE__ */ React.createElement(TooltipContent, null, "This plugin failed to start")), plugin.required && /* @__PURE__ */ React.createElement(Tooltip, null, /* @__PURE__ */ React.createElement(TooltipTrigger, {
      asChild: true
    }, /* @__PURE__ */ React.createElement(Text, {
      as: "span",
      className: cl5("required-icon")
    }, /* @__PURE__ */ React.createElement(CircleAlertIcon, null))), /* @__PURE__ */ React.createElement(TooltipContent, null, "This plugin is required for Void to work")), /* @__PURE__ */ React.createElement(PluginBadges, {
      plugin,
      className: cl5("badge")
    })), /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      gap: "0.375rem",
      className: cl5("controls")
    }, hasVisibleSettings(plugin) && /* @__PURE__ */ React.createElement(Button, {
      variant: "tertiary",
      size: "xs",
      shape: "square",
      "aria-label": "Plugin settings",
      onClick: () => onSettings(name)
    }, /* @__PURE__ */ React.createElement(EllipsisVertical, {
      size: 16
    })), /* @__PURE__ */ React.createElement(Switch, {
      checked: enabled,
      disabled: plugin.required,
      onCheckedChange: handleToggle
    }))), plugin.description && /* @__PURE__ */ React.createElement("div", {
      className: cl5("desc")
    }, plugin.description)), /* @__PURE__ */ React.createElement("div", {
      className: cl5("separator")
    }), /* @__PURE__ */ React.createElement("div", {
      className: cl5("footer")
    }, /* @__PURE__ */ React.createElement("div", {
      className: cl5("authors")
    }, plugin.authors?.length ? plugin.authors.join(", ") : " ")));
  }

  // void-css:D:/Projects/Void/src/components/settings/tabs/PluginDialog.css
  registerStyle("PluginDialog", `.void-plugin-dialog-content {
    width: 600px;
    min-height: 420px;
    padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid var(--border-l1);
    background: var(--background);
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* SettingsRow has px-3 built in, strip it so fields align with the title */
.void-plugin-dialog-content .px-3 {
    padding-left: 0;
    padding-right: 0;
}

.void-plugin-dialog-close {
    position: absolute;
    right: 1rem;
    top: 1rem;
    z-index: 10;
}

.void-plugin-dialog-header {
    text-align: left;
}

.void-plugin-dialog-settings-list {
    margin-top: 0.5rem;
}
`);

  // void-css:D:/Projects/Void/src/components/settings/SettingField.css
  registerStyle("SettingField", `.void-setting-slider-row {
    align-items: center;
}

.void-setting-slider {
    width: 8rem;
}

.void-setting-slider-value {
    font-variant-numeric: tabular-nums;
    width: 1.5rem;
    text-align: right;
}

.void-setting-number-input {
    width: 6rem;
}

.void-setting-string-input {
    width: 100%;
}
`);

  // src/components/settings/SettingField.tsx
  var cl6 = classNameFactory("void-setting-");
  function usePluginSetting(pluginName, id, setting) {
    const [value, setValue] = useState((Settings.plugins[pluginName] ?? {})[id] ?? resolveDefault(setting));
    const update = useCallback((val) => {
      setValue(val);
      Settings.plugins[pluginName] = { ...Settings.plugins[pluginName], [id]: val };
      setting.onChange?.(val);
    }, [id, pluginName, setting]);
    return [value, update];
  }
  function SettingLabel({ id, setting }) {
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0"
    }, /* @__PURE__ */ React.createElement(SettingsTitle, null, humanizeKey(id)), "description" in setting && setting.description && /* @__PURE__ */ React.createElement(SettingsDescription, null, setting.description));
  }
  function BooleanField({ id, setting, pluginName }) {
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
  }
  function SelectField({ id, setting, pluginName }) {
    const [value, update] = usePluginSetting(pluginName, id, setting);
    if (!("options" in setting))
      return null;
    const { options } = setting;
    const valueMap = useMemo(() => new Map(options.map((o) => [String(o.value), o.value])), [options]);
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.5rem"
    }, /* @__PURE__ */ React.createElement(SettingLabel, {
      id,
      setting
    }), /* @__PURE__ */ React.createElement(Select, {
      value: String(value ?? ""),
      onValueChange: (v) => update(valueMap.get(v) ?? v)
    }, /* @__PURE__ */ React.createElement(SelectTrigger, null, /* @__PURE__ */ React.createElement(SelectValue, null)), /* @__PURE__ */ React.createElement(SelectContent, null, options.map((o) => /* @__PURE__ */ React.createElement(SelectItem, {
      key: String(o.value),
      value: String(o.value)
    }, o.label)))));
  }
  function SliderField({ id, setting, pluginName }) {
    const [value, update] = usePluginSetting(pluginName, id, setting);
    if (!("min" in setting))
      return null;
    const { min, max } = setting;
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.5rem"
    }, /* @__PURE__ */ React.createElement(SettingLabel, {
      id,
      setting
    }), /* @__PURE__ */ React.createElement(Flex, {
      gap: "8px",
      className: cl6("slider-row")
    }, /* @__PURE__ */ React.createElement(Slider, {
      value: [value ?? min],
      min,
      max,
      step: 1,
      onValueChange: ([v]) => update(v),
      className: cl6("slider")
    }), /* @__PURE__ */ React.createElement(Text, {
      size: "sm",
      color: "secondary",
      className: cl6("slider-value")
    }, value)));
  }
  function ComponentField({ setting, pluginName }) {
    const [, update] = usePluginSetting(pluginName, "component", setting);
    if (!("component" in setting))
      return null;
    const Comp = setting.component;
    return /* @__PURE__ */ React.createElement(Comp, {
      setValue: update,
      option: setting
    });
  }
  function NumberField({ id, setting, pluginName }) {
    const [value, update] = usePluginSetting(pluginName, id, setting);
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.5rem"
    }, /* @__PURE__ */ React.createElement(SettingLabel, {
      id,
      setting
    }), /* @__PURE__ */ React.createElement(Input, {
      type: "number",
      value: value ?? "",
      onChange: (e) => {
        const n = Number(e.target.value);
        if (!isNaN(n))
          update(n);
      },
      className: cl6("number-input")
    }));
  }
  function StringField({ id, setting, pluginName }) {
    const [value, update] = usePluginSetting(pluginName, id, setting);
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.5rem"
    }, /* @__PURE__ */ React.createElement(SettingLabel, {
      id,
      setting
    }), /* @__PURE__ */ React.createElement(Input, {
      type: "text",
      value: value ?? "",
      onChange: (e) => update(e.target.value),
      placeholder: "placeholder" in setting ? setting.placeholder : undefined,
      className: cl6("string-input")
    }));
  }
  var FIELD_MAP = {
    [3 /* BOOLEAN */]: BooleanField,
    [4 /* SELECT */]: SelectField,
    [5 /* SLIDER */]: SliderField,
    [6 /* COMPONENT */]: ComponentField,
    [1 /* NUMBER */]: NumberField,
    [2 /* BIGINT */]: NumberField,
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

  // src/components/settings/tabs/PluginDialog.tsx
  var cl7 = classNameFactory("void-plugin-dialog-");
  function PluginDialog({ plugin, open: open2, onClose }) {
    const entries = Object.entries(plugin.settings?.def ?? {}).filter(isVisibleSetting);
    return /* @__PURE__ */ React.createElement(Dialog, {
      open: open2,
      onOpenChange: (v) => {
        if (!v)
          onClose();
      }
    }, /* @__PURE__ */ React.createElement(DialogContent, {
      className: cl7("content"),
      "aria-describedby": undefined
    }, /* @__PURE__ */ React.createElement(DialogClose, {
      asChild: true
    }, /* @__PURE__ */ React.createElement(Button, {
      variant: "tertiary",
      size: "sm",
      shape: "square",
      "aria-label": "Close",
      className: cl7("close")
    }, /* @__PURE__ */ React.createElement(Cross2Icon, null))), /* @__PURE__ */ React.createElement(DialogHeader, {
      className: cl7("header")
    }, /* @__PURE__ */ React.createElement(DialogTitle, null, plugin.name), plugin.description && /* @__PURE__ */ React.createElement(Paragraph, null, plugin.description)), /* @__PURE__ */ React.createElement(Separator, null), !!plugin.authors?.length && /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.25rem"
    }, /* @__PURE__ */ React.createElement(Text, {
      size: "sm",
      weight: "medium"
    }, "Authors"), /* @__PURE__ */ React.createElement(Paragraph, null, plugin.authors.join(", "))), /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.25rem"
    }, /* @__PURE__ */ React.createElement(Text, {
      size: "sm",
      weight: "medium"
    }, "Settings"), entries.length ? /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.75rem",
      className: cl7("settings-list")
    }, entries.map(([key, setting]) => /* @__PURE__ */ React.createElement(SettingField, {
      key,
      id: key,
      setting,
      pluginName: plugin.name
    }))) : /* @__PURE__ */ React.createElement(Paragraph, null, "No configurable settings."))));
  }

  // src/components/settings/tabs/PluginsTab.tsx
  var cl8 = classNameFactory("void-plugins-");
  var getPluginKey = (name) => `${name} ${plugins[name].description ?? ""}`;
  function PluginsTab() {
    const [search2, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [dialogName, setDialogName] = useState(null);
    const [showReload, setShowReload] = useState(false);
    const { userPlugins, requiredPlugins } = useMemo(() => {
      const user = [];
      const required = [];
      for (const n of Object.keys(plugins).sort((a, b) => a.localeCompare(b))) {
        if (plugins[n].hidden)
          continue;
        if (plugins[n].required)
          required.push(n);
        else
          user.push(n);
      }
      return { userPlugins: user, requiredPlugins: required };
    }, []);
    const initialStatesRef = React.useRef(null);
    const changedPluginsRef = React.useRef(new Set);
    const dismissedRef = React.useRef(false);
    useEffect(() => {
      if (initialStatesRef.current)
        return;
      const map = new Map;
      for (const n of userPlugins)
        map.set(n, isPluginEnabled(n));
      for (const n of requiredPlugins)
        map.set(n, isPluginEnabled(n));
      initialStatesRef.current = map;
    }, [userPlugins, requiredPlugins]);
    useEffect(() => {
      const pending = consumePendingPluginDialog();
      if (pending)
        setDialogName(pending);
    }, []);
    const visibleUser = useMemo(() => {
      if (filter === "all")
        return userPlugins;
      const enabled = filter === "enabled";
      return userPlugins.filter((n) => isPluginEnabled(n) === enabled);
    }, [filter, userPlugins]);
    const visibleRequired = useMemo(() => {
      if (filter === "all")
        return requiredPlugins;
      const enabled = filter === "enabled";
      return requiredPlugins.filter((n) => isPluginEnabled(n) === enabled);
    }, [filter, requiredPlugins]);
    const filteredUser = useFiltered(visibleUser, search2, getPluginKey);
    const filteredRequired = useFiltered(visibleRequired, search2, getPluginKey);
    const dialogPlugin = dialogName ? plugins[dialogName] : null;
    const hasResults = filteredUser.length > 0 || filteredRequired.length > 0;
    const needsReload = changedPluginsRef.current.size > 0;
    const onReload = useCallback((pluginName) => {
      const initialStates = initialStatesRef.current;
      const changedPlugins = changedPluginsRef.current;
      if (!initialStates)
        return;
      const current = isPluginEnabled(pluginName);
      if (current === initialStates.get(pluginName))
        changedPlugins.delete(pluginName);
      else
        changedPlugins.add(pluginName);
      if (changedPlugins.size) {
        if (!dismissedRef.current)
          setShowReload(true);
      } else {
        setShowReload(false);
        dismissedRef.current = false;
      }
    }, []);
    const onDismiss = useCallback(() => {
      dismissedRef.current = true;
      setShowReload(false);
    }, []);
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "1.5rem"
    }, /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0",
      className: cl8("section")
    }, /* @__PURE__ */ React.createElement(Text, {
      size: "sm",
      weight: "medium"
    }, "Plugins"), /* @__PURE__ */ React.createElement(Paragraph, null, "Pick which plugins to use. Some need a page reload to kick in.")), needsReload && !showReload && /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      className: cl8("reload-banner")
    }, /* @__PURE__ */ React.createElement(Text, {
      size: "xs",
      className: cl8("reload-text")
    }, "Reload the page to apply plugin changes."), /* @__PURE__ */ React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      onClick: () => location.reload()
    }, "Reload")), /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      gap: "0.75rem",
      className: cl8("section")
    }, /* @__PURE__ */ React.createElement(Input, {
      type: "text",
      placeholder: `Search ${visibleUser.length + visibleRequired.length} plugins...`,
      value: search2,
      onChange: (e) => setSearch(e.target.value),
      className: cl8("search-input")
    }), /* @__PURE__ */ React.createElement(Select, {
      value: filter,
      onValueChange: (v) => setFilter(v)
    }, /* @__PURE__ */ React.createElement(SelectTrigger, {
      className: cl8("filter-select")
    }, /* @__PURE__ */ React.createElement(SelectValue, null)), /* @__PURE__ */ React.createElement(SelectContent, null, /* @__PURE__ */ React.createElement(SelectItem, {
      value: "all"
    }, "All"), /* @__PURE__ */ React.createElement(SelectItem, {
      value: "enabled"
    }, "Enabled"), /* @__PURE__ */ React.createElement(SelectItem, {
      value: "disabled"
    }, "Disabled")))), filteredUser.length > 0 && /* @__PURE__ */ React.createElement(Grid, {
      columns: "repeat(2, 1fr)",
      className: cl8("section")
    }, filteredUser.map((n) => /* @__PURE__ */ React.createElement(ErrorBoundary, {
      key: n,
      fallback: null
    }, /* @__PURE__ */ React.createElement(PluginCard, {
      name: n,
      onSettings: setDialogName,
      onReload
    })))), filteredRequired.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Separator, {
      className: cl8("divider")
    }), /* @__PURE__ */ React.createElement(Grid, {
      columns: "repeat(2, 1fr)",
      className: cl8("section")
    }, filteredRequired.map((n) => /* @__PURE__ */ React.createElement(ErrorBoundary, {
      key: n,
      fallback: null
    }, /* @__PURE__ */ React.createElement(PluginCard, {
      name: n,
      onSettings: setDialogName,
      onReload
    }))))), !hasResults && /* @__PURE__ */ React.createElement(Paragraph, {
      color: "secondary",
      className: cl8("empty")
    }, search2 ? "No plugins match your search." : "No plugins available."), dialogPlugin && /* @__PURE__ */ React.createElement(PluginDialog, {
      plugin: dialogPlugin,
      open: true,
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

  // void-css:D:/Projects/Void/src/components/settings/tabs/ThemesTab.css
  registerStyle("ThemesTab", `.void-themes-add-error {
    color: hsl(var(--fg-danger));
}

.void-themes-section {
    padding: 0 0.75rem;
}

.void-themes-search-input {
    flex: 1;
    min-width: 0;
}

.void-themes-import-btn {
    height: 2.25rem;
}

.void-themes-filter-select {
    width: 7rem;
}

.void-themes-empty {
    text-align: center;
    padding: 2rem 0;
}
`);

  // void-css:D:/Projects/Void/src/components/settings/ThemeCard.css
  registerStyle("ThemeCard", `.void-theme-card-root {
    padding: 0;
    display: flex;
    flex-direction: column;
    border-radius: 0.375rem;
    border: 1px solid var(--border-l1);
    background: var(--card);
}

.void-theme-card-body {
    padding: 0.625rem 0.75rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.void-theme-card-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.void-theme-card-controls {
    flex-shrink: 0;
}

.void-theme-card-desc {
    font-size: 0.75rem;
    color: hsl(var(--fg-secondary));
    line-height: 1.5;
    margin-top: 0.25rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.void-theme-card-separator {
    height: 1px;
    background: var(--border-l1);
}

.void-theme-card-footer {
    display: flex;
    align-items: center;
    padding: 0.375rem 0.75rem;
}

.void-theme-card-author {
    font-size: 0.7rem;
    color: hsl(var(--fg-tertiary));
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
`);

  // src/components/settings/ThemeCard.tsx
  var logger10 = new Logger("ThemeCard");
  var cl9 = classNameFactory("void-theme-card-");
  function ThemeCard({ theme, globalEnabled, onRemove, onToggle }) {
    const handleToggle = () => {
      if (theme.enabled)
        disableTheme(theme.url);
      else
        enableTheme(theme.url).catch((e) => logger10.error("Failed to enable theme:", e));
      onToggle();
    };
    return /* @__PURE__ */ React.createElement("div", {
      className: cl9("root")
    }, /* @__PURE__ */ React.createElement("div", {
      className: cl9("body")
    }, /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.5rem"
    }, /* @__PURE__ */ React.createElement(Text, {
      as: "span",
      className: cl9("name")
    }, theme.name ?? theme.url), /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      gap: "0.375rem",
      className: cl9("controls")
    }, /* @__PURE__ */ React.createElement(ButtonWithTooltip, {
      variant: "tertiary",
      size: "xs",
      shape: "square",
      tooltipContent: "Copy URL",
      onClick: () => copyToClipboard(theme.url)
    }, /* @__PURE__ */ React.createElement(CopyIcon, {
      size: 16
    })), /* @__PURE__ */ React.createElement(ButtonWithTooltip, {
      variant: "tertiary",
      size: "xs",
      shape: "square",
      tooltipContent: "Remove",
      onClick: () => onRemove(theme.url)
    }, /* @__PURE__ */ React.createElement(Trash2Icon, {
      size: 16
    })), /* @__PURE__ */ React.createElement(Switch, {
      checked: theme.enabled,
      disabled: !globalEnabled,
      onCheckedChange: handleToggle
    }))), theme.description && /* @__PURE__ */ React.createElement("div", {
      className: cl9("desc")
    }, theme.description)), /* @__PURE__ */ React.createElement("div", {
      className: cl9("separator")
    }), /* @__PURE__ */ React.createElement("div", {
      className: cl9("footer")
    }, /* @__PURE__ */ React.createElement("div", {
      className: cl9("author")
    }, theme.author ?? " ")));
  }

  // src/components/settings/tabs/ThemesTab.tsx
  var cl10 = classNameFactory("void-themes-");
  var getThemeKey = (t) => `${t.name} ${t.description ?? ""} ${t.author ?? ""}`;
  function ThemesTab() {
    const [search2, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [enabled, setEnabled] = useState(isThemesEnabled);
    const [themes, setThemes] = useState(getThemes);
    const visible = useMemo(() => {
      if (filter === "all")
        return themes;
      const enabled2 = filter === "enabled";
      return themes.filter((t) => t.enabled === enabled2);
    }, [themes, filter]);
    const filtered = useFiltered(visible, search2, getThemeKey);
    const handleToggle = (checked) => {
      setEnabled(checked);
      setThemesEnabled(checked);
    };
    const handleAdd = async () => {
      const trimmed = url.trim();
      if (!trimmed)
        return;
      setError("");
      setLoading(true);
      try {
        await addTheme(trimmed);
        setUrl("");
        setThemes(getThemes());
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    };
    const [removeUrl, setRemoveUrl] = useState(null);
    const removeTarget = removeUrl ? themes.find((t) => t.url === removeUrl) : null;
    const handleRemove = () => {
      if (!removeUrl)
        return;
      removeTheme(removeUrl);
      setRemoveUrl(null);
      setThemes(getThemes());
    };
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "2rem"
    }, /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      justifyContent: "space-between",
      className: cl10("section")
    }, /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0"
    }, /* @__PURE__ */ React.createElement(Text, {
      size: "sm",
      weight: "medium"
    }, "Themes"), /* @__PURE__ */ React.createElement(Paragraph, null, "Custom CSS themes for Grok. Paste a URL to a .css file to add one.")), /* @__PURE__ */ React.createElement(Switch, {
      checked: enabled,
      onCheckedChange: handleToggle
    })), /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.5rem",
      className: cl10("section")
    }, /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      gap: "0.5rem"
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
          handleAdd();
      },
      className: cl10("search-input")
    }), /* @__PURE__ */ React.createElement(Button, {
      variant: "primary",
      size: "sm",
      className: cl10("import-btn"),
      onClick: handleAdd,
      disabled: loading || !url.trim()
    }, loading ? "Importing..." : "Import")), error && /* @__PURE__ */ React.createElement(Text, {
      size: "xs",
      className: cl10("add-error")
    }, error)), themes.length > 0 && /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0.375rem",
      className: cl10("section")
    }, /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0"
    }, /* @__PURE__ */ React.createElement(Text, {
      size: "sm",
      weight: "medium"
    }, "Installed Themes"), /* @__PURE__ */ React.createElement(Paragraph, null, "Re-fetched every page load. Use the switch above to disable all themes at once.")), /* @__PURE__ */ React.createElement(Paragraph, null, `${pluralize(themes.length, "theme")} installed · ${themes.filter((t) => t.enabled).length} enabled`)), themes.length > 0 && /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      gap: "0.75rem",
      className: cl10("section")
    }, /* @__PURE__ */ React.createElement(Input, {
      type: "text",
      placeholder: `Search ${themes.length} themes...`,
      value: search2,
      onChange: (e) => setSearch(e.target.value),
      className: cl10("search-input")
    }), /* @__PURE__ */ React.createElement(Select, {
      value: filter,
      onValueChange: (v) => setFilter(v)
    }, /* @__PURE__ */ React.createElement(SelectTrigger, {
      className: cl10("filter-select")
    }, /* @__PURE__ */ React.createElement(SelectValue, null)), /* @__PURE__ */ React.createElement(SelectContent, null, /* @__PURE__ */ React.createElement(SelectItem, {
      value: "all"
    }, "All"), /* @__PURE__ */ React.createElement(SelectItem, {
      value: "enabled"
    }, "Enabled"), /* @__PURE__ */ React.createElement(SelectItem, {
      value: "disabled"
    }, "Disabled")))), filtered.length > 0 && /* @__PURE__ */ React.createElement(Grid, {
      columns: "repeat(2, 1fr)",
      className: cl10("section")
    }, filtered.map((t) => /* @__PURE__ */ React.createElement(ErrorBoundary, {
      key: t.url,
      fallback: null
    }, /* @__PURE__ */ React.createElement(ThemeCard, {
      theme: t,
      globalEnabled: enabled,
      onRemove: setRemoveUrl,
      onToggle: () => setThemes(getThemes())
    })))), themes.length > 0 && !filtered.length && /* @__PURE__ */ React.createElement(Paragraph, {
      color: "secondary",
      className: cl10("empty")
    }, "No themes match your search."), !themes.length && /* @__PURE__ */ React.createElement(Paragraph, {
      color: "secondary",
      className: cl10("empty")
    }, "No themes added yet. Paste a URL above to add one."), /* @__PURE__ */ React.createElement(ConfirmDialog, {
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
    }));
  }

  // src/components/settings/tabs/index.ts
  var CustomCSSTab2 = ErrorBoundary.wrap(CustomCSSTab);
  var PluginsTab2 = ErrorBoundary.wrap(PluginsTab);
  var ThemesTab2 = ErrorBoundary.wrap(ThemesTab);

  // void-css:D:/Projects/Void/src/plugins/experiments/styles.css
  registerStyle("experiments", `.void-experiments-section {
    padding: 0 0.75rem;
}

.void-experiments-modified {
    margin-left: 6px;
    color: hsl(var(--fg-warning));
}

.void-experiments-new-chip {
    margin-left: 6px;
    vertical-align: middle;
}

.void-experiments-obfuscated-chip {
    margin-left: 6px;
    vertical-align: middle;
    background: hsl(var(--purple-700) / 60%);
    color: hsl(var(--purple-200));
}

.void-experiments-warning {
    margin: 0 0.75rem;
    padding: 0.625rem 0.75rem;
    border-radius: var(--radius);
    background: hsl(var(--yellow-800) / 60%);
    border-color: hsl(var(--yellow-700));
    color: hsl(var(--fg-warning));
}

.void-experiments-warning-text {
    color: inherit;
    line-height: 1.5;
}

.void-experiments-clear-btn {
    flex-shrink: 0;
    border-color: hsl(var(--yellow-700));
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
  var TOAST_FNS = ["", "success", "error", "info", "warning", "loading"];
  function showToast(message, type = 0 /* MESSAGE */, options) {
    const { toast } = Toaster;
    const fn = type === 0 /* MESSAGE */ ? toast : toast[TOAST_FNS[type]];
    return fn(message, options);
  }
  function dismissToast(id) {
    Toaster.toast.dismiss(id);
  }

  // src/plugins/experiments/index.tsx
  var cl11 = classNameFactory("void-experiments-");
  var NEW_FLAG_TTL = 24 * 60 * 60 * 1000;
  var settings2 = definePluginSettings({
    notifyNewFlags: {
      type: 3 /* BOOLEAN */,
      description: "Show a notification when new experiment flags are added.",
      default: true
    }
  }).withPrivateSettings();
  function getBooleanKeys(config) {
    return Object.keys(config).filter((k) => typeof config[k] === "boolean");
  }
  function syncKnownFlags(config) {
    const booleanKeys = getBooleanKeys(config);
    if (!booleanKeys.length)
      return;
    const existing = settings2.plain.knownFlags;
    const firstRun = existing == null;
    const known = { ...existing ?? {} };
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
    const currentSet = new Set(booleanKeys);
    for (const key of Object.keys(known)) {
      if (!currentSet.has(key)) {
        delete known[key];
        changed = true;
      }
    }
    if (changed) {
      settings2.store.knownFlags = { ...known };
    }
    if (newFlags.length && settings2.store.notifyNewFlags) {
      showToast(`${pluralize(newFlags.length, "new experiment flag")} added`, 3 /* INFO */);
    }
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
    }, /* @__PURE__ */ React.createElement(SettingsTitle, null, prettifyKey(flagKey), isNew && /* @__PURE__ */ React.createElement(Chip, {
      className: cl11("new-chip")
    }, "NEW"), decodedKey && /* @__PURE__ */ React.createElement(Chip, {
      className: cl11("obfuscated-chip")
    }, "OBFUSCATED"), isOverridden && /* @__PURE__ */ React.createElement(Text, {
      size: "xs",
      as: "span",
      className: cl11("modified")
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
      if (filter === "obfuscated")
        return tryDecodeBase64Key(k) != null;
      return override !== undefined;
    }, [filter, config, overrides]);
    const prefiltered = useMemo(() => booleanKeys.filter(filterFn), [booleanKeys, filterFn]);
    const filtered = useFiltered(prefiltered, search2, getFlagSearchText);
    const overrideCount = Object.keys(overrides).length;
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "1rem"
    }, /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0",
      className: cl11("section")
    }, /* @__PURE__ */ React.createElement(Text, {
      size: "sm",
      weight: "medium"
    }, "Experiments"), /* @__PURE__ */ React.createElement(Paragraph, null, "Toggle unreleased Grok features. These are experimental and may break things.")), /* @__PURE__ */ React.createElement(Card, {
      variant: "ghost",
      className: cl11("warning")
    }, /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.75rem"
    }, /* @__PURE__ */ React.createElement(Text, {
      size: "xs",
      className: cl11("warning-text")
    }, "Only enable flags you understand. Changing the wrong setting can break Grok or cause unexpected behavior."), overrideCount > 0 && /* @__PURE__ */ React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      className: cl11("clear-btn"),
      onClick: () => FeatureStore.useFeatureStore.getState().clearAllOverrides()
    }, "Clear ", pluralize(overrideCount, "override")))), /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      gap: "0.5rem",
      className: cl11("section")
    }, /* @__PURE__ */ React.createElement(Input, {
      placeholder: `Search ${prefiltered.length} flags...`,
      value: search2,
      onChange: (e) => setSearch(e.target.value),
      className: cl11("search-input")
    }), /* @__PURE__ */ React.createElement(Select, {
      value: filter,
      onValueChange: (v) => setFilter(v)
    }, /* @__PURE__ */ React.createElement(SelectTrigger, {
      className: cl11("filter-select")
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
      value: "obfuscated"
    }, "Obfuscated")))), filtered.map((key) => /* @__PURE__ */ React.createElement(ErrorBoundary, {
      key,
      fallback: null
    }, /* @__PURE__ */ React.createElement(ExperimentRow, {
      flagKey: key,
      isNew: isNewFlag(key)
    }))), !filtered.length && /* @__PURE__ */ React.createElement(Paragraph, {
      color: "muted",
      className: cl11("empty")
    }, search2 ? `No flags matching "${search2}"` : `No ${filter} flags`));
  }
  var Tab = ErrorBoundary.wrap(ExperimentsTab);
  var experiments_default = definePlugin({
    name: "Experiments",
    description: "Unlock and toggle unreleased Grok features.",
    authors: [Devs.Prism],
    settings: settings2,
    startAt: "TurbopackReady" /* TurbopackReady */,
    start() {
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
        find: 'ENABLE_SCREEN_SHARING:"enable_screen_sharing"',
        all: true,
        replacement: {
          match: /\i&&(void 0!==\i\[\i\])/,
          replace: "$1"
        }
      },
      {
        find: "Feature flag overrides active",
        replacement: {
          match: /\i\.toast\.warning\(\i\("Feature flag overrides active","Feature flag overrides active"\)\)/,
          replace: "void 0"
        }
      }
    ]
  });

  // src/plugins/_core/settings/index.tsx
  var logger11 = new Logger("Settings");
  var cl12 = classNameFactory("void-settings-");
  var settings3 = definePluginSettings({
    hideUserId: {
      type: 3 /* BOOLEAN */,
      description: "Hide your user ID from the account settings page.",
      default: true
    },
    fixDialogFlash: {
      type: 3 /* BOOLEAN */,
      description: "Fix the white border flash when clicking inside dialogs.",
      default: true
    },
    showVoidMenu: {
      type: 3 /* BOOLEAN */,
      description: "Show the Void sub-menu in the avatar dropdown.",
      default: true
    }
  });
  var allTabs = [
    { id: "void_plugins_tab", name: "Plugins", icon: UnplugIcon, component: PluginsTab2 },
    { id: "void_themes_tab", name: "Themes", icon: PaletteIcon, component: ThemesTab2 },
    { id: "void_css_tab", name: "Quick CSS", icon: BracesIcon, component: CustomCSSTab2 },
    { id: "void_experiments_tab", name: "Experiments", icon: TestTubeIcon, component: Tab, plugin: "Experiments" }
  ];
  function getVisibleTabs() {
    return allTabs.filter((t) => !t.plugin || isPluginEnabled(t.plugin));
  }
  function Dot() {
    return /* @__PURE__ */ React.createElement(Text, {
      as: "span",
      color: "secondary"
    }, "•");
  }
  function VersionLink({ href, children }) {
    return /* @__PURE__ */ React.createElement("a", {
      href,
      target: "_blank",
      rel: "noreferrer",
      className: cl12("version-link")
    }, /* @__PURE__ */ React.createElement(Text, {
      as: "span",
      color: "secondary"
    }, children));
  }
  function VersionInfo() {
    return /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      gap: "0",
      className: cl12("version")
    }, /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      gap: "0.25rem"
    }, /* @__PURE__ */ React.createElement(VersionLink, {
      href: "https://github.com/imjustprism/Void"
    }, "Void"), /* @__PURE__ */ React.createElement(Dot, null), /* @__PURE__ */ React.createElement(Text, {
      as: "span",
      color: "secondary"
    }, `v${"0.3.1"}`), /* @__PURE__ */ React.createElement(Dot, null), /* @__PURE__ */ React.createElement(VersionLink, {
      href: `${"https://github.com/imjustprism/Void"}/commit/${"f3bab5c"}`
    }, `(${"f3bab5c"})`)), /* @__PURE__ */ React.createElement(Flex, {
      alignItems: "center",
      gap: "0.25rem"
    }, /* @__PURE__ */ React.createElement(Text, {
      as: "span",
      color: "secondary"
    }, "Production"), /* @__PURE__ */ React.createElement(Dot, null), /* @__PURE__ */ React.createElement(Text, {
      as: "span",
      color: "secondary"
    }, "Userscript")));
  }
  function VoidTabs({ jsx, TabButton }) {
    const forceUpdate = useForceUpdater();
    useEventSubscription("pluginToggle", forceUpdate);
    return /* @__PURE__ */ React.createElement(Fragment, null, getVisibleTabs().map((t) => jsx(TabButton, { key: t.id, icon: t.icon, text: t.name, tab: t.id })));
  }
  function VoidPanels({ jsx, activeTab, Wrapper }) {
    const forceUpdate = useForceUpdater();
    useEventSubscription("pluginToggle", forceUpdate);
    const tab = getVisibleTabs().find((t) => t.id === activeTab);
    if (!tab)
      return null;
    return jsx(Wrapper, { key: tab.id, children: jsx(tab.component, {}) });
  }
  function openSettingsTab(tab) {
    const store3 = SettingsDialogStore.useSettingsDialogStore.getState();
    store3.setTab(tab);
    store3.setOpen(true);
  }
  var pendingPluginDialog = null;
  function consumePendingPluginDialog() {
    const name = pendingPluginDialog;
    pendingPluginDialog = null;
    return name;
  }
  function openPluginSettings(name) {
    pendingPluginDialog = name;
    openSettingsTab("void_plugins_tab");
  }
  function VoidMenu() {
    const forceUpdate = useForceUpdater();
    useEventSubscription("pluginToggle", forceUpdate);
    if (!settings3.store.showVoidMenu)
      return null;
    const settingsPlugins = Object.keys(plugins).filter((n) => !plugins[n].hidden && hasVisibleSettings(plugins[n])).sort((a, b) => a.localeCompare(b));
    return /* @__PURE__ */ React.createElement(DropdownMenuSub, null, /* @__PURE__ */ React.createElement(DropdownMenuSubTrigger, null, /* @__PURE__ */ React.createElement(GhostFilledIcon, {
      className: cl12("menu-icon")
    }), "Void"), /* @__PURE__ */ React.createElement(DropdownMenuSubContent, null, /* @__PURE__ */ React.createElement(DropdownMenuSub, null, /* @__PURE__ */ React.createElement(DropdownMenuSubTrigger, null, /* @__PURE__ */ React.createElement(UnplugIcon, {
      className: cl12("menu-icon")
    }), "Plugins"), /* @__PURE__ */ React.createElement(DropdownMenuSubContent, null, settingsPlugins.map((name) => /* @__PURE__ */ React.createElement(DropdownMenuItem, {
      key: name,
      onSelect: () => openPluginSettings(name)
    }, name)))), /* @__PURE__ */ React.createElement(DropdownMenuItem, {
      onSelect: () => openSettingsTab("void_themes_tab")
    }, /* @__PURE__ */ React.createElement(PaletteIcon, {
      className: cl12("menu-icon")
    }), "Themes"), /* @__PURE__ */ React.createElement(DropdownMenuItem, {
      onSelect: () => openSettingsTab("void_css_tab")
    }, /* @__PURE__ */ React.createElement(BracesIcon, {
      className: cl12("menu-icon")
    }), "Quick CSS"), isPluginEnabled("Experiments") && /* @__PURE__ */ React.createElement(DropdownMenuItem, {
      onSelect: () => openSettingsTab("void_experiments_tab")
    }, /* @__PURE__ */ React.createElement(TestTubeIcon, {
      className: cl12("menu-icon")
    }), "Experiments")));
  }
  var settings_default = definePlugin({
    name: "Settings",
    description: "Adds Void settings UI.",
    authors: [Devs.Prism],
    required: true,
    settings: settings3,
    _hideUserId() {
      return settings3.store.hideUserId;
    },
    _fixDialogFlash() {
      return settings3.store.fixDialogFlash;
    },
    _VoidMenu: VoidMenu,
    renderTabs(jsx, TabButton) {
      try {
        return [/* @__PURE__ */ React.createElement(VoidTabs, {
          key: "void-tabs",
          jsx,
          TabButton
        }), /* @__PURE__ */ React.createElement(VersionInfo, {
          key: "void-version"
        })];
      } catch (e) {
        logger11.error("Failed to render tabs:", e);
        return [];
      }
    },
    renderPanels(jsx, activeTab, Wrapper) {
      try {
        return [/* @__PURE__ */ React.createElement(VoidPanels, {
          key: "void-panels",
          jsx,
          activeTab,
          Wrapper
        })];
      } catch (e) {
        logger11.error("Failed to render panels:", e);
        return [];
      }
    },
    start() {
      registerStyle("void-global", "[data-sonner-toast] [data-title]{font-weight:400}");
      if (document.head)
        loadSavedCSS();
      else
        document.addEventListener("DOMContentLoaded", loadSavedCSS, { once: true });
      loadSavedThemes().catch((e) => logger11.error("Failed to load saved themes:", e));
    },
    patches: [
      {
        find: "avatar_menu_click",
        replacement: {
          match: /\(0,(\i)\.jsxs\)\((\i)\.DropdownMenuSub,\{children:\[\(0,\1\.jsxs\)\(\2\.DropdownMenuSubTrigger,\{children:\[.{0,100}"user-dropdown\.help"/,
          replace: "(0,$1.jsx)($self._VoidMenu,{}),$&"
        }
      },
      {
        find: 'DialogOverlay",()=>',
        all: true,
        replacement: {
          match: /dark:border-border-l1 duration-200/,
          replace: 'dark:border-border-l1 "+($self._fixDialogFlash()?"outline-none ":"")+"duration-200'
        }
      },
      {
        find: "pressed_cmd_settings",
        replacement: [
          {
            match: /(\i\.jsx)\)\((\i),\{icon:\i\.DatabaseIcon,.{0,80}tab:"data"\}\)/,
            replace: "$&,...$self.renderTabs($1,$2)"
          },
          {
            match: /"data"===(\i)&&\i\.user&&\(0,(\i\.jsx)\)\((\i),\{children:/,
            replace: "...$self.renderPanels($2,$1,$3),$&"
          },
          {
            match: /\i\.user&&\(0,\i\.jsx\)\("div",.{0,120}:\i\.userId\}\)/,
            replace: "!$self._hideUserId()&&$&"
          }
        ]
      }
    ]
  });

  // src/api/Modals.tsx
  var nextId = 0;
  var modalStack = [];
  var store3 = createExternalStore();
  function openModal(render, options) {
    const key = options?.modalKey ?? `void-modal-${nextId++}`;
    modalStack.push({ key, render });
    store3.notify();
    return key;
  }
  function closeModal(key) {
    const idx = modalStack.findIndex((m) => m.key === key);
    if (idx !== -1) {
      modalStack.splice(idx, 1);
      store3.notify();
    }
  }
  function closeAllModals() {
    modalStack.length = 0;
    store3.notify();
  }
  function confirm(options) {
    return new Promise((resolve) => {
      let resolved = false;
      const settle = (value) => {
        if (resolved)
          return;
        resolved = true;
        unsub();
        resolve(value);
      };
      const key = openModal(({ onClose }) => /* @__PURE__ */ React.createElement(DialogHeader, null, /* @__PURE__ */ React.createElement(DialogTitle, null, options.title), /* @__PURE__ */ React.createElement(DialogDescription, null, options.body), /* @__PURE__ */ React.createElement(DialogFooter, null, /* @__PURE__ */ React.createElement(Button, {
        variant: "secondary",
        size: "md",
        onClick: () => {
          settle(false);
          onClose();
        }
      }, options.cancelText ?? "Cancel"), /* @__PURE__ */ React.createElement(Button, {
        variant: options.danger ? "danger" : "primary",
        size: "md",
        onClick: () => {
          settle(true);
          onClose();
        }
      }, options.confirmText ?? "Confirm"))));
      const unsub = store3.subscribe(() => {
        if (!modalStack.some((m) => m.key === key))
          settle(false);
      });
    });
  }
  function ModalInstance({ entry }) {
    const onClose = useCallback(() => closeModal(entry.key), [entry.key]);
    return /* @__PURE__ */ React.createElement(Dialog, {
      open: true,
      onOpenChange: (open2) => {
        if (!open2)
          onClose();
      }
    }, /* @__PURE__ */ React.createElement(DialogContent, {
      "aria-describedby": undefined
    }, entry.render({ onClose })));
  }
  function ModalContainer() {
    useExternalStore(store3);
    if (!modalStack.length)
      return null;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, modalStack.map((entry) => /* @__PURE__ */ React.createElement(ModalInstance, {
      key: entry.key,
      entry
    })));
  }

  // src/plugins/_api/chatBarButtons/index.ts
  var chatBarButtons_default = definePlugin({
    name: "ChatBarButtonAPI",
    description: "Adds buttons to the chat input bar.",
    authors: [Devs.Prism],
    required: true,
    hidden: true,
    renderButtons(iconOnly) {
      try {
        return createElement(Fragment, null, createElement(VoidChatBarButtons, { iconOnly }), createElement(ModalContainer, null));
      } catch {
        return null;
      }
    },
    patches: [
      {
        find: "ImagineSelector,{iconOnlyTrigger",
        all: true,
        replacement: [
          {
            match: /ModelModeSelect,\{iconOnlyTrigger:(\i)\}\)\}\),/,
            replace: "$&$self.renderButtons($1),"
          },
          {
            match: /paddingInlineEnd:\i\?void 0:(\i)\?/,
            replace: "paddingInlineEnd:$1?"
          }
        ]
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
    renderItems(location2, ctx) {
      try {
        return createElement(VoidContextMenuItems, { location: location2, ...ctx });
      } catch {
        return null;
      }
    },
    patches: [
      {
        find: '"Editing actions","Editing actions"',
        all: true,
        group: true,
        replacement: [
          {
            match: /onSaveEdit:(\i)\}\)/,
            replace: "onSaveEdit:$1,id:arguments[0].id})"
          },
          {
            match: /onEditClick:(\i)\}\)/,
            replace: "onEditClick:$1,...arguments[0]})"
          },
          {
            match: /"Delete","Delete"\)\]\}\)/,
            replace: '$&,$self.renderItems("conversation",{conversationId:arguments[0].id})'
          }
        ]
      },
      {
        find: '"more-actions-dropdown"',
        all: true,
        replacement: {
          match: /"more-action\.copy-model-hash".{0,80}slice\(0,5\)\}\}\)\}\)\]\}\)\]\}\)/,
          replace: '$&,$self.renderItems("message",{response:arguments[0].response})'
        }
      },
      {
        find: '"AvatarDropdownMenu",()=>',
        all: true,
        replacement: {
          match: /"Sign Out"\)\]\}\)/,
          replace: '$&,$self.renderItems("user")'
        }
      }
    ]
  });

  // src/plugins/betterFiles/index.tsx
  var logger12 = new Logger("BetterFiles");
  var settings4 = definePluginSettings({
    skipDeleteConfirm: {
      type: 3 /* BOOLEAN */,
      description: "Skip the delete confirmation when deleting files from the list.",
      default: false
    }
  });
  function DeleteAllButton() {
    const [open2, setOpen] = useState(false);
    const list = FilesPageStore.useFilesPageStore((s) => s.list);
    const deleteAsset = FilesPageStore.useFilesPageStore((s) => s.deleteAsset);
    if (!list.length)
      return null;
    const handleConfirm = async () => {
      const ids = [...list];
      for (const id of ids) {
        try {
          await deleteAsset(id);
        } catch (e) {
          logger12.error("Failed to delete asset", id, e);
        }
      }
    };
    return /* @__PURE__ */ React.createElement(Fragment, null, /* @__PURE__ */ React.createElement(Button, {
      variant: "tertiary",
      shape: "square",
      size: "sm",
      onClick: () => setOpen(true)
    }, /* @__PURE__ */ React.createElement(TrashIcon, {
      size: 18
    })), /* @__PURE__ */ React.createElement(ConfirmDialog, {
      open: open2,
      onOpenChange: setOpen,
      title: "Delete all files",
      description: `Are you sure you want to delete all ${list.length} files? This cannot be undone.`,
      confirmText: "Delete all",
      danger: true,
      onConfirm: handleConfirm
    }));
  }
  var betterFiles_default = definePlugin({
    name: "BetterFiles",
    description: "Adds bulk delete and optional skip of delete confirmation on the files page.",
    authors: [Devs.Prism],
    settings: settings4,
    renderDeleteAllButton: ErrorBoundary.wrap(DeleteAllButton),
    _deleteFile(assetId) {
      Promise.resolve(FilesPageStore.useFilesPageStore.getState().deleteAsset(assetId)).catch((e) => logger12.error("Failed to delete asset", assetId, e));
    },
    patches: [
      {
        find: "title-and-button",
        noWarn: true,
        replacement: [
          {
            match: /"files-search-open-button.label".{0,25}\)\}\)\]\}\)/,
            replace: "$&,$self.renderDeleteAllButton()"
          },
          {
            match: /(\i)\(\{type:"delete",assetId:(\i)\.assetId\}\)/,
            replace: '$self.settings.store.skipDeleteConfirm?$self._deleteFile($2.assetId):$1({type:"delete",assetId:$2.assetId})'
          }
        ]
      }
    ]
  });

  // void-css:D:/Projects/Void/src/plugins/betterImagine/styles.css
  registerStyle("betterImagine", `.void-imagine-filter-btn,
.void-imagine-search {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    border-radius: 9999px;
    padding: 0.375rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
    user-select: none;
    cursor: pointer;
    border: none;
    outline: none;
    transition: color 0.15s, background-color 0.15s;
    background: hsl(var(--surface-l1));
    color: hsl(var(--fg-secondary));
}

.void-imagine-search {
    width: 10rem;
}

.void-imagine-search::placeholder {
    color: hsl(var(--fg-tertiary));
}

.void-imagine-search:focus {
    color: hsl(var(--fg-primary));
    background: hsl(var(--surface-l2));
}

.void-imagine-filter-btn:hover {
    color: hsl(var(--fg-primary));
    background: hsl(var(--surface-l2));
}

.void-imagine-filter-btn-active,
.void-imagine-filter-btn-active:hover {
    background: hsl(var(--fg-primary));
    color: var(--background);
}

.void-imagine-date-select {
    flex-shrink: 0;
    border-radius: 9999px;
    font-size: 0.875rem;
    background: hsl(var(--surface-l1));
    color: hsl(var(--fg-secondary));
    border: none;
}

.void-imagine-card-btn {
    background: rgb(0 0 0 / 25%);
    border: 1px solid rgb(255 255 255 / 15%);
    opacity: 0;
}

.void-imagine-card-btn:hover {
    background: rgb(255 255 255 / 10%);
}

/* stylelint-disable-next-line selector-class-pattern -- Grok's class name */
.group\\/media-post-masonry-card:hover .void-imagine-card-btn {
    opacity: 1;
}

.void-imagine-card-btn-danger:hover {
    background: rgb(220 38 38 / 60%) !important;
}

.void-imagine-action-toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
}

.void-imagine-select-marker {
    display: none;
}

.void-imagine-card-selected::after {
    content: "";
    position: absolute;
    inset: 0;
    border: 3px solid hsl(217deg 91% 60%);
    border-radius: 2px;
    pointer-events: none;
    z-index: 20;
}
`);

  // src/utils/zip.ts
  var encoder = new TextEncoder;
  function crc32(data) {
    let crc = 4294967295;
    for (let i = 0;i < data.length; i++) {
      crc ^= data[i];
      for (let j = 0;j < 8; j++)
        crc = crc >>> 1 ^ (crc & 1 ? 3988292384 : 0);
    }
    return (crc ^ 4294967295) >>> 0;
  }
  function u16(n) {
    return [n & 255, n >> 8 & 255];
  }
  function u32(n) {
    return [n & 255, n >> 8 & 255, n >> 16 & 255, n >> 24 & 255];
  }
  function createZip(files) {
    const entries = Object.entries(files);
    const localHeaders = [];
    const centralHeaders = [];
    let offset = 0;
    for (const [name, data] of entries) {
      const nameBytes = encoder.encode(name);
      const crc = crc32(data);
      const local = new Uint8Array([
        80,
        75,
        3,
        4,
        10,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        ...u32(crc),
        ...u32(data.length),
        ...u32(data.length),
        ...u16(nameBytes.length),
        ...u16(0),
        ...nameBytes
      ]);
      const central = new Uint8Array([
        80,
        75,
        1,
        2,
        20,
        0,
        10,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        ...u32(crc),
        ...u32(data.length),
        ...u32(data.length),
        ...u16(nameBytes.length),
        ...u16(0),
        ...u16(0),
        ...u16(0),
        ...u16(0),
        ...u32(0),
        ...u32(offset),
        ...nameBytes
      ]);
      localHeaders.push(local, data);
      centralHeaders.push(central);
      offset += local.length + data.length;
    }
    const centralSize = centralHeaders.reduce((s, h) => s + h.length, 0);
    const eocd = new Uint8Array([
      80,
      75,
      5,
      6,
      ...u16(0),
      ...u16(0),
      ...u16(entries.length),
      ...u16(entries.length),
      ...u32(centralSize),
      ...u32(offset),
      ...u16(0)
    ]);
    const parts = [...localHeaders, ...centralHeaders, eocd];
    return new Blob(parts, { type: "application/zip" });
  }

  // src/plugins/betterImagine/index.tsx
  var CopyIcon2 = findExportedComponentLazy("CopyIcon");
  var DownloadIcon2 = findExportedComponentLazy("DownloadIcon");
  var logger13 = new Logger("BetterImagine");
  var cl13 = classNameFactory("void-imagine-");
  var settings5 = definePluginSettings({
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
    }
  });
  var MEDIA_TYPE_IMAGE = "MEDIA_POST_TYPE_IMAGE";
  var MEDIA_TYPE_VIDEO = "MEDIA_POST_TYPE_VIDEO";
  var PAGE_FAVORITES = "imagine-favorites";
  var FILTER_MAP = {
    image: MEDIA_TYPE_IMAGE,
    video: MEDIA_TYPE_VIDEO
  };
  var DATE_LABELS = {
    all: "Any time",
    today: "Today",
    week: "This week",
    month: "This month"
  };
  var currentFilter = "all";
  var currentSearch = "";
  var currentDate = "all";
  var filterStore = createExternalStore();
  function setFilter(f) {
    currentFilter = f;
    filterStore.notify();
  }
  function setSearch(s) {
    currentSearch = s;
    filterStore.notify();
  }
  function setDate(d) {
    currentDate = d;
    filterStore.notify();
  }
  function getDateCutoff(d) {
    const now = Date.now();
    const DAY = 86400000;
    if (d === "today")
      return now - DAY;
    if (d === "week")
      return now - 7 * DAY;
    if (d === "month")
      return now - 30 * DAY;
    return 0;
  }
  function filterItems(items2) {
    if (currentFilter === "all" && !currentSearch && currentDate === "all")
      return items2;
    const target = currentFilter !== "all" ? FILTER_MAP[currentFilter] : null;
    const q = currentSearch.toLowerCase();
    const cutoff = getDateCutoff(currentDate);
    return items2.filter((p) => {
      if (!p)
        return false;
      if (target && p.mediaType !== target)
        return false;
      if (cutoff && new Date(p.createTime).getTime() < cutoff)
        return false;
      if (q && !(p.prompt ?? "").toLowerCase().includes(q) && !(p.originalPrompt ?? "").toLowerCase().includes(q))
        return false;
      return true;
    });
  }
  var selectedIds = new Set;
  var selectMode = false;
  var selectionStore = createExternalStore();
  function toggleSelectMode() {
    selectMode = !selectMode;
    if (!selectMode)
      selectedIds.clear();
    selectionStore.notify();
  }
  function toggleSelected(id) {
    if (selectedIds.has(id))
      selectedIds.delete(id);
    else
      selectedIds.add(id);
    selectionStore.notify();
  }
  function clearSelection() {
    selectedIds.clear();
    selectMode = false;
    selectionStore.notify();
  }
  async function bulkDeletePosts(ids) {
    const { deletePost } = MediaStore.useMediaStore.getState();
    let deleted = 0;
    for (const id of ids) {
      try {
        await deletePost(id, id);
        deleted++;
      } catch (e) {
        logger13.error("Failed to delete post:", id, e);
      }
    }
    clearSelection();
    Toaster.toast.success(`Deleted ${deleted} item${deleted !== 1 ? "s" : ""}.`);
  }
  async function bulkUpscaleVideos(ids) {
    const state = MediaStore.useMediaStore.getState();
    let upscaled = 0;
    let alreadyHd = 0;
    let inProgress = 0;
    for (const id of ids) {
      const item = state.byId[id];
      if (!item)
        continue;
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
          logger13.error("Failed to upscale video:", id, video.id, e);
        }
      }
    }
    if (upscaled > 0)
      Toaster.toast.success(`Upscaling ${upscaled} video${upscaled !== 1 ? "s" : ""}.`);
    else if (alreadyHd > 0)
      Toaster.toast.info(`${alreadyHd} video${alreadyHd !== 1 ? "s" : ""} already in HD.`);
    else if (inProgress > 0)
      Toaster.toast.info(`${inProgress} video${inProgress !== 1 ? "s" : ""} already upscaling.`);
    else
      Toaster.toast.info("No videos to upscale.");
  }
  var CARD_SELECTOR = ".group\\/media-post-masonry-card";
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
      }).catch((e) => logger13.warn("Failed to pause video:", e));
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }
  var onMouseEnter = (e) => {
    const video = e.currentTarget.querySelector("video");
    if (video)
      pending.set(video, video.play().catch((e2) => logger13.error("Failed to play video", e2)));
  };
  var onMouseLeave = (e) => {
    const video = e.currentTarget.querySelector("video");
    if (video)
      pauseVideo(video);
  };
  function resolveItem(post) {
    if (!post?.id)
      return;
    return post;
  }
  function dedupeNames(names) {
    const counts = new Map;
    return names.map((name) => {
      const count = counts.get(name) ?? 0;
      counts.set(name, count + 1);
      if (!count)
        return name;
      const dot = name.lastIndexOf(".");
      return dot > 0 ? `${name.slice(0, dot)} (${count})${name.slice(dot)}` : `${name} (${count})`;
    });
  }
  async function downloadAllFavorites() {
    const { favoritesList } = MediaStore.useMediaStore.getState();
    const entries = [];
    for (const post of favoritesList) {
      const item = resolveItem(post);
      if (!item?.mediaUrl)
        continue;
      const ext = item.mediaUrl.split(".").pop()?.split("?")[0] ?? "jpg";
      entries.push({ url: item.mediaUrl, name: `${sanitizeFilename((item.prompt ?? "").slice(0, 60), "imagine")}.${ext}` });
    }
    if (!entries.length) {
      Toaster.toast.error("No favorites to download.");
      return;
    }
    if (entries.length === 1) {
      try {
        const res = await fetchExternal(entries[0].url);
        const blob2 = await res.blob();
        const a2 = document.createElement("a");
        a2.href = URL.createObjectURL(blob2);
        a2.download = entries[0].name;
        a2.click();
        URL.revokeObjectURL(a2.href);
        Toaster.toast.success("Downloaded 1 image.");
      } catch (e) {
        logger13.error("Failed to download image:", entries[0].url, e);
      }
      return;
    }
    const names = dedupeNames(entries.map((e) => e.name));
    const files = {};
    let done = 0;
    await Promise.all(entries.map(async (entry, i) => {
      try {
        const res = await fetchExternal(entry.url);
        const buf = await res.arrayBuffer();
        files[names[i]] = new Uint8Array(buf);
        done++;
      } catch (e) {
        logger13.error("Failed to fetch:", entry.url, e);
      }
    }));
    if (!done) {
      Toaster.toast.error("Failed to download any files.");
      return;
    }
    const blob = createZip(files);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "favorites.zip";
    a.click();
    URL.revokeObjectURL(a.href);
    Toaster.toast.success(`Downloaded ${done} file${done > 1 ? "s" : ""} as zip.`);
  }
  function useFavoritesPage() {
    return RoutingStore.useRoutingStore((s) => s.route.page) === PAGE_FAVORITES;
  }
  function DownloadAllButton() {
    const isFavorites = useFavoritesPage();
    const [loading, setLoading] = useState(false);
    const onClick = useCallback(async () => {
      setLoading(true);
      try {
        await downloadAllFavorites();
      } finally {
        setLoading(false);
      }
    }, []);
    if (!isFavorites)
      return null;
    return /* @__PURE__ */ React.createElement(ButtonWithTooltip, {
      tooltipContent: "Download all favorites",
      variant: "secondary",
      shape: "pill",
      size: "md",
      disabled: loading,
      onClick
    }, /* @__PURE__ */ React.createElement(DownloadIcon2, {
      size: "20"
    }), /* @__PURE__ */ React.createElement("span", {
      className: "font-semibold"
    }, loading ? "Downloading..." : "Download all"));
  }
  function getVisibleIds(favorites) {
    return filterItems(favorites).map((i) => i.id);
  }
  function ActionToolbar() {
    const isFavorites = useFavoritesPage();
    useExternalStore(selectionStore);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteAllOpen, setDeleteAllOpen] = useState(false);
    const [upscaleOpen, setUpscaleOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const favorites = MediaStore.useMediaStore((s) => s.favoritesList);
    const videoByMediaId = MediaStore.useMediaStore((s) => s.videoByMediaId);
    const count = selectedIds.size;
    const videoCount = useMemo(() => {
      const ids = count > 0 ? [...selectedIds] : getVisibleIds(favorites);
      return ids.filter((id) => videoByMediaId[id]?.length).length;
    }, [count, favorites, videoByMediaId]);
    useEffect(() => {
      if (!isFavorites && selectMode)
        clearSelection();
    }, [isFavorites]);
    const onDeleteSelected = useCallback(async () => {
      setBusy(true);
      try {
        await bulkDeletePosts([...selectedIds]);
      } finally {
        setBusy(false);
      }
    }, []);
    const onDeleteAll = useCallback(async () => {
      setBusy(true);
      try {
        await bulkDeletePosts(getVisibleIds(favorites));
      } finally {
        setBusy(false);
      }
    }, [favorites]);
    const onUpscale = useCallback(async () => {
      setBusy(true);
      const ids = count > 0 ? [...selectedIds] : getVisibleIds(favorites);
      try {
        await bulkUpscaleVideos(ids);
      } finally {
        setBusy(false);
      }
    }, [favorites, count]);
    const onSelectAll = useCallback(() => {
      for (const id of getVisibleIds(favorites))
        selectedIds.add(id);
      selectionStore.notify();
    }, [favorites]);
    if (!isFavorites)
      return null;
    return /* @__PURE__ */ React.createElement("div", {
      className: cl13("action-toolbar")
    }, /* @__PURE__ */ React.createElement(ButtonWithTooltip, {
      tooltipContent: selectMode ? "Exit select mode" : "Select items",
      variant: selectMode ? "primary" : "secondary",
      shape: "pill",
      size: "md",
      onClick: toggleSelectMode
    }, /* @__PURE__ */ React.createElement(SquareMousePointerIcon, {
      size: 18
    }), /* @__PURE__ */ React.createElement("span", {
      className: "font-semibold"
    }, selectMode ? "Cancel" : "Select")), selectMode && /* @__PURE__ */ React.createElement(ButtonWithTooltip, {
      tooltipContent: "Select all visible items",
      variant: "secondary",
      shape: "pill",
      size: "md",
      onClick: onSelectAll
    }, /* @__PURE__ */ React.createElement("span", {
      className: "font-semibold"
    }, "Select all")), /* @__PURE__ */ React.createElement(ButtonWithTooltip, {
      tooltipContent: videoCount > 0 ? `Upscale ${videoCount} video${videoCount !== 1 ? "s" : ""}` : "No videos to upscale",
      variant: "secondary",
      shape: "pill",
      size: "md",
      disabled: busy || videoCount === 0,
      onClick: () => setUpscaleOpen(true)
    }, /* @__PURE__ */ React.createElement(ScalingIcon, {
      size: 18
    }), /* @__PURE__ */ React.createElement("span", {
      className: "font-semibold"
    }, videoCount > 1 ? `Upscale ${videoCount}` : "Upscale")), selectMode && count > 0 ? /* @__PURE__ */ React.createElement(ButtonWithTooltip, {
      tooltipContent: `Delete ${count} selected`,
      variant: "danger",
      shape: "pill",
      size: "md",
      disabled: busy,
      onClick: () => setConfirmOpen(true)
    }, /* @__PURE__ */ React.createElement(TrashIcon, {
      size: 18
    }), /* @__PURE__ */ React.createElement("span", {
      className: "font-semibold"
    }, busy ? "Deleting..." : count > 1 ? `Delete ${count}` : "Delete")) : !selectMode && /* @__PURE__ */ React.createElement(ButtonWithTooltip, {
      tooltipContent: "Delete all visible items",
      variant: "secondary",
      shape: "pill",
      size: "md",
      disabled: busy,
      onClick: () => setDeleteAllOpen(true)
    }, /* @__PURE__ */ React.createElement(TrashIcon, {
      size: 18
    }), /* @__PURE__ */ React.createElement("span", {
      className: "font-semibold"
    }, busy ? "Deleting..." : "Delete all")), /* @__PURE__ */ React.createElement(ConfirmDialog, {
      open: confirmOpen,
      onOpenChange: setConfirmOpen,
      title: "Delete selected items",
      description: `Are you sure you want to permanently delete ${count} item${count !== 1 ? "s" : ""}? This cannot be undone.`,
      confirmText: `Delete ${count}`,
      danger: true,
      onConfirm: onDeleteSelected
    }), /* @__PURE__ */ React.createElement(ConfirmDialog, {
      open: deleteAllOpen,
      onOpenChange: setDeleteAllOpen,
      title: "Delete all items",
      description: "Are you sure you want to permanently delete all visible items? This cannot be undone.",
      confirmText: "Delete all",
      danger: true,
      onConfirm: onDeleteAll
    }), /* @__PURE__ */ React.createElement(ConfirmDialog, {
      open: upscaleOpen,
      onOpenChange: setUpscaleOpen,
      title: `Upscale ${videoCount} video${videoCount !== 1 ? "s" : ""}`,
      description: `This will start HD upscaling for ${videoCount} video${videoCount !== 1 ? "s" : ""}. Already upscaled videos will be skipped.`,
      confirmText: "Upscale",
      onConfirm: onUpscale
    }));
  }
  function SelectOverlay({ postId }) {
    const isFavorites = useFavoritesPage();
    const ref = useRef(null);
    useExternalStore(selectionStore);
    const isSelected = selectMode && selectedIds.has(postId);
    useEffect(() => {
      const card = ref.current?.closest(CARD_SELECTOR);
      if (!card)
        return;
      const selected = isFavorites && isSelected;
      card.classList.toggle(cl13("card-selected"), selected);
      return () => {
        card.classList.remove(cl13("card-selected"));
      };
    }, [isFavorites, isSelected]);
    useEffect(() => {
      if (!isFavorites)
        return;
      const card = ref.current?.closest(CARD_SELECTOR);
      if (!card)
        return;
      const handler2 = (e) => {
        if (selectMode) {
          e.preventDefault();
          e.stopPropagation();
          toggleSelected(postId);
          return;
        }
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          selectMode = true;
          selectedIds.add(postId);
          selectionStore.notify();
        }
      };
      card.addEventListener("click", handler2, { capture: true });
      return () => card.removeEventListener("click", handler2, { capture: true });
    }, [isFavorites, postId]);
    if (!isFavorites)
      return null;
    return /* @__PURE__ */ React.createElement("span", {
      ref,
      className: cl13("select-marker")
    });
  }
  function FilterButtons() {
    useExternalStore(filterStore);
    return /* @__PURE__ */ React.createElement(Fragment, null, /* @__PURE__ */ React.createElement(Select, {
      value: currentDate,
      onValueChange: (v) => setDate(v)
    }, /* @__PURE__ */ React.createElement(SelectTrigger, {
      className: cl13("date-select")
    }, /* @__PURE__ */ React.createElement(SelectValue, null)), /* @__PURE__ */ React.createElement(SelectContent, null, Object.keys(DATE_LABELS).map((d) => /* @__PURE__ */ React.createElement(SelectItem, {
      key: d,
      value: d
    }, DATE_LABELS[d])))), /* @__PURE__ */ React.createElement("input", {
      type: "text",
      placeholder: "Search...",
      value: currentSearch,
      onChange: (e) => setSearch(e.target.value),
      className: cl13("search")
    }), ["image", "video"].map((f) => /* @__PURE__ */ React.createElement("button", {
      key: f,
      className: classes(cl13("filter-btn"), currentFilter === f && cl13("filter-btn-active")),
      onClick: () => setFilter(currentFilter === f ? "all" : f)
    }, f === "image" ? "Images" : "Videos")));
  }
  function useFilteredFavorites() {
    const favorites = MediaStore.useMediaStore((s) => s.favoritesList);
    useExternalStore(filterStore);
    return filterItems(favorites);
  }
  function CardActions({ postId }) {
    const isFavorites = useFavoritesPage();
    const item = MediaStore.useMediaStore((s) => s.byId[postId]);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const onDownload = async () => {
      if (!item?.mediaUrl)
        return;
      try {
        const res = await fetchExternal(item.mediaUrl);
        const blob = await res.blob();
        const ext = item.mediaUrl.split(".").pop()?.split("?")[0] ?? "jpg";
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${sanitizeFilename((item.prompt ?? "").slice(0, 60), "imagine")}.${ext}`;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch (e) {
        logger13.error("Failed to download:", e);
      }
    };
    const onCopyPrompt = async () => {
      const prompt = item?.prompt ?? item?.originalPrompt;
      if (!prompt)
        return;
      await copyToClipboard(prompt);
      Toaster.toast.success("Copied prompt.");
    };
    const onUnfavorite = () => {
      MediaStore.useMediaStore.getState().unlike(postId);
    };
    const onDelete = () => {
      MediaStore.useMediaStore.getState().deletePost(postId, postId);
      Toaster.toast.success("Deleted.");
    };
    const hasPrompt = !!(item?.prompt || item?.originalPrompt);
    return /* @__PURE__ */ React.createElement(Fragment, null, hasPrompt && /* @__PURE__ */ React.createElement(ButtonWithTooltip, {
      tooltipContent: "Copy prompt",
      className: cl13("card-btn"),
      shape: "circle",
      size: "md",
      variant: "none",
      onClick: onCopyPrompt
    }, /* @__PURE__ */ React.createElement(CopyIcon2, {
      size: "16",
      className: "text-white"
    })), /* @__PURE__ */ React.createElement(ButtonWithTooltip, {
      tooltipContent: "Download",
      className: cl13("card-btn"),
      shape: "circle",
      size: "md",
      variant: "none",
      onClick: onDownload
    }, /* @__PURE__ */ React.createElement(DownloadIcon2, {
      size: "16",
      className: "text-white"
    })), isFavorites && /* @__PURE__ */ React.createElement(ButtonWithTooltip, {
      tooltipContent: "Unsave",
      className: cl13("card-btn"),
      shape: "circle",
      size: "md",
      variant: "none",
      onClick: onUnfavorite
    }, /* @__PURE__ */ React.createElement(HeartCrackIcon, {
      size: 16,
      className: "text-white"
    })), isFavorites && /* @__PURE__ */ React.createElement(ButtonWithTooltip, {
      tooltipContent: "Delete permanently",
      className: classes(cl13("card-btn"), cl13("card-btn-danger")),
      shape: "circle",
      size: "md",
      variant: "none",
      onClick: () => setConfirmDelete(true)
    }, /* @__PURE__ */ React.createElement(TrashIcon, {
      size: 16,
      className: "text-white"
    })), isFavorites && /* @__PURE__ */ React.createElement(ConfirmDialog, {
      open: confirmDelete,
      onOpenChange: setConfirmDelete,
      title: "Delete this item",
      description: "Are you sure you want to permanently delete this item? This cannot be undone.",
      confirmText: "Delete",
      danger: true,
      onConfirm: onDelete
    }));
  }
  var WrappedDownloadAll = ErrorBoundary.wrap(DownloadAllButton);
  var WrappedActionToolbar = ErrorBoundary.wrap(ActionToolbar);
  var WrappedFilterButtons = ErrorBoundary.wrap(FilterButtons);
  var WrappedCardActions = ErrorBoundary.wrap(CardActions);
  var WrappedSelectOverlay = ErrorBoundary.wrap(SelectOverlay);
  var betterImagine_default = definePlugin({
    name: "BetterImagine",
    description: "Quality of life improvements and features for the Imagine page.",
    authors: [Devs.Prism],
    settings: settings5,
    _hideDefault() {
      return settings5.store.hideDefaultPreviews;
    },
    _autoPlay() {
      return !settings5.store.noAutoplay;
    },
    _hoverProps() {
      if (!settings5.store.playOnHover)
        return {};
      return { onMouseEnter, onMouseLeave };
    },
    _renderDownloadAll: WrappedDownloadAll,
    _renderActionToolbar: WrappedActionToolbar,
    _renderFilterButtons: WrappedFilterButtons,
    _renderCardActions: WrappedCardActions,
    _renderSelectOverlay: WrappedSelectOverlay,
    _useFilteredFavorites() {
      return useFilteredFavorites();
    },
    patches: [
      {
        find: "image_feed_opened",
        group: true,
        replacement: [
          {
            match: /"default"===(\i)&&\(0,(\i)\.jsx\)\((\i),\{containerWidth:/,
            replace: '"default"===$1&&!$self._hideDefault()&&(0,$2.jsx)($3,{containerWidth:'
          },
          {
            match: /}\):\(0,(\i\.jsx)\)\((\i),\{containerRef:(\i),variant:(\i),/,
            replace: '}):(0,$1)($self._hideDefault()&&"favorites"!==$4?()=>null:$2,{containerRef:$3,variant:$4,'
          },
          {
            match: /"imagine-upload-image-button.label","Upload image"\)}\)]\}\)/,
            replace: "$&,$self._renderActionToolbar({}),$self._renderDownloadAll({})"
          },
          {
            match: /(\i)=\(0,(\i)\.useMediaStore\)\(\i=>\i\.favoritesList\),(\i)=\(0,\2\.useMediaStore\)\(\i=>\i\.list\)/,
            replace: "$1=$self._useFilteredFavorites(),$3=(0,$2.useMediaStore)(e=>e.list)"
          },
          {
            match: /muted:!0,autoPlay:!0/,
            replace: "muted:!0,autoPlay:$self._autoPlay()"
          },
          {
            match: /onMouseOver:\i\?\(\)=>\i\(!0\):void 0,onMouseLeave:\i\?\(\)=>\i\(!1\):void 0/,
            replace: "$&,...$self._hoverProps()"
          },
          {
            match: /children:\(0,(\i)\.jsx\)\((\i),\{postId:(\i),mediaType:(\i),onOpenChange:(\i)\}\)\}\)/,
            replace: "children:[$self._renderSelectOverlay({postId:$3}),(0,$1.jsx)($2,{postId:$3,mediaType:$4,onOpenChange:$5}),$self._renderCardActions({postId:$3})]})"
          },
          {
            match: /children:(\(0,\i\.jsx\)\(\i,\{isLiked:\i,postId:(\i),isImageEdit:\i,forceVisible:\i\}\))\}\)/,
            replace: "children:[$self._renderSelectOverlay({postId:$2}),$1,$self._renderCardActions({postId:$2})]})"
          },
          {
            match: /children:(\(0,\i\.jsx\)\(\i,\{isLiked:\i,postId:(\i),isImageEdit:\i,forceVisible:\i\}\))\}\)/,
            replace: "children:[$self._renderSelectOverlay({postId:$2}),$1,$self._renderCardActions({postId:$2})]})"
          }
        ]
      },
      {
        find: 'imagine-folder.all","All"',
        replacement: {
          match: /"imagine-folder.all","All"\)}\)]\}\)/,
          replace: "$&,$self._renderFilterButtons({})"
        }
      }
    ]
  });

  // void-css:D:/Projects/Void/src/plugins/betterSidebar/styles.css
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
    background-color: var(--button-ghost-hover);
}

.void-sidebar-card button[data-state] {
    pointer-events: none;
    background-color: transparent !important;
}

.void-sidebar-info {
    min-width: 0;
    overflow: hidden;
}

.void-sidebar-name,
.void-sidebar-plan {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
`);

  // src/plugins/betterSidebar/index.tsx
  var cl14 = classNameFactory("void-sidebar-");
  var settings6 = definePluginSettings({
    clickToToggle: {
      type: 3 /* BOOLEAN */,
      description: "Click anywhere on the sidebar to toggle it.",
      default: true
    },
    defaultCollapsed: {
      type: 3 /* BOOLEAN */,
      description: "Start with the sidebar collapsed on page load.",
      default: false
    }
  });
  var PLAN_NAMES = {
    SUBSCRIPTION_TIER_GROK_PRO: "SuperGrok",
    SUBSCRIPTION_TIER_SUPER_GROK_PRO: "SuperGrok Pro"
  };
  function getPlanName(bestSubscription) {
    if (!bestSubscription)
      return "Free";
    return PLAN_NAMES[bestSubscription] ?? "Free";
  }
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
      className: cl14("card"),
      onPointerDown: (e) => forward(e, "pointerdown"),
      onPointerUp: (e) => forward(e, "pointerup")
    }, /* @__PURE__ */ React.createElement(AvatarMenu, null), /* @__PURE__ */ React.createElement(Flex, {
      flexDirection: "column",
      justifyContent: "center",
      gap: "0",
      className: cl14("info")
    }, /* @__PURE__ */ React.createElement(Text, {
      as: "span",
      size: "sm",
      weight: "medium",
      className: cl14("name")
    }, user.givenName || user.email?.split("@")[0] || "User"), /* @__PURE__ */ React.createElement(Text, {
      as: "span",
      size: "xs",
      color: "secondary",
      className: cl14("plan")
    }, getPlanName(bestSubscription))));
  }
  var betterSidebar_default = definePlugin({
    name: "BetterSidebar",
    description: "Various sidebar improvements.",
    authors: [Devs.Prism],
    settings: settings6,
    _UserCard: ErrorBoundary.wrap(UserCard),
    _defaultOpen() {
      return !settings6.store.defaultCollapsed;
    },
    _onSidebarClick() {
      if (!settings6.store.clickToToggle)
        return;
      return (e) => {
        const target = e.target;
        if (target.closest("button,a,input,[role=button],[data-sidebar=trigger]"))
          return;
        e.currentTarget.closest("[data-state]")?.querySelector("[data-sidebar=trigger]")?.click();
      };
    },
    patches: [
      {
        find: "AvatarDropdownMenu,{}),",
        group: true,
        replacement: [
          {
            match: /\(0,(\i)\.jsx\)\((\i)\.AvatarDropdownMenu,\{\}\)/,
            replace: "(0,$1.jsx)($self._UserCard,{AvatarMenu:$2.AvatarDropdownMenu})"
          },
          {
            match: /className:"min-w-0 flex-1",children:\(0,\i\.jsx\)\(\i,\{\}\)\},"sidebar-footer-details"/,
            replace: 'className:"hidden",children:null},"sidebar-footer-details"'
          }
        ]
      },
      {
        find: "useSidebar must be used within a SidebarProvider",
        all: true,
        group: true,
        replacement: [
          {
            match: /defaultOpen:\i=!0/,
            replace: "defaultOpen:_=$self._defaultOpen()"
          },
          {
            match: /data-sidebar":"sidebar",className:/,
            replace: 'data-sidebar":"sidebar",onClick:$self._onSidebarClick(),className:'
          }
        ]
      }
    ]
  });

  // src/plugins/cleaner/index.ts
  var settings7 = definePluginSettings({
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
      description: "Hide upgrade prompts and locked modes in the model selector.",
      default: true
    }
  });
  var cleaner_default = definePlugin({
    name: "Cleaner",
    description: "Hides upgrade nags and upsell banners.",
    authors: [Devs.Prism],
    settings: settings7,
    patches: [
      {
        find: '"user-dropdown.upgrade","Upgrade plan"',
        all: true,
        replacement: {
          match: /(\i(?:\|\|\i)+)(?=\?null:.{0,160}"user-dropdown\.upgrade")/,
          replace: "$self.settings.store.hideUpgradePlan||$1"
        }
      },
      {
        find: '"UpsellCard",()=>',
        all: true,
        replacement: {
          match: /"UpsellCard",\(\)=>(\i)/,
          replace: '"UpsellCard",()=>$self.settings.store.hideUpsellCard?()=>null:$1'
        }
      },
      {
        find: '"UpsellSuperGrokSmall",()=>',
        all: true,
        replacement: {
          match: /"UpsellSuperGrokSmall",\(\)=>(\i)/,
          replace: '"UpsellSuperGrokSmall",()=>$self.settings.store.hideUpsellSmall?()=>null:$1'
        }
      },
      {
        find: '"UpsellButton",()=>',
        replacement: {
          match: /"UpsellButton",\(\)=>(\i)/,
          replace: '"UpsellButton",()=>$self.settings.store.hideUpsellSmall?()=>null:$1'
        }
      },
      {
        find: "mode-select.search-placeholder",
        all: true,
        group: true,
        replacement: [
          {
            match: /(?<=useCheckSubscriptionOffer\)\(\);)(.{0,30}return null;)/,
            replace: "if($self.settings.store.hideModelUpsell)return null;$1"
          },
          {
            match: /(\i)(\.map\(\i=>\(0,\i\.jsx\).{0,60}"text-secondary opacity-75)/,
            replace: "($self.settings.store.hideModelUpsell?[]:$1)$2"
          }
        ]
      }
    ]
  });

  // src/plugins/consoleJanitor/index.ts
  var consoleJanitor_default = definePlugin({
    name: "ConsoleJanitor",
    description: "Silences noisy warnings and info logs in the browser console.",
    authors: [Devs.Prism],
    patches: [
      {
        find: "x.ai/careers",
        replacement: {
          match: /console\.info\("[^"]{0,2000}"\)/,
          replace: "void 0"
        }
      },
      {
        find: "DialogDescriptionWarning",
        all: true,
        replacement: {
          match: /console\.warn\(\i\)/,
          replace: "void 0"
        }
      },
      {
        find: "pressure_observer",
        replacement: {
          match: /"PressureObserver"in window/,
          replace: "false"
        }
      },
      {
        find: "NO_I18NEXT_INSTANCE",
        all: true,
        replacement: {
          match: /console\.warn\(\.\.\.\i\)/,
          replace: "void 0"
        }
      }
    ]
  });

  // void-css:D:/Projects/Void/src/plugins/exportChat/styles.css
  registerStyle("exportChat", `.void-export-icon {
    margin-inline-end: 0.5rem;
}
`);

  // src/plugins/exportChat/index.tsx
  var logger14 = new Logger("ExportChat");
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
  async function exportChat(conversationId) {
    const { responses } = await ApiClients.chatApi.chatListResponses({ conversationId }) ?? {};
    if (!responses?.length)
      return;
    const conversation = ConversationStore.useConversationStore.getState().byId[conversationId];
    const title = conversation?.title ?? "Untitled Chat";
    await FileUtils.downloadBlob(new Blob([JSON.stringify({ conversationId, title, exportedAt: new Date().toISOString(), messages: responses.map(buildExportMessage) }, null, 2)], { type: "application/json" }), `${sanitizeFilename(title, "chat")}.json`);
  }
  function ExportItem({ conversationId }) {
    const streaming = ChatPageStore.useChatPageStore((s) => s.conversationId === conversationId && !!s.streamedMessageId);
    return /* @__PURE__ */ React.createElement(DropdownMenuItem, {
      onSelect: () => exportChat(conversationId).catch((e) => logger14.error("Failed to export chat", e)),
      disabled: streaming
    }, /* @__PURE__ */ React.createElement(DownloadIcon, {
      size: 16,
      className: "void-export-icon"
    }), "Export");
  }
  var exportChat_default = definePlugin({
    name: "ExportChat",
    description: "Export conversations as JSON from the right-click menu.",
    authors: [Devs.Prism],
    contextMenuItems: {
      conversation: {
        label: "Export",
        render: ErrorBoundary.wrap(ExportItem)
      }
    }
  });

  // void-css:D:/Projects/Void/src/plugins/messageTimestamps/styles.css
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
  var settings8 = definePluginSettings({
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
    description: "Shows timestamps on chat messages.",
    authors: [Devs.Prism],
    settings: settings8,
    _renderTimestamp(response) {
      try {
        if (!response?.createTime)
          return null;
        if (settings8.store.hideOwnMessages && response.sender === "human")
          return null;
        return /* @__PURE__ */ React.createElement(Text, {
          as: "span",
          size: "xs",
          color: "muted",
          className: "void-timestamp"
        }, formatTimestamp(response.createTime, settings8.store.showDate));
      } catch {
        return null;
      }
    },
    patches: [
      {
        find: 'displayName="ResponseFamily"',
        replacement: {
          match: /(\i)\.parentQuotedText(.{0,10})\(0,(\i)\.jsx\)\((\i)\.MessageBubble/,
          replace: "$1.parentQuotedText$2$self._renderTimestamp($1),(0,$3.jsx)($4.MessageBubble"
        }
      }
    ]
  });

  // src/plugins/oneko/index.ts
  var logger15 = new Logger("Oneko");
  var ONEKO_SCRIPT = "https://raw.githubusercontent.com/adryd325/oneko.js/c4ee66353b11a44e4a5b7e914a81f8d33111555e/oneko.js";
  var ONEKO_GIF = "https://raw.githubusercontent.com/adryd325/oneko.js/14bab15a755d0e35cd4ae19c931d96d306f99f42/oneko.gif";
  var stopped = false;
  var oneko_default = definePlugin({
    name: "Oneko",
    description: "Cat follows your mouse cursor.",
    authors: [Devs.adryd],
    cleanupSelectors: ["#oneko"],
    start() {
      stopped = false;
      fetchExternal(ONEKO_SCRIPT).then((r) => r.text()).then((s) => s.replace("./oneko.gif", ONEKO_GIF).replace("(isReducedMotion)", "(false)")).then((s) => {
        if (stopped)
          return;
        const blob = new Blob([s], { type: "text/javascript" });
        const el = document.createElement("script");
        el.src = URL.createObjectURL(blob);
        document.head.appendChild(el);
        el.addEventListener("load", () => {
          el.remove();
          URL.revokeObjectURL(el.src);
        });
      }).catch((e) => logger15.error("Failed to load oneko script", e));
    },
    stop() {
      stopped = true;
    }
  });

  // void-css:D:/Projects/Void/src/plugins/queryTracker/styles.css
  registerStyle("queryTracker", `.void-query-tracker-chip-wrapper {
    display: inline-flex;
    vertical-align: middle;
    margin-left: 0.375rem;
}
`);

  // src/plugins/queryTracker/index.tsx
  var cl15 = classNameFactory("void-query-tracker-");
  var logger16 = new Logger("QueryTracker");
  var STORAGE_KEY3 = "void-query-tracker";
  var REFETCH_COOLDOWN = 5 * 60000;
  var trackedModels = {};
  var lastFetchTime = 0;
  var store4 = createExternalStore();
  function formatWindow(seconds) {
    const hours = seconds / 3600;
    if (hours >= 1)
      return `${hours}h`;
    return `${Math.round(seconds / 60)}m`;
  }
  function getEffectiveQueries(quota) {
    if (quota.totalTokens && quota.highEffortQueries)
      return quota.highEffortQueries;
    return quota.totalQueries;
  }
  function parseQuota(res) {
    return {
      totalQueries: res.totalQueries,
      totalTokens: res.totalTokens,
      windowSizeSeconds: res.windowSizeSeconds,
      lowEffortQueries: res.lowEffortRateLimits && res.totalTokens ? Math.floor(res.totalTokens / res.lowEffortRateLimits.cost) : undefined,
      highEffortQueries: res.highEffortRateLimits && res.totalTokens ? Math.floor(res.totalTokens / res.highEffortRateLimits.cost) : undefined
    };
  }
  async function fetchRateLimit(modelName, requestKind = "DEFAULT") {
    try {
      return await ApiClients.rateLimitsApi.rateLimitsGetRateLimits({ body: { modelName, requestKind } });
    } catch (e) {
      logger16.warn("Failed to fetch rate limit for", modelName, e);
      return null;
    }
  }
  function loadPreviousSnapshot() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY3);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
  function saveSnapshot(snapshot) {
    try {
      localStorage.setItem(STORAGE_KEY3, JSON.stringify(snapshot));
    } catch (e) {
      logger16.warn("Failed to save snapshot:", e);
    }
  }
  function diffSnapshots(prev, curr) {
    for (const id of Object.keys(curr)) {
      if (!prev[id]) {
        Toaster.toast.info(`New model: ${curr[id].model.name}`);
        continue;
      }
      const pq = prev[id].quota;
      const cq = curr[id].quota;
      if (!pq || !cq)
        continue;
      const pEff = getEffectiveQueries(pq);
      const cEff = getEffectiveQueries(cq);
      if (pEff !== cEff || pq.windowSizeSeconds !== cq.windowSizeSeconds) {
        Toaster.toast.info(`${curr[id].model.name} quota: ${pEff}/${formatWindow(pq.windowSizeSeconds)} → ${cEff}/${formatWindow(cq.windowSizeSeconds)}`);
      }
    }
    for (const id of Object.keys(prev)) {
      if (!curr[id])
        Toaster.toast.info(`Model removed: ${prev[id].model.name}`);
    }
  }
  async function fetchAllModels() {
    const now = Date.now();
    if (now - lastFetchTime < REFETCH_COOLDOWN)
      return;
    lastFetchTime = now;
    try {
      const res = await ApiClients.modelsApi.modelsGetModels({ body: { locale: "en" } });
      const allModels = [...res.models ?? [], ...res.unavailableModels ?? []];
      const prev = loadPreviousSnapshot();
      const next = {};
      const quotas = await Promise.all(allModels.map((m) => fetchRateLimit(m.modelId)));
      for (let i = 0;i < allModels.length; i++) {
        const m = allModels[i];
        next[m.modelId] = {
          model: {
            modelId: m.modelId,
            name: m.name ?? m.modelId,
            description: m.description,
            modelMode: m.modelMode,
            promptingBackend: m.promptingBackend,
            tags: m.tags
          },
          quota: quotas[i] ? parseQuota(quotas[i]) : null
        };
      }
      if (Object.keys(prev).length > 0)
        diffSnapshots(prev, next);
      trackedModels = next;
      saveSnapshot(next);
      store4.notify();
    } catch (e) {
      logger16.error("Failed to fetch models:", e);
    }
  }
  function onVisibilityChange() {
    if (document.visibilityState === "visible")
      fetchAllModels();
  }
  var MODE_TO_CONFIG = {
    fast: "MODEL_MODE_FAST",
    expert: "MODEL_MODE_EXPERT",
    heavy: "MODEL_MODE_HEAVY",
    auto: "MODEL_MODE_AUTO",
    "grok-4-mini-thinking": "MODEL_MODE_GROK_4_MINI_THINKING",
    "grok-4-1": "MODEL_MODE_GROK_4_1",
    "grok-4-1-thinking": "MODEL_MODE_GROK_4_1_THINKING",
    "grok-4-1-nightly": "MODEL_MODE_GROK_4_1_NIGHTLY",
    "grok-420": "MODEL_MODE_GROK_420"
  };
  function resolveTracked(id) {
    const configMode = MODE_TO_CONFIG[id];
    if (configMode)
      return Object.values(trackedModels).find((t) => t.model.modelMode === configMode);
    return trackedModels[id] ?? Object.values(trackedModels).find((t) => t.model.modelId === id);
  }
  function QuotaChip({ modelId }) {
    useExternalStore(store4);
    const tracked = resolveTracked(modelId);
    if (!tracked?.quota)
      return null;
    if (tracked.model.modelMode === "MODEL_MODE_AUTO")
      return null;
    const eff = getEffectiveQueries(tracked.quota);
    if (!eff)
      return null;
    return /* @__PURE__ */ React.createElement(Tooltip, null, /* @__PURE__ */ React.createElement(TooltipTrigger, {
      asChild: true
    }, /* @__PURE__ */ React.createElement("div", {
      className: cl15("chip-wrapper")
    }, /* @__PURE__ */ React.createElement(Chip, null, eff, "/", formatWindow(tracked.quota.windowSizeSeconds)))), /* @__PURE__ */ React.createElement(TooltipContent, null, /* @__PURE__ */ React.createElement("div", null, eff, " queries / ", formatWindow(tracked.quota.windowSizeSeconds)), !!tracked.quota.totalTokens && /* @__PURE__ */ React.createElement("div", null, "Token budget: ", tracked.quota.totalTokens), !!tracked.quota.lowEffortQueries && /* @__PURE__ */ React.createElement("div", null, "Fast: ", tracked.quota.lowEffortQueries, " queries"), !!tracked.quota.highEffortQueries && /* @__PURE__ */ React.createElement("div", null, "Expert: ", tracked.quota.highEffortQueries, " queries")));
  }
  var queryTracker_default = definePlugin({
    name: "QueryTracker",
    description: "Show query quotas in the model selector and notify on changes.",
    authors: [Devs.Prism],
    startAt: "TurbopackReady" /* TurbopackReady */,
    start() {
      fetchAllModels();
      document.addEventListener("visibilitychange", onVisibilityChange);
    },
    stop() {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      trackedModels = {};
      lastFetchTime = 0;
    },
    _renderQuotaChip: ErrorBoundary.wrap(QuotaChip),
    patches: [
      {
        find: "model-mode-select-upsell",
        replacement: {
          match: /label:(\i)\.prettyModeName/,
          replace: "label:[$1.prettyModeName,$self._renderQuotaChip({modelId:$1.mode})]"
        }
      },
      {
        find: "mode-select.search-placeholder",
        all: true,
        replacement: {
          match: /"font-semibold text-sm",children:null!=\((\i)=(\i)\.title\)\?\1:""\}/,
          replace: '"font-semibold text-sm",children:[null!=($1=$2.title)?$1:"",$self._renderQuotaChip({modelId:$2.id})]}'
        }
      }
    ]
  });

  // src/plugins/starry/index.ts
  var starry_default = definePlugin({
    name: "Starry",
    description: "Enables Grok's native starry idle background with shooting stars.",
    authors: [Devs.Prism],
    patches: [
      {
        find: "inactivityDelay:1e4,fadeInDuration:1e4",
        replacement: [
          {
            match: /\i\.SHOW_STARRY_IDLE&&!\i&&\i&&"main"===\i\.page&&/,
            replace: "true&&"
          },
          {
            match: /inactivityDelay:1e4,fadeInDuration:1e4/,
            replace: "inactivityDelay:0,fadeInDuration:0"
          }
        ]
      }
    ]
  });

  // virtual:~plugins
  fixChrome_default.chrome = true;
  fixChrome_default.hidden = !window.chrome;
  var __plugins_default = { [fixChrome_default.name]: fixChrome_default, [noTelemetry_default.name]: noTelemetry_default, [settings_default.name]: settings_default, [chatBarButtons_default.name]: chatBarButtons_default, [contextMenu_default.name]: contextMenu_default, [betterFiles_default.name]: betterFiles_default, [betterImagine_default.name]: betterImagine_default, [betterSidebar_default.name]: betterSidebar_default, [cleaner_default.name]: cleaner_default, [consoleJanitor_default.name]: consoleJanitor_default, [experiments_default.name]: experiments_default, [exportChat_default.name]: exportChat_default, [messageTimestamps_default.name]: messageTimestamps_default, [oneko_default.name]: oneko_default, [queryTracker_default.name]: queryTracker_default, [starry_default.name]: starry_default };
  // src/turbopack/common/index.ts
  var exports_common = {};
  __export(exports_common, {
    zustandCreate: () => zustandCreate,
    useTransition: () => useTransition,
    useSyncExternalStore: () => useSyncExternalStore,
    useState: () => useState,
    useRef: () => useRef,
    useReducer: () => useReducer,
    useReducedMotion: () => useReducedMotion,
    useMemo: () => useMemo,
    useLayoutEffect: () => useLayoutEffect,
    useId: () => useId,
    useEffect: () => useEffect,
    useDeferredValue: () => useDeferredValue,
    useContext: () => useContext,
    useCallback: () => useCallback,
    onceReady: () => onceReady,
    i18n: () => i18n,
    createElement: () => createElement,
    WorkspaceStore: () => WorkspaceStore,
    WorkspaceConnectorsStore: () => WorkspaceConnectorsStore,
    WorkspaceCollectionsStore: () => WorkspaceCollectionsStore,
    UpsellStore: () => UpsellStore,
    TourGuideStore: () => TourGuideStore,
    TooltipTrigger: () => TooltipTrigger,
    TooltipContent: () => TooltipContent,
    Tooltip: () => Tooltip,
    Toaster: () => Toaster,
    Textarea: () => Textarea,
    TextToSpeechStore: () => TextToSpeechStore,
    TasksStore: () => TasksStore,
    TanStackQuery: () => TanStackQuery,
    TabsTrigger: () => TabsTrigger,
    TabsManagerStore: () => TabsManagerStore,
    TabsList: () => TabsList,
    TabsContent: () => TabsContent,
    Tabs: () => Tabs,
    Switch: () => Switch,
    SuggestionStore: () => SuggestionStore,
    SubscriptionsStore: () => SubscriptionsStore,
    Spinner: () => Spinner,
    SourcesSelectorStore: () => SourcesSelectorStore,
    Slider: () => Slider,
    Skeleton: () => Skeleton,
    SidebarComponents: () => SidebarComponents,
    ShopStore: () => ShopStore,
    ShareStore: () => ShareStore,
    SettingsTitle: () => SettingsTitle,
    SettingsStore: () => SettingsStore,
    SettingsRow: () => SettingsRow,
    SettingsDialogStore: () => SettingsDialogStore,
    SettingsDescription: () => SettingsDescription,
    SessionStore: () => SessionStore,
    Separator: () => Separator,
    SelectValue: () => SelectValue,
    SelectTrigger: () => SelectTrigger,
    SelectItem: () => SelectItem,
    SelectContent: () => SelectContent,
    Select: () => Select,
    RoutingStore: () => RoutingStore,
    ResponsiveDialog: () => ResponsiveDialog,
    ResponseStore: () => ResponseStore,
    ReportStore: () => ReportStore,
    ReasoningModeUtils: () => ReasoningModeUtils,
    ReactDOM: () => ReactDOM,
    React: () => React,
    RateLimitUtils: () => RateLimitUtils,
    PopoverTrigger: () => PopoverTrigger,
    PopoverContent: () => PopoverContent,
    PopoverArrow: () => PopoverArrow,
    Popover: () => Popover,
    PersonalityStore: () => PersonalityStore,
    NotificationsStore: () => NotificationsStore,
    NextRouter: () => NextRouter,
    MotionDiv: () => MotionDiv,
    MonacoModule: () => MonacoModule,
    ModesStore: () => ModesStore,
    ModelsStore: () => ModelsStore,
    MentionMenuStore: () => MentionMenuStore,
    MediaStore: () => MediaStore,
    LazyComponent: () => LazyComponent,
    Input: () => Input,
    ImageEditorStore: () => ImageEditorStore,
    HighlightsStore: () => HighlightsStore,
    Fragment: () => Fragment,
    FilesPageStore: () => FilesPageStore,
    FileUtils: () => FileUtils,
    FileStore: () => FileStore,
    FeatureStore: () => FeatureStore,
    EnvUtils: () => EnvUtils,
    DropdownMenuTrigger: () => DropdownMenuTrigger,
    DropdownMenuSubTrigger: () => DropdownMenuSubTrigger,
    DropdownMenuSubContent: () => DropdownMenuSubContent,
    DropdownMenuSub: () => DropdownMenuSub,
    DropdownMenuSeparator: () => DropdownMenuSeparator,
    DropdownMenuRadioItem: () => DropdownMenuRadioItem,
    DropdownMenuRadioGroup: () => DropdownMenuRadioGroup,
    DropdownMenuItem: () => DropdownMenuItem,
    DropdownMenuContent: () => DropdownMenuContent,
    DropdownMenuCheckboxItem: () => DropdownMenuCheckboxItem,
    DropdownMenu: () => DropdownMenu,
    DownloadUtils: () => DownloadUtils,
    DictationStore: () => DictationStore,
    DialogTitle: () => DialogTitle,
    DialogHeader: () => DialogHeader,
    DialogFooter: () => DialogFooter,
    DialogDescription: () => DialogDescription,
    DialogContent: () => DialogContent,
    DialogClose: () => DialogClose,
    Dialog: () => Dialog,
    DevModelsStore: () => DevModelsStore,
    CopyUtils: () => CopyUtils,
    ConversationStore: () => ConversationStore,
    CommandMenuStore: () => CommandMenuStore,
    CommandList: () => CommandList,
    CommandItem: () => CommandItem,
    CommandInput: () => CommandInput,
    CommandGroup: () => CommandGroup,
    CommandEmpty: () => CommandEmpty,
    Command: () => Command,
    CodePageStore: () => CodePageStore,
    ClassNames: () => ClassNames,
    Checkbox: () => Checkbox,
    ChatPageStore: () => ChatPageStore,
    Card: () => Card,
    ButtonWithTooltip: () => ButtonWithTooltip,
    Button: () => Button,
    Avatar: () => Avatar,
    AssetUtils: () => AssetUtils,
    AssetStore: () => AssetStore,
    ApiClients: () => ApiClients,
    AnimatePresence: () => AnimatePresence,
    AccordionTrigger: () => AccordionTrigger,
    AccordionItem: () => AccordionItem,
    AccordionContent: () => AccordionContent,
    Accordion: () => Accordion
  });

  // src/Void.ts
  var logger17 = new Logger("TurbopackPatcher", "#e78284");
  var FALLBACK_MS = 15000;
  var RETRY_TIMEOUT_MS = 15000;
  var ORPHAN_REPORT_DELAY_MS = 5000;
  function deferOrphanReport() {
    const hasNonGlobal = patches.some((p) => !p.all);
    if (!hasNonGlobal)
      return;
    const unsub = onModuleLoad(() => {
      if (!patches.some((p) => !p.all)) {
        unsub();
        clearTimeout(timeout);
      }
    });
    const timeout = setTimeout(() => {
      unsub();
      reportOrphanedPatches();
    }, ORPHAN_REPORT_DELAY_MS);
  }
  function retryFailedPlugins() {
    const getFailed = () => Object.values(plugins).filter((p) => !p.started && isPluginEnabled(p.name) && (p.startAt ?? "Init" /* Init */) === "TurbopackReady" /* TurbopackReady */);
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
          logger17.info("All previously failed plugins started after late module load");
        }
      }, 200);
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
        logger17.warn(`${stillFailed.length} plugin(s) still failed after retry window: ${stillFailed.map((p) => p.name).join(", ")}`);
      }
    }, RETRY_TIMEOUT_MS);
  }
  function waitForModulesStable() {
    const fire = onlyOnce(() => {
      if (cancelWaitFor)
        cancelWaitFor();
      clearTimeout(fallbackTimer);
      rescanRuntimeModules();
      blacklistBadModules();
      _resolveReady();
      startAllPlugins("TurbopackReady" /* TurbopackReady */);
      logger17.info(`${getModuleCache().size} modules loaded, ready`);
      retryFailedPlugins();
      deferOrphanReport();
      checkForUpdates();
    });
    const cancelWaitFor = waitFor(filters.byProps("useRoutingStore", "formatUrl"), fire);
    const fallbackTimer = setTimeout(fire, FALLBACK_MS);
  }
  function init() {
    for (const name in __plugins_default) {
      registerPlugin(__plugins_default[name]);
    }
    initPluginManager();
    patchTurbopack();
    startAllPlugins("Init" /* Init */);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => startAllPlugins("DOMContentLoaded" /* DOMContentLoaded */), { once: true });
    } else {
      startAllPlugins("DOMContentLoaded" /* DOMContentLoaded */);
    }
    waitForModulesStable();
  }

  // src/index.ts
  var target = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
  if (!target.Void) {
    Object.defineProperty(target, "Void", {
      value: exports_Void,
      writable: false,
      configurable: true
    });
    initSettings().then(() => init());
  }
})();
