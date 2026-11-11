# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
