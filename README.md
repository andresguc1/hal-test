<div align="center">
  <img src="apps/web/public/images/haltest_logo.jpeg" alt="HAL-TEST Logo" width="200" style="border-radius: 20px; margin-bottom: 20px;">

  # HAL-TEST 🤖
  ### The Missing Link in Browser Automation

  [![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Playwright](https://img.shields.io/badge/Powered%20by-Playwright-green)](https://playwright.dev/)
  [![React Flow](https://img.shields.io/badge/UI-React%20Flow-orange)](https://reactflow.dev/)
  [![Slack](https://img.shields.io/badge/Community-Slack-purple)](https://join.slack.com/t/haltest-talk/shared_invite/zt-3o7wqlt53-tzFebjhK5TxQtYZbwK~f~g)

  **HAL-TEST** is a modern, visual automation framework that bridges the gap between manual QA and technical automation. Built on top of **Playwright**, it provides a high-performance, node-based interface to build, manage, and scale complex browser workflows without writing a single line of boilerplate code.
</div>

---

## 📺 See it in Action

<div align="center">
  <img src="apps/web/public/video/base1.gif" width="100%" alt="HAL-TEST Demo">
  <p><em>Visual node-based logic with real-time execution feedback.</em></p>
</div>

## 🚀 Why HAL-TEST?

Most automation frameworks suffer from **"Framework Fatigue"**: complex YAMLs, brittle selectors, and high barriers to entry. HAL-TEST changes the game:

* **Low Code, Pro Power**: Use the full strength of Playwright through a visual canvas.
* **Zero Vendor Lock-in**: Export your flows or run them via the **HAL-TEST CLI**.
* **Self-Healing Ready**: Designed to handle dynamic modern web apps with intelligent node logic.
* **Built for Teams**: Allow manual QAs to build tests that Seniors can audit and scale.

## ✨ Key Features

### 🧠 Visual Flow Editor
* **Node-Based Logic**: 50+ specialized nodes for DOM manipulation, network interception, and AI.
* **Smart Connections**: Animated execution feedback—watch your test run in real-time.
* **Category-Specific UI**: Glassmorphic design with 50+ unique icons for instant recognition.

### 🛠️ Developer-First DX
* **Powerful CLI**: Integrated terminal tool for CI/CD pipelines (GitHub Actions, Jenkins).
* **Network Orchestration**: Mock, intercept, and modify XHR/Fetch requests visually.
* **Session Management**: Persist cookies, local storage, and auth tokens between runs.
* **LLM Integration**: Semantic validation and AI-powered node generation.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 18, React Flow, Motion 12, TanStack Query.
- **Backend**: Node.js, Express, Playwright.
- **Database**: SQLite (local persistence) + IndexedDB (client-side screenshots).
- **Monorepo**: Turbo + pnpm workspaces.

---

## ⚡ Quick Start (Development)

### Prerequisites
- **Node.js** 18+ and **pnpm**

### 1. Setup
```bash
git clone [https://github.com/andresguc1/hal-test.git](https://github.com/andresguc1/hal-test.git)
cd hal-test
pnpm install
2. Configure Guest Mode
For quick local testing without Supabase:

Bash
# Set in your .env
AUTH_ENABLED=false
VITE_AUTH_ENABLED=false
3. Run
Bash
pnpm --filter backend db:init
pnpm run dev
App: http://localhost:5173/app/

Server: http://localhost:2001

💻 Terminal CLI
Automate the automation. Install the HAL-TEST CLI to run flows in headless mode:

Bash
cd apps/cli && npm install -g .

# Run a flow by ID
haltest run <flow_id> --headed
🐳 Docker Deployment (Recommended)
To avoid missing system dependencies for Playwright, use Docker:

Bash
docker compose up -d --build
See `DOCKER.md` for detailed production setup.

## ⚡ Developer Workflow

To make contributing easier, we provide unified commands in the root `package.json`:

### Update your Local Repo
Pull the latest changes from GitHub, install all dependencies, and rebuild the frontend monolith in one step:
```bash
pnpm run update:app
```

### Publish a New CLI Release
*(Maintainers only)*. This command bumps the patch version, runs the standalone build for the CLI, and publishes it to NPM:
```bash
pnpm run release
```

---

## 🤝 Community & Support
Join our Slack: [HAL-TEST Talk](https://join.slack.com/t/haltest-talk/shared_invite/zt-3o7wqlt53-tzFebjhK5TxQtYZbwK~f~g)

**Star the Repo**: If this project helps you, give us a ⭐!

## 📄 License
MIT License - Created by Andresguc1