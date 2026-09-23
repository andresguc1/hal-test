// Astro exposes `import.meta.env.BASE_URL` as configured (`/hal-test`, no trailing
// slash) at build time but normalized (`/hal-test/`) when inlining client assets.
// Normalize so every template builds the same URLs.
export const BASE = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
