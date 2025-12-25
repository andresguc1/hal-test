/**
 * .husky/install.mjs
 * Instalador seguro de Husky: salta en CI/production y captura errores.
 */
if (process.env.NODE_ENV === 'production' || process.env.CI === 'true' || process.env.HUSKY === '0') {
  process.exit(0);
}

try {
  const husky = (await import('husky')).default;
  husky(); // instala hooks (comportamiento normal)
} catch (err) {
  // no romper npm install si algo falla en entornos especiales
  console.warn('husky: la instalación automática no pudo ejecutarse. (posible entorno CI).', err?.message || err);
}
