# Guía de Pruebas: Integración de IA en HalTest

Sigue estos pasos para validar las 4 mejoras implementadas en la rama unificada `feature/ai-integration-unified`.

---

## 🛠️ Prerrequisitos
Asegúrate de estar en la rama correcta y de tener los servidores corriendo:

1.  **Estar en la rama unificada**:
    ```bash
    git checkout feature/ai-integration-unified
    ```
2.  **Iniciar Backend**:
    ```bash
    cd apps/backend
    npm run dev  # O el comando que uses para levantarlo
    ```
3.  **Iniciar Frontend**:
    ```bash
    cd apps/frontend
    npm run dev
    ```
4.  **Iniciar Ollama** (Asegúrate de tener un modelo cargado, ej. `gemma3` o `llama3`).

---

## 🧪 Casos de Prueba

### 📌 Prueba 1: Flujo de Confirmación (Human-in-the-loop)
**Objetivo**: Verificar que los nodos propuestos por la IA no se inyectan solos; requieren tu aprobación.

1.  Abre HalTest en tu navegador.
2.  Abre el panel **Ask AI**.
3.  Escribe: *"Crea un flujo de 2 pasos para abrir google.com y hacer clic en un botón."*
4.  **Resultado Esperado**:
    *   El asistente responderá con la explicación.
    *   **En la parte inferior de Ask AI**, en lugar de la barra para escribir, aparecerá un panel de color azul/índigo que dice: *"AI ha propuesto N nodo(s) para tu flujo"*.
    *   Verifica que los botones **[Aplicar Cambios]** y **[Rechazar]** estén visibles.
    *   Haz clic en **[Aplicar Cambios]** y verifica que los nodos se pinten en el Canvas.

---

### 📌 Prueba 2: Validación de Ontología (Lista Blanca)
**Objetivo**: Verificar que la IA no introduzca nodos con tipos inventados o erróneos.

1.  En el panel **Ask AI**, escribe: *"Crea un nodo de tipo hack_nasa"* o *"Crea un nodo de tipo download_internet"*.
2.  **Resultado Esperado**:
    *   El backend detectará el tipo inválido y arrojará un error.
    *   Verás una respuesta de error o una explicación de la IA indicando que ese nodo no está soportado (Ej: *"Unsupported node type: hack_nasa. Allowed: launch_browser, open_url..."*).

---

### 📌 Prueba 3: Minificación de Contexto (Token Efficiency)
**Objetivo**: Confirmar que no sobrecargamos la IA con datos pesados del canvas.

1.  Con nodos en el lienzo, envía cualquier mensaje a **Ask AI**.
2.  Observa los logs de la consola de tu **Backend**:
3.  Busca el log de `[CANVAS_CONTEXT]` o el payload enviado a la IA.
4.  **Resultado Esperado**:
    *   El JSON que contiene `nodes` dentro de `[CANVAS_CONTEXT]` **no tendrá** coordenadas `x, y`, estilos ni estados internos.
    *   Solo tendrá `id`, `type`, `label` y `data` específicos como `url` o `selector`.

---

### 📌 Prueba 4: Prueba Automatizada de Fallback (Ollama Repair)
**Objetivo**: Forzar un error JSON y ver el Bucle de Auto-Corrección.

He dejado un script de prueba que puedes ejecutar por consola para simular la respuesta de Ollama con un JSON roto.

1.  Ejecuta:
    ```bash
    node /tmp/test_fallback.js
    ```
    *(Puedes crear este script con el bloque de código abajo si no existe).*

---

### 📝 Resumen
Cualquier error durante las pruebas sobre estas ramas independientes debe verse reportado en la consola del Backend o Frontend. Si todo responde como se describe, ¡las mejoras están 100% validadas!
