# Hal Test Flow Manager

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg)](https://vitejs.dev/)

A powerful React-based application for creating, managing, and executing automated flow sequences. Designed to integrate seamlessly with the **HalTest Backend**, which provides browser automation through Playwright.

---

## ⚡ Quick Start

1. Clone both repositories (frontend + backend)
2. Start the backend: `cd hal-test_Backend && npm start`
3. Start the frontend: `cd hal_test && npm run dev`
4. Open http://localhost:5173

---

## 📦 Related Repositories

### 🔗 HalTest Backend

This frontend works together with the HalTest Backend, available here:

➡️ **Repository:** https://github.com/andresguc1/hal-test_Backend

The backend exposes RESTful endpoints for browser automation, action execution, session handling, Playwright control, and more. Make sure you have it running for full functionality.

---

## 🚀 Features

### 🎨 **Visual Flow Builder**

- Interactive drag-and-drop interface powered by React Flow
- Easily create complex automation flows
- Real-time editing of nodes, edges, and parameters

### 🧩 **Node & Action Management**

- Node types automatically aligned with backend actions (retrieved from `/routes`)
- Dynamic configuration panels based on backend **Joi schemas**
- Parameter validation before triggering an execution

### 🖥️ **Flow Execution Engine**

- Execute entire flows by sending sequential REST calls to the backend:
  - Each node corresponds to: `/actions/:actionName`
  - Node parameters are sent in the request body
- Real-time progress tracking for each action
- Error handling, logging, and execution reports

### 📁 **Advanced Import / Export System**

#### 🔄 Three Import Modes

1. **📄 File Import**
   - Import individual test files
   - Automatic framework detection
   - Supports 12+ testing frameworks
   - Real-time conversion to Hal_Test flows

2. **📁 Directory Import**
   - Recursive directory scanning
   - Batch import multiple test files
   - Automatic organization in canvas
   - Smart filtering (ignores node_modules, .git, etc.)

3. **📁+ Directory + POM**
   - All directory import features
   - Page Object Model resolution
   - Project indexing for class/function references
   - Ideal for enterprise projects

#### 🎯 Supported Frameworks

- **Playwright** (.js, .ts)
- **Cypress** (.cy.js, .cy.ts)
- **Selenium** (JavaScript, Python, Java, C#)
- **TestCafe** (.js, .ts)
- **Puppeteer** (.js, .ts)
- **WebdriverIO** (.js, .ts)
- **Nightwatch** (.js, .ts)
- **Katalon** (.groovy)
- **TestRigor** (.txt)

#### 📤 Export Features

- Export flows to JSON for reuse or sharing
- Include metadata and execution stats
- Version control friendly format

**📚 Learn More:**

- [Import System Documentation](./IMPORT_SYSTEM.md)
- [Code Examples](./IMPORT_EXAMPLES.md)
- [Changes Summary](./CHANGES_SUMMARY.md)

### 🗺️ **Navigation & Tools**

- Built-in minimap for large flows
- Collapsible side panels for a clean workspace
- Figma-like navigation and zoom controls
- Optional dark mode (if added later)

### 🔌 **Full Integration With HalTest Backend**

Supports all backend features, including:

- Browser launch & control
- Navigation
- DOM interactions
- Wait conditions
- Screenshots & DOM captures
- Session & context management
- Network mocking & interception
- AI-based actions
- CI-oriented test flows

---

## 🛠️ Tech Stack

- **React 18**
- **Vite**
- **React Flow**
- **Axios / Fetch** (for backend communication)
- **CSS Modules**
- **React Icons**
- **Vitest**

---

## 📋 Prerequisites

- Node.js >= 18.x
- npm or yarn
- [HalTest Backend](https://github.com/andresguc1/hal-test_Backend) running

---

## 📦 Installation

```bash
git clone <repository-url>
cd hal_test
npm install
```

---

## 🏃‍♂️ Usage

### Development

```bash
npm run dev
```

Open: http://localhost:5173

### Production Build

```bash
npm run build
npm run preview
```

---

## 🔌 Backend Configuration

1. Ensure the HalTest Backend is running (default: `http://localhost:3000`)

2. Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:3000
```

3. The app will automatically connect to the backend on startup.

### Testing the Connection

The app will display a connection status indicator in the top bar.

### API Client Configuration

Use it in your API client:

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
```

---

## 🧠 How Flow Execution Works

Each flow node represents an automation action:

```json
{
  "id": "1",
  "type": "actionNode",
  "data": {
    "action": "open_url",
    "params": { "url": "https://example.com" }
  }
}
```

The frontend sends:

```http
POST {API_URL}/actions/open_url
Content-Type: application/json

{
  "url": "https://example.com"
}
```

The backend executes it using Playwright and returns:

```json
{
  "success": true,
  "result": "Page loaded"
}
```

By connecting nodes, you can visually build complete browser automation pipelines.

---

## 📝 Example Flow

Here's a simple flow that navigates to a website and takes a screenshot:

```json
{
  "nodes": [
    {
      "id": "1",
      "type": "actionNode",
      "data": {
        "action": "launch_browser",
        "params": { "headless": false }
      }
    },
    {
      "id": "2",
      "type": "actionNode",
      "data": {
        "action": "open_url",
        "params": { "url": "https://example.com" }
      }
    },
    {
      "id": "3",
      "type": "actionNode",
      "data": {
        "action": "capture_screenshot",
        "params": { "path": "./screenshot.png" }
      }
    }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2" },
    { "id": "e2-3", "source": "2", "target": "3" }
  ]
}
```

---

## 📜 Available Scripts

- `npm run dev` – Start development server
- `npm run build` – Build for production
- `npm run preview` – Preview production build
- `npm run lint` – Run ESLint
- `npm run format` – Format code
- `npm test` – Run tests

---

## 🐛 Troubleshooting

### Backend Connection Issues

- Verify the backend is running: `curl http://localhost:3000/health`
- Check CORS settings in the backend
- Ensure `VITE_API_URL` matches your backend URL

### Flow Execution Errors

- Check browser console for detailed error messages
- Verify node parameters match backend schema
- Ensure Playwright is properly installed in the backend

### Build Issues

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 🗺️ Roadmap

- [ ] Dark mode support
- [ ] Flow templates library
- [ ] Collaborative editing
- [ ] Real-time execution monitoring
- [ ] Flow versioning
- [ ] AI-assisted flow generation

---

## 🤝 Contributing

Contributions are welcome! You can help improve:

- Node/action components
- Flow editor UX/UI
- Execution engine
- Documentation

### How to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 👤 Author

- [andresguc.super.site](https://andresguc.super.site/)

---

## 🙏 Acknowledgments

- [React Flow](https://reactflow.dev/) for the amazing flow builder library
- [Playwright](https://playwright.dev/) for browser automation capabilities
- The open-source community

---

## 📄 License

MIT
