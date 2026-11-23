# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.4] - 2026-11-22

### Fixed
- The Brave Search settings card never rendered on DSH 0.2.2-rc.5: the client
  entry injected a `settings.plugins` service the host no longer provides, so
  web boot left it pending ("waiting for service: settings.plugins") and the
  API key could only be seen through generic config editors, which show
  credential fields read-only. The unused inject is removed; the card registers
  through the `settings.plugins.tab` slot as before.

## [1.2.3] - 2026-11-22

### Changed
- Updated peer dependencies to DSH 0.2.2-rc.5: `@deepseek-ai/dsh-*` packages
  now `^0.2.2-rc.5` (DSH moved them off the `0.0.1-rc.x` line onto the host
  version), `@deepseek-ai/cordis` `~4.1.0` and `@deepseek-ai/schemastery`
  `~3.19.0`, matching what the rc.5 host packages themselves require. No code
  changes: every imported symbol and the client slot/credentials contract are
  unchanged in rc.5.

## [1.2.2] - 2026-11-11

### Fixed
- The settings card registers as a tab in the `settings.plugins.tab` slot
  (Settings → Plugins), as DSH 0.2.2-rc.1 expects.

## [1.1.0] - 2026-09-04

### Fixed
- Compatibility with dsh 0.1.2-alpha.1+, which deleted the
  `installSettingsSection` and `settingsNamespace` helpers from
  `@deepseek-ai/dsh-settings`. A missing named ESM export is a SyntaxError at
  module evaluation, so every plugin importing either one failed to load and
  the host exited before boot. The plugin now registers its settings section
  through the scoped settings service (`ctx.inject(["settings"], ...)`) and
  validates its namespace itself, mirroring what the removed helpers did.
- `@deepseek-ai/dsh-settings` is no longer imported; it remains an optional
  peer dependency expressing the host versions whose settings service the
  section targets.

## [1.2.1] - 2026-11-11

### Changed
- Merged the `settings-card` feature (UI card for configuring the Brave API key
  directly in the web UI) into the DSH 0.2.2-rc.1 compatible version.  The
  client half (`client/client.js`) exposes a "Brave Search" configuration card
  under Settings → Plugins → Plugin configuration, allowing the API key to be
  stored in the credentials service without container env-var plumbing.
- Updated peer dependencies to DSH 0.2.2-rc.1 conventions (`^0.0.1-rc.1`
  suffix).

## [1.0.0] - 2026-08-20

Initial public release.

### Added
- Concurrency-safe rate limiter: concurrent `web_search` calls are serialized
  through a shared promise chain with a configurable 1500ms gap (default),
  keeping the plugin under Brave's rate limit when the agent fans out
  parallel searches.
- Exponential backoff with jitter on 429/403 responses, honoring `Retry-After`
  (capped at 30s, up to 3 attempts).
- `BRAVE_SEARCH_BASE_URL` env override for proxies and testing.
- Full publishing package: README, AGENTS.md, LICENSE, CHANGELOG, keywords,
  and a complete `package.json` with `peerDependencies` covering every
  imported `@deepseek-ai/*` package.

### Changed
- Adopted a scoped npm name, `@deads-inc/dsh-web-search-brave`.
- Repo layout flattened to standard DSH bundle-plugin convention
  (`index.js` at root).
- USER_AGENT now reflects the public package version.

## [0.1.1] - 2026-08-19

- Rate limiting and backoff under concurrent searches.
- Initial local prototype.
