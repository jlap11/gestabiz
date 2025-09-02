// Utilities for forcing demo mode during tests
type ImportMetaEnvLike = { VITE_DEMO_MODE?: string; [k: string]: unknown }
type ImportMetaLike = { env: ImportMetaEnvLike }
type ImportLike = { meta: ImportMetaLike }

export function setDemoMode() {
  const g = globalThis as Record<string, unknown>
  const currentImport = (g.import as ImportLike | undefined) ?? { meta: { env: {} } }
  currentImport.meta.env.VITE_DEMO_MODE = 'true'
  g.import = currentImport
}
