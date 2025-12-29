# HAL-TEST Frontend 🎨

Modern **React** application for visual browser automation with an intuitive node-based editor.

## 🏗️ Tech Stack

- **React 18** - UI framework
- **React Flow** - Visual node editor
- **Motion 12** (motion.dev) - Modern animations
- **TanStack Query** - Server state management
- **Lucide React** - Icon library
- **Vite** - Build tool & dev server
- **i18next** - Internationalization (EN/ES)

## ✨ Key Features

### Visual Flow Editor
- Drag-and-drop node creation
- Real-time execution feedback
- Multiple project/flow management
- Undo/redo with history
- Copy/paste/cut operations

### Enhanced UX
- **Motion Animations**: Smooth panel transitions and micro-interactions
- **Premium Canvas**: Gradients, shadows, state badges
- **50+ Node Icons**: Category-specific icons for instant recognition
- **Dark Theme**: Professional glassmorphic design

### Advanced Features
- Automatic screenshot capture (IndexedDB)
- Context menus (node, edge, canvas, selection)
- Keyboard shortcuts
- Export/import flows
- Multi-language support

## 📁 Project Structure

```
src/
├── components/
│   ├── nodes/
│   │   ├── CustomNode.jsx       # Enhanced node component
│   │   ├── nodeIcons.js          # 50+ icon mappings
│   │   └── CustomNode.css
│   ├── styles/
│   │   ├── App.css
│   │   ├── reactflow-theme.css   # Custom React Flow styling
│   │   └── motion-variants.js    # Reusable animations
│   ├── AppHeader.jsx
│   ├── NodeCreationPanel.jsx    # Draggable node library
│   ├── NodeConfigurationPanel.jsx
│   ├── FlowTabs.jsx              # Project/flow management
│   └── ...
├── hooks/
│   ├── useFlowManager.js         # Main flow logic
│   ├── useProjectManager.js      # Project persistence
│   ├── useKeyboardShortcuts.js
│   └── ...
├── utils/
│   ├── ScreenshotManager.js      # IndexedDB screenshots
│   ├── ProjectManager.js
│   └── ...
└── App.jsx                       # Main app component
```

## 🚀 Development

### Prerequisites
- Node.js 18+
- pnpm

### Commands

```bash
# Install dependencies
pnpm install

# Start dev server (http://localhost:5173)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint
pnpm lint
```

### Environment Variables

Create `.env` file (optional):
```bash
VITE_API_BASE=http://localhost:2001/api
```

## 🎨 Styling Philosophy

- **Vanilla CSS** - Maximum control & performance
- **CSS Variables** - Consistent theming
- **No Tailwind** - Custom, maintainable styles
- **Motion 12** - Modern, performant animations

## 🔧 Key Components

### useFlowManager
Main hook for flow state management:
- Node CRUD operations
- Edge connections
- Execution logic
- Undo/redo
- Clipboard operations

### CustomNode
Enhanced node component with:
- Category-specific icons
- Gradient backgrounds
- State badges (executing/success/error)
- 3D shadow effects

### Motion Integration
Standardized animations in `motion-variants.js`:
- Panel transitions (left/right)
- Tab animations
- Item staggering

## 📦 Dependencies

### Core
- `react` & `react-dom`
- `@xyflow/react` - Flow editor
- `motion` - Animations

### State & Data
- `@tanstack/react-query` - Server state
- `react-i18next` - i18n

### UI & Icons
- `lucide-react` - Icons
- `@dnd-kit/*` - Drag & drop utilities

### Utilities
- `uuid` - ID generation
- `idb` - IndexedDB wrapper

## 🌍 Internationalization

Translations in `public/locales/{en,es}/`:
- `common.json` - UI strings
- `nodes.json` - Node labels/descriptions

Add/update translations using:
```bash
pnpm translate
```

## 🐛 Debugging

### React DevTools
Install [React Developer Tools](https://react.dev/learn/react-developer-tools)

### Console Logging
The app uses a custom logger (`utils/logger.js`):
```javascript
logger.debug('message', data, 'ComponentName');
logger.error('error', error, 'ComponentName');
```

### IndexedDB Inspection
Screenshots stored in IndexedDB:
- Open DevTools → Application → IndexedDB → `hal-test-screenshots`

## 🔑 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save flow |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + C` | Copy selected |
| `Ctrl/Cmd + V` | Paste |
| `Ctrl/Cmd + X` | Cut |
| `Del/Backspace` | Delete selected |
| `Ctrl/Cmd + A` | Select all |
| `Ctrl/Cmd + D` | Duplicate |

## 🎯 Best Practices

### Performance
- All nodes are memoized
- React Flow optimization enabled
- Debounced auto-save
- Efficient state updates

### Code Quality
- Functional components with hooks
- Single responsibility principle
- Consistent naming conventions
- Comprehensive error handling

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus management

## 📝 Contributing

See main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

### Frontend-Specific
1. Follow existing component structure
2. Use functional components + hooks
3. Add i18n keys for all user-facing strings
4. Test with keyboard navigation
5. Ensure responsive design

## 🔗 Related

- **Backend**: `../backend/README.md`
- **API Docs**: `../backend/API_DOCUMENTATION_GUIDE.md`
- **Main README**: `../../README.md`
