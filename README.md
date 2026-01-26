# HAL-TEST 🤖

**HAL-TEST** is a modern, visual automation framework for browser orchestration and testing. Built with **React Flow** and **Playwright**, it provides an intuitive drag-and-drop interface for creating complex automation workflows without writing code.

https://github.com/user-attachments/assets/a49ea28d-cf72-44f2-838c-05a96643c69e

<div align="center">
  <video src="./apps/frontend/public/others/haltest_vid_1.mp4" width="100%" autoplay loop muted></video>
</div>

## ✨ Key Features

### Visual Flow Editor
- **Node-Based Automation**: Build complex workflows using an intuitive drag-and-drop interface
- **50+ Specialized Nodes**: Browser management, DOM manipulation, network control, AI integration
- **Smart Connections**: Visual flow logic with animated execution feedback
- **Drag & Drop**: Directly drag nodes from the library onto the canvas

### Modern UX
- **Motion Animations**: Smooth, professional animations powered by Motion 12
- **Enhanced Canvas**: Premium visual design with gradients, shadows, and state badges
- **Category-Specific Icons**: 50+ unique icons for instant node recognition
- **Real-Time Feedback**: Live execution status with visual indicators

### Developer Experience
- **Multilingual Support (i18n)**: Full English/Spanish localization
- **Project Management**: Multi-project/multi-flow organization with SQLite persistence
- **Intelligent Clipboard**: Copy/paste/cut with automatic connection mapping
- **Keyboard Shortcuts**: Complete shortcut system for power users

### Advanced Features
- **Network Orchestration**: Intercept, mock, and modify network requests
- **Screenshot Automation**: Automatic before/after snapshots with IndexedDB storage
- **LLM Integration**: AI-powered test generation and semantic validation
- **Session Management**: Cookie, storage, and token persistence

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React, React Flow, Motion 12, Lucide Icons, TanStack Query
- **Backend**: Node.js, Express, Sequelize (SQLite), Playwright
- **Storage**: SQLite (projects/flows) + IndexedDB (screenshots)
- **Build**: pnpm workspace + Turbo monorepo

### Project Structure
```
hal-test/
├── apps/
│   ├── backend/          # Express API + Playwright runner
│   └── frontend/         # React Flow UI
├── packages/             # Shared utilities (if any)
└── .github/             # GitHub templates & workflows
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** ([Install](https://pnpm.io/installation))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/andresguc1/hal-test.git
   cd hal-test
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Setup environment**
   Copy the root `.env` file and configure it:
   ```bash
   # In the project root
   AUTH_ENABLED=false       # Set to 'false' for quick local access (Guest Mode)
   VITE_AUTH_ENABLED=false  # Must match AUTH_ENABLED
   ```
   > [!TIP]
   > Use **Guest Mode** (`AUTH_ENABLED=false`) to run HAL-TEST locally without needing a Supabase account. 
   > 
   > **Important Details:**
   > - **Production Enforcement**: Guest Mode is **hard-disabled** in production builds (port 2001) for security. You must use a Supabase account in production.
   > - **Logout Content**: In Development with Guest Mode enabled, clicking "Logout" will clear the session but remain in the dashboard, as the system automatically redirects guests to the app. 

4. **Initialize database**
   ```bash
   pnpm --filter backend db:init
   ```

5. **Start development servers**
   ```bash
   pnpm dev
   ```
   - **Frontend**: http://localhost:5173/app/
   - **Backend**: http://localhost:2001

## 📖 Usage

### Creating Your First Flow

1. **Create a Project**: Click the project selector and create a new project
2. **Add Nodes**: Drag nodes from the sidebar or click to add to canvas
3. **Connect Nodes**: Draw connections between nodes to define execution order
4. **Configure**: Click nodes to configure their parameters
5. **Execute**: Click "Run Flow" to execute your automation

### Example Workflows

**Web Scraping**
```
Launch Browser → Open URL → Find Element → Get Content → Save Results
```

**Form Automation**
```
Launch Browser → Open URL → Type Text → Click Submit → Take Screenshot
```

**API Testing with UI**
```
Launch Browser → Intercept Request → Mock Response → Verify UI
```

## 🎨 Recent Enhancements

### Motion Integration (v1.2.0)
- Smooth panel slide-in/out animations
- Animated flow tab transitions
- Interactive button hover effects
- Professional entrance animations

### Canvas Visual Upgrade (v1.3.0)
- Category-specific node icons (50+)
- Gradient backgrounds & 3D shadows
- Visual state badges (executing/success/error)
- Enhanced edge animations
- Dark gradient background
- Glassmorphic controls

### Drag & Drop (v1.3.0)
- Direct drag from node library to canvas
- Precise positioning
- Backward compatible (click still works)

## 🤝 Community & Support
Stay updated and get support from our community:
- **Slack**: [Join HAL-TEST Talk](https://join.slack.com/t/haltest-talk/shared_invite/zt-3o7wqlt53-tzFebjhK5TxQtYZbwK~f~g)
- **GitHub Issues**: For bug reports, feature requests, and technical discussions.

## 🐳 Docker Setup (Recommended)
Running HAL-TEST in Docker is the **recommended way** for production and testing. It ensures that all Playwright dependencies (system libraries) are correctly installed, preventing "Page Crashed" errors common in Linux environments.

### 1. Quick Start with Docker Compose
Ensures your database and screenshots are persisted via volumes.
```bash
# Build the image and start the container in background
docker compose up -d --build
```

### 2. Access the Application
Once the container is healthy:
- **App URL**: [http://localhost:2001/app/](http://localhost:2001/app/)
- **Landing Page**: [http://localhost:2001/](http://localhost:2001/)
- **API Docs**: [http://localhost:2001/api/docs](http://localhost:2001/api/docs)

### 3. Management
- **View Logs**: `docker compose logs -f`
- **Stop**: `docker compose down`
- **Data Location**: SQLite and screenshots are stored in the `hal_test_data` volume.

## 🚀 Production Deployment

### Monolith Build
To prepare a production build (Frontend + Web + Backend):
```bash
pnpm run build:monolith
```
This will compile the frontend and landing page into the `apps/backend/public` folder, allowing the backend to serve the entire application on port 2001.

### Quick Deploy Script
Use the provided script for automatic building and pushing to origin:
```bash
# Recommended for Render or other CI/CD environments
bash deploy_prod.sh "Your commit message"
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 5173 or 2001
lsof -ti:5173 | xargs kill -9
lsof -ti:2001 | xargs kill -9
```

### Database Issues
```bash
# Reset the database
pnpm --filter backend db:reset
pnpm --filter backend db:init
```

## 📄 License
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements
- [React Flow](https://reactflow.dev/) - Visual node editor
- [Playwright](https://playwright.dev/) - Browser automation
- [Motion](https://motion.dev/) - Modern animation library
- [Lucide Icons](https://lucide.dev/) - Beautiful icon set
- [TanStack Query](https://tanstack.com/query) - Data synchronization

## 🌟 Show Your Support
Give a ⭐️ if this project helped you!

## 📧 Contact
**Andrés Gutiérrez** - [@andresguc1](https://github.com/andresguc1)
Join our **Slack Community**: [HAL-TEST Talk](https://join.slack.com/t/haltest-talk/shared_invite/zt-3o7wqlt53-tzFebjhK5TxQtYZbwK~f~g)

Project Link: [https://github.com/andresguc1/hal-test](https://github.com/andresguc1/hal-test)
