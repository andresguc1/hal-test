// En hal_test/src/components/styles/nodeStyles.js
import { colors } from "./colors";

// Nodo de Consola de Comandos
export const baseNodeStyle = {
  // 1. Colores y tipografía
  backgroundColor: colors.techGray, // Fondo gris/oscuro
  color: colors.halOrange, // Texto de color naranja de "advertencia" o "interactivo"
  fontFamily: "monospace, Courier New, monospace", // Fuente de consola
  fontWeight: "bold",
  fontSize: 14, // Un poco más grande para mejor lectura

  // 2. Dimensiones
  width: 140, // Ligeramente más ancho
  height: 30, // Un poco más bajo para un look más rectangular

  // 3. Estilo de Botón 3D (Consola)
  borderRadius: 0, // Bordes cuadrados (más de consola)
  border: `2px solid ${colors.metallicSilver}`, // Borde exterior definido
  // Sombra interior (inset) para simular relieve de botón presionado o apagado
  boxShadow: `inset 0 0 10px 1px ${colors.deepSpace}, 0 4px 0 -2px ${colors.metallicSilver}`,

  // 4. Centrado y padding
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: 0,
};
