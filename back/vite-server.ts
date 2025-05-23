import { VITE_PORT } from './ports'

export async function startVite() {
  return await Bun.$`FORCE_COLOR=1 bun run vite dev --port ${VITE_PORT} `
}
