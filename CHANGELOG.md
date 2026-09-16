# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.71] - 2026-09-12

### Added

- Release metadata generation with version, commit, build ID, timestamp
- `/api/status` endpoint now returns full release metadata (version, git commit, build ID)
- CLI `--version` and `--info` flags show release metadata
- Clean-room npm package testing in CI
- GitHub Actions workflows enforce `--frozen-lockfile`
- Lint and format checks are now blocking in CI
- Docker Playwright base image updated to v1.62.1
- GitHub Release workflow with version bump, tag, changelog

### Changed

- CI/CD pipeline now validates lockfile integrity
- Render build uses `--frozen-lockfile` for reproducible builds
- Frontend lint errors fixed (unused catch variables)

### Fixed

- Backend version no longer hardcoded; now derived from release metadata
- SQLite3 native module rebuild in clean-room test

## [1.0.70] - 2026-09-10

### Added

- Initial release tracking

## [1.0.71] - 2026-09-16

### Changed
  - Release 1.0.71
