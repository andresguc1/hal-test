# HAL-TEST 🤖

HAL-TEST: A visual, node-based automation framework for complex browser orchestration. Built with Playwright and ReactFlow, it allows building automation pipelines via an intuitive drag-and-drop UI. Features real-time execution feedback, snapshots, project persistence with SQLite, and full EN/ES support. Simplify your QA workflow today!

![HAL-TEST Preview](https://github.com/andresguc1/hal-test/raw/main/preview.png)

## 🚀 Key Features

- **Visual Flow Editor**: Build automations with intuitive node-based logic powered by ReactFlow.
- **Real-time Execution**: See node results, logs, and screenshots immediately during execution.
- **Multilingual UI (i18n)**: Fully synchronized English and Spanish support across all components and nodes.
- **Dynamic Node Library**: Specialized nodes for browser management, DOM manipulation, network orchestration, and AI-driven actions (LLM).
- **Intelligent Clipboard**: Full support for Copy, Paste, and Cut operations with automatic connection mapping.
- **Simplified Experience**: Optimized configuration panels that hide technical complexity (backend-driven IDs).
- **Project Persistence**: Robust local storage using SQLite and Sequelize for managing multiple automation projects and flows.

## 🛠️ Architecture

- **Frontend**: React, ReactFlow, Lucide Icons, Vanilla CSS.
- **Backend**: Node.js, Express, Sequelize (SQLite), Playwright.
- **Storage**: Local SQLite database for persistence.

## 📦 Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (Highly recommended)

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/andresguc1/hal-test.git
   cd hal-test
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure Environment**:
   Create a `.env` file in `apps/backend` (copy from `.env.example` if available) with your configuration.

4. **Initialize Database**:
   ```bash
   pnpm --filter backend db:init
   ```

5. **Start Development Servers**:
   ```bash
   pnpm dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:2001`

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get involved.

### Community PRs
To contribute:
1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [ReactFlow](https://reactflow.dev/)
- [Playwright](https://playwright.dev/)
- [Lucide Icons](https://lucide.dev/)
