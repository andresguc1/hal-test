# Arquitectura de la Integración de IA en HalTest

Esta documentación detalla cómo el Asistente de IA (Chatbot "Ask AI") interactúa con el lienzo visual (Canvas) de HalTest para la creación, análisis y manipulación de flujos de automatización.

📌 **1. Visión General**
El propósito de la IA en HalTest es actuar como un **Copiloto de Automatización**. No es un simple chatbot de conversación; tiene la capacidad de leer el estado del lienzo y ejecutar acciones (inyectar nodos, conectar flujos, lanzar navegadores) basándose en las órdenes en lenguaje natural del usuario.

🔄 **2. Flujo de Datos (Data Flow)**
Cuando escribes un mensaje en el panel "Ask AI", la información viaja por la siguiente ruta:

1.  **Frontend (React)**: Envía tu mensaje a la API `/chat`.
2.  **Backend (Controllers)**: Recibe el mensaje y le adjunta el estado actual del lienzo.
3.  **`AIService.js`**: Prepara las reglas para la IA y decide si usa un modelo local o en la nube.
4.  **Ollama / Local LLM**: Procesa la pregunta y devuelve la respuesta junto con instrucciones técnicas (nodos que quiere crear).
5.  **`CanvasTools.js`**: Si la IA ordenó crear algo, el backend ejecuta esa función.
6.  **`Socket.io`**: Envía la señal al Frontend para que pinte los nodos en tu pantalla instantáneamente.

🧠 **3. Mecanismos de Inteligencia y Contexto**
Para que la IA tome decisiones lógicas, el Backend le suministra dos tipos de contextos en tiempo real:

📡 **A. Contexto de Estado (Qué hay en el Lienzo)**
En cada mensaje, el controlador (`chat.controller.js`) lee los nodos y conexiones actuales del Canvas y se los adjunta a la IA en un bloque de texto estructurado (`[CANVAS_CONTEXT]`).
*   **Ejemplo**: "El usuario tiene actualmente un nodo LaunchBrowser y un nodo OpenUrl".
*   **Propósito**: Evita que la IA cree pasos duplicados y le permite "razonar" sobre el flujo existente.

🗂️ **B. Ontología de Nodos (Qué puede hacer)**
El Backend le carga una lista de capacidades (nodos soportados). Esto le define su "vocabulario" de automatización:
*   `launch_browser`: Lanzar navegador.
*   `open_url`: Cargar dirección web.
*   `type_text`: Escribir texto.
*   `click`: Hacer clic.
*   `wait_visible`: Esperar elementos.

🛠️ **4. El Sistema de Fallback para Modelos Locales (Ollama)**
Los modelos locales (como `gemma3`) a menudo no son 100% compatibles con el "Function Calling" nativo. Para que Ollama pueda crear nodos de forma robusta, hemos creado un sistema de **Fallback por Texto**:

🤖 **1. Instrucción de Comando (Prompt)**
Si el proveedor es Ollama, el backend (`AIService.js`) inyecta una regla:
> "Para agregar nodos, debes incluir esta etiqueta en tu respuesta: `<tool_call name='inject_nodes'>{ "nodes": [...] }</tool_call>`"

🔍 **2. El Escáner Interceptor (Regex Parser)**
Antes de responder al usuario, el backend analiza la respuesta de Ollama:
*   Usa una Expresión Regular (**Regex**) para buscar la etiqueta de comando `<tool_call>`.
*   Si la encuentra, extrae el código JSON de sus argumentos.
*   Ejecuta la herramienta seleccionada en el backend.

🧹 **3. Limpieza de Interfaz**
Para evitar que el panel de chat se ensucie con código técnico, el backend remueve la etiqueta `<tool_call>` de la respuesta de texto antes de devolvértela. De este modo, tú solo ves la explicación amigable mientras el canvas se actualiza de forma transparente.
