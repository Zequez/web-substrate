import { startWatch } from './uplink/watcher'
import { startVite } from './vite-server'
// import openAiServer from './ai/server'
// import framesCodegen from './framesCodegen'

export function start() {
  let uplinkServer = startWatch()
  let viteServer = startVite()
}

// await Bun.$`FORCE_COLOR=1 bun run vite dev --port ${VITE_PORT} `

// let aiServer = openAiServer()

// await framesCodegen()
// watch('./frames', { recursive: true }, async (eventType, fileName) => {
//   if (fileName) {
//     console.log(`📝 Arquivo modificado FRAME: ${fileName}`)
//     await framesCodegen()
//   }
// })
