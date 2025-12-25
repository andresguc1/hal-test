import os
import re

constants_path = "/home/andres/Documents/Projects/Hal_Test_v0/apps/frontend/src/components/hooks/constants.js"

with open(constants_path, 'r') as f:
    content = f.read()

# Dictionary of common Spanish to English translations for this app
translations = {
    "Tipo de navegador": "Browser Type",
    "Modo headless (sin interfaz)": "Headless mode (no UI)",
    "Iniciar en modo maximizado": "Start maximized",
    "Ralentizar acciones (ms)": "Slow down actions (ms)",
    "Tipo de Contenido": "Content Type",
    "Texto (textContent)": "Text (textContent)",
    "HTML (innerHTML)": "HTML (innerHTML)",
    "Atributo HTML": "HTML Attribute",
    "Especifica qué tipo de contenido obtener o establecer": "Specifies what type of content to get or set",
    "Nombre del Atributo": "Attribute Name",
    "Ej: src, href, data-id, value, etc.": "Ex: src, href, data-id, value, etc.",
    "Contenido a Establecer": "Content to Set",
    "Contenido que se establecerá. Puede ser cadena vacía para limpiar.": "Content to be set. Can be empty string to clear.",
    "Limpiar antes de establecer": "Clear before setting",
    "Si está activo, limpia el contenido existente antes de establecer el nuevo valor": "If active, clears existing content before setting new value",
    "Código JavaScript": "JavaScript Code",
    "El script debe ser una función anónima. Ej: () => { /* tu código */ }": "The script must be an anonymous function. Ex: () => { /* your code */ }",
    "Argumentos (JSON)": "Arguments (JSON)",
    "Opcional. Argumentos que se pasarán a la función JavaScript.": "Optional. Arguments that will be passed to the JavaScript function.",
    "Guardar Resultado en Variable": "Save Result to Variable",
    "Si está activo, el resultado del script se guardará en una variable.": "If active, the script result will be saved to a variable.",
    "Nombre de la Variable": "Variable Name",
    "urlPattern es obligatorio": "urlPattern is required",
    "Método HTTP": "HTTP Method",
    "Cabeceras (JSON)": "Headers (JSON)",
    "Ej: { \"Content-Type\": \"application/json\" }": "Ex: { \"Content-Type\": \"application/json\" }",
    "Cuerpo (Body)": "Body",
    "Cuerpo de la respuesta...": "Response body...",
    "Estado (Status)": "Status",
    "Ej: 200": "Ex: 200",
    "Tipo de Recurso": "Resource Type",
    "Documento": "Document",
    "Estilo (CSS)": "Stylesheet (CSS)",
    "Imagen": "Image",
    "Fuente": "Font",
    "Cabeceras (JSON)": "Headers (JSON)",
    "Operación": "Operation",
    "Obtener": "Get",
    "Establecer": "Set",
    "Eliminar": "Delete",
    "Limpiar": "Clear",
    "Datos de Cookies (JSON)": "Cookies Data (JSON)",
    "Especifica los datos de las cookies a manejar": "Specifies the cookies data to handle",
    "Clave (Key)": "Key",
    "Valor (Value)": "Value",
    "Persistir a Archivo": "Persist to File",
    "Cargar desde Archivo": "Load from File",
    "Ruta de Persistencia": "Persistence Path",
    "Ruta donde se guardará/cargará la sesión": "Path where the session will be saved/loaded",
    "Browser ID es obligatorio": "Browser ID is required",
    "Acción": "Action",
    "Configurar": "Configure",
    "Manejar": "Manage",
    "Inyectar": "Inject",
    "Persistir": "Persist",
    "Crear Contexto": "Create Context",
    "Limpiar Estado": "Cleanup State",
    "Manejar Hooks": "Handle Hooks",
    "Control de Excepciones": "Handle Exceptions",
    "Leer Datos": "Read Data",
    "Guardar Resultados": "Save Results",
    "Manejar Descargas": "Handle Downloads",
    "Llamada LLM": "LLM Call",
    "Generar Datos (IA)": "Generate Data (AI)",
    "Validación Semántica": "Semantic Validation",
    "Ejecutar Tests": "Run Tests",
    "Parámetros CLI": "CLI Params",
    "Código de Retorno": "Return Code",
    "Integración CI/CD": "CI/CD Integration",
    "Iniciar en modo maximizado": "Start maximized",
}

for es_text, en_text in translations.items():
    content = content.replace(f'"{es_text}"', f'"{en_text}"')
    content = content.replace(f"'{es_text}'", f"'{en_text}'")

with open(constants_path, 'w') as f:
    f.write(content)

print("✅ Translated remaining Spanish strings in constants.js to English")
