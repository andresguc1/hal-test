# 🎨 Documentación Visual de Haltest

Haltest transforma la automatización de navegadores en una experiencia visual e interactiva. A diferencia de los frameworks tradicionales donde la lógica está oculta en archivos de código, en Haltest cada acción tiene una representación visual clara, color y estado.

## 🧱 Categorías de Nodos

La caja de herramientas de Haltest está organizada por categorías cromáticas para facilitar la identificación rápida de funciones:

| Categoría | Icono (App) | Color | Descripción | Nodos Principales |
| :--- | :---: | :--- | :--- | :--- |
| **Browser** | 🌐 | Azul | Gestión del ciclo de vida del navegador y pestañas. | Launch, Open URL, Reload |
| **DOM / Code** | 💻 | Cyan | Manipulación directa de elementos e inyección de JS. | Find Element, Execute JS |
| **User Actions** | 🖱️ | Rosa | Simulación de interacciones reales de usuario. | Click, Type, Drag & Drop |
| **Diagnostics** | 📷 | Rose | Captura de evidencias y depuración. | Screenshot, Save DOM |
| **AI Models** | 🧠 | Violeta | Integración con LLMs para pruebas inteligentes. | Call LLM, Validate Semantic |
| **Network** | 🔌 | Esmeralda | Intercepción y control del tráfico de red. | Configure Route, Wait Network |
| **Context** | 🍪 | Naranja | Gestión de sesiones, cookies y estado. | Manage Session, Auth Persist |
| **Files & Data** | 📂 | Amarillo | Operaciones con el sistema de archivos. | Read/Write File, Upload |
| **Logic Engine** | ⚙️ | Púrpura | Control de flujo y estructuras lógicas. | Variables, Conditionals, Loops |

---

## 🔌 Intercepción de Red Visual vs. Código (Playwright)

En Playwright "puro", interceptar una petición requiere escribir bloques de código asíncrono que pueden volverse difíciles de leer:

```javascript
// Playwright puro
await page.route('**/api/users', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ name: 'Hal-9001' }),
  });
});
```

En **Haltest**, este proceso se visualiza mediante los **Nodos Esmeralda (Network Control)**:
- **Configure Route**: Define visualmente qué URL interceptar y qué respuesta devolver.
- **Claridad Inmediata**: Ves exactamente qué rutas están siendo mockeadas en tu canvas sin buscar entre cientos de líneas de código.
- **Estado en Vivo**: Durante la ejecución, verás el nodo iluminarse cuando la petición de red coincida con tu regla.

---

## ✨ Feedback en Tiempo Real

Lo que ves en nuestra landing es exactamente lo que obtienes al instalar Haltest localmente.

### Nodos Iluminados
Durante la ejecución de un flujo:
1. **Pulsación Activa**: El nodo que se está ejecutando actualmente emite un pulso brillante (glow) del color de su categoría.
2. **Camino de Éxito**: Las conexiones (bordes) se animan siguiendo el flujo de los datos.
3. **Validación Visual**: Recibes feedback instantáneo si un nodo falla (borde rojo) o tiene éxito (borde verde/brillante), permitiéndote depurar visualmente sin leer logs extensos.

> [!TIP]
> Instala Haltest localmente para ver estas animaciones en acción con `npx haltest@latest`.
