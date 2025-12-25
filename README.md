# HAL-TEST 🤖

HAL-TEST is a powerful, node-based visual editor for automated testing and browser orchestration. It allows you to build complex automation flows by dragging and dropping nodes, configuring their parameters, and executing them in real-time.

![HAL-TEST Preview](https://github.com/your-username/Hal_Test_v0/raw/main/preview.png)

## 🚀 Key Features

- **Visual Flow Editor**: Build automations with intuitive node-based logic.
- **Real-time Execution**: See node results and snapshots immediately.
- **Internationalization**: Full support for English and Spanish.
- **Dynamic Node Library**: Large selection of nodes for browser management, DOM manipulation, network control, AI interactions (LLM), and more.
- **Copy/Paste Support**: Intelligent node duplication with connection mapping.
- **Project Persistence**: Save and manage multiple flows within local projects.

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
   git clone https://github.com/your-username/Hal_Test_v0.git
   cd Hal_Test_v0
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
