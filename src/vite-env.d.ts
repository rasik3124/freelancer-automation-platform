/// <reference types="vite/client" />

/**
 * Vite environment variable type declarations.
 * All VITE_* variables are injected at build time by Vite and are
 * accessible via `import.meta.env.*` in frontend code.
 *
 * Set these in a `.env` file locally, or in Netlify → Site settings →
 * Environment variables for production.
 */
interface ImportMetaEnv {
  /**
   * Base URL of the backend API.
   * Example: https://your-backend-domain.com
   * Leave empty ("") to use same-origin requests (dev mode).
   */
  readonly VITE_API_URL: string;

  // Vite built-ins (always present)
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
