// Browser half: a "Brave Search" card in Settings -> Plugins.
//
// The card edits only the API key. The literal never reaches the browser: the card
// asks the credentials domain whether BRAVE_API_KEY is configured and writes or
// clears it there ($DSH_HOME/.credentials.yaml), which is where the host half
// resolves the key on every search, so a new key applies without a restart.
//
// Hand-written in the Module Loader shape the host expects (no build step); react
// and react/jsx-runtime resolve through the host's module table.
window.__ModuleLoader__.load({ id: "@deads-inc/dsh-web-search-brave", factory: (require) => {
  var module = { exports: {} };
  var exports = module.exports;
  Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

  const React = require("react");
  const h = React.createElement;

  /** Settings namespace the host half registers; the slot key must match it. */
  const NS = "web-search-brave";
  /** Credential reference the host half resolves (its `apiKeyEnv` default). */
  const KEY_REF = "BRAVE_API_KEY";
  const LOCALE_NS = "web-search-brave";

  const en = {
    title: "Brave Search",
    description: "Web search provider for the web_search tool.",
    apiKey: "API key",
    hint: "Stored outside the settings file. Leave blank to keep the current key.",
    set: "A key is configured.",
    unset: "No key is configured; web search fails until one is.",
    save: "Save",
    saving: "Saving…",
    remove: "Remove key",
    failed: "The key could not be saved.",
    readOnly: "This deployment stores credentials read-only.",
  };
  const zh = {
    title: "Brave 搜索",
    description: "web_search 工具的网页搜索服务。",
    apiKey: "API 密钥",
    hint: "存储在设置文件之外。留空则保留当前密钥。",
    set: "已配置密钥。",
    unset: "未配置密钥；配置前网页搜索不可用。",
    save: "保存",
    saving: "保存中…",
    remove: "移除密钥",
    failed: "密钥保存失败。",
    readOnly: "此部署的凭据为只读。",
  };

  const CSS = `
.dwsb-card{border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-3);border-radius:16px;list-style:none;transition:border-color .16s,background .16s}
.dwsb-card:hover{border-color:var(--dsw-alias-label-dimmed)}
.dwsb-open{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}
.dwsb-header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}
.dwsb-header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.dwsb-headText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}
.dwsb-name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}
.dwsb-desc,.dwsb-hint{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5;margin:0}
.dwsb-hint{font-size:12px}
.dwsb-chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}
.dwsb-chevronOpen{transform:rotate(180deg)}
.dwsb-body{border-top:.5px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}
.dwsb-field{flex-direction:column;gap:6px;padding:12px 0;display:flex}
.dwsb-label{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5}
.dwsb-state{font-size:12px;color:var(--dsw-alias-label-secondary)}
.dwsb-input{border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}
.dwsb-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.dwsb-footer{border-top:.5px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px;display:flex}
.dwsb-failed{min-width:0;color:var(--dsw-alias-label-error);flex:1;margin:0;font-size:12px;line-height:1.5}
.dwsb-btn{appearance:none;font:inherit;cursor:pointer;border:1px solid #0000;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}
.dwsb-secondary{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0}
.dwsb-primary{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}
.dwsb-btn:disabled{opacity:.4;cursor:default}
`;

  function installCss() {
    if (typeof document === "undefined") return;
    if (document.querySelector('style[data-plugin-css="@deads-inc/dsh-web-search-brave"]') !== null) return;
    const tag = document.createElement("style");
    tag.dataset.plugin = "@deads-inc/dsh-web-search-brave";
    tag.dataset.pluginCss = "@deads-inc/dsh-web-search-brave";
    tag.textContent = CSS;
    document.head.appendChild(tag);
  }

  /** Tiny external store for the credential state (configured / writable). */
  function createKeyStore(credentials) {
    let state = { configured: false, writable: true, loaded: false };
    const listeners = new Set();
    const publish = (next) => {
      state = next;
      for (const listener of listeners) listener();
    };
    const read = async () => {
      const response = await credentials.describe([KEY_REF]);
      if (!response.ok) return;
      const view = response.value[KEY_REF];
      publish({ configured: view?.configured ?? false, writable: view?.writable ?? true, loaded: true });
    };
    return {
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getSnapshot: () => state,
      read,
      save: async (value) => {
        const response = await credentials.set(KEY_REF, value);
        await read();
        return response.ok !== false;
      },
      remove: async () => {
        const response = await credentials.unset(KEY_REF);
        await read();
        return response.ok !== false;
      },
    };
  }

  function BraveCard(props) {
    const { t, store } = props;
    const state = React.useSyncExternalStore(store.subscribe, store.getSnapshot);
    const [open, setOpen] = React.useState(false);
    const [draft, setDraft] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [failed, setFailed] = React.useState(false);
    const disabled = busy || !state.writable;

    const run = async (action) => {
      setBusy(true);
      setFailed(false);
      try {
        if (!(await action())) setFailed(true);
        else setDraft("");
      } catch {
        setFailed(true);
      } finally {
        setBusy(false);
      }
    };

    return h("li", { className: "dwsb-card" + (open ? " dwsb-open" : "") },
      h("button", { type: "button", className: "dwsb-header", "aria-expanded": open, onClick: () => setOpen(!open) },
        h("span", { className: "dwsb-headText" },
          h("span", { className: "dwsb-name" }, t("title")),
          h("span", { className: "dwsb-desc" }, t("description"))),
        h("svg", { className: "dwsb-chevron" + (open ? " dwsb-chevronOpen" : ""), width: 16, height: 16, viewBox: "0 0 16 16", "aria-hidden": true },
          h("path", { d: "M4 6l4 4 4-4", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" }))),
      open && h("div", { className: "dwsb-body" },
        h("div", { className: "dwsb-field" },
          h("label", { className: "dwsb-label", htmlFor: "dwsb-api-key" }, t("apiKey")),
          h("span", { className: "dwsb-state" }, state.configured ? t("set") : t("unset")),
          h("input", {
            id: "dwsb-api-key", className: "dwsb-input", type: "password", autoComplete: "off", spellCheck: false,
            value: draft, disabled, placeholder: state.configured ? "••••••••" : "",
            onChange: (event) => setDraft(event.target.value),
          }),
          h("p", { className: "dwsb-hint" }, state.writable ? t("hint") : t("readOnly"))),
        h("div", { className: "dwsb-footer" },
          failed && h("p", { className: "dwsb-failed" }, t("failed")),
          state.configured && h("button", {
            type: "button", className: "dwsb-btn dwsb-secondary", disabled,
            onClick: () => run(() => store.remove()),
          }, t("remove")),
          h("button", {
            type: "button", className: "dwsb-btn dwsb-primary", disabled: disabled || draft.trim().length === 0,
            onClick: () => run(() => store.save(draft.trim())),
          }, busy ? t("saving") : t("save")))));
  }

  const name = "dsh-web-search-brave";
  const inject = ["slots", "locale", "remote", "remote.credentials", "settings.plugins"];

  function apply(ctx) {
    installCss();
    ctx.effect(() => ctx.locale.register(LOCALE_NS, { en, zh }), "web-search-brave: dictionaries");
    const t = ctx.locale.bind(LOCALE_NS);
    const store = createKeyStore(ctx.remote.credentials);
    store.read();
    ctx.effect(() => ctx.remote.$on("credentials/reference-updated", (ref) => {
      if (ref === KEY_REF) store.read();
    }), "web-search-brave: credential invalidations");
    // Register as a tab in Settings -> Plugins, so the core settings plugin UI
    // renders this card.  The tab id must be unique across all registered tabs.
    ctx.slots.inject("settings.plugins.tab", () => ctx.slots.register({
      name: "settings.plugins.tab",
      id: "web-search-brave",
      order: 0,
      label: t("title"),
      locale: LOCALE_NS,
    }, () => h(BraveCard, { t, store })));
  }

  exports.apply = apply;
  exports.inject = inject;
  exports.name = name;
  return module.exports;
} });
