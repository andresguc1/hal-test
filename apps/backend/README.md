# HalTest Backend

Backend for the HalTest project. This service provides a RESTful API to perform browser automation tasks, likely powered by Playwright. It is designed with a modular architecture where actions are defined declaratively.

## 🚀 Features

The API provides a wide range of browser automation capabilities organized by category:

- **Browser Control**: Launch and close browser instances.
- **Navigation**: Open URLs, go back/forward, manage tabs.
- **Interaction**: Click, type, select options, submit forms, scroll, drag & drop, upload files.
- **Wait Operations**: Wait for elements, visibility, navigation, network idle, or custom conditions.
- **Capture**: Take screenshots, save DOM snapshots.
- **Monitoring**: Log errors, listen to page events.
- **Network**: Intercept requests, mock responses, block resources, modify headers.
- **Session Management**: Manage cookies, local/session storage, inject tokens.
- **Context**: Create and manage isolated browser contexts.
- **AI Integration**: Call LLMs, generate data, semantic validation.
- **Testing & CI**: Run tests, integrate with CI pipelines.

## 🛠️ Installation

1.  Clone the repository.
2.  Install dependencies:

    ```bash
    npm install
    ```

## 🚦 Usage

```bash
npm run dev
```

### Stop Service

Clear the backend port (2001):

```bash
npm run stop
```

### Production

Start the server:

```bash
npm start
```

### Testing

Run tests using Vitest:

```bash
npm test
```

### Linting & Formatting

-   Lint code: `npm run lint`
-   Fix linting issues: `npm run lint:fix`
-   Format code: `npm run format`

## 🔌 API Endpoints

### System Endpoints

-   `GET /status`: Check API health and status.
-   `GET /routes`: List all available action routes and their categories.

### Action Endpoints

All automation actions are exposed via POST requests under `/actions/:action_name`.

**Example:**

```http
POST /actions/open_url
Content-Type: application/json

{
  "url": "https://example.com"
}
```

To see the full list of available actions and their required schemas, consult the `/routes` endpoint or check `routes/api.router.js`.

## 📂 Project Structure

-   `app.js`: Entry point of the application.
-   `routes/`: API route definitions.
-   `controllers/`: Logic for handling requests.
-   `schemas/`: Joi validation schemas for request bodies.
-   `middlewares/`: Express middlewares (validation, etc.).
-   `tests/`: Test files.

## 👤 Author

andresguc <https://andresguc.super.site/>

## 📄 License

MIT