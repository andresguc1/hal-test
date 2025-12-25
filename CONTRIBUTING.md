# Contributing to HAL-TEST 🤝

First off, thank you for considering contributing to HAL-TEST! It's people like you that make HAL-TEST such a great tool.

## How Can I Contribute?

### Reporting Bugs
- Use the [GitHub Issue Tracker](https://github.com/andresguc1/hal-test/issues).
- Describe the bug in detail, including steps to reproduce.
- Mention your environment (OS, Browser, Node version).

### Suggesting Enhancements
- Open an issue with the title "[Feature Request] ...".
- Explain why the enhancement would be useful and how it should work.

### Pull Requests
1. **Fork the repository** and create your branch from `main`.
2. **Setup the environment**: Run `pnpm install` and ensure tests pass.
3. **Coding Standards**:
   - Use clean, modular code.
   - Follow the existing project structure.
   - Ensure new nodes follow the configuration pattern in `constants.js`.
4. **Documentation**: Update the README if you added a major feature.
5. **PR Description**: Use the provided template to describe your changes.

## Development Workflow

- **Backend**: Logic resides in `apps/backend`. Nodes are handled in `apps/backend/src/nodes`.
- **Frontend**: The UI is built in `apps/frontend`. Node configurations are in `apps/frontend/src/components/hooks/constants.js`.
- **Translations**: If you add new UI strings, update both `en.json` and `es.json` in `apps/frontend/src/locales`.

## Code of Conduct
Please be respectful and professional in all interactions.

Thank you! 🚀
