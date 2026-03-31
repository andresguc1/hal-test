# 🎨 Haltest Visual Documentation

Haltest transforms browser automation into a visual and interactive experience. Unlike traditional frameworks where logic is hidden in code files, in Haltest every action has a clear visual representation, color, and state.

## 🧱 Node Categories

The Haltest toolbox is organized by chromatic categories to facilitate quick identification of functions:

| Category | Icon (App) | Color | Description | Main Nodes |
| :--- | :---: | :--- | :--- | :--- |
| **Browser** | 🌐 | Blue | Browser lifecycle and tab management. | Launch, Open URL, Reload |
| **DOM / Code** | 💻 | Cyan | Direct element manipulation and JS injection. | Find Element, Execute JS |
| **User Actions** | 🖱️ | Pink | Simulation of real user interactions. | Click, Type, Drag & Drop |
| **Diagnostics** | 📷 | Rose | Evidence capture and debugging. | Screenshot, Save DOM |
| **AI Models** | 🧠 | Violet | Integration with LLMs for intelligent testing. | Call LLM, Validate Semantic |
| **Network** | 🔌 | Emerald | Interception and control of network traffic. | Configure Route, Wait Network |
| **Context** | 🍪 | Orange | Session, cookie, and state management. | Manage Session, Auth Persist |
| **Files & Data** | 📂 | Yellow | File system operations. | Read/Write File, Upload |
| **Logic Engine** | ⚙️ | Purple | Flow control and logical structures. | Variables, Conditionals, Loops |

---

## 🔌 Visual Network Interception vs. Code (Playwright)

In "pure" Playwright, intercepting a request requires writing asynchronous blocks of code that can become hard to read:

```javascript
// Pure Playwright
await page.route('**/api/users', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ name: 'Hal-9001' }),
  });
});
```

In **Haltest**, this process is visualized using **Emerald Nodes (Network Control)**:
- **Configure Route**: Visually define which URL to intercept and what response to return.
- **Immediate Clarity**: You see exactly which routes are being mocked on your canvas without searching through hundreds of lines of code.
- **Live State**: During execution, you will see the node light up when the network request matches your rule.

---

## ✨ Real-Time Feedback

What you see in our studio is exactly what you get when installing Haltest locally.

### Glowing Nodes
During flow execution:
1. **Active Pulsation**: The node currently executing emits a bright glow of its category color.
2. **Success Path**: Connections (edges) animate following the data flow.
3. **Visual Validation**: You receive instant feedback if a node fails (red border) or succeeds (green/bright border), allowing you to debug visually without reading extensive logs.

> [!TIP]
> Install Haltest locally to see these animations in action with `npx haltest@latest`.
