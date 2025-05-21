import { watch } from 'fs'
import { VITE_PORT } from './ports'
import { start } from './uplink/uplink'
import openAiServer from './ai/server'
import framesCodegen from './framesCodegen'

let uplinkServer = start()
let aiServer = openAiServer()

async function restartUplink() {
  console.log('🔄 Reiniciando o servidor de uplink...')

  // Para o servidor antigo (se necessário)
  if (uplinkServer) {
    uplinkServer.stop()
  }

  // Importa os módulos novamente (limpa o cache)
  delete require.cache[require.resolve('./uplink/uplink')]
  const { start } = await import(`./uplink/uplink`)

  // Inicia um novo servidor
  uplinkServer = start()
}

watch('./uplink', { recursive: true }, (eventType, fileName) => {
  if (fileName) {
    delete require.cache[require.resolve(`./uplink/${fileName}`)]
    console.log(`📝 Arquivo modificado: ${fileName}`)
    restartUplink()
  }
})

// await framesCodegen()
// watch('./frames', { recursive: true }, async (eventType, fileName) => {
//   if (fileName) {
//     console.log(`📝 Arquivo modificado FRAME: ${fileName}`)
//     await framesCodegen()
//   }
// })

await Bun.$`FORCE_COLOR=1 bun run vite dev --port ${VITE_PORT} `
